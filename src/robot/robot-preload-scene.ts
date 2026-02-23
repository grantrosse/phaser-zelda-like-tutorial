import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../scenes/scene-keys';
import {
  ROBOT_TEXTURE_KEYS,
  ROBOT_ANIM_KEYS,
  ROBOT_ATLAS_KEYS,
  ROBOT_COLORS,
} from './robot-constants';

export class RobotPreloadScene extends Phaser.Scene {
  /** Track which atlases loaded successfully so we can skip runtime generation */
  #atlasLoaded = { body: false, arm: false, claw: false };

  constructor() {
    super({ key: SCENE_KEYS.ROBOT_PRELOAD_SCENE });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRELOAD — attempt to load sprite atlases from disk
  // ════════════════════════════════════════════════════════════════════════════

  public preload(): void {
    // Register per-file load callbacks BEFORE queueing the files
    this.load.on('filecomplete', (key: string) => {
      if (key === ROBOT_ATLAS_KEYS.BODY) this.#atlasLoaded.body = true;
      if (key === ROBOT_ATLAS_KEYS.ARM) this.#atlasLoaded.arm = true;
      if (key === ROBOT_ATLAS_KEYS.CLAW) this.#atlasLoaded.claw = true;
    });

    // Silence load errors (files may not exist yet)
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`[RobotPreload] Could not load ${file.key} — will use generated texture`);
    });

    this.load.atlas(
      ROBOT_ATLAS_KEYS.BODY,
      'assets/images/robot/robot_body.png',
      'assets/images/robot/robot_body.json',
    );
    this.load.atlas(
      ROBOT_ATLAS_KEYS.ARM,
      'assets/images/robot/robot_arm.png',
      'assets/images/robot/robot_arm.json',
    );
    this.load.atlas(
      ROBOT_ATLAS_KEYS.CLAW,
      'assets/images/robot/robot_claw.png',
      'assets/images/robot/robot_claw.json',
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CREATE — generate fallback textures, set up animations, transition
  // ════════════════════════════════════════════════════════════════════════════

  public create(): void {
    // Always generate runtime textures for robot parts as fallback.
    // If atlases loaded successfully the composited robot will prefer the atlas keys.
    this.#generateRobotTextures();

    // Obstacles and grid never come from atlases — always generated
    this.#generateObstacleTextures();
    this.#generateGridCellTexture();

    // Create Phaser animations
    this.#createAnimations();

    if (this.#atlasLoaded.body) console.log('[RobotPreload] ✓ body atlas loaded');
    if (this.#atlasLoaded.arm) console.log('[RobotPreload] ✓ arm atlas loaded');
    if (this.#atlasLoaded.claw) console.log('[RobotPreload] ✓ claw atlas loaded');

    // Transition to the robot game scene, forwarding scene data
    this.scene.start(SCENE_KEYS.ROBOT_SCENE, this.scene.settings.data);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Robot body textures (idle + 3 movement frames) — runtime generated
  // ════════════════════════════════════════════════════════════════════════════

  #generateRobotTextures(): void {
    this.#generateRobotBody(ROBOT_TEXTURE_KEYS.ROBOT_BODY, 0);
    this.#generateRobotBody(ROBOT_TEXTURE_KEYS.ROBOT_BODY_MOVE_0, 1);
    this.#generateRobotBody(ROBOT_TEXTURE_KEYS.ROBOT_BODY_MOVE_1, 2);
    this.#generateRobotBody(ROBOT_TEXTURE_KEYS.ROBOT_BODY_MOVE_2, 3);
    this.#generateArmTextures();
    this.#generateClawTextures();
  }

  #generateRobotBody(key: string, moveFrame: number): void {
    const w = 44;
    const h = 44;
    const g = this.add.graphics();

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(2, 2, w, h, 6);

    // Body rectangle
    g.fillStyle(ROBOT_COLORS.robot, 1);
    g.fillRoundedRect(0, 0, w, h, 6);

    // Body panel lines
    g.lineStyle(1, ROBOT_COLORS.robotAccent, 0.4);
    g.strokeRoundedRect(3, 3, w - 6, h - 6, 4);

    // Heading indicator triangle (pointing right = 0 radians)
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(w - 4, h / 2, w - 14, h / 2 - 7, w - 14, h / 2 + 7);

    // Center dot
    g.fillStyle(0x000000, 0.5);
    g.fillCircle(w / 2, h / 2, 4);

    // Tread/wheel marks for movement frames
    if (moveFrame > 0) {
      g.lineStyle(1, 0x000000, 0.15 + moveFrame * 0.05);
      const offset = (moveFrame - 1) * 3;
      g.lineBetween(4, 8 + offset, 4, 12 + offset);
      g.lineBetween(4, 20 + offset, 4, 24 + offset);
      g.lineBetween(4, 32 + offset, 4, 36 + offset);
      g.lineBetween(w - 4, 8 + offset, w - 4, 12 + offset);
      g.lineBetween(w - 4, 20 + offset, w - 4, 24 + offset);
      g.lineBetween(w - 4, 32 + offset, w - 4, 36 + offset);
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ── Arm textures at different elevation angles ───────────────────────────

  #generateArmTextures(): void {
    const angles = [0, 45, 90, 135, 180];
    const keys = [
      ROBOT_TEXTURE_KEYS.ROBOT_ARM_0,
      ROBOT_TEXTURE_KEYS.ROBOT_ARM_45,
      ROBOT_TEXTURE_KEYS.ROBOT_ARM_90,
      ROBOT_TEXTURE_KEYS.ROBOT_ARM_135,
      ROBOT_TEXTURE_KEYS.ROBOT_ARM_180,
    ];
    // Also create the default arm key (same as ARM_0)
    this.#drawArm(ROBOT_TEXTURE_KEYS.ROBOT_ARM, 0);
    for (let i = 0; i < angles.length; i++) {
      this.#drawArm(keys[i], angles[i]);
    }
  }

  #drawArm(key: string, elevationAngle: number): void {
    const w = 30;
    const h = 10;
    const g = this.add.graphics();

    const lenScale = 1 - (elevationAngle / 180) * 0.4;
    const thickness = h + (elevationAngle / 180) * 4;
    const armLen = w * lenScale;

    g.fillStyle(ROBOT_COLORS.arm, 1);
    g.fillRoundedRect(0, (h - thickness) / 2, armLen, thickness, 2);

    g.fillStyle(ROBOT_COLORS.armAccent, 1);
    g.fillCircle(3, h / 2, 3);

    if (elevationAngle > 0) {
      const dotY = h / 2 - (elevationAngle / 180) * 3;
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(armLen - 4, dotY, 2);
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ── Claw textures (open and closed) ──────────────────────────────────────

  #generateClawTextures(): void {
    this.#drawClaw(ROBOT_TEXTURE_KEYS.ROBOT_CLAW_OPEN, true);
    this.#drawClaw(ROBOT_TEXTURE_KEYS.ROBOT_CLAW_CLOSED, false);
  }

  #drawClaw(key: string, isOpen: boolean): void {
    const w = 16;
    const h = 16;
    const g = this.add.graphics();
    const cx = w / 2;
    const cy = h / 2;
    const spread = isOpen ? 6 : 2;

    g.lineStyle(2, ROBOT_COLORS.claw, 1);
    g.lineBetween(cx, cy, cx + 4, cy - spread);
    g.lineBetween(cx + 4, cy - spread, cx + 7, cy - spread + 2);
    g.lineBetween(cx, cy, cx + 4, cy + spread);
    g.lineBetween(cx + 4, cy + spread, cx + 7, cy + spread - 2);

    g.fillStyle(ROBOT_COLORS.clawAccent, 1);
    g.fillCircle(cx, cy, 2);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Obstacle textures
  // ════════════════════════════════════════════════════════════════════════════

  #generateObstacleTextures(): void {
    this.#makeRect(ROBOT_TEXTURE_KEYS.BARRIER, 40, 40, ROBOT_COLORS.barrier);
    this.#makeRect(ROBOT_TEXTURE_KEYS.WALL_H, 80, 16, ROBOT_COLORS.wall);
    this.#makeRect(ROBOT_TEXTURE_KEYS.WALL_V, 16, 80, ROBOT_COLORS.wall);
    this.#makeLiftable();
    this.#makeGrabbable();
    this.#makeRect(ROBOT_TEXTURE_KEYS.PUSHABLE, 32, 32, ROBOT_COLORS.pushable, 4);
    this.#makeGoalZone();
    this.#makeColorZone();
    this.#makeRamp();
  }

  #makeRect(key: string, w: number, h: number, color: number, radius = 2): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, radius);
    g.lineStyle(1, 0xffffff, 0.15);
    g.strokeRoundedRect(0, 0, w, h, radius);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  #makeLiftable(): void {
    const w = 30, h = 30;
    const g = this.add.graphics();
    g.fillStyle(ROBOT_COLORS.liftable, 1);
    g.fillRoundedRect(0, 0, w, h, 4);
    g.lineStyle(2, 0x000000, 0.25);
    g.lineBetween(w / 2, 0, w / 2, h);
    g.lineBetween(0, h / 2, w, h / 2);
    g.generateTexture(ROBOT_TEXTURE_KEYS.LIFTABLE, w, h);
    g.destroy();
  }

  #makeGrabbable(): void {
    const size = 24;
    const g = this.add.graphics();
    g.fillStyle(ROBOT_COLORS.grabbable, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(size / 2 - 3, size / 2 - 3, 4);
    g.generateTexture(ROBOT_TEXTURE_KEYS.GRABBABLE, size, size);
    g.destroy();
  }

  #makeGoalZone(): void {
    const size = 50;
    const g = this.add.graphics();
    g.fillStyle(ROBOT_COLORS.goal, 0.35);
    g.fillRect(0, 0, size, size);
    g.fillStyle(ROBOT_COLORS.goal, 0.8);
    for (let i = 0; i < size; i += 8) {
      g.fillRect(i, 0, 4, 2);
      g.fillRect(i, size - 2, 4, 2);
      g.fillRect(0, i, 2, 4);
      g.fillRect(size - 2, i, 2, 4);
    }
    const cs = 4;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        g.fillStyle((r + c) % 2 === 0 ? 0xffffff : 0x000000, 0.5);
        g.fillRect(size / 2 - 6 + c * cs, size / 2 - 6 + r * cs, cs, cs);
      }
    }
    g.generateTexture(ROBOT_TEXTURE_KEYS.GOAL_ZONE, size, size);
    g.destroy();
  }

  #makeColorZone(): void {
    const size = 60;
    const g = this.add.graphics();
    g.fillStyle(ROBOT_COLORS.colorZone, 0.4);
    g.fillRect(0, 0, size, size);
    g.lineStyle(1, ROBOT_COLORS.colorZone, 0.6);
    g.strokeRect(0, 0, size, size);
    g.generateTexture(ROBOT_TEXTURE_KEYS.COLOR_ZONE, size, size);
    g.destroy();
  }

  #makeRamp(): void {
    const w = 40, h = 24;
    const g = this.add.graphics();
    g.fillStyle(ROBOT_COLORS.ramp, 1);
    g.fillTriangle(0, h, w, h, w, 0);
    g.lineStyle(1, 0xffffff, 0.2);
    g.lineBetween(0, h, w, h);
    g.lineBetween(w, h, w, 0);
    g.lineBetween(0, h, w, 0);
    g.generateTexture(ROBOT_TEXTURE_KEYS.RAMP, w, h);
    g.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Grid cell texture
  // ════════════════════════════════════════════════════════════════════════════

  #generateGridCellTexture(): void {
    const cellSize = 100;
    const g = this.add.graphics();
    g.fillStyle(ROBOT_COLORS.gridBg, 1);
    g.fillRect(0, 0, cellSize, cellSize);
    g.lineStyle(1, ROBOT_COLORS.gridLine, 0.5);
    g.lineBetween(cellSize - 1, 0, cellSize - 1, cellSize);
    g.lineBetween(0, cellSize - 1, cellSize, cellSize - 1);
    g.generateTexture(ROBOT_TEXTURE_KEYS.GRID_CELL, cellSize, cellSize);
    g.destroy();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Animations
  // ════════════════════════════════════════════════════════════════════════════

  #createAnimations(): void {
    // Prefer atlas-based animations when the atlas loaded, otherwise use
    // the individual generated textures.
    if (this.#atlasLoaded.body) {
      this.#createAtlasBodyAnims();
    } else {
      this.#createGeneratedBodyAnims();
    }

    // Claw animations (atlas or generated)
    if (this.#atlasLoaded.claw) {
      this.#createAtlasClawAnims();
    } else {
      this.#createGeneratedClawAnims();
    }
  }

  // ── Atlas-based body animations ──────────────────────────────────────────

  #createAtlasBodyAnims(): void {
    if (!this.anims.exists(ROBOT_ANIM_KEYS.BODY_IDLE)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.BODY_IDLE,
        frames: [{ key: ROBOT_ATLAS_KEYS.BODY, frame: 'idle' }],
        frameRate: 1,
        repeat: -1,
      });
    }
    if (!this.anims.exists(ROBOT_ANIM_KEYS.BODY_MOVE)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.BODY_MOVE,
        frames: [
          { key: ROBOT_ATLAS_KEYS.BODY, frame: 'move_0' },
          { key: ROBOT_ATLAS_KEYS.BODY, frame: 'move_1' },
          { key: ROBOT_ATLAS_KEYS.BODY, frame: 'move_2' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ── Generated-texture body animations ────────────────────────────────────

  #createGeneratedBodyAnims(): void {
    if (!this.anims.exists(ROBOT_ANIM_KEYS.BODY_IDLE)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.BODY_IDLE,
        frames: [{ key: ROBOT_TEXTURE_KEYS.ROBOT_BODY }],
        frameRate: 1,
        repeat: -1,
      });
    }
    if (!this.anims.exists(ROBOT_ANIM_KEYS.BODY_MOVE)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.BODY_MOVE,
        frames: [
          { key: ROBOT_TEXTURE_KEYS.ROBOT_BODY_MOVE_0 },
          { key: ROBOT_TEXTURE_KEYS.ROBOT_BODY_MOVE_1 },
          { key: ROBOT_TEXTURE_KEYS.ROBOT_BODY_MOVE_2 },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ── Atlas-based claw animations ──────────────────────────────────────────

  #createAtlasClawAnims(): void {
    if (!this.anims.exists(ROBOT_ANIM_KEYS.CLAW_OPEN)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.CLAW_OPEN,
        frames: [{ key: ROBOT_ATLAS_KEYS.CLAW, frame: 'open' }],
        frameRate: 1,
        repeat: 0,
      });
    }
    if (!this.anims.exists(ROBOT_ANIM_KEYS.CLAW_CLOSE)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.CLAW_CLOSE,
        frames: [{ key: ROBOT_ATLAS_KEYS.CLAW, frame: 'closed' }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }

  // ── Generated-texture claw animations ────────────────────────────────────

  #createGeneratedClawAnims(): void {
    if (!this.anims.exists(ROBOT_ANIM_KEYS.CLAW_OPEN)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.CLAW_OPEN,
        frames: [{ key: ROBOT_TEXTURE_KEYS.ROBOT_CLAW_OPEN }],
        frameRate: 1,
        repeat: 0,
      });
    }
    if (!this.anims.exists(ROBOT_ANIM_KEYS.CLAW_CLOSE)) {
      this.anims.create({
        key: ROBOT_ANIM_KEYS.CLAW_CLOSE,
        frames: [{ key: ROBOT_TEXTURE_KEYS.ROBOT_CLAW_CLOSED }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }
}

// Re-export for backward compatibility
export { ROBOT_TEXTURE_KEYS } from './robot-constants';
