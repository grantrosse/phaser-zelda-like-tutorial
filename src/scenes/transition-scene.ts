import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { TransitionConfig } from '../common/types';

export class TransitionScene extends Phaser.Scene {
  #backgroundOverlay!: Phaser.GameObjects.Rectangle;
  #transitionMask!: Phaser.Display.Masks.BitmapMask;
  #transitionMaskShape!: Phaser.GameObjects.Ellipse;
  #transitionDetails!: TransitionConfig;

  constructor() {
    super({
      key: SCENE_KEYS.TRANSITION_SCENE,
    });
  }

  public init(data: TransitionConfig): void {
    this.#transitionDetails = data;
  }

  public create(): void {
    // Full-screen black image
    this.#backgroundOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 1)
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setVisible(true);

    // create a basic shape object that uses the Phaser Graphics Game Object, this will be used for the mask
    this.#transitionMaskShape = this.add
      .ellipse(this.#transitionDetails.x, this.#transitionDetails.y, 30, 10, 0xffffff)
      .setVisible(false)
      .setScale(1);
    // create mask from the basic shape, and invert alpha so the shape is visible in the scene
    this.#transitionMask = this.#transitionMaskShape.createBitmapMask();
    this.#transitionMask.invertAlpha = true;

    // apply the mask to the background game object
    this.#backgroundOverlay.setMask(this.#transitionMask);

    // scale the mask shape up/down for the transition
    const propertyConfig = {
      ease: Phaser.Math.Easing.Linear,
      from: this.#transitionDetails.open ? 0 : 40,
      start: this.#transitionDetails.open ? 0 : 40,
      to: this.#transitionDetails.open ? 40 : 0,
    };
    this.tweens.add({
      targets: this.#transitionMaskShape,
      scaleX: propertyConfig,
      scaleY: propertyConfig,
      duration: 1000,
      delay: 250,
      onComplete: () => {
        this.scene.stop();
      },
    });

    this.scene.bringToTop(SCENE_KEYS.TRANSITION_SCENE);
  }
}
