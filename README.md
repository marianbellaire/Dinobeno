# Dino be no! 🦖

Side-Scroller-Endless-Runner-PWA: Als Ankylosaurus, Triceratops oder Stegosaurus
einem jagenden Velociraptor (oder T-Rex) entkommen und Hindernissen ausweichen.

Live: **https://dinobeno.marianbellaire.de**

## Tech-Stack

- Next.js 16 (App Router) + TypeScript, statisch exportiert (`output: "export"`)
- HTML5 Canvas fürs Spielfeld, Tailwind CSS für UI-Overlays (Menüs, HUD)
- `localStorage` für High-Score und Ton-Einstellung (kein Backend)
- PWA: Web App Manifest + Service Worker (offline spielbar, "Zum Home-Bildschirm")
- Deployment: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`),
  eigene Domain über `public/CNAME`

## Entwicklung

```bash
npm install
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen. Der Spiel-Code liegt
größtenteils in `src/game/` (Physik, Kollision, Spawning – bewusst außerhalb von
React, siehe `GameEngine.ts`) und `src/components/` (React-UI drumherum).

```bash
npm run build   # Static Export nach out/, wird von GitHub Actions deployt
npm run lint
```

Icons unter `public/icons/` werden aus `scripts/generate-icons.mjs` erzeugt
(`node scripts/generate-icons.mjs`) – einfache Emoji-Platzhalter, kein externes
Asset nötig.

## Umsetzungsstand

Alle 6 Phasen der ursprünglichen Spec sind umgesetzt:

1. Grundgerüst (Canvas, Game-Loop, Spieler-Dino springen/ducken, responsiv)
2. Gegner & Kollision (Jäger-Annäherung, Hindernis-Spawning, faire Hitboxen)
3. Punkte & Leben (Score, 3-Leben-System, Invincibility-Frames, Game-Over, High-Score)
4. Power-ups (🍓 Beeren, ⚡ Tempo-Boost, 🛡️ Schild)
5. Dino-Auswahl (3 spielbare Dinos, 2 Jäger-Typen, Auswahlbildschirm)
6. PWA-Polish (Manifest, Service Worker, Safe-Area-Insets, Sound-Effekte)

MVP-Grafiken sind bewusst einfache geometrische Formen/Emoji statt echter
Sprites – kann iterativ durch Pixel-Art ersetzt werden.
