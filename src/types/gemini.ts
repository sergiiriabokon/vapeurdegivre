export interface GeminiResponse {
  message: string;
  trigger_next_scene: boolean;
  target_scene_id?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiRequest {
  message: string;
  history: ChatMessage[];
  systemPrompt: string;
}
