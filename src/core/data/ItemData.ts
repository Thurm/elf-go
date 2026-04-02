/**
 * 物品/装备定义数据
 * 包含所有消耗品、装备品和关键道具的完整定义
 */

// 物品类型
const ItemType = {
    CONSUMABLE: 'consumable',
    EQUIPMENT: 'equipment',
    KEY_ITEM: 'key_item'
} as const;

// 装备槽位
const EquipmentSlot = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    HELMET: 'helmet',
    BOOTS: 'boots',
    ACCESSORY: 'accessory'
} as const;

// 稀有度
const ItemRarity = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
} as const;

// 稀有度颜色配置
const RarityColors = {
    common: { text: '#FFFFFF', border: '#888888', bg: '#333333' },
    rare: { text: '#00BFFF', border: '#0080FF', bg: '#1a3a5c' },
    epic: { text: '#A855F7', border: '#7C3AED', bg: '#3d1f5c' },
    legendary: { text: '#FFD700', border: '#FFA500', bg: '#4d3d00' }
} as const;

// 物品模板 - 完整定义
const ItemTemplates = {
    // ========== 消耗品 - 药水类 ==========
    potion: {
        id: 'potion',
        name: '低级药水',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'single_monster',
        effect: {
            type: 'heal_hp',
            value: 50
        },
        price: { buy: 50, sell: 25 },
        description: '恢复 50 点 HP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_village_01', 'shop_city_01']
    },
    super_potion: {
        id: 'super_potion',
        name: '中级药水',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'single_monster',
        effect: {
            type: 'heal_hp',
            value: 100
        },
        price: { buy: 200, sell: 100 },
        description: '恢复 100 点 HP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },
    hyper_potion: {
        id: 'hyper_potion',
        name: '高级药水',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        target: 'single_monster',
        effect: {
            type: 'heal_hp',
            value: 200
        },
        price: { buy: 500, sell: 250 },
        description: '恢复 200 点 HP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_metropolis_01']
    },
    max_potion: {
        id: 'max_potion',
        name: '全满药水',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        target: 'single_monster',
        effect: {
            type: 'heal_hp_full'
        },
        price: { buy: 1200, sell: 600 },
        description: '恢复全部 HP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_special_01']
    },

    // ========== 消耗品 - 状态恢复类 ==========
    antidote: {
        id: 'antidote',
        name: '解毒药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'single_monster',
        effect: {
            type: 'cure_status',
            status: 'poison'
        },
        price: { buy: 80, sell: 40 },
        description: '解除中毒状态',
        stackable: true,
        maxStack: 99,
        shops: ['shop_village_01', 'shop_city_01']
    },
    awakening: {
        id: 'awakening',
        name: '清醒药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'single_monster',
        effect: {
            type: 'cure_status',
            status: 'sleep'
        },
        price: { buy: 100, sell: 50 },
        description: '解除睡眠状态',
        stackable: true,
        maxStack: 99,
        shops: ['shop_village_01', 'shop_city_01']
    },
    burn_heal: {
        id: 'burn_heal',
        name: '解冻药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'single_monster',
        effect: {
            type: 'cure_status',
            status: ['burn', 'freeze']
        },
        price: { buy: 120, sell: 60 },
        description: '解除灼烧/冰冻状态',
        stackable: true,
        maxStack: 99,
        shops: ['shop_village_01', 'shop_city_01']
    },
    paralyze_heal: {
        id: 'paralyze_heal',
        name: '麻痹恢复药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'single_monster',
        effect: {
            type: 'cure_status',
            status: 'paralyze'
        },
        price: { buy: 120, sell: 60 },
        description: '解除麻痹状态',
        stackable: true,
        maxStack: 99,
        shops: ['shop_village_01', 'shop_city_01']
    },
    full_heal: {
        id: 'full_heal',
        name: '全状态恢复药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        target: 'single_monster',
        effect: {
            type: 'cure_all_status'
        },
        price: { buy: 600, sell: 300 },
        description: '解除所有异常状态',
        stackable: true,
        maxStack: 99,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },

    // ========== 消耗品 - 复活类 ==========
    revive: {
        id: 'revive',
        name: '复活药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        target: 'fainted_monster',
        effect: {
            type: 'revive',
            hpPercent: 0.5
        },
        price: { buy: 1500, sell: 750 },
        description: '复活并恢复 50% HP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },
    max_revive: {
        id: 'max_revive',
        name: '全复活药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        target: 'fainted_monster',
        effect: {
            type: 'revive',
            hpPercent: 1.0
        },
        price: { buy: 3000, sell: 1500 },
        description: '复活并恢复全部 HP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_special_01']
    },

    // ========== 消耗品 - PP恢复类 ==========
    pp_restore: {
        id: 'pp_restore',
        name: 'PP 恢复药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        target: 'single_skill',
        effect: {
            type: 'restore_pp',
            value: 10
        },
        price: { buy: 300, sell: 150 },
        description: '恢复一个技能 10 PP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },
    pp_max: {
        id: 'pp_max',
        name: '全 PP 恢复药',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        target: 'single_monster',
        effect: {
            type: 'restore_pp_full'
        },
        price: { buy: 800, sell: 400 },
        description: '恢复所有技能全部 PP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_metropolis_01']
    },
    ether: {
        id: 'ether',
        name: '技能药剂',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        target: 'single_monster',
        effect: {
            type: 'restore_pp_all',
            value: 5
        },
        price: { buy: 450, sell: 225 },
        description: '恢复所有技能 5 PP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },
    elixir: {
        id: 'elixir',
        name: '万能药剂',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
        target: 'single_monster',
        effect: {
            type: 'elixir'
        },
        price: { buy: 5000, sell: 2500 },
        description: '恢复全部 HP 和全部 PP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_secret_01']
    },

    // ========== 消耗品 - 捕捉球类 ==========
    pokeball: {
        id: 'pokeball',
        name: '普通怪兽球',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'enemy_monster',
        effect: {
            type: 'catch',
            baseRate: 1.0
        },
        price: { buy: 100, sell: 50 },
        description: '捕捉率 1.0x',
        stackable: true,
        maxStack: 99,
        shops: ['shop_village_01', 'shop_city_01']
    },
    greatball: {
        id: 'greatball',
        name: '高级怪兽球',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        target: 'enemy_monster',
        effect: {
            type: 'catch',
            baseRate: 1.5
        },
        price: { buy: 300, sell: 150 },
        description: '捕捉率 1.5x',
        stackable: true,
        maxStack: 99,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },
    ultraball: {
        id: 'ultraball',
        name: '超级怪兽球',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        target: 'enemy_monster',
        effect: {
            type: 'catch',
            baseRate: 2.0
        },
        price: { buy: 600, sell: 300 },
        description: '捕捉率 2.0x',
        stackable: true,
        maxStack: 99,
        shops: ['shop_metropolis_01']
    },
    masterball: {
        id: 'masterball',
        name: '大师球',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
        target: 'enemy_monster',
        effect: {
            type: 'catch',
            baseRate: 100.0,
            guaranteed: true
        },
        price: { buy: null, sell: 5000 },
        description: '捕捉率 100%',
        stackable: true,
        maxStack: 99,
        shops: []
    },
    luxuryball: {
        id: 'luxuryball',
        name: '豪华球',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        target: 'enemy_monster',
        effect: {
            type: 'catch',
            baseRate: 1.0,
            friendshipBonus: true
        },
        price: { buy: 800, sell: 400 },
        description: '捕捉率 1.0x，提升亲密度',
        stackable: true,
        maxStack: 99,
        shops: ['shop_special_01']
    },
    timerball: {
        id: 'timerball',
        name: '计时球',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        target: 'enemy_monster',
        effect: {
            type: 'catch',
            baseRate: 1.0,
            turnsBonus: true
        },
        price: { buy: 700, sell: 350 },
        description: '战斗越长捕捉率越高',
        stackable: true,
        maxStack: 99,
        shops: ['shop_metropolis_01']
    },

    // ========== 装备品 - 武器 ==========
    wooden_sword: {
        id: 'wooden_sword',
        name: '木剑',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.COMMON,
        stats: { atk: 5 },
        effect: null,
        price: { buy: 200, sell: 100 },
        description: '初学者用的木制武器',
        stackable: false,
        shops: ['shop_village_01']
    },
    iron_sword: {
        id: 'iron_sword',
        name: '铁剑',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.COMMON,
        stats: { atk: 12 },
        effect: null,
        price: { buy: 800, sell: 400 },
        description: '坚固的铁制长剑',
        stackable: false,
        shops: ['shop_city_01']
    },
    steel_sword: {
        id: 'steel_sword',
        name: '钢剑',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.RARE,
        stats: { atk: 20 },
        effect: null,
        price: { buy: 2000, sell: 1000 },
        description: '精制的钢制武器',
        stackable: false,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },
    flame_sword: {
        id: 'flame_sword',
        name: '火焰之剑',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.EPIC,
        stats: { atk: 25, fireAtk: 15 },
        effect: { type: 'burn_chance', value: 10 },
        price: { buy: 5000, sell: 2500 },
        description: '蕴含火焰之力',
        stackable: false,
        shops: ['shop_special_01']
    },
    dragon_blade: {
        id: 'dragon_blade',
        name: '龙之刃',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.LEGENDARY,
        stats: { atk: 40, def: 5, spAtk: 5, spDef: 5, spd: 5 },
        effect: { type: 'dragon_power', value: 15 },
        price: { buy: 15000, sell: 7500 },
        description: '传说的龙系武器',
        stackable: false,
        shops: ['shop_secret_01']
    },
    mage_staff: {
        id: 'mage_staff',
        name: '法师杖',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.RARE,
        stats: { spAtk: 15 },
        effect: null,
        price: { buy: 1800, sell: 900 },
        description: '提升特殊攻击',
        stackable: false,
        shops: ['shop_city_01']
    },
    dragon_claw: {
        id: 'dragon_claw',
        name: '龙之爪',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.WEAPON,
        rarity: ItemRarity.EPIC,
        stats: { atk: 18, spd: 3 },
        effect: null,
        price: { buy: 3500, sell: 1750 },
        description: '锋利的龙爪武器',
        stackable: false,
        shops: ['shop_metropolis_01']
    },

    // ========== 装备品 - 防具 ==========
    cloth_armor: {
        id: 'cloth_armor',
        name: '布甲',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ARMOR,
        rarity: ItemRarity.COMMON,
        stats: { def: 5 },
        effect: null,
        price: { buy: 180, sell: 90 },
        description: '轻便的布料护甲',
        stackable: false,
        shops: ['shop_village_01']
    },
    leather_armor: {
        id: 'leather_armor',
        name: '皮甲',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ARMOR,
        rarity: ItemRarity.COMMON,
        stats: { def: 10 },
        effect: null,
        price: { buy: 600, sell: 300 },
        description: '鞣制皮革制成',
        stackable: false,
        shops: ['shop_city_01']
    },
    iron_armor: {
        id: 'iron_armor',
        name: '铁甲',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ARMOR,
        rarity: ItemRarity.RARE,
        stats: { def: 18 },
        effect: null,
        price: { buy: 1800, sell: 900 },
        description: '坚固的铁制铠甲',
        stackable: false,
        shops: ['shop_city_01']
    },
    steel_armor: {
        id: 'steel_armor',
        name: '钢甲',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ARMOR,
        rarity: ItemRarity.EPIC,
        stats: { def: 28 },
        effect: null,
        price: { buy: 4000, sell: 2000 },
        description: '精制钢制铠甲',
        stackable: false,
        shops: ['shop_metropolis_01']
    },
    flame_robe: {
        id: 'flame_robe',
        name: '火焰长袍',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ARMOR,
        rarity: ItemRarity.EPIC,
        stats: { def: 15, fireDef: 20 },
        effect: { type: 'fire_resistance', value: 50 },
        price: { buy: 4500, sell: 2250 },
        description: '火焰抗性披风',
        stackable: false,
        shops: ['shop_special_01']
    },
    dragon_scale_armor: {
        id: 'dragon_scale_armor',
        name: '龙鳞甲',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ARMOR,
        rarity: ItemRarity.LEGENDARY,
        stats: { def: 40, fireDef: 10, waterDef: 10, grassDef: 10, electricDef: 10 },
        effect: { type: 'all_element_resistance', value: 10 },
        price: { buy: 18000, sell: 9000 },
        description: '传说的龙鳞铠甲',
        stackable: false,
        shops: ['shop_secret_01']
    },

    // ========== 装备品 - 头盔 ==========
    cloth_cap: {
        id: 'cloth_cap',
        name: '布帽',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.HELMET,
        rarity: ItemRarity.COMMON,
        stats: { def: 2, spDef: 2 },
        effect: null,
        price: { buy: 100, sell: 50 },
        description: '简单的布制帽子',
        stackable: false,
        shops: ['shop_village_01']
    },
    iron_helmet: {
        id: 'iron_helmet',
        name: '铁头盔',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.HELMET,
        rarity: ItemRarity.COMMON,
        stats: { def: 6 },
        effect: null,
        price: { buy: 500, sell: 250 },
        description: '铁制防护头盔',
        stackable: false,
        shops: ['shop_city_01']
    },
    steel_helmet: {
        id: 'steel_helmet',
        name: '钢头盔',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.HELMET,
        rarity: ItemRarity.RARE,
        stats: { def: 10, spDef: 5 },
        effect: null,
        price: { buy: 1500, sell: 750 },
        description: '精制钢制头盔',
        stackable: false,
        shops: ['shop_metropolis_01']
    },
    wise_crown: {
        id: 'wise_crown',
        name: '智慧之冠',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.HELMET,
        rarity: ItemRarity.EPIC,
        stats: { spAtk: 10, spDef: 10 },
        effect: { type: 'wisdom_bonus', value: 5 },
        price: { buy: 4000, sell: 2000 },
        description: '提升特殊能力',
        stackable: false,
        shops: ['shop_special_01']
    },

    // ========== 装备品 - 靴子 ==========
    cloth_shoes: {
        id: 'cloth_shoes',
        name: '布鞋',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.BOOTS,
        rarity: ItemRarity.COMMON,
        stats: { spd: 2 },
        effect: null,
        price: { buy: 80, sell: 40 },
        description: '简单的布鞋',
        stackable: false,
        shops: ['shop_village_01']
    },
    leather_boots: {
        id: 'leather_boots',
        name: '皮靴',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.BOOTS,
        rarity: ItemRarity.COMMON,
        stats: { spd: 5 },
        effect: null,
        price: { buy: 400, sell: 200 },
        description: '皮革制长靴',
        stackable: false,
        shops: ['shop_city_01']
    },
    steel_boots: {
        id: 'steel_boots',
        name: '钢靴',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.BOOTS,
        rarity: ItemRarity.RARE,
        stats: { def: 4, spd: 3 },
        effect: null,
        price: { buy: 1200, sell: 600 },
        description: '钢制防护靴',
        stackable: false,
        shops: ['shop_metropolis_01']
    },
    swift_boots: {
        id: 'swift_boots',
        name: '疾风靴',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.BOOTS,
        rarity: ItemRarity.EPIC,
        stats: { spd: 12 },
        effect: { type: 'swift_evasion', value: 5 },
        price: { buy: 3500, sell: 1750 },
        description: '大幅提升速度',
        stackable: false,
        shops: ['shop_special_01']
    },

    // ========== 装备品 - 饰品 ==========
    power_ring: {
        id: 'power_ring',
        name: '力量戒指',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.RARE,
        stats: { atk: 8 },
        effect: null,
        price: { buy: 1000, sell: 500 },
        description: '提升攻击力',
        stackable: false,
        shops: ['shop_city_01']
    },
    guard_ring: {
        id: 'guard_ring',
        name: '守护戒指',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.RARE,
        stats: { def: 8 },
        effect: null,
        price: { buy: 1000, sell: 500 },
        description: '提升防御力',
        stackable: false,
        shops: ['shop_city_01']
    },
    wise_ring: {
        id: 'wise_ring',
        name: '智慧戒指',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.RARE,
        stats: { spAtk: 8, spDef: 8 },
        effect: null,
        price: { buy: 1200, sell: 600 },
        description: '提升特攻特防',
        stackable: false,
        shops: ['shop_city_01']
    },
    swift_ring: {
        id: 'swift_ring',
        name: '迅捷戒指',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.RARE,
        stats: { spd: 8 },
        effect: null,
        price: { buy: 1000, sell: 500 },
        description: '提升速度',
        stackable: false,
        shops: ['shop_city_01']
    },
    life_amulet: {
        id: 'life_amulet',
        name: '生命护符',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.RARE,
        stats: { maxHp: 30 },
        effect: null,
        price: { buy: 2000, sell: 1000 },
        description: '提升最大 HP',
        stackable: false,
        shops: ['shop_city_01', 'shop_metropolis_01']
    },
    lucky_charm: {
        id: 'lucky_charm',
        name: '幸运护符',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.EPIC,
        stats: {},
        effect: { type: 'crit_bonus', value: 10 },
        price: { buy: 3000, sell: 1500 },
        description: '提升暴击率',
        stackable: false,
        shops: ['shop_metropolis_01']
    },
    exp_booster: {
        id: 'exp_booster',
        name: '经验护符',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.EPIC,
        stats: {},
        effect: { type: 'exp_bonus', value: 20 },
        price: { buy: 5000, sell: 2500 },
        description: '经验获取提升',
        stackable: false,
        shops: ['shop_special_01']
    },
    soul_orb: {
        id: 'soul_orb',
        name: '灵魂宝珠',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.EPIC,
        stats: { atk: 5, def: 5, spAtk: 5, spDef: 5, spd: 5 },
        effect: null,
        price: { buy: 8000, sell: 4000 },
        description: '全属性小幅提升',
        stackable: false,
        shops: ['shop_special_01', 'shop_metropolis_01']
    },
    dragon_heart: {
        id: 'dragon_heart',
        name: '龙之心脏',
        type: ItemType.EQUIPMENT,
        slot: EquipmentSlot.ACCESSORY,
        rarity: ItemRarity.LEGENDARY,
        stats: { atk: 15, def: 15, spAtk: 15, spDef: 15, spd: 15, maxHp: 50 },
        effect: { type: 'dragon_aura', value: 10 },
        price: { buy: 25000, sell: 12500 },
        description: '传说的神器',
        stackable: false,
        shops: ['shop_secret_01']
    },

    // ========== 关键道具 ==========
    town_map: {
        id: 'town_map',
        name: '城镇地图',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.COMMON,
        effect: { type: 'map_display' },
        price: { buy: null, sell: null },
        description: '显示当前区域地图',
        stackable: false,
        discardable: false,
        shops: []
    },
    bike: {
        id: 'bike',
        name: '自行车',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.RARE,
        effect: { type: 'fast_move' },
        price: { buy: null, sell: null },
        description: '快速移动',
        stackable: false,
        discardable: false,
        shops: []
    },
    fishing_rod: {
        id: 'fishing_rod',
        name: '钓竿',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.COMMON,
        effect: { type: 'fishing' },
        price: { buy: null, sell: null },
        description: '可以钓鱼',
        stackable: false,
        discardable: false,
        shops: []
    },
    super_rod: {
        id: 'super_rod',
        name: '高级钓竿',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.RARE,
        effect: { type: 'fishing_advanced' },
        price: { buy: null, sell: null },
        description: '可以钓高级鱼',
        stackable: false,
        discardable: false,
        shops: []
    },
    hm_cut: {
        id: 'hm_cut',
        name: '秘传机居合斩',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.EPIC,
        effect: { type: 'hm_cut' },
        price: { buy: null, sell: null },
        description: '可以砍断小树',
        stackable: false,
        discardable: false,
        shops: []
    },
    hm_flash: {
        id: 'hm_flash',
        name: '秘传机闪光',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.EPIC,
        effect: { type: 'hm_flash' },
        price: { buy: null, sell: null },
        description: '照亮黑暗洞穴',
        stackable: false,
        discardable: false,
        shops: []
    },
    hm_surf: {
        id: 'hm_surf',
        name: '秘传机冲浪',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.EPIC,
        effect: { type: 'hm_surf' },
        price: { buy: null, sell: null },
        description: '可以在水面移动',
        stackable: false,
        discardable: false,
        shops: []
    },
    badge_forest: {
        id: 'badge_forest',
        name: '森林徽章',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.EPIC,
        effect: { type: 'badge', badgeLevel: 1 },
        price: { buy: null, sell: null },
        description: '第一道馆徽章',
        stackable: false,
        discardable: false,
        shops: []
    },
    badge_water: {
        id: 'badge_water',
        name: '水源徽章',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.EPIC,
        effect: { type: 'badge', badgeLevel: 2 },
        price: { buy: null, sell: null },
        description: '第二道馆徽章',
        stackable: false,
        discardable: false,
        shops: []
    },
    badge_fire: {
        id: 'badge_fire',
        name: '火焰徽章',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.EPIC,
        effect: { type: 'badge', badgeLevel: 3 },
        price: { buy: null, sell: null },
        description: '第三道馆徽章',
        stackable: false,
        discardable: false,
        shops: []
    },
    key_secret: {
        id: 'key_secret',
        name: '秘密钥匙',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.LEGENDARY,
        effect: { type: 'unlock_secret_shop' },
        price: { buy: null, sell: null },
        description: '打开秘密商店',
        stackable: false,
        discardable: false,
        shops: []
    },

    // ========== 关键道具 - 任务物品 ==========
    fire_scale: {
        id: 'fire_scale',
        name: '火焰鳞片',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.COMMON,
        effect: { type: 'quest_item' },
        price: { buy: null, sell: 50 },
        description: '火系怪兽身上掉落的鳞片，散发着微弱的热量',
        stackable: true,
        maxStack: 99,
        discardable: true,
        shops: []
    },
    water_gem: {
        id: 'water_gem',
        name: '水之宝石',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.COMMON,
        effect: { type: 'quest_item' },
        price: { buy: null, sell: 50 },
        description: '水系怪兽身上掉落的宝石，闪烁着蓝光',
        stackable: true,
        maxStack: 99,
        discardable: true,
        shops: []
    },
    leaf_herb: {
        id: 'leaf_herb',
        name: '叶子草药',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.COMMON,
        effect: { type: 'quest_item' },
        price: { buy: null, sell: 30 },
        description: '草系怪兽身上掉落的草药，散发着清香',
        stackable: true,
        maxStack: 99,
        discardable: true,
        shops: []
    },
    letter_from_xiaohong: {
        id: 'letter_from_xiaohong',
        name: '小红的信',
        type: ItemType.KEY_ITEM,
        rarity: ItemRarity.RARE,
        effect: { type: 'quest_item' },
        price: { buy: null, sell: null },
        description: '小红写给研究员的信，封口很整齐',
        stackable: false,
        discardable: false,
        shops: []
    },

    // ========== 消耗品 - 全恢复类 ==========
    full_restore: {
        id: 'full_restore',
        name: '全满药水',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        target: 'single_monster',
        effect: {
            type: 'heal_hp_full'
        },
        price: { buy: 1200, sell: 600 },
        description: '恢复全部 HP',
        stackable: true,
        maxStack: 99,
        shops: ['shop_special_01']
    }
} satisfies Record<string, ItemTemplate>;

// 商店定义数据
const ShopData = {
    pokemart_town01: {
        id: 'pokemart_town01',
        name: '宝可梦商店',
        npcId: 'npc_shop',
        npcName: '商店老板',
        description: '新手村的宝可梦商店',
        location: { mapId: 'town_01', x: 12, y: 10 },
        inventory: [
            { itemId: 'potion', price: 50, stock: 99, unlimited: true },
            { itemId: 'super_potion', price: 200, stock: 50, unlimited: true },
            { itemId: 'pokeball', price: 100, stock: 99, unlimited: true },
            { itemId: 'antidote', price: 100, stock: 99, unlimited: true }
        ],
        buyMultiplier: 1.0,
        sellMultiplier: 0.5,
        unlockCondition: { type: 'default' },
        hours: { open: 0, close: 24 }
    },
    shop_village_01: {
        id: 'shop_village_01',
        name: '初心商店',
        npcId: 'shopkeeper_li',
        npcName: '商店老板老李',
        description: '新手村的小型商店',
        location: { mapId: 'village_01', x: 12, y: 10 },
        inventory: [
            { itemId: 'potion', price: 50, stock: 99, unlimited: true },
            { itemId: 'antidote', price: 80, stock: 99, unlimited: true },
            { itemId: 'awakening', price: 100, stock: 99, unlimited: true },
            { itemId: 'burn_heal', price: 120, stock: 99, unlimited: true },
            { itemId: 'paralyze_heal', price: 120, stock: 99, unlimited: true },
            { itemId: 'pokeball', price: 100, stock: 99, unlimited: true },
            { itemId: 'wooden_sword', price: 200, stock: 10, unlimited: false },
            { itemId: 'cloth_armor', price: 180, stock: 10, unlimited: false },
            { itemId: 'cloth_cap', price: 100, stock: 10, unlimited: false },
            { itemId: 'cloth_shoes', price: 80, stock: 10, unlimited: false }
        ],
        buyMultiplier: 1.0,
        sellMultiplier: 0.5,
        unlockCondition: { type: 'default' },
        hours: { open: 0, close: 24 }
    },
    shop_city_01: {
        id: 'shop_city_01',
        name: '绿叶市商店',
        npcId: 'shopkeeper_wang',
        npcName: '商店老板王姐',
        description: '绿叶市商业区的综合商店',
        location: { mapId: 'city_01', x: 15, y: 8 },
        inventory: [
            { itemId: 'potion', price: 50, stock: 99, unlimited: true },
            { itemId: 'super_potion', price: 200, stock: 99, unlimited: true },
            { itemId: 'antidote', price: 80, stock: 99, unlimited: true },
            { itemId: 'awakening', price: 100, stock: 99, unlimited: true },
            { itemId: 'burn_heal', price: 120, stock: 99, unlimited: true },
            { itemId: 'paralyze_heal', price: 120, stock: 99, unlimited: true },
            { itemId: 'full_heal', price: 600, stock: 50, unlimited: true },
            { itemId: 'revive', price: 1500, stock: 30, unlimited: true },
            { itemId: 'pp_restore', price: 300, stock: 50, unlimited: true },
            { itemId: 'ether', price: 450, stock: 30, unlimited: true },
            { itemId: 'pokeball', price: 100, stock: 99, unlimited: true },
            { itemId: 'greatball', price: 300, stock: 99, unlimited: true },
            { itemId: 'iron_sword', price: 800, stock: 10, unlimited: false },
            { itemId: 'steel_sword', price: 2000, stock: 5, unlimited: false },
            { itemId: 'leather_armor', price: 600, stock: 10, unlimited: false },
            { itemId: 'iron_armor', price: 1800, stock: 5, unlimited: false },
            { itemId: 'iron_helmet', price: 500, stock: 10, unlimited: false },
            { itemId: 'leather_boots', price: 400, stock: 10, unlimited: false },
            { itemId: 'power_ring', price: 1000, stock: 10, unlimited: false },
            { itemId: 'guard_ring', price: 1000, stock: 10, unlimited: false },
            { itemId: 'wise_ring', price: 1200, stock: 10, unlimited: false },
            { itemId: 'swift_ring', price: 1000, stock: 10, unlimited: false },
            { itemId: 'life_amulet', price: 2000, stock: 5, unlimited: false },
            { itemId: 'mage_staff', price: 1800, stock: 5, unlimited: false }
        ],
        buyMultiplier: 1.0,
        sellMultiplier: 0.5,
        unlockCondition: { type: 'quest', questId: 'quest_arrive_city' },
        hours: { open: 0, close: 24 }
    },
    shop_metropolis_01: {
        id: 'shop_metropolis_01',
        name: '黄金城百货',
        npcId: 'shopkeeper_metro',
        npcName: '百货商店店员',
        description: '黄金城中央大道的大型百货商店',
        location: { mapId: 'metropolis_01', x: 20, y: 12 },
        inventory: [
            { itemId: 'super_potion', price: 200, stock: 99, unlimited: true },
            { itemId: 'hyper_potion', price: 500, stock: 99, unlimited: true },
            { itemId: 'full_heal', price: 600, stock: 99, unlimited: true },
            { itemId: 'revive', price: 1500, stock: 50, unlimited: true },
            { itemId: 'pp_restore', price: 300, stock: 99, unlimited: true },
            { itemId: 'pp_max', price: 800, stock: 50, unlimited: true },
            { itemId: 'ether', price: 450, stock: 50, unlimited: true },
            { itemId: 'greatball', price: 300, stock: 99, unlimited: true },
            { itemId: 'ultraball', price: 600, stock: 99, unlimited: true },
            { itemId: 'timerball', price: 700, stock: 30, unlimited: true },
            { itemId: 'steel_sword', price: 2000, stock: 10, unlimited: false },
            { itemId: 'dragon_claw', price: 3500, stock: 5, unlimited: false },
            { itemId: 'steel_armor', price: 4000, stock: 5, unlimited: false },
            { itemId: 'steel_helmet', price: 1500, stock: 10, unlimited: false },
            { itemId: 'steel_boots', price: 1200, stock: 10, unlimited: false },
            { itemId: 'life_amulet', price: 2000, stock: 10, unlimited: false },
            { itemId: 'lucky_charm', price: 3000, stock: 5, unlimited: false },
            { itemId: 'soul_orb', price: 8000, stock: 3, unlimited: false }
        ],
        buyMultiplier: 1.0,
        sellMultiplier: 0.5,
        unlockCondition: { type: 'quest', questId: 'quest_arrive_metropolis' },
        hours: { open: 0, close: 24 }
    },
    shop_special_01: {
        id: 'shop_special_01',
        name: '海滨珍宝店',
        npcId: 'shopkeeper_mystery',
        npcName: '神秘商人',
        description: '海滨镇港口的特殊商店',
        location: { mapId: 'seaside_01', x: 8, y: 5 },
        inventory: [
            { itemId: 'max_potion', price: 1200, stock: 20, unlimited: false },
            { itemId: 'max_revive', price: 3000, stock: 10, unlimited: false },
            { itemId: 'luxuryball', price: 800, stock: 30, unlimited: true },
            { itemId: 'flame_sword', price: 5000, stock: 3, unlimited: false },
            { itemId: 'flame_robe', price: 4500, stock: 3, unlimited: false },
            { itemId: 'wise_crown', price: 4000, stock: 3, unlimited: false },
            { itemId: 'swift_boots', price: 3500, stock: 5, unlimited: false },
            { itemId: 'exp_booster', price: 5000, stock: 3, unlimited: false },
            { itemId: 'soul_orb', price: 8000, stock: 2, unlimited: false }
        ],
        buyMultiplier: 1.0,
        sellMultiplier: 0.5,
        unlockCondition: { type: 'quest', questId: 'quest_seaside_mystery' },
        hours: { open: 18, close: 6 }
    },
    shop_secret_01: {
        id: 'shop_secret_01',
        name: '黑市',
        npcId: 'shopkeeper_shadow',
        npcName: '影子商人',
        description: '黄金城地下的秘密商店',
        location: { mapId: 'metropolis_01', x: 5, y: 25 },
        inventory: [
            { itemId: 'elixir', price: 5000, stock: 5, unlimited: false },
            { itemId: 'dragon_blade', price: 15000, stock: 1, unlimited: false },
            { itemId: 'dragon_scale_armor', price: 18000, stock: 1, unlimited: false },
            { itemId: 'dragon_heart', price: 25000, stock: 1, unlimited: false }
        ],
        buyMultiplier: 1.0,
        sellMultiplier: 0.6,
        unlockCondition: { type: 'item', itemId: 'key_secret' },
        hours: { open: 20, close: 4 }
    }
} satisfies Record<string, ShopData>;

/**
 * 获取物品模板
 * @param {string} itemId - 物品ID
 * @returns {Object|null} 物品模板
 */
function getItemTemplate(itemId: string): ItemTemplate | null {
    return ItemTemplates[itemId] || null;
}

/**
 * 获取商店数据
 * @param {string} shopId - 商店ID
 * @returns {Object|null} 商店数据
 */
function getShopData(shopId: string): ShopData | null {
    return ShopData[shopId] || null;
}

/**
 * 获取稀有度显示名称
 * @param {string} rarity - 稀有度
 * @returns {string} 显示名称
 */
function getRarityName(rarity: RarityColorKey): string {
    const names = {
        common: '普通',
        rare: '稀有',
        epic: '史诗',
        legendary: '传说'
    } as const;
    return names[rarity] || '未知';
}

/**
 * 获取装备槽位显示名称
 * @param {string} slot - 槽位
 * @returns {string} 显示名称
 */
function getEquipmentSlotName(slot: EquipmentSlotValue): string {
    const names = {
        weapon: '武器',
        armor: '防具',
        helmet: '头盔',
        boots: '靴子',
        accessory: '饰品'
    } as const;
    return names[slot] || '未知';
}

// 暴露到 window 对象上，供其他模块访问
window.ItemTemplates = ItemTemplates;
window.ShopData = ShopData;
window.getItemTemplate = getItemTemplate;
window.getShopData = getShopData;
window.getRarityName = getRarityName;
window.getEquipmentSlotName = getEquipmentSlotName;
window.ItemType = ItemType;
window.EquipmentSlot = EquipmentSlot;
window.ItemRarity = ItemRarity;
window.RarityColors = RarityColors;
