# Changelog

本仓遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本语义按 [SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.4.0] - 2026-10-11

### Added

- **`./manifest` 出口 + `buildManifest(input)`**（spec §6.5 品牌 manifest 扩展面）：生成 PWA manifest 普通对象（snake_case，无函数/undefined，可 JSON 序列化），Next `app/manifest.ts` 可直接返回。默认值取业界坑项——显式 `id:'/'`（X15）、`start_url:'/'`、`display:'standalone'`、图标 192/512 + `purpose:'any maskable'`（X16）；站点传值即**纯覆盖**，`name` 必填。纯函数、零依赖。

### Changed（行为变更）

- **敏感前缀成为硬底线（S1）**：`SENSITIVE_PREFIXES`（`/s/` `/r/` `/api/`）在 `decideRequest` 内强制 `network-only`——**站点 `rules` 把敏感前缀配成 `cache-first` 也不生效**（站点只能加不能减）；`buildSw` 把该清单注入生成物的 `CONFIG.sensitivePrefixes`，忽略站点传入的同名值。

### Chore

- 包内**契约副本**声明（`hxym18.contracts`）：`sensitive-prefixes@1`、`cache-policy@1`。

## [0.3.1] - 2026-10-11

### Fixed

- SW 策略：导航请求永不缓存（`navigate` → `network-only`），避免旧 HTML 命中缓存。
- SW 策略：`Cache-Control` 参数化形式识别（如 `private="set-cookie"`）——`private` 前缀即视为不可缓存。
- `buildSw` 强制非空 `version`：缺失或空串直接抛错，不兜默认（部署边界由 `test -n "$SW_VERSION"` 拦）。

### Added

- 更新提示支持：SW 处理 `SKIP_WAITING` 消息；新增 `usePwaUpdate` hook 与 `shouldPromptUpdate` 纯函数。

## [0.3.0] - 2026-10-11

### Added

- `./sw` 出口 + Service Worker 生成器：站点构建期经 `buildSw(config)` 生成 `sw.js`，替代人手拷贝模板（`sw.js` 不提交）。

### Changed

- **安全修正**：SW 默认不缓存任何响应（含导航）；仅内容 hash 不可变静态走 `cache-first`，可缓存须 `200` 且 `Cache-Control` 无 `no-store|private`、`Vary` 不含 `Cookie|Authorization|*`。

## [0.2.2] - 2026-10-08

### Added

- `typesVersions`：兼容经典 `moduleResolution: node` 的子路径（`web` / `react` / `ui`）类型解析。

## [0.2.1] - 2026-10-05

### Fixed

- core 类型声明补 `pwaGuideOf`（v0.2.0 漏声明——TS 消费方导入直接编译失败）。
- README 接入示例修正：`guideOpen` 不是 hook 返回值（引导层开关由业务站自己维护），原示例照抄会拿到 undefined。

## [0.2.0] - 2026-10-05

### Added

- 引导能力三件套（出资人拍板口径：**点击后再引导、不主动弹、一个终端一份**）：
  - core `pwaGuideOf(status)`：按终端的结构化引导数据（`{title, steps, figure}`，wechat / ios-guide / browser-prompt 三态全覆盖，运行时只输出当前终端那一份）。
  - 新入口 `./ui`：`pwaFigureOf(figureId)` SVG 示意图资产（微信「···→浏览器打开」、iOS「分享→添加到主屏幕」、Chrome 系原生安装确认，三张 UI 线框图，内嵌无外部资产）。
  - 引导渲染归业务站（用自己设计语言），本包只出数据 + 图示。

### Changed

- 状态名 `native` → `browser-prompt`（出资人反馈：术语黑话，改成人话——Android / PC 端 Chrome、Edge 等能弹浏览器安装框的环境）。

## [0.1.0] - 2026-10-05

### Added

- 仓初始化：单包多入口 exports map（core / web / react）+ SW 模板（`src/sw/sw.template.js`，拷贝部署）。
- core：`judgeInstallState` 安装状态判定纯函数（六态矩阵：installed / wechat / ios-guide / native / pending / unsupported）+ `renderPwaCopy` 文案表，8 组单测。
- web：`collectPwaSignals`（SSR 安全信号采集）+ `registerSW`（生产 https 守卫、失败静默）。
- react：`usePwaInstall` hook——时变信号（`beforeinstallprompt` / `appinstalled`）维护 + `install()` 调起原生弹窗 + dismissed 后自动回落等待。
- 首个接入方：fang（房屋出租账本）。
