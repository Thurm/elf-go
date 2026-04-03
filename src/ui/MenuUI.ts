/**
 * 菜单界面 - 负责主菜单、存档/读档、设置等界面的渲染和交互
 */

/**
 * 安全播放音效的辅助函数
 * @param {string} soundId - 音效ID
 */
function menuSafePlaySound(soundId) {
    try {
        if (typeof window.audioManager !== 'undefined' && window.audioManager.playSound) {
            window.audioManager.playSound(soundId);
        }
    } catch (e) {
        console.log('[MenuUI] safePlaySound failed:', e);
    }
}

/**
 * 安全获取 audioManager 的辅助函数
 * @returns {Object|null} audioManager 实例或 null
 */
function safeGetAudioManager() {
    return (typeof window.audioManager !== 'undefined') ? window.audioManager : null;
}

/**
 * 菜单UI状态枚举
 */
const MenuUIState = {
    CLOSED: 'closed',
    MAIN_MENU: 'main_menu',
    PLAYER_INFO_MENU: 'player_info_menu',
    POKEDEX_MENU: 'pokedex_menu',
    POKEDEX_DETAIL_MENU: 'pokedex_detail_menu',
    SAVE_MENU: 'save_menu',
    LOAD_MENU: 'load_menu',
    SETTINGS_MENU: 'settings_menu',
    PARTY_MENU: 'party_menu',
    BAG_MENU: 'bag_menu'
};

/**
 * 菜单UI类
 */
class MenuUI {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;

        // UI状态
        this.state = MenuUIState.CLOSED;

        // 菜单栈 - 用于多层菜单导航
        this.menuStack = [];
        this.currentMenu = null;
        this.selectedIndex = 0;
        this.currentPokedexMonsterId = null;

        // 存档信息缓存
        this.saveInfos = [];

        // 设置值
        this.settings = {
            masterVolume: 1.0,
            bgmVolume: 0.6,
            sfxVolume: 0.8
        };

        // 当前编辑的设置项
        this.editingSetting = null;

        // 绑定事件监听
        this._setupEventListeners();
    }

    /**
     * 初始化菜单UI
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {CanvasRenderingContext2D} ctx - 2D上下文
     */
    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.initialized = true;

        // 从AudioManager同步设置
        const audioManager = safeGetAudioManager();
        if (audioManager) {
            this.settings.masterVolume = audioManager.masterVolume;
            this.settings.bgmVolume = audioManager.bgmVolume;
            this.settings.sfxVolume = audioManager.sfxVolume;
        }

        console.log('MenuUI 初始化成功');
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        // 监听菜单打开事件
        eventBus.on(GameEvents.UI_MENU_OPEN, (data) => {
            const menuType = data?.menuType || 'main';
            this.openMenu(menuType);
        });
    }

    /**
     * 打开菜单
     * @param {string} menuType - 菜单类型
     */
    openMenu(menuType) {
        // 保存当前菜单到栈中
        if (this.currentMenu) {
            this.menuStack.push({
                state: this.state,
                menu: this.currentMenu,
                selectedIndex: this.selectedIndex
            });
        }

        switch (menuType) {
            case 'main':
            case 'title':
                this._openMainMenu(menuType === 'title');
                break;
            case 'save':
                this._openSaveMenu();
                break;
            case 'player_info':
                this._openPlayerInfoMenu();
                break;
            case 'pokedex':
                this._openPokedexMenu();
                break;
            case 'load':
                this._openLoadMenu();
                break;
            case 'settings':
                this._openSettingsMenu();
                break;
            case 'party':
                this._openPartyMenu();
                break;
            case 'bag':
                this._openBagMenu();
                break;
            default:
                this._openMainMenu(false);
        }

        if (window.SoundID && window.SoundID.MENU_OPEN) {
            window.SoundID && menuSafePlaySound(window.SoundID.MENU_OPEN);
        }
    }

    /**
     * 打开主菜单
     * @param {boolean} isTitle - 是否是标题画面菜单
     * @private
     */
    _openMainMenu(isTitle = false) {
        this.state = MenuUIState.MAIN_MENU;

        const items = isTitle
            ? [
                { id: 'new_game', text: '开始游戏', action: 'new_game' },
                { id: 'load', text: '读取存档', action: 'load' }
            ]
            : [
                { id: 'resume', text: '继续游戏', action: 'resume' },
                { id: 'player_info', text: '玩家信息', action: 'player_info' },
                { id: 'pokedex', text: '图鉴', action: 'pokedex' },
                { id: 'party', text: '怪兽', action: 'party' },
                { id: 'bag', text: '背包', action: 'bag' },
                { id: 'save', text: '保存', action: 'save' },
                { id: 'load', text: '读取', action: 'load' },
                { id: 'settings', text: '设置', action: 'settings' },
                { id: 'title', text: '返回标题', action: 'title' }
            ];

        this.currentMenu = {
            type: 'main',
            title: isTitle ? '精灵冒险 RPG' : '游戏菜单',
            items: items,
            isTitle: isTitle
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开玩家信息菜单
     * @private
     */
    _openPlayerInfoMenu() {
        this.state = MenuUIState.PLAYER_INFO_MENU;
        this.currentMenu = {
            type: 'player_info',
            title: '玩家信息',
            items: [
                { id: 'back', text: '返回', action: 'back' }
            ]
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开图鉴菜单
     * @private
     */
    _openPokedexMenu() {
        this.state = MenuUIState.POKEDEX_MENU;
        this.currentPokedexMonsterId = null;
        this.currentMenu = {
            type: 'pokedex',
            title: '精灵图鉴',
            items: this._createPokedexItems()
        };
        this.selectedIndex = 0;
    }

    /**
     * 创建图鉴条目
     * @returns {UISelectableMenuItem[]}
     * @private
     */
    _createPokedexItems() {
        const gameState = gameStateMachine.getGameState();
        const player = gameState?.player;
        const seenSet = new Set(player?.pokedex?.seen || []);
        const ownedSet = new Set(player?.pokedex?.owned || []);

        const items: UISelectableMenuItem[] = Object.values(MonsterTemplates).map((monster, index) => {
            const isOwned = ownedSet.has(monster.id);
            const isSeen = isOwned || seenSet.has(monster.id);
            const statusText = isOwned ? '已拥有' : (isSeen ? '已遇到' : '未遇到');
            const displayName = isSeen ? monster.name : '???';

            return {
                id: `pokedex_${monster.id}`,
                text: `${String(index + 1).padStart(3, '0')} ${displayName} [${statusText}]`,
                action: 'view_pokedex_entry',
                index
            };
        });

        items.push({ id: 'back', text: '返回', action: 'back' });
        return items;
    }

    /**
     * 打开图鉴详情
     * @param {string} monsterId
     * @private
     */
    _openPokedexDetail(monsterId) {
        const monster = MonsterTemplates[monsterId];
        if (!monster) {
            uiManager.showNotification('图鉴条目不存在', 'warning');
            return;
        }

        this.currentPokedexMonsterId = monsterId;
        this.state = MenuUIState.POKEDEX_DETAIL_MENU;
        this.currentMenu = {
            type: 'pokedex_detail',
            title: `图鉴详情 - ${monster.name}`,
            items: [
                { id: 'back', text: '返回', action: 'back' }
            ],
            monster
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开存档菜单
     * @private
     */
    _openSaveMenu() {
        this.state = MenuUIState.SAVE_MENU;
        this.saveInfos = saveManager.getAllSaveInfo();

        this.currentMenu = {
            type: 'save',
            title: '保存游戏',
            items: this._createSaveSlotItems()
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开读档菜单
     * @private
     */
    _openLoadMenu() {
        this.state = MenuUIState.LOAD_MENU;
        this.saveInfos = saveManager.getAllSaveInfo();

        this.currentMenu = {
            type: 'load',
            title: '读取存档',
            items: this._createSaveSlotItems()
        };
        this.selectedIndex = 0;
    }

    /**
     * 创建存档槽位项
     * @returns {Array} 存档槽位项数组
     * @private
     */
    _createSaveSlotItems() {
        const items = [];
        for (let i = 0; i < 3; i++) {
            const info = this.saveInfos[i];
            items.push({
                id: `slot_${i + 1}`,
                text: info.empty ? `存档槽 ${i + 1} (空)` : `存档槽 ${i + 1}`,
                slot: i + 1,
                info: info,
                action: info.empty ? 'create_save' : 'use_save'
            });
        }
        items.push({ id: 'back', text: '返回', action: 'back' });
        return items;
    }

    /**
     * 打开设置菜单
     * @private
     */
    _openSettingsMenu() {
        this.state = MenuUIState.SETTINGS_MENU;
        this.editingSetting = null;

        this.currentMenu = {
            type: 'settings',
            title: '设置',
            items: [
                { id: 'master_volume', text: '主音量', type: 'slider', settingKey: 'masterVolume', value: this.settings.masterVolume },
                { id: 'bgm_volume', text: '背景音乐', type: 'slider', settingKey: 'bgmVolume', value: this.settings.bgmVolume },
                { id: 'sfx_volume', text: '音效音量', type: 'slider', settingKey: 'sfxVolume', value: this.settings.sfxVolume },
                { id: 'back', text: '返回', action: 'back' }
            ]
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开队伍菜单
     * @private
     */
    _openPartyMenu() {
        this.state = MenuUIState.PARTY_MENU;

        const gameState = gameStateMachine.getGameState();
        const party = gameState?.player?.party || [];

        const items: UISelectableMenuItem[] = party.map((monster, index) => ({
            id: `monster_${index}`,
            text: `${monster.nickname || monster.name} Lv.${monster.level}`,
            monster: monster,
            index: index,
            action: 'view_monster'
        }));
        items.push({ id: 'back', text: '返回', action: 'back' });

        this.currentMenu = {
            type: 'party',
            title: '我的怪兽',
            items: items,
            party: party
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开背包菜单
     * @private
     */
    _openBagMenu() {
        this.state = MenuUIState.BAG_MENU;

        const gameState = gameStateMachine.getGameState();
        const inventory = gameState?.player?.inventory || [];

        const items: UISelectableMenuItem[] = inventory.map((invItem, index) => {
            const template = ItemTemplates[invItem.itemId];
            return {
                id: `item_${index}`,
                text: `${template?.name || invItem.itemId} x${invItem.quantity}`,
                item: invItem,
                template: template,
                index: index,
                action: 'use_item'
            };
        });
        items.push({ id: 'back', text: '返回', action: 'back' });

        this.currentMenu = {
            type: 'bag',
            title: '背包',
            items: items,
            inventory: inventory
        };
        this.selectedIndex = 0;
    }

    /**
     * 返回上一级菜单
     */
    goBack() {
        if (this.editingSetting !== null) {
            this.editingSetting = null;
            return;
        }

        if (this.menuStack.length > 0) {
            const prev = this.menuStack.pop();
            this.state = prev.state;
            this.currentMenu = prev.menu;
            this.selectedIndex = prev.selectedIndex;
            window.SoundID && menuSafePlaySound(window.SoundID.MENU_CLOSE);
        } else {
            this.closeMenu();
        }
    }

    /**
     * 关闭菜单
     */
    closeMenu() {
        this.state = MenuUIState.CLOSED;
        this.currentMenu = null;
        this.menuStack = [];
        this.selectedIndex = 0;
        this.editingSetting = null;
        this.currentPokedexMonsterId = null;
        if (window.SoundID && window.SoundID.MENU_CLOSE) {
            window.SoundID && menuSafePlaySound(window.SoundID.MENU_CLOSE);
        }

        if (
            typeof gameStateMachine !== 'undefined' &&
            typeof GameState !== 'undefined' &&
            gameStateMachine.getCurrentState() === GameState.MENU
        ) {
            gameStateMachine.popState();
        }

        eventBus.emit(GameEvents.UI_MENU_CLOSE);
    }

    /**
     * 移动菜单选择
     * @param {number} direction - 方向 (-1 上, 1 下)
     */
    moveSelection(direction) {
        if (!this.currentMenu) return;

        // 编辑设置时调整数值
        if (this.editingSetting !== null) {
            const item = this.currentMenu.items[this.editingSetting];
            if (item && item.type === 'slider') {
                const newValue = Math.max(0, Math.min(1, item.value + direction * 0.1));
                item.value = Math.round(newValue * 10) / 10;
                this.settings[item.settingKey] = item.value;
                this._applySetting(item.settingKey, item.value);
                window.SoundID && menuSafePlaySound(window.SoundID.CURSOR_MOVE);
            }
            return;
        }

        const items = this.currentMenu.items;
        const oldIndex = this.selectedIndex;
        const newIndex = (oldIndex + direction + items.length) % items.length;

        if (newIndex !== oldIndex) {
            this.selectedIndex = newIndex;
            window.SoundID && menuSafePlaySound(window.SoundID.CURSOR_MOVE);
        }
    }

    /**
     * 确认选择
     */
    confirmSelection() {
        if (!this.currentMenu) return;

        const item = this.currentMenu.items[this.selectedIndex];
        if (!item) return;

        // 如果是滑块，进入/退出编辑模式
        if (item.type === 'slider') {
            if (this.editingSetting === this.selectedIndex) {
                this.editingSetting = null;
                window.SoundID && menuSafePlaySound(window.SoundID.CONFIRM);
            } else {
                this.editingSetting = this.selectedIndex;
                window.SoundID && menuSafePlaySound(window.SoundID.CONFIRM);
            }
            return;
        }

        window.SoundID && menuSafePlaySound(window.SoundID.CONFIRM);
        this._handleAction(item);
    }

    /**
     * 处理菜单项动作
     * @param {Object} item - 菜单项
     * @private
     */
    _handleAction(item) {
        switch (item.action) {
            case 'resume':
                this.closeMenu();
                break;

            case 'new_game':
                eventBus.emit('menu:new_game');
                break;

            case 'title':
                this.closeMenu();
                break;

            case 'back':
                this.goBack();
                break;

            case 'save':
                this.openMenu('save');
                break;

            case 'player_info':
                this.openMenu('player_info');
                break;

            case 'pokedex':
                this.openMenu('pokedex');
                break;

            case 'load':
                this.openMenu('load');
                break;

            case 'settings':
                this.openMenu('settings');
                break;

            case 'party':
                this.openMenu('party');
                break;

            case 'bag':
                this.openMenu('bag');
                break;

            case 'create_save':
            case 'use_save':
                this._handleSaveAction(item);
                break;

            case 'view_monster':
                // 查看怪兽详情
                uiManager.showNotification(`查看 ${item.monster.nickname || item.monster.name} 的详情`, 'info');
                break;

            case 'view_pokedex_entry':
                if (this.currentMenu) {
                    this.menuStack.push({
                        state: this.state,
                        menu: this.currentMenu,
                        selectedIndex: this.selectedIndex
                    });
                }
                this._openPokedexDetail(item.id.replace(/^pokedex_/, ''));
                break;

            case 'use_item':
                // 使用物品
                this._useItem(item);
                break;
        }
    }

    /**
     * 处理存档/读档动作
     * @param {Object} item - 菜单项
     * @private
     */
    _handleSaveAction(item) {
        const slot = item.slot;

        if (this.state === MenuUIState.SAVE_MENU) {
            // 保存游戏
            window.SoundID && menuSafePlaySound(window.SoundID.SAVE);
            const gameState = gameStateMachine.getGameState();
            const success = saveManager.saveGame(gameState, slot);

            if (success) {
                window.SoundID && menuSafePlaySound(window.SoundID.SAVE_SUCCESS);
                uiManager.showNotification(`存档已保存到槽位 ${slot}`, 'success');
                // 刷新存档信息
                this.saveInfos = saveManager.getAllSaveInfo();
                this.currentMenu.items = this._createSaveSlotItems();
            } else {
                window.SoundID && menuSafePlaySound(window.SoundID.ERROR);
                uiManager.showNotification('保存失败！', 'error');
            }
        } else if (this.state === MenuUIState.LOAD_MENU) {
            // 读取游戏
            if (item.info.empty) {
                window.SoundID && menuSafePlaySound(window.SoundID.ERROR);
                uiManager.showNotification('该槽位没有存档！', 'warning');
                return;
            }

            window.SoundID && menuSafePlaySound(window.SoundID.LOAD);
            const loadedState = saveManager.loadGame(slot);

            if (loadedState) {
                window.SoundID && menuSafePlaySound(window.SoundID.SAVE_SUCCESS);
                gameStateMachine.init(loadedState);
                uiManager.showNotification(`已读取存档槽位 ${slot}`, 'success');
                this.closeMenu();
            } else {
                window.SoundID && menuSafePlaySound(window.SoundID.ERROR);
                uiManager.showNotification('读取失败！', 'error');
            }
        }
    }

    /**
     * 使用物品
     * @param {Object} item - 物品项
     * @private
     */
    _useItem(item) {
        if (!item.template) {
            uiManager.showNotification('未知物品！', 'error');
            return;
        }

        window.SoundID && menuSafePlaySound(window.SoundID.USE_ITEM);
        uiManager.showNotification(`使用了 ${item.template.name}`, 'info');

        // TODO: 实现实际的物品使用逻辑
        eventBus.emit('menu:use_item', { item: item.item, template: item.template });
    }

    /**
     * 应用设置
     * @param {string} key - 设置键
     * @param {number} value - 设置值
     * @private
     */
    _applySetting(key, value) {
        const audioManager = safeGetAudioManager();
        if (!audioManager) return;

        switch (key) {
            case 'masterVolume':
                audioManager.masterVolume = value;
                break;
            case 'bgmVolume':
                audioManager.bgmVolume = value;
                break;
            case 'sfxVolume':
                audioManager.sfxVolume = value;
                break;
        }
    }

    /**
     * 更新菜单UI
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // 可以在这里处理动画效果
    }

    /**
     * 渲染菜单UI
     */
    render() {
        if (!this.initialized || !this.ctx || this.state === MenuUIState.CLOSED) return;

        // 渲染半透明背景
        this._renderBackground();

        // 根据菜单类型渲染不同内容
        switch (this.currentMenu?.type) {
            case 'main':
                this._renderMainMenu();
                break;
            case 'save':
            case 'load':
                this._renderSaveLoadMenu();
                break;
            case 'settings':
                this._renderSettingsMenu();
                break;
            case 'party':
                this._renderPartyMenu();
                break;
            case 'bag':
                this._renderBagMenu();
                break;
            case 'pokedex':
                this._renderPokedexMenu();
                break;
            case 'pokedex_detail':
                this._renderPokedexDetail();
                break;
            case 'player_info':
                this._renderPlayerInfoMenu();
                break;
            default:
                this._renderGenericMenu();
        }
    }

    /**
     * 渲染半透明背景
     * @private
     */
    _renderBackground() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        ctx.fillStyle = 'rgba(9, 16, 21, 0.72)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    /**
     * 渲染主菜单
     * @private
     */
    _renderMainMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 标题画面特殊渲染
        if (this.currentMenu.isTitle) {
            this._renderTitleScreen();
            return;
        }

        // 普通主菜单
        this._renderGenericMenu();
        this._renderSideInfo();
    }

    /**
     * 渲染标题画面
     * @private
     */
    _renderTitleScreen() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, UIColors.PANEL_DEEP);
        gradient.addColorStop(1, UIColors.PANEL);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 渲染游戏标题
        const title = this.currentMenu.title;
        ctx.font = 'bold 38px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = UIColors.TEXT;
        ctx.fillText(title, canvasWidth / 2, canvasHeight * 0.3);

        ctx.font = '14px monospace';
        ctx.fillStyle = UIColors.TEXT_MUTED;
        ctx.fillText('像素冒险 · 旅途开始', canvasWidth / 2, canvasHeight * 0.38);

        // 渲染菜单
        const menuWidth = 300;
        const itemHeight = 50;
        const items = this.currentMenu.items;
        const menuHeight = items.length * itemHeight + 40;
        const menuX = (canvasWidth - menuWidth) / 2;
        const menuY = canvasHeight * 0.55;

        this._drawDialogBox(menuX, menuY, menuWidth, menuHeight);

        ctx.font = '20px monospace';
        ctx.textAlign = 'left';

        items.forEach((item, i) => {
            const isSelected = i === this.selectedIndex;
            const itemY = menuY + 25 + i * itemHeight;

            if (isSelected) {
                ctx.fillStyle = UIColors.PANEL_ALT;
                ctx.fillRect(menuX + 20, itemY - 5, menuWidth - 40, itemHeight - 10);
                ctx.strokeStyle = UIColors.ACCENT;
                ctx.lineWidth = 2;
                ctx.strokeRect(menuX + 20, itemY - 5, menuWidth - 40, itemHeight - 10);
                ctx.fillStyle = UIColors.TEXT;
            } else {
                ctx.fillStyle = UIColors.TEXT_SOFT;
            }

            const prefix = isSelected ? '▶ ' : '  ';
            ctx.fillText(prefix + item.text, menuX + 40, itemY + 25);
        });

        // 版权信息
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = UIColors.TEXT_MUTED;
        ctx.fillText('Version 1.0.0', canvasWidth / 2, canvasHeight - 50);
        ctx.fillText('Copyright (c) 2026 Team RPG', canvasWidth / 2, canvasHeight - 30);
    }

    /**
     * 渲染侧边信息
     * @private
     */
    _renderSideInfo() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const infoX = canvasWidth * 0.5;
        const infoY = canvasHeight * 0.2;
        const infoWidth = canvasWidth * 0.45;
        const infoHeight = 200;

        this._drawDialogBox(infoX, infoY, infoWidth, infoHeight);

        // 获取玩家数据
        const gameState = gameStateMachine.getGameState();
        const player = gameState?.player;
        const party = player?.party || [];
        const firstMonster = party[0];
        const pokedexProgress = player ? getPokedexProgress(player) : { seen: 0, owned: 0, total: 0 };

        ctx.font = '18px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = UIColors.TEXT;

        let lineY = infoY + 30;

        if (firstMonster) {
            const name = firstMonster.nickname || firstMonster.name;
            const level = firstMonster.level;
            const hp = firstMonster.stats.hp;
            const maxHp = firstMonster.stats.maxHp || firstMonster.stats.hp;

            ctx.fillText(`${name} Lv.${level}`, infoX + 20, lineY);
            lineY += 30;

            uiManager.renderHPBar(infoX + 20, lineY, infoWidth - 40, hp, maxHp, true);
            lineY += 40;
        }

        // 显示金钱
        const money = player?.money || 0;
        ctx.fillStyle = UIColors.GOLD;
        ctx.fillText(`金钱: ￥${money}`, infoX + 20, lineY);

        lineY += 30;
        ctx.fillStyle = UIColors.LIGHT_BLUE;
        ctx.fillText(`玩家 Lv.${player?.level || 1}`, infoX + 20, lineY);

        lineY += 30;
        ctx.fillStyle = UIColors.LIGHT_GRAY;
        ctx.fillText(`图鉴: ${pokedexProgress.owned}/${pokedexProgress.total}`, infoX + 20, lineY);
    }

    /**
     * 渲染存档/读档菜单
     * @private
     */
    _renderSaveLoadMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 标题
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = UIColors.TEXT;
        ctx.fillText(this.currentMenu.title, canvasWidth / 2, 50);

        // 渲染存档槽位
        const slotWidth = canvasWidth - 80;
        const slotHeight = 140;
        const slotGap = 20;
        const startY = 80;

        for (let i = 0; i < 3; i++) {
            const slotX = 40;
            const slotY = startY + i * (slotHeight + slotGap);
            const isSelected = this.selectedIndex === i;

            this._drawSaveSlot(slotX, slotY, slotWidth, slotHeight, i + 1, this.saveInfos[i], isSelected);
        }

        // 渲染返回选项
        const backY = startY + 3 * (slotHeight + slotGap);
        const isBackSelected = this.selectedIndex === 3;

        ctx.font = '18px monospace';
        ctx.textAlign = 'center';

        if (isBackSelected) {
            ctx.fillStyle = UIColors.PRIMARY_BLUE;
            ctx.fillRect(canvasWidth / 2 - 60, backY, 120, 40);
            ctx.fillStyle = UIColors.TEXT;
        } else {
            ctx.fillStyle = UIColors.LIGHT_GRAY;
        }

        const prefix = isBackSelected ? '▶ ' : '  ';
        ctx.fillText(prefix + '返回', canvasWidth / 2, backY + 25);
    }

    /**
     * 绘制存档槽位
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} slot - 槽位号
     * @param {Object} info - 存档信息
     * @param {boolean} isSelected - 是否选中
     * @private
     */
    _drawSaveSlot(x, y, width, height, slot, info, isSelected) {
        const ctx = this.ctx;

        // 选中高亮
        if (isSelected) {
            ctx.fillStyle = UIColors.PANEL_ALT;
            ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
            ctx.strokeStyle = UIColors.ACCENT;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
        }

        // 绘制槽位框
        this._drawDialogBox(x, y, width, height);

        // 槽位标题
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = isSelected ? UIColors.PRIMARY_BLUE : UIColors.TEXT;
        ctx.fillText(`${isSelected ? '▶ ' : '  '}存档槽 ${slot}`, x + 20, y + 30);

        if (info.empty) {
            // 空存档
            ctx.font = '18px monospace';
            ctx.fillStyle = UIColors.MEDIUM_GRAY;
            ctx.fillText('(空)', x + 20, y + 70);
        } else {
            // 存档信息
            ctx.font = '16px monospace';
            ctx.fillStyle = UIColors.LIGHT_GRAY;

            // 玩家名和游戏时间
            const gameTime = this._formatGameTime(info.gameTime);
            ctx.fillText(`玩家: ${info.playerName}`, x + 20, y + 60);
            ctx.fillText(`游戏时间: ${gameTime}`, x + width / 2, y + 60);

            // 等级与保存时间
            const saveDate = new Date(info.timestamp);
            const dateStr = saveDate.toLocaleString('zh-CN');
            ctx.fillText(`等级: Lv.${info.playerLevel || 1}`, x + 20, y + 85);
            ctx.fillText(`保存时间: ${dateStr}`, x + width / 2, y + 85);

            // 分隔线
            ctx.strokeStyle = UIColors.MEDIUM_GRAY;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 20, y + 100);
            ctx.lineTo(x + width - 20, y + 100);
            ctx.stroke();

            // 版本号
            ctx.fillStyle = UIColors.MEDIUM_GRAY;
            ctx.fillText(`版本: ${info.version}`, x + 20, y + 125);
        }
    }

    /**
     * 格式化游戏时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     * @private
     */
    _formatGameTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * 渲染设置菜单
     * @private
     */
    _renderSettingsMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const menuWidth = 400;
        const itemHeight = 50;
        const items = this.currentMenu.items;
        const menuHeight = items.length * itemHeight + 60;
        const menuX = (canvasWidth - menuWidth) / 2;
        const menuY = (canvasHeight - menuHeight) / 2;

        this._drawDialogBox(menuX, menuY, menuWidth, menuHeight);

        // 标题
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = UIColors.TEXT;
        ctx.fillText(this.currentMenu.title, canvasWidth / 2, menuY + 35);

        // 菜单项
        ctx.font = '18px monospace';
        ctx.textAlign = 'left';

        items.forEach((item, i) => {
            const isSelected = this.selectedIndex === i;
            const isEditing = this.editingSetting === i;
            const itemY = menuY + 55 + i * itemHeight;

            // 选中高亮
            if (isSelected) {
                ctx.fillStyle = isEditing ? UIColors.PANEL_DEEP : UIColors.PANEL_ALT;
                ctx.fillRect(menuX + 20, itemY - 5, menuWidth - 40, itemHeight - 10);
                ctx.strokeStyle = isEditing ? UIColors.WARNING : UIColors.ACCENT;
                ctx.lineWidth = 2;
                ctx.strokeRect(menuX + 20, itemY - 5, menuWidth - 40, itemHeight - 10);
                ctx.fillStyle = UIColors.TEXT;
            } else {
                ctx.fillStyle = UIColors.TEXT_SOFT;
            }

            const prefix = isSelected ? '▶ ' : '  ';
            if (item.type === 'slider') {
                // 滑块项
                ctx.fillText(prefix + item.text, menuX + 30, itemY + 25);

                // 滑块
                const sliderX = menuX + 200;
                const sliderWidth = 150;
                const sliderHeight = 16;

                ctx.fillStyle = UIColors.DARK_GRAY;
                ctx.fillRect(sliderX, itemY + 12, sliderWidth, sliderHeight);

                const fillWidth = sliderWidth * item.value;
                ctx.fillStyle = isSelected ? (isEditing ? UIColors.LIGHT_BLUE : UIColors.PRIMARY_BLUE) : UIColors.MEDIUM_GRAY;
                ctx.fillRect(sliderX, itemY + 12, fillWidth, sliderHeight);

                // 数值
                ctx.fillStyle = isSelected ? UIColors.TEXT : UIColors.LIGHT_GRAY;
                ctx.textAlign = 'right';
                ctx.fillText(`${Math.round(item.value * 100)}%`, menuX + menuWidth - 30, itemY + 25);
                ctx.textAlign = 'left';
            } else {
                // 普通项
                ctx.fillText(prefix + item.text, menuX + 30, itemY + 25);
            }
        });

        // 编辑提示
        if (this.editingSetting !== null) {
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = UIColors.LIGHT_BLUE;
            ctx.fillText('使用 ↑↓ 键调整数值，按 Z 确认', canvasWidth / 2, menuY + menuHeight + 25);
        }
    }

    /**
     * 渲染队伍菜单
     * @private
     */
    _renderPartyMenu() {
        this._renderGenericMenu();
    }

    /**
     * 渲染背包菜单
     * @private
     */
    _renderBagMenu() {
        this._renderGenericMenu();
    }

    /**
     * 渲染图鉴菜单
     * @private
     */
    _renderPokedexMenu() {
        this._renderGenericMenu();
    }

    /**
     * 渲染图鉴详情
     * @private
     */
    _renderPokedexDetail() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const gameState = gameStateMachine.getGameState();
        const player = gameState?.player;
        const monster = this.currentPokedexMonsterId ? MonsterTemplates[this.currentPokedexMonsterId] : null;

        if (!monster) {
            this._renderGenericMenu();
            return;
        }

        const isOwned = Boolean(player?.pokedex?.owned?.includes(monster.id));
        const isSeen = isOwned || Boolean(player?.pokedex?.seen?.includes(monster.id));

        const panelX = 80;
        const panelY = 70;
        const panelWidth = canvasWidth - 160;
        const panelHeight = canvasHeight - 140;

        this._drawDialogBox(panelX, panelY, panelWidth, panelHeight);

        ctx.textAlign = 'left';
        ctx.font = 'bold 26px monospace';
        ctx.fillStyle = isSeen ? UIColors.TEXT : UIColors.MEDIUM_GRAY;
        ctx.fillText(isSeen ? monster.name : '???', panelX + 30, panelY + 45);

        ctx.font = '18px monospace';
        ctx.fillStyle = UIColors.LIGHT_BLUE;
        ctx.fillText(`编号: ${Object.keys(MonsterTemplates).indexOf(monster.id) + 1}`, panelX + 30, panelY + 85);
        ctx.fillText(`属性: ${isSeen ? monster.type : '???'}`, panelX + 30, panelY + 115);

        ctx.fillStyle = isOwned ? '#22c55e' : (isSeen ? UIColors.GOLD : UIColors.MEDIUM_GRAY);
        ctx.fillText(`状态: ${isOwned ? '已拥有' : (isSeen ? '已遇到' : '未遇到')}`, panelX + 30, panelY + 145);

        ctx.fillStyle = UIColors.LIGHT_GRAY;
        if (!isSeen) {
            ctx.fillText('尚未记录到该怪兽的详细资料。', panelX + 30, panelY + 205);
        } else if (!isOwned) {
            ctx.fillText(monster.profile?.description || '已记录到基础情报，但尚未完全解析。', panelX + 30, panelY + 205);
            ctx.fillText(`栖息地: ${monster.profile?.habitat || '未知'}`, panelX + 30, panelY + 240);
            ctx.fillText(`性格: ${monster.profile?.temperament || '未知'}`, panelX + 30, panelY + 275);
            ctx.fillText('更多能力数据需要收服后解锁。', panelX + 30, panelY + 325);
        } else {
            ctx.fillText(monster.profile?.description || '暂无描述', panelX + 30, panelY + 205);
            ctx.fillText(`栖息地: ${monster.profile?.habitat || '未知'}`, panelX + 30, panelY + 240);
            ctx.fillText(`性格: ${monster.profile?.temperament || '未知'}`, panelX + 30, panelY + 275);
            ctx.fillText(`HP ${monster.baseStats.hp}  ATK ${monster.baseStats.atk}  DEF ${monster.baseStats.def}`, panelX + 30, panelY + 330);
            ctx.fillText(`SPA ${monster.baseStats.spAtk}  SPD ${monster.baseStats.spDef}  SPE ${monster.baseStats.spd}`, panelX + 30, panelY + 365);
            ctx.fillText(`技能: ${monster.skills.map(skillId => SkillTemplates[skillId]?.name || skillId).join(' / ')}`, panelX + 30, panelY + 420);
        }

        const backSelected = this.selectedIndex === 0;
        const backX = panelX + panelWidth - 160;
        const backY = panelY + panelHeight - 70;
        ctx.fillStyle = backSelected ? UIColors.PRIMARY_BLUE : UIColors.DARK_GRAY;
        ctx.fillRect(backX, backY, 110, 40);
        ctx.fillStyle = UIColors.TEXT;
        ctx.textAlign = 'center';
        ctx.fillText(`${backSelected ? '▶ ' : ''}返回`, backX + 55, backY + 26);
    }

    /**
     * 渲染玩家信息菜单
     * @private
     */
    _renderPlayerInfoMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const gameState = gameStateMachine.getGameState();
        const player = gameState?.player;
        const pokedex = player ? getPokedexProgress(player) : { seen: 0, owned: 0, total: 0 };
        const exp = player?.exp || 0;
        const expToNext = player?.expToNext || 1;
        const expRatio = Math.max(0, Math.min(1, expToNext > 0 ? exp / expToNext : 0));

        const panelX = 90;
        const panelY = 80;
        const panelWidth = canvasWidth - 180;
        const panelHeight = canvasHeight - 180;

        this._drawDialogBox(panelX, panelY, panelWidth, panelHeight);

        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = UIColors.TEXT;
        ctx.fillText('玩家信息', canvasWidth / 2, panelY + 40);

        ctx.textAlign = 'left';
        ctx.font = '20px monospace';
        ctx.fillStyle = UIColors.LIGHT_GRAY;
        ctx.fillText(`姓名: ${player?.name || '玩家'}`, panelX + 30, panelY + 90);
        ctx.fillText(`等级: Lv.${player?.level || 1}`, panelX + 30, panelY + 125);
        ctx.fillStyle = UIColors.GOLD;
        ctx.fillText(`金钱: ￥${player?.money || 0}`, panelX + 30, panelY + 160);

        ctx.fillStyle = UIColors.TEXT;
        ctx.fillText(`训练家经验: ${exp} / ${expToNext}`, panelX + 30, panelY + 210);

        ctx.fillStyle = UIColors.DARK_GRAY;
        ctx.fillRect(panelX + 30, panelY + 225, panelWidth - 60, 20);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(panelX + 30, panelY + 225, (panelWidth - 60) * expRatio, 20);
        ctx.strokeStyle = UIColors.LIGHT_BLUE;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX + 30, panelY + 225, panelWidth - 60, 20);

        ctx.font = '18px monospace';
        ctx.fillStyle = UIColors.LIGHT_BLUE;
        ctx.fillText(`图鉴已见: ${pokedex.seen} / ${pokedex.total}`, panelX + 30, panelY + 290);
        ctx.fillText(`图鉴拥有: ${pokedex.owned} / ${pokedex.total}`, panelX + 30, panelY + 325);
        ctx.fillStyle = UIColors.LIGHT_GRAY;
        ctx.fillText(`队伍数量: ${(player?.party || []).length}`, panelX + 30, panelY + 360);
        ctx.fillText(`进行中任务: ${(player?.quests || []).length}`, panelX + 30, panelY + 395);

        const backSelected = this.selectedIndex === 0;
        const backX = panelX + panelWidth - 160;
        const backY = panelY + panelHeight - 70;
        ctx.fillStyle = backSelected ? UIColors.PRIMARY_BLUE : UIColors.DARK_GRAY;
        ctx.fillRect(backX, backY, 110, 40);
        ctx.fillStyle = UIColors.TEXT;
        ctx.textAlign = 'center';
        ctx.fillText(`${backSelected ? '▶ ' : ''}返回`, backX + 55, backY + 26);
    }

    /**
     * 渲染通用菜单
     * @private
     */
    _renderGenericMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const menuWidth = 320;
        const itemHeight = 45;
        const items = this.currentMenu.items;
        const menuHeight = Math.min(items.length * itemHeight + 60, canvasHeight - 100);
        const menuX = 50;
        const menuY = (canvasHeight - menuHeight) / 2;

        this._drawDialogBox(menuX, menuY, menuWidth, menuHeight);

        // 标题
        if (this.currentMenu.title) {
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = UIColors.TEXT;
            ctx.fillText(this.currentMenu.title, menuX + menuWidth / 2, menuY + 35);
        }

        // 菜单项
        const startY = this.currentMenu.title ? menuY + 55 : menuY + 25;
        const maxVisibleItems = Math.floor((menuHeight - (this.currentMenu.title ? 60 : 30)) / itemHeight);
        const displayItems = items.slice(0, maxVisibleItems);

        ctx.font = '18px monospace';
        ctx.textAlign = 'left';

        displayItems.forEach((item, i) => {
            const isSelected = this.selectedIndex === i;
            const itemY = startY + i * itemHeight;

            if (isSelected) {
                ctx.fillStyle = UIColors.PANEL_ALT;
                ctx.fillRect(menuX + 15, itemY - 5, menuWidth - 30, itemHeight - 10);
                ctx.strokeStyle = UIColors.ACCENT;
                ctx.lineWidth = 2;
                ctx.strokeRect(menuX + 15, itemY - 5, menuWidth - 30, itemHeight - 10);
                ctx.fillStyle = UIColors.TEXT;
            } else {
                ctx.fillStyle = UIColors.TEXT_SOFT;
            }

            const prefix = isSelected ? '▶ ' : '  ';
            ctx.fillText(prefix + item.text, menuX + 25, itemY + 22);
        });
    }

    /**
     * 绘制对话框
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @private
     */
    _drawDialogBox(x, y, width, height) {
        const ctx = this.ctx;

        ctx.fillStyle = UIColors.SHADOW;
        ctx.fillRect(x + 4, y + 4, width, height);

        ctx.fillStyle = UIColors.PANEL;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = UIColors.BORDER_STRONG;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.strokeStyle = UIColors.BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
    }

    /**
     * 检查菜单是否打开
     * @returns {boolean} 是否打开
     */
    isOpen() {
        return this.state !== MenuUIState.CLOSED;
    }

    /**
     * 获取当前状态
     * @returns {string} 菜单UI状态
     */
    getState() {
        return this.state;
    }

    /**
     * 处理键盘输入
     * @param {KeyboardEvent} event - 键盘事件
     * @returns {boolean} 是否处理了输入
     */
    handleInput(event) {
        if (!this.isOpen()) return false;

        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.moveSelection(-1);
                return true;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.moveSelection(1);
                return true;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.editingSetting !== null) {
                    this.moveSelection(-1);
                }
                return true;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.editingSetting !== null) {
                    this.moveSelection(1);
                }
                return true;
            case 'Enter':
            case 'z':
            case 'Z':
            case ' ':
                this.confirmSelection();
                return true;
            case 'Escape':
            case 'x':
            case 'X':
                this.goBack();
                return true;
        }

        return false;
    }
}

// 创建全局实例
const menuUI = new MenuUI();
window.menuUI = menuUI;
window.MenuUIState = MenuUIState;
