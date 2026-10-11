/** pwa-kit `./manifest` 出口类型 */

/** 一个 manifest 图标（W3C icons[] 项） */
export interface ManifestIcon {
  src: string
  sizes?: string
  type?: string
  /**
   * W3C 允许空格分隔组合（如 `'any maskable'`）。注意：Next 14 的 `MetadataRoute.Manifest`
   * 只认单个字面量（`'any' | 'maskable' | 'monochrome' | 'badge'`），故把本函数结果用于
   * `app/manifest.ts` 时需断言（见 README）。
   */
  purpose?: string
}

/** `buildManifest` 入参：驼峰，站点只填品牌字段（仅 `name` 必填） */
export interface ManifestInput {
  name: string
  shortName?: string
  description?: string
  startUrl?: string
  display?: string
  themeColor?: string
  backgroundColor?: string
  icons?: ManifestIcon[]
  id?: string
  lang?: string
}

/** PWA Web App Manifest：snake_case 键的普通对象，无 undefined，可 JSON 序列化 */
export interface PwaManifest {
  id: string
  name: string
  start_url: string
  display: string
  icons: ManifestIcon[]
  short_name?: string
  description?: string
  lang?: string
  theme_color?: string
  background_color?: string
}

/**
 * 构建 PWA manifest 普通对象。
 * 默认：`id:'/'`、`start_url:'/'`、`display:'standalone'`、图标 192/512 + `purpose:'any maskable'`；
 * 站点传值即纯覆盖。`name` 缺失/空白抛 `TypeError`。
 */
export function buildManifest(input: ManifestInput): PwaManifest
