/**
 * UI 管理器 - 负责对话框、通知与轻量级 HUD 的管理和渲染
 * 菜单系统由 MenuUI 独立接管
 */

// UI 颜色常量 - 简约像素风
const UIColors = {
    PANEL: '#162029',
    PANEL_ALT: '#1d2a35',
    PANEL_DEEP: '#0d151c',
    BORDER: '#587284',
    BORDER_STRONG: '#9cb5c7',
    ACCENT: '#8fd3ff',
    ACCENT_DIM: '#6ea6c1',
    TEXT: '#f2f5f7',
    TEXT_SOFT: '#c0cad2',
    TEXT_MUTED: '#8e9ba7',
    SUCCESS: '#9bd18b',
    WARNING: '#e6c97a',
    DANGER: '#d98873',
    SHADOW: 'rgba(0, 0, 0, 0.35)',

    // 兼容旧名称的别名
    NEON_PINK: '#d98873',
    NEON_CYAN: '#8fd3ff',
    NEON_PURPLE: '#9d8fc9',
    NEON_YELLOW: '#e6c97a',
    NEON_GREEN: '#9bd18b',
    NEON_ORANGE: '#d8a26e',
    DEEP_SPACE: '#0d151c',
    COSMIC_PURPLE: '#1d2a35',
    VOID_BLACK: '#091015',
    STARLIGHT: '#f2f5f7',
    ELECTRIC_BLUE: '#6ea6c1',
    PRIMARY_BLUE: '#8fd3ff',
    DARK_BLUE: '#1d2a35',
    LIGHT_BLUE: '#6ea6c1',
    PRIMARY_RED: '#d98873',
    DARK_RED: '#9a6456',
    PRIMARY_GREEN: '#9bd18b',
    DARK_GREEN: '#658c59',
    PRIMARY_YELLOW: '#e6c97a',
    GOLD: '#e6c97a',
    BACKGROUND: '#0d151c',
    DARK_GRAY: '#24323c',
    MEDIUM_GRAY: '#50606d',
    LIGHT_GRAY: '#c0cad2'
};

// UI 状态
const UIState = {
    NONE: 'none',
    DIALOG: 'dialog',
    BATTLE: 'battle',
    NOTIFICATION: 'notification'
} as const;

/**
 * 安全播放音效的辅助函数
 * @param {string} soundId - 音效ID
 */
function uiSafePlaySound(soundId?: string): void {
    if (!soundId) return;
    if (typeof window.audioManager !== 'undefined' && window.audioManager.playSound) {
        window.audioManager.playSound(soundId);
    }
}

/**
 * UI 管理器类
 */
class UIManager {
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    initialized = false;
    state: UIStateValue = UIState.NONE;
    components = new Map();
    activeComponent: unknown = null;
    dialogQueue: UIDialogState[] = [];
    currentDialog: UIDialogState | null = null;
    dialogVisible = false;
    notifications: UINotification[] = [];

    constructor() {
        // 事件绑定
        this._setupEventListeners();
    }

    /**
     * 初始化 UI 管理器
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @param {CanvasRenderingContext2D} ctx - 2D 上下文
     */
    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.initialized = true;

        console.log('UIManager 初始化成功');
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        // 监听通知事件
        eventBus.on(GameEvents.UI_NOTIFICATION, (data) => {
            this.showNotification(data.message, data.type);
        });

        // 监听对话事件
        eventBus.on(GameEvents.DIALOG_START, (data) => {
            this.showDialog(data);
        });

        eventBus.on(GameEvents.DIALOG_END, () => {
            this.hideDialog();
        });

        // 注意：DIALOG_NEXT 事件只由 DialogSystem 处理
        // UIManager 只通过 dialog:show_line 和 dialog:show_choices 事件更新UI

        // 监听显示对话行事件（DialogSystem 发出）
        eventBus.on('dialog:show_line', (data) => {
            console.log('[UIManager] 收到 dialog:show_line 事件:', data);
            if (data) {
                // 更新当前对话框内容
                this.showDialog({
                    speaker: data.speaker,
                    text: data.text,
                    choices: data.choices || null
                });
            }
        });

        eventBus.on('dialog:show_choices', (data) => {
            console.log('[UIManager] 收到 dialog:show_choices 事件:', data);
            if (!data || !Array.isArray(data.choices)) return;

            if (!this.currentDialog) {
                this.showDialog({
                    speaker: '',
                    text: '',
                    choices: data.choices
                });
                return;
            }

            this.currentDialog.choices = data.choices;
            this.currentDialog.selectedChoice = 0;
            this.dialogVisible = true;
            this.state = UIState.DIALOG;
        });
    }

    // ==================== 对话框系统 ====================

    /**
     * 显示对话框
     * @param {Object} data - 对话数据
     */
    showDialog(data) {
        console.log('[UIManager.showDialog] 收到数据:', data);
        if (!data) return;

        this.currentDialog = {
            speaker: data.speaker || '',
            text: data.text || '',
            choices: data.choices || null,
            currentPage: 0,
            totalPages: 1
        };

        console.log('[UIManager.showDialog] 设置了 this.currentDialog:', this.currentDialog);
        // 分页处理长文本
        this._paginateDialogText();
        console.log('[UIManager.showDialog] 分页后的 this.currentDialog:', this.currentDialog);

        this.dialogVisible = true;
        this.state = UIState.DIALOG;

        uiSafePlaySound(window.SoundID?.MENU_OPEN);
    }

    /**
     * 对对话文本进行分页
     * @private
     */
    _paginateDialogText() {
        if (!this.currentDialog) return;

        const text = this.currentDialog.text;
        const maxCharsPerLine = 40;
        const maxLinesPerPage = 3;

        // 简单的分页逻辑
        const lines = [];
        let currentLine = '';
        const words = text.split('');

        for (const char of words) {
            if (currentLine.length >= maxCharsPerLine || char === '\n') {
                lines.push(currentLine);
                currentLine = char === '\n' ? '' : char;
            } else {
                currentLine += char;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        this.currentDialog.pages = [];
        for (let i = 0; i < lines.length; i += maxLinesPerPage) {
            this.currentDialog.pages.push(lines.slice(i, i + maxLinesPerPage));
        }
        this.currentDialog.totalPages = this.currentDialog.pages.length;
        this.currentDialog.currentPage = 0;
    }

    /**
     * 对话框下一页
     * @returns {boolean} 是否还有下一页
     */
    dialogNext() {
        if (!this.currentDialog) return false;

        if (this.currentDialog.choices && this.currentDialog.choices.length > 0) {
            // 有选择项时不翻页
            return false;
        }

        if (this.currentDialog.currentPage < this.currentDialog.totalPages - 1) {
            this.currentDialog.currentPage++;
            uiSafePlaySound(window.SoundID?.CURSOR_MOVE);
            return true;
        }

        // 没有更多页了，交由 DialogSystem 推进下一行
        return false;
    }

    /**
     * 选择对话框选项
     * @param {number} index - 选项索引
     */
    selectDialogChoice(index) {
        if (!this.currentDialog || !this.currentDialog.choices) return;

        const choice = this.currentDialog.choices[index];
        if (choice) {
            uiSafePlaySound(window.SoundID?.CONFIRM);
            eventBus.emit(GameEvents.DIALOG_CHOICE, { choiceIndex: index, choice: index, value: choice.value });
        }
    }

    /**
     * 隐藏对话框
     */
    hideDialog() {
        // 防止无限递归调用
        if (!this.dialogVisible && !this.currentDialog) {
            console.log('[UIManager.hideDialog] 已隐藏，跳过');
            return;
        }

        console.log('[UIManager.hideDialog] 正在隐藏对话框');
        this.currentDialog = null;
        this.dialogVisible = false;
        if (this.state === UIState.DIALOG) {
            this.state = UIState.NONE;
        }
        // 由 DialogSystem 统一发射 DIALOG_END
    }

    /**
     * 渲染对话框
     */
    renderDialog() {
        if (!this.dialogVisible || !this.currentDialog || !this.ctx) return;

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const dialogWidth = canvasWidth - 40;
        const dialogHeight = 120;
        const dialogX = 20;
        const dialogY = canvasHeight - dialogHeight - 20;

        // 绘制对话框背景
        this._drawDialogBox(dialogX, dialogY, dialogWidth, dialogHeight);

        this.ctx.save();

        if (this.currentDialog.speaker) {
            this.ctx.fillStyle = UIColors.ACCENT;
            this.ctx.font = 'bold 16px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(this.currentDialog.speaker, dialogX + 20, dialogY + 24);
        }

        const textY = this.currentDialog.speaker ? dialogY + 50 : dialogY + 34;
        this.ctx.fillStyle = UIColors.TEXT;
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'left';

        let pages;
        if (this.currentDialog.pages && this.currentDialog.pages.length > 0) {
            pages = this.currentDialog.pages;
        } else {
            // 如果没有分页的话，直接用原始文本
            pages = [this.currentDialog.text.split('\n')];
        }
        const currentPageLines = pages[this.currentDialog.currentPage] || [];

        currentPageLines.forEach((line, i) => {
            this.ctx.fillText(line, dialogX + 20, textY + i * 24);
        });

        // 绘制选择项
        if (this.currentDialog.choices && this.currentDialog.choices.length > 0) {
            this._renderDialogChoices(dialogX, dialogY - 20, dialogWidth);
        }

        // 绘制下一页指示箭头
        if (!this.currentDialog.choices && this.currentDialog.currentPage < this.currentDialog.totalPages - 1) {
            this._drawContinueIndicator(dialogX + dialogWidth - 30, dialogY + dialogHeight - 15);
        }

        this.ctx.restore();
    }

    /**
     * 绘制对话框选择项
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @private
     */
    _renderDialogChoices(x, y, width) {
        const choices = this.currentDialog.choices;
        const choiceHeight = 35;
        const totalHeight = choices.length * choiceHeight + 20;
        const boxY = y - totalHeight;

        // 绘制选择框背景
        this._drawDialogBox(x, boxY, width, totalHeight);

        // 绘制选择项
        this.ctx.font = '15px monospace';
        choices.forEach((choice, i) => {
            const isSelected = i === (this.currentDialog.selectedChoice || 0);

            if (isSelected) {
                this.ctx.fillStyle = UIColors.PANEL_ALT;
                this.ctx.fillRect(x + 10, boxY + 10 + i * choiceHeight, width - 20, choiceHeight - 5);
                this.ctx.strokeStyle = UIColors.ACCENT;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + 10, boxY + 10 + i * choiceHeight, width - 20, choiceHeight - 5);
                this.ctx.fillStyle = UIColors.TEXT;
            } else {
                this.ctx.fillStyle = UIColors.TEXT_SOFT;
            }

            this.ctx.textAlign = 'left';
            this.ctx.fillText((isSelected ? '▶ ' : '  ') + choice.text, x + 20, boxY + 32 + i * choiceHeight);
        });
    }

    /**
     * 绘制对话框背景 - 简约像素风
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @private
     */
    _drawDialogBox(x, y, width, height) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = UIColors.SHADOW;
        ctx.fillRect(x + 4, y + 4, width, height);
        ctx.fillStyle = UIColors.PANEL;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = UIColors.BORDER_STRONG;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        ctx.strokeStyle = UIColors.BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
        ctx.restore();
    }

    /**
     * 绘制继续指示箭头
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @private
     */
    _drawContinueIndicator(x, y) {
        const ctx = this.ctx;
        const time = Date.now() / 200;
        const offset = Math.sin(time) * 4;
        ctx.fillStyle = UIColors.ACCENT;

        ctx.beginPath();
        ctx.moveTo(x, y + offset);
        ctx.lineTo(x - 10, y - 8 + offset);
        ctx.lineTo(x + 10, y - 8 + offset);
        ctx.closePath();
        ctx.fill();
    }

    // ==================== 菜单兼容层 ====================

    /**
     * 获取菜单系统 owner
     * @returns {MenuUI | null}
     * @private
     */
    _getMenuOwner() {
        return typeof menuUI !== 'undefined' ? menuUI : null;
    }

    /**
     * 兼容旧入口：转发到 MenuUI
     * @param {string} menuType - 菜单类型
     */
    openMenu(menuType) {
        eventBus.emit(GameEvents.UI_MENU_OPEN, { menuType });
    }

    /**
     * 兼容旧入口：转发到 MenuUI
     */
    closeMenu() {
        const owner = this._getMenuOwner();
        if (owner && owner.isOpen()) {
            owner.closeMenu();
        }
    }

    /**
     * 获取地图 HUD 状态快照
     * @returns {object | null}
     */
    getMapHUDState() {
        const gameState = typeof gameStateMachine !== 'undefined' && gameStateMachine.getGameState
            ? gameStateMachine.getGameState()
            : null;

        if (!gameState) return null;

        const player = (gameState.player || {}) as any;
        const leadMonster = Array.isArray(player.party) && player.party.length > 0 ? player.party[0] : null;
        const mapId = gameState.currentMapId || playerController?.currentMap?.id || '';
        const mapName = (typeof MapTemplates !== 'undefined' && MapTemplates[mapId]?.name) || mapId || '未知区域';
        const prompt = typeof playerController !== 'undefined' && playerController.getInteractionHint
            ? playerController.getInteractionHint()
            : 'Z 交互 · Esc 菜单';

        return {
            visible: typeof gameStateMachine !== 'undefined' && gameStateMachine.getCurrentState
                ? gameStateMachine.getCurrentState() === GameState.MAP
                : false,
            mapId,
            mapName,
            money: player.money || 0,
            prompt,
            leadMonster: leadMonster ? {
                name: leadMonster.nickname || leadMonster.name,
                level: leadMonster.level || 1,
                hp: leadMonster.stats?.hp || 0,
                maxHp: leadMonster.stats?.maxHp || leadMonster.stats?.hp || 0
            } : null
        };
    }

    /**
     * 渲染地图 HUD
     */
    renderMapHUD() {
        if (!this.ctx || !this.canvas) return;

        const hud = this.getMapHUDState();
        if (!hud?.visible) return;

        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;

        this._drawDialogBox(16, 14, 210, 58);
        ctx.fillStyle = UIColors.TEXT_MUTED;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('当前区域', 28, 34);
        ctx.fillStyle = UIColors.TEXT;
        ctx.font = 'bold 18px monospace';
        ctx.fillText(hud.mapName, 28, 58);

        this._drawDialogBox(canvasWidth - 228, 14, 212, 86);
        ctx.fillStyle = UIColors.TEXT_MUTED;
        ctx.font = '12px monospace';
        ctx.fillText('资金', canvasWidth - 212, 34);
        ctx.fillStyle = UIColors.WARNING;
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`¥${Number(hud.money || 0).toLocaleString()}`, canvasWidth - 212, 58);

        if (hud.leadMonster) {
            ctx.fillStyle = UIColors.TEXT_SOFT;
            ctx.font = '13px monospace';
            ctx.fillText(`${hud.leadMonster.name} Lv.${hud.leadMonster.level}`, canvasWidth - 212, 82);
            this.renderHPBar(canvasWidth - 212, 88, 180, hud.leadMonster.hp, hud.leadMonster.maxHp, false);
        } else {
            ctx.fillStyle = UIColors.TEXT_SOFT;
            ctx.font = '13px monospace';
            ctx.fillText('尚未拥有同行精灵', canvasWidth - 212, 82);
        }

        ctx.font = '12px monospace';
        const promptWidth = Math.max(180, Math.min(320, ctx.measureText(hud.prompt).width + 28));
        const promptX = canvasWidth - promptWidth - 16;
        this._drawDialogBox(promptX, this.canvas.height - 52, promptWidth, 36);
        ctx.fillStyle = UIColors.TEXT_SOFT;
        ctx.textAlign = 'left';
        ctx.fillText(hud.prompt, promptX + 14, this.canvas.height - 28);
    }

    // ==================== 通知系统 ====================

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 ('info', 'success', 'warning', 'error')
     */
    showNotification(message, type: UINotificationPayload['type'] = 'info') {
        const notification: UINotification = {
            id: Date.now(),
            message: message,
            type: type,
            timestamp: Date.now(),
            duration: 3000
        };

        this.notifications.push(notification);
        uiSafePlaySound(window.SoundID?.NOTIFICATION);

        // 自动移除通知
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, notification.duration);
    }

    /**
     * 移除通知
     * @param {number} id - 通知 ID
     */
    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    /**
     * 渲染通知
     */
    renderNotifications() {
        if (!this.ctx || this.notifications.length === 0) return;

        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        let yOffset = 20;

        this.notifications.forEach((notification) => {
            const colors = {
                info: { bg: UIColors.PANEL_ALT, text: UIColors.TEXT, border: UIColors.ACCENT },
                success: { bg: UIColors.PANEL_ALT, text: UIColors.TEXT, border: UIColors.SUCCESS },
                warning: { bg: UIColors.PANEL_ALT, text: UIColors.TEXT, border: UIColors.WARNING },
                error: { bg: UIColors.PANEL_ALT, text: UIColors.TEXT, border: UIColors.DANGER }
            };

            const color = colors[notification.type] || colors.info;

            // 测量文本宽度
            ctx.font = '16px monospace';
            const textWidth = ctx.measureText(notification.message).width;
            const notificationWidth = textWidth + 40;
            const notificationHeight = 40;
            const notificationX = (canvasWidth - notificationWidth) / 2;

            // 绘制通知背景
            ctx.fillStyle = color.bg;
            ctx.fillRect(notificationX, yOffset, notificationWidth, notificationHeight);

            ctx.strokeStyle = color.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(notificationX, yOffset, notificationWidth, notificationHeight);

            // 绘制文本
            ctx.fillStyle = color.text;
            ctx.textAlign = 'center';
            ctx.fillText(notification.message, canvasWidth / 2, yOffset + 26);

            yOffset += notificationHeight + 10;
        });
    }

    // ==================== HP/PP 条渲染 ====================

    /**
     * 渲染 HP 条
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} currentHp - 当前 HP
     * @param {number} maxHp - 最大 HP
     * @param {boolean} showText - 是否显示数值文本
     */
    renderHPBar(x, y, width, currentHp, maxHp, showText = true) {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.save();
        const height = 18;
        const percentage = Math.max(0, Math.min(1, currentHp / maxHp));

        let barColor;
        if (percentage > 0.5) {
            barColor = UIColors.SUCCESS;
        } else if (percentage > 0.25) {
            barColor = UIColors.WARNING;
        } else {
            barColor = UIColors.DANGER;
        }

        ctx.fillStyle = UIColors.PANEL_DEEP;
        ctx.fillRect(x, y, width, height);

        if (percentage > 0) {
            ctx.fillStyle = barColor;
            ctx.fillRect(x + 2, y + 2, width * percentage - 4, height - 4);
        }

        ctx.strokeStyle = UIColors.BORDER_STRONG;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        if (showText) {
            ctx.fillStyle = UIColors.TEXT_SOFT;
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${currentHp}/${maxHp}`, x + width, y - 4);
        }

        ctx.restore();
    }

    /**
     * 调整颜色亮度
     * @param {string} color - Hex 颜色
     * @param {number} amount - 调整量
     * @private
     */
    _adjustColorBrightness(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * 渲染 PP 条
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} currentPp - 当前 PP
     * @param {number} maxPp - 最大 PP
     */
    renderPPBar(x, y, width, currentPp, maxPp) {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.save();
        const height = 12;
        const percentage = Math.max(0, Math.min(1, currentPp / maxPp));

        const barColor = percentage > 0.25 ? UIColors.ACCENT : UIColors.DANGER;

        ctx.fillStyle = UIColors.PANEL_DEEP;
        ctx.fillRect(x, y, width, height);

        if (percentage > 0) {
            ctx.fillStyle = barColor;
            ctx.fillRect(x + 1, y + 1, width * percentage - 2, height - 2);
        }

        ctx.strokeStyle = UIColors.BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = UIColors.TEXT_SOFT;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`PP ${currentPp}/${maxPp}`, x + width, y - 3);
        ctx.restore();
    }

    // ==================== 主渲染方法 ====================

    /**
     * 渲染 UI
     */
    render() {
        if (!this.initialized || !this.ctx) return;

        if (this.state === UIState.DIALOG) {
            this.renderDialog();
        }

        // 通知总是渲染在最上层
        this.renderNotifications();
    }

    /**
     * 更新 UI 状态
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // 处理通知的淡出等动画
        const now = Date.now();
        this.notifications = this.notifications.filter(n => now - n.timestamp < n.duration);
    }

    /**
     * 处理键盘输入
     * @param {KeyboardEvent} event - 键盘事件
     * @returns {boolean} 是否处理了输入
     */
    handleInput(event) {
        if (this.state === UIState.DIALOG) {
            return this._handleDialogInput(event);
        }
        return false;
    }

    /**
     * 处理对话框输入
     * @param {KeyboardEvent} event - 键盘事件
     * @returns {boolean} 是否处理了输入
     * @private
     */
    _handleDialogInput(event) {
        if (event.type !== 'keydown') return false;

        if (this.currentDialog && this.currentDialog.choices) {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.currentDialog.selectedChoice === undefined) {
                        this.currentDialog.selectedChoice = 0;
                    }
                    this.currentDialog.selectedChoice = Math.max(0, this.currentDialog.selectedChoice - 1);
            uiSafePlaySound(window.SoundID?.CURSOR_MOVE);
                    return true;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.currentDialog.selectedChoice === undefined) {
                        this.currentDialog.selectedChoice = 0;
                    }
                    this.currentDialog.selectedChoice = Math.min(
                        this.currentDialog.choices.length - 1,
                        this.currentDialog.selectedChoice + 1
                    );
            uiSafePlaySound(window.SoundID?.CURSOR_MOVE);
                    return true;
                case 'Enter':
                case 'z':
                case 'Z':
                case ' ':
                    if (this.currentDialog.selectedChoice === undefined) {
                        this.currentDialog.selectedChoice = 0;
                    }
                    this.selectDialogChoice(this.currentDialog.selectedChoice);
                    return true;
            }
        } else {
            switch (event.key) {
                case 'Enter':
                case 'z':
                case 'Z':
                case ' ':
                    if (!this.dialogNext()) {
                        eventBus.emit(GameEvents.DIALOG_NEXT);
                    }
                    return true;
            }
        }

        return false;
    }

    /**
     * 获取当前状态
     * @returns {string} UI 状态
     */
    getState() {
        return this.state;
    }
}

// 暴露常量到 window
window.UIColors = UIColors;
window.UIState = UIState;

// 创建全局实例并暴露到 window 对象上
window.uiManager = new UIManager();
(globalThis as any).uiManager = window.uiManager;
const uiManager = window.uiManager;
