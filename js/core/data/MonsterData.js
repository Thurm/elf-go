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
    },
    // ========== 初始怪兽 ==========
    water_dragon: {
        id: 'water_dragon',
        name: '水龙',
        type: ElementType.WATER,
        baseStats: {
            hp: 105,
            atk: 75,
            def: 80,
            spAtk: 80,
            spDef: 70,
            spd: 60
        },
        skills: ['water_gun', 'bubble', 'hydro_pump', 'withdraw'],
        expReward: 150,
        drops: [
            { itemId: 'water_gem', chance: 0.3 }
        ]
    },
    grass_dragon: {
        id: 'grass_dragon',
        name: '草龙',
        type: ElementType.GRASS,
        baseStats: {
            hp: 95,
            atk: 70,
            def: 65,
            spAtk: 85,
            spDef: 60,
            spd: 80
        },
        skills: ['vine_whip', 'razor_leaf', 'solar_beam', 'synthesis'],
        expReward: 150,
        drops: [
            { itemId: 'leaf_herb', chance: 0.3 }
        ]
    }
};

// 暴露常量到 window
window.ElementType = ElementType;
window.ElementMultiplier = ElementMultiplier;
window.MonsterTemplates = MonsterTemplates;
