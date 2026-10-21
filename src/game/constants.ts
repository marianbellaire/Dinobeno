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
// Ducken in der Luft = schneller Fall: Schwerkraft-Faktor + maximal erlaubte
// Aufwärtsgeschwindigkeit beim Auslösen (bremst einen laufenden Sprung sofort ab).
export const FAST_FALL_GRAVITY_MULTIPLIER = 2.6;
export const FAST_FALL_START_VELOCITY = 200; // px/s nach unten

// Mindestgröße für Touch-Buttons (Vorgabe: min. 44x44px).
export const TOUCH_TARGET_SIZE = 64;

// --- Jäger (Velociraptor) ---
export const HUNTER_WIDTH = 74;
export const HUNTER_HEIGHT = 52;
// Anfangsabstand des Jägers zum Spieler in logischen px.
export const INITIAL_HUNTER_GAP = 450;
// Ab diesem Abstand gilt der Jäger als "hat aufgeholt" (= Treffer). Bei Normalgröße
// sitzt sein Maul dann genau am Hinterteil des Spielers.
export const MIN_HUNTER_GAP = 40;
// Maul-Animation: beginnt sich bei diesem (effektiven) Abstand zu öffnen …
export const JAW_OPEN_START_GAP = 170;
// … und ist hier ganz aufgerissen.
export const JAW_FULL_OPEN_GAP = 85;
// Nach einem Biss fällt der Jäger mit diesem Tempo zurück (statt wegzuteleportieren).
export const HUNTER_RETREAT_SPEED = 380; // px/s

// --- Meteoriten (nur für den Jäger, siehe meteors.ts) ---
export const METEOR_SPEED = 300; // px/s
export const METEOR_SIZE = 12;
// Wachstum pro verschlungenem Meteoriten und Obergrenze (Faktor auf die Jäger-Größe).
export const METEOR_GROWTH = 0.08;
export const MAX_HUNTER_SCALE = 1.7;
// Wie stark die Größe die Annäherungsrate erhöht: rate × (1 + (scale-1) × Faktor).
export const HUNTER_SCALE_SPEED_FACTOR = 0.6;
// Basis-Tempo, mit dem sich der Abstand verringert, pro Einheit Geschwindigkeits-
// unterschied zwischen Jäger und Spieler (siehe hunter.ts).
export const HUNTER_BASE_CATCH_UP_RATE = 160; // px/s

// --- Hindernisse ---
export const OBSTACLE_SPAWN_MARGIN = 40; // Abstand hinter dem rechten Bildrand beim Spawn
export const OBSTACLE_SPAWN_INTERVAL_MIN = 1.1; // Sekunden
export const OBSTACLE_SPAWN_INTERVAL_MAX = 2.2; // Sekunden
// Fairness: Mindestabstand (in Sekunden Flugzeit, unabhängig vom Tempo) zwischen zwei
// Hindernissen – sonst wird es bei hohem Tempo unmöglich, nach einer Landung erneut zu
// springen bzw. von Springen auf Ducken umzuschalten.
export const MIN_OBSTACLE_GAP_SECONDS = 0.85;
export const MIN_OBSTACLE_SWITCH_GAP_SECONDS = 1.05;
// Unterkante von Duck-Hindernissen über dem Boden: höher als der geduckte Spieler
// (PLAYER_DUCK_HEIGHT), niedriger als der stehende (PLAYER_HEIGHT).
export const OVERHEAD_CLEARANCE = 40;

// --- Punkte & Leben ---
export const STARTING_LIVES = 3;
export const SCORE_PER_SECOND = 10; // kontinuierliche Punkte pro Sekunde Überleben
// Dauer der Unverwundbarkeit nach einem Treffer (+ visuelles Blinken).
export const INVINCIBILITY_SECONDS = 1.6;

// --- Power-ups & Ressourcen ---
export const PICKUP_SPAWN_INTERVAL_MIN = 3; // Sekunden
export const PICKUP_SPAWN_INTERVAL_MAX = 6; // Sekunden
export const PICKUP_SIZE = 26;
// Höhe des Mittelpunkts über dem Boden: bewusst so gewählt, dass ein laufender
// (stehender) Spieler automatisch einsammelt, ein duckender aber knapp darunter
// durchrutscht (Duck = "absichtlich verpassen").
export const PICKUP_Y_OFFSET = 55;

export const BERRY_BONUS_POINTS = 50;

export const BOOST_DURATION_SECONDS = 4;
// Wird zur effektiven Spieler-Geschwindigkeit addiert, wodurch der Jäger relativ
// langsamer wird und der Abstand während des Boosts wieder wächst (siehe hunter.ts).
export const BOOST_SPEED_BONUS = 0.6;
