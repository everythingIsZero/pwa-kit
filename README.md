# pwa-kit

PWA 接入 SDK：把「添加到主屏幕」这件事里**每站必然重复的部分**抽成一份——安装状态判定（core）+ 浏览器适配（web）+ React 绑定（react）+ 配置驱动的 Service Worker 模板（sw）。站点只出配置（manifest 品牌字段、缓存排除清单），不写任何环境分支。

## 为什么需要它

没有它，每个站要各写一遍：Android `beforeinstallprompt` 捕获与 `prompt()`、iOS Safari 无事件只能引导、微信内装不了只能引导转浏览器、已安装检测、`display-mode: standalone` 判断、SW 缓存策略与版本清理……这些逻辑与业务无关且坑多（iOS 判定、prompt 事件时序、缓存泄露）。pwa-kit 把它们收进一处，业务站只消费状态。

## 包结构（单包多入口）

| 入口 | 内容 | 依赖 |
|---|---|---|
| `.` | core：`judgeInstallState`（状态判定纯函数）+ `renderPwaCopy`（文案表） | 零依赖 |
| `./web` | `collectPwaSignals`（信号采集）+ `registerSW`（SW 注册，失败静默） | 浏览器 |
| `./react` | `usePwaInstall()` hook（时变信号维护 + `install()` 调起原生弹窗） | React ≥18（可选 peer） |
| `src/sw/sw.template.js` | SW 模板：拷贝到站点 `public/sw.js`，改顶部 CONFIG | 部署产物 |

## 状态矩阵（core 的全部输出）

| status | 场景 | 站点该做什么 |
|---|---|---|
| `installed` | 已在独立窗口运行 | 隐藏按钮或显示「已添加」 |
| `wechat` | 微信内（装不了） | 显示引导：右上角「···」→「在浏览器打开」 |
| `ios-guide` | iOS Safari 未安装 | 显示引导：分享按钮 →「添加到主屏幕」 |
| `native` | Chrome/Edge 系，prompt 事件已到 | 显示按钮，点击调 `install()` |
| `pending` | 初始等待态（SSR / 首帧 / 事件未到） | 隐藏按钮（hook 会在事件到达时更新） |
| `unsupported` | 无安装路径（iOS 非 Safari 浏览器等） | 隐藏按钮 |

## 接入四步

```bash
bun add github:everythingIsZero/pwa-kit#v0.1.0   # 或 pnpm add
```

**① manifest**（每站必然自己出：名称 / 图标 / 主题色）。Next.js 用 `app/manifest.ts`：

```ts
import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '你的站名', short_name: '短名',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    theme_color: '#0A84FF', background_color: '#F5F6F8',
    display: 'standalone', start_url: '/',
  }
}
```

**② Service Worker**：把 `src/sw/sw.template.js` 拷到站点 `public/sw.js`，改顶部 `CONFIG`——**发版必改 `VERSION`**；**带 token / 接口路径必须进 `NETWORK_ONLY`**（进缓存 = 离线可读 = 泄露）。

**③ 注册**（应用入口或根布局的客户端侧，仅生产）：

```ts
import { registerSW } from '@hxym18/pwa-kit/web'
if (process.env.NODE_ENV === 'production') registerSW('/sw.js')
```

**④ 安装按钮**（放你想放的页面，如「我的」）：

```tsx
import { usePwaInstall } from '@hxym18/pwa-kit/react'
import { renderPwaCopy } from '@hxym18/pwa-kit'

const pwa = usePwaInstall()
// pwa.status / pwa.canInstall / pwa.guide（文案 id，renderPwaCopy 取文案）/ pwa.install()

{pwa.status === 'native' && <button onClick={pwa.install}>添加到主屏幕</button>}
{(pwa.status === 'ios-guide' || pwa.status === 'wechat') && <p>{renderPwaCopy(pwa.guide)}</p>}
```

## 作用域声明（引入后页面发生什么 × 不发生什么）

| 时机 | 发生什么 | 明确不发生什么 |
|---|---|---|
| 引入（注册 + hook） | 注册一次 SW（生产 https 才生效，失败静默）；hook 采集信号、监听 `beforeinstallprompt` / `appinstalled` | 不弹任何 UI；不改任何 DOM；开发环境（localhost）不注册 |
| 你渲染按钮并点击 | native 态调起浏览器原生安装弹窗；结果回 `result`（accepted / dismissed） | 不自造安装流程（原生弹窗是浏览器唯一正道）；iOS / 微信不承诺弹窗（走引导文案） |
| SW 接管（下次访问起） | 静态资产缓存优先、导航网络优先、`NETWORK_ONLY` 路径纯直通 | 不缓存跨域请求；不缓存 POST；不缓存 `NETWORK_ONLY` 命中路径；更新不抢跑（等页签全关自然换血，页面不混版本） |
| 移除（不注册 / 删 public/sw.js） | 新访问不再受 SW 控制；已装图标打开的是网站本身 | 不自动卸载已装 PWA（那是用户的系统操作）；旧缓存由浏览器按 `VERSION` 更换时清理 |

## Use Cases

- **内部工具加移动入口**（家庭 / 团队工具站，微信内传播但希望常驻使用）→ 我的页放安装区块，微信内自动转「浏览器打开」引导
- **内容站离线化** → SW 模板 `PRECACHE` 首屏 + `OFFLINE_URL` 兜底
- **带分享 token 的站** → `NETWORK_ONLY: [/^\/s\//]`，分享页绝不进缓存

## 与 share-kit 的边界

pwa-kit 只管「装到主屏幕 + SW 缓存」，不管分享（那是 [share-kit](https://github.com/everythingIsZero/share-kit) 的事）。两者可同站共存，互不感知。

## 测试

```bash
npm test   # node --test：状态判定矩阵全覆盖
```
