/**
 * 音效管理器 - 使用 Web Audio API 生成和播放音效
 * 负责背景音乐、音效播放、音量控制
 */

// 音效 ID 常量定义
const SoundID = {
    // UI 操作音效
    CURSOR_MOVE: 'sfx_cursor_move',
    CONFIRM: 'sfx_confirm',
    CANCEL: 'sfx_cancel',
    MENU_OPEN: 'sfx_menu_open',
    MENU_CLOSE: 'sfx_menu_close',

    // 战斗音效
    BATTLE_START: 'sfx_battle_start',
    ATTACK_HIT: 'sfx_attack_hit',
    ATTACK_MISS: 'sfx_attack_miss',
    CRITICAL: 'sfx_critical',
    DAMAGE: 'sfx_damage',
    FIRE_SKILL: 'sfx_fire_skill',
    WATER_SKILL: 'sfx_water_skill',
    GRASS_SKILL: 'sfx_grass_skill',
    ELECTRIC_SKILL: 'sfx_electric_skill',
    MONSTER_FAINT: 'sfx_monster_faint',
    LEVEL_UP: 'sfx_level_up',
    HEAL: 'sfx_heal',
    STAT_BOOST: 'sfx_stat_boost',
    STAT_DROP: 'sfx_stat_drop',

    // 地图与移动音效
    STEP_GRASS: 'sfx_step_grass',
    STEP_GROUND: 'sfx_step_ground',
    PORTAL: 'sfx_portal',
    ENCOUNTER: 'sfx_encounter',

    // 物品与系统音效
    GET_ITEM: 'sfx_get_item',
    GET_MONEY: 'sfx_get_money',
    USE_ITEM: 'sfx_use_item',
    BUY: 'sfx_buy',
    SELL: 'sfx_sell',
    SAVE: 'sfx_save',
    LOAD: 'sfx_load',
    SAVE_SUCCESS: 'sfx_save_success',
    NOTIFICATION: 'sfx_notification',
    ERROR: 'sfx_error',

    // 背景音乐
    BGM_TITLE: 'bgm_title',
    BGM_TOWN: 'bgm_town',
    BGM_ROUTE: 'bgm_route',
    BGM_BATTLE: 'bgm_battle',
    BGM_VICTORY: 'bgm_victory',
    BGM_SHOP: 'bgm_shop',
    BGM_MENU: 'bgm_menu',
    BGM_DEFEAT: 'bgm_defeat'
};

/**
 * 音效管理器类
 */
class AudioManager {
    audioContext: AudioContext | null;
    initialized: boolean;
    masterVolume: number;
    bgmVolume: number;
    sfxVolume: number;
    currentBGM: string | null;
    bgmGainNode: GainNode | null;
    bgmSource: any | null;
    isBGMPlaying: boolean;
    bgmLoop: boolean;
    soundGenerators: Map<string, (...args: any[]) => any>;
    activeSFXSources: Array<{ osc?: any; gain?: any }>;

    constructor() {
        // Web Audio API 上下文
        this.audioContext = null;
        this.initialized = false;

        // 音量设置
        this.masterVolume = 1.0;      // 主音量
        this.bgmVolume = 0.6;         // 背景音乐音量
        this.sfxVolume = 0.8;         // 音效音量

        // 背景音乐相关
        this.currentBGM = null;
        this.bgmGainNode = null;
        this.bgmSource = null;
        this.isBGMPlaying = false;
        this.bgmLoop = true;

        // 音效池 - 使用 Map 存储音效生成器
        this.soundGenerators = new Map();

        // 当前播放的音效源（用于停止）
        this.activeSFXSources = [];

        // 初始化音效生成器
        this._setupSoundGenerators();

        // 订阅音效事件
        this._setupEventListeners();
    }

    /**
     * 初始化音频上下文
     * 需要用户交互后才能初始化
     */
    init() {
        if (this.initialized) return;

        try {
            // 创建 AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API 不支持');
                return;
            }

            this.audioContext = new AudioContextClass();
            this.initialized = true;

            // 创建 BGM 增益节点
            this.bgmGainNode = this.audioContext.createGain();
            this.bgmGainNode.gain.value = this.bgmVolume * this.masterVolume;
            this.bgmGainNode.connect(this.audioContext.destination);

            console.log('AudioManager 初始化成功');
        } catch (error) {
            console.error('AudioManager 初始化失败:', error);
        }
    }

    /**
     * 恢复音频上下文（处理浏览器自动暂停）
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 设置音效生成器
     * 使用 Web Audio API 生成各种音效
     * @private
     */
    _setupSoundGenerators() {
        // UI 操作音效
        this.soundGenerators.set(SoundID.CURSOR_MOVE, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, time);
            osc.frequency.exponentialRampToValueAtTime(1200, time + 0.05);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            osc.start(time);
            osc.stop(time + 0.1);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.CONFIRM, (ctx, time) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(523, time);
            osc2.frequency.setValueAtTime(659, time);

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + 0.15);
            osc2.stop(time + 0.15);
            return { osc: osc1, gain };
        });

        this.soundGenerators.set(SoundID.CANCEL, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, time);
            osc.frequency.exponentialRampToValueAtTime(200, time + 0.15);

            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

            osc.start(time);
            osc.stop(time + 0.15);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.MENU_OPEN, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.exponentialRampToValueAtTime(400, time + 0.1);

            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

            osc.start(time);
            osc.stop(time + 0.2);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.MENU_CLOSE, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(400, time);
            osc.frequency.exponentialRampToValueAtTime(200, time + 0.1);

            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

            osc.start(time);
            osc.stop(time + 0.2);
            return { osc, gain };
        });

        // 战斗音效
        this.soundGenerators.set(SoundID.BATTLE_START, (ctx, time) => {
            const sources = [];

            // 警报声
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(200, time);
            osc1.frequency.setValueAtTime(400, time + 0.1);
            osc1.frequency.setValueAtTime(200, time + 0.2);
            osc1.frequency.setValueAtTime(400, time + 0.3);
            gain1.gain.setValueAtTime(0.1, time);
            gain1.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc1.start(time);
            osc1.stop(time + 0.5);
            sources.push({ osc: osc1, gain: gain1 });

            // 低音鼓点
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(100, time + 0.3);
            osc2.frequency.exponentialRampToValueAtTime(30, time + 0.5);
            gain2.gain.setValueAtTime(0, time + 0.3);
            gain2.gain.linearRampToValueAtTime(0.2, time + 0.35);
            gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
            osc2.start(time + 0.3);
            osc2.stop(time + 0.6);
            sources.push({ osc: osc2, gain: gain2 });

            return sources[0];
        });

        this.soundGenerators.set(SoundID.ATTACK_HIT, (ctx, time) => {
            // 噪音冲击声
            const noise = this._createNoiseBuffer(ctx);
            const source = ctx.createBufferSource();
            source.buffer = noise;

            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);

            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            source.start(time);
            source.stop(time + 0.3);
            return { osc: source, gain };
        });

        this.soundGenerators.set(SoundID.ATTACK_MISS, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, time);
            osc.frequency.exponentialRampToValueAtTime(200, time + 0.2);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

            osc.start(time);
            osc.stop(time + 0.2);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.CRITICAL, (ctx, time) => {
            const sources = [];

            // 金属打击声
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'square';
            osc1.frequency.setValueAtTime(150, time);
            gain1.gain.setValueAtTime(0.2, time);
            gain1.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(time);
            osc1.stop(time + 0.4);
            sources.push({ osc: osc1, gain: gain1 });

            // 高频铃铛声
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1000, time + 0.1);
            osc2.frequency.setValueAtTime(1500, time + 0.15);
            gain2.gain.setValueAtTime(0, time + 0.1);
            gain2.gain.linearRampToValueAtTime(0.15, time + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(time + 0.1);
            osc2.stop(time + 0.4);
            sources.push({ osc: osc2, gain: gain2 });

            return sources[0];
        });

        this.soundGenerators.set(SoundID.DAMAGE, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.exponentialRampToValueAtTime(50, time + 0.2);

            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

            osc.start(time);
            osc.stop(time + 0.25);
            return { osc, gain };
        });

        // 元素技能音效
        this.soundGenerators.set(SoundID.FIRE_SKILL, (ctx, time) => {
            const noise = this._createNoiseBuffer(ctx);
            const source = ctx.createBufferSource();
            source.buffer = noise;

            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, time);
            filter.frequency.linearRampToValueAtTime(800, time + 0.25);
            filter.frequency.linearRampToValueAtTime(300, time + 0.5);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.25, time + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            source.start(time);
            source.stop(time + 0.5);
            return { osc: source, gain };
        });

        this.soundGenerators.set(SoundID.WATER_SKILL, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, time);
            osc.frequency.linearRampToValueAtTime(800, time + 0.15);
            osc.frequency.linearRampToValueAtTime(300, time + 0.4);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            osc.start(time);
            osc.stop(time + 0.5);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.GRASS_SKILL, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.linearRampToValueAtTime(600, time + 0.3);
            osc.frequency.linearRampToValueAtTime(800, time + 0.5);

            gain.gain.setValueAtTime(0.05, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            osc.start(time);
            osc.stop(time + 0.5);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.ELECTRIC_SKILL, (ctx, time) => {
            const noise = this._createNoiseBuffer(ctx);
            const source = ctx.createBufferSource();
            source.buffer = noise;

            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2000, time);

            gain.gain.setValueAtTime(0.2, time);
            gain.gain.setValueAtTime(0, time + 0.05);
            gain.gain.setValueAtTime(0.15, time + 0.1);
            gain.gain.setValueAtTime(0, time + 0.15);
            gain.gain.setValueAtTime(0.1, time + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            source.start(time);
            source.stop(time + 0.4);
            return { osc: source, gain };
        });

        this.soundGenerators.set(SoundID.MONSTER_FAINT, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, time);
            osc.frequency.exponentialRampToValueAtTime(50, time + 0.5);

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);

            osc.start(time);
            osc.stop(time + 0.6);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.LEVEL_UP, (ctx, time) => {
            const notes = [523, 659, 784, 1047];
            const sources = [];

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time + i * 0.15);

                gain.gain.setValueAtTime(0, time + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.15, time + i * 0.15 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.15 + 0.3);

                osc.start(time + i * 0.15);
                osc.stop(time + i * 0.15 + 0.3);
                sources.push({ osc, gain });
            });

            return sources[0];
        });

        this.soundGenerators.set(SoundID.HEAL, (ctx, time) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(523, time);
            osc2.frequency.setValueAtTime(659, time);
            osc1.frequency.linearRampToValueAtTime(784, time + 0.3);
            osc2.frequency.linearRampToValueAtTime(988, time + 0.3);

            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + 0.5);
            osc2.stop(time + 0.5);
            return { osc: osc1, gain };
        });

        this.soundGenerators.set(SoundID.STAT_BOOST, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, time);
            osc.frequency.exponentialRampToValueAtTime(900, time + 0.3);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            osc.start(time);
            osc.stop(time + 0.3);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.STAT_DROP, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, time);
            osc.frequency.exponentialRampToValueAtTime(300, time + 0.3);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            osc.start(time);
            osc.stop(time + 0.3);
            return { osc, gain };
        });

        // 地图音效
        this.soundGenerators.set(SoundID.STEP_GRASS, (ctx, time) => {
            const noise = this._createNoiseBuffer(ctx);
            const source = ctx.createBufferSource();
            source.buffer = noise;

            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2000, time);

            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

            source.start(time);
            source.stop(time + 0.15);
            return { osc: source, gain };
        });

        this.soundGenerators.set(SoundID.STEP_GROUND, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            osc.start(time);
            osc.stop(time + 0.1);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.PORTAL, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.exponentialRampToValueAtTime(800, time + 0.25);
            osc.frequency.exponentialRampToValueAtTime(200, time + 0.5);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            osc.start(time);
            osc.stop(time + 0.5);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.ENCOUNTER, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, time);
            osc.frequency.exponentialRampToValueAtTime(400, time + 0.2);

            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            osc.start(time);
            osc.stop(time + 0.5);
            return { osc, gain };
        });

        // 物品与系统音效
        this.soundGenerators.set(SoundID.GET_ITEM, (ctx, time) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(880, time);
            osc2.frequency.setValueAtTime(1100, time + 0.1);

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            osc1.start(time);
            osc2.start(time + 0.1);
            osc1.stop(time + 0.3);
            osc2.stop(time + 0.4);
            return { osc: osc1, gain };
        });

        this.soundGenerators.set(SoundID.GET_MONEY, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(2000, time);
            osc.frequency.setValueAtTime(1500, time + 0.05);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            osc.start(time);
            osc.stop(time + 0.3);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.USE_ITEM, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, time);
            osc.frequency.setValueAtTime(550, time + 0.1);

            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

            osc.start(time);
            osc.stop(time + 0.2);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.BUY, (ctx, time) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(523, time);
            osc2.frequency.setValueAtTime(659, time + 0.1);

            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            osc1.start(time);
            osc2.start(time + 0.1);
            osc1.stop(time + 0.25);
            osc2.stop(time + 0.3);
            return { osc: osc1, gain };
        });

        this.soundGenerators.set(SoundID.SELL, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(800, time);
            osc.frequency.setValueAtTime(600, time + 0.1);
            osc.frequency.setValueAtTime(400, time + 0.2);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

            osc.start(time);
            osc.stop(time + 0.25);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.SAVE, (ctx, time) => {
            const sources = [];
            for (let i = 0; i < 3; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'square';
                osc.frequency.setValueAtTime(1000, time + i * 0.15);

                gain.gain.setValueAtTime(0, time + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.12, time + i * 0.15 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.15 + 0.12);

                osc.start(time + i * 0.15);
                osc.stop(time + i * 0.15 + 0.12);
                sources.push({ osc, gain });
            }
            return sources[0];
        });

        this.soundGenerators.set(SoundID.LOAD, (ctx, time) => {
            const sources = [];
            for (let i = 0; i < 3; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'square';
                osc.frequency.setValueAtTime(600 + i * 200, time + i * 0.15);

                gain.gain.setValueAtTime(0, time + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.12, time + i * 0.15 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.15 + 0.12);

                osc.start(time + i * 0.15);
                osc.stop(time + i * 0.15 + 0.12);
                sources.push({ osc, gain });
            }
            return sources[0];
        });

        this.soundGenerators.set(SoundID.SAVE_SUCCESS, (ctx, time) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(784, time);
            osc2.frequency.setValueAtTime(988, time + 0.1);

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            osc1.start(time);
            osc2.start(time + 0.1);
            osc1.stop(time + 0.3);
            osc2.stop(time + 0.3);
            return { osc: osc1, gain };
        });

        this.soundGenerators.set(SoundID.NOTIFICATION, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, time);
            osc.frequency.setValueAtTime(800, time + 0.1);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

            osc.start(time);
            osc.stop(time + 0.25);
            return { osc, gain };
        });

        this.soundGenerators.set(SoundID.ERROR, (ctx, time) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.setValueAtTime(150, time + 0.2);

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            osc.start(time);
            osc.stop(time + 0.4);
            return { osc, gain };
        });
    }

    /**
     * 创建噪音缓冲（用于音效生成）
     * @param {AudioContext} ctx - 音频上下文
     * @returns {AudioBuffer} 噪音缓冲区
     * @private
     */
    _createNoiseBuffer(ctx) {
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }

    /**
     * 设置事件监听器
     * @private
     */
    _setupEventListeners() {
        // 监听音效播放事件
        eventBus.on(GameEvents.AUDIO_PLAY, (data) => {
            if (data && data.soundId) {
                this.playSound(data.soundId);
            }
        });

        // 监听背景音乐播放事件
        eventBus.on(GameEvents.AUDIO_BGM, (data) => {
            if (data && data.bgmId) {
                this.playBGM(data.bgmId, data.loop !== false);
            }
        });
    }

    /**
     * 播放音效
     * @param {string} soundId - 音效 ID
     * @returns {boolean} 是否成功播放
     */
    playSound(soundId) {
        if (!this.initialized) {
            this.init();
        }

        if (!this.audioContext) return false;

        this.resume();

        const generator = this.soundGenerators.get(soundId);
        if (!generator) {
            console.warn(`音效 ${soundId} 不存在`);
            return false;
        }

        try {
            const time = this.audioContext.currentTime;
            const sfxGain = this.audioContext.createGain();
            sfxGain.gain.value = this.sfxVolume * this.masterVolume;
            sfxGain.connect(this.audioContext.destination);

            // 暂时将目标连接到我们的增益节点
            // 注意：这里需要特殊处理，因为生成器直接连接到 destination
            // 我们通过重写 createGain 和 connect 来拦截
            const originalCreateGain = this.audioContext.createGain.bind(this.audioContext);
            const originalConnect = AudioNode.prototype.connect;

            // 临时拦截最后一个节点连接到我们的 sfxGain
            const result = generator(this.audioContext, time);

            // 如果返回了 gain 节点，重新连接它
            if (result && result.gain) {
                try {
                    result.gain.disconnect();
                    result.gain.connect(sfxGain);
                } catch (e) {
                    // 如果无法重新连接，就用原始方式播放
                    generator(this.audioContext, time);
                }
            }

            return true;
        } catch (error) {
            console.error('播放音效失败:', error);
            return false;
        }
    }

    /**
     * 播放背景音乐
     * @param {string} bgmId - BGM ID
     * @param {boolean} loop - 是否循环
     */
    playBGM(bgmId, loop = true) {
        if (!this.initialized) {
            this.init();
        }

        if (!this.audioContext) return;

        this.resume();

        // 停止当前 BGM
        this.stopBGM();

        this.currentBGM = bgmId;
        this.bgmLoop = loop;
        this.isBGMPlaying = true;

        // 使用简单的合成音作为 BGM（实际项目中应该使用音频文件）
        this._playSynthesizeBGM(bgmId, loop);
    }

    /**
     * 合成简单的 BGM（使用 Web Audio API 合成）
     * @param {string} bgmId - BGM ID
     * @param {boolean} loop - 是否循环
     * @private
     */
    _playSynthesizeBGM(bgmId, loop) {
        if (!this.audioContext) return;

        const ctx = this.audioContext;

        // 定义不同 BGM 的旋律
        const bgmPatterns = {
            [SoundID.BGM_TITLE]: {
                notes: [262, 330, 392, 523, 392, 523, 659, 784],
                tempo: 0.4,
                type: 'triangle'
            },
            [SoundID.BGM_TOWN]: {
                notes: [392, 440, 494, 523, 494, 440, 392, 330],
                tempo: 0.5,
                type: 'sine'
            },
            [SoundID.BGM_ROUTE]: {
                notes: [262, 294, 330, 349, 330, 294, 262, 196],
                tempo: 0.3,
                type: 'square'
            },
            [SoundID.BGM_BATTLE]: {
                notes: [196, 262, 196, 294, 196, 262, 196, 175],
                tempo: 0.2,
                type: 'sawtooth'
            },
            [SoundID.BGM_VICTORY]: {
                notes: [523, 659, 784, 1047, 784, 1047, 1319, 1568],
                tempo: 0.3,
                type: 'sine',
                once: true
            },
            [SoundID.BGM_SHOP]: {
                notes: [330, 392, 440, 494, 440, 392, 330, 262],
                tempo: 0.4,
                type: 'sine'
            },
            [SoundID.BGM_MENU]: {
                notes: [262, 294, 330, 294, 262, 294, 330, 294],
                tempo: 0.6,
                type: 'triangle'
            },
            [SoundID.BGM_DEFEAT]: {
                notes: [392, 349, 330, 294, 262, 220, 196, 175],
                tempo: 0.5,
                type: 'sawtooth',
                once: true
            }
        };

        const pattern = bgmPatterns[bgmId] || bgmPatterns[SoundID.BGM_TITLE];
        const playPattern = (startTime) => {
            if (!this.isBGMPlaying || this.currentBGM !== bgmId) return;

            pattern.notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(this.bgmGainNode);

                osc.type = pattern.type as OscillatorType;
                osc.frequency.setValueAtTime(freq, startTime + i * pattern.tempo);

                // 应用淡入淡出
                gain.gain.setValueAtTime(0, startTime + i * pattern.tempo);
                gain.gain.linearRampToValueAtTime(0.1, startTime + i * pattern.tempo + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + (i + 1) * pattern.tempo - 0.05);

                osc.start(startTime + i * pattern.tempo);
                osc.stop(startTime + (i + 1) * pattern.tempo);
            });

            // 如果需要循环，安排下一次播放
            if (loop && !pattern.once) {
                const nextTime = startTime + pattern.notes.length * pattern.tempo;
                setTimeout(() => {
                    if (this.isBGMPlaying && this.currentBGM === bgmId) {
                        playPattern(ctx.currentTime);
                    }
                    // 简单的低音伴奏
                    const bassOsc = ctx.createOscillator();
                    const bassGain = ctx.createGain();
                    bassOsc.connect(bassGain);
                    bassGain.connect(this.bgmGainNode);
                    bassOsc.type = 'sine';
                    bassOsc.frequency.setValueAtTime(pattern.notes[0] / 2, startTime);
                    bassGain.gain.setValueAtTime(0.03, startTime);
                    bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + pattern.notes.length * pattern.tempo);
                    bassOsc.start(startTime);
                    bassOsc.stop(startTime + pattern.notes.length * pattern.tempo);
                }, (pattern.notes.length * pattern.tempo * 1000) - 50);
            }
        };

        playPattern(ctx.currentTime);
    }

    /**
     * 停止当前背景音乐
     */
    stopBGM() {
        this.isBGMPlaying = false;
        this.currentBGM = null;
    }

    /**
     * 暂停背景音乐
     */
    pauseBGM() {
        this.isBGMPlaying = false;
    }

    /**
     * 恢复背景音乐
     */
    resumeBGM() {
        if (this.currentBGM && !this.isBGMPlaying) {
            this.isBGMPlaying = true;
            this._playSynthesizeBGM(this.currentBGM, this.bgmLoop);
        }
    }

    /**
     * 设置主音量
     * @param {number} volume - 音量 (0.0 - 1.0)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this._updateVolumes();
    }

    /**
     * 设置背景音乐音量
     * @param {number} volume - 音量 (0.0 - 1.0)
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        this._updateVolumes();
    }

    /**
     * 设置音效音量
     * @param {number} volume - 音量 (0.0 - 1.0)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 更新音量
     * @private
     */
    _updateVolumes() {
        if (this.bgmGainNode) {
            this.bgmGainNode.gain.value = this.bgmVolume * this.masterVolume;
        }
    }

    /**
     * 获取当前音量设置
     * @returns {Object} 音量设置
     */
    getVolumeSettings() {
        return {
            master: this.masterVolume,
            bgm: this.bgmVolume,
            sfx: this.sfxVolume
        };
    }

    /**
     * 停止所有音效
     */
    stopAll() {
        this.stopBGM();
        this.activeSFXSources.forEach(source => {
            try {
                if (source.osc && source.osc.stop) {
                    source.osc.stop();
                }
            } catch (e) {
                // 忽略错误
            }
        });
        this.activeSFXSources = [];
    }
}

// 创建全局实例并暴露到 window 对象上
window.audioManager = new AudioManager();
const audioManager = window.audioManager;
window.SoundID = SoundID;
