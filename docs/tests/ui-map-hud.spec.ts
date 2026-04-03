import { expect, test } from '@playwright/test';
import { startMapGame } from './helpers/game-helpers';

test.describe('UI 改造 - 地图 HUD', () => {
  test('地图 HUD 应返回区域、资金、领队与默认提示', async ({ page }) => {
    await startMapGame(page);

    await page.evaluate(() => {
      gameStateMachine.updatePlayer({
        money: 4321,
        party: [{
          id: 'hud_test_monster',
          name: '测试兽',
          nickname: '测试兽',
          level: 7,
          stats: { hp: 24, maxHp: 30 },
        }],
      });
    });

    await page.waitForFunction(() => {
      const hud = uiManager.getMapHUDState();
      return hud?.visible === true && hud?.money === 4321 && hud?.mapName === '新手村';
    });

    const hud = await page.evaluate(() => uiManager.getMapHUDState());

    expect(hud.visible).toBe(true);
    expect(hud.mapId).toBe('town_01');
    expect(hud.mapName).toBe('新手村');
    expect(hud.money).toBe(4321);
    expect(hud.prompt).toContain('Esc 菜单');
    expect(hud.leadMonster.name).toBe('测试兽');
    expect(hud.leadMonster.hp).toBe(24);
    expect(hud.leadMonster.maxHp).toBe(30);
  });

  test('地图 HUD 应根据 NPC 与传送点切换交互提示', async ({ page }) => {
    await startMapGame(page);

    await page.evaluate(() => {
      playerController.teleportTo(10, 18);
      playerController.player.direction = 'up';
    });

    await page.waitForFunction(() => uiManager.getMapHUDState()?.prompt?.includes('对话'));
    const npcHud = await page.evaluate(() => uiManager.getMapHUDState());
    expect(npcHud.prompt).toContain('对话');

    await page.evaluate(() => {
      playerController.teleportTo(15, 1);
      playerController.player.direction = 'up';
    });

    await page.waitForFunction(() => uiManager.getMapHUDState()?.prompt?.includes('进入区域'));
    const portalHud = await page.evaluate(() => uiManager.getMapHUDState());
    expect(portalHud.prompt).toContain('进入区域');
  });
});
