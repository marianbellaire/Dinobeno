import { createCelebration, updateCelebration, type CelebrationState } from "./celebration";
import { insetRect, rectsOverlap } from "./collision";
import {
  BASE_GAME_SPEED,
  BERRY_BONUS_POINTS,
  BOOST_DURATION_SECONDS,
  BOOST_SPEED_BONUS,
  INVINCIBILITY_SECONDS,
  MIN_OBSTACLE_GAP_SECONDS,
  MIN_OBSTACLE_SWITCH_GAP_SECONDS,
  OBSTACLE_SPAWN_INTERVAL_MAX,
  OBSTACLE_SPAWN_INTERVAL_MIN,
  OBSTACLE_SPAWN_MARGIN,
  PICKUP_SPAWN_INTERVAL_MAX,
  PICKUP_SPAWN_INTERVAL_MIN,
  PLAYER_X_RATIO,
  SCORE_PER_SECOND,
  STARTING_LIVES,
} from "./constants";
import { pickRandomHunter } from "./dinoConfigs";
import { drawHunter } from "./draw/hunter";
import { drawPlayer } from "./draw/player";
import { drawCelebrationParticles, drawMeteor, drawVolcano } from "./draw/effects";
import { drawBackground, drawObstacle, drawPickup } from "./draw/world";
import {
  biteAndRetreat,
  createHunterState,
  eatMeteor,
  getHunterMouth,
  hasHunterCaughtUp,
  retreat,
  updateHunter,
  type HunterState,
} from "./hunter";
import {
  getLevelConfig,
  getMeteorInterval,
  getSpawnIntervalMultiplier,
  getSpeedMultiplier,
  LEVEL_BONUS_POINTS,
  LEVEL_CELEBRATION_SECONDS,
  PX_PER_METER,
  type LevelConfig,
} from "./levels";
import { createMeteorSpawner, distanceToTarget, updateMeteor, type Meteor } from "./meteors";
import {
  createObstacleSpawner,
  getObstacleHitbox,
  pickObstacleType,
  type Obstacle,
  type ObstacleTypeConfig,
} from "./obstacles";
import { createPickupSpawner, getPickupRect, type Pickup } from "./pickups";
import {
  createPlayerState,
  duck,
  getPlayerRect,
  jump,
  releaseDuck,
  updatePlayer,
  type PlayerState,
} from "./player";
import { createTailState, updateTail } from "./tail";
import type { DinoConfig } from "./types";

const PLAYER_HITBOX_INSET = 0.12;
const PLAYER_TAIL_SEGMENTS = 6;
const HUNTER_TAIL_SEGMENTS = 7;
/** Ab diesem Abstand zum Maul reißt der Jäger es für den Meteoriten auf. */
const METEOR_JAW_DISTANCE = 120;

export type GameStatus = "playing" | "gameOver";
/** "levelComplete" = Vulkan-Feier zwischen zwei Leveln (keine Hindernisse, kein Schaden). */
export type LevelPhase = "running" | "levelComplete";
export type HitSource = "obstacle" | "hunter";

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export interface GameEngineCallbacks {
  /** Ein Treffer ist passiert (Hindernis oder Jäger-Biss) – auch wenn ein Schild ihn
   *  abgefangen hat. Für Sound-Feedback: Jäger-Bisse klingen anders als Hindernisse. */
  onHit?: (source: HitSource) => void;
  /** Ein Leben wurde abgezogen (Hindernis-Treffer oder Jäger hat aufgeholt). */
  onLifeLost?: (livesRemaining: number) => void;
  /** 0 Leben erreicht – Spiel vorbei. */
  onGameOver?: (finalScore: number) => void;
  /** Eine Beere wurde eingesammelt (Bonuspunkte). */
  onBerryCollected?: () => void;
  /** Der Jäger hat einen Meteoriten verschlungen. */
  onMeteorEaten?: () => void;
  /** Levelstrecke geschafft – Vulkan-Feier beginnt. `lives` inkl. Bonus-Herz. */
  onLevelComplete?: (level: number, lives: number) => void;
  /** Ein neues Level beginnt (nach der Feier bzw. beim Spielstart). */
  onLevelStart?: (level: number) => void;
}

/**
 * Bündelt den kompletten Spielzustand (Spieler, Jäger, Hindernisse, Power-ups,
 * Meteoriten, Level, Punkte, Leben) und die Logik, um ihn pro Frame zu aktualisieren
 * und zu zeichnen. Bewusst außerhalb von React gehalten, damit die Game-Loop nicht an
 * React-Re-Renders hängt (siehe GameCanvas.tsx).
 */
export class GameEngine {
  /** Vom Auswahlbildschirm gewählter Spieler-Dino (siehe DinoSelectScreen.tsx). */
  playerDino: DinoConfig;
  /** Zufällig aus HUNTER_DINOS gewählt – bei jedem reset() neu ausgewürfelt. */
  hunterDino: DinoConfig = pickRandomHunter();

  player: PlayerState = createPlayerState();
  hunter: HunterState = createHunterState();
  obstacles: Obstacle[] = [];
  pickups: Pickup[] = [];
  meteors: Meteor[] = [];
  elapsed = 0;
  score = 0;
  lives = STARTING_LIVES;
  status: GameStatus = "playing";
  /** > 0 während der Unverwundbarkeit nach einem Treffer (Invincibility-Frames). */
  invincibleTimeRemaining = 0;
  /** > 0 während der Tempo-Boost aktiv ist (siehe ⚡-Powerup). */
  boostTimeRemaining = 0;
  /** true, solange ein 🛡️-Schild einen Treffer abfangen kann. */
  hasShield = false;

  level = 1;
  levelConfig: LevelConfig = getLevelConfig(1);
  /** In diesem Level zurückgelegte Meter. */
  levelDistance = 0;
  phase: LevelPhase = "running";
  celebration: CelebrationState | null = null;

  /** Laufende Animationszeit (Beine, Schwanz, Flügelschlag …). */
  private animTime = 0;
  /** Insgesamt gescrollte Welt-Pixel (für Boden-Details/Parallaxe). */
  private scroll = 0;
  private playerTail = createTailState(PLAYER_TAIL_SEGMENTS, -0.25);
  private hunterTail = createTailState(HUNTER_TAIL_SEGMENTS, -0.15);

  private obstacleSpawnTimer = randomBetween(OBSTACLE_SPAWN_INTERVAL_MIN, OBSTACLE_SPAWN_INTERVAL_MAX);
  private obstacleSpawner = createObstacleSpawner();
  private nextObstacle: ObstacleTypeConfig = pickObstacleType(this.levelConfig.obstacleWeights);
  private pickupSpawnTimer = randomBetween(PICKUP_SPAWN_INTERVAL_MIN, PICKUP_SPAWN_INTERVAL_MAX);
  private pickupSpawner = createPickupSpawner();
  private meteorSpawnTimer = this.levelConfig.meteorIntervalStart;
  private meteorSpawner = createMeteorSpawner();
  private playerX = 0;
  private callbacks: GameEngineCallbacks;

  constructor(playerDino: DinoConfig, callbacks: GameEngineCallbacks = {}) {
    this.playerDino = playerDino;
    this.callbacks = callbacks;
  }

  /** Anteil der Levelstrecke 0 … 1 (für Fortschrittsbalken und Schwierigkeit im Level). */
  get levelProgress(): number {
    return Math.min(1, this.levelDistance / this.levelConfig.distance);
  }

  jump() {
    if (this.status !== "playing") return;
    this.player = jump(this.player, this.playerDino);
  }

  /** `held` = Taste/Knopf wird gehalten (Ducken bis zum Loslassen), sonst Swipe. */
  duck(held: boolean) {
    if (this.status !== "playing") return;
    this.player = duck(this.player, this.playerDino, held);
  }

  releaseDuck() {
    this.player = releaseDuck(this.player);
  }

  /** Setzt das komplette Spiel für einen Neustart zurück (Spieler-Dino bleibt gleich). */
  reset() {
    this.hunterDino = pickRandomHunter(); // neue Zufalls-Bedrohung pro Durchlauf
    this.player = createPlayerState();
    this.obstacles = [];
    this.pickups = [];
    this.elapsed = 0;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.status = "playing";
    this.invincibleTimeRemaining = 0;
    this.boostTimeRemaining = 0;
    this.hasShield = false;
    this.obstacleSpawner = createObstacleSpawner();
    this.pickupSpawnTimer = randomBetween(PICKUP_SPAWN_INTERVAL_MIN, PICKUP_SPAWN_INTERVAL_MAX);
    this.pickupSpawner = createPickupSpawner();
    this.meteorSpawner = createMeteorSpawner();
    this.startLevel(1);
  }

  /** Beginnt ein Level: Jäger wieder klein und auf Abstand, Spawns neu getaktet. */
  private startLevel(level: number) {
    this.level = level;
    this.levelConfig = getLevelConfig(level);
    this.levelDistance = 0;
    this.phase = "running";
    this.celebration = null;
    this.hunter = createHunterState();
    this.meteors = [];
    this.obstacleSpawnTimer = randomBetween(OBSTACLE_SPAWN_INTERVAL_MIN, OBSTACLE_SPAWN_INTERVAL_MAX);
    this.nextObstacle = pickObstacleType(this.levelConfig.obstacleWeights);
    this.meteorSpawnTimer = this.levelConfig.meteorIntervalStart;
    this.callbacks.onLevelStart?.(level);
  }

  /** Strecke geschafft: Vulkan-Feier, Jäger fällt zurück, Bonus-Herz + Punkte. */
  private completeLevel(visibleWorldWidth: number) {
    this.phase = "levelComplete";
    this.celebration = createCelebration(visibleWorldWidth * 0.64);
    this.hunter = retreat(this.hunter);
    this.meteors = [];
    this.lives = Math.min(STARTING_LIVES, this.lives + 1);
    this.score += LEVEL_BONUS_POINTS * this.level;
    this.callbacks.onLevelComplete?.(this.level, this.lives);
  }

  /** Aktualisiert den kompletten Spielzustand um `dt` Sekunden. Pausiert bei Game Over. */
  update(dt: number, visibleWorldWidth: number) {
    if (this.status !== "playing") return;

    const celebrating = this.phase === "levelComplete";
    this.elapsed += dt;
    this.animTime += dt;
    this.playerX = visibleWorldWidth * PLAYER_X_RATIO;

    if (this.invincibleTimeRemaining > 0) {
      this.invincibleTimeRemaining = Math.max(0, this.invincibleTimeRemaining - dt);
    }
    if (this.boostTimeRemaining > 0) {
      this.boostTimeRemaining = Math.max(0, this.boostTimeRemaining - dt);
    }

    const progress = this.levelProgress;
    const speedMultiplier = getSpeedMultiplier(this.levelConfig, progress);
    const gameSpeed = BASE_GAME_SPEED * speedMultiplier;
    const playerSpeedBonus = this.boostTimeRemaining > 0 ? BOOST_SPEED_BONUS : 0;
    this.scroll += gameSpeed * dt;

    if (!celebrating) {
      this.score += SCORE_PER_SECOND * dt;
      this.levelDistance += (gameSpeed * dt) / PX_PER_METER;
    }

    // Während der Feier hüpft der Dino vor Freude.
    if (celebrating && !this.player.isJumping) {
      this.player = jump(this.player, this.playerDino, 0.55);
    }
    this.player = updatePlayer(this.player, dt);

    const hunterX = this.playerX - this.hunter.gap;
    const mouth = getHunterMouth(hunterX, this.hunter);
    this.hunter = updateHunter(this.hunter, this.playerDino, this.hunterDino, dt, {
      speedMultiplier,
      playerSpeedBonus,
      mealIncoming: this.meteors.some((m) => distanceToTarget(m, mouth) < METEOR_JAW_DISTANCE),
    });

    this.updateTails(dt);

    this.obstacles = this.obstacles
      .map((o) => ({ ...o, x: o.x - gameSpeed * dt }))
      .filter((o) => o.x + o.config.width > -OBSTACLE_SPAWN_MARGIN);

    this.pickups = this.pickups
      .map((p) => ({ ...p, x: p.x - gameSpeed * dt }))
      .filter((p) => p.x > -OBSTACLE_SPAWN_MARGIN);

    if (!celebrating) {
      this.spawnObstacles(dt, visibleWorldWidth, progress);
      this.spawnPickups(dt, visibleWorldWidth);
      this.spawnMeteors(dt, progress);
    }
    this.updateMeteors(dt);

    this.checkPickupCollision();

    if (celebrating) {
      this.celebration = this.celebration && updateCelebration(this.celebration, dt);
      if (!this.celebration || this.celebration.time >= LEVEL_CELEBRATION_SECONDS) {
        this.startLevel(this.level + 1);
      }
      return; // keine Treffer während der Feier
    }

    if (this.invincibleTimeRemaining <= 0) {
      this.checkObstacleCollision();
    }

    if (hasHunterCaughtUp(this.hunter)) {
      this.hunter = biteAndRetreat(this.hunter);
      if (this.invincibleTimeRemaining <= 0) {
        this.registerHit("hunter");
      }
    }

    if (this.status === "playing" && this.levelDistance >= this.levelConfig.distance) {
      this.completeLevel(visibleWorldWidth);
    }
  }

  private updateTails(dt: number) {
    const p = this.player;
    this.playerTail = updateTail(this.playerTail, dt, {
      baseAngle: p.isDucking ? 0.05 : -0.25,
      time: this.animTime,
      wobble: p.isJumping ? 0.05 : 0.14,
      frequency: 11,
      bodyVelocityY: p.isJumping ? p.velocityY : 0,
    });
    this.hunterTail = updateTail(this.hunterTail, dt, {
      baseAngle: -0.15,
      time: this.animTime,
      wobble: 0.18,
      frequency: 14,
      bodyVelocityY: 0,
    });
  }

  private spawnObstacles(dt: number, visibleWorldWidth: number, progress: number) {
    this.obstacleSpawnTimer -= dt;
    if (this.obstacleSpawnTimer > 0) return;

    const current = this.nextObstacle;
    this.obstacles.push(this.obstacleSpawner.spawn(visibleWorldWidth + OBSTACLE_SPAWN_MARGIN, current));

    // Nächstes Hindernis schon jetzt auswürfeln, damit der Abstand fair gewählt werden
    // kann: Ein Wechsel Springen ↔ Ducken braucht etwas mehr Luft.
    const next = pickObstacleType(this.levelConfig.obstacleWeights);
    const minGap = next.kind === current.kind ? MIN_OBSTACLE_GAP_SECONDS : MIN_OBSTACLE_SWITCH_GAP_SECONDS;
    this.obstacleSpawnTimer = Math.max(
      minGap,
      randomBetween(OBSTACLE_SPAWN_INTERVAL_MIN, OBSTACLE_SPAWN_INTERVAL_MAX) *
        getSpawnIntervalMultiplier(this.levelConfig, progress),
    );
    this.nextObstacle = next;
  }

  private spawnPickups(dt: number, visibleWorldWidth: number) {
    this.pickupSpawnTimer -= dt;
    if (this.pickupSpawnTimer > 0) return;
    this.pickups.push(this.pickupSpawner.spawn(visibleWorldWidth + OBSTACLE_SPAWN_MARGIN));
    this.pickupSpawnTimer = randomBetween(PICKUP_SPAWN_INTERVAL_MIN, PICKUP_SPAWN_INTERVAL_MAX);
  }

  private spawnMeteors(dt: number, progress: number) {
    this.meteorSpawnTimer = Math.max(0, this.meteorSpawnTimer - dt);
    if (this.meteorSpawnTimer > 0 || this.hunter.retreating) return;

    const mouth = getHunterMouth(this.playerX - this.hunter.gap, this.hunter);
    if (mouth.x < 20) return; // Jäger noch nicht im Bild – warten, bis man das Fressen sieht

    this.meteors.push(this.meteorSpawner.spawn(mouth, this.playerX));
    this.meteorSpawnTimer = getMeteorInterval(this.levelConfig, progress) * randomBetween(0.7, 1.3);
  }

  /** Meteoriten steuern aufs Maul zu; Ankunft = verschlungen, Jäger wächst. */
  private updateMeteors(dt: number) {
    const mouth = getHunterMouth(this.playerX - this.hunter.gap, this.hunter);
    const remaining: Meteor[] = [];
    for (const meteor of this.meteors) {
      const result = updateMeteor(meteor, mouth, dt);
      if (result.eaten) {
        this.hunter = eatMeteor(this.hunter);
        this.callbacks.onMeteorEaten?.();
      } else {
        remaining.push(result.meteor);
      }
    }
    this.meteors = remaining;
  }

  /**
   * Zieht ein Leben ab, startet die Invincibility-Frames und meldet ggf. Game Over.
   * Ist ein Schild aktiv, wird stattdessen nur der Schild verbraucht.
   */
  private registerHit(source: HitSource) {
    this.callbacks.onHit?.(source);

    if (this.hasShield) {
      this.hasShield = false;
      this.invincibleTimeRemaining = INVINCIBILITY_SECONDS;
      return;
    }

    this.lives -= 1;
    this.invincibleTimeRemaining = INVINCIBILITY_SECONDS;

    if (this.lives <= 0) {
      this.lives = 0;
      this.status = "gameOver";
      this.callbacks.onGameOver?.(Math.floor(this.score));
    } else {
      this.callbacks.onLifeLost?.(this.lives);
    }
  }

  private checkObstacleCollision() {
    const playerRect = insetRect(getPlayerRect(this.playerX, this.player), PLAYER_HITBOX_INSET);

    for (const obstacle of this.obstacles) {
      if (rectsOverlap(playerRect, getObstacleHitbox(obstacle))) {
        this.obstacles = this.obstacles.filter((o) => o.id !== obstacle.id);
        this.registerHit("obstacle");
        break; // ein Treffer pro Frame reicht
      }
    }
  }

  private checkPickupCollision() {
    const playerRect = getPlayerRect(this.playerX, this.player); // Pickups: volle Sprite-Größe reicht, kein Fairness-Inset nötig

    for (const pickup of this.pickups) {
      if (rectsOverlap(playerRect, getPickupRect(pickup))) {
        this.pickups = this.pickups.filter((p) => p.id !== pickup.id);
        this.collectPickup(pickup);
        break; // ein Pickup pro Frame reicht
      }
    }
  }

  private collectPickup(pickup: Pickup) {
    switch (pickup.config.type) {
      case "berry":
        this.score += BERRY_BONUS_POINTS;
        this.callbacks.onBerryCollected?.();
        break;
      case "boost":
        this.boostTimeRemaining = BOOST_DURATION_SECONDS;
        break;
      case "shield":
        this.hasShield = true;
        break;
    }
  }

  /** Zeichnet den aktuellen Zustand. `update` muss vorher für diesen Frame gelaufen sein. */
  draw(ctx: CanvasRenderingContext2D, visibleWorldWidth: number) {
    const t = this.animTime;
    drawBackground(ctx, visibleWorldWidth, this.scroll, this.celebration);
    if (this.celebration) drawVolcano(ctx, this.celebration);

    for (const obstacle of this.obstacles) {
      drawObstacle(ctx, obstacle, t);
    }

    for (const pickup of this.pickups) {
      drawPickup(ctx, pickup, t);
    }

    drawHunter(ctx, this.playerX - this.hunter.gap, this.hunterDino, this.hunter, this.hunterTail, t);

    for (const meteor of this.meteors) {
      drawMeteor(ctx, meteor, t);
    }

    drawPlayer(ctx, this.playerX, this.player, this.playerDino, {
      invincible: this.invincibleTimeRemaining > 0,
      shield: this.hasShield,
      tail: this.playerTail,
      time: t,
    });

    if (this.celebration) drawCelebrationParticles(ctx, this.celebration);
  }
}
