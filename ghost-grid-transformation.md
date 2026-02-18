# Project Pivot: Ghost Grid Transformation Directive

## 1. Executive Summary
**Objective:** Migrate "Ghost Grid" from Godot Engine to a web-native React Three Fiber (R3F) stack. 
**Visual Target:** Discard the previous "utilitarian/MS-DOS/Splinter Cell" aesthetic entirely. The new visual standard is **Tron: Legacy (2010)**—characterized by high-gloss surfaces, neon emissives, deep atmospheric perspective, and "obsidian" reflections.

---

## 2. Technical Architecture (R3F Stack)
The project abandons the Godot Node system in favor of a component-based React architecture.

### Core Dependencies
* **React 18+ / Vite:** Build tool and framework.
* **Three.js:** Rendering engine.
* **@react-three/fiber (R3F):** The declarative bridge.
* **@react-three/drei:** Essential abstractions (Reflectors, Cameras, Text).
* **@react-three/postprocessing:** **Critical.** The "Tron" look requires specific render passes (Bloom) that are non-performant or difficult in vanilla Three.js.
* **Zustand:** State management. Game logic (mines, flags, score) must exist outside the visual tree to prevent prop-drilling hell.

### Scene Hierarchy
Instead of a Scene Tree, the application structure is:
```jsx
<Canvas>
  <GameManager />       {/* Logical controller (invisible) */}
  <PostProcessing />    {/* EffectComposer layers */}
  <Environment />       {/* Fog, background color */}
  <CameraRig />         {/* Controlled camera movement */}
  
  <World>
    <ReflectiveFloor /> {/* The "Obsidian" Ground */}
    <GridSystem>        {/* The Game Board */}
       {cells.map(c => <GridCell key={c.id} {...c} />)}
    </GridSystem>
  </World>
  
  <UIOverlay />         {/* HTML-based HUD (Score, Timer) */}
</Canvas>
```

---

## 3. Aesthetic Specifications

### 3.1. The Environment (The "Grid")
* **Reference:** *The Grid* (Tron: Legacy).
* **Atmosphere:** Deep black void (`#000000`). Use `fog` explicitly (`color: #000000`, `near: 10`, `far: 50`) to hide the horizon line.
* **Floor:** Mirror-like black surface. Use Drei's `<MeshReflectorMaterial />`.
    * *Configuration:* High resolution (`1024+`), heavy blur (`[300, 100]`), high metalness (`0.8`), low roughness.
    * *Effect:* The floor should reflect the neon game pieces, doubling the visual impact of the board.

### 3.2. Lighting & Post-Processing
* **Bloom:** The defining visual trait.
* **Implementation:** Use `<EffectComposer>` with `<Bloom />`.
    * *Threshold:* `0` (or low).
    * *Intensity:* High (`1.5` - `2.0`).
    * *MipmapBlur:* `true` (essential for the soft, cinematic glow rather than harsh pixel bleeding).
* **Chromatic Aberration:** Subtle (`offset: [0.002, 0.002]`) to mimic the lens imperfections seen in the film.

---

## 4. Component Implementation Guide

### 4.1. The `<GridCell />`
This is the atomic unit of the game. It replaces the `MeshInstance` from Godot.

**Behavior:**
* **Geometry:** A `BoxGeometry` with slight bevels (chamfer box) to catch the specular highlights.
* **Material (Idle):** Dark, semi-transparent glass (`transmission: 0.6`, `thickness: 0.5`, `color: #222222`).
* **Material (Active/Hover):** Emissive neon.
    * *Safe:* Cyan/Blue (`#00ffff`).
    * *Danger:* Orange/Red (`#ff3300`).
* **Interactivity:**
    * Use `onPointerOver` / `onPointerOut` for instant hover feedback.
    * Bind `onClick` to the Zustand store action `revealCell(id)`.

**Code Snippet (Concept):**
```jsx
function GridCell({ position, isRevealed, isMine }) {
  const [hovered, setHover] = useState(false)
  
  // Dynamic color logic
  const color = isMine ? '#ff3300' : '#00ffff'
  const emissiveIntensity = hovered || isRevealed ? 2.0 : 0
  
  return (
    <mesh 
      position={position}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <roundedBoxGeometry args={[0.95, 0.1, 0.95]} radius={0.05} />
      <meshStandardMaterial 
        color="#111"
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        toneMapped={false} // Crucial for Bloom to exceed 1.0 brightness
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  )
}
```

### 4.2. The UI Overlay
* Discard the Canvas-based text.
* Use a standard HTML layer (`absolute`, `top: 0`, `pointer-events: none`) via Drei's `<Html fullscreen />` or a sibling `div`.
* **Font:** "Orbitron" or "Exo 2" (Google Fonts).
* **Style:** Thin weights, uppercase, wide tracking (letter-spacing), glowing CSS text shadows.

---

## 5. Migration Checklist
1.  **Initialize Vite Project:** `npm create vite@latest ghost-grid -- --template react`
2.  **Install Graphics Stack:** `npm install three @types/three @react-three/fiber @react-three/drei @react-three/postprocessing`
3.  **Install State:** `npm install zustand`
4.  **Asset Generation:** Delete all `.png` sprites. The new aesthetic is procedural (code-generated materials).
5.  **Logic Port:** Translate the Godot GDScript `GridMap` logic into a pure TypeScript/JavaScript class or Zustand store.

---

## 6. Github Repos/Resources/Best Practices (if helpful)
* https://r3f.docs.pmnd.rs/getting-started/introduction
* https://github.com/pmndrs/react-three-fiber
* https://github.com/NASA-AMMOS/3DTilesRendererJS/ (plus https://github.com/NASA-AMMOS/3DTilesRendererJS/blob/master/src/r3f/README.md)
* https://cdn-luma.com/public/lumalabs.ai/luma-web-library/0.2/fefe154/index.html#react-three-fiber
* https://nytimes.github.io/three-loader-3dtiles/
* https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/atmosphere
* https://docs.lookingglassfactory.com/software/creator-tools/webxr/react-three-fiber
* https://github.com/theatre-js/theatre
* https://github.com/utsuboco/r3f-perf
* https://github.com/FarazzShaikh/THREE-CustomShaderMaterial
* https://github.com/pmndrs/meshline
* https://github.com/protectwise/troika/tree/main/packages/troika-three-text