# Part 2 — Loading Assets

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part2](https://phaser.io/tutorials/making-your-first-phaser-3-game/part2)

## What Changes From Part 1

The empty `preload()` function is now filled with asset-loading calls.

## The Phaser Loader

All asset loading happens inside the `preload()` function. Phaser will not start the `create()` function until every asset in `preload()` has finished loading.

## Loading Code

```js
function preload () {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', {
        frameWidth: 32,
        frameHeight: 48
    });
}
```

## Assets Loaded

| Asset Key | Type | File | Dimensions / Notes |
|---|---|---|---|
| `'sky'` | Image | `assets/sky.png` | Background image (800x600) |
| `'ground'` | Image | `assets/platform.png` | Platform/ground tile |
| `'star'` | Image | `assets/star.png` | Collectible star |
| `'bomb'` | Image | `assets/bomb.png` | Enemy bomb |
| `'dude'` | Spritesheet | `assets/dude.png` | Player character, 9 frames, each 32x48 px |

## Key Concepts

### Asset Keys
- The first argument to every load call (e.g., `'sky'`, `'dude'`) is a **string key**.
- You reference this key later whenever you need the asset (creating sprites, images, etc.).
- Keys must be **unique** within each asset type.

### `this.load.image(key, url)`
- Loads a single image file.
- The `url` is relative to the HTML file (or your asset path configuration).

### `this.load.spritesheet(key, url, config)`
- Loads a spritesheet image and splits it into individual frames.
- `frameWidth` and `frameHeight` define the size of each frame in the sheet.
- Frames are numbered starting from `0`.

### Important: Web Server Required
- Assets must be served from a **web server** (even localhost).
- Opening the HTML file directly via `file://` will fail due to browser security (CORS).

## APIs Introduced

- `this.load.image(key, url)` — load a single image
- `this.load.spritesheet(key, url, frameConfig)` — load a spritesheet with frame dimensions

## Recap Checklist

- [ ] All five assets loaded in `preload()` with unique string keys
- [ ] Understand the difference between `image` and `spritesheet` loading
- [ ] Know that the dude spritesheet has frames of 32x48 pixels
- [ ] Assets are served from a local web server, not `file://`
