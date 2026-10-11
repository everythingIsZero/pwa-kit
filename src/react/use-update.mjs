/**
 * use-update.mjs — React 绑定：usePwaUpdate（`pwa-kit/react`）
 *
 * 默认不抢跑（install 不 skipWaiting）→ 长驻 PWA 会久留旧版；本 hook 暴露 waiting 供站点提示更新：
 * 观察 `updatefound` / `statechange`，新 SW `installed` 且已有 controller 时 `updateAvailable = true`；
 * `applyUpdate()` 向 waiting 发 `SKIP_WAITING`（生成物的 message 监听会 `self.skipWaiting()` 立即接管），
 * 待 `controllerchange` 后 `location.reload()`。
 *
 * 本包无构建步，只能用 `React.createElement` 级别 API（useState/useEffect/useCallback/useRef），不写 JSX。
 * React 是可选 peer：不 import 本子路径就不会拉起 React。
 */
import * as React from 'react'
import { shouldPromptUpdate } from './update.mjs'

export { shouldPromptUpdate } from './update.mjs'

/**
 * 更新提示 hook。
 * @param {string} swUrl SW 注册路径（与 registerSW 一致）
 * @returns {{ updateAvailable: boolean, applyUpdate: () => void }}
 */
export function usePwaUpdate(swUrl = '/sw.js') {
  const [updateAvailable, setUpdateAvailable] = React.useState(false)
  const registrationRef = React.useRef(null)
  const waitingRef = React.useRef(null)
  const applyingRef = React.useRef(false)

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return undefined
    let disposed = false

    const markWaiting = (worker) => {
      if (!worker) return
      waitingRef.current = worker
      setUpdateAvailable(true)
    }

    const track = (reg) => {
      registrationRef.current = reg
      // 首帧前已装好（waiting 已存在）且页面已被旧 SW 接管 → 提示
      if (reg.waiting && shouldPromptUpdate({ installed: true, hasController: !!navigator.serviceWorker.controller })) {
        markWaiting(reg.waiting)
      }
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          const installed = installing.state === 'installed'
          const hasController = !!navigator.serviceWorker.controller
          if (shouldPromptUpdate({ installed, hasController })) markWaiting(installing)
        })
      })
    }

    // 只有用户主动 applyUpdate 后才在 controllerchange 时刷新（避免首次安装 clientsClaim 触发误刷）
    const onControllerChange = () => {
      if (applyingRef.current && typeof location !== 'undefined') location.reload()
    }

    navigator.serviceWorker
      .getRegistration(swUrl)
      .then((reg) => {
        if (!disposed && reg) track(reg)
      })
      .catch(() => {})

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => {
      disposed = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [swUrl])

  const applyUpdate = React.useCallback(() => {
    const waiting = waitingRef.current || (registrationRef.current && registrationRef.current.waiting)
    if (!waiting) return
    applyingRef.current = true
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }, [])

  return { updateAvailable, applyUpdate }
}
