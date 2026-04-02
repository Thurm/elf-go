/**
 * 地图渲染器 - 负责 Canvas 2D 地图渲染
 * 实现多层渲染（地面、物体、角色、覆盖）
 * 支持动态地图切换动画和独特的地图视觉主题
 */

// 图块尺寸（像素）
const TILE_SIZE = 32;

// 渲染层级 Z-index
const RENDER_LAYERS = {
    GROUND: 0,      // 底层：草地、道路、水体
    OBJECTS: 10,    // 中层：建筑、家具、树木底部
    CHARACTERS: 20, // 角色层：玩家、NPC
    OVERLAY: 30      // 顶层：树冠、屋檐
};

// 碰撞渲染类型（与 PlayerController 中的 CollisionType 对应）
const CollisionRenderType = {
    BLOCKED: 1,
    WATER: 2
};

// 地图过渡类型
const MapTransitionType = {
    NONE: 'none',
    CIRCLE_WIPE: 'circle_wipe',      // 圆形扩散
    SCANLINE: 'scanline',            // 扫描线
    PIXEL_DISSOLVE: 'pixel_dissolve',  // 像素溶解
    NEON_FLASH: 'neon_flash',        // 霓虹闪烁
    SLIDE: 'slide',                  // 滑动切换
    VORTEX: 'vortex'                 // 漩涡效果
};

// 地图视觉主题配置
const MapVisualThemes = {
    'town_01': {
        name: '新手村',
        ambientColor: '#4a7c23',
        neonColor: '#f9f002',
        secondaryNeon: '#39ff14',
        fogDensity: 0.05,
        particles: 'fireflies',
        transitionIn: MapTransitionType.CIRCLE_WIPE,
        transitionOut: MapTransitionType.NEON_FLASH,
        skyGradient: ['#0d0221', '#1a0a2e', '#0d1b2a']
    },
    'route_01': {
        name: '1号道路',
        ambientColor: '#5a8c33',
        neonColor: '#05d9e8',
        secondaryNeon: '#ff2a6d',
        fogDensity: 0.1,
        particles: 'wind',
        transitionIn: MapTransitionType.SCANLINE,
        transitionOut: MapTransitionType.PIXEL_DISSOLVE,
        skyGradient: ['#0a1628', '#1a2a3e', '#0a1a28']
    },
    'house_01': {
        name: '村长家',
        ambientColor: '#8b7355',
        neonColor: '#ff6b35',
        secondaryNeon: '#d300c5',
        fogDensity: 0.02,
        particles: 'dust',
        transitionIn: MapTransitionType.SLIDE,
        transitionOut: MapTransitionType.VORTEX,
        skyGradient: ['#1a1a1a', '#2a1a1a', '#1a0a0a'],
        isIndoor: true
    }
};

/**
 * 地图渲染器类
 */
class MapRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // 当前地图数据
        this.currentMap = null;

        // 摄像机位置（左上角坐标）
        this.camera = { x: 0, y: 0 };

        // 图块图像缓存
        this.tileImages = {};

        // 角色精灵缓存
        this.spriteImages = {};

        // 是否使用占位符渲染（无图像时）
        this.usePlaceholder = true;

        // 视口内可见的图块范围
        this.visibleTiles = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0
        };

        // ========== 地图过渡动画系统 ==========
        this.transitionState = {
            active: false,
            type: MapTransitionType.NONE,
            progress: 0,
            duration: 1000, // 毫秒
            startTime: 0,
            direction: 'in', // 'in' 或 'out'
            oldMapData: null,
            newMapData: null
        };

        // 当前视觉主题
        this.currentTheme = null;

        // 粒子系统
        this.particles = [];
        this.lastParticleTime = 0;

        // 传送点渲染状态
        this.portalVisuals = new Map();
    }

    /**
     * 初始化渲染器
     * @param {Object} mapData - 初始地图数据
     */
    init(mapData) {
        this.currentMap = mapData;
        this._updateVisualTheme(mapData?.id);
        console.log(`MapRenderer initialized with map: ${mapData?.id || 'none'}`);
    }

    /**
     * 设置当前地图（带动画过渡）
     * @param {Object} mapData - 地图数据
     * @param {boolean} withAnimation - 是否播放过渡动画
     */
    setMap(mapData, withAnimation = true) {
        const oldMap = this.currentMap;
        const oldTheme = this.currentTheme;

        if (withAnimation && oldMap && oldMap.id !== mapData.id) {
            // 开始过渡动画
            this._startMapTransition(oldMap, mapData, oldTheme);
        } else {
            // 直接切换
            this.currentMap = mapData;
            this._updateVisualTheme(mapData?.id);
        }

        console.log(`Map switched to: ${mapData.id}`);
    }

    /**
     * 更新视觉主题
     * @param {string} mapId - 地图ID
     * @private
     */
    _updateVisualTheme(mapId) {
        this.currentTheme = MapVisualThemes[mapId] || MapVisualThemes['town_01'];
        this.particles = []; // 清空粒子
    }

    /**
     * 开始地图过渡动画
     * @param {Object} oldMap - 旧地图
     * @param {Object} newMap - 新地图
     * @param {Object} oldTheme - 旧主题
     * @private
     */
    _startMapTransition(oldMap, newMap, oldTheme) {
        const transitionType = oldTheme?.transitionOut || MapTransitionType.NEON_FLASH;

        this.transitionState = {
            active: true,
            type: transitionType,
            progress: 0,
            duration: 1200,
            startTime: Date.now(),
            direction: 'out',
            oldMapData: oldMap,
            oldTheme: oldTheme,
            newMapData: newMap,
            midpointReached: false
        };
    }

    /**
     * 更新过渡动画
     * @param {number} deltaTime - 时间增量
     */
    updateTransition(deltaTime) {
        if (!this.transitionState.active) return;

        const state = this.transitionState;
        const elapsed = Date.now() - state.startTime;
        state.progress = Math.min(1, elapsed / state.duration);

        // 到达中点时切换地图数据
        if (state.progress >= 0.5 && !state.midpointReached) {
            state.midpointReached = true;
            state.direction = 'in';
            this.currentMap = state.newMapData;
            this._updateVisualTheme(state.newMapData?.id);

            // 选择入场过渡类型
            const newTheme = this.currentTheme;
            state.type = newTheme?.transitionIn || MapTransitionType.CIRCLE_WIPE;
            state.startTime = Date.now();
            state.progress = 0;
            state.duration = 1000;
        }

        // 过渡完成
        if (state.progress >= 1 && state.midpointReached) {
            state.active = false;
            state.type = MapTransitionType.NONE;
        }
    }

    /**
     * 检查是否正在过渡
     * @returns {boolean}
     */
    isTransitioning() {
        return this.transitionState.active;
    }

    /**
     * 更新摄像机位置，使其跟随玩家
     * @param {number} playerX - 玩家X坐标（图块单位）
     * @param {number} playerY - 玩家Y坐标（图块单位）
     */
    updateCamera(playerX, playerY) {
        if (!this.currentMap) return;

        // 计算摄像机目标位置（使玩家居中）
        const targetCamX = playerX * TILE_SIZE - this.canvas.width / 2 + TILE_SIZE / 2;
        const targetCamY = playerY * TILE_SIZE - this.canvas.height / 2 + TILE_SIZE / 2;

        // 摄像机边界限制
        const mapWidth = this.currentMap.width * TILE_SIZE;
        const mapHeight = this.currentMap.height * TILE_SIZE;

        this.camera.x = Math.max(0, Math.min(targetCamX, mapWidth - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(targetCamY, mapHeight - this.canvas.height));

        // 如果地图比画布小，居中显示
        if (mapWidth < this.canvas.width) {
            this.camera.x = (mapWidth - this.canvas.width) / 2;
        }
        if (mapHeight < this.canvas.height) {
            this.camera.y = (mapHeight - this.canvas.height) / 2;
        }

        // 更新可见图块范围
        this.updateVisibleTiles();
    }

    /**
     * 更新可见图块范围
     */
    updateVisibleTiles() {
        if (!this.currentMap) return;

        this.visibleTiles.startX = Math.floor(this.camera.x / TILE_SIZE) - 1;
        this.visibleTiles.startY = Math.floor(this.camera.y / TILE_SIZE) - 1;
        this.visibleTiles.endX = Math.ceil((this.camera.x + this.canvas.width) / TILE_SIZE) + 1;
        this.visibleTiles.endY = Math.ceil((this.camera.y + this.canvas.height) / TILE_SIZE) + 1;

        // 边界限制
        this.visibleTiles.startX = Math.max(0, this.visibleTiles.startX);
        this.visibleTiles.startY = Math.max(0, this.visibleTiles.startY);
        this.visibleTiles.endX = Math.min(this.currentMap.width, this.visibleTiles.endX);
        this.visibleTiles.endY = Math.min(this.currentMap.height, this.visibleTiles.endY);
    }

    /**
     * 主渲染函数
     * @param {Object} renderState - 渲染状态（包含玩家位置、NPC列表等）
     */
    render(renderState) {
        if (!this.currentMap) {
            this.renderNoMap();
            return;
        }

        // 清屏 - 使用主题天空渐变
        this._renderThemedBackground();

        // 如果正在过渡，渲染过渡效果
        if (this.transitionState.active) {
            this._renderTransition(renderState);
            return;
        }

        // 保存上下文状态
        this.ctx.save();

        // 应用摄像机偏移
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 按层级渲染
        this.renderGroundLayer();
        this.renderObjectLayer();

        // 收集并排序角色（按Y坐标）
        const characters = this.collectCharacters(renderState);
        this.renderCharacters(characters);

        this.renderOverlayLayer();

        // 渲染传送点视觉效果（已禁用）
        // this._renderPortalVisuals(renderState);

        // 恢复上下文状态
        this.ctx.restore();

        // 渲染地图主题粒子（已禁用）
        // this._renderThemedParticles();

        // 渲染地图名称显示
        this._renderMapName();

        // 渲染调试信息（可选）
        this.renderDebugInfo(renderState);
    }

    /**
     * 渲染主题化背景
     * @private
     */
    _renderThemedBackground() {
        const theme = this.currentTheme || MapVisualThemes['town_01'];
        const skyColors = theme.skyGradient || ['#0d0221', '#1a0a2e', '#0d1b2a'];

        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, skyColors[0]);
        bgGradient.addColorStop(0.5, skyColors[1]);
        bgGradient.addColorStop(1, skyColors[2]);
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 渲染地图过渡动画
     * @param {Object} renderState - 渲染状态
     * @private
     */
    _renderTransition(renderState) {
        const state = this.transitionState;
        const ctx = this.ctx;

        // 根据方向渲染
        if (state.direction === 'out' && state.oldMapData) {
            // 退场阶段：渲染旧地图
            this._renderMapContent(state.oldMapData, renderState);
        } else if (state.direction === 'in' && this.currentMap) {
            // 入场阶段：渲染新地图
            this._renderMapContent(this.currentMap, renderState);
        }

        // 应用过渡遮罩
        this._renderTransitionMask(state);
    }

    /**
     * 渲染地图内容（用于过渡）
     * @param {Object} mapData - 地图数据
     * @param {Object} renderState - 渲染状态
     * @private
     */
    _renderMapContent(mapData, renderState) {
        const savedMap = this.currentMap;
        this.currentMap = mapData;

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.renderGroundLayer();
        this.renderObjectLayer();

        const characters = this.collectCharacters(renderState);
        this.renderCharacters(characters);

        this.renderOverlayLayer();

        this.ctx.restore();

        this.currentMap = savedMap;
    }

    /**
     * 渲染过渡遮罩
     * @param {Object} state - 过渡状态
     * @private
     */
    _renderTransitionMask(state) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const progress = state.progress;

        ctx.save();

        switch (state.type) {
            case MapTransitionType.CIRCLE_WIPE:
                this._renderCircleWipe(centerX, centerY, progress, state.direction);
                break;
            case MapTransitionType.SCANLINE:
                this._renderScanline(progress, state.direction);
                break;
            case MapTransitionType.PIXEL_DISSOLVE:
                this._renderPixelDissolve(progress, state.direction);
                break;
            case MapTransitionType.NEON_FLASH:
                this._renderNeonFlash(progress, state.direction);
                break;
            case MapTransitionType.SLIDE:
                this._renderSlide(progress, state.direction);
                break;
            case MapTransitionType.VORTEX:
                this._renderVortex(centerX, centerY, progress, state.direction);
                break;
            default:
                this._renderFade(progress, state.direction);
        }

        ctx.restore();
    }

    /**
     * 圆形扩散过渡
     * @private
     */
    _renderCircleWipe(centerX, centerY, progress, direction) {
        const ctx = this.ctx;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.5;
        const radius = direction === 'out' ? maxRadius * (1 - progress) : maxRadius * progress;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.rect(centerX + maxRadius, centerY - maxRadius, -maxRadius * 2, maxRadius * 2);
        ctx.fill();

        // 霓虹边缘
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = direction === 'out' ? '#ff2a6d' : '#05d9e8';
        ctx.lineWidth = 4;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    /**
     * 扫描线过渡
     * @private
     */
    _renderScanline(progress, direction) {
        const ctx = this.ctx;
        const y = direction === 'out' ? this.canvas.height * (1 - progress) : this.canvas.height * progress;

        // 扫描线遮罩
        ctx.globalCompositeOperation = 'destination-out';
        const maskY = direction === 'out' ? y : 0;
        const maskHeight = direction === 'out' ? this.canvas.height - y : y;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, maskY, this.canvas.width, maskHeight);

        // 霓虹扫描线
        ctx.globalCompositeOperation = 'source-over';
        const scanlineGradient = ctx.createLinearGradient(0, y - 20, 0, y + 20);
        scanlineGradient.addColorStop(0, 'transparent');
        scanlineGradient.addColorStop(0.5, 'rgba(5, 217, 232, 0.8)');
        scanlineGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = scanlineGradient;
        ctx.fillRect(0, y - 20, this.canvas.width, 40);
    }

    /**
     * 像素溶解过渡
     * @private
     */
    _renderPixelDissolve(progress, direction) {
        const ctx = this.ctx;
        const blockSize = 8;
        const threshold = direction === 'out' ? 1 - progress : progress;

        ctx.globalCompositeOperation = 'destination-out';

        for (let y = 0; y < this.canvas.height; y += blockSize) {
            for (let x = 0; x < this.canvas.width; x += blockSize) {
                const random = ((x * 7 + y * 13) % 100) / 100;
                if (random < threshold) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(x, y, blockSize, blockSize);
                }
            }
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * 霓虹闪烁过渡
     * @private
     */
    _renderNeonFlash(progress, direction) {
        const ctx = this.ctx;
        const flashIntensity = direction === 'out' ?
            Math.sin(progress * Math.PI) * 1.5 :
            Math.sin(progress * Math.PI) * (1 - progress);

        // 闪光效果
        if (flashIntensity > 0) {
            ctx.globalCompositeOperation = 'screen';
            const colors = ['#ff2a6d', '#05d9e8', '#d300c5', '#f9f002'];
            const colorIndex = Math.floor(progress * colors.length) % colors.length;

            ctx.fillStyle = colors[colorIndex];
            ctx.globalAlpha = flashIntensity * 0.8;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // 额外的霓虹闪烁
            if (progress > 0.4 && progress < 0.6) {
                ctx.globalAlpha = (0.5 - Math.abs(progress - 0.5)) * 2;
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    /**
     * 滑动过渡
     * @private
     */
    _renderSlide(progress, direction) {
        const ctx = this.ctx;
        const offset = direction === 'out' ? this.canvas.width * progress : -this.canvas.width * (1 - progress);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        ctx.fillRect(offset, 0, this.canvas.width, this.canvas.height);

        // 霓虹边缘
        ctx.globalCompositeOperation = 'source-over';
        const edgeGradient = ctx.createLinearGradient(offset - 20, 0, offset + 20, 0);
        edgeGradient.addColorStop(0, 'transparent');
        edgeGradient.addColorStop(0.5, 'rgba(255, 42, 109, 0.8)');
        edgeGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = edgeGradient;
        ctx.fillRect(offset - 20, 0, 40, this.canvas.height);
    }

    /**
     * 漩涡过渡
     * @private
     */
    _renderVortex(centerX, centerY, progress, direction) {
        const ctx = this.ctx;
        const intensity = direction === 'out' ? progress : 1 - progress;

        // 使用像素化漩涡效果
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        const layers = 20;
        for (let i = 0; i < layers; i++) {
            const layerProgress = (i / layers) * intensity;
            const radius = Math.min(centerX, centerY) * layerProgress * 2;
            const rotation = layerProgress * Math.PI * 4;

            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.translate(-centerX, -centerY);

            ctx.fillStyle = `rgba(0, 0, 0, ${0.1})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.rect(centerX + radius, centerY - radius, -radius * 2, radius * 2);
            ctx.fill();

            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        ctx.restore();

        // 霓虹中心
        if (intensity > 0) {
            const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
            centerGradient.addColorStop(0, `rgba(211, 0, 197, ${intensity})`);
            centerGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = centerGradient;
            ctx.fillRect(centerX - 50, centerY - 50, 100, 100);
        }
    }

    /**
     * 淡入淡出过渡（默认）
     * @private
     */
    _renderFade(progress, direction) {
        const ctx = this.ctx;
        const alpha = direction === 'out' ? progress : 1 - progress;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * 渲染传送点视觉效果
     * @param {Object} renderState - 渲染状态
     * @private
     */
    _renderPortalVisuals(renderState) {
        const portals = renderState?.portals || [];
        const time = Date.now() / 1000;

        portals.forEach(portal => {
            const screenX = portal.x * TILE_SIZE + TILE_SIZE / 2;
            const screenY = portal.y * TILE_SIZE + TILE_SIZE / 2;

            // 传送门脉冲效果
            const pulse = (Math.sin(time * 3) + 1) / 2;
            const radius = TILE_SIZE * 0.4 + pulse * 5;

            // 外发光
            this.ctx.shadowColor = '#d300c5';
            this.ctx.shadowBlur = 20 + pulse * 10;

            // 传送门圆环
            const portalGradient = this.ctx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, radius
            );
            portalGradient.addColorStop(0, 'transparent');
            portalGradient.addColorStop(0.5, `rgba(211, 0, 197, ${0.5 + pulse * 0.3})`);
            portalGradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = portalGradient;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 旋转的能量环
            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(time * 2);

            for (let i = 0; i < 4; i++) {
                this.ctx.rotate(Math.PI / 2);
                this.ctx.fillStyle = `rgba(5, 217, 232, ${0.6 + pulse * 0.4})`;
                this.ctx.fillRect(-2, -radius * 0.8, 4, radius * 0.4);
            }

            this.ctx.restore();
            this.ctx.shadowBlur = 0;
        });
    }

    /**
     * 渲染主题粒子
     * @private
     */
    _renderThemedParticles() {
        if (!this.currentTheme) return;

        const time = Date.now() / 1000;
        const particleType = this.currentTheme.particles;

        // 生成新粒子
        if (time - this.lastParticleTime > 0.1) {
            this.lastParticleTime = time;

            if (this.particles.length < 50) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    type: particleType,
                    life: 1,
                    speed: 0.3 + Math.random() * 0.5,
                    size: 1 + Math.random() * 2,
                    offset: Math.random() * Math.PI * 2
                });
            }
        }

        // 更新和渲染粒子
        this.ctx.save();
        this.particles = this.particles.filter(p => {
            p.life -= 0.005;
            p.y -= p.speed;

            if (particleType === 'wind') {
                p.x += Math.sin(time + p.offset) * 0.5;
            } else if (particleType === 'dust') {
                p.x += Math.sin(time * 0.5 + p.offset) * 0.3;
                p.y += 0.1;
            }

            if (p.life <= 0 || p.y < -10 || p.y > this.canvas.height + 10) {
                return false;
            }

            // 渲染粒子
            let color = this.currentTheme.neonColor;
            if (particleType === 'fireflies') {
                color = '#f9f002';
            } else if (particleType === 'wind') {
                color = '#05d9e8';
            } else if (particleType === 'dust') {
                color = '#ff6b35';
            }

            const glow = Math.sin(time * 3 + p.offset) * 0.5 + 0.5;
            this.ctx.fillStyle = color;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 5 * glow;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * (0.5 + glow * 0.5), 0, Math.PI * 2);
            this.ctx.fill();

            return true;
        });
        this.ctx.restore();
    }

    /**
     * 渲染地图名称显示
     * @private
     */
    _renderMapName() {
        if (!this.currentTheme || !this.currentTheme.name) return;

        const time = Date.now() / 1000;
        const fadeIn = Math.min(1, (time - this._mapNameShowTime) / 2);
        const fadeOut = Math.max(0, 1 - Math.max(0, (time - this._mapNameShowTime - 3) / 1));

        // 只在刚进入地图时显示
        if (!this._mapNameShowTime || (time - this._mapNameShowTime) > 4) {
            if (!this._lastMapId || this._lastMapId !== this.currentMap?.id) {
                this._mapNameShowTime = time;
                this._lastMapId = this.currentMap?.id;
            } else {
                return;
            }
        }

        const alpha = Math.min(fadeIn, fadeOut);
        if (alpha <= 0) return;

        const ctx = this.ctx;
        const name = this.currentTheme.name;

        ctx.save();
        ctx.globalAlpha = alpha;

        // 背景框
        const bgWidth = 200;
        const bgHeight = 50;
        const bgX = (this.canvas.width - bgWidth) / 2;
        const bgY = 80;

        const bgGradient = ctx.createLinearGradient(bgX, bgY, bgX + bgWidth, bgY + bgHeight);
        bgGradient.addColorStop(0, 'rgba(13, 2, 33, 0.9)');
        bgGradient.addColorStop(0.5, 'rgba(45, 27, 78, 0.95)');
        bgGradient.addColorStop(1, 'rgba(13, 2, 33, 0.9)');

        ctx.fillStyle = bgGradient;
        ctx.shadowColor = this.currentTheme.neonColor;
        ctx.shadowBlur = 20;
        this._drawMapNameRoundedRect(bgX, bgY, bgWidth, bgHeight, 10);
        ctx.fill();

        // 边框
        ctx.strokeStyle = this.currentTheme.neonColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 地图名称
        ctx.shadowBlur = 0;
        ctx.fillStyle = this.currentTheme.neonColor;
        ctx.shadowColor = this.currentTheme.neonColor;
        ctx.shadowBlur = 10;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, this.canvas.width / 2, bgY + 33);

        ctx.restore();
    }

    /**
     * 绘制地图名称圆角矩形
     * @private
     */
    _drawMapNameRoundedRect(x, y, width, height, radius) {
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
     * 检查图层是否只有空数据（全0）
     * @param {Object} layer - 图层数据
     * @returns {boolean} 是否为空数据
     */
    isLayerEmpty(layer) {
        if (!layer || !layer.data) return true;
        for (let y = 0; y < layer.data.length; y++) {
            const row = layer.data[y];
            if (!row) continue;
            for (let x = 0; x < row.length; x++) {
                if (row[x] !== 0) return false;
            }
        }
        return true;
    }

    /**
     * 渲染底层（地面层）
     */
    renderGroundLayer() {
        const groundLayer = this.getLayer('ground');
        if (!groundLayer || this.isLayerEmpty(groundLayer)) {
            this.renderPlaceholderGround();
            return;
        }

        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const tileId = this.getTileAt(groundLayer, x, y);
                this.renderTile(x, y, tileId, 'ground');
            }
        }
    }

    /**
     * 渲染中层（物体层）
     */
    renderObjectLayer() {
        const objectLayer = this.getLayer('objects');
        if (!objectLayer || this.isLayerEmpty(objectLayer)) {
            this.renderPlaceholderObjects();
            return;
        }

        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const tileId = this.getTileAt(objectLayer, x, y);
                if (tileId > 0) {
                    this.renderTile(x, y, tileId, 'objects');
                }
            }
        }
    }

    /**
     * 收集所有需要渲染的角色
     * @param {Object} renderState - 渲染状态
     * @returns {Array} 排序后的角色列表
     */
    collectCharacters(renderState) {
        const characters = [];
        const gameState = typeof gameStateMachine !== 'undefined' ? gameStateMachine.getGameState() : null;
        const receivedStarter = Boolean(gameState?.flags?.received_starter);

        // 添加玩家
        if (renderState.player) {
            characters.push({
                type: 'player',
                x: renderState.player.x,
                y: renderState.player.y,
                direction: renderState.player.direction || 'down',
                moving: renderState.player.moving || false,
                data: renderState.player
            });
        }

        // 添加 NPC
        if (renderState.npcs) {
            renderState.npcs.forEach(npc => {
                characters.push({
                    type: 'npc',
                    x: npc.x,
                    y: npc.y,
                    direction: npc.direction || 'down',
                    npcId: npc.id,
                    data: npc
                });
            });
        }

        if (!receivedStarter && renderState.map?.starterDisplays) {
            renderState.map.starterDisplays.forEach(display => {
                characters.push({
                    type: 'starter_display',
                    x: display.x,
                    y: display.y,
                    direction: 'down',
                    monsterId: display.monsterId,
                    label: display.label,
                    data: display
                });
            });
        }

        // 按 Y 坐标排序（Y 小的先渲染，即后方的先画）
        characters.sort((a, b) => a.y - b.y);

        return characters;
    }

    /**
     * 渲染角色层
     * @param {Array} characters - 排序后的角色列表
     */
    renderCharacters(characters) {
        characters.forEach(char => {
            this.renderCharacter(char);
        });
    }

    /**
     * 渲染单个角色
     * @param {Object} char - 角色数据
     */
    renderCharacter(char) {
        const screenX = char.x * TILE_SIZE;
        const screenY = char.y * TILE_SIZE;

        if (this.usePlaceholder) {
            this.renderPlaceholderCharacter(char, screenX, screenY);
        } else {
            // 使用精灵图渲染
            this.renderSpriteCharacter(char, screenX, screenY);
        }
    }

    /**
     * 渲染顶层（覆盖层）
     */
    renderOverlayLayer() {
        const overlayLayer = this.getLayer('overlay');
        if (!overlayLayer || this.isLayerEmpty(overlayLayer)) {
            this.renderPlaceholderOverlay();
            return;
        }

        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const tileId = this.getTileAt(overlayLayer, x, y);
                if (tileId > 0) {
                    this.renderTile(x, y, tileId, 'overlay');
                }
            }
        }
    }

    /**
     * 获取指定图层
     * @param {string} layerName - 图层名称
     * @returns {Object|null} 图层数据
     */
    getLayer(layerName) {
        if (!this.currentMap || !this.currentMap.layers) return null;
        return this.currentMap.layers.find(l => l.name === layerName);
    }

    /**
     * 获取指定位置的图块ID
     * @param {Object} layer - 图层
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {number} 图块ID
     */
    getTileAt(layer, x, y) {
        if (!layer || !layer.data) return 0;
        if (y < 0 || y >= layer.data.length) return 0;
        if (x < 0 || x >= layer.data[y].length) return 0;
        return layer.data[y][x];
    }

    /**
     * 渲染单个图块
     * @param {number} tileX - 图块X坐标
     * @param {number} tileY - 图块Y坐标
     * @param {number} tileId - 图块ID
     * @param {string} layerType - 图层类型
     */
    renderTile(tileX, tileY, tileId, layerType) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;

        if (this.usePlaceholder) {
            this.renderPlaceholderTile(screenX, screenY, tileId, layerType);
        } else {
            // 使用图块集渲染
            this.renderSpriteTile(screenX, screenY, tileId, layerType);
        }
    }

    // ==================== 占位符渲染（无图像时使用） ====================

    /**
     * 渲染无地图提示
     */
    renderNoMap() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('无地图数据', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 渲染占位符地面层 - 每个地图完全独特的布局
     */
    renderPlaceholderGround() {
        if (!this.currentMap) return;

        // 根据地图ID选择完全独特的地面渲染方案
        if (this.currentMap.id === 'town_01') {
            this._renderTownVillageGround();
        } else if (this.currentMap.id === 'route_01') {
            this._renderRoute01Ground();
        } else if (this.currentMap.id === 'house_01') {
            this._renderMayorHouseGround();
        } else {
            // 默认方案
            this._renderDefaultGround();
        }
    }

    /**
     * 新手村 - 独特的村庄广场布局
     * 中心：发光喷泉，四周：放射状道路，角落：建筑区域
     */
    _renderTownVillageGround() {
        const time = Date.now() / 1000;
        const centerX = 15, centerY = 16;

        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;
                const seed = (x * 17 + y * 23) % 100;
                const distToCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

                // 中心喷泉区域
                if (distToCenter < 3) {
                    this._renderFountainTile(screenX, screenY, x, y, time, distToCenter);
                }
                // 放射状道路
                else if (Math.abs(x - centerX) <= 1 || Math.abs(y - centerY) <= 1 ||
                         (Math.abs(x - centerX) === Math.abs(y - centerY) && distToCenter < 10)) {
                    this._renderVillagePathTile(screenX, screenY, x, y, time, seed);
                }
                // 建筑区地面
                else if ((x < 10 && y < 10) || (x > 20 && y < 12) || (x > 18 && y > 20) || (x < 8 && y > 22)) {
                    this._renderBuildingGroundTile(screenX, screenY, x, y, seed);
                }
                // 普通草地
                else {
                    this._renderVillageGrassTile(screenX, screenY, x, y, time, seed);
                }
            }
        }
    }

    /**
     * 1号道路 - 蜿蜒的自然路径布局
     * 主路：S形蜿蜒，两侧：高草遇敌区，远处：森林
     */
    _renderRoute01Ground() {
        const time = Date.now() / 1000;

        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;
                const seed = (x * 13 + y * 19) % 100;

                // S形主路计算
                const pathCenterY = 15 + Math.sin(x * 0.3) * 4;
                const distToPath = Math.abs(y - pathCenterY);

                // 主路
                if (distToPath < 2) {
                    this._renderRoutePathTile(screenX, screenY, x, y, time, seed);
                }
                // 过渡区
                else if (distToPath < 4) {
                    this._renderRouteEdgeTile(screenX, screenY, x, y, time, seed);
                }
                // 高草遇敌区
                else if ((y < 10 && y > 3) || (y > 20 && y < 28)) {
                    this._renderTallGrassTile(screenX, screenY, x, y, time, seed);
                }
                // 森林边缘
                else if (y < 4 || y > 28 || x < 2 || x > 29) {
                    this._renderForestFloorTile(screenX, screenY, x, y, seed);
                }
                // 普通草地
                else {
                    this._renderRouteGrassTile(screenX, screenY, x, y, time, seed);
                }
            }
        }
    }

    /**
     * 村长家 - 传统日式房间布局
     * 入口：玄关，主厅：榻榻米，一侧：壁龛，一侧：书桌
     */
    _renderMayorHouseGround() {
        const time = Date.now() / 1000;

        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;
                const seed = (x * 7 + y * 11) % 100;

                // 墙壁（不可行走）
                if (x === 0 || x === 9 || y === 0 || y === 7) {
                    this._renderJapaneseWallTile(screenX, screenY, x, y, seed);
                }
                // 玄关（入口处）
                else if (x === 5 && y === 6) {
                    this._renderEntrywayTile(screenX, screenY, time, seed);
                }
                // 壁龛区域
                else if (x >= 2 && x <= 3 && y >= 2 && y <= 3) {
                    this._renderAlcoveTile(screenX, screenY, x, y, time, seed);
                }
                // 书桌区域
                else if (x >= 6 && x <= 7 && y >= 2 && y <= 3) {
                    this._renderDeskAreaTile(screenX, screenY, x, y, seed);
                }
                // 榻榻米主厅
                else {
                    this._renderTatamiTile(screenX, screenY, x, y, time, seed);
                }
            }
        }
    }

    /**
     * 默认地面渲染
     */
    _renderDefaultGround() {
        const time = Date.now() / 1000;
        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;
                const seed = (x * 17 + y * 23) % 100;
                const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX + TILE_SIZE, screenY + TILE_SIZE);
                gradient.addColorStop(0, '#2d4a1a');
                gradient.addColorStop(1, '#3d5a2a');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // ========== 新手村专用渲染方法 ==========

    /**
     * 渲染喷泉图块
     * @private
     */
    _renderFountainTile(screenX, screenY, tileX, tileY, time, dist) {
        const pulse = (Math.sin(time * 2 + dist) + 1) / 2;

        // 石质基座
        const baseGradient = this.ctx.createRadialGradient(
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 0,
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE
        );
        baseGradient.addColorStop(0, '#5a6a7a');
        baseGradient.addColorStop(1, '#3a4a5a');
        this.ctx.fillStyle = baseGradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 水波纹
        const waterGradient = this.ctx.createRadialGradient(
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 0,
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 2
        );
        waterGradient.addColorStop(0, `rgba(5, 217, 232, ${0.8 + pulse * 0.2})`);
        waterGradient.addColorStop(1, `rgba(30, 64, 175, ${0.6 + pulse * 0.2})`);
        this.ctx.fillStyle = waterGradient;
        this.ctx.shadowColor = '#05d9e8';
        this.ctx.shadowBlur = 15 + pulse * 10;
        this.ctx.beginPath();
        this.ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染村庄道路图块
     * @private
     */
    _renderVillagePathTile(screenX, screenY, tileX, tileY, time, seed) {
        const glow = (Math.sin(time * 1.5 + tileX * 0.5 + tileY * 0.7) + 1) / 2;
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#c9a66b');
        gradient.addColorStop(0.5, '#a9864b');
        gradient.addColorStop(1, '#89663b');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 鹅卵石纹理
        if (seed < 70) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + (seed % 20) / 100})`;
            this.ctx.beginPath();
            this.ctx.arc(
                screenX + (seed % 28) + 2,
                screenY + ((seed * 3) % 28) + 2,
                2 + (seed % 3),
                0, Math.PI * 2
            );
            this.ctx.fill();
        }

        // 霓虹边缘
        this.ctx.strokeStyle = `rgba(249, 240, 2, ${0.3 + glow * 0.3})`;
        this.ctx.shadowColor = '#f9f002';
        this.ctx.shadowBlur = 5;
        this.ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染建筑区地面
     * @private
     */
    _renderBuildingGroundTile(screenX, screenY, tileX, tileY, seed) {
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX + TILE_SIZE, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#4a5a3a');
        gradient.addColorStop(1, '#3a4a2a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    /**
     * 渲染村庄草地
     * @private
     */
    _renderVillageGrassTile(screenX, screenY, tileX, tileY, time, seed) {
        const baseColor = seed < 25 ? '#4d8a3a' : seed < 50 ? '#3d7a2a' : '#2d6a1a';
        const gradient = this.ctx.createRadialGradient(
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 0,
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE
        );
        gradient.addColorStop(0, this._adjustMapColorBrightness(baseColor, 25));
        gradient.addColorStop(1, baseColor);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 草叶
        if (seed < 25) {
            this._renderGrassBlade(screenX, screenY, seed);
        }

        // 萤火虫
        if (seed < 5) {
            const flicker = Math.sin(time * 3 + seed * 2.5) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(249, 240, 2, ${flicker * 0.8})`;
            this.ctx.shadowColor = '#f9f002';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(
                screenX + TILE_SIZE / 2 + (seed % 12) - 6,
                screenY + TILE_SIZE / 2 + (seed % 10) - 5,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    // ========== 1号道路专用渲染方法 ==========

    /**
     * 渲染道路主路图块
     * @private
     */
    _renderRoutePathTile(screenX, screenY, tileX, tileY, time, seed) {
        const glow = (Math.sin(time * 2 + tileX * 0.3) + 1) / 2;
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#a08050');
        gradient.addColorStop(0.5, '#8a7040');
        gradient.addColorStop(1, '#706030');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 车辙痕迹
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + 8, screenY);
        this.ctx.lineTo(screenX + 8, screenY + TILE_SIZE);
        this.ctx.moveTo(screenX + 24, screenY);
        this.ctx.lineTo(screenX + 24, screenY + TILE_SIZE);
        this.ctx.stroke();

        // 路边霓虹标记
        if (tileX % 4 === 0) {
            this.ctx.fillStyle = `rgba(5, 217, 232, ${0.5 + glow * 0.5})`;
            this.ctx.shadowColor = '#05d9e8';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(screenX + 14, screenY + 2, 4, 4);
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * 渲染道路边缘过渡区
     * @private
     */
    _renderRouteEdgeTile(screenX, screenY, tileX, tileY, time, seed) {
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX + TILE_SIZE, screenY);
        gradient.addColorStop(0, '#8a7040');
        gradient.addColorStop(0.5, '#6a8a3a');
        gradient.addColorStop(1, '#4a7a2a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    /**
     * 渲染高草遇敌区
     * @private
     */
    _renderTallGrassTile(screenX, screenY, tileX, tileY, time, seed) {
        const sway = Math.sin(time * 2 + tileX * 0.5 + tileY * 0.3) * 3;
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#3fe36a');
        gradient.addColorStop(1, '#2d9a4a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 高草叶
        this.ctx.strokeStyle = 'rgba(20, 120, 40, 0.6)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 6 + i * 10, screenY + TILE_SIZE);
            this.ctx.quadraticCurveTo(
                screenX + 8 + i * 10 + sway,
                screenY + TILE_SIZE / 2,
                screenX + 4 + i * 10 + sway * 1.5,
                screenY + 4
            );
            this.ctx.stroke();
        }

        // 遇敌区发光指示
        const pulse = (Math.sin(time * 4 + tileX + tileY) + 1) / 2;
        this.ctx.strokeStyle = `rgba(255, 100, 100, ${0.2 + pulse * 0.3})`;
        this.ctx.shadowColor = '#ff6464';
        this.ctx.shadowBlur = 8;
        this.ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染森林地面
     * @private
     */
    _renderForestFloorTile(screenX, screenY, tileX, tileY, seed) {
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX + TILE_SIZE, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#2a3a1a');
        gradient.addColorStop(1, '#1a2a0a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 落叶
        if (seed < 40) {
            this.ctx.fillStyle = `rgba(139, 90, 43, ${0.3 + (seed % 30) / 100})`;
            this.ctx.beginPath();
            this.ctx.ellipse(
                screenX + (seed % 24) + 4,
                screenY + ((seed * 2) % 24) + 4,
                3, 2,
                (seed % 6) * 0.5,
                0, Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    /**
     * 渲染道路普通草地
     * @private
     */
    _renderRouteGrassTile(screenX, screenY, tileX, tileY, time, seed) {
        const baseColor = seed < 30 ? '#5a8c33' : seed < 60 ? '#4a7c23' : '#3a6c13';
        const gradient = this.ctx.createRadialGradient(
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 0,
            screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE
        );
        gradient.addColorStop(0, this._adjustMapColorBrightness(baseColor, 20));
        gradient.addColorStop(1, baseColor);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    // ========== 村长家专用渲染方法 ==========

    /**
     * 渲染日式墙壁
     * @private
     */
    _renderJapaneseWallTile(screenX, screenY, tileX, tileY, seed) {
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#7a6a5a');
        gradient.addColorStop(0.5, '#6a5a4a');
        gradient.addColorStop(1, '#5a4a3a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 木柱纹理
        this.ctx.strokeStyle = 'rgba(40, 30, 20, 0.4)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + i * 8, screenY);
            this.ctx.lineTo(screenX + i * 8, screenY + TILE_SIZE);
            this.ctx.stroke();
        }
    }

    /**
     * 渲染玄关（入口）
     * @private
     */
    _renderEntrywayTile(screenX, screenY, time, seed) {
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#5a4a3a');
        gradient.addColorStop(1, '#4a3a2a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 玄关踏脚石
        this.ctx.fillStyle = '#6a6a6a';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染壁龛区域
     * @private
     */
    _renderAlcoveTile(screenX, screenY, tileX, tileY, time, seed) {
        // 暗色壁龛背景
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#4a3a2a');
        gradient.addColorStop(1, '#3a2a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 壁龛内的发光装饰（卷轴/插花）
        const glow = (Math.sin(time * 2) + 1) / 2;
        if (tileX === 2 && tileY === 2) {
            this.ctx.fillStyle = `rgba(255, 170, 100, ${0.3 + glow * 0.4})`;
            this.ctx.shadowColor = '#ffaa64';
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(screenX + 12, screenY + 4, 8, 24);
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * 渲染书桌区域
     * @private
     */
    _renderDeskAreaTile(screenX, screenY, tileX, tileY, seed) {
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
        gradient.addColorStop(0, '#8b7355');
        gradient.addColorStop(1, '#7b6345');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    /**
     * 渲染榻榻米
     * @private
     */
    _renderTatamiTile(screenX, screenY, tileX, tileY, time, seed) {
        const isEven = (tileX + tileY) % 2 === 0;
        const baseColor = isEven ? '#c9a66b' : '#b9965b';

        // 榻榻米基础
        const gradient = this.ctx.createLinearGradient(screenX, screenY, screenX + TILE_SIZE, screenY + TILE_SIZE);
        gradient.addColorStop(0, this._adjustMapColorBrightness(baseColor, 10));
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, this._adjustMapColorBrightness(baseColor, -10));
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 榻榻米边缘（蔺草纹理）
        this.ctx.strokeStyle = 'rgba(100, 80, 40, 0.3)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY + 4 + i * 5);
            this.ctx.lineTo(screenX + TILE_SIZE, screenY + 4 + i * 5);
            this.ctx.stroke();
        }

        // 榻榻米包边
        if (tileX === 1 || tileX === 8 || tileY === 1 || tileY === 6) {
            this.ctx.fillStyle = '#4a3020';
            if (tileX === 1) this.ctx.fillRect(screenX, screenY, 3, TILE_SIZE);
            if (tileX === 8) this.ctx.fillRect(screenX + TILE_SIZE - 3, screenY, 3, TILE_SIZE);
            if (tileY === 1) this.ctx.fillRect(screenX, screenY, TILE_SIZE, 3);
            if (tileY === 6) this.ctx.fillRect(screenX, screenY + TILE_SIZE - 3, TILE_SIZE, 3);
        }
    }

    /**
     * 渲染占位符路径 - 已不再使用，路径在地面层直接渲染
     */
    renderPlaceholderPaths() {
        // 路径现在在地面层直接渲染，这里留空
    }

    /**
     * 渲染占位符物体层 - 每个地图完全独特的布局
     */
    renderPlaceholderObjects() {
        if (!this.currentMap) return;

        if (this.currentMap.id === 'town_01') {
            this._renderTownVillageObjects();
        } else if (this.currentMap.id === 'route_01') {
            this._renderRoute01Objects();
        } else if (this.currentMap.id === 'house_01') {
            this._renderMayorHouseObjects();
        }
    }

    /**
     * 新手村物体层 - 村庄广场布局
     */
    _renderTownVillageObjects() {
        const time = Date.now() / 1000;

        // 西南角：水池（替代我的家）
        this._renderPond(2, 3, 5, 4, time);

        // 北边：村长家（更大更华丽）
        this._renderMayorHouse(12, 1, 6, 5);

        // 东南角：商店
        this._renderShopBuilding(20, 12, 4, 4);

        // 树木环绕村庄
        const villageTreePositions = [
            [0, 0], [1, 0], [0, 1], [1, 1],
            [30, 0], [31, 0], [30, 1], [31, 1],
            [0, 30], [1, 30], [0, 31], [1, 31],
            [30, 30], [31, 30], [30, 31], [31, 31],
            [5, 0], [6, 0], [25, 0], [26, 0],
            [5, 31], [6, 31], [25, 31], [26, 31]
        ];
        villageTreePositions.forEach(([x, y]) => this.renderPlaceholderTree(x, y));

        // 广场周围的装饰树
        const squareTreePositions = [
            [8, 8], [8, 12], [22, 8], [22, 12],
            [10, 6], [20, 6], [10, 20], [20, 20]
        ];
        squareTreePositions.forEach(([x, y]) => this.renderPlaceholderTree(x, y));

        // 广场长凳
        this._renderBench(12, 13, time);
        this._renderBench(18, 13, time);

        // 传送点指示牌
        this._renderSign(0, 15, '← 1号道路', time);
        this._renderSign(15, 0, '↑ 村长家', time);
    }

    /**
     * 1号道路物体层 - 蜿蜒道路布局
     */
    _renderRoute01Objects() {
        const time = Date.now() / 1000;

        // 两侧的茂密森林
        for (let x = 0; x < 32; x += 2) {
            if (x > 1 && x < 30) {
                this.renderPlaceholderTree(x, 0);
                this.renderPlaceholderTree(x + 1, 0);
                this.renderPlaceholderTree(x, 1);
                this.renderPlaceholderTree(x, 31);
                this.renderPlaceholderTree(x + 1, 31);
                this.renderPlaceholderTree(x, 30);
            }
        }

        // 更多树木在道路远处
        for (let x = 0; x < 32; x += 3) {
            if (x > 2 && x < 29) {
                this.renderPlaceholderTree(x, 2);
                this.renderPlaceholderTree(x, 29);
            }
        }

        // 路边的路标
        this._renderSign(31, 15, '→ 新手村', time);

        // 草丛中的隐藏道具（视觉效果）
        this._renderHiddenItem(5, 8, time);
        this._renderHiddenItem(25, 22, time);
    }

    /**
     * 村长家物体层 - 日式房间布局
     */
    _renderMayorHouseObjects() {
        const time = Date.now() / 1000;

        // 壁龛里的卷轴和插花
        this._renderTokonomaScroll(2, 2, time);
        this._renderFlowerArrangement(3, 3, time);

        // 书桌和椅子
        this._renderJapaneseDesk(6, 2, time);
        this._renderZabuton(6, 4, time);
        this._renderZabuton(5, 4, time);

        // 茶具套装
        this._renderTeaSet(4, 4, time);

        // 灯笼
        this._renderPaperLantern(1, 1, time);
        this._renderPaperLantern(8, 1, time);

        // 推拉门（视觉效果）
        this._renderShojiDoor(5, 0, time);
    }

    // ========== 新手村物体辅助方法 ==========

    /**
     * 渲染普通村民住宅
     */
    _renderVillageHouse(x, y, width, height, wallColor, roofColor, label) {
        this.renderPlaceholderBuilding(x, y, width, height, wallColor, roofColor);
        if (label) {
            const time = Date.now() / 1000;
            const pulse = (Math.sin(time * 2) + 1) / 2;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#f9f002';
            this.ctx.shadowBlur = 5 + pulse * 5;
            this.ctx.font = 'bold 11px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, (x + width / 2) * TILE_SIZE, y * TILE_SIZE - 8);
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * 渲染村长家（更华丽）
     */
    _renderMayorHouse(x, y, width, height) {
        const time = Date.now() / 1000;
        const pulse = (Math.sin(time * 1.5) + 1) / 2;

        // 主体建筑
        this.renderPlaceholderBuilding(x, y, width, height, '#7a6a5a', '#5a4a3a');

        // 额外装饰：门前台阶
        this.ctx.fillStyle = '#6a5a4a';
        this.ctx.fillRect((x + 2) * TILE_SIZE, (y + height) * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE / 2);

        // 屋顶额外装饰
        this.ctx.fillStyle = '#d300c5';
        this.ctx.shadowColor = '#d300c5';
        this.ctx.shadowBlur = 10 + pulse * 10;
        this.ctx.beginPath();
        this.ctx.arc((x + width / 2) * TILE_SIZE, (y - 0.3) * TILE_SIZE, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // 门牌
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#f9f002';
        this.ctx.shadowBlur = 8 + pulse * 5;
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('村长家', (x + width / 2) * TILE_SIZE, y * TILE_SIZE - 10);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染商店建筑
     */
    _renderShopBuilding(x, y, width, height) {
        const time = Date.now() / 1000;
        const pulse = (Math.sin(time * 3) + 1) / 2;

        this.renderPlaceholderBuilding(x, y, width, height, '#6a5a7a', '#4a3a5a');

        // 商店招牌
        this.ctx.fillStyle = '#ff2a6d';
        this.ctx.shadowColor = '#ff2a6d';
        this.ctx.shadowBlur = 15 + pulse * 10;
        this.ctx.fillRect((x + 0.5) * TILE_SIZE, (y - 0.5) * TILE_SIZE, (width - 1) * TILE_SIZE, TILE_SIZE * 0.6);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('宝可梦商店', (x + width / 2) * TILE_SIZE, y * TILE_SIZE - 4);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染长椅
     */
    _renderBench(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;

        // 长椅座位
        this.ctx.fillStyle = '#6a4a2a';
        this.ctx.fillRect(screenX + 4, screenY + 16, TILE_SIZE - 8, 8);

        // 长椅靠背
        this.ctx.fillStyle = '#7a5a3a';
        this.ctx.fillRect(screenX + 4, screenY + 8, TILE_SIZE - 8, 6);

        // 椅腿
        this.ctx.fillStyle = '#4a3a1a';
        this.ctx.fillRect(screenX + 6, screenY + 24, 4, 6);
        this.ctx.fillRect(screenX + TILE_SIZE - 10, screenY + 24, 4, 6);
    }

    /**
     * 渲染指示牌
     */
    _renderSign(tileX, tileY, text, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const pulse = (Math.sin(time * 2) + 1) / 2;

        // 木杆
        this.ctx.fillStyle = '#5a4020';
        this.ctx.fillRect(screenX + 12, screenY + 12, 8, 20);

        // 牌子
        this.ctx.fillStyle = '#7a5a30';
        this.ctx.shadowColor = '#f9f002';
        this.ctx.shadowBlur = 5 + pulse * 5;
        this.ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 14);

        // 文字
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '9px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, screenX + TILE_SIZE / 2, screenY + 12);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染水池
     */
    _renderPond(startX, startY, width, height, time) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = startX + dx;
                const tileY = startY + dy;
                const screenX = tileX * TILE_SIZE;
                const screenY = tileY * TILE_SIZE;

                // 水的波动效果
                const wave = Math.sin(time * 2 + tileX * 0.5 + tileY * 0.7) * 0.3 + 0.7;

                // 水的渐变色
                const waterGradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SIZE);
                waterGradient.addColorStop(0, `rgba(30, 100, 180, ${0.8 * wave})`);
                waterGradient.addColorStop(0.5, `rgba(20, 80, 160, ${0.9 * wave})`);
                waterGradient.addColorStop(1, `rgba(10, 60, 140, ${wave})`);

                this.ctx.fillStyle = waterGradient;
                this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // 水面反光
                this.ctx.fillStyle = `rgba(100, 180, 255, ${0.2 * wave})`;
                this.ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 4);
            }
        }
    }

    // ========== 1号道路物体辅助方法 ==========

    /**
     * 渲染隐藏道具（视觉效果）
     */
    _renderHiddenItem(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const sparkle = Math.sin(time * 4 + tileX * 0.7 + tileY * 1.1);

        if (sparkle > 0.8) {
            this.ctx.fillStyle = `rgba(249, 240, 2, ${(sparkle - 0.8) * 5})`;
            this.ctx.shadowColor = '#f9f002';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    // ========== 村长家物体辅助方法 ==========

    /**
     * 渲染壁龛卷轴
     */
    _renderTokonomaScroll(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const glow = (Math.sin(time * 1.5) + 1) / 2;

        // 卷轴
        this.ctx.fillStyle = '#e8d5b7';
        this.ctx.shadowColor = '#ffaa64';
        this.ctx.shadowBlur = 8 + glow * 8;
        this.ctx.fillRect(screenX + 8, screenY + 2, 16, 28);

        // 卷轴轴
        this.ctx.fillStyle = '#4a3020';
        this.ctx.fillRect(screenX + 6, screenY, 20, 4);
        this.ctx.fillRect(screenX + 6, screenY + 28, 20, 4);

        // 卷轴上的简单画
        this.ctx.strokeStyle = '#3a2a1a';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + 12, screenY + 12);
        this.ctx.lineTo(screenX + 16, screenY + 8);
        this.ctx.lineTo(screenX + 20, screenY + 14);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染插花
     */
    _renderFlowerArrangement(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const sway = Math.sin(time * 1) * 2;

        // 花瓶
        this.ctx.fillStyle = '#5a6a8a';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + 10, screenY + 20);
        this.ctx.lineTo(screenX + 12, screenY + 28);
        this.ctx.lineTo(screenX + 20, screenY + 28);
        this.ctx.lineTo(screenX + 22, screenY + 20);
        this.ctx.closePath();
        this.ctx.fill();

        // 花枝
        this.ctx.strokeStyle = '#3a5a2a';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + 16, screenY + 20);
        this.ctx.quadraticCurveTo(screenX + 14 + sway, screenY + 12, screenX + 12 + sway, screenY + 6);
        this.ctx.stroke();

        // 花朵
        const pulse = (Math.sin(time * 2) + 1) / 2;
        this.ctx.fillStyle = `rgba(255, 150, 180, ${0.8 + pulse * 0.2})`;
        this.ctx.shadowColor = '#ff96b4';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.arc(screenX + 12 + sway, screenY + 6, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染日式书桌
     */
    _renderJapaneseDesk(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;

        // 书桌
        this.ctx.fillStyle = '#7a5a3a';
        this.ctx.fillRect(screenX + 2, screenY + 10, TILE_SIZE - 4, 8);

        // 桌腿
        this.ctx.fillStyle = '#5a4a2a';
        this.ctx.fillRect(screenX + 4, screenY + 18, 4, 12);
        this.ctx.fillRect(screenX + TILE_SIZE - 8, screenY + 18, 4, 12);

        // 桌上的砚台和毛笔
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(screenX + 6, screenY + 8, 6, 4);
        this.ctx.fillStyle = '#4a3a2a';
        this.ctx.fillRect(screenX + 16, screenY + 6, 2, 10);
    }

    /**
     * 渲染坐垫
     */
    _renderZabuton(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const pulse = (Math.sin(time * 1) + 1) / 2;

        // 坐垫
        this.ctx.fillStyle = '#c94a4a';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.roundRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8, 4);
        this.ctx.fill();

        // 坐垫边缘
        this.ctx.strokeStyle = '#a93a3a';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染茶具
     */
    _renderTeaSet(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const steam = Math.sin(time * 2) * 0.5 + 0.5;

        // 茶盘
        this.ctx.fillStyle = '#6a4a2a';
        this.ctx.fillRect(screenX + 6, screenY + 14, 20, 12);

        // 茶壶
        this.ctx.fillStyle = '#8a4a3a';
        this.ctx.beginPath();
        this.ctx.arc(screenX + 16, screenY + 14, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // 茶杯
        this.ctx.fillStyle = '#c9a66b';
        this.ctx.beginPath();
        this.ctx.arc(screenX + 10, screenY + 20, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(screenX + 22, screenY + 20, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // 热气
        if (steam > 0.3) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${steam * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 16, screenY + 6);
            this.ctx.quadraticCurveTo(screenX + 14, screenY + 4, screenX + 16, screenY + 2);
            this.ctx.stroke();
        }
    }

    /**
     * 渲染纸灯笼
     */
    _renderPaperLantern(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const pulse = (Math.sin(time * 2 + tileX) + 1) / 2;

        // 灯笼主体
        this.ctx.fillStyle = `rgba(255, 180, 100, ${0.7 + pulse * 0.3})`;
        this.ctx.shadowColor = '#ffb464';
        this.ctx.shadowBlur = 15 + pulse * 10;
        this.ctx.beginPath();
        this.ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 10, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 灯笼上下边框
        this.ctx.fillStyle = '#4a3020';
        this.ctx.fillRect(screenX + 8, screenY + 4, 16, 4);
        this.ctx.fillRect(screenX + 8, screenY + TILE_SIZE - 8, 16, 4);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染推拉门（视觉效果）
     */
    _renderShojiDoor(tileX, tileY, time) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;

        // 门框
        this.ctx.fillStyle = '#5a4020';
        this.ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);

        // 门纸
        this.ctx.fillStyle = 'rgba(240, 235, 220, 0.8)';
        this.ctx.fillRect(screenX + 4, screenY, TILE_SIZE - 8, TILE_SIZE - 4);

        // 门框格子
        this.ctx.strokeStyle = '#5a4020';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + TILE_SIZE / 2, screenY);
        this.ctx.lineTo(screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 4);
        this.ctx.moveTo(screenX + 4, screenY + TILE_SIZE / 2);
        this.ctx.lineTo(screenX + TILE_SIZE - 4, screenY + TILE_SIZE / 2);
        this.ctx.stroke();
    }

    /**
     * 渲染占位符建筑 - 复古未来主义霓虹风格
     */
    renderPlaceholderBuilding(x, y, width, height, wallColor, roofColor) {
        const time = Date.now() / 1000;

        // 墙壁 - 渐变和纹理
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileX = (x + dx) * TILE_SIZE;
                const tileY = (y + dy) * TILE_SIZE;
                const isEdge = dy === 0 || dx === 0 || dx === width - 1;

                // 墙壁渐变
                const wallGradient = this.ctx.createLinearGradient(tileX, tileY, tileX, tileY + TILE_SIZE);
                const brightnessMod = isEdge ? -10 : (dy % 2 === 0 ? 5 : 0);
                wallGradient.addColorStop(0, this._adjustMapColorBrightness(wallColor, 10 + brightnessMod));
                wallGradient.addColorStop(0.5, this._adjustMapColorBrightness(wallColor, brightnessMod));
                wallGradient.addColorStop(1, this._adjustMapColorBrightness(wallColor, -15 + brightnessMod));

                this.ctx.fillStyle = wallGradient;
                this.ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

                // 砖块纹理
                if (!isEdge || dy > 0) {
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(tileX + 1, tileY + 1, TILE_SIZE - 2, TILE_SIZE / 2 - 1);
                    this.ctx.strokeRect(tileX + 1, tileY + TILE_SIZE / 2, TILE_SIZE - 2, TILE_SIZE / 2 - 1);
                }
            }
        }

        // 屋顶 - 霓虹发光
        this._renderBuildingRoof(x, y, width, roofColor, time);

        // 霓虹门窗边框
        this._renderBuildingNeonAccents(x, y, width, height, time);

        // 门
        if (this.currentMap?.id === 'town_01' && x === 3 && y === 2) {
            this._renderBuildingDoor(x + 2, y + 4, time);
        }
    }

    /**
     * 渲染建筑屋顶 - 霓虹发光
     * @private
     */
    _renderBuildingRoof(x, y, width, roofColor, time) {
        const roofPulse = (Math.sin(time * 2) + 1) / 2;

        // 屋顶基础
        const roofGradient = this.ctx.createLinearGradient(
            x * TILE_SIZE, (y - 1) * TILE_SIZE,
            x * TILE_SIZE, y * TILE_SIZE
        );
        roofGradient.addColorStop(0, this._adjustMapColorBrightness(roofColor, 20));
        roofGradient.addColorStop(1, roofColor);

        this.ctx.fillStyle = roofGradient;
        this.ctx.shadowColor = 'rgba(255, 42, 109, 0.5)';
        this.ctx.shadowBlur = 10 + roofPulse * 10;

        for (let dx = 0; dx < width; dx++) {
            this.ctx.fillRect(
                (x + dx) * TILE_SIZE,
                (y - 1) * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE / 2
            );
        }

        this.ctx.shadowBlur = 0;

        // 屋顶霓虹边缘
        this.ctx.strokeStyle = `rgba(255, 42, 109, ${0.5 + roofPulse * 0.3})`;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#ff2a6d';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(x * TILE_SIZE - 2, y * TILE_SIZE);
        this.ctx.lineTo(x * TILE_SIZE - 2, (y - 1) * TILE_SIZE + TILE_SIZE / 2);
        this.ctx.lineTo((x + width) * TILE_SIZE + 2, (y - 1) * TILE_SIZE + TILE_SIZE / 2);
        this.ctx.lineTo((x + width) * TILE_SIZE + 2, y * TILE_SIZE);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染建筑霓虹装饰
     * @private
     */
    _renderBuildingNeonAccents(x, y, width, height, time) {
        const neonPulse = (Math.sin(time * 3 + x) + 1) / 2;

        // 建筑角落霓虹
        const corners = [
            [x, y],
            [x + width, y],
            [x, y + height],
            [x + width, y + height]
        ];

        this.ctx.fillStyle = `rgba(5, 217, 232, ${0.6 + neonPulse * 0.4})`;
        this.ctx.shadowColor = '#05d9e8';
        this.ctx.shadowBlur = 15;

        corners.forEach(([cx, cy]) => {
            this.ctx.beginPath();
            this.ctx.arc(cx * TILE_SIZE, cy * TILE_SIZE, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染建筑门 - 带霓虹效果
     * @private
     */
    _renderBuildingDoor(tileX, tileY, time) {
        const doorX = tileX * TILE_SIZE + 8;
        const doorY = tileY * TILE_SIZE;
        const doorWidth = TILE_SIZE - 16;
        const doorHeight = TILE_SIZE;
        const doorGlow = (Math.sin(time * 2) + 1) / 2;

        // 门渐变
        const doorGradient = this.ctx.createLinearGradient(doorX, doorY, doorX + doorWidth, doorY + doorHeight);
        doorGradient.addColorStop(0, '#5a4030');
        doorGradient.addColorStop(0.5, '#4a3020');
        doorGradient.addColorStop(1, '#3a2010');

        this.ctx.fillStyle = doorGradient;
        this.ctx.shadowColor = 'rgba(249, 240, 2, 0.3)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(doorX, doorY, doorWidth, doorHeight);

        // 门霓虹边框
        this.ctx.strokeStyle = `rgba(249, 240, 2, ${0.5 + doorGlow * 0.5})`;
        this.ctx.shadowColor = '#f9f002';
        this.ctx.shadowBlur = 10 + doorGlow * 10;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);

        // 门把手
        this.ctx.fillStyle = `rgba(249, 240, 2, ${0.8 + doorGlow * 0.2})`;
        this.ctx.beginPath();
        this.ctx.arc(doorX + doorWidth - 6, doorY + doorHeight / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染草叶细节
     * @private
     */
    _renderGrassBlade(screenX, screenY, seed) {
        this.ctx.save();
        this.ctx.strokeStyle = `rgba(57, 255, 20, ${0.3 + (seed % 20) / 100})`;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 4;

        const startX = screenX + (seed % TILE_SIZE);
        const startY = screenY + TILE_SIZE;
        const controlX = startX + (seed % 6) - 3;
        const controlY = screenY + TILE_SIZE / 2;
        const endX = startX + (seed % 8) - 4;
        const endY = screenY + (seed % 10);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * 调整地图颜色亮度
     * @private
     */
    _adjustMapColorBrightness(hexColor, amount) {
        const hex = hexColor.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * 渲染占位符树木 - 霓虹发光风格
     */
    renderPlaceholderTree(x, y) {
        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;
        const time = Date.now() / 1000;
        const windSway = Math.sin(time * 1.5 + x * 0.7 + y * 1.1) * 2;

        // 树干 - 木质渐变
        const trunkGradient = this.ctx.createLinearGradient(screenX + 12, screenY + 16, screenX + 20, screenY + 32);
        trunkGradient.addColorStop(0, '#6b4a2a');
        trunkGradient.addColorStop(0.5, '#5a3a1a');
        trunkGradient.addColorStop(1, '#4a2a0a');
        this.ctx.fillStyle = trunkGradient;
        this.ctx.fillRect(screenX + 12, screenY + 16, 8, 16);

        // 树干纹理
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 13 + i * 2, screenY + 17);
            this.ctx.lineTo(screenX + 14 + i * 2, screenY + 31);
            this.ctx.stroke();
        }

        // 树冠 - 多层发光效果
        const canopyColors = [
            { color: '#1a4a0a', shadow: 'rgba(57, 255, 20, 0.3)', radius: 14, y: 12 },
            { color: '#2a6a1a', shadow: 'rgba(57, 255, 20, 0.4)', radius: 11, y: 10 },
            { color: '#3a8a2a', shadow: 'rgba(57, 255, 20, 0.5)', radius: 8, y: 8 }
        ];

        canopyColors.forEach((canopy, index) => {
            const swayOffset = windSway * (1 - index * 0.2);
            this.ctx.fillStyle = canopy.color;
            this.ctx.shadowColor = canopy.shadow;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(
                screenX + 16 + swayOffset,
                screenY + canopy.y,
                canopy.radius,
                0, Math.PI * 2
            );
            this.ctx.fill();
        });

        this.ctx.shadowBlur = 0;

        // 树叶高光/萤火虫
        const sparkle = Math.sin(time * 4 + x + y * 2);
        if (sparkle > 0.8) {
            this.ctx.fillStyle = 'rgba(249, 240, 2, 0.9)';
            this.ctx.shadowColor = '#f9f002';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(
                screenX + 12 + Math.sin(time + x) * 6,
                screenY + 8 + Math.cos(time + y) * 4,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * 渲染占位符覆盖层
     */
    renderPlaceholderOverlay() {
        // 树冠等覆盖效果在占位符模式中已在物体层渲染
    }

    /**
     * 渲染占位符角色 - 复古未来主义霓虹风格
     */
    renderPlaceholderCharacter(char, screenX, screenY) {
        if (char.type === 'starter_display') {
            this._renderStarterDisplayCharacter(char, screenX, screenY);
            return;
        }

        const isPlayer = char.type === 'player';
        const time = Date.now() / 1000;

        // 角色配色 - 霓虹色系
        const bodyColor = isPlayer ? '#05d9e8' : '#d300c5';
        const bodyGlowColor = isPlayer ? 'rgba(5, 217, 232, 0.6)' : 'rgba(211, 0, 197, 0.6)';
        const headColor = isPlayer ? '#ffd5c8' : '#ffc8d8';

        // 角色阴影/发光底座
        this.ctx.shadowColor = bodyGlowColor;
        this.ctx.shadowBlur = 15;

        // 身体 - 霓虹渐变
        const bodyGradient = this.ctx.createLinearGradient(
            screenX + 4, screenY + 8,
            screenX + TILE_SIZE - 4, screenY + TILE_SIZE
        );
        bodyGradient.addColorStop(0, bodyColor);
        bodyGradient.addColorStop(1, this._adjustMapColorBrightness(bodyColor, -40));
        this.ctx.fillStyle = bodyGradient;

        // 圆角身体
        this._drawRoundedRect(screenX + 6, screenY + 10, TILE_SIZE - 12, TILE_SIZE - 14, 6);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;

        // 角色头部 - 带高光
        this.ctx.shadowColor = bodyGlowColor;
        this.ctx.shadowBlur = 8;

        const headGradient = this.ctx.createRadialGradient(
            screenX + 14, screenY + 10, 0,
            screenX + 16, screenY + 12, 10
        );
        headGradient.addColorStop(0, '#ffffff');
        headGradient.addColorStop(0.3, headColor);
        headGradient.addColorStop(1, this._adjustMapColorBrightness(headColor, -30));
        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.arc(screenX + 16, screenY + 12, 9, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;

        // 眼睛 - 赛博风格
        this.ctx.fillStyle = isPlayer ? '#ff2a6d' : '#05d9e8';
        this.ctx.shadowColor = isPlayer ? '#ff2a6d' : '#05d9e8';
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.arc(screenX + 13, screenY + 11, 2, 0, Math.PI * 2);
        this.ctx.arc(screenX + 19, screenY + 11, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // 方向指示器 - 霓虹箭头
        this._renderDirectionIndicator(char, screenX, screenY, time, bodyColor);

        // NPC 名称标签 - 霓虹发光
        if (char.type === 'npc' && char.npcId) {
            this._renderNPCLabel(char, screenX, screenY, time);
        }

        // 移动时的粒子特效
        if (char.moving) {
            this._renderMovingParticles(screenX, screenY, time, bodyColor);
        }
    }

    _renderStarterDisplayCharacter(char, screenX, screenY) {
        const time = Date.now() / 1000;
        const palette = {
            fire_dragon: { primary: '#ff6b35', secondary: '#ffd166', accent: '#ff2a6d' },
            water_dragon: { primary: '#05d9e8', secondary: '#bde0fe', accent: '#39a0ed' },
            grass_dragon: { primary: '#39ff14', secondary: '#caffbf', accent: '#2ec4b6' }
        };
        const colors = palette[char.monsterId] || { primary: '#d300c5', secondary: '#ffd6ff', accent: '#ffffff' };
        const pulse = (Math.sin(time * 3 + screenX * 0.05) + 1) / 2;

        this.ctx.save();

        this.ctx.fillStyle = 'rgba(20, 24, 40, 0.9)';
        this.ctx.shadowColor = colors.primary;
        this.ctx.shadowBlur = 12 + pulse * 6;
        this.ctx.fillRect(screenX + 5, screenY + 22, TILE_SIZE - 10, 8);

        this.ctx.fillStyle = colors.primary;
        this.ctx.fillRect(screenX + 9, screenY + 18, TILE_SIZE - 18, 5);

        const orbGradient = this.ctx.createRadialGradient(
            screenX + TILE_SIZE / 2 - 2,
            screenY + 14,
            2,
            screenX + TILE_SIZE / 2,
            screenY + 16,
            12
        );
        orbGradient.addColorStop(0, '#ffffff');
        orbGradient.addColorStop(0.35, colors.secondary);
        orbGradient.addColorStop(1, colors.primary);
        this.ctx.fillStyle = orbGradient;
        this.ctx.beginPath();
        this.ctx.arc(screenX + TILE_SIZE / 2, screenY + 15, 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = colors.accent;
        this.ctx.beginPath();
        this.ctx.arc(screenX + TILE_SIZE / 2 - 3, screenY + 13, 4, 0, Math.PI * 2);
        this.ctx.arc(screenX + TILE_SIZE / 2 + 4, screenY + 12, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = colors.primary;
        this.ctx.shadowBlur = 8;
        this.ctx.font = 'bold 10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(char.label || '初始精灵', screenX + TILE_SIZE / 2, screenY - 4);

        this.ctx.restore();
    }

    /**
     * 绘制圆角矩形
     * @private
     */
    _drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * 渲染方向指示器 - 霓虹箭头
     * @private
     */
    _renderDirectionIndicator(char, screenX, screenY, time, bodyColor) {
        const pulse = (Math.sin(time * 5) + 1) / 2;
        const dirOffset = {
            up: [0, -8],
            down: [0, 8],
            left: [-8, 0],
            right: [8, 0]
        };
        const [dx, dy] = dirOffset[char.direction] || [0, 8];

        this.ctx.fillStyle = bodyColor;
        this.ctx.shadowColor = bodyColor;
        this.ctx.shadowBlur = 8 + pulse * 6;
        this.ctx.beginPath();

        const centerX = screenX + 16 + dx;
        const centerY = screenY + 14 + dy;
        const size = 4 + pulse * 2;

        if (char.direction === 'up') {
            this.ctx.moveTo(centerX, centerY - size);
            this.ctx.lineTo(centerX - size, centerY + size);
            this.ctx.lineTo(centerX + size, centerY + size);
        } else if (char.direction === 'down') {
            this.ctx.moveTo(centerX, centerY + size);
            this.ctx.lineTo(centerX - size, centerY - size);
            this.ctx.lineTo(centerX + size, centerY - size);
        } else if (char.direction === 'left') {
            this.ctx.moveTo(centerX - size, centerY);
            this.ctx.lineTo(centerX + size, centerY - size);
            this.ctx.lineTo(centerX + size, centerY + size);
        } else {
            this.ctx.moveTo(centerX + size, centerY);
            this.ctx.lineTo(centerX - size, centerY - size);
            this.ctx.lineTo(centerX - size, centerY + size);
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染 NPC 名称标签 - 霓虹发光风格
     * @private
     */
    _renderNPCLabel(char, screenX, screenY, time) {
        const label = char.npcId === 'npc_01' ? '欢迎' :
                     char.npcId === 'npc_shop' ? '商店' :
                     char.npcId === 'npc_mayor' ? '村长' : char.npcId;

        const labelPulse = (Math.sin(time * 3) + 1) / 2;

        this.ctx.shadowColor = '#d300c5';
        this.ctx.shadowBlur = 10 + labelPulse * 5;
        this.ctx.fillStyle = '#f0f0ff';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';

        // 标签背景
        const textWidth = this.ctx.measureText(label).width;
        const bgGradient = this.ctx.createLinearGradient(
            screenX + 16 - textWidth / 2 - 8, screenY - 16,
            screenX + 16 + textWidth / 2 + 8, screenY - 4
        );
        bgGradient.addColorStop(0, 'rgba(211, 0, 197, 0.8)');
        bgGradient.addColorStop(1, 'rgba(45, 27, 78, 0.9)');

        this.ctx.fillStyle = bgGradient;
        this._drawRoundedRect(
            screenX + 16 - textWidth / 2 - 8,
            screenY - 20,
            textWidth + 16,
            16,
            4
        );
        this.ctx.fill();

        // 标签文本
        this.ctx.fillStyle = '#f0f0ff';
        this.ctx.fillText(label, screenX + 16, screenY - 8);
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染移动时的粒子特效
     * @private
     */
    _renderMovingParticles(screenX, screenY, time, bodyColor) {
        for (let i = 0; i < 3; i++) {
            const offset = ((time * 2 + i * 0.3) % 1);
            const alpha = 1 - offset;
            const particleY = screenY + TILE_SIZE - 4 + offset * 8;

            this.ctx.fillStyle = `rgba(249, 240, 2, ${alpha * 0.6})`;
            this.ctx.shadowColor = '#f9f002';
            this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.arc(
                screenX + 8 + i * 8,
                particleY,
                2 * alpha,
                0, Math.PI * 2
            );
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;
    }

    /**
     * 渲染占位符图块
     */
    renderPlaceholderTile(screenX, screenY, tileId, layerType) {
        // 占位符模式中已由专门的函数处理
    }

    /**
     * 使用精灵图渲染图块（预留接口）
     */
    renderSpriteTile(screenX, screenY, tileId, layerType) {
        // 待实现：加载图块集并渲染
        this.renderPlaceholderTile(screenX, screenY, tileId, layerType);
    }

    /**
     * 使用精灵图渲染角色（预留接口）
     */
    renderSpriteCharacter(char, screenX, screenY) {
        // 待实现：加载角色精灵并渲染
        this.renderPlaceholderCharacter(char, screenX, screenY);
    }

    /**
     * 渲染调试信息
     */
    renderDebugInfo(renderState) {
        const collisionMap = renderState?.collisionMap;
        if (!collisionMap) return;

        this.ctx.save();
        this.ctx.globalAlpha = 0.35;

        for (let y = this.visibleTiles.startY; y < this.visibleTiles.endY; y++) {
            const row = collisionMap[y];
            if (!row) continue;

            for (let x = this.visibleTiles.startX; x < this.visibleTiles.endX; x++) {
                const cell = row[x];
                if (cell !== CollisionRenderType.BLOCKED && cell !== CollisionRenderType.WATER) continue;

                const screenPos = this.mapToScreen(x, y);
                this.ctx.fillStyle = cell === CollisionRenderType.BLOCKED
                    ? 'rgba(255, 80, 80, 0.45)'
                    : 'rgba(80, 160, 255, 0.45)';
                this.ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
            }
        }

        const encounterPos = renderState?.encounterPos;
        if (encounterPos &&
            encounterPos.mapId === this.currentMap?.id &&
            Number.isFinite(encounterPos.x) &&
            Number.isFinite(encounterPos.y)) {
            const screenPos = this.mapToScreen(encounterPos.x, encounterPos.y);
            const centerX = screenPos.x + TILE_SIZE / 2;
            const centerY = screenPos.y + TILE_SIZE / 2;

            this.ctx.save();
            this.ctx.globalAlpha = 0.85;
            this.ctx.strokeStyle = '#ff4d4f';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, TILE_SIZE * 0.35, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    /**
     * 屏幕坐标转地图坐标
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     * @returns {Object} 地图坐标 {x, y}
     */
    screenToMap(screenX, screenY) {
        return {
            x: Math.floor((screenX + this.camera.x) / TILE_SIZE),
            y: Math.floor((screenY + this.camera.y) / TILE_SIZE)
        };
    }

    /**
     * 地图坐标转屏幕坐标
     * @param {number} mapX - 地图X坐标
     * @param {number} mapY - 地图Y坐标
     * @returns {Object} 屏幕坐标 {x, y}
     */
    mapToScreen(mapX, mapY) {
        return {
            x: mapX * TILE_SIZE - this.camera.x,
            y: mapY * TILE_SIZE - this.camera.y
        };
    }

    /**
     * 获取图块尺寸
     * @returns {number} 图块尺寸（像素）
     */
    getTileSize() {
        return TILE_SIZE;
    }
}

// 创建全局实例（在需要时初始化）
let mapRenderer = null;

/**
 * 初始化地图渲染器
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @param {CanvasRenderingContext2D} ctx - 2D 上下文
 * @returns {MapRenderer} 渲染器实例
 */
function initMapRenderer(canvas, ctx) {
    mapRenderer = new MapRenderer(canvas, ctx);
    return mapRenderer;
}

/**
 * 获取地图渲染器实例
 * @returns {MapRenderer|null} 渲染器实例
 */
function getMapRenderer() {
    return mapRenderer;
}

// 暴露到 window 对象上，供其他模块访问
window.TILE_SIZE = TILE_SIZE;
window.RENDER_LAYERS = RENDER_LAYERS;
window.CollisionRenderType = CollisionRenderType;
window.MapRenderer = MapRenderer;
window.mapRenderer = mapRenderer;
window.initMapRenderer = initMapRenderer;
window.getMapRenderer = getMapRenderer;
