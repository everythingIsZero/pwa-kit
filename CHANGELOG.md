# Changelog

本仓遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本语义按 [SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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
