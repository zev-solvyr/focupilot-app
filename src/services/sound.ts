// Web Audio API ambient sound generator and chime for FocusPilot

class SoundService {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private currentType: 'rain' | 'whitenoise' | 'binaural40hz' | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play crisp completion chime
  playCompletionChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Harmonic pleasant chord: E5 (659Hz) to G#5 (830Hz)
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(830.61, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Play soothing ambient noise
  startAmbient(type: 'rain' | 'whitenoise' | 'binaural40hz', volume: number = 0.2) {
    this.stopAmbient();
    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    this.isAmbientPlaying = true;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    gainNode.connect(this.ctx.destination);
    this.ambientGain = gainNode;

    if (type === 'binaural40hz') {
      // 200Hz base tone in Left ear, 240Hz tone in Right ear -> 40Hz gamma entrainment
      const merger = this.ctx.createChannelMerger(2);

      const oscL = this.ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(200, this.ctx.currentTime);

      const oscR = this.ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(240, this.ctx.currentTime);

      oscL.connect(merger, 0, 0); // left
      oscR.connect(merger, 0, 1); // right

      merger.connect(gainNode);

      oscL.start();
      oscR.start();

      this.ambientSource = gainNode;
    } else {
      // White noise / Rain noise generator buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Pink/Brown noise approximation for gentle rain
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        } else {
          // Pure white noise
          output[i] = white * 0.2;
        }
      }

      const whiteNoiseSource = this.ctx.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;

      // Filter for rain warmth
      if (type === 'rain') {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        whiteNoiseSource.connect(filter);
        filter.connect(gainNode);
      } else {
        whiteNoiseSource.connect(gainNode);
      }

      whiteNoiseSource.start();
      this.ambientSource = whiteNoiseSource;
    }
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        if ('stop' in this.ambientSource && typeof (this.ambientSource as AudioScheduledSourceNode).stop === 'function') {
          (this.ambientSource as AudioScheduledSourceNode).stop();
        }
      } catch {
        // ignore
      }
      this.ambientSource = null;
    }
    this.isAmbientPlaying = false;
    this.currentType = null;
  }

  setVolume(volume: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  isPlaying(): boolean {
    return this.isAmbientPlaying;
  }

  getCurrentSound(): 'rain' | 'whitenoise' | 'binaural40hz' | null {
    return this.currentType;
  }
}

export const sound = new SoundService();
