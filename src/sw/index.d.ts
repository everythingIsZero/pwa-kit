export type SwStrategy = 'cache-first' | 'network-first' | 'network-only'

export interface SwRule {
  match: string
  strategy: SwStrategy
}

/** 缓存策略（`strategyFor` / `decideRequest` 的入参） */
export interface SwPolicy {
  rules?: SwRule[]
  defaultStrategy?: string
  /** 敏感前缀**追加**项；`decideRequest` 恒含包内硬底线 `/s/` `/r/` `/api/`，此参数只能加不能减 */
  sensitivePrefixes?: string[]
}

/** `buildSw` 入参；`defaultStrategy` 缺省 `'network-only'`，`skipWaiting`/`clientsClaim` 缺省 false */
export interface SwConfig {
  /** 构建期显式输入（如 `SW_VERSION`）；由部署/CI 注入，为空即抛错（不得静默退化） */
  version: string
  rules: SwRule[]
  defaultStrategy?: SwStrategy
  offlineUrl?: string | null
  skipWaiting?: boolean
  clientsClaim?: boolean
  /** 站点传入值被**忽略**：硬底线恒为包内 `SENSITIVE_PREFIXES`（站点只能加规则，不能删前缀） */
  sensitivePrefixes?: string[]
}

/** 生成 Service Worker 源码（站点构建期写入 `public/sw.js`） */
export function buildSw(config: SwConfig): string

export const STRATEGY: {
  CACHE_FIRST: SwStrategy
  NETWORK_FIRST: SwStrategy
  NETWORK_ONLY: SwStrategy
}

export const DEFAULT_STRATEGY: SwStrategy

/**
 * 敏感前缀硬底线（`/s/` `/r/` `/api/`）：命中者永不缓存/不走缓存，站点 `rules` 压不过。
 * 与 analytics `DEFAULT_DENY_PREFIXES`、auth `SENSITIVE_PREFIXES` 集合相等（跨包 harness 核对）。
 */
export const SENSITIVE_PREFIXES: readonly string[]

export function strategyFor(path: string, policy: SwPolicy): string

export function cacheableResponse(meta: { status?: number; cacheControl?: string; vary?: string }): boolean

export function decideRequest(
  req: { method?: string; mode?: string; sameOrigin?: boolean; path?: string },
  policy: SwPolicy,
): { bypass: true } | { strategy: string }
