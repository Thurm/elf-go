/**
 * 像素精灵渲染器
 * 负责渲染 64x64 像素风格的怪兽精灵
 */

/**
 * 精灵渲染器类
 */
class SpriteRenderer {
    ctx: CanvasRenderingContext2D | null;
    pixelScale: number;

    constructor() {
        this.ctx = null;
        this.pixelScale = 2; // 像素放大倍数
    }

    /**
     * 初始化渲染器
     */
    init(ctx) {
        this.ctx = ctx;
    }

    /**
     * 渲染像素精灵
     * @param {Array} spriteData - 像素精灵数据 (二维数组)
     * @param {number} x - 渲染位置 X
     * @param {number} y - 渲染位置 Y
     * @param {number} scale - 缩放比例 (默认 1)
     */
    renderSprite(spriteData, x, y, scale = 1) {
        if (!this.ctx || !spriteData) return;

        const ctx = this.ctx;
        const pixelSize = this.pixelScale * scale;

        ctx.save();

        for (let row = 0; row < spriteData.length; row++) {
            for (let col = 0; col < spriteData[row].length; col++) {
                const color = spriteData[row][col];
                if (color !== null) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + col * pixelSize,
                        y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }

        ctx.restore();
    }

    /**
     * 渲染怪兽精灵（带发光效果）
     */
    renderMonsterSprite(monsterId, x, y, isEnemy = false, scale = 1.5) {
        const MonsterSprites = window.MonsterSprites || {};
        const sprite = MonsterSprites[monsterId];
        if (!sprite) {
            // 回退到圆形渲染
            this._renderFallbackMonster(x, y, isEnemy, scale);
            return;
        }

        const ctx = this.ctx;
        const spriteData = sprite.front;
        const time = Date.now() / 1000;
        const floatOffset = Math.sin(time * 2 + (isEnemy ? 0 : Math.PI)) * 3;

        // 计算居中位置
        const spriteWidth = spriteData[0]?.length || 32;
        const spriteHeight = spriteData.length || 32;
        const centeredX = x - (spriteWidth * this.pixelScale * scale) / 2;
        const centeredY = y - (spriteHeight * this.pixelScale * scale) / 2 + floatOffset;

        // 发光效果
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this._getMonsterGlowColor(monsterId);

        this.renderSprite(spriteData, centeredX, centeredY, scale);

        ctx.restore();
    }

    /**
     * 获取怪兽发光颜色
     */
    _getMonsterGlowColor(monsterId) {
        const colors = {
            fire_dragon: 'rgba(255, 100, 50, 0.6)',
            water_dragon: 'rgba(50, 150, 255, 0.6)',
            grass_dragon: 'rgba(50, 255, 100, 0.6)',
            water_turtle: 'rgba(80, 200, 200, 0.6)',
            grass_bunny: 'rgba(150, 255, 100, 0.6)',
        };
        return colors[monsterId] || 'rgba(200, 200, 200, 0.4)';
    }

    /**
     * 回退渲染（圆形）
     */
    _renderFallbackMonster(x, y, isEnemy, scale) {
        const ctx = this.ctx;
        const size = (isEnemy ? 80 : 100) * scale;
        const time = Date.now() / 1000;
        const floatOffset = Math.sin(time * 2 + (isEnemy ? 0 : Math.PI)) * 3;

        const elementColors = {
            fire: '#ff4444',
            water: '#4488ff',
            grass: '#44cc44',
            electric: '#ffcc44',
            normal: '#999999',
        };

        const mainColor = elementColors.normal;

        // 地面阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + size / 2 + 20, size / 2.5, size / 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 怪兽身体
        const bodyGradient = ctx.createRadialGradient(x, y + floatOffset, 0, x, y + floatOffset, size / 2);
        bodyGradient.addColorStop(0, this._adjustColorBrightness(mainColor, 30));
        bodyGradient.addColorStop(0.7, mainColor);
        bodyGradient.addColorStop(1, this._adjustColorBrightness(mainColor, -30));

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
            ctx.moveTo(x - 15, y + 15 + floatOffset);
            ctx.lineTo(x + 15, y + 15 + floatOffset);
        } else {
            ctx.arc(x, y + 10 + floatOffset, 15, 0.2, Math.PI - 0.2);
        }
        ctx.stroke();
    }

    /**
     * 调整颜色亮度
     */
    _adjustColorBrightness(hexColor, amount) {
        const hex = hexColor.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// 暴露到全局
window.SpriteRenderer = SpriteRenderer;
