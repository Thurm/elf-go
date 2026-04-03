/**
 * 地图状态机 - 管理地图场景的各种状态
 * 处理状态切换、遇敌判定、交互逻辑
 */

// 地图状态枚举
const MapState = {
    IDLE: 'IDLE',           // 空闲状态：玩家可以自由移动
    MOVING: 'MOVING',       // 移动中：玩家正在移动
    INTERACT: 'INTERACT',   // 交互中：与NPC对话、打开商店等
    PORTAL: 'PORTAL',       // 传送中：地图切换动画
    ENCOUNTER: 'ENCOUNTER', // 遇敌中：遇敌动画
    MENU: 'MENU',           // 菜单打开中
    DIALOG: 'DIALOG',       // 对话中
    SHOP: 'SHOP',           // 商店中
    BATTLE: 'BATTLE',       // 战斗中（过渡到战斗状态）
    SAVE: 'SAVE',           // 存档中
    LOAD: 'LOAD'            // 读档中
};

// 状态转换规则：允许从哪些状态转换到目标状态
const STATE_TRANSITIONS = {
    [MapState.IDLE]: [
        MapState.MOVING, MapState.INTERACT, MapState.PORTAL,
        MapState.ENCOUNTER, MapState.MENU, MapState.DIALOG,
        MapState.SHOP, MapState.BATTLE, MapState.SAVE, MapState.LOAD
    ],
    [MapState.MOVING]: [
        MapState.IDLE, MapState.PORTAL, MapState.ENCOUNTER, MapState.INTERACT
    ],
    [MapState.INTERACT]: [MapState.IDLE, MapState.DIALOG, MapState.SHOP],
    [MapState.PORTAL]: [MapState.IDLE],
    [MapState.ENCOUNTER]: [MapState.BATTLE, MapState.IDLE],
    [MapState.MENU]: [MapState.IDLE, MapState.SAVE, MapState.LOAD],
    [MapState.DIALOG]: [MapState.IDLE, MapState.SHOP],
    [MapState.SHOP]: [MapState.IDLE, MapState.DIALOG],
    [MapState.BATTLE]: [MapState.IDLE],
    [MapState.SAVE]: [MapState.MENU],
    [MapState.LOAD]: [MapState.IDLE]
};

/**
 * 地图状态机类
 */
class MapStateMachine {
    constructor() {
        // 当前状态
        this.currentState = MapState.IDLE;

        // 状态历史栈（用于返回上一状态）
        this.stateStack = [];

        // 状态数据（存储每个状态的附加信息）
        this.stateData = {};

        // 事件监听器
        this.eventListeners = {};

        // 是否已初始化
        this.initialized = false;

        // 遇敌相关
        this.encounterPending = false;
        this.encounterData = null;
        this.lastEncounterPos = null;

        // 传送相关
        this.portalPending = false;
        this.portalData = null;

        // 交互相关
        this.interactPending = false;
        this.interactData = null;

        // 动画计时器
        this.animationTimer = 0;
        this.animationDuration = 0;
    }

    /**
     * 初始化地图状态机
     */
    init() {
        this.currentState = MapState.IDLE;
        this.stateStack = [];
        this.stateData = {};
        this.encounterPending = false;
        this.portalPending = false;
        this.interactPending = false;
        this.lastEncounterPos = null;

        this.setupEventListeners();
        this.initialized = true;

        console.log('MapStateMachine initialized');
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 玩家移动事件
        eventBus.on(GameEvents.MAP_PLAYER_MOVE, (data) => {
            this.onPlayerMove(data);
        });

        // 传送事件
        eventBus.on(GameEvents.MAP_PORTAL, (data) => {
            this.onPortal(data);
        });

        // 遇敌事件
        eventBus.on(GameEvents.MAP_ENCOUNTER, (data) => {
            this.onEncounter(data);
        });

        // 交互事件
        eventBus.on(GameEvents.MAP_INTERACT, (data) => {
            this.onInteract(data);
        });

        // 对话结束事件
        eventBus.on(GameEvents.DIALOG_END, () => {
            this.onDialogEnd();
        });

        // 商店关闭事件
        eventBus.on(GameEvents.SHOP_CLOSE, () => {
            this.onShopClose();
        });

        // 战斗结束事件
        eventBus.on(GameEvents.BATTLE_END, (data) => {
            this.onBattleEnd(data);
        });

        // 全局状态变化
        eventBus.on(GameEvents.STATE_CHANGE, (data) => {
            this.onGlobalStateChange(data);
        });

        // 菜单关闭事件
        eventBus.on(GameEvents.UI_MENU_CLOSE, () => {
            this.onMenuClose();
        });
    }

    /**
     * 更新状态机
     * @param {number} deltaTime - 时间增量（秒）
     */
    update(deltaTime) {
        if (!this.initialized) return;

        // 更新动画计时器
        if (this.animationTimer > 0) {
            this.animationTimer -= deltaTime;
            if (this.animationTimer <= 0) {
                this.onAnimationComplete();
            }
        }

        // 处理待处理的事件
        this.processPendingEvents();
    }

    /**
     * 处理待处理事件
     */
    processPendingEvents() {
        // 处理传送
        if (this.portalPending && this.canTransitionTo(MapState.PORTAL)) {
            this.portalPending = false;
            this.startPortal(this.portalData);
            this.portalData = null;
        }

        // 处理遇敌
        if (this.encounterPending && this.canTransitionTo(MapState.ENCOUNTER)) {
            this.encounterPending = false;
            this.startEncounter(this.encounterData);
            this.encounterData = null;
        }

        // 处理交互
        if (this.interactPending && this.canTransitionTo(MapState.INTERACT)) {
            this.interactPending = false;
            this.startInteract(this.interactData);
            this.interactData = null;
        }
    }

    /**
     * 检查是否可以转换到目标状态
     * @param {string} targetState - 目标状态
     * @returns {boolean} 是否可以转换
     */
    canTransitionTo(targetState) {
        const allowedTransitions = STATE_TRANSITIONS[this.currentState];
        return allowedTransitions && allowedTransitions.includes(targetState);
    }

    /**
     * 切换状态
     * @param {string} newState - 新状态
     * @param {Object} data - 状态数据
     * @returns {boolean} 是否成功切换
     */
    changeState(newState, data = {}) {
        if (!this.canTransitionTo(newState)) {
            console.warn(`Cannot transition from ${this.currentState} to ${newState}`);
            return false;
        }

        const oldState = this.currentState;

        // 退出旧状态
        this.onExitState(oldState, newState);

        // 切换状态
        this.currentState = newState;
        this.stateData[newState] = data;

        // 进入新状态
        this.onEnterState(newState, oldState, data);

        // 触发事件
        this.emit('stateChange', {
            oldState: oldState,
            newState: newState,
            data: data
        });

        console.log(`MapState: ${oldState} -> ${newState}`);
        return true;
    }

    /**
     * 推入新状态（保留当前状态）
     * @param {string} newState - 新状态
     * @param {Object} data - 状态数据
     */
    pushState(newState, data = {}) {
        this.stateStack.push({
            state: this.currentState,
            data: this.stateData[this.currentState]
        });

        const oldState = this.currentState;

        this.onExitState(oldState, newState);

        this.currentState = newState;
        this.stateData[newState] = data;

        this.onEnterState(newState, oldState, data);

        this.emit('statePush', {
            oldState: oldState,
            newState: newState,
            data: data
        });

        console.log(`MapState push: ${oldState} -> ${newState}`);
    }

    /**
     * 弹出状态，返回到上一状态
     */
    popState() {
        if (this.stateStack.length === 0) {
            console.warn('State stack is empty');
            return;
        }

        const oldState = this.currentState;
        const previous = this.stateStack.pop();

        this.onExitState(oldState, previous.state);

        this.currentState = previous.state;
        this.stateData[previous.state] = previous.data;

        this.onEnterState(previous.state, oldState, previous.data);

        this.emit('statePop', {
            oldState: oldState,
            newState: previous.state,
            data: previous.data
        });

        console.log(`MapState pop: ${oldState} -> ${previous.state}`);
    }

    /**
     * 进入状态回调
     * @param {string} state - 新状态
     * @param {string} oldState - 旧状态
     * @param {Object} data - 状态数据
     */
    onEnterState(state, oldState, data) {
        switch (state) {
            case MapState.IDLE:
                this.onEnterIdle(oldState, data);
                break;
            case MapState.MOVING:
                this.onEnterMoving(oldState, data);
                break;
            case MapState.INTERACT:
                this.onEnterInteract(oldState, data);
                break;
            case MapState.PORTAL:
                this.onEnterPortal(oldState, data);
                break;
            case MapState.ENCOUNTER:
                this.onEnterEncounter(oldState, data);
                break;
            case MapState.MENU:
                this.onEnterMenu(oldState, data);
                break;
            case MapState.DIALOG:
                this.onEnterDialog(oldState, data);
                break;
            case MapState.SHOP:
                this.onEnterShop(oldState, data);
                break;
            case MapState.BATTLE:
                this.onEnterBattle(oldState, data);
                break;
            case MapState.SAVE:
                this.onEnterSave(oldState, data);
                break;
            case MapState.LOAD:
                this.onEnterLoad(oldState, data);
                break;
        }
    }

    /**
     * 退出状态回调
     * @param {string} state - 旧状态
     * @param {string} newState - 新状态
     */
    onExitState(state, newState) {
        switch (state) {
            case MapState.IDLE:
                this.onExitIdle(newState);
                break;
            case MapState.MOVING:
                this.onExitMoving(newState);
                break;
            case MapState.INTERACT:
                this.onExitInteract(newState);
                break;
            case MapState.PORTAL:
                this.onExitPortal(newState);
                break;
            case MapState.ENCOUNTER:
                this.onExitEncounter(newState);
                break;
            case MapState.MENU:
                this.onExitMenu(newState);
                break;
            case MapState.DIALOG:
                this.onExitDialog(newState);
                break;
            case MapState.SHOP:
                this.onExitShop(newState);
                break;
            case MapState.BATTLE:
                this.onExitBattle(newState);
                break;
            case MapState.SAVE:
                this.onExitSave(newState);
                break;
            case MapState.LOAD:
                this.onExitLoad(newState);
                break;
        }
    }

    // ==================== 状态进入/退出处理 ====================

    onEnterIdle(oldState, data) {
        // 恢复输入处理
    }

    onExitIdle(newState) {
        // 暂停输入处理
    }

    onEnterMoving(oldState, data) {
        // 移动开始
    }

    onExitMoving(newState) {
        // 移动结束
    }

    onEnterInteract(oldState, data) {
        // 根据交互类型决定下一步
        if (data.type === 'npc') {
            if (data.shopId) {
                // 打开商店
                this.changeState(MapState.SHOP, data);
            } else if (data.dialogId) {
                // 开始对话
                this.changeState(MapState.DIALOG, data);
            }
        }
    }

    onExitInteract(newState) {
        // 交互结束
    }

    onEnterPortal(oldState, data) {
        // 传送状态仅作为锁态，实际过渡由 MapSystem + MapRenderer 编排
        this.animationTimer = 0;
        this.animationDuration = 0;
    }

    onExitPortal(newState) {
        // 传送完成
    }

    onEnterEncounter(oldState, data) {
        // 开始遇敌动画
        this.startAnimation(1.0); // 1秒遇敌动画
    }

    onExitEncounter(newState) {
        // 遇敌结束
    }

    onEnterMenu(oldState, data) {
        // 打开菜单
        gameStateMachine.pushState(GameState.MENU);
    }

    onExitMenu(newState) {
        // 关闭菜单
        if (newState !== MapState.SAVE && newState !== MapState.LOAD) {
            gameStateMachine.popState();
        }
    }

    onEnterDialog(oldState, data) {
        // 开始对话 - 发出 DIALOG_START 事件，包含完整数据
        gameStateMachine.pushState(GameState.DIALOG);
        // 获取对话节点并发送完整数据
        const dialogNodes = window.DialogNodes || {};
        let dialogData = { ...data };
        if (data.dialogId && dialogNodes[data.dialogId]) {
            const node = dialogNodes[data.dialogId];
            if (node.lines && node.lines.length > 0) {
                dialogData.speaker = node.lines[0].speaker || '';
                dialogData.text = node.lines[0].text || '';
                dialogData.choices = node.choices || null;
                dialogData.lines = node.lines;
            }
        }
        eventBus.emit(GameEvents.DIALOG_START, dialogData);
    }

    onExitDialog(newState) {
        // 对话结束
    }

    onEnterShop(oldState, data) {
        // 打开商店
        gameStateMachine.pushState(GameState.SHOP);
        eventBus.emit(GameEvents.SHOP_OPEN, {
            shopId: data.shopId,
            npcId: data.npcId
        });
    }

    onExitShop(newState) {
        // 关闭商店
    }

    onEnterBattle(oldState, data) {
        // 开始战斗
        gameStateMachine.pushState(GameState.PRE_BATTLE_SELECT);
        // 由 BattleSystem 统一发射 BATTLE_START（确保数据完整）
    }

    onExitBattle(newState) {
        // 战斗结束，返回地图
        gameStateMachine.changeState(GameState.MAP);
    }

    onEnterSave(oldState, data) {
        // 打开存档界面
        gameStateMachine.pushState(GameState.SAVE);
    }

    onExitSave(newState) {
        // 关闭存档界面
    }

    onEnterLoad(oldState, data) {
        // 打开读档界面
        gameStateMachine.pushState(GameState.LOAD);
    }

    onExitLoad(newState) {
        // 关闭读档界面
    }

    // ==================== 事件处理 ====================

    /**
     * 玩家移动事件
     */
    onPlayerMove(data) {
        // 移动结束后回到IDLE状态
        if (this.currentState === MapState.MOVING) {
            this.changeState(MapState.IDLE);
        }
    }

    /**
     * 传送事件
     */
    onPortal(data) {
        if (this.currentState === MapState.IDLE || this.currentState === MapState.MOVING) {
            this.portalPending = true;
            this.portalData = data;
        }
    }

    /**
     * 遇敌事件
     */
    onEncounter(data) {
        if (this.currentState === MapState.IDLE || this.currentState === MapState.MOVING) {
            if (this.encounterPending) {
                return;
            }
            this.encounterPending = true;
            this.encounterData = data;
            if (data && Number.isFinite(data.x) && Number.isFinite(data.y)) {
                this.lastEncounterPos = {
                    x: data.x,
                    y: data.y,
                    mapId: data.mapId || null
                };
            }
            this.encounterPending = false;
            this.encounterData = null;
            this.changeState(MapState.BATTLE, data);
        }
    }

    /**
     * 交互事件
     */
    onInteract(data) {
        if (this.currentState === MapState.IDLE) {
            this.interactPending = true;
            this.interactData = data;
        }
    }

    /**
     * 对话结束事件
     */
    onDialogEnd() {
        if (this.currentState === MapState.DIALOG) {
            // 检查对话是否有后续动作
            const dialogData = this.stateData[MapState.DIALOG];
            if (dialogData?.nextShop) {
                // 切换到商店
                this.changeState(MapState.SHOP, { shopId: dialogData.nextShop });
            } else {
                // 返回空闲
                this.changeState(MapState.IDLE);
            }
        }
    }

    /**
     * 商店关闭事件
     */
    onShopClose() {
        if (this.currentState === MapState.SHOP) {
            this.changeState(MapState.IDLE);
        }
    }

    /**
     * 菜单关闭事件
     */
    onMenuClose() {
        if (this.currentState === MapState.MENU) {
            this.changeState(MapState.IDLE);
        }
    }

    /**
     * 战斗结束事件
     */
    onBattleEnd(data) {
        if (this.currentState === MapState.BATTLE) {
            this.changeState(MapState.IDLE);
        }
    }

    /**
     * 全局状态变化
     */
    onGlobalStateChange(data) {
        // 当从菜单返回时，同步地图状态
        if (data.oldState === GameState.MENU && data.newState === GameState.MAP) {
            if (this.currentState === MapState.MENU) {
                this.changeState(MapState.IDLE);
            }
        }
    }

    // ==================== 动画处理 ====================

    /**
     * 开始动画
     * @param {number} duration - 持续时间（秒）
     */
    startAnimation(duration) {
        this.animationTimer = duration;
        this.animationDuration = duration;
    }

    /**
     * 动画完成回调
     */
    onAnimationComplete() {
        if (this.currentState === MapState.PORTAL) {
            // 传送完成改由 MapSystem 显式通知
        } else if (this.currentState === MapState.ENCOUNTER) {
            // 遇敌动画完成，进入战斗
            const encounterData = this.stateData[MapState.ENCOUNTER];
            this.changeState(MapState.BATTLE, encounterData);
        }
    }

    /**
     * 获取动画进度（0-1）
     * @returns {number} 动画进度
     */
    getAnimationProgress() {
        if (this.animationDuration <= 0) return 1;
        return 1 - (this.animationTimer / this.animationDuration);
    }

    /**
     * 获取最近一次遇敌位置
     * @returns {Object|null} 遇敌位置 {x, y, mapId}
     */
    getLastEncounterPosition() {
        return this.lastEncounterPos;
    }

    // ==================== 公共方法 ====================

    /**
     * 开始传送
     * @param {Object} data - 传送数据
     */
    startPortal(data) {
        this.changeState(MapState.PORTAL, data);
    }

    /**
     * 完成传送
     */
    completePortal() {
        this.portalPending = false;
        this.portalData = null;

        if (this.currentState === MapState.PORTAL) {
            this.changeState(MapState.IDLE);
        }
    }

    /**
     * 开始遇敌
     * @param {Object} data - 遇敌数据
     */
    startEncounter(data) {
        this.changeState(MapState.ENCOUNTER, data);
    }

    /**
     * 开始交互
     * @param {Object} data - 交互数据
     */
    startInteract(data) {
        this.changeState(MapState.INTERACT, data);
    }

    /**
     * 打开菜单
     */
    openMenu() {
        if (this.canTransitionTo(MapState.MENU)) {
            this.changeState(MapState.MENU);
        }
    }

    /**
     * 关闭菜单
     */
    closeMenu() {
        if (this.currentState === MapState.MENU) {
            this.changeState(MapState.IDLE);
        }
    }

    /**
     * 获取当前状态
     * @returns {string} 当前状态
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * 获取状态数据
     * @param {string} state - 状态（可选，默认为当前状态）
     * @returns {Object} 状态数据
     */
    getStateData(state) {
        return this.stateData[state || this.currentState];
    }

    /**
     * 检查是否处于可以移动的状态
     * @returns {boolean} 是否可以移动
     */
    canMove() {
        return this.currentState === MapState.IDLE;
    }

    /**
     * 检查是否处于可以交互的状态
     * @returns {boolean} 是否可以交互
     */
    canInteract() {
        return this.currentState === MapState.IDLE;
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (!this.eventListeners[event]) return;
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {Object} data - 事件数据
     */
    emit(event, data) {
        if (!this.eventListeners[event]) return;
        this.eventListeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * 清理资源
     */
    destroy() {
        this.initialized = false;
        this.eventListeners = {};
    }
}

// 创建全局实例
const mapStateMachine = new MapStateMachine();
window.MapState = MapState;
window.mapStateMachine = mapStateMachine;
