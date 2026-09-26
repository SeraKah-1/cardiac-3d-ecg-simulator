/**
 * verify_onboarding.ts: Test Suite for Onboarding State, Persona Roles, and Zero Em-Dash
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import { OnboardingStorage } from './src/engine/storage/onboardingStorage';
import * as fs from 'fs';
import * as path from 'path';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

console.log('=== RUNNING ONBOARDING VERIFICATION SUITE ===');

// 1. Initial / Default Eligibility Check
const initialEligible = OnboardingStorage.isEligibleForWelcome();
assert(typeof initialEligible === 'boolean', 'isEligibleForWelcome returns a boolean value');

// 2. Set Role and Start Tour
OnboardingStorage.setRoleAndStartTour('STUDENT');
const studentState = OnboardingStorage.load();
assert(studentState.userRole === 'STUDENT', 'userRole correctly set to STUDENT');
assert(studentState.hasSeenWelcomeModal === true, 'hasSeenWelcomeModal set to true after starting tour');
assert(studentState.tourStepIndex === 0, 'tourStepIndex initialized to 0');

// 3. Complete Tour
OnboardingStorage.completeTour();
const completedState = OnboardingStorage.load();
assert(completedState.hasCompletedTour === true, 'hasCompletedTour set to true');
assert(completedState.completedAtTimestamp !== null, 'completedAtTimestamp recorded');
assert(OnboardingStorage.isEligibleForWelcome() === false, 'User is no longer eligible for automatic welcome once completed');

// 4. Dismiss Onboarding
OnboardingStorage.dismissOnboarding();
const dismissedState = OnboardingStorage.load();
assert(dismissedState.hasCompletedTour === true, 'dismissOnboarding marks tour as completed');
assert(OnboardingStorage.isEligibleForWelcome() === false, 'User is not eligible after dismissal');

// 5. Reset and Restart Tour
OnboardingStorage.resetAndRestartTour();
const restartedState = OnboardingStorage.load();
assert(restartedState.tourStepIndex === 0, 'resetAndRestartTour resets step index to 0');

// 6. Zero Em-Dash Invariant in Onboarding Files
const onboardingFiles = [
  'src/engine/storage/onboardingStorage.ts',
  'src/components/thaler/WelcomeOnboardingModal.tsx',
  'src/components/thaler/InteractiveSpotlightTour.tsx',
];

for (const relPath of onboardingFiles) {
  const fullPath = path.join(process.cwd(), relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(!content.includes('\u2014'), `Zero Unicode U+2014 in ${relPath}`);
  console.log(`[PASS] Verified zero em-dashes in ${relPath}`);
}

console.log('====================================================');
console.log('ALL ONBOARDING VERIFICATION TESTS PASSED (EXIT CODE 0)');
console.log('====================================================');
