import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface Robot3DProps {
  onInteraction?: () => void;
  animated?: boolean;
}

const Robot3D: React.FC<Robot3DProps> = ({ onInteraction, animated = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isWaving, setIsWaving] = useState(false);

  // Animation
  useFrame((state, delta) => {
    if (groupRef.current && animated) {
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Head look around
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      }
    }
  });

  const handleClick = () => {
    if (onInteraction) {
      onInteraction();
    }
    
    // Wave animation
    setIsWaving(true);
    if (groupRef.current) {
      gsap.to(groupRef.current.rotation, {
        z: 0.3,
        duration: 0.3,
        yoyo: true,
        repeat: 3,
        onComplete: () => setIsWaving(false)
      });
    }
  };

  return (
    <group 
      ref={groupRef}
      onClick={handleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      scale={isHovered ? 1.1 : 1}
    >
      {/* Robot Body */}
      <Box
        args={[0.8, 1.2, 0.6]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color={isHovered ? "#4f46e5" : "#6366f1"}
          metalness={0.7}
          roughness={0.3}
        />
      </Box>

      {/* Robot Head */}
      <Box
        ref={headRef}
        args={[0.6, 0.6, 0.6]}
        position={[0, 0.9, 0]}
      >
        <meshStandardMaterial 
          color={isHovered ? "#3730a3" : "#4338ca"}
          metalness={0.8}
          roughness={0.2}
        />
      </Box>

      {/* Eyes */}
      <Sphere
        args={[0.08]}
        position={[-0.15, 0.95, 0.25]}
      >
        <meshEmissiveMaterial 
          color={isWaving ? "#00ff00" : "#00ffff"}
          emissive={isWaving ? "#00ff00" : "#00ffff"}
          emissiveIntensity={0.5}
        />
      </Sphere>
      <Sphere
        args={[0.08]}
        position={[0.15, 0.95, 0.25]}
      >
        <meshEmissiveMaterial 
          color={isWaving ? "#00ff00" : "#00ffff"}
          emissive={isWaving ? "#00ff00" : "#00ffff"}
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Arms */}
      <Box
        args={[0.2, 0.8, 0.2]}
        position={[-0.6, 0.2, 0]}
        rotation={[0, 0, isWaving ? -0.5 : 0]}
      >
        <meshStandardMaterial 
          color="#5b21b6"
          metalness={0.6}
          roughness={0.4}
        />
      </Box>
      <Box
        args={[0.2, 0.8, 0.2]}
        position={[0.6, 0.2, 0]}
        rotation={[0, 0, isWaving ? 0.5 : 0]}
      >
        <meshStandardMaterial 
          color="#5b21b6"
          metalness={0.6}
          roughness={0.4}
        />
      </Box>

      {/* Legs */}
      <Box
        args={[0.25, 1, 0.25]}
        position={[-0.25, -1.1, 0]}
      >
        <meshStandardMaterial 
          color="#6d28d9"
          metalness={0.5}
          roughness={0.5}
        />
      </Box>
      <Box
        args={[0.25, 1, 0.25]}
        position={[0.25, -1.1, 0]}
      >
        <meshStandardMaterial 
          color="#6d28d9"
          metalness={0.5}
          roughness={0.5}
        />
      </Box>

      {/* Interactive Text */}
      {isHovered && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Click to Sign In!
        </Text>
      )}

      {/* Ambient lighting for the robot */}
      <pointLight 
        position={[0, 1, 1]} 
        intensity={0.5} 
        color="#4f46e5"
      />
    </group>
  );
};

export default Robot3D;