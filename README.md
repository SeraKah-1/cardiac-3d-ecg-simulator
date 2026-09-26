# CardioSim 3D: 3D Cardiac Electrophysiology, 12-Lead ECG Simulator & Thaler Clinical Academy

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r182-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![i18n: ID & EN](https://img.shields.io/badge/i18n-Indonesian%20%7C%20English-emerald.svg)](#dual-locale-internationalization-id--en)
[![Tests Passed](https://img.shields.io/badge/Tests-15,925_Passed-emerald.svg)](#empirical-verification-suite)

An authentic, first-principles **3D Cardiac Electrophysiology Simulation Engine & Clinical ECG Workstation**. Built with pure rule-based biophysical modeling, volume conductor lead field theory, high-performance WebGL 2.0, and an exhaustive clinical interpretation curriculum grounded in Dr. Malcolm S. Thaler's *The Only EKG Book You'll Ever Need*.

Designed for medical students, cardiology fellows, emergency physicians, and biomedical engineers. Contains **zero mock logits**, **zero fake waveform shortcuts**, **zero dark-mode gamer aesthetics**, and **complete dual-locale internationalization (Indonesian & English)**.

---

## 1. System Architecture & Engineering Principles

```
+-----------------------------------------------------------------------------------------------------------------------+
| CARDIOSIM 3D: HIGH-PERFORMANCE BIOPHYSICAL & CLINICAL LEARNING WORKSTATION                                            |
+---------------------+---------------------+-----------------------+-------------------------+-------------------------+
| Biophysical Engine  | 500 Hz Sub-Stepping | Thaler Academy        | Dual-Locale (ID / EN)   | Adversarial QA Suite    |
+---------------------+---------------------+-----------------------+-------------------------+-------------------------+
| [VERIFIED]          | [VERIFIED]          | [VERIFIED]            | [VERIFIED]              | [VERIFIED]              |
| Multi-Oscillator    | dt = 2ms accumulator| 21 Cases / 190 Steps  | 100% Dictionary Parity  | 15,925 Tests Passed     |
| AFib, VFib, Asystole| 40 samples/QRS      | 100 In-Situ Calipers  | Zero Language Leaks     | 0 Type Errors (tsc -b)  |
| 3rd AVB, VT, TdP    | 0.1x to 1.0x Speed  | 6-Stage Practice Drill| ACC/AHA Terminology     | Zero Unicode U+2014     |
| Analytical ST Vector| Phase Bar & HUD     | Objective Scoring & DM| Vector PDF Generator    | Exit code 0             |
+---------------------+---------------------+-----------------------+-------------------------+-------------------------+
```

### 1.1 Authentic Hospital Clinical Aesthetic
- Styled strictly after hospital monitoring workstations (Philips IntelliVue, GE Healthcare, Mortara).
- Crisp, clinical **Light Theme** (`#f8fafc` slate-50, `#ffffff` card surfaces, `#e2e8f0` structural borders).
- Authentic **ivory-pink millimetric ECG paper** (`#fff7f7` with subtle red grid lines: 1 mm minor, 5 mm major) and high-contrast dark charcoal traces (`#0f172a`).

### 1.2 Volume Conductor Lead Field Formulation
The electrical potential $\Phi_i(t)$ recorded by any electrode $i$ on the 3D torso is derived from the heart's net electrical dipole moment $\vec{P}(t)$ in Frank VCG space (+X Left, +Y Inferior, +Z Posterior):
$$\Phi_i(t) = S \cdot (\vec{L}_i \cdot \vec{P}(t))$$
where:
- Torso transfer vector: $\vec{L}_i = \kappa \frac{\vec{r}_i - \vec{r}_0}{\|\vec{r}_i - \vec{r}_0\|^3}$ with transfer constant $\kappa = 1.085$.
- Biophysical dimensional scaling factor: $S = 0.05 = \frac{1}{20}$, calibrated to produce standard clinical voltages:
  - Lead II R-wave: $1.29\text{ mV}$ (Target: $1.0 - 1.5\text{ mV}$)
  - Lead II P-wave: $0.15\text{ mV}$ (Target: $0.15\text{ mV}$)
  - Lead II T-wave: $0.34\text{ mV}$ (Target: $0.35\text{ mV}$)
  - Acute LAD STEMI V2 ST elevation: $2.47\text{ mV}$ (Target: $2.47\text{ mV}$)

### 1.3 Universal Einthoven Invariant
For all 3D electrode positions and dynamic rhythms, the bipolar limb lead identity:
$$V_I(t) + V_{III}(t) \equiv V_{II}(t)$$
holds algebraically with numerical precision $< 5.55 \times 10^{-17}\text{ mV}$.

---

## 2. Thaler EKG Academy & Clinical Idiograph Workstation

The platform integrates a comprehensive clinical cardiology education and practice workstation structured after Dr. Malcolm S. Thaler's 9-step systematic method.

```
+---------------------------------------------------------------------------------------+
| THALER EKG ACADEMY: SYSTEMATIC 9-STEP CLINICAL WORKFLOW                               |
+---------------------------------------------------------------------------------------+
| 1. Standardization & Calibration  | 5 mm = 0.20 s, 10 mm = 1.0 mV (2 large boxes)     |
| 2. Heart Rate Determination       | 300 Rule, 1500 Rule, 6-Second Strip Method        |
| 3. Rhythm & Regularity            | Sinus P Waves, RR Regularity, AV Dissociation     |
| 4. Conduction Intervals           | PR Interval (120 - 200 ms), QTc (Bazett Formula)  |
| 5. Mean Electrical Axis           | Hexaxial Frontal Vector (Quadrant & Bipolar I/aVF)|
| 6. Pre-excitation & Conduction    | WPW Delta Waves, RBBB Rabbit Ears, LBBB Notching  |
| 7. Chamber Hypertrophy / Strain   | Sokolow-Lyon (S_V1 + R_V5 >= 35mm), Cornell Ratio |
| 8. Myocardial Infarction / Injury | ST Elevation, Reciprocal Depression, Pathologic Q |
| 9. Clinical Synthesis & Triage    | ACLS Emergency Protocol, Primary PCI, Electrolytes|
+---------------------------------------------------------------------------------------+
```

### 2.1 21 Comprehensive Clinical Cases (190 Tutorial Steps)
- **Case 0: Foundations of Waveform Anatomy & Paper Grid (10 Steps):** Interactive deconstruction of paper grid calibration (1 mm = 0.04 s, 5 mm = 0.20 s, 10 mm = 1.0 mV), heart rate rules, P waves, PR interval, QRS complex, J-point, ST segment, T wave, U wave, and 12-lead anatomical coverage.
- **Cases 1 to 20: Real Patient Clinical Dossiers (9 Steps each, 180 Steps):**
  1. *Normal Resting Sinus Rhythm* (Baseline physiology, 72 bpm)
  2. *Acute Inferior STEMI* (RCA occlusion with reciprocal ST depression in I, aVL)
  3. *Acute Extensive Anterior STEMI* (Proximal LAD occlusion with tombstone ST elevation)
  4. *Left Ventricular Hypertrophy with Strain* (Sokolow-Lyon >= 35 mm, asymmetric lateral ST-T strain)
  5. *Atrial Fibrillation with Rapid Ventricular Response* (Chaotic f-waves, irregularly irregular rhythm)
  6. *Atrial Flutter with 2:1 AV Block* (Sawtooth F-waves at 300 bpm, ventricular rate 150 bpm)
  7. *Wolff-Parkinson-White (WPW) Syndrome* (Short PR < 120 ms, slurred Delta wave)
  8. *Third-Degree (Complete) AV Block* (Complete AV dissociation, idioventricular escape)
  9. *Complete Right Bundle Branch Block* (QRS >= 120 ms, rSR' rabbit ears in V1, wide S in I/V6)
  10. *Complete Left Bundle Branch Block* (QRS >= 120 ms, broad notched R in I/V5/V6, QS in V1)
  11. *Severe Hyperkalemia* (Serum K+ 7.8 mEq/L, tall peaked tented T waves, widened QRS)
  12. *Benign Early Repolarization* (Widespread concave ST elevation with J-point fishhook notches)
  13. *Left Anterior Hemiblock* (Marked left axis deviation -60 degrees, qR in I/aVL, rS in II/III/aVF)
  14. *Acute Viral Pericarditis* (Diffuse upward-concave ST elevation, PR depression, Spodick sign)
  15. *Therapeutic Digoxin Effect* (Scooped sagging ST depression resembling Salvador Dali's mustache)
  16. *Monomorphic Ventricular Tachycardia* (Extreme northwest axis, AV dissociation, wide QRS 165 ms)
  17. *Acute True Posterior STEMI* (Mirror-image tall R waves and horizontal ST depression in V1 - V3)
  18. *Acute Massive Pulmonary Embolism* (McGinn-White S1Q3T3 pattern, acute RV strain, sinus tachycardia)
  19. *Brugada Syndrome Type 1* (Coved-type ST elevation >= 2 mm followed by negative T in V1/V2)
  20. *Severe Hypokalemia* (Serum K+ 1.9 mEq/L, giant U waves > 2 mm, pseudo-long QT interval)

### 2.2 100 In-Situ Digital Calipers
- Every clinical case features active millimeter/millivolt digital calipers overlaid on real waveforms (`src/engine/clinical/thaler/thalerCaliperMap.ts`).
- Provides precise measurement bounds, calculation formulas, and clinical explanations for paper calibration, rate calculation, conduction intervals, axis quadrant, and core pathognomonic features.

### 2.3 6-Stage Practice Drill Mode & Discrepancy Matrix
- **Blinded Patient Vignettes:** Practice mode conceals diagnostic labels and telemetry metrics, requiring students to interpret tracings independently.
- **Systematic Evaluation Form:** 6 interactive stages (Heart Rate, Rhythm, Axis, Intervals & Conduction, Ischemia & Infarction, Clinical Action).
- **Automated Objective Scoring:** Quantitative score (0 - 100 points) with competency tiers (Mastery, Competent, Developing, Needs Remediation).
- **Discrepancy Matrix:** Item-by-item contrast between user input and gold-standard clinical truth, highlighting missed critical red flags (e.g. failing to identify emergency PCI indications).

---

## 3. Dual-Locale Internationalization (ID & EN)

The platform provides a first-class, seamless bilingual experience:

```
+---------------------------------------------------------------------------------------+
| DUAL-LOCALE i18n ARCHITECTURE (INDONESIAN & ENGLISH)                                  |
+---------------------------------------------------------------------------------------+
| Schema Contract   | src/locales/types.ts (20 clinical namespaces, 743 keys each)       |
| Dictionaries      | src/locales/id.ts (Indonesian) & src/locales/en.ts (English)      |
| Reactive Context  | useLocale() hook with localStorage persistence & instant re-render|
| Leakage Audit     | Zero Indonesian text leakage in English mode (ACC/AHA compliant)  |
| Typography        | Exactly 0 Unicode character U+2014 (Anti-Emdash Invariant)        |
+---------------------------------------------------------------------------------------+
```

- **English Mode (`locale === 'en'`):** Uses high-grade clinical terminology adhering to ACC/AHA guidelines and Dr. Malcolm S. Thaler's clinical curriculum.
- **Indonesian Mode (`locale === 'id'`):** Uses authentic Indonesian medical terminology used across Indonesian medical faculties (FK) and teaching hospitals.
- **Complete Scope:** Cases, 190 tutorial steps, 100 calipers, 3D anatomical landmarks, 2D canvases, HUD controls, clinical drawer, modals, practice debriefs, and vector PDF exports.

---

## 4. Multi-Oscillator Arrhythmia Dynamics Engine

```
+--------------------------------------------------------------------------+
|                          CardiacDipoleEngine                             |
|  - rhythmType: RhythmType                                                |
|  - atrialOscillator: AtrialOscillator                                    |
|  - avConductionFilter: AVConductionFilter                                |
|  - ventricularGenerator: VentricularGenerator                            |
+--------------------------------------------------------------------------+
       |                         |                          |
       v                         v                          v
+--------------------+   +---------------------+   +-----------------------+
|  AtrialOscillator  |   | AVConductionFilter  |   | VentricularGenerator  |
|  - Sinus P-wave    |   | - Conduction delay  |   | - Narrow QRS (Sinus)  |
|  - AFib f-waves    |   | - Refractory ERP    |   | - Ectopic wide QRS    |
|  - AFlutter waves  |   | - Decremental block |   | - VFib 3D rotor       |
|  - Standstill      |   | - AV dissociation   |   | - TdP 3D precession   |
+--------------------+   +---------------------+   +-----------------------+
```

### Supported Arrhythmia Mechanisms
1. **Atrial Fibrillation (AFib RVR):** Chaotic micro-reentrant $f$-waves ($\sum_{k=1}^4 \mathbf{c}_k \sin(2\pi f_k t + \phi_k)$ at $5.7 - 8.6\text{ Hz}$).
2. **Ventricular Fibrillation (Coarse & Fine VFib):** Continuous 3D chaotic wandering rotor with asynchronous spatial harmonics ($6.2\text{ Hz}$, $7.4\text{ Hz}$, $5.1\text{ Hz}$).
3. **Asystole (Ventricular Flatline):** True isoelectric flatline bounded by calibrated sub-microvolt amplifier thermal noise ($0.008\text{ mV}$) and respiratory wander.
4. **Complete 3rd-Degree AV Block:** Independent dual oscillators: Atrial Sinus (75 bpm) and Idioventricular escape pacemaker (35 bpm, wide QRS $135\text{ ms}$).
5. **Monomorphic Ventricular Tachycardia (VT):** Rapid wide QRS ($165\text{ bpm}$, $165\text{ ms}$) with extreme northwest electrical axis and AV dissociation.
6. **Torsades de Pointes (Polymorphic VT):** Rapid wide complexes rotated by a dynamic **3D Rodrigues rotation operator** around axis $\mathbf{u} = \frac{1}{\sqrt{3}}(1, 1, 1)^T$.

---

## 5. Diagnostic Stability: Closed-Form Analytical ST Projection

CardioSim 3D calculates ST segment deviation and T-wave amplitudes **analytically in closed form** from the acute coronary ischemic injury vector:
$$\mathbf{P}_{\text{injury}} = \text{computeInjuryVector}(\text{factors})$$
$$\Delta V_{\text{ST}, i} = S \cdot (\vec{L}_i \cdot \mathbf{P}_{\text{injury}} - V_{\text{WCT, injury}})$$
- Re-evaluated reactively **only upon user parameter changes** (slider adjusted, preset loaded, or electrode repositioned).
- **Result:** Exactly **0 flickers across 100 consecutive evaluations**, providing a calm, authoritative medical workstation banner.

---

## 6. Clinical Tools & Modals

1. **Interactive Hexaxial Frontal Axis Wheel (`AxisQuadrantModal.tsx` & `AxisQuadrantWheel.tsx`):** Fullscreen interactive dial demonstrating Cabrera lead vectors, bipolar leads I & aVF polarity, and quadrant classification in real time.
2. **Clinical Pocket Cheat Sheet (`ClinicalPocketCheatSheetModal.tsx`):** 4-tab clinical reference guide covering rate formulas, interval norms, axis criteria, bundle branch blocks, hypertrophy voltage criteria, and STEMI localization territories.
3. **Bedside Clinical Calculators (`ClinicalCalculatorsModal.tsx`):** Interactive clinical calculators for Bazett / Fridericia QTc, Sokolow-Lyon / Cornell LVH criteria, and Sgarbossa criteria for acute MI in LBBB.
4. **Visual Exemplar Morphology Atlas (`VisualExemplarModal.tsx`):** High-contrast comparative morphology catalog contrasting normal variants, borderline patterns, and acute pathologies with callout clues.
5. **Diagnostic Decision Flowcharts (`DiagnosticFlowchartModal.tsx`):** 6-stage clinical decision flowchart guiding step-by-step differential diagnosis with clickable links to specific tutorial cases.
6. **Coronary Lead Territory Anatomy (`LeadTerritoryModal.tsx`):** Anatomical coronary artery map illustrating LAD, RCA, and LCx territories with reciprocal lead groupings.
7. **Hospital Vector PDF Exporter (`ThalerPdfExportEngine.ts`):** Client-side vector PDF generation producing authentic Hospital 12-Lead rhythm strips, blank OSCE student examination worksheets, and comprehensive practice debrief reports.
8. **Serverless Feedback Modal (`FeedbackModal.tsx`):** 5-star rating dialog with category tags, FormSubmit email relay to `farreladitya38@gmail.com`, and automatic mailto fallback.

---

## 7. Empirical Verification Suite

CardioSim 3D enforces strict automated verification gates across all codebase layers:

```bash
# Type-check TypeScript codebase
npx tsc --noEmit

# Run Localization & PDF Export Verification
npx tsx verify_localization.ts

# Run Mathematical Axis & Practice Mode Tests (144 tests)
npx tsx verify_axis_and_practice.ts

# Run Onboarding & Storage Lifecycle Tests (19 tests)
npx tsx verify_onboarding.ts

# Run Thaler Academy Biophysical Invariant Tests (1,380 tests)
npx tsx verify_thaler_academy.ts

# Run Adversarial Destructive QA Suite (14,382 tests)
npx tsx verify_adversarial.ts

# Run Production Build (tsc -b && vite build)
npm run build
```

### Verification Test Summary

| Test Harness | Scope & Verification Invariants | Result | Exit Code |
| :--- | :--- | :---: | :---: |
| **`npx tsc --noEmit`** | Full codebase static type checking across all components and engines | **PASS (0 errors)** | **0** |
| **`verify_localization.ts`** | 100% dictionary key parity (ID vs EN), zero empty strings, zero em-dashes, dual-locale PDF generator execution | **PASS** | **0** |
| **`verify_axis_and_practice.ts`** | 144 tests: Trigonometric lead field projections, practice mode data leak guards, critical discrepancy matrix alerts | **PASS (144/144)** | **0** |
| **`verify_onboarding.ts`** | 19 tests: Student vs Clinician role gating, spotlight tour step advancement, localStorage persistence, dismissal guards | **PASS (19/19)** | **0** |
| **`verify_thaler_academy.ts`** | 1,380 tests: All 20 clinical cases, 12 leads + Lead II rhythm strip at 2500 samples each, zero NaN/Infinity, dynamic voltage bounds | **PASS (1,380/1,380)** | **0** |
| **`verify_adversarial.ts`** | 14,382 tests: Detached electrode permutations, 50 Hz noise injection, accumulator stress, extreme K+ 9.0 sine waves, boundary clipping | **PASS (14,382/14,382)** | **0** |
| **Production Build** | `tsc -b && vite build`: Full production bundling and minification | **PASS (3.93s)** | **0** |
| **Anti-Emdash Invariant** | Automated scanner across all 67 files in `src/`: exactly 0 Unicode character U+2014 occurrences | **PASS (0 matches)** | **0** |

---

## 8. Quick Start & Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/SeraKah-1/cardiac-3d-ecg-simulator.git
cd cardiac-3d-ecg-simulator

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server with HMR
npm run dev
```
Open your browser at `http://localhost:5173`.

### Production Build & Preview
```
npm run build
npm run preview
```

---

## 9. Mobile & Responsive Clinical UI/UX Architecture

CardioSim 3D is designed for clinical workstations, tablets, and mobile devices (iOS Safari and Android Chrome):

```
+---------------------------------------------------------------------------------------+
| STATE-OF-THE-ART MOBILE & RESPONSIVE CLINICAL ARCHITECTURE                            |
+---------------------------------------------------------------------------------------+
| 1. Dynamic Viewport (100dvh)      | Prevents mobile browser address bar clipping      |
| 2. Notch & Safe-Area Padding      | Integrates env(safe-area-inset-*) top & bottom    |
| 3. Zero-Trapping Tab Switcher     | [EKG Canvas] / [Reasoning] toggle (< 768px)       |
| 4. Unified Pointer Dragging       | touch-action: none + pointer capture for calipers |
| 5. Anti-Auto-Zoom Typography      | 16px mobile input font preventing iOS zoom        |
| 6. Mobile Navigation Drawer       | Slide-over drawer for modes, inspector, and audio |
| 7. Responsive Electrode Tray      | Auto-collapses on mobile to preserve 3D canvas    |
| 8. CanvasPattern Memoization      | Eliminates 120 allocations/sec in animation loop  |
| 9. Web Share API Fallback         | Native system share sheet for PDF exports         |
+---------------------------------------------------------------------------------------+
```

### 9.1 Segmented Mobile Viewport (Zero-Trapping Guarantee)
In narrow portrait viewports (< 768px), stacking the 12-lead canvas and clinical reasoning panel vertically causes bottom navigation buttons to clip offscreen. CardioSim 3D implements a responsive Segmented Tab Switcher (`[ EKG Canvas ]` | `[ Reasoning ]`):
- **EKG Canvas Mode**: Provides an unobstructed, full-height 12-lead paper canvas with pinch-zoom, pan, digital calipers, and quick step advancement buttons.
- **Reasoning Mode**: Provides full-height, comfortable reading of the clinical reasoning panel, Thaler rules, and unclipped access to "Previous", "Next", and "Complete Case" actions.
- On desktop and tablet viewports (>= 768px), both stages seamlessly render side-by-side.

### 9.2 Mobile Biophysical Performance
- **DPR Capping**: Canvas device pixel ratio is bounded at `min(window.devicePixelRatio, 2.0)` to eliminate GPU fill-rate throttling and thermal strain on high-density mobile screens.
- **Memoized Grid Pattern**: Millimetric paper background generation is memoized via a `Map<number, CanvasPattern>`, eliminating repetitive offscreen canvas allocations during 60 FPS rendering.
- **Audio Gesture Unlock**: Transparent window pointer listener unlocks Web Audio (`AudioContext`) on the first mobile touch.

---

## 10. Project Structure

```
cardiac-3d-ecg-simulator/
├── src/
│   ├── engine/
│   │   ├── biophysics/
│   │   │   ├── CardiacDipoleEngine.ts      # 3D dipole generator & multi-oscillator arrhythmias
│   │   │   ├── LeadFieldModel.ts           # Torso volume conductor & analytical ST features
│   │   │   └── types.ts                    # Vector3D, LeadId, RhythmType, ClinicalFactors
│   │   ├── clinical/
│   │   │   ├── DiagnosticRuleEngine.ts     # 2-second triage, AHA/ESC clinical rules
│   │   │   ├── presets.ts                  # 12 authentic patient scenarios & dossiers
│   │   │   └── thaler/
│   │   │       ├── thalerCases.ts          # 20 clinical cases, 180 fully translated steps
│   │   │       ├── thalerFoundations.ts    # Case 0 Foundations (10 steps) waveform anatomy
│   │   │       ├── thalerCaliperMap.ts     # 100 in-situ calipers with bilingual annotations
│   │   │       ├── thalerLocalization.ts   # Functional projection engine between ID and EN
│   │   │       ├── thalerFlowchartData.ts  # 6-stage clinical decision flowchart nodes
│   │   │       ├── thalerExemplarData.ts   # Morphology exemplar catalog with diagnostic criteria
│   │   │       ├── thalerGeometry.ts       # Lead bounds & camera target calculations
│   │   │       ├── thalerTypes.ts          # TypeScript interfaces for cases, steps, and tiers
│   │   │       └── thalerWaveformGenerator.ts # Analytical waveform synthesis engine
│   │   ├── export/
│   │   │   └── ThalerPdfExportEngine.ts    # Dual-locale PDF generator (strips, OSCE, debrief)
│   │   ├── storage/
│   │   │   └── onboardingStorage.ts        # LocalStorage helpers for onboarding & feedback
│   │   └── audio/
│   │       └── CardiacAudioEngine.ts       # Web Audio QRS beeps & IEC 60601-1-8 alarms
│   ├── locales/
│   │   ├── types.ts                        # TypeScript translation contracts (20 namespaces)
│   │   ├── id.ts                           # Indonesian translation dictionary (743 keys)
│   │   ├── en.ts                           # English translation dictionary (743 keys)
│   │   └── useLocale.tsx                   # React Context provider & hook
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppHeader.tsx               # Streamlined header, triage pill, and mode switch
│   │   ├── hud/
│   │   │   ├── CardiacPhaseBar.tsx         # Cardiac cycle phase bar with localized labels
│   │   │   └── TimeSpeedHUD.tsx            # Play/Pause, Step 50ms, 0.1x to 1.0x speed controls
│   │   ├── viewport3d/
│   │   │   ├── Cardiac3DViewport.tsx       # Three.js canvas & OrbitControls
│   │   │   ├── TorsoMesh.tsx               # Translucent shell, ribs 1-12, sternum, clavicles
│   │   │   ├── HeartMesh.tsx               # Chambers, coronary branches, ischemic cyanosis
│   │   │   ├── ElectrodeTray.tsx           # Collapsible side-docked electrode tray
│   │   │   └── ElectrodesManager.tsx       # 35mm magnetic snapping & raycast isolation
│   │   ├── ecg/
│   │   │   ├── EcgMultiLeadCanvas.tsx      # 12-lead millimetric grid, Mode B/C layouts
│   │   │   ├── EcgRingBuffer.ts            # Zero-allocation circular sample buffers
│   │   │   └── EcgRhythmStripPreview.tsx   # Compact 3-lead rhythm strip preview
│   │   ├── inspector/
│   │   │   └── ClinicalSlideOverDrawer.tsx # Slide-over drawer with rhythm & scenario selector
│   │   └── thaler/
│   │       ├── ThalerAcademyView.tsx       # Master workstation view coordinating tools & tabs
│   │       ├── ThalerPracticeDrill.tsx     # 6-stage blinded practice mode & scoring
│   │       ├── ThalerEcgCanvas.tsx         # 12-lead paper canvas with digital calipers
│   │       ├── ThalerIdiographPanel.tsx    # Swiss clinical reasoning panel (2-second triage)
│   │       ├── ClinicalStepper.tsx         # Horizontal diagnostic clinical stepper
│   │       ├── AxisQuadrantModal.tsx       # Fullscreen interactive axis modal
│   │       ├── AxisQuadrantWheel.tsx       # Hexaxial vector dial component
│   │       ├── ClinicalPocketCheatSheetModal.tsx # 4-tab clinical pocket guide
│   │       ├── ClinicalCalculatorsModal.tsx # Bedside calculators (QTc, LVH, Sgarbossa)
│   │       ├── VisualExemplarModal.tsx     # Morphology exemplar atlas
│   │       ├── DiagnosticFlowchartModal.tsx # Clinical decision flowchart modal
│   │       ├── LeadTerritoryModal.tsx      # Coronary artery anatomical territory map
│   │       ├── CaseCompletionModal.tsx     # Case completion celebration modal
│   │       ├── FeedbackModal.tsx           # 5-star rating & email feedback relay
│   │       ├── WelcomeOnboardingModal.tsx  # Persona-gated welcome dialog
│   │       └── InteractiveSpotlightTour.tsx # 5-step coachmark spotlight overlay
│   ├── store/
│   │   └── useSimulationStore.ts           # Zustand reactive simulation state
│   ├── App.tsx                             # Master workspace coordinator
│   └── main.tsx                            # Application entry point
├── verify_localization.ts                  # Bilingual schema parity & PDF export harness
├── verify_axis_and_practice.ts             # Mathematical projections & practice leak tests
├── verify_onboarding.ts                    # Onboarding lifecycle & storage tests
├── verify_thaler_academy.ts                # 1,380 biophysical waveform & clinical tests
├── verify_engine.ts                        # Biophysical invariant & arrhythmia tests
├── verify_adversarial.ts                   # 14,382 adversarial destructive QA tests
└── package.json
```

---

## 11. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
