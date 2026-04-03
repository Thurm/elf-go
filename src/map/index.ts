/**
 * 地图模块入口 - 整合所有地图子系统
 * 提供统一的初始化和更新接口
 */

/**
 * 地图系统整合类
 */
class MapSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;
        this.pendingPortalTransition = null;
    }

    /**
     * 初始化地图系统
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @param {CanvasRenderingContext2D} ctx - 2D 上下文
     * @param {Object} gameState - 游戏状态
     */
    init(canvas, ctx, gameState) {
        this.canvas = canvas;
        this.ctx = ctx;

        // 初始化场景管理器
        sceneManager.init(gameState.currentMapId);

        // 获取当前地图
        const currentMap = sceneManager.getCurrentMap();

        // 初始化地图渲染器
        initMapRenderer(canvas, ctx);
        mapRenderer.init(currentMap);

        // 初始化玩家控制器
        playerController.init(
            gameState.player.location,
            currentMap
        );
        mapRenderer.updateCamera(gameState.player.location.x, gameState.player.location.y, { snap: true });

        // 初始化地图状态机
        mapStateMachine.init();

        this.initialized = true;
        console.log('MapSystem initialized');
    }

    /**
     * 处理传送完成
     * @param {Object} data - 传送数据
     */
    handlePortalComplete(data) {
        // 传送完成由 MapSystem 自身编排，此处保留兼容入口
    }

    /**
     * 更新地图系统
     * @param {number} deltaTime - 时间增量（秒）
     */
    update(deltaTime) {
        if (!this.initialized) return;

        // 更新地图过渡动画
        const transitionEvents = mapRenderer.updateTransition(deltaTime);

        if (transitionEvents.midpointReached) {
            this.commitPortalTransition();
        }

        if (transitionEvents.completed) {
            this.finishPortalTransition();
        }

        // 如果正在过渡，暂停玩家移动
        if (mapRenderer.isTransitioning()) {
            return;
        }

        // 更新场景管理器
        sceneManager.update(deltaTime);

        // 更新玩家控制器
        playerController.update(deltaTime);

        // 更新地图状态机
        mapStateMachine.update(deltaTime);

        // 在状态机进入 PORTAL 后，由 MapSystem 统一发起场景切换
        if (!this.pendingPortalTransition && mapStateMachine.getCurrentState() === MapState.PORTAL) {
            const portalData = mapStateMachine.getStateData(MapState.PORTAL);
            this.startPortalTransition(portalData);

            if (mapRenderer.isTransitioning()) {
                return;
            }
        }

        // 更新摄像机位置
        const playerState = playerController.getPlayerState();
        mapRenderer.updateCamera(playerState.x, playerState.y);
    }

    /**
     * 渲染地图系统
     */
    render() {
        if (!this.initialized) return;

        // 收集渲染状态
        const playerState = playerController.getPlayerState();
        const sceneState = sceneManager.getRenderState();

        const renderState = {
            map: sceneState.map,
            player: playerState,
            npcs: sceneState.npcs,
            portals: sceneState.portals,
            shops: sceneState.shops,
            collisionMap: playerController.collisionMap,
            encounterPos: mapStateMachine.getLastEncounterPosition()
        };

        // 渲染地图
        mapRenderer.render(renderState);
    }

    /**
     * 获取当前地图
     * @returns {Object} 地图数据
     */
    getCurrentMap() {
        return sceneManager.getCurrentMap();
    }

    /**
     * 获取玩家状态
     * @returns {Object} 玩家状态
     */
    getPlayerState() {
        return playerController.getPlayerState();
    }

    /**
     * 传送玩家
     * @param {string} mapId - 目标地图ID
     * @param {number} x - 目标X坐标
     * @param {number} y - 目标Y坐标
     */
    teleportPlayer(mapId, x, y) {
        if (mapRenderer.isTransitioning() || this.pendingPortalTransition) {
            return;
        }

        this.startPortalTransition({
            toMap: mapId,
            toX: x,
            toY: y
        });
    }

    /**
     * 开始传送过渡
     * @param {Object} portalData - 传送数据
     */
    startPortalTransition(portalData) {
        if (!portalData || mapRenderer.isTransitioning() || this.pendingPortalTransition) {
            return;
        }

        const targetMap = sceneManager.getMapData(portalData.toMap);
        if (!targetMap) {
            if (mapStateMachine.getCurrentState() === MapState.PORTAL) {
                mapStateMachine.completePortal();
            }
            return;
        }

        this.pendingPortalTransition = {
            mapId: portalData.toMap,
            x: portalData.toX,
            y: portalData.toY,
            targetMap: targetMap,
            committed: false
        };

        playerController.setInputLocked(true);
        mapRenderer.setMap(targetMap, true);

        if (!mapRenderer.isTransitioning()) {
            this.commitPortalTransition();
            this.finishPortalTransition();
        }
    }

    /**
     * 在过渡中点提交地图切换
     */
    commitPortalTransition() {
        if (!this.pendingPortalTransition || this.pendingPortalTransition.committed) {
            return;
        }

        const transition = this.pendingPortalTransition;
        const loadedMap = sceneManager.loadMap(transition.mapId);
        if (!loadedMap) {
            this.pendingPortalTransition = null;
            playerController.setInputLocked(false);
            if (mapStateMachine.getCurrentState() === MapState.PORTAL) {
                mapStateMachine.completePortal();
            }
            return;
        }

        playerController.setMap(loadedMap);
        playerController.teleportTo(transition.x, transition.y);
        mapRenderer.updateCamera(transition.x, transition.y, { snap: true });

        if (gameStateMachine) {
            gameStateMachine.updatePlayer({
                location: { x: transition.x, y: transition.y }
            });
            gameStateMachine.updateGameState({
                currentMapId: transition.mapId
            });
        }

        transition.committed = true;
    }

    /**
     * 完成传送过渡
     */
    finishPortalTransition() {
        if (!this.pendingPortalTransition) {
            return;
        }

        this.pendingPortalTransition = null;
        playerController.setInputLocked(false);

        if (mapStateMachine.getCurrentState() === MapState.PORTAL) {
            mapStateMachine.completePortal();
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        if (playerController) {
            playerController.destroy();
        }
        if (mapStateMachine) {
            mapStateMachine.destroy();
        }
        if (sceneManager) {
            sceneManager.destroy();
        }
        this.initialized = false;
    }
}

// 创建全局实例
const mapSystem = new MapSystem();
