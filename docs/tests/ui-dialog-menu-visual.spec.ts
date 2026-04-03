import { expect, test } from '@playwright/test';
import { closeMapMenu, dispatchGameKey, openMapMenu, startMapGame, startNpcDialog } from './helpers/game-helpers';

test.describe('UI 改造 - 菜单与对话回归', () => {
  test('地图菜单应维持稳定的打开/关闭状态切换', async ({ page }) => {
    await startMapGame(page);
    await openMapMenu(page);

    const openSnapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      isOpen: menuUI.isOpen(),
      menuType: menuUI.currentMenu?.type ?? null,
      firstItem: menuUI.currentMenu?.items?.[0]?.text ?? null,
      itemCount: menuUI.currentMenu?.items?.length ?? 0,
    }));

    expect(openSnapshot.state).toBe('MENU');
    expect(openSnapshot.isOpen).toBe(true);
    expect(openSnapshot.menuType).toBe('main');
    expect(openSnapshot.firstItem).toBe('继续游戏');
    expect(openSnapshot.itemCount).toBeGreaterThan(0);

    await closeMapMenu(page);

    const closeSnapshot = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      isOpen: menuUI.isOpen(),
      menuType: menuUI.currentMenu?.type ?? null,
    }));

    expect(closeSnapshot.state).toBe('MAP');
    expect(closeSnapshot.isOpen).toBe(false);
    expect(closeSnapshot.menuType).toBe(null);
  });

  test('对话框应展示 speaker/text，并可通过键盘推进到下一个节点', async ({ page }) => {
    await startMapGame(page);
    await startNpcDialog(page, 'npc_01');

    await page.waitForFunction(() => uiManager.dialogVisible === true && !!uiManager.currentDialog?.speaker);

    const firstDialog = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      dialogVisible: uiManager.dialogVisible,
      speaker: uiManager.currentDialog?.speaker ?? '',
      textLength: uiManager.currentDialog?.text?.length ?? 0,
      dialogId: dialogSystem.currentDialogId,
      currentPage: uiManager.currentDialog?.currentPage ?? 0,
      text: uiManager.currentDialog?.text ?? '',
    }));

    expect(firstDialog.state).toBe('DIALOG');
    expect(firstDialog.dialogVisible).toBe(true);
    expect(firstDialog.speaker.length).toBeGreaterThan(0);
    expect(firstDialog.textLength).toBeGreaterThan(0);

    await dispatchGameKey(page, 'Enter');
    await page.waitForFunction(({ previousDialogId, previousPage, previousText }) => {
      return dialogSystem.currentDialogId !== previousDialogId ||
        (uiManager.currentDialog?.currentPage ?? 0) !== previousPage ||
        (uiManager.currentDialog?.text ?? '') !== previousText;
    }, {
      previousDialogId: firstDialog.dialogId,
      previousPage: firstDialog.currentPage,
      previousText: firstDialog.text,
    });

    const secondDialog = await page.evaluate(() => ({
      dialogId: dialogSystem.currentDialogId,
      dialogVisible: uiManager.dialogVisible,
      textLength: uiManager.currentDialog?.text?.length ?? 0,
      currentPage: uiManager.currentDialog?.currentPage ?? 0,
      text: uiManager.currentDialog?.text ?? '',
    }));

    expect(secondDialog.dialogVisible).toBe(true);
    expect(
      secondDialog.dialogId !== firstDialog.dialogId ||
      secondDialog.currentPage !== firstDialog.currentPage ||
      secondDialog.text !== firstDialog.text
    ).toBe(true);
    expect(secondDialog.textLength).toBeGreaterThan(0);
  });
});
