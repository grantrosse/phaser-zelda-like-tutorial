/**
 * Robot Simulation Demo — standalone entry point.
 *
 * Supports two modes:
 *   - **Edit mode**: World builder scene for placing obstacles on the grid
 *   - **Play mode**: Robot scene that executes command programs
 *
 * Run with:  pnpm start   then open http://localhost:3000/robot.html
 */

import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scenes/scene-keys';
import { RobotPreloadScene } from './robot/robot-preload-scene';
import { RobotScene } from './robot/robot-scene';
import { RobotUIScene } from './robot/robot-ui-scene';
import { WorldBuilderScene, WB_EVENTS } from './robot/world-builder-scene';
import {
  ROBOT_EVENT_BUS,
  ROBOT_EVENTS,
  CommandPrimitive,
  ObstacleConfig,
  RobotSceneData,
} from './robot/robot-events';
import { OBSTACLE_TYPE_DEFS } from './robot/robot-constants';

// ═══════════════════════════════════════════════════════════════════════════════
// Demo programs
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO_PROGRAMS: Record<string, { commands: CommandPrimitive[]; obstacles: ObstacleConfig[] }> = {
  square: {
    commands: [
      { id: 0, intent: 'repeat', slots: { times: 4 }, raw: 'repeat 4 times' },
      { id: 1, intent: 'move', slots: { direction: 'forward', duration: 1.5 }, raw: 'move forward 1.5s' },
      { id: 2, intent: 'turn', slots: { direction: 'right', degrees: 90 }, raw: 'turn right 90°' },
      { id: 3, intent: 'stop_repeat', slots: {}, raw: 'stop repeating' },
      { id: 4, intent: 'stop', slots: {}, raw: 'stop' },
    ],
    obstacles: [],
  },
  corridor: {
    commands: [
      { id: 0, intent: 'move', slots: { direction: 'forward', duration: 1.2 }, raw: 'move forward 1.2s' },
      { id: 1, intent: 'turn', slots: { direction: 'right', degrees: 90 }, raw: 'turn right 90°' },
      { id: 2, intent: 'move', slots: { direction: 'forward', duration: 0.6 }, raw: 'move forward 0.6s' },
      { id: 3, intent: 'turn', slots: { direction: 'left', degrees: 90 }, raw: 'turn left 90°' },
      { id: 4, intent: 'move', slots: { direction: 'forward', duration: 1.5 }, raw: 'move forward 1.5s' },
      { id: 5, intent: 'stop', slots: {}, raw: 'stop' },
    ],
    obstacles: [
      { id: 'o1', type: 'wall_v', x: 160, y: 120 },
      { id: 'o2', type: 'wall_v', x: 240, y: 120 },
      { id: 'o3', type: 'wall_h', x: 200, y: 80 },
      { id: 'o4', type: 'wall_v', x: 160, y: 260 },
      { id: 'o5', type: 'wall_v', x: 280, y: 230 },
      { id: 'o6', type: 'goal', x: 200, y: 50 },
    ],
  },
  lift: {
    commands: [
      { id: 0, intent: 'move', slots: { direction: 'forward', duration: 1 }, raw: 'move forward 1s' },
      { id: 1, intent: 'arm_up', slots: { angle: 90 }, raw: 'raise arm' },
      { id: 2, intent: 'claw_close', slots: {}, raw: 'close claw' },
      { id: 3, intent: 'move', slots: { direction: 'forward', duration: 1.5 }, raw: 'move forward 1.5s' },
      { id: 4, intent: 'arm_down', slots: { angle: 0 }, raw: 'lower arm' },
      { id: 5, intent: 'claw_open', slots: {}, raw: 'open claw' },
      { id: 6, intent: 'stop', slots: {}, raw: 'stop' },
    ],
    obstacles: [
      { id: 'o1', type: 'liftable', x: 200, y: 160 },
      { id: 'o2', type: 'goal', x: 200, y: 80 },
    ],
  },
  grab: {
    commands: [
      { id: 0, intent: 'move', slots: { direction: 'forward', duration: 0.8 }, raw: 'move forward 0.8s' },
      { id: 1, intent: 'claw_close', slots: {}, raw: 'close claw' },
      { id: 2, intent: 'arm_up', slots: { angle: 60 }, raw: 'raise arm 60°' },
      { id: 3, intent: 'turn', slots: { direction: 'right', degrees: 90 }, raw: 'turn right 90°' },
      { id: 4, intent: 'move', slots: { direction: 'forward', duration: 1.2 }, raw: 'move forward 1.2s' },
      { id: 5, intent: 'arm_down', slots: { angle: 0 }, raw: 'lower arm' },
      { id: 6, intent: 'claw_open', slots: {}, raw: 'open claw' },
      { id: 7, intent: 'stop', slots: {}, raw: 'stop' },
    ],
    obstacles: [
      { id: 'o1', type: 'grabbable', x: 200, y: 155 },
      { id: 'o2', type: 'goal', x: 320, y: 200 },
      { id: 'o3', type: 'barrier', x: 260, y: 160 },
    ],
  },
  push: {
    commands: [
      { id: 0, intent: 'move', slots: { direction: 'forward', duration: 2 }, raw: 'move forward 2s' },
      { id: 1, intent: 'turn', slots: { direction: 'left', degrees: 90 }, raw: 'turn left 90°' },
      { id: 2, intent: 'move', slots: { direction: 'forward', duration: 1 }, raw: 'move forward 1s' },
      { id: 3, intent: 'stop', slots: {}, raw: 'stop' },
    ],
    obstacles: [
      { id: 'o1', type: 'pushable', x: 200, y: 150 },
      { id: 'o2', type: 'wall_v', x: 150, y: 100 },
      { id: 'o3', type: 'wall_v', x: 250, y: 100 },
      { id: 'o4', type: 'goal', x: 200, y: 60 },
    ],
  },
  angle: {
    commands: [
      { id: 0, intent: 'move', slots: { direction: 'forward', duration: 1 }, raw: 'move forward 1s' },
      { id: 1, intent: 'turn', slots: { direction: 'right', degrees: 45 }, raw: 'turn right 45°' },
      { id: 2, intent: 'move', slots: { direction: 'forward', duration: 1.2 }, raw: 'move forward 1.2s' },
      { id: 3, intent: 'turn', slots: { direction: 'left', degrees: 135 }, raw: 'turn left 135°' },
      { id: 4, intent: 'move', slots: { direction: 'forward', duration: 0.8 }, raw: 'move forward 0.8s' },
      { id: 5, intent: 'turn', slots: { direction: 'right', degrees: 90 }, raw: 'turn right 90°' },
      { id: 6, intent: 'move', slots: { direction: 'forward', duration: 1 }, raw: 'move forward 1s' },
      { id: 7, intent: 'stop', slots: {}, raw: 'stop' },
    ],
    obstacles: [
      { id: 'o1', type: 'barrier', x: 250, y: 130 },
      { id: 'o2', type: 'barrier', x: 130, y: 240 },
      { id: 'o3', type: 'goal', x: 300, y: 300 },
    ],
  },
  action: {
    commands: [
      { id: 0, intent: 'move', slots: { direction: 'forward', duration: 0.5 }, raw: 'move forward 0.5s' },
      { id: 1, intent: 'beep', slots: {}, raw: 'beep' },
      { id: 2, intent: 'say', slots: { phrase: 'hello' }, raw: 'say hello' },
      { id: 3, intent: 'light', slots: { color: 'blue' }, raw: 'light blue' },
      { id: 4, intent: 'light', slots: { color: 'green' }, raw: 'light green' },
      { id: 5, intent: 'light_off', slots: {}, raw: 'lights off' },
      { id: 6, intent: 'move', slots: { direction: 'forward', duration: 0.5 }, raw: 'move forward 0.5s' },
      { id: 7, intent: 'turn', slots: { direction: 'right', degrees: 180 }, raw: 'turn right 180°' },
      { id: 8, intent: 'move', slots: { direction: 'forward', duration: 0.5 }, raw: 'move forward 0.5s' },
      { id: 9, intent: 'stop', slots: {}, raw: 'stop' },
    ],
    obstacles: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════════

let game: Phaser.Game | null = null;
let currentMode: 'edit' | 'play' = 'edit';
let currentDemo = 'square';
let worldSize = 400;

// Obstacles built in edit mode, carried over to play mode
let builtObstacles: ObstacleConfig[] = [];

// ═══════════════════════════════════════════════════════════════════════════════
// Phaser game boot
// ═══════════════════════════════════════════════════════════════════════════════

function buildPhaserConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.WEBGL,
    pixelArt: true,
    roundPixels: true,
    parent: 'game-container',
    width: worldSize,
    height: worldSize,
    backgroundColor: '#0a1628',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0, x: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
}

function bootEditMode(): void {
  destroyGame();

  game = new Phaser.Game(buildPhaserConfig());

  // Register scenes
  game.scene.add(SCENE_KEYS.ROBOT_PRELOAD_SCENE, RobotPreloadScene);
  game.scene.add(SCENE_KEYS.ROBOT_WORLD_BUILDER_SCENE, WorldBuilderScene);

  // Start preload → on complete, it tries to start ROBOT_SCENE.
  // We intercept by providing a custom scene-data callback
  // Actually, the preload scene transitions to ROBOT_SCENE. For edit mode
  // we want to go to WORLD_BUILDER instead. So we use a simple approach:
  // add ROBOT_SCENE as a dummy, and launch world builder after preload.
  game.scene.add(SCENE_KEYS.ROBOT_SCENE, class extends Phaser.Scene {
    constructor() { super({ key: SCENE_KEYS.ROBOT_SCENE }); }
    create() {
      // In edit mode, immediately switch to world builder
      this.scene.stop(SCENE_KEYS.ROBOT_SCENE);
      this.scene.start(SCENE_KEYS.ROBOT_WORLD_BUILDER_SCENE, {
        worldSize,
        obstacles: builtObstacles,
      });
    }
  });
  game.scene.add(SCENE_KEYS.ROBOT_UI_SCENE, class extends Phaser.Scene {
    constructor() { super({ key: SCENE_KEYS.ROBOT_UI_SCENE }); }
  });

  const sceneData: RobotSceneData = {
    commands: [],
    obstacles: [],
    robotConfig: { chassisKey: 'rover', color: '#4fc3f7' },
    worldSize,
  };

  game.scene.start(SCENE_KEYS.ROBOT_PRELOAD_SCENE, sceneData);
  updateStatus('Edit mode — click to place obstacles');
}

function bootPlayMode(): void {
  destroyGame();

  const demo = DEMO_PROGRAMS[currentDemo];
  // Use built obstacles if we have them; otherwise use demo obstacles
  const obstacles = builtObstacles.length > 0 ? builtObstacles : (demo?.obstacles || []);

  const sceneData: RobotSceneData = {
    commands: demo?.commands || [],
    obstacles,
    robotConfig: { chassisKey: 'rover', color: '#4fc3f7' },
    worldSize,
  };

  game = new Phaser.Game(buildPhaserConfig());
  game.scene.add(SCENE_KEYS.ROBOT_PRELOAD_SCENE, RobotPreloadScene);
  game.scene.add(SCENE_KEYS.ROBOT_SCENE, RobotScene);
  game.scene.add(SCENE_KEYS.ROBOT_UI_SCENE, RobotUIScene);
  game.scene.start(SCENE_KEYS.ROBOT_PRELOAD_SCENE, sceneData);

  updateStatus('Running...');
}

function destroyGame(): void {
  if (game) {
    game.destroy(true);
    game = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Status updates
// ═══════════════════════════════════════════════════════════════════════════════

function updateStatus(text: string): void {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

ROBOT_EVENT_BUS.on(ROBOT_EVENTS.ALL_COMMANDS_DONE, () => updateStatus('✓ Complete'));
ROBOT_EVENT_BUS.on(ROBOT_EVENTS.GOAL_REACHED, () => updateStatus('🏁 Goal reached!'));
ROBOT_EVENT_BUS.on(ROBOT_EVENTS.COMMAND_START, (cmd: CommandPrimitive) => {
  updateStatus(`Running: ${cmd.raw || cmd.intent}`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Save / Load (localStorage)
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'robot_sim_world';

function saveWorld(obstacles: ObstacleConfig[]): void {
  const data = { worldSize, obstacles };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateStatus(`Saved ${obstacles.length} obstacles`);
}

function loadWorld(): ObstacleConfig[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { updateStatus('No saved world found'); return null; }
  try {
    const data = JSON.parse(raw);
    if (data.worldSize) {
      worldSize = data.worldSize;
      const gridInput = document.getElementById('grid-size') as HTMLInputElement;
      if (gridInput) gridInput.value = String(worldSize);
    }
    return data.obstacles || [];
  } catch {
    updateStatus('Error loading saved world');
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Palette generation
// ═══════════════════════════════════════════════════════════════════════════════

function buildPalette(): void {
  const container = document.getElementById('obstacle-palette');
  if (!container) return;
  container.innerHTML = '';

  for (const [key, def] of Object.entries(OBSTACLE_TYPE_DEFS)) {
    const btn = document.createElement('button');

    // Color swatch
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = '#' + def.color.toString(16).padStart(6, '0');
    btn.appendChild(swatch);

    // Label
    const label = document.createTextNode(def.label);
    btn.appendChild(label);

    btn.dataset.type = key;
    btn.addEventListener('click', () => {
      // Deselect all palette buttons
      container.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      // Set tool
      ROBOT_EVENT_BUS.emit(WB_EVENTS.PLACE_TOOL, key);
      updateStatus(`Placing: ${def.label}`);
      // Deactivate delete mode button
      document.getElementById('btn-delete')?.classList.remove('active');
    });

    container.appendChild(btn);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI wiring
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar')!;
  const btnModeEdit = document.getElementById('btn-mode-edit')!;
  const btnModePlay = document.getElementById('btn-mode-play')!;
  const select = document.getElementById('demo-select') as HTMLSelectElement;
  const btnRun = document.getElementById('btn-run')!;
  const btnReset = document.getElementById('btn-reset')!;
  const btnPointer = document.getElementById('btn-pointer')!;
  const btnDelete = document.getElementById('btn-delete')!;
  const btnClearAll = document.getElementById('btn-clear-all')!;
  const btnSave = document.getElementById('btn-save')!;
  const btnLoad = document.getElementById('btn-load')!;
  const btnExportJson = document.getElementById('btn-export-json')!;
  const gridSizeInput = document.getElementById('grid-size') as HTMLInputElement;

  // ── Build obstacle palette ───────────────────────────────────────────────
  buildPalette();

  // ── Mode switching ───────────────────────────────────────────────────────

  function setMode(mode: 'edit' | 'play'): void {
    currentMode = mode;

    btnModeEdit.classList.toggle('active', mode === 'edit');
    btnModePlay.classList.toggle('active', mode === 'play');
    sidebar.className = mode === 'edit' ? 'edit-mode' : 'play-mode';

    if (mode === 'edit') {
      // Before switching to edit, export obstacles from play scene if it was running
      bootEditMode();
    } else {
      // Before switching to play, export obstacles from world builder
      exportFromWorldBuilder(() => {
        bootPlayMode();
      });
    }
  }

  function exportFromWorldBuilder(callback: () => void): void {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      ROBOT_EVENT_BUS.off(WB_EVENTS.WORLD_DATA, onData);
      callback();
    };
    const onData = (obstacles: ObstacleConfig[]) => {
      builtObstacles = obstacles;
      finish();
    };
    ROBOT_EVENT_BUS.on(WB_EVENTS.WORLD_DATA, onData);
    ROBOT_EVENT_BUS.emit(WB_EVENTS.EXPORT);

    // If the scene isn't running (no listener), the callback won't fire.
    // Set a timeout fallback.
    setTimeout(finish, 100);
  }

  btnModeEdit.addEventListener('click', () => setMode('edit'));
  btnModePlay.addEventListener('click', () => setMode('play'));

  // ── Play-mode controls ──────────────────────────────────────────────────

  select.addEventListener('change', () => {
    currentDemo = select.value;
    if (currentMode === 'play') {
      bootPlayMode();
    }
  });

  btnRun.addEventListener('click', () => {
    if (currentMode === 'play' && game) {
      ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.RESET);
      setTimeout(() => {
        const robotScene = game!.scene.getScene(SCENE_KEYS.ROBOT_SCENE) as RobotScene;
        if (robotScene && robotScene.scene.isActive()) {
          const demo = DEMO_PROGRAMS[currentDemo];
          robotScene.updateCommands(demo.commands);
          updateStatus('Running...');
        }
      }, 100);
    }
  });

  btnReset.addEventListener('click', () => {
    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.RESET);
    updateStatus('Reset');
  });

  // ── Edit-mode controls ──────────────────────────────────────────────────

  btnPointer.addEventListener('click', () => {
    // Deselect palette buttons
    document.getElementById('obstacle-palette')
      ?.querySelectorAll('button')
      .forEach(b => b.classList.remove('selected'));
    btnDelete.classList.remove('active');

    // Tell the world builder to clear the current tool
    ROBOT_EVENT_BUS.emit(WB_EVENTS.PLACE_TOOL, null as unknown as string);
    updateStatus('Pointer mode');
  });

  btnDelete.addEventListener('click', () => {
    // Deselect palette buttons
    document.getElementById('obstacle-palette')
      ?.querySelectorAll('button')
      .forEach(b => b.classList.remove('selected'));
    btnDelete.classList.toggle('active');

    if (btnDelete.classList.contains('active')) {
      ROBOT_EVENT_BUS.emit(WB_EVENTS.DELETE_TOOL);
      updateStatus('Delete mode — click to remove');
    } else {
      ROBOT_EVENT_BUS.emit(WB_EVENTS.PLACE_TOOL, null as unknown as string);
      updateStatus('Pointer mode');
    }
  });

  btnClearAll.addEventListener('click', () => {
    if (confirm('Clear all obstacles?')) {
      ROBOT_EVENT_BUS.emit(WB_EVENTS.CLEAR);
      builtObstacles = [];
      updateStatus('Cleared');
    }
  });

  // ── Grid size ───────────────────────────────────────────────────────────

  gridSizeInput.addEventListener('change', () => {
    const val = parseInt(gridSizeInput.value, 10);
    if (val >= 200 && val <= 1200) {
      worldSize = val;
      ROBOT_EVENT_BUS.emit(WB_EVENTS.GRID_SIZE, worldSize);
      // Restart edit mode with new size
      bootEditMode();
    }
  });

  // ── Save / Load / Export ────────────────────────────────────────────────

  btnSave.addEventListener('click', () => {
    exportFromWorldBuilder(() => {
      saveWorld(builtObstacles);
    });
  });

  btnLoad.addEventListener('click', () => {
    const obstacles = loadWorld();
    if (obstacles) {
      builtObstacles = obstacles;
      ROBOT_EVENT_BUS.emit(WB_EVENTS.IMPORT, obstacles);
      updateStatus(`Loaded ${obstacles.length} obstacles`);
      if (currentMode === 'edit') {
        bootEditMode();
      }
    }
  });

  btnExportJson.addEventListener('click', () => {
    exportFromWorldBuilder(() => {
      const json = JSON.stringify({ worldSize, obstacles: builtObstacles }, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        updateStatus('World JSON copied to clipboard');
      }).catch(() => {
        // Fallback: log to console
        console.log('World JSON:', json);
        updateStatus('JSON logged to console (clipboard failed)');
      });
    });
  });

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (currentMode === 'edit') {
          ROBOT_EVENT_BUS.emit(WB_EVENTS.DELETE_TOOL);
          btnDelete.classList.add('active');
          updateStatus('Delete mode — click to remove');
        }
        break;
      case 'Escape':
        if (currentMode === 'edit') {
          btnPointer.click();
        }
        break;
      case ' ':
        e.preventDefault();
        if (currentMode === 'play') {
          btnRun.click();
        }
        break;
    }
  });

  // ── Boot default mode ──────────────────────────────────────────────────
  bootEditMode();
});
