# Phaser 3.90.0 API — Game Object Classes

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Classes](classes.md) | [Game Object Functions](game-object-functions.md)

## Overview

Game Objects are the visual entities in your scene — sprites, images, text, shapes, containers, particles, tilemaps, videos, and more. They all extend `Phaser.GameObjects.GameObject` and share common components (position, scale, rotation, alpha, tint, depth, etc.).

---

## Core / Infrastructure

| Class | Purpose | When to Use |
|---|---|---|
| `GameObject` | Base class for all game objects | Extend for custom objects |
| `GameObjectFactory` | The `this.add` factory — creates objects and adds to scene | `this.add.sprite()`, `this.add.image()`, etc. |
| `GameObjectCreator` | The `this.make` factory — creates objects without adding to scene | `this.make.sprite()` for objects you add manually |
| `DisplayList` | Ordered list of renderable objects in a scene | Managed automatically |
| `UpdateList` | List of objects that receive `preUpdate` calls | Managed automatically |
| `Group` | Manages a pool of Game Objects | Object pooling, batch operations |

---

## Visual Game Objects

### Images & Sprites

| Class | Purpose | Physics Body? |
|---|---|---|
| `Image` | Static image — no animation | No |
| `Sprite` | Animated image — plays animations | No |

**Usage:**
```js
this.add.image(x, y, 'key');        // static
this.add.sprite(x, y, 'key');       // animatable
```

For physics-enabled versions, use `this.physics.add.image()` or `this.physics.add.sprite()`.

---

### Text

| Class | Purpose |
|---|---|
| `Text` | Rendered text with CSS-like styling |
| `TextStyle` | Style configuration for Text objects |
| `BitmapText` | Text rendered from a bitmap font (better performance) |
| `DynamicBitmapText` | BitmapText with per-character transformations |

**Usage:**
```js
this.add.text(x, y, 'Hello', { fontSize: '32px', fill: '#fff' });
this.add.bitmapText(x, y, 'fontKey', 'Hello', 32);
```

---

### Shapes

All shape classes extend `Phaser.GameObjects.Shape`:

| Class | Shape |
|---|---|
| `Arc` | Circle or arc segment |
| `Curve` | Curve path |
| `Ellipse` | Ellipse |
| `Grid` | Grid pattern |
| `IsoBox` | Isometric box |
| `IsoTriangle` | Isometric triangle |
| `Line` | Line segment |
| `Polygon` | Polygon |
| `Rectangle` | Rectangle |
| `Star` | Star shape |
| `Triangle` | Triangle |

**Usage:** `this.add.rectangle(x, y, w, h, color)`, `this.add.circle(x, y, radius, color)`, etc.

---

### Containers

| Class | Purpose |
|---|---|
| `Container` | Groups Game Objects with shared transform (position, rotation, scale) |

**Usage:** Add children to a container; moving the container moves all children.

```js
var container = this.add.container(x, y, [child1, child2]);
```

---

### Layers

| Class | Purpose |
|---|---|
| `Layer` | Rendering layer — groups objects for batch rendering / shared pipeline |

---

### Particles

| Class | Purpose |
|---|---|
| `Particles.ParticleEmitter` | Emits particles with configurable behavior |
| `Particles.Particle` | A single particle instance |
| `Particles.GravityWell` | Gravity attractor for particles |
| `Particles.ParticleBounds` | Bounds constraints for particles |
| `Particles.ParticleProcessor` | Base processor class |
| `Particles.EmitterOp` | Emitter operation (property over lifetime) |
| `Particles.EmitterColorOp` | Color operation for particles |
| `Particles.Zones.DeathZone` | Kills particles entering/leaving a zone |
| `Particles.Zones.EdgeZone` | Emits particles along a shape edge |
| `Particles.Zones.RandomZone` | Emits particles at random positions within a shape |

**Usage:**
```js
this.add.particles(x, y, 'key', {
    speed: 100,
    lifespan: 2000,
    quantity: 2
});
```

---

### TileSprite

| Class | Purpose |
|---|---|
| `TileSprite` | Repeating/scrolling tiled texture |

**Usage:** Scrolling backgrounds — `tileSprite.tilePositionX += 1`.

---

### Video

| Class | Purpose |
|---|---|
| `Video` | Play video as a Game Object (HTML5 video element) |

---

### Blitter

| Class | Purpose |
|---|---|
| `Blitter` | Ultra-fast batch renderer for identical textures (no transform per item) |
| `Bob` | A single item within a Blitter |

**Usage:** Very high-performance rendering of many identical static images (e.g., starfields).

---

### Mesh & 3D

| Class | Purpose |
|---|---|
| `Mesh` | 3D mesh rendered in 2D space (vertices, faces, textures) |
| `Plane` | A subdivided plane mesh (for distortion effects) |
| `Rope` | A textured rope that deforms along points |
| `PathFollower` | Sprite that follows a Path |

---

### Other

| Class | Purpose |
|---|---|
| `DOMElement` | HTML DOM element positioned in the game world |
| `Extern` | External rendering bridge |
| `Graphics` | Programmatic drawing (lines, shapes, fills) |
| `Light` | 2D light source |
| `LightsManager` | Manages 2D lights for a scene |
| `LightsPlugin` | Scene plugin for 2D lighting |
| `NineSlice` | Nine-slice scaling for UI panels |
| `PointLight` | Efficient point light (WebGL) |
| `RenderTexture` | Draw Game Objects to a texture |
| `Shader` | Custom GLSL shader as a Game Object |
| `Zone` | Invisible rectangular area (for hit areas, drop zones) |

---

## Shared Components

All Game Objects can use these component methods/properties:

| Component | Key Methods/Properties |
|---|---|
| **Transform** | `x`, `y`, `rotation`, `angle`, `scale`, `setPosition()`, `setScale()`, `setRotation()` |
| **Alpha** | `alpha`, `setAlpha()` |
| **BlendMode** | `blendMode`, `setBlendMode()` |
| **Depth** | `depth`, `setDepth()` |
| **Flip** | `flipX`, `flipY`, `setFlip()`, `toggleFlipX()` |
| **Mask** | `mask`, `setMask()`, `createBitmapMask()`, `createGeometryMask()` |
| **Origin** | `originX`, `originY`, `setOrigin()` |
| **ScrollFactor** | `scrollFactorX`, `scrollFactorY`, `setScrollFactor()` |
| **Size** | `width`, `height`, `setSize()`, `setDisplaySize()` |
| **Texture** | `texture`, `frame`, `setTexture()`, `setFrame()` |
| **Tint** | `tint`, `setTint()`, `setTintFill()`, `clearTint()` |
| **Visible** | `visible`, `setVisible()` |
| **FX** | `preFX`, `postFX` (WebGL only) |
| **Pipeline** | `pipeline`, `setPipeline()` (WebGL only) |

### Transform Matrix

| Class | Purpose |
|---|---|
| `Components.TransformMatrix` | 2D transformation matrix for advanced positioning |
| `Components.FX` | FX controller component |
