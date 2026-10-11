/**
 * policy.mjs — 缓存策略纯决策（自包含）
 *
 * 设计约束：`strategyFor` / `cacheableResponse` / `decideRequest` 必须自包含——
 * 函数体只用参数与字面量，不引用模块内常量，便于 `buildSw` 用 `.toString()` 内联进 SW。
 * 下方 `STRATEGY` / `DEFAULT_STRATEGY` 仅作对外常量，函数体内不使用。
 */

export const STRATEGY = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  NETWORK_ONLY: 'network-only',
}

export const DEFAULT_STRATEGY = 'network-only'

/**
 * 敏感前缀硬底线：命中者**永不缓存、也不从缓存读**（强制 network-only），
 * 即使站点 `rules` 把它们配成 `cache-first` 也不行。站点**只能加不能减**。
 *
 * 跨包同源：与 analytics `DEFAULT_DENY_PREFIXES`、auth `SENSITIVE_PREFIXES` 集合相等
 * （workspace `scripts/e2e/prefix-consistency.test.mjs` 核对）。`buildSw` 会把它注入生成物
 * 的 `CONFIG.sensitivePrefixes`，且**忽略站点传入的同名值**。
 *
 * 注意：`decideRequest` 为可内联保持自包含，函数体内另有同值字面量；改动本常量须同步该字面量。
 */
export const SENSITIVE_PREFIXES = Object.freeze(['/s/', '/r/', '/api/'])

/**
 * 按路径选策略：首个 `path.startsWith(rule.match)` 命中即用其策略，否则默认。
 * @param {string} path
 * @param {{ rules?: Array<{ match: string, strategy: string }>, defaultStrategy?: string }} policy
 * @returns {string}
 */
export function strategyFor(path, policy) {
  const rules = (policy && policy.rules) || []
  for (const rule of rules) {
    if (path.startsWith(rule.match)) return rule.strategy
  }
  return (policy && policy.defaultStrategy) || 'network-only'
}

/**
 * 响应是否可缓存：仅 200，且 Cache-Control 无 no-store/private，且 Vary 无 Cookie/Authorization/*。
 * @param {{ status?: number, cacheControl?: string, vary?: string }} meta
 * @returns {boolean}
 */
export function cacheableResponse(meta) {
  if (!meta || meta.status !== 200) return false
  const cacheControl = String(meta.cacheControl || '').toLowerCase()
  for (const part of cacheControl.split(',')) {
    const token = part.trim()
    // no-store 无参数，精确匹配；private 允许参数化形式（如 private="set-cookie"）
    if (token === 'no-store' || token.startsWith('private')) return false
  }
  const vary = String(meta.vary || '').toLowerCase()
  for (const part of vary.split(',')) {
    const token = part.trim()
    if (token === 'cookie' || token === 'authorization' || token === '*') return false
  }
  return true
}

/**
 * 请求级决策：非 GET 或跨域 → 放行（bypass）；敏感前缀 → 强制 network-only；
 * 导航 → network-only；否则按策略路由。
 *
 * 敏感前缀是**硬底线**：`/s/` `/r/` `/api/`（自包含字面量，与 `SENSITIVE_PREFIXES` 同值）
 * 恒不走缓存，站点 `rules` 的 `cache-first` 压不过它；`policy.sensitivePrefixes` 只作**追加**，
 * 不能缩掉底线。函数体只用参数与字面量（供 `buildSw` 用 `.toString()` 内联）。
 *
 * @param {{ method?: string, mode?: string, sameOrigin?: boolean, path?: string }} req
 * @param {{ rules?: Array<{ match: string, strategy: string }>, defaultStrategy?: string, sensitivePrefixes?: string[] }} policy
 * @returns {{ bypass: true } | { strategy: string }}
 */
export function decideRequest(req, policy) {
  if (req.method !== 'GET') return { bypass: true }
  if (!req.sameOrigin) return { bypass: true }
  if (req.mode === 'navigate') return { strategy: 'network-only' }
  const path = req.path || ''
  const baseline = ['/s/', '/r/', '/api/']
  for (const prefix of baseline) {
    if (path.startsWith(prefix)) return { strategy: 'network-only' }
  }
  const provided = (policy && policy.sensitivePrefixes) || []
  for (const prefix of provided) {
    if (typeof prefix === 'string' && prefix && path.startsWith(prefix)) return { strategy: 'network-only' }
  }
  return { strategy: strategyFor(req.path, policy) }
}
