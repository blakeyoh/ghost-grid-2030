# Ghost Grid 2030

## Project Overview
Tron: Legacy-inspired tactical minesweeper built with React Three Fiber. Navigate corrupted data sectors, avoid ICE nodes, decode threats, reach the I/O Port.

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
│   ├── scene/      — R3F 3D components (GridCell, Floor, Camera, etc.)
│   ├── ui/         — HTML overlay screens (HUD, StartScreen, DecodeMinigame)
│   ├── effects/    — Visual effects (placeholder for derez particles)
│   └── shared/     — Reusable UI components
└── styles/         — CSS (global, hud)
```

## Game Vocabulary
| Term | Meaning |
|------|---------|
| ICE node | Hidden threat (mine equivalent) |
| Decode | Scan a tile via timing minigame (defuse equivalent) |
| Decode cycles | 3 per sector, limited resource |
| Threat signature | Adjacent ICE count (number on tile) |
| I/O Port | Sector exit (extraction point) |
| Sector | Game level (1-3, escalating difficulty) |
| Derezzed | Death state |
| Tag | Flag a suspected ICE tile |

## Controls
- **Click**: Reveal tile (must be adjacent to already-revealed tile)
- **Right-click**: Tag/untag suspected ICE
- **Shift+click**: Use decode cycle on tile (triggers timing minigame)
- **Double-click**: Also triggers decode (but less reliable on trackpads)
- **Orbit**: Click+drag to rotate camera
- **Zoom**: Scroll wheel

## Sector Progression
| Sector | Grid | ICE | Name |
|--------|------|-----|------|
| 1 | 10×10 | 15 | Training Grid |
| 2 | 10×10 | 20 | Contested Zone |
| 3 | 12×12 | 25 | Deep Grid |

## Decode Minigame
- Timing-bar mechanic: stop indicator in center 10% zone
- Speed scales with cleared ICE: `min(2.5, 0.8 + cleared × 0.15)`
- Success on ICE → neutralized. Fail on ICE → derezzed.
- Success on empty → cycle wasted, tile revealed.

## Visual Spec
- Background: `#000000` void with fog
- Bloom: threshold 0, intensity 1.5-2.0, mipmapBlur
- Floor: MeshReflectorMaterial (obsidian mirror)
- Unrevealed tiles: very dark (`#030303`, emissive 0.01)
- Revealed tiles: darker base (`#060606`) with emissive numbers
- Number colors: 1=cyan, 2=green, 3=amber, 4+=red
- Text: Orbitron font, black outline for readability
- Chromatic aberration: offset [0.002, 0.002]

## Key Patterns
- **Immutable state**: All Zustand updates create new objects (spread + map)
- **Adjacency requirement**: Tiles can only be revealed/decoded if adjacent to an already-revealed tile
- **Safe zone**: 2×2 starting area at (0,0) auto-revealed
- **I/O Port placement**: Minimum 8 Manhattan distance from start
- **Hooks order**: R3F components must call all hooks before conditional returns (IOPort pattern)
- **Font format**: drei `<Text>` uses troika-three-text which requires .ttf, NOT .woff2

## Known Issues / Future Work
- [ ] Derez particle effect (Phase 4)
- [ ] Tile reveal animations (scale-up, emissive fade)
- [ ] Grid pulse shader between sectors
- [ ] Mobile touch: long-press to tag
- [ ] Sound system
- [ ] Character/avatar for camera to follow (future)
- [ ] First-person camera mode (architecture supports it)
- [ ] Netlify deployment
