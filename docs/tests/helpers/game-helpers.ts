import { expect, Page } from '@playwright/test';

export async function gotoGame(page: Page) {
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded' });

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

export async function startMapGame(page: Page) {
  await gotoGame(page);
  const currentState = await page.evaluate(() => window.gameStateMachine.getCurrentState());
  if (currentState === 'TITLE') {
    await dispatchGameKey(page, 'Enter');
  }
  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'MAP');
}

export async function dispatchGameKey(page: Page, key: string) {
  await page.evaluate((targetKey) => {
    window.game.handleKeyDown({
      key: targetKey,
      type: 'keydown',
      preventDefault() {},
    });
  }, key);
}

export async function openMapMenu(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => menuUI.isOpen() && gameStateMachine.getCurrentState() === 'MENU');
}

export async function closeMapMenu(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !menuUI.isOpen() && gameStateMachine.getCurrentState() === 'MAP');
}

export async function startNpcDialog(page: Page, npcId: string) {
  await page.evaluate((targetNpcId) => {
    gameStateMachine.pushState(GameState.DIALOG);
    eventBus.emit(GameEvents.DIALOG_START, { npcId: targetNpcId });
  }, npcId);

  await page.waitForFunction(() => gameStateMachine.getCurrentState() === 'DIALOG' && dialogSystem.isActive === true);
}

export async function openShop(page: Page, shopId = 'pokemart_town01') {
  await startMapGame(page);

  await page.evaluate((targetShopId) => {
    gameStateMachine.updatePlayer({
      money: 99999,
      inventory: [],
    });

    inventoryManager.addItem('potion', 3);
    inventoryManager.addItem('monster_ball', 2);

    shopSystem.openShop(targetShopId);
  }, shopId);

  await page.waitForFunction(() => {
    return gameStateMachine.getCurrentState() === 'SHOP' &&
      shopUI.isVisible === true &&
      document.querySelector('#shop-ui') !== null;
  });

  await expect(page.locator('#shop-ui .shop-container')).toBeVisible();
  await page.waitForTimeout(450);
}
