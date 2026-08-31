import { insetRect, rectsOverlap } from "./collision";
import {
  BASE_GAME_SPEED,
  INVINCIBILITY_SECONDS,
  OBSTACLE_SPAWN_INTERVAL_MAX,
  OBSTACLE_SPAWN_INTERVAL_MIN,
  OBSTACLE_SPAWN_MARGIN,
  PLAYER_X_RATIO,
  SCORE_PER_SECOND,
  STARTING_LIVES,
} from "./constants";
import { ANKYLOSAURUS, VELOCIRAPTOR } from "./dinoConfigs";
import { getDifficultyLevel, getSpawnIntervalMultiplier, getSpeedMultiplier } from "./difficulty";
import { drawBackground, drawHunter, drawObstacle, drawPlayer } from "./draw";
import {
  createHunterState,
  hasHunterCaughtUp,
  resetHunter,
  updateHunter,
  type HunterState,
} from "./hunter";
import { createObstacleSpawner, getObstacleRect, type Obstacle } from "./obstacles";
import { createPlayerState, duck, getPlayerRect, jump, updatePlayer, type PlayerState } from "./player";

const PLAYER_HITBOX_INSET = 0.12;

export type GameStatus = "playing" | "gameOver";

function randomSpawnInterval(): number {
  return (
    OBSTACLE_SPAWN_INTERVAL_MIN +
    Math.random() * (OBSTACLE_SPAWN_INTERVAL_MAX - OBSTACLE_SPAWN_INTERVAL_MIN)
  );
}

export interface GameEngineCallbacks {
  /** Ein Leben wurde abgezogen (Hindernis-Treffer oder Jäger hat aufgeholt). */
  onLifeLost?: (livesRemaining: number) => void;
  /** 0 Leben erreicht – Spiel vorbei. */
  onGameOver?: (finalScore: number) => void;
}

/**
 * Bündelt den kompletten Spielzustand (Spieler, Jäger, Hindernisse, Punkte, Leben)
 * und die Logik, um ihn pro Frame zu aktualisieren und zu zeichnen. Bewusst außerhalb
 * von React gehalten, damit die Game-Loop nicht an React-Re-Renders hängt (siehe
 * GameCanvas.tsx).
 */
export class GameEngine {
  player: PlayerState = createPlayerState();
  hunter: HunterState = createHunterState();
  obstacles: Obstacle[] = [];
  elapsed = 0;
  score = 0;
  lives = STARTING_LIVES;
  status: GameStatus = "playing";
  /** > 0 während der Unverwundbarkeit nach einem Treffer (Invincibility-Frames). */
  invincibleTimeRemaining = 0;

  private spawnTimer = randomSpawnInterval();
  private spawner = createObstacleSpawner();
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
    this.elapsed = 0;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.status = "playing";
    this.invincibleTimeRemaining = 0;
    this.spawnTimer = randomSpawnInterval();
    this.spawner = createObstacleSpawner();
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

    const level = getDifficultyLevel(this.elapsed);
    const speedMultiplier = getSpeedMultiplier(level);
    const gameSpeed = BASE_GAME_SPEED * speedMultiplier;

    this.player = updatePlayer(this.player, dt);
    this.hunter = updateHunter(this.hunter, ANKYLOSAURUS, VELOCIRAPTOR, dt, speedMultiplier);

    this.obstacles = this.obstacles
      .map((o) => ({ ...o, x: o.x - gameSpeed * dt }))
      .filter((o) => o.x + o.config.width > -OBSTACLE_SPAWN_MARGIN);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.obstacles.push(this.spawner.spawn(visibleWorldWidth + OBSTACLE_SPAWN_MARGIN));
      this.spawnTimer = randomSpawnInterval() * getSpawnIntervalMultiplier(level);
    }

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

  /** Zieht ein Leben ab, startet die Invincibility-Frames und meldet ggf. Game Over. */
  private registerHit() {
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

  /** Zeichnet den aktuellen Zustand. `update` muss vorher für diesen Frame gelaufen sein. */
  draw(ctx: CanvasRenderingContext2D, visibleWorldWidth: number) {
    drawBackground(ctx, visibleWorldWidth, 0);

    const hunterX = this.playerX - this.hunter.gap;
    drawHunter(ctx, hunterX, VELOCIRAPTOR.color);

    for (const obstacle of this.obstacles) {
      drawObstacle(ctx, obstacle);
    }

    drawPlayer(ctx, this.playerX, this.player, ANKYLOSAURUS.color, this.invincibleTimeRemaining > 0);
  }
}
