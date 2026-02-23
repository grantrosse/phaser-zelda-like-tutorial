# Phaser 3.90.0 API — Classes

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Game Object Classes](game-object-classes.md) | [Arcade Physics](arcade-physics.md) | [Matter Physics](matter-physics.md)

## Overview

This file catalogs the **core system classes** in Phaser 3.90.0. These classes handle animation, caching, cameras, game configuration, curves, data management, display utilities, events, rendering, scenes, sound, input, loading, math, plugins, and more.

---

## Animations

Manage sprite animations — creation, playback, and frame control.

| Class | Purpose |
|---|---|
| `Phaser.Animations.Animation` | A single animation sequence definition |
| `Phaser.Animations.AnimationFrame` | A single frame within an Animation |
| `Phaser.Animations.AnimationManager` | Global animation manager — create/store/retrieve animations |
| `Phaser.Animations.AnimationState` | Per-sprite animation controller (play, stop, pause) |

**When to use:** Define animations globally via `this.anims.create()`, then play them on any sprite with `sprite.anims.play()`.

---

## Cache

Store and retrieve loaded assets and parsed data.

| Class | Purpose |
|---|---|
| `Phaser.Cache.BaseCache` | Low-level key-value cache storage |
| `Phaser.Cache.CacheManager` | Top-level manager grouping all cache types (images, JSON, audio, etc.) |

**When to use:** Rarely accessed directly — the Loader populates caches automatically. Use `this.cache` if you need raw access to loaded data.

---

## Cameras

Control what the player sees — viewport, scrolling, zoom, and effects.

| Class | Purpose |
|---|---|
| `Phaser.Cameras.Scene2D.BaseCamera` | Base class for all cameras |
| `Phaser.Cameras.Scene2D.Camera` | Main camera — extends BaseCamera with scroll, zoom, effects |
| `Phaser.Cameras.Scene2D.CameraManager` | Manages multiple cameras per scene |
| `Phaser.Cameras.Scene2D.Effects.Fade` | Fade in/out effect |
| `Phaser.Cameras.Scene2D.Effects.Flash` | Flash effect |
| `Phaser.Cameras.Scene2D.Effects.Pan` | Smooth pan to a position |
| `Phaser.Cameras.Scene2D.Effects.RotateTo` | Rotate camera to angle |
| `Phaser.Cameras.Scene2D.Effects.Shake` | Screen shake effect |
| `Phaser.Cameras.Scene2D.Effects.Zoom` | Smooth zoom effect |
| `Phaser.Cameras.Controls.FixedKeyControl` | Move camera with keyboard at fixed speed |
| `Phaser.Cameras.Controls.SmoothedKeyControl` | Move camera with keyboard with acceleration/deceleration |

**When to use:** Access via `this.cameras.main`. Use camera effects for transitions (fade, shake). Use `setScroll()`, `setZoom()`, `startFollow()` for gameplay cameras.

---

## Core

The game instance and its configuration.

| Class | Purpose |
|---|---|
| `Phaser.Core.Config` | Parsed game configuration (read-only after creation) |
| `Phaser.Game` | The main game instance — boots all subsystems |
| `Phaser.Core.TimeStep` | Manages the game loop timing and frame rate |

**When to use:** `new Phaser.Game(config)` is the entry point for every Phaser game. `TimeStep` is managed internally.

---

## Curves

Mathematical curves for paths, tweens, and movement.

| Class | Purpose |
|---|---|
| `Phaser.Curves.CubicBezier` | Cubic bezier curve |
| `Phaser.Curves.Curve` | Base curve class |
| `Phaser.Curves.Ellipse` | Elliptical curve |
| `Phaser.Curves.Line` | Straight line segment |
| `Phaser.Curves.QuadraticBezier` | Quadratic bezier curve |
| `Phaser.Curves.Spline` | Catmull-Rom spline through multiple points |
| `Phaser.Curves.MoveTo` | Move-to command (used in paths) |
| `Phaser.Curves.Path` | A path composed of multiple curve segments |

**When to use:** Create paths for PathFollower Game Objects or tween animations along curves.

---

## Data

Attach arbitrary key-value data to Game Objects or scenes.

| Class | Purpose |
|---|---|
| `Phaser.Data.DataManager` | Core data storage with events on change |
| `Phaser.Data.DataManagerPlugin` | Scene plugin that provides `this.data` |

**When to use:** Store custom state on Game Objects (e.g., `sprite.setData('health', 100)`) or scene-level data.

---

## Display

Color manipulation, masks, shaders, and display utilities.

| Class | Purpose |
|---|---|
| `Phaser.Display.Color` | RGBA color utility with conversion methods |
| `Phaser.Display.ColorMatrix` | 4x5 color transformation matrix |
| `Phaser.Display.RGB` | Red/Green/Blue wrapper with events |
| `Phaser.Display.Masks.BitmapMask` | Mask using a texture (alpha-based) |
| `Phaser.Display.Masks.GeometryMask` | Mask using a geometric shape |
| `Phaser.Display.BaseShader` | Base class for WebGL shaders |

**When to use:** Use masks for reveal/hide effects. Use Color for palette manipulation.

---

## DOM

Browser-level timing utilities.

| Class | Purpose |
|---|---|
| `Phaser.DOM.RequestAnimationFrame` | Cross-browser RAF wrapper (used internally by TimeStep) |

---

## Events

Base event system used by all Phaser objects.

| Class | Purpose |
|---|---|
| `Phaser.Events.EventEmitter` | Pub/sub event emitter (on, off, emit, once) |

**When to use:** All Phaser objects extend EventEmitter. Use `.on('event', callback)` to listen.

---

## FX (Post-Processing Effects)

WebGL pipeline-based visual effects (Phaser 3.60+).

| Class | Purpose |
|---|---|
| `Phaser.FX.Barrel` | Barrel distortion |
| `Phaser.FX.Bloom` | Bloom / glow |
| `Phaser.FX.Blur` | Gaussian blur |
| `Phaser.FX.Bokeh` | Bokeh / tilt-shift |
| `Phaser.FX.Circle` | Circular mask/vignette |
| `Phaser.FX.ColorMatrix` | Color matrix transformation |
| `Phaser.FX.Controller` | Base FX controller |
| `Phaser.FX.Displacement` | Displacement map |
| `Phaser.FX.Glow` | Outer glow |
| `Phaser.FX.Gradient` | Gradient overlay |
| `Phaser.FX.Pixelate` | Pixelation |
| `Phaser.FX.Shadow` | Drop shadow |
| `Phaser.FX.Shine` | Shine / sweep |
| `Phaser.FX.Vignette` | Vignette effect |
| `Phaser.FX.Wipe` | Wipe transition |

**When to use:** Apply to cameras or Game Objects via `gameObject.preFX.addBloom()`, etc. WebGL only.

---

## Input

Handle mouse, touch, keyboard, and gamepad input.

| Class | Purpose |
|---|---|
| `Phaser.Input.InputManager` | Global input manager |
| `Phaser.Input.InputPlugin` | Scene-level input — `this.input` |
| `Phaser.Input.Pointer` | Represents a mouse or touch pointer |
| `Phaser.Input.Keyboard.KeyboardManager` | Global keyboard handler |
| `Phaser.Input.Keyboard.KeyboardPlugin` | Scene keyboard — `this.input.keyboard` |
| `Phaser.Input.Keyboard.Key` | A single key state |
| `Phaser.Input.Keyboard.KeyCombo` | Detect key sequences (combos) |
| `Phaser.Input.Mouse.MouseManager` | Mouse-specific manager |
| `Phaser.Input.Touch.TouchManager` | Touch-specific manager |
| `Phaser.Input.Gamepad.Gamepad` | A single gamepad |
| `Phaser.Input.Gamepad.GamepadPlugin` | Scene gamepad manager |
| `Phaser.Input.Gamepad.Axis` | A gamepad axis |
| `Phaser.Input.Gamepad.Button` | A gamepad button |

**When to use:** `this.input.keyboard.createCursorKeys()` for arrow keys. `this.input.on('pointerdown', ...)` for mouse/touch. `this.input.gamepad` for controllers.

---

## Loader

Load external assets (images, audio, JSON, tilemaps, etc.).

| Class | Purpose |
|---|---|
| `Phaser.Loader.LoaderPlugin` | Scene loader — `this.load` |
| `Phaser.Loader.File` | Base file loading unit |
| `Phaser.Loader.MultiFile` | Multi-file bundle (atlas + JSON, etc.) |

### File Type Classes

| Class | Loads |
|---|---|
| `AnimationJSONFile` | Animation data from JSON |
| `AsepriteFile` | Aseprite atlas + JSON |
| `AtlasJSONFile` | Texture atlas (image + JSON) |
| `AtlasXMLFile` | Texture atlas (image + XML) |
| `AudioFile` | Audio (mp3, ogg, wav) |
| `AudioSpriteFile` | Audio sprite (audio + JSON) |
| `BinaryFile` | Raw binary data |
| `BitmapFontFile` | Bitmap font (image + data) |
| `CSSFile` | CSS stylesheet |
| `CompressedTextureFile` | Compressed GPU texture |
| `FontFile` | Web font |
| `GLSLFile` | GLSL shader source |
| `HTML5AudioFile` | HTML5 Audio element |
| `HTMLFile` | HTML content |
| `HTMLTextureFile` | HTML as texture |
| `ImageFile` | Single image |
| `JSONFile` | JSON data |
| `MultiAtlasFile` | Multi-page atlas |
| `MultiScriptFile` | Multiple script files |
| `OBJFile` | Wavefront OBJ 3D model |
| `PackFile` | Asset pack (JSON manifest of files) |
| `PluginFile` | Phaser plugin |
| `SVGFile` | SVG image |
| `SceneFile` | Scene as external file |
| `ScenePluginFile` | Scene plugin file |
| `ScriptFile` | JavaScript file |
| `SpriteSheetFile` | Spritesheet (image + frame config) |
| `TextFile` | Plain text |
| `TilemapCSVFile` | Tilemap from CSV |
| `TilemapImpactFile` | Tilemap from Impact.js format |
| `TilemapJSONFile` | Tilemap from Tiled JSON |
| `UnityAtlasFile` | Unity texture atlas |
| `VideoFile` | Video file |
| `XMLFile` | XML data |

**When to use:** All loading in `preload()` via `this.load.image()`, `this.load.audio()`, `this.load.tilemapTiledJSON()`, etc.

---

## Math

Math utilities, vectors, matrices, and random number generation.

| Class | Purpose |
|---|---|
| `Phaser.Math.Vector2` | 2D vector (x, y) |
| `Phaser.Math.Vector3` | 3D vector (x, y, z) |
| `Phaser.Math.Vector4` | 4D vector |
| `Phaser.Math.Matrix3` | 3x3 matrix |
| `Phaser.Math.Matrix4` | 4x4 matrix |
| `Phaser.Math.Quaternion` | Quaternion rotation |
| `Phaser.Math.Euler` | Euler angle rotation |
| `Phaser.Math.RandomDataGenerator` | Seedable random number generator |

**Utility functions** (not classes): `Phaser.Math.Between()`, `Phaser.Math.FloatBetween()`, `Phaser.Math.Clamp()`, `Phaser.Math.Angle.Between()`, `Phaser.Math.Distance.Between()`, and many more.

---

## Plugins

Extend Phaser with custom or third-party plugins.

| Class | Purpose |
|---|---|
| `Phaser.Plugins.BasePlugin` | Base class for global plugins |
| `Phaser.Plugins.PluginManager` | Manages plugin installation and lifecycle |
| `Phaser.Plugins.ScenePlugin` | Base class for per-scene plugins |

---

## Renderer

Canvas and WebGL rendering systems.

| Class | Purpose |
|---|---|
| `Phaser.Renderer.Canvas.CanvasRenderer` | Canvas 2D renderer |
| `Phaser.Renderer.WebGL.WebGLRenderer` | WebGL renderer |
| `Phaser.Renderer.WebGL.WebGLPipeline` | Base rendering pipeline |
| `Phaser.Renderer.WebGL.PipelineManager` | Manages rendering pipelines |
| `Phaser.Renderer.WebGL.RenderTarget` | Render target (framebuffer wrapper) |
| `Phaser.Renderer.WebGL.WebGLShader` | Shader program wrapper |

### Built-in Pipelines

| Pipeline | Purpose |
|---|---|
| `MultiPipeline` | Default multi-texture batching pipeline |
| `SinglePipeline` | Single texture pipeline |
| `MobilePipeline` | Optimized for mobile devices |
| `LightPipeline` | 2D lighting |
| `PointLightPipeline` | Point light rendering |
| `RopePipeline` | Rope Game Object rendering |
| `BitmapMaskPipeline` | Bitmap mask rendering |
| `UtilityPipeline` | Internal utility operations |
| `PostFXPipeline` | Post-processing effects base |
| `PreFXPipeline` | Pre-processing effects base |
| `FXPipeline` | FX controller pipeline |

### FX Pipelines

`BarrelFXPipeline`, `BloomFXPipeline`, `BlurFXPipeline`, `BokehFXPipeline`, `CircleFXPipeline`, `ColorMatrixFXPipeline`, `DisplacementFXPipeline`, `GlowFXPipeline`, `GradientFXPipeline`, `PixelateFXPipeline`, `ShadowFXPipeline`, `ShineFXPipeline`, `VignetteFXPipeline`, `WipeFXPipeline`

**When to use:** Advanced rendering — custom shaders, post-processing, 2D lighting. Most games use the default pipelines automatically.

---

## Scale

Responsive game scaling and fullscreen management.

| Class | Purpose |
|---|---|
| `Phaser.Scale.ScaleManager` | Handle game scaling, resize events, and fullscreen mode |

**When to use:** Configure in game config under `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`.

---

## Scenes

Scene lifecycle, management, and transitions.

| Class | Purpose |
|---|---|
| `Phaser.Scene` | Base class for all scenes |
| `Phaser.Scenes.SceneManager` | Manages all scenes (start, stop, switch, sleep) |
| `Phaser.Scenes.ScenePlugin` | Per-scene plugin — `this.scene` |
| `Phaser.Scenes.Systems` | Internal scene subsystem manager |

**When to use:** Extend `Phaser.Scene` for class-based scenes, or use config-based scenes with `preload/create/update` functions.

---

## Sound

Audio playback across different backends.

| Class | Purpose |
|---|---|
| `Phaser.Sound.BaseSoundManager` | Base audio manager |
| `Phaser.Sound.BaseSound` | Base sound object |
| `Phaser.Sound.WebAudioSoundManager` | Web Audio API backend |
| `Phaser.Sound.WebAudioSound` | Web Audio sound instance |
| `Phaser.Sound.HTML5AudioSoundManager` | HTML5 Audio backend |
| `Phaser.Sound.HTML5AudioSound` | HTML5 Audio sound instance |
| `Phaser.Sound.NoAudioSoundManager` | Silent fallback |
| `Phaser.Sound.NoAudioSound` | Silent sound instance |

**When to use:** `this.sound.add('key')` to create, `.play()` to play. Phaser auto-selects Web Audio or HTML5 Audio.

---

## Structs

Utility data structures.

| Class | Purpose |
|---|---|
| `Phaser.Structs.List` | Ordered list with add/remove/sort |
| `Phaser.Structs.Map` | Key-value map |
| `Phaser.Structs.ProcessQueue` | Queue with pending/active/destroy lifecycle |
| `Phaser.Structs.RTree` | R-Tree spatial index (used by physics) |
| `Phaser.Structs.Set` | Unique value set |
| `Phaser.Structs.Size` | Width/height with aspect ratio handling |

---

## Textures

Texture and frame management.

| Class | Purpose |
|---|---|
| `Phaser.Textures.TextureManager` | Manages all loaded textures — `this.textures` |
| `Phaser.Textures.Texture` | A single texture (contains frames) |
| `Phaser.Textures.TextureSource` | Underlying image/canvas source |
| `Phaser.Textures.Frame` | A rectangular region within a texture |
| `Phaser.Textures.CanvasTexture` | Texture backed by a Canvas (drawable) |
| `Phaser.Textures.DynamicTexture` | Render-to-texture (v3.60+) |

---

## Tilemaps

Tile-based level design (Tiled editor integration).

| Class | Purpose |
|---|---|
| `Phaser.Tilemaps.Tilemap` | The tilemap itself |
| `Phaser.Tilemaps.TilemapLayer` | A single layer within a tilemap |
| `Phaser.Tilemaps.Tile` | A single tile |
| `Phaser.Tilemaps.Tileset` | A tileset (image + tile data) |
| `Phaser.Tilemaps.LayerData` | Raw layer data |
| `Phaser.Tilemaps.MapData` | Raw map data |
| `Phaser.Tilemaps.ObjectLayer` | Object layer from Tiled |
| `Phaser.Tilemaps.ObjectHelper` | Helper for Tiled object conversion |
| `Phaser.Tilemaps.ImageCollection` | Tile image collection |

**When to use:** Import maps from Tiled editor via `this.load.tilemapTiledJSON()` then `this.make.tilemap()`.

---

## Time

Timers, delays, and scheduled events.

| Class | Purpose |
|---|---|
| `Phaser.Time.Clock` | Scene time manager — `this.time` |
| `Phaser.Time.TimerEvent` | A scheduled timer (delay, repeat, loop) |
| `Phaser.Time.Timeline` | Sequence of timed actions |

**When to use:** `this.time.addEvent({ delay: 1000, callback: fn, loop: true })` for repeating timers.

---

## Tweens

Property animation (movement, fading, scaling over time).

| Class | Purpose |
|---|---|
| `Phaser.Tweens.TweenManager` | Scene tween manager — `this.tweens` |
| `Phaser.Tweens.BaseTween` | Base tween class |
| `Phaser.Tweens.Tween` | A single tween |
| `Phaser.Tweens.TweenChain` | A chain of sequential tweens |
| `Phaser.Tweens.TweenData` | Data for a single tween target/property |
| `Phaser.Tweens.BaseTweenData` | Base tween data |
| `Phaser.Tweens.TweenFrameData` | Frame-based tween data |

**When to use:** `this.tweens.add({ targets: sprite, x: 400, duration: 1000, ease: 'Power2' })`.

---

## Geometry

Geometric shape classes for calculations and rendering.

| Class | Purpose |
|---|---|
| `Phaser.Geom.Circle` | Circle shape |
| `Phaser.Geom.Ellipse` | Ellipse shape |
| `Phaser.Geom.Line` | Line segment |
| `Phaser.Geom.Point` | 2D point |
| `Phaser.Geom.Polygon` | Polygon |
| `Phaser.Geom.Rectangle` | Rectangle |
| `Phaser.Geom.Triangle` | Triangle |
| `Phaser.Geom.Mesh.Face` | 3D mesh face |
| `Phaser.Geom.Mesh.Vertex` | 3D mesh vertex |

**When to use:** Collision zones, random point generation within shapes, geometry calculations.
