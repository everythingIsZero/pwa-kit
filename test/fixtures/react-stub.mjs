// test/fixtures/react-stub.mjs — React 最小桩
//
// 本仓不装 React（可选 peer，仅 devDependency 级亦可省）；本包不含构建步，只需在
// `node --test` 中把裸 `react` 解析到此处，即可加载 `@hxym18/pwa-kit/react` 出口、
// 验证导出存在与 `"use client"` 标记。**不实现运行时行为**，不用于渲染。
export const useState = () => [undefined, () => {}]
export const useEffect = () => {}
export const useCallback = (fn) => fn
export const useRef = () => ({ current: null })
export const createElement = () => null
