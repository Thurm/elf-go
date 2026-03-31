---
title: 宝可梦风格网页 RPG 游戏设计文档
date: 2026-03-26
version: 1.0.0
author: Team Lead (Opus)
---

# 宝可梦风格网页 RPG 游戏 - 设计文档

## 1. 项目概述

### 1.1 项目目标
开发一个完整的宝可梦风格网页 RPG 游戏，使用原生 HTML/CSS/JavaScript 实现，无需外部框架。

### 1.2 核心功能
- 2D 地图渲染与角色移动（Canvas）
- 回合制战斗系统
- NPC 对话与任务系统
- 装备系统
- 商店交易系统
- localStorage 存档/读档
- Web Audio API 音效播放

### 1.3 技术栈
- **渲染**: HTML5 Canvas
- **语言**: 原生 JavaScript (ES6+)
- **样式**: CSS3
- **存档**: localStorage
- **音效**: Web Audio API

---

## 2. 系统架构

### 2.1 整体架构模式
采用 **模块化状态机架构**，核心组件如下：

```
Game (主入口)
├── GameStateMachine (全局状态管理)
├── EventBus (事件总线，模块间通信)
├── SaveManager (存档管理)
├── AudioManager (音效管理)
│
├── 子系统 (各有独立状态机)
│   ├── MapSystem (地图渲染 + 角色移动)
│   ├── BattleSystem (回合制战斗)
│   ├── DialogSystem (对话 + 任务)
│   ├── ShopSystem (商店交易)
│   └── UISystem (游戏界面)
│
└── 数据层
    ├── GameData (玩家数据)
    ├── MonsterData (怪兽定义)
    ├── SkillData (技能定义)
    ├── ItemData (物品/装备定义)
    └── MapData (地图数据)
```

### 2.2 核心设计原则
- 每个子系统独立封装，通过 EventBus 通信
- 所有数据变更通过 StateMachine 统一管理
- 支持 localStorage 实时存档

---

## 3. 团队配置与分工

### 3.1 团队成员

| 成员 | 角色 | 模型 | 职责 |
|------|------|------|------|
| **Team Lead** | 项目经理/审核 | **Opus** | 整体规划、代码审核、结果验收 |
| **Teammate A** | 游戏架构师 | Sonnet | 核心架构、状态机、数据结构定义 |
| **Teammate B** | 战斗系统 | Sonnet | 回合制战斗、技能、伤害计算 |
| **Teammate C** | 对话系统 | Sonnet | NPC对话、任务系统、剧情脚本 |
| **Teammate D** | 地图渲染 | Sonnet | Canvas 2D地图、角色移动、场景切换 |
| **Teammate E** | UI音效 | Sonnet | 游戏界面、战斗UI、音效播放 |
| **Teammate F** | 测试验收 | Sonnet | E2E测试、功能验证、Bug报告 |
| **Teammate G** | 商店系统 | Sonnet | 商店UI、交易逻辑、背包管理 |

### 3.2 开发流程
1. Teammate A → 定义接口和数据结构
2. Teammate B/C/D/E/G → 并行开发
3. Teammate F → 对每个完成的模块进行测试
4. Team Lead → 审核代码 + 最终验收

---

## 4. 文件结构

```
cc_learning/
├── index.html              (主入口)
├── css/
│   └── style.css           (UI样式)
├── js/
│   ├── main.js             (游戏初始化)
│   ├── core/               (Teammate A - 架构师)
│   │   ├── GameStateMachine.js
│   │   ├── EventBus.js
│   │   ├── SaveManager.js
│   │   └── data/
│   │       ├── GameData.js
│   │       ├── MonsterData.js
│   │       ├── SkillData.js
│   │       ├── ItemData.js
│   │       └── MapData.js
│   ├── battle/             (Teammate B - 战斗系统)
│   │   ├── BattleSystem.js
│   │   ├── BattleStateMachine.js
│   │   ├── DamageCalculator.js
│   │   └── SkillExecutor.js
│   ├── dialog/             (Teammate C - 对话系统)
│   │   ├── DialogSystem.js
│   │   ├── QuestManager.js
│   │   └── ScriptParser.js
│   ├── map/                (Teammate D - 地图渲染)
│   │   ├── MapRenderer.js
│   │   ├── MapStateMachine.js
│   │   ├── PlayerController.js
│   │   └── SceneManager.js
│   ├── shop/               (Teammate G - 商店系统)
│   │   ├── ShopSystem.js
│   │   ├── ShopUI.js
│   │   └── InventoryManager.js
│   ├── ui/                 (Teammate E - UI音效)
│   │   ├── UIManager.js
│   │   ├── BattleUI.js
│   │   ├── MenuUI.js
│   │   └── AudioManager.js
│   └── tests/              (Teammate F - 测试验收)
│       ├── e2e/
│       │   ├── game-flow.spec.js
│       │   ├── battle.spec.js
│       │   ├── dialog.spec.js
│       │   ├── shop.spec.js
│       │   └── save-load.spec.js
│       └── test-utils.js
└── assets/                 (静态资源)
    ├── tilesets/           (地图图块)
    ├── sprites/            (角色精灵)
    └── sounds/             (音效文件)
```

---

## 5. 状态机设计

### 5.1 全局 GameState 流转

```
TITLE
  ↓
MAP ←→ DIALOG
  ↓    ↗
BATTLE
  ↓
MENU ←→ SAVE
       ↖
       LOAD
```

### 5.2 战斗子状态机

```
INIT → SELECT_ACTION
SELECT_ACTION → {
  SELECT_SKILL,
  SELECT_ITEM,
  SWITCH_MONSTER,
  RUN
}
SELECT_SKILL → EXECUTE_TURN
EXECUTE_TURN → ANIMATION
ANIMATION → CHECK_WINLOSE
CHECK_WINLOSE → {
  SELECT_ACTION (继续),
  BATTLE_END (胜利/失败)
}
```

### 5.3 地图子状态机

```
IDLE → MOVING
MOVING → {
  IDLE (停止),
  ENCOUNTER (遇敌),
  PORTAL (传送),
  INTERACT (交互)
}
ENCOUNTER → TRANSITION_TO_BATTLE
PORTAL → LOAD_SCENE
INTERACT → {
  IDLE,
  SHOW_DIALOG,
  OPEN_SHOP
}
```

---

## 6. 核心数据结构

### 6.1 GameState（全局状态）

```javascript
{
  currentState: "TITLE|MENU|MAP|BATTLE|DIALOG|SAVE|LOAD|SHOP",
  player: { /* PlayerData */ },
  currentMapId: "town_01",
  gameTime: 0,
  flags: {}, // 游戏进度标记
  tempData: {} // 临时数据
}
```

### 6.2 PlayerData（玩家数据）

```javascript
{
  name: "玩家",
  party: [
    { /* PlayerMonster */ },
    // ... 最多6只
  ],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
    helmet: null,
    boots: null
  },
  inventory: [
    { itemId: "potion", quantity: 5 },
    // ...
  ],
  money: 1000,
  location: { x: 5, y: 5 },
  quests: [ /* QuestData */ ],
  completedQuests: []
}
```

### 6.3 PlayerMonster（玩家怪兽）

```javascript
{
  id: "monster_001",
  monsterId: "fire_dragon",
  nickname: "小火",
  level: 5,
  exp: 100,
  expToNext: 250,
  stats: {
    hp: 100,
    maxHp: 100,
    atk: 85,
    def: 60,
    spAtk: 90,
    spDef: 50,
    spd: 70
  },
  skills: [
    { skillId: "fire_blast", pp: 12, maxPp: 15 },
    // ... 最多4个技能
  ],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
    helmet: null,
    boots: null
  },
  status: null // burn/paralyze/poison/freeze/sleep
}
```

### 6.4 Monster（怪兽定义）

```javascript
{
  id: "fire_dragon",
  name: "火龙",
  type: "fire", // fire/water/grass/electric/normal
  baseStats: {
    hp: 100,
    atk: 85,
    def: 60,
    spAtk: 90,
    spDef: 50,
    spd: 70
  },
  skills: ["fire_blast", "dragon_claw", "ember", "flamethrower"],
  expReward: 150,
  drops: [{ itemId: "fire_scale", chance: 0.3 }],
  equipment: {}
}
```

### 6.5 Skill（技能定义）

```javascript
{
  id: "fire_blast",
  name: "火焰喷射",
  type: "fire",
  category: "special", // physical/special/status
  power: 90,
  accuracy: 100,
  pp: 15,
  maxPp: 15,
  target: "single", // single/all/self
  effect: {
    type: "burn",
    chance: 10,
    duration: 3
  },
  description: "释放灼热的火焰攻击敌人"
}
```

### 6.6 Equipment（装备定义）

```javascript
{
  id: "flame_sword",
  name: "火焰之剑",
  type: "equipment",
  slot: "weapon", // weapon/armor/accessory/helmet/boots
  rarity: "rare", // common/rare/epic/legendary
  stats: {
    atk: 25,
    fireAtk: 15
  },
  effect: {
    type: "burn_chance",
    value: 10
  },
  setId: "flame_set",
  description: "蕴含火焰之力的神剑"
}
```

### 6.7 Item（物品定义）

```javascript
{
  id: "potion",
  name: "药水",
  type: "consumable",
  target: "single_monster",
  effect: {
    type: "heal_hp",
    value: 50
  },
  price: 50,
  description: "恢复50点HP"
}
```

### 6.8 ShopData（商店定义）

```javascript
{
  id: "pokemart_town01",
  name: "宝可梦商店",
  x: 12,
  y: 10,
  npcId: "shopkeeper_01",
  inventory: [
    { itemId: "potion", price: 50, stock: 99 },
    { itemId: "super_potion", price: 200, stock: 50 }
  ],
  buyMultiplier: 1.0,
  sellMultiplier: 0.5
}
```

### 6.9 MapData（地图数据）

```javascript
{
  id: "town_01",
  name: "新手村",
  width: 32,
  height: 32,
  tileset: "village",
  layers: [
    { name: "ground", data: [] },
    { name: "objects", data: [] },
    { name: "collision", data: [] }
  ],
  npcs: [
    { id: "npc_01", x: 10, y: 8, dialogId: "welcome" }
  ],
  portals: [
    { x: 0, y: 15, targetMap: "route_01", targetX: 30, targetY: 15 }
  ],
  shops: [
    { id: "pokemart_town01", x: 12, y: 10 }
  ],
  encounter: {
    enabled: false,
    rate: 0,
    monsters: []
  }
}
```

---

## 7. 事件总线（EventBus）

### 7.1 核心事件定义

```javascript
const GameEvents = {
  // 状态切换
  STATE_CHANGE: "state:change",
  PUSH_STATE: "state:push",
  POP_STATE: "state:pop",

  // 地图事件
  MAP_PLAYER_MOVE: "map:player_move",
  MAP_ENCOUNTER: "map:encounter",
  MAP_PORTAL: "map:portal",
  MAP_INTERACT: "map:interact",

  // 战斗事件
  BATTLE_START: "battle:start",
  BATTLE_ACTION: "battle:action",
  BATTLE_DAMAGE: "battle:damage",
  BATTLE_END: "battle:end",

  // 对话事件
  DIALOG_START: "dialog:start",
  DIALOG_NEXT: "dialog:next",
  DIALOG_CHOICE: "dialog:choice",
  DIALOG_END: "dialog:end",

  // 商店事件
  SHOP_OPEN: "shop:open",
  SHOP_BUY: "shop:buy",
  SHOP_SELL: "shop:sell",
  SHOP_CLOSE: "shop:close",

  // UI事件
  UI_MENU_OPEN: "ui:menu_open",
  UI_MENU_CLOSE: "ui:menu_close",
  UI_NOTIFICATION: "ui:notification",

  // 数据事件
  DATA_SAVE: "data:save",
  DATA_LOAD: "data:load",
  DATA_UPDATE: "data:update",

  // 音效事件
  AUDIO_PLAY: "audio:play",
  AUDIO_BGM: "audio:bgm"
};
```

### 7.2 事件总线接口

```javascript
interface EventBus {
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, data?: any): void;
  once(event: string, callback: Function): void;
}
```

### 7.3 子系统接口规范

```javascript
interface Subsystem {
  init(gameState: GameState): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  destroy(): void;
  handleEvent(event: GameEvent): void;
}
```

---

## 8. 存档系统

### 8.1 存档格式

```javascript
{
  version: "1.0.0",
  timestamp: 1774524702000,
  saveSlot: 1,
  gameState: {
    currentState: "MAP",
    player: { /* 完整玩家数据 */ },
    currentMapId: "town_01",
    gameTime: 3600,
    flags: {
      talked_to_mayor: true,
      received_starter_monster: true
    }
  }
}
```

### 8.2 存档槽位

```javascript
const SAVE_KEYS = ["save_slot_1", "save_slot_2", "save_slot_3"];
```

---

## 9. 渲染架构

### 9.1 双缓冲渲染策略

```
┌─────────────────────────────────────┐
│   1. 离屏 Canvas (offscreen)       │
│      - 绘制地图层                    │
│      - 绘制角色精灵                  │
│      - 绘制效果                      │
└──────────────┬──────────────────────┘
               │ 一次性拷贝
               ▼
┌─────────────────────────────────────┐
│   2. 显示 Canvas (on-screen)        │
│      - UI层覆盖                      │
│      - 直接显示到屏幕                │
└─────────────────────────────────────┘
```

---

## 10. 属性相克表

| 攻击\防御 | 火 | 水 | 草 | 电 | 普通 |
|-----------|----|----|----|----|------|
| 火        | 1x | 0.5x | 2x | 1x | 1x |
| 水        | 2x | 1x | 0.5x | 1x | 1x |
| 草        | 0.5x | 2x | 1x | 1x | 1x |
| 电        | 1x | 2x | 0.5x | 1x | 1x |
| 普通      | 1x | 1x | 1x | 1x | 1x |

---

## 11. 伤害计算公式

```
伤害 = (
  (攻击者等级 * 2 / 5 + 2) *
  技能威力 *
  (攻击方攻击 / 防御方防御) / 50 + 2
) *
 属性相克 *
 随机数(0.85~1.0) *
 命中判定(0或1) *
 装备加成
```

---

## 12. 开发里程碑

1. **Phase 1**: Teammate A 完成核心架构和数据结构定义
2. **Phase 2**: Teammate B/C/D/E/G 并行开发各自子系统
3. **Phase 3**: Teammate F 进行 E2E 测试
4. **Phase 4**: Team Lead 审核与验收

---

## 附录

### A. 术语表
- **ECS**: Entity-Component-System，实体组件系统
- **EventBus**: 事件总线，模块间通信机制
- **StateMachine**: 状态机，管理状态流转

### B. 参考资料
- 宝可梦游戏系列机制
- HTML5 Canvas API
- Web Audio API

