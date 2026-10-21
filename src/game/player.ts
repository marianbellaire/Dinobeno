import {
  BASE_JUMP_VELOCITY,
  FAST_FALL_GRAVITY_MULTIPLIER,
  FAST_FALL_START_VELOCITY,
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
  /** true, solange Taste/Knopf zum Ducken gedrückt gehalten wird. */
  duckHeld: boolean;
  /** Ducken in der Luft ausgelöst: fällt mit erhöhter Schwerkraft zurück auf den Boden. */
  fastFalling: boolean;
  /** Verbleibende Sekunden der Mindest-Duck-Zeit (endet erst, wenn auch losgelassen). */
  duckTimeRemaining: number;
}

export function createPlayerState(): PlayerState {
  return {
    height: 0,
    velocityY: 0,
    isJumping: false,
    isDucking: false,
    duckHeld: false,
    fastFalling: false,
    duckTimeRemaining: 0,
  };
}

/** Startet einen Sprung, falls der Spieler gerade am Boden steht. */
export function jump(state: PlayerState, dino: DinoConfig, strength = 1): PlayerState {
  if (state.isJumping) return state;
  return {
    ...state,
    isJumping: true,
    isDucking: false,
    duckHeld: false,
    duckTimeRemaining: 0,
    velocityY: BASE_JUMP_VELOCITY * dino.jumpHeight * strength,
  };
}

/**
 * Startet einen Duck-Vorgang. `held` = solange gedrückt (Taste/Knopf), sonst nur für
 * die Mindest-Duck-Zeit des Dinos (Swipe). In der Luft löst Ducken einen schnellen
 * Fall aus; wird dabei weiter gehalten, duckt der Dino direkt bei der Landung.
 */
export function duck(state: PlayerState, dino: DinoConfig, held: boolean): PlayerState {
  if (state.isJumping) {
    return {
      ...state,
      fastFalling: true,
      duckHeld: held,
      velocityY: Math.max(state.velocityY, FAST_FALL_START_VELOCITY),
    };
  }
  return {
    ...state,
    isDucking: true,
    duckHeld: held,
    duckTimeRemaining: Math.max(dino.duckDuration, MIN_DUCK_SECONDS),
  };
}

/** Taste/Knopf losgelassen – Ducken endet, sobald die Mindest-Duck-Zeit abgelaufen ist. */
export function releaseDuck(state: PlayerState): PlayerState {
  return state.duckHeld ? { ...state, duckHeld: false } : state;
}

/** Wendet Schwerkraft an, landet den Spieler und zählt eine laufende Duck-Zeit herunter. */
export function updatePlayer(state: PlayerState, dt: number): PlayerState {
  let next = state;

  if (next.isJumping) {
    const gravity = GRAVITY * (next.fastFalling ? FAST_FALL_GRAVITY_MULTIPLIER : 1);
    const velocityY = next.velocityY + gravity * dt;
    const height = next.height - next.velocityY * dt;
    if (height <= 0) {
      next = { ...next, height: 0, velocityY: 0, isJumping: false, fastFalling: false };
      if (next.duckHeld) next = { ...next, isDucking: true, duckTimeRemaining: 0 };
    } else {
      next = { ...next, height, velocityY };
    }
  }

  if (next.isDucking) {
    const duckTimeRemaining = Math.max(0, next.duckTimeRemaining - dt);
    next =
      duckTimeRemaining <= 0 && !next.duckHeld
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
