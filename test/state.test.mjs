/**
 * state.test.mjs — 安装状态判定矩阵全覆盖（node:test，纯函数直调）
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { judgeInstallState, renderPwaCopy, INSTALL_STATUS } from '../src/core/index.mjs'

const judge = (s) => judgeInstallState(s)

test('已安装（standalone）：一切信号之上的最高优先级', () => {
  for (const extra of [{}, { isWeChat: true }, { hasPrompt: true }, { isMobileSafari: true }]) {
    assert.deepEqual(judge({ isStandalone: true, ...extra }).status, 'installed')
  }
})

test('微信内未安装：无论 iOS / Android / 有无 prompt 事件，恒引导「浏览器打开」', () => {
  assert.equal(judge({ isWeChat: true }).status, 'wechat')
  assert.equal(judge({ isWeChat: true, isMobileSafari: true }).status, 'wechat')
  assert.equal(judge({ isWeChat: true, hasPrompt: true }).status, 'wechat')
  assert.equal(judge({ isWeChat: true }).guide, 'pwa.guide.wechat')
})

test('iOS Safari 未安装：引导「分享 → 添加到主屏幕」', () => {
  const r = judge({ isIOS: true, isMobileSafari: true })
  assert.equal(r.status, 'ios-guide')
  assert.equal(r.guide, 'pwa.guide.ios')
  assert.equal(r.canInstall, false)
})

test('iOS 非 Safari 浏览器（CriOS 等）：unsupported，不给死路引导', () => {
  assert.equal(judge({ isIOS: true }).status, 'unsupported')
})

test('Chrome/Edge 系 prompt 事件已到：native，可调 install()', () => {
  const r = judge({ hasPrompt: true })
  assert.equal(r.status, 'native')
  assert.equal(r.canInstall, true)
  assert.equal(r.guide, null)
})

test('pending：事件未到的初始等待态（SSR / 首帧）', () => {
  assert.equal(judge().status, 'pending')
  assert.equal(judge({}).status, 'pending')
  assert.equal(judge(null).status, 'pending')
})

test('canInstall 仅 native 为 true', () => {
  for (const status of INSTALL_STATUS) {
    const s = {
      installed: { isStandalone: true },
      wechat: { isWeChat: true },
      'ios-guide': { isMobileSafari: true },
      native: { hasPrompt: true },
      pending: {},
      unsupported: { isIOS: true },
    }[status]
    assert.equal(judge(s).canInstall, status === 'native', status)
  }
})

test('文案表：引导文案可取且为中文口径；未知 id 原样返回', () => {
  assert.ok(renderPwaCopy('pwa.guide.wechat').includes('浏览器打开'))
  assert.ok(renderPwaCopy('pwa.guide.ios').includes('添加到主屏幕'))
  assert.equal(renderPwaCopy('nope'), 'nope')
})
