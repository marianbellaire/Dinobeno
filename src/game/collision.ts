export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Verkleinert eine Hitbox relativ zur Sprite-Größe, damit Kollisionen fair wirken –
 * ein Treffer soll erst bei sichtbarer Überlappung zählen, nicht schon wenn sich
 * transparente Sprite-Ecken berühren.
 */
export function insetRect(rect: Rect, insetRatio: number): Rect {
  const insetX = rect.width * insetRatio;
  const insetY = rect.height * insetRatio;
  return {
    x: rect.x + insetX,
    y: rect.y + insetY,
    width: rect.width - insetX * 2,
    height: rect.height - insetY * 2,
  };
}
