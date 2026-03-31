# 3D Physics Playground -- Design Spec

## Overview

Transform the current 2D sticky note board into a 3D interactive physics playground. A room-like environment where users can post sticky notes (persisted) and play with physics toys (balls, blocks, dominoes -- client-side only). Everything has real 3D physics: gravity, collisions, drag-and-toss, bouncy surfaces, ramps, and a seesaw.

## Audience

Same as before: public/anonymous, no authentication.

## Tech Stack

- **3D Renderer:** React Three Fiber (`@react-three/fiber`)
- **Physics:** `@react-three/rapier` (Rapier 3D physics engine)
- **Helpers:** `@react-three/drei` (OrbitControls, Text, lighting helpers)
- **Framework:** Next.js 16 (App Router) -- unchanged
- **Storage:** Upstash Redis -- unchanged
- **Deployment:** Vercel -- unchanged

## Architecture

Full rewrite of the frontend. The R3F canvas replaces the entire current 2D UI. Backend (API routes + Redis store) remains unchanged.

**Deleted files (replaced):**
- `src/components/Board.tsx`
- `src/components/StickyNote.tsx`
- `src/lib/physics.ts` (Matter.js)

**Unchanged files:**
- `src/lib/types.ts`
- `src/lib/notes-store.ts`
- `src/app/api/notes/route.ts`
- `src/app/api/notes/[id]/route.ts`

**New dependencies:**
- `@react-three/fiber`
- `@react-three/rapier`
- `@react-three/drei`
- `three`
- `@types/three`

**Removed dependencies:**
- `matter-js`
- `@types/matter-js`

## The Playground Room

### Environment
- Enclosed room with a floor and 4 walls
- Walls are translucent/low-opacity so the camera can see through when orbiting behind them
- Ambient light + directional light casting soft shadows
- Warm lighting tone for a playful feel
- Floor has a subtle grid texture and high friction

### Static Geometry
- **Ramp:** Tilted rectangular surface in one corner. Objects roll/slide down it.
- **Bouncy wall:** One wall segment with high restitution. Objects ricochet off it.
- **Seesaw:** A plank balanced on a cylindrical fulcrum. Drop heavy objects on one end to launch the other side.

### Camera
- OrbitControls from `@react-three/drei`
- Drag to rotate, scroll to zoom, right-drag to pan
- Initial position: angled above and to the side, looking at the center of the room

## Interactive Objects

### Sticky Notes (Persisted to Redis)
- 3D box geometry, thin like a card (roughly 1.5 x 1.5 x 0.03 in 3D units)
- Text rendered on the front face using drei's Text component
- Colored faces matching palette: yellow (#fff740), pink (#ff7eb3), blue (#7afcff), green (#77dd77), orange (#ffb347), purple (#b39ddb)
- Created via "Add Note" button -- drops from above with gravity
- RigidBody with medium friction, low restitution
- When a note comes to rest (sleeps), its 3D position is saved to Redis via PUT /api/notes/[id]
- On page load, notes are fetched from Redis and placed at their saved positions
- The Note type adds a `z` field and `angleX`/`angleZ` fields for 3D orientation (backward compatible -- 2D notes loaded with z=0)

### Physics Toys (Client-Side Only, Not Persisted)
- **Balls:** Spheres of varying sizes (0.3-0.6 radius). High restitution (bouncy). Random bright colors.
- **Blocks:** Cubes/rectangular boxes (0.5-1.0 size). Medium friction. Stackable.
- **Dominoes:** Tall thin boxes (0.2 x 1.0 x 0.5) spawned in a row. Knock one to trigger a chain reaction.
- All toys are grabbable with the mouse, tossable, and collide with everything.

### Interaction
- Click + drag any physics object to grab it (uses Rapier's spring joint or kinematic positioning while held)
- Release to let physics take over -- object inherits mouse velocity for tossing
- All objects collide with each other, the room geometry, and static surfaces

## UI Overlay

HTML overlay on top of the 3D canvas. Minimal, translucent, bottom of screen.

### Toolbar (bottom center)
- **"+ Note" button:** Opens a popover with textarea + color picker. Same flow as current -- type text, pick color, hit Post. Note drops into scene from above.
- **"Ball" button:** Spawns a random ball above the center of the room.
- **"Block" button:** Spawns a random block above the center.
- **"Dominoes" button:** Spawns a row of 8 dominoes standing upright in the center.
- **"Reset Toys" button:** Removes all client-side physics toys (balls, blocks, dominoes). Does not affect sticky notes.

### Styling
- Frosted glass / glassmorphism style (backdrop-blur, semi-transparent background)
- Rounded buttons with icons
- Doesn't obstruct the 3D scene

## Updated Data Model

```
Note {
  id: string (uuid)
  text: string
  x: number
  y: number
  z: number          // NEW - 3D depth position
  angle: number      // kept for backward compat, maps to Y-axis rotation
  angleX: number     // NEW - X-axis rotation
  angleZ: number     // NEW - Z-axis rotation
  color: string (hex)
  createdAt: number (timestamp)
}
```

The API routes and Redis store remain the same structure. The PUT route already accepts arbitrary fields in `updates`. The new fields (`z`, `angleX`, `angleZ`) are added to the Note interface and default to 0 for existing notes.

## Constraints

- No authentication or moderation (unchanged)
- Physics toys are ephemeral -- only sticky notes persist
- Single-player with shared state (no real-time multiplayer)
- OrbitControls must not conflict with object dragging (disable orbit while dragging an object)
