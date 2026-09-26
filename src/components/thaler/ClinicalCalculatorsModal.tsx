/**
 * Clinical Bedside Calculators Modal
 * 4 interactive bedside cardiology tools:
 * 1. QTc Bazett & Fridericia + Bedside Half-RR Rule
 * 2. LVH Matrix: Sokolow-Lyon & Cornell Voltage criteria
 * 3. Smith-Modified Sgarbossa Checklist for acute MI in LBBB
 * 4. Brugada 4-Step Decision Tree for Wide Complex Tachycardia (VT vs SVT)
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState } from 'react';
import { X, Calculator, Heart, ShieldAlert, GitBranch, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { EKGCase } from '../../engine/clinical/thaler/thalerTypes';
import { useLocale } from '../../locales/useLocale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentCase?: EKGCase;
}

type CalcTab = 'QTC' | 'LVH' | 'SGARBOSSA' | 'BRUGADA_WCT';

export const ClinicalCalculatorsModal: React.FC<Props> = ({ isOpen, onClose, currentCase }) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<CalcTab>('QTC');

  // 1. QTc Calculator States
  const [qtMs, setQtMs] = useState<number>(currentCase?.metrics.qtcIntervalMs ? Math.round(currentCase.metrics.qtcIntervalMs * 0.9) : 380);
  const [hrBpm, setHrBpm] = useState<number>(currentCase?.metrics.heartRateBpm || 75);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female'>(currentCase?.patient.gender || 'Male');

  // 2. LVH States
  const [sV1, setSV1] = useState<number>(14);
  const [rV5, setRV5] = useState<number>(18);
  const [rAvL, setRAvL] = useState<number>(9);
  const [sV3, setSV3] = useState<number>(12);
  const [lvhGender, setLvhGender] = useState<'Male' | 'Female'>(currentCase?.patient.gender || 'Male');

  // 3. Sgarbossa States
  const [sgConcordantElev, setSgConcordantElev] = useState<boolean>(false);
  const [sgConcordantDepr, setSgConcordantDepr] = useState<boolean>(false);
  const [sgDiscordantStMm, setSgDiscordantStMm] = useState<number>(3);
  const [sgDiscordantSMm, setSgDiscordantSMm] = useState<number>(14);

  // 4. Brugada WCT States
  const [brStep1AbsentRS, setBrStep1AbsentRS] = useState<boolean | null>(null);
  const [brStep2RsOver100, setBrStep2RsOver100] = useState<boolean | null>(null);
  const [brStep3AvDissoc, setBrStep3AvDissoc] = useState<boolean | null>(null);
  const [brStep4Morphology, setBrStep4Morphology] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const calcs = t.calculators;

  // QTc calculations
  const rrSec = hrBpm > 0 ? 60 / hrBpm : 0.8;
  const qtcBazett = rrSec > 0 ? Math.round(qtMs / Math.sqrt(rrSec)) : 0;
  const qtcFridericia = rrSec > 0 ? Math.round(qtMs / Math.cbrt(rrSec)) : 0;
  const halfRrMs = Math.round((rrSec * 1000) / 2);
  const isHalfRrProlonged = qtMs > halfRrMs;
  const qtcUpperLimit = patientGender === 'Male' ? 440 : 460;
  const isQtcProlonged = qtcBazett > qtcUpperLimit;
  const isQtcCritical = qtcBazett > 500;

  // LVH calculations
  const sokolowSum = sV1 + rV5;
  const isSokolowPositive = sokolowSum >= 35 || rAvL >= 11;
  const cornellSum = rAvL + sV3;
  const cornellCutoff = lvhGender === 'Male' ? 28 : 20;
  const isCornellPositive = cornellSum > cornellCutoff;

  // Sgarbossa calculations
  const smithRatio = sgDiscordantSMm > 0 ? sgDiscordantStMm / sgDiscordantSMm : 0;
  const isSmithPositive = smithRatio >= 0.25;
  const sgarbossaScore = (sgConcordantElev ? 5 : 0) + (sgConcordantDepr ? 3 : 0);
  const isSgarbossaPositive = sgarbossaScore >= 3 || isSmithPositive;

  // Brugada conclusion
  let brugadaDiagnosis = calcs.brugadaWaiting;
  let brugadaIsVT = false;
  if (brStep1AbsentRS === true) {
    brugadaDiagnosis = calcs.brugadaStep1Diagnosis;
    brugadaIsVT = true;
  } else if (brStep1AbsentRS === false) {
    if (brStep2RsOver100 === true) {
      brugadaDiagnosis = calcs.brugadaStep2Diagnosis;
      brugadaIsVT = true;
    } else if (brStep2RsOver100 === false) {
      if (brStep3AvDissoc === true) {
        brugadaDiagnosis = calcs.brugadaStep3Diagnosis;
        brugadaIsVT = true;
      } else if (brStep3AvDissoc === false) {
        if (brStep4Morphology === true) {
          brugadaDiagnosis = calcs.brugadaStep4Diagnosis;
          brugadaIsVT = true;
        } else if (brStep4Morphology === false) {
          brugadaDiagnosis = calcs.brugadaAberrantDiagnosis;
          brugadaIsVT = false;
        }
      }
    }
  }

  const handleSyncPatient = () => {
    if (!currentCase) return;
    const safeHr = Math.max(20, currentCase.metrics.heartRateBpm || 75);
    setHrBpm(safeHr);
    setQtMs(Math.round(currentCase.metrics.qtcIntervalMs * Math.sqrt(60 / safeHr)));
    setPatientGender(currentCase.patient.gender);
    setLvhGender(currentCase.patient.gender);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">{calcs.modalTitle}</h2>
              <p className="text-[11px] text-stone-400">{calcs.modalSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentCase && (
              <button
                onClick={handleSyncPatient}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded border border-stone-700 flex items-center space-x-1.5 transition cursor-pointer"
                title={calcs.syncPatientBtn}
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">{calcs.syncPatientBtn}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title={t.common.closeEsc}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-5 py-2 bg-stone-50 border-b border-stone-200 flex items-center space-x-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('QTC')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'QTC' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{calcs.tabQtc}</span>
          </button>
          <button
            onClick={() => setActiveTab('LVH')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'LVH' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{calcs.tabLvh}</span>
          </button>
          <button
            onClick={() => setActiveTab('SGARBOSSA')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'SGARBOSSA' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{calcs.tabSgarbossa}</span>
          </button>
          <button
            onClick={() => setActiveTab('BRUGADA_WCT')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'BRUGADA_WCT' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{calcs.tabBrugada}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans text-stone-800">
          {/* TAB 1: QTc Calculator */}
          {activeTab === 'QTC' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <h3 className="font-bold text-stone-900 border-b border-stone-200 pb-1.5">{calcs.inputParams}</h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {calcs.rawQt}: <span className="font-mono text-blue-700">{qtMs} ms</span> ({Math.round(qtMs / 40)} {t.telemetry.smallBoxUnit})
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="650"
                      step="5"
                      value={qtMs}
                      onChange={(e) => setQtMs(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {calcs.hrBpm}: <span className="font-mono text-blue-700">{hrBpm} bpm</span>
                    </label>
                    <input
                      type="range"
                      min="35"
                      max="180"
                      step="1"
                      value={hrBpm}
                      onChange={(e) => setHrBpm(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">{calcs.patientSex}</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPatientGender('Male')}
                        className={`flex-1 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                          patientGender === 'Male' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {calcs.maleThreshold}
                      </button>
                      <button
                        onClick={() => setPatientGender('Female')}
                        className={`flex-1 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                          patientGender === 'Female' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {calcs.femaleThreshold}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hasil Perhitungan Formula */}
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <h3 className="font-bold text-stone-900 border-b border-stone-200 pb-1.5">{calcs.resultsHeader}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-stone-200">
                      <div>
                        <div className="font-bold text-stone-900 text-xs">{calcs.bazettFormula}</div>
                        <div className="text-[10px] text-stone-500">QT / sqrt(RR)</div>
                      </div>
                      <span className={`text-base font-mono font-bold ${isQtcProlonged ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {qtcBazett} ms
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 bg-white rounded border border-stone-200">
                      <div>
                        <div className="font-bold text-stone-900 text-xs">{calcs.fridericiaFormula}</div>
                        <div className="text-[10px] text-stone-500">QT / cbrt(RR)</div>
                      </div>
                      <span className="text-base font-mono font-bold text-stone-800">
                        {qtcFridericia} ms
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded border border-stone-200 text-[11px] text-stone-600">
                      <div>{calcs.rrInterval}: <span className="font-mono font-semibold">{rrSec.toFixed(2)} s</span> ({Math.round(rrSec * 1000)} ms)</div>
                    </div>
                  </div>
                </div>

                {/* Bedside Half-RR Rule */}
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <h3 className="font-bold text-stone-900 border-b border-stone-200 pb-1.5">{calcs.halfRrRuleTitle}</h3>
                  <div className="p-2.5 bg-white rounded border border-stone-200 space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span>{calcs.halfRrMidpoint}:</span>
                      <span className="font-mono font-bold">{halfRrMs} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{calcs.tWaveEndPos}:</span>
                      <span className="font-mono font-bold">{qtMs} ms</span>
                    </div>
                    <div className={`p-1.5 rounded text-center font-bold ${
                      isHalfRrProlonged ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isHalfRrProlonged ? calcs.tWaveExceeds : calcs.tWaveNormal}
                    </div>
                  </div>
                  {isQtcCritical && (
                    <div className="p-2 bg-rose-600 text-white rounded text-[11px] font-bold">
                      {calcs.qtcCriticalWarning}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LVH Matrix */}
          {activeTab === 'LVH' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sokolow-Lyon Criteria */}
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-1.5">
                    <h3 className="font-bold text-stone-900">{calcs.sokolowTitle}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSokolowPositive ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isSokolowPositive ? calcs.sokolowPos : calcs.sokolowNeg}
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        {calcs.sV1Depth}: <span className="font-mono text-blue-700">{sV1} mm ({(sV1 * 0.1).toFixed(1)} mV)</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={sV1}
                        onChange={(e) => setSV1(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        {calcs.rV5V6Height}: <span className="font-mono text-blue-700">{rV5} mm ({(rV5 * 0.1).toFixed(1)} mV)</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={rV5}
                        onChange={(e) => setRV5(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        {calcs.raVLHeight}: <span className="font-mono text-blue-700">{rAvL} mm</span> {calcs.raVLCutoffHint}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={rAvL}
                        onChange={(e) => setRAvL(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div className="p-2.5 bg-white rounded border border-stone-200 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{calcs.sokolowTotal}:</span>
                        <span className={`font-mono ${sokolowSum >= 35 ? 'text-rose-600' : 'text-stone-800'}`}>
                          {sokolowSum} mm / {calcs.sokolowCutoffHint}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500">{calcs.sokolowNote}</p>
                    </div>
                  </div>
                </div>

                {/* Cornell Voltage Criteria */}
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-1.5">
                    <h3 className="font-bold text-stone-900">{calcs.cornellTitle}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCornellPositive ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isCornellPositive ? calcs.sokolowPos : calcs.sokolowNeg}
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setLvhGender('Male')}
                        className={`flex-1 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                          lvhGender === 'Male' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {calcs.cornellMale}
                      </button>
                      <button
                        onClick={() => setLvhGender('Female')}
                        className={`flex-1 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                          lvhGender === 'Female' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {calcs.cornellFemale}
                      </button>
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        {calcs.sV3Depth}: <span className="font-mono text-blue-700">{sV3} mm</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={sV3}
                        onChange={(e) => setSV3(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div className="p-2.5 bg-white rounded border border-stone-200 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{calcs.cornellTotal}:</span>
                        <span className={`font-mono ${cornellSum > cornellCutoff ? 'text-rose-600' : 'text-stone-800'}`}>
                          {cornellSum} mm / {calcs.cornellCutoffHint} {cornellCutoff} mm
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500">{calcs.cornellNote}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Smith-Modified Sgarbossa */}
          {activeTab === 'SGARBOSSA' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                {calcs.sgIndication}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                {/* Rule 1 */}
                <div
                  onClick={() => setSgConcordantElev(!sgConcordantElev)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    sgConcordantElev ? 'bg-rose-50 border-rose-400 shadow-xs' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <input
                      type="checkbox"
                      checked={sgConcordantElev}
                      onChange={(e) => setSgConcordantElev(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-stone-900">{calcs.sgRule1Title}</span>
                  </div>
                  <p className="text-stone-600">{calcs.sgRule1Desc}</p>
                  <div className="mt-2 font-mono font-bold text-rose-700">{calcs.sgRule1Points}</div>
                </div>

                {/* Rule 2 */}
                <div
                  onClick={() => setSgConcordantDepr(!sgConcordantDepr)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    sgConcordantDepr ? 'bg-rose-50 border-rose-400 shadow-xs' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <input
                      type="checkbox"
                      checked={sgConcordantDepr}
                      onChange={(e) => setSgConcordantDepr(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-stone-900">{calcs.sgRule2Title}</span>
                  </div>
                  <p className="text-stone-600">{calcs.sgRule2Desc}</p>
                  <div className="mt-2 font-mono font-bold text-rose-700">{calcs.sgRule2Points}</div>
                </div>

                {/* Rule 3 (Smith Modified) */}
                <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{calcs.sgRule3Title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isSmithPositive ? 'bg-rose-600 text-white' : 'bg-stone-200 text-stone-700'}`}>
                      {isSmithPositive ? calcs.badgePositive : calcs.badgeNegative}
                    </span>
                  </div>
                  <p className="text-stone-600">{calcs.sgRule3Desc}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>{calcs.sgDiscordantStLabel}:</span>
                      <span className="font-mono font-semibold">{sgDiscordantStMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={sgDiscordantStMm}
                      onChange={(e) => setSgDiscordantStMm(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between">
                      <span>{calcs.sgDiscordantSLabel}:</span>
                      <span className="font-mono font-semibold">{sgDiscordantSMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="35"
                      value={sgDiscordantSMm}
                      onChange={(e) => setSgDiscordantSMm(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="pt-1 font-mono font-bold flex justify-between">
                      <span>{calcs.sgRatio}:</span>
                      <span className={isSmithPositive ? 'text-rose-600' : 'text-stone-700'}>{smithRatio.toFixed(2)} (&gt;= 0.25)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sgarbossa Verdict Card */}
              <div className={`p-4 rounded-lg border flex items-center justify-between ${
                isSgarbossaPositive ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <div>
                  <div className="font-bold text-sm">
                    {isSgarbossaPositive ? calcs.sgPositiveVerdict : calcs.sgNegativeVerdict}
                  </div>
                  <p className="text-xs mt-0.5 text-stone-600">
                    {isSgarbossaPositive ? calcs.sgCathRecommendation : calcs.sgMonitorRecommendation}
                  </p>
                </div>
                <div className="font-mono text-base font-bold">
                  {calcs.sgScorePoints(sgarbossaScore)} {isSmithPositive ? calcs.sgScoreSmithBonus : ''}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Brugada 4-Step WCT Decision Tree */}
          {activeTab === 'BRUGADA_WCT' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                {calcs.brugadaObjective}
              </div>

              {/* Step 1 */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <div className="font-bold text-stone-900 text-xs">
                  {calcs.brugadaStep1}
                </div>
                <p className="text-[11px] text-stone-600">
                  {calcs.brugadaStep1Subtext}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setBrStep1AbsentRS(true)}
                    className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                      brStep1AbsentRS === true ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    {calcs.brugadaStep1Yes}
                  </button>
                  <button
                    onClick={() => setBrStep1AbsentRS(false)}
                    className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                      brStep1AbsentRS === false ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    {calcs.brugadaStep1No}
                  </button>
                </div>
              </div>

              {/* Step 2 (Shown only if Step 1 is No) */}
              {brStep1AbsentRS === false && (
                <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2 animate-in fade-in">
                  <div className="font-bold text-stone-900 text-xs">
                    {calcs.brugadaStep2}
                  </div>
                  <p className="text-[11px] text-stone-600">
                    {calcs.brugadaStep2Subtext}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBrStep2RsOver100(true)}
                      className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                        brStep2RsOver100 === true ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {calcs.brugadaStep2Yes}
                    </button>
                    <button
                      onClick={() => setBrStep2RsOver100(false)}
                      className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                        brStep2RsOver100 === false ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {calcs.brugadaStep2No}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 (Shown only if Step 2 is No) */}
              {brStep1AbsentRS === false && brStep2RsOver100 === false && (
                <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2 animate-in fade-in">
                  <div className="font-bold text-stone-900 text-xs">
                    {calcs.brugadaStep3}
                  </div>
                  <p className="text-[11px] text-stone-600">
                    {calcs.brugadaStep3Subtext}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBrStep3AvDissoc(true)}
                      className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                        brStep3AvDissoc === true ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {calcs.brugadaStep3Yes}
                    </button>
                    <button
                      onClick={() => setBrStep3AvDissoc(false)}
                      className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                        brStep3AvDissoc === false ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {calcs.brugadaStep3No}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4 (Shown only if Step 3 is No) */}
              {brStep1AbsentRS === false && brStep2RsOver100 === false && brStep3AvDissoc === false && (
                <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2 animate-in fade-in">
                  <div className="font-bold text-stone-900 text-xs">
                    {calcs.brugadaStep4}
                  </div>
                  <p className="text-[11px] text-stone-600">
                    {calcs.brugadaStep4Subtext}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBrStep4Morphology(true)}
                      className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                        brStep4Morphology === true ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {calcs.brugadaStep4Yes}
                    </button>
                    <button
                      onClick={() => setBrStep4Morphology(false)}
                      className={`px-3 py-1 text-xs rounded border transition cursor-pointer font-semibold ${
                        brStep4Morphology === false ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {calcs.brugadaStep4No}
                    </button>
                  </div>
                </div>
              )}

              {/* Brugada Verdict */}
              <div className={`p-4 rounded-lg border flex items-center justify-between ${
                brugadaIsVT ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-stone-50 border-stone-300 text-stone-900'
              }`}>
                <div>
                  <div className="font-bold text-sm">{calcs.brugadaConclusion}:</div>
                  <p className="text-xs mt-0.5 font-semibold text-stone-700">{brugadaDiagnosis}</p>
                </div>
                <button
                  onClick={() => {
                    setBrStep1AbsentRS(null);
                    setBrStep2RsOver100(null);
                    setBrStep3AvDissoc(null);
                    setBrStep4Morphology(null);
                  }}
                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded transition cursor-pointer"
                >
                  {calcs.brugadaResetBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0 text-[11px] text-stone-500">
          <span>{calcs.footerNote}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded transition cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
