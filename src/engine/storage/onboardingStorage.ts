/**
 * onboardingStorage: Client-Side Onboarding & Guided Tour State Persistence
 * Manages first-time user orientation, persona role, and spotlight tour progression.
 * Features in-memory fallback for private/restricted browsing modes.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

export type UserRoleProfile = 'STUDENT' | 'CLINICIAN' | 'SELF_EXPLORER';

export interface OnboardingState {
  hasSeenWelcomeModal: boolean;
  hasCompletedTour: boolean;
  userRole: UserRoleProfile | null;
  completedAtTimestamp: number | null;
  tourStepIndex: number;
}

const ONBOARDING_STORAGE_KEY = 'thaler_ekg_onboarding_state_v1';

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  hasSeenWelcomeModal: false,
  hasCompletedTour: false,
  userRole: null,
  completedAtTimestamp: null,
  tourStepIndex: 0,
};

// In-memory cache fallback in case localStorage is blocked
let memoryCacheState: OnboardingState | null = null;

export class OnboardingStorage {
  /**
   * Load onboarding state safely with in-memory fallback
   */
  public static load(): OnboardingState {
    if (memoryCacheState !== null) {
      return { ...memoryCacheState };
    }

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULT_ONBOARDING_STATE };
      }

      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) {
        memoryCacheState = { ...DEFAULT_ONBOARDING_STATE };
        return { ...memoryCacheState };
      }

      const parsed = JSON.parse(raw);
      const validated: OnboardingState = {
        hasSeenWelcomeModal: Boolean(parsed.hasSeenWelcomeModal),
        hasCompletedTour: Boolean(parsed.hasCompletedTour),
        userRole: ['STUDENT', 'CLINICIAN', 'SELF_EXPLORER'].includes(parsed.userRole)
          ? parsed.userRole
          : null,
        completedAtTimestamp: typeof parsed.completedAtTimestamp === 'number' ? parsed.completedAtTimestamp : null,
        tourStepIndex: typeof parsed.tourStepIndex === 'number' ? parsed.tourStepIndex : 0,
      };

      memoryCacheState = validated;
      return { ...validated };
    } catch {
      memoryCacheState = { ...DEFAULT_ONBOARDING_STATE };
      return { ...memoryCacheState };
    }
  }

  /**
   * Save onboarding state safely to localStorage and in-memory cache
   */
  public static save(state: OnboardingState): void {
    memoryCacheState = { ...state };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // In-memory cache handles restricted/private browsing modes
    }
  }

  /**
   * Check if user is eligible to see the initial welcome modal:
   * Returns true only if they have never seen the welcome modal or completed the tour.
   */
  public static isEligibleForWelcome(): boolean {
    const state = this.load();
    return !state.hasSeenWelcomeModal && !state.hasCompletedTour;
  }

  /**
   * Set user persona role and prepare for tour launch
   */
  public static setRoleAndStartTour(role: UserRoleProfile): void {
    const state = this.load();
    state.hasSeenWelcomeModal = true;
    state.userRole = role;
    state.tourStepIndex = 0;
    this.save(state);
  }

  /**
   * User chose to explore immediately without tour
   */
  public static dismissOnboarding(): void {
    const state = this.load();
    state.hasSeenWelcomeModal = true;
    state.hasCompletedTour = true;
    state.completedAtTimestamp = Date.now();
    this.save(state);
  }

  /**
   * Mark spotlight tour as fully completed
   */
  public static completeTour(): void {
    const state = this.load();
    state.hasSeenWelcomeModal = true;
    state.hasCompletedTour = true;
    state.completedAtTimestamp = Date.now();
    state.tourStepIndex = 0;
    this.save(state);
  }

  /**
   * Reset onboarding state to allow re-running the guided tour anytime
   */
  public static resetAndRestartTour(): void {
    const state = this.load();
    state.tourStepIndex = 0;
    this.save(state);
  }
}
