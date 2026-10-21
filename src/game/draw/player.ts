// Spieler-Dinos (Ankylosaurus, Triceratops, Stegosaurus) als animierte Canvas-Figuren:
// Rumpf mit Schattierung und hellerem Bauch, Laufzyklus mit vier Beinen, schwingender
// Schwanz (Physik aus tail.ts) und artspezifischer Schmuck. Blickrichtung: nach rechts
// (Laufrichtung), der Schwanz zeigt zum Jäger.

import { GROUND_Y } from "../constants";
import { getPlayerHitboxHeight, type PlayerState } from "../player";
import { getTailPoints, type TailState } from "../tail";
import type { DinoConfig } from "../types";
import { fillTaperedPath, shade, triangle } from "./util";

const BONE = "#efe6cf";

export interface PlayerDrawOptions {
  /** Blinken während der Invincibility-Frames. */
  invincible: boolean;
  /** 🛡️ aktiv: schimmernde Schutzblase. */
  shield: boolean;
  tail: TailState;
  /** Animationszeit in Sekunden. */
  time: number;
}

interface Species {
  /** Wo der Rücken am höchsten ist (0 = hinten, 1 = vorne). */
  humpPeak: number;
  legWidth: number;
  tailSegmentLength: number;
  /** Kopf-Halbachsen. */
  headRx: number;
  headRy: number;
  /** Wie tief der Kopf im Stehen sitzt (Anteil der Rumpfhöhe). */
  headDrop: number;
}

const SPECIES: Record<string, Species> = {
  ankylosaurus: { humpPeak: 0.5, legWidth: 10, tailSegmentLength: 6.5, headRx: 12, headRy: 8, headDrop: 0.45 },
  triceratops: { humpPeak: 0.55, legWidth: 10, tailSegmentLength: 6, headRx: 13, headRy: 9.5, headDrop: 0.4 },
  stegosaurus: { humpPeak: 0.38, legWidth: 9, tailSegmentLength: 7, headRx: 9, headRy: 6, headDrop: 0.62 },
};

/** 0 an den Enden, 1 bei `peak` – sanfte Buckelform für Rückenlinie und Platten. */
function hump(u: number, peak: number): number {
  return u < peak ? Math.sin((Math.PI / 2) * (u / peak)) : Math.sin((Math.PI / 2) * ((1 - u) / (1 - peak)));
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  player: PlayerState,
  dino: DinoConfig,
  options: PlayerDrawOptions,
) {
  const species = SPECIES[dino.id] ?? SPECIES.ankylosaurus;
  const color = dino.color;
  const ducking = player.isDucking;
  const airborne = player.isJumping;
  const bodyHeight = getPlayerHitboxHeight(player);
  const groundY = GROUND_Y - player.height;

  const legHeight = ducking ? 8 : 15;
  const torsoBottom = groundY - legHeight * 0.55;
  const torsoTop = groundY - bodyHeight;
  const tx0 = x + 6;
  const tx1 = x + 70;
  const torsoX = (u: number) => tx0 + (tx1 - tx0) * u;
  const topY = (u: number) => torsoBottom - (torsoBottom - torsoTop) * (0.35 + 0.65 * hump(u, species.humpPeak));
  const bottomY = (u: number) => torsoBottom + Math.sin(Math.PI * u) * 2;

  ctx.save();
  if (options.invincible) {
    ctx.globalAlpha = Math.sin(performance.now() / 60) > 0 ? 1 : 0.35;
  }

  if (dino.id === "stegosaurus") drawStegoPlates(ctx, torsoX, topY, ducking);

  // Laufzyklus: Trab – diagonale Beinpaare bewegen sich gleich.
  const phase = options.time * 14;
  const legs = [
    { u: 0.2, offset: Math.PI, far: true },
    { u: 0.8, offset: 0, far: true },
    { u: 0.24, offset: 0, far: false },
    { u: 0.84, offset: Math.PI, far: false },
  ];
  const drawLeg = (leg: (typeof legs)[number]) => {
    const hipX = torsoX(leg.u) + (leg.far ? 3 : -2);
    const swing = airborne ? (leg.u < 0.5 ? -4 : 5) : ducking ? 0 : Math.sin(phase + leg.offset) * 5;
    const lift = airborne ? 4 : ducking ? 0 : Math.max(0, Math.cos(phase + leg.offset)) * 4;
    const footX = hipX + swing;
    const footY = groundY - lift;
    ctx.strokeStyle = leg.far ? shade(color, -0.3) : shade(color, -0.08);
    ctx.lineWidth = species.legWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hipX, torsoBottom - 6);
    ctx.lineTo(footX, footY - species.legWidth / 2);
    ctx.stroke();
    // Zehennägel
    ctx.fillStyle = BONE;
    for (const dx of [-2, 1.5, 5]) {
      ctx.beginPath();
      ctx.arc(footX + dx, footY - 1.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  for (const leg of legs.filter((l) => l.far)) drawLeg(leg);

  // Schwanz (hinter dem Rumpf)
  const rootX = tx0 + 6;
  const rootY = (topY(0) + torsoBottom) / 2;
  const tailPoints = getTailPoints(options.tail, rootX, rootY, species.tailSegmentLength, -1);
  ctx.fillStyle = color;
  fillTaperedPath(ctx, tailPoints, (torsoBottom - topY(0)) * 0.95, 3.5);
  drawTailTip(ctx, dino.id, tailPoints, color);

  // Rumpf mit Schattierung
  const torso = new Path2D();
  torso.moveTo(torsoX(0), bottomY(0));
  for (let i = 0; i <= 16; i++) torso.lineTo(torsoX(i / 16), topY(i / 16));
  for (let i = 16; i >= 0; i--) torso.lineTo(torsoX(i / 16), bottomY(i / 16));
  torso.closePath();
  const gradient = ctx.createLinearGradient(0, torsoTop, 0, torsoBottom);
  gradient.addColorStop(0, shade(color, 0.12));
  gradient.addColorStop(0.6, color);
  gradient.addColorStop(1, shade(color, -0.12));
  ctx.fillStyle = gradient;
  ctx.fill(torso);

  // Heller Bauch
  ctx.save();
  ctx.clip(torso);
  ctx.fillStyle = shade(color, 0.35);
  ctx.beginPath();
  ctx.ellipse(torsoX(0.52), torsoBottom + 2, (tx1 - tx0) * 0.46, (torsoBottom - torsoTop) * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = shade(color, -0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke(torso);

  if (dino.id === "ankylosaurus") drawAnkyArmor(ctx, color, torsoX, topY, torsoBottom);

  for (const leg of legs.filter((l) => !l.far)) drawLeg(leg);

  // Hals + Kopf. Beim Ducken geht der Kopf nach unten nach vorn.
  const headX = ducking ? x + 86 : x + 80;
  const headY = ducking
    ? groundY - species.headRy - 3
    : torsoTop + (torsoBottom - torsoTop) * species.headDrop * 0.6 + species.headRy * 0.4;
  const neckBase = { x: torsoX(0.92), y: (topY(0.92) + torsoBottom) / 2 - 2 };

  if (dino.id === "triceratops") drawTriFrill(ctx, color, headX, headY, ducking);

  ctx.fillStyle = color;
  fillTaperedPath(
    ctx,
    [neckBase, { x: (neckBase.x + headX) / 2, y: (neckBase.y + headY) / 2 - 2 }, { x: headX - 4, y: headY }],
    (torsoBottom - topY(0.92)) * 0.75,
    species.headRy * 1.5,
  );

  drawHead(ctx, dino.id, color, headX, headY, species);

  if (options.shield) {
    const cx = x + 40;
    const cy = groundY - bodyHeight / 2 - 4;
    const pulse = 1 + Math.sin(options.time * 6) * 0.03;
    ctx.fillStyle = "rgba(120, 200, 255, 0.16)";
    ctx.strokeStyle = "rgba(90, 180, 255, 0.75)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 64 * pulse, (bodyHeight / 2 + 20) * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(cx, cy, 50, -2.4 + options.time, -1.9 + options.time);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  dinoId: string,
  color: string,
  hx: number,
  hy: number,
  species: Species,
) {
  const { headRx: rx, headRy: ry } = species;

  if (dinoId === "ankylosaurus") {
    // Kleine Kopfhörner nach hinten
    ctx.fillStyle = BONE;
    triangle(ctx, hx - 6, hy - ry + 2, hx - 1, hy - ry + 1, hx - 12, hy - ry - 3);
    ctx.fill();
    triangle(ctx, hx - 7, hy + ry - 3, hx - 2, hy + ry - 1, hx - 13, hy + ry + 1);
    ctx.fill();
  }

  // Schädel + Schnauze
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(hx, hy, rx, ry, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + rx * 0.65, hy + ry * 0.25, rx * 0.55, ry * 0.65, 0.15, 0, Math.PI * 2);
  ctx.fill();

  if (dinoId === "triceratops") {
    // Schnabel
    ctx.fillStyle = shade(color, -0.35);
    triangle(ctx, hx + rx * 0.9, hy - 1, hx + rx * 0.9, hy + ry * 0.75, hx + rx * 1.55, hy + ry * 0.55);
    ctx.fill();
    // Nasenhorn + zwei lange Brauenhörner (hinteres etwas dunkler)
    ctx.fillStyle = BONE;
    triangle(ctx, hx + rx * 0.7, hy - ry * 0.5, hx + rx * 1.05, hy - ry * 0.35, hx + rx * 1.05, hy - ry * 1.25);
    ctx.fill();
    ctx.fillStyle = shade(BONE, -0.18);
    triangle(ctx, hx - 5, hy - ry * 0.7, hx, hy - ry * 0.85, hx + 10, hy - ry * 2.3);
    ctx.fill();
    ctx.fillStyle = BONE;
    triangle(ctx, hx - 2, hy - ry * 0.65, hx + 3, hy - ry * 0.8, hx + 16, hy - ry * 2.1);
    ctx.fill();
  } else if (dinoId === "stegosaurus") {
    ctx.fillStyle = shade(color, -0.3);
    triangle(ctx, hx + rx * 1.0, hy, hx + rx * 1.0, hy + ry * 0.7, hx + rx * 1.4, hy + ry * 0.45);
    ctx.fill();
  }

  // Auge mit Glanzpunkt
  const ex = hx + rx * 0.1;
  const ey = hy - ry * 0.25;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(ex + 0.9, ey + 0.2, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ex + 1.5, ey - 0.6, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Nasenloch, Lächeln, Bäckchen
  ctx.fillStyle = shade(color, -0.45);
  ctx.beginPath();
  ctx.arc(hx + rx * 1.0, hy - ry * 0.05, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.45);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx + rx * 0.35, hy + ry * 0.5);
  ctx.quadraticCurveTo(hx + rx * 0.7, hy + ry * 0.75, hx + rx * 1.05, hy + ry * 0.45);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 130, 150, 0.35)";
  ctx.beginPath();
  ctx.arc(hx - rx * 0.15, hy + ry * 0.35, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawTailTip(
  ctx: CanvasRenderingContext2D,
  dinoId: string,
  points: { x: number; y: number }[],
  color: string,
) {
  const tip = points[points.length - 1];
  const before = points[points.length - 2];

  if (dinoId === "ankylosaurus") {
    // Schwanzkeule mit Knubbeln
    ctx.fillStyle = shade(color, -0.25);
    ctx.beginPath();
    ctx.ellipse(tip.x - 2, tip.y, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, -0.4);
    for (const [dx, dy] of [
      [-6, -3],
      [-1, -5],
      [-5, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(tip.x + dx, tip.y + dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (dinoId === "stegosaurus") {
    // Thagomizer: vier Schwanzstacheln nach oben-hinten
    ctx.fillStyle = BONE;
    for (const p of [tip, before]) {
      triangle(ctx, p.x - 2, p.y - 1, p.x + 2, p.y - 1, p.x - 8, p.y - 13);
      ctx.fill();
      triangle(ctx, p.x - 2, p.y, p.x + 2, p.y, p.x - 12, p.y - 6);
      ctx.fill();
    }
  }
}

function drawStegoPlates(
  ctx: CanvasRenderingContext2D,
  torsoX: (u: number) => number,
  topY: (u: number) => number,
  ducking: boolean,
) {
  const count = 7;
  for (let i = 0; i < count; i++) {
    const u = 0.1 + (i / (count - 1)) * 0.75;
    const px = torsoX(u);
    const py = topY(u) + 4;
    const height = (9 + 15 * hump(u, 0.4)) * (ducking ? 0.7 : 1);
    const half = 4 + height * 0.22;
    const gradient = ctx.createLinearGradient(0, py, 0, py - height);
    gradient.addColorStop(0, "#b84a35");
    gradient.addColorStop(1, "#f2a24a");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(px - half, py);
    ctx.quadraticCurveTo(px - half * 1.1, py - height * 0.6, px, py - height);
    ctx.quadraticCurveTo(px + half * 1.1, py - height * 0.6, px + half, py);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#7d3022";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawAnkyArmor(
  ctx: CanvasRenderingContext2D,
  color: string,
  torsoX: (u: number) => number,
  topY: (u: number) => number,
  torsoBottom: number,
) {
  // Zwei Reihen Knochenplatten (Osteoderme) entlang des Rückens
  for (let i = 0; i < 7; i++) {
    const u = 0.12 + i * 0.125;
    const x = torsoX(u);
    const y = topY(u);
    const rowGap = (torsoBottom - y) * 0.38;
    for (const [dy, r] of [
      [3.5, 4.2],
      [rowGap, 3.2],
    ]) {
      ctx.fillStyle = shade(color, -0.3);
      ctx.beginPath();
      ctx.arc(x, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade(color, 0.15);
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y + dy - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Seitliche Stacheln an der Flanke
  ctx.fillStyle = BONE;
  for (const u of [0.18, 0.38, 0.58, 0.78]) {
    const x = torsoX(u);
    const y = torsoBottom - 4;
    triangle(ctx, x - 3, y, x + 3, y, x - 2, y + 6);
    ctx.fill();
  }
}

function drawTriFrill(ctx: CanvasRenderingContext2D, color: string, hx: number, hy: number, ducking: boolean) {
  const cx = hx - 8;
  const cy = hy - 5;
  const scale = ducking ? 0.75 : 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.45);
  ctx.scale(scale, scale);

  // Gezackter Rand
  ctx.fillStyle = shade(color, -0.35);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 1.15;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 15, Math.sin(a) * 18, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = shade(color, -0.15);
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Muster
  ctx.fillStyle = shade(color, 0.25);
  for (const [dx, dy, r] of [
    [-5, -9, 3],
    [3, -12, 2.4],
    [-9, -1, 2.4],
  ]) {
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
