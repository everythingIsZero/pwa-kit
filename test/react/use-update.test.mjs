// Projects/pwa-kit/test/react/use-update.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldPromptUpdate } from '../../src/react/update.mjs'

test('shouldPromptUpdate：新 SW installed 且已有 controller 才提示（非首次安装）', () => {
  assert.equal(shouldPromptUpdate({ installed: true, hasController: true }), true)
  assert.equal(shouldPromptUpdate({ installed: true, hasController: false }), false) // 首次安装：无旧版可更
  assert.equal(shouldPromptUpdate({ installed: false, hasController: true }), false) // 还没装好
  assert.equal(shouldPromptUpdate({ installed: false, hasController: false }), false)
})
