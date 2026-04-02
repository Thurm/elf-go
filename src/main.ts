/**
 * 游戏主入口 - 初始化并启动游戏
 */

type RuntimeSubsystem = object;
type SubsystemMap = Record<string, RuntimeSubsystem>;

// 游戏主类
class Game {
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    lastTime = 0;
    isRunning = false;
    subsystems: SubsystemMap = {};

    /**
     * 初始化游戏
     */
    init(): void {
        console.log('Initializing Pokemon RPG...');

        // 获取 Canvas
        const canvas = document.getElementById('game-canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('game-canvas not found or is not a canvas element');
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('failed to get 2d context from game-canvas');
        }

        this.canvas = canvas;
        this.ctx = ctx;

        // 设置 Canvas 尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 创建初始游戏状态
        const initialGameState = createInitialGameState();

        // 初始化状态机
        gameStateMachine.init(initialGameState);

        // 初始化子系统
        this.initSubsystems();

        // 初始化事件监听
        this.setupEventListeners();

        console.log('About to show title screen...');

        // 先渲染一次标题画面
        this.showTitleScreen();

        console.log('Game initialized successfully!');

        // 启动游戏循环以持续渲染
        this.startGameLoop();
    }

    /**
     * 初始化各子系统
     */
    initSubsystems(): void {
        console.log('Initializing subsystems...');

        // 背包管理器
        if (typeof inventoryManager !== 'undefined') {
            inventoryManager.init();
            this.registerSubsystem('inventory', inventoryManager);
            console.log('Inventory manager initialized');
        }

        // 对话系统
        if (typeof dialogSystem !== 'undefined') {
            dialogSystem.init();
            this.registerSubsystem('dialog', dialogSystem);
            console.log('Dialog system initialized');
        }

        // 任务管理器
        if (typeof questManager !== 'undefined') {
            questManager.init();
            this.registerSubsystem('quest', questManager);
            console.log('Quest manager initialized');
        }

        // 脚本解析器
        if (typeof scriptParser !== 'undefined') {
            // scriptParser 不需要 init，直接注册
            this.registerSubsystem('scriptParser', scriptParser);
            console.log('Script parser initialized');
        }

        // UI 管理器（用于对话框和通知）
        if (typeof uiManager !== 'undefined') {
            uiManager.init(this.canvas, this.ctx);
            this.registerSubsystem('ui', uiManager);
            console.log('UI manager initialized');
        }

        // 菜单 UI（用于主菜单、存档/读档等完整菜单系统）
        if (typeof menuUI !== 'undefined') {
            menuUI.init(this.canvas, this.ctx);
            this.registerSubsystem('menuUI', menuUI);
            console.log('MenuUI initialized');
        }

        // 战斗 UI
        if (typeof battleUI !== 'undefined') {
            battleUI.init(this.canvas, this.ctx);
            this.registerSubsystem('battleUI', battleUI);
            console.log('BattleUI initialized');
        }
    }

    /**
     * 初始化地图系统
     */
    initMapSystem(): void {
        if (typeof mapSystem !== 'undefined') {
            const gameState = gameStateMachine.getGameState();
            if (!this.canvas || !this.ctx) return;
            mapSystem.init(this.canvas, this.ctx, gameState);
            this.registerSubsystem('map', mapSystem);
            console.log('Map system initialized');
        }
    }

    /**
     * 调整 Canvas 尺寸
     */
    resizeCanvas(): void {
        if (!this.canvas) return;
        const container = document.getElementById('game-container');
        if (container) {
            // 使用固定尺寸确保画布正确渲染
            this.canvas.width = 800;
            this.canvas.height = 600;
        }
    }

    /**
     * 设置事件监听
     */
    setupEventListeners(): void {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 游戏状态变化事件
        eventBus.on(GameEvents.STATE_CHANGE, (data) => {
            console.log('State changed:', data);
        });

        // 数据更新事件
        eventBus.on(GameEvents.DATA_UPDATE, (data) => {
            // 可以在这里自动保存
            // saveManager.saveGame(data, 1);
        });
    }

    /**
     * 处理键盘按下
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e: KeyboardEvent | { key: string; type?: string; preventDefault(): void }): void {
        const currentState = gameStateMachine.getCurrentState();

        switch (currentState) {
            case GameState.TITLE:
                if (e.key === 'Enter' || e.key === ' ') {
                    this.startNewGame();
                }
                break;
            case GameState.MENU:
            case GameState.SAVE:
            case GameState.LOAD:
                // 菜单状态：优先让 menuUI 处理输入（完整菜单系统）
                if (this.subsystems.menuUI && typeof menuUI !== 'undefined') {
                    const handled = menuUI.handleInput(e);
                    if (handled) {
                        e.preventDefault();
                        return;
                    }
                }
                break;
            case GameState.MAP:
                if (e.key === 'Escape') {
                    // 如果菜单已经打开，就关闭它；否则打开菜单
                    if (this.subsystems.menuUI && typeof menuUI !== 'undefined') {
                        if (menuUI.isOpen()) {
                            menuUI.closeMenu();
                        } else {
                            gameStateMachine.pushState(GameState.MENU);
                            menuUI.openMenu('main');
                        }
                    }
                }
                // 玩家控制器会处理其他按键
                break;
            case GameState.DIALOG:
                if ((this.subsystems.ui || this.subsystems.uiManager) && typeof uiManager !== 'undefined') {
                    const handled = uiManager.handleInput(e);
                    if (handled) {
                        e.preventDefault();
                        return;
                    }
                }

                if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
                    eventBus.emit(GameEvents.DIALOG_NEXT);
                    e.preventDefault();
                    return;
                }

                if (e.key >= '1' && e.key <= '9') {
                    const choiceIndex = parseInt(e.key) - 1;
                    eventBus.emit(GameEvents.DIALOG_CHOICE, { choiceIndex: choiceIndex });
                    e.preventDefault();
                }
                break;
            case GameState.BATTLE:
                // 战斗状态：优先让 battleUI 处理输入
                if (this.subsystems.battleUI && typeof battleUI !== 'undefined') {
                    const handled = battleUI.handleInput(e);
                    if (handled) {
                        e.preventDefault();
                    }
                }
                break;
        }
    }

    /**
     * 处理键盘松开
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyUp(_e: KeyboardEvent): void {
        // 子类或子系统处理
    }

    /**
     * 显示标题画面
     */
    showTitleScreen(): void {
        if (!this.ctx || !this.canvas) return;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('宝可梦风格 RPG', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '20px monospace';
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('按 Enter 开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    /**
     * 开始新游戏
     */
    startNewGame(): void {
        console.log('Starting new game...');
        gameStateMachine.changeState(GameState.MAP);

        // 初始化地图系统
        this.initMapSystem();

        this.startGameLoop();
    }

    /**
     * 加载存档
     * @param {number} slot - 存档槽位
     */
    loadGame(slot: number): void {
        const gameState = saveManager.loadGame(slot);
        if (gameState) {
            gameStateMachine.init(gameState);
            // 初始化地图系统
            this.initMapSystem();
            this.startGameLoop();
        }
    }

    /**
     * 启动游戏主循环
     */
    startGameLoop(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * 游戏主循环
     * @param {number} time - 当前时间
     */
    gameLoop(time: number): void {
        if (!this.isRunning) return;

        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // 更新
        this.update(deltaTime);

        // 渲染
        this.render();

        // 下一帧
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * 更新游戏逻辑
     * @param {number} deltaTime - 距离上一帧的时间（秒）
     */
    update(deltaTime: number): void {
        const gameState = gameStateMachine.getGameState();
        if (!gameState) return;
        gameState.gameTime += deltaTime;

        // 更新各子系统
        for (const subsystem of Object.values(this.subsystems)) {
            const updatable = subsystem as UpdatableSubsystem;
            if (updatable.update) {
                updatable.update(deltaTime);
            }
        }
    }

    /**
     * 渲染游戏画面
     */
    render(): void {
        if (!this.ctx || !this.canvas) return;
        const currentState = gameStateMachine.getCurrentState();

        // 清屏
        this.ctx.fillStyle = '#202020';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 根据状态渲染
        switch (currentState) {
            case GameState.TITLE:
                this.showTitleScreen();
                break;
            case GameState.MAP:
                this.renderMapState();
                break;
            case GameState.SHOP:
                this.renderMapState();
                break;
            case GameState.BATTLE:
                this.renderBattleState();
                break;
            case GameState.DIALOG:
                this.renderDialogState();
                break;
            case GameState.MENU:
            case GameState.SAVE:
            case GameState.LOAD:
                this.renderMenuState();
                break;
            default:
                this.renderDefaultState();
        }
    }

    /**
     * 渲染地图状态
     */
    renderMapState(): void {
        if (!this.ctx || !this.canvas) return;
        // 如果地图系统已初始化，使用地图系统渲染
        if (this.subsystems.map && typeof mapSystem !== 'undefined') {
            mapSystem.render();
        } else {
            // 备用渲染
            const gameState = gameStateMachine.getGameState();
            if (!gameState) return;
            this.ctx.fillStyle = '#3a5f0b';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('地图场景', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px monospace';
            this.ctx.fillText(`当前地图: ${gameState.currentMapId}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
            this.ctx.fillText('方向键/WASD 移动', this.canvas.width / 2, this.canvas.height / 2 + 55);
            this.ctx.fillText('空格/Enter 交互', this.canvas.width / 2, this.canvas.height / 2 + 80);
            this.ctx.fillText('ESC 打开菜单', this.canvas.width / 2, this.canvas.height / 2 + 105);
        }
    }

    /**
     * 渲染战斗状态
     */
    renderBattleState(): void {
        if (!this.ctx || !this.canvas) return;
        // 如果战斗UI已初始化，使用战斗UI渲染
        if (this.subsystems.battleUI && typeof battleUI !== 'undefined') {
            battleUI.render();
        } else {
            // 备用渲染
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('战斗场景', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    /**
     * 渲染对话状态
     */
    renderDialogState(): void {
        if (!this.ctx || !this.canvas) return;
        console.log('[Game] renderDialogState 被调用');
        // 先渲染地图背景
        if (this.subsystems.map && typeof mapSystem !== 'undefined') {
            mapSystem.render();
        }

        // UI 管理器会渲染对话UI
        if (typeof uiManager !== 'undefined') {
            console.log('[Game] 调用 uiManager.render 渲染对话');
            uiManager.render();
        } else {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('对话场景', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    /**
     * 渲染菜单状态
     */
    renderMenuState(): void {
        // 先渲染地图背景
        if (this.subsystems.map && typeof mapSystem !== 'undefined') {
            mapSystem.render();
        }

        // 使用 MenuUI 渲染菜单（完整菜单系统：主菜单、存档/读档、设置等）
        if (this.subsystems.menuUI && typeof menuUI !== 'undefined') {
            menuUI.render();
        }
    }

    /**
     * 渲染默认状态
     */
    renderDefaultState(): void {
        if (!this.ctx || !this.canvas) return;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('未知状态', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 注册子系统
     * @param {string} name - 子系统名称
     * @param {Object} subsystem - 子系统实例
     */
    registerSubsystem(name: string, subsystem: RuntimeSubsystem): void {
        this.subsystems[name] = subsystem;
        // 不再重复调用 init，因为 initSubsystems 已经调用过了
    }

    /**
     * 停止游戏
     */
    stop(): void {
        this.isRunning = false;
    }
}

// 创建全局游戏实例
const game = new Game();
window.game = game;

// 直接初始化游戏（DOM 应该已经就绪，因为脚本在 body 底部）
game.init();
