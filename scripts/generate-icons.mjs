// Einmaliges Build-Hilfsskript: erzeugt die PWA-Icons (Phase 6) aus einem simplen
// Emoji-auf-Farbfläche-Platzhalter – im gleichen "einfache Formen"-Stil wie die
// Canvas-Platzhaltergrafiken im Spiel selbst. Echte Pixel-Art kann später ersetzt
// werden, ohne dass sich am Manifest/HTML etwas ändern muss (gleiche Dateinamen).
//
// Aufruf: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createElement } from "react";

const require = createRequire(import.meta.url);
const { ImageResponse } = require("next/og");

const BRAND_GREEN = "#5b8a4a";
const BRAND_GREEN_DARK = "#3f6631";

function iconElement(size, { maskableSafeArea = false } = {}) {
  // Maskable Icons brauchen Rand-Puffer, da manche Launcher das Icon in einen Kreis
  // schneiden (Android "adaptive icons") – Inhalt bleibt dann innerhalb ~80% Radius.
  const padding = maskableSafeArea ? size * 0.14 : size * 0.08;
  const fontSize = size - padding * 2.4;

  return createElement(
    "div",
    {
      style: {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_GREEN,
        borderRadius: maskableSafeArea ? 0 : size * 0.22,
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size - padding * 2,
          height: size - padding * 2,
          borderRadius: "50%",
          background: BRAND_GREEN_DARK,
          fontSize,
        },
      },
      "🦖",
    ),
  );
}

async function renderPng(size, options) {
  const response = new ImageResponse(iconElement(size, options), { width: size, height: size });
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

async function main() {
  const outDir = new URL("../public/icons/", import.meta.url);
  await mkdir(outDir, { recursive: true });

  const targets = [
    { file: "icon-192.png", size: 192 },
    { file: "icon-512.png", size: 512 },
    { file: "icon-maskable-512.png", size: 512, maskableSafeArea: true },
    { file: "apple-touch-icon.png", size: 180 },
  ];

  for (const { file, size, maskableSafeArea } of targets) {
    const buffer = await renderPng(size, { maskableSafeArea });
    await writeFile(new URL(file, outDir), buffer);
    console.log(`✓ ${file} (${size}x${size}, ${buffer.byteLength} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
