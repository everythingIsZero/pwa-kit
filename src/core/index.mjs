/**
 * index.mjs — pwa-kit core 公共出口（包入口 `.`）
 *
 * 决策层单源：安装状态判定 + 文案表。零宿主依赖（不 import window / navigator），
 * node:test 可完整覆盖。环境信号采集在 `pwa-kit/web`，React 绑定在 `pwa-kit/react`。
 */

export * from './state.mjs'
export * from './copy.mjs'
