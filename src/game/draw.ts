import { GROUND_HEIGHT, GROUND_Y, HUNTER_HEIGHT, HUNTER_WIDTH, PICKUP_SIZE, PLAYER_WIDTH } from "./constants";
import type { Obstacle } from "./obstacles";
import type { Pickup } from "./pickups";
import { getPlayerHitboxHeight, type PlayerState } from "./player";
import type { DinoConfig } from "./types";

/** Zeichnet Himmel-Hintergrund + Boden-Streifen über die volle sichtbare Weltbreite. */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  visibleWorldWidth: number,
  logicalHeight: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, "#bfe6ff");
  sky.addColorStop(1, "#eaf7ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, visibleWorldWidth, GROUND_Y);

  ctx.fillStyle = "#c9a26a"; // Sand/Erde
  ctx.fillRect(0, GROUND_Y, visibleWorldWidth, GROUND_HEIGHT);

  ctx.strokeStyle = "#a67b46";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(visibleWorldWidth, GROUND_Y);
  ctx.stroke();

  void logicalHeight;
}

/**
 * Zeichnet den Spieler-Dino als einfachen geometrischen Platzhalter – bis echte
 * Sprites/Pixel-Art nachgezogen werden. Körper/Kopf/Auge sind bei allen Spieler-
 * Dinos gleich aufgebaut, Rückenschmuck/Kopfschmuck/Schwanz variieren je nach
 * `dino.id`, damit sich die drei Auswahl-Dinos (Phase 5) auch im Spiel unterscheiden.
 */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  player: PlayerState,
  dino: DinoConfig,
  invincible: boolean,
) {
  const bodyHeight = getPlayerHitboxHeight(player);
  const groundY = GROUND_Y - player.height;
  const bodyY = groundY - bodyHeight;
  const color = dino.color;

  ctx.save();
  if (invincible) {
    // Blinken während der Invincibility-Frames
    ctx.globalAlpha = Math.sin(performance.now() / 60) > 0 ? 1 : 0.35;
  }

  // Körper
  ctx.fillStyle = color;
  roundRect(ctx, x, bodyY, PLAYER_WIDTH, bodyHeight, 12);
  ctx.fill();

  drawPlayerBackOrnament(ctx, dino.id, x, bodyY);

  // Kopf
  ctx.fillStyle = color;
  const headSize = bodyHeight * 0.7;
  const headX = x - headSize * 0.6;
  const headY = bodyY + bodyHeight * 0.15;
  roundRect(ctx, headX, headY, headSize, headSize * 0.8, 6);
  ctx.fill();

  drawPlayerHeadOrnament(ctx, dino.id, headX, headY, headSize);

  // Auge
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x - headSize * 0.15, bodyY + bodyHeight * 0.4, 3, 0, Math.PI * 2);
  ctx.fill();

  drawPlayerTail(ctx, dino.id, x, bodyY, bodyHeight, color);

  ctx.restore();
}

/** Rückenschmuck: Panzerplatten (Ankylosaurus), große Stegosaurus-Platten oder keiner (Triceratops). */
function drawPlayerBackOrnament(ctx: CanvasRenderingContext2D, dinoId: string, x: number, bodyY: number) {
  if (dinoId === "triceratops") return; // Markenzeichen sitzt am Kopf, siehe drawPlayerHeadOrnament

  if (dinoId === "stegosaurus") {
    ctx.fillStyle = "#3a464b";
    const plateCount = 5;
    const plateWidth = PLAYER_WIDTH / (plateCount + 1);
    for (let i = 0; i < plateCount; i++) {
      const px = x + plateWidth * (i + 0.5);
      const plateHeight = i % 2 === 0 ? 18 : 11; // abwechselnd groß/klein
      ctx.beginPath();
      ctx.moveTo(px, bodyY);
      ctx.lineTo(px + plateWidth * 0.5, bodyY - plateHeight);
      ctx.lineTo(px + plateWidth, bodyY);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  // Ankylosaurus (Default): Panzerplatten
  ctx.fillStyle = "#3f6631";
  const plateCount = 4;
  const plateWidth = PLAYER_WIDTH / (plateCount + 1);
  for (let i = 0; i < plateCount; i++) {
    const px = x + plateWidth * (i + 0.6);
    ctx.beginPath();
    ctx.moveTo(px, bodyY);
    ctx.lineTo(px + plateWidth * 0.5, bodyY - 10);
    ctx.lineTo(px + plateWidth, bodyY);
    ctx.closePath();
    ctx.fill();
  }
}

/** Kopfschmuck: Nackenschild + Hörner beim Triceratops, sonst keiner. */
function drawPlayerHeadOrnament(
  ctx: CanvasRenderingContext2D,
  dinoId: string,
  headX: number,
  headY: number,
  headSize: number,
) {
  if (dinoId !== "triceratops") return;

  // Nackenschild (Frill) hinter dem Kopf
  ctx.fillStyle = "#6e5530";
  ctx.beginPath();
  ctx.arc(headX + headSize * 0.35, headY + headSize * 0.35, headSize * 0.6, Math.PI * 0.9, Math.PI * 2.1);
  ctx.fill();

  // Zwei Brauenhörner + eine Nasenhorn-Andeutung
  ctx.fillStyle = "#e8e2d0";
  for (const t of [0.15, 0.55]) {
    const hx = headX + headSize * t;
    ctx.beginPath();
    ctx.moveTo(hx - 3, headY + 2);
    ctx.lineTo(hx + 3, headY + 2);
    ctx.lineTo(hx, headY - 11);
    ctx.closePath();
    ctx.fill();
  }
}

/** Schwanz: Keule (Ankylosaurus), Stachelspitzen (Stegosaurus) oder schlicht spitz (Triceratops). */
function drawPlayerTail(
  ctx: CanvasRenderingContext2D,
  dinoId: string,
  x: number,
  bodyY: number,
  bodyHeight: number,
  color: string,
) {
  ctx.fillStyle = color;

  if (dinoId === "ankylosaurus") {
    ctx.beginPath();
    ctx.moveTo(x + PLAYER_WIDTH, bodyY + bodyHeight * 0.5);
    ctx.lineTo(x + PLAYER_WIDTH + 22, bodyY + bodyHeight * 0.35);
    ctx.lineTo(x + PLAYER_WIDTH + 18, bodyY + bodyHeight * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + PLAYER_WIDTH + 24, bodyY + bodyHeight * 0.5, 8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (dinoId === "stegosaurus") {
    ctx.beginPath();
    ctx.moveTo(x + PLAYER_WIDTH, bodyY + bodyHeight * 0.5);
    ctx.lineTo(x + PLAYER_WIDTH + 26, bodyY + bodyHeight * 0.4);
    ctx.lineTo(x + PLAYER_WIDTH + 20, bodyY + bodyHeight * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3a464b";
    for (const dy of [-6, 6]) {
      ctx.beginPath();
      ctx.moveTo(x + PLAYER_WIDTH + 22, bodyY + bodyHeight * 0.5 + dy * 0.5);
      ctx.lineTo(x + PLAYER_WIDTH + 34, bodyY + bodyHeight * 0.5 + dy - 3);
      ctx.lineTo(x + PLAYER_WIDTH + 34, bodyY + bodyHeight * 0.5 + dy + 5);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  // Triceratops / Default: schlichter spitzer Schwanz
  ctx.beginPath();
  ctx.moveTo(x + PLAYER_WIDTH, bodyY + bodyHeight * 0.5);
  ctx.lineTo(x + PLAYER_WIDTH + 24, bodyY + bodyHeight * 0.42);
  ctx.lineTo(x + PLAYER_WIDTH + 24, bodyY + bodyHeight * 0.58);
  ctx.closePath();
  ctx.fill();
}

/**
 * Zeichnet den Jäger als einfachen geometrischen Platzhalter – bis echte Sprites/
 * Pixel-Art nachgezogen werden. Velociraptor (schlank, Sichelklaue) und T-Rex
 * (kräftig, winzige Arme) haben eigene Silhouetten.
 */
export function drawHunter(ctx: CanvasRenderingContext2D, x: number, dino: DinoConfig) {
  if (dino.id === "trex") {
    drawTrex(ctx, x, dino.color);
  } else {
    drawVelociraptor(ctx, x, dino.color);
  }
}

function drawVelociraptor(ctx: CanvasRenderingContext2D, x: number, color: string) {
  const bodyY = GROUND_Y - HUNTER_HEIGHT;

  ctx.save();

  // Körper (schlank)
  ctx.fillStyle = color;
  roundRect(ctx, x, bodyY + HUNTER_HEIGHT * 0.3, HUNTER_WIDTH * 0.75, HUNTER_HEIGHT * 0.5, 10);
  ctx.fill();

  // Aufgerichteter Hals + Kopf
  ctx.beginPath();
  ctx.moveTo(x + HUNTER_WIDTH * 0.55, bodyY + HUNTER_HEIGHT * 0.4);
  ctx.lineTo(x + HUNTER_WIDTH, bodyY);
  ctx.lineTo(x + HUNTER_WIDTH * 0.95, bodyY + HUNTER_HEIGHT * 0.35);
  ctx.closePath();
  ctx.fill();

  // Zahnreihe
  ctx.fillStyle = "#f5f5f5";
  for (let i = 0; i < 3; i++) {
    const tx = x + HUNTER_WIDTH * 0.82 + i * 5;
    ctx.beginPath();
    ctx.moveTo(tx, bodyY + HUNTER_HEIGHT * 0.12);
    ctx.lineTo(tx + 4, bodyY + HUNTER_HEIGHT * 0.12);
    ctx.lineTo(tx + 2, bodyY + HUNTER_HEIGHT * 0.22);
    ctx.closePath();
    ctx.fill();
  }

  // Auge
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x + HUNTER_WIDTH * 0.9, bodyY + HUNTER_HEIGHT * 0.18, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Beine
  ctx.fillStyle = color;
  ctx.fillRect(x + HUNTER_WIDTH * 0.12, bodyY + HUNTER_HEIGHT * 0.75, 6, HUNTER_HEIGHT * 0.25);
  ctx.fillRect(x + HUNTER_WIDTH * 0.45, bodyY + HUNTER_HEIGHT * 0.75, 6, HUNTER_HEIGHT * 0.25);

  // Sichelklauen-Schwanz
  ctx.beginPath();
  ctx.moveTo(x, bodyY + HUNTER_HEIGHT * 0.5);
  ctx.lineTo(x - 26, bodyY + HUNTER_HEIGHT * 0.3);
  ctx.lineTo(x - 4, bodyY + HUNTER_HEIGHT * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawTrex(ctx: CanvasRenderingContext2D, x: number, color: string) {
  const bodyY = GROUND_Y - HUNTER_HEIGHT;

  ctx.save();

  // Kräftiger, tiefer Körper
  ctx.fillStyle = color;
  roundRect(ctx, x, bodyY + HUNTER_HEIGHT * 0.2, HUNTER_WIDTH * 0.85, HUNTER_HEIGHT * 0.6, 12);
  ctx.fill();

  // Großer Kopf
  ctx.beginPath();
  ctx.moveTo(x + HUNTER_WIDTH * 0.6, bodyY + HUNTER_HEIGHT * 0.32);
  ctx.lineTo(x + HUNTER_WIDTH * 1.05, bodyY - 4);
  ctx.lineTo(x + HUNTER_WIDTH * 1.05, bodyY + HUNTER_HEIGHT * 0.32);
  ctx.closePath();
  ctx.fill();

  // Zahnreihe
  ctx.fillStyle = "#f5f5f5";
  for (let i = 0; i < 4; i++) {
    const tx = x + HUNTER_WIDTH * 0.68 + i * 5;
    ctx.beginPath();
    ctx.moveTo(tx, bodyY + HUNTER_HEIGHT * 0.05);
    ctx.lineTo(tx + 4, bodyY + HUNTER_HEIGHT * 0.05);
    ctx.lineTo(tx + 2, bodyY + HUNTER_HEIGHT * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  // Auge
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x + HUNTER_WIDTH * 0.92, bodyY + HUNTER_HEIGHT * 0.12, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Winzige Vorderarme (Markenzeichen des T-Rex)
  ctx.fillStyle = color;
  ctx.fillRect(x + HUNTER_WIDTH * 0.55, bodyY + HUNTER_HEIGHT * 0.45, 8, 4);

  // Kräftige Beine
  ctx.fillRect(x + HUNTER_WIDTH * 0.1, bodyY + HUNTER_HEIGHT * 0.75, 9, HUNTER_HEIGHT * 0.25);
  ctx.fillRect(x + HUNTER_WIDTH * 0.42, bodyY + HUNTER_HEIGHT * 0.75, 9, HUNTER_HEIGHT * 0.25);

  // Dicker, gerader Schwanz
  ctx.beginPath();
  ctx.moveTo(x, bodyY + HUNTER_HEIGHT * 0.48);
  ctx.lineTo(x - 28, bodyY + HUNTER_HEIGHT * 0.42);
  ctx.lineTo(x - 28, bodyY + HUNTER_HEIGHT * 0.6);
  ctx.lineTo(x, bodyY + HUNTER_HEIGHT * 0.64);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/** Zeichnet ein Hindernis als einfache geometrische Form passend zu seinem Typ. */
export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  const { x, config } = obstacle;
  const { width, height, color, type } = config;
  const y = GROUND_Y - height;

  ctx.save();
  ctx.fillStyle = color;

  if (type === "stone") {
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
  } else if (type === "tree") {
    // Stamm
    ctx.fillRect(x + width * 0.35, y + height * 0.5, width * 0.3, height * 0.5);
    // Krone
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.55);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height * 0.55);
    ctx.closePath();
    ctx.fill();
  } else {
    // Kleiner Gegner: geduckter Körper mit Stachel
    roundRect(ctx, x, y + height * 0.25, width, height * 0.75, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, y);
    ctx.lineTo(x + width * 0.35, y + height * 0.35);
    ctx.lineTo(x + width * 0.65, y + height * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Zeichnet ein Power-up/Ressource als Emoji auf einem leicht schwebenden, halb-
 * transparenten Kreis (bessere Lesbarkeit vor Himmel/Boden) – einfachster MVP-
 * Platzhalter, der direkt die Icons aus der Spec (🍓⚡🛡️) zeigt.
 */
export function drawPickup(ctx: CanvasRenderingContext2D, pickup: Pickup) {
  const { x, y } = pickup;
  const radius = PICKUP_SIZE / 2 + 4;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${PICKUP_SIZE}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pickup.config.emoji, x, y + 1);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
