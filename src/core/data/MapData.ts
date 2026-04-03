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
            { id: 'npc_01', x: 10, y: 17, dialogId: 'welcome' },
            { id: 'npc_shop', x: 21, y: 13, dialogId: 'shop_greet', shopId: 'pokemart_town01' }
        ],
        portals: [
            { x: 0, y: 16, targetMap: 'route_01', targetX: 30, targetY: 15 },
            { x: 15, y: 0, targetMap: 'house_01', targetX: 4, targetY: 6 }
        ],
        shops: [
            { id: 'pokemart_town01', x: 21, y: 13 }
        ],
        encounter: {
            enabled: true,
            rate: 0.04,
            monsters: [
                { monsterId: 'electric_mouse', minLevel: 2, maxLevel: 4, weight: 55 },
                { monsterId: 'fire_fox', minLevel: 2, maxLevel: 4, weight: 45 }
            ]
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
            { x: 31, y: 15, targetMap: 'town_01', targetX: 1, targetY: 15 },
            { x: 0, y: 15, targetMap: 'route_02', targetX: 30, targetY: 15 }
        ],
        shops: [],
        encounter: {
            enabled: true,
            rate: 0.15,
            monsters: [
                { monsterId: 'grass_bunny', minLevel: 2, maxLevel: 5, weight: 50 },
                { monsterId: 'water_turtle', minLevel: 3, maxLevel: 6, weight: 30 },
                { monsterId: 'water_fish', minLevel: 4, maxLevel: 7, weight: 20 },
                { monsterId: 'rock_snake', minLevel: 5, maxLevel: 8, weight: 15 }
            ]
        }
    },
    route_02: {
        id: 'route_02',
        name: '2号道路',
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
            { x: 31, y: 15, targetMap: 'route_01', targetX: 1, targetY: 15 }
        ],
        shops: [],
        encounter: {
            enabled: true,
            rate: 0.18,
            monsters: [
                { monsterId: 'rock_snake', minLevel: 6, maxLevel: 9, weight: 35 },
                { monsterId: 'water_fish', minLevel: 5, maxLevel: 8, weight: 25 },
                { monsterId: 'dark_cat', minLevel: 7, maxLevel: 10, weight: 40 }
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
            { id: 'npc_mayor', x: 5, y: 4, dialogId: 'mayor_give_starter' }
        ],
        starterDisplays: [
            { id: 'starter_fire', monsterId: 'fire_dragon', x: 2, y: 5, label: '火龙' },
            { id: 'starter_water', monsterId: 'water_dragon', x: 4, y: 5, label: '水龙' },
            { id: 'starter_grass', monsterId: 'grass_dragon', x: 7, y: 5, label: '草龙' }
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
            { speaker: '村民', text: '欢迎来到新手村！' },
            { speaker: '村民', text: '这里是你冒险的起点。' },
            { speaker: '村民', text: '先去拜访一下村长吧，他在北边的房子里。' }
        ]
    },
    shop_greet: {
        id: 'shop_greet',
        lines: [
            { speaker: '店员', text: '欢迎光临！' },
            { speaker: '店员', text: '需要买点什么吗？' }
        ],
        onComplete: {
            type: 'open_shop',
            shopId: 'pokemart_town01'
        }
    },
    mayor_give_starter: {
        id: 'mayor_give_starter',
        lines: [
            { speaker: '村长', text: '年轻人，你终于来了！' },
            { speaker: '村长', text: '这是我们村的守护怪兽，现在就托付给你了！' },
            { speaker: '村长', text: '愿你们一起成长，成为最棒的搭档！' }
        ],
        onComplete: {
            type: 'give_monster',
            monsterId: 'fire_dragon',
            nickname: '小火',
            level: 5
        }
    }
};

// 兼容性别名 - 用于测试
const MapData = MapTemplates;

// 暴露到 window 对象上，供其他模块访问
window.MapLayerType = MapLayerType;
window.MapTemplates = MapTemplates;
window.MapData = MapData;
window.ShopTemplates = ShopTemplates;
window.DialogTemplates = DialogTemplates;

// 关键：将 DialogTemplates 合并到 DialogNodes（必须在 MapData.js 加载后执行）
console.log('[MapData] 合并 DialogTemplates 到 DialogNodes');
window.DialogNodes = {
    ...(window.DialogNodes || {}),
    ...DialogTemplates
};
window.DialogData = window.DialogNodes;
console.log('[MapData] 合并后的 DialogNodes:', window.DialogNodes);
