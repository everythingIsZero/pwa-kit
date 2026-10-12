// test/next/with-pwa-kit.test.mjs — 构建期出口 `@hxym18/pwa-kit/next`
//
// 为什么：`/sw.js` 若被 HTTP 缓存，浏览器会延迟发现新版本（升级被卡住），故必须
// `Cache-Control: no-cache`（存但每次再校验）。此能力是构建/Node 侧，必须放 `./next`
// 子路径出口，不得进浏览器核心 `src/core/index.mjs`。
//
// 关键约束：**幂等合并**站点已有 `headers()`——不覆盖站点已有头，只对 `/sw.js` 生效。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withPwaKit } from '../../src/next/index.mjs'

const findSw = (entries) => entries.find((e) => e.source === '/sw.js')
const cacheControls = (entry) =>
  entry.headers.filter((h) => String(h.key).toLowerCase() === 'cache-control')

test('withPwaKit({})：产出 /sw.js + Cache-Control 含 no-cache', async () => {
  const entries = await withPwaKit({}).headers()
  const sw = findSw(entries)
  assert.ok(sw, '缺少 /sw.js 响应头条目')
  const cc = cacheControls(sw)
  assert.equal(cc.length, 1, 'Cache-Control 应恰好一条')
  assert.match(cc[0].value, /no-cache/)
})

test('withPwaKit：保留 nextConfig 其他字段，且不改动入参对象', () => {
  const base = { reactStrictMode: true }
  const cfg = withPwaKit(base)
  assert.equal(cfg.reactStrictMode, true)
  assert.equal(typeof cfg.headers, 'function')
  assert.equal(base.headers, undefined, '不得为入参对象注入 headers')
})

test('withPwaKit：合并站点已有异步 headers()，站点头不丢', async () => {
  const base = {
    async headers() {
      return [{ source: '/api/:path*', headers: [{ key: 'X-Site', value: '1' }] }]
    },
  }
  const entries = await withPwaKit(base).headers()
  assert.ok(
    entries.find((e) => e.source === '/api/:path*'),
    '站点已有头条目丢失',
  )
  assert.ok(findSw(entries), '未注入 /sw.js')
})

test('withPwaKit：合并站点数组形式的 headers（静态配置）', async () => {
  const entries = await withPwaKit({
    headers: [{ source: '/fonts/:path*', headers: [{ key: 'X-F', value: '2' }] }],
  }).headers()
  assert.ok(entries.find((e) => e.source === '/fonts/:path*'), '站点静态头丢失')
  assert.ok(findSw(entries), '未注入 /sw.js')
})

test('withPwaKit：二次包裹仍只有一个 /sw.js、一条 Cache-Control（幂等）', async () => {
  const twice = await withPwaKit(withPwaKit({})).headers()
  assert.equal(twice.filter((e) => e.source === '/sw.js').length, 1)
  assert.equal(cacheControls(findSw(twice)).length, 1)
})

test('withPwaKit：站点已有 /sw.js 其他头时并入 no-cache，不丢站点头', async () => {
  const entries = await withPwaKit({
    headers: () => [{ source: '/sw.js', headers: [{ key: 'X-Sw', value: 'keep' }] }],
  }).headers()
  const sw = findSw(entries)
  assert.ok(
    sw.headers.find((h) => h.key === 'X-Sw' && h.value === 'keep'),
    '站点 /sw.js 上其他头丢失',
  )
  const cc = cacheControls(sw)
  assert.equal(cc.length, 1)
  assert.match(cc[0].value, /no-cache/)
})

test('withPwaKit：站点已自定义 /sw.js Cache-Control → 尊重站点，不覆盖/不重复', async () => {
  const siteValue = 'public, max-age=3600, must-revalidate'
  const entries = await withPwaKit({
    headers: () => [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: siteValue }] }],
  }).headers()
  const cc = cacheControls(findSw(entries))
  assert.equal(cc.length, 1, '不得追加第二条 Cache-Control')
  assert.equal(cc[0].value, siteValue, '不得覆盖站点已有值')
})

test('withPwaKit：无 headers() 时（缺省 undefined）也返回合法数组', async () => {
  const entries = await withPwaKit().headers()
  assert.ok(Array.isArray(entries))
  assert.ok(findSw(entries))
})

test('withPwaKit：函数式 nextConfig → 抛 TypeError（不静默丢成 {}）', () => {
  assert.throws(
    () => withPwaKit(() => ({ reactStrictMode: true })),
    TypeError,
    '函数式导出被静默展开会丢站点配置，必须显式报错',
  )
})

test('withPwaKit：headers() 返回非数组 → 抛 TypeError（不静默丢站点头）', async () => {
  await assert.rejects(withPwaKit({ headers: () => ({ source: '/x' }) }).headers(), TypeError)
  await assert.rejects(withPwaKit({ headers: 'nope' }).headers(), TypeError)
})

test('withPwaKit：多份 /sw.js 条目全部补齐 no-cache（不只首个），站点头不丢', async () => {
  const entries = await withPwaKit({
    headers: () => [
      { source: '/sw.js', headers: [{ key: 'X-A', value: '1' }] },
      { source: '/other', headers: [] },
      { source: '/sw.js', headers: [{ key: 'X-B', value: '2' }] },
    ],
  }).headers()
  const sws = entries.filter((e) => e.source === '/sw.js')
  assert.equal(sws.length, 2, '两份 /sw.js 条目都应保留')
  for (const sw of sws) {
    const cc = cacheControls(sw)
    assert.equal(cc.length, 1, '每个 /sw.js 条目应恰好一条 Cache-Control')
    assert.match(cc[0].value, /no-cache/)
  }
  assert.ok(sws[0].headers.find((h) => h.key === 'X-A'), '首份 /sw.js 站点头丢失')
  assert.ok(sws[1].headers.find((h) => h.key === 'X-B'), '第二份 /sw.js 站点头丢失')
})
