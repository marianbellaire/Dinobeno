// Einfache Sound-Effekte per Web Audio API (Oszillator-Töne) statt externer
// Audiodateien – passt zum "einfache Platzhalter"-Ansatz der restlichen Grafiken
// und braucht keine Assets. Kann später durch echte Sounds ersetzt werden.

const MUTE_STORAGE_KEY = "dino-be-no:muted";

let audioCtx: AudioContext | null = null;
let muted = false;

function getContext(): AudioContext | null {
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

export function playGameOver(): void {
  tone(420, 220, 0.2, "triangle", 0.2);
  tone(220, 110, 0.3, "triangle", 0.18, 0.2);
}
