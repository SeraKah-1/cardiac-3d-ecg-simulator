# PROJECT_STATE_AND_SSOT.md : Living Single Source of Truth
# Thaler EKG Academy & Clinical Idiograph Workstation

Last Updated: 2026-09-27
Repository: /root/cardiac-3d-ecg-simulator
Dev Server URL: http://localhost:5173/

---

## 1. Executive Status & Immediate Next Action

- Status: GOLD-STANDARD 10-STEP SYSTEMATIC CLINICAL SEQUENCE & MULTI-TOUCH PINCH-TO-ZOOM DEPLOYED AND FULLY VERIFIED (Exit code 0 across TypeScript compilation, 348 verification suite tests, 1,380 biophysical tests, 100% localization key parity, and clean production build).
- Delivered Upgrades:
  1. Definitive 10-Step ECG Interpretation Sequence (`ThalerPracticeDrill.tsx`):
     * Step 1: Technical Preflight & Calibration (Speed 25/50 mm/s, Voltage 10/5/20 mm/mV, Lead aVR negative verification).
     * Step 2: Heart Rate Determination (Numeric BPM, Bradycardia/Normal/Tachycardia categorization).
     * Step 3: Cardiac Rhythm & Regularity (Regular, Irregular, Irregularly Irregular, Rhythm origin).
     * Step 4: Frontal Plane Electrical Axis & Lead II Confirmation (Normal, LAD with Lead II confirmation, RAD, Extreme).
     * Step 5: P-Wave Morphology & Atrial Enlargement (Normal sinus, Ectopic, Retrograde, Absent/f-waves, Flutter, Dissociated; RAE/P-pulmonale, LAE/P-mitrale, Biatrial).
     * Step 6: Conduction Intervals & AV Blocks (PR interval normal/prolonged/shortened/absent, Sex-specific QTc cutoffs >450M / >460F ms).
     * Step 7: QRS Complex Duration & Bundle Branch Blocks (Narrow <120 ms vs Wide >=120 ms; Complete RBBB, Complete LBBB, WPW pre-excitation).
     * Step 8: Precordial R-Wave Progression & Pathological Q Waves (Normal V3-V4 transition, PRWP, Early transition, Reversed; Pathological Q waves in contiguous leads).
     * Step 9: ST-Segment, T-Wave & U-Wave Repolarization (Isoelectric, STEMI elevation, Ischemia depression; T normal, deep symmetrical inversion, peaked tented, flat; U normal, prominent >1.5 mm in hypokalemia, inverted).
     * Step 10: Anatomical Vascular Territories, Triage & Definitive Diagnosis (Inferior, Anteroseptal, Lateral, Posterior, Diffuse; Normal, Non-significant Variant, Pathologic Urgent; Definitive diagnosis text).
  2. Multi-Touch Pinch-to-Zoom & Pan Gesture Engine (`ThalerEcgCanvas.tsx`):
     * Two-finger pinch-to-zoom with continuous distance ratio tracking and scale clamping (1.0x to 4.0x).
     * Centroid-aware scaling and seamless 1-finger pan transition when lifting one finger (Bug A resolved).
     * Floating zoom toolbar pill with dynamic zoom indicator, reset to fit, and mouse-wheel support.
  3. Structured Ground-Truth Clinical Data Schema (`thalerTypes.ts` & `thalerCases.ts`):
     * Added strongly typed fields: `pWaveMorphology`, `atrialEnlargement`, `ventricularHypertrophy`, `bundleBranchBlock`, `rWaveProgression`, and `uWaveStatus`.
     * Populated all 21 cases (Case 0 through 20) with 100% verified clinical ground truth.
     * Eliminated all brittle string-matching heuristics in practice drill scoring.
  4. Scoring Integrity & Safety Guards:
     * Bug C resolved: Empty answers no longer award free points (explicit user selection required).
     * Bug D resolved: QTc prolonged thresholds parameterized to sex-specific clinical cutoffs (male > 450 ms, female > 460 ms, critical > 500 ms).
     * Perfect 100-point rubric (10 points per step).

---

## 2. Verification & Static QA Summary

- Independent Test Harness Execution:
  * `verify_axis_and_practice.ts`: 348 / 348 tests passed (Exit code 0).
  * `verify_localization.ts`: 100% schema key parity (ID vs EN), zero empty strings, zero em-dashes, and dual-locale PDF export verified (Exit code 0).
  * `verify_thaler_academy.ts`: 1,380 / 1,380 biophysical tests passed across all 21 cases (Exit code 0).
  * `verify_onboarding.ts`: All tests passed for onboarding storage and lifecycle (Exit code 0).
  * `npx tsc --noEmit`: 0 TypeScript errors (Exit code 0).
  * `npm run build`: Production bundle built in 3.71s with zero errors.
- Strict Invariants:
  * Anti-Emdash Invariant: Exactly 0 Unicode character U+2014 occurrences across all source files, locales, tests, and documentation.
  * Zero Mock Invariant: Real 2,500 samples/lead biophysical waveforms at 250 Hz, 275mm grid integer locking.
  * Zero Free-Point Invariant: Students must explicitly select answers; empty fields award 0 points.

---

## 3. Physical File Map

- Locales & i18n Architecture:
  * [`src/locales/types.ts`](file:///root/cardiac-3d-ecg-simulator/src/locales/types.ts): TypeScript translation contracts for all 10 clinical sequence steps.
  * [`src/locales/id.ts`](file:///root/cardiac-3d-ecg-simulator/src/locales/id.ts): Indonesian translation dictionary with 10-step keys.
  * [`src/locales/en.ts`](file:///root/cardiac-3d-ecg-simulator/src/locales/en.ts): English translation dictionary with 10-step keys.
  * [`src/locales/useLocale.tsx`](file:///root/cardiac-3d-ecg-simulator/src/locales/useLocale.tsx): React context and hook for reactive locale switching.
- Clinical Engine & Cases:
  * [`src/engine/clinical/thaler/thalerCases.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerCases.ts): 21 cases with structured 10-step ground-truth metrics.
  * [`src/engine/clinical/thaler/thalerFoundations.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerFoundations.ts): Case 0 Foundations (10 steps) with wave anatomy.
  * [`src/engine/clinical/thaler/thalerTypes.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerTypes.ts): TypeScript interfaces with new morphology types.
- UI Views & Canvases:
  * [`src/components/thaler/ThalerPracticeDrill.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerPracticeDrill.tsx): 10-step practice mode with side-by-side discrepancy matrix.
  * [`src/components/thaler/ThalerEcgCanvas.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerEcgCanvas.tsx): Multi-touch pinch-to-zoom, pan, and zoom controls.
  * [`src/components/thaler/ClinicalStepper.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalStepper.tsx): Clinical stepper with 1-based indexing.
  * [`src/components/thaler/ThalerAcademyView.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerAcademyView.tsx): Master workstation view.
- Export Engine & Verification:
  * [`src/engine/export/ThalerPdfExportEngine.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/export/ThalerPdfExportEngine.ts): Dual-locale PDF generator for strips and worksheets.
  * [`verify_axis_and_practice.ts`](file:///root/cardiac-3d-ecg-simulator/verify_axis_and_practice.ts): 348 mathematical, biophysical, and 10-step invariant tests.
  * [`verify_localization.ts`](file:///root/cardiac-3d-ecg-simulator/verify_localization.ts): Dual-locale parity and zero em-dash verification.
  * [`verify_thaler_academy.ts`](file:///root/cardiac-3d-ecg-simulator/verify_thaler_academy.ts): 1,380 biophysical waveform tests.
