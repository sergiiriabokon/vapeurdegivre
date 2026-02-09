import type { Scene, ScenesData } from '../types';
import { eventBus } from './EventBus';

class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private startSceneId: string = '';
  private loaded: boolean = false;

  async loadScenes(url: string = '/scenes.json'): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load scenes: ${response.statusText}`);
      }

      const data: ScenesData = await response.json();
      this.validateScenesData(data);

      this.scenes.clear();
      for (const [id, scene] of Object.entries(data.scenes)) {
        this.scenes.set(id, { ...scene, id });
      }

      this.startSceneId = data.start_scene;
      this.loaded = true;
    } catch (error) {
      eventBus.emit('error', {
        message: 'Failed to load scene data',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  private validateScenesData(data: ScenesData): void {
    if (!data.scenes || typeof data.scenes !== 'object') {
      throw new Error('Invalid scenes data: missing scenes object');
    }

    if (!data.start_scene || typeof data.start_scene !== 'string') {
      throw new Error('Invalid scenes data: missing start_scene');
    }

    if (!data.scenes[data.start_scene]) {
      throw new Error(`Invalid scenes data: start_scene "${data.start_scene}" not found`);
    }

    for (const [id, scene] of Object.entries(data.scenes)) {
      if (!scene.background_image) {
        throw new Error(`Scene "${id}" missing background_image`);
      }
      if (!scene.narrative_text) {
        throw new Error(`Scene "${id}" missing narrative_text`);
      }
      if (!scene.npc || !scene.npc.name || !scene.npc.system_prompt) {
        throw new Error(`Scene "${id}" missing valid npc configuration`);
      }
    }
  }

  getScene(id: string): Scene | undefined {
    return this.scenes.get(id);
  }

  getStartScene(): Scene {
    const scene = this.scenes.get(this.startSceneId);
    if (!scene) {
      throw new Error('Start scene not found');
    }
    return scene;
  }

  getStartSceneId(): string {
    return this.startSceneId;
  }

  getAllSceneIds(): string[] {
    return Array.from(this.scenes.keys());
  }

  hasScene(id: string): boolean {
    return this.scenes.has(id);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  preloadSceneAssets(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return Promise.resolve();
    }

    const promises: Promise<void>[] = [];

    // Preload background image
    if (scene.background_image) {
      promises.push(this.preloadImage(scene.background_image));
    }

    // Preload NPC portrait
    if (scene.npc?.portrait) {
      promises.push(this.preloadImage(scene.npc.portrait));
    }

    // Preload transition video (just hint to browser)
    if (scene.transition_video) {
      promises.push(this.preloadVideo(scene.transition_video));
    }

    return Promise.all(promises).then(() => undefined);
  }

  private preloadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't fail on missing images
      img.src = src;
    });
  }

  private preloadVideo(src: string): Promise<void> {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
      resolve();
    });
  }
}

export const sceneManager = new SceneManager();
