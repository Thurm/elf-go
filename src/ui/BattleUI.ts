/**
 * 战斗界面 - 负责战斗场景的UI渲染和交互
 * 包括敌我HP/PP条、战斗消息、技能菜单、伤害数字等
 */

/**
 * 安全播放音效的辅助函数
 * @param {string} soundId - 音效ID
 */
function battleSafePlaySound(soundId) {
    if (typeof window.audioManager !== 'undefined' && window.audioManager.playSound) {
        window.audioManager.playSound(soundId);
    }
}

/**
 * 安全获取 SoundID，兼容 window.SoundID 或内联定义
 */
const BattleUISoundID = {
    CURSOR_MOVE: 'cursor_move',
    CONFIRM: 'confirm',
    CANCEL: 'cancel',
    MENU_OPEN: 'menu_open',
    ERROR: 'error'
};

/**
 * 安全获取 UIColors，兼容 window.UIColors 或内联定义 - 复古未来主义霓虹风
 */
const BattleUIColors = {
    // 霓虹主色调
    NEON_PINK: '#ff2a6d',
    NEON_CYAN: '#05d9e8',
    NEON_PURPLE: '#d300c5',
    NEON_YELLOW: '#f9f002',
    NEON_GREEN: '#39ff14',
    NEON_ORANGE: '#ff6b35',

    // 复古未来主义色系
    DEEP_SPACE: '#0d0221',
    COSMIC_PURPLE: '#2d1b4e',
    VOID_BLACK: '#0a0a0f',
    STARLIGHT: '#f0f0ff',
    ELECTRIC_BLUE: '#1b98e0',

    // 兼容旧名称的别名
    PRIMARY_BLUE: '#05d9e8',
    DARK_BLUE: '#2d1b4e',
    LIGHT_BLUE: '#1b98e0',
    PRIMARY_RED: '#ff2a6d',
    DARK_RED: '#d300c5',
    PRIMARY_GREEN: '#39ff14',
    DARK_GREEN: '#22c55e',
    PRIMARY_YELLOW: '#f9f002',
    GOLD: '#f9f002',
    BACKGROUND: '#0d0221',
    DARK_GRAY: '#2d1b4e',
    MEDIUM_GRAY: '#4a3a6a',
    LIGHT_GRAY: '#9ca3af',
    TEXT: '#f0f0ff'
};

/**
 * 安全获取 StatusEffect，兼容 window.StatusEffect 或内联定义
 */
const BattleUIStatusEffect = {
    BURN: 'burn',
    PARALYZE: 'paralyze',
    POISON: 'poison',
    FREEZE: 'freeze',
    SLEEP: 'sleep'
};

/**
 * 安全获取 ElementType，兼容 window.ElementType 或内联定义
 */
const BattleUIElementType = {
    FIRE: 'fire',
    WATER: 'water',
    GRASS: 'grass',
    ELECTRIC: 'electric',
    NORMAL: 'normal'
};

/**
 * 战斗UI状态枚举
 */
const BattleUIState = {
    IDLE: 'idle',                    // 空闲
    SHOWING_MESSAGE: 'showing_message', // 显示消息中
    SELECTING_ACTION: 'selecting_action', // 选择行动
    SELECTING_MONSTER: 'selecting_monster', // 选择怪兽
    SELECTING_SKILL: 'selecting_skill',   // 选择技能
    SELECTING_TARGET: 'selecting_target', // 选择目标
    ANIMATING: 'animating'           // 动画播放中
};

/**
 * 获取常量的辅助函数，优先用 window 上的，回退到内联
 */
function getBattleUIColor(key) {
    if (typeof window.UIColors !== 'undefined' && window.UIColors[key]) {
        return window.UIColors[key];
    }
    return BattleUIColors[key];
}

function getSoundID(key) {
    if (typeof window.SoundID !== 'undefined' && window.SoundID[key]) {
        return window.SoundID[key];
    }
    return BattleUISoundID[key];
}

function getStatusEffect(key) {
    if (typeof window.StatusEffect !== 'undefined' && window.StatusEffect[key]) {
        return window.StatusEffect[key];
    }
    return BattleUIStatusEffect[key];
}

function getBattleElementType(key) {
    if (typeof window.ElementType !== 'undefined' && window.ElementType[key]) {
        return window.ElementType[key];
    }
    return BattleUIElementType[key];
}

function getSkillTemplates() {
    return typeof window.SkillTemplates !== 'undefined' ? window.SkillTemplates : {};
}

function getBattleMonsterTemplates() {
    return typeof window.MonsterTemplates !== 'undefined' ? window.MonsterTemplates : {};
}

function getElementLabel(elementType) {
    const labels = {
        [getBattleElementType('FIRE')]: '火',
        [getBattleElementType('WATER')]: '水',
        [getBattleElementType('GRASS')]: '草',
        [getBattleElementType('ELECTRIC')]: '电',
        [getBattleElementType('NORMAL')]: '普'
    };

    return labels[elementType] || String(elementType || '未知');
}

function getElementColor(elementType) {
    const colors = {
        [getBattleElementType('FIRE')]: '#ef4444',
        [getBattleElementType('WATER')]: '#3b82f6',
        [getBattleElementType('GRASS')]: '#22c55e',
        [getBattleElementType('ELECTRIC')]: '#f59e0b',
        [getBattleElementType('NORMAL')]: '#94a3b8'
    };

    return colors[elementType] || '#94a3b8';
}

const getUIColor = getBattleUIColor;
const getElementType = getBattleElementType;
const getMonsterTemplates = getBattleMonsterTemplates;

function getEventBus() {
    return typeof window.eventBus !== 'undefined' ? window.eventBus : { on: function() {}, emit: function() {} };
}

function getGameEvents() {
    return typeof window.GameEvents !== 'undefined' ? window.GameEvents : {
        BATTLE_START: 'battle:start',
        BATTLE_ACTION: 'battle:action',
        BATTLE_DAMAGE: 'battle:damage',
        BATTLE_END: 'battle:end',
        BATTLE_RESULT_CLOSE: 'battle:result_close',
        BATTLE_SELECT_LEAD: 'battle:select_lead_monster'
    };
}

function getUIManager() {
    return typeof window.uiManager !== 'undefined' ? window.uiManager : null;
}

function getItemTemplates() {
    return typeof window.ItemTemplates !== 'undefined' ? window.ItemTemplates : {};
}

/**
 * 战斗UI类
 */
class BattleUI {
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    initialized: boolean;
    spriteRenderer: SpriteRenderer | null;

    // UI状态
    state: string;

    // 战斗数据引用
    playerMonster: any;
    enemyMonster: any;
    battleLog: any[];

    // 菜单状态
    menuStack: any[];
    currentMenu: any;
    selectedIndex: number;

    // 伤害数字动画
    damageNumbers: any[];

    // 状态效果图标
    statusIcons: Map<any, any>;

    // 捕获动画
    captureEffect: any;

    // 消息显示
    currentMessage: any;
    messageTimer: number;
    messageCallback: any;

    // 战斗结算
    battleResult: BattleResult | null;
    battleResultSummary: BattleRewardSummary | null;

    // 强制换怪
    mustSwitchMonster: boolean;

    // 怪兽菜单模式
    monsterMenuMode: 'switch' | 'lead';

    // 等待执行的 action（用于消息确认后执行）
    pendingAction: any;

    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;
        this.spriteRenderer = null;

        // UI状态
        this.state = BattleUIState.IDLE;

        // 战斗数据引用
        this.playerMonster = null;
        this.enemyMonster = null;
        this.battleLog = [];

        // 菜单状态
        this.menuStack = [];
        this.currentMenu = null;
        this.selectedIndex = 0;

        // 伤害数字动画
        this.damageNumbers = [];

        // 状态效果图标
        this.statusIcons = new Map();

        // 捕获动画
        this.captureEffect = null;

        // 消息显示
        this.currentMessage = null;
        this.messageTimer = 0;
        this.messageCallback = null;

        // 战斗结算
        this.battleResult = null;
        this.battleResultSummary = null;

        // 强制换怪
        this.mustSwitchMonster = false;

        // 怪兽菜单模式
        this.monsterMenuMode = 'switch';

        // 等待执行的 action（用于消息确认后执行）
        this.pendingAction = null;

        // 绑定事件监听
        this._setupEventListeners();
    }

    /**
     * 初始化战斗UI
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @param {CanvasRenderingContext2D} ctx - 2D上下文
     */
    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.initialized = true;

        // 初始化精灵渲染器
        if (window.SpriteRenderer) {
            this.spriteRenderer = new window.SpriteRenderer();
            this.spriteRenderer.init(ctx);
        }

        // 初始化状态图标
        this._initStatusIcons();

        console.log('BattleUI 初始化成功');
    }

    /**
     * 初始化状态效果图标 - 霓虹发光配色
     * @private
     */
    _initStatusIcons() {
        this.statusIcons.set(getStatusEffect('BURN'), { text: '火', color: '#ff2a6d', glow: 'rgba(255, 42, 109, 0.6)' });
        this.statusIcons.set(getStatusEffect('PARALYZE'), { text: '麻', color: '#f9f002', glow: 'rgba(249, 240, 2, 0.6)' });
        this.statusIcons.set(getStatusEffect('POISON'), { text: '毒', color: '#d300c5', glow: 'rgba(211, 0, 197, 0.6)' });
        this.statusIcons.set(getStatusEffect('FREEZE'), { text: '冰', color: '#05d9e8', glow: 'rgba(5, 217, 232, 0.6)' });
        this.statusIcons.set(getStatusEffect('SLEEP'), { text: '睡', color: '#9ca3af', glow: 'rgba(156, 163, 175, 0.4)' });
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        const eventBus = getEventBus();
        const GameEvents = getGameEvents();

        // 监听战斗开始事件
        eventBus.on(GameEvents.BATTLE_START, (data) => {
            this.onBattleStart(data);
        });

        // 监听战斗行动事件
        eventBus.on(GameEvents.BATTLE_ACTION, (data) => {
            this.onBattleAction(data);
        });

        // 监听伤害事件
        eventBus.on(GameEvents.BATTLE_DAMAGE, (data) => {
            this.onDamage(data);
        });

        // 监听战斗结束事件
        eventBus.on(GameEvents.BATTLE_END, (data) => {
            this.onBattleEnd(data);
        });
    }

    /**
     * 战斗开始时的回调
     * @param {Object} data - 战斗数据
     */
    onBattleStart(data) {
        this.playerMonster = data.playerMonster;
        this.enemyMonster = data.enemyMonster;
        this.battleLog = [];
        this.battleResult = null;
        this.battleResultSummary = null;
        this.mustSwitchMonster = false;
        this.monsterMenuMode = 'switch';
        this.state = BattleUIState.SHOWING_MESSAGE;

        // 显示开始消息
        const message = data.isWildBattle
            ? `野生的${this.enemyMonster.nickname || this.enemyMonster.name}出现了！`
            : `${this.enemyMonster.nickname || this.enemyMonster.name}的训练师发起了挑战！`;

        this.showMessage(message, () => {
            this.showMessage(`去吧！${this.playerMonster.nickname || this.playerMonster.name}！`, () => {
                this.state = BattleUIState.IDLE;
            });
        });
    }

    /**
     * 战斗行动时的回调
     * @param {Object} data - 行动数据
     */
    onBattleAction(data) {
        switch (data.type) {
            case 'request_action':
                // 如果正在显示消息，先确认消息再打开菜单
                if (this.state === BattleUIState.SHOWING_MESSAGE && this.currentMessage) {
                    // 保存 pendingAction，等消息确认后执行
                    this.pendingAction = () => {
                        this.state = BattleUIState.SELECTING_ACTION;
                        this.openActionMenu();
                    };
                } else {
                    this.state = BattleUIState.SELECTING_ACTION;
                    this.openActionMenu();
                }
                break;
            case 'switch':
                this.playerMonster = data.monster;
                this.mustSwitchMonster = false;
                break;
            case 'need_switch':
                this.openMonsterMenu(data?.availableMonsters || [], true, data?.faintedMonster);
                break;
            case 'prepare_wild_battle':
                this.enemyMonster = data?.enemyMonster || data?.monster || this.enemyMonster;
                this.playerMonster = null;
                this.battleResult = null;
                this.battleResultSummary = null;
                this.showMessage(data?.prompt || '发现了野生怪兽！', () => {
                    this.openMonsterMenu(
                        data?.availableMonsters || [],
                        true,
                        null,
                        data?.title || '选择首发怪兽',
                        'lead'
                    );
                });
                break;
            case 'use_item':
            case 'status_effect':
                if (data.messages) {
                    this.showBattleMessages(data.messages);
                }
                break;
            case 'catch':
                this.showCatchSequence(data);
                break;
            case 'capture_prompt':
                this.openCapturePrompt(data);
                break;
        }
    }

    /**
     * 打开捕获选择菜单
     * @param {Object} data - 捕获提示数据
     */
    openCapturePrompt(data) {
        const monsterName = data?.monster?.name || this.enemyMonster?.name || '怪兽';
        this.showMessage(`是否使用精灵球收服${monsterName}？`, () => {
            this.currentMenu = {
                type: 'capture',
                title: '选择捕获',
                items: [
                    { id: 'capture_yes', text: '使用精灵球', action: 'capture_yes' },
                    { id: 'capture_no', text: '放弃捕获', action: 'capture_no' }
                ],
                layout: 'list'
            };
            this.selectedIndex = 0;
        });
    }

    /**
     * 显示捕获流程消息（摇晃次数/成功提示）
     * @param {Object} data - 捕获事件数据
     */
    showCatchSequence(data) {
        const eventBus = getEventBus();
        const shakes = Math.max(0, Math.min(3, data?.shakes ?? 0));
        const monsterName = data?.monster?.name || this.enemyMonster?.name || '怪兽';
        const messages = [];

        const totalShakes = Math.max(1, shakes);
        this.captureEffect = {
            active: true,
            shakes: totalShakes,
            startAt: Date.now(),
            durationPerShake: 700,
            success: !!data?.success
        };

        for (let i = 1; i <= shakes; i++) {
            messages.push(`精灵球摇晃了${i}次...`);
        }

        if (data?.success) {
            messages.push(`${monsterName}被捕获了！`);
            messages.push('图鉴已更新！');
        } else {
            messages.push(`${monsterName}挣脱了精灵球！`);
        }

        let index = 0;
        const showNext = () => {
            if (index < messages.length) {
                this.currentMessage = messages[index];
                this.messageCallback = null;
                this.state = BattleUIState.SHOWING_MESSAGE;
                index++;
                setTimeout(showNext, 700);
                return;
            }

            this.captureEffect = null;
            this.currentMessage = null;
            this.messageCallback = null;
            this.state = BattleUIState.IDLE;

            if (data?.success) {
                eventBus.emit('battle:finish_capture');
                return;
            }

            eventBus.emit('battle:catch_complete', { success: false });
        };

        showNext();
    }

    /**
     * 伤害事件回调
     * @param {Object} data - 伤害数据
     */
    onDamage(data) {
        const damageResult = data.damageResult || {};
        const damage = data.damage ?? damageResult.damage;
        if (damage === undefined || damage === null) {
            return;
        }

        const isPlayer = data.target === 'player' || data.target === this.playerMonster;
        const isCritical = data.isCritical ?? damageResult.isCritical ?? false;

        // 添加伤害数字动画
        this.addDamageNumber(damage, isPlayer, isCritical);

        // 显示消息
        if (data.message) {
            this.showMessage(data.message);
        }
    }

    /**
     * 战斗结束回调
     * @param {Object} data - 结束数据
     */
    onBattleEnd(data) {
        this.state = BattleUIState.IDLE;
        this.currentMessage = null;
        this.messageCallback = null;
        this.pendingAction = null;
        this.mustSwitchMonster = false;
        this.monsterMenuMode = 'switch';
        this.menuStack = [];
        this.selectedIndex = 0;
        this.battleResult = data || null;
        this.battleResultSummary = data?.summary || null;
        this.currentMenu = {
            type: 'battle_result',
            title: '战斗结算',
            items: [
                { id: 'continue', text: '继续', action: 'close_result' }
            ],
            layout: 'result'
        };
    }

    /**
     * 显示战斗消息序列
     * @param {Array<string>} messages - 消息数组
     * @param {Function} callback - 完成回调
     */
    showBattleMessages(messages, callback = null) {
        if (!messages || messages.length === 0) {
            if (callback) callback();
            return;
        }

        let index = 0;
        const showNext = () => {
            if (index < messages.length) {
                this.showMessage(messages[index], () => {
                    index++;
                    showNext();
                });
            } else if (callback) {
                callback();
            }
        };
        showNext();
    }

    /**
     * 显示单条消息
     * @param {string} message - 消息内容
     * @param {Function} callback - 完成回调
     */
    showMessage(message, callback = null) {
        this.currentMessage = message;
        this.messageCallback = callback;
        this.state = BattleUIState.SHOWING_MESSAGE;
    }

    /**
     * 确认当前消息
     */
    confirmMessage() {
        const callback = this.messageCallback;
        this.currentMessage = null;
        this.messageCallback = null;

        if (callback) {
            callback();
        } else if (this.state === BattleUIState.SHOWING_MESSAGE) {
            this.state = BattleUIState.IDLE;
        }

        // 如果有等待的 action，执行它
        if (this.pendingAction) {
            const pending = this.pendingAction;
            this.pendingAction = null;
            pending();
        }
    }

    /**
     * 打开行动菜单
     */
    openActionMenu() {
        this.currentMenu = {
            type: 'action',
            title: '',
            items: [
                { id: 'skill', text: '技能', action: 'skill' },
                { id: 'bag', text: '背包', action: 'bag' },
                { id: 'monster', text: '怪兽', action: 'monster' },
                { id: 'run', text: '逃跑', action: 'run' }
            ],
            layout: 'grid'
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开技能菜单
     */
    openSkillMenu() {
        if (!this.playerMonster) return;

        const SkillTemplates = getSkillTemplates();
        const skills = this.playerMonster.skills.map((skill, index) => {
            const template = SkillTemplates[skill.skillId];
            return {
                id: skill.skillId,
                text: template ? template.name : '未知技能',
                pp: skill.pp,
                maxPp: skill.maxPp,
                skillIndex: index,
                action: 'use_skill'
            };
        });

        this.menuStack.push({ menu: this.currentMenu, selectedIndex: this.selectedIndex });
        this.currentMenu = {
            type: 'skill',
            title: '选择技能',
            items: skills,
            layout: 'grid'
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开背包菜单
     */
    openBagMenu() {
        const gameState = gameStateMachine.getGameState();
        const inventory = (typeof inventoryManager !== 'undefined' && inventoryManager.getItems)
            ? inventoryManager.getItems({ filter: 'consumable' })
            : (gameState?.player?.inventory || []);

        const items = inventory
            .map((invItem, index) => {
                const template = getItemTemplate(invItem.itemId);
                if (!template || template.type !== ItemType.CONSUMABLE) {
                    return null;
                }
                const name = template.name || invItem.itemId;
                return {
                    id: invItem.uid || `item_${index}`,
                    text: `${name} x${invItem.quantity}`,
                    item: invItem,
                    template,
                    action: 'use_item'
                };
            })
            .filter(Boolean) as UISelectableMenuItem[];

        if (items.length === 0) {
            items.push({ id: 'empty', text: '背包为空', action: 'back' });
        } else {
            items.push({ id: 'back', text: '返回', action: 'back' });
        }

        this.menuStack.push({ menu: this.currentMenu, selectedIndex: this.selectedIndex });
        this.currentMenu = {
            type: 'bag',
            title: '背包',
            items: items,
            layout: 'list'
        };
        this.selectedIndex = 0;
    }

    /**
     * 打开怪兽切换菜单
     * @param {BattleMonster[] | PlayerMonster[]} availableMonsters - 可选怪兽
     * @param {boolean} forced - 是否强制切换
     * @param {BattleMonster | PlayerMonster | null} faintedMonster - 倒下的怪兽
     */
    openMonsterMenu(availableMonsters = [], forced = false, faintedMonster = null, title = '', mode: 'switch' | 'lead' = 'switch') {
        const gameState = gameStateMachine.getGameState();
        const monsters = (availableMonsters.length > 0 ? availableMonsters : (gameState?.player?.party || []))
            .filter(monster => monster && monster !== this.playerMonster && monster.stats && monster.stats.hp > 0);

        if (monsters.length === 0) {
            this.showMessage('没有可切换的怪兽！');
            return;
        }

        const items: BattleUIBattleMenuItem[] = monsters.map(monster => ({
            id: monster.id,
            text: `${monster.nickname || monster.name} Lv.${monster.level} HP ${monster.stats.hp}/${monster.stats.maxHp}`,
            monster,
            action: 'switch_monster'
        }));

        if (!forced) {
            items.push({ id: 'back', text: '返回', action: 'back' });
            this.menuStack.push({ menu: this.currentMenu, selectedIndex: this.selectedIndex });
        }

        this.mustSwitchMonster = forced;
        this.monsterMenuMode = mode;
        this.state = BattleUIState.SELECTING_MONSTER;
        this.currentMenu = {
            type: mode === 'lead' ? 'pre_battle_party' : 'monster_party',
            title: title || (forced
                ? `${faintedMonster?.nickname || faintedMonster?.name || '当前怪兽'}失去战斗能力`
                : '选择怪兽'),
            items,
            layout: 'list'
        };
        this.selectedIndex = 0;
    }

    /**
     * 返回上一级菜单
     */
    backToPreviousMenu() {
        if (this.menuStack.length > 0) {
            const prev = this.menuStack.pop();
            this.currentMenu = prev.menu;
            this.selectedIndex = prev.selectedIndex;
            battleSafePlaySound(getSoundID('CANCEL'));
        }
    }

    /**
     * 移动菜单选择
     * @param {string|number} direction - 方向
     */
    moveSelection(direction) {
        if (!this.currentMenu) return;

        const items = this.currentMenu.items;
        const oldIndex = this.selectedIndex;
        let newIndex;

        if (this.currentMenu.layout === 'grid') {
            const row = Math.floor(oldIndex / 2);
            const col = oldIndex % 2;
            const maxRow = Math.floor((items.length - 1) / 2);

            if (direction === 'up' || direction === -1) {
                newIndex = Math.max(0, row - 1) * 2 + col;
            } else if (direction === 'down' || direction === 1) {
                newIndex = Math.min(maxRow, row + 1) * 2 + col;
            } else if (direction === 'left') {
                newIndex = Math.max(0, row * 2 + col - 1);
            } else if (direction === 'right') {
                newIndex = Math.min(items.length - 1, row * 2 + col + 1);
            } else {
                newIndex = (oldIndex + direction + items.length) % items.length;
            }
        } else {
            newIndex = (oldIndex + direction + items.length) % items.length;
        }

        if (newIndex !== oldIndex) {
            this.selectedIndex = newIndex;
            battleSafePlaySound(getSoundID('CURSOR_MOVE'));
        }
    }

    /**
     * 确认选择
     */
    confirmSelection() {
        if (!this.currentMenu) return;

        const item = this.currentMenu.items[this.selectedIndex];
        if (!item) return;

        battleSafePlaySound(getSoundID('CONFIRM'));

        switch (this.currentMenu.type) {
            case 'action':
                this.handleActionSelection(item);
                break;
            case 'skill':
                this.handleSkillSelection(item);
                break;
            case 'bag':
                this.handleBagSelection(item);
                break;
            case 'monster':
            case 'monster_party':
            case 'pre_battle_party':
                this.handleMonsterSelection(item);
                break;
            case 'capture':
                this.handleCaptureSelection(item);
                break;
            case 'capture_end':
                this.handleCaptureEndSelection(item);
                break;
            case 'result':
            case 'battle_result':
                this.handleBattleResultSelection(item);
                break;
        }
    }

    /**
     * 处理结算面板选择
     * @param {Object} item - 选中的菜单项
     */
    handleBattleResultSelection(item) {
        const eventBus = getEventBus();
        if (item.action === 'close_result') {
            this.currentMenu = null;
            this.menuStack = [];
            this.selectedIndex = 0;
            this.state = BattleUIState.IDLE;
            eventBus.emit(getGameEvents().BATTLE_RESULT_CLOSE, {
                result: this.battleResult?.result
            });
            this.battleResult = null;
            this.battleResultSummary = null;
        }
    }

    /**
     * 处理怪兽切换选择
     * @param {BattleUIBattleMenuItem} item - 菜单项
     */
    handleMonsterSelection(item) {
        if (item.action === 'back') {
            this.mustSwitchMonster = false;
            this.monsterMenuMode = 'switch';
            this.backToPreviousMenu();
            return;
        }

        if (!item.monster?.id) {
            this.showMessage('无法切换到该怪兽');
            return;
        }

        this.currentMenu = null;
        this.menuStack = [];
        this.selectedIndex = 0;
        this.state = BattleUIState.ANIMATING;

        if (this.monsterMenuMode === 'lead') {
            getEventBus().emit(getGameEvents().BATTLE_SELECT_LEAD, {
                monsterId: item.monster.id
            });
        } else {
            getEventBus().emit('battle:switch_monster', {
                monsterId: item.monster.id,
                forced: this.mustSwitchMonster
            });
        }

        this.mustSwitchMonster = false;
        this.monsterMenuMode = 'switch';
    }

    /**
     * 处理捕获选择
     * @param {Object} item - 选中的选项
     */
    handleCaptureSelection(item) {
        const eventBus = getEventBus();
        const choice = item.action === 'capture_yes' ? 'yes' : 'no';
        this.currentMenu = null;
        this.menuStack = [];
        this.state = BattleUIState.ANIMATING;

        eventBus.emit('battle:capture_decision', { choice });
    }

    /**
     * 处理捕获完成后的结束选择
     * @param {Object} item - 选中的选项
     */
    handleCaptureEndSelection(item) {
        const eventBus = getEventBus();
        if (item.action === 'capture_finish') {
            eventBus.emit('battle:finish_capture');
        }

        this.currentMenu = null;
        this.menuStack = [];
        this.state = BattleUIState.ANIMATING;
    }

    /**
     * 处理行动菜单选择
     * @param {Object} item - 选中的菜单项
     */
    handleActionSelection(item) {
        const eventBus = getEventBus();
        switch (item.action) {
            case 'skill':
                this.state = BattleUIState.SELECTING_SKILL;
                this.openSkillMenu();
                break;
            case 'bag':
                this.state = BattleUIState.SELECTING_ACTION;
                this.openBagMenu();
                break;
            case 'monster':
                this.openMonsterMenu();
                break;
            case 'run':
                eventBus.emit('battle:flee');
                break;
        }
    }

    /**
     * 处理技能菜单选择
     * @param {Object} item - 选中的技能项
     */
    handleSkillSelection(item) {
        const eventBus = getEventBus();
        if (item.pp <= 0) {
            battleSafePlaySound(getSoundID('ERROR'));
            this.showMessage('PP不足！');
            return;
        }

        // 发送使用技能事件
        eventBus.emit('battle:use_skill', {
            skillId: item.id,
            skillIndex: item.skillIndex
        });

        this.currentMenu = null;
        this.menuStack = [];
        this.state = BattleUIState.ANIMATING;
    }

    /**
     * 处理背包菜单选择
     * @param {Object} item - 选中的背包项
     */
    handleBagSelection(item) {
        if (item.action === 'back') {
            this.backToPreviousMenu();
            return;
        }

        if (!item.template || !item.template.effect) {
            this.showMessage('该物品无法在战斗中使用');
            return;
        }

        const eventBus = getEventBus();
        eventBus.emit('battle:use_item', {
            item: {
                ...item.template,
                itemId: item.item?.itemId,
                uid: item.item?.uid
            }
        });

        this.currentMenu = null;
        this.menuStack = [];
        this.state = BattleUIState.ANIMATING;
    }

    /**
     * 添加伤害数字动画
     * @param {number} damage - 伤害值
     * @param {boolean} isPlayer - 是否是玩家受到伤害
     * @param {boolean} isCritical - 是否是暴击
     */
    addDamageNumber(damage, isPlayer, isCritical = false) {
        const canvasWidth = this.canvas ? this.canvas.width : 800;
        const canvasHeight = this.canvas ? this.canvas.height : 600;

        this.damageNumbers.push({
            value: damage,
            x: isPlayer ? canvasWidth * 0.25 : canvasWidth * 0.65,
            y: canvasHeight * 0.4,
            startY: canvasHeight * 0.4,
            createdAt: Date.now(),
            duration: 1500,
            isCritical: isCritical,
            isPlayer: isPlayer
        });
    }

    /**
     * 更新战斗UI
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        const now = Date.now();

        // 更新伤害数字
        this.damageNumbers = this.damageNumbers.filter(dn => {
            const age = now - dn.createdAt;
            return age < dn.duration;
        });

        if (this.captureEffect?.active) {
            const effect = this.captureEffect;
            const totalDuration = effect.shakes * effect.durationPerShake;
            if (now - effect.startAt > totalDuration + 500) {
                this.captureEffect = null;
            }
        }
    }

    /**
     * 渲染战斗UI
     */
    render() {
        if (!this.initialized || !this.ctx) return;

        // 渲染战斗背景
        this._renderBattleBackground();

        // 渲染敌方怪兽和状态
        this._renderEnemyMonster();

        // 渲染玩家怪兽和状态
        this._renderPlayerMonster();

        // 渲染战斗消息
        this._renderBattleMessage();

        // 渲染菜单
        this._renderMenu();

        // 渲染伤害数字
        this._renderDamageNumbers();

        // 渲染捕获球动画
        this._renderCaptureBall();
    }

    /**
     * 渲染捕获球摇晃动画
     * @private
     */
    _renderCaptureBall() {
        if (!this.captureEffect?.active) return;

        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const centerX = canvasWidth * 0.65;
        const centerY = 170;
        const radius = 26;

        const now = Date.now();
        const effect = this.captureEffect;
        const elapsed = now - effect.startAt;
        const totalDuration = effect.shakes * effect.durationPerShake;
        const progress = Math.min(1, elapsed / totalDuration);
        const wobble = Math.sin(elapsed / 120) * (1 - progress) * 0.4;
        const lift = Math.sin(elapsed / 200) * (1 - progress) * 6;

        ctx.save();
        ctx.translate(centerX, centerY - lift);
        ctx.rotate(wobble);

        // 外圈
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // 上半球
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, radius, Math.PI, 0, false);
        ctx.fill();

        // 中线
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-radius, 0);
        ctx.lineTo(radius, 0);
        ctx.stroke();

        // 按钮
        ctx.fillStyle = '#f9fafb';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    /**
     * 渲染战斗背景 - 简洁风格
     * @private
     */
    _renderBattleBackground() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 简单渐变背景
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        bgGradient.addColorStop(0, '#2d4a6e');
        bgGradient.addColorStop(0.6, '#3d5a7e');
        bgGradient.addColorStop(1, '#1d3a4e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 简单的地平线
        const horizonY = canvasHeight * 0.55;
        ctx.fillStyle = '#2d6a3e';
        ctx.fillRect(0, horizonY, canvasWidth, canvasHeight - horizonY);

        // 简单的山脉剪影
        ctx.fillStyle = '#1d4a2e';
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(100, horizonY - 60);
        ctx.lineTo(200, horizonY);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(300, horizonY);
        ctx.lineTo(450, horizonY - 80);
        ctx.lineTo(600, horizonY);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(500, horizonY);
        ctx.lineTo(650, horizonY - 50);
        ctx.lineTo(800, horizonY);
        ctx.fill();
    }

    /**
     * 渲染敌方怪兽
     * @private
     */
    _renderEnemyMonster() {
        if (!this.enemyMonster) return;

        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;

        // 敌方状态面板位置（右上角）
        const panelX = canvasWidth * 0.5;
        const panelY = 30;
        const panelWidth = canvasWidth * 0.45;
        const panelHeight = 70;

        // 绘制状态面板
        this._drawStatusPanel(panelX, panelY, panelWidth, panelHeight);

        // 绘制名称和HP条
        const name = this.enemyMonster.nickname || this.enemyMonster.name;
        const level = this.enemyMonster.level || 1;
        const currentHp = this.enemyMonster.stats.hp;
        const maxHp = this.enemyMonster.stats.maxHp || this.enemyMonster.stats.hp;
        const template = getMonsterTemplates()[this.enemyMonster.monsterId] || {};
        const enemyType = this.enemyMonster.type || template.type || getElementType('NORMAL');

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${name} Lv.${level}`, panelX + 15, panelY + 28);

        ctx.fillStyle = getUIColor('LIGHT_BLUE');
        ctx.font = '14px monospace';
        ctx.fillText(`属性: ${getElementLabel(enemyType)}`, panelX + 15, panelY + 46);

        // 渲染HP条
        const uiManager = getUIManager();
        if (uiManager && uiManager.renderHPBar) {
            uiManager.renderHPBar(panelX + 15, panelY + 52, panelWidth - 30, currentHp, maxHp, true);
        } else {
            this._renderSimpleHPBar(panelX + 15, panelY + 52, panelWidth - 30, currentHp, maxHp);
        }

        // 渲染状态效果图标
        if (this.enemyMonster.status) {
            this._renderStatusIcon(panelX + panelWidth - 40, panelY + 10, this.enemyMonster.status);
        }

        // 绘制敌方怪兽（简单占位）
        this._renderMonsterSprite(canvasWidth * 0.65, 120, this.enemyMonster, true);
    }

    /**
     * 渲染玩家怪兽
     * @private
     */
    _renderPlayerMonster() {
        if (!this.playerMonster) return;

        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 玩家状态面板位置（左下角）
        const panelX = 30;
        const panelY = canvasHeight * 0.45;
        const panelWidth = canvasWidth * 0.45;
        const panelHeight = 100;

        // 绘制状态面板
        this._drawStatusPanel(panelX, panelY, panelWidth, panelHeight);

        // 绘制名称、等级
        const name = this.playerMonster.nickname || this.playerMonster.name;
        const level = this.playerMonster.level;
        const currentHp = this.playerMonster.stats.hp;
        const maxHp = this.playerMonster.stats.maxHp || this.playerMonster.stats.hp;

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${name} Lv.${level}`, panelX + 15, panelY + 30);

        // 渲染HP条
        const uiManager = getUIManager();
        if (uiManager && uiManager.renderHPBar) {
            uiManager.renderHPBar(panelX + 15, panelY + 40, panelWidth - 30, currentHp, maxHp, true);
        } else {
            this._renderSimpleHPBar(panelX + 15, panelY + 40, panelWidth - 30, currentHp, maxHp);
        }

        // 渲染PP条（显示第一个技能的PP）
        if (this.playerMonster.skills && this.playerMonster.skills.length > 0) {
            const totalPp = this.playerMonster.skills.reduce((sum, s) => sum + s.pp, 0);
            const totalMaxPp = this.playerMonster.skills.reduce((sum, s) => sum + s.maxPp, 0);
            if (uiManager && uiManager.renderPPBar) {
                uiManager.renderPPBar(panelX + 15, panelY + 70, panelWidth - 30, totalPp, totalMaxPp);
            } else {
                this._renderSimplePPBar(panelX + 15, panelY + 70, panelWidth - 30, totalPp, totalMaxPp);
            }
        }

        // 渲染状态效果图标
        if (this.playerMonster.status) {
            this._renderStatusIcon(panelX + panelWidth - 40, panelY + 10, this.playerMonster.status);
        }

        // 绘制玩家怪兽（简单占位）
        this._renderMonsterSprite(canvasWidth * 0.25, canvasHeight * 0.42, this.playerMonster, false);
    }

    /**
     * 简单的HP条渲染（备用）
     */
    _renderSimpleHPBar(x, y, width, currentHp, maxHp) {
        const ctx = this.ctx;
        const height = 16;
        const percentage = Math.max(0, Math.min(1, currentHp / maxHp));

        let barColor;
        if (percentage > 0.5) {
            barColor = getUIColor('PRIMARY_GREEN');
        } else if (percentage > 0.25) {
            barColor = getUIColor('PRIMARY_YELLOW');
        } else {
            barColor = getUIColor('PRIMARY_RED');
        }

        ctx.fillStyle = getUIColor('DARK_GRAY');
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, width * percentage, height);
        ctx.strokeStyle = getUIColor('MEDIUM_GRAY');
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${currentHp}/${maxHp}`, x + width, y - 2);
    }

    /**
     * 简单的PP条渲染（备用）
     */
    _renderSimplePPBar(x, y, width, currentPp, maxPp) {
        const ctx = this.ctx;
        const height = 10;
        const percentage = Math.max(0, Math.min(1, currentPp / maxPp));
        const barColor = percentage > 0.25 ? getUIColor('PRIMARY_BLUE') : '#8B5CF6';

        ctx.fillStyle = getUIColor('DARK_GRAY');
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, width * percentage, height);
        ctx.strokeStyle = getUIColor('MEDIUM_GRAY');
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`PP ${currentPp}/${maxPp}`, x + width, y - 2);
    }

    /**
     * 绘制状态面板 - 简洁风格
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @private
     */
    _drawStatusPanel(x, y, width, height) {
        const ctx = this.ctx;

        // 主背景
        ctx.fillStyle = 'rgba(40, 40, 60, 0.95)';
        ctx.fillRect(x, y, width, height);

        // 边框
        ctx.strokeStyle = '#6a6a8a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    /**
     * 绘制战斗面板角落装饰
     * @private
     */
    _drawBattleCornerDecorations(x, y, width, height) {
        const ctx = this.ctx;
        const cornerSize = 12;

        ctx.strokeStyle = '#05d9e8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#05d9e8';
        ctx.shadowBlur = 8;

        // 左上角
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();

        // 右上角
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerSize);
        ctx.stroke();

        // 左下角
        ctx.beginPath();
        ctx.moveTo(x, y + height - cornerSize);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + cornerSize, y + height);
        ctx.stroke();

        // 右下角
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - cornerSize);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    /**
     * 渲染怪兽精灵 - 使用像素精灵渲染器
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} monster - 怪兽数据
     * @param {boolean} isEnemy - 是否是敌方
     * @private
     */
    _renderMonsterSprite(x, y, monster, isEnemy) {
        // 优先使用像素精灵渲染器
        if (this.spriteRenderer) {
            this.spriteRenderer.renderMonsterSprite(monster.monsterId, x, y, isEnemy, isEnemy ? 1.2 : 1.5);
            return;
        }

        // 回退到圆形渲染
        this._renderFallbackMonster(x, y, monster, isEnemy);
    }

    /**
     * 回退渲染（圆形）
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} monster - 怪兽数据
     * @param {boolean} isEnemy - 是否是敌方
     * @private
     */
    _renderFallbackMonster(x, y, monster, isEnemy) {
        const ctx = this.ctx;
        const size = isEnemy ? 80 : 100;
        const time = Date.now() / 1000;
        const floatOffset = Math.sin(time * 2 + (isEnemy ? 0 : Math.PI)) * 3;

        // 根据属性选择颜色
        const elementColors = {
            [getElementType('FIRE')]: '#e74c3c',
            [getElementType('WATER')]: '#3498db',
            [getElementType('GRASS')]: '#27ae60',
            [getElementType('ELECTRIC')]: '#f39c12',
            [getElementType('NORMAL')]: '#95a5a6'
        };

        const MonsterTemplates = getMonsterTemplates();
        const template = MonsterTemplates[monster.monsterId];
        const elementType = template ? template.type : getElementType('NORMAL');
        const mainColor = elementColors[elementType] || elementColors[getElementType('NORMAL')];

        // 地面阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + size / 2 + 20, size / 2.5, size / 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 怪兽身体
        const bodyGradient = ctx.createRadialGradient(x, y + floatOffset, 0, x, y + floatOffset, size / 2);
        bodyGradient.addColorStop(0, this._adjustBattleColorBrightness(mainColor, 30));
        bodyGradient.addColorStop(0.7, mainColor);
        bodyGradient.addColorStop(1, this._adjustBattleColorBrightness(mainColor, -30));

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y + floatOffset, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // 边框
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 眼睛
        const eyeOffset = isEnemy ? -8 : 8;
        const eyeY = y - 5 + floatOffset;

        // 眼白
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 15 + eyeOffset, eyeY, 10, 0, Math.PI * 2);
        ctx.arc(x + 15 + eyeOffset, eyeY, 10, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛瞳孔
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(x - 15 + eyeOffset, eyeY, 5, 0, Math.PI * 2);
        ctx.arc(x + 15 + eyeOffset, eyeY, 5, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛高光
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 12 + eyeOffset, eyeY - 3, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 18 + eyeOffset, eyeY - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (isEnemy) {
            // 敌方：直线
            ctx.moveTo(x - 15, y + 15 + floatOffset);
            ctx.lineTo(x + 15, y + 15 + floatOffset);
        } else {
            // 玩家：微笑
            ctx.arc(x, y + 10 + floatOffset, 15, 0.2, Math.PI - 0.2);
        }
        ctx.stroke();
    }

    /**
     * 调整战斗UI颜色亮度
     * @private
     */
    _adjustBattleColorBrightness(hexColor, amount) {
        const hex = hexColor.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * 渲染状态效果图标 - 霓虹发光风格
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} status - 状态效果
     * @private
     */
    _renderStatusIcon(x, y, status) {
        const ctx = this.ctx;
        const icon = this.statusIcons.get(status);
        if (!icon) return;

        const time = Date.now() / 1000;
        const pulse = (Math.sin(time * 4) + 1) / 2;

        // 霓虹外发光
        ctx.shadowColor = icon.glow || icon.color;
        ctx.shadowBlur = 10 + pulse * 8;

        // 背景 - 圆角矩形
        this._drawRoundedRect(x, y, 32, 32, 6);
        const bgGradient = ctx.createLinearGradient(x, y, x + 32, y + 32);
        bgGradient.addColorStop(0, this._adjustBattleColorBrightness(icon.color, 30));
        bgGradient.addColorStop(1, icon.color);
        ctx.fillStyle = bgGradient;
        ctx.fill();

        // 边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // 绘制文字 - 霓虹效果
        ctx.fillStyle = '#0a0a0f';
        ctx.shadowColor = icon.color;
        ctx.shadowBlur = 4;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(icon.text, x + 16, y + 23);
        ctx.shadowBlur = 0;
    }

    /**
     * 绘制圆角矩形路径
     * @private
     */
    _drawRoundedRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * 渲染战斗消息
     * @private
     */
    _renderBattleMessage() {
        if (!this.currentMessage) return;

        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const boxWidth = canvasWidth - 60;
        const boxHeight = 100;
        const boxX = 30;
        const boxY = canvasHeight - boxHeight - 30;

        // 只在没有菜单时才调整位置，有菜单时菜单会显示在更下方
        if (this.currentMenu) {
            // 消息显示在上方
            this._drawDialogBox(boxX, 50, boxWidth, boxHeight);

            ctx.fillStyle = getUIColor('TEXT');
            ctx.font = '18px monospace';
            ctx.textAlign = 'left';
            this._wrapText(this.currentMessage, boxX + 20, 80, boxWidth - 40, 28);
        } else {
            // 消息显示在下方
            this._drawDialogBox(boxX, boxY, boxWidth, boxHeight);

            ctx.fillStyle = getUIColor('TEXT');
            ctx.font = '18px monospace';
            ctx.textAlign = 'left';
            this._wrapText(this.currentMessage, boxX + 20, boxY + 35, boxWidth - 40, 28);

            // 绘制继续指示箭头
            this._drawContinueIndicator(boxX + boxWidth - 30, boxY + boxHeight - 15);
        }
    }

    /**
     * 文本换行渲染
     * @param {string} text - 文本
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} maxWidth - 最大宽度
     * @param {number} lineHeight - 行高
     * @private
     */
    _wrapText(text, x, y, maxWidth, lineHeight) {
        const ctx = this.ctx;
        const chars = text.split('');
        let line = '';
        let lineY = y;

        for (let i = 0; i < chars.length; i++) {
            const testLine = line + chars[i];
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, lineY);
                line = chars[i];
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, lineY);
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

        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + 4, y + 4, width, height);

        // 主背景
        ctx.fillStyle = getUIColor('BACKGROUND');
        ctx.fillRect(x, y, width, height);

        // 边框
        ctx.strokeStyle = getUIColor('PRIMARY_BLUE');
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // 内边框
        ctx.strokeStyle = getUIColor('LIGHT_BLUE');
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
    }

    /**
     * 绘制继续指示箭头
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @private
     */
    _drawContinueIndicator(x, y) {
        const ctx = this.ctx;
        const time = Date.now() / 300;
        const offset = Math.sin(time) * 3;

        ctx.fillStyle = getUIColor('TEXT');
        ctx.beginPath();
        ctx.moveTo(x, y + offset);
        ctx.lineTo(x - 8, y - 6 + offset);
        ctx.lineTo(x + 8, y - 6 + offset);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 渲染菜单
     * @private
     */
    _renderMenu() {
        if (!this.currentMenu) return;

        if (this.currentMenu.type === 'result' || this.currentMenu.type === 'battle_result') {
            this._renderBattleResultPanel();
            return;
        }

        if (this.currentMenu.type === 'monster' || this.currentMenu.type === 'monster_party' || this.currentMenu.type === 'pre_battle_party') {
            this._renderMonsterSelectionMenu();
            return;
        }

        if (this.currentMenu.layout === 'grid') {
            this._renderGridMenu();
        } else {
            this._renderListMenu();
        }
    }

    /**
     * 渲染战斗结算面板
     * @private
     */
    _renderBattleResultPanel() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const result = this.battleResult;
        const summary = this.battleResultSummary || result?.summary || null;
        const itemTemplates = getItemTemplates();

        if (!result) {
            return;
        }

        const panelWidth = canvasWidth - 120;
        const panelHeight = canvasHeight - 120;
        const panelX = 60;
        const panelY = 60;
        const buttonSelected = this.selectedIndex === 0;

        const resultTitleMap = {
            victory: '胜利',
            defeat: '失败',
            flee: '成功逃跑',
            capture: '收服成功'
        };

        const resultColorMap = {
            victory: getUIColor('PRIMARY_GREEN'),
            defeat: getUIColor('PRIMARY_RED'),
            flee: getUIColor('PRIMARY_YELLOW'),
            capture: getUIColor('PRIMARY_BLUE')
        };

        const summaryLines = [
            `结果：${resultTitleMap[result.result] || result.result}`,
            `怪兽经验：${summary?.expGained ?? result.exp ?? 0}`,
            `玩家经验：${result.playerExp || 0}`,
            `获得金钱：￥${summary?.moneyGained ?? 0}`,
            `掉落奖励：${summary?.items?.length ?? (result.rewards || []).length}`
        ];

        if (result.monsterId) {
            const monsterTemplate = getMonsterTemplates()[result.monsterId];
            if (monsterTemplate) {
                summaryLines.splice(1, 0, `目标：${monsterTemplate.name}`);
            }
        }

        if (result.playerLevelUps && result.playerLevelUps.length > 0) {
            summaryLines.push(`升级：Lv.${result.playerLevelUps.join(' / Lv.')}`);
        }

        if (summary?.monsterLevelUps?.length) {
            summaryLines.push(`队伍升级：${summary.monsterLevelUps.length}只`);
        }

        const rewardLines = (summary?.items || []).slice(0, 4).map(item => {
            const template = itemTemplates[item.itemId];
            return `- ${template?.name || item.itemId} x${item.quantity}`;
        });

        if (rewardLines.length === 0) {
            (result.rewards || []).slice(0, 4).forEach(itemId => {
                const template = itemTemplates[itemId];
                rewardLines.push(`- ${template?.name || itemId}`);
            });
        }

        const logLines = (result.battleLog || []).slice(-4).map(log => `- ${log}`);

        this._drawDialogBox(panelX, panelY, panelWidth, panelHeight);

        ctx.textAlign = 'left';
        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = 'bold 28px monospace';
        ctx.fillText('战斗结算', panelX + 28, panelY + 42);

        ctx.fillStyle = resultColorMap[result.result] || getUIColor('TEXT');
        ctx.font = 'bold 24px monospace';
        ctx.fillText(resultTitleMap[result.result] || result.result, panelX + panelWidth - 190, panelY + 42);

        ctx.fillStyle = getUIColor('LIGHT_GRAY');
        ctx.font = '18px monospace';
        summaryLines.forEach((line, index) => {
            ctx.fillText(line, panelX + 30, panelY + 90 + index * 34);
        });

        const rewardSectionY = panelY + 280;
        ctx.fillStyle = getUIColor('LIGHT_BLUE');
        ctx.font = 'bold 20px monospace';
        ctx.fillText('奖励', panelX + 30, rewardSectionY);

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = '16px monospace';
        if (rewardLines.length === 0) {
            ctx.fillText('本次没有获得额外掉落。', panelX + 30, rewardSectionY + 34);
        } else {
            rewardLines.forEach((line, index) => {
                ctx.fillText(line, panelX + 30, rewardSectionY + 34 + index * 26);
            });
        }

        const logSectionY = panelY + 280;
        const logX = panelX + panelWidth / 2 + 10;
        ctx.fillStyle = getUIColor('LIGHT_BLUE');
        ctx.font = 'bold 20px monospace';
        ctx.fillText('战斗记录', logX, logSectionY);

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = '15px monospace';
        if (logLines.length === 0) {
            ctx.fillText('暂无结算日志。', logX, logSectionY + 34);
        } else {
            logLines.forEach((line, index) => {
                this._wrapText(line, logX, logSectionY + 34 + index * 24, panelWidth / 2 - 50, 22);
            });
        }

        const buttonX = panelX + panelWidth - 160;
        const buttonY = panelY + panelHeight - 70;
        ctx.fillStyle = buttonSelected ? getUIColor('PRIMARY_BLUE') : getUIColor('DARK_GRAY');
        ctx.fillRect(buttonX, buttonY, 110, 40);
        ctx.strokeStyle = getUIColor('LIGHT_BLUE');
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY, 110, 40);
        ctx.fillStyle = getUIColor('TEXT');
        ctx.textAlign = 'center';
        ctx.font = '18px monospace';
        ctx.fillText(`${buttonSelected ? '▶ ' : ''}继续`, buttonX + 55, buttonY + 26);
    }

    /**
     * 渲染怪兽选择菜单（含详情预览）
     * @private
     */
    _renderMonsterSelectionMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const items = this.currentMenu.items || [];
        const selectedItem = items[this.selectedIndex];
        const selectedMonster = selectedItem?.monster || items.find(item => item?.monster)?.monster || null;
        const enemyMonster = this.enemyMonster;

        const listWidth = 330;
        const listX = 40;
        const listY = 150;
        const itemHeight = 40;
        const listHeight = items.length * itemHeight + 80;

        const detailX = listX + listWidth + 24;
        const detailY = 150;
        const detailWidth = canvasWidth - detailX - 40;
        const detailHeight = canvasHeight - detailY - 40;

        this._drawDialogBox(listX, listY, listWidth, listHeight);
        this._drawDialogBox(detailX, detailY, detailWidth, detailHeight);

        ctx.textAlign = 'center';
        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = 'bold 22px monospace';
        ctx.fillText(this.currentMenu.title || '选择怪兽', listX + listWidth / 2, listY + 34);

        const prompt = this.monsterMenuMode === 'lead'
            ? '遭遇野生怪兽，选择首发成员'
            : (this.mustSwitchMonster ? '当前怪兽倒下，请立即更换' : '选择准备出战的怪兽');
        ctx.fillStyle = getUIColor('LIGHT_GRAY');
        ctx.font = '14px monospace';
        ctx.fillText(prompt, listX + listWidth / 2, listY + 58);

        ctx.font = '18px monospace';
        ctx.textAlign = 'left';
        const startY = listY + 80;
        items.forEach((item, i) => {
            const isSelected = i === this.selectedIndex;
            const itemY = startY + i * itemHeight;

            if (isSelected) {
                ctx.fillStyle = getUIColor('PRIMARY_BLUE');
                ctx.fillRect(listX + 10, itemY, listWidth - 20, itemHeight - 6);
                ctx.fillStyle = getUIColor('TEXT');
            } else {
                ctx.fillStyle = getUIColor('LIGHT_GRAY');
            }

            const prefix = isSelected ? '▶ ' : '  ';
            ctx.fillText(prefix + item.text, listX + 20, itemY + 25);
        });

        ctx.textAlign = 'left';
        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = 'bold 22px monospace';
        ctx.fillText(this.monsterMenuMode === 'lead' ? '战前预览' : '怪兽详情', detailX + 24, detailY + 34);

        if (enemyMonster) {
            this._renderMonsterPreviewCard(
                detailX + 20,
                detailY + 54,
                detailWidth - 40,
                this.monsterMenuMode === 'lead' ? 150 : 120,
                enemyMonster,
                '敌方情报',
                true
            );
        }

        if (selectedMonster) {
            const cardY = detailY + (enemyMonster ? (this.monsterMenuMode === 'lead' ? 220 : 180) : 60);
            const cardHeight = detailHeight - (cardY - detailY) - 20;
            this._renderMonsterPreviewCard(
                detailX + 20,
                cardY,
                detailWidth - 40,
                Math.max(cardHeight, 220),
                selectedMonster,
                this.monsterMenuMode === 'lead' ? '我方首发预览' : '当前选择',
                false
            );
        }
    }

    /**
     * 渲染怪兽预览卡片
     * @private
     */
    _renderMonsterPreviewCard(x, y, width, height, monster, title, isEnemy = false) {
        const ctx = this.ctx;
        const template = getMonsterTemplates()[monster?.monsterId] || {};
        const type = monster?.type || template.type || getElementType('NORMAL');
        const typeColor = getElementColor(type);
        const skills = (monster?.skills || []).slice(0, 4).map(skillRef => {
            const skillId = typeof skillRef === 'string' ? skillRef : skillRef.skillId;
            return getSkillTemplates()[skillId]?.name || skillId || '未知技能';
        });

        this._drawDialogBox(x, y, width, height);

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(title, x + 18, y + 28);

        ctx.fillStyle = typeColor;
        ctx.fillRect(x + 18, y + 42, 110, 26);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(getElementLabel(type), x + 73, y + 60);

        ctx.textAlign = 'left';
        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`${monster?.nickname || monster?.name || '未知'} Lv.${monster?.level || 1}`, x + 145, y + 62);

        const spriteX = x + 70;
        const spriteY = y + Math.min(height - 70, 120);
        this._renderMonsterSprite(spriteX, spriteY, monster, isEnemy);

        const textX = x + 145;
        let lineY = y + 98;
        ctx.font = '16px monospace';
        ctx.fillStyle = getUIColor('LIGHT_GRAY');
        ctx.fillText(`HP ${monster?.stats?.hp || 0}/${monster?.stats?.maxHp || 0}`, textX, lineY);
        lineY += 26;
        ctx.fillText(`ATK ${monster?.stats?.atk || 0}  DEF ${monster?.stats?.def || 0}  SPD ${monster?.stats?.spd || 0}`, textX, lineY);
        lineY += 26;
        ctx.fillText(`SPA ${monster?.stats?.spAtk || 0}  SDF ${monster?.stats?.spDef || 0}`, textX, lineY);
        lineY += 30;

        if (template.profile?.description) {
            ctx.fillStyle = getUIColor('TEXT');
            ctx.font = '15px monospace';
            this._wrapText(template.profile.description, textX, lineY, width - 170, 22);
            lineY += 52;
        }

        ctx.fillStyle = getUIColor('LIGHT_BLUE');
        ctx.font = 'bold 16px monospace';
        ctx.fillText('技能', textX, lineY);
        lineY += 24;

        ctx.fillStyle = getUIColor('TEXT');
        ctx.font = '14px monospace';
        skills.forEach((skillName, index) => {
            ctx.fillText(`- ${skillName}`, textX, lineY + index * 20);
        });
    }

    /**
     * 渲染网格菜单
     * @private
     */
    _renderGridMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const menuWidth = 320;
        const menuHeight = 140;
        const menuX = canvasWidth - menuWidth - 30;
        const menuY = canvasHeight - menuHeight - 20;

        // 绘制菜单框
        this._drawDialogBox(menuX, menuY, menuWidth, menuHeight);

        // 绘制菜单项 (2x2 网格)
        const items = this.currentMenu.items;
        const cellWidth = menuWidth / 2 - 15;
        const cellHeight = (menuHeight - 30) / 2;

        ctx.font = '18px monospace';
        ctx.textAlign = 'left';

        items.forEach((item, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const isSelected = i === this.selectedIndex;

            const cellX = menuX + 15 + col * (cellWidth + 10);
            const cellY = menuY + 15 + row * (cellHeight + 5);

            if (isSelected) {
                ctx.fillStyle = getUIColor('PRIMARY_BLUE');
                ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
                ctx.fillStyle = getUIColor('TEXT');
            } else {
                ctx.fillStyle = getUIColor('DARK_GRAY');
                ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
                ctx.fillStyle = getUIColor('LIGHT_GRAY');
            }

            const prefix = isSelected ? '▶ ' : '  ';
            ctx.fillText(prefix + item.text, cellX + 15, cellY + cellHeight / 2 + 6);

            // 显示PP（技能菜单）
            if (item.pp !== undefined) {
                ctx.font = '12px monospace';
                ctx.textAlign = 'right';
                const ppColor = item.pp <= 0 ? getUIColor('PRIMARY_RED') : getUIColor('LIGHT_GRAY');
                ctx.fillStyle = ppColor;
                ctx.fillText(`PP:${item.pp}/${item.maxPp}`, cellX + cellWidth - 10, cellY + cellHeight - 8);
                ctx.font = '18px monospace';
                ctx.textAlign = 'left';
            }
        });
    }

    /**
     * 渲染列表菜单
     * @private
     */
    _renderListMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;

        const menuWidth = 280;
        const itemHeight = 40;
        const items = this.currentMenu.items;
        const menuHeight = items.length * itemHeight + 60;
        const menuX = (canvasWidth - menuWidth) / 2;
        const menuY = 150;

        // 绘制菜单框
        this._drawDialogBox(menuX, menuY, menuWidth, menuHeight);

        // 绘制标题
        if (this.currentMenu.title) {
            ctx.fillStyle = getUIColor('TEXT');
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentMenu.title, menuX + menuWidth / 2, menuY + 30);
        }

        // 绘制菜单项
        ctx.font = '18px monospace';
        ctx.textAlign = 'left';

        const startY = this.currentMenu.title ? menuY + 55 : menuY + 25;

        items.forEach((item, i) => {
            const isSelected = i === this.selectedIndex;
            const itemY = startY + i * itemHeight;

            if (isSelected) {
                ctx.fillStyle = getUIColor('PRIMARY_BLUE');
                ctx.fillRect(menuX + 10, itemY, menuWidth - 20, itemHeight - 5);
                ctx.fillStyle = getUIColor('TEXT');
            } else {
                ctx.fillStyle = getUIColor('LIGHT_GRAY');
            }

            const prefix = isSelected ? '▶ ' : '  ';
            ctx.fillText(prefix + item.text, menuX + 20, itemY + 25);

            // 显示PP（技能菜单）
            if (item.pp !== undefined) {
                ctx.font = '14px monospace';
                ctx.textAlign = 'right';
                const ppColor = item.pp <= 0 ? getUIColor('PRIMARY_RED') : (isSelected ? getUIColor('TEXT') : getUIColor('LIGHT_GRAY'));
                ctx.fillStyle = ppColor;
                ctx.fillText(`${item.pp}/${item.maxPp}`, menuX + menuWidth - 20, itemY + 25);
                ctx.font = '18px monospace';
                ctx.textAlign = 'left';
            }
        });
    }

    /**
     * 渲染伤害数字
     * @private
     */
    _renderDamageNumbers() {
        const ctx = this.ctx;
        const now = Date.now();

        this.damageNumbers.forEach(dn => {
            const age = now - dn.createdAt;
            const progress = age / dn.duration;

            // 计算位置和透明度
            const y = dn.startY - progress * 50;
            const alpha = 1 - progress;
            const scale = 1 + progress * 0.5;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(dn.x, y);
            ctx.scale(scale, scale);

            // 暴击时红色闪烁
            if (dn.isCritical) {
                ctx.fillStyle = getUIColor('PRIMARY_RED');
                ctx.font = 'bold 36px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('暴击!', 0, -30);
            }

            // 伤害数字
            ctx.fillStyle = dn.isPlayer ? getUIColor('PRIMARY_RED') : getUIColor('TEXT');
            ctx.strokeStyle = getUIColor('BACKGROUND');
            ctx.lineWidth = 4;
            ctx.font = 'bold 32px monospace';
            ctx.textAlign = 'center';

            const text = `-${dn.value}`;
            ctx.strokeText(text, 0, 0);
            ctx.fillText(text, 0, 0);

            ctx.restore();
        });
    }

    /**
     * 处理键盘输入
     * @param {KeyboardEvent} event - 键盘事件
     * @returns {boolean} 是否处理了输入
     */
    handleInput(event) {
        if (event.type !== 'keydown') return false;

        // 消息状态
        if (this.state === BattleUIState.SHOWING_MESSAGE && this.currentMessage) {
            switch (event.key) {
                case 'Enter':
                case 'z':
                case 'Z':
                case ' ':
                    this.confirmMessage();
                    return true;
            }
            return false;
        }

        // 菜单状态
        if (this.currentMenu) {
            if (this.currentMenu.layout === 'grid') {
                switch (event.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        this.moveSelection('up');
                        return true;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        this.moveSelection('down');
                        return true;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        this.moveSelection('left');
                        return true;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        this.moveSelection('right');
                        return true;
                    case 'Enter':
                    case 'z':
                    case 'Z':
                        this.confirmSelection();
                        return true;
                    case 'Escape':
                    case 'x':
                    case 'X':
                        if (this.menuStack.length > 0) {
                            this.backToPreviousMenu();
                        }
                        return true;
                }
            } else {
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
                    case 'Enter':
                    case 'z':
                    case 'Z':
                        this.confirmSelection();
                        return true;
                    case 'Escape':
                    case 'x':
                    case 'X':
                        if (this.menuStack.length > 0) {
                            this.backToPreviousMenu();
                        }
                        return true;
                }
            }
        }

        return false;
    }
}

// 创建全局实例
const battleUI = new BattleUI();
window.battleUI = battleUI;
window.BattleUIState = BattleUIState;
