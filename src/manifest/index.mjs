/**
 * index.mjs — pwa-kit `./manifest` 出口（纯函数，零依赖）
 *
 * 品牌 manifest 的**默认值单源**：每站的 manifest 都躲不过几个业界坑，本层把「默认就对」的
 * 部分兜住，站点只传自己的品牌字段（名称/图标/主题色），不重复踩坑：
 * - 显式 `id`（X15）：不设时浏览器由 `start_url` 派生身份，将来改 `start_url` 会被当成**另一个应用**；
 * - 图标 `purpose:'any maskable'`（X16）：缺 maskable 时 Android 主屏会裁掉图标外圈/加白边；
 * - `display:'standalone'` + `start_url:'/'`：安装后以独立窗口打开、回到根路由的最常见诉求。
 *
 * 站点**纯覆盖**：给了就用自己的值，不与默认做隐式合并（合并只会让「我明明传了」变成「到底哪个生效」）。
 * 产出是普通对象、无函数/undefined，可 `JSON.stringify`、可被 Next `app/manifest.ts` 直接返回。
 */

/** 默认图标：192/512 两档，均标 `any maskable`（既是普通图标、也可作遮罩图标，X16） */
const DEFAULT_ICONS = Object.freeze([
  Object.freeze({ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }),
  Object.freeze({ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }),
])

/**
 * 构建符合 PWA 规范的 manifest 普通对象。
 * @param {{
 *   name: string,
 *   shortName?: string,
 *   description?: string,
 *   startUrl?: string,
 *   display?: string,
 *   themeColor?: string,
 *   backgroundColor?: string,
 *   icons?: Array<{ src: string, sizes?: string, type?: string, purpose?: string }>,
 *   id?: string,
 *   lang?: string,
 * }} input 站点品牌字段（驼峰；仅 `name` 必填）
 * @returns {Record<string, unknown>} snake_case 的 manifest 对象（无 undefined 键）
 */
export function buildManifest(input) {
  const o = input || {}
  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!name) throw new TypeError('buildManifest: `name` is required (non-empty string)')

  const out = {
    id: typeof o.id === 'string' && o.id ? o.id : '/',
    name,
    start_url: typeof o.startUrl === 'string' && o.startUrl ? o.startUrl : '/',
    display: typeof o.display === 'string' && o.display ? o.display : 'standalone',
    icons: Array.isArray(o.icons) ? o.icons.map((i) => ({ ...i })) : DEFAULT_ICONS.map((i) => ({ ...i })),
  }

  // 可选品牌字段：给了才写，不落 undefined 键（保证可 JSON 序列化、diff 干净）
  if (typeof o.shortName === 'string' && o.shortName) out.short_name = o.shortName
  if (typeof o.description === 'string' && o.description) out.description = o.description
  if (typeof o.lang === 'string' && o.lang) out.lang = o.lang
  if (typeof o.themeColor === 'string' && o.themeColor) out.theme_color = o.themeColor
  if (typeof o.backgroundColor === 'string' && o.backgroundColor) out.background_color = o.backgroundColor

  return out
}
