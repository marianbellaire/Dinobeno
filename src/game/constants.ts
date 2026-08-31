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

// Mindestgröße für Touch-Buttons (Vorgabe: min. 44x44px).
export const TOUCH_TARGET_SIZE = 64;
