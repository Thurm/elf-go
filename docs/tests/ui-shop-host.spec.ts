import { expect, test } from '@playwright/test';
import { openShop } from './helpers/game-helpers';

test.describe('UI 改造 - ShopUI 宿主层', () => {
  test('商店界面应挂载到 #ui-layer 并随关闭完成清理', async ({ page }) => {
    await openShop(page);

    await expect(page.locator('#ui-layer > #shop-ui')).toHaveCount(1);
    await expect(page.locator('body > #shop-ui')).toHaveCount(0);

    const snapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      isVisible: shopUI.isVisible,
      hostId: document.querySelector('#shop-ui')?.parentElement?.id ?? null,
      currentTab: shopUI.currentTab,
    }));

    expect(snapshot.state).toBe('SHOP');
    expect(snapshot.isVisible).toBe(true);
    expect(snapshot.hostId).toBe('ui-layer');
    expect(snapshot.currentTab).toBe('buy');

    await page.locator('#shop-close-btn').click();
    await page.waitForFunction(() => {
      return gameStateMachine.getCurrentState() === 'MAP' &&
        shopUI.isVisible === false &&
        document.querySelector('#shop-ui') === null;
    });
  });

  test('购买确认弹层应复用 #ui-layer 宿主，出售页应能读取背包内容', async ({ page }) => {
    await openShop(page);

    await page.locator('#shop-items-panel .shop-item').first().click();
    await expect(page.locator('#buy-confirm-btn')).toBeVisible();

    await page.locator('#buy-confirm-btn').click();
    await expect(page.locator('#ui-layer .shop-dialog-overlay')).toHaveCount(1);
    await expect(page.locator('body > .shop-dialog-overlay')).toHaveCount(0);

    const overlaySnapshot = await page.evaluate(() => ({
      overlayHostId: document.querySelector('.shop-dialog-overlay')?.parentElement?.id ?? null,
      overlayCount: document.querySelectorAll('#ui-layer .shop-dialog-overlay').length,
    }));

    expect(overlaySnapshot.overlayHostId).toBe('ui-layer');
    expect(overlaySnapshot.overlayCount).toBe(1);

    await page.locator('#dialog-cancel').click();
    await expect(page.locator('.shop-dialog-overlay')).toHaveCount(0);

    await page.getByRole('button', { name: '出售' }).click();
    await page.waitForFunction(() => shopUI.currentTab === 'sell');
    await expect(page.locator('#shop-items-panel')).toContainText('药水');

    const sellSnapshot = await page.evaluate(() => ({
      currentTab: shopUI.currentTab,
      inventoryCount: inventoryManager.getItems({ filter: 'all' }).length,
    }));

    expect(sellSnapshot.currentTab).toBe('sell');
    expect(sellSnapshot.inventoryCount).toBeGreaterThan(0);
  });
});
