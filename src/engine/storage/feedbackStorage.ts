/**
 * feedbackStorage: Client-Side User Engagement & Anti-Annoyance Storage
 * Tracks completed cases and practice drill sessions in localStorage.
 * Enforces non-intrusive feedback triggers (minimum 2 completions, 3-day snooze cooldown,
 * and permanent dismissal guards).
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

export type FeedbackStatus = 'UNPROMPTED' | 'SUBMITTED' | 'DISMISSED' | 'REMIND_LATER';

export interface UserEngagementData {
  completedTutorialCases: string[];
  completedPracticeSessions: number;
  feedbackStatus: FeedbackStatus;
  lastPromptedTimestamp: number;
  lastSubmittedRating: number | null;
}

const STORAGE_KEY = 'thaler_ekg_user_engagement_v1';

const DEFAULT_ENGAGEMENT: UserEngagementData = {
  completedTutorialCases: [],
  completedPracticeSessions: 0,
  feedbackStatus: 'UNPROMPTED',
  lastPromptedTimestamp: 0,
  lastSubmittedRating: null,
};

let memoryFeedbackCache: UserEngagementData | null = null;

export class FeedbackStorage {
  /**
   * Load engagement state safely from localStorage with in-memory fallback
   */
  public static load(): UserEngagementData {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) {
        return memoryFeedbackCache ? { ...memoryFeedbackCache } : { ...DEFAULT_ENGAGEMENT };
      }
      const parsed = JSON.parse(raw);
      const loaded: UserEngagementData = {
        completedTutorialCases: Array.isArray(parsed.completedTutorialCases) ? parsed.completedTutorialCases : [],
        completedPracticeSessions: typeof parsed.completedPracticeSessions === 'number' ? parsed.completedPracticeSessions : 0,
        feedbackStatus: ['UNPROMPTED', 'SUBMITTED', 'DISMISSED', 'REMIND_LATER'].includes(parsed.feedbackStatus)
          ? parsed.feedbackStatus
          : 'UNPROMPTED',
        lastPromptedTimestamp: typeof parsed.lastPromptedTimestamp === 'number' ? parsed.lastPromptedTimestamp : 0,
        lastSubmittedRating: typeof parsed.lastSubmittedRating === 'number' ? parsed.lastSubmittedRating : null,
      };
      memoryFeedbackCache = { ...loaded };
      return loaded;
    } catch {
      return memoryFeedbackCache ? { ...memoryFeedbackCache } : { ...DEFAULT_ENGAGEMENT };
    }
  }

  /**
   * Save engagement state to localStorage with in-memory fallback
   */
  public static save(data: UserEngagementData): void {
    memoryFeedbackCache = { ...data };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // In-memory cache preserves state if storage access is restricted
    }
  }

  /**
   * Record completion of a tutorial case
   */
  public static recordTutorialCaseCompleted(caseId: string): UserEngagementData {
    const data = this.load();
    if (!data.completedTutorialCases.includes(caseId)) {
      data.completedTutorialCases.push(caseId);
      this.save(data);
    }
    return data;
  }

  /**
   * Record completion of a practice drill session
   */
  public static recordPracticeSessionCompleted(): UserEngagementData {
    const data = this.load();
    data.completedPracticeSessions += 1;
    this.save(data);
    return data;
  }

  /**
   * Check if the user is eligible for an automatic feedback prompt:
   * 1. Must NOT be already SUBMITTED or DISMISSED.
   * 2. Must have completed at least 2 tutorial cases OR at least 2 practice sessions.
   * 3. If status is REMIND_LATER, must have passed the 3-day cooldown period (259,200,000 ms).
   */
  public static isEligibleForPrompt(): boolean {
    const data = this.load();

    // Permanent suppression
    if (data.feedbackStatus === 'SUBMITTED' || data.feedbackStatus === 'DISMISSED') {
      return false;
    }

    // Must have meaningful clinical engagement (at least 2 completions)
    const totalEngagement = data.completedTutorialCases.length + data.completedPracticeSessions;
    if (totalEngagement < 2) {
      return false;
    }

    // Check cooldown for snooze (3 days = 72 hours)
    if (data.feedbackStatus === 'REMIND_LATER') {
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - data.lastPromptedTimestamp;
      if (elapsed < threeDaysMs) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update feedback status to SUBMITTED (never show automatic prompt again)
   */
  public static setSubmitted(rating: number): void {
    const data = this.load();
    data.feedbackStatus = 'SUBMITTED';
    data.lastSubmittedRating = rating;
    data.lastPromptedTimestamp = Date.now();
    this.save(data);
  }

  /**
   * Update feedback status to DISMISSED (user clicked 'Jangan tampilkan lagi')
   */
  public static setDismissed(): void {
    const data = this.load();
    data.feedbackStatus = 'DISMISSED';
    data.lastPromptedTimestamp = Date.now();
    this.save(data);
  }

  /**
   * Update feedback status to REMIND_LATER (snooze for 3 days)
   */
  public static setRemindLater(): void {
    const data = this.load();
    data.feedbackStatus = 'REMIND_LATER';
    data.lastPromptedTimestamp = Date.now();
    this.save(data);
  }
}
