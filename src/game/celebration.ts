// Level-geschafft-Feier: Ein Vulkan wächst im Hintergrund aus dem Boden und bricht
// aus – aber freundlich: Statt Lava sprüht er bunte Konfetti und Funken. Hier liegt nur
// die Logik (Partikel), gezeichnet wird in draw/effects.ts.

import { GROUND_Y } from "./constants";
import { LEVEL_CELEBRATION_SECONDS } from "./levels";

export const VOLCANO_HEIGHT = 160;
export const VOLCANO_WIDTH = 260;

const RISE_SECONDS = 0.6;
const ERUPTION_START = 0.5;
const ERUPTION_END = LEVEL_CELEBRATION_SECONDS - 0.9;
const PARTICLES_PER_SECOND = 90;
const PARTICLE_GRAVITY = 520;

const COLORS = ["#ff5e3a", "#ffb400", "#ff3cac", "#7afcff", "#fff275", "#9b5de5", "#5dff8f"];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number;
  /** Konfetti = rotierende Rechtecke, Funken = leuchtende Punkte. */
  kind: "confetti" | "spark";
}

export interface CelebrationState {
  time: number;
  volcanoX: number;
  particles: Particle[];
  spawnAccumulator: number;
}

export function createCelebration(volcanoX: number): CelebrationState {
  return { time: 0, volcanoX, particles: [], spawnAccumulator: 0 };
}

/** 0 … 1: wie weit der Vulkan aus dem Boden ragt (am Ende sinkt er wieder ab). */
export function getVolcanoRise(time: number): number {
  const up = Math.min(1, time / RISE_SECONDS);
  const down = Math.min(1, Math.max(0, (LEVEL_CELEBRATION_SECONDS - time) / RISE_SECONDS));
  const eased = 1 - (1 - Math.min(up, down)) ** 3;
  return eased;
}

export function getCraterY(time: number): number {
  return GROUND_Y - VOLCANO_HEIGHT * getVolcanoRise(time);
}

/** Stärke des Ausbruchs 0 … 1 (für Himmel-Glühen und Rauch). */
export function getEruptionIntensity(time: number): number {
  if (time < ERUPTION_START || time > ERUPTION_END + 0.6) return 0;
  const fadeIn = Math.min(1, (time - ERUPTION_START) / 0.3);
  const fadeOut = Math.min(1, (ERUPTION_END + 0.6 - time) / 0.6);
  return Math.min(fadeIn, fadeOut);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function updateCelebration(state: CelebrationState, dt: number): CelebrationState {
  const time = state.time + dt;
  const particles: Particle[] = [];

  for (const p of state.particles) {
    const life = p.life - dt;
    if (life <= 0 || p.y > GROUND_Y + 20) continue;
    particles.push({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      // Konfetti segelt (Luftwiderstand), Funken fallen schneller
      vx: p.vx * (p.kind === "confetti" ? 0.985 : 1),
      vy: p.vy + PARTICLE_GRAVITY * dt * (p.kind === "confetti" ? 0.55 : 1),
      rotation: p.rotation + p.spin * dt,
      life,
    });
  }

  let spawnAccumulator = state.spawnAccumulator;
  if (time >= ERUPTION_START && time <= ERUPTION_END) {
    spawnAccumulator += PARTICLES_PER_SECOND * dt;
    const craterY = getCraterY(time);
    while (spawnAccumulator >= 1) {
      spawnAccumulator -= 1;
      const kind = Math.random() < 0.7 ? "confetti" : "spark";
      particles.push({
        x: state.volcanoX + randomBetween(-12, 12),
        y: craterY + 4,
        vx: randomBetween(-190, 190),
        vy: randomBetween(-640, -380),
        size: kind === "confetti" ? randomBetween(5, 9) : randomBetween(2.5, 4.5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        spin: randomBetween(-10, 10),
        life: randomBetween(1.6, 2.6),
        kind,
      });
    }
  }

  return { ...state, time, particles, spawnAccumulator };
}
