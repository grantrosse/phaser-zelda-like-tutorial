/**
 * WorldBuilderScene — interactive edit mode for placing / moving / deleting
 * obstacles on the grid.
 *
 * Communication with the HTML UI happens through the ROBOT_EVENT_BUS:
 *   WB_PLACE_TOOL  → sets the current placement tool type (string)
 *   WB_DELETE_TOOL → enables delete-on-click mode
 *   WB_CLEAR       → removes every obstacle
 *   WB_EXPORT      → emits WB_WORLD_DATA with the current obstacle list
 *   WB_IMPORT      → receives an obstacle list and rebuilds the world
 *   WB_WORLD_DATA  → emitted with ObstacleConfig[] when export is requested
 *   WB_GRID_SIZE   → changes the world size (px)
 */

import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../scenes/scene-keys';
import {
  ROBOT_EVENT_BUS,
  ObstacleConfig,
} from './robot-events';
import {
  ROBOT_TEXTURE_KEYS,
  ROBOT_COLORS,
  OBSTACLE_TYPE_DEFS,
  ObstacleTypeDef,
  GRID_CELL_SIZE,
  DEFAULT_WORLD_SIZE,
} from './robot-constants';

// ─── World-builder event constants ──────────────────────────────────────────

export const WB_EVENTS = {
  PLACE_TOOL: 'WB_PLACE_TOOL',
  DELETE_TOOL: 'WB_DELETE_TOOL',
  CLEAR: 'WB_CLEAR',
  EXPORT: 'WB_EXPORT',
  IMPORT: 'WB_IMPORT',
  WORLD_DATA: 'WB_WORLD_DATA',
  GRID_SIZE: 'WB_GRID_SIZE',
  OBSTACLE_SELECTED: 'WB_OBSTACLE_SELECTED',
  OBSTACLE_DESELECTED: 'WB_OBSTACLE_DESELECTED',
} as const;

// ─── Placed-obstacle record ─────────────────────────────────────────────────

type PlacedObstacle = {
  sprite: Phaser.GameObjects.Sprite;
  config: ObstacleConfig;
};

// ─── Scene ──────────────────────────────────────────────────────────────────

export class WorldBuilderScene extends Phaser.Scene {
  private _worldSize = DEFAULT_WORLD_SIZE;
  private _gridGraphics!: Phaser.GameObjects.Graphics;

  // Obstacle tracking
  private _placedObstacles: PlacedObstacle[] = [];
  private _nextId = 1;

  // Current tool
  private _currentTool: string | null = null; // obstacle type key or null
  private _isDeleteMode = false;

  // Drag state
  private _dragTarget: PlacedObstacle | null = null;
  private _dragOffsetX = 0;
  private _dragOffsetY = 0;

  // Selection highlight
  private _selectionHighlight!: Phaser.GameObjects.Graphics;
  private _selectedObstacle: PlacedObstacle | null = null;

  // Ghost preview while placing
  private _ghostSprite: Phaser.GameObjects.Sprite | null = null;

  constructor() {
    super({ key: SCENE_KEYS.ROBOT_WORLD_BUILDER_SCENE });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════════════════════════════

  public init(data?: { worldSize?: number; obstacles?: ObstacleConfig[] }): void {
    if (data?.worldSize) this._worldSize = data.worldSize;
  }

  public create(data?: { obstacles?: ObstacleConfig[] }): void {
    // Configure world bounds
    this.physics.world.setBounds(0, 0, this._worldSize, this._worldSize);

    // Draw the grid
    this.#drawGrid();

    // Selection highlight graphics
    this._selectionHighlight = this.add.graphics();
    this._selectionHighlight.setDepth(50);

    // Import initial obstacles if provided
    if (data?.obstacles && data.obstacles.length > 0) {
      this.#importObstacles(data.obstacles);
    }

    // Set up camera
    this.cameras.main.setBounds(0, 0, this._worldSize, this._worldSize);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(this._worldSize / 2, this._worldSize / 2);

    // Input handlers
    this.input.on('pointerdown', this.#onPointerDown, this);
    this.input.on('pointermove', this.#onPointerMove, this);
    this.input.on('pointerup', this.#onPointerUp, this);

    // Event bus handlers
    ROBOT_EVENT_BUS.on(WB_EVENTS.PLACE_TOOL, this.#onPlaceTool, this);
    ROBOT_EVENT_BUS.on(WB_EVENTS.DELETE_TOOL, this.#onDeleteTool, this);
    ROBOT_EVENT_BUS.on(WB_EVENTS.CLEAR, this.#onClear, this);
    ROBOT_EVENT_BUS.on(WB_EVENTS.EXPORT, this.#onExport, this);
    ROBOT_EVENT_BUS.on(WB_EVENTS.IMPORT, this.#onImportEvent, this);
    ROBOT_EVENT_BUS.on(WB_EVENTS.GRID_SIZE, this.#onGridSize, this);
  }

  public shutdown(): void {
    ROBOT_EVENT_BUS.off(WB_EVENTS.PLACE_TOOL, this.#onPlaceTool, this);
    ROBOT_EVENT_BUS.off(WB_EVENTS.DELETE_TOOL, this.#onDeleteTool, this);
    ROBOT_EVENT_BUS.off(WB_EVENTS.CLEAR, this.#onClear, this);
    ROBOT_EVENT_BUS.off(WB_EVENTS.EXPORT, this.#onExport, this);
    ROBOT_EVENT_BUS.off(WB_EVENTS.IMPORT, this.#onImportEvent, this);
    ROBOT_EVENT_BUS.off(WB_EVENTS.GRID_SIZE, this.#onGridSize, this);
    this.#destroyGhost();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Grid
  // ════════════════════════════════════════════════════════════════════════════

  #drawGrid(): void {
    if (this._gridGraphics) this._gridGraphics.destroy();
    this._gridGraphics = this.add.graphics();
    this._gridGraphics.setDepth(-5);

    // Background
    this._gridGraphics.fillStyle(ROBOT_COLORS.gridBg, 1);
    this._gridGraphics.fillRect(0, 0, this._worldSize, this._worldSize);

    // Grid lines
    this._gridGraphics.lineStyle(1, ROBOT_COLORS.gridLine, 0.5);
    const cells = this._worldSize / GRID_CELL_SIZE;
    for (let i = 0; i <= cells; i++) {
      const pos = i * GRID_CELL_SIZE;
      this._gridGraphics.lineBetween(pos, 0, pos, this._worldSize);
      this._gridGraphics.lineBetween(0, pos, this._worldSize, pos);
    }

    // Border
    this._gridGraphics.lineStyle(2, 0x2a4a6a, 0.8);
    this._gridGraphics.strokeRect(0, 0, this._worldSize, this._worldSize);

    // Cell labels
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        this.add
          .text(c * GRID_CELL_SIZE + 4, r * GRID_CELL_SIZE + 4, `${c},${r}`, {
            fontSize: '8px',
            color: '#2a3a5a',
          })
          .setDepth(-4);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Obstacle placement / removal
  // ════════════════════════════════════════════════════════════════════════════

  #placeObstacle(type: string, worldX: number, worldY: number, id?: string, color?: string): PlacedObstacle | null {
    const def = OBSTACLE_TYPE_DEFS[type] as ObstacleTypeDef | undefined;
    if (!def) return null;

    // Snap to grid center
    const snappedX = Math.round(worldX / (GRID_CELL_SIZE / 2)) * (GRID_CELL_SIZE / 2);
    const snappedY = Math.round(worldY / (GRID_CELL_SIZE / 2)) * (GRID_CELL_SIZE / 2);

    // Clamp to world bounds
    const x = Phaser.Math.Clamp(snappedX, def.width / 2, this._worldSize - def.width / 2);
    const y = Phaser.Math.Clamp(snappedY, def.height / 2, this._worldSize - def.height / 2);

    const obsId = id || `obs_${this._nextId++}`;

    const sprite = this.add.sprite(x, y, def.textureKey);
    sprite.setDepth(2);
    sprite.setInteractive({ draggable: false });
    // Tint color zones by their color
    if (type === 'color_zone' && color) {
      const tintColor = Phaser.Display.Color.HexStringToColor(color).color;
      sprite.setTint(tintColor);
    }

    const config: ObstacleConfig = {
      id: obsId,
      type,
      x,
      y,
      color,
    };

    const placed: PlacedObstacle = { sprite, config };
    this._placedObstacles.push(placed);
    return placed;
  }

  #removeObstacle(placed: PlacedObstacle): void {
    placed.sprite.destroy();
    const idx = this._placedObstacles.indexOf(placed);
    if (idx !== -1) this._placedObstacles.splice(idx, 1);
    if (this._selectedObstacle === placed) {
      this._selectedObstacle = null;
      this._selectionHighlight.clear();
      ROBOT_EVENT_BUS.emit(WB_EVENTS.OBSTACLE_DESELECTED);
    }
  }

  #clearAll(): void {
    for (const p of this._placedObstacles) {
      p.sprite.destroy();
    }
    this._placedObstacles = [];
    this._selectedObstacle = null;
    this._selectionHighlight.clear();
    this._nextId = 1;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Ghost preview
  // ════════════════════════════════════════════════════════════════════════════

  #createGhost(type: string): void {
    this.#destroyGhost();
    const def = OBSTACLE_TYPE_DEFS[type] as ObstacleTypeDef | undefined;
    if (!def) return;
    this._ghostSprite = this.add.sprite(-100, -100, def.textureKey);
    this._ghostSprite.setAlpha(0.4);
    this._ghostSprite.setDepth(40);
  }

  #destroyGhost(): void {
    if (this._ghostSprite) {
      this._ghostSprite.destroy();
      this._ghostSprite = null;
    }
  }

  #updateGhostPosition(worldX: number, worldY: number): void {
    if (!this._ghostSprite) return;
    const snappedX = Math.round(worldX / (GRID_CELL_SIZE / 2)) * (GRID_CELL_SIZE / 2);
    const snappedY = Math.round(worldY / (GRID_CELL_SIZE / 2)) * (GRID_CELL_SIZE / 2);
    this._ghostSprite.setPosition(snappedX, snappedY);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Selection highlight
  // ════════════════════════════════════════════════════════════════════════════

  #highlightSelected(): void {
    this._selectionHighlight.clear();
    if (!this._selectedObstacle) return;
    const s = this._selectedObstacle.sprite;
    const hw = s.displayWidth / 2 + 4;
    const hh = s.displayHeight / 2 + 4;
    this._selectionHighlight.lineStyle(2, 0xffee58, 0.9);
    this._selectionHighlight.strokeRect(s.x - hw, s.y - hh, hw * 2, hh * 2);
    // Corner dots
    this._selectionHighlight.fillStyle(0xffee58, 1);
    for (const [dx, dy] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) {
      this._selectionHighlight.fillCircle(s.x + dx, s.y + dy, 3);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Input handlers
  // ════════════════════════════════════════════════════════════════════════════

  #onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Out of bounds?
    if (worldX < 0 || worldY < 0 || worldX > this._worldSize || worldY > this._worldSize) return;

    // Check if clicking on an existing obstacle
    const hit = this.#hitTest(worldX, worldY);

    if (this._isDeleteMode && hit) {
      this.#removeObstacle(hit);
      return;
    }

    if (hit && !this._currentTool) {
      // Select & start dragging
      this._selectedObstacle = hit;
      this._dragTarget = hit;
      this._dragOffsetX = worldX - hit.sprite.x;
      this._dragOffsetY = worldY - hit.sprite.y;
      this.#highlightSelected();
      ROBOT_EVENT_BUS.emit(WB_EVENTS.OBSTACLE_SELECTED, hit.config);
      return;
    }

    // Place new obstacle
    if (this._currentTool) {
      const placed = this.#placeObstacle(this._currentTool, worldX, worldY);
      if (placed) {
        this._selectedObstacle = placed;
        this.#highlightSelected();
        ROBOT_EVENT_BUS.emit(WB_EVENTS.OBSTACLE_SELECTED, placed.config);
      }
      return;
    }

    // Deselect
    if (!hit) {
      this._selectedObstacle = null;
      this._selectionHighlight.clear();
      ROBOT_EVENT_BUS.emit(WB_EVENTS.OBSTACLE_DESELECTED);
    }
  };

  #onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Update ghost
    if (this._currentTool && !pointer.isDown) {
      this.#updateGhostPosition(worldX, worldY);
    }

    // Drag
    if (this._dragTarget && pointer.isDown) {
      const snappedX = Math.round((worldX - this._dragOffsetX) / (GRID_CELL_SIZE / 2)) * (GRID_CELL_SIZE / 2);
      const snappedY = Math.round((worldY - this._dragOffsetY) / (GRID_CELL_SIZE / 2)) * (GRID_CELL_SIZE / 2);
      const def = OBSTACLE_TYPE_DEFS[this._dragTarget.config.type];
      const w = def ? def.width : 40;
      const h = def ? def.height : 40;
      const x = Phaser.Math.Clamp(snappedX, w / 2, this._worldSize - w / 2);
      const y = Phaser.Math.Clamp(snappedY, h / 2, this._worldSize - h / 2);
      this._dragTarget.sprite.setPosition(x, y);
      this._dragTarget.config.x = x;
      this._dragTarget.config.y = y;
      this.#highlightSelected();
    }
  };

  #onPointerUp = (): void => {
    this._dragTarget = null;
  };

  #hitTest(worldX: number, worldY: number): PlacedObstacle | null {
    // Check from top (latest placed) to bottom
    for (let i = this._placedObstacles.length - 1; i >= 0; i--) {
      const p = this._placedObstacles[i];
      const s = p.sprite;
      const hw = s.displayWidth / 2;
      const hh = s.displayHeight / 2;
      if (
        worldX >= s.x - hw && worldX <= s.x + hw &&
        worldY >= s.y - hh && worldY <= s.y + hh
      ) {
        return p;
      }
    }
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Event bus handlers
  // ════════════════════════════════════════════════════════════════════════════

  #onPlaceTool = (type: string | null): void => {
    this._currentTool = type;
    this._isDeleteMode = false;
    if (type) {
      this.#createGhost(type);
    } else {
      this.#destroyGhost();
    }
    // Deselect
    this._selectedObstacle = null;
    this._selectionHighlight.clear();
  };

  #onDeleteTool = (): void => {
    this._isDeleteMode = true;
    this._currentTool = null;
    this.#destroyGhost();
    this._selectedObstacle = null;
    this._selectionHighlight.clear();
  };

  #onClear = (): void => {
    this.#clearAll();
  };

  #onExport = (): void => {
    const obstacles = this._placedObstacles.map(p => ({ ...p.config }));
    ROBOT_EVENT_BUS.emit(WB_EVENTS.WORLD_DATA, obstacles);
  };

  #onImportEvent = (obstacles: ObstacleConfig[]): void => {
    this.#importObstacles(obstacles);
  };

  #onGridSize = (size: number): void => {
    this._worldSize = size;
    this.physics.world.setBounds(0, 0, size, size);
    this.cameras.main.setBounds(0, 0, size, size);
    this.cameras.main.centerOn(size / 2, size / 2);
    this.#drawGrid();
  };

  #importObstacles(obstacles: ObstacleConfig[]): void {
    this.#clearAll();
    for (const obs of obstacles) {
      this.#placeObstacle(obs.type, obs.x, obs.y, obs.id, obs.color);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Public API
  // ════════════════════════════════════════════════════════════════════════════

  /** Get the current obstacle list */
  public getObstacles(): ObstacleConfig[] {
    return this._placedObstacles.map(p => ({ ...p.config }));
  }

  /** Reset the current tool (pointer mode) */
  public clearTool(): void {
    this._currentTool = null;
    this._isDeleteMode = false;
    this.#destroyGhost();
  }
}
