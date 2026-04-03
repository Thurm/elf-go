# 精灵冒险 - 文档目录

> 最后更新: 2026-04-03

---

## 📁 目录结构

```
docs/
├── README.md                          # 本文档 - 目录说明
├── design/                            # 系统设计文档
│   ├── battle-algorithm-design.md    # 战斗算法设计
│   ├── map-layout-design.md           # 地图布局设计
│   ├── quest-dialog-scripts.md        # 对话脚本与任务设计
│   ├── shop-inventory-design.md       # 商店与背包设计
│   └── ui-sound-design.md             # UI 与音效设计
├── plans/                             # 实施计划
│   ├── 2026-04-03-ui-refactor-implementation-plan.md
│   └── 2026-04-02-pokedex-level-system-implementation-plan.md
├── implementation/                      # 实现指南（预留）
├── testing/                            # 测试文档
│   ├── regression-test-cases.md       # 回归测试用例
│   └── ui-regression-test-cases.md    # UI 专项回归用例
├── archive/                            # 归档文档
│   ├── battle-system-README.md        # 旧版战斗系统说明
│   └── team-configuration.md          # 团队配置
├── tests/                              # Playwright 测试代码
├── playwright.config.ts                # Playwright 配置
└── superpowers/                        # 技能相关（外部插件）
```

---

## 📂 目录说明

### design/ - 系统设计文档

存放各子系统的架构设计、算法设计、数据结构设计等。

**文件命名规则**: `{系统名}-{设计类型}-design.md`

**示例**:
- `battle-algorithm-design.md` - 战斗算法设计
- `map-layout-design.md` - 地图布局设计

---

### plans/ - 实施计划

存放功能开发计划、技术方案、里程碑规划等。

**文件命名规则**: `YYYY-MM-DD-{功能特性}-{文档类型}.md`

**示例**:
- `2026-04-03-ui-refactor-implementation-plan.md` - UI 改造实施计划
- `2026-04-02-pokedex-level-system-implementation-plan.md` - 图鉴与等级系统实施计划

---

### implementation/ - 实现指南

存放具体实现的技术细节、最佳实践、代码规范等。

**预留目录**，后续可补充。

---

### testing/ - 测试文档

存放测试用例、测试计划、测试报告等。

**文件命名规则**: `{测试类型}-{说明}.md`

**示例**:
- `regression-test-cases.md` - 回归测试用例
- `ui-regression-test-cases.md` - UI 专项回归用例

---

### archive/ - 归档文档

存放已过时的文档、旧版本的设计、不再使用的方案等。

**文件保留策略**: 历史版本文档移至此目录，不直接删除。

---

## 📝 文档命名规范

### 设计文档

```
{系统名}-{设计类型}-design.md
```

### 实施计划

```
YYYY-MM-DD-{功能特性}-{文档类型}.md
```

| 字段 | 说明 | 示例 |
|------|------|------|
| YYYY-MM-DD | 创建日期 | `2026-04-02` |
| 功能特性 | 短横线分隔的功能名 | `pokedex-level-system` |
| 文档类型 | plan / spec / proposal | `implementation-plan` |

### 测试文档

```
{测试类型}-{说明}.md
```

---

## 🔗 相关链接

- [项目主 README](../README.md)
- [中文 README](../README-CN.md)
- [CLAUDE.md - 项目级配置](../CLAUDE.md)

---

**Owner 意识**：文档也要治理，命名要规范，分类要清晰，让人一眼就明白！
