/**
 * 游戏状态机 - 管理全局游戏状态
 */
class GameStateMachine {
    constructor() {
        this.state = null;
        this.stateStack = [];
        this.gameState = null;
    }

    /**
     * 初始化状态机
     * @param {Object} initialGameState - 初始游戏状态
     */
    init(initialGameState) {
        this.gameState = initialGameState;
        this.changeState(initialGameState.currentState);
    }

    /**
     * 切换到新状态
     * @param {string} newState - 新状态
     */
    changeState(newState) {
        const oldState = this.state;

        if (oldState) {
            this.onExitState(oldState);
        }

        this.state = newState;
        this.gameState.currentState = newState;

        this.onEnterState(newState, oldState);

        eventBus.emit(GameEvents.STATE_CHANGE, {
            newState: newState,
            oldState: oldState
        });
    }

    /**
     * 推入新状态（保留当前状态在栈中）
     * @param {string} newState - 新状态
     */
    pushState(newState) {
        if (this.state) {
            this.stateStack.push(this.state);
            this.gameState.stateStack = [...this.stateStack];
        }

        this.state = newState;
        this.gameState.currentState = newState;

        this.onEnterState(newState);

        eventBus.emit(GameEvents.PUSH_STATE, {
            newState: newState
        });
    }

    /**
     * 弹出当前状态，返回到上一个状态
     */
    popState() {
        if (this.stateStack.length === 0) {
            console.warn('State stack is empty, cannot pop');
            return;
        }

        const oldState = this.state;
        this.onExitState(oldState);

        this.state = this.stateStack.pop();
        this.gameState.currentState = this.state;
        this.gameState.stateStack = [...this.stateStack];

        this.onEnterState(this.state, oldState);

        eventBus.emit(GameEvents.POP_STATE, {
            newState: this.state,
            oldState: oldState
        });
    }

    /**
     * 进入状态时的回调
     * @param {string} state - 新状态
     * @param {string} oldState - 旧状态
     */
    onEnterState(state, oldState) {
        console.log(`Entering state: ${state} (from: ${oldState || 'none'})`);
    }

    /**
     * 退出状态时的回调
     * @param {string} state - 旧状态
     */
    onExitState(state) {
        console.log(`Exiting state: ${state}`);
    }

    /**
     * 获取当前状态
     * @returns {string} 当前状态
     */
    getCurrentState() {
        return this.state;
    }

    /**
     * 获取游戏状态
     * @returns {Object} 游戏状态
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * 更新游戏状态
     * @param {Object} updates - 要更新的字段
     */
    updateGameState(updates) {
        this.gameState = { ...this.gameState, ...updates };
        eventBus.emit(GameEvents.DATA_UPDATE, this.gameState);
    }

    /**
     * 更新玩家数据
     * @param {Object} updates - 要更新的玩家字段
     */
    updatePlayer(updates) {
        this.gameState.player = { ...this.gameState.player, ...updates };
        eventBus.emit(GameEvents.DATA_UPDATE, this.gameState);
    }
}

// 创建全局实例并暴露到 window 对象上
window.gameStateMachine = new GameStateMachine();
const gameStateMachine = window.gameStateMachine;
