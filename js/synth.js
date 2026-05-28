/* ============================================================
   MAGIC OF FEELINGS — js/synth.js
   Procedural Romantic Web Audio API Synthesizer
   ============================================================ */

class RomanticSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.delayNode = null;
    this.filterNode = null;
    this.isPlaying = false;
    this.chordInterval = null;
    
    // Romantic chords (Cmaj7, Fmaj7, Am9, G6)
    this.chords = [
      [130.81, 164.81, 196.00, 246.94, 329.63], // Cmaj7
      [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj7
      [220.00, 261.63, 329.63, 392.00, 493.88], // Am9
      [196.00, 246.94, 293.66, 392.00, 493.88]  // G6
    ];
    this.currentChordIndex = 0;
    this.tempo = 4500; // time in ms per chord
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(750, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1, this.ctx.currentTime);
    
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(0.6, this.ctx.currentTime);
    
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.42, this.ctx.currentTime);
    
    const delayWet = this.ctx.createGain();
    delayWet.gain.setValueAtTime(0.35, this.ctx.currentTime);
    
    this.filterNode.connect(this.masterGain);
    
    this.filterNode.connect(this.delayNode);
    this.delayNode.connect(delayFeedback);
    delayFeedback.connect(this.delayNode);
    
    this.delayNode.connect(delayWet);
    delayWet.connect(this.masterGain);
    
    this.masterGain.connect(this.ctx.destination);
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.isPlaying = true;
    this.masterGain.gain.linearRampToValueAtTime(0.45, this.ctx.currentTime + 2.5);
    
    this.playNextChord();
    this.chordInterval = setInterval(() => {
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      this.playNextChord();
    }, this.tempo);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    clearInterval(this.chordInterval);
    
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
    }
  }

  playNextChord() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = this.chords[this.currentChordIndex];
    
    freqs.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08 / freqs.length, now + 1.5 + (index * 0.25));
      gainNode.gain.setValueAtTime(0.08 / freqs.length, now + (this.tempo/1000 - 1.2));
      gainNode.gain.linearRampToValueAtTime(0, now + (this.tempo/1000));
      
      osc.connect(gainNode);
      gainNode.connect(this.filterNode);
      
      osc.start(now);
      osc.stop(now + (this.tempo/1000) + 0.1);
    });
  }

  playBell(scaleIndex) {
    if (!this.ctx || this.ctx.state === 'suspended' || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    
    const baseChord = this.chords[this.currentChordIndex];
    const baseFreq = baseChord[scaleIndex % baseChord.length];
    const bellFreq = baseFreq * 4; // Transpose to high register
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(bellFreq, now);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(bellFreq + 3, now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.035, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.filterNode);
    
    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 2.1);
    osc2.stop(now + 2.1);
  }

  modulateToTriumphant() {
    if (!this.isPlaying) return;

    // Harmonious, bright D Major arpeggio scales
    this.chords = [
      [146.83, 185.00, 220.00, 277.18, 369.99], // Dmaj7
      [196.00, 246.94, 293.66, 369.99, 440.00], // Gmaj7
      [246.94, 293.66, 369.99, 440.00, 554.37], // Bm9
      [220.00, 277.18, 329.63, 440.00, 554.37]  // A6
    ];
    
    this.currentChordIndex = 0;
    this.tempo = 3800; // slightly faster tempo
    this.playNextChord();
    
    clearInterval(this.chordInterval);
    this.chordInterval = setInterval(() => {
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      this.playNextChord();
    }, this.tempo);
    
    const bellPitches = [0, 2, 4, 3, 7];
    bellPitches.forEach((pIndex, step) => {
      setTimeout(() => {
        this.playBell(pIndex);
      }, step * 250);
    });
  }
}

// Expose synth globally
window.synth = new RomanticSynth();
