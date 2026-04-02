# 项目级 Claude 配置

## 项目概览

**精灵冒险** - 一个功能完整的宝可梦风格网页RPG游戏，使用纯 HTML5 Canvas 和 TypeScript 开发。

- **技术栈**: HTML5 Canvas + TypeScript 5.8
- **架构模式**: 事件驱动 + 状态机 + 模块化设计
- **构建方式**: TypeScript Compiler (tsc)
- **入口文件**: index.html (主入口，使用 dist/)

---

## 项目结构

主要目录: src/ (TypeScript 源码), dist/ (编译输出), docs/ (文档), css/ (样式)
入口文件: index.html, index-dist.html, index-js.html (旧版)
测试页面: test.html

### 核心模块

| 模块 | 路径 | 功能 |
|------|------|------|
| EventBus | src/core/EventBus.ts | 事件发布-订阅，模块解耦 |
| GameStateMachine | src/core/GameStateMachine.ts | 游戏状态流转 |
| MapSystem | src/map/ | 地图渲染、碰撞、摄像机 |
| BattleSystem | src/battle/ | 回合制战斗、属性相克 |
| DialogSystem | src/dialog/ | 对话树、任务管理 |
| ShopSystem | src/shop/ | 商品交易、背包 |

---

## 开发工作流

### 前置要求

- Node.js
- Python 3 或任意 HTTP 服务器

### 安装依赖

```bash
npm install
```

### 编译

```bash
# 编译 TypeScript 到 dist/
npm run build

# 仅类型检查
npm run typecheck
```

### 运行项目

```bash
# 方式一：直接打开（需先 build）
open index.html

# 方式二：本地服务器（推荐）
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

### 游戏操作

移动: WASD/方向键 | 交互: Space/Enter | 菜单: ESC | 选项: 1-9

### 代码规范

- 在 src/ 中修改 TypeScript 文件
- 修改后必须运行 npm run build 编译到 dist/
- 所有代码需添加中文注释
- 数据驱动设计：怪兽/技能/物品通过 src/core/data/ 定义
- 模块间通过 EventBus 通信，避免直接依赖

### 测试

**单元测试**: 打开 test.html，点击"运行所有测试"

**回归测试 (Playwright)**:
- **测试文档**: [docs/regression-test-cases.md](docs/regression-test-cases.md)
- **测试文件**: docs/tests/example.spec.ts
- **配置文件**: docs/playwright.config.ts

**运行回归测试**:
```bash
npm run test:e2e
```

**变更-测试映射**:

| 变更模块 | 需要运行的测试用例 |
|---------|------------------|
| 核心状态机 | TC-002, TC-003, TC-005, TC-006 |
| 菜单系统 | TC-004, TC-005, TC-006, TC-018 |
| 对话系统 | TC-007 ~ TC-012 |
| 战斗系统 | TC-013 ~ TC-018 |
| 地图系统 | TC-003, TC-011, TC-012 |
| 全量回归 | 全部 18 个用例 |

**测试优先级**: test.html 必须 0 失败 → 模块对应用例通过 → 核心回归流程 (TC-012, TC-018) 闭环

---

## Git 提交规范

提交时机: 核心模块变更 / 新功能完成 / Bug 修复

提交信息格式：
```
<类型>: <描述>

类型: feat(新功能), fix(修复), refactor(重构), docs(文档)
```

**注意**: 修改 src/ 后必须先 build 再提交，确保 dist/ 与 src/ 同步。

---

## 注意事项

- 源码在 src/ (.ts)，编译输出在 dist/ (.js)
- 修改 TypeScript 后必须运行 npm run build
- 存档存储在 localStorage 中
- 音效通过 Web Audio API 实时生成，无外部音频文件
- TypeScript 类型定义位于 src/types/
