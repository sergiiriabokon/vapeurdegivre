export const STORAGE_KEYS = {
  GAME_STATE: 'vapeur_de_givre_save',
  SETTINGS: 'vapeur_de_givre_settings',
} as const;

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return null;
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from storage:', error);
  }
}

export function clearStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}
