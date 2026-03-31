# 战斗系统 (Battle System)

战斗系统模块提供回合制战斗的完整实现。

## 文件说明

| 文件 | 说明 |
|------|------|
| `DamageCalculator.js` | 伤害计算器 - 实现完整的伤害计算公式、属性相克、会心一击判定 |
| `SkillExecutor.js` | 技能执行器 - 技能效果执行、状态效果应用、AI行动决策 |
| `BattleSystem.js` | 战斗系统核心 - 回合制战斗逻辑、战斗状态机、玩家和敌方管理 |

## 使用方法

### 1. 伤害计算器 (DamageCalculator)

```javascript
// 计算伤害
const result = damageCalculator.calculateDamage(attacker, defender, skill);
// 返回: { damage, baseDamage, typeMultiplier, isCritical, isHit, ... }

// 获取属性相克倍率
const multiplier = damageCalculator.getTypeMultiplier('fire', 'water');  // 0.5

// 检查会心一击
const isCritical = damageCalculator.checkCritical(monster, 0);

// 判定行动顺序
const order = damageCalculator.determineTurnOrder(monsterA, monsterB, skillA, skillB);
```

### 2. 技能执行器 (SkillExecutor)

```javascript
// 执行技能
const result = skillExecutor.executeSkill(attacker, defender, skill);

// 野生怪兽 AI 决策
const decision = skillExecutor.wildMonsterAI(monster, enemy);

// 训练师怪兽 AI 决策
const decision = skillExecutor.trainerMonsterAI(monster, enemy, party, inventory);

// 处理回合开始状态效果
const messages = skillExecutor.processTurnStartStatus(monster);
```

### 3. 战斗系统 (BattleSystem)

```javascript
// 开始野生战斗
battleSystem.startWildBattle(wildMonster);

// 开始训练师战斗
battleSystem.startTrainerBattle(playerParty, enemyParty);

// 玩家使用技能
battleSystem.playerUseSkill(skill);

// 玩家交换怪兽
battleSystem.playerSwitchMonster(monster);

// 玩家使用道具
battleSystem.playerUseItem(item);

// 玩家逃跑
battleSystem.playerFlee();
```

## 事件列表

| 事件 | 说明 |
|------|------|
| `battle:start` | 战斗开始 |
| `battle:action` | 战斗动作（攻击、使用道具等）|
| `battle:damage` | 造成伤害 |
| `battle:end` | 战斗结束 |

## 战斗状态机

```
IDLE → STARTING → PLAYER_TURN → ENEMY_TURN → PROCESSING → VICTORY/DEFEAT → ENDING
                    ↓
                FLEEING
```

## 属性相克表

| 攻击\防御 | 火 | 水 | 草 | 电 | 普通 |
|-----------|----|----|----|----|------|
| 火        | 1x | 0.5x | 2x | 1x | 1x |
| 水        | 2x | 1x | 0.5x | 1x | 1x |
| 草        | 0.5x | 2x | 1x | 1x | 1x |
| 电        | 1x | 2x | 0.5x | 1x | 1x |
| 普通      | 1x | 1x | 1x | 1x | 1x |

## 伤害公式

```
基础伤害 = (攻击者等级 × 2 / 5 + 2) × 技能威力 × (攻击 / 防御) / 50 + 2
最终伤害 = 基础伤害 × 属性相克 × 随机浮动 × 会心一击 × STAB × 装备加成
```
