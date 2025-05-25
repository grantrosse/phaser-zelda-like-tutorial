import { BaseWeapon, WeaponAttackAnimationConfig } from './base-weapon';
import { DIRECTION } from '../../common/common';
import { WeaponComponent } from '../../components/game-object/weapon-component';
import { ASSET_KEYS } from '../../common/assets';
import { exhaustiveGuard } from '../../common/utils';

/**
 * For the Bow weapon, we want to play the default attack animations, which show the player
 * notching an arrow on the bow, pulling the string, and then releasing the arrow. Only after
 * this animation is done do we want to show the weapon physics body & sprite for the arrow
 * game object. Once the arrow is sent flying, we want the player to be able to move around,
 * but not be able to fire another arrow until the other arrow is done flying across the screen.
 *
 * To handle this, in our `attack` methods, we don't update the weapon physics body (like we do with
 * the dagger). Instead, on the animation complete event, we then show the arrow object and send
 * the arrow flying in the current attack direction.
 */

export class Bow extends BaseWeapon {
  #weaponSprite: Phaser.GameObjects.Sprite;
  #weaponSpeed: number;
  #isArrowActive: boolean;

  constructor(
    sprite: Phaser.GameObjects.Sprite,
    weaponComponent: WeaponComponent,
    animationConfig: WeaponAttackAnimationConfig,
    baseDamage: number,
    weaponSpeed: number,
  ) {
    super(sprite, weaponComponent, animationConfig, baseDamage, true);

    this.#weaponSprite = sprite.scene.add.sprite(0, 0, ASSET_KEYS.ARROW_1, 0).setVisible(false).setOrigin(0, 1);
    this.#weaponSpeed = weaponSpeed;
    this._weaponComponent.body.setSize(this.#weaponSprite.width, this.#weaponSprite.height);
    this.#isArrowActive = false;
  }

  get canAttack(): boolean {
    return !this._attacking && !this.#isArrowActive;
  }

  public attackUp(): void {
    this.attack(DIRECTION.UP);
  }

  public attackDown(): void {
    this.attack(DIRECTION.DOWN);
  }

  public attackRight(): void {
    this.attack(DIRECTION.RIGHT);
  }

  public attackLeft(): void {
    this.attack(DIRECTION.LEFT);
  }

  public update(): void {
    this.#weaponSprite.setPosition(this._weaponComponent.body.position.x, this._weaponComponent.body.position.y);
  }

  protected attackAnimationCompleteHandler(): void {
    switch (this._currentAttackDirection) {
      case DIRECTION.UP:
        this.#fireArrowUp();
        break;
      case DIRECTION.DOWN:
        this.#fireArrowDown();
        break;
      case DIRECTION.LEFT:
        this.#fireArrowLeft();
        break;
      case DIRECTION.RIGHT:
        this.#fireArrowRight();
        break;
      default:
        exhaustiveGuard(this._currentAttackDirection);
    }
    this.#isArrowActive = true;
    this._attacking = false;
    this.#weaponSprite.scene.time.delayedCall(450, () => {
      this.#disableArrow();
    });
  }

  public onCollisionCallback(): void {
    this.#disableArrow();
  }

  #disableArrow(): void {
    this.#weaponSprite.setVisible(false);
    this._weaponComponent.body.setVelocityX(0);
    this._weaponComponent.body.setVelocityY(0);
    this.#isArrowActive = false;
  }

  #fireArrowUp(): void {
    this._weaponComponent.body.position.set(this._sprite.x - 3, this._sprite.y - 25);
    this._weaponComponent.body.setVelocityY(this.#weaponSpeed * -1);
    this.#weaponSprite
      .setPosition(this._weaponComponent.body.position.x, this._weaponComponent.body.y)
      .setVisible(true)
      .setOrigin(0, 0)
      .setAngle(0)
      .setFlipY(true);
  }

  #fireArrowDown(): void {
    this._weaponComponent.body.position.set(this._sprite.x - 5, this._sprite.y + 20);
    this._weaponComponent.body.setVelocityY(this.#weaponSpeed);
    this.#weaponSprite
      .setPosition(this._weaponComponent.body.position.x, this._weaponComponent.body.y)
      .setVisible(true)
      .setOrigin(1, 1)
      .setAngle(180)
      .setFlipY(true);
  }

  #fireArrowRight(): void {
    this._weaponComponent.body.position.set(this._sprite.x + 10, this._sprite.y + 2);
    this._weaponComponent.body.setVelocityX(this.#weaponSpeed);
    this.#weaponSprite
      .setPosition(this._weaponComponent.body.position.x, this._weaponComponent.body.y)
      .setVisible(true)
      .setOrigin(0, 1)
      .setAngle(90)
      .setFlipY(true);
  }

  #fireArrowLeft(): void {
    this._weaponComponent.body.position.set(this._sprite.x - 25, this._sprite.y + 2);
    this._weaponComponent.body.setVelocityX(this.#weaponSpeed * -1);
    this.#weaponSprite
      .setPosition(this._weaponComponent.body.position.x, this._weaponComponent.body.y)
      .setVisible(true)
      .setOrigin(0, 1)
      .setAngle(90)
      .setFlipY(false);
  }
}
