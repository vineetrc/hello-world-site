# 3D Physics Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the 2D sticky note board into a 3D interactive physics playground with React Three Fiber, featuring a room with ramps, bouncy walls, a seesaw, sticky notes, and physics toys.

**Architecture:** Replace the entire 2D frontend (Matter.js + DOM) with a React Three Fiber canvas and Rapier 3D physics. Keep the existing Next.js API routes and Upstash Redis backend unchanged. The R3F scene renders a playground room with interactive objects.

**Tech Stack:** React Three Fiber, @react-three/rapier, @react-three/drei, Three.js, Next.js 16, Upstash Redis

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # unchanged
│   ├── page.tsx                # modify: dynamic import Scene instead of Board
│   ├── globals.css             # rewrite: remove cork board styles, add minimal 3D styles
│   └── api/notes/              # unchanged
├── components/
│   ├── Scene.tsx               # NEW: R3F Canvas + Physics wrapper + OrbitControls
│   ├── Room.tsx                # NEW: floor, walls, ramp, bouncy wall, seesaw, lighting
│   ├── StickyNote3D.tsx        # NEW: 3D sticky note with text, physics body
│   ├── PhysicsToy.tsx          # NEW: ball, block, domino components
│   ├── DragConstraint.tsx      # NEW: click-drag-toss interaction for physics bodies
│   ├── Toolbar.tsx             # NEW: HTML overlay toolbar (add note, spawn toys, reset)
│   ├── Board.tsx               # DELETE
│   └── StickyNote.tsx          # DELETE
├── lib/
│   ├── types.ts                # modify: add z, angleX, angleZ fields
│   ├── notes-store.ts          # modify: update Pick type for updateNote
│   ├── physics.ts              # DELETE (Matter.js)
│   └── constants.ts            # NEW: shared constants (colors, sizes, room dimensions)
```

---

### Task 1: Update Dependencies

Swap Matter.js for R3F + Rapier. Update package.json.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall Matter.js**

```bash
npm uninstall matter-js @types/matter-js
```

- [ ] **Step 2: Install R3F, Rapier, drei, and Three.js**

```bash
npm install three @react-three/fiber @react-three/rapier @react-three/drei
npm install -D @types/three
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: swap Matter.js for R3F + Rapier + drei"
```

---

### Task 2: Update Data Model

Add 3D fields to the Note type and update the store's updateNote function signature.

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/notes-store.ts`
- Modify: `src/app/api/notes/[id]/route.ts`

- [ ] **Step 1: Update the Note interface**

Replace `src/lib/types.ts` with:
```ts
export interface Note {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  angle: number;
  angleX: number;
  angleZ: number;
  color: string;
  createdAt: number;
}
```

- [ ] **Step 2: Update updateNote to accept 3D fields**

In `src/lib/notes-store.ts`, change the `updateNote` function signature from:
```ts
export async function updateNote(
  id: string,
  updates: Pick<Note, "x" | "y" | "angle">
): Promise<Note | null> {
```
to:
```ts
export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, "x" | "y" | "z" | "angle" | "angleX" | "angleZ">>
): Promise<Note | null> {
```

- [ ] **Step 3: Update the PUT route to pass 3D fields**

Replace the PUT function in `src/app/api/notes/[id]/route.ts` with:
```ts
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { x, y, z, angle, angleX, angleZ } = body;

  const updated = await updateNote(id, { x, y, z, angle, angleX, angleZ });
  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
```

- [ ] **Step 4: Update the POST route to include 3D defaults**

In `src/app/api/notes/route.ts`, update the note creation in the POST handler. Change the note object from:
```ts
  const note: Note = {
    id: uuid(),
    text,
    x: x ?? 400,
    y: y ?? -100,
    angle: 0,
    color: color ?? "#fff740",
    createdAt: Date.now(),
  };
```
to:
```ts
  const note: Note = {
    id: uuid(),
    text,
    x: x ?? 0,
    y: y ?? 8,
    z: body.z ?? 0,
    angle: 0,
    angleX: 0,
    angleZ: 0,
    color: color ?? "#fff740",
    createdAt: Date.now(),
  };
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds (existing components will have type errors from missing Matter.js, but those files are being deleted in the next task).

Note: Build may fail due to Board.tsx/StickyNote.tsx importing deleted matter-js. That's expected and fixed in Task 3.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/notes-store.ts src/app/api/notes/route.ts src/app/api/notes/\[id\]/route.ts
git commit -m "feat: add 3D fields to Note type and update API routes"
```

---

### Task 3: Delete Old 2D Components and Create Constants

Remove the old Matter.js-based frontend and create shared constants.

**Files:**
- Delete: `src/components/Board.tsx`
- Delete: `src/components/StickyNote.tsx`
- Delete: `src/lib/physics.ts`
- Create: `src/lib/constants.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Delete old files**

```bash
rm src/components/Board.tsx src/components/StickyNote.tsx src/lib/physics.ts
```

- [ ] **Step 2: Create shared constants**

Create `src/lib/constants.ts`:
```ts
// Room dimensions (in 3D units)
export const ROOM_WIDTH = 20;
export const ROOM_DEPTH = 20;
export const ROOM_HEIGHT = 12;
export const WALL_THICKNESS = 0.3;

// Sticky note dimensions
export const NOTE_WIDTH = 1.5;
export const NOTE_HEIGHT = 1.5;
export const NOTE_DEPTH = 0.03;

// Color palette
export const NOTE_COLORS = [
  "#fff740", // yellow
  "#ff7eb3", // pink
  "#7afcff", // blue
  "#77dd77", // green
  "#ffb347", // orange
  "#b39ddb", // purple
];

// Physics toy sizes
export const BALL_RADIUS_MIN = 0.3;
export const BALL_RADIUS_MAX = 0.6;
export const BLOCK_SIZE_MIN = 0.5;
export const BLOCK_SIZE_MAX = 1.0;
export const DOMINO_WIDTH = 0.2;
export const DOMINO_HEIGHT = 1.0;
export const DOMINO_DEPTH = 0.5;
export const DOMINO_COUNT = 8;
export const DOMINO_SPACING = 0.6;
```

- [ ] **Step 3: Rewrite globals.css**

Replace `src/app/globals.css` with:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0a;
}
```

- [ ] **Step 4: Update page.tsx**

Replace `src/app/page.tsx` with:
```tsx
"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  return <Scene />;
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove 2D components, add constants, prepare for 3D"
```

---

### Task 4: Scene Component (Canvas + Physics + Camera)

The root 3D component that sets up the R3F canvas, Rapier physics world, and orbit camera.

**Files:**
- Create: `src/components/Scene.tsx`

- [ ] **Step 1: Create Scene component**

Create `src/components/Scene.tsx`:
```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useState, useCallback } from "react";
import Room from "./Room";
import StickyNote3D from "./StickyNote3D";
import PhysicsToy, { ToyType } from "./PhysicsToy";
import Toolbar from "./Toolbar";
import { Note } from "@/lib/types";
import { useEffect } from "react";

interface Toy {
  id: string;
  type: ToyType;
}

export default function Scene() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [toys, setToys] = useState<Toy[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data: Note[]) => setNotes(data));
  }, []);

  const addNote = useCallback(async (text: string, color: string) => {
    const x = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 8;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, x, y: 8, z, color }),
    });
    const note: Note = await res.json();
    setNotes((prev) => [...prev, note]);
  }, []);

  const spawnToy = useCallback((type: ToyType) => {
    setToys((prev) => [...prev, { id: crypto.randomUUID(), type }]);
  }, []);

  const resetToys = useCallback(() => {
    setToys([]);
  }, []);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [12, 10, 12], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Room />
            {notes.map((note) => (
              <StickyNote3D
                key={note.id}
                note={note}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
              />
            ))}
            {toys.map((toy) => (
              <PhysicsToy
                key={toy.id}
                type={toy.type}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
              />
            ))}
          </Physics>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[8, 12, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
          />
          <OrbitControls
            enabled={!isDragging}
            target={[0, 2, 0]}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={5}
            maxDistance={30}
          />
        </Suspense>
      </Canvas>
      <Toolbar onAddNote={addNote} onSpawnToy={spawnToy} onResetToys={resetToys} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Scene.tsx
git commit -m "feat: add Scene component with R3F canvas, Rapier physics, orbit camera"
```

---

### Task 5: Room Component (Floor, Walls, Ramp, Bouncy Wall, Seesaw)

Static geometry for the playground environment.

**Files:**
- Create: `src/components/Room.tsx`

- [ ] **Step 1: Create Room component**

Create `src/components/Room.tsx`:
```tsx
"use client";

import { RigidBody, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import { ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT, WALL_THICKNESS } from "@/lib/constants";

function Floor() {
  return (
    <RigidBody type="fixed" friction={1.5}>
      <mesh receiveShadow position={[0, -0.25, 0]}>
        <boxGeometry args={[ROOM_WIDTH, 0.5, ROOM_DEPTH]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>
      {/* Grid lines on floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          color="#2a2a3e"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </RigidBody>
  );
}

function Walls() {
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const halfH = ROOM_HEIGHT / 2;

  const wallProps = {
    type: "fixed" as const,
    friction: 0.5,
    restitution: 0.2,
  };

  return (
    <>
      {/* Back wall */}
      <RigidBody {...wallProps}>
        <mesh position={[0, halfH, -halfD]} castShadow>
          <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      {/* Front wall */}
      <RigidBody {...wallProps}>
        <mesh position={[0, halfH, halfD]}>
          <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.15} />
        </mesh>
      </RigidBody>
      {/* Left wall */}
      <RigidBody {...wallProps}>
        <mesh position={[-halfW, halfH, 0]} castShadow>
          <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      {/* Right wall */}
      <RigidBody {...wallProps}>
        <mesh position={[halfW, halfH, 0]}>
          <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.15} />
        </mesh>
      </RigidBody>
    </>
  );
}

function Ramp() {
  return (
    <RigidBody type="fixed" friction={0.4}>
      <mesh
        position={[-6, 1.2, -6]}
        rotation={[0, Math.PI / 4, -Math.PI / 8]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[5, 0.3, 3]} />
        <meshStandardMaterial color="#ee5a24" />
      </mesh>
    </RigidBody>
  );
}

function BouncyWall() {
  return (
    <RigidBody type="fixed" restitution={1.5} friction={0.1}>
      <mesh position={[9.5, 3, 0]} castShadow>
        <boxGeometry args={[0.5, 6, 5]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.2} />
      </mesh>
    </RigidBody>
  );
}

function Seesaw() {
  return (
    <group position={[0, 0, 6]}>
      {/* Fulcrum */}
      <RigidBody type="fixed">
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.6, 0.8, 16]} />
          <meshStandardMaterial color="#ff9500" />
        </mesh>
      </RigidBody>
      {/* Plank */}
      <RigidBody
        type="dynamic"
        mass={2}
        friction={0.8}
        colliders="cuboid"
      >
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 0.2, 1.2]} />
          <meshStandardMaterial color="#ffb347" />
        </mesh>
      </RigidBody>
    </group>
  );
}

export default function Room() {
  return (
    <>
      <Floor />
      <Walls />
      <Ramp />
      <BouncyWall />
      <Seesaw />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Room.tsx
git commit -m "feat: add Room component with floor, walls, ramp, bouncy wall, seesaw"
```

---

### Task 6: StickyNote3D Component

3D sticky note with text, physics body, drag-and-toss, and persistence.

**Files:**
- Create: `src/components/StickyNote3D.tsx`

- [ ] **Step 1: Create StickyNote3D component**

Create `src/components/StickyNote3D.tsx`:
```tsx
"use client";

import { useRef } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Note } from "@/lib/types";
import { NOTE_WIDTH, NOTE_HEIGHT, NOTE_DEPTH } from "@/lib/constants";
import * as THREE from "three";

interface StickyNote3DProps {
  note: Note;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function StickyNote3D({ note, onDragStart, onDragEnd }: StickyNote3DProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const lastPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const persistedRef = useRef(false);

  // Persist position when note comes to rest
  useFrame(() => {
    if (!bodyRef.current || isDragging.current) return;
    const linvel = bodyRef.current.linvel();
    const angvel = bodyRef.current.angvel();
    const speed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2);
    const angSpeed = Math.sqrt(angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2);

    if (speed < 0.05 && angSpeed < 0.05 && !persistedRef.current) {
      persistedRef.current = true;
      const pos = bodyRef.current.translation();
      const rot = bodyRef.current.rotation();
      const euler = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
      );
      fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x: pos.x,
          y: pos.y,
          z: pos.z,
          angle: euler.y,
          angleX: euler.x,
          angleZ: euler.z,
        }),
      }).catch(() => {});
    }
    if (speed > 0.1 || angSpeed > 0.1) {
      persistedRef.current = false;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!bodyRef.current) return;
    isDragging.current = true;
    onDragStart();

    const pos = bodyRef.current.translation();
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -pos.y);
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    dragOffset.current.set(pos.x - intersect.x, 0, pos.z - intersect.z);
    lastPos.current.set(pos.x, pos.y, pos.z);

    bodyRef.current.setBodyType(2, true); // kinematic
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current || !bodyRef.current) return;
    e.stopPropagation();

    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    const newPos = {
      x: intersect.x + dragOffset.current.x,
      y: bodyRef.current.translation().y,
      z: intersect.z + dragOffset.current.z,
    };

    velocity.current.set(
      newPos.x - lastPos.current.x,
      0,
      newPos.z - lastPos.current.z
    ).multiplyScalar(60);
    lastPos.current.set(newPos.x, newPos.y, newPos.z);

    bodyRef.current.setNextKinematicTranslation(newPos);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current || !bodyRef.current) return;
    e.stopPropagation();
    isDragging.current = false;
    onDragEnd();

    bodyRef.current.setBodyType(0, true); // dynamic
    bodyRef.current.setLinvel(
      { x: velocity.current.x, y: 2, z: velocity.current.z },
      true
    );
  };

  return (
    <RigidBody
      ref={bodyRef}
      position={[note.x, note.y ?? 5, note.z ?? 0]}
      rotation={[note.angleX ?? 0, note.angle ?? 0, note.angleZ ?? 0]}
      friction={0.6}
      restitution={0.15}
      colliders="cuboid"
    >
      <mesh
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[NOTE_WIDTH, NOTE_HEIGHT, NOTE_DEPTH]} />
        <meshStandardMaterial color={note.color} />
      </mesh>
      <Text
        position={[0, 0, NOTE_DEPTH / 2 + 0.001]}
        fontSize={0.15}
        maxWidth={NOTE_WIDTH * 0.85}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Caveat-Regular.ttf"
      >
        {note.text}
      </Text>
    </RigidBody>
  );
}
```

- [ ] **Step 2: Download the Caveat font for 3D text**

```bash
mkdir -p public/fonts
curl -L -o public/fonts/Caveat-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf"
```

If the URL doesn't work, download manually from Google Fonts and place at `public/fonts/Caveat-Regular.ttf`.

- [ ] **Step 3: Commit**

```bash
git add src/components/StickyNote3D.tsx public/fonts/
git commit -m "feat: add StickyNote3D component with drag-toss and persistence"
```

---

### Task 7: PhysicsToy Component

Spawnable physics toys: balls, blocks, and dominoes.

**Files:**
- Create: `src/components/PhysicsToy.tsx`

- [ ] **Step 1: Create PhysicsToy component**

Create `src/components/PhysicsToy.tsx`:
```tsx
"use client";

import { useRef, useMemo } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { ThreeEvent } from "@react-three/fiber";
import {
  BALL_RADIUS_MIN,
  BALL_RADIUS_MAX,
  BLOCK_SIZE_MIN,
  BLOCK_SIZE_MAX,
  DOMINO_WIDTH,
  DOMINO_HEIGHT,
  DOMINO_DEPTH,
  DOMINO_COUNT,
  DOMINO_SPACING,
} from "@/lib/constants";
import * as THREE from "three";

export type ToyType = "ball" | "block" | "dominoes";

interface PhysicsToyProps {
  type: ToyType;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const BRIGHT_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff", "#ff9f43"];

function randomColor() {
  return BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)];
}

function Ball({ onDragStart, onDragEnd }: Omit<PhysicsToyProps, "type">) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const lastPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  const { radius, color, x, z } = useMemo(() => ({
    radius: BALL_RADIUS_MIN + Math.random() * (BALL_RADIUS_MAX - BALL_RADIUS_MIN),
    color: randomColor(),
    x: (Math.random() - 0.5) * 6,
    z: (Math.random() - 0.5) * 6,
  }), []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!bodyRef.current) return;
    isDragging.current = true;
    onDragStart();
    const pos = bodyRef.current.translation();
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -pos.y);
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    dragOffset.current.set(pos.x - intersect.x, 0, pos.z - intersect.z);
    lastPos.current.set(pos.x, pos.y, pos.z);
    bodyRef.current.setBodyType(2, true);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current || !bodyRef.current) return;
    e.stopPropagation();
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    const newPos = {
      x: intersect.x + dragOffset.current.x,
      y: bodyRef.current.translation().y,
      z: intersect.z + dragOffset.current.z,
    };
    velocity.current.set(newPos.x - lastPos.current.x, 0, newPos.z - lastPos.current.z).multiplyScalar(60);
    lastPos.current.set(newPos.x, newPos.y, newPos.z);
    bodyRef.current.setNextKinematicTranslation(newPos);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current || !bodyRef.current) return;
    e.stopPropagation();
    isDragging.current = false;
    onDragEnd();
    bodyRef.current.setBodyType(0, true);
    bodyRef.current.setLinvel({ x: velocity.current.x, y: 2, z: velocity.current.z }, true);
  };

  return (
    <RigidBody ref={bodyRef} position={[x, 8, z]} restitution={0.8} friction={0.3} colliders="ball">
      <mesh
        castShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

function Block({ onDragStart, onDragEnd }: Omit<PhysicsToyProps, "type">) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const lastPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  const { size, color, x, z } = useMemo(() => ({
    size: BLOCK_SIZE_MIN + Math.random() * (BLOCK_SIZE_MAX - BLOCK_SIZE_MIN),
    color: randomColor(),
    x: (Math.random() - 0.5) * 6,
    z: (Math.random() - 0.5) * 6,
  }), []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!bodyRef.current) return;
    isDragging.current = true;
    onDragStart();
    const pos = bodyRef.current.translation();
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -pos.y);
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    dragOffset.current.set(pos.x - intersect.x, 0, pos.z - intersect.z);
    lastPos.current.set(pos.x, pos.y, pos.z);
    bodyRef.current.setBodyType(2, true);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current || !bodyRef.current) return;
    e.stopPropagation();
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    const newPos = {
      x: intersect.x + dragOffset.current.x,
      y: bodyRef.current.translation().y,
      z: intersect.z + dragOffset.current.z,
    };
    velocity.current.set(newPos.x - lastPos.current.x, 0, newPos.z - lastPos.current.z).multiplyScalar(60);
    lastPos.current.set(newPos.x, newPos.y, newPos.z);
    bodyRef.current.setNextKinematicTranslation(newPos);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current || !bodyRef.current) return;
    e.stopPropagation();
    isDragging.current = false;
    onDragEnd();
    bodyRef.current.setBodyType(0, true);
    bodyRef.current.setLinvel({ x: velocity.current.x, y: 2, z: velocity.current.z }, true);
  };

  return (
    <RigidBody ref={bodyRef} position={[x, 8, z]} friction={0.6} restitution={0.2} colliders="cuboid">
      <mesh
        castShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

function Dominoes({ onDragStart, onDragEnd }: Omit<PhysicsToyProps, "type">) {
  const color = useMemo(() => randomColor(), []);

  return (
    <>
      {Array.from({ length: DOMINO_COUNT }).map((_, i) => {
        const x = (i - DOMINO_COUNT / 2) * DOMINO_SPACING;
        return (
          <RigidBody
            key={i}
            position={[x, DOMINO_HEIGHT / 2 + 0.1, 0]}
            friction={0.5}
            restitution={0.1}
            colliders="cuboid"
          >
            <mesh castShadow>
              <boxGeometry args={[DOMINO_WIDTH, DOMINO_HEIGHT, DOMINO_DEPTH]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
}

export default function PhysicsToy({ type, onDragStart, onDragEnd }: PhysicsToyProps) {
  switch (type) {
    case "ball":
      return <Ball onDragStart={onDragStart} onDragEnd={onDragEnd} />;
    case "block":
      return <Block onDragStart={onDragStart} onDragEnd={onDragEnd} />;
    case "dominoes":
      return <Dominoes onDragStart={onDragStart} onDragEnd={onDragEnd} />;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PhysicsToy.tsx
git commit -m "feat: add PhysicsToy component with balls, blocks, and dominoes"
```

---

### Task 8: Toolbar Component (HTML Overlay)

Glassmorphism toolbar for adding notes and spawning toys.

**Files:**
- Create: `src/components/Toolbar.tsx`

- [ ] **Step 1: Create Toolbar component**

Create `src/components/Toolbar.tsx`:
```tsx
"use client";

import { useState } from "react";
import { ToyType } from "./PhysicsToy";
import { NOTE_COLORS } from "@/lib/constants";

interface ToolbarProps {
  onAddNote: (text: string, color: string) => void;
  onSpawnToy: (type: ToyType) => void;
  onResetToys: () => void;
}

export default function Toolbar({ onAddNote, onSpawnToy, onResetToys }: ToolbarProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [text, setText] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddNote(text.trim(), selectedColor);
    setText("");
    setNoteOpen(false);
    setSelectedColor(NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]);
  };

  const toolbarStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 8,
    padding: "12px 20px",
    background: "rgba(20, 20, 30, 0.7)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 16,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    zIndex: 1000,
    alignItems: "center",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.2s",
    fontFamily: "system-ui, sans-serif",
  };

  return (
    <>
      <div style={toolbarStyle}>
        <button
          style={{ ...buttonStyle, background: noteOpen ? "rgba(255,68,68,0.3)" : "rgba(255,247,64,0.2)" }}
          onClick={() => setNoteOpen(!noteOpen)}
        >
          {noteOpen ? "Cancel" : "+ Note"}
        </button>
        <button style={buttonStyle} onClick={() => onSpawnToy("ball")}>
          Ball
        </button>
        <button style={buttonStyle} onClick={() => onSpawnToy("block")}>
          Block
        </button>
        <button style={buttonStyle} onClick={() => onSpawnToy("dominoes")}>
          Dominoes
        </button>
        <button
          style={{ ...buttonStyle, color: "#ff6b6b" }}
          onClick={onResetToys}
        >
          Reset
        </button>
      </div>

      {noteOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20, 20, 30, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: 20,
            width: 300,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            zIndex: 1001,
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your note..."
            autoFocus
            style={{
              width: "100%",
              height: 80,
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 10,
              color: "#fff",
              padding: 12,
              fontSize: 14,
              resize: "none",
              outline: "none",
              fontFamily: "system-ui, sans-serif",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div style={{ display: "flex", gap: 6, margin: "12px 0" }}>
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c,
                  border: selectedColor === c ? "3px solid #fff" : "3px solid transparent",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "10px 0",
              background: selectedColor,
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              color: "#333",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Post Note
          </button>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: add glassmorphism Toolbar overlay for notes and toys"
```

---

### Task 9: Build, Test, and Deploy

Verify everything works together and deploy.

**Files:**
- No new files.

- [ ] **Step 1: Verify build**

```bash
npm run build
```

Expected: Build completes without errors.

- [ ] **Step 2: Test locally**

```bash
npm run dev
```

Open http://localhost:3000. Verify:
- 3D room renders with floor, walls, ramp, bouncy wall, seesaw
- Camera orbits with drag, zooms with scroll
- Click "+ Note", type text, pick color, post -- note drops from above with gravity
- Click "Ball" / "Block" -- toys spawn and fall
- Click "Dominoes" -- row of dominoes appears
- Drag any object -- it follows the mouse, toss on release
- Objects collide with each other and room geometry
- "Reset" clears toys but not notes
- Refresh page -- sticky notes persist at their positions

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build/runtime issues from integration testing"
```

(Skip this step if no fixes needed.)

- [ ] **Step 4: Push and deploy**

```bash
git push origin main
npx vercel --prod
```

- [ ] **Step 5: Verify production**

Open the Vercel URL. Repeat the checks from Step 2.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: 3D physics playground deployed"
git push origin main
```
