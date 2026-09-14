/**
 * Web Audio API Engine for Clinical Cardiac Monitoring
 * Synthesizes realistic QRS beeps with SpO2-dependent pitch modulation
 * and IEC 60601-1-8 standard clinical alarms.
 */
export class CardiacAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private alarmInterval: number | null = null;

  public init(): void {
    if (this.ctx) return;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public async unlock(): Promise<boolean> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('Audio resume failed:', e);
      }
    }
    return this.ctx?.state === 'running';
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0.0 : 0.25, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number): void {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime);
    }
  }

  /**
   * Triggers realistic QRS beep tone synchronized with R-wave peak.
   * Pitch is modulated by arterial blood oxygen saturation (SpO2).
   */
  public triggerQrsBeep(spo2Percent: number = 98): void {
    if (!this.ctx || this.ctx.state !== 'running' || this.isMuted || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Nellcor/Masimo clinical standard pitch mapping
    const clampedSpo2 = Math.max(70, Math.min(100, spo2Percent));
    const frequency = 440.0 * Math.pow(2.0, (clampedSpo2 - 86.0) / 14.0);

    // Warm clinical tone (triangle wave)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    // Lowpass filter to soften piercing harmonics
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    // ADSR Envelope: 4ms attack, 65ms total duration
    const duration = 0.065;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.40, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  /**
   * IEC 60601-1-8 High-Priority Clinical Alarm (e.g. Critical STEMI, Sine Wave, VFib)
   */
  public startCriticalAlarm(): void {
    this.stopAlarm();
    if (!this.ctx || this.isMuted) return;

    const playBurst = () => {
      if (!this.ctx || this.isMuted || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const offsets = [0.00, 0.18, 0.36, 0.70, 0.88, 1.35, 1.53, 1.71, 2.05, 2.23];

      for (let i = 0; i < offsets.length; i++) {
        this.scheduleBeep(now + offsets[i], 960, 0.10);
      }
    };

    playBurst();
    this.alarmInterval = window.setInterval(playBurst, 5000);
  }

  public stopAlarm(): void {
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  private scheduleBeep(time: number, freq: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.35, time + 0.01);
    gain.gain.setValueAtTime(0.35, time + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }
}

export const cardiacAudio = new CardiacAudioEngine();
