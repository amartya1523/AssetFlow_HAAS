import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Hero3D.module.css';

// 3D Topological Wavy Terrain
function WavyTerrain() {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      const positionAttribute = meshRef.current.geometry.attributes.position;
      const vertex = new THREE.Vector3();
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        // Create organic wind-like terrain waving using overlapping sine and cosine waves
        const z = Math.sin(vertex.x * 0.35 + time * 0.45) * 0.45 + 
                  Math.cos(vertex.y * 0.28 + time * 0.55) * 0.35 +
                  Math.sin((vertex.x + vertex.y) * 0.15 + time * 0.25) * 0.25;
        positionAttribute.setZ(i, z);
      }
      positionAttribute.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2.3, 0, 0]} 
      position={[0, -1.0, -0.5]}
    >
      <planeGeometry args={[20, 14, 36, 36]} />
      <meshPhysicalMaterial 
        color="#f5f2eb" // Matte soft cream to match the warm off-white luxury theme
        roughness={0.7}
        metalness={0.05}
        clearcoat={0.15}
        clearcoatRoughness={0.2}
        flatShading={false}
      />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div className={styles.canvasContainer}>
      <Suspense fallback={null}>
        <Canvas
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          camera={{ position: [0, 0, 3.8], fov: 60 }}
        >
          <ambientLight intensity={1.6} />
          {/* Angular directional light to cast soft shadows in the topological valleys */}
          <directionalLight position={[5, 12, 6]} intensity={3.0} />
          <directionalLight position={[-5, 8, -3]} intensity={1.2} color="#fbf8f3" />
          <pointLight position={[0, -2, 4]} intensity={1.8} color="#ffffff" />
          
          <WavyTerrain />
        </Canvas>
      </Suspense>
    </div>
  );
}
