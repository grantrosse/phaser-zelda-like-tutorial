# Phaser 3.90.0 API — Constants

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Classes](classes.md) | [Events](events.md)

## Overview

Constants are static values used throughout Phaser for configuration, rendering modes, physics types, and more. They live directly on the `Phaser` namespace and its sub-namespaces.

---

## Phaser (Top-Level)

The core Phaser constants for renderer selection:

| Constant | Value | Purpose |
|---|---|---|
| `Phaser.AUTO` | 0 | Auto-detect best renderer (WebGL → Canvas fallback) |
| `Phaser.CANVAS` | 1 | Force Canvas 2D rendering |
| `Phaser.WEBGL` | 2 | Force WebGL rendering |
| `Phaser.HEADLESS` | 3 | No rendering (server-side / testing) |
| `Phaser.VERSION` | `'3.90.0'` | Current Phaser version string |

**Usage:** `type: Phaser.AUTO` in game config.

---

## Phaser.BlendModes

Blend mode constants for compositing Game Objects:

| Constant | Description |
|---|---|
| `NORMAL` | Default blending |
| `ADD` | Additive blending (brightens) |
| `MULTIPLY` | Multiply blending (darkens) |
| `SCREEN` | Screen blending (lightens) |
| `OVERLAY` | Overlay blending |
| `DARKEN` | Keeps darker pixels |
| `LIGHTEN` | Keeps lighter pixels |
| `COLOR_DODGE` | Color dodge |
| `COLOR_BURN` | Color burn |
| `HARD_LIGHT` | Hard light |
| `SOFT_LIGHT` | Soft light |
| `DIFFERENCE` | Difference |
| `EXCLUSION` | Exclusion |
| `HUE` | Hue blending |
| `SATURATION` | Saturation blending |
| `COLOR` | Color blending |
| `LUMINOSITY` | Luminosity blending |
| `ERASE` | Erase mode (for DynamicTexture / RenderTexture) |
| `SOURCE_IN` | Source-in compositing |
| `SOURCE_OUT` | Source-out compositing |
| `SOURCE_ATOP` | Source-atop compositing |
| `DESTINATION_OVER` | Destination-over compositing |
| `DESTINATION_IN` | Destination-in compositing |
| `DESTINATION_OUT` | Destination-out compositing |
| `DESTINATION_ATOP` | Destination-atop compositing |
| `LIGHTER` | Lighter compositing |
| `COPY` | Copy compositing |
| `XOR` | XOR compositing |

**Usage:** `sprite.setBlendMode(Phaser.BlendModes.ADD)`

---

## Phaser.Core

| Constant | Purpose |
|---|---|
| Various internal boot/config constants | Used during game initialization |

---

## Phaser.Display

| Constant | Purpose |
|---|---|
| Display-related constants | Color spaces, mask types |

---

## Phaser.FX

| Constant | Purpose |
|---|---|
| FX type identifiers | Identify which FX effect is applied |

---

## Phaser.GameObjects

| Constant | Purpose |
|---|---|
| `RENDER_MASK` | Internal render flags |
| Various internal rendering flags | Used by the display list |

---

## Phaser.Input

| Constant | Purpose |
|---|---|
| Input event type constants | Pointer, keyboard, gamepad event identifiers |

---

## Phaser.Math

| Constant | Value | Purpose |
|---|---|---|
| `PI2` | `Math.PI * 2` | Full circle in radians |
| `TAU` | `Math.PI * 0.5` | Quarter circle |
| `EPSILON` | `1.0e-6` | Tiny value for float comparisons |
| `DEG_TO_RAD` | `Math.PI / 180` | Degree → radian conversion factor |
| `RAD_TO_DEG` | `180 / Math.PI` | Radian → degree conversion factor |
| `RND` | Instance | Global RandomDataGenerator |
| `MIN_SAFE_INTEGER` | `-Number.MAX_SAFE_INTEGER` | Minimum safe integer |
| `MAX_SAFE_INTEGER` | `Number.MAX_SAFE_INTEGER` | Maximum safe integer |

---

## Phaser.Renderer

| Constant | Purpose |
|---|---|
| Renderer type constants | Canvas vs WebGL identification |
| Pipeline type constants | Identify rendering pipelines |

---

## Phaser.Scale

Scale mode constants for responsive game sizing:

| Constant | Description |
|---|---|
| `NONE` | No scaling |
| `WIDTH_CONTROLS_HEIGHT` | Width determines height (keeps aspect ratio) |
| `HEIGHT_CONTROLS_WIDTH` | Height determines width (keeps aspect ratio) |
| `FIT` | Fit within parent, maintaining aspect ratio |
| `ENVELOP` | Fill parent, maintaining aspect ratio (may crop) |
| `RESIZE` | Resize canvas to match parent |
| `EXPAND` | Expand to fill parent |

Auto-center constants:

| Constant | Description |
|---|---|
| `NO_CENTER` | No centering |
| `CENTER_BOTH` | Center horizontally and vertically |
| `CENTER_HORIZONTALLY` | Center horizontally only |
| `CENTER_VERTICALLY` | Center vertically only |

**Usage:** `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`

---

## Phaser.Structs

| Constant | Purpose |
|---|---|
| Internal structure constants | Used by data structures |

---

## Phaser.Textures

| Constant | Purpose |
|---|---|
| Texture source type identifiers | Image, Canvas, Video, etc. |

---

## Phaser.Tilemaps

Tilemap orientation and rendering constants:

| Constant | Description |
|---|---|
| `ORTHOGONAL` | Standard top-down grid |
| `ISOMETRIC` | Isometric (diamond) layout |
| `STAGGERED` | Staggered layout |
| `HEXAGONAL` | Hexagonal tile layout |

---

## Phaser.Tweens

Tween state constants:

| Constant | Description |
|---|---|
| `CREATED` | Tween has been created |
| `PLAYING` | Tween is actively playing |
| `PAUSED` | Tween is paused |
| `COMPLETE` | Tween has completed |
| `PENDING_REMOVE` | Tween is flagged for removal |
| `DESTROYED` | Tween has been destroyed |
