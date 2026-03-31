# 宝可梦风格网页RPG游戏

一个使用纯 HTML5 Canvas 和原生 JavaScript 开发的宝可梦风格回合制网页RPG游戏。

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

### 运行项目

**方式一：直接打开**
```bash
# 直接在浏览器中打开 index.html
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
cc_learning/
├── index.html              # 主入口文件
├── css/
│   └── style.css           # 游戏样式
├── js/
│   ├── main.js             # 游戏主类
│   ├── core/               # 核心模块
│   │   ├── EventBus.js     # 事件总线
│   │   ├── GameStateMachine.js  # 状态机
│   │   ├── SaveManager.js  # 存档管理
│   │   └── data/           # 游戏数据
│   ├── battle/             # 战斗系统
│   ├── dialog/             # 对话系统
│   ├── map/                # 地图系统
│   ├── shop/               # 商店系统
│   └── ui/                 # UI与音效
├── docs/                   # 文档
└── assets/                 # 静态资源
```

### 核心模块说明

| 模块 | 功能 |
|------|------|
| **EventBus** | 事件发布-订阅模式，实现模块间解耦 |
| **GameStateMachine** | 管理游戏状态流转（标题/地图/战斗/对话/菜单） |
| **MapSystem** | 四层地图渲染、碰撞检测、摄像机跟随 |
| **BattleSystem** | 回合制战斗、属性相克、伤害计算 |
| **DialogSystem** | 对话树、任务管理、脚本解析 |
| **ShopSystem** | 商品交易、背包管理 |
| **AudioManager** | Web Audio API 音效生成与播放 |

---

## 🛠️ 技术栈

- **核心技术**: HTML5 Canvas + Vanilla JavaScript (ES6+)
- **架构模式**: 事件驱动 + 状态机 + 模块化设计
- **数据存储**: localStorage
- **音效引擎**: Web Audio API (原生生成)
- **外部依赖**: Google Fonts (可选)

### 设计模式

- **发布-订阅模式**: EventBus 实现模块通信
- **状态机模式**: 管理游戏状态流转
- **单例模式**: 各管理器的全局唯一实例
- **数据驱动**: 怪兽/技能/物品均由数据定义

---

## 📖 开发文档

详细的开发文档位于 `docs/` 目录：

- [团队配置](docs/team-configuration.md)
- [地图布局设计](docs/map-layout-design.md)
- [对话脚本与任务](docs/quest-dialog-scripts.md)

各模块的详细说明请参考对应目录下的 README.md。

---

## ✅ 模块开发进度

| 模块 | 状态 | 负责人 |
|------|------|--------|
| 核心架构 (EventBus/StateMachine) | ✅ 完成 | Teammate A |
| 数据结构定义 | ✅ 完成 | Teammate A |
| 战斗系统 (Battle/Damage/Skill) | ✅ 完成 | Teammate B |
| 对话系统 (Dialog/Quest) | ✅ 完成 | Teammate C |
| 地图系统 (Map/Player/Scene) | ✅ 完成 | Teammate D |
| UI/音效 (UI/Battle/Menu/Audio) | ✅ 完成 | Teammate E |
| 商店系统 (Shop/Inventory) | ✅ 完成 | Teammate G |

---

### 地图系统功能 (Teammate D)

已实现的功能：
- 四层地图渲染（底层、中层、角色层、顶层）
- 摄像机跟随玩家
- 玩家控制器（WASD/方向键移动）
- 碰撞检测系统
- 草丛遇敌判定
- 地图状态机
- 场景管理器
- 地图数据定义（3张地图）

地图列表：
- 新手村（32x32，无遇敌）
- 1号道路（32x32，有遇敌）
- 村长家（10x8，室内地图）

---

### 对话系统功能 (Teammate C)

已实现的功能：
- NPC 对话系统（6个NPC完整对话）
- 对话树遍历与选项处理
- 任务管理系统
- 任务进度追踪
- 对话脚本解析器
- 动作执行（给予物品/怪兽、设置标记等）

NPC 列表：
- 村长（赠送初始怪兽）
- 小明（商店老板）
- 王奶奶（支线任务）
- 小刚（情报提供）
- 小红（支线任务）
- 研究员（怪兽情报）

---

### 战斗系统功能 (Teammate B)

已实现的功能：
- 回合制战斗系统核心
- 伤害计算器（属性相克、随机数）
- 技能执行器
- 战斗状态机

---

### UI/音效功能 (Teammate E)

已实现的功能：
- UI 管理器
- 战斗界面
- 菜单界面
- 音效管理器

---

### 商店系统功能 (Teammate G)

已实现的功能：
- 商店系统核心
- 背包管理器
- 商店界面
- 物品数据定义（消耗品、装备品、关键道具）

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

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
