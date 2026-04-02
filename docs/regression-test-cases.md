# 回归测试用例

## 测试框架

- **框架**: Playwright
- **配置**: docs/playwright.config.ts
- **测试文件**: docs/tests/example.spec.ts
- **基础URL**: http://127.0.0.1:4173

---

## 测试用例列表

### 1. 模块集成测试

| ID | 用例名称 | 测试内容 |
|----|---------|---------|
| TC-001 | 模块集成测试页应全部通过 | 打开 test.html，点击运行所有测试，验证 0 失败 |

### 2. 游戏启动与初始化

| ID | 用例名称 | 测试内容 |
|----|---------|---------|
| TC-002 | 游戏启动后应完成标题态初始化 | 验证 state=TITLE, party>0, map=town_01, canvas=800x600 |
| TC-003 | 按 Enter 后应进入地图态并初始化地图系统 | 验证 state=MAP, mapSystem.initialized=true, 玩家位置 (15,15) |

### 3. 菜单系统

| ID | 用例名称 | 测试内容 |
|----|---------|---------|
| TC-004 | 地图态按 Escape 应打开菜单，再次按下应关闭菜单 | 验证菜单打开/关闭闭环，菜单首项为"继续游戏" |
| TC-005 | 地图菜单关闭后进入战斗时不应残留旧菜单状态 | 验证战斗时 mapMenuState=closed, battleMenuType=action |
| TC-006 | 菜单关闭后经历战斗返回地图，仍可重新打开地图菜单 | 验证战斗返回后菜单可正常重新打开 |

### 4. 对话系统

| ID | 用例名称 | 测试内容 |
|----|---------|---------|
| TC-007 | 对话系统应能按节点展示并推进欢迎对话 | 验证 welcome 对话节点推进，speaker=村民 |
| TC-008 | 与村民对话应完整经历对话前、对话中和对话完成阶段 | 验证完整对话生命周期，结束后返回 MAP 态 |
| TC-009 | 与村长完整对话后应获得初始怪兽、物品并开启任务 | 验证获得水龙、5药水+10精灵球、开启 quest_main_02 |
| TC-010 | 与村长对话时应能使用真实键盘输入选择并正常关闭对话框 | 验证键盘方向键选择、Enter 确认的完整流程 |
| TC-011 | 村长家在领取前应展示三只可选初始精灵，领取后不再展示 | 验证领取前后展示状态切换 |

### 5. 系统回归流程

| ID | 用例名称 | 测试内容 |
|----|---------|---------|
| TC-012 | 系统回归流程：新手引导到领取初始精灵应闭环通过 | 村民引导→村长家展示→领取水龙→展示隐藏 |

### 6. 战斗系统

| ID | 用例名称 | 测试内容 |
|----|---------|---------|
| TC-013 | 遭遇野生怪兽后应进入战斗并打开行动菜单 | 验证 battleState=player_turn, menuItems=[技能,背包,怪兽,逃跑] |
| TC-014 | 玩家使用技能后应扣除PP并对敌人造成伤害 | 验证 PP-1, 敌人 HP 减少 |
| TC-015 | 战斗胜利后应完成经验结算与奖励发放 | 验证 exp 增加、等级提升、物品掉落 |
| TC-016 | 战斗胜利后选择捕获应进入捕获分支并将怪兽加入队伍 | 验证 result=capture, party+1 |
| TC-017 | 玩家逃跑成功后应结束战斗并回到标题态 | 验证 result=flee, state=TITLE |

### 7. 战斗系统回归流程

| ID | 用例名称 | 测试内容 |
|----|---------|---------|
| TC-018 | 系统回归流程：菜单关闭后进入战斗并恢复到地图菜单应闭环通过 | 菜单开关→进入战斗→逃跑返回→菜单重开 |

---

## 测试辅助函数

| 函数名 | 功能 |
|--------|------|
| gotoGame(page) | 导航到游戏并等待标题态 |
| startMapGame(page) | 进入地图态 |
| openMapMenu(page) | 打开地图菜单 |
| closeMapMenu(page) | 关闭地图菜单 |
| startNpcDialog(page, npcId) | 启动 NPC 对话 |
| dialogNext(page, times) | 推进对话 |
| chooseDialog(page, choiceIndex) | 选择对话选项 |
| prepareWildBattle(page, monsterId, level) | 准备野生战斗 |
| skipBattleIntro(page) | 跳过战斗开场白 |
| forceSuccessfulFlee(page) | 强制成功逃跑 |

---

## 运行测试

```bash
cd docs
npm install
npx playwright test
```

测试报告生成位置: `docs/playwright-report/
