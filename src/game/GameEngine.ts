import { insetRect, rectsOverlap } from "./collision";
import {
  BASE_GAME_SPEED,
  OBSTACLE_SPAWN_INTERVAL_MAX,
  OBSTACLE_SPAWN_INTERVAL_MIN,
  OBSTACLE_SPAWN_MARGIN,
  PLAYER_X_RATIO,
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
import {
  createObstacleSpawner,
  getObstacleRect,
  type Obstacle,
} from "./obstacles";
import { createPlayerState, duck, getPlayerRect, jump, updatePlayer, type PlayerState } from "./player";

const PLAYER_HITBOX_INSET = 0.12;

function randomSpawnInterval(): number {
  return (
    OBSTACLE_SPAWN_INTERVAL_MIN +
    Math.random() * (OBSTACLE_SPAWN_INTERVAL_MAX - OBSTACLE_SPAWN_INTERVAL_MIN)
  );
}

export interface GameEngineCallbacks {
  /** Spieler ist mit einem Hindernis kollidiert (Hitbox-Überlappung). */
  onObstacleHit?: (obstacle: Obstacle) => void;
  /** Der Velociraptor hat den Spieler eingeholt. */
  onHunterCaughtUp?: () => void;
}

/**
 * Bündelt den kompletten Spielzustand (Spieler, Jäger, Hindernisse) und die Logik,
 * um ihn pro Frame zu aktualisieren und zu zeichnen. Bewusst außerhalb von React
 * gehalten, damit die Game-Loop nicht an React-Re-Renders hängt (siehe GameCanvas.tsx).
 */
export class GameEngine {
  player: PlayerState = createPlayerState();
  hunter: HunterState = createHunterState();
  obstacles: Obstacle[] = [];
  elapsed = 0;

  private spawnTimer = randomSpawnInterval();
  private spawner = createObstacleSpawner();
  private playerX = 0;
  private callbacks: GameEngineCallbacks;

  constructor(callbacks: GameEngineCallbacks = {}) {
    this.callbacks = callbacks;
  }

  jump() {
    this.player = jump(this.player, ANKYLOSAURUS);
  }

  duck() {
    this.player = duck(this.player, ANKYLOSAURUS);
  }

  /** Aktualisiert den kompletten Spielzustand um `dt` Sekunden. */
  update(dt: number, visibleWorldWidth: number) {
    this.elapsed += dt;
    this.playerX = visibleWorldWidth * PLAYER_X_RATIO;

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

    this.checkObstacleCollision();

    if (hasHunterCaughtUp(this.hunter)) {
      this.hunter = resetHunter();
      this.callbacks.onHunterCaughtUp?.();
    }
  }

  private checkObstacleCollision() {
    const playerRect = insetRect(getPlayerRect(this.playerX, this.player), PLAYER_HITBOX_INSET);

    for (const obstacle of this.obstacles) {
      const obstacleRect = insetRect(getObstacleRect(obstacle), obstacle.config.hitboxInset);
      if (rectsOverlap(playerRect, obstacleRect)) {
        this.obstacles = this.obstacles.filter((o) => o.id !== obstacle.id);
        this.callbacks.onObstacleHit?.(obstacle);
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

    drawPlayer(ctx, this.playerX, this.player, ANKYLOSAURUS.color, false);
  }
}
