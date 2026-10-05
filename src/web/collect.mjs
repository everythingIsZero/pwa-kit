/**
 * collect.mjs — 环境信号采集（浏览器侧；SSR 传空窗时全给 false 落 pending，不炸 hydration）
 */

/**
 * 采集 PWA 安装相关信号。
 *
 * @param win 宿主 window（缺省当前窗口；SSR / 测试可传 `{}` 或 mock）
 * @returns 时不变信号快照（hasPrompt 是时变的，由 react hook 监听事件维护）
 */
export function collectPwaSignals(win = typeof window !== 'undefined' ? window : {}) {
  const nav = (win && win.navigator) || {}
  const ua = nav.userAgent || ''
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1) // iPadOS 13+ 桌面 UA
  return {
    isStandalone:
      nav.standalone === true ||
      (typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches),
    isWeChat: /MicroMessenger/i.test(ua),
    isIOS,
    // iOS Safari 本尊才装得了：CriOS/FxiOS/EdgiOS/MicroMessenger 全是套壳，无「添加到主屏幕」
    isMobileSafari: isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|MicroMessenger/i.test(ua),
  }
}
