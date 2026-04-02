/**
 * 场景管理器 - 负责地图加载/切换、NPC管理、传送点处理
 */

/**
 * 场景管理器类
 */
class SceneManager {
    constructor() {
        // 当前地图数据
        this.currentMap = null;
        this.currentMapId = null;

        // 已加载的地图缓存
        this.mapCache = {};

        // NPC实例管理
        this.npcs = [];

        // 传送点列表
        this.portals = [];

        // 商店列表
        this.shops = [];

        // 是否已初始化
        this.initialized = false;

        // 场景切换回调
        this.onSceneChangeCallbacks = [];
    }

    /**
     * 初始化场景管理器
     * @param {string} initialMapId - 初始地图ID
     */
    init(initialMapId = 'town_01') {
        // 预加载所有地图模板
        this.preloadMapTemplates();

        // 加载初始地图
        this.loadMap(initialMapId);

        // 设置事件监听
        this.setupEventListeners();

        this.initialized = true;
        console.log('SceneManager initialized with map:', initialMapId);
    }

    /**
     * 预加载地图模板
     */
    preloadMapTemplates() {
        // 将 MapTemplates 中的地图数据加载到缓存
        if (typeof MapTemplates !== 'undefined') {
            for (const [mapId, mapData] of Object.entries(MapTemplates)) {
                this.mapCache[mapId] = this.buildMapData(mapData);
            }
        }
    }

    /**
     * 构建完整地图数据
     * @param {Object} template - 地图模板
     * @returns {Object} 完整地图数据
     */
    buildMapData(template) {
        // 深拷贝模板
        const mapData = JSON.parse(JSON.stringify(template));

        // 确保图层数据存在
        if (!mapData.layers) {
            mapData.layers = [];
        }

        // 确保各图层数据初始化
        this.ensureLayerData(mapData, 'ground', mapData.width, mapData.height);
        this.ensureLayerData(mapData, 'objects', mapData.width, mapData.height);
        this.ensureLayerData(mapData, 'collision', mapData.width, mapData.height);
        this.ensureLayerData(mapData, 'overlay', mapData.width, mapData.height);

        return mapData;
    }

    /**
     * 确保图层数据存在且尺寸正确
     */
    ensureLayerData(mapData, layerName, width, height) {
        let layer = mapData.layers.find(l => l.name === layerName);
        if (!layer) {
            layer = { name: layerName, data: [] };
            mapData.layers.push(layer);
        }

        // 初始化图层数据
        if (!layer.data || layer.data.length !== height) {
            layer.data = [];
            for (let y = 0; y < height; y++) {
                layer.data[y] = [];
                for (let x = 0; x < width; x++) {
                    layer.data[y][x] = 0;
                }
            }
        }
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 监听传送事件
        eventBus.on(GameEvents.MAP_PORTAL, (data) => {
            this.handlePortal(data);
        });
    }

    /**
     * 加载地图
     * @param {string} mapId - 地图ID
     * @param {Object} options - 加载选项
     * @returns {Object} 加载的地图数据
     */
    loadMap(mapId, options = {}) {
        console.log(`Loading map: ${mapId}`);

        // 检查缓存
        let mapData = this.mapCache[mapId];

        // 如果缓存中没有，尝试从模板加载
        if (!mapData && typeof MapTemplates !== 'undefined' && MapTemplates[mapId]) {
            mapData = this.buildMapData(MapTemplates[mapId]);
            this.mapCache[mapId] = mapData;
        }

        if (!mapData) {
            console.error(`Map not found: ${mapId}`);
            return null;
        }

        const oldMapId = this.currentMapId;
        const oldMap = this.currentMap;

        // 触发地图卸载事件
        if (oldMap) {
            this.onUnloadMap(oldMap);
        }

        // 设置当前地图
        this.currentMap = mapData;
        this.currentMapId = mapId;

        // 解析地图元素
        this.parseMapElements(mapData);

        // 触发地图加载事件
        this.onLoadMap(mapData, oldMap);

        // 通知场景变化
        this.notifySceneChange(mapData, oldMap);

        return mapData;
    }

    /**
     * 解析地图元素（NPC、传送点、商店等）
     * @param {Object} mapData - 地图数据
     */
    parseMapElements(mapData) {
        // 解析 NPC 并保存回 mapData，确保 PlayerController 能获取
        this.npcs = (mapData.npcs || []).map(npcData => ({
            id: npcData.id,
            x: npcData.x,
            y: npcData.y,
            direction: npcData.direction || 'down',
            dialogId: npcData.dialogId,
            shopId: npcData.shopId,
            data: npcData
        }));

        // 关键：将解析后的 NPC 写回 mapData，确保 PlayerController 能同步
        mapData.npcs = this.npcs;

        // 解析传送点
        this.portals = (mapData.portals || []).map(portalData => ({
            x: portalData.x,
            y: portalData.y,
            targetMap: portalData.targetMap,
            targetX: portalData.targetX,
            targetY: portalData.targetY,
            data: portalData
        }));

        // 写回 mapData
        mapData.portals = this.portals;

        // 解析商店
        this.shops = (mapData.shops || []).map(shopData => ({
            id: shopData.id,
            x: shopData.x,
            y: shopData.y,
            data: shopData
        }));

        // 写回 mapData
        mapData.shops = this.shops;
    }

    /**
     * 地图加载回调
     * @param {Object} newMap - 新地图
     * @param {Object} oldMap - 旧地图
     */
    onLoadMap(newMap, oldMap) {
        console.log(`Map loaded: ${newMap.id}`);

        // 初始化NPC行为
        this.initNPCs();

        // 可以在这里播放地图BGM
        eventBus.emit(GameEvents.AUDIO_BGM, {
            bgmId: `bgm_${newMap.id}`
        });
    }

    /**
     * 地图卸载回调
     * @param {Object} map - 被卸载的地图
     */
    onUnloadMap(map) {
        console.log(`Map unloaded: ${map.id}`);

        // 清理NPC
        this.cleanupNPCs();
    }

    /**
     * 初始化NPC
     */
    initNPCs() {
        // 可以在这里添加NPC的AI行为、随机移动等
        this.npcs.forEach(npc => {
            console.log(`Initialized NPC: ${npc.id} at (${npc.x}, ${npc.y})`);
        });
    }

    /**
     * 清理NPC
     */
    cleanupNPCs() {
        this.npcs = [];
    }

    /**
     * 处理传送
     * @param {Object} portalData - 传送数据
     */
    handlePortal(portalData) {
        console.log('Handling portal:', portalData);

        // 使用 mapSystem 的带动画传送功能
        if (mapSystem && mapSystem.teleportPlayer) {
            mapSystem.teleportPlayer(portalData.toMap, portalData.toX, portalData.toY);

            // 传送完成事件
            eventBus.emit('scene:portal_complete', {
                fromMap: portalData.fromMap,
                toMap: portalData.toMap,
                toX: portalData.toX,
                toY: portalData.toY
            });
        } else {
            // 备用方案：直接传送（无动画）
            const targetMap = this.loadMap(portalData.toMap);
            if (targetMap && playerController) {
                playerController.setMap(targetMap);
                playerController.teleportTo(portalData.toX, portalData.toY);

                if (gameStateMachine) {
                    gameStateMachine.updatePlayer({
                        location: { x: portalData.toX, y: portalData.toY }
                    });
                    gameStateMachine.updateGameState({
                        currentMapId: portalData.toMap
                    });
                }
            }
        }
    }

    /**
     * 通知场景变化
     * @param {Object} newMap - 新地图
     * @param {Object} oldMap - 旧地图
     */
    notifySceneChange(newMap, oldMap) {
        this.onSceneChangeCallbacks.forEach(callback => {
            try {
                callback(newMap, oldMap);
            } catch (error) {
                console.error('Error in scene change callback:', error);
            }
        });
    }

    /**
     * 注册场景变化回调
     * @param {Function} callback - 回调函数
     */
    onSceneChange(callback) {
        this.onSceneChangeCallbacks.push(callback);
    }

    /**
     * 取消注册场景变化回调
     * @param {Function} callback - 回调函数
     */
    offSceneChange(callback) {
        this.onSceneChangeCallbacks = this.onSceneChangeCallbacks.filter(cb => cb !== callback);
    }

    /**
     * 获取当前地图
     * @returns {Object} 当前地图数据
     */
    getCurrentMap() {
        return this.currentMap;
    }

    /**
     * 获取当前地图ID
     * @returns {string} 地图ID
     */
    getCurrentMapId() {
        return this.currentMapId;
    }

    /**
     * 获取NPC列表
     * @returns {Array} NPC列表
     */
    getNPCs() {
        return this.npcs;
    }

    /**
     * 获取指定ID的NPC
     * @param {string} npcId - NPC ID
     * @returns {Object|null} NPC数据
     */
    getNPCById(npcId) {
        return this.npcs.find(npc => npc.id === npcId);
    }

    /**
     * 获取指定位置的NPC
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null} NPC数据
     */
    getNPCAt(x, y) {
        return this.npcs.find(npc => npc.x === x && npc.y === y);
    }

    /**
     * 获取传送点列表
     * @returns {Array} 传送点列表
     */
    getPortals() {
        return this.portals;
    }

    /**
     * 获取指定位置的传送点
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null} 传送点数据
     */
    getPortalAt(x, y) {
        return this.portals.find(portal => portal.x === x && portal.y === y);
    }

    /**
     * 获取商店列表
     * @returns {Array} 商店列表
     */
    getShops() {
        return this.shops;
    }

    /**
     * 获取指定ID的商店
     * @param {string} shopId - 商店ID
     * @returns {Object|null} 商店数据
     */
    getShopById(shopId) {
        return this.shops.find(shop => shop.id === shopId);
    }

    /**
     * 获取指定位置的商店
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null} 商店数据
     */
    getShopAt(x, y) {
        return this.shops.find(shop => shop.x === x && shop.y === y);
    }

    /**
     * 获取渲染状态
     * @returns {Object} 渲染状态
     */
    getRenderState() {
        return {
            map: this.currentMap,
            npcs: this.npcs,
            portals: this.portals,
            shops: this.shops
        };
    }

    /**
     * 更新场景
     * @param {number} deltaTime - 时间增量（秒）
     */
    update(deltaTime) {
        // 更新NPC AI
        this.updateNPCs(deltaTime);
    }

    /**
     * 更新NPC
     * @param {number} deltaTime - 时间增量（秒）
     */
    updateNPCs(deltaTime) {
        // 可以在这里实现NPC的随机移动、动画等
        this.npcs.forEach(npc => {
            // NPC 更新逻辑
            // 例如：随机转向、偶尔移动等
        });
    }

    /**
     * 清理资源
     */
    destroy() {
        this.cleanupNPCs();
        this.onSceneChangeCallbacks = [];
        this.currentMap = null;
        this.currentMapId = null;
        this.mapCache = {};
        this.initialized = false;
    }
}

// 创建全局实例
const sceneManager = new SceneManager();
window.sceneManager = sceneManager;
