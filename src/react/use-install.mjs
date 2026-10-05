/**
 * use-install.mjs — React 绑定：usePwaInstall（`pwa-kit/react`）
 *
 * 本包无构建步，只能用 `React.createElement` 级别的 API（useState/useEffect/useCallback），不写 JSX。
 * React 是可选 peer：不 import 本子路径就不会拉起 React。
 *
 * 时序要点：
 * - SSR / 首帧给 pending（collectPwaSignals 在服务端全 false）——不炸 hydration；
 * - `beforeinstallprompt` 是时变信号（Chrome 在「认为可装」的时刻才发）——事件到达才升 native；
 * - prompt 事件被消费（dismissed）后降回等待下一次事件（Chrome 会再发）。
 */
import * as React from 'react'
import { judgeInstallState } from '../core/index.mjs'
import { collectPwaSignals } from '../web/collect.mjs'

/** 未知环境的初始态（SSR / 首帧） */
const PENDING_STATE = Object.freeze({ status: 'pending', canInstall: false, guide: null })

/**
 * 安装能力 hook。
 *
 * @returns `{ status, canInstall, guide, install, result }`
 *   - `status`：见 core `INSTALL_STATUS`（installed / wechat / ios-guide / native / pending / unsupported）
 *   - `install()`：仅 native 态有意义——调起浏览器原生安装弹窗，返回
 *     `{ ok, outcome }`（accepted / dismissed / no-prompt / unknown）
 *   - `result`：最近一次 install() 的 outcome（null = 还没点过；给按钮反馈用）
 */
export function usePwaInstall() {
  const [signals, setSignals] = React.useState(null)
  const [deferred, setDeferred] = React.useState(null)
  const [result, setResult] = React.useState(null)

  React.useEffect(() => {
    setSignals({ ...collectPwaSignals(), hasPrompt: false })
    const onPrompt = (e) => {
      e.preventDefault() // 拦下浏览器自己的安装提示，改用站点自己的按钮
      setDeferred(e)
      setSignals((s) => (s ? { ...s, hasPrompt: true } : s))
    }
    const onInstalled = () => {
      setDeferred(null)
      setSignals((s) => (s ? { ...s, isStandalone: true } : s))
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const state = signals ? judgeInstallState(signals) : PENDING_STATE

  const install = React.useCallback(async () => {
    if (!deferred) return { ok: false, outcome: 'no-prompt' }
    const e = deferred
    setDeferred(null)
    e.prompt()
    const choice = await e.userChoice.catch(() => null)
    // dismissed 后事件已消费：降回等待（Chrome 后续会再发 beforeinstallprompt）
    if (!choice || choice.outcome !== 'accepted') {
      setSignals((s) => (s ? { ...s, hasPrompt: false } : s))
    }
    const outcome = choice ? choice.outcome : 'unknown'
    setResult(outcome)
    return { ok: outcome === 'accepted', outcome }
  }, [deferred])

  return { ...state, install, result }
}
