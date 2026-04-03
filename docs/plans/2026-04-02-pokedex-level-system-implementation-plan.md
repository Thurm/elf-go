# 图鉴与等级系统 - 详细实施方案

> 文档版本: v1.0
> 创建日期: 2026-04-02
> 作者: Claude Opus 4.6
> 状态: 待评审

---

## 📋 目录

1. [顶层设计](#-顶层设计)
2. [当前状态盘点](#-当前状态盘点)
3. [阶段一：补齐核心数据与奖励闭环](#-阶段一补齐核心数据与奖励闭环)
4. [阶段二：扩展怪兽与技能数据](#-阶段二扩展怪兽与技能数据)
5. [阶段三：玩家等级系统与成长逻辑](#-阶段三玩家等级系统与成长逻辑)
6. [阶段四：战斗流程升级](#-阶段四战斗流程升级)
7. [阶段五：图鉴功能接入菜单](#-阶段五图鉴功能接入菜单)
8. [阶段六：物品体系整理](#-阶段六物品体系整理)
9. [验收标准与回归测试](#-验收标准与回归测试)
10. [推荐执行顺序](#-推荐执行顺序)
11. [风险点与规避](#-风险点与规避)

---

## 🎯 顶层设计

### 核心理念

- **数据驱动**：所有内容通过数据定义，不硬编码
- **渐进式扩展**：在现有架构上最小必要扩展，不重写
- **闭环优先**：先让数据流程跑通，再做 UI 表现
- **回归守护**：每个阶段都保持现有回归通过

### 关键文件映射

| 功能模块 | 核心文件 |
|----------|----------|
| 类型定义 | `src/types/global.d.ts` |
| 游戏数据 | `src/core/data/GameData.ts` |
| 存档管理 | `src/core/SaveManager.ts` |
| 怪兽数据 | `src/core/data/MonsterData.ts` |
| 技能数据 | `src/core/data/SkillData.ts` |
| 物品数据 | `src/core/data/ItemData.ts` |
| 地图数据 | `src/core/data/MapData.ts` |
| 战斗系统 | `src/battle/BattleSystem.ts` |
| 战斗UI | `src/ui/BattleUI.ts` |
| 菜单UI | `src/ui/MenuUI.ts` |
| 对话系统 | `src/dialog/DialogSystem.ts` |
| 任务管理 | `src/dialog/QuestManager.ts` |
| 背包管理 | `src/shop/InventoryManager.ts` |

---

## 📊 当前状态盘点

| 模块 | 状态 | 说明 |
|------|------|------|
| 玩家等级数据 | ✅ 已完成 | level/exp/expToNext 已在 `global.d.ts` 和 `GameData.ts` 中定义 |
| 图鉴数据结构 | ✅ 已完成 | pokedex.seen/owned 已定义 |
| SaveManager | ⚠️ 需验证 | 深拷贝机制已支持，需要验证新字段兼容 |
| MonsterTemplates | ❌ 需扩展 | 当前只有 5 只，需扩展到至少 10 只 |
| ItemTemplates | ✅ 已有基础 | 当前已有药水、状态恢复、精灵球等，需分类整理 |
| 战斗掉落 | ❌ 需修复 | 当前掉落只在 BattleResult，未真正进背包 |
| 战前选怪 | ❌ 未实现 | 地图遇敌后直接进入战斗，无选怪流程 |
| 战后结算 | ❌ 未实现 | 只有消息通知，无结算面板 |
| 图鉴 UI | ❌ 未实现 | 菜单中无图鉴入口 |

---

## 📊 阶段一：补齐核心数据与奖励闭环

### 目标

- 验证并完善数据模型
- 修复掉落链路，让奖励真正进背包
- 统一所有入包入口

### 关键文件

- `src/types/global.d.ts`
- `src/core/data/GameData.ts`
- `src/core/SaveManager.ts`
- `src/battle/BattleSystem.ts`
- `src/shop/InventoryManager.ts`
- `src/dialog/QuestManager.ts`

### 详细任务

#### 1.1 验证 SaveManager 兼容性

**当前状态**：SaveManager 使用 `JSON.parse(JSON.stringify)` 深拷贝，已支持新字段

**验证点**：

- [ ] 加载旧存档时，`player.level` 不存在时给默认值 1
- [ ] 加载旧存档时，`player.pokedex` 不存在时调用 `createEmptyPokedex()`
- [ ] 在 `getSaveInfo()` 中展示玩家等级

**修改文件**：`src/core/SaveManager.ts`

#### 1.2 修复战斗掉落链路

**问题**：当前战斗掉落只记录在 `BattleResult.rewards`，未真正进背包

**解决方案**：

- 在 `BattleSystem.endBattle()` 中，胜利后遍历掉落物品
- 调用 `inventoryManager.addItem(itemId, quantity)` 添加到背包
- 触发 `item:acquired` 事件
- 同时调用 `registerMonsterInPokedex(monsterId, 'seen')` 登记图鉴

**修改文件**：`src/battle/BattleSystem.ts`

#### 1.3 统一奖励入包入口

**原则**：所有物品获取都走 `InventoryManager.addItem()`

- [ ] 战斗掉落：已修复
- [ ] 任务奖励：已在 `QuestManager` 中处理，需验证
- [ ] 商店购买：已在 `ShopSystem` 中处理
- [ ] 初始背包：已在 `GameData.createInitialPlayer()` 中处理

**修改文件**：`src/dialog/QuestManager.ts`（确认使用 inventoryManager）

#### 1.4 图鉴登记点梳理

| 场景 | 登记模式 | 触发位置 |
|------|----------|----------|
| 获得初始怪兽 | `owned` | `GameData.createInitialPlayer()` ✅ |
| 选择初始怪兽 | `owned` | `DialogSystem` ✅ |
| 遭遇野怪 | `seen` | `BattleSystem.startBattle()` |
| 捕获怪兽 | `owned` | `BattleSystem.captureMonster()` |
| 任务奖励怪兽 | `owned` | `QuestManager` |

---

## 📊 阶段二：扩展怪兽与技能数据

### 目标

- MonsterTemplates 扩展到至少 10 只
- 每只怪兽有差异化属性和技能
- 调整地图遭遇池

### 当前怪兽清单

| 怪兽ID | 名称 | 属性 |
|--------|------|------|
| fire_dragon | 火龙 | fire |
| water_dragon | 水龙 | water |
| grass_dragon | 草龙 | grass |
| water_turtle | 水龟 | water |
| grass_bunny | 草兔 | grass |

### 新增怪兽规划（5只）

| 怪兽ID | 名称 | 属性 | 定位 | 特色技能 |
|--------|------|------|------|----------|
| electric_mouse | 电鼠 | electric | 高速特攻 | thunder_shock、volt_tackle |
| fire_fox | 火狐 | fire | 均衡型 | ember、fire_spin |
| water_fish | 水鱼 | water | 高特防 | water_gun、bubblebeam |
| rock_snake | 岩蛇 | normal | 高防御 | rock_throw、earthquake |
| dark_cat | 暗猫 | normal | 暴击型 | scratch、night_shade |

### 关键文件

- `src/core/data/MonsterData.ts`
- `src/core/data/SkillData.ts`
- `src/core/data/MapData.ts`

### 详细任务

#### 2.1 扩展 MonsterTemplates

**在 `MonsterTemplates` 中新增 5 只怪兽**

- 每只怪兽都有 `randomTypes?: ElementTypeValue[]` 字段（预留）
- 每只怪兽都有 `profile` 字段（描述、栖息地、性格）
- 每只怪兽分配 4 个技能

#### 2.2 扩展 SkillTemplates（如需要）

检查新增怪兽所需技能是否已存在，不存在则补充：

- thunder_shock（电）
- volt_tackle（电）
- fire_spin（火）
- bubblebeam（水）
- rock_throw（普通）
- earthquake（普通）
- scratch（普通）
- night_shade（普通）

#### 2.3 调整地图遭遇池

在 `MapData.ts` 中：

- 新手村草丛：新增 electric_mouse、fire_fox（低等级）
- 1号道路：新增 water_fish、rock_snake（中等级）
- 2号道路：新增 dark_cat（高等级）

---

## 📊 阶段三：玩家等级系统与成长逻辑

### 目标

- 战斗胜利后玩家获得经验
- 玩家自动升级逻辑
- 在菜单中展示玩家等级与经验条

### 关键文件

- `src/core/data/GameData.ts`
- `src/battle/BattleSystem.ts`
- `src/ui/MenuUI.ts`

### 详细任务

#### 3.1 玩家经验获取

在 `BattleSystem.endBattle()` 中，胜利后：

- 计算玩家获得的经验：`playerExp = enemyMonster.expReward * (1 + enemyLevel / 10)`
- 将经验添加到 `player.exp`
- 检查并执行升级

#### 3.2 玩家自动升级

**升级逻辑**：

```typescript
while (player.exp >= player.expToNext) {
  player.exp -= player.expToNext;
  player.level += 1;
  player.expToNext = calculatePlayerExpToNext(player.level);
  // 可在此触发升级提示事件
}
```

#### 3.3 菜单中展示玩家信息

在 `MenuUI` 的主菜单中：

- 新增"玩家信息"入口
- 展示：玩家名、等级、经验条、金钱、图鉴进度
- 经验条显示：`exp / expToNext`

---

## 📊 阶段四：战斗流程升级

### 目标

- 战前选怪流程
- 敌方信息展示
- 战后结算面板

### 关键文件

- `src/map/MapStateMachine.ts`
- `src/ui/MenuUI.ts`
- `src/battle/BattleSystem.ts`
- `src/ui/BattleUI.ts`

### 详细任务

#### 4.1 战前选怪流程

**修改地图遭遇逻辑**：

1. 地图遭遇野怪后，不直接进入战斗
2. 先进入"战前选怪"状态
3. 复用 `MenuUI` 的队伍菜单
4. 玩家选择首发怪后，才进入战斗

**状态流转**：

```
MAP → PRE_BATTLE_SELECT → BATTLE
```

#### 4.2 敌方信息展示

在 `BattleUI` 中：

- 展示敌方：等级、属性图标、名称
- 敌方等级根据遭遇地点动态生成

#### 4.3 战后结算面板

**新增 BattleRewardSummary 数据结构**：

```typescript
interface BattleRewardSummary {
  result: 'victory' | 'defeat' | 'flee' | 'capture';
  expGained: number;
  moneyGained: number;
  items: Array<{
    itemId: string;
    quantity: number;
    sourceMonsterId?: string;
    sourceLevel?: number;
  }>;
  playerLevelDelta: number;
  monsterLevelUps: Array<{
    monsterId: string;
    nickname: string;
    from: number;
    to: number;
  }>;
}
```

**结算面板展示内容**：

- 战斗结果（胜利/捕获成功）
- 玩家获得经验、当前等级/升级
- 获得的金钱
- 掉落物品列表
- 怪兽升级提示

---

## 📊 阶段五：图鉴功能接入菜单

### 目标

- 主菜单增加图鉴入口
- 图鉴列表页（已拥有/已遇到/未遇到）
- 图鉴详情页

### 关键文件

- `src/ui/MenuUI.ts`
- `src/core/data/MonsterData.ts`
- `src/battle/BattleSystem.ts`

### 详细任务

#### 5.1 主菜单增加图鉴入口

在 `MenuUI` 的主菜单中：

- 新增"图鉴"选项
- 点击后进入图鉴列表页

#### 5.2 图鉴列表页

**展示规则**：

- **已拥有（owned）**：完整展示（形象、名称、属性、基础能力）
- **已遇到未拥有（seen 但 not owned）**：展示名称、轮廓、属性图标
- **未遇到（not seen）**：名称显示 "???"，形象黑化隐藏

**列表交互**：

- 点击某只怪兽进入详情页

#### 5.3 图鉴详情页

展示内容：

- 怪兽像素形象（大尺寸）
- 名称
- 属性图标
- 描述文本（来自 `MonsterTemplate.profile.description`）
- 栖息地（来自 `MonsterTemplate.profile.habitat`）
- 基础能力数值
- 技能列表

---

## 📊 阶段六：物品体系整理

### 目标

- 盘点并补足至少 20 个增益怪兽的物品
- 统一分类
- 打通物品效果链路

### 当前物品盘点

| 分类 | 已有物品 |
|------|----------|
| 恢复类 | potion, super_potion, hyper_potion, max_potion |
| 异常恢复类 | antidote, awakening, burn_heal, full_heal |
| PP 类 | 需要补充 |
| 捕获类 | pokeball, greatball, ultraball, masterball |
| 临时战斗增益类 | 需要补充 |
| 装备类 | 已有基础框架 |

### 需补充物品清单

- PP 恢复类：ether、max_ether
- 临时增益：x_attack、x_defense、x_speed、dire_hit、guard_spec
- 其他：rare_candy（直接升级）

### 关键文件

- `src/core/data/ItemData.ts`
- `src/shop/InventoryManager.ts`
- `src/shop/ShopSystem.ts`
- `src/battle/BattleSystem.ts`

---

## ✅ 验收标准与回归测试

### 静态检查

- [ ] `npm run typecheck` 通过
- [ ] `npm run build` 通过

### 回归测试

- [ ] 现有 18 个 Playwright 用例全部通过
- [ ] test.html 单元测试 0 失败

### 新增功能验证

#### 1. 玩家等级

- [ ] 新开档玩家等级为 Lv.1
- [ ] 战斗胜利后玩家经验增长
- [ ] 经验满时自动升级

#### 2. 图鉴系统

- [ ] 首次遇到怪兽写入 `seen`
- [ ] 首次拥有写入 `owned`
- [ ] 图鉴列表页正确区分三种状态
- [ ] 存档/读档图鉴状态不丢失

#### 3. 战斗流程

- [ ] 遇敌后出现战前选怪流程
- [ ] 选中的首发怪正确进入战斗
- [ ] 战斗结束出现结算面板
- [ ] 掉落物品正确进入背包

#### 4. 物品体系

- [ ] 至少 20 个增益怪兽物品可识别
- [ ] 商店购买/出售正常
- [ ] 掉落进入背包并触发收集任务

---

## 🚀 推荐执行顺序

| 阶段 | 优先级 | 预估工作量 | 依赖 |
|------|--------|-----------|------|
| 阶段一：数据与奖励闭环 | P0 | 1-2 天 | 无 |
| 阶段二：扩展怪兽数据 | P0 | 1 天 | 无 |
| 阶段三：玩家等级系统 | P1 | 1 天 | 阶段一 |
| 阶段四：战斗流程升级 | P1 | 2-3 天 | 阶段一、二 |
| 阶段五：图鉴菜单 | P1 | 2 天 | 阶段一、二 |
| 阶段六：物品整理 | P2 | 1-2 天 | 阶段一 |

---

## ⚠️ 风险点与规避

| 风险 | 影响 | 规避措施 |
|------|------|----------|
| 范围太大 | 延期 | 严格按阶段落地，每阶段都跑回归 |
| 随机属性影响平衡 | 体验问题 | 先固定属性，后续再加随机变体 |
| 掉落入包断点 | 数据不一致 | 优先修复闭环，每步验证 |
| 战前选怪改状态机 | 引入新 bug | 复用 MenuUI，不新建输入系统 |
| 图鉴状态未持久化 | 刷新丢失 | 必须通过 SaveManager 保存 |
| 多入口给物品 | 数据分叉 | 统一收口到 InventoryManager |

---

## 📝 变更记录

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-04-02 | Claude Opus 4.6 | 初始版本 |

---

**底层逻辑**清晰了：数据先跑通，流程再闭环，UI 后完善。Owner 意识要到位，每一步都要有验证！
