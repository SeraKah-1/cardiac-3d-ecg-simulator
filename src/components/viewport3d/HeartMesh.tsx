import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';

// Dummy raycast to ensure raycasters completely ignore internal heart components
const noopRaycast = () => {};

/**
 * 3D Anatomical Heart with Distinct Chambers, Great Vessels, Coronary Branches,
 * Conduction System Nodes, Dynamic Activation Shading, and Regional Ischemic Discoloration.
 *
 * Implements clinical cyanosis (#273240) in anteroseptal (LAD), inferior (RCA),
 * and lateral (LCx) myocardial territories under progressive arterial stenosis.
 */
export const HeartMesh: React.FC<{ phase: number }> = ({ phase }) => {
  const heartGroupRef = useRef<THREE.Group>(null);
  const myocardiumMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const saNodeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const avNodeMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Regional Ischemic Wall Materials
  const anteroseptalMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const inferiorMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lateralMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Coronary Artery Materials
  const ladMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rcaMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lcxMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const ladStenosis = useSimulationStore((s) => s.factors.ladStenosisPercent);
  const lcxStenosis = useSimulationStore((s) => s.factors.lcxStenosisPercent);
  const rcaStenosis = useSimulationStore((s) => s.factors.rcaStenosisPercent);

  // Dynamic activation color during cardiac cycle and regional ischemic discoloration
  useFrame(() => {
    // Cardiac phases:
    // P wave: phase ~ -1.2
    // QRS wave: phase ~ 0.0
    // T wave: phase ~ 1.35
    const isQRS = Math.abs(phase) < 0.25;
    const isPWave = Math.abs(phase - (-1.2)) < 0.25;
    const isTWave = Math.abs(phase - 1.35) < 0.35;

    let baseEmissiveHex = 0x450a0a; // Deep resting maroon
    let baseEmissiveIntensity = 0.15;

    if (isQRS) {
      baseEmissiveHex = 0xeab308; // Electric Gold
      baseEmissiveIntensity = 0.85;
    } else if (isTWave) {
      baseEmissiveHex = 0xf97316; // Amber Orange
      baseEmissiveIntensity = 0.45;
    } else if (isPWave) {
      baseEmissiveHex = 0x38bdf8; // Sky Blue
      baseEmissiveIntensity = 0.50;
    }

    if (myocardiumMatRef.current) {
      myocardiumMatRef.current.emissive.setHex(baseEmissiveHex);
      myocardiumMatRef.current.emissiveIntensity = baseEmissiveIntensity;
    }

    // 1. Regional Ischemia: Anteroseptal Wall (LAD Territory)
    if (anteroseptalMatRef.current) {
      if (ladStenosis > 50) {
        // Clinical cyanosis #273240 (dusky cyanotic blue-gray)
        anteroseptalMatRef.current.color.setHex(0x273240);
        anteroseptalMatRef.current.emissive.setHex(0x16202c);
        anteroseptalMatRef.current.emissiveIntensity = isQRS ? 0.15 : 0.04;
        anteroseptalMatRef.current.roughness = 0.8;
      } else {
        anteroseptalMatRef.current.color.setHex(0x991b1b);
        anteroseptalMatRef.current.emissive.setHex(baseEmissiveHex);
        anteroseptalMatRef.current.emissiveIntensity = baseEmissiveIntensity;
        anteroseptalMatRef.current.roughness = 0.4;
      }
    }

    // 2. Regional Ischemia: Inferior Wall (RCA Territory)
    if (inferiorMatRef.current) {
      if (rcaStenosis > 50) {
        // Clinical cyanosis #273240
        inferiorMatRef.current.color.setHex(0x273240);
        inferiorMatRef.current.emissive.setHex(0x16202c);
        inferiorMatRef.current.emissiveIntensity = isQRS ? 0.15 : 0.04;
        inferiorMatRef.current.roughness = 0.8;
      } else {
        inferiorMatRef.current.color.setHex(0x991b1b);
        inferiorMatRef.current.emissive.setHex(baseEmissiveHex);
        inferiorMatRef.current.emissiveIntensity = baseEmissiveIntensity;
        inferiorMatRef.current.roughness = 0.4;
      }
    }

    // 3. Regional Ischemia: Lateral Wall (LCx Territory)
    if (lateralMatRef.current) {
      if (lcxStenosis > 50) {
        // Clinical cyanosis #273240
        lateralMatRef.current.color.setHex(0x273240);
        lateralMatRef.current.emissive.setHex(0x16202c);
        lateralMatRef.current.emissiveIntensity = isQRS ? 0.15 : 0.04;
        lateralMatRef.current.roughness = 0.8;
      } else {
        lateralMatRef.current.color.setHex(0x991b1b);
        lateralMatRef.current.emissive.setHex(baseEmissiveHex);
        lateralMatRef.current.emissiveIntensity = baseEmissiveIntensity;
        lateralMatRef.current.roughness = 0.4;
      }
    }

    // Coronary Artery Ischemic Color Modulation
    if (ladMatRef.current) {
      if (ladStenosis > 70) {
        ladMatRef.current.color.setHex(0xe11d48);
        ladMatRef.current.emissive.setHex(0xf43f5e);
        ladMatRef.current.emissiveIntensity = 0.7;
      } else if (ladStenosis > 50) {
        ladMatRef.current.color.setHex(0x273240);
        ladMatRef.current.emissive.setHex(0x0284c7);
        ladMatRef.current.emissiveIntensity = 0.3;
      } else {
        ladMatRef.current.color.setHex(0x38bdf8);
        ladMatRef.current.emissive.setHex(0x0284c7);
        ladMatRef.current.emissiveIntensity = 0.2;
      }
    }

    if (rcaMatRef.current) {
      if (rcaStenosis > 70) {
        rcaMatRef.current.color.setHex(0xe11d48);
        rcaMatRef.current.emissive.setHex(0xf43f5e);
        rcaMatRef.current.emissiveIntensity = 0.7;
      } else if (rcaStenosis > 50) {
        rcaMatRef.current.color.setHex(0x273240);
        rcaMatRef.current.emissive.setHex(0x0284c7);
        rcaMatRef.current.emissiveIntensity = 0.3;
      } else {
        rcaMatRef.current.color.setHex(0x38bdf8);
        rcaMatRef.current.emissive.setHex(0x0284c7);
        rcaMatRef.current.emissiveIntensity = 0.2;
      }
    }

    if (lcxMatRef.current) {
      if (lcxStenosis > 70) {
        lcxMatRef.current.color.setHex(0xe11d48);
        lcxMatRef.current.emissive.setHex(0xf43f5e);
        lcxMatRef.current.emissiveIntensity = 0.7;
      } else if (lcxStenosis > 50) {
        lcxMatRef.current.color.setHex(0x273240);
        lcxMatRef.current.emissive.setHex(0x0284c7);
        lcxMatRef.current.emissiveIntensity = 0.3;
      } else {
        lcxMatRef.current.color.setHex(0x38bdf8);
        lcxMatRef.current.emissive.setHex(0x0284c7);
        lcxMatRef.current.emissiveIntensity = 0.2;
      }
    }

    // SA Node flash during P wave
    if (saNodeMatRef.current) {
      saNodeMatRef.current.color.setHex(isPWave ? 0x00ffff : 0xfacc15);
    }

    // AV Node flash during PR interval
    if (avNodeMatRef.current) {
      const isAVDelay = phase > -1.0 && phase < -0.3;
      avNodeMatRef.current.color.setHex(isAVDelay ? 0x22c55e : 0xf59e0b);
    }
  });

  // LAD Artery curve in anterior interventricular sulcus
  const ladPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20.0;
      const x = -0.01 + t * 0.025;
      const y = 0.04 - t * 0.09;
      const z = 0.045 - t * 0.01 + Math.sin(t * Math.PI) * 0.015;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);

  const ladCurve = useMemo(() => new THREE.CatmullRomCurve3(ladPoints), [ladPoints]);
  const ladGeometry = useMemo(() => new THREE.TubeGeometry(ladCurve, 32, 0.0035, 8, false), [ladCurve]);

  // LAD Diagonal Branch 1 (D1)
  const d1Points = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10.0;
      const x = 0.002 + t * 0.025;
      const y = 0.01 - t * 0.04;
      const z = 0.042 - t * 0.008;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);
  const d1Curve = useMemo(() => new THREE.CatmullRomCurve3(d1Points), [d1Points]);
  const d1Geometry = useMemo(() => new THREE.TubeGeometry(d1Curve, 16, 0.0022, 6, false), [d1Curve]);

  // RCA Artery curve in right AV groove
  const rcaPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20.0;
      const x = -0.035 - Math.sin(t * Math.PI * 0.7) * 0.02;
      const y = 0.03 - t * 0.07;
      const z = 0.015 + Math.cos(t * Math.PI * 0.7) * 0.025;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);

  const rcaCurve = useMemo(() => new THREE.CatmullRomCurve3(rcaPoints), [rcaPoints]);
  const rcaGeometry = useMemo(() => new THREE.TubeGeometry(rcaCurve, 32, 0.0035, 8, false), [rcaCurve]);

  // RCA Posterior Descending Branch (PDA)
  const pdaPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10.0;
      const x = -0.01 + t * 0.015;
      const y = -0.035 - t * 0.025;
      const z = -0.005 - t * 0.015;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);
  const pdaCurve = useMemo(() => new THREE.CatmullRomCurve3(pdaPoints), [pdaPoints]);
  const pdaGeometry = useMemo(() => new THREE.TubeGeometry(pdaCurve, 16, 0.0024, 6, false), [pdaCurve]);

  // LCx Artery curve in left AV groove
  const lcxPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20.0;
      const x = 0.015 + Math.sin(t * Math.PI * 0.8) * 0.035;
      const y = 0.03 - t * 0.05;
      const z = 0.02 - Math.cos(t * Math.PI * 0.8) * 0.03;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);

  const lcxCurve = useMemo(() => new THREE.CatmullRomCurve3(lcxPoints), [lcxPoints]);
  const lcxGeometry = useMemo(() => new THREE.TubeGeometry(lcxCurve, 32, 0.003, 8, false), [lcxCurve]);

  return (
    <group ref={heartGroupRef} position={[0.01, 0.02, 0.02]} renderOrder={0}>
      {/* 1. VENTRICLES */}
      {/* Left Ventricle & Myocardium Body Base */}
      <mesh
        position={[0.015, -0.02, 0.01]}
        rotation={[0.2, 0.1, -0.2]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.045, 32, 32]} />
        <meshStandardMaterial
          ref={myocardiumMatRef}
          color="#991b1b"
          roughness={0.4}
          metalness={0.2}
          depthWrite={true}
        />
      </mesh>

      {/* Anteroseptal Wall Segment (LAD Territory) with Dynamic Cyanosis #273240 */}
      <mesh
        position={[0.005, -0.018, 0.028]}
        rotation={[0.1, 0.05, -0.1]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.027, 24, 24]} />
        <meshStandardMaterial
          ref={anteroseptalMatRef}
          color="#991b1b"
          roughness={0.4}
          metalness={0.15}
          depthWrite={true}
        />
      </mesh>

      {/* Inferior Wall Segment (RCA Territory) with Dynamic Cyanosis #273240 */}
      <mesh
        position={[0.012, -0.046, 0.006]}
        rotation={[0.3, 0.0, -0.1]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.025, 24, 24]} />
        <meshStandardMaterial
          ref={inferiorMatRef}
          color="#991b1b"
          roughness={0.4}
          metalness={0.15}
          depthWrite={true}
        />
      </mesh>

      {/* Lateral Wall Segment (LCx Territory) with Dynamic Cyanosis #273240 */}
      <mesh
        position={[0.040, -0.020, 0.008]}
        rotation={[0.15, 0.2, -0.25]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.025, 24, 24]} />
        <meshStandardMaterial
          ref={lateralMatRef}
          color="#991b1b"
          roughness={0.4}
          metalness={0.15}
          depthWrite={true}
        />
      </mesh>

      {/* Right Ventricle Body */}
      <mesh
        position={[-0.02, -0.015, 0.02]}
        rotation={[0.1, -0.1, 0.1]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.038, 28, 28]} />
        <meshStandardMaterial
          color="#b91c1c"
          roughness={0.5}
          metalness={0.1}
          depthWrite={true}
        />
      </mesh>

      {/* 2. ATRIA */}
      {/* Left Atrium */}
      <mesh
        position={[0.025, 0.035, -0.015]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.028, 24, 24]} />
        <meshStandardMaterial color="#881337" roughness={0.5} />
      </mesh>

      {/* Right Atrium */}
      <mesh
        position={[-0.03, 0.03, 0.005]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.03, 24, 24]} />
        <meshStandardMaterial color="#881337" roughness={0.5} />
      </mesh>

      {/* 3. GREAT VESSELS */}
      {/* Ascending Aorta and Arch */}
      <mesh
        position={[0.005, 0.065, -0.005]}
        rotation={[0, 0, -0.2]}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.014, 0.015, 0.05, 24]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Aortic Arch Vessel Branches */}
      <mesh
        position={[-0.002, 0.092, -0.008]}
        rotation={[0, 0, 0.1]}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.004, 0.004, 0.014, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
      <mesh
        position={[0.008, 0.093, -0.008]}
        rotation={[0, 0, -0.05]}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.0035, 0.0035, 0.014, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
      <mesh
        position={[0.017, 0.091, -0.008]}
        rotation={[0, 0, -0.15]}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.0035, 0.0035, 0.014, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>

      {/* Pulmonary Trunk */}
      <mesh
        position={[-0.01, 0.055, 0.02]}
        rotation={[0.3, 0, 0.3]}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.012, 0.013, 0.045, 20]} />
        <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Superior Vena Cava (SVC) */}
      <mesh
        position={[-0.035, 0.065, -0.01]}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.01, 0.01, 0.04, 16]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
      </mesh>

      {/* Inferior Vena Cava (IVC) */}
      <mesh
        position={[-0.032, -0.038, -0.015]}
        raycast={noopRaycast}
      >
        <cylinderGeometry args={[0.009, 0.009, 0.025, 16]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
      </mesh>

      {/* 4. CORONARY ARTERY BRANCHES */}
      {/* LAD Main Trunk */}
      <mesh
        geometry={ladGeometry}
        raycast={noopRaycast}
      >
        <meshStandardMaterial
          ref={ladMatRef}
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
        />
      </mesh>

      {/* LAD Diagonal Branch (D1) */}
      <mesh
        geometry={d1Geometry}
        raycast={noopRaycast}
      >
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
        />
      </mesh>

      {/* RCA Main Trunk */}
      <mesh
        geometry={rcaGeometry}
        raycast={noopRaycast}
      >
        <meshStandardMaterial
          ref={rcaMatRef}
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
        />
      </mesh>

      {/* RCA Posterior Descending Branch (PDA) */}
      <mesh
        geometry={pdaGeometry}
        raycast={noopRaycast}
      >
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
        />
      </mesh>

      {/* LCx Artery */}
      <mesh
        geometry={lcxGeometry}
        raycast={noopRaycast}
      >
        <meshStandardMaterial
          ref={lcxMatRef}
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.2}
          roughness={0.2}
        />
      </mesh>

      {/* 5. CONDUCTION SYSTEM NODES */}
      {/* SA Node (Crista Terminalis) */}
      <mesh
        position={[-0.035, 0.05, 0.0]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.005, 16, 16]} />
        <meshBasicMaterial ref={saNodeMatRef} color="#facc15" />
      </mesh>

      {/* AV Node (Koch's Triangle) */}
      <mesh
        position={[-0.005, 0.015, 0.01]}
        raycast={noopRaycast}
      >
        <sphereGeometry args={[0.0045, 16, 16]} />
        <meshBasicMaterial ref={avNodeMatRef} color="#22c55e" />
      </mesh>
    </group>
  );
};
