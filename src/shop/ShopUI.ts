/**
 * 商店界面
 * 负责商店界面渲染、商品列表显示、购买确认对话框
 */
class ShopUI {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentTab = 'buy'; // 'buy' | 'sell'
        this.selectedShopItem = null;
        this.selectedInventoryItem = null;
        this.buyQuantity = 1;

        this._setupEventListeners();
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        eventBus.on('shop:opened', (data) => this.show(data));
        eventBus.on('shop:closed', () => this.hide());
        eventBus.on('shop:item_bought', () => this.refresh());
        eventBus.on('shop:item_sold', () => this.refresh());
        eventBus.on('inventory:changed', () => {
            if (this.isVisible && this.currentTab === 'sell') {
                this._renderSellTab();
            }
        });
    }

    /**
     * 显示商店界面
     * @param {Object} data - 商店数据
     */
    show(data) {
        this.currentShop = data.shop;
        this.shopInventory = data.inventory;
        this.playerMoney = data.playerMoney;
        this.isVisible = true;
        this.currentTab = 'buy';
        this.selectedShopItem = null;
        this.selectedInventoryItem = null;
        this.buyQuantity = 1;

        this._createContainer();
        this._render();
    }

    /**
     * 隐藏商店界面
     */
    hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        this._removeShopOverlays();
    }

    /**
     * 刷新界面
     */
    refresh() {
        if (!this.isVisible) return;

        this.shopInventory = shopSystem.getShopInventory();
        this.playerMoney = gameStateMachine.getGameState().player.money;
        this._render();
    }

    /**
     * 创建容器
     * @private
     */
    _createContainer() {
        if (this.container) {
            this.container.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'shop-ui';
        this.container.className = 'shop-ui';
        this._getUIHost().appendChild(this.container);
    }

    /**
     * 获取 UI 宿主节点
     * @returns {HTMLElement}
     * @private
     */
    _getUIHost() {
        return document.getElementById('ui-layer') || document.body;
    }

    /**
     * 移除商店相关弹层
     * @private
     */
    _removeShopOverlays() {
        document.querySelectorAll('.shop-dialog-overlay').forEach((overlay) => overlay.remove());
    }

    /**
     * 生成稀有度样式变量
     * @param {{border:string,bg:string,text:string}} rarityColors - 稀有度色板
     * @returns {string}
     * @private
     */
    _getRarityStyleVars(rarityColors) {
        return `--rarity-border: ${rarityColors.border}; --rarity-bg: ${rarityColors.bg}; --rarity-text: ${rarityColors.text};`;
    }

    /**
     * 渲染界面
     * @private
     */
    _render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="shop-overlay"></div>
            <div class="shop-container">
                <div class="shop-header">
                    <h2 class="shop-title">${this.currentShop.name}</h2>
                    <div class="shop-npc">${this.currentShop.npcName}</div>
                    <div class="shop-money">
                        <span class="money-icon">💰</span>
                        <span class="money-value">${this.playerMoney.toLocaleString()}</span>
                    </div>
                </div>

                <div class="shop-tabs">
                    <button class="shop-tab ${this.currentTab === 'buy' ? 'active' : ''}" data-tab="buy">
                        购买
                    </button>
                    <button class="shop-tab ${this.currentTab === 'sell' ? 'active' : ''}" data-tab="sell">
                        出售
                    </button>
                </div>

                <div class="shop-content">
                    <div class="shop-items-panel" id="shop-items-panel"></div>
                    <div class="shop-detail-panel" id="shop-detail-panel"></div>
                </div>

                <div class="shop-footer">
                    <button class="shop-close-btn" id="shop-close-btn">
                        离开商店
                    </button>
                </div>
            </div>
        `;

        // 绑定事件
        this._bindEvents();

        // 渲染对应标签页
        if (this.currentTab === 'buy') {
            this._renderBuyTab();
        } else {
            this._renderSellTab();
        }
    }

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        // 标签页切换
        this.container.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.selectedShopItem = null;
                this.selectedInventoryItem = null;
                this.buyQuantity = 1;
                this._render();
            });
        });

        // 关闭按钮
        const closeBtn = this.container.querySelector('#shop-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                shopSystem.closeShop();
            });
        }
    }

    /**
     * 渲染购买标签页
     * @private
     */
    _renderBuyTab() {
        const itemsPanel = this.container.querySelector('#shop-items-panel');
        const detailPanel = this.container.querySelector('#shop-detail-panel');

        // 渲染商品列表
        itemsPanel.innerHTML = `
            <div class="shop-items-list">
                ${this.shopInventory.map((item, index) => {
                    const template = item.template;
                    if (!template) return '';

                    const isSelected = this.selectedShopItem?.itemId === item.itemId;
                    const outOfStock = !item.unlimited && item.currentStock <= 0;
                    const rarityColors = RarityColors[template.rarity] || RarityColors.common;

                    return `
                        <div class="shop-item ${isSelected ? 'selected' : ''} ${outOfStock ? 'out-of-stock' : ''}"
                             data-index="${index}"
                             style="${this._getRarityStyleVars(rarityColors)}">
                            <div class="item-icon">
                                ${this._getItemIcon(template)}
                            </div>
                            <div class="item-info">
                                <div class="item-name">
                                    ${template.name}
                                </div>
                                <div class="item-type">${this._getItemTypeName(template)}</div>
                            </div>
                            <div class="item-price">
                                ${item.price} 💰
                            </div>
                            ${!item.unlimited ? `<div class="item-stock">库存: ${item.currentStock}</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // 绑定商品点击事件
        itemsPanel.querySelectorAll('.shop-item:not(.out-of-stock)').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                this.selectedShopItem = this.shopInventory[index];
                this.buyQuantity = 1;
                this._renderBuyDetail(detailPanel);
            });
        });

        // 渲染详情面板
        this._renderBuyDetail(detailPanel);
    }

    /**
     * 渲染购买详情
     * @param {HTMLElement} detailPanel - 详情面板
     * @private
     */
    _renderBuyDetail(detailPanel) {
        if (!this.selectedShopItem) {
            detailPanel.innerHTML = `
                <div class="shop-detail-empty">
                    请选择要购买的商品
                </div>
            `;
            return;
        }

        const item = this.selectedShopItem;
        const template = item.template;
        const rarityColors = RarityColors[template.rarity] || RarityColors.common;
        const unitPrice = item.price;
        const maxQuantity = item.unlimited ? 99 : Math.min(item.currentStock, 99);
        const totalPrice = unitPrice * this.buyQuantity;
        const canAfford = this.playerMoney >= totalPrice;

        detailPanel.innerHTML = `
            <div class="shop-detail">
                <div class="detail-header" style="${this._getRarityStyleVars(rarityColors)}">
                    <div class="detail-icon">
                        ${this._getItemIcon(template)}
                    </div>
                    <div class="detail-info">
                        <h3 class="detail-name">
                            ${template.name}
                        </h3>
                        <div class="detail-rarity">${getRarityName(template.rarity)}</div>
                    </div>
                </div>

                <div class="detail-description">
                    ${template.description}
                </div>

                ${this._renderStats(template)}

                <div class="detail-quantity">
                    <label>购买数量</label>
                    <div class="quantity-selector">
                        <button class="quantity-btn" data-action="decrease">-</button>
                        <input type="number" class="quantity-input"
                               value="${this.buyQuantity}" min="1" max="${maxQuantity}">
                        <button class="quantity-btn" data-action="increase">+</button>
                    </div>
                    <div class="quantity-max">
                        <button class="quantity-max-btn" data-quantity="1">1</button>
                        <button class="quantity-max-btn" data-quantity="10">10</button>
                        <button class="quantity-max-btn" data-quantity="${maxQuantity}">最大</button>
                    </div>
                </div>

                <div class="detail-total">
                    <span>总价:</span>
                    <span class="total-price ${canAfford ? '' : 'insufficient'}">
                        ${totalPrice.toLocaleString()} 💰
                    </span>
                </div>

                <div class="detail-actions">
                    <button class="buy-btn ${canAfford ? '' : 'disabled'}" id="buy-confirm-btn">
                        购买
                    </button>
                </div>
            </div>
        `;

        // 绑定数量选择事件
        detailPanel.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'increase') {
                    this.buyQuantity = Math.min(this.buyQuantity + 1, maxQuantity);
                } else {
                    this.buyQuantity = Math.max(this.buyQuantity - 1, 1);
                }
                this._renderBuyDetail(detailPanel);
            });
        });

        const quantityInput = detailPanel.querySelector('.quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('change', () => {
                let val = parseInt(quantityInput.value) || 1;
                val = Math.max(1, Math.min(val, maxQuantity));
                this.buyQuantity = val;
                this._renderBuyDetail(detailPanel);
            });
        }

        detailPanel.querySelectorAll('.quantity-max-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.buyQuantity = Math.min(parseInt(btn.dataset.quantity), maxQuantity);
                this._renderBuyDetail(detailPanel);
            });
        });

        // 绑定购买按钮
        const buyBtn = detailPanel.querySelector('#buy-confirm-btn');
        if (buyBtn && canAfford) {
            buyBtn.addEventListener('click', () => {
                this._showBuyConfirmDialog();
            });
        }
    }

    /**
     * 显示购买确认对话框
     * @private
     */
    _showBuyConfirmDialog() {
        const item = this.selectedShopItem;
        const template = item.template;
        const totalPrice = item.price * this.buyQuantity;

        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay shop-dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box">
                <h3 class="dialog-title">确认购买</h3>
                <div class="dialog-content">
                    <p>确定要购买 <strong>${template.name}</strong> x${this.buyQuantity} 吗？</p>
                    <p class="dialog-price">总价: ${totalPrice.toLocaleString()} 💰</p>
                </div>
                <div class="dialog-buttons">
                    <button class="dialog-btn cancel" id="dialog-cancel">取消</button>
                    <button class="dialog-btn confirm" id="dialog-confirm">确认</button>
                </div>
            </div>
        `;
        this._getUIHost().appendChild(overlay);

        overlay.querySelector('#dialog-cancel').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('#dialog-confirm').addEventListener('click', () => {
            shopSystem.buyItem(item.itemId, this.buyQuantity);
            this.selectedShopItem = null;
            overlay.remove();
        });
    }

    /**
     * 渲染出售标签页
     * @private
     */
    _renderSellTab() {
        const itemsPanel = this.container.querySelector('#shop-items-panel');
        const detailPanel = this.container.querySelector('#shop-detail-panel');

        // 获取背包物品（可出售的）
        const inventory = inventoryManager.getItems({ filter: 'all' });
        const sellableItems = inventory.filter(item => {
            const template = getItemTemplate(item.itemId);
            const sellPrice = template ? (typeof template.price === 'number' ? template.price : template.price.sell) : null;
            return template &&
                   template.type !== ItemType.KEY_ITEM &&
                   sellPrice !== null &&
                   !item.equipped;
        });

        // 渲染背包物品列表
        itemsPanel.innerHTML = `
            <div class="shop-items-list">
                ${sellableItems.length === 0 ? `
                    <div class="shop-items-empty">
                        没有可出售的物品
                    </div>
                ` : sellableItems.map((item, index) => {
                    const template = getItemTemplate(item.itemId);
                    if (!template) return '';

                    const isSelected = this.selectedInventoryItem?.uid === item.uid;
                    const rarityColors = RarityColors[template.rarity] || RarityColors.common;

                    const sellPrice = typeof template.price === 'number' ? template.price : (template.price.sell ?? 0);
                    return `
                        <div class="shop-item ${isSelected ? 'selected' : ''}"
                             data-uid="${item.uid}"
                             style="${this._getRarityStyleVars(rarityColors)}">
                            <div class="item-icon">
                                ${this._getItemIcon(template)}
                            </div>
                            <div class="item-info">
                                <div class="item-name">
                                    ${template.name}
                                </div>
                                <div class="item-type">${this._getItemTypeName(template)}</div>
                            </div>
                            <div class="item-quantity">x${item.quantity}</div>
                            <div class="item-price sell">
                                ${sellPrice} 💰
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // 绑定物品点击事件
        itemsPanel.querySelectorAll('.shop-item').forEach(el => {
            el.addEventListener('click', () => {
                const uid = el.dataset.uid;
                this.selectedInventoryItem = inventoryManager.getItemByUid(uid);
                this.buyQuantity = 1;
                this._renderSellDetail(detailPanel);
            });
        });

        // 渲染详情面板
        this._renderSellDetail(detailPanel);
    }

    /**
     * 渲染出售详情
     * @param {HTMLElement} detailPanel - 详情面板
     * @private
     */
    _renderSellDetail(detailPanel) {
        if (!this.selectedInventoryItem) {
            detailPanel.innerHTML = `
                <div class="shop-detail-empty">
                    请选择要出售的物品
                </div>
            `;
            return;
        }

        const item = this.selectedInventoryItem;
        const template = getItemTemplate(item.itemId);
        const rarityColors = RarityColors[template.rarity] || RarityColors.common;
        const unitPrice = typeof template.price === 'number' ? template.price : (template.price.sell ?? 0);
        const maxQuantity = item.quantity;
        const totalPrice = Math.floor(unitPrice * this.buyQuantity * this.currentShop.sellMultiplier);

        detailPanel.innerHTML = `
            <div class="shop-detail">
                <div class="detail-header" style="${this._getRarityStyleVars(rarityColors)}">
                    <div class="detail-icon">
                        ${this._getItemIcon(template)}
                    </div>
                    <div class="detail-info">
                        <h3 class="detail-name">
                            ${template.name}
                        </h3>
                        <div class="detail-rarity">${getRarityName(template.rarity)}</div>
                        <div class="detail-owned">拥有: ${item.quantity}</div>
                    </div>
                </div>

                <div class="detail-description">
                    ${template.description}
                </div>

                ${this._renderStats(template)}

                <div class="detail-quantity">
                    <label>出售数量</label>
                    <div class="quantity-selector">
                        <button class="quantity-btn" data-action="decrease">-</button>
                        <input type="number" class="quantity-input"
                               value="${this.buyQuantity}" min="1" max="${maxQuantity}">
                        <button class="quantity-btn" data-action="increase">+</button>
                    </div>
                    <div class="quantity-max">
                        <button class="quantity-max-btn" data-quantity="1">1</button>
                        <button class="quantity-max-btn" data-quantity="10">10</button>
                        <button class="quantity-max-btn" data-quantity="${maxQuantity}">全部</button>
                    </div>
                </div>

                <div class="detail-total">
                    <span>获得:</span>
                    <span class="total-price">
                        +${totalPrice.toLocaleString()} 💰
                    </span>
                </div>

                <div class="detail-actions">
                    <button class="sell-btn" id="sell-confirm-btn">
                        出售
                    </button>
                </div>
            </div>
        `;

        // 绑定数量选择事件
        detailPanel.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'increase') {
                    this.buyQuantity = Math.min(this.buyQuantity + 1, maxQuantity);
                } else {
                    this.buyQuantity = Math.max(this.buyQuantity - 1, 1);
                }
                this._renderSellDetail(detailPanel);
            });
        });

        const quantityInput = detailPanel.querySelector('.quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('change', () => {
                let val = parseInt(quantityInput.value) || 1;
                val = Math.max(1, Math.min(val, maxQuantity));
                this.buyQuantity = val;
                this._renderSellDetail(detailPanel);
            });
        }

        detailPanel.querySelectorAll('.quantity-max-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.buyQuantity = Math.min(parseInt(btn.dataset.quantity), maxQuantity);
                this._renderSellDetail(detailPanel);
            });
        });

        // 绑定出售按钮
        const sellBtn = detailPanel.querySelector('#sell-confirm-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this._showSellConfirmDialog();
            });
        }
    }

    /**
     * 显示出售确认对话框
     * @private
     */
    _showSellConfirmDialog() {
        const item = this.selectedInventoryItem;
        const template = getItemTemplate(item.itemId);
        const sellPrice = typeof template.price === 'number' ? template.price : (template.price.sell ?? 0);
        const totalPrice = Math.floor(sellPrice * this.buyQuantity * this.currentShop.sellMultiplier);

        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay shop-dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box">
                <h3 class="dialog-title">确认出售</h3>
                <div class="dialog-content">
                    <p>确定要出售 <strong>${template.name}</strong> x${this.buyQuantity} 吗？</p>
                    <p class="dialog-price">获得: +${totalPrice.toLocaleString()} 💰</p>
                </div>
                <div class="dialog-buttons">
                    <button class="dialog-btn cancel" id="dialog-cancel">取消</button>
                    <button class="dialog-btn confirm" id="dialog-confirm">确认</button>
                </div>
            </div>
        `;
        this._getUIHost().appendChild(overlay);

        overlay.querySelector('#dialog-cancel').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('#dialog-confirm').addEventListener('click', () => {
            shopSystem.sellItem(item.uid, this.buyQuantity);
            this.selectedInventoryItem = null;
            overlay.remove();
        });
    }

    /**
     * 渲染属性信息
     * @param {Object} template - 物品模板
     * @returns {string} HTML
     * @private
     */
    _renderStats(template) {
        if (!template.stats || Object.keys(template.stats).length === 0) {
            return '';
        }

        const statNames = {
            atk: '攻击力',
            def: '防御力',
            spAtk: '特攻',
            spDef: '特防',
            spd: '速度',
            maxHp: '最大HP',
            fireAtk: '火属性攻击',
            fireDef: '火属性防御',
            waterAtk: '水属性攻击',
            waterDef: '水属性防御',
            grassAtk: '草属性攻击',
            grassDef: '草属性防御',
            electricAtk: '电属性攻击',
            electricDef: '电属性防御'
        };

        return `
            <div class="detail-stats">
                ${Object.entries(template.stats)
                    .filter(([_, value]) => value !== 0)
                    .map(([stat, value]) => `
                        <div class="stat-item">
                            <span class="stat-name">${statNames[stat] || stat}</span>
                            <span class="stat-value positive">+${value}</span>
                        </div>
                    `).join('')}
            </div>
        `;
    }

    /**
     * 获取物品图标
     * @param {Object} template - 物品模板
     * @returns {string} 图标
     * @private
     */
    _getItemIcon(template) {
        if (template.type === ItemType.CONSUMABLE) {
            if (template.effect?.type?.includes('heal')) return '🧪';
            if (template.effect?.type?.includes('cure')) return '💊';
            if (template.effect?.type?.includes('revive')) return '✨';
            if (template.effect?.type?.includes('pp')) return '💫';
            if (template.effect?.type === 'catch') return '⚪';
            if (template.effect?.type === 'elixir') return '🌟';
            return '🎒';
        }
        if (template.type === ItemType.EQUIPMENT) {
            switch (template.slot) {
                case EquipmentSlot.WEAPON: return '⚔️';
                case EquipmentSlot.ARMOR: return '🛡️';
                case EquipmentSlot.HELMET: return '⛑️';
                case EquipmentSlot.BOOTS: return '👢';
                case EquipmentSlot.ACCESSORY: return '💍';
                default: return '👕';
            }
        }
        if (template.type === ItemType.KEY_ITEM) {
            return '📜';
        }
        return '📦';
    }

    /**
     * 获取物品类型名称
     * @param {Object} template - 物品模板
     * @returns {string} 类型名称
     * @private
     */
    _getItemTypeName(template) {
        if (template.type === ItemType.CONSUMABLE) {
            return '消耗品';
        }
        if (template.type === ItemType.EQUIPMENT) {
            return getEquipmentSlotName(template.slot);
        }
        if (template.type === ItemType.KEY_ITEM) {
            return '关键道具';
        }
        return '物品';
    }
}

// 创建全局实例
const shopUI = new ShopUI();
window.shopUI = shopUI;
