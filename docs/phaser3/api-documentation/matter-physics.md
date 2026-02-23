# Phaser 3.90.0 API — Matter.js Physics

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Arcade Physics](arcade-physics.md) | [Classes](classes.md) | [Events](events.md)

## Overview

Matter.js is a **full-featured 2D physics engine** integrated into Phaser. It supports complex shapes, compound bodies, constraints (joints/springs), sensors, and realistic physical simulation including friction, restitution, density, and sleeping.

Use Matter when you need more realistic physics than Arcade provides — such as ragdolls, vehicles with joints, complex polygon shapes, or physics puzzles.

### Enabling Matter Physics

```js
var config = {
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
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
| `MatterPhysics` | Top-level Matter Physics plugin | `this.matter` |
| `World` | The Matter physics world | `this.matter.world` |
| `Factory` | Creates Matter objects | `this.matter.add` |

### Game Objects

| Class | Purpose | Creation |
|---|---|---|
| `Sprite` | Sprite with a Matter body | `this.matter.add.sprite(x, y, key)` |
| `Image` | Image with a Matter body | `this.matter.add.image(x, y, key)` |
| `TileBody` | Tilemap tile with a Matter body | Automatic via tilemap collision |

### Interaction

| Class | Purpose |
|---|---|
| `PointerConstraint` | Mouse/touch drag constraint for Matter bodies |
| `BodyBounds` | Utility for getting bounds of a Matter body |

### Parsers

| Class | Purpose |
|---|---|
| `PhysicsEditorParser` | Parse PhysicsEditor JSON body data |
| `PhysicsJSONParser` | Parse JSON physics body data |

---

## Factory Methods (`this.matter.add`)

| Method | Description |
|---|---|
| `sprite(x, y, key, frame, options)` | Create sprite with Matter body |
| `image(x, y, key, frame, options)` | Create image with Matter body |
| `rectangle(x, y, w, h, options)` | Create rectangular body |
| `circle(x, y, radius, options)` | Create circular body |
| `polygon(x, y, sides, radius, options)` | Create polygon body |
| `trapezoid(x, y, w, h, slope, options)` | Create trapezoid body |
| `fromVertices(x, y, vertexSets, options)` | Create body from vertices |
| `constraint(bodyA, bodyB, length, stiffness, options)` | Create a constraint (joint/spring) |
| `worldConstraint(body, length, stiffness, options)` | Constrain body to a world point |
| `mouseSpring(options)` | Create mouse/touch drag spring |
| `pointerConstraint(options)` | Create pointer constraint |
| `joint(bodyA, bodyB, length, stiffness, options)` | Alias for constraint |
| `spring(bodyA, bodyB, length, stiffness, options)` | Alias for constraint |
| `fromPhysicsEditor(x, y, config)` | Create body from PhysicsEditor data |
| `fromJSON(x, y, config)` | Create body from JSON data |

---

## Key Matter Body Options

When creating a Matter body, you can pass these options:

| Option | Type | Description |
|---|---|---|
| `isStatic` | boolean | Body doesn't move (like a wall) |
| `isSensor` | boolean | Detects overlap but no physical response |
| `restitution` | number | Bounciness (0–1) |
| `friction` | number | Surface friction (0–1) |
| `frictionAir` | number | Air resistance (0–1) |
| `frictionStatic` | number | Static friction |
| `density` | number | Mass per area (affects mass) |
| `mass` | number | Explicit mass |
| `inertia` | number | Rotational inertia |
| `label` | string | Human-readable label |
| `collisionFilter` | object | `{ category, mask, group }` for filtering |
| `chamfer` | object | `{ radius }` for rounded corners |
| `slop` | number | Collision resolution slop |
| `angle` | number | Initial rotation (radians) |
| `ignoreGravity` | boolean | Exempt from gravity |
| `sleepThreshold` | number | Threshold for body sleeping |
| `plugin` | object | Custom plugin data |

---

## Matter World Methods

| Method | Description |
|---|---|
| `setBounds(x, y, width, height, thickness, left, right, top, bottom)` | Set world boundaries |
| `setGravity(x, y, scale)` | Set world gravity |
| `pause()` / `resume()` | Pause/resume simulation |
| `step(delta)` | Step the world manually |
| `wrap(body, padding)` | Wrap body around world bounds |
| `getAllBodies()` | Get all bodies in the world |
| `getAllConstraints()` | Get all constraints |
| `getAllComposites()` | Get all composites |
| `nextCategory()` | Get next collision category flag |

---

## Matter vs Arcade Comparison

| Feature | Arcade | Matter |
|---|---|---|
| Body shapes | Rectangle, Circle only | Any polygon, compound, vertices |
| Rotation | Not simulated | Full rotational physics |
| Constraints | Not available | Joints, springs, ropes |
| Sensors | Use overlap | Built-in sensor bodies |
| Performance | Very fast | Moderate (more calculations) |
| Tilemap support | Native | Via TileBody conversion |
| Body sleeping | No | Yes (performance optimization) |
| Compound bodies | No | Yes (multiple shapes as one body) |
| Collision filtering | Group-based | Category/mask bit-based |
| Best for | Platformers, simple games | Physics puzzles, ragdolls, simulations |

---

## Common Patterns

### Static Platform

```js
this.matter.add.rectangle(400, 580, 800, 40, { isStatic: true });
```

### Constraint/Joint

```js
var bodyA = this.matter.add.circle(200, 200, 30);
var bodyB = this.matter.add.circle(300, 200, 30);
this.matter.add.constraint(bodyA, bodyB, 100, 0.5);
```

### Sensor (Trigger Zone)

```js
var sensor = this.matter.add.rectangle(400, 300, 100, 100, {
    isSensor: true,
    isStatic: true
});

this.matter.world.on('collisionstart', function (event) {
    event.pairs.forEach(function (pair) {
        // Check pair.bodyA and pair.bodyB
    });
});
```

### Collision Events

```js
this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
    console.log('Collision between', bodyA.label, bodyB.label);
});
```

### Collision Filtering

```js
var catA = this.matter.world.nextCategory();
var catB = this.matter.world.nextCategory();

bodyA.setCollisionCategory(catA);
bodyA.setCollidesWith(catB);

bodyB.setCollisionCategory(catB);
bodyB.setCollidesWith(catA);
```

---

## Events

See [Events → Phaser.Physics.Matter.Events](events.md) for the full list, including:
- `COLLISION_START` / `COLLISION_ACTIVE` / `COLLISION_END`
- `BEFORE_UPDATE` / `AFTER_UPDATE`
- `DRAG_START` / `DRAG` / `DRAG_END`
- `SLEEP_START` / `SLEEP_END`
- `PAUSE` / `RESUME`

---

## Components

Matter Game Objects share these Phaser-specific component methods:

| Component | Methods |
|---|---|
| Bounce | `setBounce(value)` |
| Collision | `setCollisionCategory()`, `setCollidesWith()`, `setCollisionGroup()` |
| Force | `applyForce(force)`, `applyForceFrom(pos, force)`, `thrust(speed)` |
| Friction | `setFriction(value, air, static)` |
| Gravity | `setIgnoreGravity(value)` |
| Mass | `setMass(value)`, `setDensity(value)` |
| Sensor | `setSensor(value)` |
| Sleep | `setSleepStartEvent(value)`, `setSleepEndEvent(value)` |
| Static | `setStatic(value)` |
| Velocity | `setVelocity(x, y)`, `setAngularVelocity(value)` |
| FixedRotation | `setFixedRotation()` |
