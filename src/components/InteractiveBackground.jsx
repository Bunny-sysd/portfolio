import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export const triggerParticleBurst = () => {
  window.dispatchEvent(new Event('particle-burst'));
};

// 1. Quantum Mutagen Magnetic Confinement Reactor Core
function MutagenReactorCore({ isMobile }) {
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.8;
      coreRef.current.rotation.x += delta * 0.4;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 1.1;
    if (ring2Ref.current) ring2Ref.current.rotation.x -= delta * 0.9;
    if (ring3Ref.current) ring3Ref.current.rotation.y += delta * 1.0;
  });

  const scale = isMobile ? 1.4 : 2.2;

  return (
    <group position={[0, -18, -52]}>
      {/* Central Pulsating Plasma Singularity */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[scale * 0.9, 2]} />
        <meshStandardMaterial
          color="#00ff66"
          emissive="#00ff66"
          emissiveIntensity={3.5}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Counter-Rotating Magnetic Confinement Torus Rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[scale * 1.8, 0.06, 12, 48]} />
        <meshStandardMaterial color="#00ff66" emissive="#00ff66" emissiveIntensity={2.8} wireframe />
      </mesh>

      <mesh ref={ring2Ref} rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[scale * 2.2, 0.05, 12, 48]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={3.0} wireframe />
      </mesh>

      <mesh ref={ring3Ref} rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[scale * 2.6, 0.04, 12, 48]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} wireframe />
      </mesh>
    </group>
  );
}

// 2. Flanking Cyber Monoliths & Laser Highway Rails
function CyberCityMonoliths({ isMobile }) {
  const towers = useMemo(() => [
    { x: -7.5, y: -4, z: -8,   w: 2.2, h: 14, d: 2.2 },
    { x:  7.5, y: -3, z: -10,  w: 2.4, h: 16, d: 2.4 },
    { x: -8.0, y: -10, z: -24, w: 2.8, h: 18, d: 2.8 },
    { x:  8.2, y: -11, z: -26, w: 3.0, h: 20, d: 3.0 },
    { x: -7.8, y: -22, z: -62, w: 2.6, h: 19, d: 2.6 },
    { x:  8.0, y: -23, z: -64, w: 2.8, h: 21, d: 2.8 },
  ], []);

  const railX = isMobile ? 6.5 : 11.5;

  return (
    <group>
      {/* Server Monoliths */}
      {towers.map((t, idx) => (
        <group key={idx} position={[t.x, t.y, t.z]}>
          <mesh>
            <boxGeometry args={[t.w, t.h, t.d]} />
            <meshStandardMaterial color="#030712" roughness={0.9} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(t.w, t.h, t.d)]} />
            <lineBasicMaterial color="#00ff66" transparent opacity={0.35} />
          </lineSegments>
        </group>
      ))}

      {/* Volumetric Dual Laser Highway Rails */}
      <mesh position={[-railX, -18, -45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 220, 8, 1, true]} />
        <meshBasicMaterial color="#00ff66" transparent opacity={0.8} />
      </mesh>
      <mesh position={[railX, -18, -45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 220, 8, 1, true]} />
        <meshBasicMaterial color="#00ff66" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// 3. 6-DOF Smooth Camera Flight
function ScrollCameraRig() {
  const { camera } = useThree();

  useFrame(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    const targetZ = 2.0 - scrollProgress * 92.0;
    const targetY = 2.0 - scrollProgress * 32.0;
    const targetX = Math.sin(scrollProgress * Math.PI * 3) * 2.2;

    camera.position.x += (targetX - camera.position.x) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;
    camera.position.z += (targetZ - camera.position.z) * 0.08;

    camera.lookAt(0, targetY - 2.0, targetZ - 14.0);
  });

  return null;
}

// 4. Post-Processing Pipeline
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
        camera={{ position: [2.2, 2.0, 2.0], fov: isMobile ? 75 : 60 }}
        dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 1.35)}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#02040a']} />
        <fog attach="fog" args={['#02040a', 15, 85]} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={3.5} color="#00ff66" />
        <pointLight position={[-10, -10, -10]} intensity={2.0} color="#00d4ff" />

        <ScrollCameraRig />
        <CyberCityMonoliths isMobile={isMobile} />
        <MutagenReactorCore isMobile={isMobile} />
        <Stars radius={90} depth={80} count={6000} factor={6} saturation={1} fade speed={2.5} />

        <Suspense fallback={null}>
          <CinematicEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}
