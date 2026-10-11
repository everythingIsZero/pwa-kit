/**
 * sw.template.js — 通用 Service Worker 模板（配置驱动，站点拷贝到 public/sw.js 后只改 CONFIG）
 *
 * 策略路由（只处理同源 GET，跨域 / POST 一律放行不拦）：
 *   1. NETWORK_ONLY 命中 → 纯网络直通（接口、带 token 的页面等敏感路径：绝不缓存、绝不兜底）
 *   2. CACHE_FIRST 命中 → 缓存优先（immutable 带 hash 的静态资产）
 *   3. 导航请求（mode === 'navigate'）→ 网络优先，失败回缓存，再失败回 OFFLINE_URL
 *   4. 其余 → stale-while-revalidate（先回缓存，后台静默更新）
 *
 * 更新语义（保守，不抢跑）：不 skipWaiting / 不 clients.claim——
 *   首访当次会话不被接管（下次访问生效）；更新版 SW 等全部页签关闭后自然换血，页面不会新旧混跑。
 *
 * ⚠️ 发版必改 CONFIG.VERSION：activate 据此清掉全部旧版本缓存，否则用户一直拿旧资产。
 * ⚠️ 带 token / 私密路径必须进 NETWORK_ONLY（进了 SW 缓存 = 离线可读，等同泄露）。
 */

// ============ CONFIG（站点拷贝后只改这里） ============
const CONFIG = {
  VERSION: 'v1', // ⚠️ 每次发版必改
  PRECACHE: [], // 预缓存 URL（app shell；动态渲染的站可留空）
  CACHE_FIRST: [/^\/_next\/static\//],
  NETWORK_ONLY: [/^\/api\//, /^\/s\//], // 正则匹配 path+search（如 /api/auth/me）
  OFFLINE_URL: null, // 离线兜底页（null = 导航失败直接 503）
}
// ====================================================

const CACHE_NAME = `pwa-kit-${CONFIG.VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // 逐项 add + allSettled：单个 404 不拖垮整个安装（addAll 是全有全无）
      await Promise.allSettled(CONFIG.PRECACHE.map((url) => cache.add(url)))
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const path = url.pathname + url.search
  if (CONFIG.NETWORK_ONLY.some((re) => re.test(path))) return // 纯直通，不 respondWith

  if (CONFIG.CACHE_FIRST.some((re) => re.test(path))) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }
  event.respondWith(staleWhileRevalidate(request))
})

/** 缓存优先：命中即回；未命中取网络并写缓存 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, res.clone())
  }
  return res
}

/** 网络优先（导航页）：成功写缓存；断网回缓存 → OFFLINE_URL → 503 */
async function networkFirstNavigation(request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, res.clone())
    }
    return res
  } catch {
    const cached =
      (await caches.match(request)) || (CONFIG.OFFLINE_URL ? await caches.match(CONFIG.OFFLINE_URL) : null)
    if (cached) return cached
    return new Response('离线且无缓存', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}

/** stale-while-revalidate：缓存先回，后台静默更新；无缓存等网络 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const refresh = fetch(request)
    .then(async (res) => {
      if (res.ok) {
        const cache = await caches.open(CACHE_NAME)
        cache.put(request, res.clone())
      }
      return res
    })
    .catch(() => null)
  if (cached) {
    refresh // 后台更新，不 await
    return cached
  }
  return (await refresh) || new Response('离线', { status: 503 })
}
