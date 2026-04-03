import { expect, test } from '@playwright/test';
import { startMapGame } from './helpers/game-helpers';

test.describe('UI 改造 - 地图镜头与切换体验', () => {
  test('镜头应保留 dead zone，小范围位移不立即推镜', async ({ page }) => {
    await startMapGame(page);

    const snapshot = await page.evaluate(() => {
      const before = mapRenderer.getCameraState();
      const player = playerController.getPlayerState();

      mapRenderer.updateCamera(player.x + 0.2, player.y);

      const after = mapRenderer.getCameraState();
      return { before, after };
    });

    expect(snapshot.after.x).toBe(snapshot.before.x);
    expect(snapshot.after.y).toBe(snapshot.before.y);
  });

  test('镜头应平滑追随远距离位移，并在切图完成后 snap 到目标位置', async ({ page }) => {
    await startMapGame(page);

    const cameraMove = await page.evaluate(() => {
      const before = mapRenderer.getCameraState();
      const map = sceneManager.getCurrentMap();
      const nextX = map.width - 3;
      const nextY = map.height - 4;

      playerController.teleportTo(nextX, nextY);
      const player = playerController.getPlayerState();
      mapRenderer.updateCamera(player.x, player.y);

      const after = mapRenderer.getCameraState();
      return { before, after };
    });

    expect(cameraMove.after.x).toBeGreaterThan(cameraMove.before.x);
    expect(cameraMove.after.x).toBeLessThan(cameraMove.after.targetX);
    expect(Math.abs(cameraMove.after.targetX - cameraMove.after.x)).toBeGreaterThan(1);

    const started = await page.evaluate(() => {
      mapSystem.teleportPlayer('house_01', 7, 10);
      return {
        transition: mapRenderer.getTransitionState(),
        locked: playerController.inputLocked,
      };
    });

    expect(started.transition.active).toBe(true);
    expect(started.locked).toBe(true);

    await page.waitForFunction(() => {
      return sceneManager.getCurrentMap()?.id === 'house_01' &&
        mapRenderer.getTransitionState().active === false &&
        playerController.inputLocked === false;
    });

    const completed = await page.evaluate(() => ({
      state: gameStateMachine.getCurrentState(),
      currentMapId: sceneManager.getCurrentMap()?.id,
      hud: uiManager.getMapHUDState(),
      camera: mapRenderer.getCameraState(),
      transition: mapRenderer.getTransitionState(),
    }));

    expect(completed.state).toBe('MAP');
    expect(completed.currentMapId).toBe('house_01');
    expect(completed.hud.mapName).toBe('村长家');
    expect(completed.transition.active).toBe(false);
    expect(completed.camera.x).toBe(completed.camera.targetX);
    expect(completed.camera.y).toBe(completed.camera.targetY);
  });

  test('从新手村进入村长家时应先完成退场，再提交新地图', async ({ page }) => {
    await startMapGame(page);

    const started = await page.evaluate(() => {
      mapSystem.teleportPlayer('house_01', 7, 10);
      return {
        renderMapId: mapRenderer.currentMap?.id,
        sceneMapId: sceneManager.getCurrentMap()?.id,
        transition: mapRenderer.getTransitionState(),
      };
    });

    expect(started.renderMapId).toBe('town_01');
    expect(started.sceneMapId).toBe('town_01');
    expect(started.transition.direction).toBe('out');
    expect(started.transition.type).toBe('fade');
    expect(started.transition.profile).toBe('enter_interior');

    await page.waitForTimeout(220);

    const duringOut = await page.evaluate(() => ({
      renderMapId: mapRenderer.currentMap?.id,
      sceneMapId: sceneManager.getCurrentMap()?.id,
      transition: mapRenderer.getTransitionState(),
    }));

    expect(duringOut.renderMapId).toBe('town_01');
    expect(duringOut.sceneMapId).toBe('town_01');
    expect(duringOut.transition.active).toBe(true);
    expect(duringOut.transition.direction).toBe('out');

    await page.waitForFunction(() => {
      return sceneManager.getCurrentMap()?.id === 'house_01' &&
        mapRenderer.getTransitionState().active === false;
    });

    const completed = await page.evaluate(() => ({
      renderMapId: mapRenderer.currentMap?.id,
      sceneMapId: sceneManager.getCurrentMap()?.id,
      hud: uiManager.getMapHUDState(),
    }));

    expect(completed.renderMapId).toBe('house_01');
    expect(completed.sceneMapId).toBe('house_01');
    expect(completed.hud.mapName).toBe('村长家');
  });

  test('从 1 号道路回新手村时应使用一致 fade 转场并在结束后完成落位', async ({ page }) => {
    await startMapGame(page);

    await page.evaluate(() => {
      mapSystem.teleportPlayer('route_01', 30, 15);
    });

    await page.waitForFunction(() => {
      return sceneManager.getCurrentMap()?.id === 'route_01' &&
        mapRenderer.getTransitionState().active === false;
    });

    const started = await page.evaluate(() => {
      mapSystem.teleportPlayer('town_01', 1, 15);
      return {
        renderMapId: mapRenderer.currentMap?.id,
        sceneMapId: sceneManager.getCurrentMap()?.id,
        transition: mapRenderer.getTransitionState(),
      };
    });

    expect(started.renderMapId).toBe('route_01');
    expect(started.sceneMapId).toBe('route_01');
    expect(started.transition.type).toBe('fade');
    expect(started.transition.direction).toBe('out');
    expect(started.transition.profile).toBe('cross_region');

    await page.waitForFunction(() => {
      return sceneManager.getCurrentMap()?.id === 'town_01' &&
        mapRenderer.getTransitionState().active === false;
    });

    const completed = await page.evaluate(() => ({
      player: playerController.getPlayerState(),
      hud: uiManager.getMapHUDState(),
      transition: mapRenderer.getTransitionState(),
    }));

    expect(completed.hud.mapName).toBe('新手村');
    expect(completed.player.tileX).toBe(1);
    expect(completed.player.tileY).toBe(15);
    expect(completed.transition.active).toBe(false);
  });
});
