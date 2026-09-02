import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  StudySession,
  Subject,
  StudyPlanTask,
  DailyReview,
  UserGoals,
  UserSettings,
  ActiveSession,
  SubjectStats,
  StreakInfo,
  AnalyticsSummary,
} from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_GOALS,
  INITIAL_SETTINGS,
  generateInitialSessions,
  generateInitialTasks,
  generateInitialDailyReviews,
} from '../data/initialData';
import { soundEngine } from '../utils/audio';
import { sendAppNotification } from '../utils/notifications';
import { getLocalDateString } from '../utils/formatters';

interface StudyContextType {
  sessions: StudySession[];
  subjects: Subject[];
  tasks: StudyPlanTask[];
  goals: UserGoals;
  settings: UserSettings;
  activeSession: ActiveSession | null;
  dailyReviews: DailyReview[];
  timerSeconds: number;
  
  // Computed stats from real saved sessions
  todayDateStr: string;
  todaySessions: StudySession[];
  todaySeconds: number;
  todayMinutes: number;
  todayHours: number;
  todayProgressPercent: number;
  weekSeconds: number;
  monthSeconds: number;
  dailyAvgSeconds: number;
  streak: StreakInfo;
  subjectStats: SubjectStats[];
  analytics: AnalyticsSummary;

  // Timer actions
  startSession: (params: {
    subjectId: string;
    topic: string;
    sessionGoalMinutes?: number;
    sessionType?: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading';
    taskId?: string;
  }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  finishSession: (data: {
    topic: string;
    focusScore: number;
    accomplishment?: string;
    notes?: string;
  }) => StudySession | null;

  // CRUD actions
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Subject;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;

  addSession: (session: Omit<StudySession, 'id'>) => StudySession;
  updateSession: (session: StudySession) => void;
  deleteSession: (id: string) => void;

  addTask: (task: Omit<StudyPlanTask, 'id' | 'createdAt' | 'completed'>) => StudyPlanTask;
  toggleTask: (id: string) => void;
  updateTask: (task: StudyPlanTask) => void;
  deleteTask: (id: string) => void;

  updateGoals: (goals: Partial<UserGoals>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  saveDailyReview: (review: Omit<DailyReview, 'id' | 'createdAt'>) => DailyReview;

  resetToSampleData: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;
}

const StudyContext = createContext<StudyContextType | null>(null);

const STORAGE_KEYS = {
  SESSIONS: 'studyos_sessions_v2',
  SUBJECTS: 'studyos_subjects_v2',
  TASKS: 'studyos_tasks_v2',
  GOALS: 'studyos_goals_v2',
  SETTINGS: 'studyos_settings_v2',
  ACTIVE_SESSION: 'studyos_active_session_v2',
  REVIEWS: 'studyos_reviews_v2',
};

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local date string helper (prevents timezone offset bugs)
  const [todayDateStr, setTodayDateStr] = useState<string>(() => getLocalDateString());

  // Periodically refresh todayDateStr
  useEffect(() => {
    const checkDate = () => {
      const now = getLocalDateString();
      if (now !== todayDateStr) {
        setTodayDateStr(now);
      }
    };
    const interval = setInterval(checkDate, 15000);
    return () => clearInterval(interval);
  }, [todayDateStr]);

  // Load state from localStorage with migration from v1 if present
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS) || localStorage.getItem('studyos_sessions_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return generateInitialSessions();
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS) || localStorage.getItem('studyos_subjects_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_SUBJECTS;
  });

  const [tasks, setTasks] = useState<StudyPlanTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS) || localStorage.getItem('studyos_tasks_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return generateInitialTasks();
  });

  const [goals, setGoals] = useState<UserGoals>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS) || localStorage.getItem('studyos_goals_v1');
    if (saved) {
      try {
        return { ...INITIAL_GOALS, ...JSON.parse(saved) };
      } catch {}
    }
    return INITIAL_GOALS;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem('studyos_settings_v1');
    if (saved) {
      try {
        return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return INITIAL_SETTINGS;
  });

  const [dailyReviews, setDailyReviews] = useState<DailyReview[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS) || localStorage.getItem('studyos_reviews_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return generateInitialDailyReviews();
  });

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || localStorage.getItem('studyos_active_session_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  // Guard to prevent duplicate session finalization
  const isFinishingRef = useRef(false);

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(dailyReviews));
  }, [dailyReviews]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  }, [activeSession]);

  // Apply Theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Ambient sound management
  useEffect(() => {
    if (activeSession && !activeSession.isPaused && settings.ambientSound !== 'none') {
      soundEngine.startAmbientSound(settings.ambientSound, settings.ambientVolume);
    } else {
      soundEngine.stopAmbientSound();
    }
    return () => {
      soundEngine.stopAmbientSound();
    };
  }, [activeSession?.isPaused, activeSession !== null, settings.ambientSound, settings.ambientVolume]);

  // Precise Live Timer tick (Timestamp elapsed calculation - no drift!)
  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    if (!activeSession) return 0;
    if (activeSession.isPaused) return activeSession.accumulatedSeconds;
    const elapsed = Math.floor((Date.now() - activeSession.lastResumedTime) / 1000);
    return activeSession.accumulatedSeconds + Math.max(0, elapsed);
  });

  useEffect(() => {
    if (!activeSession) {
      setTimerSeconds(0);
      return;
    }

    const updateTimer = () => {
      if (activeSession.isPaused) {
        setTimerSeconds(activeSession.accumulatedSeconds);
      } else {
        const elapsed = Math.floor((Date.now() - activeSession.lastResumedTime) / 1000);
        setTimerSeconds(activeSession.accumulatedSeconds + Math.max(0, elapsed));
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 500);
    return () => clearInterval(timerInterval);
  }, [activeSession]);

  // Start Studying Action
  const startSession = useCallback((params: {
    subjectId: string;
    topic: string;
    sessionGoalMinutes?: number;
    sessionType?: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading';
    taskId?: string;
  }) => {
    const subj = subjects.find((s) => s.id === params.subjectId) || {
      id: params.subjectId || `subj-${Date.now()}`,
      name: 'General Study',
      color: '#6366f1',
    };

    const now = Date.now();
    const newSession: ActiveSession = {
      subjectId: subj.id,
      subjectName: subj.name,
      subjectColor: subj.color,
      topic: params.topic.trim() || `${subj.name} Focus Session`,
      sessionGoalMinutes: params.sessionGoalMinutes,
      sessionType: params.sessionType || 'deep_work',
      startTime: now,
      accumulatedSeconds: 0,
      isPaused: false,
      lastResumedTime: now,
      taskId: params.taskId,
    };

    isFinishingRef.current = false;
    setActiveSession(newSession);
    if (settings.soundEnabled) {
      soundEngine.playActionTone('start');
    }
  }, [subjects, settings.soundEnabled]);

  // Pause Studying Action
  const pauseSession = useCallback(() => {
    if (!activeSession || activeSession.isPaused) return;
    const now = Date.now();
    const elapsed = Math.floor((now - activeSession.lastResumedTime) / 1000);
    const updated: ActiveSession = {
      ...activeSession,
      accumulatedSeconds: activeSession.accumulatedSeconds + Math.max(0, elapsed),
      isPaused: true,
      lastResumedTime: now,
    };
    setActiveSession(updated);
    if (settings.soundEnabled) {
      soundEngine.playActionTone('pause');
    }
  }, [activeSession, settings.soundEnabled]);

  // Resume Studying Action
  const resumeSession = useCallback(() => {
    if (!activeSession || !activeSession.isPaused) return;
    const updated: ActiveSession = {
      ...activeSession,
      isPaused: false,
      lastResumedTime: Date.now(),
    };
    setActiveSession(updated);
    if (settings.soundEnabled) {
      soundEngine.playActionTone('resume');
    }
  }, [activeSession, settings.soundEnabled]);

  // Cancel Studying Action
  const cancelSession = useCallback(() => {
    isFinishingRef.current = false;
    setActiveSession(null);
    soundEngine.stopAmbientSound();
  }, []);

  // Finish Studying Action (Prevents duplicate sessions with re-entry guard & unique entropy ID)
  const finishSession = useCallback((data: {
    topic: string;
    focusScore: number;
    accomplishment?: string;
    notes?: string;
  }): StudySession | null => {
    if (!activeSession) return null;
    if (isFinishingRef.current) return null;

    isFinishingRef.current = true;

    const currentSession = activeSession;
    const now = Date.now();
    let finalSeconds = currentSession.accumulatedSeconds;
    if (!currentSession.isPaused) {
      const elapsed = Math.floor((now - currentSession.lastResumedTime) / 1000);
      finalSeconds += Math.max(0, elapsed);
    }

    // Minimum 10 seconds or actual recorded duration
    const durationSeconds = Math.max(10, finalSeconds);

    const startTimeDate = new Date(currentSession.startTime);
    const startTimeIso = startTimeDate.toISOString();
    const endTimeIso = new Date(now).toISOString();
    const dateStr = getLocalDateString(startTimeDate);

    const newId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const completedSession: StudySession = {
      id: newId,
      date: dateStr,
      subjectId: currentSession.subjectId,
      subjectName: currentSession.subjectName,
      subjectColor: currentSession.subjectColor,
      startTime: startTimeIso,
      endTime: endTimeIso,
      durationSeconds,
      topic: data.topic.trim() || currentSession.topic,
      focusScore: Math.min(10, Math.max(1, data.focusScore)),
      sessionType: currentSession.sessionType,
      accomplishment: data.accomplishment?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    // Deduplicate and append new session
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === newId || (s.startTime === startTimeIso && s.subjectId === currentSession.subjectId));
      if (exists) return prev;
      return [completedSession, ...prev];
    });

    // If linked to a planner task, mark it completed
    if (currentSession.taskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === currentSession.taskId
            ? { ...t, completed: true, completedAt: endTimeIso }
            : t
        )
      );
    }

    // Clear active session immediately
    setActiveSession(null);
    soundEngine.stopAmbientSound();

    if (settings.soundEnabled) {
      soundEngine.playCompletionChime();
    }

    // Confetti celebration
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: [currentSession.subjectColor, '#6366f1', '#10b981', '#f59e0b'],
      });
    } catch {}

    sendAppNotification(
      'Session Completed! 🎉',
      `You studied ${Math.round(durationSeconds / 60)} min of ${currentSession.subjectName} with a focus score of ${data.focusScore}/10.`
    );

    setTimeout(() => {
      isFinishingRef.current = false;
    }, 500);

    return completedSession;
  }, [activeSession, settings.soundEnabled]);

  // Subject CRUD
  const addSubject = useCallback((subjData: Omit<Subject, 'id' | 'createdAt'>): Subject => {
    const newSubject: Subject = {
      ...subjData,
      id: `subj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSubjects((prev) => [...prev, newSubject]);
    return newSubject;
  }, []);

  const updateSubject = useCallback((updated: Subject) => {
    setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    // Also update subject metadata in existing sessions
    setSessions((prev) =>
      prev.map((sess) =>
        sess.subjectId === updated.id
          ? { ...sess, subjectName: updated.name, subjectColor: updated.color }
          : sess
      )
    );
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Session CRUD
  const addSession = useCallback((sessData: Omit<StudySession, 'id'>): StudySession => {
    const newSession: StudySession = {
      ...sessData,
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    setSessions((prev) => [newSession, ...prev]);
    return newSession;
  }, []);

  const updateSession = useCallback((updated: StudySession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Task CRUD
  const addTask = useCallback((taskData: Omit<StudyPlanTask, 'id' | 'createdAt' | 'completed'>): StudyPlanTask => {
    const newTask: StudyPlanTask = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
  }, []);

  const updateTask = useCallback((updated: StudyPlanTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Goal & Setting updates
  const updateGoals = useCallback((newGoals: Partial<UserGoals>) => {
    setGoals((prev) => ({ ...prev, ...newGoals }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const saveDailyReview = useCallback((reviewData: Omit<DailyReview, 'id' | 'createdAt'>): DailyReview => {
    const newReview: DailyReview = {
      ...reviewData,
      id: `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDailyReviews((prev) => {
      const filtered = prev.filter((r) => r.date !== reviewData.date);
      return [newReview, ...filtered];
    });
    return newReview;
  }, []);

  const resetToSampleData = useCallback(() => {
    setSessions(generateInitialSessions());
    setSubjects(INITIAL_SUBJECTS);
    setTasks(generateInitialTasks());
    setGoals(INITIAL_GOALS);
    setSettings(INITIAL_SETTINGS);
    setDailyReviews(generateInitialDailyReviews());
    setActiveSession(null);
  }, []);

  const exportDataJson = useCallback(() => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      sessions,
      subjects,
      tasks,
      goals,
      settings,
      dailyReviews,
    };
    return JSON.stringify(data, null, 2);
  }, [sessions, subjects, tasks, goals, settings, dailyReviews]);

  const importDataJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
      if (Array.isArray(parsed.subjects)) setSubjects(parsed.subjects);
      if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
      if (parsed.goals) setGoals(parsed.goals);
      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.dailyReviews)) setDailyReviews(parsed.dailyReviews);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ===================== ACCURATE COMPUTED METRICS =====================

  // Today's sessions & total seconds (including ongoing live session if active)
  const todaySessions = useMemo(() => {
    return sessions.filter((s) => s.date === todayDateStr);
  }, [sessions, todayDateStr]);

  const todayCompletedSeconds = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  }, [todaySessions]);

  const todaySeconds = useMemo(() => {
    const liveSec = activeSession && !activeSession.isPaused ? timerSeconds : 0;
    return todayCompletedSeconds + liveSec;
  }, [todayCompletedSeconds, activeSession, timerSeconds]);

  const todayMinutes = Math.floor(todaySeconds / 60);
  const todayHours = Number((todaySeconds / 3600).toFixed(2));
  const targetSeconds = (goals.dailyTargetHours || 5) * 3600;
  const todayProgressPercent = Math.min(100, Math.round((todaySeconds / targetSeconds) * 100));

  // Week & Month statistics (calculated accurately from real saved sessions)
  const { weekSeconds, monthSeconds } = useMemo(() => {
    const now = new Date();
    // Start of week (Monday in local time)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    let wSec = 0;
    let mSec = 0;

    sessions.forEach((sess) => {
      const sessDate = new Date(sess.startTime);
      if (sessDate >= startOfWeek) {
        wSec += sess.durationSeconds;
      }
      if (sessDate >= startOfMonth) {
        mSec += sess.durationSeconds;
      }
    });

    return { weekSeconds: wSec, monthSeconds: mSec };
  }, [sessions]);

  // Average daily study time across active days
  const dailyAvgSeconds = useMemo(() => {
    const dateMap: Record<string, number> = {};
    sessions.forEach((s) => {
      dateMap[s.date] = (dateMap[s.date] || 0) + s.durationSeconds;
    });
    const uniqueDays = Object.keys(dateMap).length;
    if (uniqueDays === 0) return 0;
    const total = Object.values(dateMap).reduce((a, b) => a + b, 0);
    return Math.round(total / uniqueDays);
  }, [sessions]);

  // Streak Calculation (minimum streak requirement in minutes)
  const streak = useMemo<StreakInfo>(() => {
    const minRequiredSec = (goals.minStreakMinutes || 30) * 60;
    const historyMap: Record<string, number> = {};

    sessions.forEach((s) => {
      historyMap[s.date] = (historyMap[s.date] || 0) + s.durationSeconds;
    });

    // Add active timer to today's historyMap
    if (activeSession) {
      historyMap[todayDateStr] = (historyMap[todayDateStr] || 0) + timerSeconds;
    }

    const todaySec = historyMap[todayDateStr] || 0;
    const todayCompleted = todaySec >= minRequiredSec;

    // Total days studied with >= minRequiredSec
    const totalDaysStudied = Object.values(historyMap).filter((sec) => sec >= minRequiredSec).length;

    // Calculate current streak backwards from today or yesterday
    let current = 0;
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check yesterday's status
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);
    const yesterdayCompleted = (historyMap[yesterdayStr] || 0) >= minRequiredSec;

    if (todayCompleted) {
      current = 1;
      let checkDate = new Date(yesterdayDate);
      while (true) {
        const dStr = getLocalDateString(checkDate);
        if ((historyMap[dStr] || 0) >= minRequiredSec) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (yesterdayCompleted) {
      current = 1;
      let checkDate = new Date(yesterdayDate);
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        const dStr = getLocalDateString(checkDate);
        if ((historyMap[dStr] || 0) >= minRequiredSec) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      current = 0;
    }

    // Longest historical streak calculation
    const qualifyingDates = Object.keys(historyMap)
      .filter((d) => (historyMap[d] || 0) >= minRequiredSec)
      .sort();

    let longest = current;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of qualifyingDates) {
      const parts = dStr.split('-').map(Number);
      const curDate = new Date(parts[0], parts[1] - 1, parts[2]);

      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffTime = curDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      longest = Math.max(longest, tempStreak);
      prevDate = curDate;
    }

    return {
      current,
      longest: Math.max(current, longest),
      totalDaysStudied,
      todayCompleted,
      historyMap,
    };
  }, [sessions, activeSession, timerSeconds, todayDateStr, goals.minStreakMinutes]);

  // Subject Stats Calculation
  const subjectStats = useMemo<SubjectStats[]>(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return subjects.map((subj) => {
      const subjSessions = sessions.filter((s) => s.subjectId === subj.id);
      const totalSec = subjSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      const totalMin = Math.round(totalSec / 60);
      const sessionCount = subjSessions.length;

      const totalFocus = subjSessions.reduce((acc, s) => acc + s.focusScore, 0);
      const avgFocus = sessionCount > 0 ? Number((totalFocus / sessionCount).toFixed(1)) : 0;

      let weeklySec = 0;
      let monthlySec = 0;

      subjSessions.forEach((s) => {
        const d = new Date(s.startTime);
        if (d >= startOfWeek) weeklySec += s.durationSeconds;
        if (d >= startOfMonth) monthlySec += s.durationSeconds;
      });

      return {
        id: subj.id,
        name: subj.name,
        color: subj.color,
        icon: subj.icon,
        weeklyTargetHours: subj.weeklyTargetHours,
        monthlyTargetHours: subj.monthlyTargetHours,
        totalSeconds: totalSec,
        totalMinutes: totalMin,
        sessionCount,
        avgFocus,
        weeklyMinutes: Math.round(weeklySec / 60),
        monthlyMinutes: Math.round(monthlySec / 60),
      };
    });
  }, [subjects, sessions]);

  // Analytics Calculation strictly from sessions
  const analytics = useMemo<AnalyticsSummary>(() => {
    const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalHours = Number((totalSeconds / 3600).toFixed(1));
    const avgSessionMinutes = sessions.length > 0 ? Math.round(totalSeconds / sessions.length / 60) : 0;

    const totalFocus = sessions.reduce((acc, s) => acc + s.focusScore, 0);
    const avgFocusScore = sessions.length > 0 ? Number((totalFocus / sessions.length).toFixed(1)) : 0;

    // Most and least studied subject
    const sortedSubjs = [...subjectStats].filter((s) => s.totalSeconds > 0).sort((a, b) => b.totalSeconds - a.totalSeconds);
    const mostStudiedSubject = sortedSubjs.length > 0 ? sortedSubjs[0] : null;
    const leastStudiedSubject = sortedSubjs.length > 1 ? sortedSubjs[sortedSubjs.length - 1] : null;

    // Best study day of week calculation
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayBuckets: { totalSec: number; count: number }[] = Array.from({ length: 7 }, () => ({ totalSec: 0, count: 0 }));

    sessions.forEach((s) => {
      const d = new Date(s.startTime);
      const dayIdx = d.getDay();
      dayBuckets[dayIdx].totalSec += s.durationSeconds;
      dayBuckets[dayIdx].count += 1;
    });

    let bestDayIdx = -1;
    let maxDayAvg = 0;
    dayBuckets.forEach((bucket, idx) => {
      if (bucket.count > 0) {
        const avg = bucket.totalSec / bucket.count / 3600;
        if (avg > maxDayAvg) {
          maxDayAvg = avg;
          bestDayIdx = idx;
        }
      }
    });

    const bestStudyDay = bestDayIdx !== -1 ? { dayName: dayNames[bestDayIdx], avgHours: Number(maxDayAvg.toFixed(1)) } : null;

    // Best study time window (Morning 6-12, Afternoon 12-17, Evening 17-22, Night 22-6)
    const timeWindows: Record<string, { totalFocus: number; count: number; name: string }> = {
      morning: { totalFocus: 0, count: 0, name: 'Morning (06:00 – 12:00)' },
      afternoon: { totalFocus: 0, count: 0, name: 'Afternoon (12:00 – 17:00)' },
      evening: { totalFocus: 0, count: 0, name: 'Evening (17:00 – 22:00)' },
      night: { totalFocus: 0, count: 0, name: 'Night (22:00 – 06:00)' },
    };

    sessions.forEach((s) => {
      const hour = new Date(s.startTime).getHours();
      let key = 'evening';
      if (hour >= 6 && hour < 12) key = 'morning';
      else if (hour >= 12 && hour < 17) key = 'afternoon';
      else if (hour >= 17 && hour < 22) key = 'evening';
      else key = 'night';

      timeWindows[key].totalFocus += s.focusScore;
      timeWindows[key].count += 1;
    });

    let bestWindow: { windowName: string; avgFocus: number; count: number } | null = null;
    let highestFocus = 0;

    Object.values(timeWindows).forEach((w) => {
      if (w.count > 0) {
        const avg = Number((w.totalFocus / w.count).toFixed(1));
        if (avg > highestFocus) {
          highestFocus = avg;
          bestWindow = { windowName: w.name, avgFocus: avg, count: w.count };
        }
      }
    });

    return {
      totalSeconds,
      totalHours,
      dailyAvgHours: Number((dailyAvgSeconds / 3600).toFixed(1)),
      avgSessionMinutes,
      avgFocusScore,
      mostStudiedSubject,
      leastStudiedSubject,
      bestStudyDay,
      bestStudyTime: bestWindow,
    };
  }, [sessions, subjectStats, dailyAvgSeconds]);

  const value = {
    sessions,
    subjects,
    tasks,
    goals,
    settings,
    activeSession,
    dailyReviews,
    timerSeconds,
    todayDateStr,
    todaySessions,
    todaySeconds,
    todayMinutes,
    todayHours,
    todayProgressPercent,
    weekSeconds,
    monthSeconds,
    dailyAvgSeconds,
    streak,
    subjectStats,
    analytics,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    finishSession,
    addSubject,
    updateSubject,
    deleteSubject,
    addSession,
    updateSession,
    deleteSession,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    updateGoals,
    updateSettings,
    setTheme,
    saveDailyReview,
    resetToSampleData,
    exportDataJson,
    importDataJson,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
