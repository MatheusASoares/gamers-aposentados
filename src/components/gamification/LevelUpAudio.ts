// Web Audio API Procedural Sound Synthesizer for Level Up Celebrations

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * 1. Cyberpunk Theme: Synthwave Arpeggio with Cyber Harmonic Sweeps
 */
function playCyberpunkSound(ctx: AudioContext, master: GainNode) {
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4, E4, G4, C5, E5, G5, C6
  const now = ctx.currentTime;

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now + index * 0.08);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(freq * 1.5, now + index * 0.08);
    filter.Q.setValueAtTime(3.0, now + index * 0.08);

    const startTime = now + index * 0.08;
    const duration = index === notes.length - 1 ? 1.2 : 0.25;

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });
}

/**
 * 2. Medieval Theme: Triumphant Royal Brass & Bell Resonance
 */
function playMedievalSound(ctx: AudioContext, master: GainNode) {
  const notes = [196.0, 261.63, 329.63, 392.0, 523.25]; // G3, C4, E4, G4, C5 (Majestic Trumpet Fanfare)
  const now = ctx.currentTime;

  notes.forEach((freq, index) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "triangle";
    osc2.type = "sine";

    const startTime = now + index * 0.12;
    const duration = index === notes.length - 1 ? 1.8 : 0.35;

    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq * 2, startTime); // Harmonic octave bell

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(master);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
  });
}

/**
 * 3. Space Theme: Celestial Cosmic Warp Shimmer & Crystal Harmonics
 */
function playSpaceSound(ctx: AudioContext, master: GainNode) {
  const freqs = [329.63, 493.88, 659.25, 987.77, 1318.51]; // E4, B4, E5, B5, E6 (Dreamy Sci-Fi Fifth Intervals)
  const now = ctx.currentTime;

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const startTime = now + i * 0.09;
    const duration = 1.5;

    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + duration); // Cosmic shimmer glissando

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(master);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });
}

/**
 * 4. Pixel Theme: Classic 16-Bit / 8-Bit Chiptune Square Wave Jingle
 */
function playPixelSound(ctx: AudioContext, master: GainNode) {
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51]; // Quick energetic retro arpeggio
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    const startTime = now + i * 0.06;
    const duration = i === notes.length - 1 ? 0.8 : 0.08;

    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(master);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  });
}

/**
 * 5. Almas Sombrias / Dark Souls Theme: Ominous Cathedral Bell & Roaring Bonfire
 */
function playDarkSoulsSound(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;

  // Deep resonant cathedral bell (D2 + D3 + F3 + A3 harmonic chime)
  const bellFreqs = [73.42, 146.83, 174.61, 220.0, 440.0];
  bellFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = i === 0 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, now);

    const duration = 3.5;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25 / (i + 1), now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  });

  // Bonfire fiery flame swell
  const flameOsc = ctx.createOscillator();
  const flameGain = ctx.createGain();
  flameOsc.type = "sawtooth";
  flameOsc.frequency.setValueAtTime(55, now);
  flameOsc.frequency.exponentialRampToValueAtTime(110, now + 1.2);

  flameGain.gain.setValueAtTime(0.001, now);
  flameGain.gain.exponentialRampToValueAtTime(0.12, now + 0.5);
  flameGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

  flameOsc.connect(flameGain);
  flameGain.connect(master);
  flameOsc.start(now);
  flameOsc.stop(now + 2.6);
}

/**
 * Main dispatcher to play themed level-up audio
 */
export function playLevelUpAudio(theme: string = "cyberpunk", isMuted: boolean = false) {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const cleanTheme = theme.toLowerCase();
    if (cleanTheme.includes("darksouls") || cleanTheme.includes("ascendant") || cleanTheme.includes("souls")) {
      playDarkSoulsSound(ctx, masterGain);
    } else if (cleanTheme.includes("medieval")) {
      playMedievalSound(ctx, masterGain);
    } else if (cleanTheme.includes("space")) {
      playSpaceSound(ctx, masterGain);
    } else if (cleanTheme.includes("pixel")) {
      playPixelSound(ctx, masterGain);
    } else {
      // Default: Cyberpunk
      playCyberpunkSound(ctx, masterGain);
    }
  } catch (err) {
    console.warn("[LevelUpAudio] Could not play procedural audio:", err);
  }
}
