import { PLAYER_DINOS } from "@/game/dinoConfigs";
import type { DinoConfig } from "@/game/types";

interface DinoSelectScreenProps {
  onSelect: (dino: DinoConfig) => void;
}

/** Grobe visuelle Einordnung der Stat-Werte als Balken (Werte liegen alle zw. 0.7 und 1.3). */
function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(((value - 0.6) / (1.3 - 0.6)) * 100);
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <span className="w-14 shrink-0">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Auswahlbildschirm für den Spieler-Dino (Phase 5). Der Jäger wird pro Spiel zufällig
 *  aus dem erweiterten Jäger-Pool (Velociraptor/T-Rex) gewählt, siehe GameEngine.reset(). */
export default function DinoSelectScreen({ onSelect }: DinoSelectScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-sky-100 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white px-6 py-6 shadow-xl">
        <div className="text-center">
          <p className="text-3xl">🦖</p>
          <h1 className="text-xl font-bold text-slate-800">Dino be no!</h1>
          <p className="mt-1 text-sm text-slate-500">Wähle deinen Dino</p>
        </div>

        <div className="flex flex-col gap-3">
          {PLAYER_DINOS.map((dino) => (
            <button
              key={dino.id}
              type="button"
              onClick={() => onSelect(dino)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition active:scale-95 hover:border-emerald-400"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
                style={{ backgroundColor: dino.color }}
              >
                🦕
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{dino.name}</p>
                <p className="text-xs text-slate-500">{dino.specialAbility?.description}</p>
                <div className="mt-1.5 flex flex-col gap-0.5">
                  <StatBar label="Tempo" value={dino.speed} />
                  <StatBar label="Sprung" value={dino.jumpHeight} />
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400">
          Der Jäger wird bei jedem Spiel zufällig bestimmt: Velociraptor oder T-Rex.
        </p>
      </div>
    </div>
  );
}
