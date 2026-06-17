import { SoundType } from './types';

class EarphoneAudioEngine {
  private ctx: AudioContext | null = null;
  private mainVolumeNode: GainNode | null = null;
  private currentNodes: { stop: () => void }[] = [];
  private crescendoInterval: number | null = null;
  private deviceChangeCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen to headphone unplugging
      if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
        navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
      }
    }
  }

  // Lazy initialize AudioContext on user interaction
  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.mainVolumeNode = this.ctx.createGain();
      this.mainVolumeNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.mainVolumeNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public registerDeviceChangeListener(callback: () => void) {
    this.deviceChangeCallback = callback;
  }

  private handleDeviceChange = () => {
    // If audio-devices change (e.g., earphone unplugged), trigger safety mute and stop sounds.
    console.warn('Audio device change detected! Engaging roommate-protection safety mute.');
    this.stopAll();
    if (this.deviceChangeCallback) {
      this.deviceChangeCallback();
    }
  };

  public stopAll() {
    // Cancel any active crescendos
    if (this.crescendoInterval) {
      window.clearInterval(this.crescendoInterval);
      this.crescendoInterval = null;
    }

    // Stop and clear all synthesis nodes
    this.currentNodes.forEach(node => {
      try {
        node.stop();
      } catch (err) {
        // Already stopped or not started
      }
    });
    this.currentNodes = [];

    // Reset volume levels safely
    if (this.mainVolumeNode && this.ctx) {
      this.mainVolumeNode.gain.cancelScheduledValues(this.ctx.currentTime);
    }
  }

  public setVolume(volume: number) {
    this.init();
    if (this.mainVolumeNode && this.ctx) {
      // Linear mapping to volume control (0.0 to 1.0)
      const targetVolume = Math.max(0, Math.min(1, volume));
      this.mainVolumeNode.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Play a stereo calibration chime to test if earphones are correctly fitted.
   */
  public playCalibrationSound(channel: 'left' | 'right' | 'both') {
    const ctx = this.init();
    
    // Stop previous sounds
    this.stopAll();

    // Setup Synth Node
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'triangle';
    // Friendly chiming frequency (soft G5)
    osc.frequency.setValueAtTime(783.99, ctx.currentTime);

    // Pan based on target channel
    let panVal = 0;
    if (channel === 'left') panVal = -1.0;
    if (channel === 'right') panVal = 1.0;
    panner.pan.setValueAtTime(panVal, ctx.currentTime);

    // Envelope: instant chime with rapid volume decay
    gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    // Connections
    osc.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.mainVolumeNode!);

    // Play double chime
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.9);

    this.currentNodes.push({
      stop: () => {
        osc.stop();
      }
    });

    // Second beat slightly delayed
    const osc2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(987.77, ctx.currentTime + 0.15); // soft B5 chime

    gainNode2.gain.setValueAtTime(0.0, ctx.currentTime + 0.15);
    gainNode2.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.17);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc2.connect(gainNode2);
    gainNode2.connect(panner);

    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.8);

    this.currentNodes.push({
      stop: () => {
        osc2.stop();
      }
    });
  }

  /**
   * Helper to create noise buffers for wind/nature/whisper sounds.
   */
  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.init();
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Play active wake loops with customizable types.
   */
  public startAlarm(soundType: SoundType, maxVolume: number, crescendoSecs: number) {
    const ctx = this.init();
    this.stopAll();

    // 1. Initialise volume starting at 0 for crescendo
    if (this.mainVolumeNode) {
      this.mainVolumeNode.gain.setValueAtTime(0.0, ctx.currentTime);
    }

    // 2. Synthesize sounds
    if (soundType === 'binaural') {
      // Waking alpha-beta bridge frequencies
      // Left ear gets 180 Hz, Right ear gets 195 Hz. Generates wake-inducing 15Hz Beta binaural focus beat
      const oscL = ctx.createOscillator();
      const pannerL = ctx.createStereoPanner();
      const gainL = ctx.createGain();

      const oscR = ctx.createOscillator();
      const pannerR = ctx.createStereoPanner();
      const gainR = ctx.createGain();

      oscL.frequency.setValueAtTime(180, ctx.currentTime);
      pannerL.pan.setValueAtTime(-1.0, ctx.currentTime);
      gainL.gain.setValueAtTime(0.4, ctx.currentTime);

      oscR.frequency.setValueAtTime(195, ctx.currentTime);
      pannerR.pan.setValueAtTime(1.0, ctx.currentTime);
      gainR.gain.setValueAtTime(0.4, ctx.currentTime);

      // Low-frequency support hum
      const masterHum = ctx.createOscillator();
      const humGain = ctx.createGain();
      masterHum.frequency.setValueAtTime(90, ctx.currentTime);
      humGain.gain.setValueAtTime(0.1, ctx.currentTime);

      // Connections
      oscL.connect(gainL).connect(pannerL).connect(this.mainVolumeNode!);
      oscR.connect(gainR).connect(pannerR).connect(this.mainVolumeNode!);
      masterHum.connect(humGain).connect(this.mainVolumeNode!);

      oscL.start();
      oscR.start();
      masterHum.start();

      this.currentNodes.push({
        stop: () => {
          oscL.stop();
          oscR.stop();
          masterHum.stop();
        }
      });

    } else if (soundType === 'whisper') {
      // Gentle white-noise whispering breathing pattern
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime); // High frequency focused "shhh"
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      // Create an LFO to make it surge slowly like gentle whisper breathing
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.3, ctx.currentTime); // 0.3 Hz surge rate (every 3 seconds)
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.25, ctx.currentTime); // mod amplitude

      const whisperGain = ctx.createGain();
      whisperGain.gain.setValueAtTime(0.2, ctx.currentTime);

      // Connect LFO directly to control gain level
      lfo.connect(lfoGain).connect(whisperGain.gain);
      noise.connect(filter).connect(whisperGain).connect(this.mainVolumeNode!);

      noise.start();
      lfo.start();

      this.currentNodes.push({
        stop: () => {
          noise.stop();
          lfo.stop();
        }
      });

    } else if (soundType === 'chime') {
      // Staggered pattern chimes
      let active = true;
      const playChimeSequence = () => {
        if (!active) return;
        
        // Random high chime to trigger consciousness softly in stereo
        const osc = ctx.createOscillator();
        const panner = ctx.createStereoPanner();
        const gainNode = ctx.createGain();

        const notes = [1200, 1500, 1800, 2200, 2400];
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        const randomPan = Math.random() * 2 - 1; // full panning sweep

        osc.frequency.setValueAtTime(randomNote, ctx.currentTime);
        osc.type = 'sine';
        panner.pan.setValueAtTime(randomPan, ctx.currentTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gainNode).connect(panner).connect(this.mainVolumeNode!);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);

        // Schedule next random chime
        setTimeout(playChimeSequence, 800 + Math.random() * 1000);
      };

      playChimeSequence();

      this.currentNodes.push({
        stop: () => {
          active = false;
        }
      });

    } else if (soundType === 'pulse') {
      // Subdued high-frequency ticks that slowly pattern beat (like a tap on the shoulder)
      let active = true;
      const playPulse = () => {
        if (!active) return;

        const osc = ctx.createOscillator();
        const bandpass = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();
        const panner = ctx.createStereoPanner();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, ctx.currentTime); // low bass thud
        
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(100, ctx.currentTime);

        const pan = Math.sin(ctx.currentTime * 2); // pan back and forth
        panner.pan.setValueAtTime(pan, ctx.currentTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(bandpass).connect(gainNode).connect(panner).connect(this.mainVolumeNode!);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);

        // Schedule next pulse
        setTimeout(playPulse, 500);
      };

      playPulse();

      this.currentNodes.push({
        stop: () => {
          active = false;
        }
      });

    } else if (soundType === 'bts_dynamite') {
      const dynamiteNotes = [
        { note: 'G4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'D5', duration: 0.75 }, { note: 'D5', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
        { note: 'REST', duration: 0.5 },
        { note: 'G4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'D5', duration: 0.5 }, { note: 'D5', duration: 0.25 },
        { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 },
        { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 },
        { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'G4', duration: 1.0 }, { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(dynamiteNotes, 114);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_butter') {
      const butterNotes = [
        { note: 'B4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'B4', duration: 0.5 }, { note: 'G#4', duration: 0.5 },
        { note: 'B4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'B4', duration: 0.5 }, { note: 'B4', duration: 0.25 },
        { note: 'C#5', duration: 0.25 }, { note: 'B4', duration: 0.5 },
        { note: 'G#4', duration: 1.0 }, { note: 'REST', duration: 0.5 },
        { note: 'F#4', duration: 0.5 }, { note: 'F#4', duration: 0.5 },
        { note: 'G#4', duration: 0.5 }, { note: 'B4', duration: 1.0 },
        { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(butterNotes, 110);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_spring') {
      const springNotes = [
        { note: 'D#5', duration: 0.5 }, { note: 'F#5', duration: 0.5 },
        { note: 'G#5', duration: 1.0 }, { note: 'F#5', duration: 0.5 },
        { note: 'REST', duration: 0.5 },
        { note: 'D#5', duration: 0.5 }, { note: 'F#5', duration: 0.5 },
        { note: 'G#5', duration: 0.75 }, { note: 'A#5', duration: 0.25 },
        { note: 'G#5', duration: 1.0 }, { note: 'REST', duration: 0.5 },
        { note: 'F#5', duration: 0.5 }, { note: 'G#5', duration: 0.5 },
        { note: 'A#5', duration: 0.5 }, { note: 'F#5', duration: 1.0 },
        { note: 'D#5', duration: 1.0 }, { note: 'REST', duration: 1.5 }
      ];
      const melodyNode = this.playMelody(springNotes, 75);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_lgo') {
      const lgoNotes = [
        { note: 'G4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
        { note: 'B4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
        { note: 'G4', duration: 1.0 }, { note: 'REST', duration: 0.5 },
        { note: 'G4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 1.0 },
        { note: 'B4', duration: 1.0 }, { note: 'REST', duration: 1.5 }
      ];
      const melodyNode = this.playMelody(lgoNotes, 82);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_bwl') {
      const bwlNotes = [
        { note: 'A5', duration: 0.5 }, { note: 'A5', duration: 0.25 },
        { note: 'G5', duration: 0.25 }, { note: 'F5', duration: 0.5 },
        { note: 'G5', duration: 0.25 }, { note: 'A5', duration: 0.5 },
        { note: 'F5', duration: 0.75 }, { note: 'REST', duration: 0.5 },
        { note: 'G5', duration: 0.5 }, { note: 'G5', duration: 0.25 },
        { note: 'F5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'F5', duration: 0.25 }, { note: 'G5', duration: 0.5 },
        { note: 'D5', duration: 0.75 }, { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(bwlNotes, 120);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_fakelove') {
      const fakeLoveNotes = [
        { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'F5', duration: 0.75 }, { note: 'F5', duration: 0.25 },
        { note: 'F5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
        { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 1.0 },
        { note: 'REST', duration: 0.5 },
        { note: 'E5', duration: 0.5 }, { note: 'F5', duration: 0.5 },
        { note: 'G5', duration: 0.75 }, { note: 'G5', duration: 0.25 },
        { note: 'G5', duration: 0.5 }, { note: 'F5', duration: 0.5 },
        { note: 'E5', duration: 0.5 }, { note: 'F5', duration: 1.0 },
        { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(fakeLoveNotes, 78);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_dna') {
      const dnaNotes = [
        { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'G5', duration: 0.25 }, { note: 'A5', duration: 0.5 },
        { note: 'G5', duration: 0.5 }, { note: 'E5', duration: 0.25 },
        { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.5 },
        { note: 'D5', duration: 0.25 }, { note: 'E5', duration: 0.25 },
        { note: 'C5', duration: 1.0 }, { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(dnaNotes, 130);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_ptd') {
      const ptdNotes = [
        { note: 'C5', duration: 0.5 }, { note: 'C5', duration: 0.5 },
        { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.75 },
        { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 0.5 }, { note: 'D5', duration: 0.5 },
        { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 },
        { note: 'C5', duration: 1.0 }, { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(ptdNotes, 125);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_piedpiper') {
      const piedpiperNotes = [
        { note: 'F#5', duration: 0.5 }, { note: 'G#5', duration: 0.5 },
        { note: 'A5', duration: 0.5 }, { note: 'B5', duration: 0.5 },
        { note: 'A5', duration: 0.5 }, { note: 'G#5', duration: 0.5 },
        { note: 'F#5', duration: 1.0 }, { note: 'REST', duration: 0.5 },
        { note: 'E5', duration: 0.5 }, { note: 'F#5', duration: 0.5 },
        { note: 'G#5', duration: 0.5 }, { note: 'F#5', duration: 1.0 },
        { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(piedpiperNotes, 104);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_arirang') {
      const arirangNotes = [
        { note: 'D4', duration: 1.0 }, { note: 'G4', duration: 1.0 }, { note: 'A4', duration: 1.0 },
        { note: 'B4', duration: 1.5 }, { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 1.0 },
        { note: 'G4', duration: 1.0 }, { note: 'E4', duration: 1.0 }, { note: 'D4', duration: 1.0 },
        { note: 'G4', duration: 1.0 }, { note: 'E4', duration: 1.0 }, { note: 'D4', duration: 1.0 },
        { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(arirangNotes, 85);
      this.currentNodes.push(melodyNode);

    } else if (soundType === 'bts_comeover') {
      const comeOverNotes = [
        { note: 'G4', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'D5', duration: 0.5 },
        { note: 'E5', duration: 1.0 }, { note: 'D5', duration: 0.5 }, { note: 'B4', duration: 0.5 },
        { note: 'A4', duration: 1.0 }, { note: 'REST', duration: 0.25 },
        { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'D5', duration: 0.5 },
        { note: 'B4', duration: 1.0 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 1.5 },
        { note: 'REST', duration: 1.0 }
      ];
      const melodyNode = this.playMelody(comeOverNotes, 110);
      this.currentNodes.push(melodyNode);

    } else {
      // 'nature' wind and light stream audio
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(350, ctx.currentTime); // warm wind

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.4, ctx.currentTime);

      noise.connect(lowpass).connect(windGain).connect(this.mainVolumeNode!);
      noise.start();

      // soft birds/droplet synths layered in occasionally
      let active = true;
      const playPebbles = () => {
        if (!active) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const pan = ctx.createStereoPanner();

        osc.frequency.setValueAtTime(2500 + Math.random() * 500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15); // descending sweep
        
        pan.pan.setValueAtTime(Math.random() * 2 - 1, ctx.currentTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(gainNode).connect(pan).connect(this.mainVolumeNode!);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);

        setTimeout(playPebbles, 2000 + Math.random() * 5000);
      };
      playPebbles();

      this.currentNodes.push({
        stop: () => {
          noise.stop();
          active = false;
        }
      });
    }

    // 3. Initiate gradual Crescendo (climbing volume)
    let currentVol = 0.01;
    const steps = Math.max(10, crescendoSecs * 5); // 5 steps per second
    const increment = maxVolume / steps;
    const intervalMs = (crescendoSecs * 1000) / steps;

    this.mainVolumeNode.gain.setValueAtTime(currentVol, ctx.currentTime);

    this.crescendoInterval = window.setInterval(() => {
      if (!this.mainVolumeNode || !this.ctx) return;
      currentVol = Math.min(maxVolume, currentVol + increment);
      this.mainVolumeNode.gain.setValueAtTime(currentVol, this.ctx.currentTime);

      if (currentVol >= maxVolume) {
        if (this.crescendoInterval) {
          window.clearInterval(this.crescendoInterval);
          this.crescendoInterval = null;
        }
      }
    }, intervalMs);
  }

  /**
   * Bedtime relaxing audio. Plays continuous, sleep-inducing sounds that
   * automatically shut down after sleep timer expires.
   */
  public startAmbient(soundType: SoundType, maxVolume: number) {
    const ctx = this.init();
    this.stopAll();

    if (this.mainVolumeNode) {
      this.mainVolumeNode.gain.setValueAtTime(maxVolume, ctx.currentTime);
    }

    if (soundType === 'binaural') {
      // Theta deep relaxation (5Hz difference at safe 100Hz frequency: 100Hz in Left, 105Hz in Right)
      const oscL = ctx.createOscillator();
      const pannerL = ctx.createStereoPanner();
      const gainL = ctx.createGain();

      const oscR = ctx.createOscillator();
      const pannerR = ctx.createStereoPanner();
      const gainR = ctx.createGain();

      oscL.frequency.setValueAtTime(100, ctx.currentTime);
      pannerL.pan.setValueAtTime(-1.0, ctx.currentTime);
      gainL.gain.setValueAtTime(0.4, ctx.currentTime);

      oscR.frequency.setValueAtTime(105, ctx.currentTime);
      pannerR.pan.setValueAtTime(1.0, ctx.currentTime);
      gainR.gain.setValueAtTime(0.4, ctx.currentTime);

      oscL.connect(gainL).connect(pannerL).connect(this.mainVolumeNode!);
      oscR.connect(gainR).connect(pannerR).connect(this.mainVolumeNode!);

      oscL.start();
      oscR.start();

      this.currentNodes.push({
        stop: () => {
          oscL.stop();
          oscR.stop();
        }
      });
    } else if (soundType === 'whisper' || soundType === 'nature') {
      // Cozy warm brownian storm noise
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(180, ctx.currentTime); // very dark and smooth rumbles

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.5, ctx.currentTime);

      noise.connect(lowpass).connect(windGain).connect(this.mainVolumeNode!);
      noise.start();

      this.currentNodes.push({
        stop: () => {
          noise.stop();
        }
      });
    } else {
      // Soft ambient chimes generator (sleep mode: very slow cycle, low volume)
      let active = true;
      const playSleepChime = () => {
        if (!active) return;
        const osc = ctx.createOscillator();
        const panner = ctx.createStereoPanner();
        const gainNode = ctx.createGain();

        // Pentatonic scale notes (warm resonance)
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00]; // Middle C major pentatonic
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        
        osc.frequency.setValueAtTime(randomNote, ctx.currentTime);
        osc.type = 'sine';
        panner.pan.setValueAtTime(Math.random() * 2 - 1, ctx.currentTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);

        osc.connect(gainNode).connect(panner).connect(this.mainVolumeNode!);
        osc.start();
        osc.stop(ctx.currentTime + 3.2);

        setTimeout(playSleepChime, 3000 + Math.random() * 4000);
      };

      playSleepChime();

      this.currentNodes.push({
        stop: () => {
          active = false;
        }
      });
    }
  }

  private playMelody(notes: { note: string; duration: number }[], tempoBpm: number) {
    const ctx = this.init();
    let active = true;
    const notesMap: { [key: string]: number } = {
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98, 'A6': 1760.00, 'REST': 0
    };

    const beatDuration = 60 / tempoBpm;

    const playSequence = () => {
      if (!active) return;
      let timeOffset = 0.05;

      notes.forEach(({ note, duration }) => {
        if (!active) return;

        const freq = notesMap[note] || 0;
        const durSec = duration * beatDuration;

        if (freq > 0) {
          const osc = ctx.createOscillator();
          const panner = ctx.createStereoPanner();
          const gainNode = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);

          // Headphone fluid pan swing
          const panValue = Math.sin(timeOffset * 2.2);
          panner.pan.setValueAtTime(panValue, ctx.currentTime + timeOffset);

          gainNode.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
          gainNode.gain.linearRampToValueAtTime(0.22, ctx.currentTime + timeOffset + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + durSec - 0.02);

          osc.connect(gainNode).connect(panner).connect(this.mainVolumeNode!);
          
          osc.start(ctx.currentTime + timeOffset);
          osc.stop(ctx.currentTime + timeOffset + durSec);

          this.currentNodes.push({
            stop: () => {
              try { osc.stop(); } catch(e){}
            }
          });
        }
        timeOffset += durSec;
      });

      const totalDurMs = timeOffset * 1000;
      const loopTimeout = window.setTimeout(() => {
        if (active) playSequence();
      }, totalDurMs + 650);

      this.currentNodes.push({
        stop: () => {
          window.clearTimeout(loopTimeout);
        }
      });
    };

    playSequence();

    return {
      stop: () => {
        active = false;
      }
    };
  }
}

// Singleton helper class
export const earphoneAudio = new EarphoneAudioEngine();
export default earphoneAudio;
