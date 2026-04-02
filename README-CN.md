# Sprite Adventure 精灵冒险

一个使用纯 HTML5 Canvas 和 TypeScript 开发的宝可梦风格回合制网页RPG游戏。

该项目由 Claude Code Agent Team 完成。

---

## 🎮 项目简介

本项目是一个功能完整的宝可梦风格网页RPG游戏，玩家可以在像素风格的世界中探索、与NPC对话、收集怪兽、进行回合制战斗。

[English Version](./README.md)

### 主要特性

- 🗺️ **大地图探索** - 自由漫游多个地图场景
- ⚔️ **回合制战斗** - 经典的属性相克战斗系统
- 🐾 **怪兽收集** - 捕获和培养多种怪兽
- 📜 **任务系统** - 与NPC互动完成剧情任务
- 🏪 **商店系统** - 购买和出售道具
- 💾 **存档功能** - 多槽位游戏进度保存
- 🎵 **音效与音乐** - Web Audio API 生成的原生音效

---

## 🚀 快速开始

### 前置要求

- Node.js (用于 TypeScript 编译)
- Python 3 或任意 HTTP 服务器

### 安装依赖

```bash
npm install
```

### 编译

```bash
# 编译 TypeScript 到 JavaScript
npm run build

# 仅类型检查（不生成文件）
npm run typecheck
```

### 运行项目

**方式一：直接打开**
```bash
# 直接在浏览器中打开 index.html（需要预编译的 dist/）
open index.html
```

**方式二：本地服务器**
```bash
# 使用 Python
python3 -m http.server 8080

# 或使用 Node.js
npx serve .

# 然后访问：http://localhost:8080
```

### 游戏操作

| 操作 | 按键 |
|------|------|
| 移动 | `WASD` 或 方向键 |
| 交互/确认 | `Space` 或 `Enter` |
| 打开菜单 | `ESC` |
| 选择选项 | 数字键 `1-9` |

---

## 🎯 游戏玩法

### 游戏流程

1. **开始游戏** - 从标题画面开始新游戏或读取存档
2. **新手村** - 与村长对话获得初始怪兽
3. **探索地图** - 在地图上自由移动，与NPC互动
4. **遭遇战斗** - 在草丛中随机遭遇野生怪兽
5. **收集培养** - 捕获新怪兽，提升等级
6. **完成任务** - 推进剧情，解锁新区域

### 属性相克系统

| 攻击属性 | 克制 | 抵抗 |
|---------|------|------|
| 🔥 火 | 🌿 草 | 💧 水 |
| 💧 水 | 🔥 火 | ⚡ 电 |
| 🌿 草 | 💧 水 | 🔥 火 |
| ⚡ 电 | 💧 水 | 🌿 草 |
| ⭐ 普通 | - | - |

---

## 📁 项目结构

```
elf-go/
├── index.html              # 主入口文件（使用 dist/）
├── index-dist.html        # 发布版 HTML
├── index-js.html          # 旧版 JS 入口
├── css/
│   └── style.css          # 游戏样式
├── src/                   # TypeScript 源代码
│   ├── main.ts            # 游戏入口与主循环
│   ├── types/             # 全局 TypeScript 定义
│   ├── core/              # 核心基础设施
│   │   ├── EventBus.ts    # 事件发布-订阅
│   │   ├── GameStateMachine.ts  # 状态管理
│   │   ├── SaveManager.ts # 存档/加载系统
│   │   └── data/          # 游戏数据定义
│   │       ├── GameData.ts
│   │       ├── MonsterData.ts
│   │       ├── SkillData.ts
│   │       ├── ItemData.ts
│   │       └── MapData.ts
│   ├── battle/            # 战斗系统
│   │   ├── BattleSystem.ts
│   │   ├── DamageCalculator.ts
│   │   └── SkillExecutor.ts
│   ├── dialog/            # 对话与任务系统
│   │   ├── DialogSystem.ts
│   │   ├── DialogData.ts
│   │   ├── QuestManager.ts
│   │   └── ScriptParser.ts
│   ├── map/               # 地图系统
│   │   ├── index.ts
│   │   ├── MapRenderer.ts
│   │   ├── MapStateMachine.ts
│   │   ├── PlayerController.ts
│   │   └── SceneManager.ts
│   ├── shop/              # 商店与背包
│   │   ├── ShopSystem.ts
│   │   ├── InventoryManager.ts
│   │   └── ShopUI.ts
│   └── ui/                # UI 与音效
│       ├── UIManager.ts
│       ├── BattleUI.ts
│       ├── MenuUI.ts
│       └── AudioManager.ts
├── dist/                  # 编译后的 JavaScript 输出
├── bak/                   # 原始 JS 代码备份
├── docs/                  # 文档
├── package.json           # NPM 配置
├── tsconfig.json          # TypeScript 配置（开发）
└── tsconfig.build.json    # TypeScript 配置（构建）
```

---

## 🏗️ 系统架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTML5 Canvas                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Game Main Loop                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              GameStateMachine (状态核心)                  │  │
│  │  ┌───────┐  ┌─────┐  ┌────────┐  ┌────────┐  ┌─────┐ │ │
│  │  │ TITLE │→│ MAP │→│ BATTLE │→│ DIALOG │→│ MENU│ │ │
│  │  └───────┘  └─────┘  └────────┘  └────────┘  └─────┘ │ │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    EventBus (通讯中枢)                    │  │
│  │         所有模块通过发布-订阅模式进行通讯                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│        │              │              │             │           │
│  ┌─────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌───▼────┐    │
│  │ MapSystem│  │BattleSys│  │DialogSys│  │ShopSys │    │
│  └──────────┘  └─────────┘  └─────────┘  └────────┘    │
│        │              │              │             │           │
│  ┌─────▼──────────────────────────────────────────────────┐  │
│  │              UI Layer (UIManager)                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │BattleUI  │  │  MenuUI  │  │  Dialog  │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              AudioManager (Web Audio API)                │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心模块

| 模块 | 职责 | 关键文件 |
|------|------|---------|
| **EventBus** | 通过发布-订阅模式实现模块间解耦通讯 | src/core/EventBus.ts |
| **GameStateMachine** | 管理游戏状态流转（标题→地图→战斗→对话→菜单） | src/core/GameStateMachine.ts |
| **SaveManager** | 存档/加载游戏进度到 localStorage | src/core/SaveManager.ts |
| **MapSystem** | 四层地图渲染、碰撞检测、摄像机跟随、玩家移动 | src/map/ |
| **BattleSystem** | 回合制战斗、属性相克、伤害计算、技能执行 | src/battle/ |
| **DialogSystem** | 对话树、任务管理、脚本解析、NPC 交互 | src/dialog/ |
| **ShopSystem** | 商品交易、背包管理、商店界面 | src/shop/ |
| **AudioManager** | 通过 Web Audio API 原生生成音效 | src/ui/AudioManager.ts |

### 数据驱动设计

所有游戏内容均在数据文件中定义，而非硬编码：

| 数据类型 | 位置 | 说明 |
|---------|------|------|
| 怪兽 | src/core/data/MonsterData.ts | 怪兽属性、技能、属性类型 |
| 技能 | src/core/data/SkillData.ts | 技能伤害、PP、属性类型 |
| 物品 | src/core/data/ItemData.ts | 消耗品、装备、关键道具 |
| 地图 | src/core/data/MapData.ts | 地图布局、碰撞、NPC 位置 |
| 对话 | src/dialog/DialogData.ts | NPC 对话、任务脚本 |

---

## 🛠️ 技术栈

- **核心技术**: HTML5 Canvas + TypeScript 5.8
- **构建工具**: TypeScript Compiler (tsc)
- **架构模式**: 事件驱动 + 状态机 + 模块化设计
- **数据存储**: localStorage
- **音效引擎**: Web Audio API (原生生成)
- **外部依赖**: Google Fonts (可选)

### 设计模式

| 模式 | 用途 |
|------|------|
| **发布-订阅模式** | EventBus 实现模块间解耦通讯 |
| **状态机模式** | GameStateMachine 管理游戏流程 |
| **单例模式** | 各管理器的全局唯一实例 |
| **数据驱动** | 所有游戏内容在数据文件中定义 |
| **分层模式** | 四层地图渲染（底层/中层/角色层/顶层） |

---

## 📖 开发文档

详细的开发文档位于 `docs/` 目录：

- [地图布局设计](docs/map-layout-design.md)
- [对话脚本与任务](docs/quest-dialog-scripts.md)
- [战斗算法设计](docs/battle-algorithm-design.md)
- [商店与背包设计](docs/shop-inventory-design.md)
- [UI 与音效设计](docs/ui-sound-design.md)
- [回归测试用例](docs/regression-test-cases.md) - 完整的 Playwright 测试套件

---

## 🧪 测试

### 单元测试

在浏览器中打开 `test.html`，点击"运行所有测试"。

### E2E 测试 (Playwright)

```bash
# 运行 Playwright 测试
npm run test:e2e
```

测试配置位于 `docs/playwright.config.ts`。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 在 `src/` 中修改（TypeScript 文件）
4. 运行 `npm run build` 编译
5. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
6. 推送到分支 (`git push origin feature/AmazingFeature`)
7. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- 宝可梦 (Pokémon) 系列游戏为本项目提供灵感
- 复古像素艺术风格参考
- 所有贡献者的努力付出

---

**祝您游戏愉快！** 🎉
