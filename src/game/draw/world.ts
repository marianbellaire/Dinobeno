// Welt: Himmel, Parallax-Hügel, scrollender Boden, Hindernisse (Steine, Pflanzen,
// Flugsaurier, Lianen) und Power-ups. Alles als Canvas-Formen, keine Sprites.

import { getEruptionIntensity, type CelebrationState } from "../celebration";
import { GROUND_HEIGHT, GROUND_Y, PICKUP_SIZE } from "../constants";
import { getObstacleRect, type Obstacle } from "../obstacles";
import type { Pickup } from "../pickups";
import { fillTaperedPath, roundRect, shade, triangle } from "./util";

/** Deterministische Pseudo-Zufallszahl 0 … 1 pro Ganzzahl (für Boden-Details). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Himmel, Hügel und Boden über die volle sichtbare Weltbreite. */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  visibleWorldWidth: number,
  scroll: number,
  celebration: CelebrationState | null,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, "#bfe6ff");
  sky.addColorStop(1, "#eaf7ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, visibleWorldWidth, GROUND_Y);

  // Freudiges Glühen am Himmel während des Vulkan-Ausbruchs
  const glow = celebration ? getEruptionIntensity(celebration.time) : 0;
  if (glow > 0 && celebration) {
    const radial = ctx.createRadialGradient(celebration.volcanoX, GROUND_Y - 120, 10, celebration.volcanoX, GROUND_Y - 120, 520);
    radial.addColorStop(0, `rgba(255, 190, 90, ${0.55 * glow})`);
    radial.addColorStop(0.5, `rgba(255, 120, 180, ${0.22 * glow})`);
    radial.addColorStop(1, "rgba(255, 120, 180, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, visibleWorldWidth, GROUND_Y);
  }

  drawHills(ctx, visibleWorldWidth, scroll * 0.12, GROUND_Y - 70, 26, "#cbe8d0");
  drawHills(ctx, visibleWorldWidth, scroll * 0.3, GROUND_Y - 32, 18, "#a9d6a2");

  ctx.fillStyle = "#c9a26a"; // Sand/Erde
  ctx.fillRect(0, GROUND_Y, visibleWorldWidth, GROUND_HEIGHT);

  // Grasnarbe
  ctx.fillStyle = "#8fbf5a";
  ctx.fillRect(0, GROUND_Y - 2, visibleWorldWidth, 6);

  ctx.strokeStyle = "#a67b46";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 4);
  ctx.lineTo(visibleWorldWidth, GROUND_Y + 4);
  ctx.stroke();

  drawGroundDetails(ctx, visibleWorldWidth, scroll);
}

function drawHills(
  ctx: CanvasRenderingContext2D,
  width: number,
  offset: number,
  baseY: number,
  amplitude: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= width + 10; x += 10) {
    const wx = x + offset;
    const y = baseY - amplitude * (0.6 * Math.sin(wx / 140) + 0.4 * Math.sin(wx / 53 + 1.3));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

/** Kiesel und Grasbüschel, die mit der Welt mitscrollen – vermitteln Tempo. */
function drawGroundDetails(ctx: CanvasRenderingContext2D, width: number, scroll: number) {
  const tile = 64;
  const first = Math.floor(scroll / tile);
  const offset = scroll % tile;
  for (let i = 0; i <= Math.ceil(width / tile) + 1; i++) {
    const n = first + i;
    const x = i * tile - offset + hash(n) * tile * 0.6;
    const y = GROUND_Y + 14 + hash(n + 7) * (GROUND_HEIGHT - 26);

    ctx.fillStyle = hash(n + 3) > 0.5 ? "#b48a52" : "#d8b47e";
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + hash(n + 1) * 4, 2 + hash(n + 2) * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hash(n + 11) > 0.55) {
      const gx = i * tile - offset + hash(n + 13) * tile;
      ctx.strokeStyle = "#7aa84a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (const d of [-3, 0, 3]) {
        ctx.beginPath();
        ctx.moveTo(gx + d, GROUND_Y + 1);
        ctx.lineTo(gx + d * 1.8, GROUND_Y - 6 - Math.abs(d));
        ctx.stroke();
      }
    }
  }
}

/** Zeichnet ein Hindernis passend zu seinem Typ. `t` = Animationszeit. */
export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle, t: number) {
  const { x, y, width, height } = getObstacleRect(obstacle);
  const phase = obstacle.id * 1.7; // jedes Exemplar wiegt/flattert leicht versetzt

  ctx.save();
  switch (obstacle.config.type) {
    case "stone":
      drawStone(ctx, x, y, width, height);
      break;
    case "bush":
      drawBush(ctx, x, y, width, height, t + phase);
      break;
    case "fern":
      drawFern(ctx, x, y, width, height, t + phase);
      break;
    case "horsetail":
      drawHorsetail(ctx, x, y, width, height, t + phase);
      break;
    case "pterodactyl":
      drawPterodactyl(ctx, x, y, width, height, t + phase);
      break;
    case "vine":
      drawVine(ctx, x, y, width, height, t + phase);
      break;
  }
  ctx.restore();
}

function drawStone(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const gradient = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  gradient.addColorStop(0, "#b5b5b5");
  gradient.addColorStop(1, "#6f6f6f");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h);
  ctx.quadraticCurveTo(x - 2, y + h * 0.35, x + w * 0.35, y + 2);
  ctx.quadraticCurveTo(x + w * 0.75, y - 3, x + w - 3, y + h * 0.45);
  ctx.quadraticCurveTo(x + w + 2, y + h * 0.8, x + w - 1, y + h);
  ctx.closePath();
  ctx.fill();

  // Moos + Riss
  ctx.fillStyle = "#7fae55";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.42, y + 5, w * 0.2, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(40, 40, 40, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.62, y + h * 0.3);
  ctx.lineTo(x + w * 0.55, y + h * 0.55);
  ctx.lineTo(x + w * 0.66, y + h * 0.75);
  ctx.stroke();
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const sway = Math.sin(t * 2.2) * 1.5;
  const blobs = [
    { dx: 0.22, dy: 0.62, r: 0.3 },
    { dx: 0.5, dy: 0.4, r: 0.36 },
    { dx: 0.78, dy: 0.6, r: 0.3 },
    { dx: 0.36, dy: 0.72, r: 0.28 },
    { dx: 0.66, dy: 0.74, r: 0.28 },
  ];
  // Hintere, dunklere Lage, dann vordere, hellere Lage
  for (const [color, grow, lift] of [
    ["#2f5e2a", 1.08, 0],
    ["#4f8a3a", 0.9, 2],
  ] as const) {
    ctx.fillStyle = color;
    for (const b of blobs) {
      ctx.beginPath();
      ctx.arc(x + w * b.dx + sway * b.dy, y + h * b.dy - lift, h * b.r * grow, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Glanzlichter + Beeren
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.arc(x + w * 0.45 + sway * 0.4, y + h * 0.28, h * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d63a4a";
  for (const [bx, by] of [
    [0.3, 0.5],
    [0.6, 0.35],
    [0.72, 0.62],
    [0.45, 0.7],
  ]) {
    ctx.beginPath();
    ctx.arc(x + w * bx + sway * by, y + h * by, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Dichter Boden-Abschluss, damit der Busch nicht schwebt
  ctx.fillStyle = "#2f5e2a";
  ctx.fillRect(x + w * 0.12, y + h - 6, w * 0.76, 6);
}

function drawFern(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const baseX = x + w / 2;
  const baseY = y + h;
  const sway = Math.sin(t * 1.8) * 0.08;
  const fronds = [-1.25, -0.8, -0.35, 0.05, 0.45, 0.9, 1.3]; // Neigung je Wedel

  for (let f = 0; f < fronds.length; f++) {
    const lean = fronds[f] + sway;
    const length = h * (1 - Math.abs(fronds[f]) * 0.28);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 10; i++) {
      const s = i / 10;
      // Wedel wächst nach oben und biegt sich zur Spitze hin nach außen über
      const angle = -Math.PI / 2 + lean * (0.4 + s * 0.9);
      const r = length * s;
      points.push({ x: baseX + Math.cos(angle) * r, y: baseY + Math.sin(angle) * r });
    }

    ctx.strokeStyle = "#3e6b2a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // Fiederblättchen links/rechts entlang des Wedels, zur Spitze hin kleiner
    ctx.fillStyle = f % 2 === 0 ? "#5a9a3c" : "#6bb04a";
    for (let i = 2; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];
      const dir = Math.atan2(p.y - prev.y, p.x - prev.x);
      const leaf = 7 * (1 - i / points.length) + 2;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(dir + side * 1.1);
        ctx.beginPath();
        ctx.ellipse(leaf / 2, 0, leaf / 2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

function drawHorsetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const stalks = [
    { dx: 0.55, height: 1, width: 7 },
    { dx: 0.2, height: 0.68, width: 5 },
    { dx: 0.88, height: 0.5, width: 4 },
  ];
  for (const stalk of stalks) {
    const sx = x + w * stalk.dx;
    const top = y + h * (1 - stalk.height);
    const sway = Math.sin(t * 1.6 + stalk.dx * 4) * 2 * stalk.height;

    const gradient = ctx.createLinearGradient(sx - stalk.width / 2, 0, sx + stalk.width / 2, 0);
    gradient.addColorStop(0, "#4c7d34");
    gradient.addColorStop(0.5, "#79b04f");
    gradient.addColorStop(1, "#4c7d34");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(sx - stalk.width / 2, y + h);
    ctx.lineTo(sx - stalk.width / 2 + sway, top + 6);
    ctx.lineTo(sx + stalk.width / 2 + sway, top + 6);
    ctx.lineTo(sx + stalk.width / 2, y + h);
    ctx.closePath();
    ctx.fill();

    // Knoten mit quirligen Nadeln
    const nodes = Math.floor((y + h - top) / 11);
    for (let i = 1; i <= nodes; i++) {
      const ny = y + h - i * 11;
      const nx = sx + sway * (i / nodes);
      ctx.fillStyle = "#2f4f22";
      ctx.fillRect(nx - stalk.width / 2 - 0.5, ny, stalk.width + 1, 2);
      ctx.strokeStyle = "#5e9440";
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(nx, ny + 1);
        ctx.lineTo(nx + side * (stalk.width + 4), ny - 4);
        ctx.stroke();
      }
    }

    // Sporenzapfen an der Spitze
    ctx.fillStyle = "#8a6a3d";
    ctx.beginPath();
    ctx.ellipse(sx + sway, top + 4, stalk.width * 0.55, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Flugsaurier: fliegt dem Spieler entgegen (Kopf links), Flügelschlag + leichtes Wippen. */
function drawPterodactyl(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const bob = Math.sin(t * 3) * 2;
  const flap = Math.sin(t * 11); // -1 … 1
  const cx = x + w * 0.5;
  const cy = y + h * 0.6 + bob;
  const body = "#8e5a9c";
  const membrane = "#b37cc0";

  // Hinterer Flügel (dunkler)
  ctx.fillStyle = shade(membrane, -0.25);
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 2);
  ctx.quadraticCurveTo(cx + 6, cy - 14 - flap * 10, cx + 16, cy - 22 - flap * 16);
  ctx.lineTo(cx + 14, cy + 1);
  ctx.closePath();
  ctx.fill();

  // Körper
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy, 13, 6, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Kopf mit langem Schnabel (nach links) und Kamm (nach rechts hinten)
  const hx = cx - 13;
  const hy = cy - 4;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e0b04a";
  triangle(ctx, hx - 3, hy - 2, hx - 3, hy + 3, hx - 22, hy + 3);
  ctx.fill();
  ctx.fillStyle = shade(body, -0.25);
  triangle(ctx, hx + 1, hy - 4, hx + 4, hy - 2, hx + 15, hy - 11);
  ctx.fill();
  // Auge
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(hx - 1, hy - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(hx - 1.4, hy - 1, 1, 0, Math.PI * 2);
  ctx.fill();

  // Vorderer Flügel: Flughaut zwischen Arm und Körper, Spitze schlägt auf und ab
  ctx.fillStyle = membrane;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 1);
  ctx.quadraticCurveTo(cx + 4, cy - 10 - flap * 12, cx + 2, cy - 24 - flap * 20);
  ctx.quadraticCurveTo(cx + 18, cy - 8 - flap * 8, cx + 16, cy + 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shade(body, -0.3);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 1);
  ctx.quadraticCurveTo(cx + 4, cy - 10 - flap * 12, cx + 2, cy - 24 - flap * 20);
  ctx.stroke();

  // Kurzer Schwanz + Füße
  ctx.strokeStyle = body;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 14, cy + 1);
  ctx.lineTo(cx + 24, cy + 3);
  ctx.moveTo(cx + 6, cy + 5);
  ctx.lineTo(cx + 10, cy + 10);
  ctx.stroke();
}

/** Tiefhängende Lianen an einem Ast vom oberen Bildrand – nur Ducken hilft. */
function drawVine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const bottom = y + h;

  // Ast oben quer durchs Bild
  ctx.fillStyle = "#6b4a2b";
  roundRect(ctx, x - 30, y - 6, w + 60, 18, 8);
  ctx.fill();
  ctx.fillStyle = "#4f8a3a";
  for (const dx of [-24, -6, 14, 34, 52]) {
    ctx.beginPath();
    ctx.ellipse(x + dx, y + 10, 12, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Drei Lianenstränge, der mittlere reicht bis zur Unterkante (Hitbox-Grenze)
  const strands = [
    { dx: 0.2, length: 0.94 },
    { dx: 0.5, length: 1 },
    { dx: 0.8, length: 0.9 },
  ];
  for (const strand of strands) {
    const sx = x + w * strand.dx;
    const end = y + (bottom - y) * strand.length;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 14; i++) {
      const s = i / 14;
      const py = y + 8 + (end - y - 8) * s;
      const px = sx + Math.sin(s * 9 + strand.dx * 5) * 3 + Math.sin(t * 2) * 4 * s * s;
      points.push({ x: px, y: py });
    }
    ctx.fillStyle = "#4a7a2e";
    fillTaperedPath(ctx, points, 5, 3);

    // Blätter abwechselnd links/rechts
    ctx.fillStyle = "#62a843";
    for (let i = 2; i < points.length; i += 2) {
      const p = points[i];
      const side = i % 4 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(p.x + side * 5, p.y, 5.5, 2.6, side * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Blätterbüschel am unteren Ende des Hauptstrangs – markiert die "Duck-Linie"
  const tipX = x + w * 0.5 + Math.sin(t * 2) * 4;
  ctx.fillStyle = "#3f7a2b";
  for (const [dx, dy, r] of [
    [-6, -6, 7],
    [6, -6, 7],
    [0, -2, 8],
  ]) {
    ctx.beginPath();
    ctx.arc(tipX + dx, bottom + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Zeichnet ein Power-up/Ressource als Emoji auf einem leicht schwebenden, halb-
 * transparenten Kreis (bessere Lesbarkeit vor Himmel/Boden).
 */
export function drawPickup(ctx: CanvasRenderingContext2D, pickup: Pickup, t: number) {
  const { x } = pickup;
  const y = pickup.y + Math.sin(t * 4 + pickup.id) * 2.5;
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
