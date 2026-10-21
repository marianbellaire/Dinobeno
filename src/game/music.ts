// Leise Synthwave-Hintergrundmusik, komplett per Web Audio API erzeugt (keine Dateien).
// 4-Takt-Loop in a-Moll (Am – F – C – G) mit Oktav-Bass, weichem Pad, glitzerndem
// Arpeggio und Drumcomputer (Kick, Snare, Hi-Hat), alles durch ein Echo für den
// typischen 80er-Raumklang.
//
// Timing nach dem "Lookahead"-Prinzip: Ein kurzer setInterval-Takt plant die Noten
// jeweils ein Stück im Voraus auf der präzisen AudioContext-Uhr ein – so bleibt der
// Rhythmus stabil, auch wenn der Main-Thread mal kurz hängt.

import { getContext, getNoiseBuffer } from "./sound";

const BPM = 100;
const STEP_SECONDS = 60 / BPM / 4; // Sechzehntel
const STEPS_PER_BAR = 16;
const LOOKAHEAD_SECONDS = 0.12;
const SCHEDULER_INTERVAL_MS = 25;
const MUSIC_VOLUME = 0.12;

const PROGRESSION = [
  { root: 45, minor: true }, // Am
  { root: 41, minor: false }, // F
  { root: 48, minor: false }, // C
  { root: 43, minor: false }, // G
];

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

let wanted = false;
let muted = false;
let timerId: ReturnType<typeof setInterval> | null = null;
let nextStepTime = 0;
let step = 0;
let bus: { input: GainNode; master: GainNode } | null = null;
let visibilityListenerAdded = false;

function getBus(ctx: AudioContext) {
  if (bus) return bus;
  const master = ctx.createGain();
  master.gain.value = MUSIC_VOLUME;
  master.connect(ctx.destination);

  const input = ctx.createGain();
  input.connect(master);

  // Echo: punktierte Achtel, leise Rückkopplung
  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP_SECONDS * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.3;
  const wet = ctx.createGain();
  wet.gain.value = 0.28;
  input.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);

  bus = { input, master };
  return bus;
}

/** Oszillator → Tiefpass → Hüllkurve → Musik-Bus. */
function synthNote(
  ctx: AudioContext,
  time: number,
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  cutoff: number,
  attack = 0.01,
  detuneCents = 0,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detuneCents;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(getBus(ctx).input);
  osc.start(time);
  osc.stop(time + duration + 0.05);
}

function noiseHit(ctx: AudioContext, time: number, filterType: BiquadFilterType, cutoff: number, duration: number, volume: number) {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getBus(ctx).input);
  source.start(time, Math.random() * 0.5, duration + 0.05);
}

function kick(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
  osc.connect(gain);
  gain.connect(getBus(ctx).master); // Kick ohne Echo, sonst wird es matschig
  osc.start(time);
  osc.stop(time + 0.32);
}

function scheduleStep(ctx: AudioContext, stepIndex: number, time: number) {
  const bar = Math.floor(stepIndex / STEPS_PER_BAR) % PROGRESSION.length;
  const s = stepIndex % STEPS_PER_BAR;
  const chord = PROGRESSION[bar];
  const third = chord.root + (chord.minor ? 3 : 4);
  const fifth = chord.root + 7;

  // Oktav-Bass in Achteln, am Taktende ein Quint-Schlenker
  if (s % 2 === 0) {
    const interval = s === 12 ? 7 : s % 4 === 0 ? 0 : 12;
    synthNote(ctx, time, midiToFrequency(chord.root - 12 + interval), "sawtooth", STEP_SECONDS * 1.8, 0.45, 520);
  }

  // Pad: Akkord über den ganzen Takt, zwei leicht verstimmte Sägezähne je Ton
  if (s === 0) {
    const barSeconds = STEP_SECONDS * STEPS_PER_BAR;
    for (const note of [chord.root + 12, third + 12, fifth + 12]) {
      for (const detune of [-8, 8]) {
        synthNote(ctx, time, midiToFrequency(note), "sawtooth", barSeconds, 0.05, 900, 0.35, detune);
      }
    }
  }

  // Glitzer-Arpeggio in Sechzehnteln, zwei Oktaven höher
  const arp = [chord.root, third, fifth, third + 12, fifth, third, chord.root + 12, fifth];
  synthNote(ctx, time, midiToFrequency(arp[s % arp.length] + 24), "square", STEP_SECONDS * 0.9, 0.025, 2400);

  // Drums
  if (s % 4 === 0) kick(ctx, time);
  if (s === 4 || s === 12) {
    noiseHit(ctx, time, "bandpass", 1800, 0.2, 0.4);
    synthNote(ctx, time, 190, "triangle", 0.1, 0.15, 2000);
  }
  if (s % 4 === 2) noiseHit(ctx, time, "highpass", 7000, 0.05, 0.14);
}

function tick() {
  const ctx = getContext();
  if (!ctx) return;
  while (nextStepTime < ctx.currentTime + LOOKAHEAD_SECONDS) {
    scheduleStep(ctx, step, nextStepTime);
    nextStepTime += STEP_SECONDS;
    step = (step + 1) % (STEPS_PER_BAR * PROGRESSION.length);
  }
}

/** Startet bzw. stoppt den Scheduler je nach Wunsch, Stummschaltung und Tab-Sichtbarkeit. */
function refresh() {
  const shouldRun = wanted && !muted && typeof document !== "undefined" && !document.hidden;
  if (shouldRun && timerId === null) {
    const ctx = getContext();
    if (!ctx) return;
    const { master } = getBus(ctx);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(MUSIC_VOLUME, ctx.currentTime);
    nextStepTime = ctx.currentTime + 0.05;
    timerId = setInterval(tick, SCHEDULER_INTERVAL_MS);
    tick();
  } else if (!shouldRun && timerId !== null) {
    clearInterval(timerId);
    timerId = null;
    // Bereits eingeplante Noten (Pad klingt einen ganzen Takt) sanft ausblenden
    const ctx = getContext();
    if (ctx && bus) bus.master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  }
}

/** Musik starten (von vorn). Muss aus einer Nutzer-Geste heraus kommen (Autoplay-Regeln). */
export function startMusic(): void {
  if (typeof document === "undefined") return;
  if (!visibilityListenerAdded) {
    document.addEventListener("visibilitychange", refresh);
    visibilityListenerAdded = true;
  }
  wanted = true;
  step = 0;
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  refresh();
}

export function stopMusic(): void {
  wanted = false;
  refresh();
}

/** Stumm-Schalter: schaltet die Musik zusammen mit den Effekten aus/ein. */
export function setMusicMuted(value: boolean): void {
  muted = value;
  refresh();
}
