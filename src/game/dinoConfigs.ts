import type { DinoConfig } from "./types";

// Spielbare Pflanzenfresser. Auswahlbildschirm siehe DinoSelectScreen.tsx (Phase 5).
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
    description: "Dick gepanzert und robust – der ausgeglichene Allrounder.",
  },
};

export const TRICERATOPS: DinoConfig = {
  id: "triceratops",
  name: "Triceratops",
  spriteUrl: "/dinos/triceratops.svg",
  color: "#8a6a3d",
  speed: 0.95, // etwas flinker als der Ankylosaurus
  jumpHeight: 1,
  duckDuration: 0.45, // duckt dank Nackenschild besonders schnell
  specialAbility: {
    id: "quick-duck",
    name: "Blitz-Duck",
    description: "Zieht dank Nackenschild blitzschnell den Kopf ein – kurze Duck-Zeit.",
  },
};

export const STEGOSAURUS: DinoConfig = {
  id: "stegosaurus",
  name: "Stegosaurus",
  spriteUrl: "/dinos/stegosaurus.svg",
  color: "#5c6b73",
  speed: 0.82, // langsam & schwer – der Jäger holt am schnellsten auf
  jumpHeight: 0.7,
  duckDuration: 1, // geht lange in Deckung
  specialAbility: {
    id: "tail-spikes",
    name: "Schwanzstacheln",
    description: "Groß, schwer und schwer zu übersehen – für Profis, die es riskant mögen.",
  },
};

export const PLAYER_DINOS: DinoConfig[] = [ANKYLOSAURUS, TRICERATOPS, STEGOSAURUS];

// Jäger-Dinos: bei jedem neuen Spiel wird einer zufällig aus diesem Pool gewählt
// (siehe GameEngine.ts), für Abwechslung bei den Wiederholungen.
export const VELOCIRAPTOR: DinoConfig = {
  id: "velociraptor",
  name: "Velociraptor",
  spriteUrl: "/dinos/velociraptor.svg",
  color: "#b3402c",
  speed: 1.15, // schnell & wendig
  jumpHeight: 1,
  duckDuration: 0,
};

export const TREX: DinoConfig = {
  id: "trex",
  name: "T-Rex",
  spriteUrl: "/dinos/trex.svg",
  color: "#7a3b2e",
  speed: 1.2, // noch schneller als der Velociraptor – die gefährlichste Bedrohung
  jumpHeight: 0.9,
  duckDuration: 0,
};

export const HUNTER_DINOS: DinoConfig[] = [VELOCIRAPTOR, TREX];

export function pickRandomHunter(): DinoConfig {
  return HUNTER_DINOS[Math.floor(Math.random() * HUNTER_DINOS.length)];
}
