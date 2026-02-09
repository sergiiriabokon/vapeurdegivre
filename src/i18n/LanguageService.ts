export type Language = 'en' | 'fr' | 'ru' | 'uk';

interface SceneTranslation {
  narrative_text: string;
  npc_greeting?: string;
  hints: string[];
}

interface LanguageData {
  language_name: string;
  scenes: Record<string, SceneTranslation>;
}

type Translations = Record<Language, LanguageData>;

class LanguageService {
  private currentLanguage: Language = 'en';
  private translations: Translations | null = null;

  async loadTranslations(): Promise<void> {
    const response = await fetch('/translations.json');
    this.translations = await response.json();
  }

  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    localStorage.setItem('vapeur_language', lang);
  }

  getLanguage(): Language {
    const saved = localStorage.getItem('vapeur_language') as Language | null;
    if (saved && this.isValidLanguage(saved)) {
      this.currentLanguage = saved;
    }
    return this.currentLanguage;
  }

  private isValidLanguage(lang: string): lang is Language {
    return ['en', 'fr', 'ru', 'uk'].includes(lang);
  }

  getAvailableLanguages(): { code: Language; name: string }[] {
    if (!this.translations) return [];
    return Object.entries(this.translations).map(([code, data]) => ({
      code: code as Language,
      name: data.language_name,
    }));
  }

  getSceneText(sceneId: string): SceneTranslation | null {
    if (!this.translations) return null;
    return this.translations[this.currentLanguage]?.scenes[sceneId] || null;
  }

  getNarrativeText(sceneId: string): string | null {
    return this.getSceneText(sceneId)?.narrative_text || null;
  }

  getHints(sceneId: string): string[] | null {
    return this.getSceneText(sceneId)?.hints || null;
  }
}

export const languageService = new LanguageService();
