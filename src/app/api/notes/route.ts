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
