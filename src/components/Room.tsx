"use client";

import { RigidBody } from "@react-three/rapier";
import { ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT, WALL_THICKNESS } from "@/lib/constants";

function Floor() {
  return (
    <RigidBody type="fixed" friction={1.5}>
      <mesh receiveShadow position={[0, -0.25, 0]}>
        <boxGeometry args={[ROOM_WIDTH, 0.5, ROOM_DEPTH]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#2a2a3e" wireframe transparent opacity={0.15} />
      </mesh>
    </RigidBody>
  );
}

function Walls() {
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const halfH = ROOM_HEIGHT / 2;

  const wallProps = { type: "fixed" as const, friction: 0.5, restitution: 0.2 };

  return (
    <>
      <RigidBody {...wallProps}>
        <mesh position={[0, halfH, -halfD]} castShadow>
          <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody {...wallProps}>
        <mesh position={[0, halfH, halfD]}>
          <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.15} />
        </mesh>
      </RigidBody>
      <RigidBody {...wallProps}>
        <mesh position={[-halfW, halfH, 0]} castShadow>
          <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody {...wallProps}>
        <mesh position={[halfW, halfH, 0]}>
          <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
          <meshStandardMaterial color="#1e1e2f" transparent opacity={0.15} />
        </mesh>
      </RigidBody>
    </>
  );
}

function Ramp() {
  return (
    <RigidBody type="fixed" friction={0.4}>
      <mesh position={[-6, 1.2, -6]} rotation={[0, Math.PI / 4, -Math.PI / 8]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.3, 3]} />
        <meshStandardMaterial color="#ee5a24" />
      </mesh>
    </RigidBody>
  );
}

function BouncyWall() {
  return (
    <RigidBody type="fixed" restitution={1.5} friction={0.1}>
      <mesh position={[9.5, 3, 0]} castShadow>
        <boxGeometry args={[0.5, 6, 5]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.2} />
      </mesh>
    </RigidBody>
  );
}

function Seesaw() {
  return (
    <group position={[0, 0, 6]}>
      <RigidBody type="fixed">
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.6, 0.8, 16]} />
          <meshStandardMaterial color="#ff9500" />
        </mesh>
      </RigidBody>
      <RigidBody type="dynamic" mass={2} friction={0.8} colliders="cuboid">
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 0.2, 1.2]} />
          <meshStandardMaterial color="#ffb347" />
        </mesh>
      </RigidBody>
    </group>
  );
}

export default function Room() {
  return (
    <>
      <Floor />
      <Walls />
      <Ramp />
      <BouncyWall />
      <Seesaw />
    </>
  );
}
