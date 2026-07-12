import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Hero3D.module.css';

// Rich floating starfield/particle cloud
function ParticleField({ count = 180 }) {
  const pointsRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.01;
      pointsRef.current.rotation.x = time * 0.005;
    }
  });

  const [positions, sizes] = useMemo(() => {
    const posArr = [];
    const sizeArr = [];
    for (let i = 0; i < count; i++) {
      posArr.push((Math.random() - 0.5) * 12); // X
      posArr.push((Math.random() - 0.5) * 8);  // Y
      posArr.push((Math.random() - 0.5) * 8);  // Z
      sizeArr.push(Math.random() * 0.05 + 0.02);
    }
    return [new Float32Array(posArr), new Float32Array(sizeArr)];
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
        size={0.04}
        color="#a5b4fc"
        sizeAttenuation
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 1. Stylized Laptop Asset
function Laptop({ posRef }) {
  return (
    <group ref={posRef} scale={0.75}>
      {/* Base */}
      <mesh>
        <boxGeometry args={[1.6, 0.06, 1.1]} />
        <meshPhysicalMaterial 
          color="#6366f1" 
          roughness={0.1} 
          metalness={0.9} 
          clearcoat={1.0}
        />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.45, -0.52]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[1.6, 0.9, 0.04]} />
        <meshPhysicalMaterial 
          color="#312e81" 
          roughness={0.15} 
          metalness={0.9} 
          clearcoat={1.0}
        />
      </mesh>
      {/* Screen Glow */}
      <mesh position={[0, 0.45, -0.49]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[1.48, 0.8, 0.01]} />
        <meshPhysicalMaterial 
          color="#818cf8" 
          emissive="#6366f1" 
          emissiveIntensity={1.5} 
          roughness={0.05} 
          clearcoat={1.0}
        />
      </mesh>
    </group>
  );
}

// 2. Stylized Logistics Crate
function Crate({ posRef }) {
  return (
    <group ref={posRef} scale={0.95}>
      <mesh>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshPhysicalMaterial 
          color="#fbbf24" 
          roughness={0.2} 
          metalness={0.3} 
          clearcoat={0.8}
        />
      </mesh>
      {/* Metallic diagonal brackets */}
      <mesh>
        <boxGeometry args={[0.83, 0.12, 0.83]} />
        <meshPhysicalMaterial color="#d97706" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.83, 0.12, 0.83]} />
        <meshPhysicalMaterial color="#d97706" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// 3. Database Server Stack
function ServerStack({ posRef }) {
  return (
    <group ref={posRef} scale={0.85}>
      {/* Server 1 */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.22, 24]} />
        <meshPhysicalMaterial 
          color="#06b6d4" 
          roughness={0.1} 
          metalness={0.9} 
          clearcoat={1.0}
        />
      </mesh>
      {/* Light ring */}
      <mesh position={[0, 0.35, 0]} scale={[1.02, 1.02, 1.02]}>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 24]} />
        <meshPhysicalMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.2} />
      </mesh>

      {/* Server 2 */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.22, 24]} />
        <meshPhysicalMaterial 
          color="#0891b2" 
          roughness={0.1} 
          metalness={0.9} 
          clearcoat={1.0}
        />
      </mesh>
      {/* Light ring */}
      <mesh position={[0, 0, 0]} scale={[1.02, 1.02, 1.02]}>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 24]} />
        <meshPhysicalMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.2} />
      </mesh>

      {/* Server 3 */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.22, 24]} />
        <meshPhysicalMaterial 
          color="#0e7490" 
          roughness={0.1} 
          metalness={0.9} 
          clearcoat={1.0}
        />
      </mesh>
      {/* Light ring */}
      <mesh position={[0, -0.35, 0]} scale={[1.02, 1.02, 1.02]}>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 24]} />
        <meshPhysicalMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// 4. Asset Smart Tag
function SmartTag({ posRef }) {
  return (
    <group ref={posRef} scale={0.7}>
      <mesh>
        <torusGeometry args={[0.5, 0.14, 16, 48]} />
        <meshPhysicalMaterial 
          color="#10b981" 
          roughness={0.05} 
          metalness={0.9} 
          clearcoat={1.0}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
        <meshPhysicalMaterial color="#047857" metalness={0.8} emissive="#10b981" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// 5. Stylized Gear (Maintenance module representation)
function CogWheel({ posRef }) {
  return (
    <group ref={posRef} scale={0.65}>
      <mesh>
        <torusKnotGeometry args={[0.35, 0.1, 64, 8, 2, 3]} />
        <meshPhysicalMaterial 
          color="#d946ef" 
          roughness={0.1} 
          metalness={0.95} 
          clearcoat={1.0}
        />
      </mesh>
    </group>
  );
}

// 6. Barcode Badge Asset
function BarcodeBadge({ posRef }) {
  return (
    <group ref={posRef} scale={0.8}>
      <mesh>
        <boxGeometry args={[0.7, 0.35, 0.06]} />
        <meshPhysicalMaterial 
          color="#ec4899" 
          roughness={0.2} 
          metalness={0.8} 
          clearcoat={0.9}
        />
      </mesh>
      {/* Screen label / barcode stripes */}
      <mesh position={[0, 0, 0.032]}>
        <boxGeometry args={[0.55, 0.22, 0.005]} />
        <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// 7. Abstract Floating Geometries to populate background
function AbstractShape({ geometry, color, posRef }) {
  return (
    <mesh ref={posRef}>
      {geometry}
      <meshPhysicalMaterial 
        color={color} 
        roughness={0.2} 
        metalness={0.9} 
        clearcoat={0.6}
      />
    </mesh>
  );
}

// Main animator component inside Canvas
function FloatingAssets() {
  const groupRef = useRef();

  // Object references
  const laptopRef = useRef();
  const crateRef = useRef();
  const serverRef = useRef();
  const tagRef = useRef();
  const cogRef = useRef();
  const badgeRef = useRef();
  
  // Abstract shape references
  const shape1Ref = useRef();
  const shape2Ref = useRef();
  const shape3Ref = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Laptop (left-top)
    if (laptopRef.current) {
      laptopRef.current.position.y = Math.sin(time * 0.65) * 0.15 + 1.2;
      laptopRef.current.rotation.y = time * 0.12;
      laptopRef.current.rotation.x = Math.sin(time * 0.3) * 0.08;
    }

    // 2. Logistics Crate (right-bottom)
    if (crateRef.current) {
      crateRef.current.position.y = Math.sin(time * 0.55 + 1.5) * 0.18 - 1.2;
      crateRef.current.rotation.y = -time * 0.15;
      crateRef.current.rotation.z = Math.cos(time * 0.4) * 0.1;
    }

    // 3. Server Stack (right-middle)
    if (serverRef.current) {
      serverRef.current.position.y = Math.sin(time * 0.5 + 3.0) * 0.2 + 0.1;
      serverRef.current.rotation.y = time * 0.18;
      serverRef.current.rotation.x = Math.cos(time * 0.3) * 0.06;
    }

    // 4. Smart Tag (right-top)
    if (tagRef.current) {
      tagRef.current.position.y = Math.sin(time * 0.8 + 4.2) * 0.16 + 1.3;
      tagRef.current.rotation.x = time * 0.22;
      tagRef.current.rotation.z = time * 0.15;
    }

    // 5. Cog/Gear (left-middle-bottom)
    if (cogRef.current) {
      cogRef.current.position.y = Math.sin(time * 0.6 + 0.8) * 0.14 - 0.4;
      cogRef.current.rotation.y = -time * 0.1;
      cogRef.current.rotation.x = time * 0.15;
    }

    // 6. Barcode Badge (left-middle)
    if (badgeRef.current) {
      badgeRef.current.position.y = Math.sin(time * 0.72 + 2.1) * 0.15 + 0.3;
      badgeRef.current.rotation.y = time * 0.25;
      badgeRef.current.rotation.x = Math.sin(time * 0.4) * 0.12;
    }

    // 7. Abstract Shapes (small floating items)
    if (shape1Ref.current) {
      shape1Ref.current.position.y = Math.sin(time * 0.9 + 5.0) * 0.25 + 0.7;
      shape1Ref.current.rotation.x = time * 0.4;
    }
    if (shape2Ref.current) {
      shape2Ref.current.position.y = Math.sin(time * 0.85 + 2.5) * 0.22 - 1.1;
      shape2Ref.current.rotation.y = time * 0.3;
    }
    if (shape3Ref.current) {
      shape3Ref.current.position.y = Math.sin(time * 0.7 + 6.1) * 0.2 + 1.5;
      shape3Ref.current.rotation.z = -time * 0.25;
    }

    // Gentle global mouse parallax rotation
    if (groupRef.current) {
      const targetX = state.pointer.x * 0.25;
      const targetY = state.pointer.y * 0.25;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.x * 0.1, targetX, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <Laptop posRef={laptopRef} />
      <Crate posRef={crateRef} />
      <ServerStack posRef={serverRef} />
      <SmartTag posRef={tagRef} />
      <CogWheel posRef={cogRef} />
      <BarcodeBadge posRef={badgeRef} />

      {/* Abstract scattered meshes */}
      <AbstractShape 
        geometry={useMemo(() => new THREE.OctahedronGeometry(0.2), [])} 
        color="#f43f5e" 
        posRef={shape1Ref} 
      />
      <AbstractShape 
        geometry={useMemo(() => new THREE.DodecahedronGeometry(0.18), [])} 
        color="#38bdf8" 
        posRef={shape2Ref} 
      />
      <AbstractShape 
        geometry={useMemo(() => new THREE.ConeGeometry(0.15, 0.3, 4), [])} 
        color="#fbbf24" 
        posRef={shape3Ref} 
      />
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className={styles.canvasContainer}>
      <Suspense fallback={null}>
        <Canvas
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 60 }}
        >
          {/* Lighting Rig */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 15, 10]} intensity={3.0} />
          <directionalLight position={[-10, 10, -10]} intensity={1.5} color="#4f46e5" />
          <pointLight position={[6, -6, 5]} intensity={2.5} color="#06b6d4" />
          <pointLight position={[-6, 6, 4]} intensity={2.5} color="#d946ef" />
          <pointLight position={[0, 0, 8]} intensity={1.5} color="#818cf8" />
          
          {/* Positioning objects in 3D space across left and right clusters */}
          <group position={[0, 0, 0]}>
            {/* Left Cluster */}
            <group position={[-2.4, 0, 0]}>
              <Laptop posRef={useRef()} />
            </group>
            
            {/* Right Cluster */}
            <group position={[2.4, 0, 0]}>
              <ServerStack posRef={useRef()} />
            </group>

            {/* Float everything */}
            <FloatingAssets />
          </group>

          <ParticleField count={180} />
        </Canvas>
      </Suspense>
    </div>
  );
}
