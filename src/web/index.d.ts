export interface PwaStaticSignals {
  isStandalone: boolean
  isWeChat: boolean
  isIOS: boolean
  isMobileSafari: boolean
}

export function collectPwaSignals(win?: unknown): PwaStaticSignals
export function registerSW(swUrl?: string, options?: { dev?: boolean }): Promise<ServiceWorkerRegistration | null>
