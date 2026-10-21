import {
  GROUND_Y,
  HUNTER_BASE_CATCH_UP_RATE,
  HUNTER_HEIGHT,
  HUNTER_RETREAT_SPEED,
  HUNTER_SCALE_SPEED_FACTOR,
  HUNTER_WIDTH,
  INITIAL_HUNTER_GAP,
  JAW_FULL_OPEN_GAP,
  JAW_OPEN_START_GAP,
  MAX_HUNTER_SCALE,
  METEOR_GROWTH,
  MIN_HUNTER_GAP,
} from "./constants";
import type { DinoConfig } from "./types";

export interface HunterState {
  /** Abstand zum Spieler in logischen px (schrumpft über Zeit, wächst kurz beim Boost). */
  gap: number;
  /** Größenfaktor – wächst mit jedem verschlungenen Meteoriten, pro Level zurückgesetzt. */
  scale: number;
  /** true nach einem Biss bzw. während der Level-Feier: fällt bis zum Startabstand zurück. */
  retreating: boolean;
  /** Maul-Öffnung 0 (zu) … 1 (weit aufgerissen), geglättet über die Zeit. */
  jawOpen: number;
  /** > 0 direkt nach einem Biss/Schluck: Maul schnappt zu. */
  snapTimer: number;
  /** 1 direkt nach einem verschlungenen Meteoriten, klingt ab (Glühen im Bauch). */
  bellyGlow: number;
}

export function createHunterState(): HunterState {
  return {
    gap: INITIAL_HUNTER_GAP,
    scale: 1,
    retreating: false,
    jawOpen: 0,
    snapTimer: 0,
    bellyGlow: 0,
  };
}

/**
 * Abstand, korrigiert um die Größe: Der Jäger wächst nach vorn (Füße bleiben, wo sie
 * sind), sein Maul ist bei gleichem `gap` also näher am Spieler.
 */
export function getEffectiveGap(state: HunterState): number {
  return state.gap - HUNTER_WIDTH * (state.scale - 1);
}

/** Position des Mauls in Weltkoordinaten (Ziel für Meteoriten, siehe meteors.ts). */
export function getHunterMouth(hunterX: number, state: HunterState): { x: number; y: number } {
  return {
    x: hunterX + HUNTER_WIDTH * 0.95 * state.scale,
    y: GROUND_Y - HUNTER_HEIGHT * 0.88 * state.scale,
  };
}

export interface HunterUpdateOptions {
  /** Welt-/Jäger-Tempo-Multiplikator aus der Levelkurve (siehe levels.ts). */
  speedMultiplier: number;
  /** Tempo-Boost des Spielers (⚡-Powerup). */
  playerSpeedBonus: number;
  /** Ein Meteorit ist kurz vor dem Maul – Maul schon mal aufreißen. */
  mealIncoming: boolean;
}

/**
 * Lässt den Abstand zum Spieler schrumpfen – der Jäger ist per Dino-Config schneller
 * als der (trägere) Spieler-Dino, daher nähert er sich über die Zeit kontinuierlich an.
 * Ein größerer Jäger (Meteoriten gefressen) holt zusätzlich schneller auf.
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
  options: HunterUpdateOptions,
): HunterState {
  let { gap, retreating } = state;

  if (retreating) {
    gap += HUNTER_RETREAT_SPEED * dt;
    if (gap >= INITIAL_HUNTER_GAP) retreating = false;
  } else {
    const relativeSpeed = hunterDino.speed - (playerDino.speed + options.playerSpeedBonus);
    const sizeFactor = 1 + (state.scale - 1) * HUNTER_SCALE_SPEED_FACTOR;
    const catchUpRate = HUNTER_BASE_CATCH_UP_RATE * relativeSpeed * options.speedMultiplier * sizeFactor;
    gap -= catchUpRate * dt;
  }
  gap = Math.min(gap, INITIAL_HUNTER_GAP);

  const snapTimer = Math.max(0, state.snapTimer - dt);
  const effectiveGap = gap - HUNTER_WIDTH * (state.scale - 1);
  const nearPlayer = (JAW_OPEN_START_GAP - effectiveGap) / (JAW_OPEN_START_GAP - JAW_FULL_OPEN_GAP);
  const jawTarget =
    snapTimer > 0 || retreating ? 0 : Math.max(Math.min(Math.max(nearPlayer, 0), 1), options.mealIncoming ? 1 : 0);
  // Langsam und bedrohlich aufreißen, blitzschnell zuschnappen.
  const jawOpen =
    jawTarget > state.jawOpen
      ? Math.min(jawTarget, state.jawOpen + 4 * dt)
      : Math.max(jawTarget, state.jawOpen - 20 * dt);

  return {
    ...state,
    gap,
    retreating,
    jawOpen,
    snapTimer,
    bellyGlow: Math.max(0, state.bellyGlow - dt * 1.5),
  };
}

export function hasHunterCaughtUp(state: HunterState): boolean {
  return !state.retreating && getEffectiveGap(state) <= MIN_HUNTER_GAP;
}

/** Nach einem Biss: Maul schnappt zu, dann fällt der Jäger zurück (Größe bleibt). */
export function biteAndRetreat(state: HunterState): HunterState {
  return { ...state, retreating: true, snapTimer: 0.3 };
}

/** Level geschafft: Jäger fällt zurück, ohne zu beißen. */
export function retreat(state: HunterState): HunterState {
  return { ...state, retreating: true };
}

/** Meteorit verschlungen: zuschnappen, wachsen (gedeckelt), Bauch glüht. */
export function eatMeteor(state: HunterState): HunterState {
  return {
    ...state,
    scale: Math.min(MAX_HUNTER_SCALE, state.scale + METEOR_GROWTH),
    snapTimer: 0.2,
    bellyGlow: 1,
  };
}
