import type { DinoConfig } from "./types";

// Spielbare Pflanzenfresser. Ankylosaurus ist aktuell der einzige Starter-Dino;
// Phase 5 ergänzt hier z.B. Triceratops und Stegosaurus.
export const ANKYLOSAURUS: DinoConfig = {
  id: "ankylosaurus",
  name: "Ankylosaurus",
  spriteUrl: "/dinos/ankylosaurus.svg", // Platzhalter-Pfad, echtes Sprite folgt später
  color: "#5b8a4a",
  speed: 0.9, // etwas langsamer/träger als der Jäger
  jumpHeight: 0.85,
  duckDuration: 0.8,
  specialAbility: {
    id: "armor-roll",
    name: "Panzer-Rolle",
    description:
      "Der Panzer aus Knochenplatten fängt einen Treffer ab, ohne ein Leben zu kosten.",
  },
};

export const PLAYER_DINOS: DinoConfig[] = [ANKYLOSAURUS];

// Jäger-Dinos. Phase 5 ergänzt hier z.B. T-Rex/Dilophosaurus als weitere Bedrohung.
export const VELOCIRAPTOR: DinoConfig = {
  id: "velociraptor",
  name: "Velociraptor",
  spriteUrl: "/dinos/velociraptor.svg",
  color: "#b3402c",
  speed: 1.15, // schnell & wendig
  jumpHeight: 1,
  duckDuration: 0,
};

export const HUNTER_DINOS: DinoConfig[] = [VELOCIRAPTOR];
