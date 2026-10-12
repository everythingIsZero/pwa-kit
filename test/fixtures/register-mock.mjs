// test/fixtures/register-mock.mjs — `registerSW` 可控替身
//
// 仅供 `pwa-register.test.mjs` 经 `registerHooks` 把 `../web/register.mjs` 换成本模块，
// 以便断言「生产态 effect 确实调用了 registerSW」而不依赖真实 Service Worker 环境。
// 记录每次调用的 `{ swUrl, options }`，测试按需读取/清空。
export const registerCalls = []

export function registerSW(swUrl, options) {
  registerCalls.push({ swUrl, options })
  return Promise.resolve(null)
}
