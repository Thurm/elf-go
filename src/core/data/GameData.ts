/**
 * 游戏状态数据结构定义
 */

const EQUIPMENT_SLOT_KEYS: EquipmentSlotValue[] = ['weapon', 'armor', 'accessory', 'helmet', 'boots'];
const BASE_STAT_KEYS: Array<keyof BaseStats> = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'spd'];

function createEmptyEquipmentRecord(): Record<EquipmentSlotValue, string | null> {
    return {
        weapon: null,
        armor: null,
        accessory: null,
        helmet: null,
        boots: null
    };
}

function calculateMonsterStats(baseStats: BaseStats, level: number): MonsterStats {
    const levelMultiplier = 1 + (level - 1) * 0.1;
    const stats = {
        hp: 0,
        atk: 0,
        def: 0,
        spAtk: 0,
        spDef: 0,
        spd: 0,
        maxHp: 0
    } satisfies MonsterStats;

    for (const key of BASE_STAT_KEYS) {
        stats[key] = Math.floor(baseStats[key] * levelMultiplier);
    }

    stats.maxHp = stats.hp;
    return stats;
}

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
} as const;

/**
 * 创建初始游戏状态
 * @returns {GameStateData} 初始游戏状态
 */
function createInitialGameState(): GameStateData {
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
 * @returns {PlayerData} 初始玩家数据
 */
function createInitialPlayer(): PlayerData {
    const starterMonster = createPlayerMonster('fire_dragon', '小火', 5);
    if (!starterMonster) {
        throw new Error('Failed to create initial starter monster: fire_dragon');
    }

    return {
        name: '玩家',
        party: [starterMonster],
        equipment: createEmptyEquipmentRecord(),
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
 * @returns {PlayerMonster|null} 玩家怪兽实例
 */
function createPlayerMonster(monsterId: string, nickname: string | undefined, level: number): PlayerMonster | null {
    const template = MonsterTemplates[monsterId];
    if (!template) {
        console.error(`Monster template not found: ${monsterId}`);
        return null;
    }

    const stats = calculateMonsterStats(template.baseStats, level);

    return {
        id: `monster_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
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
        equipment: createEmptyEquipmentRecord(),
        status: null
    };
}

/**
 * 计算升级所需经验
 * @param {number} level - 当前等级
 * @returns {number} 所需经验
 */
function calculateExpToNext(level: number): number {
    return Math.floor(50 * Math.pow(level, 1.5));
}

/**
 * 计算装备加成后的总属性
 * @param {BaseStats} baseStats - 基础属性
 * @param {Record<string, string|null>} equipment - 装备
 * @returns {BaseStats} 总属性
 */
function calculateTotalStats(baseStats: BaseStats, equipment: Record<EquipmentSlotValue, string | null>): BaseStats {
    const total = { ...baseStats };

    for (const slot of EQUIPMENT_SLOT_KEYS) {
        const itemId = equipment[slot];
        if (itemId) {
            const item = ItemTemplates[itemId];
            if (item && item.stats) {
                for (const stat of BASE_STAT_KEYS) {
                    const value = item.stats[stat];
                    if (typeof value === 'number') {
                        total[stat] += value;
                    }
                }
            }
        }
    }

    return total;
}
