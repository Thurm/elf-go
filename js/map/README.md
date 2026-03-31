# 地图系统 (Map System)

宝可梦风格 RPG 游戏的地图渲染与角色移动系统模块。

## 目录结构

```
js/map/
├── README.md           # 本文档
├── index.js            # 地图系统入口
├── MapRenderer.js      # 地图渲染器
├── PlayerController.js # 玩家控制器
├── MapStateMachine.js  # 地图状态机
└── SceneManager.js     # 场景管理器
```

## 模块说明

### 1. index.js - 地图系统入口

整合所有地图子系统，提供统一的初始化和更新接口。

**主要类：**
```javascript
class MapSystem {
    init(canvas, ctx, gameState)  // 初始化地图系统
    update(deltaTime)              // 更新地图系统
    render()                        // 渲染地图系统
    getCurrentMap()                 // 获取当前地图
    getPlayerState()                // 获取玩家状态
    teleportPlayer(mapId, x, y)     // 传送玩家
}
```

### 2. MapRenderer.js - 地图渲染器

负责地图的四层渲染、摄像机跟随、视口裁剪。

**主要功能：**
- 四层渲染架构（底层、中层、角色层、顶层）
- 摄像机跟随玩家
- 视口裁剪优化
- 地图图块渲染

**主要类：**
```javascript
class MapRenderer {
    init(map)                          // 初始化渲染器
    setMap(map)                        // 设置当前地图
    render(renderState)                // 渲染地图
    updateCamera(playerX, playerY)     // 更新摄像机位置
    drawTile(layer, x, y, tileId)     // 绘制图块
}
```

### 3. PlayerController.js - 玩家控制器

处理玩家输入、角色移动、碰撞检测、遇敌判定。

**主要功能：**
- WASD/方向键移动控制
- 8方向移动
- 碰撞检测（墙体、障碍物）
- 草丛遇敌判定
- 传送点检测
- NPC 交互检测

**主要类：**
```javascript
class PlayerController {
    init(startPos, map)                // 初始化控制器
    setMap(map)                        // 设置当前地图
    update(deltaTime)                  // 更新玩家状态
    teleportTo(x, y)                   // 传送到指定位置
    getPlayerState()                   // 获取玩家状态
    checkCollision(x, y)               // 检测碰撞
}
```

**玩家状态：**
```javascript
{
    x: 15,              // 网格X坐标
    y: 15,              // 网格Y坐标
    pixelX: 480,        // 像素X坐标
    pixelY: 480,        // 像素Y坐标
    direction: 'down',  // 朝向: up|down|left|right
    isMoving: false,    // 是否正在移动
    moveProgress: 0     // 移动进度 (0~1)
}
```

### 4. MapStateMachine.js - 地图状态机

管理地图子状态流转（IDLE、MOVING、ENCOUNTER、PORTAL、INTERACT）。

**状态流转：**
```
IDLE → MOVING
MOVING → {
    IDLE (停止),
    ENCOUNTER (遇敌),
    PORTAL (传送),
    INTERACT (交互)
}
ENCOUNTER → TRANSITION_TO_BATTLE
PORTAL → LOAD_SCENE
INTERACT → {
    IDLE,
    SHOW_DIALOG,
    OPEN_SHOP
}
```

**主要类：**
```javascript
class MapStateMachine {
    init()                              // 初始化状态机
    update(deltaTime)                  // 更新状态机
    transitionTo(newState)              // 切换状态
    on(event, callback)                // 监听事件
}
```

**主要事件：**
- `map:player_move` - 玩家移动
- `map:encounter` - 遇敌
- `map:portal` - 传送
- `map:interact` - 交互

### 5. SceneManager.js - 场景管理器

管理地图加载、场景切换、NPC/传送点数据管理。

**主要功能：**
- 地图数据加载
- 场景切换过渡动画
- NPC 数据管理
- 传送点数据管理
- 商店数据管理

**主要类：**
```javascript
class SceneManager {
    init(startMapId)                   // 初始化场景管理器
    loadMap(mapId)                      // 加载地图
    getCurrentMap()                     // 获取当前地图
    getRenderState()                    // 获取渲染状态
    update(deltaTime)                   // 更新场景
}
```

## 地图数据格式

地图数据在 `js/core/data/MapData.js` 中定义。

```javascript
{
    id: 'town_01',
    name: '新手村',
    width: 32,
    height: 32,
    tileset: 'village',
    layers: [
        { name: 'ground', data: [] },     // 底层
        { name: 'objects', data: [] },    // 中层
        { name: 'collision', data: [] }   // 碰撞层
    ],
    npcs: [
        { id: 'npc_01', x: 10, y: 8, dialogId: 'welcome' }
    ],
    portals: [
        { x: 0, y: 15, targetMap: 'route_01', targetX: 30, targetY: 15 }
    ],
    shops: [
        { id: 'pokemart_town01', x: 12, y: 10 }
    ],
    encounter: {
        enabled: false,
        rate: 0,
        monsters: []
    }
}
```

## 碰撞层类型

| 值 | 类型 | 说明 |
|----|------|------|
| 0 | Free | 可自由通过 |
| 1 | Blocked | 完全阻挡（墙、建筑） |
| 2 | Water | 水体（不可通过） |
| 3 | Portal | 传送点 |
| 4 | Interaction | 交互点（NPC、门） |
| 5 | Grass | 草丛（可通过，可能遇敌） |

## 地图列表

| 地图ID | 名称 | 尺寸 | 遇敌 |
|--------|------|------|------|
| `town_01` | 新手村 | 32x32 | 否 |
| `route_01` | 1号道路 | 32x32 | 是 |
| `house_01` | 村长家 | 10x8 | 否 |

## 使用示例

### 初始化地图系统

```javascript
// 创建 Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 初始化地图系统
mapSystem.init(canvas, ctx, gameState);
```

### 游戏循环中的更新与渲染

```javascript
function gameLoop(deltaTime) {
    // 更新
    mapSystem.update(deltaTime);

    // 渲染
    mapSystem.render();
}
```

### 传送玩家

```javascript
// 传送到1号道路
mapSystem.teleportPlayer('route_01', 30, 15);
```

### 获取玩家状态

```javascript
const playerState = mapSystem.getPlayerState();
console.log(`玩家位置: (${playerState.x}, ${playerState.y})`);
```

### 事件监听

```javascript
// 监听遇敌事件
eventBus.on(GameEvents.MAP_ENCOUNTER, (data) => {
    console.log('遭遇野生怪兽!', data.monster);
});

// 监听传送事件
eventBus.on(GameEvents.MAP_PORTAL, (data) => {
    console.log(`传送到 ${data.targetMap}`);
});

// 监听交互事件
eventBus.on(GameEvents.MAP_INTERACT, (data) => {
    console.log(`与 ${data.npcId} 交互`);
});
```

## 地图布局设计文档

详细的地图布局设计请参考：
- [地图布局与图块设计](../../docs/map-layout-design.md)

## 文件状态

- ✅ MapRenderer.js - 已完成
- ✅ PlayerController.js - 已完成
- ✅ MapStateMachine.js - 已完成
- ✅ SceneManager.js - 已完成
- ✅ index.js - 已完成

**作者**: Teammate D (地图渲染开发)
**最后更新**: 2026-03-27
