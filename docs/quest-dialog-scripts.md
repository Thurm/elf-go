---
name: 对话脚本与任务剧情设计
description: 新手村完整对话脚本、主线任务、支线任务设计
type: reference
---

# 宝可梦RPG - 对话脚本与任务剧情设计

## 目录
1. [对话格式规范](#对话格式规范)
2. [NPC列表](#npc列表)
3. [新手村完整对话脚本](#新手村完整对话脚本)
4. [主线任务设计](#主线任务设计)
5. [支线任务设计](#支线任务设计)

---

## 对话格式规范

### 对话脚本数据结构

```javascript
// 对话节点定义
const DialogNode = {
  id: "dialog_id",           // 对话唯一标识
  npcId: "npc_001",          // 所属NPC ID
  lines: [                   // 对话行数组
    {
      speaker: "NPC_NAME",   // 说话者
      text: "对话内容",      // 对话文本
      portrait: "happy"      // 表情端口 (optional)
    }
  ],
  choices: [                 // 选项数组 (optional)
    {
      text: "选项文本",
      nextDialog: "next_dialog_id",  // 跳转的对话ID
      condition: "flag_name",         // 显示条件 (optional)
      action: {                        // 触发动作 (optional)
        type: "give_item|give_monster|set_flag|start_quest|complete_quest",
        data: {}
      }
    }
  ],
  condition: "flag_name",    // 对话触发条件 (optional)
  onComplete: {               // 对话完成时的动作 (optional)
    type: "set_flag|give_item|start_quest",
    data: {}
  }
};

// 任务数据结构
const QuestData = {
  id: "quest_001",           // 任务ID
  title: "任务标题",
  description: "任务描述",
  type: "main|side",          // 主线/支线
  status: "not_started|in_progress|completed",
  objectives: [               // 任务目标
    {
      id: "obj_001",
      type: "talk|collect|defeat|deliver|visit",
      target: "npc_id|item_id|monster_id|map_id",
      count: 1,
      current: 0,
      description: "目标描述"
    }
  ],
  rewards: {                  // 任务奖励
    money: 100,
    items: [{ itemId: "potion", quantity: 3 }],
    exp: 500
  },
  prerequisites: ["quest_000"], // 前置任务
  dialogueStart: "quest_001_start",   // 开始对话
  dialogueComplete: "quest_001_complete" // 完成对话
};
```

---

## NPC列表

| NPC ID | 名称 | 位置 | 角色 |
|--------|------|------|------|
| `npc_mayor` | 村长 | 村长家 | 赠送初始怪兽、主线任务发布者 |
| `npc_shopkeeper` | 小明 | 宝可梦商店 | 商店老板、出售物品 |
| `npc_granny` | 王奶奶 | 村子中央 | 支线任务发布者 |
| `npc_boy` | 小刚 | 池塘边 | 村民、提供情报 |
| `npc_girl` | 小红 | 家门口 | 村民、支线任务发布者 |
| `npc_researcher` | 研究员 | 研究所 | 提供怪兽情报 |

---

## 新手村完整对话脚本

### 1. 村长对话

#### 对话树结构
```
mayor_greeting (初次见面)
  ├─ 选项1: "好的，我准备好了！" → mayor_give_starter
  └─ 选项2: "让我再考虑一下..." → mayor_encourage

mayor_give_starter (赠送初始怪兽)
  ├─ 选择火龙 → mayor_confirm_fire
  ├─ 选择水龙 → mayor_confirm_water
  └─ 选择草龙 → mayor_confirm_grass

mayor_post_starter (获得怪兽后)
  └─ 提示去1号道路战斗

mayor_quest_complete (任务完成汇报)
  └─ 给予奖励
```

#### 详细对话脚本

```javascript
// 初次见面 - 还没领取怪兽
{
  id: "mayor_greeting",
  npcId: "npc_mayor",
  condition: "!received_starter",
  lines: [
    { speaker: "村长", text: "欢迎来到和平村，年轻的训练师！", portrait: "smile" },
    { speaker: "村长", text: "我是这个村子的村长。看来你是第一次来到这里呢。", portrait: "normal" },
    { speaker: "村长", text: "在这个世界上，人类和怪兽共同生活，一起冒险、一起战斗！", portrait: "excited" },
    { speaker: "村长", text: "作为训练师，你的第一步就是拥有一只属于自己的怪兽。", portrait: "normal" },
    { speaker: "村长", text: "我这里有三只怪兽，你可以选择一只作为你的伙伴！", portrait: "happy" }
  ],
  choices: [
    { text: "好的，我准备好了！", nextDialog: "mayor_give_starter" },
    { text: "让我再考虑一下...", nextDialog: "mayor_encourage" }
  ]
}

// 鼓励对话
{
  id: "mayor_encourage",
  npcId: "npc_mayor",
  lines: [
    { speaker: "村长", text: "没关系，这是个重要的决定。", portrait: "normal" },
    { speaker: "村长", text: "你可以先在村子里逛逛，和村民们聊聊天。", portrait: "smile" },
    { speaker: "村长", text: "等你想好了，随时回来找我！", portrait: "happy" }
  ],
  choices: [
    { text: "谢谢村长！", nextDialog: "mayor_end" }
  ]
}

// 选择初始怪兽
{
  id: "mayor_give_starter",
  npcId: "npc_mayor",
  lines: [
    { speaker: "村长", text: "太好了！来看看这三只怪兽吧！", portrait: "excited" },
    { speaker: "村长", text: "它们各有特点，仔细选择哦！", portrait: "normal" }
  ],
  choices: [
    {
      text: "🔥 选择火龙 (火属性)",
      nextDialog: "mayor_confirm_fire",
      action: { type: "set_flag", data: { flag: "selected_fire" } }
    },
    {
      text: "💧 选择水龙 (水属性)",
      nextDialog: "mayor_confirm_water",
      action: { type: "set_flag", data: { flag: "selected_water" } }
    },
    {
      text: "🌿 选择草龙 (草属性)",
      nextDialog: "mayor_confirm_grass",
      action: { type: "set_flag", data: { flag: "selected_grass" } }
    }
  ]
}

// 确认选择火龙
{
  id: "mayor_confirm_fire",
  npcId: "npc_mayor",
  lines: [
    { speaker: "村长", text: "你选择了火龙！这是一只充满热情的怪兽！", portrait: "excited" },
    { speaker: "村长", text: "火龙性格活泼，攻击力很强，是个不错的选择！", portrait: "happy" },
    { speaker: "村长", text: "要给它起个名字吗？（默认：小火）", portrait: "normal" }
  ],
  choices: [
    { text: "就叫小火吧！", nextDialog: "mayor_receive_monster", action: { type: "give_monster", data: { monsterId: "fire_dragon", nickname: "小火", level: 5 } } },
    { text: "我想自己起名字...", nextDialog: "mayor_name_input_fire" }
  ]
}

// 确认选择水龙
{
  id: "mayor_confirm_water",
  npcId: "npc_mayor",
  lines: [
    { speaker: "村长", text: "你选择了水龙！这是一只冷静沉稳的怪兽！", portrait: "excited" },
    { speaker: "村长", text: "水龙防御力很高，而且非常聪明，很适合新手！", portrait: "happy" },
    { speaker: "村长", text: "要给它起个名字吗？（默认：小水）", portrait: "normal" }
  ],
  choices: [
    { text: "就叫小水吧！", nextDialog: "mayor_receive_monster", action: { type: "give_monster", data: { monsterId: "water_dragon", nickname: "小水", level: 5 } } },
    { text: "我想自己起名字...", nextDialog: "mayor_name_input_water" }
  ]
}

// 确认选择草龙
{
  id: "mayor_confirm_grass",
  npcId: "npc_mayor",
  lines: [
    { speaker: "村长", text: "你选择了草龙！这是一只温柔善良的怪兽！", portrait: "excited" },
    { speaker: "村长", text: "草龙恢复能力很强，能在战斗中持续作战！", portrait: "happy" },
    { speaker: "村长", text: "要给它起个名字吗？（默认：小草）", portrait: "normal" }
  ],
  choices: [
    { text: "就叫小草吧！", nextDialog: "mayor_receive_monster", action: { type: "give_monster", data: { monsterId: "grass_dragon", nickname: "小草", level: 5 } } },
    { text: "我想自己起名字...", nextDialog: "mayor_name_input_grass" }
  ]
}

// 获得怪兽后的对话
{
  id: "mayor_receive_monster",
  npcId: "npc_mayor",
  onComplete: { type: "set_flag", data: { flag: "received_starter" } },
  lines: [
    { speaker: "村长", text: "太棒了！从今天起，这只怪兽就是你的伙伴了！", portrait: "excited" },
    { speaker: "村长", text: "你们要互相信任，一起成长！", portrait: "happy" },
    { speaker: "村长", text: "对了，我还给你准备了一些旅行用品！", portrait: "normal" },
    { speaker: "村长", text: "这些药水和怪兽球你拿好，会用得上的！", portrait: "happy" }
  ],
  choices: [
    { text: "谢谢村长！", nextDialog: "mayor_post_starter", action: { type: "give_item", data: { items: [ { itemId: "potion", quantity: 5 }, { itemId: "poke_ball", quantity: 10 } ] } } }
  ]
}

// 获得怪兽后的提示
{
  id: "mayor_post_starter",
  npcId: "npc_mayor",
  condition: "received_starter && !quest1_completed",
  lines: [
    { speaker: "村长", text: "现在，让我给你第一个任务吧！", portrait: "normal" },
    { speaker: "村长", text: "从村子西边的出口出去，就是1号道路。", portrait: "normal" },
    { speaker: "村长", text: "在那里会遇到野生怪兽，去和它们战斗，积累经验吧！", portrait: "excited" },
    { speaker: "村长", text: "完成后记得回来向我报告！", portrait: "happy" }
  ],
  choices: [
    { text: "明白了！", nextDialog: "mayor_end", action: { type: "start_quest", data: { questId: "quest_main_02" } } }
  ]
}

// 任务完成汇报
{
  id: "mayor_quest_complete",
  npcId: "npc_mayor",
  condition: "quest_main_02_completed && !quest_main_04_completed",
  lines: [
    { speaker: "村长", text: "喔！你已经完成了初次战斗！", portrait: "surprised" },
    { speaker: "村长", text: "做得很好！看来你和你的怪兽配合得不错！", portrait: "happy" },
    { speaker: "村长", text: "这是给你的奖励！继续加油吧！", portrait: "excited" }
  ],
  choices: [
    { text: "谢谢村长！", nextDialog: "mayor_end", action: { type: "complete_quest", data: { questId: "quest_main_04" } } }
  ]
}

// 日常对话（所有任务完成后）
{
  id: "mayor_daily",
  npcId: "npc_mayor",
  condition: "received_starter && all_main_quests_completed",
  lines: [
    { speaker: "村长", text: "你好啊，年轻的训练师！冒险还顺利吗？", portrait: "smile" },
    { speaker: "村长", text: "这个世界很大，还有很多地方等着你去探索！", portrait: "normal" },
    { speaker: "村长", text: "要记得好好照顾你的怪兽伙伴哦！", portrait: "happy" }
  ],
  choices: [
    { text: "我会的！再见！", nextDialog: "mayor_end" }
  ]
}

// 对话结束
{
  id: "mayor_end",
  npcId: "npc_mayor",
  lines: [
    { speaker: "村长", text: "祝你冒险顺利！", portrait: "wave" }
  ],
  onComplete: { type: "close_dialog" }
}
```

---

### 2. 商店老板对话

```javascript
// 初次见面
{
  id: "shopkeeper_greeting",
  npcId: "npc_shopkeeper",
  condition: "!talked_to_shopkeeper",
  lines: [
    { speaker: "小明", text: "欢迎光临！我是这家商店的老板小明！", portrait: "smile" },
    { speaker: "小明", text: "这里有各种冒险必需品，药水、怪兽球，应有尽有！", portrait: "excited" },
    { speaker: "小明", text: "哦？你是新来的训练师吧？第一次来给你打个折！", portrait: "happy" }
  ],
  choices: [
    { text: "谢谢！我想买些东西", nextDialog: "shopkeeper_open_shop", action: { type: "set_flag", data: { flag: "talked_to_shopkeeper" } } },
    { text: "我先看看", nextDialog: "shopkeeper_browse", action: { type: "set_flag", data: { flag: "talked_to_shopkeeper" } } }
  ]
}

// 购买物品
{
  id: "shopkeeper_open_shop",
  npcId: "npc_shopkeeper",
  lines: [
    { speaker: "小明", text: "好嘞！看看你需要什么？", portrait: "smile" }
  ],
  choices: [
    { text: "购买药水 (50金币)", nextDialog: "shopkeeper_buy_potion", action: { type: "open_shop", data: { shopId: "pokemart_town01" } } },
    { text: "购买怪兽球 (100金币)", nextDialog: "shopkeeper_buy_ball" },
    { text: "购买高级药水 (200金币)", nextDialog: "shopkeeper_buy_super" },
    { text: "不了，谢谢", nextDialog: "shopkeeper_end" }
  ]
}

// 购买成功
{
  id: "shopkeeper_buy_success",
  npcId: "npc_shopkeeper",
  lines: [
    { speaker: "小明", text: "谢谢惠顾！欢迎下次再来！", portrait: "happy" }
  ],
  choices: [
    { text: "继续购物", nextDialog: "shopkeeper_open_shop" },
    { text: "离开", nextDialog: "shopkeeper_end" }
  ]
}

// 钱不够
{
  id: "shopkeeper_no_money",
  npcId: "npc_shopkeeper",
  lines: [
    { speaker: "小明", text: "哎呀，你的金币好像不够呢...", portrait: "worried" },
    { speaker: "小明", text: "去打败野生怪兽可以获得金币哦！", portrait: "smile" }
  ],
  choices: [
    { text: "我知道了", nextDialog: "shopkeeper_end" }
  ]
}

// 出售物品
{
  id: "shopkeeper_sell",
  npcId: "npc_shopkeeper",
  lines: [
    { speaker: "小明", text: "有什么想出售的吗？我这里可以收购哦！", portrait: "smile" }
  ],
  choices: [
    { text: "查看可出售物品", nextDialog: "shopkeeper_sell_list", action: { type: "open_sell" } },
    { text: "不了", nextDialog: "shopkeeper_open_shop" }
  ]
}

// 日常对话
{
  id: "shopkeeper_daily",
  npcId: "npc_shopkeeper",
  condition: "talked_to_shopkeeper",
  lines: [
    { speaker: "小明", text: "欢迎回来！今天想买点什么？", portrait: "smile" }
  ],
  choices: [
    { text: "我想买东西", nextDialog: "shopkeeper_open_shop" },
    { text: "我想卖东西", nextDialog: "shopkeeper_sell" },
    { text: "只是来打招呼", nextDialog: "shopkeeper_end" }
  ]
}

// 对话结束
{
  id: "shopkeeper_end",
  npcId: "npc_shopkeeper",
  lines: [
    { speaker: "小明", text: "慢走！有需要随时过来！", portrait: "wave" }
  ],
  onComplete: { type: "close_dialog", data: { flag: "quest_main_03_completed" } }
}
```

---

### 3. 王奶奶对话（支线任务）

```javascript
// 初次见面 - 发布收集素材任务
{
  id: "granny_greeting",
  npcId: "npc_granny",
  condition: "!quest_side_01_started && !quest_side_01_completed",
  lines: [
    { speaker: "王奶奶", text: "哎呀，年轻人，你能过来一下吗？", portrait: "normal" },
    { speaker: "王奶奶", text: "我年纪大了，腿脚不方便，有件事想请你帮忙...", portrait: "worried" },
    { speaker: "王奶奶", text: "我需要3个火焰鳞片来做药，但是我自己去不了1号道路...", portrait: "normal" },
    { speaker: "王奶奶", text: "你能帮我收集一下吗？火系怪兽身上会掉落的。", portrait: "hopeful" }
  ],
  choices: [
    { text: "好的，包在我身上！", nextDialog: "granny_accept", action: { type: "start_quest", data: { questId: "quest_side_01" } } },
    { text: "我现在有点忙...", nextDialog: "granny_refuse" }
  ]
}

// 接受任务
{
  id: "granny_accept",
  npcId: "npc_granny",
  lines: [
    { speaker: "王奶奶", text: "太好了！谢谢你，年轻人！", portrait: "happy" },
    { speaker: "王奶奶", text: "1号道路的火系怪兽身上会掉落火焰鳞片，收集3个就够了！", portrait: "normal" },
    { speaker: "王奶奶", text: "我会好好报答你的！", portrait: "smile" }
  ],
  choices: [
    { text: "放心吧！", nextDialog: "granny_end" }
  ]
}

// 拒绝任务
{
  id: "granny_refuse",
  npcId: "npc_granny",
  lines: [
    { speaker: "王奶奶", text: "没关系，你先去忙吧...", portrait: "sad" },
    { speaker: "王奶奶", text: "要是之后有空的话，能再来看看我吗？", portrait: "hopeful" }
  ],
  choices: [
    { text: "好的，之后再来", nextDialog: "granny_end" }
  ]
}

// 任务进行中
{
  id: "granny_in_progress",
  npcId: "npc_granny",
  condition: "quest_side_01_in_progress",
  lines: [
    { speaker: "王奶奶", text: "火焰鳞片收集得怎么样了？", portrait: "normal" },
    { speaker: "王奶奶", text: "不用着急，安全第一哦！", portrait: "smile" }
  ],
  choices: [
    { text: "我还在努力！", nextDialog: "granny_end" }
  ]
}

// 任务完成 - 交任务
{
  id: "granny_complete",
  npcId: "npc_granny",
  condition: "quest_side_01_ready_to_complete",
  lines: [
    { speaker: "王奶奶", text: "喔！你已经收集到3个火焰鳞片了！", portrait: "surprised" },
    { speaker: "王奶奶", text: "太好了！这样我的药就能做出来了！", portrait: "happy" },
    { speaker: "王奶奶", text: "谢谢你，年轻人！这是我的一点心意！", portrait: "excited" }
  ],
  choices: [
    { text: "不客气！", nextDialog: "granny_reward", action: { type: "complete_quest", data: { questId: "quest_side_01" } } }
  ]
}

// 给予奖励
{
  id: "granny_reward",
  npcId: "npc_granny",
  lines: [
    { speaker: "王奶奶", text: "这500金币你拿着，还有这瓶特制药水！", portrait: "happy" },
    { speaker: "王奶奶", text: "特制药水的效果比普通药水好很多哦！", portrait: "normal" },
    { speaker: "王奶奶", text: "以后要是有空，常来陪奶奶聊聊天啊！", portrait: "smile" }
  ],
  choices: [
    { text: "好的！谢谢奶奶！", nextDialog: "granny_end", action: { type: "give_item", data: { items: [ { itemId: "gold", quantity: 500 }, { itemId: "super_potion", quantity: 3 } ] } } }
  ]
}

// 任务完成后的日常对话
{
  id: "granny_daily",
  npcId: "npc_granny",
  condition: "quest_side_01_completed",
  lines: [
    { speaker: "王奶奶", text: "是你啊，年轻人！最近怎么样？", portrait: "smile" },
    { speaker: "王奶奶", text: "我做的药效果很好呢！多亏了你！", portrait: "happy" },
    { speaker: "王奶奶", text: "冒险要注意安全啊！", portrait: "worried" }
  ],
  choices: [
    { text: "谢谢奶奶！再见！", nextDialog: "granny_end" }
  ]
}

// 对话结束
{
  id: "granny_end",
  npcId: "npc_granny",
  lines: [
    { speaker: "王奶奶", text: "慢走啊！", portrait: "wave" }
  ],
  onComplete: { type: "close_dialog" }
}
```

---

### 4. 小刚对话（情报提供）

```javascript
// 初次见面
{
  id: "boy_greeting",
  npcId: "npc_boy",
  condition: "!talked_to_boy",
  lines: [
    { speaker: "小刚", text: "嘿！你是新来的训练师吗？", portrait: "excited" },
    { speaker: "小刚", text: "我叫小刚，以后也要成为厉害的训练师！", portrait: "happy" },
    { speaker: "小刚", text: "对了，我告诉你一些有用的情报吧！", portrait: "normal" }
  ],
  choices: [
    { text: "好啊，是什么？", nextDialog: "boy_tips" },
    { text: "不用了，谢谢", nextDialog: "boy_end", action: { type: "set_flag", data: { flag: "talked_to_boy" } } }
  ]
}

// 提供战斗 tips
{
  id: "boy_tips",
  npcId: "npc_boy",
  lines: [
    { speaker: "小刚", text: "听好了！怪兽的属性很重要哦！", portrait: "excited" },
    { speaker: "小刚", text: "火克草，草克水，水克火！这是基本中的基本！", portrait: "normal" },
    { speaker: "小刚", text: "用对属性的话，伤害会翻倍呢！", portrait: "happy" },
    { speaker: "小刚", text: "还有还有，打败野生怪兽能获得经验值和金币！", portrait: "excited" },
    { speaker: "小刚", text: "积累够经验值，怪兽就会升级变强！", portrait: "normal" }
  ],
  choices: [
    { text: "谢谢你！学到了！", nextDialog: "boy_end", action: { type: "set_flag", data: { flag: "talked_to_boy" } } }
  ]
}

// 日常对话
{
  id: "boy_daily",
  npcId: "npc_boy",
  condition: "talked_to_boy && !received_starter",
  lines: [
    { speaker: "小刚", text: "你还没去村长那里吗？", portrait: "normal" },
    { speaker: "小刚", text: "快去拿你的初始怪兽吧！", portrait: "excited" }
  ],
  choices: [
    { text: "我现在就去！", nextDialog: "boy_end" }
  ]
}

// 拿到怪兽后
{
  id: "boy_post_starter",
  npcId: "npc_boy",
  condition: "received_starter",
  lines: [
    { speaker: "小刚", text: "哇！你已经有怪兽了！好厉害！", portrait: "surprised" },
    { speaker: "小刚", text: "我也好想要一只属于自己的怪兽啊...", portrait: "envious" },
    { speaker: "小刚", text: "你要加油哦！我以后也要追上你！", portrait: "excited" }
  ],
  choices: [
    { text: "一起加油吧！", nextDialog: "boy_end" }
  ]
}

// 对话结束
{
  id: "boy_end",
  npcId: "npc_boy",
  lines: [
    { speaker: "小刚", text: "拜拜！", portrait: "wave" }
  ],
  onComplete: { type: "close_dialog" }
}
```

---

### 5. 小红对话（支线任务 - 送信）

```javascript
// 初次见面 - 发布送信任务
{
  id: "girl_greeting",
  npcId: "npc_girl",
  condition: "!quest_side_02_started && !quest_side_02_completed && received_starter",
  lines: [
    { speaker: "小红", text: "那个...请问...", portrait: "shy" },
    { speaker: "小红", text: "你是训练师吗？要出去冒险吗？", portrait: "normal" },
    { speaker: "小红", text: "我有一封信，想请你帮我送给研究所的研究员叔叔...", portrait: "shy" },
    { speaker: "小红", text: "可以吗？", portrait: "hopeful" }
  ],
  choices: [
    { text: "没问题，交给我！", nextDialog: "girl_accept", action: { type: "start_quest", data: { questId: "quest_side_02" } } },
    { text: "抱歉，我还有事...", nextDialog: "girl_refuse" }
  ]
}

// 接受任务
{
  id: "girl_accept",
  npcId: "npc_girl",
  lines: [
    { speaker: "小红", text: "太好了！谢谢你！", portrait: "happy" },
    { speaker: "小红", text: "这封信你拿好，一定要交给研究员叔叔哦！", portrait: "normal" },
    { speaker: "小红", text: "他在村子北边的研究所里！", portrait: "smile" }
  ],
  choices: [
    { text: "我知道了！", nextDialog: "girl_end", action: { type: "give_item", data: { items: [ { itemId: "letter_from_xiaohong", quantity: 1 } ] } } }
  ]
}

// 拒绝任务
{
  id: "girl_refuse",
  npcId: "npc_girl",
  lines: [
    { speaker: "小红", text: "这样啊...没关系...", portrait: "sad" },
    { speaker: "小红", text: "那...等你有空的时候再说吧...", portrait: "shy" }
  ],
  choices: [
    { text: "抱歉", nextDialog: "girl_end" }
  ]
}

// 任务进行中
{
  id: "girl_in_progress",
  npcId: "npc_girl",
  condition: "quest_side_02_in_progress && !delivered_letter",
  lines: [
    { speaker: "小红", text: "信送到了吗？", portrait: "hopeful" },
    { speaker: "小红", text: "不着急的，安全第一...", portrait: "shy" }
  ],
  choices: [
    { text: "我这就去送！", nextDialog: "girl_end" }
  ]
}

// 信已送到
{
  id: "girl_complete",
  npcId: "npc_girl",
  condition: "delivered_letter",
  lines: [
    { speaker: "小红", text: "哎！信送到了！太好了！", portrait: "happy" },
    { speaker: "小红", text: "谢谢你！这是我的谢礼！", portrait: "excited" },
    { speaker: "小红", text: "这是我爸爸给我的伤药，很好用的！", portrait: "normal" }
  ],
  choices: [
    { text: "谢谢！", nextDialog: "girl_reward", action: { type: "complete_quest", data: { questId: "quest_side_02" } } }
  ]
}

// 给予奖励
{
  id: "girl_reward",
  npcId: "npc_girl",
  lines: [
    { speaker: "小红", text: "300金币和2瓶全满药水！", portrait: "happy" },
    { speaker: "小红", text: "全满药水可以完全恢复一只怪兽的HP呢！", portrait: "normal" },
    { speaker: "小红", text: "以后...要是有机会，还能请你帮忙吗？", portrait: "shy" }
  ],
  choices: [
    { text: "当然可以！", nextDialog: "girl_end", action: { type: "give_item", data: { items: [ { itemId: "gold", quantity: 300 }, { itemId: "full_restore", quantity: 2 } ] } } }
  ]
}

// 日常对话
{
  id: "girl_daily",
  npcId: "npc_girl",
  condition: "quest_side_02_completed",
  lines: [
    { speaker: "小红", text: "你好！冒险还顺利吗？", portrait: "smile" },
    { speaker: "小红", text: "要是累了，就在村子里休息一下吧！", portrait: "normal" }
  ],
  choices: [
    { text: "谢谢你！再见！", nextDialog: "girl_end" }
  ]
}

// 对话结束
{
  id: "girl_end",
  npcId: "npc_girl",
  lines: [
    { speaker: "小红", text: "再见！", portrait: "wave" }
  ],
  onComplete: { type: "close_dialog" }
}
```

---

### 6. 研究员对话

```javascript
// 初次见面
{
  id: "researcher_greeting",
  npcId: "npc_researcher",
  condition: "!talked_to_researcher",
  lines: [
    { speaker: "研究员", text: "你好！我是这里的研究员！", portrait: "normal" },
    { speaker: "研究员", text: "我正在研究这个地区的怪兽生态！", portrait: "excited" },
    { speaker: "研究员", text: "有什么关于怪兽的问题都可以问我哦！", portrait: "smile" }
  ],
  choices: [
    { text: "我想了解怪兽属性", nextDialog: "researcher_explain_types" },
    { text: "我想了解经验值", nextDialog: "researcher_explain_exp" },
    { text: "没什么，只是看看", nextDialog: "researcher_end", action: { type: "set_flag", data: { flag: "talked_to_researcher" } } }
  ]
}

// 讲解属性相克
{
  id: "researcher_explain_types",
  npcId: "npc_researcher",
  lines: [
    { speaker: "研究员", text: "好问题！怪兽属性相克可是门大学问！", portrait: "excited" },
    { speaker: "研究员", text: "基本的五种属性：火、水、草、电、普通。", portrait: "normal" },
    { speaker: "研究员", text: "火克草，草克水，水克火，这是基本循环！", portrait: "normal" },
    { speaker: "研究员", text: "电克水，但对草效果减半！", portrait: "normal" },
    { speaker: "研究员", text: "普通属性没有相克关系，很稳定！", portrait: "smile" }
  ],
  choices: [
    { text: "原来如此！", nextDialog: "researcher_greeting" }
  ]
}

// 讲解经验值
{
  id: "researcher_explain_exp",
  npcId: "npc_researcher",
  lines: [
    { speaker: "研究员", text: "经验值是怪兽成长的关键！", portrait: "excited" },
    { speaker: "研究员", text: "每次战斗胜利，你的怪兽都能获得经验值！", portrait: "normal" },
    { speaker: "研究员", text: "经验值积累到一定程度，怪兽就会升级！", portrait: "normal" },
    { speaker: "研究员", text: "升级后，各项能力都会提升，还可能学会新技能！", portrait: "happy" }
  ],
  choices: [
    { text: "明白了！", nextDialog: "researcher_greeting" }
  ]
}

// 收到小红的信
{
  id: "researcher_receive_letter",
  npcId: "npc_researcher",
  condition: "quest_side_02_in_progress && has_letter",
  lines: [
    { speaker: "研究员", text: "嗯？那封信是...", portrait: "surprised" },
    { speaker: "研究员", text: "是小红写来的信吗？", portrait: "normal" },
    { speaker: "研究员", text: "谢谢你帮她送信！那个孩子总是这么害羞...", portrait: "smile" },
    { speaker: "研究员", text: "你快回去告诉她，信我收到了！", portrait: "normal" }
  ],
  choices: [
    { text: "好的！", nextDialog: "researcher_end", action: { type: "set_flag", data: { flag: "delivered_letter" } } }
  ]
}

// 日常对话
{
  id: "researcher_daily",
  npcId: "npc_researcher",
  condition: "talked_to_researcher",
  lines: [
    { speaker: "研究员", text: "你好！有什么新发现吗？", portrait: "smile" },
    { speaker: "研究员", text: "这个世界还有很多未知的怪兽等着我们去发现！", portrait: "excited" }
  ],
  choices: [
    { text: "我想了解怪兽属性", nextDialog: "researcher_explain_types" },
    { text: "我想了解经验值", nextDialog: "researcher_explain_exp" },
    { text: "再见", nextDialog: "researcher_end" }
  ]
}

// 对话结束
{
  id: "researcher_end",
  npcId: "npc_researcher",
  lines: [
    { speaker: "研究员", text: "祝你研究顺利！哦不，是冒险顺利！", portrait: "wave" }
  ],
  onComplete: { type: "close_dialog" }
}
```

---

## 主线任务设计

### 任务1：领取初始怪兽

```javascript
{
  id: "quest_main_01",
  title: "领取初始怪兽",
  description: "去村长家拜访村长，领取一只属于你的初始怪兽！",
  type: "main",
  status: "not_started",
  objectives: [
    {
      id: "obj_01",
      type: "talk",
      target: "npc_mayor",
      count: 1,
      current: 0,
      description: "与村长对话"
    },
    {
      id: "obj_02",
      type: "receive",
      target: "starter_monster",
      count: 1,
      current: 0,
      description: "选择并获得初始怪兽"
    }
  ],
  rewards: {
    money: 0,
    items: [
      { itemId: "potion", quantity: 5 },
      { itemId: "poke_ball", quantity: 10 }
    ],
    exp: 0
  },
  prerequisites: [],
  dialogueStart: "mayor_greeting",
  dialogueComplete: "mayor_receive_monster"
}
```

---

### 任务2：初次战斗

```javascript
{
  id: "quest_main_02",
  title: "初次战斗",
  description: "前往1号道路，与野生怪兽进行一场战斗！",
  type: "main",
  status: "not_started",
  objectives: [
    {
      id: "obj_01",
      type: "visit",
      target: "route_01",
      count: 1,
      current: 0,
      description: "到达1号道路"
    },
    {
      id: "obj_02",
      type: "defeat",
      target: "wild_monster",
      count: 1,
      current: 0,
      description: "击败一只野生怪兽"
    }
  ],
  rewards: {
    money: 200,
    items: [
      { itemId: "potion", quantity: 3 }
    ],
    exp: 100
  },
  prerequisites: ["quest_main_01"],
  dialogueStart: "mayor_post_starter",
  dialogueComplete: null
}
```

---

### 任务3：购买补给

```javascript
{
  id: "quest_main_03",
  title: "购买补给",
  description: "去宝可梦商店购买一瓶药水！",
  type: "main",
  status: "not_started",
  objectives: [
    {
      id: "obj_01",
      type: "talk",
      target: "npc_shopkeeper",
      count: 1,
      current: 0,
      description: "与商店老板对话"
    },
    {
      id: "obj_02",
      type: "buy",
      target: "potion",
      count: 1,
      current: 0,
      description: "购买一瓶药水"
    }
  ],
  rewards: {
    money: 100,
    items: [],
    exp: 50
  },
  prerequisites: ["quest_main_01"],
  dialogueStart: "shopkeeper_greeting",
  dialogueComplete: null
}
```

---

### 任务4：返回报告

```javascript
{
  id: "quest_main_04",
  title: "返回报告",
  description: "回到村长家，向村长报告你的冒险进展！",
  type: "main",
  status: "not_started",
  objectives: [
    {
      id: "obj_01",
      type: "talk",
      target: "npc_mayor",
      count: 1,
      current: 0,
      description: "与村长对话"
    }
  ],
  rewards: {
    money: 500,
    items: [
      { itemId: "super_potion", quantity: 3 },
      { itemId: "poke_ball", quantity: 10 }
    ],
    exp: 200
  },
  prerequisites: ["quest_main_02", "quest_main_03"],
  dialogueStart: "mayor_quest_complete",
  dialogueComplete: null
}
```

---

## 支线任务设计

### 支线1：收集素材

```javascript
{
  id: "quest_side_01",
  title: "收集火焰鳞片",
  description: "帮王奶奶收集3个火焰鳞片！",
  type: "side",
  status: "not_started",
  objectives: [
    {
      id: "obj_01",
      type: "talk",
      target: "npc_granny",
      count: 1,
      current: 0,
      description: "与王奶奶对话接取任务"
    },
    {
      id: "obj_02",
      type: "collect",
      target: "fire_scale",
      count: 3,
      current: 0,
      description: "收集3个火焰鳞片（击败火系怪兽掉落）"
    },
    {
      id: "obj_03",
      type: "talk",
      target: "npc_granny",
      count: 1,
      current: 0,
      description: "把火焰鳞片交给王奶奶"
    }
  ],
  rewards: {
    money: 500,
    items: [
      { itemId: "super_potion", quantity: 3 }
    ],
    exp: 150
  },
  prerequisites: ["quest_main_01"],
  dialogueStart: "granny_greeting",
  dialogueComplete: "granny_complete"
}
```

---

### 支线2：递送信件

```javascript
{
  id: "quest_side_02",
  title: "递送信件",
  description: "帮小红把信送给研究所的研究员！",
  type: "side",
  status: "not_started",
  objectives: [
    {
      id: "obj_01",
      type: "talk",
      target: "npc_girl",
      count: 1,
      current: 0,
      description: "与小红对话接取任务"
    },
    {
      id: "obj_02",
      type: "receive",
      target: "letter_from_xiaohong",
      count: 1,
      current: 0,
      description: "收到小红的信"
    },
    {
      id: "obj_03",
      type: "talk",
      target: "npc_researcher",
      count: 1,
      current: 0,
      description: "把信交给研究员"
    },
    {
      id: "obj_04",
      type: "talk",
      target: "npc_girl",
      count: 1,
      current: 0,
      description: "向小红报告"
    }
  ],
  rewards: {
    money: 300,
    items: [
      { itemId: "full_restore", quantity: 2 }
    ],
    exp: 100
  },
  prerequisites: ["quest_main_01"],
  dialogueStart: "girl_greeting",
  dialogueComplete: "girl_complete"
}
```

---

## 游戏进度标记 (Flags)

| Flag 名称 | 说明 |
|-----------|------|
| `received_starter` | 是否领取了初始怪兽 |
| `selected_fire` | 选择了火龙 |
| `selected_water` | 选择了水龙 |
| `selected_grass` | 选择了草龙 |
| `talked_to_shopkeeper` | 与商店老板对话过 |
| `talked_to_boy` | 与小刚对话过 |
| `talked_to_researcher` | 与研究员对话过 |
| `delivered_letter` | 已送达小红的信 |
| `quest_main_01_completed` | 任务1完成 |
| `quest_main_02_completed` | 任务2完成 |
| `quest_main_03_completed` | 任务3完成 |
| `quest_main_04_completed` | 任务4完成 |
| `quest_side_01_started` | 支线1已开始 |
| `quest_side_01_completed` | 支线1已完成 |
| `quest_side_02_started` | 支线2已开始 |
| `quest_side_02_completed` | 支线2已完成 |

---

**文档版本**: 1.0.0
**最后更新**: 2026-03-26
**作者**: Teammate C (对话系统开发)
