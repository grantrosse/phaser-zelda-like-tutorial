import * as Phaser from 'phaser';
import { ROBOT_TEXTURE_KEYS } from '../robot-constants';
import { ROBOT_EVENT_BUS, ROBOT_EVENTS } from '../robot-events';

/**
 * GoalZone -- overlap trigger that emits GOAL_REACHED when the robot enters.
 * Non-solid (no physics collision), just an overlap zone.
 */
export class GoalZone extends Phaser.Physics.Arcade.Sprite {
  private _reached = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ROBOT_TEXTURE_KEYS.GOAL_ZONE);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static for overlap detection

    // Goal is not solid -- overlap only
    this.setData('obstacleType', 'goal');
    this.setDepth(-1); // Below robot and obstacles
  }

  get isReached(): boolean {
    return this._reached;
  }

  public onRobotOverlap(): void {
    if (!this._reached) {
      this._reached = true;
      ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.GOAL_REACHED, this);

      // Visual feedback -- brief pulse
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  public resetGoal(): void {
    this._reached = false;
    this.setScale(1);
  }
}
