"use client";

import { useEffect, useRef } from "react";

/** Obergrenze für dt, damit ein kurzzeitig eingefrorener Tab (z.B. App im
 *  Hintergrund) beim Zurückkehren nicht zu einem riesigen Zeitsprung führt. */
const MAX_DELTA_SECONDS = 0.05;

/**
 * Treibt eine requestAnimationFrame-Schleife an und ruft `onTick` mit der seit dem
 * letzten Frame vergangenen Zeit (in Sekunden) auf. Pausiert automatisch, wenn
 * `running` false ist.
 */
export function useGameLoop(onTick: (dt: number) => void, running: boolean) {
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!running) return;

    let frameId: number;
    let lastTime: number | null = null;

    const loop = (time: number) => {
      if (lastTime !== null) {
        const dt = Math.min((time - lastTime) / 1000, MAX_DELTA_SECONDS);
        onTickRef.current(dt);
      }
      lastTime = time;
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [running]);
}
