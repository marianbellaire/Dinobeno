import { GROUND_Y, OVERHEAD_CLEARANCE } from "./constants";
import type { Rect } from "./collision";

export type ObstacleType = "stone" | "bush" | "fern" | "horsetail" | "pterodactyl" | "vine";

/** "ground" = steht am Boden (drüberspringen), "overhead" = hängt/fliegt darüber (ducken). */
export type ObstacleKind = "ground" | "overhead";

export interface ObstacleTypeConfig {
  type: ObstacleType;
  kind: ObstacleKind;
  width: number;
  /** Höhe des Sprites. Bei `vine` reicht es bis zum oberen Bildrand, siehe getObstacleRect. */
  height: number;
  /** Anteil, um den die Hitbox links/rechts kleiner ist als das Sprite (faires Gameplay). */
  hitboxInset: number;
  /** Vertikaler Hitbox-Inset in px (oben/unten). Bei Duck-Hindernissen bewusst klein,
   *  damit die Unterkante genau zwischen geducktem und stehendem Spieler liegt. */
  hitboxInsetY: number;
}

// Geometrische Platzhalter, gezeichnet in draw/world.ts.
export const OBSTACLE_TYPES: Record<ObstacleType, ObstacleTypeConfig> = {
  stone: { type: "stone", kind: "ground", width: 40, height: 34, hitboxInset: 0.15, hitboxInsetY: 5 },
  bush: { type: "bush", kind: "ground", width: 54, height: 38, hitboxInset: 0.16, hitboxInsetY: 6 },
  fern: { type: "fern", kind: "ground", width: 46, height: 48, hitboxInset: 0.2, hitboxInsetY: 8 },
  horsetail: { type: "horsetail", kind: "ground", width: 28, height: 68, hitboxInset: 0.2, hitboxInsetY: 6 },
  pterodactyl: { type: "pterodactyl", kind: "overhead", width: 62, height: 40, hitboxInset: 0.15, hitboxInsetY: 4 },
  vine: { type: "vine", kind: "overhead", width: 40, height: GROUND_Y - OVERHEAD_CLEARANCE, hitboxInset: 0.15, hitboxInsetY: 4 },
};

/** Relative Häufigkeit je Hindernisart – kommt pro Level aus levels.ts. */
export type ObstacleWeights = Partial<Record<ObstacleType, number>>;

export interface Obstacle {
  id: number;
  config: ObstacleTypeConfig;
  /** Linke Kante in Weltkoordinaten. */
  x: number;
}

/** Sprite-Rechteck in Weltkoordinaten. */
export function getObstacleRect(obstacle: Obstacle): Rect {
  const { kind, width, height } = obstacle.config;
  const bottom = kind === "overhead" ? GROUND_Y - OVERHEAD_CLEARANCE : GROUND_Y;
  return { x: obstacle.x, y: bottom - height, width, height };
}

/** Kollisions-Rechteck: Sprite-Rechteck abzüglich der fairen Insets. */
export function getObstacleHitbox(obstacle: Obstacle): Rect {
  const rect = getObstacleRect(obstacle);
  const { hitboxInset, hitboxInsetY } = obstacle.config;
  const insetX = rect.width * hitboxInset;
  return {
    x: rect.x + insetX,
    y: rect.y + hitboxInsetY,
    width: rect.width - insetX * 2,
    height: rect.height - hitboxInsetY * 2,
  };
}

/** Würfelt eine Hindernisart gemäß Gewichtung aus. */
export function pickObstacleType(weights: ObstacleWeights): ObstacleTypeConfig {
  const entries = Object.entries(weights) as [ObstacleType, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll < 0) return OBSTACLE_TYPES[type];
  }
  return OBSTACLE_TYPES[entries[0]?.[0] ?? "stone"]; // Rundungs-Fallback
}

/**
 * Kapselt die fortlaufende ID-Vergabe in einer Instanz statt in einem Modul-globalen
 * Zähler, damit mehrere Spiel-Instanzen (z.B. HMR) sich nicht in die Quere kommen.
 */
export function createObstacleSpawner() {
  let nextId = 0;
  return {
    spawn(x: number, config: ObstacleTypeConfig): Obstacle {
      return { id: nextId++, config, x };
    },
  };
}
