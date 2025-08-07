import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

interface DisasterPoint {
  position: [number, number, number];
  type: 'flood' | 'fire' | 'earthquake' | 'storm';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Earth3DProps {
  disasterPoints?: DisasterPoint[];
  autoRotate?: boolean;
}

const Earth3D: React.FC<Earth3DProps> = ({ disasterPoints = [], autoRotate = true }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Group>(null);

  // Load earth textures
  const [colorMap, normalMap, specularMap] = useLoader(TextureLoader, [
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-day.jpg',
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png',
  ]);

  // Animation
  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.1;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.1;
    }
  });

  // Convert lat/lng to 3D coordinates
  const latLngTo3D = (lat: number, lng: number, radius = 2.02) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return [x, y, z] as [number, number, number];
  };

  // Sample disaster points (you can replace with real data)
  const sampleDisasterPoints: DisasterPoint[] = [
    { position: latLngTo3D(40.7128, -74.0060), type: 'flood', severity: 'high' }, // New York
    { position: latLngTo3D(34.0522, -118.2437), type: 'fire', severity: 'critical' }, // Los Angeles
    { position: latLngTo3D(35.6762, 139.6503), type: 'earthquake', severity: 'medium' }, // Tokyo
    { position: latLngTo3D(-33.8688, 151.2093), type: 'storm', severity: 'low' }, // Sydney
  ];

  const activePoints = disasterPoints.length > 0 ? disasterPoints : sampleDisasterPoints;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffaa00';
      case 'low': return '#ffff00';
      default: return '#ffffff';
    }
  };

  return (
    <group>
      {/* Earth */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={100}
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh scale={[2.1, 2.1, 2.1]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#4dd0e1"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Disaster points */}
      <group ref={pointsRef}>
        {activePoints.map((point, index) => (
          <group key={index} position={point.position}>
            {/* Pulsing marker */}
            <mesh>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial 
                color={getSeverityColor(point.severity)}
                transparent
                opacity={0.8}
              />
            </mesh>
            
            {/* Ripple effect */}
            <mesh>
              <ringGeometry args={[0.1, 0.15, 16]} />
              <meshBasicMaterial
                color={getSeverityColor(point.severity)}
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Lighting */}
      <directionalLight 
        position={[5, 3, 5]} 
        intensity={1} 
        color="#ffffff"
      />
      <ambientLight intensity={0.3} />
    </group>
  );
};

export default Earth3D;