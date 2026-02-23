// ─── Centralized constants for the Robot Simulation ─────────────────────────

// ─── Texture keys ────────────────────────────────────────────────────────────

export const ROBOT_TEXTURE_KEYS = {
  // Robot body parts (runtime-generated or loaded from atlas)
  ROBOT_BODY: 'ROBOT_BODY',
  ROBOT_BODY_MOVE_0: 'ROBOT_BODY_MOVE_0',
  ROBOT_BODY_MOVE_1: 'ROBOT_BODY_MOVE_1',
  ROBOT_BODY_MOVE_2: 'ROBOT_BODY_MOVE_2',
  ROBOT_ARM: 'ROBOT_ARM',
  ROBOT_ARM_0: 'ROBOT_ARM_0',
  ROBOT_ARM_45: 'ROBOT_ARM_45',
  ROBOT_ARM_90: 'ROBOT_ARM_90',
  ROBOT_ARM_135: 'ROBOT_ARM_135',
  ROBOT_ARM_180: 'ROBOT_ARM_180',
  ROBOT_CLAW_OPEN: 'ROBOT_CLAW_OPEN',
  ROBOT_CLAW_CLOSED: 'ROBOT_CLAW_CLOSED',

  // Obstacles
  BARRIER: 'ROBOT_BARRIER',
  WALL_H: 'ROBOT_WALL_H',
  WALL_V: 'ROBOT_WALL_V',
  LIFTABLE: 'ROBOT_LIFTABLE',
  GRABBABLE: 'ROBOT_GRABBABLE',
  PUSHABLE: 'ROBOT_PUSHABLE',
  GOAL_ZONE: 'ROBOT_GOAL_ZONE',
  COLOR_ZONE: 'ROBOT_COLOR_ZONE',
  RAMP: 'ROBOT_RAMP',
  GRID_CELL: 'ROBOT_GRID_CELL',
} as const;

// ─── Animation keys ──────────────────────────────────────────────────────────

export const ROBOT_ANIM_KEYS = {
  BODY_IDLE: 'robot_body_idle',
  BODY_MOVE: 'robot_body_move',
  CLAW_OPEN: 'robot_claw_open',
  CLAW_CLOSE: 'robot_claw_close',
} as const;

// ─── Atlas keys (for file-based sprite sheets) ──────────────────────────────

export const ROBOT_ATLAS_KEYS = {
  BODY: 'robot_body_atlas',
  ARM: 'robot_arm_atlas',
  CLAW: 'robot_claw_atlas',
} as const;

// ─── Default colours ─────────────────────────────────────────────────────────

export const ROBOT_COLORS = {
  robot: 0x4fc3f7,
  robotAccent: 0x0288d1,
  arm: 0x888888,
  armAccent: 0x666666,
  claw: 0xcccccc,
  clawAccent: 0x999999,
  barrier: 0xef5350,
  wall: 0x8d6e63,
  liftable: 0xffb74d,
  grabbable: 0xe91e63,
  pushable: 0x42a5f5,
  goal: 0x66bb6a,
  colorZone: 0x90caf9,
  ramp: 0xab47bc,
  gridLine: 0x1a2a3a,
  gridBg: 0x0a1628,
} as const;

// ─── Obstacle type definitions ───────────────────────────────────────────────

export type ObstacleTypeDef = {
  key: string;
  label: string;
  textureKey: string;
  color: number;
  width: number;
  height: number;
  isStatic: boolean;
  isSolid: boolean;
};

export const OBSTACLE_TYPE_DEFS: Record<string, ObstacleTypeDef> = {
  barrier: {
    key: 'barrier',
    label: 'Barrier',
    textureKey: ROBOT_TEXTURE_KEYS.BARRIER,
    color: ROBOT_COLORS.barrier,
    width: 40,
    height: 40,
    isStatic: true,
    isSolid: true,
  },
  wall_h: {
    key: 'wall_h',
    label: 'Wall (H)',
    textureKey: ROBOT_TEXTURE_KEYS.WALL_H,
    color: ROBOT_COLORS.wall,
    width: 80,
    height: 16,
    isStatic: true,
    isSolid: true,
  },
  wall_v: {
    key: 'wall_v',
    label: 'Wall (V)',
    textureKey: ROBOT_TEXTURE_KEYS.WALL_V,
    color: ROBOT_COLORS.wall,
    width: 16,
    height: 80,
    isStatic: true,
    isSolid: true,
  },
  pushable: {
    key: 'pushable',
    label: 'Pushable',
    textureKey: ROBOT_TEXTURE_KEYS.PUSHABLE,
    color: ROBOT_COLORS.pushable,
    width: 32,
    height: 32,
    isStatic: false,
    isSolid: true,
  },
  liftable: {
    key: 'liftable',
    label: 'Liftable',
    textureKey: ROBOT_TEXTURE_KEYS.LIFTABLE,
    color: ROBOT_COLORS.liftable,
    width: 30,
    height: 30,
    isStatic: true,
    isSolid: true,
  },
  grabbable: {
    key: 'grabbable',
    label: 'Grabbable',
    textureKey: ROBOT_TEXTURE_KEYS.GRABBABLE,
    color: ROBOT_COLORS.grabbable,
    width: 24,
    height: 24,
    isStatic: true,
    isSolid: true,
  },
  goal: {
    key: 'goal',
    label: 'Goal',
    textureKey: ROBOT_TEXTURE_KEYS.GOAL_ZONE,
    color: ROBOT_COLORS.goal,
    width: 50,
    height: 50,
    isStatic: true,
    isSolid: false,
  },
  color_zone: {
    key: 'color_zone',
    label: 'Color Zone',
    textureKey: ROBOT_TEXTURE_KEYS.COLOR_ZONE,
    color: ROBOT_COLORS.colorZone,
    width: 60,
    height: 60,
    isStatic: true,
    isSolid: false,
  },
  ramp: {
    key: 'ramp',
    label: 'Ramp',
    textureKey: ROBOT_TEXTURE_KEYS.RAMP,
    color: ROBOT_COLORS.ramp,
    width: 40,
    height: 24,
    isStatic: true,
    isSolid: true,
  },
} as const;

// ─── Grid constants ──────────────────────────────────────────────────────────

export const GRID_CELL_SIZE = 100; // 1m = 100px
export const DEFAULT_WORLD_SIZE = 400; // 4m x 4m
