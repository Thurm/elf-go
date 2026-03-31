# Plan 1: 核心架构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现游戏核心架构，包括状态机、事件总线、存档管理和所有数据结构定义。

**Architecture:** 采用模块化状态机架构，通过 EventBus 实现模块间通信，使用 localStorage 进行存档。

**Tech Stack:** 原生 JavaScript (ES6+), localStorage

---

## 文件结构总览

| 文件路径 | 职责 |
|----------|------|
| `index.html` | 主入口 HTML |
| `css/style.css` | 基础样式 |
| `js/main.js` | 游戏初始化与主循环 |
| `js/core/EventBus.js` | 事件总线实现 |
| `js/core/GameStateMachine.js` | 全局状态机 |
| `js/core/SaveManager.js` | 存档管理 |
| `js/core/data/GameData.js` | 游戏状态数据结构 |
| `js/core/data/MonsterData.js` | 怪兽定义数据 |
| `js/core/data/SkillData.js` | 技能定义数据 |
| `js/core/data/ItemData.js` | 物品/装备定义数据 |
| `js/core/data/MapData.js` | 地图定义数据 |
| `README.md` | 项目说明文档 |

---

### Task 1: 项目初始化与基础文件

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `README.md`

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>宝可梦风格 RPG</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        <div id="ui-layer"></div>
    </div>
    <script src="js/core/EventBus.js"></script>
    <script src="js/core/data/GameData.js"></script>
    <script src="js/core/data/MonsterData.js"></script>
    <script src="js/core/data/SkillData.js"></script>
    <script src="js/core/data/ItemData.js"></script>
    <script src="js/core/data/MapData.js"></script>
    <script src="js/core/GameStateMachine.js"></script>
    <script src="js/core/SaveManager.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 css/style.css**

```css
/* 宝可梦风格 RPG - 基础样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Courier New', monospace;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: #fff;
}

#game-container {
    position: relative;
    width: 800px;
    height: 600px;
    background: #202020;
    border: 4px solid #4a4a4a;
}

#game-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

#ui-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

#ui-layer > * {
    pointer-events: auto;
}
```

- [ ] **Step 3: 创建 README.md**

```markdown
# 宝可梦风格网页 RPG 游戏

一个使用原生 HTML/CSS/JavaScript 和 Canvas 开发的宝可梦风格 RPG 游戏。

## 项目结构

```
cc_learning/
├── index.html          # 主入口
├── css/
│   └── style.css       # 样式
├── js/
│   ├── main.js         # 游戏初始化
│   ├── core/           # 核心架构
│   ├── battle/         # 战斗系统
│   ├── dialog/         # 对话系统
│   ├── map/            # 地图系统
│   ├── shop/           # 商店系统
│   ├── ui/             # UI音效
│   └── tests/          # 测试
└── docs/               # 文档
```

## 开发团队

- Team Lead: Opus (整体规划/审核)
- Teammate A: Sonnet (架构师)
- Teammate B: Sonnet (战斗系统)
- Teammate C: Sonnet (对话系统)
- Teammate D: Sonnet (地图渲染)
- Teammate E: Sonnet (UI音效)
- Teammate F: Sonnet (测试验收)
- Teammate G: Sonnet (商店系统)

## 快速开始

直接在浏览器中打开 index.html 即可运行游戏。

## License

MIT
```

- [ ] **Step 4: 提交**

```bash
git add index.html css/style.css README.md
git commit -m "feat: init project with basic files

- Add index.html with canvas setup
- Add basic CSS styling
- Add project README

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 实现 EventBus 事件总线

**Files:**
- Create: `js/core/EventBus.js`

- [ ] **Step 1: 创建 EventBus.js**

```javascript
/**
 * 事件总线 - 模块间通信
 * 实现发布-订阅模式
 */
class EventBus {
    constructor() {
        // 存储事件及其回调函数
        this.events = {};
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 要移除的回调函数
     */
    off(event, callback) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        if (!this.events[event]) return;

        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * 订阅一次性事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.events = {};
    }
}

// 定义游戏事件常量
const GameEvents = {
    // 状态切换
    STATE_CHANGE: 'state:change',
    PUSH_STATE: 'state:push',
    POP_STATE: 'state:pop',

    // 地图事件
    MAP_PLAYER_MOVE: 'map:player_move',
    MAP_ENCOUNTER: 'map:encounter',
    MAP_PORTAL: 'map:portal',
    MAP_INTERACT: 'map:interact',

    // 战斗事件
    BATTLE_START: 'battle:start',
    BATTLE_ACTION: 'battle:action',
    BATTLE_DAMAGE: 'battle:damage',
    BATTLE_END: 'battle:end',

    // 对话事件
    DIALOG_START: 'dialog:start',
    DIALOG_NEXT: 'dialog:next',
    DIALOG_CHOICE: 'dialog:choice',
    DIALOG_END: 'dialog:end',

    // 商店事件
    SHOP_OPEN: 'shop:open',
    SHOP_BUY: 'shop:buy',
    SHOP_SELL: 'shop:sell',
    SHOP_CLOSE: 'shop:close',

    // UI事件
    UI_MENU_OPEN: 'ui:menu_open',
    UI_MENU_CLOSE: 'ui:menu_close',
    UI_NOTIFICATION: 'ui:notification',

    // 数据事件
    DATA_SAVE: 'data:save',
    DATA_LOAD: 'data:load',
    DATA_UPDATE: 'data:update',

    // 音效事件
    AUDIO_PLAY: 'audio:play',
    AUDIO_BGM: 'audio:bgm'
};

// 导出全局实例
const eventBus = new EventBus();
```

- [ ] **Step 2: 提交**

```bash
git add js/core/EventBus.js
git commit -m "feat: implement EventBus

- Add EventBus class with publish/subscribe pattern
- Define GameEvents constants
- Export global eventBus instance

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 实现数据结构定义

**Files:**
- Create: `js/core/data/GameData.js`
- Create: `js/core/data/MonsterData.js`
- Create: `js/core/data/SkillData.js`
- Create: `js/core/data/ItemData.js`
- Create: `js/core/data/MapData.js`

- [ ] **Step 1: 创建 GameData.js**

```javascript
/**
 * 游戏状态数据结构定义
 */

// 游戏状态枚举
const GameState = {
    TITLE: 'TITLE',
    MENU: 'MENU',
    MAP: 'MAP',
    BATTLE: 'BATTLE',
    DIALOG: 'DIALOG',
    SHOP: 'SHOP',
    SAVE: 'SAVE',
    LOAD: 'LOAD'
};

/**
 * 创建初始游戏状态
 * @returns {Object} 初始游戏状态
 */
function createInitialGameState() {
    return {
        currentState: GameState.TITLE,
        stateStack: [],
        player: createInitialPlayer(),
        currentMapId: 'town_01',
        gameTime: 0,
        flags: {},
        tempData: {}
    };
}

/**
 * 创建初始玩家数据
 * @returns {Object} 初始玩家数据
 */
function createInitialPlayer() {
    return {
        name: '玩家',
        party: [
            createPlayerMonster('fire_dragon', '小火', 5)
        ],
        equipment: {
            weapon: null,
            armor: null,
            accessory: null,
            helmet: null,
            boots: null
        },
        inventory: [
            { itemId: 'potion', quantity: 5 },
            { itemId: 'pokeball', quantity: 10 }
        ],
        money: 1000,
        location: { x: 15, y: 15 },
        quests: [],
        completedQuests: []
    };
}

/**
 * 创建玩家怪兽实例
 * @param {string} monsterId - 怪兽ID
 * @param {string} nickname - 昵称
 * @param {number} level - 等级
 * @returns {Object} 玩家怪兽实例
 */
function createPlayerMonster(monsterId, nickname, level) {
    const template = MonsterTemplates[monsterId];
    if (!template) {
        console.error(`Monster template not found: ${monsterId}`);
        return null;
    }

    // 计算等级对应的属性
    const levelMultiplier = 1 + (level - 1) * 0.1;
    const stats = {};
    for (const [key, value] of Object.entries(template.baseStats)) {
        stats[key] = Math.floor(value * levelMultiplier);
    }
    stats.maxHp = stats.hp;

    return {
        id: `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        monsterId: monsterId,
        nickname: nickname || template.name,
        level: level,
        exp: 0,
        expToNext: calculateExpToNext(level),
        stats: stats,
        skills: template.skills.slice(0, 4).map(skillId => ({
            skillId: skillId,
            pp: SkillTemplates[skillId]?.maxPp || 10,
            maxPp: SkillTemplates[skillId]?.maxPp || 10
        })),
        equipment: {
            weapon: null,
            armor: null,
            accessory: null,
            helmet: null,
            boots: null
        },
        status: null
    };
}

/**
 * 计算升级所需经验
 * @param {number} level - 当前等级
 * @returns {number} 所需经验
 */
function calculateExpToNext(level) {
    return Math.floor(50 * Math.pow(level, 1.5));
}

/**
 * 计算装备加成后的总属性
 * @param {Object} baseStats - 基础属性
 * @param {Object} equipment - 装备
 * @returns {Object} 总属性
 */
function calculateTotalStats(baseStats, equipment) {
    const total = { ...baseStats };

    for (const [slot, itemId] of Object.entries(equipment)) {
        if (itemId) {
            const item = ItemTemplates[itemId];
            if (item && item.stats) {
                for (const [stat, value] of Object.entries(item.stats)) {
                    total[stat] = (total[stat] || 0) + value;
                }
            }
        }
    }

    return total;
}
```

- [ ] **Step 2: 创建 MonsterData.js**

```javascript
/**
 * 怪兽定义数据
 */

// 属性类型
const ElementType = {
    FIRE: 'fire',
    WATER: 'water',
    GRASS: 'grass',
    ELECTRIC: 'electric',
    NORMAL: 'normal'
};

// 属性相克表
const ElementMultiplier = {
    [ElementType.FIRE]: {
        [ElementType.FIRE]: 1,
        [ElementType.WATER]: 0.5,
        [ElementType.GRASS]: 2,
        [ElementType.ELECTRIC]: 1,
        [ElementType.NORMAL]: 1
    },
    [ElementType.WATER]: {
        [ElementType.FIRE]: 2,
        [ElementType.WATER]: 1,
        [ElementType.GRASS]: 0.5,
        [ElementType.ELECTRIC]: 1,
        [ElementType.NORMAL]: 1
    },
    [ElementType.GRASS]: {
        [ElementType.FIRE]: 0.5,
        [ElementType.WATER]: 2,
        [ElementType.GRASS]: 1,
        [ElementType.ELECTRIC]: 1,
        [ElementType.NORMAL]: 1
    },
    [ElementType.ELECTRIC]: {
        [ElementType.FIRE]: 1,
        [ElementType.WATER]: 2,
        [ElementType.GRASS]: 0.5,
        [ElementType.ELECTRIC]: 1,
        [ElementType.NORMAL]: 1
    },
    [ElementType.NORMAL]: {
        [ElementType.FIRE]: 1,
        [ElementType.WATER]: 1,
        [ElementType.GRASS]: 1,
        [ElementType.ELECTRIC]: 1,
        [ElementType.NORMAL]: 1
    }
};

// 怪兽模板
const MonsterTemplates = {
    fire_dragon: {
        id: 'fire_dragon',
        name: '火龙',
        type: ElementType.FIRE,
        baseStats: {
            hp: 100,
            atk: 85,
            def: 60,
            spAtk: 90,
            spDef: 50,
            spd: 70
        },
        skills: ['fire_blast', 'dragon_claw', 'ember', 'flamethrower'],
        expReward: 150,
        drops: [
            { itemId: 'fire_scale', chance: 0.3 }
        ]
    },
    water_turtle: {
        id: 'water_turtle',
        name: '水龟',
        type: ElementType.WATER,
        baseStats: {
            hp: 110,
            atk: 70,
            def: 90,
            spAtk: 65,
            spDef: 80,
            spd: 40
        },
        skills: ['water_gun', 'bubble', 'hydro_pump', 'withdraw'],
        expReward: 140,
        drops: [
            { itemId: 'water_gem', chance: 0.25 }
        ]
    },
    grass_bunny: {
        id: 'grass_bunny',
        name: '草兔',
        type: ElementType.GRASS,
        baseStats: {
            hp: 80,
            atk: 60,
            def: 55,
            spAtk: 75,
            spDef: 55,
            spd: 95
        },
        skills: ['vine_whip', 'razor_leaf', 'solar_beam', 'agility'],
        expReward: 120,
        drops: [
            { itemId: 'leaf_herb', chance: 0.35 }
        ]
    }
};
```

- [ ] **Step 3: 创建 SkillData.js**

```javascript
/**
 * 技能定义数据
 */

// 技能分类
const SkillCategory = {
    PHYSICAL: 'physical',
    SPECIAL: 'special',
    STATUS: 'status'
};

// 目标类型
const SkillTarget = {
    SINGLE: 'single',
    ALL: 'all',
    SELF: 'self'
};

// 状态效果
const StatusEffect = {
    BURN: 'burn',
    PARALYZE: 'paralyze',
    POISON: 'poison',
    FREEZE: 'freeze',
    SLEEP: 'sleep'
};

// 技能模板
const SkillTemplates = {
    fire_blast: {
        id: 'fire_blast',
        name: '火焰喷射',
        type: ElementType.FIRE,
        category: SkillCategory.SPECIAL,
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.BURN,
            chance: 10,
            duration: 3
        },
        description: '释放灼热的火焰攻击敌人'
    },
    dragon_claw: {
        id: 'dragon_claw',
        name: '龙爪',
        type: ElementType.NORMAL,
        category: SkillCategory.PHYSICAL,
        power: 80,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '用锋利的爪子攻击敌人'
    },
    ember: {
        id: 'ember',
        name: '火花',
        type: ElementType.FIRE,
        category: SkillCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.BURN,
            chance: 10,
            duration: 2
        },
        description: '喷出小火花攻击敌人'
    },
    flamethrower: {
        id: 'flamethrower',
        name: '喷火',
        type: ElementType.FIRE,
        category: SkillCategory.SPECIAL,
        power: 70,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.BURN,
            chance: 10,
            duration: 3
        },
        description: '喷出火焰攻击敌人'
    },
    water_gun: {
        id: 'water_gun',
        name: '水枪',
        type: ElementType.WATER,
        category: SkillCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '喷出水柱攻击敌人'
    },
    bubble: {
        id: 'bubble',
        name: '泡沫',
        type: ElementType.WATER,
        category: SkillCategory.SPECIAL,
        power: 30,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '吐出大量泡沫'
    },
    vine_whip: {
        id: 'vine_whip',
        name: '藤鞭',
        type: ElementType.GRASS,
        category: SkillCategory.PHYSICAL,
        power: 45,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '用藤蔓抽打敌人'
    },
    razor_leaf: {
        id: 'razor_leaf',
        name: '飞叶快刀',
        type: ElementType.GRASS,
        category: SkillCategory.PHYSICAL,
        power: 55,
        accuracy: 95,
        pp: 25,
        maxPp: 25,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '发射锋利的叶片'
    }
};
```

- [ ] **Step 4: 创建 ItemData.js**

```javascript
/**
 * 物品/装备定义数据
 */

// 物品类型
const ItemType = {
    CONSUMABLE: 'consumable',
    EQUIPMENT: 'equipment',
    KEY_ITEM: 'key_item'
};

// 装备槽位
const EquipmentSlot = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    ACCESSORY: 'accessory',
    HELMET: 'helmet',
    BOOTS: 'boots'
};

// 稀有度
const ItemRarity = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

// 物品模板
const ItemTemplates = {
    potion: {
        id: 'potion',
        name: '药水',
        type: ItemType.CONSUMABLE,
        target: 'single_monster',
        effect: {
            type: 'heal_hp',
            value: 50
        },
        price: 50,
        description: '恢复50点HP'
    },
    super_potion: {
        id: 'super_potion',
        name: '高级药水',
        type: ItemType.CONSUMABLE,
        target: 'single_monster',
        effect: {
            type: 'heal_hp',
            value: 100
        },
        price: 200,
        description: '恢复100点HP'
    },
    pokeball: {
        id: 'pokeball',
        name: '怪兽球',
        type: ItemType.CONSUMABLE,
        target: 'enemy_monster',
        effect: {
            type: 'catch',
            baseRate: 0.2
        },
        price: 100,
        description: '用于捕捉野生怪兽'
    },
    antidote: {
        id: 'antidote',
        name: '解毒药',
        type: ItemType.CONSUMABLE,
        target: 'single_monster',
        effect: {
            type: 'cure_status',
            status: 'poison'
        },
        price: 100,
        description: '治愈中毒状态'
    },
    flame_sword: {
        id: 'flame_sword',
        name: '火焰之剑',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.RARE,
        stats: {
            atk: 25,
            fireAtk: 15
        },
        effect: {
            type: 'burn_chance',
            value: 10
        },
        setId: 'flame_set',
        price: 1500,
        description: '蕴含火焰之力的神剑'
    },
    iron_armor: {
        id: 'iron_armor',
        name: '铁甲',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ARMOR,
        rarity: ItemRarity.COMMON,
        stats: {
            def: 20
        },
        effect: null,
        price: 800,
        description: '坚固的铁制护甲'
    },
    speed_ring: {
        id: 'speed_ring',
        name: '速度戒指',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.RARE,
        stats: {
            spd: 15
        },
        effect: null,
        price: 1000,
        description: '提升速度的神秘戒指'
    },
    fire_scale: {
        id: 'fire_scale',
        name: '火焰鳞片',
        type: ItemType.KEY_ITEM,
        price: 200,
        description: '火龙身上掉落的鳞片'
    },
    water_gem: {
        id: 'water_gem',
        name: '水之宝石',
        type: ItemType.KEY_ITEM,
        price: 250,
        description: '水龟掉落的神秘宝石'
    },
    leaf_herb: {
        id: 'leaf_herb',
        name: '叶草',
        type: ItemType.KEY_ITEM,
        price: 150,
        description: '草兔携带的草药'
    }
};
```

- [ ] **Step 5: 创建 MapData.js**

```javascript
/**
 * 地图定义数据
 */

// 地图层类型
const MapLayerType = {
    GROUND: 'ground',
    OBJECTS: 'objects',
    COLLISION: 'collision'
};

// 地图模板
const MapTemplates = {
    town_01: {
        id: 'town_01',
        name: '新手村',
        width: 32,
        height: 32,
        tileset: 'village',
        layers: [
            { name: MapLayerType.GROUND, data: [] },
            { name: MapLayerType.OBJECTS, data: [] },
            { name: MapLayerType.COLLISION, data: [] }
        ],
        npcs: [
            { id: 'npc_01', x: 10, y: 8, dialogId: 'welcome' },
            { id: 'npc_shop', x: 12, y: 10, dialogId: 'shop_greet', shopId: 'pokemart_town01' }
        ],
        portals: [
            { x: 0, y: 15, targetMap: 'route_01', targetX: 30, targetY: 15 },
            { x: 15, y: 0, targetMap: 'house_01', targetX: 4, targetY: 6 }
        ],
        shops: [
            { id: 'pokemart_town01', x: 12, y: 10 }
        ],
        encounter: {
            enabled: false,
            rate: 0,
            monsters: []
        }
    },
    route_01: {
        id: 'route_01',
        name: '1号道路',
        width: 32,
        height: 32,
        tileset: 'route',
        layers: [
            { name: MapLayerType.GROUND, data: [] },
            { name: MapLayerType.OBJECTS, data: [] },
            { name: MapLayerType.COLLISION, data: [] }
        ],
        npcs: [],
        portals: [
            { x: 31, y: 15, targetMap: 'town_01', targetX: 1, targetY: 15 }
        ],
        shops: [],
        encounter: {
            enabled: true,
            rate: 0.15,
            monsters: [
                { monsterId: 'grass_bunny', minLevel: 2, maxLevel: 5, weight: 50 },
                { monsterId: 'water_turtle', minLevel: 3, maxLevel: 6, weight: 30 },
                { monsterId: 'fire_dragon', minLevel: 4, maxLevel: 7, weight: 20 }
            ]
        }
    },
    house_01: {
        id: 'house_01',
        name: '村长家',
        width: 10,
        height: 8,
        tileset: 'indoors',
        layers: [
            { name: MapLayerType.GROUND, data: [] },
            { name: MapLayerType.OBJECTS, data: [] },
            { name: MapLayerType.COLLISION, data: [] }
        ],
        npcs: [
            { id: 'npc_mayor', x: 5, y: 3, dialogId: 'mayor_give_starter' }
        ],
        portals: [
            { x: 5, y: 7, targetMap: 'town_01', targetX: 15, targetY: 1 }
        ],
        shops: [],
        encounter: {
            enabled: false,
            rate: 0,
            monsters: []
        }
    }
};

// 商店模板
const ShopTemplates = {
    pokemart_town01: {
        id: 'pokemart_town01',
        name: '宝可梦商店',
        npcId: 'npc_shop',
        inventory: [
            { itemId: 'potion', price: 50, stock: 99 },
            { itemId: 'super_potion', price: 200, stock: 50 },
            { itemId: 'pokeball', price: 100, stock: 99 },
            { itemId: 'antidote', price: 100, stock: 99 }
        ],
        buyMultiplier: 1.0,
        sellMultiplier: 0.5
    }
};

// 对话模板
const DialogTemplates = {
    welcome: {
        id: 'welcome',
        lines: [
            '欢迎来到新手村！',
            '这里是你冒险的起点。',
            '先去拜访一下村长吧，他在北边的房子里。'
        ]
    },
    shop_greet: {
        id: 'shop_greet',
        lines: [
            '欢迎光临！',
            '需要买点什么吗？'
        ]
    },
    mayor_give_starter: {
        id: 'mayor_give_starter',
        lines: [
            '年轻人，你终于来了！',
            '这是我们村的守护怪兽，现在就托付给你了！',
            '愿你们一起成长，成为最棒的搭档！'
        ],
        onComplete: {
            action: 'give_starter_monster',
            monsterId: 'fire_dragon'
        }
    }
};
```

- [ ] **Step 6: 提交**

```bash
git add js/core/data/GameData.js js/core/data/MonsterData.js js/core/data/SkillData.js js/core/data/ItemData.js js/core/data/MapData.js
git commit -m "feat: implement data structures

- Add GameData with state enums and factory functions
- Add MonsterData with templates and element types
- Add SkillData with skill templates
- Add ItemData with items and equipment
- Add MapData with map templates

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 实现 GameStateMachine

**Files:**
- Create: `js/core/GameStateMachine.js`

- [ ] **Step 1: 创建 GameStateMachine.js**

```javascript
/**
 * 游戏状态机 - 管理全局游戏状态
 */
class GameStateMachine {
    constructor() {
        this.state = null;
        this.stateStack = [];
        this.gameState = null;
    }

    /**
     * 初始化状态机
     * @param {Object} initialGameState - 初始游戏状态
     */
    init(initialGameState) {
        this.gameState = initialGameState;
        this.changeState(initialGameState.currentState);
    }

    /**
     * 切换到新状态
     * @param {string} newState - 新状态
     */
    changeState(newState) {
        const oldState = this.state;

        if (oldState) {
            this.onExitState(oldState);
        }

        this.state = newState;
        this.gameState.currentState = newState;

        this.onEnterState(newState, oldState);

        eventBus.emit(GameEvents.STATE_CHANGE, {
            newState: newState,
            oldState: oldState
        });
    }

    /**
     * 推入新状态（保留当前状态在栈中）
     * @param {string} newState - 新状态
     */
    pushState(newState) {
        if (this.state) {
            this.stateStack.push(this.state);
            this.gameState.stateStack = [...this.stateStack];
        }

        this.state = newState;
        this.gameState.currentState = newState;

        this.onEnterState(newState);

        eventBus.emit(GameEvents.PUSH_STATE, {
            newState: newState
        });
    }

    /**
     * 弹出当前状态，返回到上一个状态
     */
    popState() {
        if (this.stateStack.length === 0) {
            console.warn('State stack is empty, cannot pop');
            return;
        }

        const oldState = this.state;
        this.onExitState(oldState);

        this.state = this.stateStack.pop();
        this.gameState.currentState = this.state;
        this.gameState.stateStack = [...this.stateStack];

        this.onEnterState(this.state, oldState);

        eventBus.emit(GameEvents.POP_STATE, {
            newState: this.state,
            oldState: oldState
        });
    }

    /**
     * 进入状态时的回调
     * @param {string} state - 新状态
     * @param {string} oldState - 旧状态
     */
    onEnterState(state, oldState) {
        console.log(`Entering state: ${state} (from: ${oldState || 'none'})`);
    }

    /**
     * 退出状态时的回调
     * @param {string} state - 旧状态
     */
    onExitState(state) {
        console.log(`Exiting state: ${state}`);
    }

    /**
     * 获取当前状态
     * @returns {string} 当前状态
     */
    getCurrentState() {
        return this.state;
    }

    /**
     * 获取游戏状态
     * @returns {Object} 游戏状态
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * 更新游戏状态
     * @param {Object} updates - 要更新的字段
     */
    updateGameState(updates) {
        this.gameState = { ...this.gameState, ...updates };
        eventBus.emit(GameEvents.DATA_UPDATE, this.gameState);
    }

    /**
     * 更新玩家数据
     * @param {Object} updates - 要更新的玩家字段
     */
    updatePlayer(updates) {
        this.gameState.player = { ...this.gameState.player, ...updates };
        eventBus.emit(GameEvents.DATA_UPDATE, this.gameState);
    }
}

// 创建全局实例
const gameStateMachine = new GameStateMachine();
```

- [ ] **Step 2: 提交**

```bash
git add js/core/GameStateMachine.js
git commit -m "feat: implement GameStateMachine

- Add GameStateMachine class with push/pop/change state
- Add state lifecycle callbacks
- Add game state management methods
- Export global gameStateMachine instance

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 实现 SaveManager

**Files:**
- Create: `js/core/SaveManager.js`

- [ ] **Step 1: 创建 SaveManager.js**

```javascript
/**
 * 存档管理器 - 处理游戏存档的保存和加载
 */
class SaveManager {
    constructor() {
        this.saveKeyPrefix = 'save_slot_';
        this.maxSlots = 3;
    }

    /**
     * 获取存档的 localStorage key
     * @param {number} slot - 存档槽位 (1-3)
     * @returns {string} localStorage key
     */
    getSaveKey(slot) {
        return `${this.saveKeyPrefix}${slot}`;
    }

    /**
     * 保存游戏
     * @param {Object} gameState - 游戏状态
     * @param {number} slot - 存档槽位 (1-3)
     * @returns {boolean} 是否保存成功
     */
    saveGame(gameState, slot) {
        if (slot < 1 || slot > this.maxSlots) {
            console.error(`Invalid save slot: ${slot}`);
            return false;
        }

        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                saveSlot: slot,
                gameState: this.deepClone(gameState)
            };

            const json = JSON.stringify(saveData);
            localStorage.setItem(this.getSaveKey(slot), json);

            console.log(`Game saved to slot ${slot}`);
            eventBus.emit(GameEvents.DATA_SAVE, { slot: slot, success: true });

            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            eventBus.emit(GameEvents.DATA_SAVE, { slot: slot, success: false, error: error });
            return false;
        }
    }

    /**
     * 加载游戏
     * @param {number} slot - 存档槽位 (1-3)
     * @returns {Object|null} 加载的游戏状态，失败返回 null
     */
    loadGame(slot) {
        if (slot < 1 || slot > this.maxSlots) {
            console.error(`Invalid save slot: ${slot}`);
            return null;
        }

        try {
            const json = localStorage.getItem(this.getSaveKey(slot));
            if (!json) {
                console.log(`No save data in slot ${slot}`);
                return null;
            }

            const saveData = JSON.parse(json);

            if (!this.isSaveDataValid(saveData)) {
                console.error('Invalid save data format');
                return null;
            }

            console.log(`Game loaded from slot ${slot}`);
            eventBus.emit(GameEvents.DATA_LOAD, { slot: slot, success: true, data: saveData });

            return saveData.gameState;
        } catch (error) {
            console.error('Failed to load game:', error);
            eventBus.emit(GameEvents.DATA_LOAD, { slot: slot, success: false, error: error });
            return null;
        }
    }

    /**
     * 检查存档数据是否有效
     * @param {Object} saveData - 存档数据
     * @returns {boolean} 是否有效
     */
    isSaveDataValid(saveData) {
        return saveData &&
            saveData.version &&
            saveData.timestamp &&
            saveData.saveSlot &&
            saveData.gameState;
    }

    /**
     * 获取所有存档的信息
     * @returns {Array<Object>} 存档信息数组
     */
    getAllSaveInfo() {
        const saves = [];
        for (let i = 1; i <= this.maxSlots; i++) {
            const info = this.getSaveInfo(i);
            saves.push(info);
        }
        return saves;
    }

    /**
     * 获取单个存档的信息
     * @param {number} slot - 存档槽位
     * @returns {Object} 存档信息
     */
    getSaveInfo(slot) {
        try {
            const json = localStorage.getItem(this.getSaveKey(slot));
            if (!json) {
                return { slot: slot, empty: true };
            }

            const saveData = JSON.parse(json);
            return {
                slot: slot,
                empty: false,
                timestamp: saveData.timestamp,
                version: saveData.version,
                gameTime: saveData.gameState?.gameTime || 0,
                playerName: saveData.gameState?.player?.name || '未知'
            };
        } catch (error) {
            return { slot: slot, empty: true, error: error };
        }
    }

    /**
     * 删除存档
     * @param {number} slot - 存档槽位
     * @returns {boolean} 是否删除成功
     */
    deleteSave(slot) {
        if (slot < 1 || slot > this.maxSlots) {
            console.error(`Invalid save slot: ${slot}`);
            return false;
        }

        try {
            localStorage.removeItem(this.getSaveKey(slot));
            console.log(`Save deleted from slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

// 创建全局实例
const saveManager = new SaveManager();
```

- [ ] **Step 2: 提交**

```bash
git add js/core/SaveManager.js
git commit -m "feat: implement SaveManager

- Add SaveManager class with save/load/delete methods
- Support up to 3 save slots
- Add save info inspection methods
- Export global saveManager instance

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 实现主入口 main.js

**Files:**
- Create: `js/main.js`
- Modify: `index.html` (确保脚本顺序正确)

- [ ] **Step 1: 创建 main.js**

```javascript
/**
 * 游戏主入口 - 初始化并启动游戏
 */

// 游戏主类
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.lastTime = 0;
        this.isRunning = false;

        this.subsystems = {};
    }

    /**
     * 初始化游戏
     */
    init() {
        console.log('Initializing Pokemon RPG...');

        // 获取 Canvas
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // 设置 Canvas 尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 创建初始游戏状态
        const initialGameState = createInitialGameState();

        // 初始化状态机
        gameStateMachine.init(initialGameState);

        // 初始化事件监听
        this.setupEventListeners();

        // 显示初始界面
        this.showTitleScreen();

        console.log('Game initialized successfully!');
    }

    /**
     * 调整 Canvas 尺寸
     */
    resizeCanvas() {
        const container = document.getElementById('game-container');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 游戏状态变化事件
        eventBus.on(GameEvents.STATE_CHANGE, (data) => {
            console.log('State changed:', data);
        });

        // 数据更新事件
        eventBus.on(GameEvents.DATA_UPDATE, (data) => {
            // 可以在这里自动保存
            // saveManager.saveGame(data, 1);
        });
    }

    /**
     * 处理键盘按下
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        const currentState = gameStateMachine.getCurrentState();

        switch (currentState) {
            case GameState.TITLE:
                if (e.key === 'Enter' || e.key === ' ') {
                    this.startNewGame();
                }
                break;
            case GameState.MENU:
                if (e.key === 'Escape') {
                    gameStateMachine.popState();
                }
                break;
            case GameState.MAP:
                if (e.key === 'Escape') {
                    gameStateMachine.pushState(GameState.MENU);
                }
                break;
        }
    }

    /**
     * 处理键盘松开
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyUp(e) {
        // 子类或子系统处理
    }

    /**
     * 显示标题画面
     */
    showTitleScreen() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('宝可梦风格 RPG', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '20px monospace';
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('按 Enter 开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    /**
     * 开始新游戏
     */
    startNewGame() {
        console.log('Starting new game...');
        gameStateMachine.changeState(GameState.MAP);

        this.startGameLoop();
    }

    /**
     * 加载存档
     * @param {number} slot - 存档槽位
     */
    loadGame(slot) {
        const gameState = saveManager.loadGame(slot);
        if (gameState) {
            gameStateMachine.init(gameState);
            this.startGameLoop();
        }
    }

    /**
     * 启动游戏主循环
     */
    startGameLoop() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * 游戏主循环
     * @param {number} time - 当前时间
     */
    gameLoop(time) {
        if (!this.isRunning) return;

        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // 更新
        this.update(deltaTime);

        // 渲染
        this.render();

        // 下一帧
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * 更新游戏逻辑
     * @param {number} deltaTime - 距离上一帧的时间（秒）
     */
    update(deltaTime) {
        const gameState = gameStateMachine.getGameState();
        gameState.gameTime += deltaTime;

        // 更新各子系统
        for (const subsystem of Object.values(this.subsystems)) {
            if (subsystem.update) {
                subsystem.update(deltaTime);
            }
        }
    }

    /**
     * 渲染游戏画面
     */
    render() {
        const currentState = gameStateMachine.getCurrentState();

        // 清屏
        this.ctx.fillStyle = '#202020';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 根据状态渲染
        switch (currentState) {
            case GameState.TITLE:
                this.showTitleScreen();
                break;
            case GameState.MAP:
                this.renderMapState();
                break;
            case GameState.BATTLE:
                this.renderBattleState();
                break;
            case GameState.DIALOG:
                this.renderDialogState();
                break;
            case GameState.MENU:
                this.renderMenuState();
                break;
            default:
                this.renderDefaultState();
        }
    }

    /**
     * 渲染地图状态
     */
    renderMapState() {
        const gameState = gameStateMachine.getGameState();
        this.ctx.fillStyle = '#3a5f0b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('地图场景', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`当前地图: ${gameState.currentMapId}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText('按 ESC 打开菜单', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    /**
     * 渲染战斗状态
     */
    renderBattleState() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('战斗场景', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 渲染对话状态
     */
    renderDialogState() {
        this.ctx.fillStyle = '#2d2d44';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('对话场景', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 渲染菜单状态
     */
    renderMenuState() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏菜单', this.canvas.width / 2, 100);

        const menuItems = ['1. 继续游戏', '2. 保存游戏', '3. 读取存档', '4. 返回标题'];
        this.ctx.font = '20px monospace';
        menuItems.forEach((item, index) => {
            this.ctx.fillText(item, this.canvas.width / 2, 200 + index * 40);
        });

        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('按 ESC 返回', this.canvas.width / 2, this.canvas.height - 50);
    }

    /**
     * 渲染默认状态
     */
    renderDefaultState() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('未知状态', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 注册子系统
     * @param {string} name - 子系统名称
     * @param {Object} subsystem - 子系统实例
     */
    registerSubsystem(name, subsystem) {
        this.subsystems[name] = subsystem;
        if (subsystem.init) {
            subsystem.init(gameStateMachine.getGameState());
        }
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
    }
}

// 创建全局游戏实例
const game = new Game();

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    game.init();
});
```

- [ ] **Step 2: 提交**

```bash
git add js/main.js
git commit -m "feat: implement main.js game entry

- Add Game class with main game loop
- Add state-based rendering
- Add keyboard input handling
- Add title screen and menu
- Auto-initialize on DOMContentLoaded

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 最终测试与验证

**Files:**
- Test: 所有文件

- [ ] **Step 1: 测试游戏能否正常启动**

在浏览器中打开 `index.html`，验证：
- 页面加载不报错
- 标题画面正常显示
- 按 Enter 可以开始游戏
- 按 ESC 可以打开/关闭菜单
- Console 中能看到初始化日志

- [ ] **Step 2: 验证存档功能**

在浏览器控制台测试：
```javascript
// 测试保存
saveManager.saveGame(gameStateMachine.getGameState(), 1);

// 测试读取
const loaded = saveManager.loadGame(1);
console.log('Loaded:', loaded);

// 查看存档信息
console.log('Save info:', saveManager.getAllSaveInfo());
```

- [ ] **Step 3: 验证事件总线**

在浏览器控制台测试：
```javascript
// 测试事件监听
eventBus.on('test:event', (data) => console.log('Received:', data));

// 测试事件发送
eventBus.emit('test:event', { message: 'Hello!' });
```

- [ ] **Step 4: 最终提交（如果需要修复）**

```bash
# 只有发现问题并修复时才需要提交
git status
```

---

## 计划完成总结

本计划完成后，将实现：

✅ 项目基础文件与结构
✅ EventBus 事件总线
✅ 完整的数据结构定义（GameData/MonsterData/SkillData/ItemData/MapData）
✅ GameStateMachine 全局状态管理
✅ SaveManager 存档管理（支持3个存档槽）
✅ 可运行的游戏主循环，支持状态切换

**核心架构接口已定义完毕，后续子系统（战斗/地图/对话/商店/UI）可基于此并行开发！**

