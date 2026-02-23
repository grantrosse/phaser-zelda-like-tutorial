# Phaser 3.90.0 API Documentation — Overview

> Official docs: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> Phaser version: v3.90.0 | Available versions: v3.90.0, v4.0.0-rc.6, v3.88.2
>
> This is a **full-catalog overview** — broad coverage of every major API section, summarized. For per-method detail, consult the official API docs.

## Coverage Note

These files catalog the official Phaser 3.90.0 API structure. Each file summarizes the classes, functions, constants, events, or typedefs in a major section. Code patterns and "when to use" guidance are included, but individual method signatures are not exhaustively listed — the official docs remain the canonical reference for that level of detail.

---

## File Index

| File | Section | What It Covers |
|------|---------|----------------|
| [classes.md](classes.md) | Classes | All core system classes: Animation, Cache, Camera, Core, Curves, Data, Display, Events, FX, Input, Loader, Math, Plugins, Renderer, Scale, Scenes, Sound, Structs, Textures, Tilemaps, Time, Tweens, Geometry |
| [constants.md](constants.md) | Constants | Static values: renderer types, blend modes, scale modes, math constants, physics types, tilemap orientations, tween states |
| [events.md](events.md) | Events | Every event namespace: Animation, Cache, Camera, Core, Data, GameObjects, Input, Keyboard, Gamepad, Loader, Arcade Physics, Matter Physics, Scenes, and more |
| [game-object-classes.md](game-object-classes.md) | Game Object Classes | All visual entities: Image, Sprite, Text, BitmapText, Shapes, Container, Particles, TileSprite, Video, Blitter, Mesh, Plane, Rope, Graphics, Light, NineSlice, DOM, Zone + shared components |
| [game-object-functions.md](game-object-functions.md) | Game Object Functions | Utility functions: BuildGameObject, BuildGameObjectAnimation, GetCalcMatrix, GetTextSize, MeasureText |
| [arcade-physics.md](arcade-physics.md) | Arcade Physics | Lightweight AABB physics: Body, StaticBody, Groups, Colliders, Factory, World, constants, common patterns |
| [matter-physics.md](matter-physics.md) | Matter.js Physics | Full 2D physics: Bodies, Constraints, Sensors, Collision Filtering, Factory, World, comparison with Arcade |
| [typedefs.md](typedefs.md) | Typedefs | Configuration object shapes for: Core, Scenes, GameObjects, Animations, Cameras, Input, Loader, Physics, Tweens, Tilemaps, Time, Sound |
| [version-notes.md](version-notes.md) | Version Notes | Version history, Phaser 2 vs 3 differences, Phaser 4 preview, resource links |

---

## Where to Look First

Quick lookup guide based on what you're trying to do:

| Task | Start Here |
|------|-----------|
| Set up a new game | [classes.md → Core](classes.md) |
| Load images, audio, JSON | [classes.md → Loader](classes.md) |
| Add sprites, images, text to the scene | [game-object-classes.md](game-object-classes.md) |
| Animate sprites | [classes.md → Animations](classes.md) |
| Handle keyboard/mouse/gamepad input | [classes.md → Input](classes.md) |
| Add simple AABB physics (platformer) | [arcade-physics.md](arcade-physics.md) |
| Add realistic physics (joints, complex shapes) | [matter-physics.md](matter-physics.md) |
| Create timers and delays | [classes.md → Time](classes.md) |
| Animate properties (tweens) | [classes.md → Tweens](classes.md) |
| Use cameras (scroll, zoom, shake) | [classes.md → Cameras](classes.md) |
| Render particles | [game-object-classes.md → Particles](game-object-classes.md) |
| Apply visual effects (blur, glow, bloom) | [classes.md → FX](classes.md) |
| Work with tilemaps (Tiled editor) | [classes.md → Tilemaps](classes.md) |
| Play audio | [classes.md → Sound](classes.md) |
| Manage scenes (switch, parallel, transitions) | [classes.md → Scenes](classes.md) |
| Respond to game/physics/input events | [events.md](events.md) |
| Know what config objects look like | [typedefs.md](typedefs.md) |
| Scale game to fit screen / fullscreen | [constants.md → Scale](constants.md) |
| Understand version differences | [version-notes.md](version-notes.md) |

---

## Architecture Overview

```
Phaser.Game
├── Core.Config          — parsed game configuration
├── Core.TimeStep        — game loop (RAF)
├── Renderer             — Canvas or WebGL
│   ├── Pipelines        — rendering pipelines + FX
│   └── RenderTargets    — framebuffers
├── Scale.ScaleManager   — responsive scaling
├── Scenes.SceneManager  — manages all scenes
│   └── Scene (per scene)
│       ├── this.add      — GameObjectFactory
│       ├── this.make     — GameObjectCreator
│       ├── this.load     — LoaderPlugin
│       ├── this.physics  — ArcadePhysics / MatterPhysics
│       ├── this.input    — InputPlugin
│       ├── this.cameras  — CameraManager
│       ├── this.anims    — AnimationManager
│       ├── this.tweens   — TweenManager
│       ├── this.time     — Clock
│       ├── this.sound    — SoundManager
│       ├── this.data     — DataManagerPlugin
│       ├── this.events   — EventEmitter
│       └── this.scene    — ScenePlugin
├── Textures.TextureManager
├── Cache.CacheManager
├── Input.InputManager
├── Sound.BaseSoundManager
├── Plugins.PluginManager
└── Events.EventEmitter   — game-level events
```

---

## Related Documentation

| Resource | Link |
|---|---|
| Tutorial: Making Your First Phaser 3 Game | [../making-your-first-phaser-3-game/README.md](../making-your-first-phaser-3-game/README.md) |
| Official API Docs | [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation) |
| Official Examples | [https://phaser.io/examples](https://phaser.io/examples) |
| Official Getting Started | [https://docs.phaser.io/phaser/getting-started](https://docs.phaser.io/phaser/getting-started) |
| Phaser GitHub | [https://github.com/phaserjs/phaser](https://github.com/phaserjs/phaser) |
