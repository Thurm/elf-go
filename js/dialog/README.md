# 对话系统 (Dialog System)

宝可梦风格 RPG 游戏的对话与任务系统模块。

## 目录结构

```
js/dialog/
├── README.md           # 本文档
├── DialogData.js       # 对话数据与任务模板
├── DialogSystem.js     # 对话系统核心
├── QuestManager.js     # 任务管理器
└── ScriptParser.js     # 脚本解析器
```

## 模块说明

### 1. DialogData.js - 对话数据
包含所有 NPC 对话脚本、任务模板、对话节点映射。

**主要内容：**
- `DialogNodes`: 所有对话节点定义
- `NPCDialogMap`: NPC 到对话的映射
- `QuestTemplates`: 任务模板定义
- 工具函数：`getDialogForNPC()`, `createQuestInstance()`

### 2. DialogSystem.js - 对话系统核心
管理 NPC 对话、对话树遍历、选项处理。

**主要类：**
```javascript
class DialogSystem {
    init()                          // 初始化对话系统
    startDialog(npcId)             // 开始与 NPC 对话
    startDialogById(dialogId)      // 根据对话 ID 开始
    handleNext()                    // 下一行对话
    handleChoice(data)              // 处理选项选择
    endDialog()                     // 结束对话
}
```

**主要事件：**
- `DIALOG_START`: 对话开始
- `DIALOG_NEXT`: 下一行对话
- `DIALOG_CHOICE`: 选择选项
- `DIALOG_END`: 对话结束

### 3. QuestManager.js - 任务管理器
管理任务状态、进度追踪、奖励发放。

**主要类：**
```javascript
class QuestManager {
    init()                          // 初始化任务管理器
    startQuest(questId)            // 开始任务
    completeQuest(questId)         // 完成任务
    abandonQuest(questId)          // 放弃任务
    updateQuestProgress(type, target, amount)  // 更新任务进度
    getActiveQuests()              // 获取进行中的任务
}
```

**任务目标类型：**
- `talk`: 与 NPC 对话
- `defeat`: 击败怪兽
- `collect`: 收集物品
- `visit`: 访问地图
- `buy`: 购买物品
- `receive`: 接收物品/怪兽

### 4. ScriptParser.js - 脚本解析器
解析对话条件、执行对话动作、处理文本变量。

**主要类：**
```javascript
class ScriptParser {
    parseCondition(condition, gameState)   // 解析条件
    parseText(text, context)                // 解析文本变量
    executeAction(action, gameState)        // 执行动作
    setVariable(name, value)                // 设置变量
}
```

## 对话节点格式

```javascript
{
    id: 'dialog_id',
    npcId: 'npc_mayor',
    condition: (gameState) => !gameState.flags.received_starter,
    lines: [
        { speaker: '村长', text: '欢迎来到和平村！', portrait: 'smile' }
    ],
    choices: [
        {
            text: '好的！',
            nextDialog: 'next_dialog_id',
            action: { type: 'set_flag', data: { flag: 'talked_to_mayor' } }
        }
    ],
    onComplete: { type: 'close_dialog' }
}
```

## 任务格式

```javascript
{
    id: 'quest_main_01',
    title: '领取初始怪兽',
    description: '去村长家领取初始怪兽！',
    type: 'main',  // 'main' | 'side'
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
        items: [{ itemId: 'potion', quantity: 3 }],
        exp: 100
    },
    prerequisites: []
}
```

## NPC 列表

| NPC ID | 名称 | 位置 |
|--------|------|------|
| `npc_mayor` | 村长 | 村长家 |
| `npc_shopkeeper` | 小明 | 宝可梦商店 |
| `npc_granny` | 王奶奶 | 村子中央 |
| `npc_boy` | 小刚 | 池塘边 |
| `npc_girl` | 小红 | 家门口 |
| `npc_researcher` | 研究员 | 研究所 |

## 使用示例

### 开始对话
```javascript
// 与村长对话
dialogSystem.startDialog('npc_mayor');
```

### 处理对话前进
```javascript
// 点击继续
dialogSystem.handleNext();
```

### 选择选项
```javascript
// 选择第一个选项
dialogSystem.handleChoice({ choiceIndex: 0 });
```

### 任务操作
```javascript
// 开始任务
questManager.startQuest('quest_main_01');

// 更新任务进度（击败怪兽）
questManager.updateQuestProgress('defeat', 'fire_dragon', 1);

// 完成任务
questManager.completeQuest('quest_main_01');
```

## 文件状态
- ✅ DialogData.js - 已完成
- ✅ DialogSystem.js - 已完成
- ✅ QuestManager.js - 已完成
- ✅ ScriptParser.js - 已完成

**作者**: Teammate C (对话系统开发)
**最后更新**: 2026-03-26
