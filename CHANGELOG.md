# Changelog

本仓遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本语义按 [SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.1.0] - 2026-10-05

### Added

- 仓初始化：单包多入口 exports map（core / web / react）+ SW 模板（`src/sw/sw.template.js`，拷贝部署）。
- core：`judgeInstallState` 安装状态判定纯函数（六态矩阵：installed / wechat / ios-guide / native / pending / unsupported）+ `renderPwaCopy` 文案表，8 组单测。
- web：`collectPwaSignals`（SSR 安全信号采集）+ `registerSW`（生产 https 守卫、失败静默）。
- react：`usePwaInstall` hook——时变信号（`beforeinstallprompt` / `appinstalled`）维护 + `install()` 调起原生弹窗 + dismissed 后自动回落等待。
- 首个接入方：fang（房屋出租账本）。
