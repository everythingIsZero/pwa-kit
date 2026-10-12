// test/fixtures/use-update-mock.mjs — `usePwaUpdate` 可控替身
//
// 仅供 `pwa-register.test.mjs` 经 `registerHooks` 把 `./use-update.mjs` 换成本模块，
// 让测试直接切换 `updateAvailable` / `applyUpdate`，从而用**真实 React 渲染**覆盖
// `<PwaRegister/>` 的各渲染分支（无更新 → null / 有更新 → 按钮 / renderUpdate 自绘）。
export const updateState = {
  updateAvailable: false,
  applyUpdate: () => {},
}

export function usePwaUpdate() {
  return updateState
}

export function shouldPromptUpdate() {
  return true
}
