/**
 * index.mjs — pwa-kit web 出口（包入口 `./web`）
 *
 * 浏览器适配层：信号采集 + SW 注册。安装状态判定全在 core（`pwa-kit`），本入口不做环境判断。
 */

export * from './collect.mjs'
export * from './register.mjs'
