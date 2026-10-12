// test/react/pwa-register.test.mjs — `<PwaRegister/>` 真实渲染行为
//
// 为什么不再用「导出存在 / 源码含字符串」的弱断言：那类断言证明不了组件行为。
// 本文件用**真实 React 19 + react-dom/client + jsdom** 渲染，覆盖：
//   ① 无更新 → 渲染 null；② 有更新 → 渲染按钮 + label + className；
//   ③ renderUpdate 分支（自绘节点 + applyUpdate 接线）；④ 生产态 effect 调用 registerSW。
//
// 依赖注入：`registerSW`（`../web/register.mjs`）与 `usePwaUpdate`（`./use-update.mjs`）
// 经 `registerHooks` 换成 `test/fixtures/*-mock.mjs` 可控替身——真实 React 渲染不变，
// 只把「注册调用」与「更新态」变成可断言的输入（真实 SW 环境无法在单测里构造）。
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { JSDOM } from 'jsdom'

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? ''
    // 只替换 `<PwaRegister/>` 自身模块的依赖，避免影响其他导入方。
    if (!parent.endsWith('/src/react/pwa-register.mjs')) return nextResolve(specifier, context)
    if (specifier === '../web/register.mjs') {
      return { url: new URL('../fixtures/register-mock.mjs', import.meta.url).href, shortCircuit: true }
    }
    if (specifier === './use-update.mjs') {
      return { url: new URL('../fixtures/use-update-mock.mjs', import.meta.url).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

// react-dom/client 需要 DOM；effect 只有在真实 DOM 渲染后才会执行。
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.com/' })
const { window } = dom
globalThis.window = window
globalThis.document = window.document
globalThis.HTMLElement = window.HTMLElement
globalThis.Node = window.Node
globalThis.Element = window.Element
globalThis.Event = window.Event
globalThis.MouseEvent = window.MouseEvent
globalThis.MutationObserver = window.MutationObserver
globalThis.getComputedStyle = window.getComputedStyle
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const React = await import('react')
const { createRoot } = await import('react-dom/client')
const { PwaRegister } = await import('../../src/react/pwa-register.mjs')
const { registerCalls } = await import('../fixtures/register-mock.mjs')
const { updateState } = await import('../fixtures/use-update-mock.mjs')

/** 真实 DOM 挂载 `<PwaRegister/>`，返回容器与卸载函数。 */
function mount(props = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  React.act(() => root.render(React.createElement(PwaRegister, props)))
  return {
    container,
    unmount() {
      React.act(() => root.unmount())
      container.remove()
    },
  }
}

const click = (el) => React.act(() => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })))

beforeEach(() => {
  registerCalls.length = 0
  updateState.updateAvailable = false
  updateState.applyUpdate = () => {}
})

test('无更新 → 渲染 null（不炸 hydration 的首帧语义）', () => {
  updateState.updateAvailable = false
  const { container, unmount } = mount()
  assert.equal(container.innerHTML, '', 'updateAvailable=false 时不应渲染任何节点')
  unmount()
})

test('有更新 → 渲染按钮，带 label / className / type', () => {
  updateState.updateAvailable = true
  const { container, unmount } = mount({ label: '有新版本，点此刷新', className: 'pwa-update' })
  const btn = container.querySelector('button')
  assert.ok(btn, 'updateAvailable=true 时应渲染 button')
  assert.equal(btn.textContent, '有新版本，点此刷新', 'label 未生效')
  assert.equal(btn.className, 'pwa-update', 'className 未生效')
  assert.equal(btn.type, 'button')
  unmount()
})

test('有更新 → 默认按钮 label 缺省为「有新版本，点此刷新」', () => {
  updateState.updateAvailable = true
  const { container, unmount } = mount()
  assert.equal(container.querySelector('button').textContent, '有新版本，点此刷新')
  unmount()
})

test('有更新 → 点击默认按钮触发 applyUpdate', () => {
  updateState.updateAvailable = true
  let applied = 0
  updateState.applyUpdate = () => {
    applied += 1
  }
  const { container, unmount } = mount()
  click(container.querySelector('button'))
  assert.equal(applied, 1, 'onClick 未接到 applyUpdate')
  unmount()
})

test('renderUpdate → 渲染自绘节点、不渲染默认按钮、applyUpdate 已接线', () => {
  updateState.updateAvailable = true
  let applied = 0
  updateState.applyUpdate = () => {
    applied += 1
  }
  const { container, unmount } = mount({
    renderUpdate: ({ applyUpdate }) =>
      React.createElement('div', { 'data-custom': '1', onClick: applyUpdate }, '自绘更新条'),
  })
  const custom = container.querySelector('[data-custom="1"]')
  assert.ok(custom, 'renderUpdate 未被调用')
  assert.equal(custom.textContent, '自绘更新条')
  assert.equal(container.querySelector('button'), null, 'renderUpdate 分支不应渲染默认按钮')
  click(custom)
  assert.equal(applied, 1, 'renderUpdate 拿到的 applyUpdate 未接线')
  unmount()
})

test('生产态（NODE_ENV=production）→ effect 调用 registerSW(swUrl)', () => {
  const prev = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    const { unmount } = mount({ swUrl: '/sw.js' })
    assert.equal(registerCalls.length, 1, '生产态应恰好注册一次')
    assert.equal(registerCalls[0].swUrl, '/sw.js')
    assert.equal(registerCalls[0].options, undefined, '非 dev 不应传 options')
    unmount()
  } finally {
    process.env.NODE_ENV = prev
  }
})

test('非生产且非 dev → 不调用 registerSW', () => {
  const prev = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'
  try {
    const { unmount } = mount()
    assert.equal(registerCalls.length, 0, '开发态不应注册 SW')
    unmount()
  } finally {
    process.env.NODE_ENV = prev
  }
})

test('dev=true → 强制注册并传 { dev: true }', () => {
  const prev = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'
  try {
    const { unmount } = mount({ dev: true })
    assert.equal(registerCalls.length, 1)
    assert.deepEqual(registerCalls[0].options, { dev: true })
    unmount()
  } finally {
    process.env.NODE_ENV = prev
  }
})

test('process.env 缺失（浏览器打包器未替换）→ 不抛「process is not defined」', () => {
  const prev = process.env
  // 模拟非静态替换的打包环境：全局无 process。
  delete globalThis.process
  try {
    const { container, unmount } = mount()
    assert.equal(container.innerHTML, '')
    assert.equal(registerCalls.length, 0)
    unmount()
  } finally {
    globalThis.process = prev
  }
})

// —— 补充性静态断言（不替代上面的行为验证，只锁导出面 / 客户端边界 / 类型声明）——

test('react 出口导出存在（真实 React 加载，非 createElement 桩）', async () => {
  const mod = await import('../../src/react/index.mjs')
  assert.equal(typeof mod.PwaRegister, 'function')
  assert.equal(typeof mod.usePwaUpdate, 'function')
  assert.equal(typeof mod.usePwaInstall, 'function')
})

test('组件模块带 "use client"（客户端边界）', () => {
  const src = readFileSync(new URL('../../src/react/pwa-register.mjs', import.meta.url), 'utf8')
  assert.match(src, /^\s*["']use client["']\s*;?/m)
})

test('index.d.ts 声明该导出', () => {
  const dts = readFileSync(new URL('../../src/react/index.d.ts', import.meta.url), 'utf8')
  assert.match(dts, /PwaRegister/)
})
