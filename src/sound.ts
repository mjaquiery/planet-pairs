/**
 * Gentle synthesised sound effects (no audio files, so nothing to download)
 * and spoken object names via the device's built-in speech voices.
 */
export class Sound {
  private ctx: AudioContext | null = null;

  constructor(public muted = false) {}

  /** Must be called from a user gesture so iOS lets audio play. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, start: number, length: number, type: OscillatorType = 'sine', volume = 0.18): void {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }

  flip(): void {
    this.tone(520, 0, 0.18, 'triangle', 0.12);
    this.tone(780, 0.05, 0.2, 'triangle', 0.08);
  }

  match(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.11, 0.5, 'triangle', 0.14));
  }

  mismatch(): void {
    this.tone(330, 0, 0.3, 'sine', 0.12);
    this.tone(262, 0.18, 0.4, 'sine', 0.12);
  }

  tap(): void {
    this.tone(660, 0, 0.12, 'sine', 0.1);
  }

  win(): void {
    const tune = [523, 587, 659, 784, 659, 784, 1047];
    tune.forEach((f, i) => this.tone(f, i * 0.16, 0.45, 'triangle', 0.15));
    tune.forEach((f, i) => this.tone(f / 2, i * 0.16, 0.45, 'sine', 0.08));
  }

  say(text: string): void {
    if (this.muted || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch {
      // Speech is a nice-to-have.
    }
  }
}
