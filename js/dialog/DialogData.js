/**
 * 对话数据 - 包含所有NPC对话脚本和任务数据
 */

// ==========================================
// 对话节点数据定义
// ==========================================

/**
 * 对话节点集合
 * 格式: {dialogId}: {对话数据}
 */
var DialogNodes = {
    // ========== 新手村NPC对话 ==========

    // 欢迎NPC对话
    'welcome': {
        id: 'welcome',
        npcId: 'npc_01',
        lines: [
            { speaker: '村民', text: '欢迎来到新手村！' },
            { speaker: '村民', text: '这里是你冒险的起点。' },
            { speaker: '村民', text: '先去拜访一下村长吧，他在北边的房子里。' }
        ]
    },

    // 商店NPC对话
    'shop_greet': {
        id: 'shop_greet',
        npcId: 'npc_shop',
        lines: [
            { speaker: '店员', text: '欢迎光临！' },
            { speaker: '店员', text: '需要买点什么吗？' }
        ],
        onComplete: {
            action: 'open_shop',
            shopId: 'pokemart_town01'
        }
    },

    // ========== 村长对话 ==========

    // 初次见面 - 还没领取怪兽
    'mayor_greeting': {
        id: 'mayor_greeting',
        npcId: 'npc_mayor',
        condition: (gameState) => !gameState.flags.received_starter,
        lines: [
            { speaker: '村长', text: '欢迎来到和平村，年轻的训练师！', portrait: 'smile' },
            { speaker: '村长', text: '我是这个村子的村长。看来你是第一次来到这里呢。', portrait: 'normal' },
            { speaker: '村长', text: '在这个世界上，人类和怪兽共同生活，一起冒险、一起战斗！', portrait: 'excited' },
            { speaker: '村长', text: '作为训练师，你的第一步就是拥有一只属于自己的怪兽。', portrait: 'normal' },
            { speaker: '村长', text: '我这里有三只怪兽，你可以选择一只作为你的伙伴！', portrait: 'happy' }
        ],
        choices: [
            { text: '好的，我准备好了！', nextDialog: 'mayor_give_starter' },
            { text: '让我再考虑一下...', nextDialog: 'mayor_encourage' }
        ]
    },

    // 鼓励对话
    'mayor_encourage': {
        id: 'mayor_encourage',
        npcId: 'npc_mayor',
        lines: [
            { speaker: '村长', text: '没关系，这是个重要的决定。', portrait: 'normal' },
            { speaker: '村长', text: '你可以先在村子里逛逛，和村民们聊聊天。', portrait: 'smile' },
            { speaker: '村长', text: '等你想好了，随时回来找我！', portrait: 'happy' }
        ],
        choices: [
            { text: '谢谢村长！', nextDialog: 'mayor_end' }
        ]
    },

    // 选择初始怪兽
    'mayor_give_starter': {
        id: 'mayor_give_starter',
        npcId: 'npc_mayor',
        lines: [
            { speaker: '村长', text: '太好了！来看看这三只怪兽吧！', portrait: 'excited' },
            { speaker: '村长', text: '它们各有特点，仔细选择哦！', portrait: 'normal' }
        ],
        choices: [
            {
                text: '🔥 选择火龙 (火属性)',
                nextDialog: 'mayor_confirm_fire',
                action: { type: 'set_flag', data: { flag: 'selected_fire', value: true } }
            },
            {
                text: '💧 选择水龙 (水属性)',
                nextDialog: 'mayor_confirm_water',
                action: { type: 'set_flag', data: { flag: 'selected_water', value: true } }
            },
            {
                text: '🌿 选择草龙 (草属性)',
                nextDialog: 'mayor_confirm_grass',
                action: { type: 'set_flag', data: { flag: 'selected_grass', value: true } }
            }
        ]
    },

    // 确认选择火龙
    'mayor_confirm_fire': {
        id: 'mayor_confirm_fire',
        npcId: 'npc_mayor',
        lines: [
            { speaker: '村长', text: '你选择了火龙！这是一只充满热情的怪兽！', portrait: 'excited' },
            { speaker: '村长', text: '火龙性格活泼，攻击力很强，是个不错的选择！', portrait: 'happy' },
            { speaker: '村长', text: '要给它起个名字吗？（默认：小火）', portrait: 'normal' }
        ],
        choices: [
            {
                text: '就叫小火吧！',
                nextDialog: 'mayor_receive_monster',
                action: {
                    type: 'give_monster',
                    data: { monsterId: 'fire_dragon', nickname: '小火', level: 5 }
                }
            },
            { text: '我想自己起名字...', nextDialog: 'mayor_name_input' }
        ]
    },

    // 确认选择水龙
    'mayor_confirm_water': {
        id: 'mayor_confirm_water',
        npcId: 'npc_mayor',
        lines: [
            { speaker: '村长', text: '你选择了水龙！这是一只冷静沉稳的怪兽！', portrait: 'excited' },
            { speaker: '村长', text: '水龙防御力很高，而且非常聪明，很适合新手！', portrait: 'happy' },
            { speaker: '村长', text: '要给它起个名字吗？（默认：小水）', portrait: 'normal' }
        ],
        choices: [
            {
                text: '就叫小水吧！',
                nextDialog: 'mayor_receive_monster',
                action: {
                    type: 'give_monster',
                    data: { monsterId: 'water_dragon', nickname: '小水', level: 5 }
                }
            },
            { text: '我想自己起名字...', nextDialog: 'mayor_name_input' }
        ]
    },

    // 确认选择草龙
    'mayor_confirm_grass': {
        id: 'mayor_confirm_grass',
        npcId: 'npc_mayor',
        lines: [
            { speaker: '村长', text: '你选择了草龙！这是一只温柔善良的怪兽！', portrait: 'excited' },
            { speaker: '村长', text: '草龙恢复能力很强，能在战斗中持续作战！', portrait: 'happy' },
            { speaker: '村长', text: '要给它起个名字吗？（默认：小草）', portrait: 'normal' }
        ],
        choices: [
            {
                text: '就叫小草吧！',
                nextDialog: 'mayor_receive_monster',
                action: {
                    type: 'give_monster',
                    data: { monsterId: 'grass_dragon', nickname: '小草', level: 5 }
                }
            },
            { text: '我想自己起名字...', nextDialog: 'mayor_name_input' }
        ]
    },

    // 起名输入（占位，实际由UI处理）
    'mayor_name_input': {
        id: 'mayor_name_input',
        npcId: 'npc_mayor',
        lines: [
            { speaker: '村长', text: '好的，请输入你想给怪兽起的名字！', portrait: 'normal' }
        ],
        choices: [
            { text: '（使用默认名字）', nextDialog: 'mayor_receive_monster' }
        ]
    },

    // 获得怪兽后的对话
    'mayor_receive_monster': {
        id: 'mayor_receive_monster',
        npcId: 'npc_mayor',
        onComplete: { type: 'set_flag', data: { flag: 'received_starter', value: true } },
        lines: [
            { speaker: '村长', text: '太棒了！从今天起，这只怪兽就是你的伙伴了！', portrait: 'excited' },
            { speaker: '村长', text: '你们要互相信任，一起成长！', portrait: 'happy' },
            { speaker: '村长', text: '对了，我还给你准备了一些旅行用品！', portrait: 'normal' },
            { speaker: '村长', text: '这些药水和怪兽球你拿好，会用得上的！', portrait: 'happy' }
        ],
        choices: [
            {
                text: '谢谢村长！',
                nextDialog: 'mayor_post_starter',
                action: {
                    type: 'give_items',
                    data: {
                        items: [
                            { itemId: 'potion', quantity: 5 },
                            { itemId: 'pokeball', quantity: 10 }
                        ]
                    }
                }
            }
        ]
    },

    // 获得怪兽后的提示
    'mayor_post_starter': {
        id: 'mayor_post_starter',
        npcId: 'npc_mayor',
        condition: (gameState) => gameState.flags.received_starter && !gameState.flags.quest_main_02_completed,
        lines: [
            { speaker: '村长', text: '现在，让我给你第一个任务吧！', portrait: 'normal' },
            { speaker: '村长', text: '从村子西边的出口出去，就是1号道路。', portrait: 'normal' },
            { speaker: '村长', text: '在那里会遇到野生怪兽，去和它们战斗，积累经验吧！', portrait: 'excited' },
            { speaker: '村长', text: '完成后记得回来向我报告！', portrait: 'happy' }
        ],
        choices: [
            {
                text: '明白了！',
                nextDialog: 'mayor_end',
                action: { type: 'start_quest', data: { questId: 'quest_main_02' } }
        ]
    },

    // 任务完成汇报
    'mayor_quest_complete': {
        id: 'mayor_quest_complete',
        npcId: 'npc_mayor',
        condition: (gameState) => gameState.flags.quest_main_02_completed && gameState.flags.quest_main_03_completed && !gameState.flags.quest_main_04_completed,
        lines: [
            { speaker: '村长', text: '喔！你已经完成了初次战斗！', portrait: 'surprised' },
            { speaker: '村长', text: '做得很好！看来你和你的怪兽配合得不错！', portrait: 'happy' },
            { speaker: '村长', text: '这是给你的奖励！继续加油吧！', portrait: 'excited' }
        ],
        choices: [
            {
                text: '谢谢村长！',
                nextDialog: 'mayor_end',
                action: { type: 'complete_quest', data: { questId: 'quest_main_04' } }
        ]
    },

    // 日常对话（所有任务完成后）
    'mayor_daily': {
        id: 'mayor_daily',
        npcId: 'npc_mayor',
        condition: (gameState) => gameState.flags.received_starter && gameState.flags.quest_main_04_completed,
        lines: [
            { speaker: '村长', text: '你好啊，年轻的训练师！冒险还顺利吗？', portrait: 'smile' },
            { speaker: '村长', text: '这个世界很大，还有很多地方等着你去探索！', portrait: 'normal' },
            { speaker: '村长', text: '要记得好好照顾你的怪兽伙伴哦！', portrait: 'happy' }
        ],
        choices: [
            { text: '我会的！再见！', nextDialog: 'mayor_end' }
        ]
    },

    // 对话结束
    'mayor_end': {
        id: 'mayor_end',
        npcId: 'npc_mayor',
        lines: [
            { speaker: '村长', text: '祝你冒险顺利！', portrait: 'wave' }
        ],
        onComplete: { type: 'close_dialog' }
    },

    // ========== 商店老板对话 ==========

    // 初次见面
    'shopkeeper_greeting': {
        id: 'shopkeeper_greeting',
        npcId: 'npc_shopkeeper',
        condition: (gameState) => !gameState.flags.talked_to_shopkeeper,
        lines: [
            { speaker: '小明', text: '欢迎光临！我是这家商店的老板小明！', portrait: 'smile' },
            { speaker: '小明', text: '这里有各种冒险必需品，药水、怪兽球，应有尽有！', portrait: 'excited' },
            { speaker: '小明', text: '哦？你是新来的训练师吧？第一次来给你打个折！', portrait: 'happy' }
        ],
        choices: [
            {
                text: '谢谢！我想买些东西',
                nextDialog: 'shopkeeper_open_shop',
                action: { type: 'set_flag', data: { flag: 'talked_to_shopkeeper', value: true } }
            },
            {
                text: '我先看看',
                nextDialog: 'shopkeeper_browse',
                action: { type: 'set_flag', data: { flag: 'talked_to_shopkeeper', value: true } }
        ]
    },

    // 购买物品
    'shopkeeper_open_shop': {
        id: 'shopkeeper_open_shop',
        npcId: 'npc_shopkeeper',
        lines: [
            { speaker: '小明', text: '好嘞！看看你需要什么？', portrait: 'smile' }
        ],
        choices: [
            { text: '购买药水 (50金币)', nextDialog: 'shopkeeper_buy_potion', action: { type: 'open_shop', data: { shopId: 'pokemart_town01' } } },
            { text: '购买怪兽球 (100金币)', nextDialog: 'shopkeeper_buy_ball' },
            { text: '购买高级药水 (200金币)', nextDialog: 'shopkeeper_buy_super' },
            { text: '不了，谢谢', nextDialog: 'shopkeeper_end' }
        ]
    },

    // 购买成功
    'shopkeeper_buy_success': {
        id: 'shopkeeper_buy_success',
        npcId: 'npc_shopkeeper',
        lines: [
            { speaker: '小明', text: '谢谢惠顾！欢迎下次再来！', portrait: 'happy' }
        ],
        choices: [
            { text: '继续购物', nextDialog: 'shopkeeper_open_shop' },
            { text: '离开', nextDialog: 'shopkeeper_end' }
        ]
    },

    // 钱不够
    'shopkeeper_no_money': {
        id: 'shopkeeper_no_money',
        npcId: 'npc_shopkeeper',
        lines: [
            { speaker: '小明', text: '哎呀，你的金币好像不够呢...', portrait: 'worried' },
            { speaker: '小明', text: '去打败野生怪兽可以获得金币哦！', portrait: 'smile' }
        ],
        choices: [
            { text: '我知道了', nextDialog: 'shopkeeper_end' }
        ]
    },

    // 浏览
    'shopkeeper_browse': {
        id: 'shopkeeper_browse',
        npcId: 'npc_shopkeeper',
        lines: [
            { speaker: '小明', text: '好的，请慢慢看！', portrait: 'smile' }
        ],
        choices: [
            { text: '我想买东西', nextDialog: 'shopkeeper_open_shop' },
            { text: '再见', nextDialog: 'shopkeeper_end' }
        ]
    },

    // 日常对话
    'shopkeeper_daily': {
        id: 'shopkeeper_daily',
        npcId: 'npc_shopkeeper',
        condition: (gameState) => gameState.flags.talked_to_shopkeeper,
        lines: [
            { speaker: '小明', text: '欢迎回来！今天想买点什么？', portrait: 'smile' }
        ],
        choices: [
            { text: '我想买东西', nextDialog: 'shopkeeper_open_shop' },
            { text: '只是来打招呼', nextDialog: 'shopkeeper_end' }
        ]
    },

    // 对话结束
    'shopkeeper_end': {
        id: 'shopkeeper_end',
        npcId: 'npc_shopkeeper',
        lines: [
            { speaker: '小明', text: '慢走！有需要随时过来！', portrait: 'wave' }
        ],
        onComplete: { type: 'close_dialog', data: { flag: 'quest_main_03_completed' } }
    },

    // ========== 王奶奶对话（支线任务） ==========

    // 初次见面 - 发布收集素材任务
    'granny_greeting': {
        id: 'granny_greeting',
        npcId: 'npc_granny',
        condition: (gameState) => !gameState.flags.quest_side_01_started && !gameState.flags.quest_side_01_completed,
        lines: [
            { speaker: '王奶奶', text: '哎呀，年轻人，你能过来一下吗？', portrait: 'normal' },
            { speaker: '王奶奶', text: '我年纪大了，腿脚不方便，有件事想请你帮忙...', portrait: 'worried' },
            { speaker: '王奶奶', text: '我需要3个火焰鳞片来做药，但是我自己去不了1号道路...', portrait: 'normal' },
            { speaker: '王奶奶', text: '你能帮我收集一下吗？火系怪兽身上会掉落的。', portrait: 'hopeful' }
        ],
        choices: [
            {
                text: '好的，包在我身上！',
                nextDialog: 'granny_accept',
                action: { type: 'start_quest', data: { questId: 'quest_side_01' } }
            },
            { text: '我现在有点忙...', nextDialog: 'granny_refuse' }
        ]
    },

    // 接受任务
    'granny_accept': {
        id: 'granny_accept',
        npcId: 'npc_granny',
        lines: [
            { speaker: '王奶奶', text: '太好了！谢谢你，年轻人！', portrait: 'happy' },
            { speaker: '王奶奶', text: '1号道路的火系怪兽身上会掉落火焰鳞片，收集3个就够了！', portrait: 'normal' },
            { speaker: '王奶奶', text: '我会好好报答你的！', portrait: 'smile' }
        ],
        choices: [
            { text: '放心吧！', nextDialog: 'granny_end' }
        ]
    },

    // 拒绝任务
    'granny_refuse': {
        id: 'granny_refuse',
        npcId: 'npc_granny',
        lines: [
            { speaker: '王奶奶', text: '没关系，你先去忙吧...', portrait: 'sad' },
            { speaker: '王奶奶', text: '要是之后有空的话，能再来看看我吗？', portrait: 'hopeful' }
        ],
        choices: [
            { text: '好的，之后再来', nextDialog: 'granny_end' }
        ]
    },

    // 任务进行中
    'granny_in_progress': {
        id: 'granny_in_progress',
        npcId: 'npc_granny',
        condition: (gameState) => gameState.flags.quest_side_01_started && !gameState.flags.quest_side_01_completed,
        lines: [
            { speaker: '王奶奶', text: '火焰鳞片收集得怎么样了？', portrait: 'normal' },
            { speaker: '王奶奶', text: '不用着急，安全第一哦！', portrait: 'smile' }
        ],
        choices: [
            { text: '我还在努力！', nextDialog: 'granny_end' }
        ]
    },

    // 任务完成 - 交任务
    'granny_complete': {
        id: 'granny_complete',
        npcId: 'npc_granny',
        condition: (gameState) => {
            const quest = gameState.player.quests?.find(q => q.id === 'quest_side_01');
            return quest && quest.status === 'ready_to_complete';
        },
        lines: [
            { speaker: '王奶奶', text: '喔！你已经收集到3个火焰鳞片了！', portrait: 'surprised' },
            { speaker: '王奶奶', text: '太好了！这样我的药就能做出来了！', portrait: 'happy' },
            { speaker: '王奶奶', text: '谢谢你，年轻人！这是我的一点心意！', portrait: 'excited' }
        ],
        choices: [
            {
                text: '不客气！',
                nextDialog: 'granny_reward',
                action: { type: 'complete_quest', data: { questId: 'quest_side_01' } }
            }
        ]
    },

    // 给予奖励
    'granny_reward': {
        id: 'granny_reward',
        npcId: 'npc_granny',
        lines: [
            { speaker: '王奶奶', text: '这500金币你拿着，还有这瓶特制药水！', portrait: 'happy' },
            { speaker: '王奶奶', text: '特制药水的效果比普通药水好很多哦！', portrait: 'normal' },
            { speaker: '王奶奶', text: '以后要是有空，常来陪奶奶聊聊天啊！', portrait: 'smile' }
        ],
        choices: [
            {
                text: '好的！谢谢奶奶！',
                nextDialog: 'granny_end',
                action: {
                    type: 'give_items',
                    data: {
                        items: [
                            { itemId: 'gold', quantity: 500 },
                            { itemId: 'super_potion', quantity: 3 }
                        ]
                    }
                }
            }
        ]
    },

    // 任务完成后的日常对话
    'granny_daily': {
        id: 'granny_daily',
        npcId: 'npc_granny',
        condition: (gameState) => gameState.flags.quest_side_01_completed,
        lines: [
            { speaker: '王奶奶', text: '是你啊，年轻人！最近怎么样？', portrait: 'smile' },
            { speaker: '王奶奶', text: '我做的药效果很好呢！多亏了你！', portrait: 'happy' },
            { speaker: '王奶奶', text: '冒险要注意安全啊！', portrait: 'worried' }
        ],
        choices: [
            { text: '谢谢奶奶！再见！', nextDialog: 'granny_end' }
        ]
    },

    // 对话结束
    'granny_end': {
        id: 'granny_end',
        npcId: 'npc_granny',
        lines: [
            { speaker: '王奶奶', text: '慢走啊！', portrait: 'wave' }
        ],
        onComplete: { type: 'close_dialog' }
    },

    // ========== 小刚对话（情报提供） ==========

    // 初次见面
    'boy_greeting': {
        id: 'boy_greeting',
        npcId: 'npc_boy',
        condition: (gameState) => !gameState.flags.talked_to_boy,
        lines: [
            { speaker: '小刚', text: '嘿！你是新来的训练师吗？', portrait: 'excited' },
            { speaker: '小刚', text: '我叫小刚，以后也要成为厉害的训练师！', portrait: 'happy' },
            { speaker: '小刚', text: '对了，我告诉你一些有用的情报吧！', portrait: 'normal' }
        ],
        choices: [
            { text: '好啊，是什么？', nextDialog: 'boy_tips' },
            {
                text: '不用了，谢谢',
                nextDialog: 'boy_end',
                action: { type: 'set_flag', data: { flag: 'talked_to_boy', value: true } }
            }
        ]
    },

    // 提供战斗 tips
    'boy_tips': {
        id: 'boy_tips',
        npcId: 'npc_boy',
        lines: [
            { speaker: '小刚', text: '听好了！怪兽的属性很重要哦！', portrait: 'excited' },
            { speaker: '小刚', text: '火克草，草克水，水克火！这是基本中的基本！', portrait: 'normal' },
            { speaker: '小刚', text: '用对属性的话，伤害会翻倍呢！', portrait: 'happy' },
            { speaker: '小刚', text: '还有还有，打败野生怪兽能获得经验值和金币！', portrait: 'excited' },
            { speaker: '小刚', text: '积累够经验值，怪兽就会升级变强！', portrait: 'normal' }
        ],
        choices: [
            {
                text: '谢谢你！学到了！',
                nextDialog: 'boy_end',
                action: { type: 'set_flag', data: { flag: 'talked_to_boy', value: true } }
            }
        ]
    },

    // 日常对话
    'boy_daily': {
        id: 'boy_daily',
        npcId: 'npc_boy',
        condition: (gameState) => gameState.flags.talked_to_boy && !gameState.flags.received_starter,
        lines: [
            { speaker: '小刚', text: '你还没去村长那里吗？', portrait: 'normal' },
            { speaker: '小刚', text: '快去拿你的初始怪兽吧！', portrait: 'excited' }
        ],
        choices: [
            { text: '我现在就去！', nextDialog: 'boy_end' }
        ]
    },

    // 拿到怪兽后
    'boy_post_starter': {
        id: 'boy_post_starter',
        npcId: 'npc_boy',
        condition: (gameState) => gameState.flags.received_starter,
        lines: [
            { speaker: '小刚', text: '哇！你已经有怪兽了！好厉害！', portrait: 'surprised' },
            { speaker: '小刚', text: '我也好想要一只属于自己的怪兽啊...', portrait: 'envious' },
            { speaker: '小刚', text: '你要加油哦！我以后也要追上你！', portrait: 'excited' }
        ],
        choices: [
            { text: '一起加油吧！', nextDialog: 'boy_end' }
        ]
    },

    // 对话结束
    'boy_end': {
        id: 'boy_end',
        npcId: 'npc_boy',
        lines: [
            { speaker: '小刚', text: '拜拜！', portrait: 'wave' }
        ],
        onComplete: { type: 'close_dialog' }
    },

    // ========== 小红对话（支线任务 - 送信） ==========

    // 初次见面 - 发布送信任务
    'girl_greeting': {
        id: 'girl_greeting',
        npcId: 'npc_girl',
        condition: (gameState) => !gameState.flags.quest_side_02_started && !gameState.flags.quest_side_02_completed && gameState.flags.received_starter,
        lines: [
            { speaker: '小红', text: '那个...请问...', portrait: 'shy' },
            { speaker: '小红', text: '你是训练师吗？要出去冒险吗？', portrait: 'normal' },
            { speaker: '小红', text: '我有一封信，想请你帮我送给研究所的研究员叔叔...', portrait: 'shy' },
            { speaker: '小红', text: '可以吗？', portrait: 'hopeful' }
        ],
        choices: [
            {
                text: '没问题，交给我！',
                nextDialog: 'girl_accept',
                action: { type: 'start_quest', data: { questId: 'quest_side_02' } }
            },
            { text: '抱歉，我还有事...', nextDialog: 'girl_refuse' }
        ]
    },

    // 接受任务
    'girl_accept': {
        id: 'girl_accept',
        npcId: 'npc_girl',
        lines: [
            { speaker: '小红', text: '太好了！谢谢你！', portrait: 'happy' },
            { speaker: '小红', text: '这封信你拿好，一定要交给研究员叔叔哦！', portrait: 'normal' },
            { speaker: '小红', text: '他在村子北边的研究所里！', portrait: 'smile' }
        ],
        choices: [
            {
                text: '我知道了！',
                nextDialog: 'girl_end',
                action: { type: 'give_items', data: { items: [{ itemId: 'letter_from_xiaohong', quantity: 1 }] } }
            }
        ]
    },

    // 拒绝任务
    'girl_refuse': {
        id: 'girl_refuse',
        npcId: 'npc_girl',
        lines: [
            { speaker: '小红', text: '这样啊...没关系...', portrait: 'sad' },
            { speaker: '小红', text: '那...等你有空的时候再说吧...', portrait: 'shy' }
        ],
        choices: [
            { text: '抱歉', nextDialog: 'girl_end' }
        ]
    },

    // 任务进行中
    'girl_in_progress': {
        id: 'girl_in_progress',
        npcId: 'npc_girl',
        condition: (gameState) => gameState.flags.quest_side_02_started && !gameState.flags.delivered_letter,
        lines: [
            { speaker: '小红', text: '信送到了吗？', portrait: 'hopeful' },
            { speaker: '小红', text: '不着急的，安全第一...', portrait: 'shy' }
        ],
        choices: [
            { text: '我这就去送！', nextDialog: 'girl_end' }
        ]
    },

    // 信已送到
    'girl_complete': {
        id: 'girl_complete',
        npcId: 'npc_girl',
        condition: (gameState) => gameState.flags.delivered_letter,
        lines: [
            { speaker: '小红', text: '哎！信送到了！太好了！', portrait: 'happy' },
            { speaker: '小红', text: '谢谢你！这是我的谢礼！', portrait: 'excited' },
            { speaker: '小红', text: '这是我爸爸给我的伤药，很好用的！', portrait: 'normal' }
        ],
        choices: [
            {
                text: '谢谢！',
                nextDialog: 'girl_reward',
                action: { type: 'complete_quest', data: { questId: 'quest_side_02' } }
            }
        ]
    },

    // 给予奖励
    'girl_reward': {
        id: 'girl_reward',
        npcId: 'npc_girl',
        lines: [
            { speaker: '小红', text: '300金币和2瓶全满药水！', portrait: 'happy' },
            { speaker: '小红', text: '全满药水可以完全恢复一只怪兽的HP呢！', portrait: 'normal' },
            { speaker: '小红', text: '以后...要是有机会，还能请你帮忙吗？', portrait: 'shy' }
        ],
        choices: [
            {
                text: '当然可以！',
                nextDialog: 'girl_end',
                action: {
                    type: 'give_items',
                    data: {
                        items: [
                            { itemId: 'gold', quantity: 300 },
                            { itemId: 'full_restore', quantity: 2 }
                        ]
                    }
                }
            }
        ]
    },

    // 日常对话
    'girl_daily': {
        id: 'girl_daily',
        npcId: 'npc_girl',
        condition: (gameState) => gameState.flags.quest_side_02_completed,
        lines: [
            { speaker: '小红', text: '你好！冒险还顺利吗？', portrait: 'smile' },
            { speaker: '小红', text: '要是累了，就在村子里休息一下吧！', portrait: 'normal' }
        ],
        choices: [
            { text: '谢谢你！再见！', nextDialog: 'girl_end' }
        ]
    },

    // 对话结束
    'girl_end': {
        id: 'girl_end',
        npcId: 'npc_girl',
        lines: [
            { speaker: '小红', text: '再见！', portrait: 'wave' }
        ],
        onComplete: { type: 'close_dialog' }
    },

    // ========== 研究员对话 ==========

    // 初次见面
    'researcher_greeting': {
        id: 'researcher_greeting',
        npcId: 'npc_researcher',
        condition: (gameState) => !gameState.flags.talked_to_researcher,
        lines: [
            { speaker: '研究员', text: '你好！我是这里的研究员！', portrait: 'normal' },
            { speaker: '研究员', text: '我正在研究这个地区的怪兽生态！', portrait: 'excited' },
            { speaker: '研究员', text: '有什么关于怪兽的问题都可以问我哦！', portrait: 'smile' }
        ],
        choices: [
            { text: '我想了解怪兽属性', nextDialog: 'researcher_explain_types' },
            { text: '我想了解经验值', nextDialog: 'researcher_explain_exp' },
            {
                text: '没什么，只是看看',
                nextDialog: 'researcher_end',
                action: { type: 'set_flag', data: { flag: 'talked_to_researcher', value: true } }
            }
        ]
    },

    // 讲解属性相克
    'researcher_explain_types': {
        id: 'researcher_explain_types',
        npcId: 'npc_researcher',
        lines: [
            { speaker: '研究员', text: '好问题！怪兽属性相克可是门大学问！', portrait: 'excited' },
            { speaker: '研究员', text: '基本的五种属性：火、水、草、电、普通。', portrait: 'normal' },
            { speaker: '研究员', text: '火克草，草克水，水克火，这是基本循环！', portrait: 'normal' },
            { speaker: '研究员', text: '电克水，但对草效果减半！', portrait: 'normal' },
            { speaker: '研究员', text: '普通属性没有相克关系，很稳定！', portrait: 'smile' }
        ],
        choices: [
            { text: '原来如此！', nextDialog: 'researcher_greeting' }
        ]
    },

    // 讲解经验值
    'researcher_explain_exp': {
        id: 'researcher_explain_exp',
        npcId: 'npc_researcher',
        lines: [
            { speaker: '研究员', text: '经验值是怪兽成长的关键！', portrait: 'excited' },
            { speaker: '研究员', text: '每次战斗胜利，你的怪兽都能获得经验值！', portrait: 'normal' },
            { speaker: '研究员', text: '经验值积累到一定程度，怪兽就会升级！', portrait: 'normal' },
            { speaker: '研究员', text: '升级后，各项能力都会提升，还可能学会新技能！', portrait: 'happy' }
        ],
        choices: [
            { text: '明白了！', nextDialog: 'researcher_greeting' }
        ]
    },

    // 收到小红的信
    'researcher_receive_letter': {
        id: 'researcher_receive_letter',
        npcId: 'npc_researcher',
        condition: (gameState) => {
            const hasLetter = gameState.player.inventory?.some(item => item.itemId === 'letter_from_xiaohong' && item.quantity > 0);
            return gameState.flags.quest_side_02_started && hasLetter;
        },
        lines: [
            { speaker: '研究员', text: '嗯？那封信是...', portrait: 'surprised' },
            { speaker: '研究员', text: '是小红写来的信吗？', portrait: 'normal' },
            { speaker: '研究员', text: '谢谢你帮她送信！那个孩子总是这么害羞...', portrait: 'smile' },
            { speaker: '研究员', text: '你快回去告诉她，信我收到了！', portrait: 'normal' }
        ],
        choices: [
            {
                text: '好的！',
                nextDialog: 'researcher_end',
                action: {
                    type: 'set_flag',
                    data: { flag: 'delivered_letter', value: true }
                }
            }
        ]
    },

    // 日常对话
    'researcher_daily': {
        id: 'researcher_daily',
        npcId: 'npc_researcher',
        condition: (gameState) => gameState.flags.talked_to_researcher,
        lines: [
            { speaker: '研究员', text: '你好！有什么新发现吗？', portrait: 'smile' },
            { speaker: '研究员', text: '这个世界还有很多未知的怪兽等着我们去发现！', portrait: 'excited' }
        ],
        choices: [
            { text: '我想了解怪兽属性', nextDialog: 'researcher_explain_types' },
            { text: '我想了解经验值', nextDialog: 'researcher_explain_exp' },
            { text: '再见', nextDialog: 'researcher_end' }
        ]
    },

    // 对话结束
    'researcher_end': {
        id: 'researcher_end',
        npcId: 'npc_researcher',
        lines: [
            { speaker: '研究员', text: '祝你研究顺利！哦不，是冒险顺利！', portrait: 'wave' }
        ],
        onComplete: { type: 'close_dialog' }
    }
};

// ==========================================
// NPC 对话映射
// ==========================================

/**
 * NPC 默认对话映射
 * 根据 NPC ID 获取可用的对话列表
 */
var NPCDialogMap = {
    // 新手村NPC
    'npc_01': [
        'welcome'
    ],
    'npc_shop': [
        'shop_greet'
    ],

    'npc_mayor': [
        'mayor_quest_complete',
        'mayor_daily',
        'mayor_post_starter',
        'mayor_greeting'
    ],
    'npc_shopkeeper': [
        'shopkeeper_daily',
        'shopkeeper_greeting'
    ],
    'npc_granny': [
        'granny_complete',
        'granny_daily',
        'granny_in_progress',
        'granny_greeting'
    ],
    'npc_boy': [
        'boy_post_starter',
        'boy_daily',
        'boy_greeting'
    ],
    'npc_girl': [
        'girl_complete',
        'girl_daily',
        'girl_in_progress',
        'girl_greeting'
    ],
    'npc_researcher': [
        'researcher_receive_letter',
        'researcher_daily',
        'researcher_greeting'
    ]
};

// ==========================================
// 任务数据定义
// ==========================================

var QuestTemplates = {
    // ========== 主线任务 ==========

    'quest_main_01': {
        id: 'quest_main_01',
        title: '领取初始怪兽',
        description: '去村长家拜访村长，领取一只属于你的初始怪兽！',
        type: 'main',
        status: 'not_started',
        objectives: [
            {
                id: 'obj_01',
                type: 'talk',
                target: 'npc_mayor',
                count: 1,
                current: 0,
                description: '与村长对话'
            },
            {
                id: 'obj_02',
                type: 'receive',
                target: 'starter_monster',
                count: 1,
                current: 0,
                description: '选择并获得初始怪兽'
            }
        ],
        rewards: {
            money: 0,
            items: [
                { itemId: 'potion', quantity: 5 },
                { itemId: 'pokeball', quantity: 10 }
            ],
            exp: 0
        },
        prerequisites: [],
        dialogueStart: 'mayor_greeting',
        dialogueComplete: 'mayor_receive_monster'
    },

    'quest_main_02': {
        id: 'quest_main_02',
        title: '初次战斗',
        description: '前往1号道路，与野生怪兽进行一场战斗！',
        type: 'main',
        status: 'not_started',
        objectives: [
            {
                id: 'obj_01',
                type: 'visit',
                target: 'route_01',
                count: 1,
                current: 0,
                description: '到达1号道路'
            },
            {
                id: 'obj_02',
                type: 'defeat',
                target: 'wild_monster',
                count: 1,
                current: 0,
                description: '击败一只野生怪兽'
            }
        ],
        rewards: {
            money: 200,
            items: [
                { itemId: 'potion', quantity: 3 }
            ],
            exp: 100
        },
        prerequisites: ['quest_main_01'],
        dialogueStart: 'mayor_post_starter',
        dialogueComplete: null
    },

    'quest_main_03': {
        id: 'quest_main_03',
        title: '购买补给',
        description: '去宝可梦商店购买一瓶药水！',
        type: 'main',
        status: 'not_started',
        objectives: [
            {
                id: 'obj_01',
                type: 'talk',
                target: 'npc_shopkeeper',
                count: 1,
                current: 0,
                description: '与商店老板对话'
            },
            {
                id: 'obj_02',
                type: 'buy',
                target: 'potion',
                count: 1,
                current: 0,
                description: '购买一瓶药水'
            }
        ],
        rewards: {
            money: 100,
            items: [],
            exp: 50
        },
        prerequisites: ['quest_main_01'],
        dialogueStart: 'shopkeeper_greeting',
        dialogueComplete: null
    },

    'quest_main_04': {
        id: 'quest_main_04',
        title: '返回报告',
        description: '回到村长家，向村长报告你的冒险进展！',
        type: 'main',
        status: 'not_started',
        objectives: [
            {
                id: 'obj_01',
                type: 'talk',
                target: 'npc_mayor',
                count: 1,
                current: 0,
                description: '与村长对话'
            }
        ],
        rewards: {
            money: 500,
            items: [
                { itemId: 'super_potion', quantity: 3 },
                { itemId: 'pokeball', quantity: 10 }
            ],
            exp: 200
        },
        prerequisites: ['quest_main_02', 'quest_main_03'],
        dialogueStart: 'mayor_quest_complete',
        dialogueComplete: null
    },

    // ========== 支线任务 ==========

    'quest_side_01': {
        id: 'quest_side_01',
        title: '收集火焰鳞片',
        description: '帮王奶奶收集3个火焰鳞片！',
        type: 'side',
        status: 'not_started',
        objectives: [
            {
                id: 'obj_01',
                type: 'talk',
                target: 'npc_granny',
                count: 1,
                current: 0,
                description: '与王奶奶对话接取任务'
            },
            {
                id: 'obj_02',
                type: 'collect',
                target: 'fire_scale',
                count: 3,
                current: 0,
                description: '收集3个火焰鳞片（击败火系怪兽掉落）'
            },
            {
                id: 'obj_03',
                type: 'talk',
                target: 'npc_granny',
                count: 1,
                current: 0,
                description: '把火焰鳞片交给王奶奶'
            }
        ],
        rewards: {
            money: 500,
            items: [
                { itemId: 'super_potion', quantity: 3 }
            ],
            exp: 150
        },
        prerequisites: ['quest_main_01'],
        dialogueStart: 'granny_greeting',
        dialogueComplete: 'granny_complete'
    },

    'quest_side_02': {
        id: 'quest_side_02',
        title: '递送信件',
        description: '帮小红把信送给研究所的研究员！',
        type: 'side',
        status: 'not_started',
        objectives: [
            {
                id: 'obj_01',
                type: 'talk',
                target: 'npc_girl',
                count: 1,
                current: 0,
                description: '与小红对话接取任务'
            },
            {
                id: 'obj_02',
                type: 'receive',
                target: 'letter_from_xiaohong',
                count: 1,
                current: 0,
                description: '收到小红的信'
            },
            {
                id: 'obj_03',
                type: 'talk',
                target: 'npc_researcher',
                count: 1,
                current: 0,
                description: '把信交给研究员'
            },
            {
                id: 'obj_04',
                type: 'talk',
                target: 'npc_girl',
                count: 1,
                current: 0,
                description: '向小红报告'
            }
        ],
        rewards: {
            money: 300,
            items: [
                { itemId: 'full_restore', quantity: 2 }
            ],
            exp: 100
        },
        prerequisites: ['quest_main_01'],
        dialogueStart: 'girl_greeting',
        dialogueComplete: 'girl_complete'
    }
};

// ==========================================
// 工具函数
// ==========================================

/**
 * 根据NPC ID获取合适的对话节点
 * @param {string} npcId - NPC ID
 * @param {Object} gameState - 当前游戏状态
 * @returns {string|null} 对话节点ID
 */
function getDialogForNPC(npcId, gameState) {
    const dialogList = NPCDialogMap[npcId];
    if (!dialogList) {
        console.warn(`No dialogs found for NPC: ${npcId}`);
        return null;
    }

    for (const dialogId of dialogList) {
        const dialog = DialogNodes[dialogId];
        if (!dialog) {
            if (!dialog.condition) {
                return dialogId;
            }
            if (typeof dialog.condition === 'function') {
                if (dialog.condition(gameState)) {
                    return dialogId;
                }
            } else if (!gameState.flags[dialog.condition] === false) {
                return dialogId;
            }
        }
    }

    return dialogList[dialogList.length - 1];
}

/**
 * 创建任务实例
 * @param {string} questId - 任务模板ID
 * @returns {Object} 任务实例
 */
function createQuestInstance(questId) {
    const template = QuestTemplates[questId];
    if (!template) {
        console.error(`Quest template not found: ${questId}`);
        return null;
    }

    return {
        ...template,
        objectives: template.objectives.map(obj => ({ ...obj })),
        status: 'in_progress',
        startedAt: Date.now()
    };
}

// 兼容性别名 - 用于测试
var DialogData = DialogNodes;

// 立即暴露到 window 对象（同步执行，确保 DialogSystem 能立即访问）
console.log('[DialogData] Preparing to expose variables to window');
if (typeof window !== 'undefined') {
    console.log('[DialogData] Exposing variables, DialogNodes is:', DialogNodes);
    console.log('[DialogData] Exposing variables, NPCDialogMap is:', NPCDialogMap);
    console.log('[DialogData] Exposing variables, QuestTemplates is:', QuestTemplates);
    window.DialogNodes = DialogNodes;
    window.NPCDialogMap = NPCDialogMap;
    window.QuestTemplates = QuestTemplates;
    window.DialogData = DialogData;
    console.log('[DialogData] Variables exposed to window');
    console.log('[DialogData] window.DialogNodes now:', window.DialogNodes);
}
