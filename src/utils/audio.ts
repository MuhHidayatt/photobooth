/**
 * Web Audio API synthesizer for retro camera sounds.
 * Avoids the need to load external MP3/WAV assets, making the app 100% self-contained and offline-capable.
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Plays a retro electronic "beep" countdown tick sound.
   */
  public playTick() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note, very clear retro beep
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio tick failed', e);
    }
  }

  /**
   * Plays a vintage mechanical camera shutter click sound.
   * Constructed from a combination of a low-pass white noise burst (shutter open/close)
   * and a short resonant metal sound.
   */
  public playShutter() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Create a white noise buffer for the shutter "chhh" texture
      const bufferSize = this.ctx.sampleRate * 0.12; // 120ms sound
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // 2. Create a metallic spring "ping" at the beginning of the click
      const osc = this.ctx.createOscillator();
      const oscFilter = this.ctx.createBiquadFilter();
      const oscGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(600, now);

      oscGain.gain.setValueAtTime(0.6, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      // Start both
      noiseNode.start(now);
      osc.start(now);

      noiseNode.stop(now + 0.12);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio shutter failed', e);
    }
  }
}

export const audio = new RetroAudioEngine();
