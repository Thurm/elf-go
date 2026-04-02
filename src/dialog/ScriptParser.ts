/**
 * 对话脚本解析器 - 解析对话脚本、判定条件、执行动作
 */

/**
 * 脚本解析器类
 * 负责解析对话条件和执行对话动作
 */
class ScriptParser {
    private actionHandlers: Record<string, (data: any, gameState: GameStateData) => ActionExecutionResult>;

    constructor() {
        this.actionHandlers = {
            'set_flag': this.handleSetFlag.bind(this),
            'give_item': this.handleGiveItem.bind(this),
            'give_items': this.handleGiveItems.bind(this),
            'give_monster': this.handleGiveMonster.bind(this),
            'start_quest': this.handleStartQuest.bind(this),
            'complete_quest': this.handleCompleteQuest.bind(this),
            'open_shop': this.handleOpenShop.bind(this),
            'close_dialog': this.handleCloseDialog.bind(this)
        };
    }

    /**
     * 评估条件表达式
     * @param {Function|string|undefined} condition - 条件
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 条件是否满足
     */
    evaluateCondition(condition: DialogNode['condition'], gameState: GameStateData): boolean {
        if (!condition) {
            return true; // 没有条件默认满足
        }

        if (typeof condition === 'function') {
            try {
                return condition(gameState);
            } catch (error) {
                console.error('Error evaluating condition function:', error);
                return false;
            }
        }

        if (typeof condition === 'string') {
            return this.evaluateConditionString(condition, gameState);
        }

        return true;
    }

    /**
     * 评估条件字符串（简单表达式解析）
     * @param {string} conditionStr - 条件字符串
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 条件是否满足
     */
    evaluateConditionString(conditionStr: string, gameState: GameStateData): boolean {
        const flags = gameState.flags || {};
        const trimmed = conditionStr.trim();

        // 处理 !flag 格式
        if (trimmed.startsWith('!')) {
            const flagName = trimmed.slice(1);
            return !flags[flagName];
        }

        // 处理 && 连接的条件
        if (trimmed.includes('&&')) {
            const conditions = trimmed.split('&&').map(c => c.trim());
            return conditions.every(c => this.evaluateConditionString(c, gameState));
        }

        // 处理 || 连接的条件
        if (trimmed.includes('||')) {
            const conditions = trimmed.split('||').map(c => c.trim());
            return conditions.some(c => this.evaluateConditionString(c, gameState));
        }

        // 简单的 flag 检查
        return !!flags[trimmed];
    }

    /**
     * 执行动作
     * @param {Object} action - 动作对象
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    executeAction(action: DialogAction, gameState: GameStateData): ActionExecutionResult {
        if (!action || !action.type) {
            return { success: true, message: 'No action to execute' };
        }

        const handler = action.type ? this.actionHandlers[action.type] : undefined;
        if (!handler) {
            console.warn(`Unknown action type: ${action.type}`);
            return { success: false, message: `Unknown action type: ${action.type}` };
        }

        try {
            return handler(action.data, gameState);
        } catch (error: unknown) {
            console.error('Error executing action:', error);
            return { success: false, message: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * 批量执行动作
     * @param {Array<Object>} actions - 动作数组
     * @param {Object} gameState - 游戏状态
     * @returns {Array<Object>} 执行结果数组
     */
    executeActions(actions: DialogAction[], gameState: GameStateData): ActionExecutionResult[] {
        if (!actions || !Array.isArray(actions)) {
            return [];
        }
        return actions.map(action => this.executeAction(action, gameState));
    }

    // ========== 动作处理器 ==========

    /**
     * 处理设置标志
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleSetFlag(data: { flag: string; value?: unknown } | undefined, gameState: GameStateData): ActionExecutionResult {
        if (!data || !data.flag) {
            return { success: false, message: 'Invalid set_flag data' };
        }

        if (!gameState.flags) {
            gameState.flags = {};
        }

        const value = data.value !== undefined ? data.value : true;
        gameState.flags[data.flag] = value;

        eventBus.emit(GameEvents.DATA_UPDATE, gameState);

        return {
            success: true,
            message: `Flag ${data.flag} set to ${value}`,
            type: 'set_flag',
            flag: data.flag,
            value: value
        };
    }

    /**
     * 处理给予单个物品
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleGiveItem(data: { itemId: string; quantity?: number } | undefined, gameState: GameStateData): ActionExecutionResult {
        if (!data || !data.itemId) {
            return { success: false, message: 'Invalid give_item data' };
        }

        const quantity = data.quantity || 1;
        return this.addItemToInventory(gameState.player, data.itemId, quantity);
    }

    /**
     * 处理给予多个物品
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleGiveItems(data: { items: InventoryItem[] } | undefined, gameState: GameStateData): ActionExecutionResult {
        if (!data || !Array.isArray(data.items)) {
            return { success: false, message: 'Invalid give_items data' };
        }

        const results = [];
        let allSuccess = true;

        for (const item of data.items) {
            const result = this.addItemToInventory(gameState.player, item.itemId, item.quantity || 1);
            results.push(result);
            if (!result.success) {
                allSuccess = false;
            }
        }

        eventBus.emit(GameEvents.DATA_UPDATE, gameState);

        return {
            success: allSuccess,
            message: allSuccess ? 'All items given' : 'Some items failed',
            results: results
        };
    }

    /**
     * 添加物品到背包
     * @param {Object} player - 玩家数据
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {Object} 执行结果
     */
    addItemToInventory(player: PlayerData, itemId: string, quantity: number): ActionExecutionResult {
        if (!player.inventory) {
            player.inventory = [];
        }

        // 检查物品模板是否存在
        const itemTemplate = ItemTemplates[itemId];
        if (!itemTemplate) {
            return {
                success: false,
                message: `Item template not found: ${itemId}`
            };
        }

        // 查找是否已有该物品
        const existingItem = player.inventory.find((i) => i.itemId === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            player.inventory.push({ itemId, quantity });
        }

        return {
            success: true,
            message: `Added ${quantity}x ${itemId}`,
            itemId,
            quantity
        };
    }

    /**
     * 处理给予怪兽
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleGiveMonster(data: { monsterId: string; nickname?: string; level?: number } | undefined, gameState: GameStateData): ActionExecutionResult {
        if (!data || !data.monsterId) {
            return { success: false, message: 'Invalid give_monster data' };
        }

        if (!gameState.player.party) {
            gameState.player.party = [];
        }

        // 检查队伍是否已满
        if (gameState.player.party.length >= 6) {
            return {
                success: false,
                message: 'Party is full (max 6 monsters)'
            };
        }

        // 创建怪兽
        const monster = createPlayerMonster(
            data.monsterId,
            data.nickname,
            data.level || 5
        );

        if (!monster) {
            return {
                success: false,
                message: `Failed to create monster: ${data.monsterId}`
            };
        }

        gameState.player.party.push(monster);
        eventBus.emit(GameEvents.DATA_UPDATE, gameState);

        return {
            success: true,
            message: `Received monster: ${monster.nickname}`,
            monster: monster
        };
    }

    /**
     * 处理开始任务
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleStartQuest(data: { questId: string } | undefined, _gameState: GameStateData): ActionExecutionResult {
        if (!data || !data.questId) {
            return { success: false, message: 'Invalid start_quest data' };
        }

        // 通过事件总线通知任务管理器
        eventBus.emit('quest:start', { questId: data.questId });

        return {
            success: true,
            message: `Starting quest: ${data.questId}`,
            questId: data.questId
        };
    }

    /**
     * 处理完成任务
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleCompleteQuest(data: { questId: string } | undefined, _gameState: GameStateData): ActionExecutionResult {
        if (!data || !data.questId) {
            return { success: false, message: 'Invalid complete_quest data' };
        }

        // 通过事件总线通知任务管理器
        eventBus.emit('quest:complete', { questId: data.questId });

        return {
            success: true,
            message: `Completing quest: ${data.questId}`,
            questId: data.questId
        };
    }

    /**
     * 处理打开商店
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleOpenShop(data: { shopId: string } | undefined, _gameState: GameStateData): ActionExecutionResult {
        if (!data || !data.shopId) {
            return { success: false, message: 'Invalid open_shop data' };
        }

        eventBus.emit(GameEvents.SHOP_OPEN, { shopId: data.shopId });

        return {
            success: true,
            message: `Opening shop: ${data.shopId}`,
            shopId: data.shopId
        };
    }

    /**
     * 处理关闭对话
     * @param {Object} data - 动作数据
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 执行结果
     */
    handleCloseDialog(_data: unknown, _gameState: GameStateData): ActionExecutionResult {
        eventBus.emit(GameEvents.DIALOG_END);

        return {
            success: true,
            message: 'Closing dialog',
            type: 'close_dialog'
        };
    }
}

// 创建全局实例
const scriptParser = new ScriptParser();
window.scriptParser = scriptParser;
