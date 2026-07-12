import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Hero3D.module.css';

// Separate component for 3D elements to access R3F hooks (useFrame, etc.)
function FloatingAssets() {
  const groupRef = useRef();
  const laptopRef = useRef();
  const crateRef = useRef();
  const tagRef = useRef();
  const chairRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Laptop floating and rotating
    if (laptopRef.current) {
      laptopRef.current.position.y = Math.sin(time * 0.8 + 0) * 0.15 + 0.6;
      laptopRef.current.rotation.y = time * 0.15;
      laptopRef.current.rotation.x = Math.sin(time * 0.4) * 0.1;
    }

    // 2. Crate floating and rotating
    if (crateRef.current) {
      crateRef.current.position.y = Math.sin(time * 0.7 + 2) * 0.2 - 0.7;
      crateRef.current.rotation.y = -time * 0.2;
      crateRef.current.rotation.z = Math.cos(time * 0.5) * 0.15;
    }

    // 3. Tag floating and rotating
    if (tagRef.current) {
      tagRef.current.position.y = Math.sin(time * 0.9 + 4) * 0.18 + 0.8;
      tagRef.current.rotation.x = time * 0.3;
      tagRef.current.rotation.z = time * 0.2;
    }

    // 4. Chair silhouette floating and rotating
    if (chairRef.current) {
      chairRef.current.position.y = Math.sin(time * 0.65 + 1) * 0.14 - 0.6;
      chairRef.current.rotation.y = time * 0.1;
      chairRef.current.rotation.x = Math.cos(time * 0.3) * 0.1;
    }

    // Gentle parallax effect responding to mouse pointer
    if (groupRef.current) {
      const targetX = state.pointer.x * 0.25;
      const targetY = state.pointer.y * 0.25;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stylized Laptop Mesh */}
      <group ref={laptopRef} position={[-1.2, 0.6, 0]} scale={0.9}>
        {/* Base */}
        <mesh>
          <boxGeometry args={[1.5, 0.08, 1]} />
          <meshStandardMaterial color="#6366f1" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.45, -0.48]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[1.5, 0.9, 0.06]} />
          <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Screen Bezel / Content */}
        <mesh position={[0, 0.45, -0.44]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[1.4, 0.8, 0.01]} />
          <meshStandardMaterial color="#a5b4fc" emissive="#4f46e5" emissiveIntensity={0.2} roughness={0.1} />
        </mesh>
      </group>

      {/* Stylized Crate Mesh */}
      <group ref={crateRef} position={[1.4, -0.7, -0.5]} scale={1.1}>
        <mesh>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Bands */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.92, 0.2, 0.92]} />
          <meshStandardMaterial color="#d97706" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.92, 0.2, 0.92]} />
          <meshStandardMaterial color="#d97706" roughness={0.6} />
        </mesh>
      </group>

      {/* Stylized Tag Mesh */}
      <group ref={tagRef} position={[1.1, 0.8, 0.5]} scale={0.75}>
        <mesh>
          <torusGeometry args={[0.5, 0.15, 12, 48]} />
          <meshStandardMaterial color="#10b981" roughness={0.2} metalness={0.4} />
        </mesh>
        {/* Core center cylinder */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
          <meshStandardMaterial color="#34d399" roughness={0.3} />
        </mesh>
      </group>

      {/* Stylized Chair Silhouette */}
      <group ref={chairRef} position={[-1.3, -0.6, 0.8]} scale={0.8}>
        {/* Seat */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#ec4899" roughness={0.4} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.45, -0.35]}>
          <boxGeometry args={[0.8, 0.6, 0.1]} />
          <meshStandardMaterial color="#db2777" roughness={0.4} />
        </mesh>
        {/* Post */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 12]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Base legs cross */}
        <mesh position={[0, -0.75, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.7, 0.05, 0.1]} />
          <meshStandardMaterial color="#4b5563" metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.75, 0]} rotation={[0, -Math.PI / 4, 0]}>
          <boxGeometry args={[0.1, 0.05, 0.7]} />
          <meshStandardMaterial color="#4b5563" metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className={styles.canvasContainer}>
      <Suspense fallback={<div className={styles.loader}>Loading interactive 3D assets...</div>}>
        <Canvas
          gl={{ antialias: true }}
          dpr={[1, 2]}
          camera={{ position: [0, 0, 4.5], fov: 50 }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[5, 8, 5]} intensity={2.5} castShadow />
          <pointLight position={[-4, -4, -4]} intensity={1.0} color="#6366f1" />
          <pointLight position={[4, 4, 4]} intensity={1.2} color="#10b981" />
          <FloatingAssets />
        </Canvas>
      </Suspense>
    </div>
  );
}
