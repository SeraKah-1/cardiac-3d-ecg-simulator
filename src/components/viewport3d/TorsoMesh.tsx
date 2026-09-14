import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createXRaySkinMaterial } from './XRaySkinMaterial';
import { useSimulationStore } from '../../store/useSimulationStore';

export interface TorsoMeshProps {
  onTorsoReady?: (mesh: THREE.Mesh) => void;
}

// Dummy raycast to ensure raycasters completely ignore internal skeletal meshes
const noopRaycast = () => {};

/**
 * 3D Human Torso Shell with Modular Skeletal Landmark Rig & X-Ray Fresnel Shader.
 * Features anatomically distinct ribs 1 to 12, manubrium sterni, Angle of Louis,
 * corpus sterni, xiphoid process, costal cartilages, and clavicles.
 * Raycasting layer cleanly isolates the outer skin shell for electrode snapping.
 */
export const TorsoMesh: React.FC<TorsoMeshProps> = ({ onTorsoReady }) => {
  const torsoOpacity = useSimulationStore((s) => s.torsoOpacity);
  const skinMeshRef = useRef<THREE.Mesh>(null);

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const xrayMaterial = useMemo(() => createXRaySkinMaterial(), []);

  useEffect(() => {
    if (materialRef.current?.uniforms?.uOpacityMultiplier) {
      materialRef.current.uniforms.uOpacityMultiplier.value = torsoOpacity;
    }
  }, [torsoOpacity]);

  useEffect(() => {
    if (skinMeshRef.current && onTorsoReady) {
      // Exclusively register the outer skin mesh for electrode raycast snapping
      onTorsoReady(skinMeshRef.current);
    }
  }, [onTorsoReady]);

  // Construct an anatomically proportioned human thorax surface
  const torsoGeometry = useMemo(() => {
    const geom = new THREE.CylinderGeometry(
      0.18, // Top radius (shoulders/upper chest)
      0.14, // Bottom radius (waist)
      0.58, // Height
      48,   // Radial segments
      32,   // Height segments
      true  // Open ended
    );

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Wider laterally (human chest cross-section)
      x *= 1.25;

      // Sternal midline depression
      const isAnterior = z > 0;
      if (isAnterior && Math.abs(x) < 0.05) {
        z -= 0.015 * Math.cos((x / 0.05) * (Math.PI / 2));
      }

      // Pectoral / Chest projection around 4th-5th intercostal level
      if (isAnterior && y > -0.06 && y < 0.15) {
        const pecFactor = Math.sin(((y + 0.06) / 0.21) * Math.PI);
        if (Math.abs(x) > 0.03 && Math.abs(x) < 0.16) {
          z += 0.022 * pecFactor;
        }
      }

      pos.setXYZ(i, x, y, z);
    }

    geom.computeVertexNormals();
    return geom;
  }, []);

  // Internal Skeletal Ribs 1 to 12 Landmarks with Distinct Anatomical Curvatures
  const ribs = useMemo(() => {
    const ribData: Array<{
      id: number;
      y: number;
      r: number;
      span: number;
      rotX: number;
      isTrueRib: boolean;
    }> = [
      { id: 1,  y:  0.18, r: 0.138, span: Math.PI * 0.90, rotX: 0.12, isTrueRib: true  }, // Rib 1 (Subclavian)
      { id: 2,  y:  0.14, r: 0.162, span: Math.PI * 1.05, rotX: 0.11, isTrueRib: true  }, // Rib 2 (Angle of Louis)
      { id: 3,  y:  0.09, r: 0.174, span: Math.PI * 1.10, rotX: 0.10, isTrueRib: true  }, // Rib 3
      { id: 4,  y:  0.03, r: 0.180, span: Math.PI * 1.14, rotX: 0.09, isTrueRib: true  }, // Rib 4 (V1-V2 landmark)
      { id: 5,  y: -0.03, r: 0.176, span: Math.PI * 1.14, rotX: 0.08, isTrueRib: true  }, // Rib 5 (V4-V6 landmark)
      { id: 6,  y: -0.08, r: 0.170, span: Math.PI * 1.10, rotX: 0.07, isTrueRib: true  }, // Rib 6
      { id: 7,  y: -0.13, r: 0.160, span: Math.PI * 1.05, rotX: 0.06, isTrueRib: true  }, // Rib 7 (Costal margin)
      { id: 8,  y: -0.17, r: 0.150, span: Math.PI * 1.00, rotX: 0.05, isTrueRib: false }, // Rib 8 (False rib)
      { id: 9,  y: -0.21, r: 0.140, span: Math.PI * 0.95, rotX: 0.05, isTrueRib: false }, // Rib 9 (False rib)
      { id: 10, y: -0.24, r: 0.130, span: Math.PI * 0.88, rotX: 0.04, isTrueRib: false }, // Rib 10 (False rib)
      { id: 11, y: -0.26, r: 0.118, span: Math.PI * 0.74, rotX: 0.04, isTrueRib: false }, // Rib 11 (Floating)
      { id: 12, y: -0.28, r: 0.108, span: Math.PI * 0.62, rotX: 0.03, isTrueRib: false }, // Rib 12 (Floating)
    ];
    return ribData;
  }, []);

  // Costal Cartilages connecting anterior ends of ribs 1-7 to sternum
  const costalCartilages = useMemo(() => {
    const cartilages: Array<{ id: number; y: number; width: number; z: number }> = [
      { id: 1, y:  0.155, width: 0.055, z: 0.105 },
      { id: 2, y:  0.135, width: 0.065, z: 0.110 },
      { id: 3, y:  0.085, width: 0.072, z: 0.115 },
      { id: 4, y:  0.030, width: 0.078, z: 0.118 },
      { id: 5, y: -0.025, width: 0.080, z: 0.116 },
      { id: 6, y: -0.075, width: 0.078, z: 0.112 },
      { id: 7, y: -0.120, width: 0.075, z: 0.106 },
    ];
    return cartilages;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Outer Torso Skin (The ONLY mesh used for raycasting electrode snapping) */}
      <mesh
        ref={skinMeshRef}
        geometry={torsoGeometry}
        renderOrder={2}
      >
        <primitive object={xrayMaterial} attach="material" ref={materialRef} />
      </mesh>

      {/* 2. SKELETAL RIG: Light bone clinical materials (0xe2e8f0 / 0xcbd5e1) */}
      {/* Manubrium Sterni (Suprasternal notch & Angle of Louis landmark) */}
      <mesh
        position={[0, 0.142, 0.108]}
        renderOrder={1}
        raycast={noopRaycast}
      >
        <boxGeometry args={[0.048, 0.048, 0.009]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.55}
          metalness={0.08}
          transparent
          opacity={Math.max(0.35, torsoOpacity * 0.9)}
        />
      </mesh>

      {/* Angle of Louis (Manubriosternal junction - 2nd rib landmark) */}
      <mesh
        position={[0, 0.117, 0.112]}
        renderOrder={1}
        raycast={noopRaycast}
      >
        <boxGeometry args={[0.042, 0.006, 0.01]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.5}
          metalness={0.1}
          transparent
          opacity={Math.max(0.4, torsoOpacity * 0.95)}
        />
      </mesh>

      {/* Sternal Body (Mesosternum / Corpus Sterni) */}
      <mesh
        position={[0, 0.04, 0.115]}
        renderOrder={1}
        raycast={noopRaycast}
      >
        <boxGeometry args={[0.034, 0.145, 0.008]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.55}
          metalness={0.08}
          transparent
          opacity={Math.max(0.35, torsoOpacity * 0.9)}
        />
      </mesh>

      {/* Xiphoid Process (Processus Xiphoideus) */}
      <mesh
        position={[0, -0.048, 0.106]}
        renderOrder={1}
        raycast={noopRaycast}
      >
        <coneGeometry args={[0.012, 0.03, 16]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.55}
          metalness={0.08}
          transparent
          opacity={Math.max(0.35, torsoOpacity * 0.9)}
        />
      </mesh>

      {/* Clavicles (Right and Left Collar Bones) */}
      <mesh
        position={[-0.08, 0.17, 0.095]}
        rotation={[0, 0, -0.22]}
        renderOrder={1}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.007, 0.008, 0.14, 16]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.5}
          metalness={0.05}
          transparent
          opacity={Math.max(0.35, torsoOpacity * 0.9)}
        />
      </mesh>
      <mesh
        position={[0.08, 0.17, 0.095]}
        rotation={[0, 0, 0.22]}
        renderOrder={1}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.007, 0.008, 0.14, 16]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.5}
          metalness={0.05}
          transparent
          opacity={Math.max(0.35, torsoOpacity * 0.9)}
        />
      </mesh>

      {/* Costal Cartilages (Cartilago Costalis - Translucent Clinical Cartilage) */}
      {costalCartilages.map((cc) => (
        <group key={`cc-${cc.id}`} raycast={noopRaycast}>
          {/* Right Costal Cartilage */}
          <mesh
            position={[-cc.width / 2 - 0.015, cc.y, cc.z]}
            rotation={[0, 0, -0.08]}
            renderOrder={1}
            raycast={noopRaycast}
          >
            <cylinderGeometry args={[0.003, 0.0035, cc.width, 10]} />
            <meshStandardMaterial
              color="#e2e8f0"
              roughness={0.4}
              metalness={0.05}
              transparent
              opacity={Math.max(0.3, torsoOpacity * 0.85)}
            />
          </mesh>
          {/* Left Costal Cartilage */}
          <mesh
            position={[cc.width / 2 + 0.015, cc.y, cc.z]}
            rotation={[0, 0, 0.08]}
            renderOrder={1}
            raycast={noopRaycast}
          >
            <cylinderGeometry args={[0.003, 0.0035, cc.width, 10]} />
            <meshStandardMaterial
              color="#e2e8f0"
              roughness={0.4}
              metalness={0.05}
              transparent
              opacity={Math.max(0.3, torsoOpacity * 0.85)}
            />
          </mesh>
        </group>
      ))}

      {/* Rib Cage Landmarks (Distinct Ribs 1 to 12) */}
      {ribs.map((rib) => (
        <mesh
          key={`rib-${rib.id}`}
          position={[0, rib.y, 0]}
          rotation={[rib.rotX, 0, 0]}
          renderOrder={1}
          raycast={noopRaycast}
        >
          <torusGeometry args={[rib.r * 0.96, 0.0038, 8, 36, rib.span]} />
          <meshStandardMaterial
            color={rib.isTrueRib ? '#cbd5e1' : '#94a3b8'}
            roughness={0.55}
            metalness={0.05}
            transparent
            opacity={Math.max(0.25, torsoOpacity * 0.8)}
          />
        </mesh>
      ))}
    </group>
  );
};
