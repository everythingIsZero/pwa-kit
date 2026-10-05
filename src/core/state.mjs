/**
 * state.mjs — 安装状态判定（纯函数，node:test 可完整覆盖）
 *
 * 输入是「信号快照」（由 web/collect.mjs 采集 + react hook 维护时变信号），输出渲染口径。
 * 本模块零宿主依赖（不碰 window / navigator），所有环境分支只出现在这里——消费方不写任何 UA 判断。
 */

/** 安装状态全集（渲染口径，见 copy.mjs 文案表） */
export const INSTALL_STATUS = Object.freeze([
  'installed', // 已在独立窗口运行（standalone）→ 按钮隐藏
  'wechat', // 微信内未安装 → 点按钮弹引导「··· → 浏览器打开」
  'ios-guide', // iPhone/iPad 的 Safari 未安装 → 点按钮弹引导「分享 → 添加到主屏幕」
  'browser-prompt', // Android / PC 端 Chrome、Edge 等：浏览器原生安装框已就绪 → 按钮直接弹安装框
  'pending', // 事件未到：可能暂不可装，也可能早已安装过（已装后浏览器不再发安装事件）→ 按钮隐藏
  'unsupported', // 无安装路径（iOS 非 Safari 浏览器 / 桌面 Firefox 等）→ 按钮隐藏
])

/**
 * 判定安装状态。
 *
 * @param signals 信号快照：
 *   - `isStandalone`：已在独立窗口（navigator.standalone 或 display-mode: standalone）
 *   - `isWeChat`：UA 含 MicroMessenger
 *   - `isMobileSafari`：iOS Safari 本尊（CriOS/FxiOS/EdgiOS 均不算——iOS 第三方浏览器装不了 PWA）
 *   - `hasPrompt`：beforeinstallprompt 事件已触发（时变，由 hook 维护）
 * @returns `{ status, canInstall, guide }`——`guide` 为引导文案 id（仅引导类状态非空）
 */
export function judgeInstallState(signals = {}) {
  const s = signals || {}
  const standalone = s.isStandalone === true
  const wechat = s.isWeChat === true
  const iosSafari = s.isMobileSafari === true
  const prompt = s.hasPrompt === true

  // 判定顺序即优先级：已装 > 微信（无论端，装不了）> iOS Safari 引导 > 浏览器安装框 > 待定
  let status
  if (standalone) status = 'installed'
  else if (wechat) status = 'wechat'
  else if (iosSafari) status = 'ios-guide'
  else if (prompt) status = 'browser-prompt'
  else status = 'pending'

  // pending 且明确无路径的环境 → unsupported：iOS 非 Safari 浏览器没有「添加到主屏幕」。
  // isIOS 但非 Safari、非微信（微信已在前置分支）→ 直接判死，按钮隐藏，别给用户指死路。
  if (status === 'pending' && s.isIOS === true) status = 'unsupported'

  return {
    status,
    canInstall: status === 'browser-prompt',
    guide: status === 'wechat' ? 'pwa.guide.wechat' : status === 'ios-guide' ? 'pwa.guide.ios' : null,
  }
}
