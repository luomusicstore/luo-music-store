"use client"

import { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text3D, Center, Float } from "@react-three/drei"
import * as THREE from "three"

function MusicNote() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Continuous rotation
      meshRef.current.rotation.y += 0.01
      // Floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
      // Scale on hover
      const targetScale = hovered ? 1.2 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
  })

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          {/* Music note shape */}
          <group>
            {/* Note head (circle) */}
            <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
              <sphereGeometry args={[0.25, 32, 32]} />
              <meshStandardMaterial
                color="#8b5cf6"
                metalness={0.8}
                roughness={0.2}
                emissive="#8b5cf6"
                emissiveIntensity={0.5}
              />
            </mesh>
            {/* Note stem */}
            <mesh position={[0.2, 0.1, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
              <meshStandardMaterial
                color="#6366f1"
                metalness={0.9}
                roughness={0.1}
                emissive="#6366f1"
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Note flag */}
            <mesh position={[0.35, 0.4, 0]} rotation={[0, 0, -0.5]}>
              <boxGeometry args={[0.3, 0.15, 0.05]} />
              <meshStandardMaterial
                color="#3b82f6"
                metalness={0.7}
                roughness={0.3}
                emissive="#3b82f6"
                emissiveIntensity={0.4}
              />
            </mesh>
          </group>
        </mesh>
      </Float>
    </group>
  )
}

function AnimatedText() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
      // Color shift
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      if (material) {
        const hue = (state.clock.elapsedTime * 0.1) % 1
        material.emissive.setHSL(hue, 0.8, 0.3)
      }
    }
  })

  return (
    <Center>
      <Text3D
        ref={meshRef}
        font="/fonts/Inter_Bold.json"
        size={0.5}
        height={0.2}
        curveSegments={32}
        bevelEnabled
        bevelThickness={0.03}
        bevelSize={0.03}
        bevelOffset={0}
        bevelSegments={10}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        Luo Music Store
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.9}
          roughness={0.1}
          emissive="#3b82f6"
          emissiveIntensity={hovered ? 0.8 : 0.4}
        />
      </Text3D>
    </Center>
  )
}

export function AnimatedLogo() {
  return (
    <div className="w-80 h-20 relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        className="bg-transparent"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color="#3b82f6" />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} color="#8b5cf6" />

        <group position={[-2.5, 0, 0]}>
          <MusicNote />
        </group>

        <group position={[0.5, 0, 0]}>
          <AnimatedText />
        </group>
      </Canvas>
    </div>
  )
}
