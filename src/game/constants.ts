// Alle Spiel-Konstanten in "logischen" Pixeln. Die Canvas-Komponente skaliert diese
// logischen Koordinaten passend auf die tatsächliche Bildschirmgröße, damit sich das
// Spiel auf Handy, Tablet und Desktop gleich anfühlt (siehe GameCanvas.tsx).

// Feste Referenz-Höhe der Spielwelt. Die Breite ergibt sich dynamisch aus dem
// Seitenverhältnis des Bildschirms (mehr Weltausschnitt sichtbar auf breiten Screens).
export const LOGICAL_HEIGHT = 540;

export const GROUND_HEIGHT = 90;
export const GROUND_Y = LOGICAL_HEIGHT - GROUND_HEIGHT;

// Horizontale Spieler-Position als Anteil der sichtbaren Weltbreite.
export const PLAYER_X_RATIO = 0.18;

export const PLAYER_WIDTH = 84;
export const PLAYER_HEIGHT = 58;
export const PLAYER_DUCK_HEIGHT = 34;

export const GRAVITY = 2600; // px/s²
export const BASE_JUMP_VELOCITY = -980; // px/s (negativ = nach oben)

export const BASE_GAME_SPEED = 320; // px/s, Grundtempo der Welt (Boden-Scroll)

// Mindestdauer eines Duck-Vorgangs, auch wenn ein Dino-Config einen kleineren Wert hat.
export const MIN_DUCK_SECONDS = 0.3;

// Mindestgröße für Touch-Buttons (Vorgabe: min. 44x44px).
export const TOUCH_TARGET_SIZE = 64;

// --- Jäger (Velociraptor) ---
export const HUNTER_WIDTH = 74;
export const HUNTER_HEIGHT = 52;
// Anfangsabstand des Jägers zum Spieler in logischen px.
export const INITIAL_HUNTER_GAP = 420;
// Ab diesem Abstand gilt der Jäger als "hat aufgeholt" (= Treffer).
export const MIN_HUNTER_GAP = 6;
// Basis-Tempo, mit dem sich der Abstand verringert, pro Einheit Geschwindigkeits-
// unterschied zwischen Jäger und Spieler (siehe hunter.ts).
export const HUNTER_BASE_CATCH_UP_RATE = 160; // px/s

// --- Hindernisse ---
export const OBSTACLE_SPAWN_MARGIN = 40; // Abstand hinter dem rechten Bildrand beim Spawn
export const OBSTACLE_SPAWN_INTERVAL_MIN = 1.1; // Sekunden
export const OBSTACLE_SPAWN_INTERVAL_MAX = 2.2; // Sekunden

// --- Punkte & Leben ---
export const STARTING_LIVES = 3;
export const SCORE_PER_SECOND = 10; // kontinuierliche Punkte pro Sekunde Überleben
// Dauer der Unverwundbarkeit nach einem Treffer (+ visuelles Blinken).
export const INVINCIBILITY_SECONDS = 1.6;
