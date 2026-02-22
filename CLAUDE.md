# Ghost Grid 2030

## Project Overview
Tron: Legacy-inspired tactical minesweeper built with React Three Fiber. Navigate corrupted data sectors as **PROC-7**, a maintenance daemon that was never shut down. Avoid FAULT NODES, decode threats, reach the RESTORE PORT.

## Tech Stack
- React 18 + Vite + TypeScript
- @react-three/fiber (R3F) — declarative Three.js
- @react-three/drei — MeshReflectorMaterial, Text, OrbitControls, Octahedron, Torus, Sphere, Circle, Edges
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
│   ├── scene/      — R3F 3D components (GridCell, Floor, Camera, Character, EMPFlash, ScanZoneBorder, etc.)
│   ├── ui/         — HTML overlay screens (HUD, StartScreen, LoreModal, DecodeMinigame, VirusManager, VirusAlert, etc.)
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
| Tag | Flag a suspected FAULT tile (scan zone only) |
| SYSTEM PURGED | Story mode victory — `phase: 'extracted'` internally |
| Virus | Corrupted tile that kills on contact (sectors 2+) |
| EMP | Area ability that removes FAULTs and viruses in 5×5 |

## Sector Names
| Sector | Name |
|--------|------|
| 1 | BOOT SECTOR |
| 2 | KERNEL |
| 3 | ROOT |
| 4+ (Endless) | SECTOR N (dynamically generated) |

## Controls (Toggle Mode System)
- **Click unrevealed tile** (scan zone): Reveal tile
- **Click revealed/decoded tile**: Move PROC-7
- **TAG toggle** (HUD button): Activates tag mode → click unrevealed tiles in scan zone to tag/untag
- **DECODE toggle** (HUD button): Activates decode mode → click unrevealed tile in scan zone to decode
- **EMP** (HUD button): Clears all FAULTs + viruses in 5×5 around PROC-7 (0 charges sector 1, 1 charge sectors 2+)
- **Orbit**: Click+drag to rotate camera
- **Zoom**: Scroll wheel
- **ESC**: Pause / resume

Tag and decode modes are mutually exclusive toggles. Single click does everything — no double-click, long-press, or right-click needed.

## Game Modes
- **Story Mode**: 3 fixed sectors (BOOT SECTOR → KERNEL → ROOT), narrative lore popup on sector 1
- **Endless Mode**: Sectors continue indefinitely with escalating grid size and FAULT count. Score tracked, high score persisted to localStorage key `ghostgrid_highscore`

## Scoring (Endless Mode)
Per sector on advance: `sector² × 100 + decodedFaults × 25 + remainingDecodeCycles × 50`

## Character: PROC-7 (Octahedron + Aperture Eye)
- `src/components/scene/Character.tsx`
- **Chassis**: Glass octahedron (`meshPhysicalMaterial`, transmission 0.9, metalness 0.9)
- **Wireframe**: `<Edges color="#00ffff" threshold={15} />` on octahedron
- **Aperture eye** at top: torus ring + backing circle + emissive cyan lens dome
- Hovers at Y=0.65, idle bob `sin(t*2)*0.1`
- Slow Y rotation when idle (`t*0.5`), stops when moving
- Lens emissive: 5 when moving (scanning), 1 when idle
- Smoothly lerps to target position (LERP_SPEED = 0.12/frame)
- Camera soft-follows via shared `characterRef.ts` `characterWorldPos`
- Scan zone: 5×5 area (Chebyshev ≤ 2) around characterPosition

## Virus Mechanic (Sectors 2+)
- `src/components/ui/VirusManager.tsx` — timer logic (renders null)
- `src/components/ui/VirusAlert.tsx` — "VIRUS DETECTED" red popup
- **Activation**: After 60 seconds of gameplay in sectors 2+
- **Spread**: Accelerating interval — starts at 5s, decreases 0.2s per spawn, floors at 1.0s
- **Death**: Moving PROC-7 onto a virus tile = OVERWRITTEN
- **Visual**: Red emissive tile (`#ff0000`) + upward red beam (cylinder)
- **Pausing**: Virus timer pauses during decode/pause, resumes on play
- **EMP clears** viruses in 5×5 area

## EMP Ability
- **Charges**: 0 in sector 1, 1 in sectors 2+
- **Effect**: Removes all FAULTs in 5×5 around PROC-7 (sets `isICE: false`, recalculates `adjacentICE` for all neighbors), clears viruses in range
- **Visual**: Expanding cyan sphere flash (`EMPFlash.tsx`) — 600ms duration, resets `empFlashActive` via `useFrame` (pause-safe, no bare setTimeout)
- **HUD**: EMP button shows charge count, disabled when 0

## Visual Spec (Updated Feb 2026)
- Background: `#000000` void with fog
- Bloom: threshold 0, intensity 1.5-2.0, mipmapBlur (per sector)
- Floor: MeshReflectorMaterial (obsidian mirror)
- **Unrevealed tiles**: pure void (`#080808`, zero emissive) — board is dark, unknown
- **Revealed tiles**: dark base with full emissive threat colors — revealed area lights up
- **Virus tiles**: red emissive (`#ff0000`, intensity 2.5) + upward red beam
- Revealed 0-adjacent: `#004d66` emissive at 0.14 (subtle but visible)
- Number colors: 1=cyan, 2=green, 3=amber, 4+=red
- Text: Orbitron font, black outline for readability
- Chromatic aberration: static 0.002
- **Tile sides**: 6-material box — top face gets full emissive, sides get 20% intensity

## Performance Notes
- **meshPhysicalMaterial with `transmission`** (used on PROC-7 octahedron chassis): GPU-heavy — requires extra render pass for glass refraction. Fine on desktop, may impact mobile FPS. Fallback: swap to `meshStandardMaterial` with high metalness + low roughness (loses glass refraction but keeps dark reflective look).

## Lore Pop-up
- `src/components/ui/LoreModal.tsx`
- Shown once on story mode sector 1 first play (`hasSeenLore: false`)
- Introduces PROC-7 and FAULT/RESTORE PORT concepts
- Dismissed via `dismissLore()` action in store

## Key Patterns
- **Immutable state**: All Zustand updates create new objects (spread + map)
- **Scan zone**: Tiles can only be revealed/decoded/tagged if within 5×5 area (Chebyshev ≤ 2) of PROC-7's `characterPosition`. Border glow rendered by `ScanZoneBorder.tsx` — lerps toward `characterWorldPos` at 0.08/frame, clamped to grid edges.
- **Toggle modes**: Tag and decode are mutually exclusive toggle states. Single click does everything based on active mode.
- **Zero-adjacent one-hop reveal**: Clicking a 0-adjacent tile also reveals any directly touching 0-adjacent tiles (one level only, no chain reaction)
- **Safe zone**: 2×2 starting area at (0,0) auto-revealed
- **RESTORE PORT placement**: Minimum 8 Manhattan distance from start
- **Hooks order**: R3F components must call all hooks before conditional returns (IOPort/Character pattern)
- **Font format**: drei `<Text>` uses troika-three-text which requires .ttf, NOT .woff2
- **EMP adjacency recalc**: When FAULTs are removed by EMP, all their 8-neighbors get `adjacentICE` decremented via delta map, applied immutably
- **Virus tile Set**: `virusTileSet` (derived `Set<string>`) kept in sync with `virusTiles` array for O(1) lookups in `spawnVirus`, `moveCharacter`, and `GridCell` rendering
- **Virus color priority**: In `GridCell.tsx`, virus check must come *before* decoded check — otherwise decoded+virus tiles render amber instead of red
- **Move clears modes**: `moveCharacter` resets both `decodeMode` and `tagMode` to prevent accidental tag/decode after repositioning
- **EMP flash is pause-safe**: `empFlashActive` reset is driven by `EMPFlash.tsx` useFrame (R3F render loop), not a bare `setTimeout` — so it respects pause state
- **VirusManager lifecycle**: Timer useEffect depends on both `sector` and `phase` — ensures interval restarts after death/restart within same sector. Counter refs (`playingSecondsRef`, etc.) only reset on `sector` change.

## State Fields (Feb 2026)
| Field | Type | Purpose |
|-------|------|---------|
| `characterPosition` | `{x, y}` | PROC-7's current tile |
| `isCharacterMoving` | `boolean` | Animation state for movement |
| `hasSeenLore` | `boolean` | Controls LoreModal visibility |
| `mode` | `'story' \| 'endless'` | Game mode |
| `score` | `number` | Running score (endless) |
| `highScore` | `number` | Best run score (persisted to localStorage) |
| `storyHighScore` | `number` | Best story mode score (persisted to localStorage) |
| `decodeMode` | `boolean` | When true, click in scan zone triggers decode |
| `tagMode` | `boolean` | When true, click in scan zone toggles tag |
| `virusTiles` | `{x,y}[]` | Positions of virus-infected tiles |
| `virusTileSet` | `Set<string>` | O(1) lookup set derived from virusTiles (`"x,y"` keys) |
| `virusAlertActive` | `boolean` | Shows "VIRUS DETECTED" alert |
| `empCharges` | `number` | EMP uses remaining (0 or 1) |
| `empFlashActive` | `boolean` | Triggers expanding sphere flash |

## Decode Minigame
- Timing-bar mechanic: stop indicator in center 10% zone
- Speed scales with cleared ICE: `min(2.5, 0.8 + cleared × 0.15)`
- Success on FAULT → neutralized. Fail on FAULT → OVERWRITTEN.
- Success on empty → cycle wasted, tile revealed.
- Mobile: entire overlay is tap target (`onClick` + `onTouchStart`)

## Deferred Features (Future Sessions)
- **Traveling Virus**: Corrupted cell that moves one tile each time PROC-7 moves. High-stakes pursuit mechanic.
- **Dynamic Board Shapes**: Non-square grids (L-shapes, branching paths, vertical stacks).
- **Fragile Sectors**: Tiles that disappear after PROC-7 steps on them — forces one-way paths.
- **Fixed Story Levels**: Curated level designs with specific narrative beats per sector.
- **Character Animations**: PROC-7 defeat/corruption dissolve effect.
- **Sound System**: Ambient drone, tile reveal chimes, decode success/fail sounds.
- **Leaderboard**: Multi-session comparison (could use localStorage or Firebase).
- **Derez Particle Effect**: Particles on death (old placeholder in effects/ folder).
- **First-person camera mode**: Architecture already supports it via R3F camera control.
- **High Score Screen + Firebase** (future): Multi-session leaderboard.
  - Firebase Firestore for score persistence (anonymous auth or username entry)
  - High score screen: top runs by sector reached, final score, date
  - Needs better scoring formula first (time bonus, streak, etc.)
  - Not ready for Firebase yet — revisit when scoring is finalized.

## Tech Debt
- **`gameStore.ts` size** (~545 lines): Approaching complexity threshold (800 max). Extract `activateEMP`, `spawnVirus`, and EMP delta-map logic into pure functions in `src/logic/` (e.g. `empLogic.ts`, `virusLogic.ts`). Not urgent but should be addressed before adding more store actions.
