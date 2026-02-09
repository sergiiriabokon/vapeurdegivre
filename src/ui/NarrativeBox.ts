export class NarrativeBox {
  private element: HTMLElement;

  constructor(selector: string) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`NarrativeBox element not found: ${selector}`);
    }
    this.element = el;
  }

  setText(text: string): void {
    this.element.innerHTML = `<p>${text}</p>`;
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
