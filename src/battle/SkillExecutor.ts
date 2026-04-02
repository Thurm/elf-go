/**
 * 技能执行器 - 负责执行技能效果、应用状态、AI决策
 */

/**
 * 技能执行结果对象
 * @typedef {Object} SkillExecutionResult
 * @property {string} type - 结果类型 ('damage', 'status', 'heal', 'miss')
 * @property {Object} [damageResult] - 伤害计算结果（如果是伤害技能）
 * @property {Object} [statusEffect] - 状态效果（如果附加状态）
 * @property {number} [healAmount] - 治疗量（如果是治疗技能）
 * @property {Array<string>} messages - 战斗日志消息
 */

/**
 * 技能执行器类
 */
class SkillExecutor {
    statusDurations: Record<string, { min: number; max: number }>;

    constructor() {
        // 状态持续回合范围
        this.statusDurations = {
            [StatusEffect.BURN]: { min: 2, max: 5 },
            [StatusEffect.PARALYZE]: { min: 3, max: 6 },
            [StatusEffect.POISON]: { min: 3, max: 6 },
            [StatusEffect.FREEZE]: { min: 1, max: 4 },
            [StatusEffect.SLEEP]: { min: 1, max: 3 }
        };
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
        return skill.id ? SkillTemplates[skill.id] || skill : skill;
    }

    /**
     * 获取怪兽的技能列表（包含模板数据）
     * @param {Object} monster - 怪兽
     * @returns {Array<Object>} 技能列表
     */
    getMonsterSkills(monster) {
        if (!monster.skills) return [];

        return monster.skills.map(skillRef => {
            const skillId = typeof skillRef === 'string' ? skillRef : skillRef.skillId;
            const template = SkillTemplates[skillId];
            if (!template) return null;

            // 合并模板和PP数据
            return {
                ...template,
                id: skillId,
                skillId: skillId,
                pp: typeof skillRef === 'object' ? (skillRef.pp ?? template.maxPp) : template.maxPp,
                maxPp: template.maxPp
            };
        }).filter(Boolean);
    }

    /**
     * 执行技能
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} defender - 防御方怪兽
     * @param {Object|string} skill - 使用的技能
     * @returns {SkillExecutionResult} 执行结果
     */
    executeSkill(attacker, defender, skill) {
        const result: SkillExecutionResult = {
            type: 'damage',
            messages: []
        };

        const skillTemplate = this.getSkillTemplate(skill);
        if (!skillTemplate) {
            result.messages.push('技能不存在！');
            return result;
        }

        // 消耗 PP（查找并更新怪兽的技能PP）
        this.consumePP(attacker, skill);

        // 根据技能分类执行
        if (skillTemplate.category === SkillCategory.STATUS) {
            return this.executeStatusSkill(attacker, defender, skillTemplate);
        } else {
            return this.executeAttackSkill(attacker, defender, skillTemplate);
        }
    }

    /**
     * 消耗技能PP
     * @param {Object} monster - 怪兽
     * @param {Object|string} skill - 技能
     */
    consumePP(monster, skill) {
        if (!monster.skills) return;

        const skillId = typeof skill === 'string' ? skill : (skill.skillId || skill.id);

        for (let i = 0; i < monster.skills.length; i++) {
            const skillRef = monster.skills[i];
            const refId = typeof skillRef === 'string' ? skillRef : skillRef.skillId;

            if (refId === skillId) {
                if (typeof skillRef === 'object' && skillRef.pp !== undefined) {
                    skillRef.pp = Math.max(0, skillRef.pp - 1);
                }
                break;
            }
        }
    }

    /**
     * 获取技能当前PP
     * @param {Object} monster - 怪兽
     * @param {string} skillId - 技能ID
     * @returns {number} 当前PP
     */
    getSkillPP(monster, skillId) {
        if (!monster.skills) return 0;

        for (const skillRef of monster.skills) {
            const refId = typeof skillRef === 'string' ? skillRef : skillRef.skillId;
            if (refId === skillId) {
                const template = SkillTemplates[skillId];
                return typeof skillRef === 'object' ? (skillRef.pp ?? template?.maxPp ?? 10) : template?.maxPp ?? 10;
            }
        }
        return 0;
    }

    /**
     * 执行攻击技能
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} defender - 防御方怪兽
     * @param {Object} skillTemplate - 使用的技能模板
     * @returns {SkillExecutionResult} 执行结果
     */
    executeAttackSkill(attacker, defender, skillTemplate) {
        const result: SkillExecutionResult = {
            type: 'damage',
            messages: []
        };

        // 计算伤害
        const damageResult = damageCalculator.calculateDamage(attacker, defender, skillTemplate);
        result.damageResult = damageResult;

        // 添加技能使用消息
        result.messages.push(`${attacker.name}使用了${skillTemplate.name}！`);

        // 检查命中
        if (!damageResult.isHit) {
            result.type = 'miss';
            result.messages.push('但是没有命中...');
            return result;
        }

        // 应用伤害
        defender.stats.hp = Math.max(0, defender.stats.hp - damageResult.damage);

        // 添加效果描述消息
        if (damageResult.effectiveness === 'super_effective') {
            result.messages.push('效果拔群！');
        } else if (damageResult.effectiveness === 'not_effective') {
            result.messages.push('效果不好...');
        }

        // 会心一击消息
        if (damageResult.isCritical) {
            result.messages.push('击中了要害！');
        }

        // 伤害消息
        result.messages.push(`${defender.name}受到了${damageResult.damage}点伤害！`);

        // 检查是否附加状态
        if (skillTemplate.effect && skillTemplate.effect.type) {
            const statusResult = this.tryApplyStatus(defender, skillTemplate.effect);
            if (statusResult.applied) {
                result.statusEffect = statusResult;
                result.messages.push(statusResult.message);
            }
        }

        // 检查冰冻是否被火属性攻击解冻
        if (defender.status === StatusEffect.FREEZE && skillTemplate.type === ElementType.FIRE) {
            this.cureStatus(defender);
            result.messages.push(`${defender.name}解冻了！`);
        }

        // 检查睡眠是否被攻击惊醒
        if (defender.status === StatusEffect.SLEEP && Math.random() < 0.5) {
            this.cureStatus(defender);
            result.messages.push(`${defender.name}醒过来了！`);
        }

        return result;
    }

    /**
     * 执行状态技能
     * @param {Object} attacker - 攻击方怪兽
     * @param {Object} defender - 防御方怪兽
     * @param {Object} skillTemplate - 使用的技能模板
     * @returns {SkillExecutionResult} 执行结果
     */
    executeStatusSkill(attacker, defender, skillTemplate) {
        const result: SkillExecutionResult = {
            type: 'status',
            messages: []
        };

        result.messages.push(`${attacker.name}使用了${skillTemplate.name}！`);

        if (!skillTemplate.effect) {
            return result;
        }

        // 根据效果类型执行
        switch (skillTemplate.effect.type) {
            case 'heal':
                result.type = 'heal';
                result.healAmount = this.executeHeal(attacker, skillTemplate.effect);
                result.messages.push(`${attacker.name}恢复了${result.healAmount}点HP！`);
                break;

            case StatusEffect.BURN:
            case StatusEffect.PARALYZE:
            case StatusEffect.POISON:
            case StatusEffect.FREEZE:
            case StatusEffect.SLEEP:
                // 目标是自己还是敌人
                const target = skillTemplate.target === SkillTarget.SELF ? attacker : defender;
                const statusResult = this.tryApplyStatus(target, skillTemplate.effect);
                if (statusResult.applied) {
                    result.statusEffect = statusResult;
                    result.messages.push(statusResult.message);
                } else {
                    result.messages.push('但是没有效果...');
                }
                break;

            default:
                // 其他状态效果
                result.messages.push(`${skillTemplate.description || '效果发动了！'}`);
        }

        return result;
    }

    /**
     * 执行治疗
     * @param {Object} monster - 怪兽
     * @param {Object} effect - 治疗效果
     * @returns {number} 治疗量
     */
    executeHeal(monster, effect) {
        let healAmount;
        if (effect.percent) {
            // 按百分比治疗
            healAmount = Math.floor(monster.stats.maxHp * effect.percent);
        } else if (effect.amount) {
            // 固定数值治疗
            healAmount = effect.amount;
        } else {
            // 默认治疗最大HP的50%
            healAmount = Math.floor(monster.stats.maxHp * 0.5);
        }

        // 不能超过最大HP
        const actualHeal = Math.min(healAmount, monster.stats.maxHp - monster.stats.hp);
        monster.stats.hp += actualHeal;

        return actualHeal;
    }

    /**
     * 尝试附加状态效果
     * @param {Object} monster - 目标怪兽
     * @param {Object} effect - 状态效果
     * @returns {Object} 应用结果
     */
    tryApplyStatus(monster, effect) {
        const result: { applied: boolean; status: string; message: string; duration?: number } = {
            applied: false,
            status: effect.type,
            message: ''
        };

        // 如果已经有状态了，不能再附加（除非是覆盖类效果）
        if (monster.status && monster.status !== effect.type) {
            result.message = `${monster.name}已经有其他状态了！`;
            return result;
        }

        // 概率判定
        const chance = effect.chance || 100;
        if (Math.random() * 100 >= chance) {
            return result;
        }

        // 计算持续回合
        const durationRange = this.statusDurations[effect.type];
        const duration = effect.duration ||
            (durationRange ?
                Math.floor(Math.random() * (durationRange.max - durationRange.min + 1)) + durationRange.min :
                3);

        // 应用状态
        monster.status = effect.type;
        monster.statusTurns = duration;

        result.applied = true;
        result.duration = duration;
        result.message = this.getStatusAppliedMessage(monster, effect.type);

        return result;
    }

    /**
     * 获取状态附加消息
     * @param {Object} monster - 怪兽
     * @param {string} status - 状态类型
     * @returns {string} 状态消息
     */
    getStatusAppliedMessage(monster, status) {
        const messages = {
            [StatusEffect.BURN]: `${monster.name}被灼烧了！`,
            [StatusEffect.PARALYZE]: `${monster.name}身体麻痹了！`,
            [StatusEffect.POISON]: `${monster.name}中毒了！`,
            [StatusEffect.FREEZE]: `${monster.name}被冻住了！`,
            [StatusEffect.SLEEP]: `${monster.name}睡着了！`
        };
        return messages[status] || `${monster.name}陷入了异常状态！`;
    }

    /**
     * 治愈状态
     * @param {Object} monster - 怪兽
     */
    cureStatus(monster) {
        monster.status = null;
        monster.statusTurns = 0;
    }

    /**
     * 处理回合开始时的状态效果
     * @param {Object} monster - 怪兽
     * @returns {Array<string>} 状态消息
     */
    processTurnStartStatus(monster) {
        const messages = [];

        if (!monster.status) {
            return messages;
        }

        switch (monster.status) {
            case StatusEffect.BURN:
                const burnDamage = damageCalculator.calculateStatusDamage(monster, StatusEffect.BURN);
                monster.stats.hp = Math.max(0, monster.stats.hp - burnDamage);
                messages.push(`${monster.name}受到了灼烧的伤害！`);
                messages.push(`损失了${burnDamage}点HP！`);
                break;

            case StatusEffect.POISON:
                const poisonDamage = damageCalculator.calculateStatusDamage(monster, StatusEffect.POISON);
                monster.stats.hp = Math.max(0, monster.stats.hp - poisonDamage);
                messages.push(`${monster.name}受到了毒素的伤害！`);
                messages.push(`损失了${poisonDamage}点HP！`);
                break;

            case StatusEffect.FREEZE:
                // 30% 概率自然解冻
                if (Math.random() < 0.3) {
                    this.cureStatus(monster);
                    messages.push(`${monster.name}解冻了！`);
                } else {
                    messages.push(`${monster.name}被冻住了，无法行动！`);
                }
                break;

            case StatusEffect.SLEEP:
                monster.statusTurns = (monster.statusTurns || 0) - 1;
                if (monster.statusTurns <= 0) {
                    this.cureStatus(monster);
                    messages.push(`${monster.name}醒过来了！`);
                } else {
                    messages.push(`${monster.name}正在熟睡中...`);
                }
                break;

            case StatusEffect.PARALYZE:
                // 麻痹效果在行动时检查
                break;
        }

        // 减少状态持续回合（睡眠状态已在上面处理）
        if (monster.status && monster.status !== StatusEffect.SLEEP) {
            monster.statusTurns = (monster.statusTurns || 0) - 1;
            if (monster.statusTurns <= 0) {
                this.cureStatus(monster);
                messages.push(`${monster.name}的状态恢复了！`);
            }
        }

        return messages;
    }

    /**
     * 检查怪兽是否可以行动
     * @param {Object} monster - 怪兽
     * @returns {Object} 行动检查结果
     */
    checkCanAct(monster) {
        const result = {
            canAct: true,
            message: ''
        };

        if (!monster.status) {
            return result;
        }

        switch (monster.status) {
            case StatusEffect.FREEZE:
            case StatusEffect.SLEEP:
                result.canAct = false;
                break;

            case StatusEffect.PARALYZE:
                // 25% 概率无法行动
                if (Math.random() < 0.25) {
                    result.canAct = false;
                    result.message = `${monster.name}身体麻痹了，无法行动！`;
                }
                break;
        }

        return result;
    }

    // ==================== AI 决策逻辑 ====================

    /**
     * 野生怪兽 AI 决策
     * @param {Object} monster - 野生怪兽
     * @param {Object} enemy - 敌方怪兽
     * @returns {Object} 决策结果 { action: 'use_skill', skill: Object }
     */
    wildMonsterAI(monster, enemy) {
        const monsterSkills = this.getMonsterSkills(monster);
        const availableSkills = monsterSkills.filter(skill => {
            const currentPP = this.getSkillPP(monster, skill.id);
            return currentPP > 0;
        });

        if (availableSkills.length === 0) {
            // 没有可用技能，返回第一个技能
            return {
                action: 'use_skill',
                skill: monsterSkills[0] || null
            };
        }

        // 为每个技能评分
        const scoredSkills = availableSkills.map(skill => {
            let score = 1;

            // 1. 属性相克加成
            const typeMultiplier = damageCalculator.getTypeMultiplier(skill.type, enemy.type);
            if (typeMultiplier === 2) {
                score += 10;  // 克制技能大幅加分
            } else if (typeMultiplier === 0.5) {
                score -= 5;   // 抵抗技能减分
            }

            // 2. 威力加成
            if (skill.power) {
                score += skill.power / 10;
            }

            // 3. 少量随机因素
            score += Math.random() * 5;

            return { skill, score };
        });

        // 选择评分最高的技能
        scoredSkills.sort((a, b) => b.score - a.score);

        return {
            action: 'use_skill',
            skill: scoredSkills[0].skill
        };
    }

    /**
     * 检查野生怪兽是否应该逃跑
     * @param {Object} monster - 野生怪兽
     * @param {Object} enemy - 敌方怪兽
     * @returns {boolean} 是否逃跑
     */
    shouldRunWild(monster, enemy) {
        // HP < 20% 时尝试逃跑
        if (monster.stats.hp / monster.stats.maxHp < 0.2) {
            return Math.random() < 0.5;  // 50% 概率逃跑
        }
        return false;
    }

    /**
     * 训练师怪兽 AI 决策
     * @param {Object} monster - 当前怪兽
     * @param {Object} enemy - 敌方怪兽
     * @param {Array} party - 队伍怪兽
     * @param {Object} inventory - 背包物品
     * @returns {Object} 决策结果 { action: 'use_skill'|'switch'|'use_item', skill/monster/item: Object }
     */
    trainerMonsterAI(monster, enemy, party = [], inventory = {}) {
        const hpRatio = monster.stats.hp / monster.stats.maxHp;
        const enemyHpRatio = enemy.stats.hp / enemy.stats.maxHp;

        // 1. 检查是否应该使用道具
        const itemDecision = this.shouldUseItem(monster, inventory);
        if (itemDecision) {
            return itemDecision;
        }

        // 2. 检查是否应该交换怪兽
        const switchDecision = this.shouldSwitchMonster(monster, party, enemy);
        if (switchDecision) {
            return switchDecision;
        }

        // 3. 选择最佳技能
        return this.chooseBestSkill(monster, enemy, hpRatio, enemyHpRatio);
    }

    /**
     * 选择最佳技能
     * @param {Object} monster - 怪兽
     * @param {Object} enemy - 敌人
     * @param {number} hpRatio - 自身HP比例
     * @param {number} enemyHpRatio - 敌人HP比例
     * @returns {Object} 决策结果
     */
    chooseBestSkill(monster, enemy, hpRatio, enemyHpRatio) {
        const monsterSkills = this.getMonsterSkills(monster);
        const availableSkills = monsterSkills.filter(skill => {
            const currentPP = this.getSkillPP(monster, skill.id);
            return currentPP > 0;
        });

        if (availableSkills.length === 0) {
            return {
                action: 'use_skill',
                skill: monsterSkills[0] || null
            };
        }

        const scoredSkills = availableSkills.map(skill => {
            let score = 0;

            // 1. 属性相克（权重最高）
            const typeMult = damageCalculator.getTypeMultiplier(skill.type, enemy.type);
            if (typeMult === 2) {
                score += 50;
            } else if (typeMult === 0.5) {
                score -= 30;
            }

            // 2. 伤害预估
            if (skill.power > 0) {
                const estimatedDamage = damageCalculator.calculateBaseDamage(monster, enemy, skill);
                score += estimatedDamage;

                // 3. 斩杀判定
                if (estimatedDamage >= enemy.stats.hp) {
                    score += 100;  // 能斩杀时大幅加分
                }
            }

            // 4. 状态异常策略
            if (skill.effect && !enemy.status) {
                if (hpRatio < 0.3 && skill.effect.type === 'heal') {
                    score += 80;  // 低HP时回血优先
                }
                if (['burn', 'paralyze', 'poison', 'freeze', 'sleep'].includes(skill.effect.type)) {
                    score += 20;  // 附加状态异常加分
                }
            }

            // 5. 命中率考虑
            score *= ((skill.accuracy || 100) / 100);

            // 6. PP 保留策略
            const currentPP = this.getSkillPP(monster, skill.id);
            if (currentPP <= 3) {
                score -= 10;
            }

            // 7. 随机因素（少量）
            score += Math.random() * 10;

            return { skill, score };
        });

        scoredSkills.sort((a, b) => b.score - a.score);

        return {
            action: 'use_skill',
            skill: scoredSkills[0].skill
        };
    }

    /**
     * 检查是否应该使用道具
     * @param {Object} monster - 怪兽
     * @param {Object} inventory - 背包
     * @returns {Object|null} 道具决策
     */
    shouldUseItem(monster, inventory) {
        const hpRatio = monster.stats.hp / monster.stats.maxHp;
        const items = inventory.items || [];

        // HP < 30% 时使用药水
        if (hpRatio < 0.3) {
            const potions = items.filter(i =>
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
            const statusHealers = items.filter(i =>
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

    /**
     * 检查是否应该交换怪兽
     * @param {Object} currentMonster - 当前怪兽
     * @param {Array} party - 队伍
     * @param {Object} enemy - 敌人
     * @returns {Object|null} 交换决策
     */
    shouldSwitchMonster(currentMonster, party, enemy) {
        const hpRatio = currentMonster.stats.hp / currentMonster.stats.maxHp;

        // HP < 15% 时考虑交换
        if (hpRatio < 0.15) {
            const availableMonsters = party.filter(m =>
                m !== currentMonster &&
                m.stats && m.stats.hp > 0
            );

            if (availableMonsters.length > 0) {
                // 选择属性克制的怪兽
                for (const candidate of availableMonsters) {
                    if (candidate.type &&
                        damageCalculator.getTypeMultiplier(candidate.type, enemy.type) === 2) {
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
}

// 创建全局实例
const skillExecutor = new SkillExecutor();
window.skillExecutor = skillExecutor;
