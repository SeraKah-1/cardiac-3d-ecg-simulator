/**
 * verify_localization.ts
 * Rigorous bilingual audit test harness:
 * 1. Schema key parity between ID and EN dictionaries
 * 2. No empty strings in ID or EN translations
 * 3. Zero Unicode U+2014 em-dashes
 * 4. PDF Export engine functionality in both 'id' and 'en' locales
 */

import { idTranslations } from './src/locales/id';
import { enTranslations } from './src/locales/en';
import { THALER_EKG_CASES } from './src/engine/clinical/thaler/thalerCases';
import { ThalerPdfExportEngine } from './src/engine/export/ThalerPdfExportEngine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
}

console.log('=== TEST SUITE 1: SCHEMA KEY PARITY (ID vs EN) ===');

function compareKeys(objId: any, objEn: any, path = ''): void {
  const idKeys = Object.keys(objId);
  const enKeys = Object.keys(objEn);

  for (const k of idKeys) {
    const curPath = path ? `${path}.${k}` : k;
    assert(k in objEn, `Key '${curPath}' exists in ID but missing in EN`);

    const valId = objId[k];
    const valEn = objEn[k];

    if (typeof valId === 'object' && valId !== null && !Array.isArray(valId)) {
      compareKeys(valId, valEn, curPath);
    } else if (typeof valId === 'string') {
      assert(typeof valEn === 'string', `'${curPath}' is string in ID but not string in EN`);
      assert(valEn.trim().length > 0, `'${curPath}' in EN is empty`);
      assert(valId.trim().length > 0, `'${curPath}' in ID is empty`);
    } else if (Array.isArray(valId)) {
      assert(Array.isArray(valEn), `'${curPath}' is Array in ID but not in EN`);
      assert(valId.length === valEn.length, `'${curPath}' array length mismatch: ID=${valId.length}, EN=${valEn.length}`);
    }
  }

  for (const k of enKeys) {
    const curPath = path ? `${path}.${k}` : k;
    assert(k in objId, `Key '${curPath}' exists in EN but missing in ID`);
  }
}

compareKeys(idTranslations, enTranslations);

console.log('=== TEST SUITE 2: ZERO UNICODE U+2014 IN TRANSLATIONS ===');

function checkNoEmdash(obj: any, label: string): void {
  const jsonStr = JSON.stringify(obj);
  assert(!jsonStr.includes('\u2014'), `Zero em-dash (U+2014) in ${label}`);
}

checkNoEmdash(idTranslations, 'Indonesian Dictionary');
checkNoEmdash(enTranslations, 'English Dictionary');

console.log('=== TEST SUITE 3: PDF EXPORT ENGINE DUAL-LOCALE VERIFICATION ===');

const sampleCase = THALER_EKG_CASES[0];

try {
  // Test Hospital strip in both locales
  ThalerPdfExportEngine.exportHospital12LeadStrip(sampleCase, null, 'id');
  console.log('[PASS] exportHospital12LeadStrip (id) executed successfully');
  ThalerPdfExportEngine.exportHospital12LeadStrip(sampleCase, null, 'en');
  console.log('[PASS] exportHospital12LeadStrip (en) executed successfully');

  // Test OSCE blank in both locales
  ThalerPdfExportEngine.exportBlankOsceWorksheet(sampleCase, 'id');
  console.log('[PASS] exportBlankOsceWorksheet (id) executed successfully');
  ThalerPdfExportEngine.exportBlankOsceWorksheet(sampleCase, 'en');
  console.log('[PASS] exportBlankOsceWorksheet (en) executed successfully');

  // Test Practice debrief in both locales
  const mockAnswers = {
    heartRate: '75',
    rateCategory: 'NORMAL',
    regularity: 'REGULAR',
    rhythmType: 'Normal Sinus Rhythm',
    axisClassification: 'NORMAL',
    prIntervalStatus: 'NORMAL',
    qrsWidth: 'NARROW',
    stMorphology: 'Normal',
    ischemiaLeads: 'None',
    clinicalDiagnosis: '[NORMAL] Normal Sinus Rhythm',
  };
  ThalerPdfExportEngine.exportPracticeDebriefReport(sampleCase, mockAnswers, 95, 'Mastery', ['Alert note'], 'id');
  console.log('[PASS] exportPracticeDebriefReport (id) executed successfully');
  ThalerPdfExportEngine.exportPracticeDebriefReport(sampleCase, mockAnswers, 95, 'Mastery', ['Alert note'], 'en');
  console.log('[PASS] exportPracticeDebriefReport (en) executed successfully');
} catch (e) {
  console.error('[FAIL] PDF export threw an unexpected exception:', e);
  process.exit(1);
}

console.log('====================================================');
console.log('ALL LOCALIZATION AUDIT TESTS PASSED (EXIT CODE 0)');
console.log('====================================================');
