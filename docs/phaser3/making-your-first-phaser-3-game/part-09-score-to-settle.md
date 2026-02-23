# Part 9 — A Score to Settle

> Source: [https://phaser.io/tutorials/making-your-first-phaser-3-game/part9](https://phaser.io/tutorials/making-your-first-phaser-3-game/part9)

## What Changes From Part 8

A score variable and on-screen text display are added. The `collectStar` function is updated to increment and display the score.

## Setting Up the Score

### Variables

```js
var score = 0;
var scoreText;
```

### Creating the Text Object (in `create()`)

```js
scoreText = this.add.text(16, 16, 'score: 0', {
    fontSize: '32px',
    fill: '#000'
});
```

### Score Display Properties

| Property | Value | Purpose |
|---|---|---|
| X position | `16` | 16 px from the left edge |
| Y position | `16` | 16 px from the top edge |
| Initial text | `'score: 0'` | Starting display |
| `fontSize` | `'32px'` | Large readable text |
| `fill` | `'#000'` | Black text color |

## Updating the Score

The `collectStar` callback now increments the score:

```js
function collectStar (player, star) {
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);
}
```

### Score Values

| Event | Points | Running Total Example |
|---|---|---|
| Collect 1st star | +10 | 10 |
| Collect 2nd star | +10 | 20 |
| ... | +10 each | ... |
| Collect all 12 stars | +10 | 120 |

## Key Concepts

### Text Game Objects
- `this.add.text(x, y, text, style)` creates a Text Game Object.
- Unlike physics sprites, text objects are usually **not** physics-enabled.
- Text is positioned by its **top-left corner** by default (origin 0,0), not center like images/sprites.

### Style Object
The style object accepts many CSS-like properties:

| Property | Example | Description |
|---|---|---|
| `fontSize` | `'32px'` | Font size |
| `fill` | `'#000'` | Text color (hex string) |
| `fontFamily` | `'Arial'` | Font family |
| `fontStyle` | `'bold'` | Font weight/style |
| `backgroundColor` | `'#fff'` | Background behind text |
| `stroke` | `'#fff'` | Outline color |
| `strokeThickness` | `4` | Outline width |

### `setText(value)`
- Updates the displayed text string.
- Called every time a star is collected to reflect the new score.
- More efficient than destroying and recreating a text object each frame.

## APIs Introduced

- `this.add.text(x, y, text, style)` — create a Text Game Object
- `textObject.setText(value)` — update the displayed text content

## Recap Checklist

- [ ] Score variable initialized to 0
- [ ] Text object created at (16, 16) with black 32px text
- [ ] Each star collected adds 10 points
- [ ] `setText()` updates the on-screen score display
- [ ] Maximum score from 12 stars = 120 points
