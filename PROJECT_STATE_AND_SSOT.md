# PROJECT_STATE_AND_SSOT.md : Living Single Source of Truth
# Thaler EKG Academy & Clinical Idiograph Workstation

Last Updated: 2026-09-26
Repository: /root/cardiac-3d-ecg-simulator
Dev Server URL: http://localhost:5173/

---

## 1. Executive Status & Immediate Next Action

- Status: COMPREHENSIVE INTERNATIONAL CLINICAL ENGLISH LOCALIZATION & EMPIRICAL VERIFICATION COMPLETE (Exit code 0 across TypeScript compilation, dual-locale key parity, 1,380 biophysical tests, axis mathematics, onboarding, and PDF export engines).
- Localization Audit Scope & Deliverables Completed:
  1. Complete Case Repository Localization (21 Cases, 190 Tutorial Steps):
     * Foundational Anatomy (Case 0, 10 steps): 100% verified bilingual parity in `thalerFoundations.ts`.
     * Cases 1 to 20 (180 steps): Authentically translated and merged into `thalerCases.ts` adhering to Dr. Malcolm S. Thaler's clinical curriculum and ACC/AHA standards.
     * All 190 steps provide: `stepNameEn`, `clinicalFindingTitleEn`, `plainInstructionsEn`, `thalerRuleQuoteEn`, `relevantFormulaEn`, and `deepMechanismDetailsEn`.
     * All 21 cases provide: `titleEn`, `chiefComplaintEn`, and `rhythmDescriptionEn`.
  2. Full In-Situ Caliper Localization (100 Calipers across 20 Cases):
     * Verified in `thalerCaliperMap.ts`: every caliper includes `labelEn`, `calculationFormulaEn`, and `detailExplanationEn`.
     * Localized dynamically via `getLocalizedCaliper` in `thalerLocalization.ts`.
  3. Biophysics & 3D Viewport Localization:
     * `LeadFieldModel.ts`: Added `fullTitleEn` and `landmarkDescEn` for all 10 standard electrode landmarks (`RA`, `LA`, `RL`, `LL`, `V1` - `V6`).
     * `ElectrodeTray.tsx`: Connected `useLocale()`, localized all electrode titles, descriptions, action buttons (`attachAll`, `detachAll`), notices, and tooltips.
     * `Cardiac3DViewport.tsx`: Connected `useLocale()`, localized top control overlay, camera reset, lead wire visibility, and dipole toggles.
  4. 2D ECG Canvases & HUD Localization:
     * `EcgMultiLeadCanvas.tsx`: Connected `useLocale()`, localized ribbon mode indicator, paper speed, voltage gain, Cabrera sequence toggles, and caliper inspection tooltips.
     * `EcgRhythmStripPreview.tsx`: Connected `useLocale()`, localized 3-lead preview titles and lead select tooltips.
     * `CardiacPhaseBar.tsx`: Refactored to utilize direct localized short labels (`atrialShortLabel`, `ventricularShortLabel`, `diastoleShortLabel`), eliminating string split bugs.
     * `ClinicalSlideOverDrawer.tsx`: Localized drawer header and close button tooltips.
     * `useSimulationStore.ts`: Localized default diagnostic fallback headlines and bedside action labels.
  5. UI Views & Modals Locale Parity:
     * Verified `types.ts`, `id.ts`, and `en.ts` dictionary parity across 743 keys each across 20 clinical namespaces.
     * Zero missing keys, zero untranslated fallbacks in English mode.

---

## 2. Verification & Static QA Summary

- Independent Test Harness Execution:
  * `verify_localization.ts`: 100% schema key parity, zero em-dashes in dictionaries, and dual-locale PDF export verified (exit code 0).
  * `verify_axis_and_practice.ts`: 144 / 144 tests passed with 100% mathematical and clinical rigor (exit code 0).
  * `verify_onboarding.ts`: All tests passed for onboarding lifecycle, storage, and zero em-dashes (exit code 0).
  * `verify_thaler_academy.ts`: 1,380 / 1,380 biophysical tests passed across all 21 cases (2,500 samples/lead, zero NaN/Infinity, dynamic voltage validation) (exit code 0).
- Static Analysis & Production Build:
  * `npx tsc --noEmit`: Exit code 0 (zero TypeScript errors).
- Strict Invariants:
  * Anti-Emdash Invariant: Exactly 0 Unicode character U+2014 occurrences across all source files, locales, tests, and documentation. Verified via full AST/text scanner.
  * Zero Mock Invariant: Real 2,500 samples/lead biophysical waveforms at 250 Hz, 275mm grid integer locking (0.5000 px/sample).
  * Dual-Locale Invariant: Seamless client-side toggling between Indonesian (`id`) and English (`en`) with instantaneous reactive re-render. Zero Indonesian leakage in English mode.

---

## 3. Physical File Map

- Locales & i18n Architecture:
  * [`src/locales/types.ts`](file:///root/cardiac-3d-ecg-simulator/src/locales/types.ts): Comprehensive TypeScript translation contracts across 20 clinical namespaces.
  * [`src/locales/id.ts`](file:///root/cardiac-3d-ecg-simulator/src/locales/id.ts): Indonesian translation dictionary with authentic medical terminology (743 keys).
  * [`src/locales/en.ts`](file:///root/cardiac-3d-ecg-simulator/src/locales/en.ts): English translation dictionary with standard clinical nomenclature (743 keys).
  * [`src/locales/useLocale.tsx`](file:///root/cardiac-3d-ecg-simulator/src/locales/useLocale.tsx): React context and hook providing active locale and translation dictionary.
- Clinical Engine & Cases:
  * [`src/engine/clinical/thaler/thalerCases.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerCases.ts): 20 clinical cases with authentic waveforms, 180 fully translated steps, and caliper links.
  * [`src/engine/clinical/thaler/thalerFoundations.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerFoundations.ts): Case 0 Foundations (10 steps) with bilingual waveform geometry and Thaler rules.
  * [`src/engine/clinical/thaler/thalerCaliperMap.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerCaliperMap.ts): 100 in-situ calipers with bilingual labels, formulas, and explanations.
  * [`src/engine/clinical/thaler/thalerLocalization.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerLocalization.ts): Pure functional projection engine mapping cases, steps, calipers, flowcharts, and exemplars between `id` and `en`.
  * [`src/engine/clinical/thaler/thalerFlowchartData.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerFlowchartData.ts): 6-stage clinical decision flowchart with bilingual nodes and branches.
  * [`src/engine/clinical/thaler/thalerExemplarData.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerExemplarData.ts): Visual exemplar catalog with bilingual morphology clues and diagnostic criteria.
  * [`src/engine/clinical/thaler/thalerTypes.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/clinical/thaler/thalerTypes.ts): TypeScript interfaces for cases, steps, calipers, and tiers.
- 3D Viewport & Biophysics:
  * [`src/engine/biophysics/LeadFieldModel.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/biophysics/LeadFieldModel.ts): Electrode coordinates and bilingual landmark descriptions.
  * [`src/components/viewport3d/ElectrodeTray.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/viewport3d/ElectrodeTray.tsx): Interactive electrode tray with full bilingual labels.
  * [`src/components/viewport3d/Cardiac3DViewport.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/viewport3d/Cardiac3DViewport.tsx): Three.js 3D cardiac viewport with localized HUD controls.
- 2D ECG Canvases & HUD:
  * [`src/components/ecg/EcgMultiLeadCanvas.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/ecg/EcgMultiLeadCanvas.tsx): Multi-lead 2D canvas with localized ribbon mode, speed, and gain.
  * [`src/components/ecg/EcgRhythmStripPreview.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/ecg/EcgRhythmStripPreview.tsx): 3-lead rhythm strip preview with localized tooltips.
  * [`src/components/hud/CardiacPhaseBar.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/hud/CardiacPhaseBar.tsx): Cardiac cycle phase bar with localized short labels.
  * [`src/components/inspector/ClinicalSlideOverDrawer.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/inspector/ClinicalSlideOverDrawer.tsx): Clinical inspector drawer with localized headers.
- UI Views & Modals:
  * [`src/components/thaler/ThalerAcademyView.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerAcademyView.tsx): Master workstation view with locale switcher and tour launch guards.
  * [`src/components/thaler/ThalerPracticeDrill.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ThalerPracticeDrill.tsx): 6-stage practice mode with bilingual evaluation and discrepancy matrix.
  * [`src/components/thaler/WelcomeOnboardingModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/WelcomeOnboardingModal.tsx): Persona-gated welcome dialog.
  * [`src/components/thaler/InteractiveSpotlightTour.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/InteractiveSpotlightTour.tsx): 5-step coachmark spotlight tour.
  * [`src/components/thaler/ClinicalPocketCheatSheetModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalPocketCheatSheetModal.tsx): 4-tab clinical pocket guide.
  * [`src/components/thaler/ClinicalCalculatorsModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/ClinicalCalculatorsModal.tsx): Bedside clinical calculators.
  * [`src/components/thaler/VisualExemplarModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/VisualExemplarModal.tsx): Visual morphology exemplar atlas.
  * [`src/components/thaler/AxisQuadrantModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/AxisQuadrantModal.tsx): Interactive hexaxial axis modal.
  * [`src/components/thaler/DiagnosticFlowchartModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/DiagnosticFlowchartModal.tsx): Clinical decision flowchart modal.
  * [`src/components/thaler/FeedbackModal.tsx`](file:///root/cardiac-3d-ecg-simulator/src/components/thaler/FeedbackModal.tsx): Bilingual feedback modal with email relay and mailto fallback.
- Export Engine:
  * [`src/engine/export/ThalerPdfExportEngine.ts`](file:///root/cardiac-3d-ecg-simulator/src/engine/export/ThalerPdfExportEngine.ts): Dual-locale PDF generator for hospital strips, OSCE worksheets, and debrief reports.
- Verification Scripts:
  * [`verify_localization.ts`](file:///root/cardiac-3d-ecg-simulator/verify_localization.ts): Schema parity, zero em-dash, and dual-locale PDF export harness.
  * [`verify_axis_and_practice.ts`](file:///root/cardiac-3d-ecg-simulator/verify_axis_and_practice.ts): Mathematical projections and practice leak guards.
  * [`verify_onboarding.ts`](file:///root/cardiac-3d-ecg-simulator/verify_onboarding.ts): Onboarding storage and lifecycle verification.
  * [`verify_thaler_academy.ts`](file:///root/cardiac-3d-ecg-simulator/verify_thaler_academy.ts): 1,380 biophysical waveform and clinical integrity tests.
