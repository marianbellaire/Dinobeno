interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
}

/** Overlay mit erreichtem Score, High-Score-Vergleich und Restart-Button (Phase 3). */
export default function GameOverScreen({
  score,
  highScore,
  isNewHighScore,
  onRestart,
}: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-white px-6 py-8 text-center shadow-xl">
        <p className="text-3xl">🦖💥</p>
        <h2 className="text-2xl font-bold text-slate-800">Game Over</h2>

        <p className="text-lg text-slate-700">
          Punkte: <span className="font-bold">{score}</span>
        </p>

        {isNewHighScore ? (
          <p className="font-semibold text-amber-600">🏆 Neuer Highscore!</p>
        ) : (
          <p className="text-slate-500">Highscore: {highScore}</p>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="mt-2 w-full rounded-full bg-emerald-600 px-6 py-3 text-lg font-bold text-white shadow-md active:scale-95"
        >
          Nochmal spielen
        </button>
      </div>
    </div>
  );
}
