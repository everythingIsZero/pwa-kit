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
 * - `undefined` / `null`（站点没配 headers）→ 仅产出 `/sw.js` 一条；
 * - 数组 → 逐条处理**所有** `/sw.js` 条目（不只手补首个）；无 `/sw.js` 条目则追加一条；
 * - 每个 `/sw.js` 条目：保留其全部头，仅在其未声明 `Cache-Control` 时补一条（**不覆盖站点已有头**）；
 * - 非数组（字符串 / 对象 / Promise 等）→ 抛 `TypeError`：旧实现会静默丢成 `[]`、站点头全失，
 *   且症状隐蔽（构建期无报错、线上丢头），故显式失败而非静默退化。
 * @param {unknown} headers `nextConfig.headers` 的求值结果
 */
function withSwNoCache(headers) {
  if (headers == null) {
    return [{ source: SW_SOURCE, headers: [SW_CACHE_CONTROL] }]
  }
  if (!Array.isArray(headers)) {
    throw new TypeError(
      `withPwaKit: nextConfig.headers() 必须返回数组，收到 ${typeof headers}。` +
        '非数组会被静默丢弃、站点响应头全失，故显式报错。',
    )
  }

  let found = false
  const next = headers.map((entry) => {
    if (!entry || entry.source !== SW_SOURCE) return entry
    found = true
    const entryHeaders = Array.isArray(entry.headers) ? entry.headers : []
    if (entryHeaders.some(isCacheControl)) return entry // 该条已声明 → 尊重站点，不覆盖、不重复
    return { ...entry, headers: [...entryHeaders, SW_CACHE_CONTROL] }
  })
  if (!found) next.push({ source: SW_SOURCE, headers: [SW_CACHE_CONTROL] })
  return next
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
 * **仅支持对象形态** `nextConfig`：Next 还允许 `next.config.mjs` 导出函数
 * `(phase, ctx) => config`，本函数无法安全展开函数（会静默丢成 `{}`、站点配置全失），
 * 故收到函数时**抛 `TypeError`**。需要函数形态时在站点侧自行解包：
 *
 * ```js
 * export default (phase, ctx) => withPwaKit(configFn(phase, ctx))
 * ```
 *
 * 不修改入参对象；站点原有 `headers()`（函数或数组）与其余配置字段全部保留。
 * @template {object} [T]
 * @param {T} [nextConfig] Next 配置对象（可省略；**不接受函数**）
 * @returns {T & { headers: () => Promise<Array<{ source: string, headers: Array<{ key: string, value: string }> }>> }}
 */
export function withPwaKit(nextConfig = {}) {
  if (typeof nextConfig === 'function') {
    throw new TypeError(
      'withPwaKit 仅支持对象形态的 nextConfig，收到函数（Next 的 (phase, ctx) => config 形态）。' +
        '静默展开函数会丢成 {}、站点配置全失，故显式报错；' +
        '请改在站点侧解包：export default (phase, ctx) => withPwaKit(configFn(phase, ctx))。',
    )
  }
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
