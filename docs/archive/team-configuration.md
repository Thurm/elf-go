# 团队成员分工配置

## 项目概述
宝可梦风格网页 RPG 游戏开发团队

## 精简后的团队成员

| 角色 | 名称 | 模型 | 职责描述 |
|------|------|------|----------|
| **Team Lead** | 项目经理/审核 | **Opus 4.6** | 整体规划、代码审核、结果验收、进度协调 |
| **Teammate A** | 游戏架构师 | Sonnet | 核心架构、状态机、数据结构定义、接口设计 |
| **Teammate B** | 战斗系统开发 | Sonnet | 回合制战斗逻辑、技能系统、伤害计算、AI 逻辑 |
| **Teammate C** | 对话系统开发 | Sonnet | NPC 对话、任务系统、剧情脚本解析 |
| **Teammate D** | 地图渲染开发 | Sonnet | Canvas 2D 地图渲染、角色移动、场景切换、碰撞检测 |
| **Teammate E** | UI 音效开发 | Sonnet | 游戏界面、战斗 UI、菜单 UI、音效播放管理 |
| **Teammate G** | 商店系统开发 | Sonnet | 商店 UI、交易逻辑、背包管理、物品系统 |

（注：原 Teammate F 测试验收职责已并入 Team Lead）

## 开发流程

### Phase 1: 核心架构 ✅ 已完成
- **负责人**: Teammate A
- **审核**: Team Lead
- **内容**:
  - EventBus 事件总线
  - GameStateMachine 全局状态机
  - SaveManager 存档管理
  - 数据结构定义 (GameData/MonsterData/SkillData/ItemData/MapData)
  - 主入口 main.js

### Phase 2: 并行开发 ✅ 已完成
- **负责人**: Teammate B/C/D/E/G
- **审核**: Team Lead
- **内容**:
  - Teammate B: 战斗系统
  - Teammate C: 对话系统
  - Teammate D: 地图系统
  - Teammate E: UI 音效
  - Teammate G: 商店系统

### Phase 3: 测试验收与集成 🔄 进行中
- **负责人**: Team Lead
- **内容**:
  - E2E 端到端测试
  - 各模块功能验证
  - Bug 反馈与修复
  - 最终集成

## 技术栈

| 类别 | 技术 |
|------|------|
| 渲染 | HTML5 Canvas |
| 语言 | 原生 JavaScript (ES6+) |
| 样式 | CSS3 |
| 存档 | localStorage |
| 音效 | Web Audio API |
| 版本控制 | Git |

## 沟通机制

- 模块间通过 **EventBus** 事件总线通信
- 每个子系统有独立的状态机
- 代码提交前需经过 Team Lead 审核

## 开发原则

1. **模块化**: 每个子系统独立封装，高内聚低耦合
2. **频繁提交**: 每个小功能完成后立即提交，便于审核和回滚
3. **文档同步**: 代码与文档同步更新

## 文件结构

```
cc_learning/
├── index.html                    # 主入口
├── css/
│   └── style.css                 # 基础样式
├── js/
│   ├── main.js                   # 游戏初始化
│   ├── core/                     # 核心架构
│   │   ├── EventBus.js
│   │   ├── GameStateMachine.js
│   │   ├── SaveManager.js
│   │   └── data/
│   │       ├── GameData.js
│   │       ├── MonsterData.js
│   │       ├── SkillData.js
│   │       ├── ItemData.js
│   │       └── MapData.js
│   ├── battle/                   # 战斗系统
│   │   ├── BattleSystem.js
│   │   ├── DamageCalculator.js
│   │   └── SkillExecutor.js
│   ├── dialog/                   # 对话系统
│   │   ├── DialogSystem.js
│   │   ├── QuestManager.js
│   │   └── ScriptParser.js
│   ├── map/                      # 地图系统
│   │   ├── MapRenderer.js
│   │   ├── MapStateMachine.js
│   │   ├── PlayerController.js
│   │   └── SceneManager.js
│   ├── shop/                     # 商店系统
│   │   ├── ShopSystem.js
│   │   ├── ShopUI.js
│   │   └── InventoryManager.js
│   └── ui/                       # UI 音效
│       ├── UIManager.js
│       ├── BattleUI.js
│       ├── MenuUI.js
│       └── AudioManager.js
└── docs/                         # 文档
    ├── team-configuration.md    # 本文档
    └── superpowers/
        ├── specs/               # 设计文档
        └── plans/               # 实现计划
```

## 里程碑

| 里程碑 | 时间点 | 交付物 |
|--------|--------|--------|
| M1 | Phase 1 完成 | 核心架构、可运行的游戏框架 ✅ |
| M2 | Phase 2 完成 | 所有子系统功能实现 ✅ |
| M3 | Phase 3 完成 | 测试通过、集成完成 🔄 |

---

**配置日期**: 2026-03-26
**项目**: 宝可梦风格网页 RPG 游戏
**团队规模**: 精简为 7 人（原 8 人，移除 Teammate F 并入 Team Lead）
