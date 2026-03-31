"use client";

import { useRef } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Note } from "@/lib/types";
import { NOTE_WIDTH, NOTE_HEIGHT, NOTE_DEPTH } from "@/lib/constants";
import * as THREE from "three";

// Hoisted constants — avoids allocating new objects on every pointer event
const UP_NORMAL = new THREE.Vector3(0, 1, 0);

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
          x: pos.x, y: pos.y, z: pos.z,
          angle: euler.y, angleX: euler.x, angleZ: euler.z,
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
    dragPlane.current.set(UP_NORMAL, -pos.y);
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    dragOffset.current.set(pos.x - intersect.x, 0, pos.z - intersect.z);
    lastPos.current.set(pos.x, pos.y, pos.z);
    bodyRef.current.setBodyType(2, true);
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
    <RigidBody
      ref={bodyRef}
      position={[note.x, note.y ?? 5, note.z ?? 0]}
      rotation={[note.angleX ?? 0, note.angle ?? 0, note.angleZ ?? 0]}
      friction={0.6}
      restitution={0.15}
      colliders="cuboid"
    >
      <mesh
        castShadow receiveShadow
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
      >
        {note.text}
      </Text>
    </RigidBody>
  );
}
