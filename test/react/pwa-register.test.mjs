// test/react/pwa-register.test.mjs — `<PwaRegister/>` 导出与客户端边界
//
// 组件复用现有 `usePwaUpdate`（更新提示）+ `registerSW`（生产注册）；因用到 hooks，
// 模块须带 `"use client"`（参考 auth `src/ui.mjs` 做法），SSR 下 effect 不跑、默认渲染 null，
// 不炸 hydration。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'

// 测试环境无 React：把裸 'react' 解析到最小桩，仅用于加载模块以验证导出面。
// （顶层 registerHooks 先于下方动态 import 生效。）
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'react') {
      return { url: new URL('../fixtures/react-stub.mjs', import.meta.url).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

const mod = await import('../../src/react/index.mjs')

test('PwaRegister：react 出口导出存在且为函数；既有导出不受影响', () => {
  assert.equal(typeof mod.PwaRegister, 'function')
  assert.equal(typeof mod.usePwaUpdate, 'function')
  assert.equal(typeof mod.usePwaInstall, 'function')
})

test('PwaRegister：组件模块带 "use client"（客户端边界）', () => {
  const src = readFileSync(new URL('../../src/react/pwa-register.mjs', import.meta.url), 'utf8')
  assert.match(src, /^\s*["']use client["']\s*;?/m)
})

test('PwaRegister：index.d.ts 声明该导出', () => {
  const dts = readFileSync(new URL('../../src/react/index.d.ts', import.meta.url), 'utf8')
  assert.match(dts, /PwaRegister/)
})
