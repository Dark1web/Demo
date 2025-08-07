import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sphere, useTexture, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const EarthMesh = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  // Load Earth textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=2048&q=80', // Earth surface
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=2048&q=80', // Normal map placeholder
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=2048&q=80', // Specular map placeholder
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=2048&q=80', // Clouds
  ]);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <Sphere ref={earthRef} args={[2.5, 64, 64]} position={[0, 0, 0]}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={100}
          transparent
          opacity={0.95}
        />
      </Sphere>
      
      {/* Clouds */}
      <Sphere ref={cloudsRef} args={[2.52, 64, 64]} position={[0, 0, 0]}>
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </Sphere>
      
      {/* Atmosphere glow */}
      <Sphere args={[2.6, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#00aaff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

const Earth3D = () => {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 3, 5]}
          intensity={1}
          color="#ffffff"
        />
        <pointLight position={[-5, -3, -5]} intensity={0.5} color="#00aaff" />
        
        {/* Stars background */}
        <Stars
          radius={300}
          depth={60}
          count={20000}
          factor={7}
          saturation={0}
          fade
        />
        
        {/* Earth */}
        <EarthMesh />
      </Canvas>
    </div>
  );
};

export default Earth3D;