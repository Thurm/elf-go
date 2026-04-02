/**
 * 存档管理器 - 处理游戏存档的保存和加载
 */
class SaveManager {
    private readonly saveKeyPrefix = 'save_slot_';
    private readonly maxSlots = 3;

    /**
     * 获取存档的 localStorage key
     * @param {number} slot - 存档槽位 (1-3)
     * @returns {string} localStorage key
     */
    getSaveKey(slot: number): string {
        return `${this.saveKeyPrefix}${slot}`;
    }

    /**
     * 保存游戏
     * @param {Object} gameState - 游戏状态
     * @param {number} slot - 存档槽位 (1-3)
     * @returns {boolean} 是否保存成功
     */
    saveGame(gameState: GameStateData, slot: number): boolean {
        if (slot < 1 || slot > this.maxSlots) {
            console.error(`Invalid save slot: ${slot}`);
            return false;
        }

        try {
            const saveData: SaveFile = {
                version: '1.0.0',
                timestamp: Date.now(),
                saveSlot: slot,
                gameState: this.deepClone(gameState)
            };

            const json = JSON.stringify(saveData);
            localStorage.setItem(this.getSaveKey(slot), json);

            console.log(`Game saved to slot ${slot}`);
            eventBus.emit(GameEvents.DATA_SAVE, { slot: slot, success: true });

            return true;
        } catch (error: unknown) {
            console.error('Failed to save game:', error);
            eventBus.emit(GameEvents.DATA_SAVE, { slot: slot, success: false, error: error });
            return false;
        }
    }

    /**
     * 加载游戏
     * @param {number} slot - 存档槽位 (1-3)
     * @returns {Object|null} 加载的游戏状态，失败返回 null
     */
    loadGame(slot: number): GameStateData | null {
        if (slot < 1 || slot > this.maxSlots) {
            console.error(`Invalid save slot: ${slot}`);
            return null;
        }

        try {
            const json = localStorage.getItem(this.getSaveKey(slot));
            if (!json) {
                console.log(`No save data in slot ${slot}`);
                return null;
            }

            const saveData: unknown = JSON.parse(json);

            if (!this.isSaveDataValid(saveData)) {
                console.error('Invalid save data format');
                return null;
            }

            console.log(`Game loaded from slot ${slot}`);
            eventBus.emit(GameEvents.DATA_LOAD, { slot: slot, success: true, data: saveData });

            return saveData.gameState;
        } catch (error: unknown) {
            console.error('Failed to load game:', error);
            eventBus.emit(GameEvents.DATA_LOAD, { slot: slot, success: false, error: error });
            return null;
        }
    }

    /**
     * 检查存档数据是否有效
     * @param {Object} saveData - 存档数据
     * @returns {boolean} 是否有效
     */
    isSaveDataValid(saveData: unknown): saveData is SaveFile {
        if (!saveData || typeof saveData !== 'object') {
            return false;
        }

        const candidate = saveData as Partial<SaveFile>;
        return typeof candidate.version === 'string' &&
            typeof candidate.timestamp === 'number' &&
            typeof candidate.saveSlot === 'number' &&
            !!candidate.gameState &&
            typeof candidate.gameState === 'object';
    }

    /**
     * 获取所有存档的信息
     * @returns {Array<Object>} 存档信息数组
     */
    getAllSaveInfo(): SaveInfo[] {
        const saves: SaveInfo[] = [];
        for (let i = 1; i <= this.maxSlots; i++) {
            const info = this.getSaveInfo(i);
            saves.push(info);
        }
        return saves;
    }

    /**
     * 获取单个存档的信息
     * @param {number} slot - 存档槽位
     * @returns {Object} 存档信息
     */
    getSaveInfo(slot: number): SaveInfo {
        try {
            const json = localStorage.getItem(this.getSaveKey(slot));
            if (!json) {
                return { slot: slot, empty: true };
            }

            const saveData: unknown = JSON.parse(json);
            if (!this.isSaveDataValid(saveData)) {
                return { slot: slot, empty: true, error: new Error('Invalid save data format') };
            }

            return {
                slot: slot,
                empty: false,
                timestamp: saveData.timestamp,
                version: saveData.version,
                gameTime: saveData.gameState?.gameTime || 0,
                playerName: saveData.gameState?.player?.name || '未知'
            };
        } catch (error: unknown) {
            return { slot: slot, empty: true, error: error };
        }
    }

    /**
     * 删除存档
     * @param {number} slot - 存档槽位
     * @returns {boolean} 是否删除成功
     */
    deleteSave(slot: number): boolean {
        if (slot < 1 || slot > this.maxSlots) {
            console.error(`Invalid save slot: ${slot}`);
            return false;
        }

        try {
            localStorage.removeItem(this.getSaveKey(slot));
            console.log(`Save deleted from slot ${slot}`);
            return true;
        } catch (error: unknown) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }
}

// 创建全局实例
const saveManager = new SaveManager();
