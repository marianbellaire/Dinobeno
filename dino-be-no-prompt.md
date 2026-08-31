# Projekt-Prompt für Claude Code: "Dino be no!"

## Ziel
Baue eine PWA (Progressive Web App) namens **"Dino be no!"** – ein Side-Scroller-Endless-Runner-Spiel, in dem der Spieler als Ankylosaurus einem jagenden Velociraptor entkommen und gleichzeitig Hindernissen ausweichen muss. Zielgruppe: Kinder und Familien, spielbar auf Handy, Tablet und Desktop.

---

## Tech-Stack
- **Next.js 14 (App Router) + TypeScript**
- **HTML5 Canvas** für das eigentliche Spielfeld (kein DOM-Rendering der Spielobjekte, aus Performance-Gründen)
- **Tailwind CSS** für UI-Elemente außerhalb des Canvas (Menüs, Buttons, Overlays)
- **localStorage** für High-Score-Speicherung (kein Backend nötig)
- **PWA-Setup**: Web App Manifest + Service Worker (Offline-Spielbarkeit, "Add to Homescreen")
- Deployment-Ziel: Vercel (wie bestehende Projekte)

---

## Spielkonzept

### Grundprinzip
Side-Scroller: Der Spieler-Dino läuft automatisch nach rechts. Zwei Gefahrenquellen:
1. **Der Velociraptor** jagt von links und nähert sich über Zeit an (Abstand schrumpft langsam)
2. **Hindernisse** (Steine, Bäume, kleine Gegner) erscheinen von rechts und bewegen sich auf den Spieler zu

### Steuerung
- **Springen**: Tap (Mobile) / Leertaste (Desktop)
- **Ducken**: Swipe nach unten (Mobile) / Pfeiltaste unten (Desktop)
- Zusätzlich: on-screen Buttons unten links/rechts als Fallback für Kinder, die mit Swipe-Gesten unsicher sind
- Touch-Targets ausreichend groß (min. 44x44px), Safe-Area-Insets beachten (Notch/Home-Bar bei iPhones)

### Charaktere (Start)
- **Spieler**: Ankylosaurus – etwas langsamer/träger als andere Dinos, dafür robuster (siehe Spezialfähigkeit)
- **Jäger**: Velociraptor – schnell, wendig, klassischer Verfolger

### Datenmodell (wichtig für spätere Erweiterung!)
Dinos müssen als **austauschbare Konfigurationsobjekte** angelegt werden, NICHT hart codiert. Jeder Dino-Typ hat:
```typescript
interface DinoConfig {
  id: string;
  name: string;
  spriteUrl: string;
  speed: number;
  jumpHeight: number;
  duckDuration: number;
  specialAbility?: SpecialAbility; // z.B. Panzer-Rolle für Ankylosaurus
}
```
Das gilt sowohl für spielbare Pflanzenfresser als auch für Jäger-Dinos (später z.B. T-Rex, Dilophosaurus als weitere Jäger). Auswahlbildschirm kann in Phase 5 (siehe unten) ergänzt werden, sollte aber vom Datenmodell her JETZT schon vorbereitet sein.

### Ressourcen & Power-ups
- 🍓 **Beeren**: Einsammeln = Bonuspunkte
- ⚡ **Tempo-Boost**: Kurzzeitig schneller, vergrößert Abstand zum Jäger
- 🛡️ **Schild**: Fängt einen Treffer ab, ohne Leben zu kosten

### Leben & Game Over
- 3 Leben zu Beginn
- Jeder Treffer (Hindernis-Kollision ODER Jäger holt auf) kostet 1 Leben
- Kurze Invincibility-Frames nach Treffer (ca. 1-2 Sek. Unverwundbarkeit + visuelles Blinken)
- Bei 0 Leben: Game-Over-Screen mit erreichtem Score, High-Score-Vergleich und Restart-Button

### Punktesystem
- Kontinuierliche Punkte pro Sekunde Überleben
- Bonus-Punkte pro eingesammelter Beere
- High-Score wird lokal in localStorage gespeichert und im Game-Over-Screen angezeigt

### Schwierigkeitskurve
- Alle 15-20 Sekunden: Jäger-Tempo steigt, Hindernis-Frequenz steigt
- Obergrenze einbauen (z.B. nach 3 Minuten maximale Schwierigkeit erreicht), damit es nicht unspielbar wird

---

## Umsetzung in Phasen (Meilensteine)

**Phase 1: Grundgerüst**
- Next.js-Projekt-Setup, Canvas-Komponente, Game-Loop (requestAnimationFrame)
- Spieler-Dino (Ankylosaurus) rendern, Springen + Ducken implementieren (Touch + Keyboard)
- Responsive Canvas, das sich an verschiedene Viewport-Größen/Seitenverhältnisse anpasst

**Phase 2: Gegner & Kollision**
- Velociraptor-Jäger von links (Annäherungslogik)
- Hindernisse von rechts (Spawn-Logik, Bewegung)
- Kollisionserkennung (Hitboxen, nicht 1:1 Sprite-Größe für faires Gameplay)

**Phase 3: Punkte & Leben**
- Score-Zähler, Leben-System (3 Leben), Invincibility-Frames
- Game-Over-Screen, Restart-Funktion
- High-Score in localStorage

**Phase 4: Power-ups & Ressourcen**
- Beeren-Spawn und Einsammel-Logik
- Tempo-Boost und Schild als Power-ups mit visuellem Feedback (Icon/Timer-Anzeige)

**Phase 5: Dino-Auswahl (Erweiterung)**
- Auswahlbildschirm für spielbare Dinos (Ankylosaurus + weitere, z.B. Triceratops, Stegosaurus)
- Erweiterung des Jäger-Pools (z.B. T-Rex als alternative/zusätzliche Bedrohung)
- Dino-Configs aus Phase 1 werden hier voll ausgenutzt

**Phase 6: PWA-Polish**
- Web App Manifest (Icons, Name "Dino be no!", Theme-Farben)
- Service Worker für Offline-Fähigkeit
- Safe-Area-Insets final testen (iOS Notch/Home-Bar)
- Sound-Effekte (optional, aber empfohlen: Sprung, Treffer, Beere, Game Over)
- Lighthouse-Check für PWA-Installierbarkeit

---

## Sonstige Hinweise für Claude Code
- MVP-Grafiken: Einfache geometrische Formen oder simple Platzhalter-Sprites reichen für Phase 1-3 völlig aus; echte Dino-Sprites/Pixel-Art können iterativ nachgezogen werden (ggf. später gemeinsam mit dem Sohn gepixelt)
- Code sollte klar kommentiert sein, da nicht der Hauptentwickler des Projekts durchgehend Code-Erfahrung hat (Marian ist technisch versiert, aber kein Entwickler von Beruf)
- Nach jeder Phase: kurzer Test-Checkpoint, damit Fortschritt für Vater & Sohn sichtbar/spielbar bleibt (Motivation!)
