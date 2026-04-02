# Sprite Adventure

A Pokemon-style turn-based web RPG game developed with pure HTML5 Canvas and TypeScript.

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

### Prerequisites

- Node.js (for TypeScript compilation)
- Python 3 or any HTTP server

### Installation

```bash
# Install dependencies
npm install
```

### Build

```bash
# Compile TypeScript to JavaScript
npm run build

# Type check only (no emit)
npm run typecheck
```

### Running the Project

**Method 1: Direct Open**
```bash
# Simply open index.html in your browser (requires pre-built dist/)
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
elf-go/
├── index.html              # Main entry point (uses dist/)
├── index-dist.html        # Distribution-ready HTML
├── index-js.html          # Legacy JS version
├── css/
│   └── style.css          # Game styles
├── src/                   # TypeScript source code
│   ├── main.ts            # Game entry point & main loop
│   ├── types/             # Global TypeScript definitions
│   ├── core/              # Core infrastructure
│   │   ├── EventBus.ts    # Event publish-subscribe
│   │   ├── GameStateMachine.ts  # State management
│   │   ├── SaveManager.ts # Save/load system
│   │   └── data/          # Game data definitions
│   │       ├── GameData.ts
│   │       ├── MonsterData.ts
│   │       ├── SkillData.ts
│   │       ├── ItemData.ts
│   │       └── MapData.ts
│   ├── battle/            # Battle system
│   │   ├── BattleSystem.ts
│   │   ├── DamageCalculator.ts
│   │   └── SkillExecutor.ts
│   ├── dialog/            # Dialog & quest system
│   │   ├── DialogSystem.ts
│   │   ├── DialogData.ts
│   │   ├── QuestManager.ts
│   │   └── ScriptParser.ts
│   ├── map/               # Map system
│   │   ├── index.ts
│   │   ├── MapRenderer.ts
│   │   ├── MapStateMachine.ts
│   │   ├── PlayerController.ts
│   │   └── SceneManager.ts
│   ├── shop/              # Shop & inventory
│   │   ├── ShopSystem.ts
│   │   ├── InventoryManager.ts
│   │   └── ShopUI.ts
│   └── ui/                # UI & Audio
│       ├── UIManager.ts
│       ├── BattleUI.ts
│       ├── MenuUI.ts
│       └── AudioManager.ts
├── dist/                  # Compiled JavaScript output
├── bak/                   # Backup of original JS code
├── docs/                  # Documentation
├── package.json           # NPM config
├── tsconfig.json          # TypeScript config (dev)
└── tsconfig.build.json    # TypeScript config (build)
```

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTML5 Canvas                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Game Main Loop                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              GameStateMachine (State Core)               │  │
│  │  ┌───────┐  ┌─────┐  ┌────────┐  ┌────────┐  ┌─────┐ │ │
│  │  │ TITLE │→│ MAP │→│ BATTLE │→│ DIALOG │→│ MENU│ │ │
│  │  └───────┘  └─────┘  └────────┘  └────────┘  └─────┘ │ │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    EventBus (Communicator)                │  │
│  │         Publish / Subscribe for all modules               │  │
│  └─────────────────────────────────────────────────────────┘  │
│        │              │              │             │           │
│  ┌─────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌───▼────┐    │
│  │ MapSystem│  │BattleSys│  │DialogSys│  │ShopSys │    │
│  └──────────┘  └─────────┘  └─────────┘  └────────┘    │
│        │              │              │             │           │
│  ┌─────▼──────────────────────────────────────────────────┐  │
│  │              UI Layer (UIManager)                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │BattleUI  │  │  MenuUI  │  │  Dialog  │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              AudioManager (Web Audio API)                │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Modules

| Module | Responsibility | Key Files |
|--------|----------------|-----------|
| **EventBus** | Decoupled module communication via publish-subscribe | src/core/EventBus.ts |
| **GameStateMachine** | Manages game state transitions (TITLE → MAP → BATTLE → DIALOG → MENU) | src/core/GameStateMachine.ts |
| **SaveManager** | Save/load game progress to localStorage | src/core/SaveManager.ts |
| **MapSystem** | Four-layer map rendering, collision detection, camera follow, player movement | src/map/ |
| **BattleSystem** | Turn-based combat, elemental effectiveness, damage calculation, skill execution | src/battle/ |
| **DialogSystem** | Dialog trees, quest management, script parsing, NPC interactions | src/dialog/ |
| **ShopSystem** | Merchandise trading, inventory management, shop UI | src/shop/ |
| **AudioManager** | Procedural sound effect generation and playback via Web Audio API | src/ui/AudioManager.ts |

### Data-Driven Design

All game content is defined in data files, not hard-coded:

| Data Type | Location | Description |
|-----------|----------|-------------|
| Monsters | src/core/data/MonsterData.ts | Monster stats, skills, types |
| Skills | src/core/data/SkillData.ts | Skill damage, PP, elemental types |
| Items | src/core/data/ItemData.ts | Consumables, equipment, key items |
| Maps | src/core/data/MapData.ts | Map layouts, collision, NPC positions |
| Dialogs | src/dialog/DialogData.ts | NPC conversations, quest scripts |

---

## 🛠️ Tech Stack

- **Core**: HTML5 Canvas + TypeScript 5.8
- **Build**: TypeScript Compiler (tsc)
- **Architecture**: Event-driven + State Machine + Modular Design
- **Storage**: localStorage
- **Audio Engine**: Web Audio API (Procedural Generation)
- **External Dependencies**: Google Fonts (Optional)

### Design Patterns

| Pattern | Usage |
|---------|-------|
| **Publish-Subscribe** | EventBus for decoupled module communication |
| **State Machine** | GameStateMachine for managing game flow |
| **Singleton** | Global unique instances for all manager classes |
| **Data-Driven** | All game content defined in data files |
| **Layered** | Four-layer map rendering (ground/middle/character/top) |

---

## 📖 Documentation

Detailed development documentation can be found in the `docs/` directory:

- [Map Layout Design](docs/map-layout-design.md)
- [Quest Dialog Scripts](docs/quest-dialog-scripts.md)
- [Battle Algorithm Design](docs/battle-algorithm-design.md)
- [Shop & Inventory Design](docs/shop-inventory-design.md)
- [UI & Sound Design](docs/ui-sound-design.md)
- [Regression Test Cases](docs/regression-test-cases.md) - Complete Playwright test suite

---

## 🧪 Testing

### Unit Tests

Open `test.html` in your browser and click "Run All Tests".

### E2E Tests (Playwright)

```bash
# Run Playwright tests
npm run test:e2e
```

Test configuration is in `docs/playwright.config.ts`.

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make changes in `src/` (TypeScript files)
4. Run `npm run build` to compile
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

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
