# Part 3 — World Building

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part3](https://phaser.io/tutorials/making-your-first-phaser-3-game/part3)

## What Changes From Part 2

The `create()` function now adds images to the game world, building the visible scene.

## Adding a Background

```js
function create () {
    this.add.image(400, 300, 'sky');
}
```

This displays the sky background image centered on the screen.

## Coordinate System

| Concept | Value |
|---|---|
| Origin point | Top-left corner = `(0, 0)` |
| X axis | Increases to the **right** |
| Y axis | Increases **downward** |
| Canvas size | 800 wide × 600 tall |

## Game Object Positioning

### Default Origin
- In Phaser 3, all Game Objects are positioned based on their **center** by default.
- The sky image is 800×600 px. Placing it at `(400, 300)` centers it exactly on the 800×600 canvas.
- If you placed it at `(0, 0)`, only the bottom-right quarter would be visible.

### Changing the Origin
- You can change the origin using `setOrigin()`:
  ```js
  this.add.image(0, 0, 'sky').setOrigin(0, 0);
  ```
- `setOrigin(0, 0)` = top-left corner positioning (like CSS `background-position: 0 0`).

## The Display List

- Every Game Object you add goes onto the **Display List**.
- Objects are rendered in the order they are added — later objects draw **on top** of earlier ones.
- The sky should be added **first** so everything else renders above it.

## Key Concepts

| Concept | Explanation |
|---|---|
| `this.add.image(x, y, key)` | Creates a static image Game Object at coordinates (x, y) using asset key |
| Display order | First added = drawn first (behind), last added = drawn last (on top) |
| Default origin | Center of the image `(0.5, 0.5)` |
| `setOrigin(x, y)` | Changes the anchor/origin point for positioning |

## APIs Introduced

- `this.add.image(x, y, key)` — add an Image Game Object to the scene
- `.setOrigin(x, y)` — change the origin/anchor point of a Game Object

## Recap Checklist

- [ ] Understand the coordinate system (0,0 = top-left, Y grows downward)
- [ ] Know that Game Objects default to center-origin positioning
- [ ] Know the Display List determines render order (first added = behind)
- [ ] Background image placed at (400, 300) to fill the 800×600 canvas
