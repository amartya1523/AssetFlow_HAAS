import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Edges, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import styles from './Hero3D.module.css';

const CUBE_SIZE = 1;
const SPACING = 1.01; // Tighter gap between cubes so they look flush when resting
const OFFSET = CUBE_SIZE * SPACING;

// Global constants for the 2D sticker shapes
const stickerSize = CUBE_SIZE - 0.06; 
const stickerOffset = CUBE_SIZE / 2 + 0.005; 

const roundedRectShape = new THREE.Shape();
const _radius = 0.06;
const _width = stickerSize;
const _height = stickerSize;
const _x = -_width / 2;
const _y = -_height / 2;
roundedRectShape.moveTo(_x, _y + _radius);
roundedRectShape.lineTo(_x, _y + _height - _radius);
roundedRectShape.quadraticCurveTo(_x, _y + _height, _x + _radius, _y + _height);
roundedRectShape.lineTo(_x + _width - _radius, _y + _height);
roundedRectShape.quadraticCurveTo(_x + _width, _y + _height, _x + _width, _y + _height - _radius);
roundedRectShape.lineTo(_x + _width, _y + _radius);
roundedRectShape.quadraticCurveTo(_x + _width, _y, _x + _width - _radius, _y);
roundedRectShape.lineTo(_x + _radius, _y);
roundedRectShape.quadraticCurveTo(_x, _y, _x, _y + _radius);

// Helper component to render a face with a perfect 2D outline
const Sticker = ({ pos, rot, isOuter, isHovered }) => {
  const baseColor = isOuter ? '#FFFFFF' : '#E9D5FF';
  const finalColor = isHovered ? '#C0FF73' : baseColor;
  return (
    <mesh position={pos} rotation={rot}>
      <shapeGeometry args={[roundedRectShape]} />
      <meshBasicMaterial color={finalColor} />
      <Edges color="#171717" />
    </mesh>
  );
};

// Positions for a 3x3x3 grid
const initialPositions = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      initialPositions.push([x * OFFSET, y * OFFSET, z * OFFSET]);
    }
  }
}

const Cube = React.memo(function Cube({ position, cubeState, isHovered, setHoveredCubeIndex, index }) {
  // wrapperRef handles the stable position and scroll rotation
  const wrapperRef = useRef(null);
  // visualRef handles the dynamic bulging and scaling
  const visualRef = useRef(null);
  
  const [baseX, baseY, baseZ] = position;

  // Cache the local offset direction to move outwards from the center
  const localOffsetDir = useMemo(() => {
    const dir = new THREE.Vector3(baseX, baseY, baseZ);
    if (dir.lengthSq() > 0) dir.normalize();
    return dir;
  }, [baseX, baseY, baseZ]);

  useFrame((state) => {
    if (!wrapperRef.current || !visualRef.current) return;

    // 1. ROTATION LOGIC (Applied to wrapperRef)
    // Smoothly animate to target physical state (The Rubik's scramble)
    cubeState.currentPos.lerp(cubeState.targetPos, 0.1);
    cubeState.currentQuat.slerp(cubeState.targetQuat, 0.1);

    // Playful scroll-based twisting on top of the physical state
    const scrollY = window.scrollY;
    const maxScroll = window.innerHeight * 2; 
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

    // Phase 1: Massive 4x Rotation (0.0 to 0.7)
    const rotProgress = Math.min(1, progress / 0.7);
    const rotEase = rotProgress < 0.5 ? 4 * rotProgress * rotProgress * rotProgress : 1 - Math.pow(-2 * rotProgress + 2, 3) / 2;

    // Intro animation on first load (spin once)
    const introDuration = 1.6; // 1.6 seconds for a smooth intro spin
    const elapsedTime = state.clock.getElapsedTime();
    const introProgress = Math.min(1, elapsedTime / introDuration);
    const introEase = 1 - Math.pow(1 - introProgress, 3); // Cubic ease out
    const introRotY = (1 - introEase) * Math.PI * 2; // 360 degrees spin
    const introRotX = (1 - introEase) * Math.PI * 1.5; // Tumble spin

    const globalRotY = rotEase * Math.PI * 2 * 4 + introRotY; 
    const globalRotX = rotEase * Math.PI * 2 + introRotX; 

    let layerRotY = 0;
    if (cubeState.currentPos.y > 0.1) layerRotY = rotEase * Math.PI * 2;
    if (cubeState.currentPos.y < -0.1) layerRotY = -rotEase * Math.PI * 2;

    const scrollQuat = new THREE.Quaternion();
    const qGlobalY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), globalRotY);
    const qGlobalX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), globalRotX);
    const qLayer = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), layerRotY);
    
    scrollQuat.multiplyQuaternions(qGlobalY, qGlobalX).multiply(qLayer);

    let finalQuat = scrollQuat.clone().multiply(cubeState.currentQuat);
    let finalPos = cubeState.currentPos.clone().applyQuaternion(scrollQuat);

    // Phase 2: Break / Scatter Explosion (0.7 to 1.0)
    if (progress > 0.7) {
      const scatterProgress = (progress - 0.7) / 0.3;
      const scatterEase = 1 - Math.pow(1 - scatterProgress, 3);

      finalPos.lerp(cubeState.scatterPos, scatterEase);
      finalQuat.slerp(cubeState.scatterQuat, scatterEase);
    }

    wrapperRef.current.position.copy(finalPos);
    wrapperRef.current.quaternion.copy(finalQuat);

    // 2. EXPLODE / BULGE LOGIC (Applied LOCALLY to visualRef)
    let targetOffset = 0;
    let targetScale = 1.0;

    // Only apply the 3D bulge (zoom) effect when the cube is assembled (not scattering)
    if (progress <= 0.7) {
      if (isHovered) {
        targetOffset = 0.5;
        targetScale = 1.1;
      }
    }

    const targetLocalPos = localOffsetDir.clone().multiplyScalar(targetOffset);
    visualRef.current.position.lerp(targetLocalPos, 0.15);
    
    const currentScale = visualRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.15;
    visualRef.current.scale.set(newScale, newScale, newScale);
  });

  const isLeft = baseX < -0.1;
  const isRight = baseX > 0.1;
  const isBottom = baseY < -0.1;
  const isTop = baseY > 0.1;
  const isBack = baseZ < -0.1;
  const isFront = baseZ > 0.1;

  return (
    <group 
      ref={wrapperRef}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHoveredCubeIndex(index);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHoveredCubeIndex(null);
      }}
    >
      {/* Invisible hitbox to catch hover accurately */}
      <mesh>
        <boxGeometry args={[CUBE_SIZE * 1.1, CUBE_SIZE * 1.1, CUBE_SIZE * 1.1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={visualRef}>
        <RoundedBox args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} radius={0.08} smoothness={2}>
          <meshBasicMaterial color={isHovered ? '#C0FF73' : '#E9D5FF'} />
        </RoundedBox>

        <Sticker pos={[0, 0, stickerOffset]} rot={[0, 0, 0]} isOuter={isFront} isHovered={isHovered} />
        <Sticker pos={[0, 0, -stickerOffset]} rot={[0, Math.PI, 0]} isOuter={isBack} isHovered={isHovered} />
        <Sticker pos={[stickerOffset, 0, 0]} rot={[0, Math.PI/2, 0]} isOuter={isRight} isHovered={isHovered} />
        <Sticker pos={[-stickerOffset, 0, 0]} rot={[0, -Math.PI/2, 0]} isOuter={isLeft} isHovered={isHovered} />
        <Sticker pos={[0, stickerOffset, 0]} rot={[-Math.PI/2, 0, 0]} isOuter={isTop} isHovered={isHovered} />
        <Sticker pos={[0, -stickerOffset, 0]} rot={[Math.PI/2, 0, 0]} isOuter={isBottom} isHovered={isHovered} />
      </group>
    </group>
  );
});

// Interactive floating firefly light particles drifting upward across the screen
function FloatingLights({ count = 80 }) {
  const pointsRef = useRef();

  const [positions, driftVelocities] = useMemo(() => {
    const pos = [];
    const vels = [];
    for (let i = 0; i < count; i++) {
      pos.push((Math.random() - 0.5) * 8); // X
      pos.push((Math.random() - 0.5) * 6); // Y
      pos.push((Math.random() - 0.5) * 5); // Z
      vels.push(0.003 + Math.random() * 0.005); // Upward velocity
    }
    return [new Float32Array(pos), new Float32Array(vels)];
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      const positionAttribute = pointsRef.current.geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        let x = positionAttribute.getX(i);
        let y = positionAttribute.getY(i);
        y += driftVelocities[i];
        if (y > 3) {
          y = -3;
        }
        x += Math.sin(time * 0.5 + i) * 0.0025;
        positionAttribute.setX(i, x);
        positionAttribute.setY(i, y);
      }
      positionAttribute.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color="#818cf8"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Hero3D() {
  const [containerHovered, setContainerHovered] = useState(false);
  const [hoveredCubeIndex, setHoveredCubeIndex] = useState(null);
  const [scale, setScale] = useState(1.15);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setScale(0.72);
      } else if (window.innerWidth < 768) {
        setScale(0.92);
      } else {
        setScale(1.15);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Create a stable ref for the physical state of all 27 cubes
  const cubeStates = useRef(
    initialPositions.map(pos => {
      const scatterOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 20
      );
      if (scatterOffset.lengthSq() < 36) scatterOffset.setLength(6 + Math.random() * 5);
      
      const scatterQuat = new THREE.Quaternion().random();

      return {
        currentPos: new THREE.Vector3(...pos),
        targetPos: new THREE.Vector3(...pos),
        currentQuat: new THREE.Quaternion(),
        targetQuat: new THREE.Quaternion(),
        scatterPos: new THREE.Vector3(...pos).add(scatterOffset),
        scatterQuat: scatterQuat,
      };
    })
  );
  const isAnimating = useRef(false);

  useEffect(() => {
    // Auto-solve random scrambler sequence
    const interval = setInterval(() => {
      if (containerHovered) return;
      if (isAnimating.current) return;
      
      const axes = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];
      const axisIdx = Math.floor(Math.random() * 3);
      const axis = axes[axisIdx];
      
      const sliceVals = [-OFFSET, 0, OFFSET];
      const sliceVal = sliceVals[Math.floor(Math.random() * 3)];
      
      const angle = (Math.random() > 0.5 ? 1 : -1) * Math.PI / 2;
      const rotQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      
      isAnimating.current = true;
      
      const snap = (val) => Math.round(val / OFFSET) * OFFSET;

      cubeStates.current.forEach(state => {
        // Check if this cube is in the rotating slice based on its CURRENT target position
        const val = axisIdx === 0 ? state.targetPos.x : (axisIdx === 1 ? state.targetPos.y : state.targetPos.z);
        if (Math.abs(val - sliceVal) < 0.1) {
          // Rotate position around origin
          state.targetPos.applyQuaternion(rotQuat);
          state.targetPos.x = snap(state.targetPos.x);
          state.targetPos.y = snap(state.targetPos.y);
          state.targetPos.z = snap(state.targetPos.z);
          
          // Rotate quaternion (prepend rotation)
          const newQuat = rotQuat.clone().multiply(state.targetQuat);
          state.targetQuat.copy(newQuat);
        }
      });
      
      // Allow next move after 800ms
      setTimeout(() => {
        isAnimating.current = false;
      }, 800);
      
    }, 1500); // Trigger a move every 1.5 seconds
    
    return () => clearInterval(interval);
  }, [containerHovered]);

  useEffect(() => {
    if (!containerHovered) {
      setHoveredCubeIndex(null);
    }
  }, [containerHovered]);

  const handleSetHoveredCubeIndex = useCallback((idx) => {
    setHoveredCubeIndex(idx);
  }, []);

  return (
    <div 
      className={styles.canvasContainer}
      onPointerEnter={() => setContainerHovered(true)}
      onPointerLeave={() => setContainerHovered(false)}
    >
      <Canvas camera={{ position: [5.0, 4.0, 6.0], fov: 45 }}>
        {/* Ambient studio glow */}
        <ambientLight intensity={1.4} />
        
        {/* Soft key directional and spot lighting rigs */}
        <directionalLight position={[8, 12, 8]} intensity={1.6} />
        <directionalLight position={[-8, -10, -8]} intensity={0.8} color="#818cf8" />
        <pointLight position={[0, 3, 4]} intensity={1.2} color="#ffffff" />

        <PresentationControls
          global
          snap
          cursor={false}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          {/* Centered within canvas container, scale is responsive to screen size */}
          <group scale={scale} position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
            {/* The 27 cubes */}
            {initialPositions.map((pos, i) => (
              <Cube 
                key={i} 
                index={i}
                position={pos} 
                cubeState={cubeStates.current[i]}
                isHovered={hoveredCubeIndex === i}
                setHoveredCubeIndex={handleSetHoveredCubeIndex}
              />
            ))}
          </group>
        </PresentationControls>

        {/* Floating background lights */}
        <FloatingLights count={85} />
      </Canvas>

      <div 
        className={`${styles.hintContainer} ${containerHovered ? styles.hiddenHint : ''}`}
        style={{ opacity: containerHovered ? 0 : 1 }}
      >
        <div className={styles.hintContainerInner}>
          <span className={styles.hintText}>Hover to play</span>
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" className={styles.arrowSvg}>
            <path d="M80 10 C80 60, 50 80, 10 90" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M10 90 L30 85 M10 90 L20 70" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
