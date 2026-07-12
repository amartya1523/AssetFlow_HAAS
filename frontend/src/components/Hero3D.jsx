import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Hero3D.module.css';

// Subtle floating particle cloud for depth and visual richness
function Particles({ count = 80 }) {
  const pointsRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.015;
      pointsRef.current.rotation.x = time * 0.008;
    }
  });

  const positions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push((Math.random() - 0.5) * 8); // X
      arr.push((Math.random() - 0.5) * 8); // Y
      arr.push((Math.random() - 0.5) * 8); // Z
    }
    return new Float32Array(arr);
  }, [count]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#a5b4fc"
        sizeAttenuation
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

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
      laptopRef.current.position.y = Math.sin(time * 0.7 + 0) * 0.18 + 0.5;
      laptopRef.current.rotation.y = time * 0.18;
      laptopRef.current.rotation.x = Math.sin(time * 0.3) * 0.08;
      laptopRef.current.rotation.z = Math.cos(time * 0.3) * 0.05;
    }

    // 2. Crate floating and rotating
    if (crateRef.current) {
      crateRef.current.position.y = Math.sin(time * 0.6 + 2) * 0.22 - 0.8;
      crateRef.current.rotation.y = -time * 0.22;
      crateRef.current.rotation.z = Math.cos(time * 0.4) * 0.12;
      crateRef.current.rotation.x = Math.sin(time * 0.2) * 0.08;
    }

    // 3. Tag floating and rotating
    if (tagRef.current) {
      tagRef.current.position.y = Math.sin(time * 0.85 + 4) * 0.2 + 0.9;
      tagRef.current.rotation.x = time * 0.35;
      tagRef.current.rotation.z = time * 0.25;
      tagRef.current.rotation.y = Math.sin(time * 0.5) * 0.15;
    }

    // 4. Chair silhouette floating and rotating
    if (chairRef.current) {
      chairRef.current.position.y = Math.sin(time * 0.55 + 1) * 0.16 - 0.7;
      chairRef.current.rotation.y = time * 0.12;
      chairRef.current.rotation.x = Math.cos(time * 0.25) * 0.12;
      chairRef.current.rotation.z = Math.sin(time * 0.3) * 0.06;
    }

    // Interactive pointer movement response
    if (groupRef.current) {
      const targetX = state.pointer.x * 0.35;
      const targetY = state.pointer.y * 0.35;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stylized Laptop Mesh (with high-end metallic/glossy materials) */}
      <group ref={laptopRef} position={[-1.3, 0.5, 0]} scale={0.85}>
        {/* Base */}
        <mesh>
          <boxGeometry args={[1.6, 0.07, 1.1]} />
          <meshPhysicalMaterial 
            color="#4f46e5" 
            roughness={0.15} 
            metalness={0.85} 
            clearcoat={1.0} 
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Screen hinge connector */}
        <mesh position={[0, 0.04, -0.52]}>
          <cylinderGeometry args={[0.03, 0.03, 1.3, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#312e81" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.48, -0.53]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[1.6, 0.95, 0.05]} />
          <meshPhysicalMaterial 
            color="#312e81" 
            roughness={0.2} 
            metalness={0.9} 
            clearcoat={1.0}
          />
        </mesh>
        {/* Screen Glow Content */}
        <mesh position={[0, 0.48, -0.5]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[1.48, 0.83, 0.01]} />
          <meshPhysicalMaterial 
            color="#a5b4fc" 
            emissive="#6366f1" 
            emissiveIntensity={1.2} 
            roughness={0.05} 
            clearcoat={1.0}
          />
        </mesh>
      </group>

      {/* Stylized Crate Mesh */}
      <group ref={crateRef} position={[1.4, -0.8, -0.4]} scale={1.05}>
        <mesh>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshPhysicalMaterial 
            color="#f59e0b" 
            roughness={0.3} 
            metalness={0.2} 
            clearcoat={0.8}
          />
        </mesh>
        {/* Metallic diagonal bracket detailing */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.94, 0.15, 0.94]} />
          <meshPhysicalMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.94, 0.15, 0.94]} />
          <meshPhysicalMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.94, 0.94, 0.15]} />
          <meshPhysicalMaterial color="#b45309" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Stylized Ring/Tag Mesh */}
      <group ref={tagRef} position={[1.2, 0.9, 0.5]} scale={0.72}>
        <mesh>
          <torusGeometry args={[0.55, 0.16, 16, 64]} />
          <meshPhysicalMaterial 
            color="#10b981" 
            roughness={0.05} 
            metalness={0.9} 
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.12, 24]} />
          <meshPhysicalMaterial 
            color="#059669" 
            roughness={0.1} 
            metalness={0.85}
            emissive="#10b981"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>

      {/* Stylized Chair Silhouette */}
      <group ref={chairRef} position={[-1.4, -0.7, 0.7]} scale={0.8}>
        {/* Seat Cushion */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.85, 0.12, 0.85]} />
          <meshPhysicalMaterial 
            color="#ec4899" 
            roughness={0.4} 
            clearcoat={0.5} 
          />
        </mesh>
        {/* Backrest support spine */}
        <mesh position={[0, 0.25, -0.42]}>
          <boxGeometry args={[0.15, 0.6, 0.06]} />
          <meshPhysicalMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Backrest Cushion */}
        <mesh position={[0, 0.55, -0.42]}>
          <boxGeometry args={[0.85, 0.55, 0.1]} />
          <meshPhysicalMaterial 
            color="#db2777" 
            roughness={0.4} 
            clearcoat={0.5}
          />
        </mesh>
        {/* Hydraulic Cylinder */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 16]} />
          <meshPhysicalMaterial color="#e5e7eb" metalness={0.95} roughness={0.05} />
        </mesh>
        {/* Legs Base */}
        <mesh position={[0, -0.7, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.85, 0.06, 0.12]} />
          <meshPhysicalMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.7, 0]} rotation={[0, -Math.PI / 4, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.85]} />
          <meshPhysicalMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className={styles.canvasContainer}>
      <Suspense fallback={
        <div className={styles.loader}>
          <span className={styles.spinner} />
          Loading interactive 3D assets...
        </div>
      }>
        <Canvas
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          camera={{ position: [0, 0, 4.2], fov: 50 }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 15, 10]} intensity={3.5} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={1.5} color="#4f46e5" />
          <pointLight position={[5, -5, 5]} intensity={2.0} color="#06b6d4" />
          <pointLight position={[-5, 5, 3]} intensity={2.0} color="#d946ef" />
          
          <FloatingAssets />
          <Particles count={90} />
        </Canvas>
      </Suspense>
    </div>
  );
}
