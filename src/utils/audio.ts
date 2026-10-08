/**
 * Web Audio API synthesizer for retro camera sounds & Photobooth Background Music (BGM).
 * Completely self-contained, zero external asset dependencies, zero CORS errors, offline-ready.
 */

export interface MusicTrack {
  id: string;
  title: string;
  genre: string;
  emoji: string;
  bpm: number;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "cute-lofi",
    title: "Sweet Pastel Lofi",
    genre: "Chill Kawaii",
    emoji: "🌸",
    bpm: 84,
  },
  {
    id: "retro-arcade",
    title: "8-Bit Photobooth",
    genre: "Chiptune Retro",
    emoji: "🕹️",
    bpm: 116,
  },
  {
    id: "cozy-cafe",
    title: "Tokyo Cafe Lofi",
    genre: "City-Pop Jazz",
    emoji: "☕",
    bpm: 92,
  },
];

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // BGM playback state
  private isPlaying: boolean = false;
  private currentTrackId: string = "cute-lofi";
  private bgmVolume: number = 0.35;
  private isMuted: boolean = false;

  // Scheduler state
  private schedulerTimer: any = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0; // 0 to 31 (4 bars of 8 steps each)

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // BGM gain
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // SFX gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // 1-second white noise buffer for drums & shutter
        const bufferSize = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // ==========================================
  // SFX (Sound Effects)
  // ==========================================

  public playTick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio tick failed", e);
    }
  }

  public playShutter() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

      const now = this.ctx.currentTime;

      // Noise shutter texture
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = this.noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      // Spring click body
      const osc = this.ctx.createOscillator();
      const oscFilter = this.ctx.createBiquadFilter();
      const oscGain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

      oscFilter.type = "lowpass";
      oscFilter.frequency.setValueAtTime(600, now);

      oscGain.gain.setValueAtTime(0.6, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(this.sfxGain);

      noiseNode.start(now);
      osc.start(now);

      noiseNode.stop(now + 0.12);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("Audio shutter failed", e);
    }
  }

  public playPop() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // Ignored
    }
  }

  // ==========================================
  // BGM (Background Music) Engine
  // ==========================================

  public startBgm(trackId?: string) {
    this.init();
    if (!this.ctx || !this.bgmGain) return;

    if (trackId) {
      this.currentTrackId = trackId;
    }

    // Unmute BGM gain with gentle fade in
    const now = this.ctx.currentTime;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(0.001, now);
    this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, now + 0.3);

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }

    this.schedulerTimer = setInterval(() => {
      this.scheduler();
    }, 30);
  }

  public stopBgm() {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (this.ctx && this.bgmGain) {
      const now = this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
    }
  }

  public toggleBgm(trackId?: string): boolean {
    if (this.isPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm(trackId);
      return true;
    }
  }

  public setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.bgmGain && !this.isMuted && this.isPlaying) {
      const now = this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, now + 0.05);
    }
  }

  public setTrack(trackId: string) {
    this.currentTrackId = trackId;
    if (this.isPlaying) {
      // Smooth switch
      this.currentStep = 0;
      if (this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1.0, now + 0.05);
    }
  }

  public isBgmPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): string {
    return this.currentTrackId;
  }

  public getVolume(): number {
    return this.bgmVolume;
  }

  // ==========================================
  // Music Sequencer & Synthesis Helpers
  // ==========================================

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return;

    const track = MUSIC_TRACKS.find((t) => t.id === this.currentTrackId) || MUSIC_TRACKS[0];
    const secondsPerBeat = 60 / track.bpm;
    const stepDuration = secondsPerBeat / 2; // 8th note steps (32 steps = 4 bars)
    const scheduleAheadTime = 0.12;

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime, stepDuration, track.id);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 32;
    }
  }

  private scheduleStep(step: number, time: number, stepDuration: number, trackId: string) {
    if (!this.ctx || !this.bgmGain) return;

    if (trackId === "cute-lofi") {
      this.playCuteLofiStep(step, time, stepDuration);
    } else if (trackId === "retro-arcade") {
      this.playRetroArcadeStep(step, time, stepDuration);
    } else {
      this.playCozyCafeStep(step, time, stepDuration);
    }
  }

  // ------------------------------------------
  // Track 1: Cute Pastel Lofi (Fmaj7 - Em7 - Dm7 - Cmaj7)
  // ------------------------------------------
  private playCuteLofiStep(step: number, time: number, stepDuration: number) {
    const bar = Math.floor(step / 8); // 0, 1, 2, 3
    const stepInBar = step % 8;

    // Chords on step 0 and gentle stabs on step 3 & 6
    if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6) {
      const duration = stepInBar === 0 ? stepDuration * 3 : stepDuration * 2;
      const velocity = stepInBar === 0 ? 0.08 : 0.05;

      let chordFreqs: number[] = [];
      let bassFreq = 0;

      if (bar === 0) {
        // Fmaj7
        chordFreqs = [174.61, 220.0, 261.63, 329.63]; // F3, A3, C4, E4
        bassFreq = 87.31; // F2
      } else if (bar === 1) {
        // Em7
        chordFreqs = [164.81, 196.0, 246.94, 293.66]; // E3, G3, B3, D4
        bassFreq = 82.41; // E2
      } else if (bar === 2) {
        // Dm7
        chordFreqs = [146.83, 174.61, 220.0, 261.63]; // D3, F3, A3, C4
        bassFreq = 73.42; // D2
      } else {
        // Cmaj7
        chordFreqs = [130.81, 164.81, 196.0, 246.94]; // C3, E3, G3, B3
        bassFreq = 65.41; // C2
      }

      this.synthWarmKeys(chordFreqs, time, duration, velocity);
      if (stepInBar === 0) {
        this.synthSubBass(bassFreq, time, stepDuration * 4);
      }
    }

    // Cute Kalimba / Glockenspiel Melodic Notes
    const melodyMap: Record<number, number> = {
      0: 523.25,  // C5
      2: 659.25,  // E5
      4: 783.99,  // G5
      6: 880.0,   // A5
      8: 783.99,  // G5
      10: 659.25, // E5
      12: 587.33, // D5
      14: 659.25, // E5
      16: 698.46, // F5
      18: 880.0,  // A5
      20: 1046.5, // C6
      22: 880.0,  // A5
      24: 783.99, // G5
      26: 659.25, // E5
      28: 587.33, // D5
      30: 523.25, // C5
    };

    if (melodyMap[step]) {
      this.synthKalimba(melodyMap[step], time, stepDuration * 1.5, 0.09);
    }

    // Drums: Lo-fi Kick, Rim, Shaker
    if (stepInBar === 0 || stepInBar === 5) {
      this.synthLofiKick(time);
    }
    if (stepInBar === 4) {
      this.synthLofiRim(time);
    }
    // Shaker on every even 8th note
    if (step % 2 === 0) {
      this.synthShaker(time, stepInBar === 2 || stepInBar === 6 ? 0.04 : 0.02);
    }
  }

  // ------------------------------------------
  // Track 2: 8-Bit Photobooth (Bouncy Chiptune)
  // ------------------------------------------
  private playRetroArcadeStep(step: number, time: number, stepDuration: number) {
    const bar = Math.floor(step / 8);
    const stepInBar = step % 8;

    // Upbeat Arpeggio Notes on Square wave
    const chords: Record<number, number[]> = {
      0: [261.63, 329.63, 392.0, 523.25], // C major
      1: [220.0, 261.63, 329.63, 440.0],  // A minor
      2: [174.61, 220.0, 261.63, 349.23], // F major
      3: [196.0, 246.94, 293.66, 392.0],  // G major
    };

    const currentNotes = chords[bar] || chords[0];
    const note = currentNotes[stepInBar % currentNotes.length];

    this.synthChiptune(note, time, stepDuration * 0.75, 0.05);

    // Chiptune bassline
    if (stepInBar === 0 || stepInBar === 4) {
      const bassRoots = [130.81, 110.0, 87.31, 98.0];
      this.synthChiptune(bassRoots[bar], time, stepDuration * 1.5, 0.08, "triangle");
    }

    // 8-bit Noise percussion
    if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6) {
      this.synthLofiKick(time);
    }
    if (stepInBar === 2 || stepInBar === 6) {
      this.synth8BitNoise(time);
    }
  }

  // ------------------------------------------
  // Track 3: Cozy Tokyo Cafe (FM9 - G13 - Em7 - Am7)
  // ------------------------------------------
  private playCozyCafeStep(step: number, time: number, stepDuration: number) {
    const bar = Math.floor(step / 8);
    const stepInBar = step % 8;

    // Gentle bossa-style comping
    if (stepInBar === 0 || stepInBar === 3 || stepInBar === 4 || stepInBar === 7) {
      let chordFreqs: number[] = [];
      let bassFreq = 0;

      if (bar === 0) {
        // FM9
        chordFreqs = [174.61, 261.63, 329.63, 392.0]; // F3, C4, E4, G4
        bassFreq = 87.31;
      } else if (bar === 1) {
        // G13
        chordFreqs = [196.0, 246.94, 329.63, 349.23]; // G3, B3, E4, F4
        bassFreq = 98.0;
      } else if (bar === 2) {
        // Em7
        chordFreqs = [164.81, 246.94, 293.66, 392.0]; // E3, B3, D4, G4
        bassFreq = 82.41;
      } else {
        // Am7
        chordFreqs = [220.0, 261.63, 329.63, 392.0]; // A3, C4, E4, G4
        bassFreq = 110.0;
      }

      this.synthWarmKeys(chordFreqs, time, stepDuration * 1.2, 0.07);
      if (stepInBar === 0) {
        this.synthSubBass(bassFreq, time, stepDuration * 3.5);
      }
    }

    // Melodic guitar/harp lick
    if (step === 2 || step === 10 || step === 18 || step === 26) {
      const topNotes = [783.99, 880.0, 659.25, 523.25];
      this.synthKalimba(topNotes[bar], time, stepDuration * 2, 0.08);
    }

    // Cafe percussion
    if (stepInBar === 0 || stepInBar === 6) {
      this.synthLofiKick(time);
    }
    if (stepInBar === 4) {
      this.synthLofiRim(time);
    }
    this.synthShaker(time, 0.015);
  }

  // ==========================================
  // Instrument Synthesizers
  // ==========================================

  private synthWarmKeys(freqs: number[], time: number, duration: number, velocity: number) {
    if (!this.ctx || !this.bgmGain) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(950, time);
    filter.connect(this.bgmGain);

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(velocity, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  private synthKalimba(freq: number, time: number, duration: number, velocity: number) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthSubBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthChiptune(freq: number, time: number, duration: number, velocity: number, wave: OscillatorType = "square") {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthLofiKick(time: number) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private synthLofiRim(time: number) {
    if (!this.ctx || !this.bgmGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1600, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    source.start(time);
    source.stop(time + 0.06);
  }

  private synthShaker(time: number, velocity: number) {
    if (!this.ctx || !this.bgmGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(7000, time);
    filter.Q.setValueAtTime(2, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    source.start(time);
    source.stop(time + 0.035);
  }

  private synth8BitNoise(time: number) {
    if (!this.ctx || !this.bgmGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    source.connect(gain);
    gain.connect(this.bgmGain);

    source.start(time);
    source.stop(time + 0.05);
  }
}

export const audio = new RetroAudioEngine();
