# UI 改造实施计划

> 创建日期：2026-04-03
> 当前目标：补齐 UI 测试护栏、统一 UI 宿主层、为后续 HUD 与样式 token 收敛铺路。

## 背景

- 当前 UI 由 `UIManager`、`MenuUI`、`ShopUI` 三套入口共同承担。
- `index.html` 已提供 `#ui-layer`，但 `src/shop/ShopUI.ts` 仍直接挂载到 `document.body`，造成宿主层分叉。
- Playwright 已在 `docs/tests/example.spec.ts` 建立集成回归，但 UI 专项覆盖不足，尤其缺少商店宿主层与对话/菜单回归。

## 阶段拆分

### 阶段 1：UI 测试护栏先行

**目标**
- 为 UI 改造建立最小自动化保护，优先覆盖最容易回归的宿主层与状态切换。

**涉及文件**
- `docs/tests/ui-shop-host.spec.ts`
- `docs/tests/ui-dialog-menu-visual.spec.ts`
- `docs/tests/helpers/game-helpers.ts`
- `docs/testing/regression-test-cases.md`
- `docs/testing/ui-regression-test-cases.md`

**覆盖重点**
- `ShopUI` 是否挂载到 `#ui-layer`
- 商店关闭后 DOM 是否正确清理
- 商店确认弹层是否跟随同一宿主层
- 地图菜单打开/关闭是否稳定
- 对话框是否正确展示 `speaker/text` 并响应键盘推进

### 阶段 2：统一 UI 宿主层

**目标**
- 将 `ShopUI` 与其确认弹层统一挂载到 `#ui-layer`，形成单一 UI 宿主层。

**涉及文件**
- `src/shop/ShopUI.ts`
- `css/style.css`
- `index.html`

**关键改法**
- `ShopUI` 创建容器时优先使用 `document.getElementById('ui-layer')`
- 购买/出售确认弹层同样挂到 `#ui-layer`
- 样式从视口级 `fixed` 调整为宿主层级覆盖，避免 DOM 宿主与视觉定位冲突

### 阶段 3：后续 UI 收口

**目标**
- 在宿主层统一后继续收口职责和视觉。

**优先级**
1. `UIManager` / `MenuUI` 职责收口
2. UI token 收敛（颜色、边框、字号、字体）
3. 地图 HUD 接入与回归测试

## 实施顺序建议

1. 先补 `ShopUI` 与菜单/对话回归测试
2. 再改 `ShopUI` 挂载与弹层宿主
3. 最后更新文档并跑完整的 `typecheck`、`build`、`test:e2e`

## 验证方式

- `npm --prefix docs exec playwright test docs/tests/ui-shop-host.spec.ts docs/tests/ui-dialog-menu-visual.spec.ts`
- `npm run typecheck`
- `npm run build`

## 后续接口边界

- `UIManager`：对话、通知、地图 HUD
- `MenuUI`：主菜单、图鉴、存档/读档等系统菜单
- `ShopUI`：仅负责商店 DOM UI，不直接扩张到全局 UI owner
