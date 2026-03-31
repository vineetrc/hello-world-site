"use client";

import { useRef, useMemo } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { ThreeEvent } from "@react-three/fiber";
import {
  BALL_RADIUS_MIN, BALL_RADIUS_MAX,
  BLOCK_SIZE_MIN, BLOCK_SIZE_MAX,
  DOMINO_WIDTH, DOMINO_HEIGHT, DOMINO_DEPTH,
  DOMINO_COUNT, DOMINO_SPACING,
} from "@/lib/constants";
import * as THREE from "three";

export type ToyType = "ball" | "block" | "dominoes";

interface PhysicsToyProps {
  type: ToyType;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const BRIGHT_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff", "#ff9f43"];

function randomColor() {
  return BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)];
}

function Ball({ onDragStart, onDragEnd }: Omit<PhysicsToyProps, "type">) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const lastPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  const { radius, color, x, z } = useMemo(() => ({
    radius: BALL_RADIUS_MIN + Math.random() * (BALL_RADIUS_MAX - BALL_RADIUS_MIN),
    color: randomColor(),
    x: (Math.random() - 0.5) * 6,
    z: (Math.random() - 0.5) * 6,
  }), []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!bodyRef.current) return;
    isDragging.current = true;
    onDragStart();
    const pos = bodyRef.current.translation();
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -pos.y);
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    dragOffset.current.set(pos.x - intersect.x, 0, pos.z - intersect.z);
    lastPos.current.set(pos.x, pos.y, pos.z);
    bodyRef.current.setBodyType(2, true);
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
    <RigidBody ref={bodyRef} position={[x, 8, z]} restitution={0.8} friction={0.3} colliders="ball">
      <mesh castShadow onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

function Block({ onDragStart, onDragEnd }: Omit<PhysicsToyProps, "type">) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const lastPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  const { size, color, x, z } = useMemo(() => ({
    size: BLOCK_SIZE_MIN + Math.random() * (BLOCK_SIZE_MAX - BLOCK_SIZE_MIN),
    color: randomColor(),
    x: (Math.random() - 0.5) * 6,
    z: (Math.random() - 0.5) * 6,
  }), []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!bodyRef.current) return;
    isDragging.current = true;
    onDragStart();
    const pos = bodyRef.current.translation();
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -pos.y);
    const intersect = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane.current, intersect);
    dragOffset.current.set(pos.x - intersect.x, 0, pos.z - intersect.z);
    lastPos.current.set(pos.x, pos.y, pos.z);
    bodyRef.current.setBodyType(2, true);
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
    <RigidBody ref={bodyRef} position={[x, 8, z]} friction={0.6} restitution={0.2} colliders="cuboid">
      <mesh castShadow onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

function Dominoes({ onDragStart, onDragEnd }: Omit<PhysicsToyProps, "type">) {
  const color = useMemo(() => randomColor(), []);

  return (
    <>
      {Array.from({ length: DOMINO_COUNT }).map((_, i) => {
        const x = (i - DOMINO_COUNT / 2) * DOMINO_SPACING;
        return (
          <RigidBody key={i} position={[x, DOMINO_HEIGHT / 2 + 0.1, 0]} friction={0.5} restitution={0.1} colliders="cuboid">
            <mesh castShadow>
              <boxGeometry args={[DOMINO_WIDTH, DOMINO_HEIGHT, DOMINO_DEPTH]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
}

export default function PhysicsToy({ type, onDragStart, onDragEnd }: PhysicsToyProps) {
  switch (type) {
    case "ball":
      return <Ball onDragStart={onDragStart} onDragEnd={onDragEnd} />;
    case "block":
      return <Block onDragStart={onDragStart} onDragEnd={onDragEnd} />;
    case "dominoes":
      return <Dominoes onDragStart={onDragStart} onDragEnd={onDragEnd} />;
  }
}
