export interface GameState {
  currentSceneId: string;
  sceneHistory: string[];
  flags: Record<string, boolean>;
  inventory: string[];
  conversationHistory: ConversationEntry[];
}

export interface ConversationEntry {
  sceneId: string;
  role: 'user' | 'npc';
  message: string;
  timestamp: number;
}

export interface SaveData {
  gameState: GameState;
  savedAt: number;
  version: string;
}
