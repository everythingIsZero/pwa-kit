/**
 * copy.mjs — 文案表（唯一文案源，消费方不硬编码）
 */

const COPY = Object.freeze({
  'pwa.action.install': '添加到主屏幕',
  'pwa.action.installed': '已添加到主屏幕',
  'pwa.guide.wechat': '当前在微信内，无法直接安装：点右上角「···」→「在浏览器打开」，再按提示添加到主屏幕',
  'pwa.guide.ios': '点 Safari 底部的「分享」按钮，选「添加到主屏幕」',
  'pwa.install.accepted': '已添加到主屏幕，去主屏看看吧',
  'pwa.install.dismissed': '没有添加，需要时再点这个按钮',
})

/** 取文案；未知 id 原样返回（调试可见），不抛错 */
export function renderPwaCopy(copyId) {
  return Object.prototype.hasOwnProperty.call(COPY, copyId) ? COPY[copyId] : String(copyId)
}
