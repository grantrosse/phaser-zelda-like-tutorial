import * as Phaser from 'phaser';
import { ROBOT_TEXTURE_KEYS } from '../robot-constants';

/**
 * GrabbableObject -- can be picked up by the robot's claw.
 * Requires claw to be closed while near the object.
 */
export class GrabbableObject extends Phaser.Physics.Arcade.Sprite {
  private _isGrabbed = false;
  private _originalX: number;
  private _originalY: number;
  private _objColor: string;

  constructor(scene: Phaser.Scene, x: number, y: number, color?: string) {
    super(scene, x, y, ROBOT_TEXTURE_KEYS.GRABBABLE);

    this._originalX = x;
    this._originalY = y;
    this._objColor = color || '#e91e63';

    // Tint the grabbable to match its assigned color
    const colorNum = Phaser.Display.Color.HexStringToColor(this._objColor).color;
    this.setTint(colorNum);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static

    this.setData('obstacleType', 'grabbable');
    this.setData('requires', { claw: true, clawOpen: false });
    this.setData('color', this._objColor);
  }

  get isGrabbed(): boolean {
    return this._isGrabbed;
  }

  get objColor(): string {
    return this._objColor;
  }

  public grab(): void {
    this._isGrabbed = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.setVisible(false);
  }

  public release(x: number, y: number): void {
    this._isGrabbed = false;
    this.setPosition(x, y);
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    this.setVisible(true);
  }

  public resetPosition(): void {
    this._isGrabbed = false;
    this.setPosition(this._originalX, this._originalY);
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    this.setVisible(true);
  }
}
