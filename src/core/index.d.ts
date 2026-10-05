import { INSTALL_STATUS } from './state.mjs'

export type InstallStatus = (typeof INSTALL_STATUS)[number]

/** 信号快照（由 pwa-kit/web 的 collectPwaSignals 采集；hasPrompt 由 hook 维护） */
export interface PwaSignals {
  isStandalone: boolean
  isWeChat: boolean
  isIOS: boolean
  isMobileSafari: boolean
  hasPrompt: boolean
}

export interface InstallState {
  status: InstallStatus
  canInstall: boolean
}

export function judgeInstallState(signals?: Partial<PwaSignals>): InstallState
export function renderPwaCopy(copyId: string): string
