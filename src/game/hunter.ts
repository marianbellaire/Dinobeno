import { HUNTER_BASE_CATCH_UP_RATE, INITIAL_HUNTER_GAP, MIN_HUNTER_GAP } from "./constants";
import type { DinoConfig } from "./types";

export interface HunterState {
  /** Abstand zum Spieler in logischen px (schrumpft über Zeit, wächst kurz beim Boost). */
  gap: number;
}

export function createHunterState(): HunterState {
  return { gap: INITIAL_HUNTER_GAP };
}

/**
 * Lässt den Abstand zum Spieler schrumpfen – der Jäger ist per Dino-Config schneller
 * als der (trägere) Spieler-Dino, daher nähert er sich über die Zeit kontinuierlich an.
 * `speedMultiplier` kommt aus der Schwierigkeitskurve (siehe difficulty.ts).
 *
 * `playerSpeedBonus` (Tempo-Boost-Powerup, siehe constants.ts) wird auf die effektive
 * Spieler-Geschwindigkeit addiert. Wird der Spieler dadurch rechnerisch schneller als
 * der Jäger, wird die "Annäherungsrate" negativ und der Abstand wächst wieder – bis
 * maximal zum Anfangsabstand (der Jäger holt nie mehr als seinen Startvorsprung auf).
 */
export function updateHunter(
  state: HunterState,
  playerDino: DinoConfig,
  hunterDino: DinoConfig,
  dt: number,
  speedMultiplier: number,
  playerSpeedBonus = 0,
): HunterState {
  const relativeSpeed = hunterDino.speed - (playerDino.speed + playerSpeedBonus);
  const catchUpRate = HUNTER_BASE_CATCH_UP_RATE * relativeSpeed * speedMultiplier;
  const gap = state.gap - catchUpRate * dt;
  return { gap: Math.min(Math.max(gap, MIN_HUNTER_GAP), INITIAL_HUNTER_GAP) };
}

export function resetHunter(): HunterState {
  return { gap: INITIAL_HUNTER_GAP };
}

export function hasHunterCaughtUp(state: HunterState): boolean {
  return state.gap <= MIN_HUNTER_GAP;
}
