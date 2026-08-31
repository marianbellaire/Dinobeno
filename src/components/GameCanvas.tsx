"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LOGICAL_HEIGHT, STARTING_LIVES, TOUCH_TARGET_SIZE } from "@/game/constants";
import { GameEngine } from "@/game/GameEngine";
import { loadHighScore, saveHighScore } from "@/game/highscore";
import type { DinoConfig } from "@/game/types";
import { useGameLoop } from "@/hooks/useGameLoop";
import DinoSelectScreen from "./DinoSelectScreen";
import GameOverScreen from "./GameOverScreen";

/** Ab wie viel vertikaler Fingerbewegung ein Swipe als "nach unten" gilt. */
const SWIPE_DOWN_THRESHOLD = 24;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const boostRef = useRef<HTMLSpanElement>(null);
  const shieldRef = useRef<HTMLSpanElement>(null);

  // null = Auswahlbildschirm wird gezeigt, das Spiel läuft noch nicht (Phase 5).
  const [playerDino, setPlayerDino] = useState<DinoConfig | null>(null);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [gameOverScore, setGameOverScore] = useState<number | null>(null);
  // Lazy-Init liest den High-Score erst beim ersten Client-Render aus localStorage.
  // Unproblematisch für Hydration, weil der Wert erst im (anfangs unsichtbaren)
  // Game-Over-Overlay auftaucht, nie im initialen HTML.
  const [highScore, setHighScore] = useState(loadHighScore);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const engineRef = useRef<GameEngine | null>(null);

  const selectDino = useCallback((dino: DinoConfig) => {
    engineRef.current = new GameEngine(dino, {
      onLifeLost: (livesRemaining) => setLives(livesRemaining),
      onGameOver: (finalScore) => {
        setGameOverScore(finalScore);
        setHighScore((prevHighScore) => {
          const isNew = finalScore > prevHighScore;
          setIsNewHighScore(isNew);
          if (!isNew) return prevHighScore;
          saveHighScore(finalScore);
          return finalScore;
        });
      },
    });
    setLives(STARTING_LIVES);
    setGameOverScore(null);
    setPlayerDino(dino);
  }, []);

  const changeDino = useCallback(() => {
    engineRef.current = null;
    setGameOverScore(null);
    setPlayerDino(null);
  }, []);

  // Skalierungs-Infos werden bei jedem Resize neu berechnet und beim Zeichnen gelesen.
  const viewRef = useRef({ width: 0, height: 0, scale: 1, dpr: 1 });

  const doJump = useCallback(() => engineRef.current?.jump(), []);
  const doDuck = useCallback(() => engineRef.current?.duck(), []);

  const restart = useCallback(() => {
    engineRef.current?.reset();
    setLives(STARTING_LIVES);
    setGameOverScore(null);
  }, []);

  // Canvas-Größe an den Container anpassen (responsive, inkl. High-DPI-Schärfe).
  // Der Canvas bleibt immer im DOM (auch während der Auswahl), damit dieser Effekt
  // nur einmal beim Mount laufen muss.
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

  // Game-Loop: Zustand updaten + Frame zeichnen. Läuft immer, tut aber nichts,
  // solange noch kein Dino gewählt ist (engine ist dann null).
  useGameLoop((dt) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const engine = engineRef.current;
    if (!canvas || !ctx || !engine) return;

    const { width, height, scale, dpr } = viewRef.current;
    if (width === 0 || height === 0) return;

    const visibleWorldWidth = width / scale;
    engine.update(dt, visibleWorldWidth);

    // Score + Power-up-Status ändern sich jeden Frame – direkt ins DOM schreiben
    // statt über React-State, damit nicht 60x pro Sekunde die ganze Komponente
    // neu rendert (Herzen bleiben State, weil sie nur selten wechseln).
    if (scoreRef.current) {
      scoreRef.current.textContent = `${Math.floor(engine.score)}`;
    }
    if (boostRef.current) {
      const boosting = engine.boostTimeRemaining > 0;
      boostRef.current.hidden = !boosting;
      if (boosting) {
        boostRef.current.textContent = `⚡ ${Math.ceil(engine.boostTimeRemaining)}s`;
      }
    }
    if (shieldRef.current) {
      shieldRef.current.hidden = !engine.hasShield;
    }

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, visibleWorldWidth, height / scale);
    engine.draw(ctx, visibleWorldWidth);
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

      {playerDino && (
        <>
          {/* Punkte + Leben. */}
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-3 rounded-full bg-black/40 px-3 py-1.5 text-white">
            <span className="text-lg font-bold tabular-nums" ref={scoreRef}>
              0
            </span>
            <span aria-label={`${lives} Leben übrig`}>
              {"❤️".repeat(lives)}
              {"🖤".repeat(Math.max(STARTING_LIVES - lives, 0))}
            </span>
            <span
              ref={boostRef}
              hidden
              className="rounded-full bg-amber-400 px-2 py-0.5 text-sm font-bold text-amber-950"
            />
            <span ref={shieldRef} hidden aria-label="Schild aktiv" className="text-lg">
              🛡️
            </span>
          </div>

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
        </>
      )}

      {!playerDino && <DinoSelectScreen onSelect={selectDino} />}

      {gameOverScore !== null && (
        <GameOverScreen
          score={gameOverScore}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onRestart={restart}
          onChangeDino={changeDino}
        />
      )}
    </div>
  );
}
