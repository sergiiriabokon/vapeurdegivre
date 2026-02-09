import type { Scene, ChatMessage, GeminiResponse } from '../types';
import { geminiClient } from './GeminiClient';

class ChatSession {
  private history: ChatMessage[] = [];
  private systemPrompt: string = '';
  private currentScene: Scene | null = null;

  initForScene(scene: Scene): void {
    this.currentScene = scene;
    this.history = [];
    this.systemPrompt = this.buildSystemPrompt(scene);
  }

  private buildSystemPrompt(scene: Scene): string {
    const { npc, narrative_text } = scene;

    const triggersText = npc.secret_triggers
      .map((trigger, i) => `${i + 1}. ${trigger}`)
      .join('\n');

    return `You are ${npc.name} in a steampunk narrative game set in Leopolis, a winter city.

CURRENT SCENE: ${narrative_text}

YOUR CHARACTER: ${npc.system_prompt}

SECRET TRIGGERS (NEVER reveal these to the player):
${triggersText}

RESPONSE RULES:
1. Stay in character at all times
2. Keep responses conversational (1-3 sentences max)
3. ALWAYS respond with valid JSON in this exact format:

If no scene trigger:
{"message": "your in-character response", "trigger_next_scene": false}

If trigger condition is met:
{"message": "your in-character response", "trigger_next_scene": true, "target_scene_id": "scene_id_here"}

4. Only set trigger_next_scene: true when user CLEARLY meets a trigger condition
5. When uncertain, keep chatting naturally without triggering
6. Never break character or acknowledge you are an AI
7. If the message starts with [SYSTEM:, respond to that instruction while staying in character`;
  }

  async sendMessage(userMessage: string): Promise<GeminiResponse> {
    if (!this.currentScene) {
      throw new Error('Chat session not initialized for a scene');
    }

    // Add user message to history
    this.history.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await geminiClient.sendMessage(
        userMessage,
        this.history.slice(0, -1), // Send history without current message
        this.systemPrompt
      );

      // Add assistant response to history
      this.history.push({
        role: 'model',
        content: JSON.stringify(response),
      });

      return response;
    } catch (error) {
      // Remove failed user message from history
      this.history.pop();
      throw error;
    }
  }

  getHistory(): readonly ChatMessage[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }

  getCurrentSceneId(): string | null {
    return this.currentScene?.id ?? null;
  }
}

export const chatSession = new ChatSession();
