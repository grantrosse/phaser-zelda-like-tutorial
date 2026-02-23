import * as Phaser from 'phaser';

/**
 * RobotSensorComponent provides sensor methods for the robot:
 * - checkCollisionAhead(): raycast-like check for walls/obstacles ahead
 * - readColorBelow(): overlap check with ColorZone objects
 * - readDistance(): distance to nearest obstacle in heading direction
 */
export class RobotSensorComponent {
  private _scene: Phaser.Scene;
  private _sprite: Phaser.Physics.Arcade.Sprite;
  private _obstacles: Phaser.Physics.Arcade.StaticGroup | Phaser.Physics.Arcade.Group | null = null;
  private _colorZones: Phaser.GameObjects.Sprite[] = [];
  private _sensorRange = 200; // pixels, max range for distance sensor

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this._scene = scene;
    this._sprite = sprite;
  }

  // ── Configuration ─────────────────────────────────────────────────────────

  public setObstacles(obstacles: Phaser.Physics.Arcade.StaticGroup | Phaser.Physics.Arcade.Group): void {
    this._obstacles = obstacles;
  }

  public setColorZones(zones: Phaser.GameObjects.Sprite[]): void {
    this._colorZones = zones;
  }

  public setSensorRange(range: number): void {
    this._sensorRange = range;
  }

  // ── Sensor methods ────────────────────────────────────────────────────────

  /**
   * Check if there's a collision within a short distance ahead of the robot.
   * Uses a point-in-body check along the heading direction.
   */
  public checkCollisionAhead(heading: number, checkDistance = 30): boolean {
    if (!this._obstacles) return false;

    const startX = this._sprite.x;
    const startY = this._sprite.y;
    const bodies = this._obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[];

    // Check several points along the heading direction
    for (let d = 10; d <= checkDistance; d += 5) {
      const px = startX + Math.cos(heading) * d;
      const py = startY + Math.sin(heading) * d;

      for (const obj of bodies) {
        if (!obj.active || !obj.body) continue;
        const body = obj.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
        if (this.#pointInBody(px, py, body)) {
          return true;
        }
      }

      // Also check world bounds
      const worldBounds = this._scene.physics.world.bounds;
      if (
        px <= worldBounds.x ||
        px >= worldBounds.x + worldBounds.width ||
        py <= worldBounds.y ||
        py >= worldBounds.y + worldBounds.height
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Read the color of any ColorZone the robot is currently overlapping.
   * Returns the color string or null if not on a color zone.
   */
  public readColorBelow(): string | null {
    const rx = this._sprite.x;
    const ry = this._sprite.y;

    for (const zone of this._colorZones) {
      if (!zone.active) continue;
      const zoneData = zone.getData('zoneColor') as string | undefined;
      if (!zoneData) continue;

      // Simple AABB overlap check
      const hw = (zone.displayWidth || zone.width) / 2;
      const hh = (zone.displayHeight || zone.height) / 2;
      if (
        rx >= zone.x - hw &&
        rx <= zone.x + hw &&
        ry >= zone.y - hh &&
        ry <= zone.y + hh
      ) {
        return zoneData;
      }
    }

    return null;
  }

  /**
   * Read the distance to the nearest obstacle in the heading direction.
   * Returns distance in pixels, or Infinity if nothing in range.
   */
  public readDistance(heading: number): number {
    if (!this._obstacles) return Infinity;

    const startX = this._sprite.x;
    const startY = this._sprite.y;
    const bodies = this._obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[];

    let minDist = Infinity;

    // Step along the heading direction
    for (let d = 10; d <= this._sensorRange; d += 3) {
      const px = startX + Math.cos(heading) * d;
      const py = startY + Math.sin(heading) * d;

      // Check world bounds first
      const worldBounds = this._scene.physics.world.bounds;
      if (
        px <= worldBounds.x ||
        px >= worldBounds.x + worldBounds.width ||
        py <= worldBounds.y ||
        py >= worldBounds.y + worldBounds.height
      ) {
        minDist = Math.min(minDist, d);
        break;
      }

      for (const obj of bodies) {
        if (!obj.active || !obj.body) continue;
        const body = obj.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
        if (this.#pointInBody(px, py, body)) {
          minDist = Math.min(minDist, d);
          break;
        }
      }

      if (minDist < Infinity) break;
    }

    return minDist;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  #pointInBody(px: number, py: number, body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): boolean {
    return (
      px >= body.x &&
      px <= body.x + body.width &&
      py >= body.y &&
      py <= body.y + body.height
    );
  }
}
