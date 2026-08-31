// Persistiert den High-Score lokal im Browser (kein Backend nötig, siehe Spec).
const STORAGE_KEY = "dino-be-no:highscore";

export function loadHighScore(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    // z.B. Safari Private Mode kann den Zugriff auf localStorage verweigern.
    return 0;
  }
}

export function saveHighScore(score: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Math.floor(score)));
  } catch {
    // Highscore gilt dann nur für die aktuelle Session, kein harter Fehler.
  }
}
