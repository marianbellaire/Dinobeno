// Herabstürzende Meteoriten, die ausschließlich der Jäger frisst. Sie haben keinerlei
// Wirkung auf den Spieler (nicht Teil der Kollisionsprüfung) und steuern zielsicher
// auf das Maul des Jägers zu – je mehr er frisst, desto größer und schneller wird er.

import { METEOR_SIZE, METEOR_SPEED } from "./constants";

const TRAIL_LENGTH = 10;

export interface Meteor {
  id: number;
  x: number;
  y: number;
  size: number;
  /** Sekunden seit dem Spawn – der Meteorit wird beim Fallen schneller. */
  age: number;
  /** Letzte Positionen für den glühenden Schweif (neueste zuerst). */
  trail: { x: number; y: number }[];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createMeteorSpawner() {
  let nextId = 0;
  return {
    /**
     * Spawnt oberhalb des Bildrands schräg vor dem Maul, aber links vom Spieler –
     * damit der Meteorit sichtbar auf den Jäger zufliegt, ohne über den Spieler zu ziehen.
     */
    spawn(mouth: { x: number; y: number }, playerX: number): Meteor {
      const x = Math.max(mouth.x + 30, Math.min(mouth.x + randomBetween(80, 240), playerX - 20));
      return {
        id: nextId++,
        x,
        y: -METEOR_SIZE * 2,
        size: METEOR_SIZE * randomBetween(0.8, 1.25),
        age: 0,
        trail: [],
      };
    },
  };
}

/** Bewegt den Meteoriten auf das Maul zu. Gibt `eaten: true` zurück, sobald er ankommt. */
export function updateMeteor(
  meteor: Meteor,
  target: { x: number; y: number },
  dt: number,
): { meteor: Meteor; eaten: boolean } {
  const dx = target.x - meteor.x;
  const dy = target.y - meteor.y;
  const distance = Math.hypot(dx, dy);
  const speed = METEOR_SPEED * (1 + meteor.age * 0.8);
  const step = speed * dt;

  if (distance <= step || distance < meteor.size) {
    return { meteor, eaten: true };
  }

  const trail = [{ x: meteor.x, y: meteor.y }, ...meteor.trail].slice(0, TRAIL_LENGTH);
  return {
    meteor: {
      ...meteor,
      x: meteor.x + (dx / distance) * step,
      y: meteor.y + (dy / distance) * step,
      age: meteor.age + dt,
      trail,
    },
    eaten: false,
  };
}

/** Abstand zum Ziel – damit der Jäger rechtzeitig das Maul aufreißt. */
export function distanceToTarget(meteor: Meteor, target: { x: number; y: number }): number {
  return Math.hypot(target.x - meteor.x, target.y - meteor.y);
}
