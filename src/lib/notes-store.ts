import { Redis } from "@upstash/redis";
import { Note } from "./types";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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
  updates: Partial<Pick<Note, "x" | "y" | "z" | "angle" | "angleX" | "angleZ">>
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
