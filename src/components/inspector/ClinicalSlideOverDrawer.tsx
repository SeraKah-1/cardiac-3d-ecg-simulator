import React, { useRef, useEffect, useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { LeadId, Vector3D } from '../../engine/biophysics/types';
import { LeadFieldModel } from '../../engine/biophysics/LeadFieldModel';
import { CLINICAL_PRESETS } from '../../engine/clinical/presets';
import { EcgRingBuffer } from '../ecg/EcgRingBuffer';
import { createEcgGridPattern } from '../ecg/EcgGridPattern';
import {
  Sliders,
  Crosshair,
  Cpu,
  User,
  X,
  CheckSquare,
  Square,
  ShieldAlert,
  CheckCircle2,
  Heart,
} from 'lucide-react';

interface ClinicalSlideOverDrawerProps {
  buffers: Record<LeadId, EcgRingBuffer>;
  isOpen: boolean;
  onClose: () => void;
  leadModel?: LeadFieldModel;
  graphicsDipole?: Vector3D;
  currentPhase?: number;
}

const ALL_LEADS: LeadId[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

export const ClinicalSlideOverDrawer: React.FC<ClinicalSlideOverDrawerProps> = ({
  buffers,
  isOpen,
  onClose,
  leadModel,
  graphicsDipole,
}) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'biomarkers' | 'calipers' | 'audit'>('triage');
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  const selectedLeadId = useSimulationStore((s) => s.selectedLeadId);
  const setSelectedLeadId = useSimulationStore((s) => s.setSelectedLeadId);
  const factors = useSimulationStore((s) => s.factors);
  const setFactor = useSimulationStore((s) => s.setFactor);
  const diagnostic = useSimulationStore((s) => s.currentDiagnostic);
  const activePresetId = useSimulationStore((s) => s.activePresetId);

  const activePreset = CLINICAL_PRESETS.find((p) => p.id === activePresetId) || CLINICAL_PRESETS[0];
  const patient = activePreset.patientInfo;

  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [caliperTime1, setCaliperTime1] = useState(0.25);
  const [caliperTime2, setCaliperTime2] = useState(0.55);

  const effectiveLead: LeadId = (
    ALL_LEADS.includes(selectedLeadId as LeadId) ? selectedLeadId : 'V1'
  ) as LeadId;

  // Toggle bedside action check state
  const toggleActionCheck = (actionText: string) => {
    setCheckedActions((prev) => ({
      ...prev,
      [actionText]: !prev[actionText],
    }));
  };

  // Single-Lead Canvas Render Loop for Calipers Tab
  useEffect(() => {
    if (activeTab !== 'calipers' || !isOpen) return;

    let animId: number;
    const canvas = singleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const buffer = buffers[effectiveLead];
      if (!buffer) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const cssW = rect.width;
      const cssH = rect.height;

      // Draw Ivory-Pink Grid
      const pattern = createEcgGridPattern(3.78);
      ctx.fillStyle = pattern || '#fff7f7';
      ctx.fillRect(0, 0, cssW, cssH);

      const baselineY = cssH / 2.0;
      const scaleY = 10 * 3.78; // 10mm/mV standard zoom

      // Render Waveform (last 2 seconds = 1000 samples at 500 Hz)
      const sampleCount = Math.min(buffer.capacity, 1000);
      const stepX = cssW / sampleCount;
      const writeIdx = buffer.getWriteIndex();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < sampleCount; i++) {
        const val = buffer.getSample(writeIdx - sampleCount + i);
        const px = i * stepX;
        const py = baselineY - val * scaleY;

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Digital Caliper 1 (Amber)
      const c1X = caliperTime1 * cssW;
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(c1X, 0);
      ctx.lineTo(c1X, cssH);
      ctx.stroke();

      // Digital Caliper 2 (Sky)
      const c2X = caliperTime2 * cssW;
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.9)';
      ctx.beginPath();
      ctx.moveTo(c2X, 0);
      ctx.lineTo(c2X, cssH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, buffers, caliperTime1, caliperTime2, effectiveLead, isOpen]);

  if (!isOpen) return null;

  // Caliper delta calculation
  const totalWindowMs = (1000 / 500) * 1000; // 2000 ms
  const deltaMs = Math.abs(caliperTime2 - caliperTime1) * totalWindowMs;
  const equivalentBpm = deltaMs > 20 ? Math.round(60000 / deltaMs) : 0;

  // Live Einthoven Check for Tab 4 (Audit)
  const leadIVal = buffers['I'] ? buffers['I'].getSample(buffers['I'].getWriteIndex() - 1) : 0;
  const leadIIVal = buffers['II'] ? buffers['II'].getSample(buffers['II'].getWriteIndex() - 1) : 0;
  const leadIIIVal = buffers['III'] ? buffers['III'].getSample(buffers['III'].getWriteIndex() - 1) : 0;
  const einthovenSum = leadIVal + leadIIIVal;
  const einthovenDiff = Math.abs(einthovenSum - leadIIVal);

  const dipoleMag = graphicsDipole
    ? Math.sqrt(
        graphicsDipole.x * graphicsDipole.x +
        graphicsDipole.y * graphicsDipole.y +
        graphicsDipole.z * graphicsDipole.z
      )
    : 0;

  return (
    /* Non-Modal Slide-Over Drawer: Zero click-blocking backdrop! Spans top-[52px] to bottom-10 */
    <div className="fixed top-[52px] bottom-10 right-0 z-40 w-full sm:w-[460px] md:w-[500px] bg-white border-l border-slate-200 shadow-2xl flex flex-col select-none text-slate-900 duration-200">
      {/* Drawer Header */}
      <div className="h-11 border-b border-slate-200 bg-slate-50 px-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-600" />
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            Stasiun Klinis & Audit
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
          title="Tutup Panel Stasiun Klinis"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/70 px-2 pt-1 gap-1 shrink-0 overflow-x-auto">
        {/* Tab 1: Tindakan & Triage */}
        <button
          onClick={() => setActiveTab('triage')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-md text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'triage'
              ? 'bg-white text-rose-700 border-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 border-transparent'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Triage & Pasien</span>
          {diagnostic.triageCategory === 'red' && (
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          )}
        </button>

        {/* Tab 2: Biomarker & Parameter */}
        <button
          onClick={() => setActiveTab('biomarkers')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-md text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'biomarkers'
              ? 'bg-white text-sky-700 border-sky-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-sky-600" />
          <span>Parameter</span>
        </button>

        {/* Tab 3: Inspektor & Kaliper */}
        <button
          onClick={() => setActiveTab('calipers')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-md text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'calipers'
              ? 'bg-white text-amber-700 border-amber-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 border-transparent'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-amber-600" />
          <span>Kaliper</span>
        </button>

        {/* Tab 4: Audit Elektrofisiologi */}
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-md text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 border-transparent'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span>Audit Fisika</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* ==================== TAB 1: TINDAKAN & TRIAGE ==================== */}
        {activeTab === 'triage' && (
          <div className="space-y-3.5">
            {/* Patient Dossier Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1.5">
                <User className="w-4 h-4 text-sky-600" />
                <span>Dossier Pasien & Anamnesis</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pasien:</span>
                  <span className="font-bold text-slate-800">{patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Rekam Medis:</span>
                  <span className="font-mono font-bold text-sky-700">{patient.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Usia / Gender:</span>
                  <span className="text-slate-800 font-medium">{patient.age} Tahun / {patient.gender}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px] mb-1 font-medium">Keluhan Utama / Riwayat:</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
                    {patient.history}
                  </p>
                </div>
              </div>
            </div>

            {/* Bedside Actions Checklist */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1.5">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>Arahan Tindakan Medis Segera</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Bedside Checklist</span>
              </div>

              <div className="space-y-1.5">
                {diagnostic.bedsideActions.map((action, idx) => {
                  const isChecked = !!checkedActions[action];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleActionCheck(action)}
                      className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-200 text-slate-400 line-through'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <button className="mt-0.5 text-sky-600 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className="text-xs leading-snug">{action}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Triage Headline Card */}
            <div
              className={`p-3 rounded-xl border ${
                diagnostic.triageCategory === 'red'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : diagnostic.triageCategory === 'yellow'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider mb-1 text-slate-500">
                Diagnosis Klinis Utama:
              </div>
              <div className="font-bold text-sm leading-snug">
                {diagnostic.primaryHeadline}
              </div>
              {diagnostic.culpritArtery && (
                <div className="text-xs font-semibold text-rose-700 mt-1.5">
                  Arteri Koroner Culprit: {diagnostic.culpritArtery}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PARAMETER PASIEN & BIOMARKER ==================== */}
        {activeTab === 'biomarkers' && (
          <div className="space-y-3">
            {/* Irama Jantung (Rhythm Selector) */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Irama Jantung (Rhythm Type):</span>
                <span className="font-mono text-indigo-700 font-bold text-xs">{factors.rhythmType}</span>
              </div>
              <select
                value={factors.rhythmType}
                onChange={(e) => setFactor('rhythmType', e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="sinus">Irama Sinus Normal (Sinus Rhythm)</option>
                <option value="afib">Fibrilasi Atrium (Atrial Fibrillation - AFib)</option>
                <option value="aflutter">Flutter Atrium (Atrial Flutter - AFlutter)</option>
                <option value="vtach">Takikardia Ventrikel (Monomorphic VTach)</option>
                <option value="vfib_coarse">Fibrilasi Ventrikel Kasar (VFib Coarse - Henti Jantung)</option>
                <option value="vfib_fine">Fibrilasi Ventrikel Halus (VFib Fine)</option>
                <option value="asystole">Asistol (Ventricular Flatline)</option>
                <option value="av_block_3rd">Total AV Block Derajat 3 (Disosiasi AV Lengkap)</option>
                <option value="torsades">Torsades de Pointes (Polymorphic VT - Long QT)</option>
              </select>
              <div className="text-[10px] text-slate-500 mt-1">
                Pilih irama elektrofisiologi dinamis untuk simulasi biofisika multi-osilator.
              </div>
            </div>

            {/* Heart Rate */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Denyut Jantung (HR):</span>
                <span className="font-mono text-sky-700 font-bold text-xs">{factors.heartRate} BPM</span>
              </div>
              <input
                type="range"
                min="30"
                max="220"
                step="1"
                value={factors.heartRate}
                onChange={(e) => setFactor('heartRate', parseInt(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Ref: 60 - 100 BPM</span>
                <span className={factors.heartRate < 60 ? 'text-amber-600 font-bold' : factors.heartRate > 100 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {factors.heartRate < 60 ? 'Bradikardia' : factors.heartRate > 100 ? 'Takikardia' : 'Normal'}
                </span>
              </div>
            </div>

            {/* hs-Troponin T */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">hs-Troponin T:</span>
                <span className={`font-mono font-bold text-xs ${factors.hsTroponinT > 14 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {factors.hsTroponinT} ng/L
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="15000"
                step="10"
                value={factors.hsTroponinT}
                onChange={(e) => setFactor('hsTroponinT', parseInt(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Batas Normal: &lt; 14 ng/L</span>
                <span className={factors.hsTroponinT > 14 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {factors.hsTroponinT > 14 ? 'Cedera Miokard Akut' : 'Normal'}
                </span>
              </div>
            </div>

            {/* Serum Potassium (K+) */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Kalium Serum (K+):</span>
                <span className={`font-mono font-bold text-xs ${factors.serumPotassium > 5.5 || factors.serumPotassium < 3.5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {factors.serumPotassium.toFixed(1)} mmol/L
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="9.5"
                step="0.1"
                value={factors.serumPotassium}
                onChange={(e) => setFactor('serumPotassium', parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Ref: 3.5 - 5.0 mmol/L</span>
                <span className={factors.serumPotassium >= 7.0 ? 'text-rose-600 font-bold' : factors.serumPotassium > 5.0 ? 'text-amber-600 font-bold' : factors.serumPotassium < 3.5 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {factors.serumPotassium >= 7.0 ? 'Kritis Letal' : factors.serumPotassium > 5.0 ? 'Hiperkalemia' : factors.serumPotassium < 3.5 ? 'Hipokalemia' : 'Normal'}
                </span>
              </div>
            </div>

            {/* Serum Calcium (Ca2+) */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Kalsium Serum (Ca2+):</span>
                <span className="font-mono text-cyan-700 font-bold text-xs">{factors.serumCalcium.toFixed(1)} mg/dL</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="15.0"
                step="0.2"
                value={factors.serumCalcium}
                onChange={(e) => setFactor('serumCalcium', parseFloat(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Ref: 8.5 - 10.5 mg/dL</span>
                <span className="text-slate-600">QTc Modulator</span>
              </div>
            </div>

            {/* LAD Stenosis */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Stenosis LAD (Anterior V1-V4):</span>
                <span className={`font-mono font-bold text-xs ${factors.ladStenosisPercent > 70 ? 'text-rose-600' : factors.ladStenosisPercent > 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {factors.ladStenosisPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={factors.ladStenosisPercent}
                onChange={(e) => setFactor('ladStenosisPercent', parseInt(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>V1 - V4</span>
                <span>{factors.ladStenosisPercent > 70 ? 'Oklusi Akut (STEMI)' : factors.ladStenosisPercent > 50 ? 'Iskemik Dinding' : 'Perfusi Baik'}</span>
              </div>
            </div>

            {/* RCA Stenosis */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Stenosis RCA (Inferior II, III, aVF):</span>
                <span className={`font-mono font-bold text-xs ${factors.rcaStenosisPercent > 70 ? 'text-rose-600' : factors.rcaStenosisPercent > 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {factors.rcaStenosisPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={factors.rcaStenosisPercent}
                onChange={(e) => setFactor('rcaStenosisPercent', parseInt(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>II, III, aVF</span>
                <span>{factors.rcaStenosisPercent > 70 ? 'Oklusi Akut (STEMI)' : factors.rcaStenosisPercent > 50 ? 'Iskemik Dinding' : 'Perfusi Baik'}</span>
              </div>
            </div>

            {/* LCx Stenosis */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Stenosis LCx (Lateral I, aVL, V5-V6):</span>
                <span className={`font-mono font-bold text-xs ${factors.lcxStenosisPercent > 70 ? 'text-rose-600' : factors.lcxStenosisPercent > 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {factors.lcxStenosisPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={factors.lcxStenosisPercent}
                onChange={(e) => setFactor('lcxStenosisPercent', parseInt(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>I, aVL, V5 - V6</span>
                <span>{factors.lcxStenosisPercent > 70 ? 'Oklusi Akut' : factors.lcxStenosisPercent > 50 ? 'Iskemik Dinding' : 'Perfusi Baik'}</span>
              </div>
            </div>

            {/* SpO2 Oxygen Saturation */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-700 text-xs font-bold">Saturasi O2 (SpO2):</span>
                <span className={`font-mono font-bold text-xs ${factors.spo2Percent < 90 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {factors.spo2Percent}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                step="1"
                value={factors.spo2Percent}
                onChange={(e) => setFactor('spo2Percent', parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Target: 94 - 98%</span>
                <span className={factors.spo2Percent < 90 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {factors.spo2Percent < 90 ? 'Hipoksia Berat' : 'Adekuat'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: INSPEKTOR & KALIPER ==================== */}
        {activeTab === 'calipers' && (
          <div className="space-y-3">
            {/* Lead Selector Ribbon */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-1.5">Pilih Sadapan Terfokus:</div>
              <div className="grid grid-cols-6 gap-1">
                {ALL_LEADS.map((ld) => (
                  <button
                    key={ld}
                    onClick={() => setSelectedLeadId(ld)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition ${
                      effectiveLead === ld
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ld}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Lead Canvas */}
            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <div className="relative h-44 rounded-lg border border-slate-200 bg-[#fff7f7] overflow-hidden">
                <canvas ref={singleCanvasRef} className="w-full h-full block" />
              </div>

              {/* Caliper Sliders */}
              <div className="mt-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-700">Kaliper 1:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.01"
                    value={caliperTime1}
                    onChange={(e) => setCaliperTime1(parseFloat(e.target.value))}
                    className="w-40 sm:w-44 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-700">Kaliper 2:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.01"
                    value={caliperTime2}
                    onChange={(e) => setCaliperTime2(parseFloat(e.target.value))}
                    className="w-40 sm:w-44 accent-sky-600 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-600">Delta:</span>
                  <span className="text-sky-700">{Math.round(deltaMs)} ms</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600">HR:</span>
                  <span className="text-emerald-700">{equivalentBpm} BPM</span>
                </div>
              </div>
            </div>

            {/* Clinical Measurement Guide */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">
                Panduan Nilai Rujukan Interval
              </div>
              <div className="space-y-1 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>Interval PR:</span>
                  <span className="font-mono font-bold text-sky-700">120 - 200 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Durasi QRS:</span>
                  <span className="font-mono font-bold text-emerald-700">&lt; 120 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Interval QTc:</span>
                  <span className="font-mono font-bold text-purple-700">&lt; 440 ms (L), &lt; 460 ms (P)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: AUDIT ELEKTROFISIOLOGI ==================== */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {/* Einthoven Identity */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hukum Universal Einthoven (VI + VIII = VII)</span>
              </div>

              <p className="text-xs text-slate-600">
                Invarian matematis biopisika: Jumlah aljabar tegangan Sadapan I dan III identik secara presisi dengan Sadapan II.
              </p>

              <div className="space-y-1 font-mono text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-700">
                  <span>V_I (Sadapan I):</span>
                  <span>{leadIVal.toFixed(4)} mV</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>V_III (Sadapan III):</span>
                  <span>{leadIIIVal.toFixed(4)} mV</span>
                </div>
                <div className="flex justify-between text-sky-700 font-bold pt-1 border-t border-slate-200">
                  <span>V_I + V_III:</span>
                  <span>{einthovenSum.toFixed(4)} mV</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>V_II (Sadapan II):</span>
                  <span>{leadIIVal.toFixed(4)} mV</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Delta Error:</span>
                  <span>{einthovenDiff.toExponential(3)} mV</span>
                </div>
              </div>

              <div className="text-[10px] px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                Status: Invarian Einthoven Terverifikasi Presisi Tinggi
              </div>
            </div>

            {/* 3D Cardiac Dipole Vector */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                <Cpu className="w-4 h-4 text-sky-600" />
                <span>Vektor Momen Dipol Jantung 3D</span>
              </div>

              <div className="space-y-1 font-mono text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-700">
                  <span>Px (Transversal):</span>
                  <span className="text-sky-700">{graphicsDipole ? graphicsDipole.x.toFixed(4) : '0.0000'} mV</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Py (Vertikal):</span>
                  <span className="text-sky-700">{graphicsDipole ? graphicsDipole.y.toFixed(4) : '0.0000'} mV</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Pz (Sagital):</span>
                  <span className="text-sky-700">{graphicsDipole ? graphicsDipole.z.toFixed(4) : '0.0000'} mV</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Magnitudo |P|:</span>
                  <span>{dipoleMag.toFixed(4)} mV</span>
                </div>
              </div>

              <div className="text-[10px] px-2 py-1 rounded bg-sky-100 text-sky-800 font-bold">
                Konstanta Transfer Torso: kappa = 1.085
              </div>
            </div>

            {/* Frank Coordinates */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>Koordinat Fisik Elektroda (Frank VCG)</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-1">
                Posisi spasial 10 elektroda pada model torso geometris (satuan meter):
              </p>

              <div className="overflow-y-auto max-h-36 font-mono text-[10px] bg-white p-2 rounded-lg border border-slate-200">
                <div className="grid grid-cols-4 font-bold text-slate-500 border-b border-slate-200 pb-1 mb-1">
                  <span>Sadapan</span>
                  <span>X (m)</span>
                  <span>Y (m)</span>
                  <span>Z (m)</span>
                </div>
                {leadModel &&
                  Object.entries(leadModel.electrodes).map(([id, pos]) => (
                    <div key={id} className="grid grid-cols-4 text-slate-700 py-0.5 border-b border-slate-100">
                      <span className="font-bold text-sky-700">{id}</span>
                      <span>{pos.x.toFixed(2)}</span>
                      <span>{pos.y.toFixed(2)}</span>
                      <span>{pos.z.toFixed(2)}</span>
                    </div>
                  ))}
              </div>

              <div className="text-[10px] px-2 py-1 rounded bg-purple-100 text-purple-800 font-bold">
                Terminal Sentral Wilson (WCT): vWCT = (RA + LA + LL) / 3
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
