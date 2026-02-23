import * as Phaser from 'phaser';
import { StateMachine } from '../components/state-machine/state-machine';
import { CommandQueueComponent } from './command-queue-component';
import { RobotSensorComponent } from './robot-sensor-component';
import {
  ROBOT_TEXTURE_KEYS,
  ROBOT_ANIM_KEYS,
  ROBOT_ATLAS_KEYS,
} from './robot-constants';
import { CommandPrimitive, RobotConfig } from './robot-events';

// ─── Robot state names ──────────────────────────────────────────────────────

export const ROBOT_STATES = {
  IDLE: 'ROBOT_IDLE',
  MOVING: 'ROBOT_MOVING',
  TURNING: 'ROBOT_TURNING',
  ARM_ACTION: 'ROBOT_ARM_ACTION',
  CLAW_ACTION: 'ROBOT_CLAW_ACTION',
  SENSING: 'ROBOT_SENSING',
} as const;

// ─── Robot Game Object ──────────────────────────────────────────────────────

export class RobotGameObject extends Phaser.Physics.Arcade.Sprite {
  private _commandQueue: CommandQueueComponent;
  private _sensor: RobotSensorComponent;
  private _stateMachine: StateMachine;
  private _startX: number;
  private _startY: number;
  private _robotConfig: RobotConfig;

  // ── Composited child sprites ─────────────────────────────────────────────
  /** Body sprite — used when atlas is available, otherwise the parent sprite
   *  itself (this) acts as the body via a generated texture. */
  private _bodySprite: Phaser.GameObjects.Sprite | null = null;
  /** Arm sprite child — rendered on top of body, origin at joint */
  private _armSprite: Phaser.GameObjects.Sprite | null = null;
  /** Claw sprite child — rendered at the tip of the arm */
  private _clawSprite: Phaser.GameObjects.Sprite | null = null;

  /** Whether file-based atlases are available (checked once in constructor) */
  private _useAtlases: boolean;

  // Legacy overlay for sensor beam, light, carried-object indicator
  private _overlay: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    robotConfig: RobotConfig,
  ) {
    // If the body atlas is available, use it; otherwise use the generated texture
    const bodyAtlasAvailable = scene.textures.exists(ROBOT_ATLAS_KEYS.BODY);
    const textureKey = bodyAtlasAvailable ? ROBOT_ATLAS_KEYS.BODY : ROBOT_TEXTURE_KEYS.ROBOT_BODY;
    const frame = bodyAtlasAvailable ? 'idle' : undefined;

    super(scene, x, y, textureKey, frame);

    this._useAtlases = bodyAtlasAvailable;
    this._startX = x;
    this._startY = y;
    this._robotConfig = robotConfig;

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0);
    body.setDrag(0);
    const bodySize = 36;
    body.setSize(bodySize, bodySize);
    body.setOffset((this.width - bodySize) / 2, (this.height - bodySize) / 2);

    // Set tint based on robot config color
    if (robotConfig.color) {
      const colorNum = Phaser.Display.Color.HexStringToColor(robotConfig.color).color;
      this.setTint(colorNum);
    }

    this.setRotation(0);

    // Create components
    this._commandQueue = new CommandQueueComponent(scene, this);
    this._sensor = new RobotSensorComponent(scene, this);

    // Create composited child sprites for arm & claw
    this.#createChildSprites();

    // Create graphics overlay for sensor beam, light glow, carried indicator
    this._overlay = scene.add.graphics();
    this._overlay.setDepth(this.depth + 2);

    // Create state machine
    this._stateMachine = new StateMachine('robot');
    this.#setupStates();
    this._stateMachine.setState(ROBOT_STATES.IDLE);
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get commandQueue(): CommandQueueComponent { return this._commandQueue; }
  get sensor(): RobotSensorComponent { return this._sensor; }
  get stateMachine(): StateMachine { return this._stateMachine; }
  get heading(): number { return this._commandQueue.heading; }
  get armAngle(): number { return this._commandQueue.armAngle; }
  get clawOpen(): boolean { return this._commandQueue.clawOpen; }
  get carriedObject(): Phaser.GameObjects.Sprite | null { return this._commandQueue.carriedObject; }

  // ── Public API ────────────────────────────────────────────────────────────

  public loadCommands(commands: CommandPrimitive[]): void {
    this._commandQueue.loadCommands(commands);
  }

  public resetRobot(): void {
    this._commandQueue.reset();
    this.setPosition(this._startX, this._startY);
    this.setVelocity(0, 0);
    this.setRotation(0);
    this._stateMachine.setState(ROBOT_STATES.IDLE);
  }

  // ── Frame update ────────────────────────────────────────────────────────

  public update(_time: number, delta: number): void {
    // Drive command queue
    this._commandQueue.update(delta);

    // Update sprite rotation to match heading
    // The robot texture points RIGHT (0 radians); we rotate by heading
    // (and add PI/2 so "up" looks correct for a top-down view)
    this.setRotation(this._commandQueue.heading + Math.PI / 2);

    // Update state machine
    this.#updateStateMachine();

    // Update composited child sprites (arm + claw positions / frames)
    this.#updateChildSprites();

    // Draw overlay (sensor beam, light, carried indicator)
    this.#drawOverlay();
  }

  public destroy(fromScene?: boolean): void {
    this._commandQueue.destroy();
    this._overlay.destroy();
    this._bodySprite?.destroy();
    this._armSprite?.destroy();
    this._clawSprite?.destroy();
    super.destroy(fromScene);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Child sprite creation & update
  // ════════════════════════════════════════════════════════════════════════════

  #createChildSprites(): void {
    const scene = this.scene;

    // ── Arm sprite ────────────────────────────────────────────────────────
    if (this._useAtlases && scene.textures.exists(ROBOT_ATLAS_KEYS.ARM)) {
      this._armSprite = scene.add.sprite(this.x, this.y, ROBOT_ATLAS_KEYS.ARM, 'angle_0');
    } else {
      this._armSprite = scene.add.sprite(this.x, this.y, ROBOT_TEXTURE_KEYS.ROBOT_ARM);
    }
    this._armSprite.setOrigin(0.1, 0.5); // pivot at joint end (near the body center)
    this._armSprite.setDepth(this.depth + 1);

    // ── Claw sprite ──────────────────────────────────────────────────────
    if (this._useAtlases && scene.textures.exists(ROBOT_ATLAS_KEYS.CLAW)) {
      this._clawSprite = scene.add.sprite(this.x, this.y, ROBOT_ATLAS_KEYS.CLAW, 'open');
    } else {
      this._clawSprite = scene.add.sprite(this.x, this.y, ROBOT_TEXTURE_KEYS.ROBOT_CLAW_OPEN);
    }
    this._clawSprite.setOrigin(0.2, 0.5);
    this._clawSprite.setDepth(this.depth + 1);
  }

  #updateChildSprites(): void {
    const heading = this._commandQueue.heading;
    const armAngle = this._commandQueue.armAngle;
    const isClawOpen = this._commandQueue.clawOpen;

    // ── Arm ───────────────────────────────────────────────────────────────
    if (this._armSprite) {
      // Position arm joint at center of robot body
      this._armSprite.setPosition(this.x, this.y);
      // Rotate the arm sprite to point in the heading direction
      this._armSprite.setRotation(heading);

      // Set the correct arm frame based on elevation angle
      if (this._useAtlases && this.scene.textures.exists(ROBOT_ATLAS_KEYS.ARM)) {
        const snapAngle = this.#snapArmAngle(armAngle);
        this._armSprite.setFrame(`angle_${snapAngle}`);
      } else {
        // For generated textures, swap the texture key
        const texKey = this.#getArmTextureKey(armAngle);
        if (this._armSprite.texture.key !== texKey) {
          this._armSprite.setTexture(texKey);
        }
      }

      // Scale arm slightly based on elevation (foreshortening effect)
      const scaleY = 1 - (armAngle / 180) * 0.3;
      this._armSprite.setScale(1, scaleY);
    }

    // ── Claw ──────────────────────────────────────────────────────────────
    if (this._clawSprite) {
      // Position claw at the tip of the arm
      const armLen = 24 * (1 - (armAngle / 180) * 0.3); // match foreshortening
      const clawX = this.x + Math.cos(heading) * armLen;
      const clawY = this.y + Math.sin(heading) * armLen;
      this._clawSprite.setPosition(clawX, clawY);
      this._clawSprite.setRotation(heading);

      // Set claw frame
      if (this._useAtlases && this.scene.textures.exists(ROBOT_ATLAS_KEYS.CLAW)) {
        this._clawSprite.setFrame(isClawOpen ? 'open' : 'closed');
      } else {
        const texKey = isClawOpen
          ? ROBOT_TEXTURE_KEYS.ROBOT_CLAW_OPEN
          : ROBOT_TEXTURE_KEYS.ROBOT_CLAW_CLOSED;
        if (this._clawSprite.texture.key !== texKey) {
          this._clawSprite.setTexture(texKey);
        }
      }
    }
  }

  /** Snap continuous arm elevation angle to nearest atlas frame angle */
  #snapArmAngle(angle: number): number {
    const frames = [0, 45, 90, 135, 180];
    let closest = 0;
    let minDist = Infinity;
    for (const f of frames) {
      const d = Math.abs(angle - f);
      if (d < minDist) { minDist = d; closest = f; }
    }
    return closest;
  }

  /** Get the generated texture key for a given arm elevation angle */
  #getArmTextureKey(angle: number): string {
    const snap = this.#snapArmAngle(angle);
    switch (snap) {
      case 0: return ROBOT_TEXTURE_KEYS.ROBOT_ARM_0;
      case 45: return ROBOT_TEXTURE_KEYS.ROBOT_ARM_45;
      case 90: return ROBOT_TEXTURE_KEYS.ROBOT_ARM_90;
      case 135: return ROBOT_TEXTURE_KEYS.ROBOT_ARM_135;
      case 180: return ROBOT_TEXTURE_KEYS.ROBOT_ARM_180;
      default: return ROBOT_TEXTURE_KEYS.ROBOT_ARM;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // State machine
  // ════════════════════════════════════════════════════════════════════════════

  #setupStates(): void {
    this._stateMachine.addState({
      name: ROBOT_STATES.IDLE,
      stateMachine: this._stateMachine,
      onEnter: () => { this.setVelocity(0, 0); },
    });
    this._stateMachine.addState({
      name: ROBOT_STATES.MOVING,
      stateMachine: this._stateMachine,
    });
    this._stateMachine.addState({
      name: ROBOT_STATES.TURNING,
      stateMachine: this._stateMachine,
      onEnter: () => { this.setVelocity(0, 0); },
    });
    this._stateMachine.addState({
      name: ROBOT_STATES.ARM_ACTION,
      stateMachine: this._stateMachine,
      onEnter: () => { this.setVelocity(0, 0); },
    });
    this._stateMachine.addState({
      name: ROBOT_STATES.CLAW_ACTION,
      stateMachine: this._stateMachine,
      onEnter: () => { this.setVelocity(0, 0); },
    });
    this._stateMachine.addState({
      name: ROBOT_STATES.SENSING,
      stateMachine: this._stateMachine,
      onEnter: () => { this.setVelocity(0, 0); },
    });
  }

  #updateStateMachine(): void {
    const cmd = this._commandQueue.currentCommand;
    if (!cmd) {
      if (this._stateMachine.currentStateName !== ROBOT_STATES.IDLE) {
        this._stateMachine.setState(ROBOT_STATES.IDLE);
      }
      return;
    }

    let targetState = ROBOT_STATES.IDLE;
    switch (cmd.intent) {
      case 'move':
      case 'run_motor':
        targetState = ROBOT_STATES.MOVING;
        break;
      case 'turn':
        targetState = ROBOT_STATES.TURNING;
        break;
      case 'arm_up':
      case 'arm_down':
        targetState = ROBOT_STATES.ARM_ACTION;
        break;
      case 'claw_open':
      case 'claw_close':
        targetState = ROBOT_STATES.CLAW_ACTION;
        break;
      case 'sense_color':
      case 'sense_distance':
      case 'if_color':
      case 'if_touched':
      case 'if_button':
      case 'if_force':
      case 'if_reflection':
      case 'if_ambient':
        targetState = ROBOT_STATES.SENSING;
        break;
    }

    if (this._stateMachine.currentStateName !== targetState) {
      this._stateMachine.setState(targetState);
    }
    this._stateMachine.update();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Overlay drawing (sensor beam, light glow, carried-object indicator)
  // ════════════════════════════════════════════════════════════════════════════

  #drawOverlay(): void {
    this._overlay.clear();

    const cx = this.x;
    const cy = this.y;
    const heading = this._commandQueue.heading;
    const lightColor = this._commandQueue.state.lightColor;

    // ─ Light glow ─
    if (lightColor) {
      const lc = Phaser.Display.Color.HexStringToColor(
        lightColor.startsWith('#') ? lightColor : this.#colorNameToHex(lightColor),
      ).color;
      this._overlay.fillStyle(lc, 0.25);
      this._overlay.fillCircle(cx, cy, 30);
    }

    // ─ Sensor beam (thin line ahead) ─
    const sensorLen = 40;
    const sensorEndX = cx + Math.cos(heading) * sensorLen;
    const sensorEndY = cy + Math.sin(heading) * sensorLen;
    this._overlay.lineStyle(1, 0x00ff00, 0.3);
    this._overlay.lineBetween(cx, cy, sensorEndX, sensorEndY);

    // ─ Carried object indicator ─
    if (this._commandQueue.carriedObject) {
      this._overlay.fillStyle(0xffff00, 0.4);
      this._overlay.fillCircle(cx, cy - 15, 5);
    }
  }

  #colorNameToHex(name: string): string {
    const map: Record<string, string> = {
      red: '#ef5350',
      blue: '#42a5f5',
      green: '#66bb6a',
      yellow: '#ffee58',
      white: '#ffffff',
      orange: '#ffb74d',
      purple: '#ab47bc',
      pink: '#f48fb1',
      cyan: '#4fc3f7',
    };
    return map[name.toLowerCase()] || '#ffffff';
  }
}
