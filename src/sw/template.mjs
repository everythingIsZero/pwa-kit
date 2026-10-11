/**
 * template.mjs — SW 生成器（`buildSw(config) -> string`）
 *
 * 单源：策略函数直接取 `policy.mjs` 导出函数的 `.toString()` 内联，生成物与包内策略永远一致。
 * 生成物约定（配合执行级冒烟测试 `new Function(...)` 求值）：
 *   - 顶层用**裸** `addEventListener('install'|'activate'|'fetch', ...)`（不写 `self.addEventListener`）。
 *   - 顶层不得引用未定义标识符；install 的 `self.skipWaiting()` / activate 的 `self.clients.claim()` 只在对应 config 为真时出现。
 *   - `message` 监听始终含 `SKIP_WAITING` → `self.skipWaiting()`（用户触发更新时立即接管）。
 *   - 始终写入 `defaultStrategy`（缺省 `'network-only'`）。
 */

import { STRATEGY, DEFAULT_STRATEGY, strategyFor, cacheableResponse, decideRequest } from './policy.mjs'

/**
 * SW 运行体（prelude 之后）。不含模板字面量，便于整体嵌入。
 * install 的 `self.skipWaiting()` / activate 的 `self.clients.claim()` 按 config **构建期**决定是否出现（缺省不出现）；
 * `message` 监听始终存在（`SKIP_WAITING` 供用户触发更新时立即接管）。
 * @param {{ skipWaiting: boolean, clientsClaim: boolean }} resolved
 * @returns {string}
 */
function runtimeFor(resolved) {
  const skipWaitingLine = resolved.skipWaiting ? '      self.skipWaiting()\n' : ''
  const clientsClaimLine = resolved.clientsClaim ? '      self.clients.claim()\n' : ''
  return `const CACHE_NAME = 'pwa-kit-' + CONFIG.version

addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
${skipWaitingLine}      await caches.open(CACHE_NAME)
    })(),
  )
})

addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
${clientsClaimLine}      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    })(),
  )
})

addEventListener('message', (event) => {
  if (event && event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  const decision = decideRequest(
    {
      method: request.method,
      mode: request.mode,
      sameOrigin: url.origin === self.location.origin,
      path: url.pathname + url.search,
    },
    CONFIG,
  )
  if (decision.bypass) return
  if (decision.strategy === 'cache-first') {
    event.respondWith(cacheFirst(request))
    return
  }
  if (decision.strategy === 'network-first') {
    event.respondWith(networkFirst(request))
    return
  }
  // network-only：不 respondWith，纯网络直通
})

/** 合格才写缓存：写前过 cacheableResponse 守卫（status/Cache-Control/Vary）。 */
async function cacheablePut(request, res) {
  const meta = {
    status: res.status,
    cacheControl: res.headers.get('Cache-Control'),
    vary: res.headers.get('Vary'),
  }
  if (!cacheableResponse(meta)) return
  const cache = await caches.open(CACHE_NAME)
  await cache.put(request, res.clone())
}

/** 缓存优先：命中即回；未命中取网络，合格才写缓存。 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  await cacheablePut(request, res)
  return res
}

/** 网络优先：成功且合格写缓存；断网回缓存 → offlineUrl → 503。 */
async function networkFirst(request) {
  try {
    const res = await fetch(request)
    await cacheablePut(request, res)
    return res
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached
    if (CONFIG.offlineUrl) {
      const offline = await caches.match(CONFIG.offlineUrl)
      if (offline) return offline
    }
    return new Response('offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
`
}

/**
 * 生成 Service Worker 源码。
 * @param {{
 *   version: string,
 *   rules: Array<{ match: string, strategy: string }>,
 *   defaultStrategy?: string,
 *   offlineUrl?: string | null,
 *   skipWaiting?: boolean,
 *   clientsClaim?: boolean,
 * }} config
 * @returns {string}
 */
export function buildSw(config) {
  if (typeof config.version !== 'string' || config.version.trim() === '') {
    throw new TypeError(
      'buildSw: `version` must be a non-empty string (e.g. SW_VERSION, default git rev-parse --short HEAD); received ' +
        JSON.stringify(config.version),
    )
  }
  const resolved = {
    version: config.version,
    rules: config.rules || [],
    defaultStrategy: config.defaultStrategy || 'network-only',
    offlineUrl: config.offlineUrl ?? null,
    skipWaiting: !!config.skipWaiting,
    clientsClaim: !!config.clientsClaim,
  }

  const prelude = [
    `const CONFIG = ${JSON.stringify(resolved)}`,
    `const STRATEGY = ${JSON.stringify(STRATEGY)}`,
    `const DEFAULT_STRATEGY = ${JSON.stringify(DEFAULT_STRATEGY)}`,
    strategyFor.toString(),
    cacheableResponse.toString(),
    decideRequest.toString(),
  ].join('\n\n')

  return `${prelude}\n\n${runtimeFor(resolved)}`
}
