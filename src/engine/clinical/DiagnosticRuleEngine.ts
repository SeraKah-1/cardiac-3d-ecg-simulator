import { LeadId, ClinicalFactors } from '../biophysics/types';

export interface MeasuredECGFeatures {
  heartRate: number;         // BPM
  prIntervalMs: number;      // ms
  qrsDurationMs: number;     // ms
  qtIntervalMs: number;      // ms
  qtcBazettMs: number;       // ms
  qtcFridericiaMs: number;   // ms
  stDeviationMv: Record<LeadId, number>; // ST deviation at J+60ms in mV
  tWaveAmplitudeMv: Record<LeadId, number>;
  factors: ClinicalFactors;
  electrodeMisplacement?: boolean;
}

export interface DiagnosticReport {
  rhythm: string;
  conduction: string[];
  infarctionIschemia: string;
  culpritArtery: string | null;
  electrolyteAlerts: string[];
  urgencyLevel: 'Normal' | 'Observation' | 'Urgent' | 'Critical Cath Lab Alert';
  triageCategory: 'green' | 'yellow' | 'red';
  primaryHeadline: string;
  bedsideActions: string[];
  allStatements: string[];
}

/**
 * Deterministic Clinical Diagnostic Rule Engine
 * Evaluates physiological criteria based on the Fourth Universal Definition of MI,
 * AHA/ACC/ESC recommendations, and electrolyte electrophysiology.
 * Strictly formatted without AI slop or em-dashes.
 */
export class DiagnosticRuleEngine {
  public static evaluate(features: MeasuredECGFeatures): DiagnosticReport {
    const statements: string[] = [];
    let urgency: 'Normal' | 'Observation' | 'Urgent' | 'Critical Cath Lab Alert' = 'Normal';

    // -------------------------------------------------------------
    // 1. Rate & Rhythm Classification
    // -------------------------------------------------------------
    let rhythmStr = 'Normal Sinus Rhythm';
    const hr = features.heartRate;
    const rhythmType = features.factors.rhythmType || 'sinus';

    if (rhythmType === 'vfib_coarse' || rhythmType === 'vfib_fine') {
      rhythmStr = 'Fibrilasi Ventrikel (VFib) - Henti Jantung Letal';
      urgency = 'Critical Cath Lab Alert';
    } else if (rhythmType === 'asystole') {
      rhythmStr = 'Asistol (Flatline) - Henti Jantung Tanpa Denyut';
      urgency = 'Critical Cath Lab Alert';
    } else if (rhythmType === 'av_block_3rd') {
      rhythmStr = 'Total AV Block (Derajat 3) - Disosiasi AV Lengkap';
      urgency = 'Critical Cath Lab Alert';
    } else if (rhythmType === 'vtach') {
      rhythmStr = 'Takikardia Ventrikel (VT) - Kompleks QRS Lebar';
      urgency = 'Critical Cath Lab Alert';
    } else if (rhythmType === 'torsades') {
      rhythmStr = 'Torsades de Pointes (VT Polimorfik) - Sindrom Long QT';
      urgency = 'Critical Cath Lab Alert';
    } else if (rhythmType === 'afib') {
      rhythmStr = 'Fibrilasi Atrium (AFib) - Respon Ventrikel Cepat/Bervariasi';
      urgency = hr > 110 ? 'Urgent' : 'Observation';
    } else if (rhythmType === 'aflutter') {
      rhythmStr = 'Flutter Atrium (AFlutter) - Gelombang Gigi Gergaji';
      urgency = 'Observation';
    } else if (features.factors.serumPotassium > 8.5) {
      rhythmStr = 'Severe Hyperkalemic Sine Wave (Imminent Arrest)';
      urgency = 'Critical Cath Lab Alert';
    } else if (hr < 50) {
      rhythmStr = 'Sinus Bradycardia';
      urgency = 'Observation';
    } else if (hr >= 50 && hr < 60) {
      rhythmStr = 'Mild Sinus Bradycardia';
    } else if (hr > 100 && hr <= 140) {
      rhythmStr = 'Sinus Tachycardia';
      urgency = 'Observation';
    } else if (hr > 140) {
      rhythmStr = 'Marked Sinus Tachycardia / SVT';
      urgency = 'Urgent';
    }

    statements.push(rhythmStr);

    // -------------------------------------------------------------
    // 2. Conduction Blocks (AV & Bundle Branch)
    // -------------------------------------------------------------
    const conductionList: string[] = [];

    // AV Block evaluation
    if (features.prIntervalMs > 200) {
      const msg = `First-Degree AV Block (PR: ${Math.round(features.prIntervalMs)} ms)`;
      conductionList.push(msg);
      statements.push(msg);
    } else if (features.prIntervalMs < 115) {
      const msg = `Accelerated AV Conduction / Short PR (${Math.round(features.prIntervalMs)} ms)`;
      conductionList.push(msg);
      statements.push(msg);
    }

    // Intraventricular conduction delay
    if (features.qrsDurationMs >= 120) {
      const msg = `Intraventricular Conduction Delay (Wide QRS: ${Math.round(features.qrsDurationMs)} ms)`;
      conductionList.push(msg);
      statements.push(msg);
    }

    // -------------------------------------------------------------
    // 3. Acute Ischemia & Infarction Matrix
    // -------------------------------------------------------------
    let infarctionStr = 'No Acute Ischemic ST Changes';
    let culpritArtery: string | null = null;
    const st = features.stDeviationMv;

    // Criteria: V2, V3 >= 0.20 mV; Other leads >= 0.10 mV in >= 2 contiguous leads
    const steV1 = (st['V1'] || 0) >= 0.12;
    const steV2 = (st['V2'] || 0) >= 0.20;
    const steV3 = (st['V3'] || 0) >= 0.20;
    const steV4 = (st['V4'] || 0) >= 0.10;
    const steV5 = (st['V5'] || 0) >= 0.10;
    const steV6 = (st['V6'] || 0) >= 0.10;

    const steI   = (st['I'] || 0) >= 0.10;
    const steAVL = (st['aVL'] || 0) >= 0.10;

    const steII  = (st['II'] || 0) >= 0.10;
    const steIII = (st['III'] || 0) >= 0.10;
    const steAVF = (st['aVF'] || 0) >= 0.10;

    const hasAnteriorSTEMI = (steV1 && steV2) || (steV2 && steV3) || (steV3 && steV4);
    const hasInferiorSTEMI = (steII && steIII) || (steIII && steAVF) || (steII && steAVF);
    const hasLateralSTEMI  = (steI && steAVL) || (steV5 && steV6);

    if (hasAnteriorSTEMI && hasLateralSTEMI) {
      infarctionStr = 'STEMI Anterior Ekstensif (V1-V6, I, aVL)';
      culpritArtery = 'Proximal Left Anterior Descending (LAD)';
      urgency = 'Critical Cath Lab Alert';
    } else if (hasAnteriorSTEMI) {
      infarctionStr = 'STEMI Anteroseptal Akut (V1-V4)';
      culpritArtery = 'Left Anterior Descending (LAD)';
      urgency = 'Critical Cath Lab Alert';
    } else if (hasInferiorSTEMI) {
      infarctionStr = 'STEMI Inferior Akut (II, III, aVF)';
      culpritArtery = 'Right Coronary Artery (RCA)';
      urgency = 'Critical Cath Lab Alert';
    } else if (hasLateralSTEMI) {
      infarctionStr = 'STEMI Lateral Akut (I, aVL, V5-V6)';
      culpritArtery = 'Left Circumflex (LCx)';
      urgency = 'Critical Cath Lab Alert';
    } else {
      // Check for Subendocardial Ischemia (ST depression >= 0.05 mV in >= 2 leads)
      let stdCount = 0;
      const leadKeys: LeadId[] = ['I', 'II', 'III', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
      for (const ld of leadKeys) {
        if ((st[ld] || 0) <= -0.05) stdCount++;
      }

      if (stdCount >= 2) {
        if (features.factors.hsTroponinT > 14) {
          infarctionStr = 'Non-ST-Elevation Myocardial Infarction (NSTEMI) with Active Ischemia';
          urgency = 'Urgent';
        } else {
          infarctionStr = 'Subendocardial Ischemia / Unstable Angina (Troponin Normal)';
          urgency = 'Observation';
        }
      } else if (features.factors.hsTroponinT > 14) {
        infarctionStr = 'Elevated Troponin (Myocardial Injury / NSTEMI Rule-In)';
        urgency = 'Urgent';
      }
    }

    if (infarctionStr !== 'No Acute Ischemic ST Changes') {
      statements.push(infarctionStr);
    }

    // -------------------------------------------------------------
    // 4. Electrolyte Alerts
    // -------------------------------------------------------------
    const electrolyteAlerts: string[] = [];
    const k = features.factors.serumPotassium;
    const ca = features.factors.serumCalcium;

    if (k > 8.5) {
      const msg = 'Hiperkalemia Ekstrem (>8.5 mmol/L) - Pola Gelombang Sinus';
      electrolyteAlerts.push(msg);
      statements.push(msg);
    } else if (k >= 7.0) {
      const msg = `Hiperkalemia Berat (${k.toFixed(1)} mmol/L) - Pelebaran QRS & Hilangnya Gelombang P`;
      electrolyteAlerts.push(msg);
      statements.push(msg);
    } else if (k >= 5.5) {
      const msg = `Hiperkalemia (${k.toFixed(1)} mmol/L) - Gelombang T Lancip (Tented T)`;
      electrolyteAlerts.push(msg);
      statements.push(msg);
    } else if (k < 3.0) {
      const msg = `Hipokalemia Berat (${k.toFixed(1)} mmol/L) - Gelombang U Prominen`;
      electrolyteAlerts.push(msg);
      statements.push(msg);
    } else if (k < 3.5) {
      const msg = `Hipokalemia Ringan (${k.toFixed(1)} mmol/L) - Perataan Gelombang T`;
      electrolyteAlerts.push(msg);
      statements.push(msg);
    }

    if (ca > 11.5) {
      const msg = `Hiperkalsemia (${ca.toFixed(1)} mg/dL) - Pemendekan ST / Pemendekan QTc`;
      electrolyteAlerts.push(msg);
      statements.push(msg);
    } else if (ca < 8.0) {
      const msg = `Hipokalsemia (${ca.toFixed(1)} mg/dL) - Pemanjangan ST Isoelektrik / QTc Memanjang`;
      electrolyteAlerts.push(msg);
      statements.push(msg);
    }

    // Repolarization QTc note
    if (features.qtcBazettMs > 470) {
      statements.push(`Prolonged QTc Interval (${Math.round(features.qtcBazettMs)} ms)`);
    }

    // -------------------------------------------------------------
    // 5. Idiograph Triage Category, Primary Headline & Bedside Actions
    // -------------------------------------------------------------
    let triageCategory: 'green' | 'yellow' | 'red' = 'green';
    let primaryHeadline = 'Irama Sinus Normal - Tanpa Perubahan Iskemik Akut';
    let bedsideActions: string[] = [
      'Edukasi gaya hidup sehat dan pencegahan kardiovaskular',
      'Tidak diperlukan intervensi kegawatdaruratan saat ini',
      'Arsipkan rekaman EKG sebagai data dasar baseline pasien',
    ];

    if (rhythmType === 'vfib_coarse' || rhythmType === 'vfib_fine') {
      triageCategory = 'red';
      primaryHeadline = 'Fibrilasi Ventrikel (VFib) - Henti Jantung Letal';
      bedsideActions = [
        'RJP / CPR Segera 30:2 atau kompresi dada kontinu 100-120x/menit',
        'Defibrilasi CITO 200J Bifasik (Shockable Rhythm)',
        'Epinefrin 1 mg IV bolus tiap 3-5 menit',
        'Amiodaron 300 mg IV bolus jika refrakter setelah shock ke-3',
        'Pastikan patensi jalan nafas dan ventilasi oksigen 100%',
      ];
    } else if (rhythmType === 'asystole') {
      triageCategory = 'red';
      primaryHeadline = 'Asistol (Flatline) - Henti Jantung Tanpa Denyut';
      bedsideActions = [
        'RJP / CPR Kualitas Tinggi Segera (100-120x/menit)',
        'Epinefrin 1 mg IV tiap 3-5 menit',
        'JANGAN LAKUKAN DEFIBRILASI (Non-Shockable Rhythm)',
        'Cari dan tangani penyebab reversibel 5H & 5T (Hipoksia, Hipovolemia, dll)',
        'Konfirmasi flatline pada minimal 2 sadapan EKG berbeda',
      ];
    } else if (rhythmType === 'av_block_3rd') {
      triageCategory = 'red';
      primaryHeadline = 'Total AV Block (Derajat 3) - Disosiasi AV Lengkap';
      bedsideActions = [
        'Pasang Pacu Jantung Transkutan (TCP) Cito',
        'Sulfas Atropin 1 mg IV (dapat diulang hingga maks 3 mg)',
        'Infus Dopamin 5-20 mcg/kgBB/menit atau Epinefrin 2-10 mcg/menit',
        'Konsultasi Kardiovaskular Cito untuk Pemasangan Pacemaker Permanen (PPM)',
        'Monitor tanda hipoperfusi otak dan syok kardiogenik',
      ];
    } else if (rhythmType === 'vtach') {
      triageCategory = 'red';
      primaryHeadline = 'Takikardia Ventrikel (VT Monomorfik) - QRS Lebar';
      bedsideActions = [
        'Cek Nadi & Hemodinamik: Jika Pulseless lakukan Defibrilasi 200J Segera',
        'Jika Tidak Stabil (Hipotensi/Syok): Kardioversi Tersinkronisasi 100J',
        'Jika Stabil: Amiodaron 150 mg IV dalam 10 menit',
        'Siapkan intubasi dan akses vena sentral',
      ];
    } else if (rhythmType === 'torsades') {
      triageCategory = 'red';
      primaryHeadline = 'Torsades de Pointes (VT Polimorfik) - Sindrom Long QT';
      bedsideActions = [
        'Magnesium Sulfat 2 gram IV bolus dalam 1-2 menit',
        'Defibrilasi Bifasik Segera jika pasien pulseless / henti jantung',
        'Hentikan segera seluruh obat yang memperpanjang interval QT',
        'Overdrive pacing atau infus Isoproterenol untuk menaikkan denyut jantung jika bradikardia',
      ];
    } else if (rhythmType === 'afib') {
      triageCategory = 'yellow';
      primaryHeadline = hr > 110
        ? `Fibrilasi Atrium (AFib RVR) - Respon Ventrikel Cepat (${hr} BPM)`
        : 'Fibrilasi Atrium (AFib) - Respon Ventrikel Terkontrol';
      bedsideActions = [
        'Evaluasi kestabilan hemodinamik (tekanan darah, akral, kesadaran)',
        'Kontrol Laju (Rate Control): Diltiazem IV atau Beta-blocker (Bisoprolol/Metoprolol)',
        'Stratifikasi risiko tromboemboli (Skor CHA2DS2-VASc) & inisiasi antikoagulasi',
        'Evaluasi onset aritmia (< 48 jam vs > 48 jam) sebelum opsi kardioversi',
      ];
    } else if (rhythmType === 'aflutter') {
      triageCategory = 'yellow';
      primaryHeadline = 'Flutter Atrium (AFlutter) - Gelombang Gigi Gergaji';
      bedsideActions = [
        'Kontrol laju respon ventrikel dengan penghambat nodus AV',
        'Evaluasi kardioversi listrik tersinkronisasi 50-100J',
        'Skrining antikoagulasi profilaksis',
      ];
    } else if (k > 8.5) {
      triageCategory = 'red';
      primaryHeadline = 'Hiperkalemia Ekstrem (>8.5 mmol/L) - Pola Gelombang Sinus';
      bedsideActions = [
        'Kalsium Glukonat 10% 10-20 mL IV pelan 2-3 menit (stabilisasi membran miokard)',
        'Insulin Cepat 10 IU dalam Dextrose 50% 50 mL IV bolus cepat (shift K+ intrasel)',
        'Salbutamol / Albuterol 10-20 mg nebulisasi kontinu',
        'Siapkan Hemodialisis Cito / Rujuk segera ke Faskes Terpadu',
        'Pasang monitor EKG kontinu dan siapkan troli resusitasi',
      ];
    } else if (k >= 7.0) {
      triageCategory = 'red';
      primaryHeadline = `Hiperkalemia Berat (${k.toFixed(1)} mmol/L) - Risiko Aritmia Letal`;
      bedsideActions = [
        'Kalsium Glukonat 10% 10 mL IV lambat (ulangi 5-10 menit jika EKG belum normal)',
        'Regulasi Cepat Insulin 10 IU + D50% 50 mL IV (atau D40% 50 mL)',
        'Nebulisasi Beta-2 Agonis (Salbutamol 10-20 mg)',
        'Konsul Nefrologi / Rujuk segera untuk Hemodialisis darurat',
        'Hentikan seluruh asupan kalium dan obat hemat kalium (ACEi/ARB/Spironolakton)',
      ];
    } else if (hasAnteriorSTEMI && hasLateralSTEMI) {
      triageCategory = 'red';
      primaryHeadline = 'STEMI Anterior Ekstensif (LAD Proksimal) - Oklusi Total';
      bedsideActions = [
        'Aktivasi Jalur Reperfusi Segera (Target Door-to-Needle <30 menit atau Door-to-Balloon <90 menit)',
        'Loading Dosis Ganda Antiplatelet: Aspirin 160-320 mg kunyah + Clopidogrel 300-600 mg (atau Ticagrelor 180 mg)',
        'Terapi Oksigen jika SpO2 < 90% (target 94-98%)',
        'Akses IV ganda, Nitrogliserin SL jika TD > 90 mmHg tanpa kontraindikasi',
        'Rujuk segera ke Pusat Pelayanan Jantung Terpadu / Cath Lab',
      ];
    } else if (hasAnteriorSTEMI) {
      triageCategory = 'red';
      primaryHeadline = 'STEMI Anteroseptal Akut (LAD) - Oklusi Total';
      bedsideActions = [
        'Aktivasi Jalur Reperfusi Segera (Target Door-to-Needle <30 menit atau Door-to-Balloon <90 menit)',
        'Loading Dosis Ganda Antiplatelet: Aspirin 160-320 mg kunyah + Clopidogrel 300-600 mg (atau Ticagrelor 180 mg)',
        'Terapi Oksigen jika SpO2 < 90% (target 94-98%)',
        'Akses IV ganda, pertimbangkan analgesia Morfin/Fentanil jika nyeri dada persisten',
        'Rujuk segera ke Pusat Pelayanan Jantung Terpadu / Cath Lab',
      ];
    } else if (hasInferiorSTEMI) {
      triageCategory = 'red';
      primaryHeadline = 'STEMI Inferior Akut (RCA) - Oklusi Koroner Kanan';
      bedsideActions = [
        'Aktivasi Protokol Reperfusi Cito (Fibrinolitik / Primary PCI)',
        'Loading Dosis Antiplatelet: Aspirin 160-320 mg kunyah + Clopidogrel 300 mg',
        'Rekam EKG Sadapan Kanan (V3R, V4R) untuk evaluasi Infark Ventrikel Kanan',
        'PERINGATAN: Hindari Nitrat dan Morfin jika ada dugaan infark RV atau hipotensi',
        'Pertahankan preload miokard dengan hidrasi kristaloid IV terukur jika normo/hipotensi',
      ];
    } else if (hasLateralSTEMI) {
      triageCategory = 'red';
      primaryHeadline = 'STEMI Lateral Akut (LCx) - Oklusi Sirkumfleksa';
      bedsideActions = [
        'Aktivasi Jalur Reperfusi Cepat / Rujuk Cath Lab',
        'Loading Dosis Antiplatelet: Aspirin 160-320 mg kunyah + Ticagrelor 180 mg atau Clopidogrel 300 mg',
        'Antikoagulan parenteral (Enoxaparin atau UFH sesuai protokol)',
        'Monitor irama jantung kontinu terhadap ancaman aritmia ventrikel',
      ];
    } else if (k < 3.0) {
      triageCategory = 'red';
      primaryHeadline = `Hipokalemia Berat (${k.toFixed(1)} mmol/L) - Gelombang U Prominen (Risiko Aritmia Letal)`;
      bedsideActions = [
        'Koreksi KCl intravena via infus lambat (maksimal 20 mEq/jam dengan monitor jantung kontinu)',
        'Evaluasi dan koreksi Magnesium serum (MgSO4 20% 2-4 g IV lambat)',
        'Hindari obat-obatan yang memperpanjang interval QT',
        'Monitor EKG kontinu untuk deteksi dini Torsades de Pointes dan VF',
      ];
    } else if (features.electrodeMisplacement) {
      triageCategory = 'yellow';
      primaryHeadline = 'Malposisi Sadapan: V1/V2 Terlalu Tinggi (ICS 2) - Pola Pseudo-Brugada';
      bedsideActions = [
        'Reposisi elektroda V1 dan V2 turun ke Ruang Interkostal ke-4 (garis parasternal kanan & kiri)',
        'Hindari misinterpretasi sebagai sindrom Brugada atau hipertrofi ventrikel kanan',
        'Rekam ulang EKG 12-lead lengkap setelah reposisi anatomis yang tepat',
      ];
    } else if (infarctionStr.includes('NSTEMI')) {
      triageCategory = 'yellow';
      primaryHeadline = 'NSTEMI Risiko Tinggi - Cedera Miokard Akut';
      bedsideActions = [
        'Tirah baring total dan monitor EKG kontinu',
        'Loading Dual Antiplatelet Therapy (Aspirin 160-320 mg + Clopidogrel 300 mg)',
        'Antikoagulasi sistemik (Fondaparinux 2.5 mg SC atau Enoxaparin 1 mg/kg SC tiap 12 jam)',
        'Stratifikasi risiko klinis (Skor TIMI / GRACE) untuk strategi invasif dini',
        'Evaluasi serial Troponin dan EKG berkala tiap 3-6 jam',
      ];
    } else if (infarctionStr.includes('Unstable Angina')) {
      triageCategory = 'yellow';
      primaryHeadline = 'Angina Pektoris Tidak Stabil (UAP) - Iskemik Subendokard';
      bedsideActions = [
        'Tirah baring dan observasi ruang rawat intermediat',
        'Aspirin 80-160 mg/hari + Clopidogrel 75 mg/hari',
        'Nitrat sublingual/oral untuk kontrol episode nyeri dada',
        'Serial biomarker Troponin dan rekam EKG ulang jika timbul nyeri dada berulang',
      ];
    } else if (k >= 5.5) {
      triageCategory = 'yellow';
      primaryHeadline = `Hiperkalemia Sedang (${k.toFixed(1)} mmol/L) - Gelombang T Lancip`;
      bedsideActions = [
        'Evaluasi fungsi ginjal dan hidrasi intravena NaCl 0.9%',
        'Pertimbangkan loop diuretik (Furosemid 40-80 mg IV) jika fungsi ginjal memadai',
        'Monitor EKG serial tiap 2-4 jam',
        'Hentikan obat penahan kalium dan suplemen',
      ];
    } else if (k < 3.5) {
      triageCategory = 'yellow';
      primaryHeadline = `Hipokalemia Ringan (${k.toFixed(1)} mmol/L) - Perataan Gelombang T`;
      bedsideActions = [
        'Suplementasi Kalium oral (KSR / Aspar K)',
        'Tingkatkan asupan kalium diet',
        'Evaluasi penyebab kehilangan cairan/elektrolit',
      ];
    } else if (hr > 140) {
      triageCategory = 'red';
      primaryHeadline = `Takikardia Sinus Berat / SVT (${hr} BPM)`;
      bedsideActions = [
        'Evaluasi stabilitas hemodinamik (tekanan darah, kesadaran, akral)',
        'Jika tidak stabil: Siapkan kardioversi tersinkronisasi segera',
        'Jika stabil: Manuver vagal, siapkan Adenosin 6 mg IV bolus cepat',
        'Investigasi penyebab: sepsis, syok hipovolemik, tirotoksikosis, intoksikasi',
      ];
    } else if (hr < 50) {
      triageCategory = 'yellow';
      primaryHeadline = `Bradikardia Sinus (${hr} BPM) - Waspada Penurunan Curah Jantung`;
      bedsideActions = [
        'Evaluasi tanda-tanda hipoperfusi (pusing, hipotensi, sinkop, dispnea)',
        'Jika simtomatik: Siapkan Sulfas Atropin 1 mg IV (dapat diulang hingga 3 mg)',
        'Siapkan transcutaneous pacing (TCP) jika atropin tidak efektif',
        'Identifikasi obat pencetus (penyekat beta, calcium channel blocker, digoksin)',
      ];
    } else if (features.factors.hsTroponinT > 14) {
      triageCategory = 'yellow';
      primaryHeadline = 'Peningkatan Troponin - Evaluasi Cedera Miokard Akut';
      bedsideActions = [
        'Pemeriksaan serial hs-Troponin T jam ke-0, 1, dan 3',
        'Echocardiography untuk evaluasi kelainan gerakan dinding ventrikel',
        'Konsultasi kardiologi untuk evaluasi angiografi',
      ];
    }

    return {
      rhythm: rhythmStr,
      conduction: conductionList,
      infarctionIschemia: infarctionStr,
      culpritArtery,
      electrolyteAlerts,
      urgencyLevel: urgency,
      triageCategory,
      primaryHeadline,
      bedsideActions,
      allStatements: statements,
    };
  }
}
