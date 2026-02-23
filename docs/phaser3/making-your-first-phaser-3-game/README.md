# Making Your First Phaser 3 Game — Tutorial Notes

> Official tutorial: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part1](https://phaser.io/tutorials/making-your-first-phaser-3-game/part1)
>
> Tutorial assets ZIP: [Download](https://cdn.phaser.io/tutorials/making-your-first-phaser-3-game/phaser3-tutorial-src.zip)
>
> Phaser version: v3.90.0 | Framework: [https://phaser.io](https://phaser.io)

## Overview

This tutorial builds a small platformer game step-by-step. The player runs and jumps across platforms, collects stars for points, and avoids bouncing bombs. Each part introduces new Phaser 3 features.

## Part Index

| Part | Title | Key Topics | File |
|------|-------|------------|------|
| 1 | [Introduction](part-01-introduction.md) | Game config, renderer types, scene lifecycle | `part-01-introduction.md` |
| 2 | [Loading Assets](part-02-loading-assets.md) | `this.load.image`, `this.load.spritesheet`, asset keys | `part-02-loading-assets.md` |
| 3 | [World Building](part-03-world-building.md) | `this.add.image`, coordinate system, Display List, origin | `part-03-world-building.md` |
| 4 | [The Platforms](part-04-the-platforms.md) | Arcade Physics config, `staticGroup`, `refreshBody` | `part-04-the-platforms.md` |
| 5 | [Ready Player One](part-05-ready-player-one.md) | Physics sprite, bounce, world bounds, animations | `part-05-ready-player-one.md` |
| 6 | [Body Velocity](part-06-body-velocity.md) | Colliders, gravity, velocity, AABB bodies | `part-06-body-velocity.md` |
| 7 | [Keyboard Controls](part-07-keyboard-controls.md) | Cursor keys, `update()` loop, movement + jump logic | `part-07-keyboard-controls.md` |
| 8 | [Stardust](part-08-stardust.md) | Dynamic groups, overlap detection, `disableBody` | `part-08-stardust.md` |
| 9 | [A Score to Settle](part-09-score-to-settle.md) | Text Game Objects, `setText`, scoring | `part-09-score-to-settle.md` |
| 10 | [Bouncing Bombs](part-10-bouncing-bombs.md) | Enemies, star respawn, game over, difficulty curve | `part-10-bouncing-bombs.md` |

## Progressive Feature Map

```
Part 1:  [Config] [Renderer] [Scene Lifecycle]
Part 2:  + Asset Loading (images + spritesheet)
Part 3:  + Image display, coordinates, Display List
Part 4:  + Arcade Physics, Static Group (platforms)
Part 5:  + Physics Sprite (player), Animations
Part 6:  + Collider, Gravity, Velocity concepts
Part 7:  + Keyboard Input, Movement & Jump in update()
Part 8:  + Dynamic Group (stars), Overlap + Collect
Part 9:  + Text display, Score tracking
Part 10: + Enemies (bombs), Star respawn, Game Over
```

## Final Game Mechanics Summary

### Player
- Physics sprite at (100, 450) with 0.2 bounce
- Collides with world bounds and platforms
- Moves at ±160 px/s horizontally, jumps at -330 px/s
- Three animation states: left, turn, right

### Platforms
- Static physics group (immovable)
- Ground: scaled 2x at y=568
- Three floating ledges at varying heights

### Stars (Collectibles)
- 12 stars in a dynamic group, spaced 70px apart
- Random Y bounce between 0.4–0.8
- Collected via overlap → disabled and hidden
- +10 points each (120 max per round)
- Respawn when all collected

### Bombs (Enemies)
- Spawn on opposite side from player when all stars collected
- Perfect bounce (1.0), random horizontal velocity
- Collide with world bounds and platforms
- Touching one = game over (physics pauses, player turns red)
- Cumulative — one more bomb per round

### Score
- Text at (16, 16), black 32px font
- Updated with `setText()` on each star collection

## Key Constants Reference

| Constant | Value | Used For |
|---|---|---|
| Canvas size | 800 × 600 | Game display dimensions |
| World gravity Y | 300 | Downward pull on all dynamic bodies |
| Player bounce | 0.2 | Slight landing bounce |
| Player move speed | 160 px/s | Horizontal velocity |
| Player jump speed | -330 px/s | Vertical velocity (upward) |
| Star count | 12 | Per round |
| Star spacing | 70 px | Horizontal gap between stars |
| Star bounce Y | 0.4–0.8 | Random per star |
| Points per star | 10 | Score increment |
| Bomb bounce | 1.0 | Perfect energy retention |
| Bomb velocity X | -200 to 200 | Random horizontal |
| Bomb velocity Y | 20 | Slight downward initial |

## Full API Reference (Tutorial Scope)

### Loading
- `this.load.image(key, url)`
- `this.load.spritesheet(key, url, { frameWidth, frameHeight })`

### Game Objects
- `this.add.image(x, y, key)`
- `this.add.text(x, y, text, style)`
- `.setOrigin(x, y)`
- `.setScale(value)`
- `.setTint(color)`
- `.setText(value)`

### Physics
- `this.physics.add.staticGroup()`
- `this.physics.add.group(config)`
- `this.physics.add.sprite(x, y, key)`
- `this.physics.add.collider(a, b, callback, process, scope)`
- `this.physics.add.overlap(a, b, callback, process, scope)`
- `this.physics.pause()`
- `.setBounce(value)` / `.setBounceY(value)`
- `.setCollideWorldBounds(true)`
- `.setVelocityX(value)` / `.setVelocityY(value)` / `.setVelocity(x, y)`
- `.setGravityY(value)`
- `.disableBody(deactivate, hide)`
- `.enableBody(reset, x, y, enableGameObject, showGameObject)`
- `group.countActive(true)`
- `group.children.iterate(callback)`
- `.refreshBody()`
- `body.touching.down`

### Animation
- `this.anims.create(config)`
- `this.anims.generateFrameNumbers(key, { start, end })`
- `sprite.anims.play(key, ignoreIfPlaying)`

### Input
- `this.input.keyboard.createCursorKeys()`
- `cursors.left.isDown` / `.right.isDown` / `.up.isDown`

### Math Utilities
- `Phaser.Math.FloatBetween(min, max)`
- `Phaser.Math.Between(min, max)`
