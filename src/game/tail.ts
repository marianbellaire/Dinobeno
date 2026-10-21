// Schwanz-Physik: eine Kette von Segmenten, deren Winkel per Feder-Dämpfer dem jeweils
// vorherigen Segment folgen. Dadurch schwingt der Schwanz verzögert nach – beim Laufen
// (Sinus-Anregung), beim Absprung (hängt nach unten) und bei der Landung (peitscht hoch).
//
// Winkel-Konvention (Canvas, y nach unten): 0 = waagerecht nach hinten, positiv = nach unten.

const STIFFNESS = 140;
const DAMPING = 13;

export interface TailState {
  /** Absoluter Winkel je Segment (Wurzel zuerst). */
  angles: number[];
  velocities: number[];
}

export function createTailState(segments: number, baseAngle = 0): TailState {
  return {
    angles: Array.from({ length: segments }, () => baseAngle),
    velocities: Array.from({ length: segments }, () => 0),
  };
}

export interface TailDrive {
  /** Ruhewinkel der Wurzel (leicht angehoben = negativ). */
  baseAngle: number;
  /** Laufende Animationszeit in Sekunden. */
  time: number;
  /** Stärke des Lauf-Wedelns in rad. */
  wobble: number;
  /** Wedel-Frequenz in rad/s. */
  frequency: number;
  /** Vertikale Körpergeschwindigkeit in px/s (negativ = nach oben). */
  bodyVelocityY: number;
}

export function updateTail(tail: TailState, dt: number, drive: TailDrive): TailState {
  const count = tail.angles.length;
  const angles = [...tail.angles];
  const velocities = [...tail.velocities];
  // Körper beschleunigt nach oben → Schwanz bleibt träge zurück, hängt also nach unten.
  const inertia = Math.max(-0.5, Math.min(0.5, -drive.bodyVelocityY * 0.0005));

  for (let i = 0; i < count; i++) {
    const parent = i === 0 ? drive.baseAngle + inertia : angles[i - 1];
    const wave = Math.sin(drive.time * drive.frequency - i * 0.7) * drive.wobble * (0.3 + i / count);
    const target = parent + wave;
    const acceleration = STIFFNESS * (target - angles[i]) - DAMPING * velocities[i];
    velocities[i] += acceleration * dt;
    angles[i] += velocities[i] * dt;
  }

  return { angles, velocities };
}

/**
 * Rechnet die Segment-Punkte aus. `direction` = -1, wenn der Schwanz nach links zeigt
 * (Dino schaut nach rechts), +1 umgekehrt.
 */
export function getTailPoints(
  tail: TailState,
  rootX: number,
  rootY: number,
  segmentLength: number,
  direction: 1 | -1,
): { x: number; y: number }[] {
  const points = [{ x: rootX, y: rootY }];
  let x = rootX;
  let y = rootY;
  for (const angle of tail.angles) {
    x += Math.cos(angle) * segmentLength * direction;
    y += Math.sin(angle) * segmentLength;
    points.push({ x, y });
  }
  return points;
}
