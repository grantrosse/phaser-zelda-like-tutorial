# Part 1 — Introduction

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part1](https://phaser.io/tutorials/making-your-first-phaser-3-game/part1)

## What This Tutorial Builds

A small platformer game where a player character runs and jumps around platforms, collects stars, and avoids bouncing bombs. Through the process, you learn the core features of the Phaser 3 framework.

## What is Phaser?

- An **HTML5 game framework** for making cross-browser games quickly.
- Works on both **desktop and mobile** browsers.
- Only browser requirement: support for the `<canvas>` tag.

## Prerequisites

| Requirement | Details |
|---|---|
| JavaScript knowledge | Very basic level |
| Getting Started Guide | Complete first — covers downloading Phaser, local dev server setup, project structure |
| Tutorial resources | [Download ZIP](https://cdn.phaser.io/tutorials/making-your-first-phaser-3-game/phaser3-tutorial-src.zip) containing code for each step + game assets |

## Game Configuration Object

The `config` object is how you configure your Phaser game:

```js
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload () {
}

function create () {
}

function update () {
}
```

### Key Config Properties

| Property | Value | Purpose |
|---|---|---|
| `type` | `Phaser.AUTO` | Renderer selection — tries WebGL first, falls back to Canvas |
| `type` | `Phaser.CANVAS` | Force Canvas renderer |
| `type` | `Phaser.WEBGL` | Force WebGL renderer |
| `width` | `800` | Canvas width in pixels |
| `height` | `600` | Canvas height in pixels |
| `scene` | `{ preload, create, update }` | Scene lifecycle functions |

### Important Notes

- `Phaser.AUTO` is the **recommended** renderer setting.
- The canvas element is appended to the document at the script location, or you can specify a `parent` container in config.
- The game world can be any size, but `width`/`height` set the **display resolution**.
- **Phaser 2 vs Phaser 3**: In Phaser 2, the `game` object was a gateway to all internal systems and was stored globally. In Phaser 3 this is no longer the case — the game instance doesn't need to be a global variable.

## Three Core Scene Functions

| Function | When It Runs | Purpose |
|---|---|---|
| `preload()` | Before scene starts | Load assets (images, audio, spritesheets) |
| `create()` | After preload completes | Set up game objects, physics, input |
| `update()` | Every frame (~60fps) | Game loop logic (movement, collision checks) |

## APIs Introduced

- `Phaser.Game` — main game class
- `Phaser.AUTO` / `Phaser.CANVAS` / `Phaser.WEBGL` — renderer constants

## Recap Checklist

- [ ] Understand the config object structure
- [ ] Know the three renderer options and why AUTO is recommended
- [ ] Know the three scene lifecycle functions and when each runs
- [ ] Have the tutorial ZIP downloaded and a local dev server ready
