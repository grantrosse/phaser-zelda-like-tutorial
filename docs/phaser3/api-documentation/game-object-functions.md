# Phaser 3.90.0 API — Game Object Functions

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Game Object Classes](game-object-classes.md) | [Classes](classes.md)

## Overview

These are standalone functions (not class methods) used internally by Phaser when constructing, animating, and rendering Game Objects. Most developers rarely call these directly, but understanding them helps when building custom Game Objects or debugging rendering issues.

---

## Functions

### Phaser.GameObjects.BuildGameObject

```
BuildGameObject(scene, gameObject, config)
```

**Purpose:** Applies a common configuration object to a newly created Game Object.

**What it sets from config:**
- `x`, `y` — position
- `depth` — rendering depth
- `flipX`, `flipY` — flip state
- `scale` / `scaleX`, `scaleY` — scale
- `scrollFactor` / `scrollFactorX`, `scrollFactorY` — camera scroll factor
- `rotation` / `angle` — rotation
- `alpha` — transparency
- `origin` / `originX`, `originY` — origin point
- `blendMode` — blend mode
- `visible` — visibility
- `add` — whether to add to the scene (default `true`)

**When to use:** When creating custom Game Object factories that accept a config object.

---

### Phaser.GameObjects.BuildGameObjectAnimation

```
BuildGameObjectAnimation(sprite, config)
```

**Purpose:** Applies animation configuration to a Sprite from a config object.

**What it sets from config:**
- `anims.key` — animation key to play
- `anims.startFrame` — frame to start on
- `anims.delay` — delay before starting
- `anims.repeat` — number of repeats
- `anims.repeatDelay` — delay between repeats
- `anims.yoyo` — play forward then backward
- `anims.play` — whether to immediately start playing
- `anims.delayedPlay` — delayed play start time

**When to use:** When building custom Sprite factories that accept animation config.

---

### Phaser.GameObjects.GetCalcMatrix

```
GetCalcMatrix(src, camera, parentMatrix)
```

**Purpose:** Calculates the combined transformation matrix for rendering a Game Object. Takes into account the object's transform, its parent (if in a Container), and the camera.

**Returns:** An object containing:
- `calc` — the final combined TransformMatrix
- `sprite` — the Game Object's local TransformMatrix
- `camera` — the Camera's TransformMatrix

**When to use:** Custom rendering pipelines or when you need the exact screen-space position of a Game Object.

---

### Phaser.GameObjects.GetTextSize

```
GetTextSize(text, size, lines)
```

**Purpose:** Calculates the rendered size of a Text Game Object based on its content, style, and word wrapping.

**Returns:** An object with:
- `width` — total width of the text block
- `height` — total height of the text block
- `lines` — number of lines
- `lineWidths` — array of individual line widths
- `lineSpacing` — spacing between lines
- `lineHeight` — height of a single line

**When to use:** When you need to know the dimensions of text before positioning or creating backgrounds.

---

### Phaser.GameObjects.MeasureText

```
MeasureText(textStyle)
```

**Purpose:** Measures the font metrics (ascent, descent, fontSize) for a given TextStyle. Uses a hidden Canvas context to measure.

**Returns:** An object with font metrics:
- `ascent` — distance from baseline to top
- `descent` — distance from baseline to bottom
- `fontSize` — total font height

**When to use:** When calculating precise text positioning or building custom text rendering.

---

## Summary Table

| Function | Input | Output | Common Use Case |
|---|---|---|---|
| `BuildGameObject` | Scene, GameObject, config | Configured GameObject | Custom factories |
| `BuildGameObjectAnimation` | Sprite, config | Configured Sprite | Custom sprite factories |
| `GetCalcMatrix` | Source, Camera, ParentMatrix | Combined transform matrices | Custom rendering |
| `GetTextSize` | Text, Size, Lines | Text dimensions object | Text layout |
| `MeasureText` | TextStyle | Font metrics object | Text measurement |
