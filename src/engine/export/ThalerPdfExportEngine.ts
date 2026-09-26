/**
 * Thaler EKG PDF Export Engine
 * Client-side clinical PDF document generation using jsPDF.
 * Exports:
 * 1. Standard Hospital 12-Lead Paper Strip (A4 Landscape)
 * 2. Standard Blank OSCE Clinical Worksheet (A4 Portrait)
 * 3. Practice Discrepancy Debrief Report (A4 Portrait)
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import { jsPDF } from 'jspdf';
import { EKGCase } from '../clinical/thaler/thalerTypes';
import { Locale } from '../../locales/types';
import { idTranslations } from '../../locales/id';
import { enTranslations } from '../../locales/en';

const TRANSLATIONS = {
  id: idTranslations,
  en: enTranslations,
};

export class ThalerPdfExportEngine {
  /**
   * 1. Export Standard Hospital 12-Lead Paper Strip
   */
  public static exportHospital12LeadStrip(
    caseData: EKGCase,
    canvasElement?: HTMLCanvasElement | null,
    locale: Locale = 'id'
  ): void {
    const t = TRANSLATIONS[locale].pdfExport;

    // A4 Landscape: 297 mm x 210 mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // Header Background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(0, 28, pageWidth, 28);

    // Hospital & Title Banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(t.hospitalTitle, 12, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(t.hospitalSubtitle, 12, 14);

    // Patient Demographics (Two columns in header)
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const col1X = 12;
    const col2X = 90;
    const col3X = 175;
    const col4X = 240;

    doc.text(`${t.patientName}: ${caseData.patient.name}`, col1X, 20);
    doc.text(`${t.mrn}: ${caseData.patient.mrn}`, col1X, 25);

    doc.text(`${t.age}: ${caseData.patient.age} ${t.yearsUnit} (${caseData.patient.gender === 'Male' ? t.genderMale : t.genderFemale})`, col2X, 20);
    doc.text(`${t.bp}: ${caseData.patient.vitalSigns.bloodPressure}`, col2X, 25);

    doc.text(`${t.hr}: ${caseData.metrics.heartRateBpm} bpm (${caseData.metrics.isRegular ? t.regular : t.irregular})`, col3X, 20);
    doc.text(`${t.spo2}: ${caseData.patient.vitalSigns.spo2Percent}% | ${t.rr}: ${caseData.patient.vitalSigns.respiratoryRate} ${t.breathsPerMin}`, col3X, 25);

    const now = new Date();
    const dateStr = now.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString(locale === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' });
    doc.text(`${t.time}: ${dateStr} ${timeStr}`, col4X, 20);
    doc.text(`${t.calibration}: 25 mm/s, 10 mm/mV`, col4X, 25);

    // Embed ECG Canvas Image
    if (canvasElement) {
      try {
        const imgData = canvasElement.toDataURL('image/png', 1.0);
        // Canvas aspect ratio is 1375 x 900 (1.527)
        const canvasX = 10;
        const canvasY = 32;
        const canvasW = 277;
        const canvasH = (canvasW * 900) / 1375; // ~181.3 mm

        doc.addImage(imgData, 'PNG', canvasX, canvasY, canvasW, Math.min(canvasH, 142));
      } catch (e) {
        console.error('Failed to capture canvas image for PDF:', e);
      }
    }

    // Diagnostic Summary Footer
    const footerY = 178;
    doc.setFillColor(241, 245, 249);
    doc.rect(10, footerY, 277, 26, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(10, footerY, 277, 26, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(t.footerTitle, 13, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`1. ${t.hrPrefix}: ${caseData.metrics.heartRateBpm} bpm | 2. ${t.rhythmPrefix}: ${caseData.metrics.rhythmDescription.split('.')[0]} | 3. ${t.axisPrefix}: ${caseData.metrics.axisDegrees} ${t.degrees} (${caseData.metrics.axisClassification})`, 13, footerY + 10);
    doc.text(`4. ${t.prPrefix}: ${caseData.metrics.prIntervalMs} ms | 5. ${t.qrsPrefix}: ${caseData.metrics.qrsDurationMs} ms | 6. ${t.qtcPrefix}: ${caseData.metrics.qtcIntervalMs} ms | 7. ${t.stElevPrefix}: ${caseData.metrics.stElevationLeads.length > 0 ? caseData.metrics.stElevationLeads.join(', ') : t.none}`, 13, footerY + 15);
    doc.text(`${t.diagnosisPrefix}: ${locale === 'en' && caseData.medicalTermEn ? caseData.medicalTermEn : caseData.title}`, 13, footerY + 20);

    // Physician Signature Box
    doc.setFontSize(7.5);
    doc.text(t.physicianHeader, 215, footerY + 5);
    doc.line(215, footerY + 20, 275, footerY + 20);
    doc.text(t.cardiologistTitle, 215, footerY + 24);

    doc.save(`EKG_${caseData.caseCode}_${caseData.patient.name.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * 2. Export Standard Blank OSCE Student Worksheet
   */
  public static exportBlankOsceWorksheet(caseData?: EKGCase, locale: Locale = 'id'): void {
    const t = TRANSLATIONS[locale].pdfExport;

    // A4 Portrait: 210 mm x 297 mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Header Title
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(0, 28, pageWidth, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(t.osceTitle, 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(t.osceSubtitle, 14, 15);

    // Student & Case Banner Box
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(t.studentNameLine, 14, 22);
    doc.text(t.studentIdLine, 130, 22);

    // Clinical Vignette Section
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 32, 182, 18, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 32, 182, 18, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(t.vignetteBoxTitle, 17, 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    if (caseData) {
      doc.text(`${locale === 'en' ? 'Patient' : 'Pasien'} ${caseData.patient.gender === 'Male' ? t.genderMale : t.genderFemale}, ${locale === 'en' ? 'age' : 'usia'} ${caseData.patient.age} ${t.yearsUnit}.`, 17, 41);
      doc.text(`${t.chiefComplaintPrefix}: "${caseData.patient.chiefComplaint}"`, 17, 45);
      doc.text(`${t.vitalsPrefix}: ${t.bp} ${caseData.patient.vitalSigns.bloodPressure}, ${t.spo2} ${caseData.patient.vitalSigns.spo2Percent}%, ${t.rr} ${caseData.patient.vitalSigns.respiratoryRate} ${t.breathsPerMin}.`, 17, 48);
    } else {
      doc.text(t.genericVignette, 17, 42);
    }

    // 6 Systematic Stages Table
    const stages = [
      {
        title: t.stage1Title,
        prompt: t.stage1Prompt,
        lines: 1,
      },
      {
        title: t.stage2Title,
        prompt: t.stage2Prompt,
        lines: 1,
      },
      {
        title: t.stage3Title,
        prompt: t.stage3Prompt,
        lines: 2,
      },
      {
        title: t.stage4Title,
        prompt: t.stage4Prompt,
        lines: 2,
      },
      {
        title: t.stage5Title,
        prompt: t.stage5Prompt,
        lines: 3,
      },
      {
        title: t.stage6Title,
        prompt: t.stage6Prompt,
        lines: 4,
      },
    ];

    let currentY = 54;
    stages.forEach((st) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 6, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, currentY, 182, 6, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(st.title, 17, currentY + 4.2);

      const contentHeight = st.lines * 7 + 8;
      doc.rect(14, currentY + 6, 182, contentHeight, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      const promptLines = st.prompt.split('\n');
      promptLines.forEach((line, lineIdx) => {
        doc.text(line, 17, currentY + 11 + lineIdx * 6);
      });

      currentY += 6 + contentHeight + 2.5;
    });

    // Examiner Rubric Footer Box
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY, 182, 22, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, currentY, 182, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(t.osceRubricTitle, 17, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(t.osceRubricScoreLine, 17, currentY + 10);
    doc.text(t.osceRubricTotalLine, 17, currentY + 15);
    const sanitizedFileName = caseData
      ? (locale === 'en'
          ? `OSCE_Worksheet_ECG_Patient_${caseData.patient.gender}_${caseData.patient.age}yo.pdf`
          : `Lembar_Kerja_OSCE_EKG_Pasien_${caseData.patient.gender === 'Male' ? 'Pria' : 'Wanita'}_${caseData.patient.age}th.pdf`)
      : (locale === 'en' ? 'OSCE_Worksheet_ECG_Practice.pdf' : 'Lembar_Kerja_OSCE_EKG_Latihan.pdf');
    doc.save(sanitizedFileName);
  }

  /**
   * 3. Export Practice Discrepancy Debrief Report
   */
  public static exportPracticeDebriefReport(
    caseData: EKGCase,
    userAnswers: Record<string, string>,
    score: number,
    competencyRating: string,
    debriefNotes: string[],
    locale: Locale = 'id'
  ): void {
    const t = TRANSLATIONS[locale].pdfExport;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(t.debriefTitle, 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(t.debriefSubtitle, 14, 16);

    // Patient Vignette Banner
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 32, 182, 14, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 32, 182, 14, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const displayCaseTitle = (locale === 'en' ? (caseData.titleEn || caseData.medicalTermEn || caseData.title) : caseData.title) || caseData.title;
    doc.text(`${t.practiceCasePrefix}: ${caseData.caseCode} - ${displayCaseTitle.split('(')[0]}`, 17, 37);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const chiefComplaint = locale === 'en' && caseData.patient.chiefComplaintEn ? caseData.patient.chiefComplaintEn : caseData.patient.chiefComplaint;
    doc.text(`${t.patientName}: ${caseData.patient.name}, ${caseData.patient.age} ${t.yearsUnit} (${caseData.patient.gender === 'Male' ? t.genderMale : t.genderFemale}). ${t.chiefComplaintPrefix}: ${chiefComplaint}`, 17, 42);

    // Score & Competency Box
    doc.setFillColor(score >= 70 ? 236 : 254, score >= 70 ? 253 : 242, score >= 70 ? 245 : 242);
    doc.rect(14, 49, 182, 16, 'F');
    doc.setDrawColor(score >= 70 ? 110 : 252, score >= 70 ? 231 : 165, score >= 70 ? 183 : 165);
    doc.rect(14, 49, 182, 16, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(score >= 70 ? 6 : 159, score >= 70 ? 95 : 18, score >= 70 ? 70 : 57);
    doc.text(`${t.compositeScorePrefix}: ${score}% - ${competencyRating}`, 17, 56);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      score >= 85
        ? t.residencyAppraisal
        : score >= 70
        ? t.competentAppraisal
        : t.repeatAppraisal,
      17,
      61
    );

    // Comparison Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(t.comparisonMatrixTitle, 14, 72);

    const stagesData = [
      {
        stage: TRANSLATIONS[locale].practice.rateStageTitle,
        user: `${userAnswers.heartRate || '-'} bpm (${userAnswers.rateCategory || '-'})`,
        truth: `${caseData.metrics.heartRateBpm} bpm (${caseData.metrics.heartRateBpm < 60 ? (locale === 'en' ? 'Bradycardia' : 'Bradikardia') : caseData.metrics.heartRateBpm > 100 ? (locale === 'en' ? 'Tachycardia' : 'Takikardia') : 'Normal'})`,
      },
      {
        stage: TRANSLATIONS[locale].practice.rhythmStageTitle,
        user: `${userAnswers.regularity || '-'} | ${userAnswers.rhythmType || '-'}`,
        truth: `${caseData.metrics.isRegular ? TRANSLATIONS[locale].practiceDrill.rhythmRegular : TRANSLATIONS[locale].practiceDrill.rhythmIrregular} | ${(locale === 'en' && caseData.metrics.rhythmDescriptionEn ? caseData.metrics.rhythmDescriptionEn : caseData.metrics.rhythmDescription).split('.')[0]}`,
      },
      {
        stage: TRANSLATIONS[locale].practice.axisStageTitle,
        user: `${userAnswers.axisClassification || '-'}`,
        truth: `${caseData.metrics.axisClassification} (${caseData.metrics.axisDegrees} ${t.degrees})`,
      },
      {
        stage: TRANSLATIONS[locale].practice.conductionStageTitle,
        user: `PR: ${userAnswers.prIntervalStatus || '-'} | QRS: ${userAnswers.qrsWidth || '-'}`,
        truth: `PR: ${caseData.metrics.prIntervalMs} ms | QRS: ${caseData.metrics.qrsDurationMs} ms | QTc: ${caseData.metrics.qtcIntervalMs} ms`,
      },
      {
        stage: TRANSLATIONS[locale].practice.stStageTitle,
        user: `${userAnswers.stMorphology || '-'} | ${userAnswers.ischemiaLeads || '-'}`,
        truth: `ST Elev: ${caseData.metrics.stElevationLeads.join(',') || t.none} | ST Depr: ${caseData.metrics.stDepressionLeads.join(',') || t.none} | Inv T: ${caseData.metrics.tWaveInversionLeads.join(',') || t.none}`,
      },
      {
        stage: TRANSLATIONS[locale].practice.diagnosisStageTitle,
        user: `${userAnswers.clinicalDiagnosis || '-'}`,
        truth: `${locale === 'en' && caseData.medicalTermEn ? caseData.medicalTermEn : caseData.title} (${TRANSLATIONS[locale].practiceDrill.globalTriageLabel}: ${caseData.category})`,
      },
    ];

    let currentY = 76;
    stagesData.forEach((row, i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(14, currentY, 182, 14, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, currentY, 182, 14, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(row.stage, 17, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`${TRANSLATIONS[locale].practiceDrill.yourAnswerLabel}: ${row.user.slice(0, 95)}`, 17, currentY + 8.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${TRANSLATIONS[locale].practiceDrill.goldStandardLabel}: ${row.truth.slice(0, 95)}`, 17, currentY + 12);

      currentY += 14.5;
    });

    // Clinical Debrief Alerts & Pearls
    if (debriefNotes.length > 0) {
      currentY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(t.debriefPearlsTitle, 14, currentY);

      currentY += 4;
      debriefNotes.slice(0, 3).forEach((note) => {
        doc.setFillColor(254, 242, 242);
        doc.rect(14, currentY, 182, 12, 'F');
        doc.setDrawColor(254, 202, 202);
        doc.rect(14, currentY, 182, 12, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(153, 27, 27);
        doc.text(doc.splitTextToSize(note, 176), 17, currentY + 4.5);
        currentY += 13;
      });
    }

    doc.save(
      locale === 'en'
        ? `Evaluation_Report_${caseData.caseCode}_Score_${score}.pdf`
        : `Hasil_Evaluasi_${caseData.caseCode}_Skor_${score}.pdf`
    );
  }
}
