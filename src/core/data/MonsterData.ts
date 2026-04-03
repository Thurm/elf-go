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
} as const;

// 属性相克表
const ElementMultiplier: Record<ElementTypeValue, Record<ElementTypeValue, number>> = {
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
        randomTypes: [ElementType.FIRE, ElementType.NORMAL],
        profile: {
            description: '热血冲动的幼龙，喜欢在战斗前喷出小火苗示威。',
            habitat: '火山边缘、温暖洞穴',
            temperament: '勇敢、好胜'
        },
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
        randomTypes: [ElementType.WATER, ElementType.NORMAL],
        profile: {
            description: '稳重的防御型怪兽，遇险时会迅速缩入甲壳。',
            habitat: '浅滩、池塘',
            temperament: '沉稳、谨慎'
        },
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
        randomTypes: [ElementType.GRASS, ElementType.NORMAL],
        profile: {
            description: '擅长在草丛中高速穿梭，叶耳能感知风向。',
            habitat: '草原、森林边缘',
            temperament: '活泼、敏捷'
        },
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
        randomTypes: [ElementType.WATER, ElementType.NORMAL],
        profile: {
            description: '拥有冷静头脑的龙系后裔，能控制水流改变战局。',
            habitat: '瀑布、河谷',
            temperament: '冷静、可靠'
        },
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
        randomTypes: [ElementType.GRASS, ElementType.NORMAL],
        profile: {
            description: '与植物共生的龙种，能从阳光中汲取强大能量。',
            habitat: '古树森林、遗迹花园',
            temperament: '温和、专注'
        },
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
    },
    electric_mouse: {
        id: 'electric_mouse',
        name: '电鼠',
        type: ElementType.ELECTRIC,
        randomTypes: [ElementType.ELECTRIC, ElementType.NORMAL],
        profile: {
            description: '储电量惊人的小型怪兽，奔跑时会拖出细碎电弧。',
            habitat: '村庄草丛、风车附近',
            temperament: '机灵、好奇'
        },
        baseStats: {
            hp: 75,
            atk: 55,
            def: 45,
            spAtk: 88,
            spDef: 60,
            spd: 105
        },
        skills: ['thunder_shock', 'quick_attack', 'thunder_wave', 'volt_tackle'],
        expReward: 135,
        drops: [
            { itemId: 'paralyze_heal', chance: 0.2 }
        ]
    },
    fire_fox: {
        id: 'fire_fox',
        name: '火狐',
        type: ElementType.FIRE,
        randomTypes: [ElementType.FIRE, ElementType.NORMAL],
        profile: {
            description: '尾焰会随着情绪变换颜色，战斗时喜欢绕圈寻找破绽。',
            habitat: '灌木林、村郊小径',
            temperament: '狡黠、沉着'
        },
        baseStats: {
            hp: 82,
            atk: 62,
            def: 52,
            spAtk: 80,
            spDef: 58,
            spd: 92
        },
        skills: ['ember', 'quick_attack', 'fire_spin', 'growl'],
        expReward: 138,
        drops: [
            { itemId: 'burn_heal', chance: 0.2 }
        ]
    },
    water_fish: {
        id: 'water_fish',
        name: '水鱼',
        type: ElementType.WATER,
        randomTypes: [ElementType.WATER, ElementType.NORMAL],
        profile: {
            description: '鱼鳞坚韧，能在急流中灵活变向并释放高压水泡。',
            habitat: '河道、湖泊深处',
            temperament: '警觉、耐心'
        },
        baseStats: {
            hp: 88,
            atk: 52,
            def: 70,
            spAtk: 78,
            spDef: 90,
            spd: 68
        },
        skills: ['water_gun', 'bubblebeam', 'recover', 'bubble'],
        expReward: 145,
        drops: [
            { itemId: 'water_gem', chance: 0.22 }
        ]
    },
    rock_snake: {
        id: 'rock_snake',
        name: '岩蛇',
        type: ElementType.NORMAL,
        randomTypes: [ElementType.NORMAL],
        profile: {
            description: '由岩块连接而成的长蛇，行动缓慢但防御惊人。',
            habitat: '山路、洞窟入口',
            temperament: '迟缓、顽强'
        },
        baseStats: {
            hp: 115,
            atk: 78,
            def: 108,
            spAtk: 35,
            spDef: 70,
            spd: 42
        },
        skills: ['tackle', 'rock_throw', 'earthquake', 'withdraw'],
        expReward: 155,
        drops: [
            { itemId: 'pp_restore', chance: 0.16 }
        ]
    },
    dark_cat: {
        id: 'dark_cat',
        name: '暗猫',
        type: ElementType.NORMAL,
        randomTypes: [ElementType.NORMAL],
        profile: {
            description: '夜色中的潜伏猎手，擅长趁敌松懈时打出致命一击。',
            habitat: '夜路、废墟、密林深处',
            temperament: '冷傲、敏锐'
        },
        baseStats: {
            hp: 84,
            atk: 92,
            def: 58,
            spAtk: 70,
            spDef: 62,
            spd: 98
        },
        skills: ['scratch', 'quick_attack', 'night_shade', 'agility'],
        expReward: 165,
        drops: [
            { itemId: 'antidote', chance: 0.18 }
        ]
    }
} satisfies Record<string, MonsterTemplate>;

// 暴露常量到 window
window.ElementType = ElementType;
window.ElementMultiplier = ElementMultiplier;
window.MonsterTemplates = MonsterTemplates;
