import { GROUND_Y } from "./constants";
import type { Rect } from "./collision";

export type ObstacleType = "stone" | "tree" | "enemy";

export interface ObstacleTypeConfig {
  type: ObstacleType;
  width: number;
  height: number;
  color: string;
  /** Anteil, um den die Hitbox pro Seite kleiner ist als das Sprite (faires Gameplay). */
  hitboxInset: number;
}

// MVP-Platzhalter: einfache geometrische Formen statt echter Sprites (siehe draw.ts).
export const OBSTACLE_TYPES: ObstacleTypeConfig[] = [
  { type: "stone", width: 40, height: 34, color: "#8d8d8d", hitboxInset: 0.15 },
  { type: "tree", width: 34, height: 66, color: "#3f6b31", hitboxInset: 0.2 },
  { type: "enemy", width: 46, height: 40, color: "#a63a3a", hitboxInset: 0.12 },
];

export interface Obstacle {
  id: number;
  config: ObstacleTypeConfig;
  /** Linke Kante in Weltkoordinaten. */
  x: number;
}

export function getObstacleRect(obstacle: Obstacle): Rect {
  const { width, height } = obstacle.config;
  return { x: obstacle.x, y: GROUND_Y - height, width, height };
}

/**
 * Kapselt die fortlaufende ID-Vergabe in einer Instanz statt in einem Modul-globalen
 * Zähler, damit mehrere Spiel-Instanzen (z.B. HMR) sich nicht in die Quere kommen.
 */
export function createObstacleSpawner() {
  let nextId = 0;
  return {
    spawn(x: number): Obstacle {
      const config = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      return { id: nextId++, config, x };
    },
  };
}
