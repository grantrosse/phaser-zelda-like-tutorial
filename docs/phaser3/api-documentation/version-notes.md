# Phaser 3.90.0 API — Version Notes

> Source: [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation)

## Available Versions in Official Docs

| Version | Status | Notes |
|---|---|---|
| **Phaser v3.90.0** | Current stable | Primary version documented in this set |
| Phaser v4.0.0-rc.6 | Release candidate | Next major version (Phaser 4) — API may differ significantly |
| Phaser v3.88.2 | Previous stable | Older v3 release |

## Phaser 3 Version History Highlights

### v3.90.0 (Current)
- Latest stable Phaser 3 release
- Full FX pipeline support (Bloom, Blur, Glow, etc.)
- Improved DynamicTexture
- Enhanced particle system
- All features documented in this API set

### v3.60+ (Major Milestone)
- **FX Pipeline** — post-processing effects on cameras and Game Objects (WebGL)
- **DynamicTexture** — replaced RenderTexture for render-to-texture
- **Pre FX / Post FX** — per-object visual effects
- **New Particle System** — unified ParticleEmitter replaces ParticleEmitterManager

### v3.50+ (Prior Milestone)
- **Pipeline refactor** — new MultiPipeline, MobilePipeline
- **NineSlice** Game Object
- **Rope** improvements
- **Compressed Textures** support

### v3.24+ (Tilemap Improvements)
- Tilemap hexagonal and staggered support
- Isometric tilemap rendering

### v3.0.0 (Initial Release)
- Complete rewrite from Phaser 2 (Phaser CE)
- Scene-based architecture (replaces States)
- New Loader system
- Plugin system
- Multiple physics system support
- New animation system
- EventEmitter-based events

## Phaser 2 vs Phaser 3 Key Differences

| Aspect | Phaser 2 | Phaser 3 |
|---|---|---|
| Architecture | Single `game` object as gateway | Scene-based, modular |
| Scenes | "States" | Scenes (can run in parallel) |
| Game Object creation | `game.add.sprite()` | `this.add.sprite()` (scene-scoped) |
| Physics | P2, Arcade, Ninja | Arcade, Matter.js (Impact removed later) |
| Rendering | Pixi.js internally | Custom renderer |
| Events | Signal-based | EventEmitter pattern |
| Global game variable | Required | Not needed / not recommended |
| Animations | Per-sprite | Global AnimationManager |
| Camera | Single main camera | Multiple cameras per scene |
| Plugins | Basic | Full global and scene plugin system |

## Phaser 4 Preview

Phaser v4.0.0-rc.6 is available in the official docs as a release candidate. Key changes expected:
- Performance improvements
- API modernization
- TypeScript-first approach
- Updated rendering pipeline

**Note:** Phaser 4 is a separate major version. The v3 API documented here remains the current stable recommended version.

## Resources

| Resource | URL |
|---|---|
| Official API Docs | [https://docs.phaser.io/api-documentation/api-documentation](https://docs.phaser.io/api-documentation/api-documentation) |
| Phaser Examples | [https://phaser.io/examples](https://phaser.io/examples) |
| Phaser GitHub | [https://github.com/phaserjs/phaser](https://github.com/phaserjs/phaser) |
| Phaser Discord | [https://discord.gg/phaser](https://discord.gg/phaser) |
| Phaser Newsletter | [https://phaser.io](https://phaser.io) |
| Getting Started Guide | [https://docs.phaser.io/phaser/getting-started](https://docs.phaser.io/phaser/getting-started) |
| Phaser Editor | [https://phasereditor2d.com](https://phasereditor2d.com) |
