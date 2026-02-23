# Part 7 — Controlling the Player with the Keyboard

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part7](https://phaser.io/tutorials/making-your-first-phaser-3-game/part7)

## What Changes From Part 6

Keyboard input is wired up so the player can move left/right and jump using arrow keys. The `update()` function is used for the first time.

## Creating Cursor Keys

In `create()`:

```js
var cursors;

function create () {
    // ... other setup code ...

    cursors = this.input.keyboard.createCursorKeys();
}
```

`createCursorKeys()` returns an object with these keys:
- `cursors.up`
- `cursors.down`
- `cursors.left`
- `cursors.right`
- `cursors.space`
- `cursors.shift`

Each key object has an `.isDown` boolean that is `true` while the key is held.

## The Update Loop

```js
function update () {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}
```

## Movement Constants

| Action | Velocity | Notes |
|---|---|---|
| Move left | `-160` px/s | Negative X = leftward |
| Move right | `+160` px/s | Positive X = rightward |
| Jump | `-330` px/s | Negative Y = upward; only when touching ground |
| Stop | `0` px/s | No horizontal movement when no key pressed |

## Input Logic Flow

```
Every frame (update):
│
├─ Left arrow held?
│   ├─ Yes → velocity X = -160, play 'left' anim
│   └─ No ─┐
│           ├─ Right arrow held?
│           │   ├─ Yes → velocity X = +160, play 'right' anim
│           │   └─ No → velocity X = 0, play 'turn' anim
│
├─ Up arrow held AND touching ground?
│   └─ Yes → velocity Y = -330 (jump)
```

## Key Concepts

### Stop-Start Movement
- There is **no momentum or acceleration** — the player moves at full speed instantly when a key is pressed and stops instantly when released.
- This is done by setting velocity directly each frame.

### Jump Guard: `player.body.touching.down`
- The jump only triggers when the player is standing on something (`touching.down === true`).
- This prevents **mid-air jumping** (no double-jumps).

### `anims.play(key, true)`
- The second argument `true` means "if this animation is already playing, don't restart it."
- Without `true`, the animation would restart from frame 0 every single frame, appearing frozen on the first frame.

### Horizontal vs Vertical Independence
- The left/right check is `if / else if / else` — mutually exclusive.
- The jump check is **separate** — you can jump while moving left or right.

## APIs Introduced

- `this.input.keyboard.createCursorKeys()` — create an object with arrow key + space + shift references
- `cursors.left.isDown` — check if a key is currently held
- `player.setVelocityX(value)` — set horizontal velocity
- `player.setVelocityY(value)` — set vertical velocity
- `player.anims.play(key, ignoreIfPlaying)` — play a named animation on the sprite

## Recap Checklist

- [ ] Cursor keys created in `create()`, polled in `update()`
- [ ] Left/right movement at ±160 px/s with corresponding animations
- [ ] Jump at -330 px/s only when `player.body.touching.down` is true
- [ ] Player stops (velocity 0) and plays 'turn' when no movement key held
- [ ] Second argument `true` in `anims.play()` prevents animation restart flicker
