/**
 * 技能定义数据
 */

// 技能分类
const SkillCategory = {
    PHYSICAL: 'physical',
    SPECIAL: 'special',
    STATUS: 'status'
} as const;

// 目标类型
const SkillTarget = {
    SINGLE: 'single',
    ALL: 'all',
    SELF: 'self'
} as const;

// 状态效果
const StatusEffect = {
    BURN: 'burn',
    PARALYZE: 'paralyze',
    POISON: 'poison',
    FREEZE: 'freeze',
    SLEEP: 'sleep'
} as const;

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
    },
    hydro_pump: {
        id: 'hydro_pump',
        name: '水炮',
        type: ElementType.WATER,
        category: SkillCategory.SPECIAL,
        power: 110,
        accuracy: 80,
        pp: 5,
        maxPp: 5,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '发射强力的水柱'
    },
    withdraw: {
        id: 'withdraw',
        name: '缩壳',
        type: ElementType.NORMAL,
        category: SkillCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 40,
        maxPp: 40,
        target: SkillTarget.SELF,
        effect: {
            type: 'defense_up',
            value: 1
        },
        description: '缩进壳中提高防御'
    },
    solar_beam: {
        id: 'solar_beam',
        name: '阳光烈焰',
        type: ElementType.GRASS,
        category: SkillCategory.SPECIAL,
        power: 120,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '吸收阳光发射强力光束'
    },
    agility: {
        id: 'agility',
        name: '高速移动',
        type: ElementType.NORMAL,
        category: SkillCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        target: SkillTarget.SELF,
        effect: {
            type: 'speed_up',
            value: 2
        },
        description: '放松身体提高速度'
    },
    synthesis: {
        id: 'synthesis',
        name: '光合作用',
        type: ElementType.GRASS,
        category: SkillCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        target: SkillTarget.SELF,
        effect: {
            type: 'heal',
            percent: 0.5
        },
        description: '借助阳光恢复HP'
    },
    tackle: {
        id: 'tackle',
        name: '撞击',
        type: ElementType.NORMAL,
        category: SkillCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '用身体撞击敌人'
    },
    growl: {
        id: 'growl',
        name: '叫声',
        type: ElementType.NORMAL,
        category: SkillCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 40,
        maxPp: 40,
        target: SkillTarget.SINGLE,
        effect: {
            type: 'attack_down',
            value: 1
        },
        description: '发出可爱的叫声降低敌人攻击'
    },
    thunder_shock: {
        id: 'thunder_shock',
        name: '电击',
        type: ElementType.ELECTRIC,
        category: SkillCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.PARALYZE,
            chance: 10,
            duration: 3
        },
        description: '用电击攻击敌人'
    },
    quick_attack: {
        id: 'quick_attack',
        name: '电光一闪',
        type: ElementType.NORMAL,
        category: SkillCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        target: SkillTarget.SINGLE,
        priority: 1,
        effect: null,
        description: '以迅雷不及掩耳之势攻击'
    },
    recover: {
        id: 'recover',
        name: '自我再生',
        type: ElementType.NORMAL,
        category: SkillCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        target: SkillTarget.SELF,
        effect: {
            type: 'heal',
            percent: 0.5
        },
        description: '恢复自身一半的HP'
    },
    fire_punch: {
        id: 'fire_punch',
        name: '火焰拳',
        type: ElementType.FIRE,
        category: SkillCategory.PHYSICAL,
        power: 75,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.BURN,
            chance: 10,
            duration: 3
        },
        description: '用火焰拳头攻击'
    },
    ice_beam: {
        id: 'ice_beam',
        name: '冰冻光线',
        type: ElementType.WATER,
        category: SkillCategory.SPECIAL,
        power: 90,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.FREEZE,
            chance: 10,
            duration: 3
        },
        description: '用冰冻光线攻击敌人'
    },
    poison_sting: {
        id: 'poison_sting',
        name: '毒针',
        type: ElementType.GRASS,
        category: SkillCategory.PHYSICAL,
        power: 30,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.POISON,
            chance: 20,
            duration: 4
        },
        description: '用毒针攻击敌人'
    },
    sing: {
        id: 'sing',
        name: '唱歌',
        type: ElementType.NORMAL,
        category: SkillCategory.STATUS,
        power: 0,
        accuracy: 55,
        pp: 15,
        maxPp: 15,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.SLEEP,
            chance: 55,
            duration: 2
        },
        description: '用美妙的歌声让敌人入睡'
    },
    thunder_wave: {
        id: 'thunder_wave',
        name: '电磁波',
        type: ElementType.ELECTRIC,
        category: SkillCategory.STATUS,
        power: 0,
        accuracy: 90,
        pp: 20,
        maxPp: 20,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.PARALYZE,
            chance: 90,
            duration: 4
        },
        description: '用电磁波麻痹敌人'
    },
    volt_tackle: {
        id: 'volt_tackle',
        name: '伏特冲撞',
        type: ElementType.ELECTRIC,
        category: SkillCategory.PHYSICAL,
        power: 95,
        accuracy: 95,
        pp: 10,
        maxPp: 10,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.PARALYZE,
            chance: 20,
            duration: 2
        },
        description: '缠绕电流高速撞击敌人'
    },
    fire_spin: {
        id: 'fire_spin',
        name: '火焰旋涡',
        type: ElementType.FIRE,
        category: SkillCategory.SPECIAL,
        power: 55,
        accuracy: 90,
        pp: 15,
        maxPp: 15,
        target: SkillTarget.SINGLE,
        effect: {
            type: StatusEffect.BURN,
            chance: 20,
            duration: 2
        },
        description: '用旋转火焰持续灼烧敌人'
    },
    bubblebeam: {
        id: 'bubblebeam',
        name: '泡沫光线',
        type: ElementType.WATER,
        category: SkillCategory.SPECIAL,
        power: 65,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '喷出高压泡沫束冲击敌人'
    },
    rock_throw: {
        id: 'rock_throw',
        name: '落石',
        type: ElementType.NORMAL,
        category: SkillCategory.PHYSICAL,
        power: 60,
        accuracy: 95,
        pp: 20,
        maxPp: 20,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '投掷岩石砸向敌人'
    },
    earthquake: {
        id: 'earthquake',
        name: '地震',
        type: ElementType.NORMAL,
        category: SkillCategory.PHYSICAL,
        power: 100,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '猛烈震动地面造成巨大伤害'
    },
    scratch: {
        id: 'scratch',
        name: '抓击',
        type: ElementType.NORMAL,
        category: SkillCategory.PHYSICAL,
        power: 45,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '用利爪快速抓伤敌人'
    },
    night_shade: {
        id: 'night_shade',
        name: '暗影袭击',
        type: ElementType.NORMAL,
        category: SkillCategory.SPECIAL,
        power: 70,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        target: SkillTarget.SINGLE,
        effect: null,
        description: '以暗影之力侵袭敌人的心神'
    }
} satisfies Record<string, SkillTemplate>;

// 暴露常量到 window
window.SkillCategory = SkillCategory;
window.SkillTarget = SkillTarget;
window.StatusEffect = StatusEffect;
window.SkillTemplates = SkillTemplates;
