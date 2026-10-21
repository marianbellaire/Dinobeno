// Kleine Zeichen-Helfer, die von allen draw/*-Modulen geteilt werden.

export function roundRect(
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

/**
 * Hellt eine Hex-Farbe auf (amount > 0, Richtung Weiß) oder dunkelt sie ab
 * (amount < 0, Richtung Schwarz). amount in -1 … 1.
 */
export function shade(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const [r, g, b] = channels.map((c) => Math.round(c + (target - c) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Füllt einen sich verjüngenden Schlauch entlang einer Punktfolge (Schwänze, Hälse,
 * Farnwedel). Breite wird linear von `startWidth` auf `endWidth` interpoliert.
 */
export function fillTaperedPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  startWidth: number,
  endWidth: number,
) {
  if (points.length < 2) return;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];

  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const half = (startWidth + (endWidth - startWidth) * (i / (points.length - 1))) / 2;
    left.push({ x: points[i].x + nx * half, y: points[i].y + ny * half });
    right.push({ x: points[i].x - nx * half, y: points[i].y - ny * half });
  }

  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (const p of left.slice(1)) ctx.lineTo(p.x, p.y);
  for (const p of [...right].reverse()) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.fill();

  // Abgerundete Spitze
  const tip = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, Math.max(endWidth / 2, 0.5), 0, Math.PI * 2);
  ctx.fill();
}

/** Spitzer Zahn bzw. Horn als Dreieck von (x1,y1)-(x2,y2) zur Spitze (tx,ty). */
export function triangle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tx: number,
  ty: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(tx, ty);
  ctx.lineTo(x2, y2);
  ctx.closePath();
}
