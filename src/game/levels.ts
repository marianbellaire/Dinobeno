// Progressive Level: Jedes Level ist eine feste Strecke, die mit jedem Level länger,
// schneller und dichter wird. Endlos per Formel statt fester Tabelle. Innerhalb eines
// Levels zieht die Schwierigkeit zusätzlich leicht an (siehe `progress`-Parameter).

import type { ObstacleWeights } from "./obstacles";

/** Umrechnung Welt-Pixel → angezeigte Meter (nur für Levellänge/Fortschritt). */
export const PX_PER_METER = 32;

/** Dauer der Vulkan-Feier zwischen zwei Leveln in Sekunden. */
export const LEVEL_CELEBRATION_SECONDS = 3.5;

/** Bonuspunkte pro geschafftem Level (× Levelnummer). */
export const LEVEL_BONUS_POINTS = 100;

export interface LevelConfig {
  level: number;
  /** Levellänge in Metern. */
  distance: number;
  /** Multiplikator fürs Welt-/Jäger-Tempo am Levelanfang. */
  speedMultiplier: number;
  /** Multiplikator für den Abstand zwischen Hindernis-Spawns (kleiner = häufiger). */
  spawnIntervalMultiplier: number;
  obstacleWeights: ObstacleWeights;
  /** Sekunden zwischen zwei Meteoriten am Levelanfang bzw. -ende (dazwischen linear). */
  meteorIntervalStart: number;
  meteorIntervalEnd: number;
}

export function getLevelConfig(level: number): LevelConfig {
  const n = level - 1;

  // Level 1: nur Sprung-Hindernisse. Ab Level 2 Flugsaurier zum Ducken, ab Level 3
  // zusätzlich tiefhängende Lianen – danach wird nur noch die Mischung dichter.
  const obstacleWeights: ObstacleWeights = { stone: 1, bush: 1, fern: 1, horsetail: 0.7 };
  if (level >= 2) obstacleWeights.pterodactyl = 0.8;
  if (level >= 3) {
    obstacleWeights.pterodactyl = 1;
    obstacleWeights.vine = 0.7;
  }

  return {
    level,
    distance: 400 + n * 120,
    speedMultiplier: Math.min(1.8, 1 + n * 0.08),
    spawnIntervalMultiplier: Math.max(0.45, 1 - n * 0.07),
    obstacleWeights,
    meteorIntervalStart: Math.max(4, 9 - n * 0.6),
    meteorIntervalEnd: Math.max(1.2, 3 - n * 0.2),
  };
}

/** Tempo-Multiplikator innerhalb eines Levels (progress 0..1 = Anteil der Strecke). */
export function getSpeedMultiplier(config: LevelConfig, progress: number): number {
  return config.speedMultiplier * (1 + 0.1 * progress);
}

/** Spawn-Abstands-Multiplikator innerhalb eines Levels (progress 0..1). */
export function getSpawnIntervalMultiplier(config: LevelConfig, progress: number): number {
  return config.spawnIntervalMultiplier * (1 - 0.15 * progress);
}

/** Meteoriten-Takt innerhalb eines Levels: wird mit dem Fortschritt immer kürzer. */
export function getMeteorInterval(config: LevelConfig, progress: number): number {
  return config.meteorIntervalStart + (config.meteorIntervalEnd - config.meteorIntervalStart) * progress;
}
