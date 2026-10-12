/**
 * index.mjs — pwa-kit Next.js 构建期出口（包入口 `./next`）
 *
 * 为什么单独入口：`withPwaKit` 只服务 Next 构建期（改写 `next.config.mjs` 的 `headers()`），
 * 属 Node/构建能力，**不得塞进浏览器核心 `pwa-kit`（`src/core/index.mjs`）**——否则浏览器
 * 产物会拉进构建期代码。故独立子路径 `@hxym18/pwa-kit/next`，零依赖、不 import next。
 *
 * 作用：给 `/sw.js` 注入 `Cache-Control: no-cache`（存但每次向服务器再校验）。SW 文件内容随
 * 构建变（内嵌 version），若被 HTTP 缓存，浏览器会延迟发现新版本、升级被卡住。
 */

const SW_SOURCE = '/sw.js'
const SW_CACHE_CONTROL = Object.freeze({ key: 'Cache-Control', value: 'no-cache, max-age=0' })

const isCacheControl = (h) => h && String(h.key).toLowerCase() === 'cache-control'

/**
 * 幂等合并：把 `/sw.js` 的 no-cache 头并入既有 `headers()` 结果。
 * - 无 `/sw.js` 条目 → 追加一条，不动其他条目；
 * - 已有 `/sw.js` 条目 → 保留其全部头，仅在其未声明 `Cache-Control` 时补一条（**不覆盖站点已有头**）；
 * - 已声明 `Cache-Control` → 原样返回（尊重站点）。
 * @param {unknown} headers `nextConfig.headers` 的求值结果
 */
function withSwNoCache(headers) {
  const list = Array.isArray(headers) ? headers : []
  const idx = list.findIndex((entry) => entry && entry.source === SW_SOURCE)

  if (idx === -1) {
    return [...list, { source: SW_SOURCE, headers: [SW_CACHE_CONTROL] }]
  }

  const entry = list[idx]
  const entryHeaders = Array.isArray(entry.headers) ? entry.headers : []
  if (entryHeaders.some(isCacheControl)) return list // 站点已声明 → 不覆盖、不重复

  const merged = { ...entry, headers: [...entryHeaders, SW_CACHE_CONTROL] }
  return [...list.slice(0, idx), merged, ...list.slice(idx + 1)]
}

/**
 * 给 Next 配置注入 `/sw.js` 的 `no-cache` 响应头。
 *
 * ```js
 * // next.config.mjs
 * import { withPwaKit } from '@hxym18/pwa-kit/next'
 * export default withPwaKit({ reactStrictMode: true })
 * ```
 *
 * 不修改入参对象；站点原有 `headers()`（函数或数组）与其余配置字段全部保留。
 * @template {object} [T]
 * @param {T} [nextConfig] Next 配置对象（可省略）
 * @returns {T & { headers: () => Promise<Array<{ source: string, headers: Array<{ key: string, value: string }> }>> }}
 */
export function withPwaKit(nextConfig = {}) {
  const base = nextConfig && typeof nextConfig === 'object' ? nextConfig : {}
  const existing = base.headers
  return {
    ...base,
    async headers() {
      const resolved = typeof existing === 'function' ? await existing() : existing
      return withSwNoCache(resolved)
    },
  }
}
