/**
 * 伤害计算器 - 负责计算战斗中的伤害数值
 * 参考 docs/battle-algorithm-design.md 中的伤害公式
 */

/**
 * 伤害计算结果对象
 * @typedef {Object} DamageResult
 * @property {number} damage - 最终伤害值
 * @property {number} baseDamage - 基础伤害
 * @property {number} typeMultiplier - 属性相克倍率
 * @property {number} randomFactor - 随机浮动系数
 * @property {boolean} isCritical - 是否会心一击
 * @property {boolean} isHit - 是否命中
 * @property {boolean} hasStab - 是否有同属性加成（STAB）
 * @property {string} effectiveness - 效果描述 ('super_effective', 'not_effective', 'normal')
 */

/**
 * 伤害计算器类
 */
class DamageCalculator {
    constructor() {
        // 基础暴击率 1/16 (6.25%)
        this.baseCriticalRate = 1 / 16;
        // 暴击伤害倍率
        this.criticalMultiplier = 1.5;
        // STAB 同属性加成倍率
        this.stabMultiplier = 1.5;
    }

    /**
     * 获取技能模板
     * @param {Object|string} skill - 技能对象或技能ID
     * @returns {Object|null} 技能模板
     */
    getSkillTemplate(skill) {
        if (!skill) return null;
        if (typeof skill === 'string') {
            return SkillTemplates[skill];
        }
        if (skill.skillId) {
            return SkillTemplates[skill.skillId];
        }
        // 如果已经是完整技能对象
        return skill.id ? SkillTemplates[skill.id] || skill : skill;
    }

    /**
     * 计算完整伤害
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} defender - 防御方怪兽
     * @param {Object|string} skill - 使用的技能
     * @param {Object} [options] - 可选参数
     * @param {number} [options.equipmentMultiplier=1] - 装备加成倍率
     * @param {number} [options.criticalStage=0] - 暴击阶段
     * @returns {DamageResult} 伤害计算结果
     */
    calculateDamage(attacker, defender, skill, options = {}) {
        const {
            equipmentMultiplier = 1,
            criticalStage = 0
        } = options;

        const skillTemplate = this.getSkillTemplate(skill);
        if (!skillTemplate) {
            return {
                damage: 0,
                baseDamage: 0,
                typeMultiplier: 1,
                randomFactor: 1,
                isCritical: false,
                isHit: false,
                hasStab: false,
                effectiveness: 'normal'
            };
        }

        // 1. 检查命中判定
        const isHit = this.checkHit(attacker, defender, skillTemplate);
        if (!isHit) {
            return {
                damage: 0,
                baseDamage: 0,
                typeMultiplier: 1,
                randomFactor: 1,
                isCritical: false,
                isHit: false,
                hasStab: false,
                effectiveness: 'normal'
            };
        }

        // 2. 计算基础伤害
        const baseDamage = this.calculateBaseDamage(attacker, defender, skillTemplate);

        // 3. 计算属性相克倍率
        const typeMultiplier = this.getTypeMultiplier(skillTemplate.type, defender.type);
        const effectiveness = this.getEffectiveness(typeMultiplier);

        // 4. 计算随机浮动
        const randomFactor = this.getRandomFactor();

        // 5. 检查会心一击
        const isCritical = this.checkCritical(attacker, criticalStage);
        const criticalMult = isCritical ? this.criticalMultiplier : 1;

        // 6. 检查 STAB 加成
        const hasStab = this.checkStab(attacker, skillTemplate);
        const stabMult = hasStab ? this.stabMultiplier : 1;

        // 7. 计算最终伤害
        let finalDamage = baseDamage;
        finalDamage *= typeMultiplier;
        finalDamage *= randomFactor;
        finalDamage *= criticalMult;
        finalDamage *= equipmentMultiplier;
        finalDamage *= stabMult;

        // 向下取整
        finalDamage = Math.floor(finalDamage);

        // 确保伤害至少为 1（命中情况下）
        finalDamage = Math.max(1, finalDamage);

        return {
            damage: finalDamage,
            baseDamage,
            typeMultiplier,
            randomFactor,
            isCritical,
            isHit: true,
            hasStab,
            effectiveness
        };
    }

    /**
     * 计算基础伤害
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} defender - 防御方怪兽
     * @param {Object} skillTemplate - 使用的技能模板
     * @returns {number} 基础伤害
     */
    calculateBaseDamage(attacker, defender, skillTemplate) {
        // 如果是状态技能，基础伤害为0
        if (skillTemplate.category === SkillCategory.STATUS || !skillTemplate.power || skillTemplate.power === 0) {
            return 0;
        }

        // 获取攻击和防御属性
        const attackStat = this.getAttackStat(attacker, skillTemplate);
        const defenseStat = this.getDefenseStat(defender, skillTemplate);

        // 技能威力随等级成长（每级 +2%）
        const levelScale = 1 + Math.max(0, (attacker.level || 1) - 1) * 0.02;
        const effectivePower = skillTemplate.power * levelScale;

        // 公式: 基础伤害 = (攻击者等级 × 2 / 5 + 2) × 技能威力 × (攻击 / 防御) / 50 + 2
        const levelPart = (attacker.level * 2 / 5) + 2;
        const attackDefenseRatio = defenseStat > 0 ? attackStat / defenseStat : 1;

        let baseDamage = levelPart * effectivePower * attackDefenseRatio / 50 + 2;

        return Math.floor(baseDamage);
    }

    /**
     * 获取攻击方的攻击属性值
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} skillTemplate - 使用的技能模板
     * @returns {number} 攻击属性值
     */
    getAttackStat(attacker, skillTemplate) {
        let stat;
        if (skillTemplate.category === SkillCategory.PHYSICAL) {
            stat = attacker.stats.atk;
            // 灼烧状态下物理攻击减半
            if (attacker.status === StatusEffect.BURN) {
                stat = Math.floor(stat * 0.5);
            }
        } else if (skillTemplate.category === SkillCategory.SPECIAL) {
            stat = attacker.stats.spAtk;
        } else {
            stat = 0;
        }
        return Math.max(1, stat);
    }

    /**
     * 获取防御方的防御属性值
     * @param {Object} defender - 防御方怪兽
     * @param {Object} skillTemplate - 使用的技能模板
     * @returns {number} 防御属性值
     */
    getDefenseStat(defender, skillTemplate) {
        let stat;
        if (skillTemplate.category === SkillCategory.PHYSICAL) {
            stat = defender.stats.def;
        } else if (skillTemplate.category === SkillCategory.SPECIAL) {
            stat = defender.stats.spDef;
        } else {
            stat = 1;
        }
        return Math.max(1, stat);
    }

    /**
     * 获取属性相克倍率
     * @param {string} attackType - 攻击属性
     * @param {string} defenseType - 防御属性
     * @returns {number} 属性相克倍率 (0.5, 1, 2)
     */
    getTypeMultiplier(attackType, defenseType) {
        if (!ElementMultiplier[attackType]) {
            return 1;
        }
        return ElementMultiplier[attackType][defenseType] || 1;
    }

    /**
     * 获取效果描述
     * @param {number} multiplier - 属性相克倍率
     * @returns {string} 效果描述
     */
    getEffectiveness(multiplier) {
        if (multiplier > 1) {
            return 'super_effective';
        } else if (multiplier < 1) {
            return 'not_effective';
        }
        return 'normal';
    }

    /**
     * 生成随机浮动系数
     * @returns {number} 0.85 ~ 1.0 之间的随机数，步长 0.01
     */
    getRandomFactor() {
        // 生成 85 到 100 之间的整数，然后除以 100
        return (Math.floor(Math.random() * 16) + 85) / 100;
    }

    /**
     * 检查是否命中
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} defender - 防御方怪兽
     * @param {Object} skillTemplate - 使用的技能模板
     * @returns {boolean} 是否命中
     */
    checkHit(attacker, defender, skillTemplate) {
        // 状态技能默认命中（除非特殊设定）
        if (skillTemplate.category === SkillCategory.STATUS) {
            return true;
        }

        let hitRate = skillTemplate.accuracy || 100;

        // 麻痹状态降低命中率
        if (attacker.status === StatusEffect.PARALYZE) {
            hitRate *= 0.75;
        }

        // 随机判定
        const roll = Math.random() * 100;

        return roll < hitRate;
    }

    /**
     * 检查是否会心一击
     * @param {Object} attacker - 攻击方怪兽
     * @param {number} criticalStage - 暴击阶段
     * @returns {boolean} 是否暴击
     */
    checkCritical(attacker, criticalStage = 0) {
        let criticalRate = this.baseCriticalRate;

        // 应用暴击阶段倍率
        const stageMultipliers = [1, 2, 4, 8, 16];
        const stage = Math.max(0, Math.min(criticalStage, stageMultipliers.length - 1));
        criticalRate *= stageMultipliers[stage];

        // 最高 100% 暴击率
        criticalRate = Math.min(1, criticalRate);

        return Math.random() < criticalRate;
    }

    /**
     * 检查是否有 STAB 同属性加成
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} skillTemplate - 使用的技能模板
     * @returns {boolean} 是否有 STAB 加成
     */
    checkStab(attacker, skillTemplate) {
        return attacker.type === skillTemplate.type;
    }

    /**
     * 计算实际速度（用于行动顺序判定）
     * @param {Object} monster - 怪兽
     * @returns {number} 实际速度
     */
    calculateEffectiveSpeed(monster) {
        let speed = monster.stats.spd;

        // 麻痹状态速度降低至 25%
        if (monster.status === StatusEffect.PARALYZE) {
            speed = Math.floor(speed * 0.25);
        }

        return Math.max(1, speed);
    }

    /**
     * 判定行动顺序
     * @param {Object} monsterA - 怪兽A
     * @param {Object} monsterB - 怪兽B
     * @param {Object} [skillA] - 怪兽A使用的技能（用于优先度判定）
     * @param {Object} [skillB] - 怪兽B使用的技能（用于优先度判定）
     * @returns {Array} 排序后的怪兽数组 [先行动者, 后行动者]
     */
    determineTurnOrder(monsterA, monsterB, skillA = null, skillB = null) {
        // 检查技能优先度
        if (skillA && skillB) {
            const skillTemplateA = this.getSkillTemplate(skillA);
            const skillTemplateB = this.getSkillTemplate(skillB);
            const priorityA = skillTemplateA?.priority || 0;
            const priorityB = skillTemplateB?.priority || 0;

            if (priorityA !== priorityB) {
                return priorityA > priorityB ? [monsterA, monsterB] : [monsterB, monsterA];
            }
        }

        // 优先度相同时比较速度
        const speedA = this.calculateEffectiveSpeed(monsterA);
        const speedB = this.calculateEffectiveSpeed(monsterB);

        if (speedA > speedB) {
            return [monsterA, monsterB];
        } else if (speedB > speedA) {
            return [monsterB, monsterA];
        } else {
            // 速度相同时随机决定
            return Math.random() < 0.5 ? [monsterA, monsterB] : [monsterB, monsterA];
        }
    }

    /**
     * 计算状态伤害（灼烧、中毒等）
     * @param {Object} monster - 怪兽
     * @param {string} status - 状态类型
     * @returns {number} 状态伤害值
     */
    calculateStatusDamage(monster, status) {
        const maxHp = monster.stats.maxHp;

        switch (status) {
            case StatusEffect.BURN:
                // 灼烧伤害：最大HP的 1/16
                return Math.max(1, Math.floor(maxHp / 16));
            case StatusEffect.POISON:
                // 中毒伤害：最大HP的 1/8
                return Math.max(1, Math.floor(maxHp / 8));
            default:
                return 0;
        }
    }
}

// 创建全局实例
const damageCalculator = new DamageCalculator();
window.damageCalculator = damageCalculator;
