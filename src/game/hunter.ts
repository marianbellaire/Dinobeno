import { HUNTER_BASE_CATCH_UP_RATE, INITIAL_HUNTER_GAP, MIN_HUNTER_GAP } from "./constants";
import type { DinoConfig } from "./types";

export interface HunterState {
  /** Abstand zum Spieler in logischen px (schrumpft über Zeit). */
  gap: number;
}

export function createHunterState(): HunterState {
  return { gap: INITIAL_HUNTER_GAP };
}

/**
 * Lässt den Abstand zum Spieler schrumpfen – der Jäger ist per Dino-Config schneller
 * als der (trägere) Spieler-Dino, daher nähert er sich über die Zeit kontinuierlich an.
 * `speedMultiplier` kommt aus der Schwierigkeitskurve (siehe difficulty.ts).
 */
export function updateHunter(
  state: HunterState,
  playerDino: DinoConfig,
  hunterDino: DinoConfig,
  dt: number,
  speedMultiplier: number,
): HunterState {
  const relativeSpeed = Math.max(hunterDino.speed - playerDino.speed, 0.05);
  const catchUpRate = HUNTER_BASE_CATCH_UP_RATE * relativeSpeed * speedMultiplier;
  return { gap: Math.max(state.gap - catchUpRate * dt, MIN_HUNTER_GAP) };
}

export function resetHunter(): HunterState {
  return { gap: INITIAL_HUNTER_GAP };
}

export function hasHunterCaughtUp(state: HunterState): boolean {
  return state.gap <= MIN_HUNTER_GAP;
}
