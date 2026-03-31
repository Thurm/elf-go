/**
 * 商店系统核心类
 * 负责商店交易逻辑、商品列表管理、购买/出售处理
 */
class ShopSystem {
    constructor() {
        this.currentShop = null;
        this.currentShopInventory = [];
        this.isOpen = false;

        // 订阅事件
        this._setupEventListeners();
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        eventBus.on(GameEvents.SHOP_OPEN, (data) => this.openShop(data.shopId));
        eventBus.on(GameEvents.SHOP_BUY, (data) => this.buyItem(data.itemId, data.quantity));
        eventBus.on(GameEvents.SHOP_SELL, (data) => this.sellItem(data.inventoryUid, data.quantity));
        eventBus.on(GameEvents.SHOP_CLOSE, () => this.closeShop());
    }

    /**
     * 打开商店
     * @param {string} shopId - 商店ID
     * @returns {boolean} 是否成功打开
     */
    openShop(shopId) {
        const shopData = getShopData(shopId);
        if (!shopData) {
            console.error(`商店不存在: ${shopId}`);
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                type: 'error',
                message: '商店不存在！'
            });
            return false;
        }

        // 检查开启条件
        if (!this._checkUnlockCondition(shopData)) {
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                type: 'error',
                message: '该商店尚未开放！'
            });
            return false;
        }

        // 检查营业时间
        if (!this._checkBusinessHours(shopData)) {
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                type: 'error',
                message: '商店已打烊，请稍后再来！'
            });
            return false;
        }

        this.currentShop = shopData;
        this.currentShopInventory = this._initShopInventory(shopData);
        this.isOpen = true;

        // 切换游戏状态
        if (gameStateMachine.getCurrentState() !== GameState.SHOP) {
            gameStateMachine.pushState(GameState.SHOP);
        }

        eventBus.emit('shop:opened', {
            shop: shopData,
            inventory: this.currentShopInventory,
            playerMoney: gameStateMachine.getGameState().player.money
        });

        console.log(`打开商店: ${shopData.name}`);
        return true;
    }

    /**
     * 初始化商店库存
     * @param {Object} shopData - 商店数据
     * @returns {Array} 商店库存列表
     * @private
     */
    _initShopInventory(shopData) {
        return shopData.inventory.map(item => ({
            ...item,
            currentStock: item.stock,
            template: getItemTemplate(item.itemId)
        }));
    }

    /**
     * 检查商店开启条件
     * @param {Object} shopData - 商店数据
     * @returns {boolean} 是否满足条件
     * @private
     */
    _checkUnlockCondition(shopData) {
        const condition = shopData.unlockCondition;
        const gameState = gameStateMachine.getGameState();

        switch (condition.type) {
            case 'default':
                return true;
            case 'quest':
                return gameState.player.completedQuests.includes(condition.questId);
            case 'flag':
                return gameState.flags[condition.flag] === true;
            case 'item':
                return inventoryManager.hasItem(condition.itemId);
            default:
                return true;
        }
    }

    /**
     * 检查营业时间
     * @param {Object} shopData - 商店数据
     * @returns {boolean} 是否在营业时间内
     * @private
     */
    _checkBusinessHours(shopData) {
        const { open, close } = shopData.hours;
        if (open === 0 && close === 24) {
            return true; // 全天营业
        }

        const currentHour = this._getCurrentGameHour();
        if (open < close) {
            return currentHour >= open && currentHour < close;
        } else {
            // 跨天营业，如 20:00 - 04:00
            return currentHour >= open || currentHour < close;
        }
    }

    /**
     * 获取当前游戏时间（小时）
     * @returns {number} 小时 (0-23)
     * @private
     */
    _getCurrentGameHour() {
        const gameState = gameStateMachine.getGameState();
        const gameTime = gameState.gameTime || 0;
        return Math.floor((gameTime / 60) % 24);
    }

    /**
     * 购买物品
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 购买数量
     * @returns {Object} 购买结果
     */
    buyItem(itemId, quantity = 1) {
        if (!this.isOpen || !this.currentShop) {
            return { success: false, message: '商店未打开！' };
        }

        const shopItem = this.currentShopInventory.find(i => i.itemId === itemId);
        if (!shopItem) {
            return { success: false, message: '商品不存在！' };
        }

        const itemTemplate = shopItem.template;
        if (!itemTemplate) {
            return { success: false, message: '物品数据错误！' };
        }

        // 检查库存
        if (!shopItem.unlimited && shopItem.currentStock < quantity) {
            return { success: false, message: '库存不足！' };
        }

        // 计算总价格
        const unitPrice = shopItem.price || itemTemplate.price?.buy;
        const totalPrice = Math.floor(unitPrice * quantity * this.currentShop.buyMultiplier);

        // 检查玩家金币
        const gameState = gameStateMachine.getGameState();
        if (gameState.player.money < totalPrice) {
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                type: 'error',
                message: '金币不足！'
            });
            return { success: false, message: '金币不足！' };
        }

        // 检查背包空间
        if (!inventoryManager.canAddItem(itemId, quantity)) {
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                type: 'error',
                message: '背包空间不足！'
            });
            return { success: false, message: '背包空间不足！' };
        }

        // 执行购买
        // 1. 扣除金币
        gameStateMachine.updatePlayer({
            money: gameState.player.money - totalPrice
        });

        // 2. 添加物品到背包
        inventoryManager.addItem(itemId, quantity);

        // 3. 减少商店库存
        if (!shopItem.unlimited) {
            shopItem.currentStock -= quantity;
        }

        eventBus.emit(GameEvents.UI_NOTIFICATION, {
            type: 'success',
            message: `购买了 ${itemTemplate.name} x${quantity}！`
        });

        eventBus.emit('shop:item_bought', {
            itemId,
            quantity,
            totalPrice,
            shopInventory: this.currentShopInventory,
            playerMoney: gameStateMachine.getGameState().player.money
        });

        return {
            success: true,
            itemId,
            quantity,
            totalPrice
        };
    }

    /**
     * 出售物品
     * @param {string} inventoryUid - 背包物品UID
     * @param {number} quantity - 出售数量
     * @returns {Object} 出售结果
     */
    sellItem(inventoryUid, quantity = 1) {
        if (!this.isOpen || !this.currentShop) {
            return { success: false, message: '商店未打开！' };
        }

        // 获取背包物品
        const invItem = inventoryManager.getItemByUid(inventoryUid);
        if (!invItem) {
            return { success: false, message: '物品不存在！' };
        }

        const itemTemplate = getItemTemplate(invItem.itemId);
        if (!itemTemplate) {
            return { success: false, message: '物品数据错误！' };
        }

        // 检查是否可以出售
        if (itemTemplate.price?.sell === null || itemTemplate.type === ItemType.KEY_ITEM) {
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                type: 'error',
                message: '该物品无法出售！'
            });
            return { success: false, message: '该物品无法出售！' };
        }

        // 检查数量
        if (invItem.quantity < quantity) {
            return { success: false, message: '数量不足！' };
        }

        // 检查是否已装备
        if (invItem.equipped) {
            eventBus.emit(GameEvents.UI_NOTIFICATION, {
                type: 'error',
                message: '请先卸下装备！'
            });
            return { success: false, message: '请先卸下装备！' };
        }

        // 计算出售价格
        const unitPrice = itemTemplate.price.sell;
        const totalPrice = Math.floor(unitPrice * quantity * this.currentShop.sellMultiplier);

        // 执行出售
        // 1. 移除物品
        inventoryManager.removeItem(inventoryUid, quantity);

        // 2. 增加金币
        const gameState = gameStateMachine.getGameState();
        gameStateMachine.updatePlayer({
            money: gameState.player.money + totalPrice
        });

        eventBus.emit(GameEvents.UI_NOTIFICATION, {
            type: 'success',
            message: `出售了 ${itemTemplate.name} x${quantity}，获得 ${totalPrice} 金币！`
        });

        eventBus.emit('shop:item_sold', {
            itemId: invItem.itemId,
            quantity,
            totalPrice,
            playerMoney: gameStateMachine.getGameState().player.money
        });

        return {
            success: true,
            itemId: invItem.itemId,
            quantity,
            totalPrice
        };
    }

    /**
     * 关闭商店
     */
    closeShop() {
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;
        this.currentShop = null;
        this.currentShopInventory = [];

        // 恢复游戏状态
        while (gameStateMachine.getCurrentState() === GameState.SHOP) {
            gameStateMachine.popState();
        }

        eventBus.emit(GameEvents.SHOP_CLOSE);
        eventBus.emit('shop:closed');
        console.log('商店已关闭');
    }

    /**
     * 获取当前商店信息
     * @returns {Object|null} 商店信息
     */
    getCurrentShop() {
        return this.currentShop;
    }

    /**
     * 获取当前商店库存
     * @returns {Array} 库存列表
     */
    getShopInventory() {
        return this.currentShopInventory;
    }

    /**
     * 检查商店是否开启
     * @returns {boolean}
     */
    isShopOpen() {
        return this.isOpen;
    }

    /**
     * 刷新商店库存（每天刷新限量商品）
     */
    refreshShopInventory() {
        if (!this.currentShop) {
            return;
        }

        const shopData = getShopData(this.currentShop.id);
        if (shopData) {
            this.currentShopInventory = this._initShopInventory(shopData);
        }
    }
}

// 创建全局实例
const shopSystem = new ShopSystem();
window.shopSystem = shopSystem;
