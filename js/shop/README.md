# 商店系统

宝可梦风格 RPG 游戏的商店与背包系统。

## 文件结构

```
js/shop/
├── ShopSystem.js      # 商店系统核心类
├── InventoryManager.js # 背包管理器
├── ShopUI.js          # 商店界面
└── README.md          # 本文档
```

## 功能说明

### ShopSystem.js - 商店系统核心

负责商店交易逻辑、商品列表管理、购买/出售处理。

**主要功能：**
- 打开/关闭商店
- 商品购买（支持多数量、库存检查、金币检查）
- 物品出售
- 商店开启条件检查（任务、道具、时间）
- 营业时间检查

**使用示例：**
```javascript
// 打开商店
eventBus.emit(GameEvents.SHOP_OPEN, { shopId: 'shop_village_01' });

// 购买物品
eventBus.emit(GameEvents.SHOP_BUY, { itemId: 'potion', quantity: 5 });

// 出售物品
eventBus.emit(GameEvents.SHOP_SELL, { inventoryUid: 'inv_xxx', quantity: 1 });

// 关闭商店
eventBus.emit(GameEvents.SHOP_CLOSE);
```

### InventoryManager.js - 背包管理器

负责背包物品管理、物品使用、装备系统、物品分类/排序。

**主要功能：**
- 物品添加/移除（支持堆叠）
- 装备/卸下装备
- 物品使用（消耗品、装备、关键道具）
- 物品排序（名称、价格、稀有度、类型、获取顺序）
- 物品过滤（全部、消耗品、装备、关键道具）
- 背包扩容

**使用示例：**
```javascript
// 添加物品
inventoryManager.addItem('potion', 10);

// 检查是否有某物品
if (inventoryManager.hasItem('potion', 5)) { ... }

// 装备物品
inventoryManager.equipItem('inv_xxx');

// 使用物品
inventoryManager.useItem('inv_xxx', target);

// 获取物品列表
const items = inventoryManager.getItems({ filter: 'equipment' });
```

### ShopUI.js - 商店界面

负责商店界面渲染、商品列表显示、购买确认对话框。

**主要功能：**
- 购买/出售标签页切换
- 商品列表展示（稀有度颜色、库存显示）
- 物品详情面板
- 数量选择器
- 购买/出售确认对话框

## 商店定义

在 `js/core/data/ItemData.js` 中定义了 5 个商店：

| 商店ID | 名称 | 位置 | 特点 |
|--------|------|------|------|
| `shop_village_01` | 初心商店 | 新手村 | 前期基础物品 |
| `shop_city_01` | 绿叶市商店 | 绿叶市 | 中期综合商店 |
| `shop_metropolis_01` | 黄金城百货 | 黄金城 | 后期高级物品 |
| `shop_special_01` | 海滨珍宝店 | 海滨镇 | 特殊商品 |
| `shop_secret_01` | 黑市 | 黄金城地下 | 传说物品 |

## 物品类型

### 消耗品
- 药水类：低级/中级/高级/全满药水
- 状态恢复：解毒药、清醒药、解冻药、全状态恢复药
- 复活类：复活药、全复活药
- PP恢复：PP恢复药、全PP恢复药、技能药剂、万能药剂
- 捕捉球：普通/高级/超级/大师/豪华/计时球

### 装备品
- 武器：木剑、铁剑、钢剑、火焰之剑、龙之刃等
- 防具：布甲、皮甲、铁甲、钢甲、龙鳞甲等
- 头盔：布帽、铁头盔、钢头盔、智慧之冠
- 靴子：布鞋、皮靴、钢靴、疾风靴
- 饰品：力量/守护/智慧/迅捷戒指、生命/幸运/经验护符、灵魂宝珠、龙之心脏

### 关键道具
- 城镇地图、自行车、钓竿
- 秘传机：居合斩、闪光、冲浪
- 道馆徽章
- 秘密钥匙

## 稀有度

| 稀有度 | 颜色 | 系数 |
|--------|------|------|
| 普通 | #FFFFFF | 1.0x |
| 稀有 | #00BFFF | 2.0x |
| 史诗 | #A855F7 | 4.0x |
| 传说 | #FFD700 | 8.0x |

## 背包容量

- 基础容量：50 格
- 第一次扩容（50→70）：5000 金币
- 第二次扩容（70→100）：15000 金币
- 最大容量：100 格

## 事件

### 商店事件
- `shop:opened` - 商店打开
- `shop:closed` - 商店关闭
- `shop:item_bought` - 物品购买
- `shop:item_sold` - 物品出售

### 背包事件
- `inventory:changed` - 背包变化
- `inventory:equip_changed` - 装备变化
- `inventory:sort_changed` - 排序方式变化
- `inventory:filter_changed` - 过滤方式变化
- `inventory:capacity_changed` - 容量变化

## 依赖

- `EventBus` - 事件总线
- `GameStateMachine` - 游戏状态机
- `ItemData` - 物品数据
- `GameData` - 游戏状态数据
