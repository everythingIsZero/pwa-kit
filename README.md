# pwa-kit

PWA 接入 SDK：把「添加到主屏幕」这件事里**每站必然重复的部分**抽成一份——安装状态判定（core）+ 浏览器适配（web）+ React 绑定（react）+ Service Worker 生成器（sw）。站点只出配置（manifest 品牌字段、缓存规则），不写任何环境分支。

## 为什么需要它

没有它，每个站要各写一遍：Android `beforeinstallprompt` 捕获与 `prompt()`、iOS Safari 无事件只能引导、微信内装不了只能引导转浏览器、已安装检测、`display-mode: standalone` 判断、SW 缓存策略与版本清理……这些逻辑与业务无关且坑多（iOS 判定、prompt 事件时序、缓存泄露）。pwa-kit 把它们收进一处，业务站只消费状态。

## 包结构（单包多入口）

| 入口 | 内容 | 依赖 |
|---|---|---|
| `.` | core：`judgeInstallState`（状态判定纯函数）+ `renderPwaCopy`（文案表） | 零依赖 |
| `./web` | `collectPwaSignals`（信号采集）+ `registerSW`（SW 注册，失败静默） | 浏览器 |
| `./react` | `usePwaInstall()`（安装）+ `usePwaUpdate()`（更新提示，配 `shouldPromptUpdate`）hook | React ≥18（可选 peer） |
| `./ui` | 引导示意图（SVG 字符串资产，`pwaFigureOf(figureId)`）——按终端画的「点哪里」线框图 | 零依赖 |
| `./sw` | SW 生成器：`buildSw(config)` 构建期生成站点 `public/sw.js`（默认不缓存；`version` 必填非空） | 零依赖 |
| `./manifest` | 品牌 manifest 构建器：`buildManifest({name,...})` → PWA manifest 普通对象（默认值已避坑，站点纯覆盖） | 零依赖 |
| `./next` | `withPwaKit(nextConfig)`：给 `/sw.js` 注入 `Cache-Control: no-cache`（合并进 `headers()`，幂等） | 零依赖（构建期 / Node 侧） |

## 引导口径（出资人 2026-10-05 拍板）

- **不主动弹**：引导层只在用户点了「添加到主屏幕」之后出现，绝不在进页/挂载时弹出影响体验。
- **点击后按终端分叉**：`browser-prompt` 态点击直接弹浏览器自己的安装确认框（系统自解释，不插引导层）；`wechat` / `ios-guide` 态点击没有原生反馈，此时弹引导层（示意图 + 三步内短句）。
- **看得懂是硬标准**：core 给结构化引导（`pwaGuideOf(status)` → `{title, steps, figure}`），`./ui` 给配套 SVG 线框图（手机框 + 高亮圈 + 编号箭头 + 菜单高亮项，非厂商截图）；业务站用自己的设计语言渲染。看了更不明白不如不引导。

## 状态矩阵（core 的全部输出）

| status | 场景 | 站点该做什么 |
|---|---|---|
| `installed` | 已在独立窗口运行（`display-mode: standalone` 检测） | **隐藏按钮**（已装） |
| `wechat` | 微信内（装不了） | 显示按钮，点击弹引导：「···」→「在浏览器打开」 |
| `ios-guide` | iPhone/iPad 的 Safari 未安装 | 显示按钮，点击弹引导：分享按钮 →「添加到主屏幕」 |
| `browser-prompt` | Android / PC 端 Chrome、Edge 等，安装事件已到 | 显示按钮，点击直接弹浏览器自己的安装确认框 |
| `pending` | 事件未到：暂不可装，**或早已安装过**（已装后浏览器不再发安装事件——天然覆盖「已添加则隐藏」） | **隐藏按钮**（事件到达时 hook 自动更新） |
| `unsupported` | 无安装路径（iOS 非 Safari 浏览器、桌面 Firefox 等） | **隐藏按钮** |

> **引导是「一个终端一份」**：判定按真实环境信号只输出一个状态，`pwaGuideOf(status)` 只返回当前终端的那一份引导——iOS 用户永远只看到 iOS 的步骤图，Android 用户只看到安装确认框说明，绝不会出现多平台引导列表让用户自己挑。

## 接入四步

```bash
bun add github:everythingIsZero/pwa-kit#v0.1.0   # 或 pnpm add
```

**① manifest**（站点出品牌字段：名称 / 图标 / 主题色）。用 `@hxym18/pwa-kit/manifest` 的 `buildManifest({...})`——默认值已按业界坑项兜好，站点不重复踩。Next.js 用 `app/manifest.ts`：

```ts
// app/manifest.ts
import type { MetadataRoute } from 'next'
import { buildManifest } from '@hxym18/pwa-kit/manifest'

export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    name: '材料报告生成',
    shortName: '材料报告',
    description: 'Word 模板在线填写与 docx 批量生成',
    themeColor: '#1668dc',
    backgroundColor: '#f5f6f8',
  }) as MetadataRoute.Manifest
}
```

**默认值（有据可依）**——站点传同名字段即**纯覆盖**（不做隐式合并，避免「到底哪个生效」）：

| 字段 | 默认 | 理由 |
|---|---|---|
| `id` | `'/'` | 不设时浏览器由 `start_url` 派生应用身份，将来改 `start_url` 会被当成**另一个应用**（pitfalls X15）——故**显式**给 `id` |
| `start_url` | `'/'` | 安装后回到根路由，最常见的入口诉求 |
| `display` | `'standalone'` | 独立窗口打开（无浏览器地址栏），「装成 App」的默认预期 |
| `icons` | 192/512 两档，均 `purpose:'any maskable'` | 缺 `purpose:'any maskable'` 时 Android 主屏会裁掉图标外圈 / 加白边（pitfalls X16） |

`buildManifest` 返回**普通对象**（snake_case 键，无函数 / `undefined`），可直接 `JSON.stringify`；`name` 必填，空则抛 `TypeError`。

> **TS 提示**：Next 14 的 `MetadataRoute.Manifest` 图标 `purpose` 只认单个字面量（`'any' | 'maskable' | …`），不认 W3C 允许的 `'any maskable'` 组合串，故 `return` 处需 `as MetadataRoute.Manifest`（如上例）。纯 JS / 非 Next 站无需断言。

> **iOS 图标**（pitfalls X18）：manifest 的 `icons` 只服务 Android / 桌面；iOS「添加到主屏幕」用的是 `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`（**缺则用页面截图，很丑**）。放好 180×180 的 `public/apple-touch-icon.png`，并在 layout 显式声明 link。

**② Service Worker**：站点**构建期**用 `@hxym18/pwa-kit/sw` 的 `buildSw(config)` 生成 `public/sw.js`（**不提交**，加进 `.gitignore`）。`VERSION` 为**部署/CI 显式注入**的输入（`SW_VERSION`）——在 CI/开发机取 SHA 后传入（如 `docker build --build-arg SW_VERSION=$(git rev-parse --short HEAD)`），**不依赖构建容器内的 `.git`**（容器通常没有）；**为空必须构建报错**，不得静默退化。变更即由 `activate` 清掉全部旧版本缓存。`rules` 只放**内容 hash 的不可变静态**（`cache-first`）；其余同源 GET 默认 `network-only`（**默认不缓存，含导航**；离线非目标，`offlineUrl` 缺省关闭）。

```js
// scripts/gen-sw.mjs（构建前置执行）
import { writeFileSync } from 'node:fs'
import { buildSw } from '@hxym18/pwa-kit/sw'

const config = {
  version: process.env.SW_VERSION, // 部署/CI 注入（--build-arg）；为空 buildSw 抛错，不兜默认
  rules: [{ match: '/_next/static/', strategy: 'cache-first' }], // 仅不可变静态
}
writeFileSync('public/sw.js', buildSw(config))
```

写缓存前一律过硬条件守卫：`status === 200` 且 `Cache-Control` 不含 `no-store|private` 且 `Vary` 不含 `Cookie|Authorization|*`——带 token / 私密响应永不进缓存（`206` 分片亦不缓存）。

**敏感前缀是硬底线**：`/s/` `/r/` `/api/` 命中者**永不缓存、也不从缓存读**（强制 `network-only`），**站点规则不能覆盖**——`rules` 把它们配成 `cache-first` 也压不过；`buildSw` 会把包内 `SENSITIVE_PREFIXES` 注入生成物 `CONFIG`，并**忽略站点传入的同名值**（站点只能加规则，不能删敏感前缀）。该清单与 analytics / auth 跨包同源（workspace `scripts/e2e/prefix-consistency.test.mjs` 核对）。

**③ 注册**（应用入口或根布局的客户端侧，仅生产）：

```ts
import { registerSW } from '@hxym18/pwa-kit/web'
if (process.env.NODE_ENV === 'production') registerSW('/sw.js')
```

**④ 安装按钮**（放你想放的页面，如「我的」）：

```tsx
import { useState } from 'react'
import { usePwaInstall } from '@hxym18/pwa-kit/react'
import { pwaGuideOf } from '@hxym18/pwa-kit'
import { pwaFigureOf } from '@hxym18/pwa-kit/ui'

const pwa = usePwaInstall() // status / canInstall / install() / result
const [guideOpen, setGuideOpen] = useState(false) // 引导层开关由业务站自己维护

// ① Android / PC 端（browser-prompt）：按钮直接弹浏览器安装确认框
{pwa.status === 'browser-prompt' && <button onClick={pwa.install}>添加到主屏幕</button>}

// ② iPhone Safari / 微信内：点按钮后弹「当前终端专属」引导层（图 + 步骤，只有一份）
{(pwa.status === 'ios-guide' || pwa.status === 'wechat') && guideOpen && (() => {
  const guide = pwaGuideOf(pwa.status) // 运行时只会有当前终端的这一份
  return <GuideLayer title={guide.title} steps={guide.steps} svg={pwaFigureOf(guide.figure)} />
})()}
// installed / pending / unsupported → 按钮隐藏（已装或装不了）
```

**⑤ 更新提示**（默认不抢跑 → 长驻 PWA 会久留旧版，站点自己给「有新版本」提示）：

```tsx
import { usePwaUpdate } from '@hxym18/pwa-kit/react'
const { updateAvailable, applyUpdate } = usePwaUpdate('/sw.js')
// updateAvailable：新 SW 已装好、等待接管（首次安装不提示）
{updateAvailable && <button onClick={applyUpdate}>有新版本，点此刷新</button>}
```

`applyUpdate()` 向 waiting SW 发 `SKIP_WAITING`（生成物的 `message` 监听据此 `self.skipWaiting()` 立即接管），并在 `controllerchange` 后自动 `location.reload()`。

**⑥ 一行配置 + 现成注册组件**（可选，替代自己写头配置 / 注册组件）：

```ts
// next.config.mjs —— /sw.js 必须 no-cache：否则 SW 文件被 HTTP 缓存，浏览器延迟发现新版本、升级被卡住。
// withPwaKit 幂等合并站点已有 headers()：不覆盖其他头条目，只碰 /sw.js；站点已自定义 /sw.js 头则尊重不覆盖。
import { withPwaKit } from '@hxym18/pwa-kit/next'
export default withPwaKit({ reactStrictMode: true })
```

```tsx
// 应用入口（客户端）：等价于「③ 注册 + ⑤ 更新提示」的现成组件
import { PwaRegister } from '@hxym18/pwa-kit/react'
<PwaRegister />                                              // 生产注册 /sw.js；有新版本时渲染默认提示按钮
<PwaRegister className="pwa-update" label="有新版本，点此刷新" />
<PwaRegister renderUpdate={({ applyUpdate }) => <MyBanner onClick={applyUpdate} />} />
```

`withPwaKit` 走 `./next` 子路径（构建期 / Node 侧），**不进**浏览器核心根出口；`<PwaRegister/>` 用 hooks，带 `"use client"`，SSR 首帧返回 `null`（不炸 hydration）。

## 作用域声明（引入后页面发生什么 × 不发生什么）

| 时机 | 发生什么 | 明确不发生什么 |
|---|---|---|
| 引入（注册 + hook） | 注册一次 SW（生产 https 才生效，失败静默）；hook 采集信号、监听 `beforeinstallprompt` / `appinstalled` | 不弹任何 UI；不改任何 DOM；开发环境（localhost）不注册 |
| 你渲染按钮并点击 | browser-prompt 态调起浏览器原生安装弹窗；结果回 `result`（accepted / dismissed） | 不自造安装流程（原生弹窗是浏览器唯一正道）；iOS / 微信不承诺弹窗（走引导文案） |
| SW 接管（下次访问起） | 规则命中的不可变静态缓存优先；其余同源 GET 默认 `network-only`（纯网络直通，不缓存） | 不缓存跨域请求；不缓存 POST；不缓存导航（含带 query/token 的路径）；不缓存 `no-store`/`private`/`206`/`Vary: Cookie` 响应；更新不抢跑（等页签全关自然换血，页面不混版本） |
| 移除（不注册 / 删 public/sw.js） | 新访问不再受 SW 控制；已装图标打开的是网站本身 | 不自动卸载已装 PWA（那是用户的系统操作）；旧缓存由浏览器按 `VERSION` 更换时清理 |

## Use Cases

- **内部工具加移动入口**（家庭 / 团队工具站，微信内传播但希望常驻使用）→ 我的页放安装区块，微信内自动转「浏览器打开」引导
- **内容站离线化** → `rules` 收进首屏不可变静态（`cache-first`），并显式配 `offlineUrl` 兜底（默认关闭）
- **带分享 token 的站** → 默认 `network-only` 已覆盖：带 token 的导航不进缓存，无需额外配置

## 与 share-kit 的边界

pwa-kit 只管「装到主屏幕 + SW 缓存」，不管分享（那是 [share-kit](https://github.com/everythingIsZero/share-kit) 的事）。两者可同站共存，互不感知。

## 测试

```bash
npm test   # node --test：状态判定矩阵全覆盖
```
