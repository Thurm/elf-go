/**
 * 背包管理器
 * 负责背包物品管理、物品使用、装备系统、物品分类/排序
 */
type InventorySortMethod = 'name' | 'price' | 'rarity' | 'type' | 'obtain_order';
type InventoryFilter = 'all' | 'consumable' | 'equipment' | 'key_item';
type InventoryGetItemsOptions = {
    filter?: InventoryFilter;
    sortMethod?: InventorySortMethod;
    sortAscending?: boolean;
};

class InventoryManager {
    sortMethod: InventorySortMethod;
    sortAscending: boolean;
    filter: InventoryFilter;
    uidCounter: number;

    constructor() {
        // 背包排序方式
        this.sortMethod = 'obtain_order';
        this.sortAscending = true;
        this.filter = 'all';

        // 唯一ID计数器
        this.uidCounter = 0;
    }

    /**
     * 初始化背包管理器
     */
    init() {
        this._loadFromGameState();
    }

    /**
     * 从游戏状态加载背包数据
     * @private
     */
    _loadFromGameState() {
        const gameState = gameStateMachine.getGameState();
        if (gameState && gameState.player && gameState.player.inventory) {
            // 确保每个物品都有UID
            gameState.player.inventory.forEach(item => {
                if (!item.uid) {
                    item.uid = this._generateUid();
                }
                if (!item.obtainedAt) {
                    item.obtainedAt = Date.now();
                }
                if (item.equipped === undefined) {
                    item.equipped = false;
                }
                if (item.equipSlot === undefined) {
                    item.equipSlot = null;
                }
            });
        }
    }

    /**
     * 生成唯一ID
     * @returns {string} UID
     * @private
     */
    _generateUid() {
        return `inv_${Date.now()}_${++this.uidCounter}`;
    }

    // ========== 物品查询 ==========

    /**
     * 获取背包所有物品
     * @param {Object} options - 选项
     * @returns {Array} 物品列表
     */
    getItems(options: InventoryGetItemsOptions = {}) {
        const gameState = gameStateMachine.getGameState();
        let items = [...(gameState.player.inventory || [])];

        // 应用过滤
        const filter = options.filter || this.filter;
        if (filter !== 'all') {
            items = items.filter(item => {
                const template = getItemTemplate(item.itemId);
                if (!template) return false;
                switch (filter) {
                    case 'consumable':
                        return template.type === ItemType.CONSUMABLE;
                    case 'equipment':
                        return template.type === ItemType.EQUIPMENT;
                    case 'key_item':
                        return template.type === ItemType.KEY_ITEM;
                    default:
                        return true;
                }
            });
        }

        // 应用排序
        const sortMethod = options.sortMethod || this.sortMethod;
        const ascending = options.sortAscending !== undefined ? options.sortAscending : this.sortAscending;
        items = this._sortItems(items, sortMethod, ascending);

        return items;
    }

    /**
     * 通过UID获取物品
     * @param {string} uid - 物品UID
     * @returns {Object|null} 物品
     */
    getItemByUid(uid) {
        const gameState = gameStateMachine.getGameState();
        return gameState.player.inventory.find(item => item.uid === uid) || null;
    }

    /**
     * 检查是否有某物品
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {boolean}
     */
    hasItem(itemId, quantity = 1) {
        const gameState = gameStateMachine.getGameState();
        const total = gameState.player.inventory
            .filter(item => item.itemId === itemId)
            .reduce((sum, item) => sum + item.quantity, 0);
        return total >= quantity;
    }

    /**
     * 获取某物品的总数量
     * @param {string} itemId - 物品ID
     * @returns {number} 数量
     */
    getItemQuantity(itemId) {
        const gameState = gameStateMachine.getGameState();
        return gameState.player.inventory
            .filter(item => item.itemId === itemId)
            .reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * 获取已使用的背包格子数
     * @returns {number}
     */
    getUsedSlots() {
        const gameState = gameStateMachine.getGameState();
        return gameState.player.inventory.length;
    }

    /**
     * 获取背包容量
     * @returns {number}
     */
    getCapacity() {
        const gameState = gameStateMachine.getGameState();
        return gameState.player.inventoryCapacity || 50;
    }

    /**
     * 获取最大背包容量
     * @returns {number}
     */
    getMaxCapacity() {
        return 100;
    }

    /**
     * 检查背包是否已满
     * @returns {boolean}
     */
    isFull() {
        return this.getUsedSlots() >= this.getCapacity();
    }

    // ========== 物品添加/移除 ==========

    /**
     * 检查是否可以添加物品
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {boolean}
     */
    canAddItem(itemId, quantity = 1) {
        const template = getItemTemplate(itemId);
        if (!template) return false;

        const gameState = gameStateMachine.getGameState();
        const capacity = this.getCapacity();

        // 可堆叠物品：尝试合并到现有格子
        if (template.stackable) {
            let remaining = quantity;

            // 先检查现有可堆叠的格子
            for (const item of gameState.player.inventory) {
                if (item.itemId === itemId && item.quantity < template.maxStack) {
                    const canAdd = template.maxStack - item.quantity;
                    remaining -= canAdd;
                    if (remaining <= 0) break;
                }
            }

            if (remaining <= 0) return true;

            // 需要新格子
            const newSlotsNeeded = Math.ceil(remaining / template.maxStack);
            return this.getUsedSlots() + newSlotsNeeded <= capacity;
        }

        // 不可堆叠物品：每个占一格
        return this.getUsedSlots() + quantity <= capacity;
    }

    /**
     * 添加物品到背包
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {Array} 新增的物品UID列表
     */
    addItem(itemId, quantity = 1) {
        const template = getItemTemplate(itemId);
        if (!template) {
            console.error(`物品模板不存在: ${itemId}`);
            return [];
        }

        if (!this.canAddItem(itemId, quantity)) {
            console.error('背包空间不足');
            return [];
        }

        const gameState = gameStateMachine.getGameState();
        const addedUids = [];
        let remaining = quantity;

        // 可堆叠物品：先尝试合并到现有格子
        if (template.stackable) {
            for (const item of gameState.player.inventory) {
                if (item.itemId === itemId && item.quantity < template.maxStack) {
                    const canAdd = Math.min(remaining, template.maxStack - item.quantity);
                    item.quantity += canAdd;
                    remaining -= canAdd;
                    if (remaining <= 0) break;
                }
            }
        }

        // 添加新格子
        while (remaining > 0) {
            const addQty = template.stackable ? Math.min(remaining, template.maxStack) : 1;
            const newItem = {
                uid: this._generateUid(),
                itemId: itemId,
                quantity: addQty,
                equipped: false,
                equipSlot: null,
                obtainedAt: Date.now(),
                customData: {}
            };
            gameState.player.inventory.push(newItem);
            addedUids.push(newItem.uid);
            remaining -= addQty;
        }

        // 触发更新事件
        eventBus.emit(GameEvents.DATA_UPDATE, gameState);
        eventBus.emit(GameEvents.ITEM_ACQUIRED, {
            itemId,
            quantity
        });
        eventBus.emit('inventory:changed', {
            action: 'add',
            itemId,
            quantity,
            uids: addedUids
        });

        return addedUids;
    }

    /**
     * 移除物品
     * @param {string} uid - 物品UID
     * @param {number} quantity - 数量
     * @returns {boolean} 是否成功
     */
    removeItem(uid, quantity = 1) {
        const gameState = gameStateMachine.getGameState();
        const index = gameState.player.inventory.findIndex(item => item.uid === uid);

        if (index === -1) {
            console.error(`物品不存在: ${uid}`);
            return false;
        }

        const item = gameState.player.inventory[index];

        // 检查数量
        if (item.quantity < quantity) {
            console.error('数量不足');
            return false;
        }

        // 如果已装备，先卸下
        if (item.equipped) {
            this.unequipItem(uid);
        }

        const itemId = item.itemId;

        if (item.quantity > quantity) {
            // 减少数量
            item.quantity -= quantity;
        } else {
            // 移除整个格子
            gameState.player.inventory.splice(index, 1);
        }

        // 触发更新事件
        eventBus.emit(GameEvents.DATA_UPDATE, gameState);
        eventBus.emit('inventory:changed', {
            action: 'remove',
            itemId,
            quantity,
            uid
        });

        return true;
    }

    /**
     * 按物品ID移除物品
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {boolean} 是否成功
     */
    removeItemById(itemId, quantity = 1) {
        if (!this.hasItem(itemId, quantity)) {
            return false;
        }

        let remaining = quantity;
        const gameState = gameStateMachine.getGameState();

        // 从后往前遍历，避免索引问题
        for (let i = gameState.player.inventory.length - 1; i >= 0 && remaining > 0; i--) {
            const item = gameState.player.inventory[i];
            if (item.itemId === itemId) {
                const removeQty = Math.min(remaining, item.quantity);

                // 如果已装备，先卸下
                if (item.equipped) {
                    this.unequipItem(item.uid);
                }

                if (item.quantity > removeQty) {
                    item.quantity -= removeQty;
                } else {
                    gameState.player.inventory.splice(i, 1);
                }
                remaining -= removeQty;
            }
        }

        eventBus.emit(GameEvents.DATA_UPDATE, gameState);
        eventBus.emit('inventory:changed', {
            action: 'remove_by_id',
            itemId,
            quantity
        });

        return true;
    }

    // ========== 装备系统 ==========

    /**
     * 装备物品
     * @param {string} uid - 物品UID
     * @returns {Object} 装备结果
     */
    equipItem(uid) {
        const item = this.getItemByUid(uid);
        if (!item) {
            return { success: false, message: '物品不存在！' };
        }

        const template = getItemTemplate(item.itemId);
        if (!template || template.type !== ItemType.EQUIPMENT) {
            return { success: false, message: '该物品无法装备！' };
        }

        if (item.equipped) {
            return { success: false, message: '该物品已装备！' };
        }

        const slot = template.slot;
        const gameState = gameStateMachine.getGameState();

        // 检查是否已有装备在该槽位
        const currentEquipped = gameState.player.inventory.find(
            i => i.equipped && i.equipSlot === slot
        );
        if (currentEquipped) {
            // 先卸下当前装备
            this.unequipItem(currentEquipped.uid);
        }

        // 装备新物品
        item.equipped = true;
        item.equipSlot = slot;

        // 更新玩家装备数据
        gameState.player.equipment[slot] = item.uid;

        // 重新计算玩家属性
        this._recalculatePlayerStats();

        eventBus.emit(GameEvents.DATA_UPDATE, gameState);
        eventBus.emit('inventory:equip_changed', {
            action: 'equip',
            uid,
            itemId: item.itemId,
            slot
        });

        return {
            success: true,
            message: `装备了 ${template.name}！`
        };
    }

    /**
     * 卸下装备
     * @param {string} uid - 物品UID
     * @returns {Object} 卸下结果
     */
    unequipItem(uid) {
        const item = this.getItemByUid(uid);
        if (!item) {
            return { success: false, message: '物品不存在！' };
        }

        if (!item.equipped) {
            return { success: false, message: '该物品未装备！' };
        }

        const template = getItemTemplate(item.itemId);
        const slot = item.equipSlot;

        // 卸下装备
        item.equipped = false;
        item.equipSlot = null;

        // 更新玩家装备数据
        const gameState = gameStateMachine.getGameState();
        gameState.player.equipment[slot] = null;

        // 重新计算玩家属性
        this._recalculatePlayerStats();

        eventBus.emit(GameEvents.DATA_UPDATE, gameState);
        eventBus.emit('inventory:equip_changed', {
            action: 'unequip',
            uid,
            itemId: item.itemId,
            slot
        });

        return {
            success: true,
            message: `卸下了 ${template?.name || '装备'}！`
        };
    }

    /**
     * 获取装备在指定槽位的物品
     * @param {string} slot - 槽位
     * @returns {Object|null} 物品
     */
    getEquippedItem(slot) {
        const gameState = gameStateMachine.getGameState();
        const uid = gameState.player.equipment[slot];
        if (!uid) return null;
        return this.getItemByUid(uid);
    }

    /**
     * 获取所有已装备物品
     * @returns {Object} 槽位到物品的映射
     */
    getAllEquippedItems() {
        const gameState = gameStateMachine.getGameState();
        const equipped = {};
        for (const [slot, uid] of Object.entries(gameState.player.equipment)) {
            if (uid) {
                equipped[slot] = this.getItemByUid(uid);
            }
        }
        return equipped;
    }

    /**
     * 重新计算玩家装备加成的属性
     * @private
     */
    _recalculatePlayerStats() {
        // 这里可以计算玩家从装备获得的总属性加成
        const gameState = gameStateMachine.getGameState();
        const totalStats = {
            atk: 0,
            def: 0,
            spAtk: 0,
            spDef: 0,
            spd: 0,
            maxHp: 0,
            fireAtk: 0,
            fireDef: 0,
            waterAtk: 0,
            waterDef: 0,
            grassAtk: 0,
            grassDef: 0,
            electricAtk: 0,
            electricDef: 0
        };

        for (const [slot, uid] of Object.entries(gameState.player.equipment)) {
            if (uid) {
                const item = this.getItemByUid(uid);
                if (item) {
                    const template = getItemTemplate(item.itemId);
                    if (template && template.stats) {
                        for (const [stat, value] of Object.entries(template.stats)) {
                            totalStats[stat] = (totalStats[stat] || 0) + value;
                        }
                    }
                }
            }
        }

        gameState.player.equipmentStats = totalStats;
    }

    /**
     * 获取装备总属性加成
     * @returns {Object} 总属性
     */
    getEquipmentStats() {
        const gameState = gameStateMachine.getGameState();
        return gameState.player.equipmentStats || this._recalculatePlayerStats();
    }

    // ========== 物品使用 ==========

    /**
     * 使用物品
     * @param {string} uid - 物品UID
     * @param {Object} target - 使用目标
     * @returns {Object} 使用结果
     */
    useItem(uid, target = null) {
        const item = this.getItemByUid(uid);
        if (!item) {
            return { success: false, message: '物品不存在！' };
        }

        const template = getItemTemplate(item.itemId);
        if (!template) {
            return { success: false, message: '物品数据错误！' };
        }

        if (template.type === ItemType.EQUIPMENT) {
            // 装备品尝试装备
            return this.equipItem(uid);
        }

        if (template.type === ItemType.KEY_ITEM) {
            // 关键道具使用
            return this._useKeyItem(item, template);
        }

        if (template.type !== ItemType.CONSUMABLE) {
            return { success: false, message: '该物品无法使用！' };
        }

        // 消耗品使用
        const result = this._useConsumable(item, template, target);
        if (result.success) {
            // 消耗物品
            this.removeItem(uid, 1);
        }

        return result;
    }

    /**
     * 使用消耗品
     * @param {Object} item - 背包物品
     * @param {Object} template - 物品模板
     * @param {Object} target - 使用目标
     * @returns {Object} 使用结果
     * @private
     */
    _useConsumable(item, template, target) {
        const effect = template.effect;
        if (!effect) {
            return { success: false, message: '物品效果未定义！' };
        }

        const gameState = gameStateMachine.getGameState();

        switch (effect.type) {
            case 'heal_hp':
                if (!target || !target.stats) {
                    return { success: false, message: '请选择一个怪兽！' };
                }
                const healAmount = Math.min(effect.value, target.stats.maxHp - target.stats.hp);
                target.stats.hp += healAmount;
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    type: 'success',
                    message: `${target.nickname} 恢复了 ${healAmount} HP！`
                });
                return { success: true, healAmount };

            case 'heal_hp_full':
                if (!target || !target.stats) {
                    return { success: false, message: '请选择一个怪兽！' };
                }
                const fullHeal = target.stats.maxHp - target.stats.hp;
                target.stats.hp = target.stats.maxHp;
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    type: 'success',
                    message: `${target.nickname} 恢复了全部 HP！`
                });
                return { success: true, healAmount: fullHeal };

            case 'cure_status':
                if (!target) {
                    return { success: false, message: '请选择一个怪兽！' };
                }
                const statuses = Array.isArray(effect.status) ? effect.status : [effect.status];
                if (statuses.includes(target.status)) {
                    target.status = null;
                    eventBus.emit(GameEvents.UI_NOTIFICATION, {
                        type: 'success',
                        message: `${target.nickname} 的异常状态已解除！`
                    });
                }
                return { success: true };

            case 'cure_all_status':
                if (!target) {
                    return { success: false, message: '请选择一个怪兽！' };
                }
                target.status = null;
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    type: 'success',
                    message: `${target.nickname} 的所有异常状态已解除！`
                });
                return { success: true };

            case 'revive':
                if (!target) {
                    return { success: false, message: '请选择一个倒下的怪兽！' };
                }
                if (target.stats.hp > 0) {
                    return { success: false, message: '该怪兽没有倒下！' };
                }
                target.stats.hp = Math.floor(target.stats.maxHp * effect.hpPercent);
                target.status = null;
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    type: 'success',
                    message: `${target.nickname} 复活了！`
                });
                return { success: true };

            case 'restore_pp':
                if (!target || !target.skillIndex) {
                    return { success: false, message: '请选择一个技能！' };
                }
                const skill = target.monster.skills[target.skillIndex];
                if (skill) {
                    const restore = Math.min(effect.value, skill.maxPp - skill.pp);
                    skill.pp += restore;
                    eventBus.emit(GameEvents.UI_NOTIFICATION, {
                        type: 'success',
                        message: `${skill.skillId} 恢复了 ${restore} PP！`
                    });
                }
                return { success: true };

            case 'restore_pp_all':
                if (!target || !target.skills) {
                    return { success: false, message: '请选择一个怪兽！' };
                }
                target.skills.forEach(s => {
                    s.pp = Math.min(s.maxPp, s.pp + effect.value);
                });
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    type: 'success',
                    message: `${target.nickname} 的所有技能恢复了 ${effect.value} PP！`
                });
                return { success: true };

            case 'restore_pp_full':
                if (!target || !target.skills) {
                    return { success: false, message: '请选择一个怪兽！' };
                }
                target.skills.forEach(s => {
                    s.pp = s.maxPp;
                });
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    type: 'success',
                    message: `${target.nickname} 的所有技能 PP 已完全恢复！`
                });
                return { success: true };

            case 'elixir':
                if (!target || !target.stats) {
                    return { success: false, message: '请选择一个怪兽！' };
                }
                target.stats.hp = target.stats.maxHp;
                if (target.skills) {
                    target.skills.forEach(s => s.pp = s.maxPp);
                }
                target.status = null;
                eventBus.emit(GameEvents.UI_NOTIFICATION, {
                    type: 'success',
                    message: `${target.nickname} 已完全恢复！`
                });
                return { success: true };

            default:
                return { success: false, message: '未知的物品效果！' };
        }
    }

    /**
     * 使用关键道具
     * @param {Object} item - 背包物品
     * @param {Object} template - 物品模板
     * @returns {Object} 使用结果
     * @private
     */
    _useKeyItem(item, template) {
        const effect = template.effect;
        if (!effect) {
            return { success: false, message: '该道具无法使用！' };
        }

        switch (effect.type) {
            case 'map_display':
                eventBus.emit('map:show');
                return { success: true };

            case 'fast_move':
                eventBus.emit('bike:toggle');
                return { success: true };

            case 'fishing':
            case 'fishing_advanced':
                eventBus.emit('fishing:start', { level: effect.type === 'fishing_advanced' ? 2 : 1 });
                return { success: true };

            case 'hm_cut':
                eventBus.emit('hm:cut');
                return { success: true };

            case 'hm_flash':
                eventBus.emit('hm:flash');
                return { success: true };

            case 'hm_surf':
                eventBus.emit('hm:surf');
                return { success: true };

            default:
                return { success: false, message: '该道具无法在这里使用！' };
        }
    }

    // ========== 排序和过滤 ==========

    /**
     * 排序物品
     * @param {Array} items - 物品列表
     * @param {string} method - 排序方式
     * @param {boolean} ascending - 是否升序
     * @returns {Array} 排序后的列表
     * @private
     */
    _sortItems(items, method: InventorySortMethod, ascending = true) {
        const sorted = [...items];
        const multiplier = ascending ? 1 : -1;

        sorted.sort((a, b) => {
            const templateA = getItemTemplate(a.itemId);
            const templateB = getItemTemplate(b.itemId);

            if (!templateA || !templateB) return 0;

            switch (method) {
                case 'name':
                    return templateA.name.localeCompare(templateB.name) * multiplier;

                case 'price':
                    const priceA = typeof templateA.price === 'number' ? templateA.price : (templateA.price.sell ?? 0);
                    const priceB = typeof templateB.price === 'number' ? templateB.price : (templateB.price.sell ?? 0);
                    return (priceB - priceA) * multiplier; // 价格默认从高到低

                case 'rarity':
                    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
                    const rarityA = rarityOrder[templateA.rarity] || 0;
                    const rarityB = rarityOrder[templateB.rarity] || 0;
                    return (rarityB - rarityA) * multiplier; // 稀有度默认从高到低

                case 'type':
                    const typeOrder = { consumable: 0, equipment: 1, key_item: 2 };
                    const typeA = typeOrder[templateA.type] || 0;
                    const typeB = typeOrder[templateB.type] || 0;
                    return (typeA - typeB) * multiplier;

                case 'obtain_order':
                default:
                    return (a.obtainedAt - b.obtainedAt) * multiplier;
            }
        });

        return sorted;
    }

    /**
     * 设置排序方式
     * @param {string} method - 排序方式
     * @param {boolean} ascending - 是否升序
     */
    setSortMethod(method, ascending = true) {
        this.sortMethod = method;
        this.sortAscending = ascending;
        eventBus.emit('inventory:sort_changed', { method, ascending });
    }

    /**
     * 设置过滤方式
     * @param {string} filter - 过滤方式
     */
    setFilter(filter) {
        this.filter = filter;
        eventBus.emit('inventory:filter_changed', { filter });
    }

    // ========== 背包扩容 ==========

    /**
     * 扩容背包
     * @param {number} newCapacity - 新容量
     * @returns {Object} 扩容结果
     */
    expandCapacity(newCapacity) {
        const gameState = gameStateMachine.getGameState();
        const currentCapacity = this.getCapacity();
        const maxCapacity = this.getMaxCapacity();

        if (newCapacity <= currentCapacity) {
            return { success: false, message: '新容量必须大于当前容量！' };
        }

        if (newCapacity > maxCapacity) {
            return { success: false, message: `最大容量为 ${maxCapacity}！` };
        }

        gameState.player.inventoryCapacity = newCapacity;
        eventBus.emit(GameEvents.DATA_UPDATE, gameState);
        eventBus.emit('inventory:capacity_changed', { capacity: newCapacity });

        return { success: true, capacity: newCapacity };
    }

    /**
     * 获取扩容价格
     * @returns {number|null} 价格，null表示已达最大容量
     */
    getExpandPrice() {
        const current = this.getCapacity();
        const max = this.getMaxCapacity();

        if (current >= max) return null;
        if (current < 70) return 5000;
        return 15000;
    }
}

// 创建全局实例并暴露到window对象
const inventoryManager = new InventoryManager();
window.inventoryManager = inventoryManager;
