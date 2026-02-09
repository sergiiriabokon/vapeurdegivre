import type { Hint } from '../types';
import { eventBus } from '../engine/EventBus';

export class HintButtons {
  private element: HTMLElement;

  constructor(selector: string) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`HintButtons element not found: ${selector}`);
    }
    this.element = el;
  }

  setHints(hints: Hint[]): void {
    this.element.innerHTML = '';

    if (hints.length === 0) {
      this.hide();
      return;
    }

    hints.forEach((hint) => {
      const button = document.createElement('button');
      button.className = 'hint-btn';
      button.innerHTML = `
        <span class="icon">${hint.icon}</span>
        <span class="label">${hint.label}</span>
      `;

      button.addEventListener('click', () => {
        eventBus.emit('hint:click', { label: hint.label });
      });

      this.element.appendChild(button);
    });

    this.show();
  }

  show(): void {
    this.element.classList.remove('hidden');
  }

  hide(): void {
    this.element.classList.add('hidden');
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
