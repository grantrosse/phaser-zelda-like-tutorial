import { DIRECTION } from '../../../../common/common';
import { exhaustiveGuard } from '../../../../common/utils';
import { CharacterGameObject } from '../../../../game-objects/common/character-game-object';
import { ItemComponent } from '../../../game-object/item-component';
import { BaseCharacterState } from './base-character-state';
import { CHARACTER_STATES } from './character-states';

export class UseItemState extends BaseCharacterState {
  constructor(gameObject: CharacterGameObject) {
    super(CHARACTER_STATES.USE_ITEM_STATE, gameObject);
  }

  public onEnter(): void {
    // reset game object velocity
    this._resetObjectVelocity();

    const itemComponent = ItemComponent.getComponent<ItemComponent>(this._gameObject);
    if (itemComponent === undefined || itemComponent.weapon === undefined) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }

    const weapon = itemComponent.weapon;
    if (!weapon.canAttack) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }
    switch (this._gameObject.direction) {
      case DIRECTION.UP:
        return weapon.attackUp();
      case DIRECTION.DOWN:
        return weapon.attackDown();
      case DIRECTION.LEFT:
        return weapon.attackLeft();
      case DIRECTION.RIGHT:
        return weapon.attackRight();
      default:
        exhaustiveGuard(this._gameObject.direction);
    }
  }

  public onUpdate(): void {
    const itemComponent = ItemComponent.getComponent<ItemComponent>(this._gameObject);
    if (itemComponent === undefined || itemComponent.weapon === undefined) {
      this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
      return;
    }
    // wait until weapon animation is done for attacking
    const weapon = itemComponent.weapon;
    if (weapon.isAttacking) {
      return;
    }
    this._stateMachine.setState(CHARACTER_STATES.IDLE_STATE);
  }
}
