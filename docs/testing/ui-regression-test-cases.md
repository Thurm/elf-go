# UI 专项回归测试用例

## 目标

- 为 UI 改造提供独立于系统大回归之外的专项保护。
- 优先覆盖宿主层一致性、菜单/对话可用性，以及后续 HUD 的扩展位。

## 当前专项测试文件

| 文件 | 覆盖范围 | 优先级 |
|------|----------|--------|
| `docs/tests/ui-shop-host.spec.ts` | 商店挂载层、确认弹层宿主、出售页数据渲染 | P0 |
| `docs/tests/ui-dialog-menu-visual.spec.ts` | 菜单开关、对话展示与键盘推进 | P0 |
| `docs/tests/ui-map-hud.spec.ts` | 地图 HUD 区域/资金/领队状态与交互提示 | P0 |
| `docs/tests/ui-map-camera-transition.spec.ts` | 镜头 dead zone、平滑跟随与切图后 snap | P1 |

## 用例清单

### 1. 商店宿主层

| ID | 用例名称 | 断言重点 |
|----|---------|---------|
| UI-001 | 商店界面应挂载到 `#ui-layer` | `#ui-layer > #shop-ui` 存在，`body > #shop-ui` 不存在 |
| UI-002 | 商店关闭后应清理宿主层 DOM | 关闭商店后 `#shop-ui` 不存在，状态回到 `MAP` |
| UI-003 | 购买确认弹层应复用 `#ui-layer` | `.shop-dialog-overlay` 父节点为 `#ui-layer` |
| UI-004 | 出售页应能读取背包中的可售物品 | 切到出售页后可看到背包物品文本 |

### 2. 菜单与对话

| ID | 用例名称 | 断言重点 |
|----|---------|---------|
| UI-005 | 地图菜单应维持稳定的打开/关闭状态切换 | `MENU -> MAP` 切换闭环，主菜单首项正确 |
| UI-006 | 对话框应展示 speaker/text 并响应键盘推进 | `speaker`、`text` 非空，按 `Enter` 后切到下一节点 |

### 3. 地图 HUD

| ID | 用例名称 | 断言重点 |
|----|---------|---------|
| UI-007 | 地图 HUD 应返回区域、资金、领队与默认提示 | `mapName`、`money`、`leadMonster`、`prompt` 正确 |
| UI-008 | 地图 HUD 应根据 NPC 与传送点切换交互提示 | 面向 NPC 时提示对话，面向 portal 时提示进入区域 |

### 4. 镜头与切图

| ID | 用例名称 | 断言重点 |
|----|---------|---------|
| UI-009 | 镜头应保留 dead zone，小范围位移不立即推镜 | 轻微位移后 camera 不应跳动 |
| UI-010 | 镜头应平滑追随远距离位移，并在切图完成后 snap 到目标位置 | camera 先平滑追随，再在切图结束后与 target 对齐 |
| UI-011 | 从新手村进入村长家时应先完成退场，再提交新地图 | 退场中 `renderMapId/sceneMapId` 仍为 `town_01`，完成后才切到 `house_01` |
| UI-012 | 从 1 号道路回新手村时应使用一致 fade 转场并在结束后完成落位 | `route_01 -> town_01` 全程 fade，结束后落位到 `(1, 15)` |

## 后续预留

| 文件 | 计划覆盖 |
|------|----------|
| `docs/tests/ui-battle-visual.spec.ts` | 战斗菜单与结果面板视觉 smoke |

## 执行方式

```bash
npm --prefix docs exec playwright test docs/tests/ui-shop-host.spec.ts docs/tests/ui-dialog-menu-visual.spec.ts docs/tests/ui-map-hud.spec.ts docs/tests/ui-map-camera-transition.spec.ts
```

## 维护原则

- 优先使用状态与 DOM 断言，降低视觉波动带来的 flaky。
- 只有当 UI 结构稳定后，再为局部区域补截图基线。
- 将 UI 专项回归与系统大回归解耦，便于 UI 改造小步快跑。
