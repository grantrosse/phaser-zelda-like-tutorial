# Part 4 — The Platforms

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part4](https://phaser.io/tutorials/making-your-first-phaser-3-game/part4)

## What Changes From Part 3

Physics is enabled in the game config, and platform Game Objects are created using a Static Physics Group.

## Enabling Arcade Physics

The game config gains a `physics` property:

```js
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
```

### Physics Config Values

| Property | Value | Purpose |
|---|---|---|
| `default` | `'arcade'` | Use Arcade Physics system |
| `gravity.y` | `300` | World-wide downward gravity (px/s²) |
| `debug` | `false` | Hide physics debug outlines |

## Creating the Platform Group

```js
var platforms;

function create () {
    this.add.image(400, 300, 'sky');

    platforms = this.physics.add.staticGroup();

    // Ground — scaled 2x wide, refreshBody() required after scaling
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    // Three floating ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');
}
```

## Platform Positions

| Platform | X | Y | Notes |
|---|---|---|---|
| Ground | 400 | 568 | Scaled 2x to span full width |
| Ledge 1 | 600 | 400 | Right-center area |
| Ledge 2 | 50 | 250 | Far left, mid-height |
| Ledge 3 | 750 | 220 | Far right, upper area |

## Key Concepts

### Static vs Dynamic Groups

| Type | Method | Behavior |
|---|---|---|
| Static Group | `this.physics.add.staticGroup()` | Bodies don't move, aren't affected by gravity. Ideal for ground/platforms. |
| Dynamic Group | `this.physics.add.group()` | Bodies move, are affected by gravity and velocity. Used for stars, bombs, etc. |

### `refreshBody()`
- After calling `.setScale()` on a static physics body, you **must** call `.refreshBody()`.
- This tells the physics system to recalculate the body's size to match the new visual scale.
- Without it, the collision body stays at the original unscaled size.

### Physics Systems in Phaser 3

Phaser 3 supports three physics systems:

| System | Best For |
|---|---|
| **Arcade Physics** | Simple AABB collisions, platformers, lightweight, mobile-friendly |
| **Impact Physics** | Impact.js-style physics |
| **Matter.js** | Full-body physics with complex shapes, joints, constraints |

This tutorial uses **Arcade Physics** throughout.

## APIs Introduced

- `this.physics.add.staticGroup()` — create a group of immovable physics bodies
- `group.create(x, y, key)` — add a new member to the group at position
- `.setScale(value)` — scale a Game Object
- `.refreshBody()` — recalculate static body dimensions after scaling

## Recap Checklist

- [ ] Physics enabled in config with `arcade` and world gravity of 300
- [ ] Static group created for platforms (immovable bodies)
- [ ] Ground scaled 2x horizontally and `refreshBody()` called
- [ ] Three floating ledges positioned at different heights
- [ ] Understand Static vs Dynamic physics groups
