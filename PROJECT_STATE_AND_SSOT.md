# PROJECT_STATE_AND_SSOT.md : Living Single Source of Truth
# Thaler EKG Academy & Clinical Idiograph Workstation

Last Updated: 2026-09-28
Repository: /root/cardiac-3d-ecg-simulator
Dev Server URL: http://localhost:5173/

---

## 1. Executive Status & Immediate Next Action

- Status: SOTA PIECEWISE COMPACT HERMITE SMOOTHSTEP (PCHS) BIOPHYSICAL WAVEFORM ENGINE & 100% GRID-LOCKED ECG WORKSTATION EMPIRICALLY VERIFIED AND PRODUCTION READY (Exit code 0 across TypeScript compilation, 7 verification suites totaling over 16,150 automated checks, and Vite production bundle compilation).
- Delivered Upgrades:
  1. Piecewise Compact Hermite Smoothstep (PCHS) Biophysical Engine (`thalerWaveformGenerator.ts`):
     * C^2 Quintic Basis Function: Replaced unconstrained infinite-tail Gaussians with $S_5(u) = 6u^5 - 15u^4 + 10u^3$, achieving zero boundary slope and zero curvature jumps.
     * Compact Support & True Isoelectric Baseline: Guarantees strictly $0.0000$ mV voltage across PR, ST (when normal), and TP segments, completely eliminating false ST elevation / depression artifacts.
     * Millimeter Grid Box Precision: P wave duration locked to exactly 80 ms (2.0 small boxes); QRS complex duration locked to exactly 80 ms (2.0 small boxes) in normal cases.
     * Sequential Non-Swallowing Q-R-S Deflections: Resolved flank cancellation in Lead II (Q strictly -0.04 mV, R strictly +1.30 mV, S strictly -0.10 mV) and eliminated the false QS pattern in Lead V1 (R strictly upright at +0.25 mV, S strictly -0.95 mV).
     * Continuous Arrhythmia Modeling: Replaced discontinuous saw-tooth in Atrial Flutter with smooth C^1 asymmetric Hermite waves (eliminating the 18 px cliff jump); applied dynamic QT scaling in AFib to eliminate the 13.4 px cliff jump at short RR intervals (0.38s).
     * Complete Heart Block Diastolic Stability: True $0.0000$ mV diastole between escape beats ($t \in [0.52, 1.76]$ s) with secondary discordant T wave repolarization.
     * Zero Cycle Boundary Jumps: $v(0) \equiv 0.0000$ mV and $v(beatInterval) \equiv 0.0000$ mV, producing an uninterrupted $C^2$ continuous waveform across all beat cycles.
  2. Rhythm Strip Baseline 5mm Bold Grid Locking (`thalerGeometry.ts` & `ThalerEcgCanvas.tsx`):
     * Locked `RHYTHM_BASELINE_PX = 825.0` (exactly on the 33rd 5mm bold grid line at 165 mm, resolving the 1 mm minor line offset from 820.0 px).
     * Synchronized canvas rendering and verification harness assertions.
  3. Clinical Cardiology & Diagnostic Flowchart Rectification:
     * In-Situ Caliper Axis Polarity: Fixed Case 10 (LBBB) axis calculation where Lead I (+11.0 mm) and aVF (-3.0 mm) correctly yield -15 degrees LAD. Fixed Case 8 (CHB) RAD calculation to +95 degrees.
     * Diagnostic Flowchart Routing: Corrected Prolonged QTc path to `case_severe_hypokalemia` (Step 3), Extreme Northwest Axis to `case_monomorphic_vt` (Step 4), Right Axis Deviation (RAD) to `case_pulmonary_embolism` (Step 4), and P-Pulmonale to `case_pulmonary_embolism` (Step 8).
     * Tutorial Step Synchronization: Case 7 (WPW Syndrome) English steps harmonized with Indonesian curriculum.
     * Caliper-to-Camera Focal Alignment: Repositioned 100 in-situ calipers to match camera focal frustums across Cases 7, 8, 9, 10, 11, 14, and 15.
  4. Mobile Responsive UI/UX & WAI-ARIA Accessibility:
     * Responsive Header: Removed duplicate button text, added horizontal scrolling with `no-scrollbar` to prevent 360px topbar blowout.
     * Touch Ergonomics: Enlarged floating zoom and pan buttons to 36px touch targets (`w-9 h-9 sm:w-8 sm:h-8`).
     * Anti iOS Safari Auto-Zoom: Dropdown selector font size set to `text-base sm:text-xs`.
     * Modal Dialog Overlays: All 6 modals enforce Escape key dismissal, `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
     * Number Parsing Guards: Hardened numeric parsing in `feedbackStorage.ts` with `Number.isFinite(...)`.

---

## 2. Verification & Static QA Summary

- Independent Test Harness Execution:
  * `npx tsc --noEmit`: 0 TypeScript errors (Exit code 0).
  * `verify_pchs_reality_check.ts`: 52 / 52 mathematical and preset invariants passed (Exit code 0).
  * `verify_thaler_academy.ts`: 1,380 / 1,380 biophysical tests passed across all cases (Exit code 0).
  * `verify_axis_and_practice.ts`: 348 / 348 tests passed (Exit code 0).
  * `verify_localization.ts`: 100% schema key parity (ID vs EN), zero empty strings, zero em-dashes, and dual-locale PDF export verified (Exit code 0).
  * `verify_adversarial.ts`: 14,382 / 14,382 adversarial destructive QA tests passed (Exit code 0).
  * `verify_engine.ts`: 18 / 18 biophysical invariants verified (Exit code 0).
  * `verify_onboarding.ts`: All onboarding persistence and lifecycle tests passed (Exit code 0).
  * `npm run build`: Production bundle built cleanly in 3.95s with zero errors.
- Strict Invariants:
  * Anti-Emdash Invariant: Exactly 0 Unicode character U+2014 occurrences across all source files, locales, tests, and documentation.
  * Zero Mock Invariant: Real 2,500 samples/lead biophysical waveforms at 250 Hz, 275mm grid integer locking.
  * Zero Free-Point Invariant: Students must explicitly select answers; empty fields award 0 points.
  * Zero Empty Handlers: No unhandled stub handlers or unhandled promises.

---

## 3. Physical File Map

- Biophysical Waveform Generation & Geometry:
  * [`src/engine/clinical/thaler/thalerWaveformGenerator.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerWaveformGenerator.ts): SOTA Piecewise Compact Hermite Smoothstep (PCHS) waveform synthesizer.
  * [`src/engine/clinical/thaler/thalerGeometry.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerGeometry.ts): Mathematical paper grid constants with RHYTHM_BASELINE_PX = 825.0 on the 33rd 5mm bold line.
  * [`verify_pchs_reality_check.ts`](file:///root/cardiac-3d-ecg-simulator/verify_pchs_reality_check.ts): Automated reality check verifying PCHS quintic continuity, isoelectric segments, and unswallowed QRS deflections.
- Clinical Engine & Cases:
  * [`src/engine/clinical/thaler/thalerCaliperMap.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerCaliperMap.ts): 100 in-situ calipers with corrected axis polarities and lead assignments.
  * [`src/engine/clinical/thaler/thalerCases.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerCases.ts): 21 clinical cases with synchronized tutorial steps and focal lead matching.
  * [`src/engine/clinical/thaler/thalerFlowchartData.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerFlowchartData.ts): Algorithmic decision tree with corrected pathological routing targets.
  * [`src/engine/clinical/thaler/thalerFoundations.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerFoundations.ts): Foundational waveform anatomy and paper grid steps.
  * [`src/engine/clinical/thaler/thalerTypes.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerTypes.ts): Strongly typed data contracts and clinical morphology types.
- UI Components & Views:
  * [`src/components/thaler/ThalerAcademyView.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerAcademyView.tsx): Master workstation view with responsive header and zoom guards.
  * [`src/components/thaler/ThalerEcgCanvas.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerEcgCanvas.tsx): 12-lead ECG canvas with pinch-to-zoom, pan, 36px touch targets, and 825px rhythm baseline locking.
  * [`src/components/thaler/ThalerPracticeDrill.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerPracticeDrill.tsx): 10-step practice mode with responsive discrepancy matrix.
  * [`src/components/thaler/ClinicalStepper.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalStepper.tsx): Clinical stepper with focus-visible navigation rings.
  * Modals: [`AxisQuadrantModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/AxisQuadrantModal.tsx), [`CaseCompletionModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/CaseCompletionModal.tsx), [`ClinicalCalculatorsModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalCalculatorsModal.tsx), [`ClinicalPocketCheatSheetModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalPocketCheatSheetModal.tsx), [`FeedbackModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/FeedbackModal.tsx), [`LeadTerritoryModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/LeadTerritoryModal.tsx).
- Storage & Export:
  * [`src/engine/storage/feedbackStorage.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/storage/feedbackStorage.ts): User engagement and feedback persistence with Number.isFinite verification.
  * [`src/engine/export/ThalerPdfExportEngine.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/export/ThalerPdfExportEngine.ts): Clinical PDF export engine with Web Share AbortError handling.
