// Einfache Sound-Effekte per Web Audio API (Oszillator-Töne) statt externer
// Audiodateien – passt zum "einfache Platzhalter"-Ansatz der restlichen Grafiken
// und braucht keine Assets. Kann später durch echte Sounds ersetzt werden.

const MUTE_STORAGE_KEY = "dino-be-no:muted";

let audioCtx: AudioContext | null = null;
let muted = false;

export function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null; // Browser ohne Web-Audio-Unterstützung: Spiel bleibt stumm, aber spielbar
    audioCtx = new Ctor();
  }
  // Browser suspenden den Context, bis eine echte Nutzer-Geste stattfand
  // (hier: Sprung/Ducken/Klick) – hier bei jedem Ton erneut versuchen fortzusetzen.
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

let noiseBuffer: AudioBuffer | null = null;

/** 1 Sekunde weißes Rauschen, einmal erzeugt und für alle Rausch-Sounds geteilt
 *  (Snare/Hi-Hat in music.ts, Schnappen, Jubel). */
export function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** Gefiltertes Rauschen mit Hüllkurve – Baustein für Schnapp- und Jubel-Sounds. */
function noise(
  duration: number,
  filterType: BiquadFilterType,
  frequency: number,
  volume: number,
  delay = 0,
  attack = 0.005,
) {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  const gain = ctx.createGain();

  const startTime = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime, Math.random() * 0.5);
  source.stop(startTime + duration + 0.02);
}

export function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // localStorage evtl. nicht verfügbar – Einstellung gilt dann nur für diese Session
  }
}

/** Kurzer Ton mit Frequenz-Sweep und Fade-out. Baustein für alle Sound-Effekte unten. */
function tone(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  delay = 0,
) {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;

  const startTime = ctx.currentTime + delay;
  osc.frequency.setValueAtTime(freqStart, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), startTime + duration);

  // exponentialRamp kann nicht bis exakt 0 gehen, daher knapp über Null als "Stille".
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export function playJump(): void {
  tone(320, 700, 0.15, "square", 0.15);
}

export function playHit(): void {
  tone(180, 60, 0.25, "sawtooth", 0.25);
}

export function playBerry(): void {
  tone(660, 880, 0.08, "sine", 0.18);
  tone(880, 1180, 0.1, "sine", 0.15, 0.08);
}

/**
 * Jäger beißt zu: tiefes, vibrierendes Knurren, dann ein scharfes Zuschnappen der
 * Kiefer. Bewusst anders als der kurze Hindernis-Treffer (playHit).
 */
export function playHunterBite(): void {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  // Knurren: Sägezahn mit schnellem Vibrato durch einen Tiefpass
  const growl = ctx.createOscillator();
  growl.type = "sawtooth";
  const startTime = ctx.currentTime;
  growl.frequency.setValueAtTime(95, startTime);
  growl.frequency.exponentialRampToValueAtTime(60, startTime + 0.4);
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 28;
  const vibratoDepth = ctx.createGain();
  vibratoDepth.gain.value = 18;
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(growl.frequency);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 700;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.32, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.42);
  growl.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(ctx.destination);
  growl.start(startTime);
  vibrato.start(startTime);
  growl.stop(startTime + 0.45);
  vibrato.stop(startTime + 0.45);

  // Zuschnappen: zwei harte Klicks (Zähne treffen aufeinander)
  noise(0.06, "highpass", 2500, 0.5, 0.12, 0.002);
  noise(0.08, "bandpass", 1200, 0.35, 0.14, 0.002);
  tone(160, 50, 0.12, "square", 0.18, 0.12);
}

/** Jäger verschlingt einen Meteoriten: dumpfes "Gulp" mit kleinem Blubbern. */
export function playGulp(): void {
  tone(320, 70, 0.18, "sine", 0.22);
  tone(180, 260, 0.08, "sine", 0.12, 0.16);
  noise(0.1, "lowpass", 400, 0.15, 0.02);
}

/**
 * Level geschafft: Vulkan-Grollen, fröhliche Fanfare (Dur-Arpeggio) und "Jubel" aus
 * moduliertem Rauschen + aufsteigenden "Juhu"-Glissandi.
 */
export function playLevelComplete(): void {
  // Grollen beim Aufsteigen des Vulkans
  tone(70, 40, 0.7, "sawtooth", 0.18);
  noise(0.8, "lowpass", 220, 0.3, 0, 0.1);

  // Fanfare: C-E-G-C, letzter Ton länger
  const fanfare = [523.25, 659.25, 783.99, 1046.5];
  fanfare.forEach((freq, i) => {
    const last = i === fanfare.length - 1;
    tone(freq, freq, last ? 0.6 : 0.16, "square", 0.12, 0.45 + i * 0.13);
    tone(freq / 2, freq / 2, last ? 0.6 : 0.16, "triangle", 0.12, 0.45 + i * 0.13);
  });

  // Jubel der Menge: viele kurze Rausch-Stöße im Sprachbereich
  for (let i = 0; i < 14; i++) {
    noise(0.25 + Math.random() * 0.3, "bandpass", 900 + Math.random() * 1600, 0.05, 0.6 + i * 0.1, 0.05);
  }
  // "Juhuu!"-Rufe: aufsteigende Glissandi in verschiedenen Stimmlagen
  for (const [start, end, delay] of [
    [380, 720, 0.7],
    [460, 880, 0.85],
    [300, 620, 1.05],
  ]) {
    tone(start, end, 0.35, "triangle", 0.07, delay);
  }
}

export function playGameOver(): void {
  tone(420, 220, 0.2, "triangle", 0.2);
  tone(220, 110, 0.3, "triangle", 0.18, 0.2);
}
