# Phaser 3.90.0 API — Arcade Physics

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Matter Physics](matter-physics.md) | [Classes](classes.md) | [Events](events.md)

## Overview

Arcade Physics is Phaser's **lightweight, high-performance** physics system. It uses AABB (Axis-Aligned Bounding Box) collision detection — no rotation, no complex shapes. Ideal for platformers, shooters, and mobile games where simplicity and speed matter more than physical realism.

### Enabling Arcade Physics

```js
var config = {
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    }
};
```

---

## Classes

### Core System

| Class | Purpose | Access Via |
|---|---|---|
| `ArcadePhysics` | Top-level Arcade Physics plugin | `this.physics` |
| `World` | The physics world — manages bodies, gravity, collisions | `this.physics.world` |
| `Factory` | Creates physics objects | `this.physics.add` |

### Bodies

| Class | Purpose |
|---|---|
| `Body` | Dynamic physics body — affected by gravity, velocity, acceleration |
| `StaticBody` | Static physics body — immovable, not affected by forces |

### Game Objects

| Class | Purpose | Creation |
|---|---|---|
| `Sprite` | Sprite with a dynamic Arcade Body | `this.physics.add.sprite(x, y, key)` |
| `Image` | Image with a dynamic Arcade Body | `this.physics.add.image(x, y, key)` |

### Groups

| Class | Purpose | Creation |
|---|---|---|
| `Group` | Group of dynamic physics bodies | `this.physics.add.group(config)` |
| `StaticGroup` | Group of static physics bodies | `this.physics.add.staticGroup()` |

### Collision

| Class | Purpose |
|---|---|
| `Collider` | Manages a collision/overlap pair between two objects |

---

## Key Body Properties

### Dynamic Body (`Phaser.Physics.Arcade.Body`)

| Property | Type | Description |
|---|---|---|
| `velocity` | Vector2 | Current velocity (px/s) |
| `acceleration` | Vector2 | Acceleration (px/s²) |
| `drag` | Vector2 | Deceleration when no acceleration applied |
| `gravity` | Vector2 | Per-body gravity (additive with world gravity) |
| `bounce` | Vector2 | Energy retained on collision (0–1) |
| `friction` | Vector2 | Friction on contact surfaces |
| `maxVelocity` | Vector2 | Maximum speed cap |
| `maxSpeed` | number | Absolute speed cap (overrides maxVelocity) |
| `mass` | number | Body mass (affects collision response) |
| `immovable` | boolean | If true, body doesn't move from collisions |
| `moves` | boolean | If false, body is excluded from physics |
| `enable` | boolean | Enable/disable the body |
| `touching` | { none, up, down, left, right } | What the body is touching this frame |
| `blocked` | { none, up, down, left, right } | What the body is blocked by |
| `collideWorldBounds` | boolean | Stop at world edges |
| `onWorldBounds` | boolean | Emit event on world bounds collision |
| `allowGravity` | boolean | Whether gravity affects this body |
| `allowDrag` | boolean | Whether drag affects this body |
| `allowRotation` | boolean | Whether angular velocity/drag apply |
| `angularVelocity` | number | Rotation speed (deg/s) |
| `angularAcceleration` | number | Rotation acceleration |
| `angularDrag` | number | Rotation deceleration |

### Key Body Methods

| Method | Description |
|---|---|
| `setVelocity(x, y)` | Set velocity |
| `setVelocityX(x)` / `setVelocityY(y)` | Set single axis velocity |
| `setAcceleration(x, y)` | Set acceleration |
| `setDrag(x, y)` | Set drag |
| `setBounce(x, y)` | Set bounce |
| `setGravityY(y)` | Set per-body gravity |
| `setMaxVelocity(x, y)` | Set max velocity |
| `setMass(value)` | Set mass |
| `setSize(width, height, center)` | Resize the body hitbox |
| `setOffset(x, y)` | Offset hitbox from sprite origin |
| `setCircle(radius, offsetX, offsetY)` | Use circular hitbox |
| `setImmovable(value)` | Make body immovable |
| `setCollideWorldBounds(value)` | Enable world bounds collision |
| `reset(x, y)` | Reset position and velocity |
| `stop()` | Zero velocity and acceleration |
| `disableBody(disableGameObject, hideGameObject)` | Disable the body |
| `enableBody(reset, x, y, enableGameObject, showGameObject)` | Re-enable the body |

---

## Factory Methods (`this.physics.add`)

| Method | Returns | Description |
|---|---|---|
| `sprite(x, y, key, frame)` | `Arcade.Sprite` | Create physics sprite |
| `image(x, y, key, frame)` | `Arcade.Image` | Create physics image |
| `group(config)` | `Arcade.Group` | Create dynamic group |
| `staticGroup(config)` | `Arcade.StaticGroup` | Create static group |
| `staticImage(x, y, key, frame)` | `Arcade.Image` | Create static image |
| `staticSprite(x, y, key, frame)` | `Arcade.Sprite` | Create static sprite |
| `collider(a, b, callback, process, scope)` | `Collider` | Add collision handler |
| `overlap(a, b, callback, process, scope)` | `Collider` | Add overlap handler |
| `existing(gameObject, isStatic)` | — | Add physics body to existing Game Object |

---

## World Methods (`this.physics.world`)

| Method | Description |
|---|---|
| `setBounds(x, y, width, height)` | Set physics world bounds |
| `setBoundsCollision(left, right, up, down)` | Enable/disable individual world edge collisions |
| `enable(object, bodyType)` | Enable physics on an object |
| `disable(object)` | Disable physics on an object |
| `pause()` | Pause physics simulation |
| `resume()` | Resume physics simulation |
| `wrap(object, padding)` | Wrap body around world bounds |
| `collide(a, b, callback, process, scope)` | Test collision directly |
| `overlap(a, b, callback, process, scope)` | Test overlap directly |

---

## Internal Functions

These are used internally by the physics engine:

| Function | Purpose |
|---|---|
| `GetCollidesWith` | Determine collision categories |
| `GetOverlapX` / `GetOverlapY` | Calculate overlap amounts |
| `ProcessX` / `ProcessY` | Process collision separation |
| `SeparateX` / `SeparateY` | Separate overlapping bodies |
| `SetCollisionObject` | Set collision properties |

---

## Constants

| Constant | Value | Description |
|---|---|---|
| `DYNAMIC_BODY` | 0 | Dynamic body type |
| `STATIC_BODY` | 1 | Static body type |
| `GROUP` | 2 | Group type |
| `TILEMAPLAYER` | 3 | Tilemap layer type |
| `FACING_NONE` | 10 | No facing direction |
| `FACING_UP` | 11 | Facing up |
| `FACING_DOWN` | 12 | Facing down |
| `FACING_LEFT` | 13 | Facing left |
| `FACING_RIGHT` | 14 | Facing right |

---

## Common Patterns

### Basic Platformer Setup

```js
// In create():
player = this.physics.add.sprite(100, 450, 'dude');
player.setBounce(0.2);
player.setCollideWorldBounds(true);

platforms = this.physics.add.staticGroup();
platforms.create(400, 568, 'ground').setScale(2).refreshBody();

this.physics.add.collider(player, platforms);
```

### Overlap with Callback

```js
this.physics.add.overlap(player, coins, collectCoin, null, this);

function collectCoin(player, coin) {
    coin.disableBody(true, true);
}
```

### Group with Auto-Creation

```js
var stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
});
```

### Tilemap Collision

```js
var map = this.make.tilemap({ key: 'map' });
var tileset = map.addTilesetImage('tiles');
var layer = map.createLayer('Ground', tileset, 0, 0);
layer.setCollisionByProperty({ collides: true });
this.physics.add.collider(player, layer);
```
