import { insetRect, rectsOverlap } from "./collision";
import {
  BASE_GAME_SPEED,
  BERRY_BONUS_POINTS,
  BOOST_DURATION_SECONDS,
  BOOST_SPEED_BONUS,
  INVINCIBILITY_SECONDS,
  OBSTACLE_SPAWN_INTERVAL_MAX,
  OBSTACLE_SPAWN_INTERVAL_MIN,
  OBSTACLE_SPAWN_MARGIN,
  PICKUP_SPAWN_INTERVAL_MAX,
  PICKUP_SPAWN_INTERVAL_MIN,
  PLAYER_X_RATIO,
  SCORE_PER_SECOND,
  STARTING_LIVES,
} from "./constants";
import { ANKYLOSAURUS, VELOCIRAPTOR } from "./dinoConfigs";
import { getDifficultyLevel, getSpawnIntervalMultiplier, getSpeedMultiplier } from "./difficulty";
import { drawBackground, drawHunter, drawObstacle, drawPickup, drawPlayer } from "./draw";
import {
  createHunterState,
  hasHunterCaughtUp,
  resetHunter,
  updateHunter,
  type HunterState,
} from "./hunter";
import { createObstacleSpawner, getObstacleRect, type Obstacle } from "./obstacles";
import { createPickupSpawner, getPickupRect, type Pickup } from "./pickups";
import { createPlayerState, duck, getPlayerRect, jump, updatePlayer, type PlayerState } from "./player";

const PLAYER_HITBOX_INSET = 0.12;

export type GameStatus = "playing" | "gameOver";

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export interface GameEngineCallbacks {
  /** Ein Leben wurde abgezogen (Hindernis-Treffer oder Jäger hat aufgeholt). */
  onLifeLost?: (livesRemaining: number) => void;
  /** 0 Leben erreicht – Spiel vorbei. */
  onGameOver?: (finalScore: number) => void;
}

/**
 * Bündelt den kompletten Spielzustand (Spieler, Jäger, Hindernisse, Power-ups, Punkte,
 * Leben) und die Logik, um ihn pro Frame zu aktualisieren und zu zeichnen. Bewusst
 * außerhalb von React gehalten, damit die Game-Loop nicht an React-Re-Renders hängt
 * (siehe GameCanvas.tsx).
 */
export class GameEngine {
  player: PlayerState = createPlayerState();
  hunter: HunterState = createHunterState();
  obstacles: Obstacle[] = [];
  pickups: Pickup[] = [];
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

  private obstacleSpawnTimer = randomBetween(OBSTACLE_SPAWN_INTERVAL_MIN, OBSTACLE_SPAWN_INTERVAL_MAX);
  private obstacleSpawner = createObstacleSpawner();
  private pickupSpawnTimer = randomBetween(PICKUP_SPAWN_INTERVAL_MIN, PICKUP_SPAWN_INTERVAL_MAX);
  private pickupSpawner = createPickupSpawner();
  private playerX = 0;
  private callbacks: GameEngineCallbacks;

  constructor(callbacks: GameEngineCallbacks = {}) {
    this.callbacks = callbacks;
  }

  jump() {
    if (this.status !== "playing") return;
    this.player = jump(this.player, ANKYLOSAURUS);
  }

  duck() {
    if (this.status !== "playing") return;
    this.player = duck(this.player, ANKYLOSAURUS);
  }

  /** Setzt das komplette Spiel für einen Neustart zurück. */
  reset() {
    this.player = createPlayerState();
    this.hunter = createHunterState();
    this.obstacles = [];
    this.pickups = [];
    this.elapsed = 0;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.status = "playing";
    this.invincibleTimeRemaining = 0;
    this.boostTimeRemaining = 0;
    this.hasShield = false;
    this.obstacleSpawnTimer = randomBetween(OBSTACLE_SPAWN_INTERVAL_MIN, OBSTACLE_SPAWN_INTERVAL_MAX);
    this.obstacleSpawner = createObstacleSpawner();
    this.pickupSpawnTimer = randomBetween(PICKUP_SPAWN_INTERVAL_MIN, PICKUP_SPAWN_INTERVAL_MAX);
    this.pickupSpawner = createPickupSpawner();
  }

  /** Aktualisiert den kompletten Spielzustand um `dt` Sekunden. Pausiert bei Game Over. */
  update(dt: number, visibleWorldWidth: number) {
    if (this.status !== "playing") return;

    this.elapsed += dt;
    this.score += SCORE_PER_SECOND * dt;
    this.playerX = visibleWorldWidth * PLAYER_X_RATIO;

    if (this.invincibleTimeRemaining > 0) {
      this.invincibleTimeRemaining = Math.max(0, this.invincibleTimeRemaining - dt);
    }
    if (this.boostTimeRemaining > 0) {
      this.boostTimeRemaining = Math.max(0, this.boostTimeRemaining - dt);
    }

    const level = getDifficultyLevel(this.elapsed);
    const speedMultiplier = getSpeedMultiplier(level);
    const gameSpeed = BASE_GAME_SPEED * speedMultiplier;
    const playerSpeedBonus = this.boostTimeRemaining > 0 ? BOOST_SPEED_BONUS : 0;

    this.player = updatePlayer(this.player, dt);
    this.hunter = updateHunter(
      this.hunter,
      ANKYLOSAURUS,
      VELOCIRAPTOR,
      dt,
      speedMultiplier,
      playerSpeedBonus,
    );

    this.obstacles = this.obstacles
      .map((o) => ({ ...o, x: o.x - gameSpeed * dt }))
      .filter((o) => o.x + o.config.width > -OBSTACLE_SPAWN_MARGIN);

    this.pickups = this.pickups
      .map((p) => ({ ...p, x: p.x - gameSpeed * dt }))
      .filter((p) => p.x > -OBSTACLE_SPAWN_MARGIN);

    this.obstacleSpawnTimer -= dt;
    if (this.obstacleSpawnTimer <= 0) {
      this.obstacles.push(this.obstacleSpawner.spawn(visibleWorldWidth + OBSTACLE_SPAWN_MARGIN));
      this.obstacleSpawnTimer =
        randomBetween(OBSTACLE_SPAWN_INTERVAL_MIN, OBSTACLE_SPAWN_INTERVAL_MAX) *
        getSpawnIntervalMultiplier(level);
    }

    this.pickupSpawnTimer -= dt;
    if (this.pickupSpawnTimer <= 0) {
      this.pickups.push(this.pickupSpawner.spawn(visibleWorldWidth + OBSTACLE_SPAWN_MARGIN));
      this.pickupSpawnTimer = randomBetween(PICKUP_SPAWN_INTERVAL_MIN, PICKUP_SPAWN_INTERVAL_MAX);
    }

    this.checkPickupCollision();

    if (this.invincibleTimeRemaining <= 0) {
      this.checkObstacleCollision();
    }

    if (hasHunterCaughtUp(this.hunter)) {
      this.hunter = resetHunter();
      if (this.invincibleTimeRemaining <= 0) {
        this.registerHit();
      }
    }
  }

  /**
   * Zieht ein Leben ab, startet die Invincibility-Frames und meldet ggf. Game Over.
   * Ist ein Schild aktiv, wird stattdessen nur der Schild verbraucht.
   */
  private registerHit() {
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
      const obstacleRect = insetRect(getObstacleRect(obstacle), obstacle.config.hitboxInset);
      if (rectsOverlap(playerRect, obstacleRect)) {
        this.obstacles = this.obstacles.filter((o) => o.id !== obstacle.id);
        this.registerHit();
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
    drawBackground(ctx, visibleWorldWidth, 0);

    const hunterX = this.playerX - this.hunter.gap;
    drawHunter(ctx, hunterX, VELOCIRAPTOR.color);

    for (const obstacle of this.obstacles) {
      drawObstacle(ctx, obstacle);
    }

    for (const pickup of this.pickups) {
      drawPickup(ctx, pickup);
    }

    drawPlayer(ctx, this.playerX, this.player, ANKYLOSAURUS.color, this.invincibleTimeRemaining > 0);
  }
}
