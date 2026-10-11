// test/manifest.test.mjs — 品牌 manifest 构建器（`@hxym18/pwa-kit/manifest`）
//
// 为什么：spec §6.5 把「品牌 manifest」列为 pwa-kit 的稳定扩展面；默认值取业界坑项——
// 显式 `id`（X15：不设则由 start_url 派生，改 start_url 会变成新应用）、
// `purpose:'any maskable'` 图标（X16：缺 maskable 在 Android 主屏被裁成方/白边）。
// 纯函数、零依赖，Next `app/manifest.ts` 可直接 `return buildManifest({...})`。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildManifest } from '../src/manifest/index.mjs'

test('buildManifest：默认值形状——id/start_url/display/icons 均按坑项兜底（X15/X16）', () => {
  const m = buildManifest({ name: '材料报告生成' })
  assert.equal(m.name, '材料报告生成')
  assert.equal(m.id, '/')          // X15：显式 id，改 start_url 不换应用身份
  assert.equal(m.start_url, '/')
  assert.equal(m.display, 'standalone')
  assert.deepEqual(m.icons.map((i) => i.sizes), ['192x192', '512x512'])
  assert.ok(
    m.icons.every((i) => i.purpose === 'any maskable'),
    '每个默认图标都要带 purpose:"any maskable"（X16）',
  )
})

test('buildManifest：站点可覆盖任意项（纯覆盖，不与默认隐式合并）', () => {
  const m = buildManifest({
    name: '字贴',
    shortName: '字贴',
    description: '练字',
    startUrl: '/app',
    display: 'fullscreen',
    themeColor: '#1668dc',
    backgroundColor: '#f5f6f8',
    id: '/app',
    lang: 'zh-CN',
    icons: [{ src: '/i.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  })
  assert.equal(m.short_name, '字贴')
  assert.equal(m.description, '练字')
  assert.equal(m.start_url, '/app')
  assert.equal(m.display, 'fullscreen')
  assert.equal(m.theme_color, '#1668dc')
  assert.equal(m.background_color, '#f5f6f8')
  assert.equal(m.id, '/app')
  assert.equal(m.lang, 'zh-CN')
  assert.deepEqual(m.icons, [{ src: '/i.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }])
})

test('buildManifest：未给的项不产出 undefined 键；整体可 JSON 往返（可序列化）', () => {
  const m = buildManifest({ name: '材料报告生成' })
  for (const [k, v] of Object.entries(m)) {
    assert.notEqual(v, undefined, `键 ${k} 不应为 undefined`)
  }
  assert.ok(!('theme_color' in m))
  assert.ok(!('background_color' in m))
  assert.ok(!('description' in m))
  assert.deepEqual(JSON.parse(JSON.stringify(m)), m)
})

test('buildManifest：name 必填（空/非串直接抛错，不产出无名 manifest）', () => {
  assert.throws(() => buildManifest({}), TypeError)
  assert.throws(() => buildManifest({ name: '   ' }), TypeError)
  assert.throws(() => buildManifest(), TypeError)
})
