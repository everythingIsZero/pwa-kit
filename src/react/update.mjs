/**
 * update.mjs — 更新提示判定（纯函数，无 React 依赖）
 *
 * 与 `use-install.mjs` / `collect.mjs` 同约定：纯逻辑独立成模块，便于 node:test 直调；
 * React 绑定（`use-update.mjs`）只负责观察事件并复用本判定。
 */

/**
 * 是否该提示「有新版本」：新 SW 已 `installed`，且页面已被旧 SW 接管（存在 controller）。
 * 首次安装（无 controller）不提示——没有旧版本可更新。
 * @param {{ installed?: boolean, hasController?: boolean }} input
 * @returns {boolean}
 */
export function shouldPromptUpdate({ installed, hasController }) {
  return Boolean(installed) && Boolean(hasController)
}
