# Sticky Note Board -- Design Spec

## Overview

A public, anonymous sticky note board where anyone can post notes that have real physics. Notes fall with gravity, collide, stack, and can be tossed around. The board has a cork board aesthetic. Data persists across sessions via Vercel KV.

## Audience

Public/anonymous. No authentication. Anyone can visit and post.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Physics:** Matter.js (2D rigid-body physics)
- **Storage:** Vercel KV (Redis)
- **Deployment:** Vercel

## Architecture

Single-page app at `/`. The board fills the entire viewport.

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/notes` | Fetch all notes |
| POST | `/api/notes` | Create a new note |
| PUT | `/api/notes/[id]` | Update position/rotation after physics settles |
| DELETE | `/api/notes/[id]` | Remove a note |

### Data Model

```
Note {
  id: string (uuid)
  text: string
  x: number
  y: number
  angle: number
  color: string (hex)
  createdAt: number (timestamp)
}
```

Storage: Vercel KV hash map `notes:{id}` -> note JSON. Set `note_ids` holds all IDs.

## Board Design

- **Background:** Cork texture via CSS gradients and noise patterns. Dark wooden frame border.
- **No external images required.**

## Sticky Note Design

- Square-ish shape with slight random rotation
- Folded corner effect (CSS)
- Handwriting-style font
- Random color from palette: yellow (#fff740), pink (#ff7eb3), blue (#7afcff), green (#77dd77), orange (#ffb347), purple (#b39ddb)

## Physics Behavior

- **Engine:** Matter.js running client-side
- **Gravity:** Notes fall downward
- **Boundaries:** Left, right, and bottom edges of the viewport are solid walls (notes can't fly off screen)
- **Friction & restitution:** Notes slide and bounce slightly but settle quickly
- **Drag:** Mouse constraint -- note follows cursor while dragging. On release, inherits mouse velocity (tossable)
- **Sleep:** After a note stops moving, Matter.js puts it to sleep. On sleep, persist final position to KV via PUT.
- **Page load:** Fetch all notes from KV, place at saved positions, gentle settle animation

## User Interaction

1. **View board:** Page loads, notes appear at their saved positions and settle
2. **Add note:** Click floating "+" button (bottom-right). Small popover appears with text input and optional color picker. Hit "Post" -- note drops in from the top with gravity
3. **Move notes:** Click and drag any note. Release to let physics take over. Toss by releasing with velocity.
4. **Notes interact:** Push one into others -- they scatter, collide, stack realistically

## Constraints

- No authentication or moderation
- No character limits
- No max note count
- Totally open free-for-all
