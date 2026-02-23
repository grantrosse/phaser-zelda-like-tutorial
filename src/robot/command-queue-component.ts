import * as Phaser from 'phaser';
import { ROBOT_EVENT_BUS, ROBOT_EVENTS, CommandPrimitive } from './robot-events';

// ─── Constants (match RobotSimulator.jsx physics) ───────────────────────────

const SPEED_PX_PER_S = 100; // 1 m/s at 100px/m
const TURN_DEG_PER_S = 180; // degrees per second
const ARM_SPEED_DEG_PER_S = 120; // arm degrees per second
const CLAW_TOGGLE_MS = 300; // time to open/close claw
const BEEP_MS = 300; // beep duration
const SAY_MS = 1500; // say duration
const LIGHT_MS = 400; // light flash duration

// ─── Types ──────────────────────────────────────────────────────────────────

export type RobotPhysicsState = {
  heading: number; // radians, 0 = right, PI/2 = down
  armAngle: number; // 0-180 degrees
  clawOpen: boolean;
  carriedObject: Phaser.GameObjects.Sprite | null;
  lightColor: string | null;
};

type ActiveCommand = {
  command: CommandPrimitive;
  elapsed: number;
  duration: number;
  startHeading?: number;
  targetHeading?: number;
  startArmAngle?: number;
  targetArmAngle?: number;
};

/**
 * CommandQueueComponent manages a queue of command primitives and drives
 * the robot's physics body each frame. It does NOT extend InputComponent
 * because the robot uses heading-based movement (continuous angle) rather
 * than 4-directional.
 */
export class CommandQueueComponent {
  private _scene: Phaser.Scene;
  private _sprite: Phaser.Physics.Arcade.Sprite;
  private _queue: CommandPrimitive[] = [];
  private _active: ActiveCommand | null = null;
  private _paused = false;
  private _finished = false;
  private _state: RobotPhysicsState;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this._scene = scene;
    this._sprite = sprite;
    this._state = {
      heading: -Math.PI / 2, // facing up by default
      armAngle: 0,
      clawOpen: true,
      carriedObject: null,
      lightColor: null,
    };

    // Listen for playback control events
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.PLAY, this.resume, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.PAUSE, this.pause, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.RESET, this.reset, this);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  get state(): RobotPhysicsState {
    return this._state;
  }

  get heading(): number {
    return this._state.heading;
  }

  get armAngle(): number {
    return this._state.armAngle;
  }

  get clawOpen(): boolean {
    return this._state.clawOpen;
  }

  get carriedObject(): Phaser.GameObjects.Sprite | null {
    return this._state.carriedObject;
  }

  get isFinished(): boolean {
    return this._finished;
  }

  get isPaused(): boolean {
    return this._paused;
  }

  get currentCommand(): CommandPrimitive | null {
    return this._active?.command ?? null;
  }

  get queueLength(): number {
    return this._queue.length;
  }

  public loadCommands(commands: CommandPrimitive[]): void {
    // Unroll repeat blocks into a flat list
    this._queue = this.#unrollRepeats(commands);
    this._active = null;
    this._finished = false;
    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.COMMANDS_LOADED, this._queue.length);
  }

  public pause(): void {
    this._paused = true;
    this._sprite.setVelocity(0, 0);
  }

  public resume(): void {
    this._paused = false;
  }

  public reset(): void {
    this._queue = [];
    this._active = null;
    this._finished = false;
    this._paused = false;
    this._sprite.setVelocity(0, 0);
    this._state.heading = -Math.PI / 2;
    this._state.armAngle = 0;
    this._state.clawOpen = true;
    this._state.carriedObject = null;
    this._state.lightColor = null;
  }

  public destroy(): void {
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.PLAY, this.resume, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.PAUSE, this.pause, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.RESET, this.reset, this);
  }

  // ── Frame update (called from RobotGameObject.update) ─────────────────────

  public update(dt: number): void {
    if (this._paused || this._finished) {
      return;
    }

    // If no active command, dequeue next
    if (!this._active) {
      if (this._queue.length === 0) {
        this._finished = true;
        this._sprite.setVelocity(0, 0);
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.ALL_COMMANDS_DONE);
        return;
      }
      this.#startNextCommand();
    }

    if (this._active) {
      this.#processActiveCommand(dt);
    }
  }

  // ── Command processing ────────────────────────────────────────────────────

  #startNextCommand(): void {
    const cmd = this._queue.shift();
    if (!cmd) return;

    const intent = cmd.intent;
    const slots = cmd.slots as Record<string, unknown>;

    let duration = 0;

    switch (intent) {
      case 'move': {
        const dir = (slots.direction as string) || 'forward';
        const durS = (slots.duration as number) || 1;
        duration = durS * 1000;
        const speed = dir === 'backward' ? -SPEED_PX_PER_S : SPEED_PX_PER_S;
        this._sprite.setVelocity(
          Math.cos(this._state.heading) * speed,
          Math.sin(this._state.heading) * speed,
        );
        break;
      }
      case 'turn': {
        const dir = (slots.direction as string) || 'right';
        const deg = (slots.degrees as number) || 90;
        duration = (Math.abs(deg) / TURN_DEG_PER_S) * 1000;
        const sign = dir === 'left' ? -1 : 1;
        const deltaRad = Phaser.Math.DegToRad(deg * sign);
        this._active = {
          command: cmd,
          elapsed: 0,
          duration,
          startHeading: this._state.heading,
          targetHeading: this._state.heading + deltaRad,
        };
        this._sprite.setVelocity(0, 0);
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.COMMAND_START, cmd);
        return;
      }
      case 'arm_up': {
        const targetAngle = (slots.angle as number) ?? 90;
        const delta = Math.abs(targetAngle - this._state.armAngle);
        duration = (delta / ARM_SPEED_DEG_PER_S) * 1000;
        this._active = {
          command: cmd,
          elapsed: 0,
          duration,
          startArmAngle: this._state.armAngle,
          targetArmAngle: Math.min(180, targetAngle),
        };
        this._sprite.setVelocity(0, 0);
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.COMMAND_START, cmd);
        return;
      }
      case 'arm_down': {
        const targetAngle = (slots.angle as number) ?? 0;
        const delta = Math.abs(this._state.armAngle - targetAngle);
        duration = (delta / ARM_SPEED_DEG_PER_S) * 1000;
        this._active = {
          command: cmd,
          elapsed: 0,
          duration,
          startArmAngle: this._state.armAngle,
          targetArmAngle: Math.max(0, targetAngle),
        };
        this._sprite.setVelocity(0, 0);
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.COMMAND_START, cmd);
        return;
      }
      case 'claw_close': {
        duration = CLAW_TOGGLE_MS;
        this._state.clawOpen = false;
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.CLAW_CHANGED, false);
        break;
      }
      case 'claw_open': {
        duration = CLAW_TOGGLE_MS;
        this._state.clawOpen = true;
        // Drop carried object
        if (this._state.carriedObject) {
          ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.OBJECT_DROPPED, this._state.carriedObject);
          this._state.carriedObject = null;
        }
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.CLAW_CHANGED, true);
        break;
      }
      case 'wait': {
        const durS = (slots.duration as number) || 1;
        duration = durS * 1000;
        this._sprite.setVelocity(0, 0);
        break;
      }
      case 'beep': {
        duration = BEEP_MS;
        this._sprite.setVelocity(0, 0);
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.BEEP);
        break;
      }
      case 'say': {
        duration = SAY_MS;
        this._sprite.setVelocity(0, 0);
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.SAY, slots.phrase || 'hello');
        break;
      }
      case 'light': {
        duration = LIGHT_MS;
        this._state.lightColor = (slots.color as string) || 'white';
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.LIGHT, this._state.lightColor);
        break;
      }
      case 'light_off': {
        duration = LIGHT_MS;
        this._state.lightColor = null;
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.LIGHT, null);
        break;
      }
      case 'stop': {
        this._sprite.setVelocity(0, 0);
        this._finished = true;
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.ALL_COMMANDS_DONE);
        return;
      }
      case 'sense_color':
      case 'sense_distance':
      case 'if_color':
      case 'if_touched':
      case 'if_button':
      case 'if_force':
      case 'if_reflection':
      case 'if_ambient': {
        // Sensor commands are instant -- emit reading and continue
        duration = 100;
        this._sprite.setVelocity(0, 0);
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.SENSOR_READING, { type: intent, slots });
        break;
      }
      case 'run_motor': {
        const power = (slots.power as number) || 50;
        const durS = (slots.duration as number) || 1;
        duration = durS * 1000;
        const speed = (power / 100) * SPEED_PX_PER_S;
        this._sprite.setVelocity(
          Math.cos(this._state.heading) * speed,
          Math.sin(this._state.heading) * speed,
        );
        break;
      }
      default: {
        // Unknown command, skip
        duration = 100;
        this._sprite.setVelocity(0, 0);
        break;
      }
    }

    this._active = { command: cmd, elapsed: 0, duration };
    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.COMMAND_START, cmd);
  }

  #processActiveCommand(dt: number): void {
    if (!this._active) return;

    this._active.elapsed += dt;
    const { command, elapsed, duration } = this._active;
    const t = Math.min(elapsed / duration, 1);

    switch (command.intent) {
      case 'turn': {
        // Interpolate heading
        const start = this._active.startHeading!;
        const target = this._active.targetHeading!;
        this._state.heading = start + (target - start) * t;
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.HEADING_CHANGED, this._state.heading);
        break;
      }
      case 'arm_up':
      case 'arm_down': {
        const startA = this._active.startArmAngle!;
        const targetA = this._active.targetArmAngle!;
        this._state.armAngle = startA + (targetA - startA) * t;
        ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.ARM_CHANGED, this._state.armAngle);
        break;
      }
      case 'move':
      case 'run_motor': {
        // Velocity was already set; just update heading on sprite rotation
        this._sprite.setRotation(this._state.heading + Math.PI / 2);
        break;
      }
    }

    // Update carried object position to follow robot
    if (this._state.carriedObject) {
      this._state.carriedObject.setPosition(this._sprite.x, this._sprite.y - 20);
    }

    // Check if command is finished
    if (t >= 1) {
      this.#completeActiveCommand();
    }
  }

  #completeActiveCommand(): void {
    if (!this._active) return;

    const cmd = this._active.command;

    // Finalize state
    switch (cmd.intent) {
      case 'turn': {
        this._state.heading = this._active.targetHeading!;
        // Normalize to [-PI, PI]
        this._state.heading = Phaser.Math.Angle.Wrap(this._state.heading);
        break;
      }
      case 'arm_up':
      case 'arm_down': {
        this._state.armAngle = this._active.targetArmAngle!;
        break;
      }
      case 'move':
      case 'run_motor': {
        this._sprite.setVelocity(0, 0);
        break;
      }
    }

    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.COMMAND_COMPLETE, cmd);
    this._active = null;
  }

  // ── Repeat unrolling ──────────────────────────────────────────────────────
  // Converts repeat/stop_repeat blocks into flat command list

  #unrollRepeats(commands: CommandPrimitive[]): CommandPrimitive[] {
    const result: CommandPrimitive[] = [];
    let i = 0;

    while (i < commands.length) {
      const cmd = commands[i];
      if (cmd.intent === 'repeat') {
        const times = (cmd.slots as Record<string, unknown>).times as number || 1;
        // Collect commands until matching stop_repeat
        const body: CommandPrimitive[] = [];
        let depth = 1;
        i++;
        while (i < commands.length && depth > 0) {
          if (commands[i].intent === 'repeat') depth++;
          if (commands[i].intent === 'stop_repeat') {
            depth--;
            if (depth === 0) { i++; break; }
          }
          body.push(commands[i]);
          i++;
        }
        // Repeat the body
        for (let r = 0; r < times; r++) {
          result.push(...this.#unrollRepeats(body));
        }
      } else if (cmd.intent === 'stop_repeat') {
        // Skip orphaned stop_repeat
        i++;
      } else {
        result.push(cmd);
        i++;
      }
    }

    return result;
  }

  // ── Pickup/drop helpers (called by RobotGameObject or scene) ──────────────

  public pickUp(obj: Phaser.GameObjects.Sprite): void {
    this._state.carriedObject = obj;
    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.OBJECT_PICKED_UP, obj);
  }

  public drop(): Phaser.GameObjects.Sprite | null {
    const obj = this._state.carriedObject;
    if (obj) {
      this._state.carriedObject = null;
      ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.OBJECT_DROPPED, obj);
    }
    return obj;
  }
}
