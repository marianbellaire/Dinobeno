import { GROUND_Y, PICKUP_SIZE, PICKUP_Y_OFFSET } from "./constants";
import type { Rect } from "./collision";

export type PickupType = "berry" | "boost" | "shield";

export interface PickupTypeConfig {
  type: PickupType;
  /** Als Emoji gezeichnet (siehe draw.ts) – einfachster MVP-Platzhalter, der schon
   *  genau die Icons aus der Spec zeigt. */
  emoji: string;
  /** Anteil an allen Spawns (muss zusammen mit den anderen Einträgen 1 ergeben). */
  weight: number;
}

// Beeren spawnen am häufigsten (reine Bonuspunkte, kein Risiko), Boost/Schild seltener.
export const PICKUP_TYPES: PickupTypeConfig[] = [
  { type: "berry", emoji: "🍓", weight: 0.6 },
  { type: "boost", emoji: "⚡", weight: 0.2 },
  { type: "shield", emoji: "🛡️", weight: 0.2 },
];

export interface Pickup {
  id: number;
  config: PickupTypeConfig;
  /** Mittelpunkt in Weltkoordinaten. */
  x: number;
  y: number;
}

export function getPickupRect(pickup: Pickup): Rect {
  const half = PICKUP_SIZE / 2;
  return { x: pickup.x - half, y: pickup.y - half, width: PICKUP_SIZE, height: PICKUP_SIZE };
}

function pickWeightedType(): PickupTypeConfig {
  const roll = Math.random();
  let acc = 0;
  for (const config of PICKUP_TYPES) {
    acc += config.weight;
    if (roll < acc) return config;
  }
  return PICKUP_TYPES[0]; // Rundungs-Fallback
}

export function createPickupSpawner() {
  let nextId = 0;
  return {
    spawn(x: number): Pickup {
      return { id: nextId++, config: pickWeightedType(), x, y: GROUND_Y - PICKUP_Y_OFFSET };
    },
  };
}
