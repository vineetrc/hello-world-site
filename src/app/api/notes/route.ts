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
    x: x ?? 0,
    y: y ?? 8,
    z: body.z ?? 0,
    angle: 0,
    angleX: 0,
    angleZ: 0,
    color: color ?? "#fff740",
    createdAt: Date.now(),
  };

  await createNote(note);
  return NextResponse.json(note, { status: 201 });
}
