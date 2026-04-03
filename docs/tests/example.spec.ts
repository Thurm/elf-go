import { test, expect } from '@playwright/test';

async function gotoGame(page) {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await expect(page).toHaveTitle(/精灵冒险/);
      await expect(page.locator('#game-canvas')).toBeVisible();
      await page.waitForFunction(() => {
        return typeof window.gameStateMachine !== 'undefined' &&
          typeof window.game !== 'undefined' &&
          typeof window.gameStateMachine.getCurrentState === 'function' &&
          ['TITLE', 'MAP'].includes(window.gameStateMachine.getCurrentState());
      }, { timeout: 8000 });
      return;
    } catch (error) {
      if (attempt === 1) throw error;
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }
}

async function prepareWildBattle(page, monsterId = 'water_turtle', level = 5) {
  await startMapGame(page);

  await page.evaluate(({ monsterId, level }) => {
    battleSystem.startWildBattle(monsterId, level);
  }, { monsterId, level });

  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'PRE_BATTLE_SELECT');
  await page.waitForFunction(() => battleUI.currentMessage !== null);
  await page.evaluate(() => {
    battleUI.confirmMessage();
  });
  await page.waitForFunction(() => battleUI.currentMenu?.type === 'pre_battle_party');
  await page.evaluate(() => {
    const item = battleUI.currentMenu?.items?.find(entry => entry.monster);
    battleUI.handleMonsterSelection(item);
  });

  await skipBattleIntro(page);
}

async function skipBattleIntro(page) {
  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'BATTLE');
  await page.waitForFunction(() => battleUI.currentMessage !== null);

  await page.evaluate(() => {
    battleUI.confirmMessage();
    battleUI.confirmMessage();
  });

  await page.waitForFunction(() => {
    return battleSystem.state === BattleState.PLAYER_TURN &&
      battleSystem.waitingForInput === true &&
      battleUI.currentMenu?.type === 'action';
  }, { timeout: 5000 });
}

async function startMapGame(page) {
  await gotoGame(page);
  const currentState = await page.evaluate(() => window.gameStateMachine.getCurrentState());
  if (currentState === 'TITLE') {
    await page.keyboard.press('Enter');
  }
  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');
}

async function openMapMenu(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => menuUI.isOpen() && gameStateMachine.getCurrentState() === 'MENU');
}

async function closeMapMenu(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !menuUI.isOpen());
}

async function startNpcDialog(page, npcId) {
  await page.evaluate((targetNpcId) => {
    gameStateMachine.pushState(GameState.DIALOG);
    eventBus.emit(GameEvents.DIALOG_START, { npcId: targetNpcId });
  }, npcId);

  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'DIALOG' && dialogSystem.isActive === true);
}

async function dialogNext(page, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => {
      eventBus.emit(GameEvents.DIALOG_NEXT);
    });
  }
}

async function chooseDialog(page, choiceIndex) {
  await page.evaluate((targetChoiceIndex) => {
    eventBus.emit(GameEvents.DIALOG_CHOICE, { choiceIndex: targetChoiceIndex });
  }, choiceIndex);
}

async function dialogSystemEndToMap(page) {
  await page.evaluate(() => {
    while (dialogSystem.isActive) {
      eventBus.emit(GameEvents.DIALOG_NEXT);
      if (uiManager.currentDialog?.choices?.length) {
        eventBus.emit(GameEvents.DIALOG_CHOICE, { choiceIndex: 0 });
      }
      if (gameStateMachine.getCurrentState() === 'MAP' && !dialogSystem.isActive) {
        break;
      }
    }
  });

  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP' && dialogSystem.isActive === false);
}

async function advanceDialogWithKeyboard(page, times = 1) {
  for (let i = 0; i < times; i++) {
    await dispatchGameKey(page, 'Enter');
  }
}

async function dispatchGameKey(page, key) {
  await page.evaluate((targetKey) => {
    window.game.handleKeyDown({
      key: targetKey,
      type: 'keydown',
      preventDefault() {},
    });
  }, key);
}

async function resetMayorStarterScenario(page) {
  await page.evaluate(() => {
    const gameState = gameStateMachine.getGameState();
    gameState.flags = { quest_main_01_completed: true };
    gameState.player.party = [];
    gameState.player.inventory = [];
    gameState.player.quests = [];

    gameStateMachine.updateGameState({ flags: gameState.flags });
    gameStateMachine.updatePlayer({
      party: gameState.player.party,
      inventory: gameState.player.inventory,
      quests: gameState.player.quests,
    });

    if (typeof questManager !== 'undefined') {
      questManager.quests = [];
      questManager.completedQuests = ['quest_main_01'];
      questManager.saveToGameState?.();
    }

    dialogSystem.clearHistory();
    uiManager.hideDialog();
  });
}

async function getStarterDisplaySnapshot(page) {
  return page.evaluate(() => {
    const renderState = {
      map: sceneManager.getCurrentMap(),
      player: playerController.getPlayerState(),
      npcs: sceneManager.getRenderState().npcs,
    };

    return mapRenderer.collectCharacters(renderState)
      .filter(char => char.type === 'starter_display')
      .map(char => ({ monsterId: char.monsterId, label: char.label }));
  });
}

async function completeMayorStarterFlowWithKeyboard(page, starterChoiceIndex = 1) {
  await startNpcDialog(page, 'npc_mayor');

  await advanceDialogWithKeyboard(page, 5);
  await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 2);
  await dispatchGameKey(page, 'Enter');
  await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_give_starter');

  await advanceDialogWithKeyboard(page, 2);
  await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 3);

  for (let i = 0; i < starterChoiceIndex; i++) {
    await dispatchGameKey(page, 'ArrowDown');
  }

  await dispatchGameKey(page, 'Enter');

  const confirmDialogId = ['mayor_confirm_fire', 'mayor_confirm_water', 'mayor_confirm_grass'][starterChoiceIndex] || 'mayor_confirm_water';
  await page.waitForFunction((targetDialogId) => dialogSystem.currentDialogId === targetDialogId, confirmDialogId);

  await advanceDialogWithKeyboard(page, 3);
  await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 2);
  await dispatchGameKey(page, 'Enter');
  await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_receive_monster');

  await advanceDialogWithKeyboard(page, 4);
  await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 1);
  await dispatchGameKey(page, 'Enter');
  await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_post_starter');

  await advanceDialogWithKeyboard(page, 5);
  await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 1);
  await dispatchGameKey(page, 'Enter');
  await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_end');

  await dispatchGameKey(page, 'Enter');
  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP' && dialogSystem.isActive === false && uiManager.dialogVisible === false);
}

async function forceSuccessfulFlee(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const originalRandom = Math.random;
      const originalSpeed = damageCalculator.calculateEffectiveSpeed;

      const handler = () => {
        Math.random = originalRandom;
        damageCalculator.calculateEffectiveSpeed = originalSpeed;
        resolve(true);
      };

      eventBus.on(GameEvents.BATTLE_END, handler);
      Math.random = () => 0;
      damageCalculator.calculateEffectiveSpeed = () => 120;
      battleSystem.playerFlee();
    });
  });

  await page.waitForFunction(() => battleUI.currentMenu?.type === 'battle_result');
  await page.evaluate(() => {
    battleUI.handleBattleResultSelection({ action: 'close_result' });
  });
}

test.describe('精灵冒险项目回归', () => {
  test('模块集成测试页应全部通过', async ({ page }) => {
    await page.goto('/test.html?target=dist');
    await page.getByRole('button', { name: '运行所有测试' }).click();

    await expect(page.locator('.summary')).toContainText('所有测试通过', { timeout: 15000 });
    await expect(page.locator('.test-item.fail')).toHaveCount(0);

    const summaryText = await page.locator('.summary').textContent();
    expect(summaryText).toContain('失败)');
    expect(summaryText).toContain('0 失败');
  });

  test('游戏启动后应完成标题态初始化', async ({ page }) => {
    await gotoGame(page);

    const snapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      playerPartySize: gameStateMachine.getGameState().player.party.length,
      currentMapId: gameStateMachine.getGameState().currentMapId,
      canvasWidth: document.getElementById('game-canvas')?.width,
      canvasHeight: document.getElementById('game-canvas')?.height,
      uiInitialized: uiManager.initialized,
      menuInitialized: menuUI.initialized,
      dialogNodesCount: Object.keys(window.DialogNodes || {}).length,
    }));

    expect(snapshot.state).toBe('TITLE');
    expect(snapshot.playerPartySize).toBeGreaterThan(0);
    expect(snapshot.currentMapId).toBe('town_01');
    expect(snapshot.canvasWidth).toBe(800);
    expect(snapshot.canvasHeight).toBe(600);
    expect(snapshot.uiInitialized).toBe(true);
    expect(snapshot.menuInitialized).toBe(true);
    expect(snapshot.dialogNodesCount).toBeGreaterThan(0);
  });

  test('按 Enter 后应进入地图态并初始化地图系统', async ({ page }) => {
    await gotoGame(page);

    await page.keyboard.press('Enter');
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');

    const snapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      mapInitialized: mapSystem.initialized,
      playerLocation: gameStateMachine.getGameState().player.location,
      currentMapId: gameStateMachine.getGameState().currentMapId,
      renderMapId: mapSystem.getCurrentMap()?.id,
    }));

    expect(snapshot.state).toBe('MAP');
    expect(snapshot.mapInitialized).toBe(true);
    expect(snapshot.currentMapId).toBe('town_01');
    expect(snapshot.renderMapId).toBe('town_01');
    expect(snapshot.playerLocation).toEqual({ x: 15, y: 15 });
  });

  test('地图态按 Escape 应打开菜单，再次按下应关闭菜单', async ({ page }) => {
    await startMapGame(page);

    await openMapMenu(page);

    let snapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      menuOpen: menuUI.isOpen(),
      menuState: menuUI.getState(),
      firstItem: menuUI.currentMenu?.items?.[0]?.text,
    }));

    expect(snapshot.state).toBe('MENU');
    expect(snapshot.menuOpen).toBe(true);
    expect(snapshot.menuState).toBe('main_menu');
    expect(snapshot.firstItem).toBe('继续游戏');

    await closeMapMenu(page);

    snapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      menuOpen: menuUI.isOpen(),
    }));

    expect(snapshot.menuOpen).toBe(false);
    expect(snapshot.state).toBe('MAP');
  });

  test('地图菜单关闭后进入战斗时不应残留旧菜单状态', async ({ page }) => {
    await startMapGame(page);

    await openMapMenu(page);
    await closeMapMenu(page);

    const beforeBattle = await page.evaluate(() => ({
      mapMenuOpen: menuUI.isOpen(),
      mapMenuState: menuUI.getState(),
      battleMenuType: battleUI.currentMenu?.type ?? null,
      gameState: gameStateMachine.getCurrentState(),
    }));

    expect(beforeBattle.mapMenuOpen).toBe(false);
    expect(beforeBattle.mapMenuState).toBe('closed');
    expect(beforeBattle.battleMenuType).toBeNull();
    expect(beforeBattle.gameState).toBe('MAP');

    await prepareWildBattle(page, 'water_turtle', 5);

    const inBattle = await page.evaluate(() => ({
      gameState: gameStateMachine.getCurrentState(),
      mapMenuOpen: menuUI.isOpen(),
      mapMenuState: menuUI.getState(),
      battleState: battleSystem.state,
      battleMenuType: battleUI.currentMenu?.type,
      battleUIState: battleUI.state,
    }));

    expect(inBattle.gameState).toBe('BATTLE');
    expect(inBattle.mapMenuOpen).toBe(false);
    expect(inBattle.mapMenuState).toBe('closed');
    expect(inBattle.battleState).toBe('player_turn');
    expect(inBattle.battleMenuType).toBe('action');
    expect(inBattle.battleUIState).toBe('selecting_action');
  });

  test('菜单关闭后经历战斗返回地图，仍可重新打开地图菜单', async ({ page }) => {
    await startMapGame(page);

    await openMapMenu(page);
    await closeMapMenu(page);

    await prepareWildBattle(page, 'grass_dragon', 5);
    await forceSuccessfulFlee(page);
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');

    const afterBattle = await page.evaluate(() => ({
      gameState: gameStateMachine.getCurrentState(),
      mapMenuOpen: menuUI.isOpen(),
      mapMenuState: menuUI.getState(),
      battleMenuType: battleUI.currentMenu?.type ?? null,
      battleUIState: battleUI.state,
      battleState: battleSystem.state,
    }));

    expect(afterBattle.gameState).toBe('MAP');
    expect(afterBattle.mapMenuOpen).toBe(false);
    expect(afterBattle.mapMenuState).toBe('closed');
    expect(afterBattle.battleMenuType).toBeNull();
    expect(afterBattle.battleUIState).toBe('idle');
    expect(afterBattle.battleState).toBe('idle');

    await openMapMenu(page);

    const reopened = await page.evaluate(() => ({
      gameState: gameStateMachine.getCurrentState(),
      mapMenuOpen: menuUI.isOpen(),
      mapMenuState: menuUI.getState(),
      firstItem: menuUI.currentMenu?.items?.[0]?.text,
    }));

    expect(reopened.gameState).toBe('MENU');
    expect(reopened.mapMenuOpen).toBe(true);
    expect(reopened.mapMenuState).toBe('main_menu');
    expect(reopened.firstItem).toBe('继续游戏');
  });

  test('对话系统应能按节点展示并推进欢迎对话', async ({ page }) => {
    await gotoGame(page);

    const firstLine = await page.evaluate(() => {
      dialogSystem.startDialogById('welcome');
      return {
        active: dialogSystem.isActive,
        dialogId: dialogSystem.currentDialogId,
        speaker: uiManager.currentDialog?.speaker,
        text: uiManager.currentDialog?.text,
      };
    });

    expect(firstLine.active).toBe(true);
    expect(firstLine.dialogId).toBe('welcome');
    expect(firstLine.speaker).toBe('村民');
    expect(firstLine.text).toContain('欢迎来到新手村');

    const nextLine = await page.evaluate(() => {
      eventBus.emit(GameEvents.DIALOG_NEXT);
      return {
        index: dialogSystem.currentLineIndex,
        text: uiManager.currentDialog?.text,
      };
    });

    expect(nextLine.index).toBe(1);
    expect(nextLine.text).toContain('这里是你冒险的起点');
  });

  test('与村民对话应完整经历对话前、对话中和对话完成阶段', async ({ page }) => {
    await startMapGame(page);

    const before = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogActive: dialogSystem.isActive,
      currentDialogId: dialogSystem.currentDialogId,
      dialogVisible: uiManager.dialogVisible,
      currentDialog: uiManager.currentDialog,
    }));

    expect(before.state).toBe('MAP');
    expect(before.dialogActive).toBe(false);
    expect(before.currentDialogId).toBeNull();
    expect(before.dialogVisible).toBe(false);
    expect(before.currentDialog).toBeNull();

    await startNpcDialog(page, 'npc_01');

    const duringStart = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogActive: dialogSystem.isActive,
      dialogId: dialogSystem.currentDialogId,
      lineIndex: dialogSystem.currentLineIndex,
      speaker: uiManager.currentDialog?.speaker,
      text: uiManager.currentDialog?.text,
    }));

    expect(duringStart.state).toBe('DIALOG');
    expect(duringStart.dialogActive).toBe(true);
    expect(duringStart.dialogId).toBe('welcome');
    expect(duringStart.lineIndex).toBe(0);
    expect(duringStart.speaker).toBe('村民');
    expect(duringStart.text).toContain('欢迎来到新手村');

    await dialogNext(page);
    const duringMiddle = await page.evaluate(() => ({
      lineIndex: dialogSystem.currentLineIndex,
      text: uiManager.currentDialog?.text,
    }));

    expect(duringMiddle.lineIndex).toBe(1);
    expect(duringMiddle.text).toContain('这里是你冒险的起点');

    await dialogNext(page);
    const duringLast = await page.evaluate(() => ({
      lineIndex: dialogSystem.currentLineIndex,
      text: uiManager.currentDialog?.text,
    }));

    expect(duringLast.lineIndex).toBe(2);
    expect(duringLast.text).toContain('先去拜访一下村长');

    await dialogNext(page);
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP' && dialogSystem.isActive === false);

    const after = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogActive: dialogSystem.isActive,
      currentDialogId: dialogSystem.currentDialogId,
      lineIndex: dialogSystem.currentLineIndex,
      dialogVisible: uiManager.dialogVisible,
      currentDialog: uiManager.currentDialog,
    }));

    expect(after.state).toBe('MAP');
    expect(after.dialogActive).toBe(false);
    expect(after.currentDialogId).toBeNull();
    expect(after.lineIndex).toBe(0);
    expect(after.dialogVisible).toBe(false);
    expect(after.currentDialog).toBeNull();
  });

  test('与村长完整对话后应获得初始怪兽、物品并开启任务', async ({ page }) => {
    await startMapGame(page);

    await page.evaluate(() => {
      const gameState = gameStateMachine.getGameState();
      gameState.flags = { quest_main_01_completed: true };
      gameState.player.party = [];
      gameState.player.inventory = [];
      gameState.player.quests = [];
      gameStateMachine.updateGameState({ flags: gameState.flags });
      gameStateMachine.updatePlayer({
        party: gameState.player.party,
        inventory: gameState.player.inventory,
        quests: gameState.player.quests,
      });
      if (typeof questManager !== 'undefined') {
        questManager.quests = [];
        questManager.completedQuests = ['quest_main_01'];
        questManager.saveToGameState?.();
      }
      dialogSystem.clearHistory();
      uiManager.hideDialog();
    });

    const before = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      flags: { ...(gameStateMachine.getGameState().flags || {}) },
      partySize: gameStateMachine.getGameState().player.party.length,
      inventorySize: gameStateMachine.getGameState().player.inventory.length,
      questCount: (gameStateMachine.getGameState().player.quests || []).length,
      dialogActive: dialogSystem.isActive,
    }));

    expect(before.state).toBe('MAP');
    expect(before.partySize).toBe(0);
    expect(before.inventorySize).toBe(0);
    expect(before.questCount).toBe(0);
    expect(before.dialogActive).toBe(false);
    expect(before.flags.quest_main_01_completed).toBe(true);
    expect(before.flags.received_starter).toBeUndefined();

    await startNpcDialog(page, 'npc_mayor');

    const mayorStart = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogId: dialogSystem.currentDialogId,
      lineIndex: dialogSystem.currentLineIndex,
      speaker: uiManager.currentDialog?.speaker,
      text: uiManager.currentDialog?.text,
    }));

    expect(mayorStart.state).toBe('DIALOG');
    expect(mayorStart.dialogId).toBe('mayor_greeting');
    expect(mayorStart.lineIndex).toBe(0);
    expect(mayorStart.speaker).toBe('村长');
    expect(mayorStart.text).toContain('欢迎来到和平村');

    await dialogNext(page, 5);
    const greetingChoices = await page.evaluate(() => ({
      dialogId: dialogSystem.currentDialogId,
      lineIndex: dialogSystem.currentLineIndex,
      choices: dialogSystem.currentNode?.choices?.map(choice => choice.text) || [],
    }));

    expect(greetingChoices.dialogId).toBe('mayor_greeting');
    expect(greetingChoices.lineIndex).toBe(5);
    expect(greetingChoices.choices).toEqual(['好的，我准备好了！', '让我再考虑一下...']);

    await chooseDialog(page, 0);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_give_starter' && dialogSystem.currentLineIndex === 0);

    const starterOffer = await page.evaluate(() => ({
      dialogId: dialogSystem.currentDialogId,
      speaker: uiManager.currentDialog?.speaker,
      text: uiManager.currentDialog?.text,
    }));

    expect(starterOffer.dialogId).toBe('mayor_give_starter');
    expect(starterOffer.speaker).toBe('村长');
    expect(starterOffer.text).toContain('太好了');

    await dialogNext(page, 2);
    const starterChoices = await page.evaluate(() => ({
      lineIndex: dialogSystem.currentLineIndex,
      choices: dialogSystem.currentNode?.choices?.map(choice => choice.text) || [],
    }));

    expect(starterChoices.lineIndex).toBe(2);
    expect(starterChoices.choices).toContain('💧 选择水龙 (水属性)');

    await chooseDialog(page, 1);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_confirm_water' && dialogSystem.currentLineIndex === 0);

    const confirmWater = await page.evaluate(() => ({
      dialogId: dialogSystem.currentDialogId,
      selectedWater: gameStateMachine.getGameState().flags.selected_water,
      text: uiManager.currentDialog?.text,
    }));

    expect(confirmWater.dialogId).toBe('mayor_confirm_water');
    expect(confirmWater.selectedWater).toBe(true);
    expect(confirmWater.text).toContain('你选择了水龙');

    await dialogNext(page, 3);
    const confirmChoices = await page.evaluate(() => ({
      lineIndex: dialogSystem.currentLineIndex,
      choices: dialogSystem.currentNode?.choices?.map(choice => choice.text) || [],
    }));

    expect(confirmChoices.lineIndex).toBe(3);
    expect(confirmChoices.choices).toEqual(['就叫小水吧！', '我想自己起名字...']);

    await chooseDialog(page, 0);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_receive_monster' && dialogSystem.currentLineIndex === 0);

    const receivedMonster = await page.evaluate(() => {
      const party = gameStateMachine.getGameState().player.party;
      return {
        dialogId: dialogSystem.currentDialogId,
        partySize: party.length,
        starterNickname: party[0]?.nickname,
        starterMonsterId: party[0]?.monsterId,
        receivedStarter: gameStateMachine.getGameState().flags.received_starter,
      };
    });

    expect(receivedMonster.dialogId).toBe('mayor_receive_monster');
    expect(receivedMonster.partySize).toBe(1);
    expect(receivedMonster.starterNickname).toBe('小水');
    expect(receivedMonster.starterMonsterId).toBe('water_dragon');
    expect(receivedMonster.receivedStarter).toBe(true);

    await dialogNext(page, 4);
    const receiveChoices = await page.evaluate(() => ({
      lineIndex: dialogSystem.currentLineIndex,
      choices: dialogSystem.currentNode?.choices?.map(choice => choice.text) || [],
    }));

    expect(receiveChoices.lineIndex).toBe(4);
    expect(receiveChoices.choices).toEqual(['谢谢村长！']);

    await chooseDialog(page, 0);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_post_starter' && dialogSystem.currentLineIndex === 0);

    const afterItems = await page.evaluate(() => {
      const inventory = gameStateMachine.getGameState().player.inventory;
      const potion = inventory.find(item => item.itemId === 'potion');
      const pokeball = inventory.find(item => item.itemId === 'pokeball');
      return {
        dialogId: dialogSystem.currentDialogId,
        potionQty: potion?.quantity || 0,
        pokeballQty: pokeball?.quantity || 0,
      };
    });

    expect(afterItems.dialogId).toBe('mayor_post_starter');
    expect(afterItems.potionQty).toBe(5);
    expect(afterItems.pokeballQty).toBe(10);

    await dialogNext(page, 5);
    const postStarterChoices = await page.evaluate(() => ({
      lineIndex: dialogSystem.currentLineIndex,
      choices: dialogSystem.currentNode?.choices?.map(choice => choice.text) || [],
    }));

    expect(postStarterChoices.lineIndex).toBe(5);
    expect(postStarterChoices.choices).toEqual(['明白了！']);

    await chooseDialog(page, 0);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_end' && dialogSystem.currentLineIndex === 0);

    const questStarted = await page.evaluate(() => ({
      dialogId: dialogSystem.currentDialogId,
      questFlag: gameStateMachine.getGameState().flags.quest_main_02_started,
      quests: (gameStateMachine.getGameState().player.quests || []).map(quest => ({ id: quest.id, status: quest.status })),
    }));

    expect(questStarted.dialogId).toBe('mayor_end');
    expect(questStarted.questFlag ?? true).toBe(true);
    expect(questStarted.quests.some(quest => quest.id === 'quest_main_02')).toBe(true);

    await dialogNext(page);
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP' && dialogSystem.isActive === false);

    const after = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogActive: dialogSystem.isActive,
      currentDialogId: dialogSystem.currentDialogId,
      dialogVisible: uiManager.dialogVisible,
      historyCount: dialogSystem.getHistory().length,
      questFlag: gameStateMachine.getGameState().flags.quest_main_02_started,
    }));

    expect(after.state).toBe('MAP');
    expect(after.dialogActive).toBe(false);
    expect(after.currentDialogId).toBeNull();
    expect(after.dialogVisible).toBe(false);
    expect(after.historyCount).toBe(5);
    expect(after.questFlag).toBe(true);
  });

  test('村长默认命名路径应把选择的怪兽加入队伍，后续再次交互应提示已选择', async ({ page }) => {
    await startMapGame(page);

    await page.evaluate(() => {
      const gameState = gameStateMachine.getGameState();
      gameState.flags = { quest_main_01_completed: true };
      gameState.player.party = [];
      gameState.player.inventory = [];
      gameState.player.quests = [];
      gameStateMachine.updateGameState({ flags: gameState.flags });
      gameStateMachine.updatePlayer({
        party: gameState.player.party,
        inventory: gameState.player.inventory,
        quests: gameState.player.quests,
      });
      dialogSystem.clearHistory();
      uiManager.hideDialog();
    });

    await startNpcDialog(page, 'npc_mayor');
    await dialogNext(page, 5);
    await chooseDialog(page, 0);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_give_starter');
    await dialogNext(page, 2);
    await chooseDialog(page, 1);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_confirm_water');
    await dialogNext(page, 3);
    await chooseDialog(page, 1);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_name_input');
    await dialogNext(page);
    await chooseDialog(page, 0);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_receive_monster');
    await dialogNext(page, 4);
    await chooseDialog(page, 0);
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_post_starter');

    const afterChoose = await page.evaluate(() => ({
      party: gameStateMachine.getGameState().player.party.map(monster => ({
        monsterId: monster.monsterId,
        nickname: monster.nickname,
      })),
      receivedStarter: gameStateMachine.getGameState().flags.received_starter,
      starterMonsterId: gameStateMachine.getGameState().flags.starter_monster_id,
      starterNickname: gameStateMachine.getGameState().flags.starter_monster_nickname,
      currentDialogId: dialogSystem.currentDialogId,
      currentText: uiManager.currentDialog?.text,
    }));

    expect(afterChoose.party).toEqual([{ monsterId: 'water_dragon', nickname: '小水' }]);
    expect(afterChoose.receivedStarter).toBe(true);
    expect(afterChoose.starterMonsterId).toBe('water_dragon');
    expect(afterChoose.starterNickname).toBe('小水');
    expect(afterChoose.currentDialogId).toBe('mayor_post_starter');
    expect(afterChoose.currentText).toContain('你已经选好了自己的第一只怪兽');

    await dialogSystemEndToMap(page);
    await startNpcDialog(page, 'npc_mayor');

    const revisit = await page.evaluate(() => ({
      currentDialogId: dialogSystem.currentDialogId,
      currentText: uiManager.currentDialog?.text,
    }));

    expect(revisit.currentDialogId).toBe('mayor_post_starter');
    expect(revisit.currentText).toContain('你已经选好了自己的第一只怪兽');
  });

  test('战斗状态栏渲染后不应泄漏画布阴影和对齐状态', async ({ page }) => {
    await gotoGame(page);

    const snapshot = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      uiManager.ctx = ctx;

      ctx.shadowBlur = 3;
      ctx.shadowColor = '#123456';
      ctx.textAlign = 'left';
      uiManager.renderHPBar(10, 20, 100, 30, 50, true);
      const afterHp = {
        shadowBlur: ctx.shadowBlur,
        shadowColor: ctx.shadowColor,
        textAlign: ctx.textAlign,
      };

      ctx.shadowBlur = 2;
      ctx.shadowColor = '#654321';
      ctx.textAlign = 'left';
      uiManager.renderPPBar(10, 50, 100, 10, 20);
      const afterPp = {
        shadowBlur: ctx.shadowBlur,
        shadowColor: ctx.shadowColor,
        textAlign: ctx.textAlign,
      };

      return { afterHp, afterPp };
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot.afterHp).toEqual({ shadowBlur: 3, shadowColor: '#123456', textAlign: 'left' });
    expect(snapshot.afterPp).toEqual({ shadowBlur: 2, shadowColor: '#654321', textAlign: 'left' });
  });

  test('与村长对话时应能使用真实键盘输入选择并正常关闭对话框', async ({ page }) => {
    await startMapGame(page);

    await page.evaluate(() => {
      const gameState = gameStateMachine.getGameState();
      gameState.flags = { quest_main_01_completed: true };
      gameState.player.party = [];
      gameState.player.inventory = [];
      gameState.player.quests = [];
      gameStateMachine.updateGameState({ flags: gameState.flags });
      gameStateMachine.updatePlayer({
        party: gameState.player.party,
        inventory: gameState.player.inventory,
        quests: gameState.player.quests,
      });
      if (typeof questManager !== 'undefined') {
        questManager.quests = [];
        questManager.completedQuests = ['quest_main_01'];
        questManager.saveToGameState?.();
      }
      dialogSystem.clearHistory();
      uiManager.hideDialog();
    });

    await startNpcDialog(page, 'npc_mayor');

    await advanceDialogWithKeyboard(page, 5);
    await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 2);

    let choiceSnapshot = await page.evaluate(() => ({
      selectedChoice: uiManager.currentDialog?.selectedChoice,
      choices: uiManager.currentDialog?.choices?.map(choice => choice.text) || [],
    }));

    expect(choiceSnapshot.selectedChoice).toBe(0);
    expect(choiceSnapshot.choices).toEqual(['好的，我准备好了！', '让我再考虑一下...']);

    await dispatchGameKey(page, 'Enter');
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_give_starter');

    await advanceDialogWithKeyboard(page, 2);
    await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 3);

    await dispatchGameKey(page, 'ArrowDown');
    choiceSnapshot = await page.evaluate(() => ({
      selectedChoice: uiManager.currentDialog?.selectedChoice,
      choices: uiManager.currentDialog?.choices?.map(choice => choice.text) || [],
    }));

    expect(choiceSnapshot.selectedChoice).toBe(1);
    expect(choiceSnapshot.choices[1]).toContain('水龙');

    await dispatchGameKey(page, 'Enter');
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_confirm_water');

    await advanceDialogWithKeyboard(page, 3);
    await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 2);
    await dispatchGameKey(page, 'Enter');
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_receive_monster');

    await advanceDialogWithKeyboard(page, 4);
    await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 1);
    await dispatchGameKey(page, 'Enter');
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_post_starter');

    await advanceDialogWithKeyboard(page, 5);
    await page.waitForFunction(() => Array.isArray(uiManager.currentDialog?.choices) && uiManager.currentDialog.choices.length === 1);
    await dispatchGameKey(page, 'Enter');
    await page.waitForFunction(() => dialogSystem.currentDialogId === 'mayor_end');

    const beforeClose = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogId: dialogSystem.currentDialogId,
      dialogVisible: uiManager.dialogVisible,
      questStarted: gameStateMachine.getGameState().player.quests?.some(quest => quest.id === 'quest_main_02') || false,
    }));

    expect(beforeClose.state).toBe('DIALOG');
    expect(beforeClose.dialogId).toBe('mayor_end');
    expect(beforeClose.dialogVisible).toBe(true);
    expect(beforeClose.questStarted).toBe(true);

    await dispatchGameKey(page, 'Enter');
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP' && dialogSystem.isActive === false && uiManager.dialogVisible === false);

    const afterClose = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogActive: dialogSystem.isActive,
      dialogId: dialogSystem.currentDialogId,
      dialogVisible: uiManager.dialogVisible,
    }));

    expect(afterClose.state).toBe('MAP');
    expect(afterClose.dialogActive).toBe(false);
    expect(afterClose.dialogId).toBeNull();
    expect(afterClose.dialogVisible).toBe(false);
  });

  test('村长家在领取前应展示三只可选初始精灵，领取后不再展示', async ({ page }) => {
    await startMapGame(page);

    await page.evaluate(() => {
      const gameState = gameStateMachine.getGameState();
      gameState.flags = { quest_main_01_completed: true };
      gameStateMachine.updateGameState({ flags: gameState.flags });
      mapSystem.teleportPlayer('house_01', 4, 6);
    });

    await page.waitForFunction(() => gameStateMachine.getGameState().currentMapId === 'house_01');

    let snapshot = await page.evaluate(() => {
      const renderState = {
        map: sceneManager.getCurrentMap(),
        player: playerController.getPlayerState(),
        npcs: sceneManager.getRenderState().npcs,
      };
      const displays = mapRenderer.collectCharacters(renderState)
        .filter(char => char.type === 'starter_display')
        .map(char => ({ monsterId: char.monsterId, label: char.label }));
      return {
        currentMapId: gameStateMachine.getGameState().currentMapId,
        mapDisplays: sceneManager.getCurrentMap().starterDisplays?.map(display => display.monsterId) || [],
        visibleDisplays: displays,
      };
    });

    expect(snapshot.currentMapId).toBe('house_01');
    expect(snapshot.mapDisplays).toEqual(['fire_dragon', 'water_dragon', 'grass_dragon']);
    expect(snapshot.visibleDisplays).toEqual([
      { monsterId: 'fire_dragon', label: '火龙' },
      { monsterId: 'water_dragon', label: '水龙' },
      { monsterId: 'grass_dragon', label: '草龙' },
    ]);

    snapshot = await page.evaluate(() => {
      const gameState = gameStateMachine.getGameState();
      gameState.flags.received_starter = true;
      gameStateMachine.updateGameState({ flags: gameState.flags });

      const renderState = {
        map: sceneManager.getCurrentMap(),
        player: playerController.getPlayerState(),
        npcs: sceneManager.getRenderState().npcs,
      };

      return {
        visibleDisplays: mapRenderer.collectCharacters(renderState)
          .filter(char => char.type === 'starter_display')
          .length,
      };
    });

    expect(snapshot.visibleDisplays).toBe(0);
  });

  test('系统回归流程：新手引导到领取初始精灵应闭环通过', async ({ page }) => {
    await test.step('进入地图并完成村民引导对话', async () => {
      await startMapGame(page);

      const beforeDialog = await page.evaluate(() => ({
        state: gameStateMachine.getCurrentState(),
        dialogActive: dialogSystem.isActive,
      }));

      expect(beforeDialog.state).toBe('MAP');
      expect(beforeDialog.dialogActive).toBe(false);

      await startNpcDialog(page, 'npc_01');
      await dialogNext(page, 3);
      await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP' && dialogSystem.isActive === false);
    });

    await test.step('进入村长家并确认三只初始精灵展示', async () => {
      await resetMayorStarterScenario(page);

      await page.evaluate(() => {
        mapSystem.teleportPlayer('house_01', 4, 6);
      });

      await page.waitForFunction(() => gameStateMachine.getGameState().currentMapId === 'house_01');

      const displays = await getStarterDisplaySnapshot(page);
      expect(displays).toEqual([
        { monsterId: 'fire_dragon', label: '火龙' },
        { monsterId: 'water_dragon', label: '水龙' },
        { monsterId: 'grass_dragon', label: '草龙' },
      ]);
    });

    await test.step('完成村长对话并领取水龙', async () => {
      await completeMayorStarterFlowWithKeyboard(page, 1);

      const snapshot = await page.evaluate(() => {
        const player = gameStateMachine.getGameState().player;
        const potion = player.inventory.find(item => item.itemId === 'potion');
        const pokeball = player.inventory.find(item => item.itemId === 'pokeball');
        return {
          state: gameStateMachine.getCurrentState(),
          partySize: player.party.length,
          starterMonsterId: player.party[0]?.monsterId,
          starterNickname: player.party[0]?.nickname,
          questIds: (player.quests || []).map(quest => quest.id),
          potionQty: potion?.quantity || 0,
          pokeballQty: pokeball?.quantity || 0,
          receivedStarter: gameStateMachine.getGameState().flags.received_starter,
          selectedWater: gameStateMachine.getGameState().flags.selected_water,
        };
      });

      expect(snapshot.state).toBe('MAP');
      expect(snapshot.partySize).toBe(1);
      expect(snapshot.starterMonsterId).toBe('water_dragon');
      expect(snapshot.starterNickname).toBe('小水');
      expect(snapshot.questIds).toContain('quest_main_02');
      expect(snapshot.potionQty).toBe(5);
      expect(snapshot.pokeballQty).toBe(10);
      expect(snapshot.receivedStarter).toBe(true);
      expect(snapshot.selectedWater).toBe(true);
    });

    await test.step('领取后展示精灵应隐藏', async () => {
      const displays = await getStarterDisplaySnapshot(page);
      expect(displays).toEqual([]);
    });
  });

  test('遭遇野生怪兽后应进入战斗并打开行动菜单', async ({ page }) => {
    await prepareWildBattle(page);

    const snapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      battleState: battleSystem.state,
      isWildBattle: battleSystem.isWildBattle,
      waitingForInput: battleSystem.waitingForInput,
      enemyName: battleSystem.currentEnemyMonster?.name,
      playerName: battleSystem.currentPlayerMonster?.nickname || battleSystem.currentPlayerMonster?.name,
      uiState: battleUI.state,
      menuType: battleUI.currentMenu?.type,
      menuItems: battleUI.currentMenu?.items?.map(item => item.text) || [],
    }));

    expect(snapshot.state).toBe('BATTLE');
    expect(snapshot.battleState).toBe('player_turn');
    expect(snapshot.isWildBattle).toBe(true);
    expect(snapshot.waitingForInput).toBe(true);
    expect(snapshot.enemyName).toBeTruthy();
    expect(snapshot.playerName).toBeTruthy();
    expect(snapshot.uiState).toBe('selecting_action');
    expect(snapshot.menuType).toBe('action');
    expect(snapshot.menuItems).toEqual(['技能', '背包', '怪兽', '逃跑']);
  });

  test('玩家使用技能后应扣除PP并对敌人造成伤害', async ({ page }) => {
    await prepareWildBattle(page);

    const before = await page.evaluate(() => {
      damageCalculator.checkHit = () => true;
      damageCalculator.getRandomFactor = () => 1;
      damageCalculator.checkCritical = () => false;
      battleSystem.executeEnemyTurn = () => {};

      const skillId = battleSystem.currentPlayerMonster.skills[0].skillId;
      const enemyHp = battleSystem.currentEnemyMonster.stats.hp;
      const playerPp = battleSystem.currentPlayerMonster.skills[0].pp;

      battleSystem.playerUseSkill(skillId);

      return { skillId, enemyHp, playerPp };
    });

    await page.waitForTimeout(1200);

    const after = await page.evaluate(({ skillId }) => ({
      enemyHp: battleSystem.currentEnemyMonster.stats.hp,
      playerPp: battleSystem.currentPlayerMonster.skills.find(skill => skill.skillId === skillId)?.pp,
      battleLogTail: battleSystem.battleLog.slice(-4),
    }), { skillId: before.skillId });

    expect(after.enemyHp).toBeLessThan(before.enemyHp);
    expect(after.playerPp).toBe(before.playerPp - 1);
    expect(after.battleLogTail.some(message => message.includes('受到了'))).toBe(true);
  });

  test('战斗胜利后应完成经验结算与奖励发放', async ({ page }) => {
    await startMapGame(page);

    const setup = await page.evaluate(() => {
      const player = gameStateMachine.getGameState().player.party[0];
      const enemy = battleSystem.createEnemyMonster('water_turtle', 5);

      enemy.stats.hp = 1;
      enemy.stats.maxHp = 20;
      enemy.expReward = 120;
      enemy.drops = [{ itemId: 'potion', chance: 1 }];

      battleSystem.startTrainerBattle(gameStateMachine.getGameState().player.party, [enemy]);

      return {
        beforeLevel: player.level,
        beforeExp: player.exp,
      };
    });

    await skipBattleIntro(page);

    const battleResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        damageCalculator.checkHit = () => true;
        damageCalculator.getRandomFactor = () => 1;
        damageCalculator.checkCritical = () => false;
        battleSystem.executeEnemyTurn = () => {};

        const handler = (data) => {
          resolve({ result: data.result, exp: data.exp, rewards: data.rewards });
        };

        eventBus.on(GameEvents.BATTLE_END, handler);
        battleSystem.playerUseSkill(battleSystem.currentPlayerMonster.skills[0].skillId);
      });
    });

    await page.waitForFunction(() => battleUI.currentMenu?.type === 'battle_result');

    const snapshot = await page.evaluate(() => {
      const player = gameStateMachine.getGameState().player.party[0];
      return {
        level: player.level,
        exp: player.exp,
        battleState: battleSystem.state,
        battleMenuType: battleUI.currentMenu?.type,
        summary: battleUI.battleResultSummary,
      };
    });

    await page.evaluate(() => {
      battleUI.handleBattleResultSelection({ action: 'close_result' });
    });
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');

    expect(battleResult.result).toBe('victory');
    expect(battleResult.exp).toBe(120);
    expect(battleResult.rewards).toContain('potion');
    expect(snapshot.level).toBeGreaterThan(setup.beforeLevel);
    expect(snapshot.exp).toBeGreaterThanOrEqual(setup.beforeExp);
    expect(snapshot.battleState).toBe('ending');
    expect(snapshot.battleMenuType).toBe('battle_result');
    expect(snapshot.summary?.moneyGained ?? 0).toBeGreaterThan(0);
  });

  test('战斗胜利后选择捕获应进入捕获分支并将怪兽加入队伍', async ({ page }) => {
    await prepareWildBattle(page, 'water_turtle', 5);

    const before = await page.evaluate(() => {
      battleSystem.currentEnemyMonster.stats.hp = 1;
      battleSystem.currentEnemyMonster.stats.maxHp = 20;

      damageCalculator.checkHit = () => true;
      damageCalculator.getRandomFactor = () => 1;
      damageCalculator.checkCritical = () => false;
      battleSystem.executeEnemyTurn = () => {};

      battleSystem.playerUseSkill(battleSystem.currentPlayerMonster.skills[0].skillId);

      return {
        partySize: gameStateMachine.getGameState().player.party.length,
        enemyName: battleSystem.currentEnemyMonster.name,
      };
    });

    await page.waitForFunction(() => typeof battleUI.currentMessage === 'string' && battleUI.currentMessage.includes('是否使用精灵球'));

    const captureResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const originalRandom = Math.random;
        Math.random = () => 0;

        const handler = (data) => {
          Math.random = originalRandom;
          resolve({ result: data.result });
        };

        eventBus.on(GameEvents.BATTLE_END, handler);
        battleUI.confirmMessage();
        battleUI.handleCaptureSelection({ action: 'capture_yes' });
      });
    });

    await page.waitForFunction(() => battleUI.currentMenu?.type === 'battle_result');

    const after = await page.evaluate(() => {
      const party = gameStateMachine.getGameState().player.party;
      const captured = party[party.length - 1];
      return {
        partySize: party.length,
        capturedMonsterId: captured.monsterId,
        capturedName: captured.name,
        battleState: battleSystem.state,
        battleMenuType: battleUI.currentMenu?.type,
      };
    });

    await page.evaluate(() => {
      battleUI.handleBattleResultSelection({ action: 'close_result' });
    });
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');

    expect(captureResult.result).toBe('capture');
    expect(after.partySize).toBe(before.partySize + 1);
    expect(after.capturedMonsterId).toBe('water_turtle');
    expect(after.capturedName).toBe(before.enemyName);
    expect(after.battleState).toBe('ending');
    expect(after.battleMenuType).toBe('battle_result');
  });

  test('玩家逃跑成功后应结束战斗并回到地图态', async ({ page }) => {
    await prepareWildBattle(page, 'grass_dragon', 5);

    await forceSuccessfulFlee(page);
    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');

    const finalState = await page.evaluate(() => ({
      stateAfterBattle: gameStateMachine.getCurrentState(),
      battleState: battleSystem.state,
    }));

    expect(finalState.stateAfterBattle).toBe('MAP');
    expect(finalState.battleState).toBe('idle');
  });

  test('系统回归流程：菜单关闭后进入战斗并恢复到地图菜单应闭环通过', async ({ page }) => {
    await test.step('进入地图并完成菜单开关闭环', async () => {
      await startMapGame(page);
      await openMapMenu(page);
      await closeMapMenu(page);

      const menuSnapshot = await page.evaluate(() => ({
        state: gameStateMachine.getCurrentState(),
        menuOpen: menuUI.isOpen(),
        menuState: menuUI.getState(),
      }));

      expect(menuSnapshot.state).toBe('MAP');
      expect(menuSnapshot.menuOpen).toBe(false);
      expect(menuSnapshot.menuState).toBe('closed');
    });

    await test.step('进入战斗后应切换为战斗菜单并清空地图菜单残留', async () => {
      await page.evaluate(() => {
        battleSystem.startWildBattle('grass_dragon', 5);
      });
      await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'PRE_BATTLE_SELECT');
      await page.waitForFunction(() => battleUI.currentMessage !== null);
      await page.evaluate(() => {
        battleUI.confirmMessage();
      });
      await page.waitForFunction(() => battleUI.currentMenu?.type === 'pre_battle_party');
      await page.evaluate(() => {
        const item = battleUI.currentMenu?.items?.find(entry => entry.monster);
        battleUI.handleMonsterSelection(item);
      });
      await skipBattleIntro(page);

      const battleSnapshot = await page.evaluate(() => ({
        state: gameStateMachine.getCurrentState(),
        mapMenuOpen: menuUI.isOpen(),
        mapMenuState: menuUI.getState(),
        battleState: battleSystem.state,
        battleMenuType: battleUI.currentMenu?.type,
        battleUIState: battleUI.state,
      }));

      expect(battleSnapshot.state).toBe('BATTLE');
      expect(battleSnapshot.mapMenuOpen).toBe(false);
      expect(battleSnapshot.mapMenuState).toBe('closed');
      expect(battleSnapshot.battleState).toBe('player_turn');
      expect(battleSnapshot.battleMenuType).toBe('action');
      expect(battleSnapshot.battleUIState).toBe('selecting_action');
    });

    await test.step('成功逃跑返回地图后应仍可重新打开地图菜单', async () => {
      await forceSuccessfulFlee(page);
      await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');

      const afterBattle = await page.evaluate(() => ({
        state: gameStateMachine.getCurrentState(),
        menuOpen: menuUI.isOpen(),
        menuState: menuUI.getState(),
        battleState: battleSystem.state,
        battleUIState: battleUI.state,
      }));

      expect(afterBattle.state).toBe('MAP');
      expect(afterBattle.menuOpen).toBe(false);
      expect(afterBattle.menuState).toBe('closed');
      expect(afterBattle.battleState).toBe('idle');
      expect(afterBattle.battleUIState).toBe('idle');

      await openMapMenu(page);

      const reopened = await page.evaluate(() => ({
        state: gameStateMachine.getCurrentState(),
        menuOpen: menuUI.isOpen(),
        firstItem: menuUI.currentMenu?.items?.[0]?.text,
      }));

      expect(reopened.state).toBe('MENU');
      expect(reopened.menuOpen).toBe(true);
      expect(reopened.firstItem).toBe('继续游戏');
    });
  });
});

test.describe('大型玩法扩展需求验收', () => {
  test('玩家应以 Lv.1 与图鉴结构开局', async ({ page }) => {
    await gotoGame(page);

    const snapshot = await page.evaluate(() => ({
      level: gameStateMachine.getGameState().player.level,
      exp: gameStateMachine.getGameState().player.exp,
      expToNext: gameStateMachine.getGameState().player.expToNext,
      pokedexSeen: gameStateMachine.getGameState().player.pokedex?.seen,
      pokedexOwned: gameStateMachine.getGameState().player.pokedex?.owned,
    }));

    expect(snapshot.level).toBe(1);
    expect(snapshot.exp).toBe(0);
    expect(snapshot.expToNext).toBeGreaterThan(0);
    expect(Array.isArray(snapshot.pokedexSeen)).toBe(true);
    expect(Array.isArray(snapshot.pokedexOwned)).toBe(true);
  });

  test('主菜单应新增图鉴入口并可进入图鉴页', async ({ page }) => {
    await startMapGame(page);
    await openMapMenu(page);

    const snapshot = await page.evaluate(() => ({
      items: menuUI.currentMenu?.items?.map(item => item.text) || [],
      menuType: menuUI.currentMenu?.type,
    }));

    expect(snapshot.items).toContain('图鉴');

    await page.evaluate(() => {
      const index = menuUI.currentMenu?.items?.findIndex(item => item.text === '图鉴') ?? -1;
      if (index >= 0) {
        menuUI.selectedIndex = index;
        menuUI.confirmSelection();
      }
    });

    await page.waitForFunction(() => menuUI.currentMenu?.type === 'pokedex');
  });

  test('怪兽模板应至少覆盖 10 只且每只具备属性与技能', async ({ page }) => {
    await gotoGame(page);

    const snapshot = await page.evaluate(() => {
      const monsters = Object.values(window.MonsterTemplates || {});
      return {
        count: monsters.length,
        invalid: monsters.filter(monster => !monster.type || !Array.isArray(monster.skills) || monster.skills.length === 0)
          .map(monster => monster.id),
      };
    });

    expect(snapshot.count).toBeGreaterThanOrEqual(10);
    expect(snapshot.invalid).toEqual([]);
  });

  test('遭遇野怪后应先进入战前选怪流程', async ({ page }) => {
    await startMapGame(page);
    await page.evaluate(() => {
      battleSystem.startWildBattle('water_turtle', 5);
    });

    await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'PRE_BATTLE_SELECT');
    await page.waitForFunction(() => battleUI.currentMessage !== null);
    await page.evaluate(() => {
      battleUI.confirmMessage();
    });
    await page.waitForFunction(() => battleUI.currentMenu?.type === 'pre_battle_party');

    const snapshot = await page.evaluate(() => ({
      gameState: gameStateMachine.getCurrentState(),
      menuType: battleUI.currentMenu?.type ?? null,
      state: battleUI.state,
    }));

    expect(snapshot.gameState).toBe('PRE_BATTLE_SELECT');
    expect(snapshot.menuType).toBe('pre_battle_party');
    expect(snapshot.state).toBe('selecting_monster');
  });

  test('战斗胜利后应进入结算面板并展示经验、金额与掉落', async ({ page }) => {
    await prepareWildBattle(page, 'water_turtle', 6);

    await page.evaluate(() => {
      battleSystem.currentEnemyMonster.stats.hp = 1;
      battleSystem.currentEnemyMonster.expReward = 180;
      battleSystem.currentEnemyMonster.drops = [{ itemId: 'water_gem', chance: 1 }];
      damageCalculator.checkHit = () => true;
      damageCalculator.getRandomFactor = () => 1;
      damageCalculator.checkCritical = () => false;
      battleSystem.executeEnemyTurn = () => {};
      battleSystem.playerUseSkill(battleSystem.currentPlayerMonster.skills[0].skillId);
    });

    await page.waitForFunction(() => typeof battleUI.currentMessage === 'string' && battleUI.currentMessage.includes('是否使用精灵球'));
    await page.evaluate(() => {
      battleUI.confirmMessage();
      battleUI.handleCaptureSelection({ action: 'capture_no' });
    });
    await page.waitForFunction(() => battleUI.currentMenu?.type === 'battle_result');

    const snapshot = await page.evaluate(() => ({
      menuType: battleUI.currentMenu?.type,
      resultSummary: battleUI.battleResultSummary,
    }));

    expect(snapshot.menuType).toBe('battle_result');
    expect(snapshot.resultSummary.expGained).toBeGreaterThan(0);
    expect(snapshot.resultSummary.moneyGained).toBeGreaterThan(0);
    expect(snapshot.resultSummary.items.some(item => item.itemId === 'water_gem')).toBe(true);
  });

  test('掉落应进入背包并写入图鉴的已遇到状态', async ({ page }) => {
    await prepareWildBattle(page, 'water_turtle', 6);

    const before = await page.evaluate(() => ({
      inventoryQty: (gameStateMachine.getGameState().player.inventory.find(item => item.itemId === 'water_gem')?.quantity) || 0,
      seen: gameStateMachine.getGameState().player.pokedex?.seen || [],
      owned: gameStateMachine.getGameState().player.pokedex?.owned || [],
    }));

    await page.evaluate(() => {
      battleSystem.currentEnemyMonster.stats.hp = 1;
      battleSystem.currentEnemyMonster.drops = [{ itemId: 'water_gem', chance: 1 }];
      damageCalculator.checkHit = () => true;
      damageCalculator.getRandomFactor = () => 1;
      damageCalculator.checkCritical = () => false;
      battleSystem.executeEnemyTurn = () => {};
      battleSystem.playerUseSkill(battleSystem.currentPlayerMonster.skills[0].skillId);
    });

    await page.waitForFunction(() => typeof battleUI.currentMessage === 'string' && battleUI.currentMessage.includes('是否使用精灵球'));
    await page.evaluate(() => {
      battleUI.confirmMessage();
      battleUI.handleCaptureSelection({ action: 'capture_no' });
    });
    await page.waitForFunction(() => battleUI.currentMenu?.type === 'battle_result');

    const after = await page.evaluate(() => ({
      inventoryQty: (gameStateMachine.getGameState().player.inventory.find(item => item.itemId === 'water_gem')?.quantity) || 0,
      seen: gameStateMachine.getGameState().player.pokedex?.seen || [],
      owned: gameStateMachine.getGameState().player.pokedex?.owned || [],
    }));

    expect(after.inventoryQty).toBe(before.inventoryQty + 1);
    expect(after.seen).toContain('water_turtle');
    expect(after.owned).toEqual(before.owned);
  });
});
