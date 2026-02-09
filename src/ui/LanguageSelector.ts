import { languageService, type Language } from '../i18n/LanguageService';
import { eventBus } from '../engine/EventBus';

export class LanguageSelector {
  private element: HTMLElement;

  constructor(selector: string) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`LanguageSelector element not found: ${selector}`);
    }
    this.element = el;
  }

  show(): void {
    const languages = languageService.getAvailableLanguages();

    this.element.innerHTML = `
      <div class="language-selector-content">
        <h2>Select Language / Choisir la langue</h2>
        <h3>Выберите язык / Оберіть мову</h3>
        <div class="language-buttons">
          ${languages
            .map(
              (lang) => `
            <button class="language-btn" data-lang="${lang.code}">
              <span class="flag">${this.getFlag(lang.code)}</span>
              <span class="name">${lang.name}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    this.element.classList.add('active');

    // Add event listeners
    this.element.querySelectorAll('.language-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = (btn as HTMLElement).dataset.lang as Language;
        this.selectLanguage(lang);
      });
    });
  }

  private getFlag(code: Language): string {
    const flags: Record<Language, string> = {
      en: '🇬🇧',
      fr: '🇫🇷',
      ru: '🇷🇺',
      uk: '🇺🇦',
    };
    return flags[code];
  }

  private selectLanguage(lang: Language): void {
    languageService.setLanguage(lang);
    this.hide();
    eventBus.emit('language:selected', { language: lang });
  }

  hide(): void {
    this.element.classList.remove('active');
  }
}
