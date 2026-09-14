import React, { useMemo } from 'react';
import * as THREE from 'three';
import { LeadFieldModel } from '../../engine/biophysics/LeadFieldModel';
import { PhysicalElectrodeId } from '../../engine/biophysics/types';
import { useSimulationStore } from '../../store/useSimulationStore';

interface LeadWiresProps {
  leadModel: LeadFieldModel;
}

export const LeadWires: React.FC<LeadWiresProps> = ({ leadModel }) => {
  const showLeadWires = useSimulationStore((s) => s.showLeadWires);
  const colorStandard = useSimulationStore((s) => s.colorStandard);
  const placedElectrodes = useSimulationStore((s) => s.placedElectrodes);

  // Virtual ECG Trunk / Acquisition Junction Box position (anterior-inferior to torso)
  const junctionBoxPos = useMemo(() => new THREE.Vector3(0, -0.32, 0.22), []);

  const electrodeList = Object.keys(leadModel.electrodes) as PhysicalElectrodeId[];

  if (!showLeadWires) return null;

  return (
    <group renderOrder={1}>
      {/* Central Acquisition Junction Box */}
      <mesh position={[junctionBoxPos.x, junctionBoxPos.y, junctionBoxPos.z]}>
        <boxGeometry args={[0.08, 0.04, 0.03]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Individual Catenary Wires (Only rendered when electrode is placed) */}
      {electrodeList.map((id) => {
        if (!placedElectrodes[id]) return null;

        const gPos = leadModel.getElectrodeInGraphicsCoords(id);
        const start = new THREE.Vector3(gPos.x, gPos.y, gPos.z);
        const end = junctionBoxPos;

        const distance = start.distanceTo(end);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        // Realistic downward sag proportional to cable span
        mid.y -= distance * 0.18;
        mid.z += 0.02;

        const curve = new THREE.CatmullRomCurve3([start, mid, end]);
        const tubeGeom = new THREE.TubeGeometry(curve, 16, 0.0015, 6, false);

        const wireColor = colorStandard === 'AHA'
          ? (id === 'RA' ? '#cbd5e1' : id === 'LL' ? '#ef4444' : id === 'RL' ? '#22c55e' : id === 'LA' ? '#0f172a' : '#64748b')
          : (id === 'RA' ? '#ef4444' : id === 'LA' ? '#eab308' : id === 'LL' ? '#22c55e' : '#64748b');

        return (
          <mesh key={id} geometry={tubeGeom}>
            <meshStandardMaterial color={wireColor} roughness={0.5} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
};
