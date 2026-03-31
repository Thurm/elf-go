# UI 音效系统模块

负责游戏的所有 UI 渲染、音效播放和用户交互。

## 文件结构

```
js/ui/
├── README.md          # 本文件
├── AudioManager.js    # 音效管理器
├── UIManager.js       # UI 管理器
├── BattleUI.js        # 战斗界面
└── MenuUI.js          # 菜单界面
```

## 模块说明

### AudioManager.js - 音效管理器

使用 Web Audio API 生成和播放音效，不需要外部音频文件。

**功能：**
- 30+ 种内置音效（UI操作、战斗、地图、物品等）
- 8 首背景音乐（标题、城镇、道路、战斗、胜利、商店、菜单、失败）
- 音量控制（主音量、BGM音量、SFX音量）
- 支持音效事件监听

**使用示例：**
```javascript
// 播放音效
audioManager.playSound(SoundID.CONFIRM);

// 播放背景音乐
audioManager.playBGM(SoundID.BGM_TOWN);

// 设置音量
audioManager.setMasterVolume(0.8);
audioManager.setBGMVolume(0.5);
audioManager.setSFXVolume(0.7);
```

**音效 ID 列表：**
- UI: `CURSOR_MOVE`, `CONFIRM`, `CANCEL`, `MENU_OPEN`, `MENU_CLOSE`
- 战斗: `BATTLE_START`, `ATTACK_HIT`, `ATTACK_MISS`, `CRITICAL`, `DAMAGE`, `FIRE_SKILL`, `WATER_SKILL`, `GRASS_SKILL`, `ELECTRIC_SKILL`, `MONSTER_FAINT`, `LEVEL_UP`, `HEAL`, `STAT_BOOST`, `STAT_DROP`
- 地图: `STEP_GRASS`, `STEP_GROUND`, `PORTAL`, `ENCOUNTER`
- 物品: `GET_ITEM`, `GET_MONEY`, `USE_ITEM`, `BUY`, `SELL`, `SAVE`, `LOAD`, `SAVE_SUCCESS`, `NOTIFICATION`, `ERROR`
- BGM: `BGM_TITLE`, `BGM_TOWN`, `BGM_ROUTE`, `BGM_BATTLE`, `BGM_VICTORY`, `BGM_SHOP`, `BGM_MENU`, `BGM_DEFEAT`

---

### UIManager.js - UI 管理器

统一管理所有 UI 组件，包括对话框、通知、HP/PP 条等。

**功能：**
- 对话框系统（支持分页、选择项）
- 通知系统（显示提示信息）
- HP/PP 条渲染
- 菜单管理

**使用示例：**
```javascript
// 初始化
uiManager.init(canvas, ctx);

// 显示对话框
uiManager.showDialog({
    speaker: 'NPC',
    text: '欢迎来到新手村！',
    choices: [
        { text: '你好', value: 'hello' },
        { text: '再见', value: 'bye' }
    ]
});

// 显示通知
uiManager.showNotification('获得了物品！', 'success');

// 渲染 HP 条
uiManager.renderHPBar(x, y, width, currentHp, maxHp);

// 渲染 PP 条
uiManager.renderPPBar(x, y, width, currentPp, maxPp);
```

---

### BattleUI.js - 战斗界面

负责战斗场景的 UI 渲染和交互。

**功能：**
- 敌我双方状态面板（HP、等级、状态效果）
- 战斗消息显示
- 行动菜单（技能/背包/怪兽/逃跑）
- 技能菜单（显示技能名称和 PP）
- 伤害数字动画
- 怪兽精灵占位渲染
- 屏幕震动效果

**使用示例：**
```javascript
// 初始化
battleUI.init(canvas, ctx);

// 战斗开始时设置数据
battleUI.setBattleData({
    playerMonster: playerMonster,
    enemyMonster: enemyMonster
});

// 每帧更新和渲染
battleUI.update(deltaTime);
battleUI.render();

// 处理输入
battleUI.handleInput(event);
```

**战斗状态：**
- `IDLE` - 空闲
- `SHOWING_MESSAGE` - 显示消息中
- `SELECTING_ACTION` - 选择行动
- `SELECTING_SKILL` - 选择技能
- `SELECTING_TARGET` - 选择目标
- `ANIMATING` - 动画播放中

---

### MenuUI.js - 菜单界面

负责主菜单、存档/读档、设置等界面的渲染和交互。

**功能：**
- 标题画面菜单（开始游戏/读取存档）
- 游戏内主菜单（继续/怪兽/背包/存档/读档/设置/返回标题）
- 存档/读档界面（3个存档槽位）
- 设置界面（音量调节）
- 队伍菜单
- 背包菜单

**使用示例：**
```javascript
// 初始化
menuUI.init(canvas, ctx);

// 打开菜单
menuUI.openMenu('main');      // 主菜单
menuUI.openMenu('save');      // 存档菜单
menuUI.openMenu('load');      // 读档菜单
menuUI.openMenu('settings');  // 设置菜单
menuUI.openMenu('title');     // 标题菜单

// 每帧渲染
menuUI.render();

// 处理输入
menuUI.handleInput(event);
```

**菜单类型：**
- `title` - 标题画面菜单
- `main` - 游戏内主菜单
- `save` - 存档菜单
- `load` - 读档菜单
- `settings` - 设置菜单
- `party` - 队伍菜单
- `bag` - 背包菜单

## 颜色常量

UI 模块使用统一的颜色常量定义在 `UIColors` 中：

```javascript
UIColors = {
    PRIMARY_BLUE: '#3B82F6',    // 主蓝色
    DARK_BLUE: '#1E40AF',        // 深蓝
    LIGHT_BLUE: '#93C5FD',       // 浅蓝
    PRIMARY_RED: '#EF4444',      // 主红色
    PRIMARY_GREEN: '#22C55E',    // 主绿色
    PRIMARY_YELLOW: '#EAB308',   // 主黄色
    GOLD: '#F59E0B',             // 金色
    BACKGROUND: '#1F2937',       // 背景色
    DARK_GRAY: '#374151',        // 深灰
    MEDIUM_GRAY: '#6B7280',      // 中灰
    LIGHT_GRAY: '#9CA3AF',       // 浅灰
    TEXT: '#F9FAFB'              // 文本色
}
```

## 事件监听

UI 音效模块通过 EventBus 监听以下事件：

```javascript
// 音效事件
GameEvents.AUDIO_PLAY    // 播放音效
GameEvents.AUDIO_BGM     // 播放背景音乐

// UI 事件
GameEvents.UI_MENU_OPEN  // 打开菜单
GameEvents.UI_MENU_CLOSE // 关闭菜单
GameEvents.UI_NOTIFICATION // 显示通知

// 战斗事件
GameEvents.BATTLE_START  // 战斗开始
GameEvents.BATTLE_ACTION // 战斗行动
GameEvents.BATTLE_DAMAGE // 战斗伤害
GameEvents.BATTLE_END    // 战斗结束

// 对话事件
GameEvents.DIALOG_START  // 开始对话
GameEvents.DIALOG_END    // 结束对话

// 状态事件
GameEvents.STATE_CHANGE  // 状态切换
```

## 键盘控制

### 菜单控制
- `↑` / `W` - 向上选择
- `↓` / `S` - 向下选择
- `←` / `A` - 向左选择（网格菜单）
- `→` / `D` - 向右选择（网格菜单）
- `Enter` / `Z` / `Space` - 确认
- `Escape` / `X` - 返回/取消

### 对话框控制
- `Enter` / `Z` / `Space` - 下一页/确认

### 设置菜单
- `↑` / `↓` - 选择设置项
- `Enter` / `Z` - 进入/退出编辑模式
- `←` / `→` - 调整数值（编辑模式）

## 初始化流程

在 `main.js` 中的初始化顺序：

```javascript
// 1. 初始化音频管理器（需要用户交互后才能完全初始化）
audioManager.init();

// 2. 初始化各 UI 模块
uiManager.init(canvas, ctx);
battleUI.init(canvas, ctx);
menuUI.init(canvas, ctx);

// 3. 注册到游戏子系统
game.registerSubsystem('ui', uiManager);
game.registerSubsystem('audio', audioManager);
```
