type EventCallback<T = unknown> = (data: T) => void;

interface EventMap {
  'scene:load': { sceneId: string };
  'scene:loaded': { sceneId: string };
  'scene:transition': { fromSceneId: string; toSceneId: string };
  'chat:message': { role: 'user' | 'npc'; message: string };
  'chat:typing': { isTyping: boolean };
  'video:play': { videoUrl: string };
  'video:ended': void;
  'hint:click': { label: string };
  'state:updated': void;
  'error': { message: string; error?: Error };
  'language:selected': { language: string };
}

type EventName = keyof EventMap;

class EventBus {
  private listeners: Map<EventName, Set<EventCallback<unknown>>> = new Map();

  on<K extends EventName>(event: K, callback: EventCallback<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off<K extends EventName>(event: K, callback: EventCallback<EventMap[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as EventCallback<unknown>);
    }
  }

  emit<K extends EventName>(event: K, data: EventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  once<K extends EventName>(event: K, callback: EventCallback<EventMap[K]>): () => void {
    const wrappedCallback: EventCallback<EventMap[K]> = (data) => {
      this.off(event, wrappedCallback);
      callback(data);
    };
    return this.on(event, wrappedCallback);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
export type { EventMap, EventName };
