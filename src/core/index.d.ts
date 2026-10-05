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

/** 按终端的结构化引导数据（wechat / ios-guide / browser-prompt；其余状态返回 null） */
export interface PwaGuideData {
  title: string
  steps: string[]
  /** 对应 pwa-kit/ui pwaFigureOf 的图示 id */
  figure: string
}

export function pwaGuideOf(status: InstallStatus): PwaGuideData | null
