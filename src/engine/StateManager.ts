import type { GameState, ConversationEntry, SaveData } from '../types';
import { eventBus } from './EventBus';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';

const SAVE_VERSION = '1.0.0';

class StateManager {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      currentSceneId: '',
      sceneHistory: [],
      flags: {},
      inventory: [],
      conversationHistory: [],
    };
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  getCurrentSceneId(): string {
    return this.state.currentSceneId;
  }

  setCurrentScene(sceneId: string): void {
    if (this.state.currentSceneId && this.state.currentSceneId !== sceneId) {
      this.state.sceneHistory.push(this.state.currentSceneId);
    }
    this.state.currentSceneId = sceneId;
    eventBus.emit('state:updated', undefined);
  }

  getSceneHistory(): readonly string[] {
    return this.state.sceneHistory;
  }

  getPreviousScene(): string | null {
    const history = this.state.sceneHistory;
    return history.length > 0 ? history[history.length - 1] : null;
  }

  setFlag(key: string, value: boolean): void {
    this.state.flags[key] = value;
    eventBus.emit('state:updated', undefined);
  }

  getFlag(key: string): boolean {
    return this.state.flags[key] ?? false;
  }

  addToInventory(item: string): void {
    if (!this.state.inventory.includes(item)) {
      this.state.inventory.push(item);
      eventBus.emit('state:updated', undefined);
    }
  }

  removeFromInventory(item: string): void {
    const index = this.state.inventory.indexOf(item);
    if (index !== -1) {
      this.state.inventory.splice(index, 1);
      eventBus.emit('state:updated', undefined);
    }
  }

  hasItem(item: string): boolean {
    return this.state.inventory.includes(item);
  }

  getInventory(): readonly string[] {
    return this.state.inventory;
  }

  addConversationEntry(entry: Omit<ConversationEntry, 'timestamp'>): void {
    this.state.conversationHistory.push({
      ...entry,
      timestamp: Date.now(),
    });
    eventBus.emit('state:updated', undefined);
  }

  getConversationHistory(sceneId?: string): readonly ConversationEntry[] {
    if (sceneId) {
      return this.state.conversationHistory.filter((e) => e.sceneId === sceneId);
    }
    return this.state.conversationHistory;
  }

  clearConversationForScene(sceneId: string): void {
    this.state.conversationHistory = this.state.conversationHistory.filter(
      (e) => e.sceneId !== sceneId
    );
  }

  save(): boolean {
    try {
      const saveData: SaveData = {
        gameState: { ...this.state },
        savedAt: Date.now(),
        version: SAVE_VERSION,
      };
      saveToStorage(STORAGE_KEYS.GAME_STATE, saveData);
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    }
  }

  load(): boolean {
    try {
      const saveData = loadFromStorage<SaveData>(STORAGE_KEYS.GAME_STATE);
      if (saveData && saveData.version === SAVE_VERSION) {
        this.state = saveData.gameState;
        eventBus.emit('state:updated', undefined);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  hasSavedGame(): boolean {
    try {
      const saveData = loadFromStorage<SaveData>(STORAGE_KEYS.GAME_STATE);
      return saveData !== null && saveData.version === SAVE_VERSION;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.state = this.createInitialState();
    eventBus.emit('state:updated', undefined);
  }
}

export const stateManager = new StateManager();
