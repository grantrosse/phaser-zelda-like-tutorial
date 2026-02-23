import * as Phaser from 'phaser';
import { ROBOT_TEXTURE_KEYS } from '../robot-constants';

/**
 * LiftableObject -- can be picked up by the robot's arm.
 * Requires arm angle >= 45 to lift (checked by the scene).
 * Reuses the InteractiveObjectComponent pattern from the Zelda game's Pot.
 */
export class LiftableObject extends Phaser.Physics.Arcade.Sprite {
  private _isLifted = false;
  private _originalX: number;
  private _originalY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ROBOT_TEXTURE_KEYS.LIFTABLE);

    this._originalX = x;
    this._originalY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static

    this.setData('obstacleType', 'liftable');
    this.setData('requires', { arm: true, armAngleMin: 45 });
  }

  get isLifted(): boolean {
    return this._isLifted;
  }

  public lift(): void {
    this._isLifted = true;
    // Disable physics body while carried
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.setVisible(false);
  }

  public drop(x: number, y: number): void {
    this._isLifted = false;
    this.setPosition(x, y);
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    this.setVisible(true);
  }

  public resetPosition(): void {
    this._isLifted = false;
    this.setPosition(this._originalX, this._originalY);
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    this.setVisible(true);
  }
}
