export class SceneView {
  private element: HTMLElement;

  constructor(selector: string) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`SceneView element not found: ${selector}`);
    }
    this.element = el;
  }

  setBackground(imageUrl: string): void {
    this.element.style.backgroundImage = `url(${imageUrl})`;
  }

  async fadeOut(): Promise<void> {
    this.element.classList.add('fade-out');
    await this.waitForTransition();
  }

  async fadeIn(): Promise<void> {
    this.element.classList.remove('fade-out');
    this.element.classList.add('fade-in');
    await this.waitForTransition();
    this.element.classList.remove('fade-in');
  }

  private waitForTransition(): Promise<void> {
    return new Promise((resolve) => {
      const handler = () => {
        this.element.removeEventListener('transitionend', handler);
        resolve();
      };
      this.element.addEventListener('transitionend', handler);
      // Fallback timeout
      setTimeout(resolve, 600);
    });
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
