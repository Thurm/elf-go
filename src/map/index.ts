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

        // 初始化地图状态机
        mapStateMachine.init();

        // 设置地图状态机的传送完成回调
        mapStateMachine.on('portalComplete', (data) => {
            this.handlePortalComplete(data);
        });

        this.initialized = true;
        console.log('MapSystem initialized');
    }

    /**
     * 处理传送完成
     * @param {Object} data - 传送数据
     */
    handlePortalComplete(data) {
        // 场景管理器已经通过事件处理了传送
        // 这里可以添加额外的传送后处理
    }

    /**
     * 更新地图系统
     * @param {number} deltaTime - 时间增量（秒）
     */
    update(deltaTime) {
        if (!this.initialized) return;

        // 更新地图过渡动画
        mapRenderer.updateTransition(deltaTime);

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
        // 如果正在过渡，忽略传送请求
        if (mapRenderer.isTransitioning()) {
            return;
        }

        // 加载目标地图（不立即切换，等待过渡动画）
        const targetMap = sceneManager.loadMap(mapId);
        if (!targetMap) return;

        // 开始地图过渡动画
        mapRenderer.setMap(targetMap, true);

        // 延迟传送玩家（在过渡中点时）
        setTimeout(() => {
            playerController.setMap(targetMap);
            playerController.teleportTo(x, y);

            // 更新游戏状态
            if (gameStateMachine) {
                gameStateMachine.updatePlayer({
                    location: { x: x, y: y }
                });
                gameStateMachine.updateGameState({
                    currentMapId: mapId
                });
            }
        }, 600); // 与过渡动画中点时间匹配
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
