"use client";

import { useCallback, useEffect, useRef } from "react";
import { ANKYLOSAURUS } from "@/game/dinoConfigs";
import { GROUND_Y, LOGICAL_HEIGHT, PLAYER_X_RATIO, TOUCH_TARGET_SIZE } from "@/game/constants";
import { drawBackground, drawPlayer } from "@/game/draw";
import { createPlayerState, jump, setDucking, updatePlayer, type PlayerState } from "@/game/player";
import { useGameLoop } from "@/hooks/useGameLoop";

/** Ab wie viel vertikaler Fingerbewegung ein Swipe als "nach unten" gilt. */
const SWIPE_DOWN_THRESHOLD = 24;

export default function GameCanvas() {
  const dino = ANKYLOSAURUS;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerState>(createPlayerState());
  const duckTimeoutRef = useRef<number | null>(null);

  // Skalierungs-Infos werden bei jedem Resize neu berechnet und beim Zeichnen gelesen.
  const viewRef = useRef({ width: 0, height: 0, scale: 1, dpr: 1 });

  const doJump = useCallback(() => {
    playerRef.current = jump(playerRef.current, dino);
  }, [dino]);

  const doDuck = useCallback(() => {
    if (playerRef.current.isJumping) return;
    playerRef.current = setDucking(playerRef.current, true);
    if (duckTimeoutRef.current !== null) window.clearTimeout(duckTimeoutRef.current);
    duckTimeoutRef.current = window.setTimeout(() => {
      playerRef.current = setDucking(playerRef.current, false);
    }, Math.max(dino.duckDuration, 0.3) * 1000);
  }, [dino]);

  // Canvas-Größe an den Container anpassen (responsive, inkl. High-DPI-Schärfe).
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const scale = height / LOGICAL_HEIGHT;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      viewRef.current = { width, height, scale, dpr };
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Tastatur-Steuerung (Desktop).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        doJump();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        doDuck();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doJump, doDuck]);

  // Touch-Gesten auf dem Canvas: Tap = Springen, Swipe nach unten = Ducken.
  const touchStartY = useRef<number | null>(null);
  const swipeHandled = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    swipeHandled.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || swipeHandled.current) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > SWIPE_DOWN_THRESHOLD) {
      swipeHandled.current = true;
      doDuck();
    }
  };
  const onTouchEnd = () => {
    if (!swipeHandled.current) doJump();
    touchStartY.current = null;
  };

  // Game-Loop: Physik updaten + Frame zeichnen.
  useGameLoop((dt) => {
    playerRef.current = updatePlayer(playerRef.current, dt);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height, scale, dpr } = viewRef.current;
    if (width === 0 || height === 0) return;

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, width / scale, height / scale);

    const visibleWorldWidth = width / scale;
    drawBackground(ctx, visibleWorldWidth, LOGICAL_HEIGHT);

    const playerX = visibleWorldWidth * PLAYER_X_RATIO;
    drawPlayer(ctx, playerX, playerRef.current, dino.color, false);

    void GROUND_Y; // Referenz für spätere Kollisions-/Spawn-Logik (Phase 2)
  }, true);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-sky-100">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-label="Dino be no! Spielfeld"
        role="img"
      />

      {/* On-Screen-Buttons als Fallback für Kinder, die mit Swipe-Gesten unsicher sind. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          aria-label="Ducken"
          className="pointer-events-auto flex items-center justify-center rounded-full bg-white/80 text-2xl font-bold text-slate-700 shadow-lg active:scale-95"
          style={{ width: TOUCH_TARGET_SIZE, height: TOUCH_TARGET_SIZE }}
          onPointerDown={(e) => {
            e.preventDefault();
            doDuck();
          }}
        >
          ⬇️
        </button>
        <button
          type="button"
          aria-label="Springen"
          className="pointer-events-auto flex items-center justify-center rounded-full bg-white/80 text-2xl font-bold text-slate-700 shadow-lg active:scale-95"
          style={{ width: TOUCH_TARGET_SIZE, height: TOUCH_TARGET_SIZE }}
          onPointerDown={(e) => {
            e.preventDefault();
            doJump();
          }}
        >
          ⬆️
        </button>
      </div>
    </div>
  );
}
