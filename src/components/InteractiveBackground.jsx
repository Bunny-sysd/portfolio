import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export const triggerParticleBurst = () => {
  window.dispatchEvent(new Event('particle-burst'));
};

// 1. 3D Wireframe Dome Mesh Component (Grand Glowing Geometry)
function WireframeDome({ position, geometryType, color, scale = 1, rotationSpeed = 0.5 }) {
  const meshRef = useRef();
  const innerMeshRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed * 0.5;
      meshRef.current.rotation.x += delta * rotationSpeed * 0.25;
    }
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y -= delta * rotationSpeed * 0.8;
      innerMeshRef.current.rotation.z += delta * rotationSpeed * 0.4;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * rotationSpeed * 0.7;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x -= delta * rotationSpeed * 0.6;
    }
  });

  const renderGeometry = () => {
    switch (geometryType) {
      case 'icosahedron':
        return <icosahedronGeometry args={[3.2, 2]} />;
      case 'octahedron':
        return <octahedronGeometry args={[3.5, 1]} />;
      case 'torusKnot':
        return <torusKnotGeometry args={[2.5, 0.7, 64, 16]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[3.4, 0]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[3.8, 1]} />;
      default:
        return <icosahedronGeometry args={[3.2, 2]} />;
    }
  };

  return (
    <group position={position} scale={scale}>
      {/* Outer 3D Wireframe Dome */}
      <mesh ref={meshRef}>
        {renderGeometry()}
        <meshStandardMaterial
          color={color}
          wireframe
          emissive={color}
          emissiveIntensity={2.8}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Inner Glowing Core Mesh */}
      <mesh ref={innerMeshRef} scale={0.55}>
        {renderGeometry()}
        <meshStandardMaterial
          color={color === '#00ff41' ? '#00d4ff' : '#00ff41'}
          wireframe
          emissive={color === '#00ff41' ? '#00d4ff' : '#00ff41'}
          emissiveIntensity={3.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Orbiting Ring 1 */}
      <mesh ref={ringRef1} rotation={[Math.PI / 4, 0, 0]}>
        <ringGeometry args={[4.5, 4.65, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3.0}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbiting Ring 2 */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <ringGeometry args={[5.4, 5.55, 64]} />
        <meshStandardMaterial
          color={color === '#00ff41' ? '#00d4ff' : '#00ff41'}
          emissive={color === '#00ff41' ? '#00d4ff' : '#00ff41'}
          emissiveIntensity={2.5}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// 2. 5 Grand 3D Domes Placed Along Z-Axis Flight Path
function DomesScenery({ isMobile }) {
  const domes = useMemo(() => [
    { z: 0, type: 'icosahedron', color: '#00ff41', scale: isMobile ? 1.0 : 1.75 },
    { z: -18, type: 'octahedron', color: '#00d4ff', scale: isMobile ? 0.95 : 1.65 },
    { z: -36, type: 'torusKnot', color: '#00ff41', scale: isMobile ? 0.9 : 1.55 },
    { z: -54, type: 'dodecahedron', color: '#00d4ff', scale: isMobile ? 1.0 : 1.7 },
    { z: -72, type: 'tetrahedron', color: '#00ff41', scale: isMobile ? 1.05 : 1.8 },
  ], [isMobile]);

  const xPos = isMobile ? 0 : 1.2;

  return (
    <group position={[xPos, 0, 0]}>
      {domes.map((dome, idx) => (
        <WireframeDome
          key={idx}
          position={[0, 0, dome.z]}
          geometryType={dome.type}
          color={dome.color}
          scale={dome.scale}
          rotationSpeed={0.5 + idx * 0.12}
        />
      ))}
    </group>
  );
}

// 3. Scroll Camera Flight Rig
function ScrollCameraRig() {
  const { camera } = useThree();

  useFrame(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    // Fly camera from Z = 12 down to Z = -75 along the 3D Domes path
    const targetZ = 12 - scrollProgress * 87;
    const targetY = Math.sin(scrollProgress * Math.PI * 4) * 1.5;

    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;
  });

  return null;
}

// 4. Post Processing Pipeline (High-Glow Bloom)
function CinematicEffects() {
  return (
    <EffectComposer disableNormalPass>
      <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.8} />
      <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.002, 0.002]} />
      <Noise opacity={0.02} />
    </EffectComposer>
  );
}

export default function InteractiveBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: isMobile ? 75 : 60 }}
        dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        eventSource={document.body}
        eventPrefix="client"
      >
        <color attach="background" args={['#04060b']} />
        <fog attach="fog" args={['#04060b', 15, 60]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={3.0} color="#00ff41" />
        <pointLight position={[-10, -10, -10]} intensity={2.0} color="#00d4ff" />

        <ScrollCameraRig />
        <DomesScenery isMobile={isMobile} />
        <Stars radius={70} depth={60} count={5000} factor={5} saturation={1} fade speed={2.0} />

        <Suspense fallback={null}>
          <CinematicEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}
