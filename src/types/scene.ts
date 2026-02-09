export interface Hint {
  label: string;
  icon: string;
}

export interface NPC {
  name: string;
  portrait: string;
  system_prompt: string;
  secret_triggers: string[];
}

export interface Scene {
  id: string;
  background_image: string;
  narrative_text: string;
  npc: NPC;
  transition_video?: string;
  transition_duration?: number;
  hints?: Hint[];
}

export interface ScenesData {
  scenes: Record<string, Scene>;
  start_scene: string;
}
