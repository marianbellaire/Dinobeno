import {
  BASE_JUMP_VELOCITY,
  GRAVITY,
  PLAYER_DUCK_HEIGHT,
  PLAYER_HEIGHT,
} from "./constants";
import type { DinoConfig } from "./types";

export interface PlayerState {
  /** Vertikaler Versatz über dem Boden in logischen px (0 = steht auf dem Boden). */
  height: number;
  velocityY: number;
  isJumping: boolean;
  isDucking: boolean;
}

export function createPlayerState(): PlayerState {
  return { height: 0, velocityY: 0, isJumping: false, isDucking: false };
}

/** Startet einen Sprung, falls der Spieler gerade am Boden steht. */
export function jump(state: PlayerState, dino: DinoConfig): PlayerState {
  if (state.isJumping) return state;
  return {
    ...state,
    isJumping: true,
    isDucking: false,
    velocityY: BASE_JUMP_VELOCITY * dino.jumpHeight,
  };
}

export function setDucking(state: PlayerState, ducking: boolean): PlayerState {
  if (state.isJumping) return state; // in der Luft kann nicht geduckt werden
  return { ...state, isDucking: ducking };
}

/** Wendet Schwerkraft an und landet den Spieler wieder auf dem Boden. */
export function updatePlayer(state: PlayerState, dt: number): PlayerState {
  if (!state.isJumping) return state;

  const velocityY = state.velocityY + GRAVITY * dt;
  const height = state.height - state.velocityY * dt;

  if (height <= 0) {
    return { ...state, height: 0, velocityY: 0, isJumping: false };
  }
  return { ...state, height, velocityY };
}

export function getPlayerHitboxHeight(state: PlayerState): number {
  return state.isDucking ? PLAYER_DUCK_HEIGHT : PLAYER_HEIGHT;
}
