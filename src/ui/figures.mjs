/**
 * figures.mjs — 引导示意图（SVG 字符串内嵌，通用包零外部资产）
 *
 * 风格：中性灰 UI 线框 + 蓝色 #0A84FF 高亮圈/箭头 + 编号气泡，手机框按通用浏览器 UI 画
 * （非任何厂商截图，避开版权；高亮的是「要点的那一下」）。SVG 无固定宽高，容器给多大画多大。
 * 图不含文字步骤（步骤文字由消费方按 core.pwaGuideOf 渲染，图只示意「点哪里」）。
 */

/** 微信内：右上角「···」→ 菜单「在浏览器打开」 */
const WECHAT_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 240" role="img" aria-label="微信内先点右上角三个点，再选在浏览器打开">
  <defs><marker id="pk-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#0A84FF"/></marker></defs>
  <rect x="10" y="10" width="200" height="220" rx="24" fill="#FFFFFF" stroke="#D8DCE3" stroke-width="2"/>
  <rect x="22" y="22" width="176" height="34" rx="8" fill="#F5F6F8"/>
  <text x="34" y="44" font-family="-apple-system,sans-serif" font-size="14" fill="#8E99A8">‹</text>
  <text x="110" y="44" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="12" fill="#8E99A8">页面标题</text>
  <g>
    <circle cx="180" cy="39" r="16" fill="none" stroke="#0A84FF" stroke-width="2.5"/>
    <circle cx="174" cy="39" r="2.2" fill="#0A84FF"/><circle cx="180" cy="39" r="2.2" fill="#0A84FF"/><circle cx="186" cy="39" r="2.2" fill="#0A84FF"/>
  </g>
  <rect x="40" y="90" width="140" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="40" y="110" width="100" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="40" y="130" width="120" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="40" y="170" width="140" height="30" rx="8" fill="#E7EAEF"/>
  <path d="M186 62 C 240 66, 258 78, 276 92" fill="none" stroke="#0A84FF" stroke-width="2.5" marker-end="url(#pk-arrow)"/>
  <circle cx="330" cy="66" r="12" fill="#0A84FF"/><text x="330" y="71" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">1</text>
  <rect x="278" y="100" width="150" height="120" rx="14" fill="#FFFFFF" stroke="#D8DCE3" stroke-width="2" filter="drop-shadow(0 4px 10px rgba(15,23,42,.10))"/>
  <rect x="290" y="114" width="126" height="28" rx="7" fill="#F5F6F8"/>
  <text x="298" y="133" font-family="-apple-system,sans-serif" font-size="11" fill="#8E99A8">刷新</text>
  <g>
    <rect x="290" y="150" width="126" height="30" rx="7" fill="#E8F2FF"/>
    <text x="298" y="170" font-family="-apple-system,sans-serif" font-size="11" fill="#0A84FF" font-weight="600">在浏览器打开</text>
    <circle cx="405" cy="165" r="11" fill="none" stroke="#0A84FF" stroke-width="2.5"/>
  </g>
  <rect x="290" y="188" width="126" height="28" rx="7" fill="#F5F6F8"/>
  <text x="298" y="207" font-family="-apple-system,sans-serif" font-size="11" fill="#8E99A8">复制链接</text>
  <circle cx="352" cy="228" r="12" fill="#0A84FF"/><text x="352" y="233" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">2</text>
</svg>`

/** iOS Safari：底部分享按钮 → 菜单「添加到主屏幕」 */
const IOS_HOMESCREEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 240" role="img" aria-label="点 Safari 底部分享按钮，再选添加到主屏幕">
  <defs><marker id="pk-arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#0A84FF"/></marker></defs>
  <rect x="10" y="10" width="200" height="220" rx="24" fill="#FFFFFF" stroke="#D8DCE3" stroke-width="2"/>
  <rect x="40" y="36" width="140" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="40" y="56" width="104" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="40" y="90" width="140" height="60" rx="8" fill="#F5F6F8"/>
  <rect x="52" y="104" width="44" height="30" rx="4" fill="#E7EAEF"/>
  <rect x="52" y="140" width="116" height="8" rx="4" fill="#E7EAEF" transform="translate(0,6)"/>
  <rect x="22" y="186" width="176" height="32" rx="8" fill="#F5F6F8"/>
  <g>
    <rect x="86" y="192" width="20" height="20" rx="4" fill="#8E99A8"/>
    <path d="M96 196 v9 M92 199 l4 -4 l4 4" stroke="#FFFFFF" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="96" cy="202" r="17" fill="none" stroke="#0A84FF" stroke-width="2.5"/>
  </g>
  <path d="M118 202 C 170 202, 200 168, 252 132" fill="none" stroke="#0A84FF" stroke-width="2.5" marker-end="url(#pk-arrow2)"/>
  <circle cx="88" cy="164" r="12" fill="#0A84FF"/><text x="88" y="169" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">1</text>
  <rect x="252" y="96" width="170" height="112" rx="14" fill="#FFFFFF" stroke="#D8DCE3" stroke-width="2" filter="drop-shadow(0 4px 10px rgba(15,23,42,.10))"/>
  <rect x="264" y="108" width="146" height="26" rx="7" fill="#F5F6F8"/>
  <text x="272" y="125" font-family="-apple-system,sans-serif" font-size="11" fill="#8E99A8">隔空投送</text>
  <g>
    <rect x="264" y="142" width="146" height="28" rx="7" fill="#E8F2FF"/>
    <rect x="272" y="147" width="18" height="18" rx="4" fill="#0A84FF"/>
    <path d="M281 151 v7 M278 153.5 l3 -3 l3 3" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="298" y="161" font-family="-apple-system,sans-serif" font-size="11" fill="#0A84FF" font-weight="600">添加到主屏幕</text>
    <circle cx="400" cy="156" r="11" fill="none" stroke="#0A84FF" stroke-width="2.5"/>
  </g>
  <rect x="264" y="176" width="146" height="26" rx="7" fill="#F5F6F8"/>
  <text x="272" y="193" font-family="-apple-system,sans-serif" font-size="11" fill="#8E99A8">拷贝</text>
  <circle cx="338" cy="218" r="12" fill="#0A84FF"/><text x="338" y="223" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">2</text>
</svg>`

/** Chrome 系：安装按钮 → 浏览器原生确认弹窗（browser-prompt 态，一图带过） */
const NATIVE_PROMPT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 240" role="img" aria-label="点安装按钮后浏览器会弹出安装确认">
  <defs><marker id="pk-arrow3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#0A84FF"/></marker></defs>
  <rect x="10" y="14" width="280" height="180" rx="16" fill="#FFFFFF" stroke="#D8DCE3" stroke-width="2"/>
  <rect x="10" y="14" width="280" height="34" rx="16" fill="#F5F6F8"/>
  <rect x="24" y="24" width="120" height="14" rx="7" fill="#E7EAEF"/>
  <g>
    <rect x="256" y="22" width="20" height="20" rx="5" fill="#0A84FF"/>
    <rect x="262" y="27" width="8" height="7" rx="1.5" fill="#FFFFFF"/>
    <path d="M266 36 v4 M264 38 l2 2 l2 -2" stroke="#FFFFFF" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <circle cx="266" cy="32" r="15" fill="none" stroke="#0A84FF" stroke-width="2.5"/>
  </g>
  <rect x="30" y="66" width="150" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="30" y="86" width="110" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="30" y="106" width="130" height="10" rx="5" fill="#E7EAEF"/>
  <rect x="30" y="136" width="90" height="30" rx="8" fill="#E8F2FF"/>
  <text x="75" y="155" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="11" fill="#0A84FF" font-weight="600">添加到主屏幕</text>
  <path d="M226 110 C 268 120, 292 132, 316 146" fill="none" stroke="#0A84FF" stroke-width="2.5" marker-end="url(#pk-arrow3)"/>
  <circle cx="196" cy="104" r="12" fill="#0A84FF"/><text x="196" y="109" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">1</text>
  <rect x="316" y="140" width="114" height="86" rx="14" fill="#FFFFFF" stroke="#D8DCE3" stroke-width="2" filter="drop-shadow(0 4px 10px rgba(15,23,42,.10))"/>
  <rect x="328" y="152" width="24" height="24" rx="6" fill="#E8F2FF"/>
  <rect x="332" y="156" width="16" height="14" rx="2" fill="#0A84FF"/>
  <rect x="336" y="174" width="8" height="5" rx="1" fill="#0A84FF" transform="translate(0,-1)"/>
  <text x="360" y="169" font-family="-apple-system,sans-serif" font-size="11" fill="#3D4450" font-weight="600">安装应用？</text>
  <rect x="328" y="186" width="44" height="20" rx="6" fill="#F5F6F8"/>
  <text x="350" y="200" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="10" fill="#8E99A8">取消</text>
  <rect x="378" y="186" width="44" height="20" rx="6" fill="#0A84FF"/>
  <text x="400" y="200" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="10" fill="#FFFFFF" font-weight="600">安装</text>
  <circle cx="373" cy="196" r="12" fill="#0A84FF"/><text x="373" y="201" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">2</text>
</svg>`

/** figure id → SVG 字符串 */
export const FIGURES = Object.freeze({
  "wechat-open": WECHAT_OPEN,
  "ios-homescreen": IOS_HOMESCREEN,
  "native-prompt": NATIVE_PROMPT,
})

/** 取图示 SVG；未知 id 返回空串（消费方判空隐藏图区） */
export function pwaFigureOf(figureId) {
  return Object.prototype.hasOwnProperty.call(FIGURES, figureId) ? FIGURES[figureId] : ""
}
