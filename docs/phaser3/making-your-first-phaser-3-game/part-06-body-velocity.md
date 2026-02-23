# Part 6 — Body Velocity: A World of Physics

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part6](https://phaser.io/tutorials/making-your-first-phaser-3-game/part6)

## What Changes From Part 5

The player is connected to the platform group via a **Collider**, so the player lands on platforms instead of falling through them. Physics body concepts are explained.

## Adding the Collider

```js
this.physics.add.collider(player, platforms);
```

This single line tells the Arcade Physics engine to monitor collisions between the `player` sprite and every member of the `platforms` group.

## How Arcade Physics Works

### Physics Bodies
- When you create a physics sprite, it gets a `body` property.
- The body represents the sprite in the physics simulation.
- The body is an **AABB** (Axis-Aligned Bounding Box) — a non-rotated rectangle.

### Gravity
- **World gravity** is set in the config: `gravity: { y: 300 }` — applies to all dynamic bodies.
- **Per-body gravity** can add extra gravity to a specific sprite:
  ```js
  player.body.setGravityY(300);
  ```
  This is **additive** — the player would experience 300 (world) + 300 (body) = 600 total gravity.

### Velocity
- Velocity is the speed and direction a body moves, measured in **pixels per second**.
- You set velocity directly (not acceleration) for instant responsive movement:
  ```js
  player.setVelocityX(-160);  // move left at 160 px/s
  player.setVelocityX(160);   // move right at 160 px/s
  player.setVelocityY(-330);  // jump upward at 330 px/s
  ```

## Key Physics Body Properties

| Property | Type | Description |
|---|---|---|
| `velocity.x` | number | Horizontal speed (px/s). Negative = left, positive = right. |
| `velocity.y` | number | Vertical speed (px/s). Negative = up, positive = down. |
| `bounce` | { x, y } | Energy retained after collision (0–1) |
| `gravity` | { x, y } | Additional gravity applied to this body only |
| `touching.down` | boolean | Whether the body is touching something below it |
| `collideWorldBounds` | boolean | Whether the body stops at the world edges |

## Collider vs Overlap

| Method | When to Use | Effect |
|---|---|---|
| `physics.add.collider(a, b)` | Objects should physically bounce/stop | Separates overlapping bodies, applies physics |
| `physics.add.overlap(a, b, callback)` | Objects should pass through each other | Calls a function when objects overlap, no separation |

Both accept optional callback functions: `collider(a, b, callback, processCallback, scope)`.

## APIs Introduced

- `this.physics.add.collider(objectA, objectB)` — create a collision handler between two objects/groups
- `body.setGravityY(value)` — add per-body gravity (additive with world gravity)
- `.setVelocityX(value)` — set horizontal velocity
- `.setVelocityY(value)` — set vertical velocity
- `body.touching.down` — check if body is resting on something below

## Recap Checklist

- [ ] Collider added between player and platforms
- [ ] Understand AABB-based Arcade Physics collision
- [ ] Know world gravity vs per-body gravity (additive)
- [ ] Know the difference between `collider` (physical separation) and `overlap` (callback only)
- [ ] Velocity is in pixels per second
