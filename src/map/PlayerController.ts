/**
 * 玩家控制器 - 处理键盘输入、角色移动、碰撞检测、NPC交互
 */

// 玩家移动速度（图块/秒）
const MOVE_SPEED = 4;

// 碰撞类型
const CollisionType = {
    FREE: 0,       // 可自由通过
    BLOCKED: 1,    // 完全阻挡（墙、建筑）
    WATER: 2,      // 水体（不可通过）
    PORTAL: 3,     // 传送点
    INTERACTION: 4, // 交互点（NPC、门）
    GRASS: 5       // 草丛（可通过，可能遇敌）
};

// 方向枚举
const Direction = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

// 方向向量
const DirectionVectors = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
};

/**
 * 玩家控制器类
 */
class PlayerController {
    constructor() {
        // 玩家状态
        this.player = {
            x: 15,        // 整数图块X坐标
            y: 15,        // 整数图块Y坐标
            realX: 15,    // 精确X坐标（用于平滑移动）
            realY: 15,    // 精确Y坐标（用于平滑移动）
            direction: 'down',
            moving: false
        };

        // 输入状态
        this.inputState = {
            up: false,
            down: false,
            left: false,
            right: false,
            interact: false
        };

        // 移动状态
        this.moveState = {
            targetX: 15,
            targetY: 15,
            isMoving: false,
            moveProgress: 0
        };

        // 当前地图数据引用
        this.currentMap = null;

        // NPC 列表
        this.npcs = [];

        // 碰撞数据缓存
        this.collisionMap = [];

        // 事件监听器
        this.keyDownHandler = null;
        this.keyUpHandler = null;

        // 是否已初始化
        this.initialized = false;

        // 交互冷却（防止连续交互）
        this.interactCooldown = 0;

        // 传送/过渡期间输入锁
        this.inputLocked = false;
    }

    /**
     * 初始化玩家控制器
     * @param {Object} initialPosition - 初始位置 {x, y}
     * @param {Object} mapData - 初始地图数据
     */
    init(initialPosition, mapData) {
        this.player.x = initialPosition.x;
        this.player.y = initialPosition.y;
        this.player.realX = initialPosition.x;
        this.player.realY = initialPosition.y;
        this.moveState.targetX = initialPosition.x;
        this.moveState.targetY = initialPosition.y;

        this.setMap(mapData);
        this.setupInputHandlers();

        this.initialized = true;
        console.log('PlayerController initialized at', initialPosition);
        console.log('[PlayerController] Initial map NPCs:', this.npcs);
    }

    /**
     * 设置当前地图
     * @param {Object} mapData - 地图数据
     */
    setMap(mapData) {
        this.currentMap = mapData;
        // 保存地图数据中的 NPC 到本地缓存，但主要依赖 SceneManager 获取最新数据
        this.npcs = mapData?.npcs || [];
        console.log('[PlayerController] Map set to', mapData?.id, 'with', this.npcs.length, 'NPCs');
        this.buildCollisionMap();
    }

    /**
     * 设置输入锁状态
     * @param {boolean} locked - 是否锁定
     */
    setInputLocked(locked) {
        this.inputLocked = locked;

        if (locked) {
            this.clearInputState();
            this.moveState.isMoving = false;
            this.moveState.moveProgress = 0;
            this.player.moving = false;
        }
    }

    /**
     * 清空输入状态
     */
    clearInputState() {
        this.inputState.up = false;
        this.inputState.down = false;
        this.inputState.left = false;
        this.inputState.right = false;
        this.inputState.interact = false;
    }

    /**
     * 构建碰撞地图
     */
    buildCollisionMap() {
        if (!this.currentMap) {
            this.collisionMap = [];
            return;
        }

        const width = this.currentMap.width;
        const height = this.currentMap.height;

        // 初始化碰撞地图
        this.collisionMap = [];
        for (let y = 0; y < height; y++) {
            this.collisionMap[y] = [];
            for (let x = 0; x < width; x++) {
                this.collisionMap[y][x] = CollisionType.FREE;
            }
        }

        // 从碰撞层加载数据
        const collisionLayer = this.currentMap.layers?.find(l => l.name === 'collision');
        if (collisionLayer && collisionLayer.data) {
            for (let y = 0; y < height && y < collisionLayer.data.length; y++) {
                for (let x = 0; x < width && x < collisionLayer.data[y].length; x++) {
                    this.collisionMap[y][x] = collisionLayer.data[y][x];
                }
            }
        }

        // 添加地图边界阻挡
        this.addMapBoundaryCollision(width, height);

        // 根据地图ID添加预设碰撞
        this.addPresetCollision();

        // 添加NPC碰撞
        this.addNPCCollision();

        // 添加传送点
        this.addPortalCollision();
    }

    /**
     * 添加地图边界碰撞
     */
    addMapBoundaryCollision(width, height) {
        for (let x = 0; x < width; x++) {
            this.collisionMap[0][x] = CollisionType.BLOCKED;
            this.collisionMap[height - 1][x] = CollisionType.BLOCKED;
        }
        for (let y = 0; y < height; y++) {
            this.collisionMap[y][0] = CollisionType.BLOCKED;
            this.collisionMap[y][width - 1] = CollisionType.BLOCKED;
        }
    }

    /**
     * 添加预设碰撞（根据地图ID）
     */
    addPresetCollision() {
        if (!this.currentMap) return;

        const mapId = this.currentMap.id;

        if (mapId === 'town_01') {
            // 新手村预设碰撞
            this.setRectCollision(3, 2, 5, 5, CollisionType.BLOCKED);
            this.setRectCollision(12, 10, 3, 3, CollisionType.BLOCKED);
            this.setRectCollision(3, 2, 5, 5, CollisionType.BLOCKED);
            this.setRectCollision(3, 2, 5, 5, CollisionType.BLOCKED);

            // 池塘（水体）
            this.setRectCollision(3, 2, 5, 5, CollisionType.WATER);

            // 树木
            const treePositions = [
                [0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1],
                [7, 0], [8, 0], [9, 0], [7, 1], [8, 1], [9, 1],
                [0, 7], [1, 7], [2, 7], [7, 7], [8, 7], [9, 7]
            ];
            treePositions.forEach(([x, y]) => {
                if (this.collisionMap[y] && this.collisionMap[y][x] !== undefined) {
                    this.collisionMap[y][x] = CollisionType.BLOCKED;
                }
            });

            // 重置入口和道路为可通过
            this.collisionMap[1][15] = CollisionType.FREE;
            for (let x = 0; x < 32; x++) {
                if (this.collisionMap[15]) {
                    this.collisionMap[15][x] = CollisionType.FREE;
                }
            }
            for (let y = 0; y < 8; y++) {
                if (this.collisionMap[y]) {
                    this.collisionMap[y][15] = CollisionType.FREE;
                    this.collisionMap[y][16] = CollisionType.FREE;
                }
            }

            // NPC位置设为交互点
            this.collisionMap[8][10] = CollisionType.INTERACTION;
            this.collisionMap[10][12] = CollisionType.INTERACTION;

            // ========== 最后设置传送点（避免被前面的代码覆盖） ==========
            // 村长家门（可交互传送点）- 位置 (15, 0)
            this.collisionMap[0][15] = CollisionType.PORTAL;
            // 出村路口 - 位置 (0, 15)
            this.collisionMap[15][0] = CollisionType.PORTAL;

            // 我的家位置改为水池（不可通过）
            this.setRectCollision(2, 3, 5, 4, CollisionType.WATER);
        }
        else if (mapId === 'route_01') {
            // 1号道路预设碰撞
            this.setRectCollision(0, 0, 32, 3, CollisionType.BLOCKED);
            this.setRectCollision(0, 29, 32, 3, CollisionType.BLOCKED);
            this.setRectCollision(0, 0, 2, 32, CollisionType.BLOCKED);
            this.setRectCollision(30, 0, 2, 32, CollisionType.BLOCKED);

            // 重置入口
            this.collisionMap[15][0] = CollisionType.PORTAL;
            this.collisionMap[15][31] = CollisionType.PORTAL;

            // 道路保持可通过
            for (let x = 0; x < 32; x++) {
                this.collisionMap[15][x] = CollisionType.FREE;
            }

            // 草丛区域
            this.setRectCollision(2, 10, 4, 5, CollisionType.GRASS);
            this.setRectCollision(9, 10, 4, 5, CollisionType.GRASS);
            this.setRectCollision(18, 10, 4, 5, CollisionType.GRASS);
            this.setRectCollision(25, 10, 5, 5, CollisionType.GRASS);
        }
        else if (mapId === 'house_01') {
            // 村长家预设碰撞
            this.setRectCollision(0, 0, 10, 1, CollisionType.BLOCKED);
            this.setRectCollision(0, 7, 10, 1, CollisionType.BLOCKED);
            this.setRectCollision(0, 0, 1, 8, CollisionType.BLOCKED);
            this.setRectCollision(9, 0, 1, 8, CollisionType.BLOCKED);

            // 门
            this.collisionMap[7][5] = CollisionType.PORTAL;

            // 村长位置
            this.collisionMap[3][5] = CollisionType.INTERACTION;
        }
        else if (mapId === 'house_my') {
            // 我的家预设碰撞
            this.setRectCollision(0, 0, 10, 1, CollisionType.BLOCKED);
            this.setRectCollision(0, 7, 10, 1, CollisionType.BLOCKED);
            this.setRectCollision(0, 0, 1, 8, CollisionType.BLOCKED);
            this.setRectCollision(9, 0, 1, 8, CollisionType.BLOCKED);

            // 门
            this.collisionMap[7][4] = CollisionType.PORTAL;
        }
    }

    /**
     * 设置矩形区域碰撞
     */
    setRectCollision(startX, startY, width, height, type) {
        for (let y = startY; y < startY + height; y++) {
            for (let x = startX; x < startX + width; x++) {
                if (this.collisionMap[y] && this.collisionMap[y][x] !== undefined) {
                    this.collisionMap[y][x] = type;
                }
            }
        }
    }

    /**
     * 添加NPC碰撞
     */
    addNPCCollision() {
        this.npcs.forEach(npc => {
            if (this.collisionMap[npc.y] && this.collisionMap[npc.y][npc.x] !== undefined) {
                if (this.collisionMap[npc.y][npc.x] === CollisionType.FREE) {
                    this.collisionMap[npc.y][npc.x] = CollisionType.INTERACTION;
                }
            }
        });
    }

    /**
     * 添加传送点碰撞
     */
    addPortalCollision() {
        if (!this.currentMap?.portals) return;

        this.currentMap.portals.forEach(portal => {
            if (this.collisionMap[portal.y] && this.collisionMap[portal.y][portal.x] !== undefined) {
                this.collisionMap[portal.y][portal.x] = CollisionType.PORTAL;
            }
        });
    }

    /**
     * 设置键盘事件监听
     */
    setupInputHandlers() {
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);

        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    /**
     * 处理键盘按下
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.inputState.up = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.inputState.down = true;
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.inputState.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.inputState.right = true;
                e.preventDefault();
                break;
            case ' ':
            case 'Enter':
            case 'z':
            case 'Z':
                this.inputState.interact = true;
                e.preventDefault();
                break;
        }
    }

    /**
     * 处理键盘松开
     */
    handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.inputState.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.inputState.down = false;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.inputState.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.inputState.right = false;
                break;
            case ' ':
            case 'Enter':
            case 'z':
            case 'Z':
                this.inputState.interact = false;
                break;
        }
    }

    /**
     * 更新玩家状态
     * @param {number} deltaTime - 时间增量（秒）
     */
    update(deltaTime) {
        if (!this.initialized) return;

        if (this.inputLocked) {
            this.player.moving = false;
            return;
        }

        // 检查全局游戏状态（菜单、对话、战斗等状态下不能移动）
        if (typeof gameStateMachine !== 'undefined' && gameStateMachine.getCurrentState) {
            const gameState = gameStateMachine.getCurrentState();
            if (gameState !== GameState.MAP) {
                this.moveState.isMoving = false;
                this.moveState.moveProgress = 0;
                return;
            }
        }

        // 检查地图状态
        if (typeof mapStateMachine !== 'undefined' && mapStateMachine.getCurrentState) {
            const mapState = mapStateMachine.getCurrentState();
            if (mapState !== MapState.IDLE && mapState !== MapState.MOVING) {
                this.moveState.isMoving = false;
                this.moveState.moveProgress = 0;
                return;
            }
        }

        // 更新交互冷却
        if (this.interactCooldown > 0) {
            this.interactCooldown -= deltaTime;
        }

        // 如果正在移动中，继续移动
        if (this.moveState.isMoving) {
            this.continueMove(deltaTime);
            return;
        }

        // 获取移动方向
        const direction = this.getMoveDirection();

        if (direction) {
            // 设置玩家朝向
            this.player.direction = direction;

            // 尝试移动
            this.tryMove(direction);
        }

        // 检查交互
        if (this.inputState.interact && this.interactCooldown <= 0) {
            this.tryInteract();
        }

        // 更新玩家状态
        this.player.moving = this.moveState.isMoving;
    }

    /**
     * 获取移动方向
     * @returns {string|null} 方向或null
     */
    getMoveDirection() {
        // 优先级：上 > 下 > 左 > 右
        if (this.inputState.up) return Direction.UP;
        if (this.inputState.down) return Direction.DOWN;
        if (this.inputState.left) return Direction.LEFT;
        if (this.inputState.right) return Direction.RIGHT;
        return null;
    }

    /**
     * 尝试移动
     * @param {string} direction - 移动方向
     */
    tryMove(direction) {
        const vec = DirectionVectors[direction];
        const newX = this.player.x + vec.x;
        const newY = this.player.y + vec.y;

        // 检查碰撞
        const collisionType = this.getCollisionAt(newX, newY);

        if (collisionType === CollisionType.BLOCKED || collisionType === CollisionType.WATER) {
            // 无法通过
            return;
        }

        if (collisionType === CollisionType.INTERACTION) {
            // 检查是否是NPC，如果是则只转向不移动
            const npc = this.getNPCAt(newX, newY);
            if (npc) {
                return;
            }
        }

        // 开始移动
        this.startMove(newX, newY, collisionType);
    }

    /**
     * 开始移动
     */
    startMove(targetX, targetY, collisionType) {
        this.moveState.targetX = targetX;
        this.moveState.targetY = targetY;
        this.moveState.isMoving = true;
        this.moveState.moveProgress = 0;
        this.moveState.collisionType = collisionType;
    }

    /**
     * 继续移动
     */
    continueMove(deltaTime) {
        this.moveState.moveProgress += deltaTime * MOVE_SPEED;

        if (this.moveState.moveProgress >= 1) {
            // 移动完成
            this.finishMove();
        } else {
            // 插值计算位置
            this.player.realX = this.player.x + (this.moveState.targetX - this.player.x) * this.moveState.moveProgress;
            this.player.realY = this.player.y + (this.moveState.targetY - this.player.y) * this.moveState.moveProgress;
        }
    }

    /**
     * 完成移动
     */
    finishMove() {
        const oldX = this.player.x;
        const oldY = this.player.y;

        // 更新位置
        this.player.x = this.moveState.targetX;
        this.player.y = this.moveState.targetY;
        this.player.realX = this.player.x;
        this.player.realY = this.player.y;

        // 重置移动状态
        const collisionType = this.moveState.collisionType;
        this.moveState.isMoving = false;
        this.moveState.moveProgress = 0;

        // 发布移动事件
        eventBus.emit(GameEvents.MAP_PLAYER_MOVE, {
            x: this.player.x,
            y: this.player.y,
            oldX: oldX,
            oldY: oldY
        });

        // 检查特殊碰撞类型
        if (collisionType === CollisionType.PORTAL) {
            this.handlePortal();
        } else if (collisionType === CollisionType.GRASS) {
            this.checkEncounter();
        }
    }

    /**
     * 获取指定位置的碰撞类型
     */
    getCollisionAt(x, y) {
        if (!this.collisionMap[y]) return CollisionType.BLOCKED;
        if (this.collisionMap[y][x] === undefined) return CollisionType.BLOCKED;
        return this.collisionMap[y][x];
    }

    /**
     * 获取指定位置的NPC
     */
    getNPCAt(x, y) {
        // 优先从 SceneManager 获取最新的 NPC 数据（SceneManager 是权威数据源）
        if (typeof sceneManager !== 'undefined' && sceneManager.getNPCAt) {
            return sceneManager.getNPCAt(x, y);
        }
        // 降级：使用本地缓存
        return this.npcs.find(npc => npc.x === x && npc.y === y);
    }

    /**
     * 处理传送点
     */
    handlePortal() {
        if (this.inputLocked || !this.currentMap?.portals) return;

        const portal = this.currentMap.portals.find(
            p => p.x === this.player.x && p.y === this.player.y
        );

        if (portal) {
            eventBus.emit(GameEvents.MAP_PORTAL, {
                fromMap: this.currentMap.id,
                toMap: portal.targetMap,
                toX: portal.targetX,
                toY: portal.targetY
            });
        }
    }

    /**
     * 检查遇敌
     */
    checkEncounter() {
        if (!this.currentMap?.encounter?.enabled) return;

        if (typeof gameStateMachine !== 'undefined' && gameStateMachine.getCurrentState) {
            if (gameStateMachine.getCurrentState() !== GameState.MAP) {
                return;
            }
        }

        if (typeof mapStateMachine !== 'undefined' && mapStateMachine.getCurrentState) {
            const mapState = mapStateMachine.getCurrentState();
            if (mapState !== MapState.IDLE && mapState !== MapState.MOVING) {
                return;
            }
        }

        const encounterRate = this.currentMap.encounter.rate || 0.15;

        if (Math.random() < encounterRate) {
            eventBus.emit(GameEvents.MAP_ENCOUNTER, {
                monsters: this.currentMap.encounter.monsters,
                x: this.player.x,
                y: this.player.y,
                mapId: this.currentMap?.id
            });
        }
    }

    /**
     * 尝试交互
     */
    tryInteract() {
        if (this.inputLocked) return;

        console.log('[PlayerController] tryInteract called');
        this.interactCooldown = 0.3; // 300ms 冷却

        // 获取玩家前方位置
        const vec = DirectionVectors[this.player.direction];
        const frontX = this.player.x + vec.x;
        const frontY = this.player.y + vec.y;

        console.log('[PlayerController] Player direction:', this.player.direction);
        console.log('[PlayerController] Front position:', frontX, frontY);
        console.log('[PlayerController] Current position:', this.player.x, this.player.y);

        // 检查前方NPC
        const npc = this.getNPCAt(frontX, frontY);
        console.log('[PlayerController] Found NPC:', npc);

        if (npc) {
            console.log('[PlayerController] Emitting MAP_INTERACT event for NPC:', npc);
            eventBus.emit(GameEvents.MAP_INTERACT, {
                type: 'npc',
                npcId: npc.id,
                dialogId: npc.dialogId,
                shopId: npc.shopId
            });
            return;
        }

        // 检查当前位置传送点（用于进门）
        const portal = this.currentMap?.portals?.find(
            p => p.x === this.player.x && p.y === this.player.y
        );
        if (portal) {
            eventBus.emit(GameEvents.MAP_PORTAL, {
                fromMap: this.currentMap.id,
                toMap: portal.targetMap,
                toX: portal.targetX,
                toY: portal.targetY
            });
            return;
        }

        // 检查前方传送点
        const frontPortal = this.currentMap?.portals?.find(
            p => p.x === frontX && p.y === frontY
        );
        if (frontPortal) {
            eventBus.emit(GameEvents.MAP_PORTAL, {
                fromMap: this.currentMap.id,
                toMap: frontPortal.targetMap,
                toX: frontPortal.targetX,
                toY: frontPortal.targetY
            });
        }
    }

    /**
     * 传送玩家到指定位置
     * @param {number} x - 目标X坐标
     * @param {number} y - 目标Y坐标
     */
    teleportTo(x, y) {
        this.player.x = x;
        this.player.y = y;
        this.player.realX = x;
        this.player.realY = y;
        this.moveState.targetX = x;
        this.moveState.targetY = y;
        this.moveState.isMoving = false;
        this.moveState.moveProgress = 0;
    }

    /**
     * 获取玩家状态（用于渲染）
     * @returns {Object} 玩家状态
     */
    getPlayerState() {
        return {
            x: this.player.realX,
            y: this.player.realY,
            tileX: this.player.x,
            tileY: this.player.y,
            direction: this.player.direction,
            moving: this.moveState.isMoving
        };
    }

    /**
     * 获取NPC列表
     * @returns {Array} NPC列表
     */
    getNPCs() {
        return this.npcs.map(npc => ({
            id: npc.id,
            x: npc.x,
            y: npc.y,
            direction: npc.direction || 'down',
            dialogId: npc.dialogId,
            shopId: npc.shopId
        }));
    }

    /**
     * 获取当前地图交互提示
     * @returns {string} HUD 交互提示
     */
    getInteractionHint() {
        if (this.inputLocked) {
            return '切换中...';
        }

        const vec = DirectionVectors[this.player.direction] || { x: 0, y: 0 };
        const frontX = this.player.x + vec.x;
        const frontY = this.player.y + vec.y;

        const npc = this.getNPCAt(frontX, frontY);
        if (npc) {
            return npc.shopId ? 'Z 商店 / 对话 · Esc 菜单' : 'Z 对话 · Esc 菜单';
        }

        const portal = this.currentMap?.portals?.find((p) =>
            (p.x === this.player.x && p.y === this.player.y) ||
            (p.x === frontX && p.y === frontY)
        );
        if (portal) {
            return 'Z 进入区域 · Esc 菜单';
        }

        return 'Z 交互 · Esc 菜单';
    }

    /**
     * 清理资源
     */
    destroy() {
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }
        this.initialized = false;
    }
}

// 创建全局实例并暴露到 window 对象上，这样在浏览器的 console 中可以访问
window.playerController = new PlayerController();
const playerController = window.playerController;

// 暴露常量到 window
window.CollisionType = CollisionType;
window.Direction = Direction;
window.DirectionVectors = DirectionVectors;
window.MOVE_SPEED = MOVE_SPEED;
