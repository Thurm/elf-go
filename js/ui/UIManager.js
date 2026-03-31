/**
 * UI 管理器 - 负责所有 UI 组件的管理和渲染
 * 包括菜单界面、对话框、状态显示等
 */

// UI 颜色常量 - 复古未来主义霓虹像素风
const UIColors = {
    // 霓虹主色调
    NEON_PINK: '#ff2a6d',
    NEON_CYAN: '#05d9e8',
    NEON_PURPLE: '#d300c5',
    NEON_YELLOW: '#f9f002',
    NEON_GREEN: '#39ff14',
    NEON_ORANGE: '#ff6b35',

    // 复古未来主义色系
    DEEP_SPACE: '#0d0221',
    COSMIC_PURPLE: '#2d1b4e',
    VOID_BLACK: '#0a0a0f',
    STARLIGHT: '#f0f0ff',
    ELECTRIC_BLUE: '#1b98e0',

    // 兼容旧名称的别名
    PRIMARY_BLUE: '#05d9e8',
    DARK_BLUE: '#2d1b4e',
    LIGHT_BLUE: '#1b98e0',
    PRIMARY_RED: '#ff2a6d',
    DARK_RED: '#d300c5',
    PRIMARY_GREEN: '#39ff14',
    DARK_GREEN: '#22c55e',
    PRIMARY_YELLOW: '#f9f002',
    GOLD: '#f9f002',
    BACKGROUND: '#0d0221',
    DARK_GRAY: '#2d1b4e',
    MEDIUM_GRAY: '#4a3a6a',
    LIGHT_GRAY: '#9ca3af',
    TEXT: '#f0f0ff'
};

// UI 状态
const UIState = {
    NONE: 'none',
    MENU: 'menu',
    DIALOG: 'dialog',
    BATTLE: 'battle',
    NOTIFICATION: 'notification'
};

/**
 * 安全播放音效的辅助函数
 * @param {string} soundId - 音效ID
 */
function safePlaySound(soundId) {
    if (!soundId) return;
    if (typeof window.audioManager !== 'undefined' && window.audioManager.playSound) {
        window.audioManager.playSound(soundId);
    }
}

/**
 * UI 管理器类
 */
class UIManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;

        // UI 状态
        this.state = UIState.NONE;
        this.components = new Map();
        this.activeComponent = null;

        // 对话框状态
        this.dialogQueue = [];
        this.currentDialog = null;
        this.dialogVisible = false;

        // 通知状态
        this.notifications = [];

        // 菜单状态
        this.menuStack = [];
        this.currentMenu = null;

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
        // 监听 UI 打开事件
        eventBus.on(GameEvents.UI_MENU_OPEN, (data) => {
            this.openMenu(data?.menuType || 'main');
        });

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

        // 监听对话翻页事件
        eventBus.on(GameEvents.DIALOG_NEXT, () => {
            // 如果有对话框且没有选项，则翻页
            if (this.dialogVisible && this.currentDialog && !this.currentDialog.choices) {
                this.dialogNext();
            }
        });

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

        safePlaySound(window.SoundID?.MENU_OPEN);
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
            safePlaySound(window.SoundID?.CURSOR_MOVE);
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
            safePlaySound(window.SoundID?.CONFIRM);
            eventBus.emit(GameEvents.DIALOG_CHOICE, { choice: index, value: choice.value });
            this.hideDialog();
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

        // 绘制说话者名称 - 霓虹风格
        if (this.currentDialog.speaker) {
            this.ctx.shadowColor = UIColors.NEON_PINK;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = UIColors.NEON_PINK;
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(this.currentDialog.speaker, dialogX + 24, dialogY + 28);
            this.ctx.shadowBlur = 0;
        }

        // 绘制对话文本 - 发光效果
        const textY = this.currentDialog.speaker ? dialogY + 58 : dialogY + 38;
        this.ctx.fillStyle = UIColors.STARLIGHT;
        this.ctx.font = '17px sans-serif';
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
        this.ctx.font = '16px monospace';
        choices.forEach((choice, i) => {
            const isSelected = i === (this.currentDialog.selectedChoice || 0);

            if (isSelected) {
                this.ctx.fillStyle = UIColors.PRIMARY_BLUE;
                this.ctx.fillRect(x + 10, boxY + 10 + i * choiceHeight, width - 20, choiceHeight - 5);
                this.ctx.fillStyle = UIColors.TEXT;
            } else {
                this.ctx.fillStyle = UIColors.LIGHT_GRAY;
            }

            this.ctx.textAlign = 'left';
            this.ctx.fillText((isSelected ? '▶ ' : '  ') + choice.text, x + 20, boxY + 32 + i * choiceHeight);
        });
    }

    /**
     * 绘制对话框背景 - 复古未来主义霓虹风格
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @private
     */
    _drawDialogBox(x, y, width, height) {
        const ctx = this.ctx;

        // 霓虹外发光
        ctx.shadowColor = UIColors.NEON_PINK;
        ctx.shadowBlur = 20;

        // 主背景 - 渐变
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(45, 27, 78, 0.98)');
        gradient.addColorStop(1, 'rgba(13, 2, 33, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        ctx.shadowBlur = 0;

        // 霓虹边框
        const borderGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        borderGradient.addColorStop(0, UIColors.NEON_PINK);
        borderGradient.addColorStop(0.5, UIColors.NEON_CYAN);
        borderGradient.addColorStop(1, UIColors.NEON_PURPLE);
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // 内发光线
        ctx.strokeStyle = 'rgba(5, 217, 232, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 6, y + 6, width - 12, height - 12);

        // 扫描线效果
        ctx.save();
        ctx.globalAlpha = 0.1;
        for (let scanY = y; scanY < y + height; scanY += 4) {
            ctx.fillStyle = '#000';
            ctx.fillRect(x, scanY, width, 2);
        }
        ctx.restore();

        // 角落装饰
        this._drawCornerDecorations(x, y, width, height);
    }

    /**
     * 绘制角落装饰 - 赛博朋克风格
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @private
     */
    _drawCornerDecorations(x, y, width, height) {
        const ctx = this.ctx;
        const cornerSize = 15;

        ctx.strokeStyle = UIColors.NEON_CYAN;
        ctx.lineWidth = 3;
        ctx.shadowColor = UIColors.NEON_CYAN;
        ctx.shadowBlur = 10;

        // 左上角
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();

        // 右上角
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerSize);
        ctx.stroke();

        // 左下角
        ctx.beginPath();
        ctx.moveTo(x, y + height - cornerSize);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + cornerSize, y + height);
        ctx.stroke();

        // 右下角
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - cornerSize);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    /**
     * 绘制继续指示箭头 - 霓虹风格
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @private
     */
    _drawContinueIndicator(x, y) {
        const ctx = this.ctx;
        const time = Date.now() / 200;
        const offset = Math.sin(time) * 4;
        const pulse = (Math.sin(time) + 1) / 2;

        // 霓虹发光效果
        ctx.shadowColor = UIColors.NEON_CYAN;
        ctx.shadowBlur = 10 + pulse * 10;

        // 箭头渐变
        const gradient = ctx.createLinearGradient(x - 10, y - 10, x + 10, y + 5);
        gradient.addColorStop(0, UIColors.NEON_CYAN);
        gradient.addColorStop(1, UIColors.NEON_PINK);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(x, y + offset);
        ctx.lineTo(x - 10, y - 8 + offset);
        ctx.lineTo(x + 10, y - 8 + offset);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    // ==================== 菜单系统 ====================

    /**
     * 打开菜单
     * @param {string} menuType - 菜单类型
     * @param {Object} options - 菜单选项
     */
    openMenu(menuType, options = {}) {
        const menuConfig = this._getMenuConfig(menuType, options);

        if (this.currentMenu) {
            this.menuStack.push(this.currentMenu);
        }

        this.currentMenu = {
            type: menuType,
            ...menuConfig,
            selectedIndex: 0
        };

        this.state = UIState.MENU;
        safePlaySound(window.SoundID?.MENU_OPEN);
    }

    /**
     * 获取菜单配置
     * @param {string} menuType - 菜单类型
     * @param {Object} options - 选项
     * @returns {Object} 菜单配置
     * @private
     */
    _getMenuConfig(menuType, options) {
        const configs = {
            main: {
                title: '游戏菜单',
                items: [
                    { id: 'resume', text: '继续游戏', action: 'resume' },
                    { id: 'party', text: '怪兽', action: 'party' },
                    { id: 'bag', text: '背包', action: 'bag' },
                    { id: 'save', text: '存档', action: 'save' },
                    { id: 'load', text: '读档', action: 'load' },
                    { id: 'settings', text: '设置', action: 'settings' },
                    { id: 'title', text: '返回标题', action: 'title' }
                ]
            },
            battle_main: {
                title: '',
                items: [
                    { id: 'skill', text: '技能', action: 'skill' },
                    { id: 'bag', text: '背包', action: 'bag' },
                    { id: 'monster', text: '怪兽', action: 'monster' },
                    { id: 'run', text: '逃跑', action: 'run' }
                ],
                layout: 'grid'
            },
            settings: {
                title: '设置',
                items: [
                    { id: 'master_volume', text: '主音量', type: 'slider', value: 1.0 },
                    { id: 'bgm_volume', text: '背景音乐', type: 'slider', value: 0.6 },
                    { id: 'sfx_volume', text: '音效音量', type: 'slider', value: 0.8 },
                    { id: 'back', text: '返回', action: 'back' }
                ]
            }
        };

        return configs[menuType] || configs.main;
    }

    /**
     * 关闭菜单
     */
    closeMenu(skipStatePop = false) {
        safePlaySound(window.SoundID?.MENU_CLOSE);
        if (this.menuStack.length > 0) {
            this.currentMenu = this.menuStack.pop();
        } else {
            this.currentMenu = null;
            this.state = UIState.NONE;
            if (!skipStatePop && typeof gameStateMachine !== 'undefined') {
                if (gameStateMachine.getCurrentState && gameStateMachine.getCurrentState() === GameState.MENU) {
                    gameStateMachine.popState();
                }
            }
        }
    }

    /**
     * 移动菜单选择
     * @param {number} direction - 方向 (-1 上/左, 1 下/右)
     */
    moveMenuSelection(direction) {
        if (!this.currentMenu) return;

        const items = this.currentMenu.items;
        const oldIndex = this.currentMenu.selectedIndex;
        let newIndex;

        if (this.currentMenu.layout === 'grid') {
            // 2x2 网格布局
            const row = Math.floor(oldIndex / 2);
            const col = oldIndex % 2;

            if (direction === 'up' || direction === -1) {
                newIndex = Math.max(0, row - 1) * 2 + col;
            } else if (direction === 'down' || direction === 1) {
                newIndex = Math.min(1, row + 1) * 2 + col;
            } else if (direction === 'left') {
                newIndex = row * 2 + Math.max(0, col - 1);
            } else if (direction === 'right') {
                newIndex = row * 2 + Math.min(1, col + 1);
            } else {
                newIndex = (oldIndex + direction + items.length) % items.length;
            }
        } else {
            // 垂直列表布局
            newIndex = (oldIndex + direction + items.length) % items.length;
        }

        if (newIndex !== oldIndex) {
            this.currentMenu.selectedIndex = newIndex;
            safePlaySound(window.SoundID?.CURSOR_MOVE);
        }
    }

    /**
     * 确认菜单选择
     */
    confirmMenuSelection() {
        if (!this.currentMenu) return;

        const item = this.currentMenu.items[this.currentMenu.selectedIndex];
        if (!item) return;

            safePlaySound(window.SoundID?.CONFIRM);

        // 处理菜单项动作
        this._handleMenuAction(item);
    }

    /**
     * 处理菜单动作
     * @param {Object} item - 菜单项
     * @private
     */
    _handleMenuAction(item) {
        switch (item.action) {
            case 'resume':
                this.closeMenu(true);
                gameStateMachine.popState();
                break;
            case 'back':
                this.closeMenu();
                break;
            case 'save':
                gameStateMachine.pushState(GameState.SAVE);
                break;
            case 'load':
                gameStateMachine.pushState(GameState.LOAD);
                break;
            case 'settings':
                this.openMenu('settings');
                break;
            case 'title':
                gameStateMachine.changeState(GameState.TITLE);
                this.closeMenu();
                break;
            default:
                // 发出事件，由其他系统处理
                eventBus.emit('ui:menu_action', { action: item.action, item: item });
        }
    }

    /**
     * 渲染菜单
     */
    renderMenu() {
        if (!this.currentMenu || !this.ctx) return;

        if (this.currentMenu.layout === 'grid') {
            this._renderGridMenu();
        } else {
            this._renderListMenu();
        }
    }

    /**
     * 渲染列表菜单
     * @private
     */
    _renderListMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const menuWidth = 280;
        const itemHeight = 40;
        const items = this.currentMenu.items;
        const menuHeight = items.length * itemHeight + 60;
        const menuX = 40;
        const menuY = canvasHeight / 2 - menuHeight / 2;

        // 绘制半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 绘制菜单框
        this._drawDialogBox(menuX, menuY, menuWidth, menuHeight);

        // 绘制标题
        if (this.currentMenu.title) {
            ctx.fillStyle = UIColors.TEXT;
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentMenu.title, menuX + menuWidth / 2, menuY + 30);
        }

        // 绘制菜单项
        ctx.font = '18px monospace';
        ctx.textAlign = 'left';

        const startY = this.currentMenu.title ? menuY + 55 : menuY + 25;

        items.forEach((item, i) => {
            const isSelected = i === this.currentMenu.selectedIndex;
            const itemY = startY + i * itemHeight;

            if (isSelected) {
                // 选中项高亮 - 霓虹渐变
                const selectedGradient = ctx.createLinearGradient(menuX + 10, itemY, menuX + menuWidth - 10, itemY + itemHeight);
                selectedGradient.addColorStop(0, 'rgba(255, 42, 109, 0.8)');
                selectedGradient.addColorStop(1, 'rgba(211, 0, 197, 0.8)');
                ctx.fillStyle = selectedGradient;
                ctx.shadowColor = UIColors.NEON_PINK;
                ctx.shadowBlur = 15;
                ctx.fillRect(menuX + 10, itemY, menuWidth - 20, itemHeight - 5);
                ctx.shadowBlur = 0;
                ctx.fillStyle = UIColors.STARLIGHT;
            } else {
                ctx.fillStyle = UIColors.LIGHT_GRAY;
            }

            if (item.type === 'slider') {
                this._renderSliderItem(menuX + 20, itemY + 25, item, isSelected);
            } else {
                const prefix = isSelected ? '▶ ' : '  ';
                ctx.fillText(prefix + item.text, menuX + 20, itemY + 25);
            }
        });
    }

    /**
     * 渲染滑块菜单项
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {Object} item - 菜单项
     * @param {boolean} isSelected - 是否选中
     * @private
     */
    _renderSliderItem(x, y, item, isSelected) {
        const ctx = this.ctx;
        const sliderWidth = 120;
        const sliderX = x + 130;

        ctx.fillText(item.text, x, y);

        // 滑块背景
        ctx.fillStyle = UIColors.DARK_GRAY;
        ctx.fillRect(sliderX, y - 12, sliderWidth, 16);

        // 滑块填充
        const fillWidth = sliderWidth * item.value;
        ctx.fillStyle = isSelected ? UIColors.PRIMARY_BLUE : UIColors.MEDIUM_GRAY;
        ctx.fillRect(sliderX, y - 12, fillWidth, 16);

        // 滑块值
        ctx.fillText(Math.round(item.value * 100) + '%', sliderX + sliderWidth + 10, y);
    }

    /**
     * 渲染网格菜单
     * @private
     */
    _renderGridMenu() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const menuWidth = 320;
        const menuHeight = 140;
        const menuX = canvasWidth - menuWidth - 30;
        const menuY = canvasHeight - menuHeight - 20;

        // 绘制菜单框
        this._drawDialogBox(menuX, menuY, menuWidth, menuHeight);

        // 绘制菜单项 (2x2 网格)
        const items = this.currentMenu.items;
        const cellWidth = menuWidth / 2 - 15;
        const cellHeight = (menuHeight - 30) / 2;

        ctx.font = '18px monospace';
        ctx.textAlign = 'left';

        items.forEach((item, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const isSelected = i === this.currentMenu.selectedIndex;

            const cellX = menuX + 15 + col * (cellWidth + 10);
            const cellY = menuY + 15 + row * (cellHeight + 5);

            if (isSelected) {
                // 选中项 - 霓虹渐变
                const cellGradient = ctx.createLinearGradient(cellX, cellY, cellX + cellWidth, cellY + cellHeight);
                cellGradient.addColorStop(0, 'rgba(255, 42, 109, 0.9)');
                cellGradient.addColorStop(1, 'rgba(5, 217, 232, 0.9)');
                ctx.fillStyle = cellGradient;
                ctx.shadowColor = UIColors.NEON_CYAN;
                ctx.shadowBlur = 20;
                ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
                ctx.shadowBlur = 0;
                ctx.fillStyle = UIColors.STARLIGHT;
            } else {
                const darkGradient = ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellHeight);
                darkGradient.addColorStop(0, 'rgba(45, 27, 78, 0.9)');
                darkGradient.addColorStop(1, 'rgba(13, 2, 33, 0.9)');
                ctx.fillStyle = darkGradient;
                ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
                ctx.fillStyle = UIColors.LIGHT_GRAY;
            }

            const prefix = isSelected ? '▶ ' : '  ';
            ctx.fillText(prefix + item.text, cellX + 15, cellY + cellHeight / 2 + 6);
        });
    }

    // ==================== 通知系统 ====================

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 ('info', 'success', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message: message,
            type: type,
            timestamp: Date.now(),
            duration: 3000
        };

        this.notifications.push(notification);
        safePlaySound(window.SoundID?.NOTIFICATION);

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
                info: { bg: UIColors.PRIMARY_BLUE, text: UIColors.TEXT },
                success: { bg: UIColors.PRIMARY_GREEN, text: UIColors.TEXT },
                warning: { bg: UIColors.PRIMARY_YELLOW, text: UIColors.BACKGROUND },
                error: { bg: UIColors.PRIMARY_RED, text: UIColors.TEXT }
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

            // 绘制边框
            ctx.strokeStyle = UIColors.TEXT;
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
     * 渲染 HP 条 - 复古未来主义霓虹风格
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
        const height = 18;
        const percentage = Math.max(0, Math.min(1, currentHp / maxHp));

        // 确定颜色 - 霓虹色系
        let barColor, glowColor;
        if (percentage > 0.5) {
            barColor = UIColors.NEON_GREEN;
            glowColor = 'rgba(57, 255, 20, 0.6)';
        } else if (percentage > 0.25) {
            barColor = UIColors.NEON_YELLOW;
            glowColor = 'rgba(249, 240, 2, 0.6)';
        } else {
            barColor = UIColors.NEON_PINK;
            glowColor = 'rgba(255, 42, 109, 0.8)';
        }

        // 外发光背景
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;

        // 背景 - 深色渐变
        const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, 'rgba(45, 27, 78, 0.9)');
        bgGradient.addColorStop(1, 'rgba(13, 2, 33, 0.9)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(x, y, width, height);

        // HP 条 - 霓虹渐变
        if (percentage > 0) {
            const hpGradient = ctx.createLinearGradient(x, y, x + width * percentage, y);
            hpGradient.addColorStop(0, barColor);
            hpGradient.addColorStop(1, this._adjustColorBrightness(barColor, -30));
            ctx.fillStyle = hpGradient;
            ctx.fillRect(x + 2, y + 2, width * percentage - 4, height - 4);
        }

        ctx.shadowBlur = 0;

        // 边框 - 霓虹效果
        const borderGradient = ctx.createLinearGradient(x, y, x + width, y);
        borderGradient.addColorStop(0, UIColors.NEON_PINK);
        borderGradient.addColorStop(0.5, UIColors.NEON_CYAN);
        borderGradient.addColorStop(1, UIColors.NEON_PURPLE);
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // 数值文本 - 发光效果
        if (showText) {
            ctx.shadowColor = barColor;
            ctx.shadowBlur = 8;
            ctx.fillStyle = barColor;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${currentHp}/${maxHp}`, x + width, y - 4);
            ctx.shadowBlur = 0;
        }
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
     * 渲染 PP 条 - 复古未来主义霓虹风格
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} currentPp - 当前 PP
     * @param {number} maxPp - 最大 PP
     */
    renderPPBar(x, y, width, currentPp, maxPp) {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const height = 12;
        const percentage = Math.max(0, Math.min(1, currentPp / maxPp));

        const barColor = percentage > 0.25 ? UIColors.NEON_CYAN : UIColors.NEON_PURPLE;

        // 外发光
        ctx.shadowColor = barColor;
        ctx.shadowBlur = 10;

        // 背景
        const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, 'rgba(45, 27, 78, 0.9)');
        bgGradient.addColorStop(1, 'rgba(13, 2, 33, 0.9)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(x, y, width, height);

        // PP 条 - 霓虹渐变
        if (percentage > 0) {
            const ppGradient = ctx.createLinearGradient(x, y, x + width * percentage, y);
            ppGradient.addColorStop(0, barColor);
            ppGradient.addColorStop(1, this._adjustColorBrightness(barColor, -40));
            ctx.fillStyle = ppGradient;
            ctx.fillRect(x + 1, y + 1, width * percentage - 2, height - 2);
        }

        ctx.shadowBlur = 0;

        // 边框
        ctx.strokeStyle = barColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // 数值文本
        ctx.shadowColor = barColor;
        ctx.shadowBlur = 5;
        ctx.fillStyle = barColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`PP ${currentPp}/${maxPp}`, x + width, y - 3);
        ctx.shadowBlur = 0;
    }

    // ==================== 主渲染方法 ====================

    /**
     * 渲染 UI
     */
    render() {
        if (!this.initialized || !this.ctx) return;

        // 根据状态渲染不同的 UI
        switch (this.state) {
            case UIState.MENU:
                this.renderMenu();
                break;
            case UIState.DIALOG:
                this.renderDialog();
                break;
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
        } else if (this.state === UIState.MENU) {
            return this._handleMenuInput(event);
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
            safePlaySound(window.SoundID?.CURSOR_MOVE);
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
            safePlaySound(window.SoundID?.CURSOR_MOVE);
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
                    this.dialogNext();
                    return true;
            }
        }

        return false;
    }

    /**
     * 处理菜单输入
     * @param {KeyboardEvent} event - 键盘事件
     * @returns {boolean} 是否处理了输入
     * @private
     */
    _handleMenuInput(event) {
        if (event.type !== 'keydown') return false;

        if (this.currentMenu?.layout === 'grid') {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.moveMenuSelection('up');
                    return true;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.moveMenuSelection('down');
                    return true;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.moveMenuSelection('left');
                    return true;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.moveMenuSelection('right');
                    return true;
                case 'Enter':
                case 'z':
                case 'Z':
                    this.confirmMenuSelection();
                    return true;
                case 'Escape':
                case 'x':
                case 'X':
                    this.closeMenu();
                    return true;
            }
        } else {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.moveMenuSelection(-1);
                    return true;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.moveMenuSelection(1);
                    return true;
                case 'Enter':
                case 'z':
                case 'Z':
                    this.confirmMenuSelection();
                    return true;
                case 'Escape':
                case 'x':
                case 'X':
                    this.closeMenu();
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
const uiManager = window.uiManager;
