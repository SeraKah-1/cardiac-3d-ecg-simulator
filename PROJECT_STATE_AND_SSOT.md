# PROJECT_STATE_AND_SSOT.md : Living Single Source of Truth
# Thaler EKG Academy & Clinical Idiograph Workstation

Last Updated: 2026-09-27
Repository: /root/cardiac-3d-ecg-simulator
Dev Server URL: http://localhost:5173/

---

## 1. Executive Status & Immediate Next Action

- Status: CLINICAL CARDIOLOGY, MOBILE RESPONSIVE UI/UX, WAI-ARIA ACCESSIBILITY & BIOPHYSICAL WAVEFORM REFACTORING 100% EMPIRICALLY VERIFIED AND PRODUCTION READY (Exit code 0 across TypeScript compilation, 6 verification suites totaling over 16,100 automated checks, and Vite production bundle compilation).
- Delivered Upgrades:
  1. Clinical Cardiology & Diagnostic Flowchart Rectification:
     * In-Situ Caliper Axis Polarity: Fixed Case 10 (LBBB) axis calculation where Lead I (+11.0 mm) and aVF (-3.0 mm) correctly yield -15 degrees LAD, resolving a physiological contradiction. Fixed Case 8 (Complete Heart Block) RAD calculation to +95 degrees across Indonesian and English descriptions.
     * Diagnostic Flowchart Routing: Corrected Prolonged QTc path to `case_severe_hypokalemia` (Step 3), Extreme Northwest Axis to `case_monomorphic_vt` (Step 4), Right Axis Deviation (RAD) to `case_pulmonary_embolism` (Step 4), and P-Pulmonale to `case_pulmonary_embolism` (Step 8).
     * Case 7 (WPW Syndrome) Step Synchronization: Harmonized English tutorial step ordering with Indonesian curriculum (Step 4 Delta Wave, Step 5 Frontal Axis, Step 6 Rhythm, Step 7 Conduction Block).
     * Caliper-to-Camera Focal Alignment: Repositioned core pathology calipers across Cases 7, 8, 9, 10, 11, 14, and 15 so that in-situ annotations align directly with the active 3D camera focal lead frustum, eliminating out-of-frame clipping.
  2. Biophysical Waveform Generation & Repolarization Smoothing:
     * High Heart Rate Presets: Implemented rate-shortened QT intervals and calibrated repolarization windows across Ventricular Tachycardia (165 BPM), Atrial Flutter 2:1 (150 BPM), Atrial Fibrillation RVR (135 BPM), Pulmonary Embolism (115 BPM), and Anterior STEMI (104 BPM), eliminating beat boundary cliff jumps.
     * Complete Heart Block Escape Pacemaker: Added secondary discordant T wave repolarization to idioventricular escape beats, matching physiological electrophysiology.
  3. Mobile Responsive UI/UX & Collision Prevention:
     * Academy View Header: Removed duplicate button text, added horizontal scrolling with `no-scrollbar` to prevent topbar blowout on narrow viewports (360px).
     * Font Size Guard: Set case selector dropdown typography to `text-base sm:text-xs`, preventing mobile Safari and WebKit automatic page zooming.
     * Touch Ergonomics: Enlarged floating zoom and pan buttons to 36px touch targets (`w-9 h-9 sm:w-8 sm:h-8`, `touch-manipulation`), complying with mobile touch guidelines.
     * OSCE Discrepancy Matrix: Converted 9-stage discrepancy cards from cramped 2 columns to responsive single column on mobile (`grid-cols-1 sm:grid-cols-2`).
     * Reactive Localization: Bound `locale` into ECG rendering dependencies for instant re-render upon language toggle.
  4. WAI-ARIA Accessibility & Robust Storage:
     * Modal Dialog Overlays: Audited all 6 modals (`ClinicalPocketCheatSheetModal`, `ClinicalCalculatorsModal`, `LeadTerritoryModal`, `FeedbackModal`, `AxisQuadrantModal`, `CaseCompletionModal`), enforcing Escape key dismissal, `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes.
     * PDF Export Web Share Guard: Caught `AbortError` on `navigator.share` to prevent unwanted secondary file downloads upon user dismissal of the native share sheet.
     * Number Parsing Guards: Hardened numeric parsing in `feedbackStorage.ts` with `Number.isFinite(...)` to prevent `NaN` bypass of snooze cooldowns.

---

## 2. Verification & Static QA Summary

- Independent Test Harness Execution:
  * `npx tsc --noEmit`: 0 TypeScript errors (Exit code 0).
  * `verify_axis_and_practice.ts`: 348 / 348 tests passed (Exit code 0).
  * `verify_localization.ts`: 100% schema key parity (ID vs EN), zero empty strings, zero em-dashes, and dual-locale PDF export verified (Exit code 0).
  * `verify_thaler_academy.ts`: 1,380 / 1,380 biophysical tests passed across all cases (Exit code 0).
  * `verify_adversarial.ts`: 14,382 / 14,382 adversarial destructive QA tests passed (Exit code 0).
  * `verify_engine.ts`: 18 / 18 biophysical invariants verified (Exit code 0).
  * `verify_onboarding.ts`: All onboarding persistence and lifecycle tests passed (Exit code 0).
  * `npm run build`: Production bundle built cleanly in 2.63s with zero errors.
- Strict Invariants:
  * Anti-Emdash Invariant: Exactly 0 Unicode character U+2014 occurrences across all source files, locales, tests, and documentation.
  * Zero Mock Invariant: Real 2,500 samples/lead biophysical waveforms at 250 Hz, 275mm grid integer locking.
  * Zero Free-Point Invariant: Students must explicitly select answers; empty fields award 0 points.
  * Zero Empty Handlers: No unhandled stub handlers or unhandled promises.

---

## 3. Physical File Map

- Clinical Engine & Waveform Generation:
  * [`src/engine/clinical/thaler/thalerCaliperMap.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerCaliperMap.ts): 100 in-situ calipers with corrected axis polarities and lead assignments.
  * [`src/engine/clinical/thaler/thalerCases.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerCases.ts): 21 clinical cases with synchronized tutorial steps and focal lead matching.
  * [`src/engine/clinical/thaler/thalerFlowchartData.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerFlowchartData.ts): Algorithmic decision tree with corrected pathological routing targets.
  * [`src/engine/clinical/thaler/thalerWaveformGenerator.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerWaveformGenerator.ts): Biophysical lead synthesizer with rate-shortened QT intervals and escape repolarization.
  * [`src/engine/clinical/thaler/thalerFoundations.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerFoundations.ts): Foundational waveform anatomy and paper grid steps.
  * [`src/engine/clinical/thaler/thalerTypes.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerTypes.ts): Strongly typed data contracts and clinical morphology types.
- UI Components & Views:
  * [`src/components/thaler/ThalerAcademyView.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerAcademyView.tsx): Master workstation view with responsive header and zoom guards.
  * [`src/components/thaler/ThalerEcgCanvas.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerEcgCanvas.tsx): 12-lead ECG canvas with pinch-to-zoom, pan, 36px touch targets, and locale-reactive rendering.
  * [`src/components/thaler/ThalerPracticeDrill.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerPracticeDrill.tsx): 10-step practice mode with responsive discrepancy matrix.
  * [`src/components/thaler/ClinicalStepper.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalStepper.tsx): Clinical stepper with focus-visible navigation rings.
  * Modals: [`AxisQuadrantModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/AxisQuadrantModal.tsx), [`CaseCompletionModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/CaseCompletionModal.tsx), [`ClinicalCalculatorsModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalCalculatorsModal.tsx), [`ClinicalPocketCheatSheetModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalPocketCheatSheetModal.tsx), [`FeedbackModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/FeedbackModal.tsx), [`LeadTerritoryModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/LeadTerritoryModal.tsx).
- Storage & Export:
  * [`src/engine/storage/feedbackStorage.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/storage/feedbackStorage.ts): User engagement and feedback persistence with Number.isFinite verification.
  * [`src/engine/export/ThalerPdfExportEngine.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/export/ThalerPdfExportEngine.ts): Clinical PDF export engine with Web Share AbortError handling.
