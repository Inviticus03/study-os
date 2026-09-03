export type SubjectCategory = 'GS' | 'OPTIONAL' | 'CSAT' | 'ESSAY_CA' | 'OTHER';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isLocal?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  upscYear: string; // e.g. "2026" or "2027"
  targetService: string; // e.g. "IAS", "IPS", "IFS", "IRS"
  optionalSubject: string; // e.g. "PSIR", "Sociology", "Geography", "History", "Public Administration", "Anthropology"
  createdAt: string;
  updatedAt?: string;
}

export interface StudySession {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  topic: string;
  focusScore: number; // 1 to 10
  sessionType: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading' | 'answer_writing' | 'pyq';
  accomplishment?: string;
  notes?: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  userId?: string;
  name: string;
  category?: SubjectCategory;
  color: string; // hex or tailwind class color
  icon: string; // lucide icon identifier
  weeklyTargetHours: number;
  monthlyTargetHours: number;
  createdAt: string;
}

export interface StudyPlanTask {
  id: string;
  userId?: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  task: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface DailyReview {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  summary: string;
  whatWentWell: string[];
  whatCouldImprove: string[];
  recommendationForTomorrow: string;
  rating: 'Exceptional' | 'Solid' | 'Needs Recovery' | 'Off-track';
  totalMinutes: number;
  sessionCount: number;
  avgFocus: number;
  createdAt: string;
}

export interface PYQRecord {
  id: string;
  userId?: string;
  year: number;
  paper: 'Prelims GS-1' | 'Prelims CSAT' | 'Mains GS-1' | 'Mains GS-2' | 'Mains GS-3' | 'Mains GS-4' | 'Mains Optional-1' | 'Mains Optional-2' | 'Mains Essay';
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correctQuestions: number;
  timeTakenMinutes: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface AnswerWritingRecord {
  id: string;
  userId?: string;
  question: string;
  paper: 'GS-1' | 'GS-2' | 'GS-3' | 'GS-4' | 'Optional-1' | 'Optional-2' | 'Essay';
  subjectId: string;
  subjectName: string;
  wordCount: number;
  timeTakenMinutes: number;
  marksAwarded?: number;
  maxMarks: number; // typically 10 or 15
  selfFeedback?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface RevisionItem {
  id: string;
  userId?: string;
  topic: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  stage: number; // 1 (1 day), 2 (3 days), 3 (7 days), 4 (15 days), 5 (30 days)
  lastRevised?: string;
  nextDue: string; // YYYY-MM-DD
  status: 'due' | 'completed' | 'upcoming';
  notes?: string;
  createdAt: string;
}

export interface UserGoals {
  dailyTargetHours: number; // default: 6
  weeklyTargetHours: number; // default: 36
  minStreakMinutes: number; // default: 30
}

export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string; // e.g. "08:00"
  goalReminder: boolean;
  breakReminder: boolean;
  breakIntervalMinutes: number;
  endOfDayReview: boolean;
  endOfDayReviewTime: string; // e.g. "22:00"
}

export interface UserSettings {
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  ambientSound: 'none' | 'white_noise' | 'soft_rain' | 'binaural_gamma' | 'deep_brown';
  ambientVolume: number;
  notifications: NotificationSettings;
}

export interface ActiveSession {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topic: string;
  sessionGoalMinutes?: number;
  sessionType: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading' | 'answer_writing' | 'pyq';
  startTime: number; // timestamp ms
  accumulatedSeconds: number;
  isPaused: boolean;
  lastResumedTime: number; // timestamp ms
  taskId?: string; // linked plan task
}

export interface SubjectStats {
  id: string;
  name: string;
  category?: SubjectCategory;
  color: string;
  icon: string;
  weeklyTargetHours: number;
  monthlyTargetHours: number;
  totalSeconds: number;
  totalMinutes: number;
  sessionCount: number;
  avgFocus: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
}

export interface CategoryStats {
  category: SubjectCategory;
  label: string;
  totalSeconds: number;
  totalHours: number;
  percent: number;
  sessionCount: number;
  color: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
  totalDaysStudied: number;
  todayCompleted: boolean;
  historyMap: Record<string, number>; // YYYY-MM-DD -> totalSeconds
}

export interface AnalyticsSummary {
  totalSeconds: number;
  totalHours: number;
  dailyAvgHours: number;
  avgSessionMinutes: number;
  avgFocusScore: number;
  mostStudiedSubject: SubjectStats | null;
  leastStudiedSubject: SubjectStats | null;
  bestStudyDay: { dayName: string; avgHours: number } | null;
  bestStudyTime: { windowName: string; avgFocus: number; count: number } | null;
  categoryDistribution: CategoryStats[];
}

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error';
