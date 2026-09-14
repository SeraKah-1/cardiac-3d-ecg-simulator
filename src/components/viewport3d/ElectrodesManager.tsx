import React, { useState, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PhysicalElectrodeId, Vector3D } from '../../engine/biophysics/types';
import { LeadFieldModel, STANDARD_ELECTRODE_LANDMARKS } from '../../engine/biophysics/LeadFieldModel';
import { CardiacDipoleEngine } from '../../engine/biophysics/CardiacDipoleEngine';
import { useSimulationStore } from '../../store/useSimulationStore';

interface ElectrodesManagerProps {
  leadModel: LeadFieldModel;
  torsoMesh: THREE.Mesh | null;
  onElectrodeMoved?: (id: PhysicalElectrodeId, pos: Vector3D) => void;
}

// AHA vs IEC Color Specifications
const AHA_COLORS: Record<PhysicalElectrodeId, string> = {
  RA: '#f8fafc', // White
  LA: '#0f172a', // Black
  RL: '#16a34a', // Green (Patient Ground)
  LL: '#dc2626', // Red
  V1: '#ef4444', // Red collar
  V2: '#eab308', // Yellow
  V3: '#22c55e', // Green
  V4: '#2563eb', // Blue
  V5: '#f97316', // Orange
  V6: '#9333ea', // Purple
};

const IEC_COLORS: Record<PhysicalElectrodeId, string> = {
  RA: '#dc2626', // Red
  LA: '#eab308', // Yellow
  RL: '#0f172a', // Black
  LL: '#16a34a', // Green
  V1: '#ef4444',
  V2: '#eab308',
  V3: '#22c55e',
  V4: '#78350f', // Brown
  V5: '#0f172a', // Black
  V6: '#7c3aed', // Violet
};

export const ElectrodesManager: React.FC<ElectrodesManagerProps> = ({
  leadModel,
  torsoMesh,
  onElectrodeMoved,
}) => {
  const { camera, gl } = useThree();
  const colorStandard = useSimulationStore((s) => s.colorStandard);
  const selectedLeadId = useSimulationStore((s) => s.selectedLeadId);
  const setSelectedLeadId = useSimulationStore((s) => s.setSelectedLeadId);
  const placedElectrodes = useSimulationStore((s) => s.placedElectrodes);
  const setElectrodePlaced = useSimulationStore((s) => s.setElectrodePlaced);
  const setIsDraggingElectrode = useSimulationStore((s) => s.setIsDraggingElectrode);

  const [draggingId, setDraggingId] = useState<PhysicalElectrodeId | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const electrodeList = Object.keys(STANDARD_ELECTRODE_LANDMARKS) as PhysicalElectrodeId[];
  const colors = colorStandard === 'AHA' ? AHA_COLORS : IEC_COLORS;

  // Global window listeners for drag lifecycle: ensures OrbitControls is never permanently blocked
  useEffect(() => {
    if (!draggingId) return;

    const handleGlobalPointerMove = (e: PointerEvent | MouseEvent) => {
      if (!torsoMesh) return;
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObject(torsoMesh, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const normal = hit.face?.normal
          ? hit.face.normal.clone().applyMatrix3(torsoMesh.normalMatrix).normalize()
          : new THREE.Vector3(0, 0, 1);

        const newGraphicsPos = hit.point.clone().add(normal.clone().multiplyScalar(0.005));

        const rawFrankPos: Vector3D = {
          x: newGraphicsPos.x,
          y: -newGraphicsPos.y,
          z: -newGraphicsPos.z,
        };

        const snappedFrankPos = leadModel.checkSnapping(draggingId, rawFrankPos);
        leadModel.setElectrodePosition(draggingId, snappedFrankPos, false);

        if (onElectrodeMoved) {
          onElectrodeMoved(draggingId, snappedFrankPos);
        }
      }
    };

    const handleGlobalPointerUp = () => {
      setDraggingId(null);
      setIsDraggingElectrode(false);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, [camera, draggingId, gl.domElement, leadModel, onElectrodeMoved, setIsDraggingElectrode, torsoMesh]);

  const handlePointerDown = (id: PhysicalElectrodeId, e: any) => {
    e.stopPropagation();
    setDraggingId(id);
    setSelectedLeadId(id);
    setIsDraggingElectrode(true);
  };

  const handlePointerUp = () => {
    if (draggingId) {
      setDraggingId(null);
      setIsDraggingElectrode(false);
    }
  };

  const handlePointerMove = (e: any) => {
    if (!draggingId || !torsoMesh) return;

    // Calculate normalized device coordinates [-1, +1]
    const rect = gl.domElement.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersects = raycasterRef.current.intersectObject(torsoMesh, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const normal = hit.face?.normal
        ? hit.face.normal.clone().applyMatrix3(torsoMesh.normalMatrix).normalize()
        : new THREE.Vector3(0, 0, 1);

      // Offset slightly off the surface to avoid Z-fighting
      const newGraphicsPos = hit.point.clone().add(normal.clone().multiplyScalar(0.005));

      // Convert from Three.js coordinates back to Frank VCG coordinates:
      // X_Frank = X_g, Y_Frank = -Y_g, Z_Frank = -Z_g
      const rawFrankPos: Vector3D = {
        x: newGraphicsPos.x,
        y: -newGraphicsPos.y,
        z: -newGraphicsPos.z,
      };

      // Apply magnetic snapping (35mm radius)
      const snappedFrankPos = leadModel.checkSnapping(draggingId, rawFrankPos);
      leadModel.setElectrodePosition(draggingId, snappedFrankPos, false);

      if (onElectrodeMoved) {
        onElectrodeMoved(draggingId, snappedFrankPos);
      }
    }
  };

  const handleTargetRingClick = (id: PhysicalElectrodeId, e: any) => {
    e.stopPropagation();
    // Attach electrode to standard target position
    leadModel.setElectrodePosition(id, STANDARD_ELECTRODE_LANDMARKS[id].pos, false);
    setElectrodePlaced(id, true);
    setSelectedLeadId(id);
  };

  return (
    <group
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 1. Anatomical Target Guide Rings on Torso */}
      {electrodeList.map((id) => {
        const isPlaced = !!placedElectrodes[id];
        const targetPos = STANDARD_ELECTRODE_LANDMARKS[id].pos;
        const gTarget = CardiacDipoleEngine.toGraphicsCoords(targetPos);
        const color = colors[id] || '#0284c7';

        // Render target ring when unplaced, or as subtle guide
        return (
          <group
            key={`target-${id}`}
            position={[gTarget.x, gTarget.y, gTarget.z]}
            onClick={(e) => handleTargetRingClick(id, e)}
          >
            {/* Guide circle on torso */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.012, 0.016, 32]} />
              <meshBasicMaterial
                color={isPlaced ? '#94a3b8' : color}
                transparent={true}
                opacity={isPlaced ? 0.25 : 0.85}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Pulsing guide dot when unplaced */}
            {!isPlaced && (
              <>
                <mesh>
                  <sphereGeometry args={[0.005, 16, 16]} />
                  <meshBasicMaterial color={color} />
                </mesh>
                <Html
                  position={[0, 0.02, 0]}
                  center
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      pointerEvents: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#0f172a',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '8.5px',
                      fontWeight: 'bold',
                      border: `1.5px solid ${color}`,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    }}
                  >
                    Target {id}
                  </div>
                </Html>
              </>
            )}
          </group>
        );
      })}

      {/* 2. Placed Physical Electrodes */}
      {electrodeList.map((id) => {
        const isPlaced = !!placedElectrodes[id];
        if (!isPlaced) return null;

        const gPos = leadModel.getElectrodeInGraphicsCoords(id);
        const isSelected = selectedLeadId === id;
        const color = colors[id] || '#ffffff';

        // Misplacement check: V1/V2 placed too high in 2nd intercostal space (Frank y < -0.035 m)
        const isHighMisplaced = (id === 'V1' || id === 'V2') && leadModel.electrodes[id].y < -0.035;

        return (
          <group
            key={`electrode-${id}`}
            position={[gPos.x, gPos.y, gPos.z]}
            onPointerDown={(e) => handlePointerDown(id, e)}
          >
            {/* Electrode Adhesive Rim */}
            <mesh>
              <cylinderGeometry args={[0.013, 0.015, 0.0035, 24]} />
              <meshStandardMaterial
                color={isHighMisplaced ? '#ef4444' : isSelected ? '#0284c7' : '#f1f5f9'}
                metalness={0.4}
                roughness={0.25}
              />
            </mesh>

            {/* Central Snap Stud with Color Collar */}
            <mesh position={[0, 0.0025, 0]}>
              <cylinderGeometry args={[0.0065, 0.0065, 0.004, 16]} />
              <meshStandardMaterial
                color={isHighMisplaced ? '#dc2626' : color}
                emissive={isHighMisplaced ? '#b91c1c' : isSelected ? color : '#000000'}
                emissiveIntensity={isHighMisplaced ? 0.8 : isSelected ? 0.5 : 0.0}
                roughness={0.3}
              />
            </mesh>

            {/* Misplacement warning ring */}
            {isHighMisplaced && (
              <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.015, 0.020, 24]} />
                <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Floating 2D HUD Badge with pointerEvents="none" to prevent Drei raycast bugs */}
            <Html
              distanceFactor={1.2}
              position={[0, isHighMisplaced ? 0.026 : 0.020, 0]}
              center
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  pointerEvents: 'none',
                  backgroundColor: isHighMisplaced
                    ? 'rgba(239, 68, 68, 0.95)'
                    : isSelected
                    ? 'rgba(2, 132, 199, 0.95)'
                    : 'rgba(255, 255, 255, 0.92)',
                  color: isHighMisplaced || isSelected ? '#ffffff' : '#0f172a',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontWeight: 'bold',
                  border: isHighMisplaced
                    ? '1.5px solid #b91c1c'
                    : `1.5px solid ${isSelected ? '#0369a1' : '#cbd5e1'}`,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected
                    ? '0 2px 8px rgba(2,132,199,0.35)'
                    : '0 1px 4px rgba(0,0,0,0.1)',
                  transform: isSelected ? 'scale(1.12)' : 'scale(1.0)',
                  transition: 'transform 0.15s ease',
                  lineHeight: '1.1',
                  textAlign: 'center',
                }}
              >
                {isHighMisplaced ? (
                  <div>
                    <div>{id} (ICS 2)</div>
                    <div style={{ fontSize: '7.5px', color: '#fee2e2' }}>Pseudo-Brugada</div>
                  </div>
                ) : (
                  <span>{id}</span>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
