/**
 * copy.mjs — 文案与引导数据（唯一文案源，消费方不硬编码）
 *
 * 引导是结构化数据（标题 + 步骤 + 图示 id）：多数用户不知道「PWA / 添加到主屏幕」是什么，
 * 每个环境给带图的分步引导（图示在 `pwa-kit/ui` 的 figures 里，SVG 内嵌、无外部资产）。
 */

const COPY = Object.freeze({
  "pwa.action.install": "添加到主屏幕",
  "pwa.action.installed": "已添加到主屏幕",
  "pwa.install.accepted": "已添加到主屏幕，去主屏看看吧",
  "pwa.install.dismissed": "没有添加，需要时再点这个按钮",
})

/** 各状态的分步引导（按终端区分；figure 对应 ui/figures 的 SVG 图示，null = 无图） */
const GUIDES = Object.freeze({
  wechat: {
    figure: "wechat-open",
    title: "在微信里装不了，先换个浏览器打开",
    steps: [
      "点微信右上角的「···」按钮",
      "在菜单里选「在浏览器打开」",
      "回到这个页面，再点「添加到主屏幕」",
    ],
  },
  "ios-guide": {
    figure: "ios-homescreen",
    title: "两步把它装到主屏幕，像 App 一样用",
    steps: ["点 Safari 底部的「分享」按钮", "在菜单里选「添加到主屏幕」"],
  },
  "browser-prompt": {
    figure: "native-prompt",
    title: "点按钮后，浏览器会弹一个安装确认框",
    steps: ["点「添加到主屏幕」按钮", "在浏览器弹出的确认框里点「安装」"],
  },
})

/** 取按钮 / 结果文案；未知 id 原样返回（调试可见），不抛错 */
export function renderPwaCopy(copyId) {
  return Object.prototype.hasOwnProperty.call(COPY, copyId) ? COPY[copyId] : String(copyId)
}

/** 取某状态的结构化引导（wechat / ios-guide / browser-prompt）；未知状态返回 null */
export function pwaGuideOf(status) {
  return Object.prototype.hasOwnProperty.call(GUIDES, status) ? GUIDES[status] : null
}
