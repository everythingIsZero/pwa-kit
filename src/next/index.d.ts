/** pwa-kit `./next` 出口类型（构建期；不 import next，纯结构化声明） */

export interface NextHeader {
  key: string
  value: string
}

/** Next `headers()` 的单个条目（`source` + 头数组） */
export interface NextHeaderEntry {
  source: string
  headers: NextHeader[]
  [key: string]: unknown
}

export type NextHeadersResult = NextHeaderEntry[] | Promise<NextHeaderEntry[]>

/** 站点既有 nextConfig 的最小结构面（其余字段原样透传） */
export interface NextConfigLike {
  headers?: NextHeaderEntry[] | (() => NextHeadersResult)
  [key: string]: unknown
}

/**
 * 注入 `/sw.js` 的 `Cache-Control: no-cache`（合并进 `headers()`，幂等；不覆盖站点已有头）。
 * 其余配置字段与站点既有 `headers()` 原样保留；不修改入参对象。
 */
export function withPwaKit<T extends NextConfigLike = NextConfigLike>(
  nextConfig?: T,
): Omit<T, 'headers'> & { headers: () => Promise<NextHeaderEntry[]> }
