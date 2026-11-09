/**
 * Procedural Web Audio API sound effects and mobile haptic vibration manager
 * for BOUNCY POP: Spiral Tower 3D.
 * Zero external audio files — 100% synthesized in real time and unlocked on user gesture.
 */

class SoundAndHapticsManager {
  private ctx: AudioContext | null = null;
  public soundEnabled = true;
  public vibrationEnabled = true;

  private ensureContext(): AudioContext | null {
    if (!this.soundEnabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAudio(): void {
    this.ensureContext();
  }

  public vibrate(pattern: number | number[]): void {
    if (!this.vibrationEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore on unsupported mobile browsers
    }
  }

  public playBounce(combo = 1): void {
    this.vibrate(6);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Soft, pleasant toy bounce sound for gentle single-platform hops
    const pitchScale = 1 + Math.min(6, combo - 1) * 0.04 + (Math.random() - 0.5) * 0.03;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220 * pitchScale, now);
    osc.frequency.exponentialRampToValueAtTime(395 * pitchScale, now + 0.085);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.105);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playLandingImpact(floorsDropped: number, combo = 1): void {
    const intensity = Math.min(1, Math.max(0.25, floorsDropped / 5));
    this.vibrate(floorsDropped >= 3 ? [14, 18, 22] : 12);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Warm cushioned low-end impact thump
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(145 + intensity * 30, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(58, now + 0.14);
    thumpGain.gain.setValueAtTime(0.16 + intensity * 0.1, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.17);

    // 2. Glossy toy pop harmonic bounce
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    const pitchScale = 1 + Math.min(8, combo - 1) * 0.045;
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(240 * pitchScale, now);
    popOsc.frequency.exponentialRampToValueAtTime(
      (480 + Math.min(5, floorsDropped) * 35) * pitchScale,
      now + 0.11
    );
    popGain.gain.setValueAtTime(0.14 + intensity * 0.06, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.14);
  }

  public playSpringBounce(): void {
    this.vibrate([14, 25, 18]);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.22);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playRingPass(ringsInFall: number): void {
    this.vibrate(ringsInFall >= 3 ? [10, 14] : 10);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Smooth falling air-whoosh that grows stronger during consecutive drops
    const whooshOsc = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    const whooshStrength = Math.min(1, 0.35 + ringsInFall * 0.16);
    whooshOsc.type = 'sine';
    whooshOsc.frequency.setValueAtTime(290 + Math.min(6, ringsInFall) * 28, now);
    whooshOsc.frequency.exponentialRampToValueAtTime(125, now + 0.13);
    whooshGain.gain.setValueAtTime(0.09 * whooshStrength, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    whooshOsc.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    whooshOsc.start(now);
    whooshOsc.stop(now + 0.15);

    // 2. Rising pentatonic chime as monster swoops through consecutive rings
    const semitones = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const noteIdx = Math.min(semitones.length - 1, Math.max(0, ringsInFall - 1));
    const baseFreq = 330 * Math.pow(2, semitones[noteIdx] / 12);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.32, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.145);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // 3. Rewarding harmonic combo sparkle when passing multiple consecutive floors (2+)
    if (ringsInFall >= 2) {
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGain();
      chordOsc.type = 'sine';
      const harmonicRatio = ringsInFall >= 3 ? 1.5 : 1.25; // perfect fifth on 3+ floors, major third on 2 floors
      chordOsc.frequency.setValueAtTime(baseFreq * harmonicRatio, now + 0.015);
      chordOsc.frequency.exponentialRampToValueAtTime(
        baseFreq * harmonicRatio * 1.25,
        now + 0.15
      );
      chordGain.gain.setValueAtTime(
        ringsInFall >= 3 ? 0.13 : 0.08,
        now + 0.015
      );
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      chordOsc.connect(chordGain);
      chordGain.connect(ctx.destination);
      chordOsc.start(now + 0.015);
      chordOsc.stop(now + 0.17);
    }
  }

  public playGemPickup(): void {
    this.vibrate(10);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1318.5, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playSmash(): void {
    this.vibrate([28, 30, 40]);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Punchy sub-drop + bright chord burst
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.24);

    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.26);

    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(523.25, now);
    chime.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);
    chimeGain.gain.setValueAtTime(0.18, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now);
    chime.stop(now + 0.21);
  }

  public playHazardHit(): void {
    this.vibrate([45, 40, 75]);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(85, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.39);
  }

  public playVictory(): void {
    this.vibrate([20, 40, 20, 40, 50]);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.29);
    });
  }

  public playBoost(): void {
    this.vibrate([22, 18, 35]);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Energetic turbo whoosh + bright octave power synth
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(720, now + 0.28);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.33);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(1180, now + 0.26);
    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.29);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.3);
  }

  public playBoostOrbPickup(): void {
    this.vibrate(14);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(990, now + 0.045);
    osc.frequency.setValueAtTime(1320, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playClick(): void {
    this.vibrate(6);
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }
}

export const soundManager = new SoundAndHapticsManager();
