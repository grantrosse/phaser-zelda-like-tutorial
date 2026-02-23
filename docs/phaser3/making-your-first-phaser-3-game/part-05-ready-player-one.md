# Part 5 — Ready Player One

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part5](https://phaser.io/tutorials/making-your-first-phaser-3-game/part5)

## What Changes From Part 4

The player sprite is created as a physics-enabled sprite, and three animations are defined for movement states.

## Creating the Player Sprite

```js
var player;

function create () {
    // ... sky and platforms code ...

    player = this.physics.add.sprite(100, 450, 'dude');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
}
```

### Player Setup Values

| Method | Value | Purpose |
|---|---|---|
| Position | `(100, 450)` | Spawn point — left side, above ground |
| `setBounce` | `0.2` | 20% energy retained on bounce (slight bounce on landing) |
| `setCollideWorldBounds` | `true` | Player cannot leave the canvas boundaries |

## Defining Animations

```js
// Left walk animation — frames 0 through 3
this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
});

// Idle/facing camera — frame 4 only
this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
});

// Right walk animation — frames 5 through 8
this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
});
```

### Animation Definitions

| Key | Frames | Frame Rate | Repeat | Description |
|---|---|---|---|---|
| `'left'` | 0–3 | 10 fps | `-1` (loop) | Walking left |
| `'turn'` | 4 | 20 fps | none | Idle / facing camera |
| `'right'` | 5–8 | 10 fps | `-1` (loop) | Walking right |

### Spritesheet Frame Layout (dude.png)

```
Frame:  0   1   2   3   4   5   6   7   8
        ←   ←   ←   ←  idle  →   →   →   →
        |-- left --|  |turn|  |-- right --|
        Each frame: 32 x 48 pixels
```

## Key Concepts

### Physics Sprite vs Image
- `this.physics.add.sprite()` creates a Sprite with a **dynamic physics body** attached.
- The body is affected by gravity, velocity, collisions, and other forces.
- Regular `this.add.image()` or `this.add.sprite()` have no physics body.

### Animations Are Global
- Animations are created on `this.anims` (the Animation Manager), not on individual sprites.
- Any sprite using the same texture can play the same animation.
- `repeat: -1` means the animation loops indefinitely.

### `generateFrameNumbers(key, config)`
- Generates an array of frame objects from a spritesheet.
- `{ start: 0, end: 3 }` = frames 0, 1, 2, 3.

## APIs Introduced

- `this.physics.add.sprite(x, y, key)` — create a physics-enabled Sprite
- `.setBounce(value)` — set bounce restitution (0 = no bounce, 1 = full bounce)
- `.setCollideWorldBounds(true)` — prevent sprite from leaving the world bounds
- `this.anims.create(config)` — define a named animation
- `this.anims.generateFrameNumbers(key, config)` — generate frame number array from spritesheet

## Recap Checklist

- [ ] Player created as a physics sprite at (100, 450)
- [ ] Bounce set to 0.2, world bounds collision enabled
- [ ] Three animations defined: 'left' (frames 0–3), 'turn' (frame 4), 'right' (frames 5–8)
- [ ] Understand that animations are global and can be shared across sprites
- [ ] Know that `repeat: -1` means infinite looping
