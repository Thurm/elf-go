/**
 * 对话系统 - 管理NPC对话、对话树遍历、选项处理
 */

class DialogSystem {
    constructor() {
        // 当前对话状态
        this.currentDialogId = null;
        this.currentNode = null;
        this.currentLineIndex = 0;
        this.isActive = false;

        // 对话历史
        this.history = [];

        // 事件监听
        this.eventListeners = {};
    }

    /**
     * 初始化对话系统
     */
    init() {
        console.log('[DialogSystem] 初始化对话系统');
        this.isActive = false;
        this.currentDialogId = null;
        this.currentNode = null;
        this.currentLineIndex = 0;
        this.history = [];

        // 监听事件 - 只监听 DIALOG_START，让 MapStateMachine 处理交互逻辑
        console.log('[DialogSystem] 正在监听 DIALOG_START 事件...');
        eventBus.on(GameEvents.DIALOG_START, this.handleDialogStart.bind(this));
        eventBus.on(GameEvents.DIALOG_NEXT, this.handleNext.bind(this));
        eventBus.on(GameEvents.DIALOG_CHOICE, this.handleChoice.bind(this));
    }

    /**
     * 处理对话开始事件
     * @param {Object} data - 对话数据
     */
    handleDialogStart(data) {
        console.log('[DialogSystem] 收到 DIALOG_START 事件:', data);

        if (!data) {
            console.warn('[DialogSystem] 无效的对话数据');
            return;
        }

        // 如果直接指定了 dialogId，优先使用
        if (data.dialogId) {
            console.log(`[DialogSystem] 使用直接指定的对话: ${data.dialogId}`);
            this.startDialogById(data.dialogId);
            return;
        }

        // 否则通过 NPC ID 查找对话
        if (data.npcId) {
            console.log(`[DialogSystem] 通过 NPC ID 查找对话: ${data.npcId}`);
            this.startDialog(data.npcId);
        } else {
            console.warn('[DialogSystem] 既没有 dialogId 也没有 npcId');
        }
    }

    /**
     * 开始与NPC的对话
     * @param {string} npcId - NPC ID
     */
    startDialog(npcId) {
        const gameState = gameStateMachine.getGameState();
        if (!gameState) {
            console.error('[DialogSystem] 无法获取游戏状态');
            return;
        }

        // 获取适合的对话
        const dialogId = this.getDialogForNPC(npcId, gameState);
        if (!dialogId) {
            console.warn(`[DialogSystem] 未找到NPC ${npcId} 的对话`);
            return;
        }

        this.startDialogById(dialogId);
    }

    /**
     * 根据对话ID开始对话
     * @param {string} dialogId - 对话节点ID
     */
    startDialogById(dialogId) {
        // 强制从 window 中获取对话节点（确保浏览器中能找到）
        const dialogNodes = window.DialogNodes || {};
        let dialogNode = dialogNodes[dialogId];
        if (!dialogNode && window.DialogData) {
            dialogNode = window.DialogData[dialogId];
            if (dialogNode) {
                // 回写到 DialogNodes，避免后续重复缺失
                window.DialogNodes = { ...window.DialogData, ...dialogNodes };
            }
        }
        if (!dialogNode) {
            console.error(`[DialogSystem] 对话节点不存在: ${dialogId}`);
            return;
        }

        console.log(`[DialogSystem] 开始对话: ${dialogId}`);

        // 更新状态
        this.currentDialogId = dialogId;
        this.currentNode = dialogNode;
        this.currentLineIndex = 0;
        this.isActive = true;

        // 显示第一行对话
        console.log('[DialogSystem] 调用 showCurrentLine() 显示第一行对话');
        this.showCurrentLine();

        // 注意：MapStateMachine 已经处理了状态切换和 DIALOG_START 事件
        // 这里除了维护 DialogSystem 内部状态，还需要主动显示第一行对话
    }

    /**
     * 显示当前行对话
     */
    showCurrentLine() {
        if (!this.currentNode || !this.currentNode.lines) {
            return;
        }

        const line = this.currentNode.lines[this.currentLineIndex];
        if (!line) {
            // 对话结束，检查是否有选项
            this.checkChoicesOrEnd();
            return;
        }

        // 发送显示对话行事件 - 格式要与 UIManager 期望的一致！
        eventBus.emit('dialog:show_line', {
            speaker: line.speaker,
            text: line.text,
            portrait: line.portrait || 'normal',
            lineIndex: this.currentLineIndex,
            totalLines: this.currentNode.lines.length
        });
    }

    /**
     * 处理下一行对话
     */
    handleNext() {
        if (!this.isActive) {
            return;
        }

        console.log('[DialogSystem.handleNext] 当前行索引:', this.currentLineIndex, '总行数:', this.currentNode.lines.length);
        this.currentLineIndex++;

        if (this.currentLineIndex < this.currentNode.lines.length) {
            // 还有更多行
            this.showCurrentLine();
        } else {
            // 对话结束，检查是否有选项
            this.checkChoicesOrEnd();
        }
    }

    /**
     * 检查是否有选项，否则结束对话
     */
    checkChoicesOrEnd() {
        if (this.currentNode.choices && this.currentNode.choices.length > 0) {
            // 显示选项
            eventBus.emit('dialog:show_choices', {
                choices: this.currentNode.choices
            });
        } else {
            // 没有选项，执行完成动作并结束
            this.executeOnComplete();
            this.endDialog();
        }
    }

    /**
     * 处理选项选择
     * @param {Object} data - 选项数据
     */
    handleChoice(data) {
        if (!this.isActive || !data || typeof data.choiceIndex !== 'number') {
            return;
        }

        const choice = this.currentNode.choices[data.choiceIndex];
        if (!choice) {
            console.warn('[DialogSystem] 无效的选项索引');
            return;
        }

        console.log(`[DialogSystem] 选择选项: ${choice.text}`);

        // 执行选项动作
        if (choice.action) {
            this.executeAction(choice.action);
        }

        // 添加到历史
        this.history.push({
            dialogId: this.currentDialogId,
            choice: choice.text,
            timestamp: Date.now()
        });

        // 跳转到下一个对话
        if (choice.nextDialog) {
            this.startDialogById(choice.nextDialog);
        } else {
            // 没有下一个对话，结束
            this.executeOnComplete();
            this.endDialog();
        }
    }

    /**
     * 执行对话完成时的动作
     */
    executeOnComplete() {
        if (!this.currentNode || !this.currentNode.onComplete) {
            return;
        }

        this.executeAction(this.currentNode.onComplete);
    }

    /**
     * 执行动作
     * @param {Object} action - 动作数据
     */
    executeAction(action) {
        if (!action || !action.type) {
            return;
        }

        const gameState = gameStateMachine.getGameState();

        switch (action.type) {
            case 'set_flag':
                this.setFlag(action.data);
                break;

            case 'give_monster':
                this.giveMonster(action.data);
                break;

            case 'give_items':
                this.giveItems(action.data);
                break;

            case 'start_quest':
                this.startQuest(action.data);
                break;

            case 'complete_quest':
                this.completeQuest(action.data);
                break;

            case 'open_shop':
                this.openShop(action.data);
                break;

            case 'close_dialog':
                // 由 endDialog 处理
                break;

            default:
                console.warn(`[DialogSystem] 未知动作类型: ${action.type}`);
        }
    }

    /**
     * 设置游戏标记
     * @param {Object} data - 标记数据
     */
    setFlag(data) {
        if (!data || !data.flag) {
            return;
        }

        const gameState = gameStateMachine.getGameState();
        if (!gameState.flags) {
            gameState.flags = {};
        }

        gameState.flags[data.flag] = data.value !== undefined ? data.value : true;
        gameStateMachine.updateGameState({ flags: gameState.flags });

        console.log(`[DialogSystem] 设置标记: ${data.flag} = ${gameState.flags[data.flag]}`);
        eventBus.emit(GameEvents.UI_NOTIFICATION, {
            message: '进度已保存！',
            type: 'info'
        });
    }

    /**
     * 给予怪兽
     * @param {Object} data - 怪兽数据
     */
    giveMonster(data) {
        if (!data || !data.monsterId) {
            return;
        }

        const gameState = gameStateMachine.getGameState();
        const monster = createPlayerMonster(data.monsterId, data.nickname, data.level || 5);

        if (monster) {
            if (!gameState.player.party) {
                gameState.player.party = [];
            }
            gameState.player.party.push(monster);
            gameStateMachine.updatePlayer({ party: gameState.player.party });

            // 设置标记
            this.setFlag({ flag: 'received_starter', value: true });

            console.log(`[DialogSystem] 获得怪兽: ${monster.nickname}`);
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                message: `获得了 ${monster.nickname}！`,
                type: 'success'
            });
        }
    }

    /**
     * 给予物品
     * @param {Object} data - 物品数据
     */
    giveItems(data) {
        if (!data || !data.items) {
            return;
        }

        const gameState = gameStateMachine.getGameState();
        const inventory = gameState.player.inventory || [];
        let totalGold = 0;

        for (const item of data.items) {
            if (item.itemId === 'gold') {
                totalGold += item.quantity;
            } else {
                this.addToInventory(inventory, item.itemId, item.quantity);
            }
        }

        if (totalGold > 0) {
            gameState.player.money = (gameState.player.money || 0) + totalGold;
        }

        gameStateMachine.updatePlayer({
            inventory: inventory,
            money: gameState.player.money
        });

        console.log(`[DialogSystem] 获得物品:`, data.items);
        eventBus.emit(GameEvents.UI_NOTIFICATION, {
            message: '获得了物品！',
            type: 'success'
        });
    }

    /**
     * 添加物品到背包
     * @param {Array} inventory - 背包数组
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     */
    addToInventory(inventory, itemId, quantity) {
        const existing = inventory.find(item => item.itemId === itemId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            inventory.push({ itemId, quantity });
        }
    }

    /**
     * 开始任务
     * @param {Object} data - 任务数据
     */
    startQuest(data) {
        if (!data || !data.questId) {
            return;
        }

        if (typeof questManager !== 'undefined' && questManager.startQuest) {
            questManager.startQuest(data.questId);
        } else {
            // 简单的任务启动逻辑
            const gameState = gameStateMachine.getGameState();
            const quest = createQuestInstance(data.questId);

            if (quest) {
                if (!gameState.player.quests) {
                    gameState.player.quests = [];
                }
                gameState.player.quests.push(quest);
                gameStateMachine.updatePlayer({ quests: gameState.player.quests });

                // 设置任务开始标记
                this.setFlag({ flag: `${data.questId}_started`, value: true });
            }
        }
    }

    /**
     * 完成任务
     * @param {Object} data - 任务数据
     */
    completeQuest(data) {
        if (!data || !data.questId) {
            return;
        }

        if (typeof questManager !== 'undefined' && questManager.completeQuest) {
            questManager.completeQuest(data.questId);
        } else {
            // 设置任务完成标记
            this.setFlag({ flag: `${data.questId}_completed`, value: true });
        }
    }

    /**
     * 打开商店
     * @param {Object} action - 动作数据
     */
    openShop(action) {
        // 支持两种格式：action.shopId 或 action.data.shopId
        const shopId = action.shopId || (action.data && action.data.shopId);

        if (!shopId) {
            console.error('[DialogSystem.openShop] 未找到商店ID');
            return;
        }

        this.endDialog();
        eventBus.emit(GameEvents.SHOP_OPEN, { shopId: shopId });
        console.log(`[DialogSystem] 正在打开商店: ${shopId}`);
    }

    /**
     * 结束对话
     */
    endDialog() {
        if (!this.isActive) {
            return;
        }

        console.log('[DialogSystem] 结束对话');

        this.isActive = false;
        this.currentDialogId = null;
        this.currentNode = null;
        this.currentLineIndex = 0;

        // 弹出对话状态
        gameStateMachine.popState();

        // 发送对话结束事件
        eventBus.emit(GameEvents.DIALOG_END);
    }

    /**
     * 根据NPC ID获取合适的对话
     * @param {string} npcId - NPC ID
     * @param {Object} gameState - 游戏状态
     * @returns {string|null} 对话节点ID
     */
    getDialogForNPC(npcId, gameState) {
        console.log('[DialogSystem] Looking for dialog for NPC:', npcId);
        console.log('[DialogSystem] window.NPCDialogMap:', window.NPCDialogMap);
        console.log('[DialogSystem] window.DialogNodes:', window.DialogNodes);

        // 强制从 window 中获取 NPC 对话映射
        const npcDialogMap = window.NPCDialogMap || {};
        const dialogList = npcDialogMap[npcId];
        if (!dialogList) {
            console.warn(`[DialogSystem] 未找到NPC ${npcId} 的对话列表`);
            return null;
        }

        console.log('[DialogSystem] Dialog list for NPC', npcId, ':', dialogList);

        // 强制从 window 中获取对话节点
        const dialogNodes = window.DialogNodes || {};
        for (const dialogId of dialogList) {
            const dialog = dialogNodes[dialogId];
            console.log('[DialogSystem] Checking dialog', dialogId, ':', dialog);
            if (dialog) {
                if (!dialog.condition) {
                    // 无条件对话
                    return dialogId;
                }
                if (typeof dialog.condition === 'function') {
                    if (dialog.condition(gameState)) {
                        return dialogId;
                    }
                } else if (typeof dialog.condition === 'string') {
                    // 简单的条件检查
                    if (gameState.flags && gameState.flags[dialog.condition]) {
                        return dialogId;
                    }
                }
            }
        }

        // 返回最后一个作为默认
        return dialogList[dialogList.length - 1];
    }

    /**
     * 检查对话系统是否活跃
     * @returns {boolean} 是否活跃
     */
    isDialogActive() {
        return this.isActive;
    }

    /**
     * 获取当前对话节点
     * @returns {Object|null} 当前对话节点
     */
    getCurrentNode() {
        return this.currentNode;
    }

    /**
     * 获取对话历史
     * @returns {Array} 对话历史
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * 清除对话历史
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * 销毁对话系统
     */
    destroy() {
        eventBus.off(GameEvents.MAP_INTERACT, this.handleInteraction.bind(this));
        eventBus.off(GameEvents.DIALOG_NEXT, this.handleNext.bind(this));
        eventBus.off(GameEvents.DIALOG_CHOICE, this.handleChoice.bind(this));

        this.isActive = false;
        this.currentDialogId = null;
        this.currentNode = null;
        this.history = [];
        this.eventListeners = {};
    }
}

// 创建全局实例并暴露到 window 对象上
window.dialogSystem = new DialogSystem();
const dialogSystem = window.dialogSystem;
