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
        inventoryCapacity: 50,
        equipmentStats: {},
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
