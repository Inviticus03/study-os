export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  topic: string;
  focusScore: number; // 1 to 10
  sessionType: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading';
  accomplishment?: string;
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string; // hex or tailwind class color
  icon: string; // lucide icon identifier
  weeklyTargetHours: number;
  monthlyTargetHours: number;
  createdAt: string;
}

export interface StudyPlanTask {
  id: string;
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

export interface UserGoals {
  dailyTargetHours: number; // default: 5
  weeklyTargetHours: number; // default: 30
  minStreakMinutes: number; // default: 30
}

export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string; // e.g. "09:00"
  goalReminder: boolean;
  breakReminder: boolean;
  breakIntervalMinutes: number;
  endOfDayReview: boolean;
  endOfDayReviewTime: string; // e.g. "21:30"
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
  sessionType: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading';
  startTime: number; // timestamp ms
  accumulatedSeconds: number;
  isPaused: boolean;
  lastResumedTime: number; // timestamp ms
  taskId?: string; // linked plan task
}

export interface SubjectStats {
  id: string;
  name: string;
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
}
