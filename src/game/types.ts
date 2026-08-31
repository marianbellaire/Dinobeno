// Datenmodell für Dinos. WICHTIG: Dino-Typen werden hier als Konfigurationsobjekte
// beschrieben statt im Code hart zu verdrahten, damit spätere Phasen (Dino-Auswahl,
// weitere Jäger wie T-Rex/Dilophosaurus) einfach neue Einträge hinzufügen können,
// ohne Spiel-Logik anzufassen.

export type SpecialAbilityId = "armor-roll" | "quick-duck" | "tail-spikes";

export interface SpecialAbility {
  id: SpecialAbilityId;
  name: string;
  /** Kurzbeschreibung, z.B. für ein Info-/Auswahl-Overlay in Phase 5. */
  description: string;
}

export interface DinoConfig {
  id: string;
  name: string;
  /** Pfad zum Sprite. Für Phase 1-3 werden stattdessen einfache geometrische
   *  Platzhalter gezeichnet (siehe `drawDino`) – die Sprites kommen iterativ dazu. */
  spriteUrl: string;
  /** Platzhalterfarbe, solange es kein echtes Sprite gibt. */
  color: string;
  /** Grundgeschwindigkeit relativ zu 1 = normal. */
  speed: number;
  /** Sprunghöhe relativ zu 1 = normal. */
  jumpHeight: number;
  /** Wie lange (in Sekunden) ein Duck-Vorgang mindestens andauert. */
  duckDuration: number;
  specialAbility?: SpecialAbility;
}
