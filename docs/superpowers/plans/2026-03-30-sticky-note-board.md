# Sticky Note Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, anonymous sticky note board with real 2D physics (gravity, collisions, tossing) and persistent storage.

**Architecture:** Next.js App Router with a single client-side page that runs Matter.js for physics. API routes handle CRUD operations against Upstash Redis (via Vercel Marketplace). Notes are DOM elements whose positions are driven by Matter.js physics bodies.

**Tech Stack:** Next.js 15 (App Router), Matter.js, Upstash Redis (@upstash/redis), TypeScript

---

## File Structure

```
hello-world-site/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata and font imports
│   │   ├── page.tsx            # Main page, renders Board component
│   │   ├── globals.css         # Global styles: cork board background, note styles
│   │   └── api/
│   │       └── notes/
│   │           ├── route.ts    # GET all notes, POST new note
│   │           └── [id]/
│   │               └── route.ts # PUT update position, DELETE remove note
│   ├── components/
│   │   ├── Board.tsx           # Main board: Matter.js engine, renders notes
│   │   ├── StickyNote.tsx      # Individual sticky note DOM element
│   │   └── AddNoteButton.tsx   # Floating "+" button with popover form
│   ├── lib/
│   │   ├── physics.ts          # Matter.js engine setup, walls, mouse constraint
│   │   ├── notes-store.ts      # Upstash Redis read/write helpers
│   │   └── types.ts            # Note type definition
├── package.json
├── tsconfig.json
├── next.config.ts
└── .gitignore
```

---

### Task 1: Scaffold Next.js Project

Replace the current static HTML with a Next.js app. This is a full project init.

**Files:**
- Delete: `index.html`
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

Run from the project root:
```bash
npx create-next-app@latest . --typescript --tailwind=no --eslint=no --app --src-dir --import-alias="@/*" --use-npm
```

If it asks to overwrite, say yes. This replaces `index.html` with the Next.js scaffolding.

- [ ] **Step 2: Remove boilerplate and set up minimal page**

Replace `src/app/page.tsx` with:
```tsx
export default function Home() {
  return (
    <main>
      <h1>Sticky Note Board</h1>
      <p>Loading...</p>
    </main>
  );
}
```

Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sticky Note Board",
  description: "A public sticky note board with real physics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

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
}
```

- [ ] **Step 3: Verify it runs**

Run: `npm run dev`
Expected: Page loads at http://localhost:3000 showing "Sticky Note Board" and "Loading..."

- [ ] **Step 4: Update .gitignore and delete old index.html**

Add to `.gitignore`:
```
node_modules
.next
.superpowers
```

Delete `index.html` if create-next-app didn't remove it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project, replace static HTML"
```

---

### Task 2: Define Types and Redis Store Helpers

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/notes-store.ts`

- [ ] **Step 1: Install Upstash Redis**

```bash
npm install @upstash/redis uuid
npm install -D @types/uuid
```

- [ ] **Step 2: Create the Note type**

Create `src/lib/types.ts`:
```ts
export interface Note {
  id: string;
  text: string;
  x: number;
  y: number;
  angle: number;
  color: string;
  createdAt: number;
}
```

- [ ] **Step 3: Create Redis store helpers**

Create `src/lib/notes-store.ts`:
```ts
import { Redis } from "@upstash/redis";
import { Note } from "./types";

const redis = Redis.fromEnv();

export async function getAllNotes(): Promise<Note[]> {
  const ids = await redis.smembers("note_ids");
  if (!ids || ids.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.get(`notes:${id}`);
  }
  const results = await pipeline.exec();
  return results.filter((r): r is Note => r !== null);
}

export async function createNote(note: Note): Promise<void> {
  await redis.set(`notes:${note.id}`, JSON.stringify(note));
  await redis.sadd("note_ids", note.id);
}

export async function updateNote(
  id: string,
  updates: Pick<Note, "x" | "y" | "angle">
): Promise<Note | null> {
  const raw = await redis.get<string>(`notes:${id}`);
  if (!raw) return null;
  const note: Note = typeof raw === "string" ? JSON.parse(raw) : raw;
  const updated = { ...note, ...updates };
  await redis.set(`notes:${id}`, JSON.stringify(updated));
  return updated;
}

export async function deleteNote(id: string): Promise<boolean> {
  const existed = await redis.del(`notes:${id}`);
  await redis.srem("note_ids", id);
  return existed > 0;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/notes-store.ts package.json package-lock.json
git commit -m "feat: add Note type and Upstash Redis store helpers"
```

---

### Task 3: API Routes

**Files:**
- Create: `src/app/api/notes/route.ts`
- Create: `src/app/api/notes/[id]/route.ts`

- [ ] **Step 1: Create GET and POST route**

Create `src/app/api/notes/route.ts`:
```ts
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getAllNotes, createNote } from "@/lib/notes-store";
import { Note } from "@/lib/types";

export async function GET() {
  const notes = await getAllNotes();
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { text, x, y, color } = body;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const note: Note = {
    id: uuid(),
    text,
    x: x ?? 400,
    y: y ?? -100,
    angle: 0,
    color: color ?? "#fff740",
    createdAt: Date.now(),
  };

  await createNote(note);
  return NextResponse.json(note, { status: 201 });
}
```

- [ ] **Step 2: Create PUT and DELETE route**

Create `src/app/api/notes/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { updateNote, deleteNote } from "@/lib/notes-store";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { x, y, angle } = body;

  const updated = await updateNote(id, { x, y, angle });
  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteNote(id);
  if (!deleted) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Verify routes compile**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add notes API routes (GET, POST, PUT, DELETE)"
```

---

### Task 4: Physics Engine Setup

**Files:**
- Create: `src/lib/physics.ts`

- [ ] **Step 1: Install Matter.js**

```bash
npm install matter-js
npm install -D @types/matter-js
```

- [ ] **Step 2: Create physics engine module**

Create `src/lib/physics.ts`:
```ts
import Matter from "matter-js";

const NOTE_WIDTH = 150;
const NOTE_HEIGHT = 150;
const WALL_THICKNESS = 60;

export interface PhysicsEngine {
  engine: Matter.Engine;
  runner: Matter.Runner;
  mouse: Matter.Mouse;
  mouseConstraint: Matter.MouseConstraint;
  addNoteBody: (id: string, x: number, y: number, angle: number) => Matter.Body;
  removeNoteBody: (id: string) => void;
  getBodies: () => Map<string, Matter.Body>;
  resize: (width: number, height: number) => void;
  destroy: () => void;
}

export function createPhysicsEngine(
  container: HTMLElement
): PhysicsEngine {
  const engine = Matter.Engine.create({
    enableSleeping: true,
  });

  engine.gravity.y = 1;

  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  const width = window.innerWidth;
  const height = window.innerHeight;

  const floor = Matter.Bodies.rectangle(
    width / 2, height + WALL_THICKNESS / 2, width * 3, WALL_THICKNESS,
    { isStatic: true, label: "floor" }
  );
  const leftWall = Matter.Bodies.rectangle(
    -WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 3,
    { isStatic: true, label: "leftWall" }
  );
  const rightWall = Matter.Bodies.rectangle(
    width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 3,
    { isStatic: true, label: "rightWall" }
  );

  Matter.Composite.add(engine.world, [floor, leftWall, rightWall]);

  const mouse = Matter.Mouse.create(container);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false },
    },
  });
  Matter.Composite.add(engine.world, mouseConstraint);

  const bodies = new Map<string, Matter.Body>();

  function addNoteBody(id: string, x: number, y: number, angle: number): Matter.Body {
    const body = Matter.Bodies.rectangle(x, y, NOTE_WIDTH, NOTE_HEIGHT, {
      restitution: 0.3,
      friction: 0.5,
      frictionAir: 0.02,
      angle,
      label: id,
      sleepThreshold: 60,
    });
    bodies.set(id, body);
    Matter.Composite.add(engine.world, body);
    return body;
  }

  function removeNoteBody(id: string) {
    const body = bodies.get(id);
    if (body) {
      Matter.Composite.remove(engine.world, body);
      bodies.delete(id);
    }
  }

  function resize(newWidth: number, newHeight: number) {
    Matter.Body.setPosition(floor, { x: newWidth / 2, y: newHeight + WALL_THICKNESS / 2 });
    Matter.Body.setPosition(rightWall, { x: newWidth + WALL_THICKNESS / 2, y: newHeight / 2 });
    Matter.Body.setPosition(leftWall, { x: -WALL_THICKNESS / 2, y: newHeight / 2 });
  }

  function destroy() {
    Matter.Runner.stop(runner);
    Matter.Engine.clear(engine);
    bodies.clear();
  }

  return {
    engine,
    runner,
    mouse,
    mouseConstraint,
    addNoteBody,
    removeNoteBody,
    getBodies: () => bodies,
    resize,
    destroy,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/physics.ts package.json package-lock.json
git commit -m "feat: add Matter.js physics engine setup with walls and drag"
```

---

### Task 5: StickyNote Component

**Files:**
- Create: `src/components/StickyNote.tsx`

- [ ] **Step 1: Create the StickyNote component**

Create `src/components/StickyNote.tsx`:
```tsx
"use client";

import { Note } from "@/lib/types";

interface StickyNoteProps {
  note: Note;
  x: number;
  y: number;
  angle: number;
}

const NOTE_SIZE = 150;

export default function StickyNote({ note, x, y, angle }: StickyNoteProps) {
  return (
    <div
      data-note-id={note.id}
      style={{
        position: "absolute",
        left: x - NOTE_SIZE / 2,
        top: y - NOTE_SIZE / 2,
        width: NOTE_SIZE,
        height: NOTE_SIZE,
        transform: `rotate(${angle}rad)`,
        pointerEvents: "none",
      }}
      className="sticky-note"
    >
      <div
        className="sticky-note-inner"
        style={{ backgroundColor: note.color }}
      >
        <div className="sticky-note-fold" />
        <p className="sticky-note-text">{note.text}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add sticky note styles to globals.css**

Append to `src/app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap');

body {
  background:
    repeating-radial-gradient(circle at 20% 30%, rgba(139,90,43,0.25) 0px, transparent 2px),
    repeating-radial-gradient(circle at 70% 60%, rgba(180,130,70,0.15) 0px, transparent 3px),
    linear-gradient(135deg, #c4956a 0%, #b8845a 50%, #c4956a 100%);
  border: 12px solid #3a2010;
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.sticky-note {
  user-select: none;
  z-index: 1;
}

.sticky-note-inner {
  width: 100%;
  height: 100%;
  padding: 12px;
  position: relative;
  box-shadow: 3px 3px 10px rgba(0,0,0,0.25);
  overflow: hidden;
}

.sticky-note-fold {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%);
}

.sticky-note-text {
  font-family: 'Caveat', cursive;
  font-size: 1.2rem;
  color: #333;
  word-wrap: break-word;
  line-height: 1.3;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StickyNote.tsx src/app/globals.css
git commit -m "feat: add StickyNote component with cork board styling"
```

---

### Task 6: Board Component (Physics + Rendering)

**Files:**
- Create: `src/components/Board.tsx`

- [ ] **Step 1: Create the Board component**

Create `src/components/Board.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPhysicsEngine, PhysicsEngine } from "@/lib/physics";
import { Note } from "@/lib/types";
import StickyNote from "./StickyNote";
import Matter from "matter-js";

interface NotePosition {
  x: number;
  y: number;
  angle: number;
}

export default function Board() {
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [positions, setPositions] = useState<Map<string, NotePosition>>(new Map());
  const animFrameRef = useRef<number>(0);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    const data: Note[] = await res.json();
    setNotes(data);
    return data;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const physics = createPhysicsEngine(containerRef.current);
    physicsRef.current = physics;

    fetchNotes().then((loadedNotes) => {
      for (const note of loadedNotes) {
        physics.addNoteBody(note.id, note.x, note.y, note.angle);
      }
    });

    function update() {
      const bodies = physics.getBodies();
      const newPositions = new Map<string, NotePosition>();
      bodies.forEach((body, id) => {
        newPositions.set(id, {
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
        });
      });
      setPositions(newPositions);
      animFrameRef.current = requestAnimationFrame(update);
    }
    animFrameRef.current = requestAnimationFrame(update);

    Matter.Events.on(physics.engine, "afterUpdate", () => {
      const bodies = physics.getBodies();
      bodies.forEach((body, id) => {
        if (body.isSleeping && !(body as any).__persisted) {
          (body as any).__persisted = true;
          fetch(`/api/notes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              x: body.position.x,
              y: body.position.y,
              angle: body.angle,
            }),
          }).catch(() => {});
        }
        if (!body.isSleeping) {
          (body as any).__persisted = false;
        }
      });
    });

    const handleResize = () => {
      physics.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      physics.destroy();
    };
  }, [fetchNotes]);

  const addNote = useCallback(
    async (text: string, color: string) => {
      const x = Math.random() * (window.innerWidth - 200) + 100;
      const y = -100;

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, x, y, color }),
      });
      const note: Note = await res.json();

      setNotes((prev) => [...prev, note]);
      physicsRef.current?.addNoteBody(note.id, note.x, note.y, note.angle);
    },
    []
  );

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {notes.map((note) => {
        const pos = positions.get(note.id);
        return (
          <StickyNote
            key={note.id}
            note={note}
            x={pos?.x ?? note.x}
            y={pos?.y ?? note.y}
            angle={pos?.angle ?? note.angle}
          />
        );
      })}
      <AddNoteUI onAdd={addNote} />
    </div>
  );
}

function AddNoteUI({ onAdd }: { onAdd: (text: string, color: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const colors = ["#fff740", "#ff7eb3", "#7afcff", "#77dd77", "#ffb347", "#b39ddb"];
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), selectedColor);
    setText("");
    setOpen(false);
    setSelectedColor(colors[Math.floor(Math.random() * colors.length)]);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000 }}>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            right: 0,
            background: "#2a2a2a",
            borderRadius: 12,
            padding: 16,
            width: 280,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
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
              background: "#1a1a1a",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#fff",
              padding: 10,
              fontSize: 14,
              resize: "none",
              fontFamily: "'Caveat', cursive",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div style={{ display: "flex", gap: 6, margin: "10px 0" }}>
            {colors.map((c) => (
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
              padding: "8px 0",
              background: "#fff740",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "'Caveat', cursive",
            }}
          >
            Post Note
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: open ? "#ff4444" : "#fff740",
          border: "none",
          fontSize: 28,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          transform: open ? "rotate(45deg)" : "none",
        }}
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat: add Board component with physics loop, drag, and add-note UI"
```

---

### Task 7: Wire Up the Main Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update page.tsx to render the Board**

Replace `src/app/page.tsx` with:
```tsx
import dynamic from "next/dynamic";

const Board = dynamic(() => import("@/components/Board"), { ssr: false });

export default function Home() {
  return <Board />;
}
```

We use `dynamic` with `ssr: false` because Matter.js requires `window` and DOM access.

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire Board component into main page with dynamic import"
```

---

### Task 8: Connect Upstash Redis and Deploy

**Files:**
- No new files, configuration only.

- [ ] **Step 1: Add Upstash Redis via Vercel Marketplace**

The project is already linked to Vercel. Add Upstash Redis:
```bash
vercel integration add upstash
```

This creates the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables (which `Redis.fromEnv()` reads automatically).

- [ ] **Step 2: Pull env vars locally**

```bash
npx vercel env pull .env.local
```

- [ ] **Step 3: Test locally**

Run: `npm run dev`
Expected: Board loads. Click "+" to add a note. Note drops with gravity. Drag notes around. Refresh page -- notes persist in their positions.

- [ ] **Step 4: Deploy to production**

```bash
git push origin main
npx vercel --prod
```

- [ ] **Step 5: Verify production deployment**

Open the Vercel URL. Add a note, refresh, confirm persistence works.

- [ ] **Step 6: Final commit with any tweaks**

```bash
git add -A
git commit -m "feat: connect Upstash Redis and deploy sticky note board"
git push origin main
```
