/**
 * index.mjs — pwa-kit `./sw` 出口
 *
 * 站点构建期用 `buildSw(config)` 生成 `public/sw.js`（不提交）；策略纯函数一并导出供复用。
 */

export { buildSw } from './template.mjs'
export * from './policy.mjs'
