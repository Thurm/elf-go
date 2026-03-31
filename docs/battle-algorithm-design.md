---
title: 战斗算法与伤害公式设计文档
date: 2026-03-26
version: 1.0.0
author: Teammate B (战斗系统)
---

# 战斗算法与伤害公式设计文档

## 1. 伤害计算公式详细说明

### 1.1 完整伤害计算公式

```
基础伤害 = (攻击者等级 × 2 / 5 + 2) × 技能威力 × (攻击方攻击 / 防御方防御) / 50 + 2

最终伤害 = 基础伤害 × 属性相克倍率 × 随机浮动 × 命中判定 × 会心一击 × 装备加成 × STAB加成
```

### 1.2 参数详细说明

| 参数 | 说明 | 取值范围 |
|------|------|----------|
| **攻击者等级** | 攻击方怪兽的当前等级 | 1~100 |
| **技能威力** | 使用技能的威力值 | 0~250（状态技能为0）|
| **攻击方攻击** | 攻击或特攻（根据技能类别）| 取决于怪兽属性 |
| **防御方防御** | 防御或特防（根据技能类别）| 取决于怪兽属性 |
| **属性相克倍率** | 属性相克关系 | 0.5、1、2 |
| **随机浮动** | 伤害随机系数 | 0.85 ~ 1.0 |
| **命中判定** | 技能是否命中 | 0（未命中）或 1（命中）|
| **会心一击** | 暴击倍率 | 1（正常）或 1.5（暴击）|
| **装备加成** | 装备提供的伤害加成 | 0.5 ~ 2.0 |
| **STAB加成** | 同属性技能加成 | 1（无）或 1.5（有）|

### 1.3 物理攻击 vs 特殊攻击

**物理攻击（physical）**：
- 使用攻击方的 `atk`（攻击）属性
- 使用防御方的 `def`（防御）属性
- 适用于：撞击、爪子攻击等物理接触技能

**特殊攻击（special）**：
- 使用攻击方的 `spAtk`（特攻）属性
- 使用防御方的 `spDef`（特防）属性
- 适用于：火焰喷射、水枪等元素技能

### 1.4 计算示例

#### 示例 1：正常攻击

**场景**：
- 攻击方：5级火龙（火属性），atk=85
- 防御方：5级水龟（水属性），def=65
- 使用技能：火焰喷射（火属性，特殊攻击，威力90）

**计算过程**：

```
1. 基础伤害
   = (5 × 2 / 5 + 2) × 90 × (90 / 50) / 50 + 2
   = (2 + 2) × 90 × 1.8 / 50 + 2
   = 4 × 90 × 1.8 / 50 + 2
   = 648 / 50 + 2
   = 12.96 + 2
   = 14.96 ≈ 15

2. 属性相克倍率：火→水 = 0.5x

3. 随机浮动：假设为 0.92

4. 命中判定：命中 = 1

5. 会心一击：未暴击 = 1

6. 装备加成：无 = 1

7. STAB加成：火属性技能 + 火属性怪兽 = 1.5

最终伤害 = 15 × 0.5 × 0.92 × 1 × 1 × 1 × 1.5
         = 15 × 0.5 = 7.5
         = 7.5 × 0.92 = 6.9
         = 6.9 × 1.5 = 10.35
         ≈ 10（向下取整）
```

**结果**：造成 10 点伤害

---

#### 示例 2：克制攻击 + 暴击

**场景**：
- 攻击方：10级水龟（水属性），spAtk=75
- 防御方：8级火龙（火属性），spDef=45
- 使用技能：水枪（水属性，特殊攻击，威力65）
- 触发会心一击

**计算过程**：

```
1. 基础伤害
   = (10 × 2 / 5 + 2) × 65 × (75 / 45) / 50 + 2
   = (4 + 2) × 65 × 1.666... / 50 + 2
   = 6 × 65 × 1.666... / 50 + 2
   = 650 / 50 + 2
   = 13 + 2
   = 15

2. 属性相克倍率：水→火 = 2x

3. 随机浮动：假设为 0.98

4. 命中判定：命中 = 1

5. 会心一击：暴击 = 1.5

6. 装备加成：无 = 1

7. STAB加成：水属性技能 + 水属性怪兽 = 1.5

最终伤害 = 15 × 2 × 0.98 × 1 × 1.5 × 1 × 1.5
         = 15 × 2 = 30
         = 30 × 0.98 = 29.4
         = 29.4 × 1.5 = 44.1
         = 44.1 × 1.5 = 66.15
         ≈ 66（向下取整）
```

**结果**：造成 66 点伤害（暴击 + 克制！）

---

## 2. 属性相克表现场景区分

### 2.1 属性相克表

| 攻击\防御 | 火 | 水 | 草 | 电 | 普通 |
|-----------|----|----|----|----|------|
| 火        | 1x | 0.5x | **2x** | 1x | 1x |
| 水        | **2x** | 1x | 0.5x | 1x | 1x |
| 草        | 0.5x | **2x** | 1x | 1x | 1x |
| 电        | 1x | **2x** | 0.5x | 1x | 1x |
| 普通      | 1x | 1x | 1x | 1x | 1x |

### 2.2 2x 克制时的表现

**视觉效果**：
- 伤害数字显示为**红色**
- 伤害数字字体放大 1.5 倍
- 播放"克制"特效动画（闪光效果）
- 屏幕轻微震动

**音效**：
- 比普通攻击更响亮的命中音效
- 追加"克制"特殊音效

**战斗日志**：
```
火龙使用了火焰喷射！
效果拔群！（2x 克制）
草蜥蜴受到了 45 点伤害！
```

### 2.3 0.5x 抵抗时的表现

**视觉效果**：
- 伤害数字显示为**蓝色**
- 伤害数字字体缩小至 0.8 倍
- 播放"抵抗"特效（护盾效果）

**音效**：
- 较低沉的命中音效
- 追加"抵抗"特殊音效

**战斗日志**：
```
火龙使用了火焰喷射！
效果不好...（0.5x 抵抗）
水龟受到了 8 点伤害！
```

### 2.4 1x 正常时的表现

**视觉效果**：
- 伤害数字显示为**白色**
- 正常字体大小
- 普通命中特效

**音效**：
- 标准命中音效

**战斗日志**：
```
火龙使用了火焰喷射！
小拉达受到了 18 点伤害！
```

---

## 3. 随机数范围与判定机制

### 3.1 伤害随机浮动范围

**浮动系数**：`randomFactor = 0.85 ~ 1.0`

**生成方式**：
```javascript
// 生成 0.85 到 1.0 之间的随机数，步长 0.01
const randomFactor = (Math.floor(Math.random() * 16) + 85) / 100;
// 可能值：0.85, 0.86, 0.87, ..., 0.99, 1.00（共16种可能）
```

**对伤害的影响示例**：
- 基础伤害 100 → 实际伤害 85 ~ 100
- 基础伤害 50 → 实际伤害 42 ~ 50

### 3.2 命中判定逻辑

#### 3.2.1 命中率计算公式

```
最终命中率 = 技能命中率 × 命中修正 × 状态修正
```

| 修正类型 | 说明 | 倍率 |
|----------|------|------|
| 技能命中率 | 技能本身的准确率 | 0 ~ 100 |
| 命中修正 | 攻击方命中提升 / 防御方闪避提升 | 0.5 ~ 2.0 |
| 状态修正 | 麻痹等状态影响 | 0.75 ~ 1.0 |

#### 3.2.2 命中判定流程

```javascript
function checkHit(skill, attacker, defender) {
    // 1. 计算最终命中率
    let hitRate = skill.accuracy;

    // 2. 应用状态修正（如麻痹降低命中）
    if (attacker.status === 'paralyze') {
        hitRate *= 0.75;
    }

    // 3. 随机判定
    const roll = Math.random() * 100;

    return roll < hitRate;
}
```

#### 3.2.3 未命中表现

**视觉效果**：
- 显示"Miss!"文字
- 无伤害数字
- 攻击动画播放但目标无反应

**战斗日志**：
```
火龙使用了火焰喷射！
但是没有命中...
```

### 3.3 会心一击（暴击）机制设计

#### 3.3.1 暴击率计算公式

```
基础暴击率 = 1/16（6.25%）

最终暴击率 = 基础暴击率 × 暴击倍率 × 装备加成
```

| 暴击阶段 | 暴击倍率 | 说明 |
|----------|----------|------|
| 0 | 1x | 6.25%（基础）|
| 1 | 2x | 12.5% |
| 2 | 4x | 25% |
| 3 | 8x | 50% |
| 4+ | 16x | 100%（必定暴击）|

#### 3.3.2 暴击伤害倍率

```
暴击伤害 = 正常伤害 × 1.5
```

#### 3.3.3 暴击表现

**视觉效果**：
- 伤害数字显示为**金色**
- 伤害数字字体放大 2 倍
- 播放"暴击"特效（星形爆发）
- 屏幕强烈震动

**音效**：
- 响亮的暴击音效
- 特殊的暴击音效

**战斗日志**：
```
火龙使用了火焰喷射！
击中了要害！（会心一击！）
草蜥蜴受到了 68 点伤害！
```

---

## 4. 状态效果机制

### 4.1 状态效果总览

| 状态 | 图标 | 持续回合 | 主要效果 |
|------|------|----------|----------|
| **灼烧（burn）** | 🔥 | 2~5回合 | 每回合伤害，物理攻击降低 |
| **麻痹（paralyze）** | ⚡ | 3~6回合 | 速度降低，可能无法行动 |
| **中毒（poison）** | ☠️ | 3~6回合 | 每回合伤害 |
| **冰冻（freeze）** | ❄️ | 1~4回合 | 无法行动，可能解冻 |
| **睡眠（sleep）** | 😴 | 1~3回合 | 无法行动，受到攻击可能苏醒 |

### 4.2 灼烧（burn）

#### 效果说明

**触发条件**：
- 火属性技能有 10% 概率附加
- 某些特定技能有更高概率

**持续时间**：
```
持续回合 = random(2, 5)  // 2~5回合
```

**每回合伤害**：
```
灼烧伤害 = 最大HP × 1/16
          = maxHp >> 4  // 位运算优化
```

**攻击弱化**：
```
物理攻击 = 原攻击 × 0.5
```

#### 表现

**回合开始时**：
```
[灼烧效果]
小火龙受到了灼烧的伤害！
损失了 6 点HP！
```

**视觉**：
- 怪兽身上有持续的火焰动画
- HP 条闪烁红色

### 4.3 麻痹（paralyze）

#### 效果说明

**触发条件**：
- 电属性技能有 10% 概率附加
- 某些特定技能有更高概率

**持续时间**：
```
持续回合 = random(3, 6)  // 3~6回合
```

**速度降低**：
```
速度 = 原速度 × 0.25
```

**行动跳过概率**：
```
行动跳过概率 = 25%
```

#### 行动判定流程

```javascript
function canActWithParalysis(monster) {
    if (monster.status !== 'paralyze') {
        return true;
    }

    // 25% 概率无法行动
    if (Math.random() < 0.25) {
        return false;
    }

    return true;
}
```

#### 表现

**无法行动时**：
```
[麻痹效果]
小火龙身体麻痹了，无法行动！
```

**视觉**：
- 怪兽偶尔闪烁电火花
- 速度条显示为灰色

### 4.4 中毒（poison）

#### 效果说明

**触发条件**：
- 毒属性技能有 10% 概率附加
- 某些特定技能有更高概率

**持续时间**：
```
持续回合 = random(3, 6)  // 3~6回合
```

**每回合伤害**：
```
普通中毒伤害 = 最大HP × 1/8
             = maxHp >> 3
```

**剧毒伤害（可选扩展）**：
```
第1回合：maxHP × 1/16
第2回合：maxHP × 2/16
第3回合：maxHP × 3/16
...
最大：maxHP × 15/16
```

#### 表现

**回合开始时**：
```
[中毒效果]
小火龙受到了毒素的伤害！
损失了 12 点HP！
```

**视觉**：
- 怪兽身上有紫色气泡效果
- HP 条闪烁紫色

### 4.5 冰冻（freeze）

#### 效果说明

**触发条件**：
- 冰属性技能有 10% 概率附加
- 某些特定技能有更高概率

**持续时间**：
```
持续回合 = random(1, 4)  // 1~4回合
```

**无法行动**：
```
冰冻期间完全无法行动
```

**自然解冻概率**：
```
每回合开始时：30% 概率解冻
```

**火属性攻击解冻**：
```
受到火属性攻击时：100% 解冻
```

#### 解冻判定流程

```javascript
function checkThaw(monster, damageSource) {
    // 受到火属性攻击必定解冻
    if (damageSource && damageSource.type === 'fire') {
        return true;
    }

    // 30% 自然解冻概率
    if (Math.random() < 0.3) {
        return true;
    }

    return false;
}
```

#### 表现

**无法行动时**：
```
[冰冻效果]
小火龙被冻住了，无法行动！
```

**解冻时**：
```
小火龙解冻了！
```

**视觉**：
- 怪兽被包裹在冰块中
- 颜色变为蓝色调

### 4.6 睡眠（sleep）

#### 效果说明

**触发条件**：
- 催眠类技能有 60~100% 概率附加

**持续时间**：
```
持续回合 = random(1, 3)  // 1~3回合
```

**无法行动**：
```
睡眠期间完全无法行动
```

**苏醒判定**：
```
每回合开始时：自然苏醒
受到攻击时：50% 概率苏醒
```

#### 苏醒判定流程

```javascript
function checkWakeUp(monster, wasAttacked) {
    // 受到攻击时有 50% 概率苏醒
    if (wasAttacked && Math.random() < 0.5) {
        return true;
    }

    // 否则等待持续回合结束
    return monster.sleepTurns <= 0;
}
```

#### 表现

**无法行动时**：
```
[睡眠效果]
小火龙正在熟睡中...
```

**苏醒时**：
```
小火龙醒过来了！
```

**视觉**：
- 怪兽闭眼，有 Z 字气泡上升
- 身体有轻微的呼吸起伏

---

## 5. AI 行动决策逻辑

### 5.1 AI 决策流程总览

```
1. 评估当前状态
   ├─ 自身HP比例
   ├─ 对方HP比例
   ├─ 自身状态异常
   └─ 对方状态异常

2. 评估可用技能
   ├─ 属性相克效果
   ├─ 伤害预估
   ├─ 命中概率
   ├─ PP剩余
   └─ 附加效果

3. 决策选择
   ├─ 野生怪兽：简单决策
   └─ 训练师怪兽：复杂决策

4. 执行行动
```

### 5.2 野生怪兽 AI 策略

#### 5.2.1 决策模式

野生怪兽使用**简单随机策略**，但偏好有效技能。

```javascript
function wildMonsterAI(monster, enemy) {
    const availableSkills = monster.skills.filter(s => s.pp > 0);

    // 为每个技能评分
    const scoredSkills = availableSkills.map(skill => {
        let score = 1;

        // 1. 属性相克加成
        const typeMultiplier = getTypeMultiplier(skill.type, enemy.type);
        if (typeMultiplier === 2) {
            score += 10;  // 克制技能大幅加分
        } else if (typeMultiplier === 0.5) {
            score -= 5;   // 抵抗技能减分
        }

        // 2. 威力加成
        score += skill.power / 10;

        // 3. 少量随机因素
        score += Math.random() * 5;

        return { skill, score };
    });

    // 选择评分最高的技能
    scoredSkills.sort((a, b) => b.score - a.score);
    return scoredSkills[0].skill;
}
```

#### 5.2.2 行为特点

- 不会使用道具
- 不会交换怪兽
- 不会逃跑（除非HP极低）
- 偏好克制属性的技能
- 不会刻意针对状态异常

#### 5.2.3 逃跑判定

```javascript
function shouldRunWild(monster, enemy) {
    // HP < 20% 时尝试逃跑
    if (monster.stats.hp / monster.stats.maxHp < 0.2) {
        return Math.random() < 0.5;  // 50% 概率逃跑
    }
    return false;
}
```

### 5.3 训练师怪兽 AI 策略

#### 5.3.1 决策模式

训练师怪兽使用**智能策略**，考虑更多因素。

#### 5.3.2 策略矩阵

| 自身HP | 对方HP | 优先策略 |
|--------|--------|----------|
| > 70% | > 70% | 全力攻击，尝试附加状态 |
| > 70% | 30~70% | 使用克制技能，追求伤害 |
| > 70% | < 30% | 用最强技能收尾 |
| 30~70% | > 70% | 攻击 + 回血（如果有）|
| 30~70% | 30~70% | 试探攻击，伺机爆发 |
| 30~70% | < 30% | 确保击杀 |
| < 30% | > 70% | 回血/防守优先 |
| < 30% | 30~70% | 尝试回血，否则拼命 |
| < 30% | < 30% | 赌命攻击！|

#### 5.3.3 技能评分详细算法

```javascript
function trainerMonsterAI(monster, enemy, trainerInventory) {
    const availableSkills = monster.skills.filter(s => s.pp > 0);
    const hpRatio = monster.stats.hp / monster.stats.maxHp;
    const enemyHpRatio = enemy.stats.hp / enemy.stats.maxHp;

    const scoredSkills = availableSkills.map(skill => {
        let score = 0;

        // 1. 属性相克（权重最高）
        const typeMult = getTypeMultiplier(skill.type, enemy.type);
        if (typeMult === 2) {
            score += 50;
        } else if (typeMult === 0.5) {
            score -= 30;
        }

        // 2. 伤害预估
        const estimatedDamage = calculateDamage(monster, enemy, skill);
        score += estimatedDamage;

        // 3. 斩杀判定
        if (estimatedDamage >= enemy.stats.hp) {
            score += 100;  // 能斩杀时大幅加分
        }

        // 4. 状态异常策略
        if (skill.effect && !enemy.status) {
            if (hpRatio < 0.3 && skill.effect.type === 'heal') {
                score += 80;  // 低HP时回血优先
            }
            if (skill.effect.type === 'burn' || skill.effect.type === 'paralyze') {
                score += 20;  // 附加状态异常加分
            }
        }

        // 5. 命中率考虑
        score *= (skill.accuracy / 100);

        // 6. PP 保留策略
        if (skill.pp <= 3) {
            score -= 10;  // PP 不足时减分
        }

        // 7. 随机因素（少量）
        score += Math.random() * 10;

        return { skill, score };
    });

    // 排序并返回最佳选择
    scoredSkills.sort((a, b) => b.score - a.score);

    return {
        action: 'use_skill',
        skill: scoredSkills[0].skill
    };
}
```

#### 5.3.4 道具使用策略

```javascript
function shouldUseItem(monster, enemy, inventory) {
    const hpRatio = monster.stats.hp / monster.stats.maxHp;

    // HP < 30% 时使用药水
    if (hpRatio < 0.3) {
        const potions = inventory.filter(i =>
            i.effect && i.effect.type === 'heal_hp'
        );
        if (potions.length > 0) {
            return {
                action: 'use_item',
                item: potions[0]
            };
        }
    }

    // 状态异常时使用状态解除药
    if (monster.status) {
        const statusHealers = inventory.filter(i =>
            i.effect && i.effect.type === 'cure_status'
        );
        if (statusHealers.length > 0) {
            return {
                action: 'use_item',
                item: statusHealers[0]
            };
        }
    }

    return null;
}
```

#### 5.3.5 怪兽交换策略

```javascript
function shouldSwitchMonster(currentMonster, party, enemy) {
    const hpRatio = currentMonster.stats.hp / currentMonster.stats.maxHp;

    // HP < 15% 时考虑交换
    if (hpRatio < 0.15) {
        const availableMonsters = party.filter(m =>
            m !== currentMonster &&
            m.stats.hp > 0
        );

        if (availableMonsters.length > 0) {
            // 选择属性克制的怪兽
            for (const candidate of availableMonsters) {
                if (getTypeMultiplier(candidate.type, enemy.type) === 2) {
                    return {
                        action: 'switch',
                        monster: candidate
                    };
                }
            }

            // 没有克制的就选HP最高的
            availableMonsters.sort((a, b) =>
                (b.stats.hp / b.stats.maxHp) - (a.stats.hp / a.stats.maxHp)
            );

            return {
                action: 'switch',
                monster: availableMonsters[0]
            };
        }
    }

    return null;
}
```

---

## 6. 行动顺序判定

### 6.1 速度计算公式

```
实际速度 = 基础速度 × 状态修正 × 装备修正 × 场地修正
```

| 修正因素 | 说明 | 倍率 |
|----------|------|------|
| 基础速度 | 怪兽的 spd 属性 | - |
| 状态修正 | 麻痹 ×0.25 | 0.25 ~ 1.0 |
| 装备修正 | 装备提供的速度加成 | 0.5 ~ 2.0 |
| 场地修正 | 某些场地效果 | 0.5 ~ 2.0 |

### 6.2 行动顺序判定流程

```javascript
function determineTurnOrder(monsterA, monsterB) {
    const speedA = calculateEffectiveSpeed(monsterA);
    const speedB = calculateEffectiveSpeed(monsterB);

    // 速度不同时，速度快的先行动
    if (speedA > speedB) {
        return [monsterA, monsterB];
    } else if (speedB > speedA) {
        return [monsterB, monsterA];
    } else {
        // 速度相同时随机决定
        return Math.random() < 0.5
            ? [monsterA, monsterB]
            : [monsterB, monsterA];
    }
}
```

### 6.3 优先度机制

某些技能具有**优先度**，无视速度判定先行动。

| 优先度 | 技能类型 | 示例 |
|--------|----------|------|
| +5 | 抢先攻击 | 电光一闪 |
| +1 | 辅助技能 | 护盾、增益 |
| 0 | 普通技能 | 大多数攻击技能 |
| -1 | 后手技能 | 反击、双倍奉还 |

```javascript
function calculatePriority(skill) {
    return skill.priority || 0;
}

function determineTurnOrderWithPriority(monsterA, skillA, monsterB, skillB) {
    const priorityA = calculatePriority(skillA);
    const priorityB = calculatePriority(skillB);

    // 优先度高的先行动
    if (priorityA !== priorityB) {
        return priorityA > priorityB
            ? [monsterA, monsterB]
            : [monsterB, monsterA];
    }

    // 优先度相同时比较速度
    return determineTurnOrder(monsterA, monsterB);
}
```

---

## 7. 经验值与等级提升

### 7.1 经验值计算公式

```
获得经验 = 基础经验 × 对方等级 / 5 × 参与人数修正 × 幸运修正
```

| 参数 | 说明 |
|------|------|
| 基础经验 | 对方怪兽的 expReward |
| 对方等级 | 被击败怪兽的等级 |
| 参与人数修正 | 1（单只）/ 0.5（两只）等 |
| 幸运修正 | 1.0（正常）~ 2.0（幸运道具）|

### 7.2 等级提升判定

```javascript
function checkLevelUp(monster) {
    if (monster.exp >= monster.expToNext) {
        // 升级
        monster.level++;
        monster.exp -= monster.expToNext;
        monster.expToNext = calculateExpToNext(monster.level);

        // 提升属性
        const statGrowth = getStatGrowth(monster.monsterId);
        monster.stats.maxHp += statGrowth.hp;
        monster.stats.hp = monster.stats.maxHp;  // 升级时回满HP
        monster.stats.atk += statGrowth.atk;
        monster.stats.def += statGrowth.def;
        monster.stats.spAtk += statGrowth.spAtk;
        monster.stats.spDef += statGrowth.spDef;
        monster.stats.spd += statGrowth.spd;

        // 检查是否学会新技能
        const newSkill = checkNewSkill(monster.monsterId, monster.level);

        return {
            leveledUp: true,
            newLevel: monster.level,
            newSkill: newSkill
        };
    }

    return { leveledUp: false };
}
```

### 7.3 经验值曲线

```javascript
function calculateExpToNext(level) {
    // 中等速度的经验曲线
    return Math.floor(4 * Math.pow(level, 3) / 5);
}
```

| 等级 | 所需经验 | 累计经验 |
|------|----------|----------|
| 1 | 0 | 0 |
| 2 | 6 | 6 |
| 5 | 100 | 173 |
| 10 | 800 | 2,000 |
| 20 | 6,400 | 32,000 |
| 50 | 100,000 | 1,250,000 |
| 100 | 800,000 | 20,000,000 |

---

## 附录 A：伤害计算流程图

```
开始伤害计算
    │
    ├─ 选择技能
    │   └─ 检查 PP
    │       └─ PP 不足？→ 选择其他技能
    │
    ├─ 命中判定
    │   └─ 未命中？→ 显示 Miss → 结束
    │
    ├─ 计算基础伤害
    │   ├─ (等级 × 2 / 5 + 2)
    │   ├─ × 技能威力
    │   ├─ × (攻击 / 防御)
    │   ├─ / 50
    │   └─ + 2
    │
    ├─ 应用各种倍率
    │   ├─ 属性相克 (0.5/1/2)
    │   ├─ 随机浮动 (0.85~1.0)
    │   ├─ STAB 加成 (1.5)
    │   ├─ 会心一击 (1.5)
    │   └─ 装备加成
    │
    ├─ 向下取整
    │
    ├─ 应用伤害
    │   ├─ HP 减少
    │   ├─ 检查 HP < 0 → 设为 0
    │   └─ 检查濒死
    │
    ├─ 附加状态判定
    │   └─ 概率成功？→ 附加状态
    │
    └─ 显示伤害数字 → 结束
```

---

## 附录 B：状态效果一览

| 状态 | 持续回合 | 每回合伤害 | 行动限制 | 治愈方式 |
|------|----------|------------|----------|----------|
| 灼烧 | 2~5 | 1/16 HP | 攻击×0.5 | 烧伤药、退场 |
| 麻痹 | 3~6 | 无 | 25% 跳过，速度×0.25 | 麻痹药、退场 |
| 中毒 | 3~6 | 1/8 HP | 无 | 解毒药、退场 |
| 冰冻 | 1~4 | 无 | 100% 跳过 | 火焰攻击、冰冻药、退场 |
| 睡眠 | 1~3 | 无 | 100% 跳过 | 时间经过、受到攻击、苏醒药 |

---

## 附录 C：快速参考 - 属性相克

```
火  → 草 ✓    火 → 水 ✗
水  → 火 ✓    水 → 草 ✗
草  → 水 ✓    草 → 火 ✗
电  → 水 ✓    电 → 草 ✗
普通→ 无特效
```
