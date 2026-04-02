/**
 * 事件总线 - 模块间通信
 * 实现发布-订阅模式
 */
class EventBus {
    private events: Record<string, EventCallback[]> = {};

    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on<T = unknown>(event: string, callback: EventCallback<T>): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback as EventCallback);
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 要移除的回调函数
     */
    off<T = unknown>(event: string, callback: EventCallback<T>): void {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit<T = unknown>(event: string, data?: T): void {
        if (!this.events[event]) return;

        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * 订阅一次性事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    once<T = unknown>(event: string, callback: EventCallback<T>): void {
        const onceCallback: EventCallback<T> = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }

    /**
     * 清除所有事件监听器
     */
    clear(): void {
        this.events = {};
    }
}

// 定义游戏事件常量
const GameEvents = {
    // 状态切换
    STATE_CHANGE: 'state:change',
    PUSH_STATE: 'state:push',
    POP_STATE: 'state:pop',

    // 地图事件
    MAP_PLAYER_MOVE: 'map:player_move',
    MAP_ENCOUNTER: 'map:encounter',
    MAP_PORTAL: 'map:portal',
    MAP_INTERACT: 'map:interact',

    // 战斗事件
    BATTLE_START: 'battle:start',
    BATTLE_ACTION: 'battle:action',
    BATTLE_DAMAGE: 'battle:damage',
    BATTLE_END: 'battle:end',

    // 对话事件
    DIALOG_START: 'dialog:start',
    DIALOG_NEXT: 'dialog:next',
    DIALOG_CHOICE: 'dialog:choice',
    DIALOG_END: 'dialog:end',

    // 商店事件
    SHOP_OPEN: 'shop:open',
    SHOP_BUY: 'shop:buy',
    SHOP_SELL: 'shop:sell',
    SHOP_CLOSE: 'shop:close',

    // UI事件
    UI_MENU_OPEN: 'ui:menu_open',
    UI_MENU_CLOSE: 'ui:menu_close',
    UI_NOTIFICATION: 'ui:notification',

    // 数据事件
    DATA_SAVE: 'data:save',
    DATA_LOAD: 'data:load',
    DATA_UPDATE: 'data:update',

    // 音效事件
    AUDIO_PLAY: 'audio:play',
    AUDIO_BGM: 'audio:bgm'
} as const;

// 暴露常量和实例到 window
window.GameEvents = GameEvents;
window.eventBus = new EventBus();
const eventBus = window.eventBus;
