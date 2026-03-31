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
