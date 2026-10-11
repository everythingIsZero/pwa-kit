// hooks 返回类型（自包含声明，不跨目录 import）
export type InstallStatus = 'installed' | 'wechat' | 'ios-guide' | 'browser-prompt' | 'pending' | 'unsupported'

export interface UsePwaInstall {
  status: InstallStatus
  canInstall: boolean
  install: () => Promise<{ ok: boolean; outcome: 'accepted' | 'dismissed' | 'no-prompt' | 'unknown' }>
  result: 'accepted' | 'dismissed' | 'unknown' | null
}

export function usePwaInstall(): UsePwaInstall

export interface UsePwaUpdate {
  /** 有新版本已装好、等待接管（默认不抢跑，需用户确认） */
  updateAvailable: boolean
  /** 触发立即接管：向 waiting SW 发 SKIP_WAITING，controllerchange 后刷新页面 */
  applyUpdate: () => void
}

export function usePwaUpdate(swUrl?: string): UsePwaUpdate

/** 是否该提示更新：新 SW installed 且已有 controller（非首次安装） */
export function shouldPromptUpdate(input: { installed?: boolean; hasController?: boolean }): boolean
