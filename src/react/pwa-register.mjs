"use client";
/**
 * pwa-register.mjs — `<PwaRegister/>`：生产注册 SW + 新版本更新提示（React 客户端组件）
 *
 * 复用既有能力：`registerSW`（web，失败静默）+ `usePwaUpdate`（react，默认不抢跑，waiting 时提示）。
 * 业务站把原来逐站手写的「注册 + 更新提示」组件换成 `<PwaRegister/>` 即可。
 *
 * 为什么 `"use client"`：组件用 hooks（useEffect），必须在客户端边界内（参考 auth `src/ui.mjs`）。
 * SSR 安全：effect 只在浏览器跑；`usePwaUpdate` 首帧 `updateAvailable=false` → 默认渲染 null，
 * 不炸 hydration；`registerSW` 在非生产 / 非 https 静默返回 null。
 *
 * 本包无构建步，只能用 `React.createElement` 级别 API，不写 JSX。React 是可选 peer：
 * 不 import 本子路径（`@hxym18/pwa-kit/react`）就不会拉起 React。
 */
import * as React from 'react'
import { registerSW } from '../web/register.mjs'
import { usePwaUpdate } from './use-update.mjs'

/**
 * @param {{
 *   swUrl?: string,
 *   dev?: boolean,
 *   className?: string,
 *   label?: string,
 *   renderUpdate?: (api: { applyUpdate: () => void }) => React.ReactNode,
 * }} [props]
 */
export function PwaRegister({
  swUrl = '/sw.js',
  dev = false,
  className,
  label = '有新版本，点此刷新',
  renderUpdate,
} = {}) {
  React.useEffect(() => {
    // `process` 守卫：本包无构建步，非静态替换的打包器（浏览器）里裸 `process.env` 会抛
    // `process is not defined`；`?.` 再兜 `process.env` 缺失（如被 shim 成 undefined）。
    const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
    if (dev || isProd) {
      registerSW(swUrl, dev ? { dev: true } : undefined)
    }
  }, [swUrl, dev])

  const { updateAvailable, applyUpdate } = usePwaUpdate(swUrl)
  if (!updateAvailable) return null

  if (typeof renderUpdate === 'function') return renderUpdate({ applyUpdate })
  return React.createElement(
    'button',
    { type: 'button', className, onClick: applyUpdate },
    label,
  )
}
