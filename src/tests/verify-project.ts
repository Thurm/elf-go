/**
 * 项目完整性验证脚本
 * 用于验证所有模块是否正确加载
 */

// 验证结果
const verificationResults = {
    modules: {},
    total: 0,
    passed: 0,
    failed: 0
};

/**
 * 验证一个模块是否存在
 * @param {string} name - 模块名称
 * @param {string} check - 要检查的全局变量名
 */
function verifyModule(name, check) {
    verificationResults.total++;
    try {
        if (typeof window[check] !== 'undefined' || eval(`typeof ${check} !== 'undefined'`)) {
            verificationResults.modules[name] = { status: 'passed', message: '模块已加载' };
            verificationResults.passed++;
            console.log(`✅ ${name}: 通过`);
        } else {
            verificationResults.modules[name] = { status: 'failed', message: '模块未找到' };
            verificationResults.failed++;
            console.log(`❌ ${name}: 失败 - 模块未找到`);
        }
    } catch (e) {
        verificationResults.modules[name] = { status: 'failed', message: e.message };
        verificationResults.failed++;
        console.log(`❌ ${name}: 失败 - ${e.message}`);
    }
}

/**
 * 运行所有验证
 */
function runVerification() {
    console.log('========================================');
    console.log('  宝可梦风格 RPG - 项目完整性验证');
    console.log('========================================\n');

    // 核心架构模块
    console.log('【核心架构】');
    verifyModule('EventBus', 'eventBus');
    verifyModule('GameStateMachine', 'gameStateMachine');
    verifyModule('SaveManager', 'saveManager');
    verifyModule('GameData', 'createInitialGameState');
    verifyModule('MonsterData', 'MonsterTemplates');
    verifyModule('SkillData', 'SkillTemplates');
    verifyModule('ItemData', 'ItemTemplates');
    verifyModule('MapData', 'MapTemplates');

    console.log('\n【战斗系统】');
    verifyModule('DamageCalculator', 'damageCalculator');
    verifyModule('SkillExecutor', 'skillExecutor');
    verifyModule('BattleSystem', 'battleSystem');

    console.log('\n【对话系统】');
    verifyModule('DialogData', 'DialogNodes');
    verifyModule('ScriptParser', 'scriptParser');
    verifyModule('QuestManager', 'questManager');
    verifyModule('DialogSystem', 'dialogSystem');

    console.log('\n【地图系统】');
    verifyModule('MapRenderer', 'mapRenderer');
    verifyModule('PlayerController', 'playerController');
    verifyModule('MapStateMachine', 'mapStateMachine');
    verifyModule('SceneManager', 'sceneManager');
    verifyModule('MapSystem', 'mapSystem');

    console.log('\n【商店系统】');
    verifyModule('ShopSystem', 'shopSystem');
    verifyModule('InventoryManager', 'inventoryManager');
    verifyModule('ShopUI', 'shopUI');

    console.log('\n【UI/音效系统】');
    verifyModule('AudioManager', 'audioManager');
    verifyModule('UIManager', 'uiManager');
    verifyModule('BattleUI', 'battleUI');
    verifyModule('MenuUI', 'menuUI');

    console.log('\n【主入口】');
    verifyModule('Game', 'game');

    // 输出总结
    console.log('\n========================================');
    console.log('  验证总结');
    console.log('========================================');
    console.log(`总计: ${verificationResults.total} 个模块`);
    console.log(`通过: ${verificationResults.passed} 个模块`);
    console.log(`失败: ${verificationResults.failed} 个模块`);
    console.log('========================================');

    if (verificationResults.failed === 0) {
        console.log('\n🎉 所有模块验证通过！');
    } else {
        console.log('\n⚠️  部分模块验证失败，请检查');
    }

    return verificationResults;
}

// 页面加载完成后运行验证
if (typeof document !== 'undefined') {
    window.addEventListener('load', () => {
        // 延迟运行，确保所有脚本都已加载
        setTimeout(() => {
            runVerification();
        }, 100);
    });
}

// 导出供 Node.js 使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runVerification, verificationResults };
}
