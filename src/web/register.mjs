/**
 * register.mjs — Service Worker 注册（渐进增强：任何失败都静默，绝不影响站点本身）
 */

/**
 * 注册 Service Worker。只在生产 https 下有意义（localhost 开发会被 SW 缓存坑死）。
 *
 * @param swUrl SW 文件地址（默认 /sw.js——由 pwa-kit 的 sw 模板拷贝到站点 public/ 产出）
 * @param options `{ dev }`：`dev: true` 强制注册（本地 http 验证 SW 行为时用）
 * @returns 注册的 registration，或不可用 / 失败时 null（不抛错）
 */
export async function registerSW(swUrl = '/sw.js', options = {}) {
  const canRegister =
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    (options.dev === true ||
      (location.protocol === 'https:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)))
  if (!canRegister) return null
  try {
    return await navigator.serviceWorker.register(swUrl)
  } catch {
    return null // 注册失败静默：PWA 是增强，不是依赖
  }
}
