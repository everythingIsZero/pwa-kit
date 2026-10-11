// Projects/pwa-kit/test/sw/template.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSw } from '../../src/sw/template.mjs'

test('buildSw：嵌入 VERSION 与策略；含 install/activate/fetch；确定性', () => {
  const sw = buildSw({ version: 'sha-abc123', rules: [{ match: '/_next/static/', strategy: 'cache-first' }] })
  assert.match(sw, /sha-abc123/)
  assert.match(sw, /addEventListener\('fetch'/)     // 裸调用
  assert.match(sw, /addEventListener\('activate'/)
  assert.equal(buildSw({ version: 'v1', rules: [] }), buildSw({ version: 'v1', rules: [] }))
})

test('buildSw：始终写入默认 network-only；内联自包含函数', () => {
  const sw = buildSw({ version: 'v1', rules: [] })
  assert.match(sw, /"defaultStrategy":"network-only"/)
  assert.match(sw, /function decideRequest/)
  assert.match(sw, /function cacheableResponse/)
})

test('buildSw 产物可执行（冒烟）：无未定义标识符，行为正确', () => {
  const sw = buildSw({ version: 'v1', rules: [{ match: '/s/', strategy: 'network-only' }] })
  const factory = new Function('addEventListener', 'self', 'caches', 'fetch', 'Response', 'URL',
    sw + '\n;return { decideRequest, cacheableResponse }')
  const { decideRequest, cacheableResponse } = factory(() => {}, {}, {}, () => {}, class {}, URL)
  assert.equal(decideRequest({ method: 'GET', mode: 'navigate', sameOrigin: true, path: '/' }, { rules: [], defaultStrategy: 'network-only' }).strategy, 'network-only')
  assert.equal(cacheableResponse({ status: 200, cacheControl: 'no-store' }), false)
  assert.equal(cacheableResponse({ status: 200, cacheControl: 'public' }), true)
})
