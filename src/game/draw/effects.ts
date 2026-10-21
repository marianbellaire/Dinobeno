// Effekte: glühende Meteoriten mit Schweif und die Vulkan-Feier zwischen den Leveln
// (freundlicher, lachender Vulkan, der Konfetti statt Lava spuckt).

import {
  getCraterY,
  getEruptionIntensity,
  getVolcanoRise,
  VOLCANO_WIDTH,
  type CelebrationState,
} from "../celebration";
import { GROUND_Y } from "../constants";
import type { Meteor } from "../meteors";

export function drawMeteor(ctx: CanvasRenderingContext2D, meteor: Meteor, t: number) {
  const { x, y, size, trail } = meteor;

  ctx.save();
  // Glühender Schweif, zum Ende hin kleiner und durchsichtiger
  for (let i = trail.length - 1; i >= 0; i--) {
    const p = trail[i];
    const k = 1 - i / trail.length;
    ctx.fillStyle = `rgba(255, ${Math.round(120 + 100 * k)}, 40, ${0.55 * k})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * (0.35 + 0.6 * k), 0, Math.PI * 2);
    ctx.fill();
  }

  // Flackernder Lichthof
  const flicker = 1 + Math.sin(t * 30 + meteor.id) * 0.12;
  const halo = ctx.createRadialGradient(x, y, size * 0.3, x, y, size * 2.2 * flicker);
  halo.addColorStop(0, "rgba(255, 220, 120, 0.7)");
  halo.addColorStop(1, "rgba(255, 120, 30, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, size * 2.2 * flicker, 0, Math.PI * 2);
  ctx.fill();

  // Gesteinsbrocken mit glühendem Kern und Kratern
  const rock = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 1, x, y, size);
  rock.addColorStop(0, "#fff3b0");
  rock.addColorStop(0.45, "#ff8c1a");
  rock.addColorStop(1, "#7a2e0e");
  ctx.fillStyle = rock;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = size * (0.85 + ((i * 37 + meteor.id * 11) % 5) * 0.05);
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(90, 30, 10, 0.55)";
  for (const [dx, dy, r] of [
    [0.3, 0.2, 0.22],
    [-0.25, 0.35, 0.16],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx * size, y + dy * size, r * size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Vulkan, der während der Level-Feier aus dem Boden wächst und fröhlich ausbricht. */
export function drawVolcano(ctx: CanvasRenderingContext2D, celebration: CelebrationState) {
  const rise = getVolcanoRise(celebration.time);
  if (rise <= 0) return;
  const intensity = getEruptionIntensity(celebration.time);
  const vx = celebration.volcanoX;
  const craterY = getCraterY(celebration.time);
  const halfBase = (VOLCANO_WIDTH / 2) * (0.6 + 0.4 * rise);
  const halfTop = 26;

  ctx.save();

  // Rauch-/Wolkenpuffs über dem Krater (rosa-weiß statt bedrohlich grau)
  if (intensity > 0) {
    for (let i = 0; i < 5; i++) {
      const t = celebration.time * 0.8 + i * 0.37;
      const k = t % 1;
      ctx.fillStyle = `rgba(255, 235, 245, ${0.55 * intensity * (1 - k)})`;
      ctx.beginPath();
      ctx.arc(vx + Math.sin(i * 2.1) * 20 * k, craterY - 20 - k * 110, 14 + k * 26, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bergkörper
  const body = ctx.createLinearGradient(0, craterY, 0, GROUND_Y);
  body.addColorStop(0, "#9c6b5a");
  body.addColorStop(1, "#6d4c41");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(vx - halfBase, GROUND_Y);
  ctx.quadraticCurveTo(vx - halfTop * 1.6, craterY + 30, vx - halfTop, craterY);
  ctx.lineTo(vx + halfTop, craterY);
  ctx.quadraticCurveTo(vx + halfTop * 1.6, craterY + 30, vx + halfBase, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Leuchtende "Lava"-Bäche in Regenbogen-Neon
  // Laufen seitlich am Gesicht vorbei die Flanken hinunter
  const streams = [
    { color: "#ff5e3a", side: -1, spread: 1 },
    { color: "#ffb400", side: 1, spread: 1 },
    { color: "#ff3cac", side: -1, spread: 1.5 },
    { color: "#7afcff", side: 1, spread: 1.5 },
  ];
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  const height = GROUND_Y - craterY;
  for (const { color, side, spread } of streams) {
    const length = height * (0.45 + 0.35 * intensity) * (spread > 1 ? 0.8 : 1);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(vx + side * 10 * spread, craterY + 2);
    ctx.quadraticCurveTo(
      vx + side * 26 * spread,
      craterY + length * 0.5,
      vx + side * (halfTop + (halfBase - halfTop) * (length / height) * 0.75) * (spread > 1 ? 0.95 : 0.8),
      craterY + length,
    );
    ctx.stroke();
  }

  // Glühender Krater
  const crater = ctx.createRadialGradient(vx, craterY, 2, vx, craterY, halfTop * 1.4);
  crater.addColorStop(0, "#fff6b0");
  crater.addColorStop(0.5, "#ffb400");
  crater.addColorStop(1, "rgba(255, 94, 58, 0)");
  ctx.fillStyle = crater;
  ctx.beginPath();
  ctx.ellipse(vx, craterY, halfTop * 1.3, 9 + intensity * 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fröhliches Gesicht – der Vulkan feiert mit
  if (rise > 0.6) {
    const faceY = craterY + (GROUND_Y - craterY) * 0.58;
    ctx.fillStyle = "#2b1a14";
    for (const side of [-1, 1]) {
      // Lachende, zugekniffene Augen (^ ^)
      ctx.strokeStyle = "#2b1a14";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(vx + side * 22 - 7, faceY - 10);
      ctx.lineTo(vx + side * 22, faceY - 17);
      ctx.lineTo(vx + side * 22 + 7, faceY - 10);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 120, 150, 0.55)";
      ctx.beginPath();
      ctx.arc(vx + side * 36, faceY + 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Offener, lachender Mund
    ctx.fillStyle = "#3d0f12";
    ctx.beginPath();
    ctx.arc(vx, faceY + 2, 14, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff7a8a";
    ctx.beginPath();
    ctx.ellipse(vx, faceY + 11, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawCelebrationParticles(ctx: CanvasRenderingContext2D, celebration: CelebrationState) {
  ctx.save();
  for (const p of celebration.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 1.5);
    ctx.fillStyle = p.color;
    if (p.kind === "confetti") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      // Flattern: Breite pendelt, als ob sich das Papier dreht
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size * Math.abs(Math.cos(p.rotation * 1.7)) + 1, p.size / 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
