import * as Phaser from 'phaser';
import { ROBOT_TEXTURE_KEYS } from '../robot-constants';

/**
 * Barrier -- an immovable obstacle that blocks the robot's path.
 * Covers barrier, wall_h, and wall_v types from OBSTACLE_TYPES.
 */
export class Barrier extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    obstacleType: string,
  ) {
    // Choose texture based on obstacle type
    let textureKey = ROBOT_TEXTURE_KEYS.BARRIER;
    if (obstacleType === 'wall_h') textureKey = ROBOT_TEXTURE_KEYS.WALL_H;
    if (obstacleType === 'wall_v') textureKey = ROBOT_TEXTURE_KEYS.WALL_V;

    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.setImmovable(true);
  }
}
