# 战斗系统说明文档

## 概述

本战斗系统是一个完整的回合制战斗系统，实现了宝可梦风格的战斗机制。

## 文件结构

```
js/battle/
├── BattleSystem.js      # 战斗系统核心
├── DamageCalculator.js  # 伤害计算器
└── SkillExecutor.js     # 技能执行器
```

## 核心组件

### 1. BattleSystem (战斗系统核心)

负责管理整个战斗流程、状态转换和战斗参与方。

**主要方法：**

- `startWildBattle(monster, level)` - 开始野生战斗
- `startTrainerBattle(playerParty, enemyParty)` - 开始训练师战斗
- `playerUseSkill(skill)` - 玩家使用技能
- `playerSwitchMonster(monster)` - 玩家交换怪兽
- `playerUseItem(item)` - 玩家使用道具
- `playerFlee()` - 玩家尝试逃跑
- `getBattleState()` - 获取当前战斗状态

### 2. DamageCalculator (伤害计算器)

负责计算伤害数值、属性相克、命中判定等。

**主要方法：**

- `calculateDamage(attacker, defender, skill, options)` - 计算完整伤害
- `calculateBaseDamage(attacker, defender, skillTemplate)` - 计算基础伤害
- `getTypeMultiplier(attackType, defenseType)` - 获取属性相克倍率
- `checkHit(attacker, defender, skillTemplate)` - 检查是否命中
- `checkCritical(attacker, criticalStage)` - 检查是否暴击
- `determineTurnOrder(monsterA, monsterB, skillA, skillB)` - 判定行动顺序
- `calculateStatusDamage(monster, status)` - 计算状态伤害

### 3. SkillExecutor (技能执行器)

负责执行技能效果、应用状态、AI 决策。

**主要方法：**

- `executeSkill(attacker, defender, skill)` - 执行技能
- `getMonsterSkills(monster)` - 获取怪兽的技能列表
- `processTurnStartStatus(monster)` - 处理回合开始时的状态效果
- `checkCanAct(monster)` - 检查怪兽是否可以行动
- `wildMonsterAI(monster, enemy)` - 野生怪兽 AI 决策
- `trainerMonsterAI(monster, enemy, party, inventory)` - 训练师怪兽 AI 决策
- `cureStatus(monster)` - 治愈状态

## 伤害计算公式

```
基础伤害 = (攻击者等级 × 2 / 5 + 2) × 技能威力 × (攻击 / 防御) / 50 + 2

最终伤害 = 基础伤害 × 属性相克 × 随机浮动 × 会心一击 × 装备加成 × STAB加成
```

详细公式请参考 `docs/battle-algorithm-design.md`。

## 属性相克表

| 攻击\防御 | 火 | 水 | 草 | 电 | 普通 |
|-----------|----|----|----|----|------|
| 火        | 1x | 0.5x | 2x | 1x | 1x |
| 水        | 2x | 1x | 0.5x | 1x | 1x |
| 草        | 0.5x | 2x | 1x | 1x | 1x |
| 电        | 1x | 2x | 0.5x | 1x | 1x |
| 普通      | 1x | 1x | 1x | 1x | 1x |

## 状态效果

| 状态 | 持续回合 | 效果 |
|------|----------|------|
| 灼烧（burn） | 2~5 | 每回合 1/16 HP 伤害，物理攻击×0.5 |
| 麻痹（paralyze） | 3~6 | 速度×0.25，25% 概率无法行动 |
| 中毒（poison） | 3~6 | 每回合 1/8 HP 伤害 |
| 冰冻（freeze） | 1~4 | 无法行动，30% 自然解冻，火攻击 100% 解冻 |
| 睡眠（sleep） | 1~3 | 无法行动，受攻击 50% 苏醒 |

## 使用示例

### 开始一场野生战斗

```javascript
// 创建玩家怪兽（通过 GameData）
const gameState = gameStateMachine.getGameState();

// 开始战斗
battleSystem.startWildBattle('fire_dragon', 5);
```

### 玩家选择技能

```javascript
// 使用火焰喷射
battleSystem.playerUseSkill('fire_blast');
```

### 监听战斗事件

```javascript
// 监听战斗开始
eventBus.on(GameEvents.BATTLE_START, (data) => {
    console.log('战斗开始！', data);
});

// 监听战斗动作
eventBus.on(GameEvents.BATTLE_ACTION, (data) => {
    console.log('战斗动作', data);
});

// 监听伤害
eventBus.on(GameEvents.BATTLE_DAMAGE, (data) => {
    console.log('造成伤害', data);
});

// 监听战斗结束
eventBus.on(GameEvents.BATTLE_END, (data) => {
    console.log('战斗结束', data);
});
```

### 直接使用伤害计算器

```javascript
const attacker = {
    level: 5,
    type: 'fire',
    stats: { atk: 85, spAtk: 90, spd: 70 },
    status: null
};

const defender = {
    type: 'grass',
    stats: { def: 60, spDef: 50 }
};

const skill = SkillTemplates['fire_blast'];

const result = damageCalculator.calculateDamage(attacker, defender, skill);
console.log(result.damage);  // 输出伤害值
```

## 战斗流程

```
1. 战斗开始 (STARTING)
   ↓
2. 回合开始 (PLAYER_TURN)
   ├─ 处理回合开始状态效果
   ├─ 检查是否可以行动
   └─ 等待玩家选择行动
   ↓
3. 玩家行动 (PROCESSING)
   ├─ 判定行动顺序
   ├─ 执行攻击/道具/交换/逃跑
   └─ 检查战斗结束
   ↓
4. 敌方行动 (ENEMY_TURN)
   ├─ AI 决策
   ├─ 执行敌方攻击
   └─ 检查战斗结束
   ↓
5. 回合结束
   └─ 返回步骤2（或结束战斗）
   ↓
6. 战斗结束 (VICTORY/DEFEAT)
   ├─ 结算经验值
   ├─ 结算掉落物品
   └─ 返回地图
```

## 设计参考

详细的算法设计请参考：
- `docs/battle-algorithm-design.md` - 战斗算法设计文档
- `docs/superpowers/specs/2026-03-26-pokemon-rpg-design.md` - 总体设计文档
