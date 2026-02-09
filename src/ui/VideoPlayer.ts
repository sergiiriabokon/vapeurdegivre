import { eventBus } from '../engine/EventBus';

export class VideoPlayer {
  private element: HTMLElement;
  private videoElement: HTMLVideoElement | null = null;
  private skipButton: HTMLButtonElement | null = null;
  private fadeOverlay: HTMLElement | null = null;
  private resolvePlay: (() => void) | null = null;
  private durationTimeout: number | null = null;

  constructor(selector: string) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`VideoPlayer element not found: ${selector}`);
    }
    this.element = el;
    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <video playsinline></video>
      <button class="skip-btn">Skip</button>
      <div class="fade-overlay"></div>
    `;

    this.videoElement = this.element.querySelector('video');
    this.skipButton = this.element.querySelector('.skip-btn');
    this.fadeOverlay = this.element.querySelector('.fade-overlay');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Video ended
    this.videoElement?.addEventListener('ended', () => {
      this.onVideoEnd();
    });

    // Skip button
    this.skipButton?.addEventListener('click', () => {
      this.skip();
    });

    // Show skip button after delay
    this.videoElement?.addEventListener('timeupdate', () => {
      if (this.videoElement && this.videoElement.currentTime > 2) {
        this.skipButton?.classList.add('visible');
      }
    });

    // Handle video errors
    this.videoElement?.addEventListener('error', () => {
      console.error('Video playback error');
      this.onVideoEnd();
    });
  }

  async play(videoUrl: string, maxDuration?: number): Promise<void> {
    if (!this.videoElement) return Promise.resolve();

    return new Promise((resolve) => {
      this.resolvePlay = resolve;

      // Clear any existing duration timeout
      if (this.durationTimeout) {
        clearTimeout(this.durationTimeout);
        this.durationTimeout = null;
      }

      // Reset state
      this.skipButton?.classList.remove('visible');
      this.fadeOverlay?.classList.remove('active');

      // Set video source and play
      this.videoElement!.src = videoUrl;
      this.videoElement!.currentTime = 0;

      // Show player
      this.element.classList.add('active');

      // Set duration timeout if specified
      if (maxDuration && maxDuration > 0) {
        this.durationTimeout = window.setTimeout(() => {
          this.onVideoEnd();
        }, maxDuration * 1000);
      }

      // Start playback
      this.videoElement!.play().catch((error) => {
        console.error('Failed to play video:', error);
        this.onVideoEnd();
      });
    });
  }

  private skip(): void {
    if (this.videoElement) {
      this.videoElement.pause();
    }
    this.onVideoEnd();
  }

  private async onVideoEnd(): Promise<void> {
    // Clear duration timeout
    if (this.durationTimeout) {
      clearTimeout(this.durationTimeout);
      this.durationTimeout = null;
    }

    // Fade to black
    this.fadeOverlay?.classList.add('active');

    await this.delay(500);

    // Hide player
    this.hide();

    // Emit event
    eventBus.emit('video:ended', undefined);

    // Resolve the play promise
    if (this.resolvePlay) {
      this.resolvePlay();
      this.resolvePlay = null;
    }
  }

  hide(): void {
    this.element.classList.remove('active');
    this.skipButton?.classList.remove('visible');
    this.fadeOverlay?.classList.remove('active');

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
