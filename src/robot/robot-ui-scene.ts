import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../scenes/scene-keys';
import { ROBOT_EVENT_BUS, ROBOT_EVENTS, CommandPrimitive } from './robot-events';

// ─── HUD Constants ──────────────────────────────────────────────────────────

const HUD_X = 8;
const HUD_Y = 8;
const HUD_LINE_HEIGHT = 14;
const HUD_FONT_SIZE = '10px';
const HUD_COLOR = '#8ab4f8';
const HUD_DIM_COLOR = '#3a5a7a';
const LOG_MAX_LINES = 6;

/**
 * RobotUIScene -- overlay HUD that runs in parallel with RobotScene.
 * Displays:
 * - Current command being executed
 * - Sensor state (last reading)
 * - Arm angle and claw state
 * - Command log (last N completed commands)
 * - Status indicators (paused, finished, running)
 */
export class RobotUIScene extends Phaser.Scene {
  private _statusText!: Phaser.GameObjects.Text;
  private _commandText!: Phaser.GameObjects.Text;
  private _sensorText!: Phaser.GameObjects.Text;
  private _armText!: Phaser.GameObjects.Text;
  private _logText!: Phaser.GameObjects.Text;
  private _sayBubble!: Phaser.GameObjects.Text;

  private _commandLog: string[] = [];
  private _lastSensor = '';
  private _armAngle = 0;
  private _clawOpen = true;
  private _status: 'idle' | 'running' | 'paused' | 'done' = 'idle';

  constructor() {
    super({ key: SCENE_KEYS.ROBOT_UI_SCENE });
  }

  public create(): void {
    // Build HUD text objects
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: HUD_FONT_SIZE,
      color: HUD_COLOR,
      fontFamily: 'monospace',
      backgroundColor: '#0a0a0a88',
      padding: { x: 4, y: 2 },
    };

    const dimStyle = { ...style, color: HUD_DIM_COLOR };

    this._statusText = this.add.text(HUD_X, HUD_Y, 'STATUS: Idle', style).setDepth(100);
    this._commandText = this.add
      .text(HUD_X, HUD_Y + HUD_LINE_HEIGHT, 'CMD: --', dimStyle)
      .setDepth(100);
    this._armText = this.add
      .text(HUD_X, HUD_Y + HUD_LINE_HEIGHT * 2, 'ARM: 0° | CLAW: open', dimStyle)
      .setDepth(100);
    this._sensorText = this.add
      .text(HUD_X, HUD_Y + HUD_LINE_HEIGHT * 3, 'SENSOR: --', dimStyle)
      .setDepth(100);
    this._logText = this.add
      .text(HUD_X, HUD_Y + HUD_LINE_HEIGHT * 4.5, '', {
        ...dimStyle,
        fontSize: '8px',
        wordWrap: { width: 180 },
      })
      .setDepth(100);

    // "Say" speech bubble (hidden by default)
    this._sayBubble = this.add
      .text(200, 180, '', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#333333cc',
        padding: { x: 8, y: 4 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setVisible(false);

    // Register event listeners
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.COMMAND_START, this.#onCommandStart, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.COMMAND_COMPLETE, this.#onCommandComplete, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.ALL_COMMANDS_DONE, this.#onAllDone, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.COMMANDS_LOADED, this.#onCommandsLoaded, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.ARM_CHANGED, this.#onArmChanged, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.CLAW_CHANGED, this.#onClawChanged, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.SENSOR_READING, this.#onSensorReading, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.GOAL_REACHED, this.#onGoalReached, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.COLLISION, this.#onCollision, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.BEEP, this.#onBeep, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.SAY, this.#onSay, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.LIGHT, this.#onLight, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.PLAY, this.#onPlay, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.PAUSE, this.#onPause, this);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.RESET, this.#onReset, this);
  }

  public shutdown(): void {
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.COMMAND_START, this.#onCommandStart, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.COMMAND_COMPLETE, this.#onCommandComplete, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.ALL_COMMANDS_DONE, this.#onAllDone, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.COMMANDS_LOADED, this.#onCommandsLoaded, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.ARM_CHANGED, this.#onArmChanged, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.CLAW_CHANGED, this.#onClawChanged, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.SENSOR_READING, this.#onSensorReading, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.GOAL_REACHED, this.#onGoalReached, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.COLLISION, this.#onCollision, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.BEEP, this.#onBeep, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.SAY, this.#onSay, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.LIGHT, this.#onLight, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.PLAY, this.#onPlay, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.PAUSE, this.#onPause, this);
    ROBOT_EVENT_BUS.off(ROBOT_EVENTS.RESET, this.#onReset, this);
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  #onCommandStart = (cmd: CommandPrimitive): void => {
    this._status = 'running';
    this._statusText.setText('STATUS: Running');
    this._statusText.setColor('#66bb6a');
    this._commandText.setText(`CMD: ${cmd.raw || cmd.intent}`);
    this._commandText.setColor(HUD_COLOR);
  };

  #onCommandComplete = (cmd: CommandPrimitive): void => {
    const entry = `✓ ${cmd.raw || cmd.intent}`;
    this._commandLog.push(entry);
    if (this._commandLog.length > LOG_MAX_LINES) {
      this._commandLog.shift();
    }
    this._logText.setText(this._commandLog.join('\n'));
  };

  #onAllDone = (): void => {
    this._status = 'done';
    this._statusText.setText('STATUS: Done');
    this._statusText.setColor('#ffb74d');
    this._commandText.setText('CMD: --');
    this._commandText.setColor(HUD_DIM_COLOR);
  };

  #onCommandsLoaded = (count: number): void => {
    this._status = 'running';
    this._statusText.setText(`STATUS: Loaded ${count} commands`);
    this._statusText.setColor('#4fc3f7');
    this._commandLog = [];
    this._logText.setText('');
  };

  #onArmChanged = (angle: number): void => {
    this._armAngle = Math.round(angle);
    this.#updateArmText();
  };

  #onClawChanged = (isOpen: boolean): void => {
    this._clawOpen = isOpen;
    this.#updateArmText();
  };

  #updateArmText(): void {
    const clawStr = this._clawOpen ? 'open' : 'closed';
    this._armText.setText(`ARM: ${this._armAngle}° | CLAW: ${clawStr}`);
  }

  #onSensorReading = (reading: { type: string; slots: Record<string, unknown> }): void => {
    this._lastSensor = `${reading.type}: ${JSON.stringify(reading.slots)}`;
    this._sensorText.setText(`SENSOR: ${this._lastSensor}`);
    this._sensorText.setColor('#4fc3f7');
    // Fade back to dim after 2 seconds
    this.time.delayedCall(2000, () => {
      this._sensorText.setColor(HUD_DIM_COLOR);
    });
  };

  #onGoalReached = (): void => {
    this._sensorText.setText('SENSOR: GOAL REACHED!');
    this._sensorText.setColor('#66bb6a');

    // Flash effect
    this.cameras.main.flash(300, 100, 200, 100);
  };

  #onCollision = (type: string): void => {
    this._sensorText.setText(`SENSOR: Collision (${type})`);
    this._sensorText.setColor('#ef5350');
    this.time.delayedCall(1500, () => {
      this._sensorText.setColor(HUD_DIM_COLOR);
    });
  };

  #onBeep = (): void => {
    // Visual beep indicator
    const beepText = this.add
      .text(200, 160, '🔊 BEEP!', {
        fontSize: '16px',
        color: '#ffee58',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.tweens.add({
      targets: beepText,
      alpha: 0,
      y: 140,
      duration: 600,
      onComplete: () => beepText.destroy(),
    });
  };

  #onSay = (phrase: string): void => {
    this._sayBubble.setText(`"${phrase}"`);
    this._sayBubble.setVisible(true);

    this.time.delayedCall(1500, () => {
      this._sayBubble.setVisible(false);
    });
  };

  #onLight = (color: string | null): void => {
    if (color) {
      this._sensorText.setText(`SENSOR: Light → ${color}`);
    } else {
      this._sensorText.setText('SENSOR: Light off');
    }
  };

  #onPlay = (): void => {
    this._status = 'running';
    this._statusText.setText('STATUS: Running');
    this._statusText.setColor('#66bb6a');
  };

  #onPause = (): void => {
    this._status = 'paused';
    this._statusText.setText('STATUS: Paused');
    this._statusText.setColor('#ffb74d');
  };

  #onReset = (): void => {
    this._status = 'idle';
    this._statusText.setText('STATUS: Idle');
    this._statusText.setColor(HUD_COLOR);
    this._commandText.setText('CMD: --');
    this._commandText.setColor(HUD_DIM_COLOR);
    this._armText.setText('ARM: 0° | CLAW: open');
    this._sensorText.setText('SENSOR: --');
    this._sensorText.setColor(HUD_DIM_COLOR);
    this._commandLog = [];
    this._logText.setText('');
    this._armAngle = 0;
    this._clawOpen = true;
  };
}
