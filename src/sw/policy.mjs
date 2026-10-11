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
    if (token === 'no-store' || token === 'private') return false
  }
  const vary = String(meta.vary || '').toLowerCase()
  for (const part of vary.split(',')) {
    const token = part.trim()
    if (token === 'cookie' || token === 'authorization' || token === '*') return false
  }
  return true
}

/**
 * 请求级决策：非 GET 或跨域 → 放行（bypass）；否则按策略路由。
 * @param {{ method?: string, mode?: string, sameOrigin?: boolean, path?: string }} req
 * @param {{ rules?: Array<{ match: string, strategy: string }>, defaultStrategy?: string }} policy
 * @returns {{ bypass: true } | { strategy: string }}
 */
export function decideRequest(req, policy) {
  if (req.method !== 'GET') return { bypass: true }
  if (!req.sameOrigin) return { bypass: true }
  return { strategy: strategyFor(req.path, policy) }
}
