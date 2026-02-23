# Part 10 — Bouncing Bombs

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part10](https://phaser.io/tutorials/making-your-first-phaser-3-game/part10)

## What Changes From Part 9

Bombs are introduced as enemies. When all stars are collected they respawn and a bomb is released. If the player touches a bomb the game ends.

## Creating the Bombs Group

```js
var bombs;
var gameOver = false;

function create () {
    // ... all previous setup ...

    bombs = this.physics.add.group();

    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
}
```

## Spawning Bombs When Stars Are Collected

The `collectStar` function is updated to check if all stars are collected:

```js
function collectStar (player, star) {
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    // Check if all stars have been collected
    if (stars.countActive(true) === 0) {
        // Re-enable all stars
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        // Spawn a bomb on the opposite side from the player
        var x = (player.x < 400)
            ? Phaser.Math.Between(400, 800)
            : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}
```

## Bomb Setup Values

| Property | Value | Purpose |
|---|---|---|
| Spawn X | Opposite side from player | Prevents unfair instant death |
| Spawn Y | `16` | Near the top of the screen |
| `setBounce` | `1` | Perfect bounce — never loses energy |
| `setCollideWorldBounds` | `true` | Bounces off screen edges |
| Velocity X | Random `-200` to `200` | Random horizontal direction |
| Velocity Y | `20` | Slight downward initial movement |

## Bomb Spawn Logic

```
Player on LEFT side (x < 400):
  → Bomb spawns on RIGHT (x between 400–800)

Player on RIGHT side (x >= 400):
  → Bomb spawns on LEFT (x between 0–400)
```

## Re-enabling Stars

```js
child.enableBody(true, child.x, 0, true, true);
```

| Argument | Value | Meaning |
|---|---|---|
| 1st: reset | `true` | Reset the physics body |
| 2nd: x | `child.x` | Keep the same X position |
| 3rd: y | `0` | Move to top of screen (falls again) |
| 4th: enableGameObject | `true` | Make the Game Object active again |
| 5th: showGameObject | `true` | Make the Game Object visible again |

## Game Over — Hit by Bomb

```js
function hitBomb (player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}
```

### What Happens on Game Over

| Step | Code | Effect |
|---|---|---|
| 1 | `this.physics.pause()` | Stops all physics simulation — everything freezes |
| 2 | `player.setTint(0xff0000)` | Tints the player sprite red |
| 3 | `player.anims.play('turn')` | Shows the player facing forward (idle pose) |
| 4 | `gameOver = true` | Flags the game as over (can be used to prevent further input) |

## Difficulty Progression

Each time all 12 stars are collected:
1. All stars **respawn** at the top (fall again onto platforms)
2. A **new bomb** is added to the scene
3. Previous bombs remain — cumulative difficulty increase!

```
Round 1: 12 stars, 0 bombs → collect all → 1 bomb spawns
Round 2: 12 stars, 1 bomb  → collect all → 2 bombs spawn total
Round 3: 12 stars, 2 bombs → collect all → 3 bombs spawn total
...
```

## Complete Game Variables Summary

| Variable | Type | Initial Value | Purpose |
|---|---|---|---|
| `config` | Object | Game config | Phaser configuration |
| `player` | Sprite | — | Player physics sprite |
| `platforms` | StaticGroup | — | Ground and ledges |
| `stars` | Group | — | Collectible stars |
| `bombs` | Group | — | Enemy bombs |
| `cursors` | CursorKeys | — | Keyboard input |
| `score` | Number | `0` | Current score |
| `scoreText` | Text | — | Score display |
| `gameOver` | Boolean | `false` | Game state flag |

## APIs Introduced

- `group.countActive(true)` — count active members in a group
- `body.enableBody(reset, x, y, enableGameObject, showGameObject)` — re-enable a disabled body
- `.setTint(color)` — apply a color tint to a Game Object
- `this.physics.pause()` — pause all physics simulation
- `Phaser.Math.Between(min, max)` — random integer in range
- `.setVelocity(x, y)` — set both velocity components at once

## Recap Checklist

- [ ] Bombs group created (dynamic, starts empty)
- [ ] When all 12 stars collected: stars respawn at y=0, one new bomb released
- [ ] Bomb spawns on opposite side from player with random velocity
- [ ] Bomb has perfect bounce (1) and world bounds collision
- [ ] Touching a bomb: physics pauses, player turns red, gameOver flag set
- [ ] Difficulty increases each round as bombs accumulate
- [ ] Understand the full game loop: collect stars → bombs appear → avoid bombs → repeat
