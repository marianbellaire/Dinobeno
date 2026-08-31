import {
  BASE_JUMP_VELOCITY,
  GRAVITY,
  GROUND_Y,
  MIN_DUCK_SECONDS,
  PLAYER_DUCK_HEIGHT,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from "./constants";
import type { Rect } from "./collision";
import type { DinoConfig } from "./types";

export interface PlayerState {
  /** Vertikaler Versatz über dem Boden in logischen px (0 = steht auf dem Boden). */
  height: number;
  velocityY: number;
  isJumping: boolean;
  isDucking: boolean;
  /** Verbleibende Sekunden, bis das Ducken automatisch endet. */
  duckTimeRemaining: number;
}

export function createPlayerState(): PlayerState {
  return {
    height: 0,
    velocityY: 0,
    isJumping: false,
    isDucking: false,
    duckTimeRemaining: 0,
  };
}

/** Startet einen Sprung, falls der Spieler gerade am Boden steht. */
export function jump(state: PlayerState, dino: DinoConfig): PlayerState {
  if (state.isJumping) return state;
  return {
    ...state,
    isJumping: true,
    isDucking: false,
    duckTimeRemaining: 0,
    velocityY: BASE_JUMP_VELOCITY * dino.jumpHeight,
  };
}

/** Startet einen zeitlich begrenzten Duck-Vorgang (dino.duckDuration, min. MIN_DUCK_SECONDS). */
export function duck(state: PlayerState, dino: DinoConfig): PlayerState {
  if (state.isJumping) return state; // in der Luft kann nicht geduckt werden
  return {
    ...state,
    isDucking: true,
    duckTimeRemaining: Math.max(dino.duckDuration, MIN_DUCK_SECONDS),
  };
}

/** Wendet Schwerkraft an, landet den Spieler und zählt eine laufende Duck-Zeit herunter. */
export function updatePlayer(state: PlayerState, dt: number): PlayerState {
  let next = state;

  if (next.isJumping) {
    const velocityY = next.velocityY + GRAVITY * dt;
    const height = next.height - next.velocityY * dt;
    next =
      height <= 0
        ? { ...next, height: 0, velocityY: 0, isJumping: false }
        : { ...next, height, velocityY };
  }

  if (next.isDucking) {
    const duckTimeRemaining = next.duckTimeRemaining - dt;
    next =
      duckTimeRemaining <= 0
        ? { ...next, isDucking: false, duckTimeRemaining: 0 }
        : { ...next, duckTimeRemaining };
  }

  return next;
}

export function getPlayerHitboxHeight(state: PlayerState): number {
  return state.isDucking ? PLAYER_DUCK_HEIGHT : PLAYER_HEIGHT;
}

/** Bounding-Box des Spielers in Weltkoordinaten (vor dem Hitbox-Inset für die Kollision). */
export function getPlayerRect(x: number, state: PlayerState): Rect {
  const height = getPlayerHitboxHeight(state);
  const groundY = GROUND_Y - state.height;
  return { x, y: groundY - height, width: PLAYER_WIDTH, height };
}
