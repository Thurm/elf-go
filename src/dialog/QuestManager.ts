/**
 * 任务管理器 - 管理任务状态、进度追踪、奖励发放
 */

class QuestManager {
    quests: ActiveQuest[] = [];
    completedQuests: string[] = [];
    eventHandlers: Array<() => void> = [];

    /**
     * 初始化任务管理器
     */
    init(): void {
        console.log('[QuestManager] 初始化任务管理器');
        this.quests = [];
        this.completedQuests = [];

        // 从游戏状态加载任务
        const gameState = gameStateMachine.getGameState();
        if (gameState && gameState.player) {
            this.quests = gameState.player.quests || [];
            this.completedQuests = gameState.player.completedQuests || [];
        }

        // 监听游戏事件
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners(): void {
        // 战斗胜利事件 - 更新击败目标
        eventBus.on(GameEvents.BATTLE_END, (data) => {
            if (data && data.victory) {
                this.updateQuestProgress('defeat', 'wild_monster', 1);
                if (data.monsterId) {
                    this.updateQuestProgress('defeat', data.monsterId, 1);
                }
            }
        });

        // 物品获得事件 - 更新收集目标
        eventBus.on('item:acquired', (data) => {
            if (data && data.itemId) {
                this.updateQuestProgress('collect', data.itemId, data.quantity || 1);
            }
        });

        // 对话事件 - 更新对话目标
        eventBus.on(GameEvents.DIALOG_START, (data) => {
            if (data && data.npcId) {
                this.updateQuestProgress('talk', data.npcId, 1);
            }
        });

        // 地图传送事件 - 更新访问目标
        eventBus.on(GameEvents.MAP_PORTAL, (data) => {
            if (data && data.targetMap) {
                this.updateQuestProgress('visit', data.targetMap, 1);
            }
        });

        // 购买事件 - 更新购买目标
        eventBus.on(GameEvents.SHOP_BUY, (data) => {
            if (data && data.itemId) {
                this.updateQuestProgress('buy', data.itemId, data.quantity || 1);
            }
        });
    }

    /**
     * 开始任务
     * @param {string} questId - 任务ID
     * @returns {boolean} 是否成功开始
     */
    startQuest(questId: string): boolean {
        // 检查任务是否已存在或已完成
        if (this.isQuestActive(questId)) {
            console.warn(`[QuestManager] 任务 ${questId} 已在进行中`);
            return false;
        }

        if (this.isQuestCompleted(questId)) {
            console.warn(`[QuestManager] 任务 ${questId} 已完成`);
            return false;
        }

        // 获取任务模板
        const template = QuestTemplates[questId];
        if (!template) {
            console.error(`[QuestManager] 任务模板不存在: ${questId}`);
            return false;
        }

        // 检查前置任务
        if (template.prerequisites && template.prerequisites.length > 0) {
            for (const prereqId of template.prerequisites) {
                if (!this.isQuestCompleted(prereqId)) {
                    console.warn(`[QuestManager] 前置任务未完成: ${prereqId}`);
                    eventBus.emit(GameEvents.UI_NOTIFICATION, {
                        message: '需要先完成其他任务！',
                        type: 'warning'
                    });
                    return false;
                }
            }
        }

        // 创建任务实例
        const quest: ActiveQuest = {
            ...template,
            id: questId,
            status: 'in_progress',
            startedAt: Date.now(),
            objectives: template.objectives.map(obj => ({
                ...obj,
                current: 0
            }))
        };

        // 添加到任务列表
        this.quests.push(quest);

        // 设置任务开始标记
        if (typeof dialogSystem !== 'undefined') {
            dialogSystem.setFlag({ flag: `${questId}_started`, value: true });
        } else {
            const gameState = gameStateMachine.getGameState();
            if (!gameState.flags) gameState.flags = {};
            gameState.flags[`${questId}_started`] = true;
            gameStateMachine.updateGameState({ flags: gameState.flags });
        }

        // 保存到游戏状态
        this.saveToGameState();

        console.log(`[QuestManager] 任务开始: ${quest.title}`);

        // 发送任务开始事件
        eventBus.emit('quest:started', { quest: quest });
        eventBus.emit(GameEvents.UI_NOTIFICATION, {
            message: `任务开始: ${quest.title}`,
            type: 'info'
        });

        return true;
    }

    /**
     * 更新任务进度
     * @param {string} type - 目标类型
     * @param {string} target - 目标ID
     * @param {number} amount - 数量
     */
    updateQuestProgress(type: string, target: string, amount = 1): void {
        let updated = false;

        for (const quest of this.quests) {
            if (quest.status !== 'in_progress') {
                continue;
            }

            for (const objective of quest.objectives) {
                // 检查目标类型和目标是否匹配
                if (objective.type === type && objective.target === target) {
                    if (objective.current < objective.count) {
                        objective.current = Math.min(objective.current + amount, objective.count);
                        updated = true;

                        console.log(`[QuestManager] 任务进度更新: ${quest.title} - ${objective.description}: ${objective.current}/${objective.count}`);

                        // 发送进度更新事件
                        eventBus.emit('quest:progress', {
                            questId: quest.id,
                            objective: objective
                        });
                    }
                }
            }

            // 检查任务是否可以完成
            if (this.canCompleteQuest(quest)) {
                quest.status = 'ready_to_complete';
                eventBus.emit('quest:ready_to_complete', { quest: quest });
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    message: `任务可以完成了: ${quest.title}`,
                    type: 'info'
                });
            }
        }

        if (updated) {
            this.saveToGameState();
        }
    }

    /**
     * 检查任务是否可以完成
     * @param {Object} quest - 任务对象
     * @returns {boolean} 是否可以完成
     */
    canCompleteQuest(quest: ActiveQuest): boolean {
        if (quest.status !== 'in_progress') {
            return false;
        }

        for (const objective of quest.objectives) {
            if (objective.current < objective.count) {
                return false;
            }
        }

        return true;
    }

    /**
     * 完成任务
     * @param {string} questId - 任务ID
     * @returns {boolean} 是否成功完成
     */
    completeQuest(questId: string): boolean {
        const questIndex = this.quests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            console.warn(`[QuestManager] 任务不存在: ${questId}`);
            return false;
        }

        const quest = this.quests[questIndex];

        if (quest.status !== 'ready_to_complete' && !this.canCompleteQuest(quest)) {
            console.warn(`[QuestManager] 任务未完成所有目标: ${questId}`);
            return false;
        }

        // 发放奖励
        this.giveRewards(quest);

        // 从活动任务中移除
        this.quests.splice(questIndex, 1);

        // 添加到已完成任务
        quest.status = 'completed';
        quest.completedAt = Date.now();
        this.completedQuests.push(questId);

        // 设置任务完成标记
        if (typeof dialogSystem !== 'undefined') {
            dialogSystem.setFlag({ flag: `${questId}_completed`, value: true });
        } else {
            const gameState = gameStateMachine.getGameState();
            if (!gameState.flags) gameState.flags = {};
            gameState.flags[`${questId}_completed`] = true;
            gameStateMachine.updateGameState({ flags: gameState.flags });
        }

        // 保存到游戏状态
        this.saveToGameState();

        console.log(`[QuestManager] 任务完成: ${quest.title}`);

        // 发送任务完成事件
        eventBus.emit('quest:completed', { quest: quest });
        eventBus.emit(GameEvents.UI_NOTIFICATION, {
            message: `任务完成: ${quest.title}`,
            type: 'success'
        });

        return true;
    }

    /**
     * 发放任务奖励
     * @param {Object} quest - 任务对象
     */
    giveRewards(quest: ActiveQuest): void {
        const rewards = quest.rewards;
        if (!rewards) {
            return;
        }

        const gameState = gameStateMachine.getGameState();
        const player = gameState.player;

        // 给予金币
        if (rewards.money) {
            player.money = (player.money || 0) + rewards.money;
            console.log(`[QuestManager] 获得金币: ${rewards.money}`);
        }

        // 给予物品
        if (rewards.items && rewards.items.length > 0) {
            if (!player.inventory) {
                player.inventory = [];
            }

            for (const item of rewards.items) {
                const existing = player.inventory.find(i => i.itemId === item.itemId);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    player.inventory.push({ ...item });
                }
            }

            console.log(`[QuestManager] 获得物品:`, rewards.items);
        }

        // TODO: 给予经验值
        if (rewards.exp) {
            console.log(`[QuestManager] 获得经验: ${rewards.exp}`);
            // 经验值处理由战斗系统或角色系统管理
        }

        gameStateMachine.updatePlayer({
            money: player.money,
            inventory: player.inventory
        });
    }

    /**
     * 放弃任务
     * @param {string} questId - 任务ID
     * @returns {boolean} 是否成功放弃
     */
    abandonQuest(questId: string): boolean {
        const questIndex = this.quests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            console.warn(`[QuestManager] 任务不存在: ${questId}`);
            return false;
        }

        const quest = this.quests[questIndex];
        if (quest.type === 'main') {
            console.warn(`[QuestManager] 主线任务不能放弃: ${questId}`);
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                message: '主线任务不能放弃！',
                type: 'warning'
            });
            return false;
        }

        // 从活动任务中移除
        this.quests.splice(questIndex, 1);

        // 清除任务开始标记
        const gameState = gameStateMachine.getGameState();
        if (gameState.flags) {
            delete gameState.flags[`${questId}_started`];
            gameStateMachine.updateGameState({ flags: gameState.flags });
        }

        // 保存到游戏状态
        this.saveToGameState();

        console.log(`[QuestManager] 任务放弃: ${quest.title}`);
        eventBus.emit('quest:abandoned', { questId: questId });

        return true;
    }

    /**
     * 检查任务是否在进行中
     * @param {string} questId - 任务ID
     * @returns {boolean} 是否在进行中
     */
    isQuestActive(questId: string): boolean {
        return this.quests.some(q => q.id === questId);
    }

    /**
     * 检查任务是否已完成
     * @param {string} questId - 任务ID
     * @returns {boolean} 是否已完成
     */
    isQuestCompleted(questId: string): boolean {
        return this.completedQuests.includes(questId);
    }

    /**
     * 获取任务
     * @param {string} questId - 任务ID
     * @returns {Object|null} 任务对象
     */
    getQuest(questId: string): ActiveQuest | null {
        return this.quests.find(q => q.id === questId) || null;
    }

    /**
     * 获取所有进行中的任务
     * @returns {Array} 任务列表
     */
    getActiveQuests(): ActiveQuest[] {
        return [...this.quests];
    }

    /**
     * 获取主线任务
     * @returns {Array} 主线任务列表
     */
    getMainQuests(): ActiveQuest[] {
        return this.quests.filter(q => q.type === 'main');
    }

    /**
     * 获取支线任务
     * @returns {Array} 支线任务列表
     */
    getSideQuests(): ActiveQuest[] {
        return this.quests.filter(q => q.type === 'side');
    }

    /**
     * 获取已完成任务ID列表
     * @returns {Array} 已完成任务ID
     */
    getCompletedQuests(): string[] {
        return [...this.completedQuests];
    }

    /**
     * 保存任务状态到游戏状态
     */
    saveToGameState(): void {
        gameStateMachine.updatePlayer({
            quests: this.quests,
            completedQuests: this.completedQuests
        });
    }

    /**
     * 从游戏状态加载任务
     */
    loadFromGameState(): void {
        const gameState = gameStateMachine.getGameState();
        if (gameState && gameState.player) {
            this.quests = gameState.player.quests || [];
            this.completedQuests = gameState.player.completedQuests || [];
        }
    }

    /**
     * 销毁任务管理器
     */
    destroy(): void {
        this.quests = [];
        this.completedQuests = [];
        this.eventHandlers = [];
    }
}

// 创建全局实例
const questManager = new QuestManager();
window.questManager = questManager;
