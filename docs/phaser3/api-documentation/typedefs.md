# Phaser 3.90.0 API — Typedefs

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Classes](classes.md) | [Game Object Classes](game-object-classes.md)

## Overview

Typedefs define the **shape of configuration objects, callback signatures, and data structures** used throughout Phaser. They are not runtime classes — they describe the expected structure of plain objects you pass to Phaser methods.

Understanding typedefs helps you know exactly what properties a config object accepts.

---

## Typedef Namespaces

### Phaser (Top-Level)

| Typedef | Describes |
|---|---|
| `Phaser.Types.Core.GameConfig` | The main game configuration object |
| `Phaser.Types.Core.PhysicsConfig` | Physics system configuration |
| `Phaser.Types.Core.RenderConfig` | Renderer configuration |
| `Phaser.Types.Core.ScaleConfig` | Scale manager configuration |
| `Phaser.Types.Core.FPSConfig` | Frame rate configuration |
| `Phaser.Types.Core.AudioConfig` | Audio system configuration |
| `Phaser.Types.Core.PluginObject` | Plugin configuration |
| `Phaser.Types.Core.InputConfig` | Input system configuration |
| `Phaser.Types.Core.DOMContainerConfig` | DOM container configuration |

---

### Phaser.Types.Scenes

| Typedef | Describes |
|---|---|
| `SceneConfig` | Scene configuration (key, active, visible, cameras, physics, etc.) |
| `SettingsConfig` | Scene settings |
| `SettingsObject` | Runtime scene settings |
| `SceneTransitionConfig` | Transition between scenes |
| `CreateSceneFromObjectConfig` | Create scene from plain object |

---

### Phaser.Types.GameObjects

| Typedef | Describes |
|---|---|
| `GameObjectConfig` | Base Game Object config (x, y, depth, flipX, etc.) |
| `JSONGameObject` | Serialized Game Object |

#### Text

| Typedef | Describes |
|---|---|
| `Text.TextConfig` | Text creation config |
| `Text.TextStyle` | Text style properties (font, color, stroke, etc.) |
| `Text.TextMetrics` | Font measurement results |
| `Text.TextWordWrap` | Word wrap configuration |

#### Sprite

| Typedef | Describes |
|---|---|
| `Sprite.SpriteConfig` | Sprite creation config |

#### Group

| Typedef | Describes |
|---|---|
| `Group.GroupConfig` | Group creation config |
| `Group.GroupCreateConfig` | Auto-create children config |
| `Group.GroupCallback` | Group iteration callback |

#### Particles

| Typedef | Describes |
|---|---|
| `Particles.ParticleEmitterConfig` | Emitter configuration |
| `Particles.EmitterOpOnEmitType` | Emit-time value generators |
| `Particles.EmitterOpOnUpdateType` | Update-time value generators |
| `Particles.ParticleDeathCallback` | Death callback |
| `Particles.ParticleEmitterCallback` | Emitter callback |
| `Particles.GravityWellConfig` | Gravity well configuration |
| `Particles.ParticleEmitterBounds` | Emitter bounds |

#### Graphics

| Typedef | Describes |
|---|---|
| `Graphics.Options` | Graphics creation options |
| `Graphics.Styles` | Fill/line style configuration |
| `Graphics.LineStyle` | Line drawing style |
| `Graphics.FillStyle` | Fill style |
| `Graphics.RoundedRectRadius` | Rounded rectangle corner radii |

#### Other Game Objects

| Typedef | Describes |
|---|---|
| `BitmapText.BitmapTextConfig` | Bitmap text config |
| `Container.ContainerConfig` | Container config |
| `Mesh.MeshConfig` | Mesh config |
| `NineSlice.NineSliceConfig` | Nine-slice config |
| `PathFollower.PathConfig` | Path follower config |
| `Plane.PlaneConfig` | Plane config |
| `RenderTexture.RenderTextureConfig` | Render texture config |
| `Rope.RopeConfig` | Rope config |
| `Shader.ShaderConfig` | Shader config |
| `TileSprite.TileSpriteConfig` | Tile sprite config |
| `Video.VideoConfig` | Video config |
| `Zone.ZoneConfig` | Zone config |

---

### Phaser.Types.Animations

| Typedef | Describes |
|---|---|
| `Animation` | Animation definition config |
| `AnimationFrame` | Single frame config |
| `GenerateFrameNames` | Config for `generateFrameNames()` |
| `GenerateFrameNumbers` | Config for `generateFrameNumbers()` |
| `PlayAnimationConfig` | Config passed to `play()` |
| `JSONAnimation` | Serialized animation |
| `JSONAnimationFrame` | Serialized animation frame |

---

### Phaser.Types.Cameras.Scene2D

| Typedef | Describes |
|---|---|
| `CameraConfig` | Camera configuration |
| `CameraFadeCallback` | Fade effect callback |
| `CameraFlashCallback` | Flash effect callback |
| `CameraPanCallback` | Pan effect callback |
| `CameraShakeCallback` | Shake effect callback |
| `CameraZoomCallback` | Zoom effect callback |
| `JSONCamera` | Serialized camera |

---

### Phaser.Types.Input

| Typedef | Describes |
|---|---|
| `InteractiveObject` | Interactive object config |
| `InputConfiguration` | Input config for Game Objects |
| `HitAreaCallback` | Custom hit area check function |
| `InputPluginContainer` | Input plugin registration |
| `EventData` | Event data passed to callbacks |

#### Keyboard

| Typedef | Describes |
|---|---|
| `Keyboard.CursorKeys` | Cursor key references (up, down, left, right, space, shift) |
| `Keyboard.KeyComboConfig` | Key combo configuration |

#### Gamepad

| Typedef | Describes |
|---|---|
| `Gamepad.Pad` | Gamepad state |

---

### Phaser.Types.Loader

| Typedef | Describes |
|---|---|
| `FileConfig` | Base file loading config |
| `XHRSettingsObject` | XMLHttpRequest settings |

#### File Types

| Typedef | Describes |
|---|---|
| `FileTypes.AtlasJSONFileConfig` | Atlas JSON file config |
| `FileTypes.AudioFileConfig` | Audio file config |
| `FileTypes.AudioSpriteFileConfig` | Audio sprite config |
| `FileTypes.BitmapFontFileConfig` | Bitmap font config |
| `FileTypes.ImageFileConfig` | Image file config |
| `FileTypes.JSONFileConfig` | JSON file config |
| `FileTypes.MultiAtlasFileConfig` | Multi-atlas config |
| `FileTypes.PackFileConfig` | Pack file config |
| `FileTypes.SpriteSheetFileConfig` | Spritesheet config |
| `FileTypes.TilemapJSONFileConfig` | Tilemap JSON config |
| `FileTypes.VideoFileConfig` | Video file config |

---

### Phaser.Types.Physics.Arcade

| Typedef | Describes |
|---|---|
| `ArcadeBodyBounds` | Body boundary rectangle |
| `ArcadeBodyCollision` | Collision state (up, down, left, right) |
| `ArcadePhysicsCallback` | Collision/overlap callback |
| `ArcadeWorldConfig` | World configuration |
| `ArcadeWorldDefaults` | Default body values |
| `CheckCollisionObject` | World bounds collision config |
| `GameObjectWithBody` | Game Object + Body union type |
| `GameObjectWithDynamicBody` | Game Object + Dynamic Body |
| `GameObjectWithStaticBody` | Game Object + Static Body |
| `PhysicsGroupConfig` | Physics group config |
| `PhysicsGroupDefaults` | Physics group default values |

---

### Phaser.Types.Physics.Matter

| Typedef | Describes |
|---|---|
| `MatterBodyConfig` | Matter body configuration |
| `MatterBodyTileOptions` | Tile body options |
| `MatterChamferConfig` | Chamfer (rounded corners) config |
| `MatterCollisionData` | Collision event data |
| `MatterConstraintConfig` | Constraint/joint config |
| `MatterSetBodyConfig` | Set body shape config |
| `MatterTileOptions` | Tilemap physics options |
| `MatterWorldConfig` | World configuration |

---

### Phaser.Types.Tweens

| Typedef | Describes |
|---|---|
| `TweenBuilderConfig` | Tween creation config |
| `TweenChainBuilderConfig` | Tween chain config |
| `GetEndCallback` | Dynamic end value function |
| `GetStartCallback` | Dynamic start value function |
| `NumberTweenBuilderConfig` | Number tween config |
| `StaggerConfig` | Stagger timing config |
| `TweenCallbacks` | Callback functions |
| `TweenDataConfig` | Per-property tween config |
| `TweenOnCompleteCallback` | Complete callback signature |
| `TweenOnStartCallback` | Start callback signature |
| `TweenOnUpdateCallback` | Update callback signature |
| `TweenOnRepeatCallback` | Repeat callback signature |
| `TweenOnYoyoCallback` | Yoyo callback signature |

---

### Phaser.Types.Tilemaps

| Typedef | Describes |
|---|---|
| `TilemapConfig` | Tilemap creation config |
| `LayerDataConfig` | Layer data |
| `ObjectLayerConfig` | Object layer |
| `StyleConfig` | Tile rendering style |
| `TiledObject` | Tiled editor object |
| `TileToWorldXYConfig` | Tile to pixel conversion config |
| `FilteringOptions` | Tile filtering (isNotEmpty, isColliding, etc.) |

---

### Phaser.Types.Time

| Typedef | Describes |
|---|---|
| `TimerEventConfig` | Timer event configuration (delay, callback, repeat, loop) |
| `TimelineEvent` | Timeline event entry |
| `TimelineEventConfig` | Timeline event configuration |

---

### Phaser.Types.Sound

| Typedef | Describes |
|---|---|
| `SoundConfig` | Sound playback config (volume, loop, rate, detune, seek) |
| `SoundMarker` | Named section within an audio file |

---

### Other Typedef Namespaces

| Namespace | Covers |
|---|---|
| `Phaser.Types.Actions` | Action function configs (spread, rotate, place on shapes) |
| `Phaser.Types.Cameras.Controls` | Camera control configs |
| `Phaser.Types.Create` | Texture generation configs |
| `Phaser.Types.Curves` | Curve/path configs |
| `Phaser.Types.Display` | Color/mask configs |
| `Phaser.Types.Math` | Math utility configs (Vector2Like, SinCosTable) |
| `Phaser.Types.Plugins` | Plugin configs (GlobalPlugin, ScenePluginConfig) |
| `Phaser.Types.Renderer.Snapshot` | Screenshot config |
| `Phaser.Types.Renderer.WebGL` | WebGL pipeline/shader configs |
| `Phaser.Types.Textures` | Texture/frame configs |
| `Phaser.Device` | Device capability detection results |
| `Phaser.Scale` | Scale manager typedefs |
