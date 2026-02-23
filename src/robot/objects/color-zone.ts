import * as Phaser from 'phaser';
import { ROBOT_TEXTURE_KEYS } from '../robot-constants';

/**
 * ColorZone -- a floor zone with a color property.
 * The robot's color sensor reads the zone's color when overlapping.
 * Non-solid, drawn below other objects.
 */
export class ColorZone extends Phaser.Physics.Arcade.Sprite {
  private _zoneColor: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: string,
    width?: number,
    height?: number,
  ) {
    super(scene, x, y, ROBOT_TEXTURE_KEYS.COLOR_ZONE);

    this._zoneColor = color;

    // Tint to the assigned color
    const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
    this.setTint(colorNum);

    // Scale to specified size if provided
    if (width) this.displayWidth = width;
    if (height) this.displayHeight = height;

    scene.add.existing(this);
    // Not added to physics -- we use manual overlap detection in sensor
    this.setDepth(-2); // Below everything

    // Store color for sensor reading
    this.setData('obstacleType', 'color_zone');
    this.setData('zoneColor', color);
  }

  get zoneColor(): string {
    return this._zoneColor;
  }
}
