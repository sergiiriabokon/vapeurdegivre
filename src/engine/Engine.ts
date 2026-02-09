import { eventBus } from './EventBus';
import { sceneManager } from './SceneManager';
import { stateManager } from './StateManager';
import { chatSession } from '../ai/ChatSession';
import { SceneView } from '../ui/SceneView';
import { NarrativeBox } from '../ui/NarrativeBox';
import { ChatOverlay } from '../ui/ChatOverlay';
import { HintButtons } from '../ui/HintButtons';
import { VideoPlayer } from '../ui/VideoPlayer';
import type { Scene } from '../types';

class Engine {
  private sceneView!: SceneView;
  private narrativeBox!: NarrativeBox;
  private chatOverlay!: ChatOverlay;
  private hintButtons!: HintButtons;
  private videoPlayer!: VideoPlayer;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load scene data
      await sceneManager.loadScenes();

      // Initialize UI components
      this.sceneView = new SceneView('#scene-view');
      this.narrativeBox = new NarrativeBox('#narrative-box');
      this.chatOverlay = new ChatOverlay('#chat-overlay');
      this.hintButtons = new HintButtons('#hint-buttons');
      this.videoPlayer = new VideoPlayer('#video-player');

      // Set up event listeners
      this.setupEventListeners();

      // Load start scene
      const startSceneId = sceneManager.getStartSceneId();
      await this.loadScene(startSceneId);

      // Hide loading screen
      this.hideLoadingScreen();

      this.initialized = true;
    } catch (error) {
      console.error('Engine initialization failed:', error);
      eventBus.emit('error', {
        message: 'Failed to initialize game engine',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Handle chat messages from user
    eventBus.on('chat:message', async ({ role, message }) => {
      if (role === 'user') {
        await this.handleUserMessage(message);
      }
    });

    // Handle hint button clicks
    eventBus.on('hint:click', ({ label }) => {
      this.chatOverlay.setInputValue(label);
      this.chatOverlay.focusInput();
    });

    // Handle video ended
    eventBus.on('video:ended', () => {
      this.onVideoEnded();
    });

    // Handle scene transition
    eventBus.on('scene:transition', async ({ toSceneId }) => {
      await this.transitionToScene(toSceneId);
    });
  }

  private async loadScene(sceneId: string): Promise<void> {
    const scene = sceneManager.getScene(sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    stateManager.setCurrentScene(sceneId);
    eventBus.emit('scene:load', { sceneId });

    // Update UI
    this.sceneView.setBackground(scene.background_image);
    this.narrativeBox.setText(scene.narrative_text);
    this.chatOverlay.setNPC(scene.npc);
    this.hintButtons.setHints(scene.hints || []);

    // Initialize chat session for this scene
    chatSession.initForScene(scene);

    // Preload next scene assets if there's a transition video
    if (scene.transition_video) {
      this.preloadNextSceneAssets(scene);
    }

    eventBus.emit('scene:loaded', { sceneId });

    // Send NPC greeting
    await this.sendNPCGreeting(scene);
  }

  private async sendNPCGreeting(scene: Scene): Promise<void> {
    // Generate a greeting from the NPC
    this.chatOverlay.setTyping(true);

    try {
      const response = await chatSession.sendMessage('[SYSTEM: Generate a short greeting for the player who just arrived at this scene. Stay in character.]');
      this.chatOverlay.addMessage('npc', response.message);
    } catch (error) {
      console.error('Failed to generate NPC greeting:', error);
      // Fallback greeting
      this.chatOverlay.addMessage('npc', `Welcome, traveler. I am ${scene.npc.name}.`);
    } finally {
      this.chatOverlay.setTyping(false);
    }
  }

  private async handleUserMessage(message: string): Promise<void> {
    // Add user message to chat
    this.chatOverlay.addMessage('user', message);
    stateManager.addConversationEntry({
      sceneId: stateManager.getCurrentSceneId(),
      role: 'user',
      message,
    });

    // Show typing indicator
    this.chatOverlay.setTyping(true);

    try {
      const response = await chatSession.sendMessage(message);

      // Add NPC response
      this.chatOverlay.addMessage('npc', response.message);
      stateManager.addConversationEntry({
        sceneId: stateManager.getCurrentSceneId(),
        role: 'npc',
        message: response.message,
      });

      // Check for scene trigger
      if (response.trigger_next_scene && response.target_scene_id) {
        // Small delay to let the message be read
        setTimeout(() => {
          eventBus.emit('scene:transition', {
            fromSceneId: stateManager.getCurrentSceneId(),
            toSceneId: response.target_scene_id!,
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.chatOverlay.addMessage('npc', 'I... seem to have lost my train of thought. Could you repeat that?');
    } finally {
      this.chatOverlay.setTyping(false);
    }
  }

  private async transitionToScene(toSceneId: string): Promise<void> {
    const currentScene = sceneManager.getScene(stateManager.getCurrentSceneId());
    const nextScene = sceneManager.getScene(toSceneId);

    if (!nextScene) {
      console.error(`Target scene not found: ${toSceneId}`);
      return;
    }

    // Hide UI elements
    this.narrativeBox.hide();
    this.chatOverlay.hide();
    this.hintButtons.hide();

    // Play transition video if available
    if (currentScene?.transition_video) {
      await this.videoPlayer.play(currentScene.transition_video);
    } else {
      // Just fade to black briefly
      await this.sceneView.fadeOut();
      await this.delay(500);
    }

    // Load new scene
    await this.loadScene(toSceneId);

    // Show UI elements
    await this.sceneView.fadeIn();
    this.narrativeBox.show();
    this.chatOverlay.show();
    this.hintButtons.show();
  }

  private onVideoEnded(): void {
    this.videoPlayer.hide();
  }

  private preloadNextSceneAssets(currentScene: Scene): void {
    // Find scenes that might be triggered from current scene
    const triggers = currentScene.npc.secret_triggers;
    for (const trigger of triggers) {
      const match = trigger.match(/trigger scene ['"]([^'"]+)['"]/i);
      if (match) {
        sceneManager.preloadSceneAssets(match[1]);
      }
    }
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const engine = new Engine();
