import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TorsoMesh } from './TorsoMesh';
import { HeartMesh } from './HeartMesh';
import { ElectrodesManager } from './ElectrodesManager';
import { LeadWires } from './LeadWires';
import { DipoleVectorArrow } from './DipoleVectorArrow';
import { ElectrodeTray } from './ElectrodeTray';
import { LeadFieldModel } from '../../engine/biophysics/LeadFieldModel';
import { Vector3D } from '../../engine/biophysics/types';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Eye, RotateCcw, Activity, Layers } from 'lucide-react';
import { useLocale } from '../../locales/useLocale';

interface Cardiac3DViewportProps {
  leadModel: LeadFieldModel;
  currentPhase: number;
  graphicsDipole: Vector3D;
  onElectrodeMoved?: () => void;
  showTray?: boolean;
}

export const Cardiac3DViewport: React.FC<Cardiac3DViewportProps> = ({
  leadModel,
  currentPhase,
  graphicsDipole,
  onElectrodeMoved,
  showTray = true,
}) => {
  const { t } = useLocale();
  const [torsoMesh, setTorsoMesh] = useState<THREE.Mesh | null>(null);
  const controlsRef = useRef<any>(null);

  const workspaceMode = useSimulationStore((s) => s.workspaceMode);
  const [prevWorkspaceMode, setPrevWorkspaceMode] = useState(workspaceMode);
  const [isTrayCollapsed, setIsTrayCollapsed] = useState(workspaceMode === 'integrated');

  // Auto-collapse electrode tray when switching to integrated mode
  if (prevWorkspaceMode !== workspaceMode) {
    setPrevWorkspaceMode(workspaceMode);
    if (workspaceMode === 'integrated') {
      setIsTrayCollapsed(true);
    }
  }

  const torsoOpacity = useSimulationStore((s) => s.torsoOpacity);
  const setTorsoOpacity = useSimulationStore((s) => s.setTorsoOpacity);
  const showLeadWires = useSimulationStore((s) => s.showLeadWires);
  const setShowLeadWires = useSimulationStore((s) => s.setShowLeadWires);
  const showDipoleVector = useSimulationStore((s) => s.showDipoleVector);
  const setShowDipoleVector = useSimulationStore((s) => s.setShowDipoleVector);
  const colorStandard = useSimulationStore((s) => s.colorStandard);
  const setColorStandard = useSimulationStore((s) => s.setColorStandard);
  const isDraggingElectrode = useSimulationStore((s) => s.isDraggingElectrode);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleResetElectrodes = () => {
    leadModel.resetToStandardPositions();
    if (onElectrodeMoved) {
      onElectrodeMoved();
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden select-none border-r border-slate-200 flex flex-col">
      {/* 1. Top Left Overlay: Title Pill */}
      <div className="absolute top-3 left-3 z-10 pointer-events-auto">
        <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
          <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="font-bold text-slate-800">{t.viewport3d.torsoTitle}</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline text-[11px]">{t.viewport3d.torsoSubtitle}</span>
        </div>
      </div>

      {/* 2. Top Right Floating Pill Controls: Eliminates OrbitControls interference */}
      <div className="absolute top-3 right-3 z-10 pointer-events-auto">
        <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 text-xs shadow-md">
          <button
            onClick={() => setColorStandard(colorStandard === 'AHA' ? 'IEC' : 'AHA')}
            className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition"
            title={t.viewport3d.colorStandardTooltip}
          >
            {colorStandard}
          </button>
          <div className="h-3.5 w-px bg-slate-200" />
          <button
            onClick={handleResetElectrodes}
            className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center space-x-1 text-[11px] font-medium transition"
            title={t.viewport3d.resetLeadsTooltip}
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">{t.viewport3d.resetLeads}</span>
          </button>
          <div className="h-3.5 w-px bg-slate-200" />
          <button
            onClick={handleResetCamera}
            className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center space-x-1 text-[11px] font-medium transition"
            title={t.viewport3d.cameraTooltip}
          >
            <Eye className="w-3 h-3 text-slate-500" />
            <span>{t.viewport3d.camera}</span>
          </button>
        </div>
      </div>

      {/* 3. Side-Docked Collapsible Electrode Tray */}
      {showTray && (
        <div className="absolute top-12 left-0 z-20 pointer-events-auto">
          <ElectrodeTray
            isCollapsed={isTrayCollapsed}
            onToggleCollapse={() => setIsTrayCollapsed(!isTrayCollapsed)}
          />
        </div>
      )}

      {/* 4. 3D Canvas */}
      <div className="flex-1 w-full h-full">
        <Canvas
          camera={{ position: [0, 0.05, 0.75], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[1.5, 2.5, 1.5]} intensity={1.6} />
          <directionalLight position={[-1.5, -1.0, -1.0]} intensity={0.6} />
          <directionalLight position={[0, 0, 2]} intensity={0.5} />

          {/* OrbitControls is disabled during electrode dragging so rotation never gets stuck */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enabled={!isDraggingElectrode}
            enableDamping
            dampingFactor={0.06}
            minDistance={0.3}
            maxDistance={1.6}
            target={[0, 0.02, 0.02]}
          />

          <Suspense fallback={null}>
            {/* 1. Internal Anatomical Heart (renderOrder 0) */}
            <HeartMesh phase={currentPhase} />

            {/* 2. 3D Torso Mesh with X-Ray Fresnel Shader in Light Mode (renderOrder 2) */}
            <TorsoMesh onTorsoReady={setTorsoMesh} />

            {/* 3. Interactive Draggable Electrodes & Target Rings */}
            <ElectrodesManager
              leadModel={leadModel}
              torsoMesh={torsoMesh}
              onElectrodeMoved={onElectrodeMoved}
            />

            {/* 4. Dynamic Lead Wires */}
            <LeadWires leadModel={leadModel} />

            {/* 5. Instantaneous 3D Electrical Dipole Vector */}
            <DipoleVectorArrow graphicsDipole={graphicsDipole} />
          </Suspense>
        </Canvas>
      </div>

      {/* 5. Bottom Floating Viewport Controls */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 text-xs shadow-md pointer-events-auto">
        {/* Opacity Slider */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-600 font-medium text-[11px]">{t.viewport3d.torsoOpacityLabel}</span>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.02"
            value={torsoOpacity}
            onChange={(e) => setTorsoOpacity(parseFloat(e.target.value))}
            className="w-20 sm:w-24 accent-sky-600 cursor-pointer"
          />
          <span className="text-slate-800 font-mono font-bold text-[11px] w-8">{Math.round(torsoOpacity * 100)}%</span>
        </div>

        {/* Visual Toggles */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 hover:text-slate-900 transition font-medium text-[11px]">
            <input
              type="checkbox"
              checked={showLeadWires}
              onChange={(e) => setShowLeadWires(e.target.checked)}
              className="accent-sky-600 rounded cursor-pointer"
            />
            <span className="hidden sm:inline">{t.viewport3d.leadWires}</span>
            <span className="sm:hidden">{t.viewport3d.leadWiresShort}</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 hover:text-slate-900 transition font-medium text-[11px]">
            <input
              type="checkbox"
              checked={showDipoleVector}
              onChange={(e) => setShowDipoleVector(e.target.checked)}
              className="accent-amber-500 rounded cursor-pointer"
            />
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">{t.viewport3d.dipoleVector}</span>
            <span className="sm:hidden">{t.viewport3d.dipoleVectorShort}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
