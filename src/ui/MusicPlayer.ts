class MusicPlayer {
  private audio: HTMLAudioElement;
  private tracks: string[] = [
    '/assets/music/theme_1.mp3',
    '/assets/music/theme_2.mp3',
  ];
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.3;

  constructor() {
    this.audio = new Audio();
    this.audio.loop = false;
    this.audio.volume = this.volume;

    // When track ends, play the next one
    this.audio.addEventListener('ended', () => {
      this.playNextTrack();
    });
  }

  async play(): Promise<void> {
    if (this.isPlaying) return;

    this.audio.src = this.tracks[this.currentTrackIndex];

    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch (error) {
      // Autoplay was prevented, wait for user interaction
      console.log('Music autoplay prevented, waiting for user interaction');
      this.setupAutoplayFallback();
    }
  }

  private setupAutoplayFallback(): void {
    const startMusic = async () => {
      try {
        await this.audio.play();
        this.isPlaying = true;
        document.removeEventListener('click', startMusic);
        document.removeEventListener('keydown', startMusic);
      } catch (e) {
        console.error('Failed to start music:', e);
      }
    };

    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });
  }

  private playNextTrack(): void {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.audio.src = this.tracks[this.currentTrackIndex];
    this.audio.play().catch(console.error);
  }

  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
  }

  resume(): void {
    if (!this.isPlaying) {
      this.audio.play().catch(console.error);
      this.isPlaying = true;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
  }

  fadeOut(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = this.audio.volume;
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = startVolume / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        this.audio.volume = Math.max(0, startVolume - volumeStep * currentStep);

        if (currentStep >= steps) {
          clearInterval(interval);
          this.pause();
          this.audio.volume = this.volume; // Reset for next play
          resolve();
        }
      }, stepDuration);
    });
  }

  fadeIn(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      this.audio.volume = 0;
      this.resume();

      const targetVolume = this.volume;
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = targetVolume / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        this.audio.volume = Math.min(targetVolume, volumeStep * currentStep);

        if (currentStep >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  }
}

export const musicPlayer = new MusicPlayer();
