// Schwierigkeitskurve: alle ~15-20 Sekunden wird das Spiel eine Stufe schwerer
// (Jäger-Tempo + Hindernis-Frequenz steigen), bis nach 3 Minuten die maximale
// Schwierigkeit erreicht ist und es nicht mehr weiter anzieht.

const STEP_SECONDS = 17;
const MAX_SECONDS = 180;
export const MAX_DIFFICULTY_LEVEL = Math.floor(MAX_SECONDS / STEP_SECONDS);

export function getDifficultyLevel(elapsedSeconds: number): number {
  const capped = Math.min(elapsedSeconds, MAX_SECONDS);
  return Math.floor(capped / STEP_SECONDS);
}

/** Multiplikator fürs Welt-/Jäger-Tempo. */
export function getSpeedMultiplier(level: number): number {
  return 1 + level * 0.12;
}

/** Multiplikator für den Abstand zwischen Hindernis-Spawns (kleiner = häufiger). */
export function getSpawnIntervalMultiplier(level: number): number {
  return Math.max(0.5, 1 - level * 0.06);
}
