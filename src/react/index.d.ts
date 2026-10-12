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

/** `<PwaRegister/>` 入参 */
export interface PwaRegisterProps {
  /** SW 注册路径（默认 `/sw.js`） */
  swUrl?: string
  /** 强制注册（本地 http 验证 SW 行为时用；生产 https 下无需开） */
  dev?: boolean
  /** 默认更新按钮的 className（用 `renderUpdate` 自定义时忽略） */
  className?: string
  /** 默认更新按钮文案 */
  label?: string
  /** 自定义更新提示渲染；`applyUpdate` 触发立即接管刷新 */
  renderUpdate?: (api: { applyUpdate: () => void }) => import('react').ReactNode
}

/**
 * 生产注册 SW + 新版本更新提示（客户端组件）。
 * 无更新时返回 null；有更新默认渲染一个按钮，可用 `renderUpdate` 自绘。
 */
export function PwaRegister(props?: PwaRegisterProps): import('react').ReactNode
