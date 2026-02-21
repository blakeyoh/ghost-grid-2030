# Ghost Grid 2030

## Project Overview
Tron: Legacy-inspired tactical minesweeper built with React Three Fiber. Navigate corrupted data sectors as **PROC-7**, a maintenance daemon that was never shut down. Avoid FAULT NODES, decode threats, reach the RESTORE PORT.

## Tech Stack
- React 18 + Vite + TypeScript
- @react-three/fiber (R3F) — declarative Three.js
- @react-three/drei — MeshReflectorMaterial, Text, OrbitControls
- @react-three/postprocessing — Bloom, ChromaticAberration
- Zustand — state management
- Orbitron (Google Font) — UI typography

## Dev Server
```bash
cd app
npx vite
# → http://localhost:5173
```

## Project Structure
```
app/src/
├── store/          — Zustand game state + types
├── logic/          — Pure functions (grid generation, sector config)
├── components/
│   ├── scene/      — R3F 3D components (GridCell, Floor, Camera, Character, etc.)
│   ├── ui/         — HTML overlay screens (HUD, StartScreen, LoreModal, DecodeMinigame, etc.)
│   └── effects/    — Visual effects (placeholder for derez particles)
└── styles/         — CSS (global, hud)
```

## Game Vocabulary (Updated Feb 2026)
| Term | Meaning |
|------|---------|
| FAULT NODE | Hidden threat (mine equivalent) — `isICE` internally |
| Decode | Scan a tile via timing minigame (defuse equivalent) |
| Decode cycles | 3 per sector, limited resource |
| Threat signature | Adjacent FAULT count (number on tile) |
| RESTORE PORT | Sector exit (extraction point) — `isIOPort` internally |
| Sector | Game level (1-3 story, endless beyond) |
| PROC-7 OVERWRITTEN | Death state (was "Derezzed") — `phase: 'derezzed'` internally |
| Tag | Flag a suspected FAULT tile |
| SYSTEM PURGED | Story mode victory — `phase: 'extracted'` internally |

## Sector Names
| Sector | Name |
|--------|------|
| 1 | BOOT SECTOR |
| 2 | KERNEL |
| 3 | ROOT |
| 4+ (Endless) | SECTOR N (dynamically generated) |

## Controls (Scan Mode)
- **Click**: Reveal tile in PROC-7's 5×5 scan zone (Chebyshev ≤ 2)
- **Double-click / Double-tap**: Move PROC-7 to any revealed tile
- **Right-click / Long-press (500ms)**: Tag/untag suspected FAULT (unrestricted — works outside scan zone)
- **Decode (HUD button)**: Activates decode mode → then click tile in scan zone
- **Orbit**: Click+drag to rotate camera
- **Zoom**: Scroll wheel
- **ESC**: Pause / resume

## Game Modes
- **Story Mode**: 3 fixed sectors (BOOT SECTOR → KERNEL → ROOT), narrative lore popup on sector 1
- **Endless Mode**: Sectors continue indefinitely with escalating grid size and FAULT count. Score tracked, high score persisted to localStorage key `ghostgrid_highscore`

## Scoring (Endless Mode)
Per sector on advance: `sector² × 100 + decodedFaults × 25 + remainingDecodeCycles × 50`

## Character: PROC-7 (Iris/Aperture)
- `src/components/scene/Character.tsx`
- Mechanical aperture: torus outer ring (r=0.23) + 6 iris blades at 60° intervals
- Color: `#001122` / emissive `#00ffff`, ring at 1.8 intensity, blades at 1.4
- Hovers at Y=0.40 to avoid obscuring tile numbers
- Iris open (idle) → closed (moving): blades sweep from tangential to radial
- Smoothly lerps to target position (LERP_SPEED = 0.12/frame)
- Idle bob via `Date.now() * 0.0025` sine wave
- Camera soft-follows character's actual mesh position (not store target) via shared `characterRef.ts` — eliminates double-lerp jerk
- Scan zone: 5×5 area (Chebyshev ≤ 2) around characterPosition — controls which tiles player can reveal/decode
- Player moves PROC-7 via double-click on any revealed tile

## Visual Spec (Updated Feb 2026)
- Background: `#000000` void with fog
- Bloom: threshold 0, intensity 1.5-2.0, mipmapBlur (per sector)
- Floor: MeshReflectorMaterial (obsidian mirror)
- **Unrevealed tiles**: pure void (`#080808`, zero emissive) — board is dark, unknown
- **Revealed tiles**: dark base with full emissive threat colors — revealed area lights up
- Revealed 0-adjacent: `#004d66` emissive at 0.14 (subtle but visible)
- Number colors: 1=cyan, 2=green, 3=amber, 4+=red
- Text: Orbitron font, black outline for readability
- Chromatic aberration: static 0.002 (glitch spike on movement was removed — user found it distracting)
- **Tile sides**: 6-material box — top face gets full emissive, sides get 20% intensity (prevents color bleed between adjacent tiles)

## Lore Pop-up
- `src/components/ui/LoreModal.tsx`
- Shown once on story mode sector 1 first play (`hasSeenLore: false`)
- Introduces PROC-7 and FAULT/RESTORE PORT concepts
- Dismissed via `dismissLore()` action in store

## Key Patterns
- **Immutable state**: All Zustand updates create new objects (spread + map)
- **Scan zone**: Tiles can only be revealed/decoded if within 5×5 area (Chebyshev ≤ 2) of PROC-7's `characterPosition`. Tagging is unrestricted. Border glow rendered by `ScanZoneBorder.tsx` — lerps toward `characterWorldPos` at 0.08/frame.
- **Zero-adjacent one-hop reveal**: Clicking a 0-adjacent tile also reveals any directly touching 0-adjacent tiles (one level only, no chain reaction)
- **Safe zone**: 2×2 starting area at (0,0) auto-revealed
- **RESTORE PORT placement**: Minimum 8 Manhattan distance from start
- **Hooks order**: R3F components must call all hooks before conditional returns (IOPort/Character pattern)
- **Font format**: drei `<Text>` uses troika-three-text which requires .ttf, NOT .woff2
- **OrbitControls disabled during long-press**: `isLongPressing` state flag passed as `enabled` prop

## New State Fields (Feb 2026)
| Field | Type | Purpose |
|-------|------|---------|
| `characterPosition` | `{x, y}` | PROC-7's current tile |
| `isCharacterMoving` | `boolean` | Triggers chromatic aberration glitch pulse |
| `hasSeenLore` | `boolean` | Controls LoreModal visibility |
| `isLongPressing` | `boolean` | Disables OrbitControls during long-press |
| `mode` | `'story' \| 'endless'` | Game mode |
| `score` | `number` | Running score (endless) |
| `highScore` | `number` | Best run score (persisted to localStorage) |
| `storyHighScore` | `number` | Best story mode score (persisted to localStorage) |
| `decodeMode` | `boolean` | When true, next tile click in scan zone triggers decode |

## Decode Minigame
- Timing-bar mechanic: stop indicator in center 10% zone
- Speed scales with cleared ICE: `min(2.5, 0.8 + cleared × 0.15)`
- Success on FAULT → neutralized. Fail on FAULT → OVERWRITTEN.
- Success on empty → cycle wasted, tile revealed.
- Mobile: entire overlay is tap target (`onClick` + `onTouchStart`)

## Deferred Features (Future Sessions)
- **Traveling Virus**: Corrupted cell that moves one tile each time PROC-7 moves. High-stakes pursuit mechanic. Would use animated ERR mesh in R3F.
- **Dynamic Board Shapes**: Non-square grids (L-shapes, branching paths, vertical stacks). Requires refactoring gridGenerator to support irregular tile sets.
- **Fragile Sectors**: Tiles that disappear after PROC-7 steps on them — forces one-way paths.
- **EMP Item**: Consumable that disables Traveling Viruses within a 2-tile radius of PROC-7.
- **Fixed Story Levels**: Curated level designs with specific narrative beats per sector.
- **Character Animations**: PROC-7 idle bob more elaborate, defeat/corruption dissolve effect.
- **Sound System**: Ambient drone, tile reveal chimes, decode success/fail sounds.
- **Leaderboard**: Multi-session comparison (could use localStorage or Firebase).
- **Derez Particle Effect**: Particles on death (old placeholder in effects/ folder).
- **First-person camera mode**: Architecture already supports it via R3F camera control.
