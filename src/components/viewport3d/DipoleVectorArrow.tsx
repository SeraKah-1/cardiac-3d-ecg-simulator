import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3D } from '../../engine/biophysics/types';
import { useSimulationStore } from '../../store/useSimulationStore';

interface DipoleVectorArrowProps {
  graphicsDipole: Vector3D;
}

export const DipoleVectorArrow: React.FC<DipoleVectorArrowProps> = ({ graphicsDipole }) => {
  const showDipoleVector = useSimulationStore((s) => s.showDipoleVector);
  const arrowGroupRef = useRef<THREE.Group>(null);
  const shaftMeshRef = useRef<THREE.Mesh>(null);
  const headMeshRef = useRef<THREE.Mesh>(null);

  // Heart origin in Three.js coordinates
  const origin = new THREE.Vector3(0.01, 0.02, 0.02);

  useFrame(() => {
    if (!arrowGroupRef.current || !shaftMeshRef.current || !headMeshRef.current) return;

    const dir = new THREE.Vector3(graphicsDipole.x, graphicsDipole.y, graphicsDipole.z);
    const mag = dir.length();

    if (mag > 0.05) {
      dir.normalize();
      const length = Math.min(0.22, mag * 0.09);

      // Align group along dir vector
      const defaultDir = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(defaultDir, dir);
      arrowGroupRef.current.quaternion.copy(quat);

      // Scale arrow length dynamically
      const shaftLength = Math.max(0.01, length - 0.03);
      shaftMeshRef.current.scale.set(1, shaftLength / 0.1, 1);
      shaftMeshRef.current.position.set(0, shaftLength / 2, 0);
      headMeshRef.current.position.set(0, shaftLength + 0.015, 0);

      // Dynamic color shift: Gold during high-voltage QRS, Orange during T wave
      const col = mag > 0.9 ? 0xfacc15 : 0xf97316;
      (shaftMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(col);
      (headMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(col);
    } else {
      // Invisible or minimal during isoelectric segments
      shaftMeshRef.current.scale.set(0.001, 0.001, 0.001);
      headMeshRef.current.scale.set(0.001, 0.001, 0.001);
    }
  });

  if (!showDipoleVector) return null;

  return (
    <group position={[origin.x, origin.y, origin.z]} renderOrder={3}>
      <group ref={arrowGroupRef}>
        {/* Shaft */}
        <mesh ref={shaftMeshRef} position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.1, 12]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>

        {/* Arrowhead */}
        <mesh ref={headMeshRef} position={[0, 0.115, 0]}>
          <coneGeometry args={[0.009, 0.03, 16]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      </group>
    </group>
  );
};
