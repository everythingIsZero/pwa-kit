/**
 * state.test.mjs — 安装状态判定矩阵全覆盖（node:test，纯函数直调）
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { judgeInstallState, renderPwaCopy, pwaGuideOf, INSTALL_STATUS } from '../src/core/index.mjs'
import { pwaFigureOf, FIGURES } from '../src/ui/index.mjs'

const judge = (s) => judgeInstallState(s)

test('已安装（standalone）：一切信号之上的最高优先级', () => {
  for (const extra of [{}, { isWeChat: true }, { hasPrompt: true }, { isMobileSafari: true }]) {
    assert.deepEqual(judge({ isStandalone: true, ...extra }).status, 'installed')
  }
})

test('微信内未安装：无论 iOS / Android / 有无安装事件，恒引导「浏览器打开」', () => {
  assert.equal(judge({ isWeChat: true }).status, 'wechat')
  assert.equal(judge({ isWeChat: true, isMobileSafari: true }).status, 'wechat')
  assert.equal(judge({ isWeChat: true, hasPrompt: true }).status, 'wechat')
  // 引导数据（标题/步骤/图）单一来源于 pwaGuideOf
  assert.ok(pwaGuideOf('wechat').steps.some((t) => t.includes('浏览器打开')))
})

test('iOS Safari 未安装：引导「分享 → 添加到主屏幕」', () => {
  const r = judge({ isIOS: true, isMobileSafari: true })
  assert.equal(r.status, 'ios-guide')
  assert.equal(r.canInstall, false)
  assert.ok(pwaGuideOf('ios-guide').steps.some((t) => t.includes('添加到主屏幕')))
})

test('iOS 非 Safari 浏览器（CriOS 等）：unsupported，不给死路引导', () => {
  assert.equal(judge({ isIOS: true }).status, 'unsupported')
})

test('browser-prompt：Android/PC Chrome 系安装事件已到，可调 install()', () => {
  const r = judge({ hasPrompt: true })
  assert.equal(r.status, 'browser-prompt')
  assert.equal(r.canInstall, true)
})

test('pending：事件未到的初始等待态（SSR / 首帧）', () => {
  assert.equal(judge().status, 'pending')
  assert.equal(judge({}).status, 'pending')
  assert.equal(judge(null).status, 'pending')
})

test('canInstall 仅 browser-prompt 为 true', () => {
  for (const status of INSTALL_STATUS) {
    const s = {
      installed: { isStandalone: true },
      wechat: { isWeChat: true },
      'ios-guide': { isMobileSafari: true },
      'browser-prompt': { hasPrompt: true },
      pending: {},
      unsupported: { isIOS: true },
    }[status]
    assert.equal(judge(s).canInstall, status === 'browser-prompt', status)
  }
})

test('文案表：按钮/结果文案可取且为中文口径；未知 id 原样返回', () => {
  assert.ok(renderPwaCopy('pwa.action.install').includes('主屏幕'))
  assert.ok(renderPwaCopy('pwa.install.accepted').includes('主屏'))
  assert.equal(renderPwaCopy('nope'), 'nope')
})

test('结构化引导：三态全覆盖、每态有图有步骤（点击后再引导的口径）', () => {
  for (const status of ['wechat', 'ios-guide', 'browser-prompt']) {
    const g = pwaGuideOf(status)
    assert.ok(g, status)
    assert.ok(g.title.length >= 6, `${status} 标题太短`)
    assert.ok(g.steps.length >= 1 && g.steps.length <= 3, `${status} 步骤须在 1-3 步`)
    // 每个引导的 figure 必须真的有 SVG（引导要看得懂：有图）
    assert.ok(pwaFigureOf(g.figure).startsWith('<svg'), `${status} 图示缺失`)
  }
  assert.equal(pwaGuideOf('pending'), null)
  assert.equal(pwaGuideOf('installed'), null)
  assert.equal(pwaFigureOf('nope'), '')
  assert.ok(Object.keys(FIGURES).length === 3)
})
