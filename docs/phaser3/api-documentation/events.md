# Phaser 3.90.0 API — Events

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)
>
> See also: [Classes](classes.md) | [Game Object Classes](game-object-classes.md)

## Overview

Phaser uses an **EventEmitter** pattern throughout. Every major system emits events you can listen to. Events are organized by namespace.

### How to Listen

```js
// Scene event
this.events.on('update', callback);

// Input event
this.input.on('pointerdown', callback);

// Game Object event
sprite.on('pointerdown', callback);

// One-time listener
this.events.once('create', callback);

// Remove listener
this.events.off('update', callback);
```

---

## Event Namespaces

### Phaser.Animations.Events

| Event | Fired When |
|---|---|
| `ADD_ANIMATION` | A new animation is added to the manager |
| `REMOVE_ANIMATION` | An animation is removed |
| `PAUSE_ALL` | All animations paused |
| `RESUME_ALL` | All animations resumed |
| `ANIMATION_START` | An animation starts playing on a sprite |
| `ANIMATION_RESTART` | An animation restarts |
| `ANIMATION_REPEAT` | An animation loop repeats |
| `ANIMATION_STOP` | An animation stops on a sprite |
| `ANIMATION_COMPLETE` | An animation finishes on a sprite |
| `ANIMATION_COMPLETE_KEY` | Specific animation key completes |
| `ANIMATION_UPDATE` | Animation frame changes |

---

### Phaser.Cache.Events

| Event | Fired When |
|---|---|
| `ADD` | An item is added to the cache |
| `REMOVE` | An item is removed from the cache |

---

### Phaser.Cameras.Scene2D.Events

| Event | Fired When |
|---|---|
| `DESTROY` | Camera is destroyed |
| `FADE_IN_COMPLETE` | Fade-in effect completes |
| `FADE_IN_START` | Fade-in effect starts |
| `FADE_OUT_COMPLETE` | Fade-out effect completes |
| `FADE_OUT_START` | Fade-out effect starts |
| `FLASH_COMPLETE` | Flash effect completes |
| `FLASH_START` | Flash effect starts |
| `FOLLOW_UPDATE` | Camera follow target updates |
| `PAN_COMPLETE` | Pan effect completes |
| `PAN_START` | Pan effect starts |
| `POST_RENDER` | After camera renders |
| `PRE_RENDER` | Before camera renders |
| `ROTATE_COMPLETE` | Rotate effect completes |
| `ROTATE_START` | Rotate effect starts |
| `SHAKE_COMPLETE` | Shake effect completes |
| `SHAKE_START` | Shake effect starts |
| `ZOOM_COMPLETE` | Zoom effect completes |
| `ZOOM_START` | Zoom effect starts |

---

### Phaser.Core.Events

| Event | Fired When |
|---|---|
| `BLUR` | Game window loses focus |
| `BOOT` | Game finishes booting |
| `DESTROY` | Game is being destroyed |
| `FOCUS` | Game window gains focus |
| `HIDDEN` | Game tab becomes hidden |
| `PAUSE` | Game is paused |
| `POST_RENDER` | After all scenes render |
| `POST_STEP` | After game step |
| `PRE_RENDER` | Before rendering |
| `PRE_STEP` | Before game step |
| `READY` | Game is fully ready |
| `RESUME` | Game is resumed |
| `STEP` | Each game step |
| `VISIBLE` | Game tab becomes visible |

---

### Phaser.Data.Events

| Event | Fired When |
|---|---|
| `CHANGE_DATA` | Any data value changes |
| `CHANGE_DATA_KEY` | Specific data key changes |
| `DESTROY` | DataManager is destroyed |
| `REMOVE_DATA` | A data key is removed |
| `SET_DATA` | A data key is set for the first time |

---

### Phaser.GameObjects.Events

| Event | Fired When |
|---|---|
| `ADDED_TO_SCENE` | Game Object added to scene |
| `DESTROY` | Game Object destroyed |
| `REMOVED_FROM_SCENE` | Game Object removed from scene |
| `VIDEO_COMPLETE` | Video playback completes |
| `VIDEO_CREATED` | Video element created |
| `VIDEO_ERROR` | Video playback error |
| `VIDEO_LOOP` | Video loops |
| `VIDEO_PLAY` | Video starts playing |
| `VIDEO_PLAYING` | Video is actively playing |
| `VIDEO_SEEKED` | Video seek completes |
| `VIDEO_SEEKING` | Video seek starts |
| `VIDEO_STOP` | Video stops |
| `VIDEO_UNLOCKED` | Video unlocked for autoplay |

---

### Phaser.Input.Events

| Event | Fired When |
|---|---|
| `BOOT` | Input system boots |
| `DESTROY` | Input system destroyed |
| `DRAG` | Object being dragged |
| `DRAG_END` | Drag operation ends |
| `DRAG_ENTER` | Dragged object enters a drop zone |
| `DRAG_LEAVE` | Dragged object leaves a drop zone |
| `DRAG_OVER` | Dragged object is over a drop zone |
| `DRAG_START` | Drag operation starts |
| `DROP` | Object dropped on a drop zone |
| `GAME_OUT` | Pointer leaves game canvas |
| `GAME_OVER` | Pointer enters game canvas |
| `GAMEOBJECT_DOWN` | Pointer pressed on an interactive Game Object |
| `GAMEOBJECT_MOVE` | Pointer moves over an interactive Game Object |
| `GAMEOBJECT_OUT` | Pointer leaves an interactive Game Object |
| `GAMEOBJECT_OVER` | Pointer enters an interactive Game Object |
| `GAMEOBJECT_UP` | Pointer released on an interactive Game Object |
| `GAMEOBJECT_WHEEL` | Mouse wheel over an interactive Game Object |
| `POINTER_DOWN` | Any pointer pressed |
| `POINTER_DOWN_OUTSIDE` | Pointer pressed outside game canvas |
| `POINTER_MOVE` | Any pointer moves |
| `POINTER_OUT` | Pointer leaves game canvas |
| `POINTER_OVER` | Pointer enters game canvas |
| `POINTER_UP` | Any pointer released |
| `POINTER_UP_OUTSIDE` | Pointer released outside canvas |
| `POINTER_WHEEL` | Mouse wheel scrolled |
| `PRE_UPDATE` | Before input processing |
| `SHUTDOWN` | Input system shuts down |
| `START` | Input system starts |
| `UPDATE` | Input processing step |

---

### Phaser.Input.Keyboard.Events

| Event | Fired When |
|---|---|
| `ANY_KEY_DOWN` | Any key pressed |
| `ANY_KEY_UP` | Any key released |
| `COMBO_MATCH` | Key combo completed |
| `KEY_DOWN` | Specific key pressed (e.g., `KEY_DOWN_SPACE`) |
| `KEY_UP` | Specific key released |

---

### Phaser.Input.Gamepad.Events

| Event | Fired When |
|---|---|
| `BUTTON_DOWN` | Gamepad button pressed |
| `BUTTON_UP` | Gamepad button released |
| `CONNECTED` | Gamepad connected |
| `DISCONNECTED` | Gamepad disconnected |
| `GAMEPAD_BUTTON_DOWN` | Global gamepad button pressed |
| `GAMEPAD_BUTTON_UP` | Global gamepad button released |

---

### Phaser.Loader.Events

| Event | Fired When |
|---|---|
| `ADD` | File added to load queue |
| `COMPLETE` | All files finished loading |
| `FILE_COMPLETE` | A single file finishes loading |
| `FILE_KEY_COMPLETE` | Specific file key finishes loading |
| `FILE_LOAD_ERROR` | A file fails to load |
| `FILE_PROGRESS` | A file loading progresses |
| `POST_PROCESS` | After all files processed |
| `PROGRESS` | Overall loading progress updates |
| `START` | Loading starts |

---

### Phaser.Physics.Arcade.Events

| Event | Fired When |
|---|---|
| `COLLIDE` | Two Arcade Physics bodies collide |
| `OVERLAP` | Two Arcade Physics bodies overlap |
| `PAUSE` | Arcade Physics world paused |
| `RESUME` | Arcade Physics world resumed |
| `TILE_COLLIDE` | Body collides with a tilemap tile |
| `TILE_OVERLAP` | Body overlaps with a tilemap tile |
| `WORLD_BOUNDS` | Body hits world bounds |
| `WORLD_STEP` | Physics world step completes |

---

### Phaser.Physics.Matter.Events

| Event | Fired When |
|---|---|
| `AFTER_ADD` | After body added to world |
| `AFTER_REMOVE` | After body removed |
| `AFTER_UPDATE` | After physics update |
| `BEFORE_ADD` | Before body added |
| `BEFORE_REMOVE` | Before body removed |
| `BEFORE_UPDATE` | Before physics update |
| `COLLISION_ACTIVE` | Bodies are actively colliding |
| `COLLISION_END` | Collision between bodies ends |
| `COLLISION_START` | Collision between bodies starts |
| `DRAG` | Body being dragged |
| `DRAG_END` | Body drag ends |
| `DRAG_START` | Body drag starts |
| `PAUSE` | Matter world paused |
| `RESUME` | Matter world resumed |
| `SLEEP_END` | Body wakes from sleep |
| `SLEEP_START` | Body enters sleep |

---

### Phaser.Scenes.Events

| Event | Fired When |
|---|---|
| `BOOT` | Scene boots (first time only) |
| `CREATE` | Scene create function completes |
| `DESTROY` | Scene destroyed |
| `PAUSE` | Scene paused |
| `POST_UPDATE` | After scene update |
| `PRE_UPDATE` | Before scene update |
| `READY` | Scene systems are ready |
| `RENDER` | Scene is being rendered |
| `RESUME` | Scene resumed |
| `SHUTDOWN` | Scene shuts down |
| `SLEEP` | Scene goes to sleep |
| `START` | Scene starts |
| `TRANSITION_COMPLETE` | Scene transition completes |
| `TRANSITION_INIT` | Scene transition starts |
| `TRANSITION_OUT` | Scene transitioning out |
| `TRANSITION_START` | Scene transition starts |
| `TRANSITION_WAKE` | Scene wakes from transition |
| `UPDATE` | Scene update step |
| `WAKE` | Scene wakes from sleep |

---

### Other Event Namespaces

| Namespace | Covers |
|---|---|
| `Phaser.GameObjects.Particles.Events` | Particle emitter lifecycle events |
| `Phaser.Renderer.Events` | Render pipeline events |
| `Phaser.Renderer.WebGL.Pipelines.Events` | WebGL pipeline events |
| `Phaser.Scale.Events` | Resize, fullscreen, orientation events |
| `Phaser.Sound.Events` | Sound play, stop, complete, decode events |
| `Phaser.Structs.Events` | ProcessQueue events |
| `Phaser.Textures.Events` | Texture add/remove/load events |
| `Phaser.Time.Events` | Timer lifecycle events |
| `Phaser.Tweens.Events` | Tween start/update/complete/loop events |
