/**
 * 内联对话数据初始化
 *
 * 对应旧版 `index.html` / `index-js.html` 中的启动前数据注入逻辑。
 * 该文件必须在其他运行时脚本之前加载，以保证 Dialog 相关全局对象就绪。
 */

console.log('[BOOTSTRAP] 正在定义对话框变量（TypeScript）');

const inlineDialogNodes: Record<string, DialogNode> = {
    // ========== 新手村NPC对话 ==========
    'welcome': {
        id: 'welcome',
        npcId: 'npc_01',
        lines: [
            { speaker: '村民', text: '欢迎来到新手村！' },
            { speaker: '村民', text: '这里是你冒险的起点。' },
            { speaker: '村民', text: '先去拜访一下村长吧，他在北边的房子里。' }
        ]
    },
    'shop_greet': {
        id: 'shop_greet',
        npcId: 'npc_shop',
        lines: [
            { speaker: '店员', text: '欢迎光临！' },
            { speaker: '店员', text: '需要买点什么吗？' }
        ],
        onComplete: {
            type: 'open_shop',
            shopId: 'shop_village_01'
        }
    }
};

window.NPCDialogMap = {
    'npc_01': ['welcome'],
    'npc_shop': ['shop_greet'],
    'npc_mayor': ['mayor_give_starter']
};

window.QuestTemplates = window.QuestTemplates || {};
window.inlineDialogNodes = inlineDialogNodes;
window.DialogNodes = { ...(window.DialogNodes || {}), ...inlineDialogNodes };
window.DialogData = window.DialogNodes;

console.log('[BOOTSTRAP] 对话框变量定义完成');
