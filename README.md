# Pokemon RPG Game

A Pokemon-style turn-based web RPG game developed with pure HTML5 Canvas and vanilla JavaScript.

This project was completed by the Claude Code Agent Team.

---

## 🎮 Project Overview

This is a fully functional Pokemon-style web RPG game where players can explore a pixel-style world, interact with NPCs, collect monsters, and engage in turn-based battles.

[中文版本 (Chinese Version)](./README-CN.md)

### Key Features

- 🗺️ **World Map Exploration** - Freely roam multiple map scenes
- ⚔️ **Turn-based Battles** - Classic elemental type effectiveness battle system
- 🐾 **Monster Collection** - Capture and train various monsters
- 📜 **Quest System** - Complete story quests through NPC interactions
- 🏪 **Shop System** - Buy and sell items
- 💾 **Save System** - Multiple save slots for game progress
- 🎵 **Sound & Music** - Procedural audio generation via Web Audio API

---

## 🚀 Quick Start

### Running the Project

**Method 1: Direct Open**
```bash
# Simply open index.html in your browser
open index.html
```

**Method 2: Local Server**
```bash
# Using Python
python3 -m http.server 8080

# Or using Node.js
npx serve .

# Then visit: http://localhost:8080
```

### Game Controls

| Action | Keys |
|--------|------|
| Move | `WASD` or Arrow Keys |
| Interact/Confirm | `Space` or `Enter` |
| Open Menu | `ESC` |
| Select Option | Number keys `1-9` |

---

## 🎯 Gameplay

### Game Flow

1. **Start** - Begin a new game or load a save from the title screen
2. **Pallet Town** - Talk to the village chief to receive your starter monster
3. **Explore** - Move freely on the map, interact with NPCs
4. **Wild Encounters** - Random encounters with wild monsters in grassy areas
5. **Collect & Train** - Capture new monsters, level them up
6. **Complete Quests** - Advance the story, unlock new areas

### Element Type Chart

| Attack | Super Effective | Not Very Effective |
|--------|-----------------|--------------------|
| 🔥 Fire | 🌿 Grass | 💧 Water |
| 💧 Water | 🔥 Fire | ⚡ Electric |
| 🌿 Grass | 💧 Water | 🔥 Fire |
| ⚡ Electric | 💧 Water | 🌿 Grass |
| ⭐ Normal | - | - |

---

## 📁 Project Structure

```
cc_learning/
├── index.html              # Main entry point
├── css/
│   └── style.css           # Game styles
├── js/
│   ├── main.js             # Game main class
│   ├── core/               # Core modules
│   │   ├── EventBus.js     # Event bus
│   │   ├── GameStateMachine.js  # State machine
│   │   ├── SaveManager.js  # Save manager
│   │   └── data/           # Game data
│   ├── battle/             # Battle system
│   ├── dialog/             # Dialog system
│   ├── map/                # Map system
│   ├── shop/               # Shop system
│   └── ui/                 # UI & Audio
├── docs/                   # Documentation
└── assets/                 # Static assets
```

### Core Modules

| Module | Function |
|--------|----------|
| **EventBus** | Publish-subscribe pattern for decoupled module communication |
| **GameStateMachine** | Manages game state transitions (title/map/battle/dialog/menu) |
| **MapSystem** | Four-layer map rendering, collision detection, camera follow |
| **BattleSystem** | Turn-based combat, elemental effectiveness, damage calculation |
| **DialogSystem** | Dialog trees, quest management, script parsing |
| **ShopSystem** | Merchandise trading, inventory management |
| **AudioManager** | Sound effect generation and playback via Web Audio API |

---

## 🛠️ Tech Stack

- **Core**: HTML5 Canvas + Vanilla JavaScript (ES6+)
- **Architecture**: Event-driven + State Machine + Modular Design
- **Storage**: localStorage
- **Audio Engine**: Web Audio API (Procedural Generation)
- **External Dependencies**: Google Fonts (Optional)

### Design Patterns

- **Publish-Subscribe**: EventBus for module communication
- **State Machine**: Manages game state transitions
- **Singleton**: Global unique instances for each manager
- **Data-Driven**: Monsters/skills/items defined by data

---

## 📖 Documentation

Detailed development documentation can be found in the `docs/` directory:

- [Team Configuration](docs/team-configuration.md)
- [Map Layout Design](docs/map-layout-design.md)
- [Quest Dialog Scripts](docs/quest-dialog-scripts.md)

For detailed module descriptions, please refer to the README.md in each corresponding directory.

---

## ✅ Module Development Progress

| Module | Status | Owner |
|--------|--------|-------|
| Core Architecture (EventBus/StateMachine) | ✅ Done | Teammate A |
| Data Definitions | ✅ Done | Teammate A |
| Battle System (Battle/Damage/Skill) | ✅ Done | Teammate B |
| Dialog System (Dialog/Quest) | ✅ Done | Teammate C |
| Map System (Map/Player/Scene) | ✅ Done | Teammate D |
| UI/Audio (UI/Battle/Menu/Audio) | ✅ Done | Teammate E |
| Shop System (Shop/Inventory) | ✅ Done | Teammate G |

---

### Map System Features (Teammate D)

Implemented Features:
- Four-layer map rendering (ground, middle, character, top)
- Camera follows player
- Player controller (WASD/arrow key movement)
- Collision detection system
- Grass encounter detection
- Map state machine
- Scene manager
- Map data definitions (3 maps)

Map List:
- Pallet Town (32x32, no encounters)
- Route 1 (32x32, with encounters)
- Chief's House (10x8, indoor map)

---

### Dialog System Features (Teammate C)

Implemented Features:
- NPC dialog system (6 NPCs with complete dialog)
- Dialog tree traversal and option handling
- Quest management system
- Quest progress tracking
- Dialog script parser
- Action execution (give items/monsters, set flags, etc.)

NPC List:
- Village Chief (gives starter monster)
- Xiao Ming (shop owner)
- Grandma Wang (side quest)
- Xiao Gang (information provider)
- Xiao Hong (side quest)
- Researcher (monster intelligence)

---

### Battle System Features (Teammate B)

Implemented Features:
- Turn-based battle system core
- Damage calculator (elemental effectiveness, randomness)
- Skill executor
- Battle state machine

---

### UI & Audio Features (Teammate E)

Implemented Features:
- UI manager
- Battle interface
- Menu interface
- Sound effect manager

---

### Shop System Features (Teammate G)

Implemented Features:
- Shop system core
- Inventory manager
- Shop interface
- Item data definitions (consumables, equipment, key items)

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project uses the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Pokemon series for inspiration
- Retro pixel art style references
- All contributors for their hard work

---

**Enjoy the game!** 🎉
