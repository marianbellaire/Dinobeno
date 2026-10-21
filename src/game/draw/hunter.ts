// Jäger (Velociraptor / T-Rex) als animierte Canvas-Figur, Blickrichtung nach rechts.
// Ober- und Unterkiefer drehen sich getrennt um das Kiefergelenk: Kurz bevor der Jäger
// den Spieler erreicht (oder einen Meteoriten schnappt), reißt er das Maul auf und zeigt
// zwei Reihen messerscharfer Zähne. Größe (`scale`) wächst mit gefressenen Meteoriten.

import { GROUND_Y } from "../constants";
import type { HunterState } from "../hunter";
import { getTailPoints, type TailState } from "../tail";
import type { DinoConfig } from "../types";
import { fillTaperedPath, shade, triangle } from "./util";

interface TheropodSpec {
  bodyX: number;
  bodyY: number;
  bodyRx: number;
  bodyRy: number;
  /** Kiefergelenk (lokale Koordinaten, Füße auf y = 0). */
  hingeX: number;
  hingeY: number;
  jawLength: number;
  skullHeight: number;
  thighWidth: number;
  legLength: number;
  upperTeeth: number;
  tailSegmentLength: number;
  tinyArms: boolean;
}

const RAPTOR: TheropodSpec = {
  bodyX: 30,
  bodyY: -30,
  bodyRx: 22,
  bodyRy: 10,
  hingeX: 52,
  hingeY: -45,
  jawLength: 21,
  skullHeight: 11,
  thighWidth: 9,
  legLength: 22,
  upperTeeth: 6,
  tailSegmentLength: 6,
  tinyArms: false,
};

const TREX: TheropodSpec = {
  bodyX: 28,
  bodyY: -31,
  bodyRx: 26,
  bodyRy: 14,
  hingeX: 48,
  hingeY: -45,
  jawLength: 27,
  skullHeight: 16,
  thighWidth: 13,
  legLength: 20,
  upperTeeth: 8,
  tailSegmentLength: 6.5,
  tinyArms: true,
};

const TOOTH = "#fbfbf4";
const THROAT = "#5a0f14";

export function drawHunter(
  ctx: CanvasRenderingContext2D,
  x: number,
  dino: DinoConfig,
  state: HunterState,
  tail: TailState,
  time: number,
) {
  const spec = dino.id === "trex" ? TREX : RAPTOR;
  const color = dino.color;
  const jaw = state.jawOpen;
  const phase = time * 16;
  const bob = Math.sin(phase * 2) * 1.2;

  ctx.save();
  ctx.translate(x, GROUND_Y);
  ctx.scale(state.scale, state.scale);

  const cx = spec.bodyX;
  const cy = spec.bodyY + bob;

  // Hinteres Bein (dunkler), dann Schwanz, Körper, vorderes Bein
  drawLeg(ctx, spec, cx - 4, cy + spec.bodyRy * 0.5, phase + Math.PI, shade(color, -0.3), dino.id !== "trex");

  const tailPoints = getTailPoints(tail, cx - spec.bodyRx + 6, cy - 2, spec.tailSegmentLength, -1);
  ctx.fillStyle = color;
  fillTaperedPath(ctx, tailPoints, spec.bodyRy * 1.6, 2.5);

  // Hals zum Kopf
  const hingeX = spec.hingeX + jaw * 5; // Kopf ruckt beim Aufreißen leicht nach vorn
  const hingeY = spec.hingeY + bob - jaw * 2;
  fillTaperedPath(
    ctx,
    [
      { x: cx + spec.bodyRx - 8, y: cy - 3 },
      { x: (cx + spec.bodyRx + hingeX) / 2, y: (cy + hingeY) / 2 - 3 },
      { x: hingeX - 2, y: hingeY - 2 },
    ],
    spec.bodyRy * 1.5,
    spec.skullHeight * 0.9,
  );

  drawBody(ctx, spec, color, cx, cy, dino.id === "trex", state.bellyGlow);
  drawArm(ctx, spec, color, cx, cy);
  drawLeg(ctx, spec, cx + 2, cy + spec.bodyRy * 0.5, phase, shade(color, -0.08), dino.id !== "trex");

  drawHead(ctx, spec, color, hingeX, hingeY, jaw);

  ctx.restore();
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  spec: TheropodSpec,
  color: string,
  cx: number,
  cy: number,
  isTrex: boolean,
  bellyGlow: number,
) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, spec.bodyRx, spec.bodyRy, -0.12, 0, Math.PI * 2);
  const gradient = ctx.createLinearGradient(0, cy - spec.bodyRy, 0, cy + spec.bodyRy);
  gradient.addColorStop(0, shade(color, 0.1));
  gradient.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.save();
  ctx.clip();
  // Heller Bauch
  ctx.fillStyle = shade(color, 0.3);
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + spec.bodyRy * 0.9, spec.bodyRx * 0.8, spec.bodyRy * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rückenzeichnung: Streifen beim Raptor, Schuppen-Knubbel beim T-Rex
  ctx.fillStyle = shade(color, -0.3);
  if (isTrex) {
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(cx - spec.bodyRx * 0.7 + i * 8, cy - spec.bodyRy * 0.82 + Math.abs(i - 2.5) * 1.2, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const sx = cx - spec.bodyRx * 0.6 + i * 9;
      triangle(ctx, sx - 2, cy - spec.bodyRy, sx + 3, cy - spec.bodyRy, sx - 1, cy - spec.bodyRy * 0.15);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.strokeStyle = shade(color, -0.4);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, spec.bodyRx, spec.bodyRy, -0.12, 0, Math.PI * 2);
  ctx.stroke();

  // Verschlungener Meteorit glüht kurz im Bauch
  if (bellyGlow > 0) {
    const glow = ctx.createRadialGradient(cx, cy + 2, 1, cx, cy + 2, spec.bodyRx);
    glow.addColorStop(0, `rgba(255, 200, 80, ${0.85 * bellyGlow})`);
    glow.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, spec.bodyRx, spec.bodyRy, -0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Laufbein: Oberschenkel → Knie → Mittelfuß → Zehen, Fuß folgt einer Laufellipse. */
function drawLeg(
  ctx: CanvasRenderingContext2D,
  spec: TheropodSpec,
  hipX: number,
  hipY: number,
  phase: number,
  color: string,
  sickleClaw: boolean,
) {
  const footX = hipX + Math.sin(phase) * 12;
  const footY = -Math.max(0, -Math.cos(phase)) * 7;
  const ankleX = footX - 4;
  const ankleY = footY - 7;
  const kneeX = (hipX + ankleX) / 2 + 7;
  const kneeY = (hipY + ankleY) / 2 - 1;

  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = spec.thighWidth;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.stroke();
  ctx.lineWidth = spec.thighWidth * 0.55;
  ctx.beginPath();
  ctx.moveTo(kneeX, kneeY);
  ctx.lineTo(ankleX, ankleY);
  ctx.lineTo(footX + 2, footY - 1.5);
  ctx.stroke();

  // Zehenkrallen
  ctx.fillStyle = "#2b2420";
  triangle(ctx, footX + 3, footY - 3, footX + 3, footY, footX + 8, footY);
  ctx.fill();
  if (sickleClaw) {
    // Gebogene Sichelkralle des Velociraptors, nach oben gehalten
    ctx.strokeStyle = "#2b2420";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(footX - 1, footY - 4, 4, Math.PI * 1.05, Math.PI * 1.75);
    ctx.stroke();
  }
}

function drawArm(ctx: CanvasRenderingContext2D, spec: TheropodSpec, color: string, cx: number, cy: number) {
  ctx.strokeStyle = shade(color, -0.12);
  ctx.lineCap = "round";
  const sx = cx + spec.bodyRx * 0.6;
  const sy = cy + 1;
  if (spec.tinyArms) {
    // Die berühmten Mini-Ärmchen des T-Rex
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 5, sy + 4);
    ctx.stroke();
    ctx.fillStyle = "#2b2420";
    triangle(ctx, sx + 5, sy + 3, sx + 6, sy + 5, sx + 8.5, sy + 6);
    ctx.fill();
    return;
  }
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + 6, sy + 7);
  ctx.lineTo(sx + 12, sy + 4);
  ctx.stroke();
  ctx.fillStyle = "#2b2420";
  for (const dy of [-1, 2]) {
    triangle(ctx, sx + 12, sy + 3 + dy, sx + 12, sy + 5 + dy, sx + 17, sy + 6 + dy);
    ctx.fill();
  }
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  spec: TheropodSpec,
  color: string,
  hingeX: number,
  hingeY: number,
  jaw: number,
) {
  const L = spec.jawLength;
  const H = spec.skullHeight;
  const upperAngle = -jaw * 0.32;
  const lowerAngle = jaw * 0.95;

  ctx.save();
  ctx.translate(hingeX, hingeY);

  // Rachen – nur sichtbar, wenn das Maul offen ist
  if (jaw > 0.03) {
    const upperTip = { x: Math.cos(upperAngle) * L, y: Math.sin(upperAngle) * L };
    const lowerTip = { x: Math.cos(lowerAngle) * L * 0.95, y: Math.sin(lowerAngle) * L * 0.95 };
    ctx.fillStyle = THROAT;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(upperTip.x, upperTip.y + 1);
    ctx.quadraticCurveTo(L * 0.7, 0, lowerTip.x, lowerTip.y);
    ctx.closePath();
    ctx.fill();
  }

  // Unterkiefer mit Zunge und nach oben zeigenden Zähnen
  ctx.save();
  ctx.rotate(lowerAngle);
  if (jaw > 0.03) {
    ctx.fillStyle = "#d65a6a";
    ctx.beginPath();
    ctx.ellipse(L * 0.42, -1, L * 0.34, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-5, -1);
  ctx.lineTo(L * 0.95, -0.5);
  ctx.quadraticCurveTo(L, 2, L * 0.85, H * 0.32);
  ctx.lineTo(-6, H * 0.45);
  ctx.closePath();
  ctx.fill();
  drawTeeth(ctx, 3, L * 0.9, -0.5, spec.upperTeeth - 1, 2.5 + jaw * 3.5, -1);
  ctx.restore();

  // Oberkiefer/Schädel mit herabhängenden Zähnen
  ctx.save();
  ctx.rotate(upperAngle);
  drawTeeth(ctx, 2, L * 0.97, 0.5, spec.upperTeeth, 3 + jaw * 4.5, 1);
  const gradient = ctx.createLinearGradient(0, -H, 0, 2);
  gradient.addColorStop(0, shade(color, 0.08));
  gradient.addColorStop(1, shade(color, -0.1));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(-8, 3);
  ctx.lineTo(-9, -H * 0.65);
  ctx.quadraticCurveTo(-4, -H * 1.05, 4, -H);
  ctx.quadraticCurveTo(L * 0.6, -H * 0.75, L, -H * 0.3);
  ctx.quadraticCurveTo(L + 2, 0, L - 1, 1);
  ctx.lineTo(-2, 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.4);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Nasenloch
  ctx.fillStyle = shade(color, -0.5);
  ctx.beginPath();
  ctx.ellipse(L * 0.85, -H * 0.38, 1.6, 1, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Gelbes Raubtierauge mit Schlitzpupille + böse Augenbraue
  const ex = L * 0.18;
  const ey = -H * 0.6;
  ctx.fillStyle = "#ffd23f";
  ctx.beginPath();
  ctx.arc(ex, ey, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(ex + 0.5, ey, 0.9, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.55);
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ex - 4.5, ey - 5);
  ctx.lineTo(ex + 4.5, ey - 2.5);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Zahnreihe entlang einer Kieferkante. `direction` = 1 → Zähne zeigen nach unten
 * (Oberkiefer), -1 → nach oben (Unterkiefer). Vorne etwas längere Fangzähne.
 */
function drawTeeth(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  edgeY: number,
  count: number,
  length: number,
  direction: 1 | -1,
) {
  ctx.fillStyle = TOOTH;
  ctx.strokeStyle = "rgba(60, 40, 30, 0.35)";
  ctx.lineWidth = 0.6;
  const step = (toX - fromX) / count;
  for (let i = 0; i < count; i++) {
    const tx = fromX + step * i;
    const fang = i === count - 2 ? 1.35 : 1;
    const len = length * fang * (0.8 + 0.2 * (i / count));
    triangle(ctx, tx, edgeY, tx + step * 0.85, edgeY, tx + step * 0.55, edgeY + len * direction);
    ctx.fill();
    ctx.stroke();
  }
}
