# Part 8 — Stardust

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part8](https://phaser.io/tutorials/making-your-first-phaser-3-game/part8)

## What Changes From Part 7

Collectible star objects are added as a **dynamic physics group**. An overlap handler detects when the player touches a star and collects it.

## Creating the Stars Group

```js
var stars;

function create () {
    // ... sky, platforms, player, animations, collider ...

    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
}
```

## Stars Setup Values

| Config Property | Value | Meaning |
|---|---|---|
| `key` | `'star'` | Texture to use for each child |
| `repeat` | `11` | Create 11 additional children (12 total: 1 initial + 11 repeats) |
| `setXY.x` | `12` | X position of the first star |
| `setXY.y` | `0` | Y position of the first star (top of screen; falls with gravity) |
| `setXY.stepX` | `70` | Each subsequent star is 70 px to the right |

### Star Positions

```
Star:   1    2    3    4    5    6    7    8    9   10   11   12
X:     12   82   152  222  292  362  432  502  572  642  712  782
Y:      0    0    0    0    0    0    0    0    0    0    0    0
        (all start at top, fall with gravity onto platforms)
```

## Adding Bounce to Stars

```js
stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
});
```

- Each star gets a **random** Y bounce value between 0.4 and 0.8.
- This makes stars bounce at different heights when they land, giving a natural look.

## Colliders and Overlap

```js
// Stars land on platforms (physical collision)
this.physics.add.collider(stars, platforms);

// Player collects stars (overlap detection + callback)
this.physics.add.overlap(player, stars, collectStar, null, this);
```

## Collecting a Star

```js
function collectStar (player, star) {
    star.disableBody(true, true);
}
```

| Argument | Value | Meaning |
|---|---|---|
| `disableBody` 1st arg | `true` | Deactivate the physics body (no more collisions) |
| `disableBody` 2nd arg | `true` | Hide the Game Object (make invisible) |

## Key Concepts

### Dynamic Group with Config Object
- Passing a config object to `this.physics.add.group()` automatically creates children.
- `repeat: 11` means 11 copies **in addition to** the first one (12 total).
- `setXY` with `stepX`/`stepY` positions children in a grid pattern.

### `children.iterate(callback)`
- Iterates over every member of a group.
- Used here to set individual properties (random bounce) on each star.

### `Phaser.Math.FloatBetween(min, max)`
- Returns a random float between `min` and `max` (inclusive).

### Overlap vs Collider (Revisited)
- **Collider** (`stars` ↔ `platforms`): Stars physically land on platforms.
- **Overlap** (`player` ↔ `stars`): When player touches a star, fire `collectStar` callback — no physical separation.

## APIs Introduced

- `this.physics.add.group(config)` — create a dynamic physics group with auto-created children
- `group.children.iterate(callback)` — run a function on each group member
- `child.setBounceY(value)` — set vertical bounce for a single physics body
- `Phaser.Math.FloatBetween(min, max)` — random float in range
- `this.physics.add.overlap(a, b, callback, process, scope)` — detect overlap without separation
- `body.disableBody(deactivate, hide)` — disable a physics body and optionally hide it

## Recap Checklist

- [ ] 12 stars created using a dynamic group config with `repeat: 11`
- [ ] Stars positioned horizontally with `stepX: 70`, starting at x=12
- [ ] Each star gets random bounce Y between 0.4 and 0.8
- [ ] Stars collide with platforms (land on them)
- [ ] Overlap between player and stars triggers `collectStar`
- [ ] `collectStar` disables and hides the collected star
