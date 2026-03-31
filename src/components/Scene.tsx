"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useState, useCallback, useEffect } from "react";
import Room from "./Room";
import StickyNote3D from "./StickyNote3D";
import PhysicsToy, { ToyType } from "./PhysicsToy";
import Toolbar from "./Toolbar";
import { Note } from "@/lib/types";

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
