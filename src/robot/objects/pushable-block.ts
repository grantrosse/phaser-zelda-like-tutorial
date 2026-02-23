import * as Phaser from 'phaser';
import { ROBOT_TEXTURE_KEYS } from '../robot-constants';
import { ROBOT_EVENT_BUS, ROBOT_EVENTS } from '../robot-events';

/**
 * PushableBlock -- a movable physics body that the robot can push.
 * Has drag so it stops when the robot is no longer pushing.
 */
export class PushableBlock extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ROBOT_TEXTURE_KEYS.PUSHABLE);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0);
    body.setDrag(200, 200);
    body.setMaxVelocity(60, 60);
    body.setImmovable(false);

    // Tag for identification
    this.setData('obstacleType', 'pushable');
  }

  public update(): void {
    // Emit push event when this block is being moved
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(body.velocity.x) > 5 || Math.abs(body.velocity.y) > 5) {
      ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.OBJECT_PUSHED, this);
    }
  }
}
