"use client";

import { useState } from "react";
import { ToyType } from "./PhysicsToy";
import { NOTE_COLORS } from "@/lib/constants";

interface ToolbarProps {
  onAddNote: (text: string, color: string) => void;
  onSpawnToy: (type: ToyType) => void;
  onResetToys: () => void;
}

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

  return (
    <>
      <div style={toolbarStyle}>
        <button
          style={{ ...buttonStyle, background: noteOpen ? "rgba(255,68,68,0.3)" : "rgba(255,247,64,0.2)" }}
          onClick={() => setNoteOpen((prev) => !prev)}
        >
          {noteOpen ? "Cancel" : "+ Note"}
        </button>
        <button style={buttonStyle} onClick={() => onSpawnToy("ball")}>Ball</button>
        <button style={buttonStyle} onClick={() => onSpawnToy("block")}>Block</button>
        <button style={buttonStyle} onClick={() => onSpawnToy("dominoes")}>Dominoes</button>
        <button style={{ ...buttonStyle, color: "#ff6b6b" }} onClick={onResetToys}>Reset</button>
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
