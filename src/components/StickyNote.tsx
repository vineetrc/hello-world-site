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
