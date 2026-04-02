/**
 * 精灵冒险游戏 - TypeScript 类型定义
 */

// ==================== 运行时常量类型（由脚本文件提供实际值） ====================

type GameStateValue = typeof GameState[keyof typeof GameState];
type ElementTypeValue = typeof ElementType[keyof typeof ElementType];
type SkillCategoryValue = typeof SkillCategory[keyof typeof SkillCategory];
type SkillTargetValue = typeof SkillTarget[keyof typeof SkillTarget];
type StatusEffectValue = typeof StatusEffect[keyof typeof StatusEffect];
type EquipmentSlotValue = typeof EquipmentSlot[keyof typeof EquipmentSlot];
type UIStateValue = typeof UIState[keyof typeof UIState];
type DirectionValue = typeof Direction[keyof typeof Direction];
type CollisionTypeValue = typeof CollisionType[keyof typeof CollisionType];
type MapStateValue = typeof MapState[keyof typeof MapState];

// ==================== 接口类型 ====================

interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  spd: number;
}

interface MonsterStats extends BaseStats {
  maxHp: number;
}

interface DropItem {
  itemId: string;
  chance: number;
}

interface MonsterTemplate {
  id: string;
  name: string;
  type: ElementTypeValue;
  baseStats: BaseStats;
  skills: string[];
  expReward: number;
  drops: DropItem[];
}

interface SkillRef {
  skillId: string;
  id?: string;
  pp: number;
  maxPp: number;
}

interface PlayerMonster {
  id: string;
  monsterId: string;
  name?: string;
  nickname: string;
  level: number;
  exp: number;
  expToNext: number;
  stats: MonsterStats;
  skills: SkillRef[];
  equipment: Record<string, string | null>;
  status: string | null;
  type?: string;
}

interface SkillEffect {
  type: string;
  chance?: number;
  duration?: number;
  value?: number;
  percent?: number;
  status?: string | string[];
  hpPercent?: number;
}

interface SkillTemplate {
  id: string;
  name: string;
  type: ElementTypeValue;
  category: SkillCategoryValue;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  target: SkillTargetValue;
  priority?: number;
  effect: SkillEffect | null;
  description: string;
}

interface ItemEffect {
  type: string;
  baseRate?: number;
  guaranteed?: boolean;
  amount?: number;
  value?: number;
  status?: string | string[];
  hpPercent?: number;
  friendshipBonus?: boolean | number;
  turnsBonus?: boolean | number;
  badgeLevel?: number;
  [key: string]: unknown;
}

interface ItemTemplate {
  id: string;
  name: string;
  type: typeof ItemType[keyof typeof ItemType];
  rarity: typeof ItemRarity[keyof typeof ItemRarity];
  price: number | { buy: number | null; sell: number | null };
  description: string;
  effect?: ItemEffect;
  stats?: Record<string, number>;
  slot?: EquipmentSlotValue;
  target?: 'monster' | 'enemy' | 'none' | 'single_monster' | 'fainted_monster' | 'single_skill' | 'enemy_monster';
  stackable?: boolean;
  maxStack?: number;
  shops?: string[];
  discardable?: boolean;
}

interface ShopInventoryItem {
  itemId: string;
  price: number;
  stock: number;
  unlimited?: boolean;
}

interface ShopUnlockCondition {
  type: string;
  questId?: string;
  itemId?: string;
  flag?: string;
}

interface ShopHours {
  open: number;
  close: number;
}

interface InventoryItem {
  uid?: string;
  itemId: string;
  quantity: number;
  obtainedAt?: number;
  equipped?: boolean;
  equipSlot?: EquipmentSlotValue | null;
  customData?: Record<string, unknown>;
}

interface QuestObjective {
  type: string;
  targetId: string;
  targetCount: number;
  currentCount: number;
}

interface QuestObjectiveTemplate {
  id: string;
  type: string;
  target: string;
  count: number;
  current: number;
  description: string;
}

interface QuestReward {
  type: 'money' | 'item' | 'exp';
  amount: number;
  itemId?: string;
}

interface QuestRewardBundle {
  money: number;
  items: InventoryItem[];
  exp: number;
}

interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side';
  status: 'not_started' | 'in_progress' | 'ready_to_complete' | 'completed' | 'failed';
  objectives: QuestObjectiveTemplate[];
  rewards: QuestRewardBundle;
  prerequisites: string[];
  dialogueStart: string | null;
  dialogueComplete: string | null;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  status: 'active' | 'in_progress' | 'ready_to_complete' | 'completed' | 'failed';
  startedAt?: number;
}

interface PlayerData {
  name: string;
  party: PlayerMonster[];
  equipment: Record<EquipmentSlotValue, string | null>;
  inventory: InventoryItem[];
  inventoryCapacity: number;
  equipmentStats: Partial<BaseStats>;
  money: number;
  location: { x: number; y: number };
  quests: ActiveQuest[];
  completedQuests: string[];
}

interface GameStateData {
  currentState: GameStateValue;
  stateStack: GameStateValue[];
  player: PlayerData;
  currentMapId: string;
  gameTime: number;
  flags: Record<string, unknown>;
  tempData: Record<string, unknown>;
}

interface ShopData {
  id: string;
  name: string;
  inventory: ShopInventoryItem[];
  buyMultiplier: number;
  sellMultiplier: number;
  npcId?: string;
  npcName?: string;
  description?: string;
  location?: { mapId: string; x: number; y: number };
  unlockCondition: ShopUnlockCondition;
  hours: ShopHours;
}

type RarityColorKey = typeof ItemRarity[keyof typeof ItemRarity];
type RarityColorPalette = Record<RarityColorKey, { text: string; border: string; bg: string }>;

interface NPCData {
  id: string;
  name?: string;
  x: number;
  y: number;
  dialogId?: string;
  dialogIds?: string[];
  shopId?: string;
  direction?: DirectionValue | string;
}

interface PortalData {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
}

interface EncounterData {
  monsterId: string;
  minLevel: number;
  maxLevel: number;
  weight: number;
}

interface MapTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  tileset?: string;
  layers?: Array<{ name: string; data: number[][] }>;
  tiles?: number[][];
  npcs: NPCData[];
  portals: PortalData[];
  shops: Array<{ id: string; x: number; y: number }>;
  starterDisplays?: Array<{ id: string; monsterId: string; x: number; y: number; label: string }>;
  encounter: {
    enabled: boolean;
    rate: number;
    monsters: EncounterData[];
  };
}

interface DialogLine {
  speaker: string;
  text: string;
  portrait?: string;
}

interface DialogChoice {
  text: string;
  nextDialog?: string;
  nextNodeId?: string;
  value?: unknown;
  action?: DialogAction;
}

interface DialogAction {
  type?: string;
  action?: string;
  data?: Record<string, unknown>;
  shopId?: string;
  [key: string]: unknown;
}

interface DialogNode {
  id: string;
  npcId?: string;
  lines: DialogLine[];
  choices?: DialogChoice[];
  onComplete?: DialogAction;
  condition?: string | ((gameState: GameStateData) => boolean);
}

interface DialogHistoryEntry {
  dialogId: string | null;
  choice: string;
  timestamp: number;
}

interface DialogStartPayload {
  dialogId?: string;
  npcId?: string;
  speaker?: string;
  text?: string;
  lines?: DialogLine[];
  choices?: DialogChoice[] | null;
}

interface DialogChoicePayload {
  choiceIndex?: number;
  choice?: number;
  value?: unknown;
}

interface UINotificationPayload {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface UIDialogState {
  speaker: string;
  text: string;
  choices: DialogChoice[] | null;
  currentPage: number;
  totalPages: number;
  pages?: string[][];
  selectedChoice?: number;
}

interface UINotification {
  id: number;
  message: string;
  type: UINotificationPayload['type'];
  timestamp: number;
  duration: number;
}

interface UISelectableMenuItem {
  id: string;
  text: string;
  action?: string;
  type?: 'action' | 'slider';
  value?: number;
  pp?: number;
  maxPp?: number;
  skillIndex?: number;
  item?: InventoryItem;
  template?: ItemTemplate | null;
  layout?: 'grid' | 'list';
  slot?: number;
  info?: SaveInfo;
  monster?: BattleMonster | PlayerMonster;
  index?: number;
  settingKey?: string;
  isTitle?: boolean;
}

interface UIMenuState {
  type: string;
  title?: string;
  items: UISelectableMenuItem[];
  layout?: 'grid' | 'list';
  selectedIndex: number;
  party?: PlayerMonster[];
  inventory?: InventoryItem[];
}

interface DamageResult {
  damage: number;
  baseDamage?: number;
  critical?: boolean;
  isCritical?: boolean;
  isHit?: boolean;
  hasStab?: boolean;
  typeMultiplier: number;
  randomFactor?: number;
  effectiveness: 'super' | 'normal' | 'not-very' | 'no-effect' | 'super_effective' | 'not_effective' | string;
}

interface SkillExecutionResult {
  type?: 'damage' | 'status' | 'heal' | 'miss';
  messages: string[];
  damageResult?: DamageResult;
  statusApplied?: string;
  statusEffect?: unknown;
  healAmount?: number;
}

interface BattleMonster extends PlayerMonster {
  type?: ElementTypeValue | string;
  statusTurns?: number;
  expReward?: number;
  drops?: DropItem[];
}

interface ResolvedSkill extends SkillTemplate {
  skillId: string;
  pp: number;
  maxPp: number;
}

interface RuntimeNPC {
  id?: string;
  x: number;
  y: number;
  direction?: DirectionValue | string;
  dialogId?: string;
  shopId?: string;
  data?: NPCData;
}

interface RuntimePortal extends PortalData {
  data?: PortalData;
}

interface RuntimeShopPoint {
  id?: string;
  x: number;
  y: number;
  data?: { id?: string; x: number; y: number };
}

interface PlayerRenderState {
  x: number;
  y: number;
  realX?: number;
  realY?: number;
  tileX?: number;
  tileY?: number;
  direction: DirectionValue | string;
  moving: boolean;
}

interface MapRenderState {
  map?: MapTemplate | null;
  player?: PlayerRenderState;
  npcs?: RuntimeNPC[];
  portals?: RuntimePortal[];
  shops?: RuntimeShopPoint[];
  collisionMap?: number[][];
}

interface BattleActionPayload {
  action?: string;
  source?: BattleMonster | null;
  target?: BattleMonster | null;
  skillId?: string;
  itemId?: string;
  quantity?: number;
  result?: SkillExecutionResult;
}

interface BattleDamagePayload {
  source?: BattleMonster | null;
  target?: BattleMonster | null;
  damage?: number;
  result?: DamageResult;
}

interface BattleStartPayload {
  playerMonster?: BattleMonster | null;
  enemyMonster?: BattleMonster | null;
  isWildBattle?: boolean;
  type?: string;
  playerParty?: BattleMonster[];
  enemyParty?: BattleMonster[];
}

interface BattleUIBattleMenuItem extends UISelectableMenuItem {
  pp?: number;
  maxPp?: number;
  skillIndex?: number;
  item?: InventoryItem;
  template?: ItemTemplate | null;
  layout?: 'grid' | 'list';
  slot?: number;
  info?: SaveInfo;
  monster?: BattleMonster;
  index?: number;
  settingKey?: string;
  isTitle?: boolean;
}

interface BattleResult {
  result: 'victory' | 'defeat' | 'flee' | 'capture';
  exp: number;
  rewards: string[];
  battleLog: string[];
}

interface SaveFile {
  version: string;
  timestamp: number;
  saveSlot: number;
  gameState: GameStateData;
}

interface SaveInfo {
  slot: number;
  empty: boolean;
  timestamp?: number;
  version?: string;
  gameTime?: number;
  playerName?: string;
  error?: unknown;
}

interface GameEventPayloadMap {
  'state:change': { newState: GameStateValue; oldState: GameStateValue | null };
  'state:push': { newState: GameStateValue };
  'state:pop': { newState: GameStateValue; oldState: GameStateValue | null };
  'map:player_move': any;
  'map:encounter': any;
  'map:portal': { targetMap?: string; targetX?: number; targetY?: number };
  'map:interact': any;
  'battle:start': BattleStartPayload;
  'battle:action': BattleActionPayload;
  'battle:damage': BattleDamagePayload;
  'battle:end': { victory?: boolean; monsterId?: string; result?: BattleResult['result']; exp?: number; rewards?: string[]; battleLog?: string[] };
  'battle:use_skill': { skillId?: string };
  'battle:use_item': { item?: any };
  'battle:use_bag': undefined;
  'battle:flee': undefined;
  'battle:switch_monster': undefined;
  'battle:catch_complete': { success?: boolean };
  'battle:capture_decision': { choice?: string };
  'battle:finish_capture': undefined;
  'shop:buy': { itemId?: string; quantity?: number };
  'shop:sell': { inventoryUid?: string; quantity?: number };
  'shop:close': undefined;
  'shop:opened': any;
  'shop:closed': undefined;
  'shop:item_bought': any;
  'shop:item_sold': any;
  'dialog:start': DialogStartPayload;
  'dialog:choice': DialogChoicePayload;
  'dialog:end': undefined;
  'shop:open': { shopId: string };
  'ui:menu_open': { menuType?: string };
  'ui:menu_close': undefined;
  'ui:menu_action': { action?: string; item: UISelectableMenuItem };
  'ui:notification': UINotificationPayload;
  'data:save': { slot: number; success: boolean; error?: unknown };
  'data:load': { slot: number; success: boolean; data?: SaveFile; error?: unknown };
  'data:update': GameStateData;
  'item:acquired': { itemId: string; quantity?: number };
  'inventory:changed': any;
  'quest:started': { quest: QuestTemplate | Quest };
  'quest:progress': { questId: string; objective: QuestObjectiveTemplate };
  'audio:play': { soundId?: string };
  'audio:bgm': { bgmId?: string; loop?: boolean };
  'dialog:show_line': {
    speaker: string;
    text: string;
    portrait?: string;
    lineIndex: number;
    totalLines: number;
    choices?: DialogChoice[] | null;
  };
  'dialog:show_choices': {
    choices: DialogChoice[];
  };
}

type EventCallback<T = any> = (data: T) => void;

// ==================== 类定义 ====================

interface EventBus {
  on<K extends keyof GameEventPayloadMap>(event: K, callback: EventCallback<GameEventPayloadMap[K]>): void;
  on<T = any>(event: string, callback: EventCallback<T>): void;
  off<K extends keyof GameEventPayloadMap>(event: K, callback: EventCallback<GameEventPayloadMap[K]>): void;
  off<T = any>(event: string, callback: EventCallback<T>): void;
  emit<K extends keyof GameEventPayloadMap>(event: K, data: GameEventPayloadMap[K]): void;
  emit<T = any>(event: string, data?: T): void;
  once<K extends keyof GameEventPayloadMap>(event: K, callback: EventCallback<GameEventPayloadMap[K]>): void;
  once<T = any>(event: string, callback: EventCallback<T>): void;
  clear(): void;
}

interface GameStateMachine {
  init(initialGameState: GameStateData): void;
  changeState(newState: GameStateValue): void;
  pushState(newState: GameStateValue): void;
  popState(): void;
  onEnterState(state: GameStateValue, oldState?: GameStateValue | null): void;
  onExitState(state: GameStateValue): void;
  getCurrentState(): GameStateValue | null;
  getGameState(): GameStateData | null;
  updateGameState(updates: Partial<GameStateData>): void;
  updatePlayer(updates: Partial<PlayerData>): void;
}

interface SaveManager {
  getSaveKey(slot: number): string;
  saveGame(gameState: GameStateData, slot: number): boolean;
  loadGame(slot: number): GameStateData | null;
  isSaveDataValid(saveData: unknown): saveData is SaveFile;
  getAllSaveInfo(): SaveInfo[];
  getSaveInfo(slot: number): SaveInfo;
  deleteSave(slot: number): boolean;
  deepClone<T>(obj: T): T;
}

interface DialogSystem {
  currentDialogId: string | null;
  currentNode: DialogNode | null;
  currentLineIndex: number;
  isActive: boolean;
  init(): void;
  startDialog(npcId: string): void;
  startDialogById(dialogId: string): void;
  setFlag(data: { flag: string; value?: unknown }): void;
  getHistory(): DialogHistoryEntry[];
  clearHistory(): void;
}

interface ActionExecutionResult {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

interface ScriptParser {
  evaluateCondition(condition: DialogNode['condition'], gameState: GameStateData): boolean;
  evaluateConditionString(conditionStr: string, gameState: GameStateData): boolean;
  executeAction(action: DialogAction, gameState: GameStateData): ActionExecutionResult;
  executeActions(actions: DialogAction[], gameState: GameStateData): ActionExecutionResult[];
}

interface QuestRuntimeObjective {
  type: string;
  target: string;
  count: number;
  current: number;
  description: string;
}

interface ActiveQuest extends Omit<QuestTemplate, 'objectives' | 'rewards'> {
  objectives: QuestRuntimeObjective[];
  rewards: QuestRewardBundle;
  startedAt?: number;
  completedAt?: number;
}

interface QuestManager {
  quests: ActiveQuest[];
  completedQuests: string[];
  init(): void;
  startQuest(questId: string): boolean;
  updateQuestProgress(type: string, target: string, amount?: number): void;
  completeQuest(questId: string): boolean;
  abandonQuest(questId: string): boolean;
  isQuestActive(questId: string): boolean;
  isQuestCompleted(questId: string): boolean;
  getQuest(questId: string): ActiveQuest | null;
  getActiveQuests(): ActiveQuest[];
  getCompletedQuests(): string[];
  saveToGameState(): void;
  loadFromGameState(): void;
}

interface UpdatableSubsystem {
  update?: (deltaTime: number) => void;
}

interface InitializableCanvasSubsystem extends UpdatableSubsystem {
  init?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gameState?: GameStateData | null) => void;
}

interface InputHandlingSubsystem extends UpdatableSubsystem {
  handleInput?: (event: KeyboardEvent) => boolean;
  render?: () => void;
}

interface MapSystemLike extends InitializableCanvasSubsystem {
  render: () => void;
}

interface GameRuntime {
  handleKeyDown(event: KeyboardEvent | { key: string; type?: string; preventDefault(): void }): void;
}

interface UIManager {
  initialized: boolean;
  state: UIStateValue;
  dialogVisible: boolean;
  currentDialog: UIDialogState | null;
  currentMenu: UIMenuState | null;
  notifications: UINotification[];
  init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
  showDialog(data: DialogStartPayload): void;
  hideDialog(): void;
  showNotification(message: string, type?: UINotificationPayload['type']): void;
  handleInput(event: KeyboardEvent): boolean;
  dialogNext(): boolean;
  selectDialogChoice(index: number): void;
  getState(): UIStateValue;
  render(): void;
}

interface AudioManagerLike {
  [key: string]: any;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  playSound?: (soundId: string) => void;
}

interface InventoryManagerLike {
  [key: string]: any;
  init(): void;
}

interface ShopSystemLike { [key: string]: any }
interface ShopUILike { [key: string]: any }
interface BattleSystemLike { [key: string]: any }
interface DamageCalculatorLike { [key: string]: any }
interface SkillExecutorLike { [key: string]: any }
interface MapRendererLike { [key: string]: any }
interface MapStateMachineLike { [key: string]: any }
interface PlayerControllerLike { [key: string]: any }
interface SceneManagerLike { [key: string]: any }
interface BattleUILike { [key: string]: any }
interface MenuUILike { [key: string]: any }

interface BattleSystem { [key: string]: any }
interface DamageCalculator { [key: string]: any }
interface SkillExecutor { [key: string]: any }
interface MapRenderer { [key: string]: any }
interface MapStateMachine { [key: string]: any }
interface PlayerController { [key: string]: any }
interface SceneManager { [key: string]: any }
interface MapSystem { [key: string]: any }
interface ShopUI { [key: string]: any }
interface AudioManager { [key: string]: any }
interface BattleUI { [key: string]: any }
interface MenuUI { [key: string]: any }

interface Window {
  MapRenderer: typeof MapRenderer;
  initMapRenderer: typeof initMapRenderer;
  getMapRenderer: typeof getMapRenderer;
}

// ==================== Window 扩展 ====================

// 像素精灵类型
type PixelSprite = (string | null)[][];

interface SpriteRenderer {
  ctx: CanvasRenderingContext2D | null;
  pixelScale: number;
  init(ctx: CanvasRenderingContext2D): void;
  renderSprite(spriteData: PixelSprite, x: number, y: number, scale?: number): void;
  renderMonsterSprite(monsterId: string, x: number, y: number, isEnemy?: boolean, scale?: number): void;
  _getMonsterGlowColor(monsterId: string): string;
  _renderFallbackMonster(x: number, y: number, isEnemy: boolean, scale: number): void;
  _adjustColorBrightness(hexColor: string, amount: number): string;
}

interface MonsterSpritesData {
  [key: string]: {
    front: PixelSprite;
    back: PixelSprite;
  };
}

interface SpriteColorsData {
  [key: string]: string | null;
}

interface Window {
  // 核心架构
  eventBus: EventBus;
  GameEvents: typeof GameEvents;
  gameStateMachine: GameStateMachine;
  saveManager: SaveManager;

  // 精灵渲染
  SpriteRenderer: {
    new(): SpriteRenderer;
  };
  MonsterSprites: MonsterSpritesData;
  SpriteColors: SpriteColorsData;

  // 数据
  GameState: typeof GameState;
  ElementType: typeof ElementType;
  ElementMultiplier: typeof ElementMultiplier;
  MonsterTemplates: typeof MonsterTemplates;
  SkillCategory: typeof SkillCategory;
  SkillTarget: typeof SkillTarget;
  StatusEffect: typeof StatusEffect;
  SkillTemplates: typeof SkillTemplates;
  ItemRarity: typeof ItemRarity;
  ItemType: typeof ItemType;
  EquipmentSlot: typeof EquipmentSlot;
  ItemTemplates: typeof ItemTemplates;
  ShopData: typeof ShopData;
  RarityColors: typeof RarityColors;
  UIColors: Record<string, string>;
  UIState: typeof UIState;
  MapTemplates: typeof MapTemplates;
  ShopTemplates: typeof ShopTemplates;
  QuestTemplates: Record<string, QuestTemplate>;

  // 对话系统
  DialogNodes: typeof DialogNodes;
  DialogData: typeof DialogData;
  NPCDialogMap: typeof NPCDialogMap;
  DialogTemplates: typeof DialogTemplates;

  // 游戏状态
  gameState: GameStateData;
  currentGameState: string;

  // 地图系统
  mapRenderer: MapRendererLike | null;
  mapStateMachine: MapStateMachineLike;
  playerController: PlayerControllerLike;
  sceneManager: SceneManagerLike;
  mapSystem: MapSystemLike;

  // 战斗系统
  battleSystem: BattleSystemLike;
  damageCalculator: DamageCalculatorLike;
  skillExecutor: SkillExecutorLike;
  BattleState: Record<string, string>;

  // 对话系统
  dialogSystem: DialogSystem;
  questManager: QuestManager;
  scriptParser: ScriptParser;

  // 商店系统
  shopSystem: ShopSystemLike;
  inventoryManager: InventoryManagerLike;
  shopUI: ShopUILike;

  // UI系统
  audioManager: AudioManagerLike;
  uiManager: UIManager;
  battleUI: BattleUILike;
  menuUI: MenuUILike;
  BattleUIState: Record<string, string>;
  MenuUIState: Record<string, string>;

  // 游戏实例
  game: GameRuntime;

  // 其他
  SoundID: Record<string, string>;
  BGMID: Record<string, string>;
  MapLayerType: Record<string, string>;
  MapData: typeof MapTemplates;
  CollisionType: Record<string, number>;
  Direction: Record<string, string>;
  DirectionVectors: Record<string, { x: number; y: number }>;
  MOVE_SPEED: number;
  TILE_SIZE: number;
  RENDER_LAYERS: Record<string, number>;
  CollisionRenderType: Record<string, number>;
  MapState: Record<string, string>;
  webkitAudioContext?: typeof AudioContext;
  inlineDialogNodes: Record<string, DialogNode>;
}
