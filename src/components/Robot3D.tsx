import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const RobotMesh = () => {
  const robotRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (robotRef.current) {
      robotRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.2;
      robotRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
    if (eyeLeftRef.current && eyeRightRef.current) {
      const glowIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
      (eyeLeftRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity;
      (eyeRightRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity;
    }
  });

  return (
    <group ref={robotRef} position={[0, -1, 0]}>
      {/* Body */}
      <Box args={[1.2, 1.8, 0.8]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#2a3441" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* Head */}
      <Box ref={headRef} args={[1, 1, 1]} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
      </Box>
      
      {/* Eyes */}
      <Sphere ref={eyeLeftRef} args={[0.1]} position={[-0.25, 1.5, 0.45]}>
        <meshBasicMaterial color="#00aaff" transparent />
      </Sphere>
      <Sphere ref={eyeRightRef} args={[0.1]} position={[0.25, 1.5, 0.45]}>
        <meshBasicMaterial color="#00aaff" transparent />
      </Sphere>
      
      {/* Arms */}
      <Cylinder args={[0.15, 0.15, 1.5]} position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color="#2a3441" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 1.5]} position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color="#2a3441" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* Legs */}
      <Cylinder args={[0.2, 0.2, 1.5]} position={[-0.3, -1.5, 0]}>
        <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 1.5]} position={[0.3, -1.5, 0]}>
        <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
      </Cylinder>
      
      {/* Antenna */}
      <Cylinder args={[0.02, 0.02, 0.5]} position={[0, 2.2, 0]}>
        <meshStandardMaterial color="#00aaff" emissive="#004466" />
      </Cylinder>
      <Sphere args={[0.05]} position={[0, 2.5, 0]}>
        <meshBasicMaterial color="#00aaff" />
      </Sphere>
    </group>
  );
};

const Robot3D = () => {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[2, 4, 2]}
          intensity={1}
          color="#ffffff"
        />
        <pointLight position={[0, 2, 4]} intensity={0.8} color="#00aaff" />
        
        {/* Robot */}
        <RobotMesh />
      </Canvas>
    </div>
  );
};

export default Robot3D;