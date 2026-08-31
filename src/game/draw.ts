import { GROUND_HEIGHT, GROUND_Y, PLAYER_DUCK_HEIGHT, PLAYER_WIDTH } from "./constants";
import type { PlayerState } from "./player";

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
 * Zeichnet den Spieler-Dino als einfachen geometrischen Platzhalter (Panzer-Körper,
 * Rückenplatten, Kopf, Schwanz) – bis echte Sprites/Pixel-Art nachgezogen werden.
 */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  player: PlayerState,
  color: string,
  invincible: boolean,
) {
  const bodyHeight = player.isDucking ? PLAYER_DUCK_HEIGHT : 46;
  const groundY = GROUND_Y - player.height;
  const bodyY = groundY - bodyHeight;

  ctx.save();
  if (invincible) {
    // Blinken während der Invincibility-Frames
    ctx.globalAlpha = Math.sin(performance.now() / 60) > 0 ? 1 : 0.35;
  }

  // Körper
  ctx.fillStyle = color;
  roundRect(ctx, x, bodyY, PLAYER_WIDTH, bodyHeight, 12);
  ctx.fill();

  // Rückenplatten (Panzer-Look)
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

  // Kopf
  ctx.fillStyle = color;
  const headSize = bodyHeight * 0.7;
  roundRect(ctx, x - headSize * 0.6, bodyY + bodyHeight * 0.15, headSize, headSize * 0.8, 6);
  ctx.fill();

  // Auge
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x - headSize * 0.15, bodyY + bodyHeight * 0.4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Schwanz mit Keule (Markenzeichen des Ankylosaurus)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + PLAYER_WIDTH, bodyY + bodyHeight * 0.5);
  ctx.lineTo(x + PLAYER_WIDTH + 22, bodyY + bodyHeight * 0.35);
  ctx.lineTo(x + PLAYER_WIDTH + 18, bodyY + bodyHeight * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + PLAYER_WIDTH + 24, bodyY + bodyHeight * 0.5, 8, 0, Math.PI * 2);
  ctx.fill();

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
