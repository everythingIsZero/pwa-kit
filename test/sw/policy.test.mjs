// Projects/pwa-kit/test/sw/policy.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { strategyFor, cacheableResponse, decideRequest } from '../../src/sw/policy.mjs'

const policy = { rules: [{ match: '/_next/static/', strategy: 'cache-first' }], defaultStrategy: 'network-only' }

test('strategyFor：命中用规则策略，未命中默认 network-only（含 query 路径）', () => {
  assert.equal(strategyFor('/_next/static/chunk.js', policy), 'cache-first')
  assert.equal(strategyFor('/blog/1', policy), 'network-only')
  assert.equal(strategyFor('/?token=abc', policy), 'network-only')   // RF4
})

test('decideRequest：非 GET / 跨域 → bypass', () => {
  assert.deepEqual(decideRequest({ method: 'POST', mode: 'cors', sameOrigin: true, path: '/x' }, policy), { bypass: true })
  assert.deepEqual(decideRequest({ method: 'GET', mode: 'cors', sameOrigin: false, path: '/x' }, policy), { bypass: true })
})

test('decideRequest：同源 GET 导航默认 network-only', () => {
  assert.deepEqual(decideRequest({ method: 'GET', mode: 'navigate', sameOrigin: true, path: '/' }, policy), { strategy: 'network-only' })
})

test('decideRequest：导航即使命中规则也不缓存（安全强制）', () => {
  const navPolicy = { rules: [{ match: '/blog/', strategy: 'cache-first' }], defaultStrategy: 'network-only' }
  assert.deepEqual(
    decideRequest({ method: 'GET', mode: 'navigate', sameOrigin: true, path: '/blog/1' }, navPolicy),
    { strategy: 'network-only' },
  )
})

test('cacheableResponse：仅 200 且无 no-store/private 且 Vary 干净才可缓存', () => {
  assert.equal(cacheableResponse({ status: 200, cacheControl: 'public, max-age=31536000, immutable' }), true)
  assert.equal(cacheableResponse({ status: 206, cacheControl: 'public' }), false)       // RF1
  assert.equal(cacheableResponse({ status: 200, cacheControl: 'no-store' }), false)     // RF3
  assert.equal(cacheableResponse({ status: 200, cacheControl: 'private' }), false)
  assert.equal(cacheableResponse({ status: 200, cacheControl: 'private="set-cookie"' }), false) // 参数化 private
  assert.equal(cacheableResponse({ status: 200, vary: 'Cookie' }), false)               // RF2
  assert.equal(cacheableResponse({ status: 200, vary: '*' }), false)
  assert.equal(cacheableResponse({ status: 200, vary: 'Authorization' }), false)
})
