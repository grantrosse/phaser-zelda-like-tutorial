import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../scenes/scene-keys';
import { RobotGameObject } from './robot-game-object';
import { Barrier } from './objects/barrier';
import { PushableBlock } from './objects/pushable-block';
import { LiftableObject } from './objects/liftable-object';
import { GrabbableObject } from './objects/grabbable-object';
import { GoalZone } from './objects/goal-zone';
import { ColorZone } from './objects/color-zone';
import {
  ROBOT_EVENT_BUS,
  ROBOT_EVENTS,
  RobotSceneData,
  ObstacleConfig,
  CommandPrimitive,
} from './robot-events';
import { ROBOT_TEXTURE_KEYS } from './robot-constants';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_WORLD_SIZE = 400; // 4m * 100px/m
const GRID_CELL_SIZE = 100; // 1m = 100px
const INTERACT_DIST = 50;

export class RobotScene extends Phaser.Scene {
  private _robot!: RobotGameObject;
  private _worldSize = DEFAULT_WORLD_SIZE;

  // Physics groups
  private _barrierGroup!: Phaser.Physics.Arcade.StaticGroup;
  private _pushableGroup!: Phaser.Physics.Arcade.Group;
  private _liftableGroup!: Phaser.Physics.Arcade.StaticGroup;
  private _grabbableGroup!: Phaser.Physics.Arcade.StaticGroup;
  private _goalGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Color zones (not in physics, just tracked for sensor)
  private _colorZones: ColorZone[] = [];

  // All obstacles for sensor scanning
  private _allObstacleGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Grid graphics
  private _gridGraphics!: Phaser.GameObjects.Graphics;

  // Scene data
  private _sceneData: RobotSceneData | null = null;

  constructor() {
    super({ key: SCENE_KEYS.ROBOT_SCENE });
  }

  public init(data: RobotSceneData): void {
    this._sceneData = data || {
      commands: [],
      obstacles: [],
      robotConfig: { chassisKey: 'rover', color: '#4fc3f7' },
    };

    if (this._sceneData.worldSize) {
      this._worldSize = this._sceneData.worldSize;
    }
  }

  public create(): void {
    const data = this._sceneData!;

    // Configure world bounds
    this.physics.world.setBounds(0, 0, this._worldSize, this._worldSize);

    // Draw grid background
    this.#drawGrid();

    // Create physics groups
    this._barrierGroup = this.physics.add.staticGroup();
    this._pushableGroup = this.physics.add.group();
    this._liftableGroup = this.physics.add.staticGroup();
    this._grabbableGroup = this.physics.add.staticGroup();
    this._goalGroup = this.physics.add.staticGroup();
    this._allObstacleGroup = this.physics.add.staticGroup();

    // Place obstacles
    this.#placeObstacles(data.obstacles || []);

    // Create robot at center of world
    const startX = this._worldSize / 2;
    const startY = this._worldSize - 60;
    this._robot = new RobotGameObject(
      this,
      startX,
      startY,
      data.robotConfig || { chassisKey: 'rover', color: '#4fc3f7' },
    );
    this._robot.setDepth(5);

    // Wire sensor to obstacle groups
    this._robot.sensor.setObstacles(this._allObstacleGroup);
    this._robot.sensor.setColorZones(this._colorZones);

    // Register physics colliders
    this.#registerColliders();

    // Load commands
    if (data.commands && data.commands.length > 0) {
      this._robot.loadCommands(data.commands);
    }

    // Launch UI scene in parallel
    this.scene.launch(SCENE_KEYS.ROBOT_UI_SCENE);

    // Listen for control events
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.RESET, this.#onReset, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.COMMANDS_LOADED, this.#onCommandsLoaded, this);

    // Set up camera
    this.cameras.main.setBounds(0, 0, this._worldSize, this._worldSize);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(this._worldSize / 2, this._worldSize / 2);
  }

  public update(time: number, delta: number): void {
    if (this._robot) {
      this._robot.update(time, delta);
    }

    // Update pushable blocks
    const pushables = this._pushableGroup.getChildren() as PushableBlock[];
    for (const p of pushables) {
      p.update();
    }

    // Check interactions (pickup/grab) when robot is near objects
    this.#checkInteractions();
  }

  // ── Grid drawing ──────────────────────────────────────────────────────────

  #drawGrid(): void {
    this._gridGraphics = this.add.graphics();
    this._gridGraphics.setDepth(-5);

    // Background fill
    this._gridGraphics.fillStyle(0x0a1628, 1);
    this._gridGraphics.fillRect(0, 0, this._worldSize, this._worldSize);

    // Grid lines
    this._gridGraphics.lineStyle(1, 0x1a2a3a, 0.5);
    const cells = this._worldSize / GRID_CELL_SIZE;
    for (let i = 0; i <= cells; i++) {
      const pos = i * GRID_CELL_SIZE;
      // Vertical lines
      this._gridGraphics.lineBetween(pos, 0, pos, this._worldSize);
      // Horizontal lines
      this._gridGraphics.lineBetween(0, pos, this._worldSize, pos);
    }

    // World border
    this._gridGraphics.lineStyle(2, 0x2a4a6a, 0.8);
    this._gridGraphics.strokeRect(0, 0, this._worldSize, this._worldSize);

    // Meter labels
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        this.add
          .text(c * GRID_CELL_SIZE + 4, r * GRID_CELL_SIZE + 4, `${c},${r}`, {
            fontSize: '8px',
            color: '#1a2a3a',
          })
          .setDepth(-4);
      }
    }
  }

  // ── Obstacle placement ────────────────────────────────────────────────────

  #placeObstacles(obstacles: ObstacleConfig[]): void {
    for (const obs of obstacles) {
      switch (obs.type) {
        case 'barrier':
        case 'wall_h':
        case 'wall_v': {
          const b = new Barrier(this, obs.x, obs.y, obs.type);
          this._barrierGroup.add(b);
          this._allObstacleGroup.add(b);
          break;
        }
        case 'pushable': {
          const p = new PushableBlock(this, obs.x, obs.y);
          this._pushableGroup.add(p);
          // Also add a static representation for sensor scanning
          break;
        }
        case 'liftable': {
          const l = new LiftableObject(this, obs.x, obs.y);
          this._liftableGroup.add(l);
          this._allObstacleGroup.add(l);
          break;
        }
        case 'grabbable': {
          const g = new GrabbableObject(this, obs.x, obs.y, obs.color);
          this._grabbableGroup.add(g);
          this._allObstacleGroup.add(g);
          break;
        }
        case 'goal': {
          const goal = new GoalZone(this, obs.x, obs.y);
          this._goalGroup.add(goal);
          break;
        }
        case 'color_zone': {
          const cz = new ColorZone(this, obs.x, obs.y, obs.color || '#42a5f5', obs.width, obs.height);
          this._colorZones.push(cz);
          break;
        }
        case 'ramp': {
          // Treat ramps as barriers for now (blocks unless arm is down)
          const ramp = new Barrier(this, obs.x, obs.y, 'barrier');
          ramp.setTexture(ROBOT_TEXTURE_KEYS.RAMP);
          ramp.setData('obstacleType', 'ramp');
          ramp.setData('requires', { arm: true, armAngleMax: 20 });
          this._barrierGroup.add(ramp);
          this._allObstacleGroup.add(ramp);
          break;
        }
      }
    }
  }

  // ── Physics colliders ─────────────────────────────────────────────────────

  #registerColliders(): void {
    // Robot vs barriers (solid collision)
    this.physics.add.collider(this._robot, this._barrierGroup, () => {
      ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.COLLISION, 'barrier');
    });

    // Robot vs pushable blocks (robot pushes them)
    this.physics.add.collider(this._robot, this._pushableGroup);

    // Robot vs liftable objects (solid until picked up)
    this.physics.add.collider(this._robot, this._liftableGroup);

    // Robot vs grabbable objects (solid until grabbed)
    this.physics.add.collider(this._robot, this._grabbableGroup);

    // Robot vs goal zones (overlap, not collision)
    this.physics.add.overlap(this._robot, this._goalGroup, (_robot, goal) => {
      (goal as GoalZone).onRobotOverlap();
    });

    // Pushable vs barriers
    this.physics.add.collider(this._pushableGroup, this._barrierGroup);

    // Pushable vs pushable
    this.physics.add.collider(this._pushableGroup, this._pushableGroup);
  }

  // ── Interaction checking ──────────────────────────────────────────────────

  #checkInteractions(): void {
    if (!this._robot || this._robot.commandQueue.isPaused) return;

    const cmd = this._robot.commandQueue.currentCommand;
    if (!cmd) return;

    const rx = this._robot.x;
    const ry = this._robot.y;
    const heading = this._robot.heading;

    // Check if robot is closing claw near a grabbable object
    if (cmd.intent === 'claw_close' && !this._robot.carriedObject) {
      const grabbables = this._grabbableGroup.getChildren() as GrabbableObject[];
      for (const g of grabbables) {
        if (!g.active || g.isGrabbed) continue;
        const dist = Phaser.Math.Distance.Between(rx, ry, g.x, g.y);
        if (dist < INTERACT_DIST) {
          g.grab();
          this._robot.commandQueue.pickUp(g);
          break;
        }
      }
    }

    // Check if robot is lifting arm near a liftable object
    if (cmd.intent === 'arm_up' && !this._robot.carriedObject && this._robot.armAngle >= 45) {
      const liftables = this._liftableGroup.getChildren() as LiftableObject[];
      for (const l of liftables) {
        if (!l.active || l.isLifted) continue;
        const dist = Phaser.Math.Distance.Between(rx, ry, l.x, l.y);
        if (dist < INTERACT_DIST) {
          l.lift();
          this._robot.commandQueue.pickUp(l);
          break;
        }
      }
    }

    // Check if claw opening should drop carried object
    if (cmd.intent === 'claw_open' && this._robot.carriedObject) {
      const obj = this._robot.carriedObject;
      const dropX = rx + Math.cos(heading) * 30;
      const dropY = ry + Math.sin(heading) * 30;

      if (obj instanceof GrabbableObject) {
        obj.release(dropX, dropY);
      } else if (obj instanceof LiftableObject) {
        obj.drop(dropX, dropY);
      }
    }

    // Check if arm going down should drop carried liftable
    if (cmd.intent === 'arm_down' && this._robot.carriedObject && this._robot.armAngle < 10) {
      const obj = this._robot.carriedObject;
      const dropX = rx + Math.cos(heading) * 30;
      const dropY = ry + Math.sin(heading) * 30;

      if (obj instanceof LiftableObject) {
        obj.drop(dropX, dropY);
        this._robot.commandQueue.drop();
      }
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  #onReset = (): void => {
    // Reset robot
    this._robot.resetRobot();

    // Reset all obstacles
    const liftables = this._liftableGroup.getChildren() as LiftableObject[];
    for (const l of liftables) l.resetPosition();

    const grabbables = this._grabbableGroup.getChildren() as GrabbableObject[];
    for (const g of grabbables) g.resetPosition();

    const goals = this._goalGroup.getChildren() as GoalZone[];
    for (const g of goals) g.resetGoal();

    // Reset pushable positions would require storing original positions
  };

  #onCommandsLoaded = (): void => {
    // Reset robot position and start executing
    this._robot.resetRobot();
    if (this._sceneData?.commands) {
      this._robot.loadCommands(this._sceneData.commands);
    }
  };

  // ── Public API for PhaserGame.jsx ─────────────────────────────────────────

  public updateCommands(commands: CommandPrimitive[]): void {
    if (this._sceneData) {
      this._sceneData.commands = commands;
    }
    this._robot.resetRobot();
    this._robot.loadCommands(commands);
  }

  public updateObstacles(obstacles: ObstacleConfig[]): void {
    // Clear existing obstacles
    this._barrierGroup.clear(true, true);
    this._pushableGroup.clear(true, true);
    this._liftableGroup.clear(true, true);
    this._grabbableGroup.clear(true, true);
    this._goalGroup.clear(true, true);
    this._allObstacleGroup.clear(true, true);
    for (const cz of this._colorZones) cz.destroy();
    this._colorZones = [];

    // Place new obstacles
    this.#placeObstacles(obstacles);

    // Re-register colliders (Phaser handles this -- colliders still reference the groups)
    this._robot.sensor.setColorZones(this._colorZones);
  }

  public shutdown(): void {
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.RESET, this.#onReset, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.COMMANDS_LOADED, this.#onCommandsLoaded, this);
    if (this._robot) {
      this._robot.destroy();
    }
  }
}
