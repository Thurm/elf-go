/**
 * 战斗系统 - 回合制战斗核心逻辑
 * 管理战斗状态、玩家和敌方怪兽、战斗流程
 */

/**
 * 战斗状态枚举
 */
const BattleState = {
    IDLE: 'idle',                    // 空闲状态
    STARTING: 'starting',            // 战斗开始
    PLAYER_TURN: 'player_turn',      // 玩家回合
    ENEMY_TURN: 'enemy_turn',        // 敌方回合
    PROCESSING: 'processing',        // 处理中
    VICTORY: 'victory',              // 胜利
    DEFEAT: 'defeat',                // 失败
    ENDING: 'ending',                // 战斗结束
    FLEEING: 'fleeing'               // 逃跑中
};

/**
 * 战斗系统类
 */
class BattleSystem {
    state: string;
    playerParty: BattleMonster[];
    currentPlayerMonster: BattleMonster | null;
    enemyParty: BattleMonster[];
    currentEnemyMonster: BattleMonster | null;
    turnCount: number;
    battleLog: string[];
    isWildBattle: boolean;
    canFlee: boolean;
    waitingForInput: boolean;
    inputCallback: ((data?: unknown) => void) | null;
    awaitingCaptureChoice: boolean;
    captureAfterVictory: boolean;
    lastDefeatedEnemy: BattleMonster | null;
    awaitingForcedSwitch: boolean;
    forcedSwitchMode: 'resume_turn' | 'next_turn' | null;
    pendingWildEnemy: BattleMonster | null;

    constructor() {
        // 战斗状态
        this.state = BattleState.IDLE;

        // 战斗参与方
        this.playerParty = [];           // 玩家队伍
        this.currentPlayerMonster = null; // 当前玩家怪兽
        this.enemyParty = [];            // 敌方队伍
        this.currentEnemyMonster = null;  // 当前敌方怪兽

        // 战斗数据
        this.turnCount = 0;               // 回合数
        this.battleLog = [];              // 战斗日志
        this.isWildBattle = false;        // 是否是野生战斗
        this.canFlee = true;              // 是否可以逃跑

        // 等待玩家输入
        this.waitingForInput = false;
        this.inputCallback = null;

        // 捕获选择流程
        this.awaitingCaptureChoice = false;
        this.captureAfterVictory = false;
        this.lastDefeatedEnemy = null;
        this.awaitingForcedSwitch = false;
        this.forcedSwitchMode = null;
        this.pendingWildEnemy = null;

        // 绑定事件监听
        this.bindEvents();
    }

    /**
     * 绑定事件监听
     */
    bindEvents() {
        // 监听遭遇事件开始战斗
        eventBus.on(GameEvents.MAP_ENCOUNTER, (data) => {
            const encounter = this.pickEncounterMonster(data);
            if (!encounter) {
                console.warn('[BattleSystem] 未找到怪物，无法进行战斗');
                return;
            }
            this.prepareWildBattle(encounter.monsterId || encounter, encounter.level);
        });

        // 监听战斗开始事件
        eventBus.on(GameEvents.BATTLE_START, (data) => {
            if (data.type === 'trainer') {
                this.startTrainerBattle(data.playerParty || [], data.enemyParty || []);
            }
        });

        // 监听 BattleUI 的事件
        eventBus.on('battle:use_skill', (data) => {
            this.playerUseSkill(data.skillId);
        });

        eventBus.on('battle:flee', () => {
            this.playerFlee();
        });

        eventBus.on('battle:use_bag', () => {
            console.log('[BattleSystem] 背包功能待实现');
        });

        eventBus.on('battle:use_item', (data) => {
            if (data?.item) {
                this.playerUseItem(data.item);
            }
        });

        eventBus.on('battle:catch_complete', (data) => {
            if (data?.success) {
                return;
            }

            if (this.captureAfterVictory) {
                this.captureAfterVictory = false;
                this.awaitingCaptureChoice = false;
                this.endBattle('victory');
            } else {
                this.endPlayerTurn(null);
            }
        });

        eventBus.on('battle:capture_decision', (data) => {
            this.handleCaptureDecision(data?.choice === 'yes');
        });

        eventBus.on('battle:finish_capture', () => {
            this.endBattle('capture');
        });

        eventBus.on(GameEvents.BATTLE_RESULT_CLOSE, () => {
            this.finalizeBattle();
        });

        eventBus.on('battle:switch_monster', (data) => {
            const monsterId = data?.monsterId;
            if (!monsterId) {
                return;
            }

            const selectedMonster = this.playerParty.find(monster => monster.id === monsterId);
            if (!selectedMonster) {
                this.addLog('未找到可切换的怪兽！');
                return;
            }

            this.playerSwitchMonster(selectedMonster, data?.forced === true);
        });

        eventBus.on(GameEvents.BATTLE_SELECT_LEAD, (data) => {
            const monsterId = data?.monsterId;
            if (!monsterId || !this.pendingWildEnemy) {
                return;
            }

            this.startWildBattle(this.pendingWildEnemy, this.pendingWildEnemy.level || 1, monsterId);
        });
    }

    /**
     * 从遇敌数据中选择怪物
     * @param {Object} data - 遇敌数据
     * @returns {Object|null} 选择结果 {monsterId, level}
     */
    pickEncounterMonster(data) {
        if (!data) return null;

        if (data.monster) {
            if (typeof data.monster === 'string') {
                return { monsterId: data.monster, level: data.level || 5 };
            }
            if (data.monster.monsterId) {
                return { monsterId: data.monster.monsterId, level: data.monster.level || data.level || 5 };
            }
        }

        const pool = Array.isArray(data.monsters) ? data.monsters : [];
        if (pool.length === 0) return null;

        const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
        let roll = Math.random() * totalWeight;
        let picked = pool[0];
        for (const item of pool) {
            roll -= (item.weight || 1);
            if (roll <= 0) {
                picked = item;
                break;
            }
        }

        const minLevel = picked.minLevel ?? picked.level ?? 5;
        const maxLevel = picked.maxLevel ?? minLevel;
        const level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

        return { monsterId: picked.monsterId, level };
    }

    /**
     * 创建敌方怪兽实例
     * @param {Object|string} monsterTemplate - 怪兽模板或ID
     * @param {number} [level=5] - 等级
     * @returns {Object} 怪兽实例
     */
    createEnemyMonster(monsterTemplate, level = 5) {
        let template;
        if (typeof monsterTemplate === 'string') {
            template = MonsterTemplates[monsterTemplate];
        } else {
            template = monsterTemplate;
        }

        if (!template) {
            console.error('Monster template not found:', monsterTemplate);
            return null;
        }

        // 计算等级对应的属性
        const levelMultiplier = 1 + (level - 1) * 0.1;
        const stats: MonsterStats = { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, maxHp: 0 };
        const baseStatKeys: Array<keyof BaseStats> = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'spd'];
        for (const key of baseStatKeys) {
            stats[key] = Math.floor(template.baseStats[key] * levelMultiplier);
        }
        stats.maxHp = stats.hp;

        return {
            id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            monsterId: template.id,
            name: template.name,
            type: template.type,
            level: level,
            exp: 0,
            stats: stats,
            skills: template.skills.slice(0, 4).map(skillId => ({
                skillId: skillId,
                pp: SkillTemplates[skillId]?.maxPp || 10,
                maxPp: SkillTemplates[skillId]?.maxPp || 10
            })),
            equipment: {},
            status: null,
            statusTurns: 0,
            expReward: template.expReward || 50,
            drops: template.drops || []
        };
    }

    /**
     * 开始野生战斗
     * @param {Object|string} monster - 野生怪兽或怪兽ID
     * @param {number} [level=5] - 等级
     */
    startWildBattle(monster, level = 5, leadMonsterId = null) {
        const currentState = gameStateMachine.getCurrentState();
        if (!leadMonsterId && currentState !== GameState.BATTLE && currentState !== GameState.PRE_BATTLE_SELECT) {
            this.prepareWildBattle(monster, level);
            return;
        }

        if (currentState === GameState.PRE_BATTLE_SELECT) {
            gameStateMachine.pushState(GameState.BATTLE);
        } else if (currentState !== GameState.BATTLE) {
            gameStateMachine.changeState(GameState.BATTLE);
        }

        this.isWildBattle = true;
        this.canFlee = true;

        // 获取玩家队伍
        const gameState = gameStateMachine.getGameState();
        this.playerParty = gameState?.player ? gameState.player.party || [] : [];
        this.currentPlayerMonster = this.playerParty.find(m => m.stats.hp > 0);

        // 支持指定首发怪兽
        if (leadMonsterId) {
            const selectedLead = this.playerParty.find(m => m.id === leadMonsterId && m.stats?.hp > 0);
            if (selectedLead) {
                this.currentPlayerMonster = selectedLead;
            }
        }

        // 设置敌方
        const enemyMonster = typeof monster === 'string' || !monster?.stats
            ? this.createEnemyMonster(monster, level)
            : monster;
        if (!enemyMonster) {
            console.warn('[BattleSystem] 敌方怪物创建失败，取消战斗');
            return;
        }
        this.enemyParty = [enemyMonster];
        this.currentEnemyMonster = enemyMonster;

        if (gameState?.player && enemyMonster.monsterId) {
            registerMonsterInPokedex(gameState.player, enemyMonster.monsterId, 'seen');
            gameStateMachine.updatePlayer({ pokedex: gameState.player.pokedex });
        }

        this.pendingWildEnemy = null;

        this._initBattle();
    }

    /**
     * 遇敌后先准备首发怪兽选择
     * @param {BattleMonster|string} monster
     * @param {number} level
     */
    prepareWildBattle(monster, level = 5) {
        const gameState = gameStateMachine.getGameState();
        this.playerParty = gameState?.player ? gameState.player.party || [] : [];

        if (gameStateMachine.getCurrentState() === GameState.MAP) {
            gameStateMachine.pushState(GameState.PRE_BATTLE_SELECT);
        }

        const availableMonsters = this.playerParty.filter(monsterItem => monsterItem?.stats && monsterItem.stats.hp > 0);
        if (availableMonsters.length === 0) {
            console.warn('[BattleSystem] 玩家没有可出战怪兽，无法开始战斗');
            return;
        }

        const enemyMonster = typeof monster === 'string' || !monster?.stats
            ? this.createEnemyMonster(monster, level)
            : monster;

        if (!enemyMonster) {
            console.warn('[BattleSystem] 敌方怪物创建失败，取消战斗');
            return;
        }

        this.pendingWildEnemy = enemyMonster;
        this.currentEnemyMonster = enemyMonster;

        if (gameState?.player && enemyMonster.monsterId) {
            registerMonsterInPokedex(gameState.player, enemyMonster.monsterId, 'seen');
            gameStateMachine.updatePlayer({ pokedex: gameState.player.pokedex });
        }

        eventBus.emit(GameEvents.BATTLE_ACTION, {
            type: 'prepare_wild_battle',
            enemyMonster,
            availableMonsters,
            title: '选择首发怪兽',
            prompt: `野生的${enemyMonster.name}出现了！`
        });
    }

    /**
     * 开始训练师战斗
     * @param {Array} playerParty - 玩家队伍
     * @param {Array} enemyParty - 敌方队伍
     */
    startTrainerBattle(playerParty, enemyParty) {
        this.isWildBattle = false;
        this.canFlee = false;

        this.playerParty = [...playerParty];
        this.currentPlayerMonster = this.playerParty.find(m => m.stats.hp > 0);

        this.enemyParty = enemyParty.map(m =>
            m.stats ? m : this.createEnemyMonster(m, m.level || 10)
        );
        this.currentEnemyMonster = this.enemyParty.find(m => m.stats.hp > 0);

        this._initBattle();
    }

    /**
     * 初始化战斗
     * @private
     */
    _initBattle() {
        this.state = BattleState.STARTING;
        this.turnCount = 0;
        this.battleLog = [];

        // 添加战斗开始消息
        this.addLog(this.isWildBattle
            ? `野生的${this.currentEnemyMonster.name}出现了！`
            : `${this.currentEnemyMonster.name}的训练师发起了挑战！`
        );
        this.addLog(`去吧！${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}！`);

        // 发送战斗开始事件
        eventBus.emit(GameEvents.BATTLE_START, {
            playerMonster: this.currentPlayerMonster,
            enemyMonster: this.currentEnemyMonster,
            isWildBattle: this.isWildBattle
        });

        // 切换游戏状态到战斗
        if (gameStateMachine.getCurrentState() !== GameState.BATTLE) {
            gameStateMachine.pushState(GameState.BATTLE);
        }

        // 开始第一回合（给用户足够时间看完开始消息）
        setTimeout(() => {
            this.startTurn();
        }, 2000);
    }

    /**
     * 开始新回合
     */
    startTurn() {
        this.turnCount++;
        this.state = BattleState.PLAYER_TURN;

        this.addLog(`--- 第 ${this.turnCount} 回合 ---`);

        // 处理回合开始时的状态效果
        this.processTurnStartStatus();

        if (this.awaitingForcedSwitch) {
            return;
        }

        // 检查战斗是否结束
        if (this.checkBattleEnd()) {
            return;
        }

        // 等待玩家选择行动
        this.waitingForInput = true;
        this.requestPlayerAction();
    }

    /**
     * 处理回合开始时的状态效果
     */
    processTurnStartStatus() {
        // 处理玩家怪兽状态
        if (this.currentPlayerMonster && this.currentPlayerMonster.status) {
            const messages = skillExecutor.processTurnStartStatus(this.currentPlayerMonster);
            messages.forEach(msg => this.addLog(msg));

            // 发送状态效果事件
            eventBus.emit(GameEvents.BATTLE_ACTION, {
                type: 'status_effect',
                monster: this.currentPlayerMonster,
                messages
            });
        }

        // 处理敌方怪兽状态
        if (this.currentEnemyMonster && this.currentEnemyMonster.status) {
            const messages = skillExecutor.processTurnStartStatus(this.currentEnemyMonster);
            messages.forEach(msg => this.addLog(msg));

            eventBus.emit(GameEvents.BATTLE_ACTION, {
                type: 'status_effect',
                monster: this.currentEnemyMonster,
                messages
            });
        }

        // 检查HP
        this.checkFaint();
    }

    /**
     * 请求玩家选择行动
     */
    requestPlayerAction() {
        this.waitingForInput = true;

        // 检查玩家怪兽是否可以行动
        const actCheck = skillExecutor.checkCanAct(this.currentPlayerMonster);
        if (!actCheck.canAct) {
            if (actCheck.message) {
                this.addLog(actCheck.message);
            }
            // 不能行动，跳过到敌方回合
            setTimeout(() => {
                this.endPlayerTurn(null);
            }, 1000);
            return;
        }

        // 发送请求玩家输入事件
        eventBus.emit(GameEvents.BATTLE_ACTION, {
            type: 'request_action',
            monster: this.currentPlayerMonster,
            availableActions: this.getAvailableActions()
        });
    }

    /**
     * 获取可用行动
     * @returns {Object} 可用行动
     */
    getAvailableActions() {
        const skills = skillExecutor.getMonsterSkills(this.currentPlayerMonster);

        return {
            skills: skills,
            canSwitch: this.playerParty.filter(m =>
                m !== this.currentPlayerMonster && m.stats && m.stats.hp > 0
            ).length > 0,
            canUseItems: true,
            canFlee: this.isWildBattle && this.canFlee
        };
    }

    /**
     * 玩家选择技能
     * @param {Object|string} skill - 选择的技能或技能ID
     */
    playerUseSkill(skill) {
        if (!this.waitingForInput || this.state !== BattleState.PLAYER_TURN) {
            return;
        }

        this.waitingForInput = false;

        const skillTemplate = skillExecutor.getSkillTemplate(skill);
        if (!skillTemplate) {
            this.addLog('技能不存在！');
            this.waitingForInput = true;
            return;
        }

        // 检查PP
        const currentPP = skillExecutor.getSkillPP(this.currentPlayerMonster, skillTemplate.id);
        if (currentPP <= 0) {
            this.addLog(`${skillTemplate.name}的PP不足！`);
            this.waitingForInput = true;
            return;
        }

        // 执行玩家回合
        this.executePlayerTurn(skillTemplate);
    }

    /**
     * 玩家交换怪兽
     * @param {Object} monster - 交换的怪兽
     */
    playerSwitchMonster(monster, forced = false) {
        const canHandleForcedSwitch = forced || this.awaitingForcedSwitch;
        if (!canHandleForcedSwitch && (!this.waitingForInput || this.state !== BattleState.PLAYER_TURN)) {
            return;
        }

        if (!monster || !monster.stats || monster.stats.hp <= 0) {
            this.addLog('该怪兽无法出战！');
            this.waitingForInput = true;
            return;
        }

        if (monster === this.currentPlayerMonster) {
            this.addLog('该怪兽已经在场上了！');
            this.waitingForInput = true;
            return;
        }

        this.waitingForInput = false;

        if (this.currentPlayerMonster && this.currentPlayerMonster.stats.hp > 0) {
            this.addLog(`回来吧，${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}！`);
        }
        this.currentPlayerMonster = monster;
        this.addLog(`去吧！${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}！`);

        eventBus.emit(GameEvents.BATTLE_ACTION, {
            type: 'switch',
            monster: this.currentPlayerMonster,
            success: true
        });

        if (canHandleForcedSwitch) {
            const switchMode = this.forcedSwitchMode;
            this.awaitingForcedSwitch = false;
            this.forcedSwitchMode = null;

            setTimeout(() => {
                if (this.checkBattleEnd()) {
                    return;
                }

                if (switchMode === 'resume_turn') {
                    this.state = BattleState.PLAYER_TURN;
                    this.requestPlayerAction();
                    return;
                }

                this.finishTurn();
            }, 500);
            return;
        }

        // 主动交换后结束玩家回合
        setTimeout(() => {
            this.endPlayerTurn(null);
        }, 500);
    }

    /**
     * 玩家使用道具
     * @param {Object} item - 使用的道具
     */
    playerUseItem(item) {
        if (!this.waitingForInput || this.state !== BattleState.PLAYER_TURN) {
            return;
        }

        this.waitingForInput = false;

        if (item?.effect?.type === 'catch') {
            if (!this.isWildBattle) {
                this.addLog('训练师战斗无法捕捉！');
                this.waitingForInput = true;
                return;
            }

            if (!this.currentEnemyMonster || this.currentEnemyMonster.stats.hp <= 0) {
                this.addLog('无法捕捉已倒下的怪兽！');
                this.waitingForInput = true;
                return;
            }
        }

        // 执行道具效果
        this.addLog(`使用了${item.name}！`);

        // 这里可以处理具体的道具效果
        if (item.effect) {
            if (item.effect.type === 'catch') {
                const enemy = this.currentEnemyMonster;
                const baseRate = item.effect.baseRate ?? 1.0;
                const guaranteed = item.effect.guaranteed === true;
                const hpRatio = enemy.stats.maxHp > 0 ? (enemy.stats.hp / enemy.stats.maxHp) : 1;
                const statusBonus = enemy.status ? 0.1 : 0;

                let chance = (0.2 + (1 - hpRatio) * 0.6 + statusBonus) * baseRate;
                if (guaranteed) {
                    chance = 1;
                }
                chance = Math.min(0.95, Math.max(0.05, chance));

                const success = Math.random() < chance;
                const shakes = success ? 3 : Math.max(0, Math.min(3, Math.floor(chance * 3)));
                if (success) {
                    const captured = {
                        ...enemy,
                        id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                        exp: 0
                    };
                    delete captured.expReward;
                    delete captured.drops;

                    const gameState = gameStateMachine.getGameState();
                    const party = gameState.player?.party ? [...gameState.player.party] : [];
                    party.push(captured);
                    gameStateMachine.updatePlayer({ party });

                    this.addLog(`${enemy.name}被捕获了！`);
                    eventBus.emit(GameEvents.BATTLE_ACTION, {
                        type: 'catch',
                        success: true,
                        monster: captured,
                        shakes
                    });

                    if (typeof inventoryManager !== 'undefined' && item.uid) {
                        inventoryManager.removeItem(item.uid, 1);
                    }

                    return;
                }

                this.addLog(`${enemy.name}挣脱了精灵球！`);
                eventBus.emit(GameEvents.BATTLE_ACTION, {
                    type: 'catch',
                    success: false,
                    monster: enemy,
                    shakes
                });

                if (typeof inventoryManager !== 'undefined' && item.uid) {
                    inventoryManager.removeItem(item.uid, 1);
                }

                return;
            }

            if (item.effect.type === 'restore_pp_all') {
                const restoreAmount = item.effect.value ?? 5;
                this.restoreMonsterPP(this.currentPlayerMonster, restoreAmount);
                this.addLog(`${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}的技能PP恢复了！`);
            } else if (item.effect.type === 'restore_pp_full') {
                this.restoreMonsterPP(this.currentPlayerMonster, null);
                this.addLog(`${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}的技能PP恢复至满！`);
            } else if (item.effect.type === 'elixir') {
                this.currentPlayerMonster.stats.hp = this.currentPlayerMonster.stats.maxHp;
                this.restoreMonsterPP(this.currentPlayerMonster, null);
                this.addLog(`${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}恢复了全部HP和PP！`);
            }

            if (item.effect.type === 'heal_hp') {
                const healAmount = item.effect.amount ?? item.effect.value ?? 50;
                this.currentPlayerMonster.stats.hp = Math.min(
                    this.currentPlayerMonster.stats.maxHp,
                    this.currentPlayerMonster.stats.hp + healAmount
                );
                this.addLog(`${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}恢复了${healAmount}点HP！`);
            } else if (item.effect.type === 'heal_hp_full') {
                const healAmount = this.currentPlayerMonster.stats.maxHp - this.currentPlayerMonster.stats.hp;
                this.currentPlayerMonster.stats.hp = this.currentPlayerMonster.stats.maxHp;
                this.addLog(`${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}恢复了${healAmount}点HP！`);
            } else if (item.effect.type === 'cure_status') {
                skillExecutor.cureStatus(this.currentPlayerMonster);
                this.addLog(`${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}的状态恢复了！`);
            }
        }

        // 消耗物品
        if (typeof inventoryManager !== 'undefined' && item.uid) {
            inventoryManager.removeItem(item.uid, 1);
        }

        eventBus.emit(GameEvents.BATTLE_ACTION, {
            type: 'use_item',
            item,
            monster: this.currentPlayerMonster
        });

        // 使用道具后结束玩家回合
        setTimeout(() => {
            this.endPlayerTurn(null);
        }, 500);
    }

    /**
     * 玩家尝试逃跑
     */
    playerFlee() {
        if (!this.waitingForInput || this.state !== BattleState.PLAYER_TURN) {
            return;
        }

        if (!this.canFlee) {
            this.addLog('训练师战斗中无法逃跑！');
            return;
        }

        this.waitingForInput = false;
        this.state = BattleState.FLEEING;

        // 计算逃跑成功率（基于速度）
        const playerSpeed = damageCalculator.calculateEffectiveSpeed(this.currentPlayerMonster);
        const enemySpeed = damageCalculator.calculateEffectiveSpeed(this.currentEnemyMonster);
        const fleeChance = Math.min(0.9, 0.5 + (playerSpeed - enemySpeed) / 200);

        if (Math.random() < fleeChance) {
            this.addLog('成功逃跑了！');
            setTimeout(() => {
                this.endBattle('flee');
            }, 500);
        } else {
            this.addLog('逃跑失败！');
            setTimeout(() => {
                this.endPlayerTurn(null);
            }, 500);
        }
    }

    /**
     * 执行玩家回合
     * @param {Object} skill - 使用的技能模板
     */
    executePlayerTurn(skill) {
        this.state = BattleState.PROCESSING;

        // 判定行动顺序
        const playerFirst = this.determineTurnOrder(skill, null);

        if (playerFirst) {
            // 玩家先行动
            this.executePlayerAttack(skill, () => {
                if (!this.checkBattleEnd()) {
                    this.executeEnemyTurn();
                }
            });
        } else {
            // 敌方先行动
            this.executeEnemyTurn(() => {
                if (!this.checkBattleEnd()) {
                    this.executePlayerAttack(skill, () => {
                        this.endPlayerTurn(skill);
                    });
                }
            });
        }
    }

    /**
     * 执行玩家攻击
     * @param {Object} skill - 使用的技能模板
     * @param {Function} callback - 回调
     */
    executePlayerAttack(skill, callback) {
        if (!skill) {
            callback && callback();
            return;
        }

        // 执行技能
        const result = skillExecutor.executeSkill(
            this.currentPlayerMonster,
            this.currentEnemyMonster,
            skill
        );

        // 添加日志
        result.messages.forEach(msg => this.addLog(msg));

        // 发送战斗动作事件
        eventBus.emit(GameEvents.BATTLE_ACTION, {
            type: 'player_attack',
            attacker: this.currentPlayerMonster,
            defender: this.currentEnemyMonster,
            skill,
            result
        });

        // 发送伤害事件
        if (result.damageResult) {
            eventBus.emit(GameEvents.BATTLE_DAMAGE, {
                target: this.currentEnemyMonster,
                damageResult: result.damageResult
            });
        }

        // 检查是否濒死
        this.checkFaint();

        setTimeout(() => {
            callback && callback();
        }, 1000);
    }

    /**
     * 结束玩家回合
     * @param {Object} skill - 使用的技能
     */
    endPlayerTurn(skill = null) {
        if (this.checkBattleEnd()) {
            return;
        }

        // 敌方回合
        this.state = BattleState.ENEMY_TURN;
        this.executeEnemyTurn();
    }

    /**
     * 执行敌方回合
     * @param {Function} callback - 回调
     */
    executeEnemyTurn(callback?: () => void) {
        // 检查敌方是否可以行动
        const actCheck = skillExecutor.checkCanAct(this.currentEnemyMonster);
        if (!actCheck.canAct) {
            if (actCheck.message) {
                this.addLog(actCheck.message);
            }
            setTimeout(() => {
                this.finishTurn();
                callback && callback();
            }, 1000);
            return;
        }

        // AI 决策
        let decision;
        if (this.isWildBattle) {
            // 检查是否逃跑
            if (skillExecutor.shouldRunWild(this.currentEnemyMonster, this.currentPlayerMonster)) {
                this.addLog(`${this.currentEnemyMonster.name}逃跑了！`);
                setTimeout(() => {
                    this.endBattle('victory');
                }, 500);
                return;
            }
            decision = skillExecutor.wildMonsterAI(this.currentEnemyMonster, this.currentPlayerMonster);
        } else {
            decision = skillExecutor.trainerMonsterAI(
                this.currentEnemyMonster,
                this.currentPlayerMonster,
                this.enemyParty,
                {}
            );
        }

        // 执行决策
        if (decision.action === 'use_skill') {
            this.executeEnemyAttack(decision.skill, callback);
        } else if (decision.action === 'switch') {
            this.addLog(`${this.currentEnemyMonster.name}被收回来了！`);
            this.currentEnemyMonster = decision.monster;
            this.addLog(`${this.currentEnemyMonster.name}出来了！`);
            setTimeout(() => {
                this.finishTurn();
                callback && callback();
            }, 1000);
        } else {
            this.finishTurn();
            callback && callback();
        }
    }

    /**
     * 执行敌方攻击
     * @param {Object} skill - 使用的技能
     * @param {Function} callback - 回调
     */
    executeEnemyAttack(skill, callback) {
        // 执行技能
        const result = skillExecutor.executeSkill(
            this.currentEnemyMonster,
            this.currentPlayerMonster,
            skill
        );

        // 添加日志
        result.messages.forEach(msg => this.addLog(msg));

        // 发送战斗动作事件
        eventBus.emit(GameEvents.BATTLE_ACTION, {
            type: 'enemy_attack',
            attacker: this.currentEnemyMonster,
            defender: this.currentPlayerMonster,
            skill,
            result
        });

        // 发送伤害事件
        if (result.damageResult) {
            eventBus.emit(GameEvents.BATTLE_DAMAGE, {
                target: this.currentPlayerMonster,
                damageResult: result.damageResult
            });
        }

        // 检查是否濒死
        this.checkFaint();

        if (this.awaitingForcedSwitch) {
            return;
        }

        setTimeout(() => {
            this.finishTurn();
            callback && callback();
        }, 1000);
    }

    /**
     * 完成回合
     */
    finishTurn() {
        if (this.checkBattleEnd()) {
            return;
        }

        // 开始下一回合
        setTimeout(() => {
            this.startTurn();
        }, 500);
    }

    /**
     * 判定行动顺序
     * @param {Object} playerSkill - 玩家技能
     * @param {Object} enemySkill - 敌方技能
     * @returns {boolean} 玩家是否先行动
     */
    determineTurnOrder(playerSkill, enemySkill) {
        if (!enemySkill) {
            return true;
        }
        const order = damageCalculator.determineTurnOrder(
            this.currentPlayerMonster,
            this.currentEnemyMonster,
            playerSkill,
            enemySkill
        );
        return order[0] === this.currentPlayerMonster;
    }

    /**
     * 检查怪兽是否濒死
     */
    checkFaint() {
        // 检查玩家怪兽
        if (this.currentPlayerMonster && this.currentPlayerMonster.stats.hp <= 0) {
            this.addLog(`${this.currentPlayerMonster.nickname || this.currentPlayerMonster.name}倒下了！`);

            // 寻找下一只可用的怪兽
            const availableMonsters = this.playerParty.filter(
                m => m !== this.currentPlayerMonster && m.stats && m.stats.hp > 0
            );

            if (availableMonsters.length > 0) {
                // 等待玩家选择交换（或者强制交换）
                this.waitingForInput = true;
                this.awaitingForcedSwitch = true;
                this.forcedSwitchMode = this.state === BattleState.PLAYER_TURN ? 'resume_turn' : 'next_turn';
                eventBus.emit(GameEvents.BATTLE_ACTION, {
                    type: 'need_switch',
                    faintedMonster: this.currentPlayerMonster,
                    availableMonsters
                });
            }
        }

        // 检查敌方怪兽
        if (this.currentEnemyMonster && this.currentEnemyMonster.stats.hp <= 0) {
            this.addLog(`${this.currentEnemyMonster.name}倒下了！`);
            this.lastDefeatedEnemy = this.currentEnemyMonster;

            const nextEnemy = this.enemyParty.find(
                m => m !== this.currentEnemyMonster && m.stats && m.stats.hp > 0
            );

            if (nextEnemy) {
                this.currentEnemyMonster = nextEnemy;
                this.addLog(`${this.currentEnemyMonster.name}出来了！`);
            }
        }
    }

    /**
     * 检查战斗是否结束
     * @returns {boolean} 战斗是否结束
     */
    checkBattleEnd() {
        // 检查玩家是否还有可用怪兽
        const playerAlive = this.playerParty.some(m => m.stats && m.stats.hp > 0);
        const enemyAlive = this.enemyParty.some(m => m.stats && m.stats.hp > 0);

        if (!playerAlive) {
            this.state = BattleState.DEFEAT;
            setTimeout(() => {
                this.endBattle('defeat');
            }, 1000);
            return true;
        }

        if (!enemyAlive) {
            this.state = BattleState.VICTORY;
            if (this.isWildBattle && !this.awaitingCaptureChoice) {
                this.awaitingCaptureChoice = true;
                this.captureAfterVictory = true;
                this.waitingForInput = true;
                eventBus.emit(GameEvents.BATTLE_ACTION, {
                    type: 'capture_prompt',
                    monster: this.currentEnemyMonster || this.lastDefeatedEnemy
                });
                return true;
            }

            if (!this.awaitingCaptureChoice) {
                setTimeout(() => {
                    this.endBattle('victory');
                }, 1000);
            }
            return true;
        }

        return false;
    }

    /**
     * 结束战斗
     * @param {string} result - 战斗结果 ('victory', 'defeat', 'flee')
     */
    endBattle(result) {
        this.state = BattleState.ENDING;

        const gameState = gameStateMachine.getGameState();
        const defeatedMonsterId = this.lastDefeatedEnemy?.monsterId || this.currentEnemyMonster?.monsterId || this.enemyParty[0]?.monsterId;

        const battleResult = {
            result,
            victory: result === 'victory',
            monsterId: defeatedMonsterId,
            exp: 0,
            playerExp: 0,
            playerLevelUps: [],
            rewards: [],
            battleLog: [...this.battleLog],
            summary: {
                result,
                expGained: 0,
                moneyGained: 0,
                items: [],
                playerLevelDelta: 0,
                monsterLevelUps: []
            }
        };

        if (result === 'victory') {
            this.addLog('战斗胜利！');

            // 计算经验值
            const totalExp = this.enemyParty.reduce((sum, m) => sum + (m.expReward || 0), 0);
            battleResult.exp = totalExp;
            battleResult.summary.expGained = totalExp;

            // 分配经验值给参与战斗的怪兽
            const participants = this.playerParty.filter(m => m.stats && m.stats.hp > 0);
            if (participants.length > 0) {
                const expPerMonster = Math.floor(totalExp / participants.length);
                participants.forEach(m => {
                    const fromLevel = m.level;
                    m.exp = (m.exp || 0) + expPerMonster;
                    this.addLog(`${m.nickname || m.name}获得了${expPerMonster}点经验值！`);
                    // 检查升级
                    this.checkLevelUp(m);

                    if (m.level > fromLevel) {
                        battleResult.summary.monsterLevelUps.push({
                            monsterId: m.monsterId,
                            nickname: m.nickname || m.name,
                            from: fromLevel,
                            to: m.level
                        });
                    }
                });
            }

            if (gameState?.player) {
                const playerLevelBefore = gameState.player.level;
                const totalPlayerExp = this.enemyParty.reduce((sum, enemy) => {
                    const enemyExp = enemy.expReward || 0;
                    const enemyLevel = enemy.level || 1;
                    return sum + Math.floor(enemyExp * (1 + enemyLevel / 10));
                }, 0);

                const playerExpResult = awardPlayerExp(gameState.player, totalPlayerExp);
                battleResult.playerExp = playerExpResult.gained;
                battleResult.playerLevelUps = playerExpResult.levelsGained;
                battleResult.summary.playerLevelDelta = gameState.player.level - playerLevelBefore;

                if (playerExpResult.gained > 0) {
                    this.addLog(`玩家获得了${playerExpResult.gained}点训练家经验！`);
                }

                playerExpResult.levelsGained.forEach(level => {
                    this.addLog(`玩家等级提升至 Lv.${level}！`);
                });

                gameStateMachine.updatePlayer({
                    level: gameState.player.level,
                    exp: gameState.player.exp,
                    expToNext: gameState.player.expToNext,
                    pokedex: gameState.player.pokedex
                });

                const moneyGained = this.enemyParty.reduce((sum, enemy) => {
                    const enemyExp = enemy.expReward || 0;
                    const enemyLevel = enemy.level || 1;
                    return sum + Math.max(10, Math.floor(enemyExp * 0.35 + enemyLevel * 8));
                }, 0);

                if (moneyGained > 0) {
                    gameState.player.money = (gameState.player.money || 0) + moneyGained;
                    battleResult.summary.moneyGained = moneyGained;
                    this.addLog(`获得了￥${moneyGained}！`);

                    gameStateMachine.updatePlayer({
                        money: gameState.player.money,
                        level: gameState.player.level,
                        exp: gameState.player.exp,
                        expToNext: gameState.player.expToNext,
                        pokedex: gameState.player.pokedex
                    });
                }
            }

            // 获取掉落物品
            this.enemyParty.forEach(enemy => {
                if (enemy.drops) {
                    enemy.drops.forEach(drop => {
                        if (Math.random() < drop.chance) {
                            if (typeof inventoryManager !== 'undefined' && inventoryManager.addItem) {
                                const beforeQty = typeof inventoryManager.getItemQuantity === 'function'
                                    ? inventoryManager.getItemQuantity(drop.itemId)
                                    : 0;
                                const added = inventoryManager.addItem(drop.itemId, 1);
                                const afterQty = typeof inventoryManager.getItemQuantity === 'function'
                                    ? inventoryManager.getItemQuantity(drop.itemId)
                                    : beforeQty;
                                if (added.length > 0 || afterQty > beforeQty) {
                                    battleResult.rewards.push(drop.itemId);
                                    battleResult.summary.items.push({
                                        itemId: drop.itemId,
                                        quantity: 1,
                                        sourceMonsterId: enemy.monsterId,
                                        sourceLevel: enemy.level
                                    });
                                    this.addLog(`获得了${ItemTemplates[drop.itemId]?.name || drop.itemId}！`);
                                } else {
                                    this.addLog(`背包已满，无法获得${ItemTemplates[drop.itemId]?.name || drop.itemId}！`);
                                }
                            } else {
                                battleResult.rewards.push(drop.itemId);
                                battleResult.summary.items.push({
                                    itemId: drop.itemId,
                                    quantity: 1,
                                    sourceMonsterId: enemy.monsterId,
                                    sourceLevel: enemy.level
                                });
                                this.addLog(`获得了${ItemTemplates[drop.itemId]?.name || drop.itemId}！`);
                            }
                        }
                    });
                }
            });
        } else if (result === 'defeat') {
            this.addLog('战斗失败...');
        } else if (result === 'capture') {
            this.addLog('捕获成功！');
        } else if (result === 'flee') {
            // 逃跑
        }

        // 战斗结束后恢复部分技能PP（20%）
        const party = gameState?.player?.party || [];
        if (party.length > 0) {
            party.forEach(monster => this.restoreMonsterPPByRate(monster, 0.2));
            this.addLog('战斗结束，技能PP恢复了一部分。');
        }

        // 发送战斗结束事件
        eventBus.emit(GameEvents.BATTLE_END, battleResult);

        this.waitingForInput = false;
        this.inputCallback = null;
        this.awaitingForcedSwitch = false;
        this.forcedSwitchMode = null;
    }

    finalizeBattle() {
        if (this.state !== BattleState.ENDING) {
            return;
        }

        // 切换回上一个状态（仅当当前仍为战斗状态时）
        if (gameStateMachine.getCurrentState() === GameState.BATTLE) {
            gameStateMachine.popState();
        }

        if (gameStateMachine.getCurrentState() === GameState.PRE_BATTLE_SELECT) {
            gameStateMachine.popState();
        }

        // 重置战斗状态
        this.reset();
    }

    /**
     * 处理胜利后的捕获选择
     * @param {boolean} wantCapture - 是否选择捕获
     */
    handleCaptureDecision(wantCapture) {
        if (!this.captureAfterVictory || !this.awaitingCaptureChoice) {
            return;
        }

        this.waitingForInput = false;
        if (!wantCapture) {
            this.captureAfterVictory = false;
            this.awaitingCaptureChoice = false;
            this.endBattle('victory');
            return;
        }

        const enemy = this.currentEnemyMonster || this.lastDefeatedEnemy;
        if (!enemy) {
            this.addLog('收服失败：未找到怪兽数据');
            this.captureAfterVictory = false;
            this.awaitingCaptureChoice = false;
            this.endBattle('victory');
            return;
        }

        this.addLog(`你尝试收服${enemy.name}！`);
        const baseChance = 0.92;
        const success = Math.random() < baseChance;
        const shakes = success ? 3 : 2;

        if (success) {
            const captured = {
                ...enemy,
                id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                nickname: enemy.nickname || enemy.name,
                exp: 0,
                expToNext: calculateExpToNext(enemy.level),
                equipment: createEmptyEquipmentRecord(),
                status: null
            };
            delete captured.expReward;
            delete captured.drops;

            const gameState = gameStateMachine.getGameState();
            if (!gameState?.player) {
                this.addLog('收服失败：未找到玩家数据');
                return;
            }

            const party = gameState.player.party ? [...gameState.player.party] : [];
            party.push(captured);
            registerMonsterInPokedex(gameState.player, captured.monsterId, 'owned');
            gameStateMachine.updatePlayer({
                party,
                pokedex: gameState.player.pokedex
            });

            eventBus.emit(GameEvents.BATTLE_ACTION, {
                type: 'catch',
                success: true,
                monster: captured,
                shakes
            });
        } else {
            this.addLog(`${enemy.name}挣脱了精灵球！`);
            eventBus.emit(GameEvents.BATTLE_ACTION, {
                type: 'catch',
                success: false,
                monster: enemy,
                shakes
            });
        }
    }

    /**
     * 检查升级
     * @param {Object} monster - 怪兽
     */
    checkLevelUp(monster) {
        const expToNext = this.calculateExpToNext(monster.level);
        if (monster.exp >= expToNext) {
            monster.level++;
            monster.exp -= expToNext;

            // 提升属性
            const template = MonsterTemplates[monster.monsterId];
            if (template && template.baseStats) {
                // 简单的属性提升（每级提升基础值的1/20）
                const growth = 1 / 20;
                monster.stats.maxHp += Math.floor(template.baseStats.hp * growth);
                monster.stats.hp = monster.stats.maxHp;  // 升级时回满HP
                monster.stats.atk += Math.floor(template.baseStats.atk * growth);
                monster.stats.def += Math.floor(template.baseStats.def * growth);
                monster.stats.spAtk += Math.floor(template.baseStats.spAtk * growth);
                monster.stats.spDef += Math.floor(template.baseStats.spDef * growth);
                monster.stats.spd += Math.floor(template.baseStats.spd * growth);
            }

            this.addLog(`${monster.nickname || monster.name}升级了！现在是Lv.${monster.level}！`);

            // 升级时恢复技能PP
            this.restoreMonsterPP(monster, null);

            // 检查是否还能继续升级
            this.checkLevelUp(monster);
        }
    }

    /**
     * 恢复怪兽技能PP
     * @param {Object} monster - 怪兽
     * @param {number|null} amount - 恢复量，null 表示回满
     */
    restoreMonsterPP(monster, amount = null) {
        if (!monster?.skills || !Array.isArray(monster.skills)) return;

        monster.skills = monster.skills.map(skillRef => {
            const skillId = typeof skillRef === 'string'
                ? skillRef
                : (skillRef.skillId || skillRef.id);

            const template = SkillTemplates?.[skillId];
            const maxPp = template?.maxPp ?? skillRef?.maxPp ?? template?.pp ?? 10;
            const currentPp = typeof skillRef === 'object' ? (skillRef.pp ?? maxPp) : maxPp;
            const newPp = amount === null ? maxPp : Math.min(maxPp, currentPp + amount);

            return {
                skillId,
                pp: newPp,
                maxPp
            };
        });
    }

    /**
     * 按比例恢复怪兽技能PP
     * @param {Object} monster - 怪兽
     * @param {number} rate - 恢复比例 (0~1)
     */
    restoreMonsterPPByRate(monster, rate = 0.2) {
        if (!monster?.skills || !Array.isArray(monster.skills)) return;

        const safeRate = Math.max(0, Math.min(1, rate));
        monster.skills = monster.skills.map(skillRef => {
            const skillId = typeof skillRef === 'string'
                ? skillRef
                : (skillRef.skillId || skillRef.id);

            const template = SkillTemplates?.[skillId];
            const maxPp = template?.maxPp ?? skillRef?.maxPp ?? template?.pp ?? 10;
            const currentPp = typeof skillRef === 'object' ? (skillRef.pp ?? maxPp) : maxPp;
            const restoreAmount = Math.max(1, Math.floor(maxPp * safeRate));
            const newPp = Math.min(maxPp, currentPp + restoreAmount);

            return {
                skillId,
                pp: newPp,
                maxPp
            };
        });
    }

    /**
     * 计算下一级所需经验
     * @param {number} level - 当前等级
     * @returns {number} 所需经验
     */
    calculateExpToNext(level) {
        // 中等速度的经验曲线
        return Math.floor(4 * Math.pow(level, 3) / 5);
    }

    /**
     * 添加战斗日志
     * @param {string} message - 日志消息
     */
    addLog(message) {
        this.battleLog.push(message);
        console.log(`[Battle] ${message}`);
    }

    /**
     * 重置战斗系统
     */
    reset() {
        this.state = BattleState.IDLE;
        this.playerParty = [];
        this.currentPlayerMonster = null;
        this.enemyParty = [];
        this.currentEnemyMonster = null;
        this.turnCount = 0;
        this.battleLog = [];
        this.isWildBattle = false;
        this.canFlee = true;
        this.waitingForInput = false;
        this.inputCallback = null;
        this.awaitingCaptureChoice = false;
        this.captureAfterVictory = false;
        this.lastDefeatedEnemy = null;
        this.awaitingForcedSwitch = false;
        this.forcedSwitchMode = null;
        this.pendingWildEnemy = null;
    }

    /**
     * 获取当前战斗状态
     * @returns {Object} 战斗状态
     */
    getBattleState() {
        return {
            state: this.state,
            turnCount: this.turnCount,
            playerMonster: this.currentPlayerMonster,
            enemyMonster: this.currentEnemyMonster,
            playerParty: this.playerParty,
            enemyParty: this.enemyParty,
            battleLog: this.battleLog,
            isWildBattle: this.isWildBattle
        };
    }
}

// 创建全局实例
const battleSystem = new BattleSystem();
window.BattleState = BattleState;
window.battleSystem = battleSystem;
