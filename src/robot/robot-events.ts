import * as Phaser from 'phaser';

// ─── Robot-specific event bus ────────────────────────────────────────────────
// Separate from the Zelda EVENT_BUS so robot events never clash.

export const ROBOT_EVENT_BUS = new Phaser.Events.EventEmitter();

// ─── Event name constants ────────────────────────────────────────────────────

export const ROBOT_EVENTS = {
  // Command lifecycle
  COMMAND_START: 'ROBOT_COMMAND_START',
  COMMAND_COMPLETE: 'ROBOT_COMMAND_COMPLETE',
  ALL_COMMANDS_DONE: 'ROBOT_ALL_COMMANDS_DONE',
  COMMANDS_LOADED: 'ROBOT_COMMANDS_LOADED',

  // Sensor readings
  SENSOR_READING: 'ROBOT_SENSOR_READING',
  COLOR_SENSED: 'ROBOT_COLOR_SENSED',
  DISTANCE_SENSED: 'ROBOT_DISTANCE_SENSED',
  COLLISION_AHEAD: 'ROBOT_COLLISION_AHEAD',

  // World interactions
  GOAL_REACHED: 'ROBOT_GOAL_REACHED',
  COLLISION: 'ROBOT_COLLISION',
  OBJECT_PICKED_UP: 'ROBOT_OBJECT_PICKED_UP',
  OBJECT_DROPPED: 'ROBOT_OBJECT_DROPPED',
  OBJECT_PUSHED: 'ROBOT_OBJECT_PUSHED',

  // Robot state
  ARM_CHANGED: 'ROBOT_ARM_CHANGED',
  CLAW_CHANGED: 'ROBOT_CLAW_CHANGED',
  HEADING_CHANGED: 'ROBOT_HEADING_CHANGED',

  // Playback control
  PLAY: 'ROBOT_PLAY',
  PAUSE: 'ROBOT_PAUSE',
  RESET: 'ROBOT_RESET',

  // Actions
  BEEP: 'ROBOT_BEEP',
  SAY: 'ROBOT_SAY',
  LIGHT: 'ROBOT_LIGHT',
} as const;

// ─── Command primitive types ─────────────────────────────────────────────────
// These match the intent names from RobotSimulator.jsx

export type CommandPrimitive = {
  id: number;
  intent: string;
  slots: Record<string, unknown>;
  raw?: string;
};

// ─── Obstacle config (passed from React) ─────────────────────────────────────

export type ObstacleConfig = {
  id: string;
  type: string;
  x: number;
  y: number;
  color?: string;
  width?: number;
  height?: number;
};

// ─── Robot config (passed from React) ────────────────────────────────────────

export type RobotConfig = {
  chassisKey: string;
  color: string;
  ports?: Record<string, { role: string; label: string }>;
  hasDrive?: boolean;
};

// ─── Sensor reading payload ──────────────────────────────────────────────────

export type SensorReading = {
  type: 'color' | 'distance' | 'collision';
  value: unknown;
};

// ─── Scene init data ─────────────────────────────────────────────────────────

export type RobotSceneData = {
  commands: CommandPrimitive[];
  obstacles: ObstacleConfig[];
  robotConfig: RobotConfig;
  worldSize?: number; // pixels, default 400 (4m * 100px/m)
};
