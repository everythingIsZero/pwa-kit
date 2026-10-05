// hooks 返回类型（自包含声明，不跨目录 import）
export type InstallStatus = 'installed' | 'wechat' | 'ios-guide' | 'browser-prompt' | 'pending' | 'unsupported'

export interface UsePwaInstall {
  status: InstallStatus
  canInstall: boolean
  guide: 'pwa.guide.wechat' | 'pwa.guide.ios' | null
  install: () => Promise<{ ok: boolean; outcome: 'accepted' | 'dismissed' | 'no-prompt' | 'unknown' }>
  result: 'accepted' | 'dismissed' | 'unknown' | null
}

export function usePwaInstall(): UsePwaInstall
