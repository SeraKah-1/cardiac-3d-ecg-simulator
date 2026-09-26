import { jsPDF } from 'jspdf';
import { DiagnosticReport } from '../clinical/DiagnosticRuleEngine';
import { ClinicalFactors, LeadId } from '../biophysics/types';

export interface ExportPatientInfo {
  name: string;
  id: string;
  age: number;
  gender: string;
  history: string;
  timestamp: string;
}

/**
 * Clinical Vector PDF Export Engine
 * Generates hospital-grade 12-lead ECG reports matching GE/Philips clinical printouts.
 */
export class EcgPdfExporter {
  public static exportToPdf(
    recordedData: Record<LeadId, number[]>,
    diagnostic: DiagnosticReport,
    patient: ExportPatientInfo,
    factors: ClinicalFactors
  ): void {
    // Standard ISO A4 Landscape: 297mm x 210mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [297, 210],
    });

    const gridStartX = 10;
    const gridStartY = 42;
    const gridWidth = 276;
    const gridHeight = 158;

    // 1. Draw 1mm Minor Grid
    doc.setDrawColor(254, 205, 211); // Rose-200
    doc.setLineWidth(0.08);

    for (let x = gridStartX; x <= gridStartX + gridWidth; x += 1) {
      doc.line(x, gridStartY, x, gridStartY + gridHeight);
    }
    for (let y = gridStartY; y <= gridStartY + gridHeight; y += 1) {
      doc.line(gridStartX, y, gridStartX + gridWidth, y);
    }

    // 2. Draw 5mm Major Grid
    doc.setDrawColor(244, 63, 94); // Rose-500
    doc.setLineWidth(0.22);

    for (let x = gridStartX; x <= gridStartX + gridWidth; x += 5) {
      doc.line(x, gridStartY, x, gridStartY + gridHeight);
    }
    for (let y = gridStartY; y <= gridStartY + gridHeight; y += 5) {
      doc.line(gridStartX, y, gridStartX + gridWidth, y);
    }

    // 3. Clinical Header Information
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CENTRAL UNIVERSITY HOSPITAL - CARDIOLOGY & ELECTROPHYSIOLOGY', 10, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('STANDARD 12-LEAD DIAGNOSTIC RESTING ELECTROCARDIOGRAM', 10, 14);

    // Patient Demographics Box
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient: ${patient.name.toUpperCase()}    MRN: ${patient.id}`, 10, 20);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Age/Sex: ${patient.age} Y / ${patient.gender}    Clinical Indication: ${patient.history}`,
      10,
      24
    );
    doc.text(`Recording Date: ${patient.timestamp}`, 10, 28);

    // Measurements Table
    doc.setFont('helvetica', 'bold');
    doc.text('MEASUREMENTS:', 140, 20);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Vent. Rate: ${Math.round(factors.heartRate)} BPM    hs-Troponin T: ${factors.hsTroponinT} ng/L`,
      140,
      24
    );
    doc.text(
      `Serum K+: ${factors.serumPotassium.toFixed(1)} mmol/L    Serum Ca2+: ${factors.serumCalcium.toFixed(1)} mg/dL`,
      140,
      28
    );

    // Technical Settings
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Speed: 25 mm/s    Gain: 10 mm/mV    Filters: 0.05 - 150 Hz, 50/60 Hz Notch', 220, 20);
    doc.text('Format: Standard 12-Lead (4x3 + Continuous Lead II)', 220, 24);

    // Interpretive Rule Statements
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (diagnostic.urgencyLevel === 'Critical Cath Lab Alert') {
      doc.setTextColor(225, 29, 72); // Rose-600 Alert
    } else if (diagnostic.urgencyLevel === 'Urgent') {
      doc.setTextColor(217, 119, 6); // Amber-600
    } else {
      doc.setTextColor(15, 23, 42);
    }
    const interpText = diagnostic.allStatements.join('  |  ');
    doc.text(`ANALYSIS: ${interpText}`, 10, 36);

    // 4. Draw 12-Lead Waveforms
    // 4 columns x 3 rows
    const columns: Array<Array<{ name: LeadId }>> = [
      [{ name: 'I' }, { name: 'II' }, { name: 'III' }],
      [{ name: 'aVR' }, { name: 'aVL' }, { name: 'aVF' }],
      [{ name: 'V1' }, { name: 'V2' }, { name: 'V3' }],
      [{ name: 'V4' }, { name: 'V5' }, { name: 'V6' }],
    ];

    const colWidthMm = gridWidth / 4.0; // 69 mm
    const rowHeightMm = 31;            // 31 mm
    const rhythmHeightMm = 35;         // 35 mm

    doc.setDrawColor(15, 23, 42); // Black/Charcoal trace
    doc.setLineWidth(0.35);

    for (let colIdx = 0; colIdx < 4; colIdx++) {
      const colX = gridStartX + colIdx * colWidthMm;

      for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
        const lead = columns[colIdx][rowIdx];
        const baselineY = gridStartY + rowIdx * rowHeightMm + rowHeightMm / 2;
        const data = recordedData[lead.name] || [];

        // Lead title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(lead.name, colX + 2, baselineY - 9);

        // Calibration pulse (10mm high = 1.0mV, 5mm wide = 0.20s)
        if (colIdx === 0) {
          doc.line(colX + 2, baselineY, colX + 4, baselineY);
          doc.line(colX + 4, baselineY, colX + 4, baselineY - 10);
          doc.line(colX + 4, baselineY - 10, colX + 9, baselineY - 10);
          doc.line(colX + 9, baselineY - 10, colX + 9, baselineY);
          doc.line(colX + 9, baselineY, colX + 11, baselineY);
        }

        if (data.length < 2) continue;

        const sampleCount = data.length;
        const stepMm = (colWidthMm - 12) / sampleCount;
        let prevX = colX + 12;
        let prevY = baselineY - data[0] * 10.0; // 10mm per mV

        for (let s = 1; s < sampleCount; s++) {
          const currX = prevX + stepMm;
          const currY = baselineY - data[s] * 10.0;
          doc.line(prevX, prevY, currX, currY);
          prevX = currX;
          prevY = currY;
        }
      }
    }

    // 5. Continuous Lead II Rhythm Strip at Bottom
    const rhythmBaselineY = gridStartY + 3 * rowHeightMm + rhythmHeightMm / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('II (Continuous Rhythm Strip)', gridStartX + 2, rhythmBaselineY - 9);

    const lead2Data = recordedData['II'] || [];
    if (lead2Data.length >= 2) {
      const stepMm = (gridWidth - 14) / lead2Data.length;
      let prevX = gridStartX + 14;
      let prevY = rhythmBaselineY - lead2Data[0] * 10.0;

      for (let s = 1; s < lead2Data.length; s++) {
        const currX = prevX + stepMm;
        const currY = rhythmBaselineY - lead2Data[s] * 10.0;
        doc.line(prevX, prevY, currX, currY);
        prevX = currX;
        prevY = currY;
      }
    }

    // Save PDF
    const filename = `ECG_12LEAD_${patient.id}_${Date.now()}.pdf`;
    try {
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      if (isMobile && typeof navigator.share === 'function' && typeof File !== 'undefined') {
        const blob = doc.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: filename }).catch(() => doc.save(filename));
          return;
        }
      }
    } catch {
      // Fallback
    }
    doc.save(filename);
  }
}
