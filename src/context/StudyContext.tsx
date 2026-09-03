import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  StudySession,
  Subject,
  StudyPlanTask,
  DailyReview,
  PYQRecord,
  AnswerWritingRecord,
  RevisionItem,
  UserGoals,
  UserSettings,
  ActiveSession,
  SubjectStats,
  CategoryStats,
  StreakInfo,
  AnalyticsSummary,
  SyncStatus,
  SubjectCategory,
} from '../types';
import { UPSC_DEFAULT_SUBJECTS } from '../data/upscData';
import { soundEngine } from '../utils/audio';
import { sendAppNotification } from '../utils/notifications';
import { getLocalDateString } from '../utils/formatters';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';

interface StudyContextType {
  sessions: StudySession[];
  subjects: Subject[];
  tasks: StudyPlanTask[];
  dailyReviews: DailyReview[];
  pyqs: PYQRecord[];
  answers: AnswerWritingRecord[];
  revisions: RevisionItem[];
  goals: UserGoals;
  settings: UserSettings;
  activeSession: ActiveSession | null;
  timerSeconds: number;
  syncStatus: SyncStatus;
  isOnline: boolean;
  
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
  categoryStats: CategoryStats[];
  analytics: AnalyticsSummary;

  // Timer actions
  startSession: (params: {
    subjectId: string;
    topic: string;
    sessionGoalMinutes?: number;
    sessionType?: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading' | 'answer_writing' | 'pyq';
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
  }) => Promise<StudySession | null>;

  // CRUD actions (All save directly to user's isolated Firestore subcollections)
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'userId'>) => Promise<Subject>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addSession: (session: Omit<StudySession, 'id' | 'userId'>) => Promise<StudySession>;
  updateSession: (session: StudySession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  addTask: (task: Omit<StudyPlanTask, 'id' | 'createdAt' | 'completed' | 'userId'>) => Promise<StudyPlanTask>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (task: StudyPlanTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addPYQ: (pyq: Omit<PYQRecord, 'id' | 'createdAt' | 'userId'>) => Promise<PYQRecord>;
  deletePYQ: (id: string) => Promise<void>;

  addAnswerWriting: (ans: Omit<AnswerWritingRecord, 'id' | 'createdAt' | 'userId'>) => Promise<AnswerWritingRecord>;
  deleteAnswerWriting: (id: string) => Promise<void>;

  addRevisionItem: (rev: Omit<RevisionItem, 'id' | 'createdAt' | 'userId' | 'status'>) => Promise<RevisionItem>;
  completeRevisionStage: (id: string) => Promise<void>;
  deleteRevisionItem: (id: string) => Promise<void>;

  updateGoals: (goals: Partial<UserGoals>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  saveDailyReview: (review: Omit<DailyReview, 'id' | 'createdAt' | 'userId'>) => Promise<DailyReview>;

  resetToCleanCurriculum: () => Promise<void>;
  exportDataJson: () => string;
}

const StudyContext = createContext<StudyContextType | null>(null);

const DEFAULT_GOALS: UserGoals = {
  dailyTargetHours: 6,
  weeklyTargetHours: 36,
  minStreakMinutes: 30,
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  soundEnabled: true,
  ambientSound: 'none',
  ambientVolume: 0.4,
  notifications: {
    dailyReminder: true,
    dailyReminderTime: '08:00',
    goalReminder: true,
    breakReminder: true,
    breakIntervalMinutes: 50,
    endOfDayReview: true,
    endOfDayReviewTime: '22:00',
  },
};

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [todayDateStr, setTodayDateStr] = useState<string>(() => getLocalDateString());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Firestore real-time state arrays
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<StudyPlanTask[]>([]);
  const [dailyReviews, setDailyReviews] = useState<DailyReview[]>([]);
  const [pyqs, setPyqs] = useState<PYQRecord[]>([]);
  const [answers, setAnswers] = useState<AnswerWritingRecord[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Active Session state (persisted locally per user)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() => {
    if (!userId) return null;
    const saved = localStorage.getItem(`studyos_active_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const isFinishingRef = useRef(false);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic date check for midnight roll-over
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getLocalDateString();
      if (now !== todayDateStr) {
        setTodayDateStr(now);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [todayDateStr]);

  // Sync activeSession to localStorage
  useEffect(() => {
    if (!userId) return;
    if (activeSession) {
      localStorage.setItem(`studyos_active_${userId}`, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(`studyos_active_${userId}`);
    }
  }, [activeSession, userId]);

  // Apply Theme class
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

  // Live Timer tick calculation
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

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
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeSession]);

  // ===================== FIRESTORE & LOCAL STORAGE SYNC =====================
  useEffect(() => {
    if (!userId) {
      // Clear data on logout
      setSessions([]);
      setSubjects([]);
      setTasks([]);
      setDailyReviews([]);
      setPyqs([]);
      setAnswers([]);
      setRevisions([]);
      setGoals(DEFAULT_GOALS);
      setSettings(DEFAULT_SETTINGS);
      setActiveSession(null);
      return;
    }

    // Load any existing local data first
    try {
      const localDataStr = localStorage.getItem(`studyos_data_${userId}`);
      if (localDataStr) {
        const localData = JSON.parse(localDataStr);
        if (localData.sessions) setSessions(localData.sessions);
        if (localData.subjects && localData.subjects.length > 0) setSubjects(localData.subjects);
        if (localData.tasks) setTasks(localData.tasks);
        if (localData.dailyReviews) setDailyReviews(localData.dailyReviews);
        if (localData.pyqs) setPyqs(localData.pyqs);
        if (localData.answers) setAnswers(localData.answers);
        if (localData.revisions) setRevisions(localData.revisions);
        if (localData.goals) setGoals((prev) => ({ ...prev, ...localData.goals }));
        if (localData.settings) setSettings((prev) => ({ ...prev, ...localData.settings }));
      }
    } catch {}

    // If local user, ensure default subjects are seeded locally
    if (user?.isLocal) {
      const localDataStr = localStorage.getItem(`studyos_data_${userId}`);
      const localData = localDataStr ? JSON.parse(localDataStr) : {};
      if (!localData.subjects || localData.subjects.length === 0) {
        const now = new Date().toISOString();
        const initialSubjs: Subject[] = UPSC_DEFAULT_SUBJECTS.map((subj, idx) => ({
          ...subj,
          id: `subj-local-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          userId,
          createdAt: now,
        }));
        setSubjects(initialSubjs);
        const updatedLocal = { ...localData, subjects: initialSubjs };
        localStorage.setItem(`studyos_data_${userId}`, JSON.stringify(updatedLocal));
      }
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('saving');

    // 1. Root user doc listener (goals & settings)
    const userDocRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.goals) setGoals((prev) => ({ ...prev, ...data.goals }));
        if (data?.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    }, () => {});

    // 2. Subjects Subcollection
    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const unsubSubjects = onSnapshot(subjectsRef, async (snap) => {
      const items: Subject[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      if (items.length === 0) {
        // Seed default UPSC curriculum for fresh account
        try {
          const batch = writeBatch(db);
          const now = new Date().toISOString();
          UPSC_DEFAULT_SUBJECTS.forEach((subj) => {
            const docId = `subj-${subj.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-${Math.random().toString(36).substring(2, 6)}`;
            const ref = doc(db, 'users', userId, 'subjects', docId);
            batch.set(ref, {
              ...subj,
              userId,
              createdAt: now,
            });
          });
          await batch.commit();
        } catch {
          // Fallback local seed
          const now = new Date().toISOString();
          const fallback = UPSC_DEFAULT_SUBJECTS.map((subj, idx) => ({
            ...subj,
            id: `subj-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            userId,
            createdAt: now,
          }));
          setSubjects(fallback);
        }
      } else {
        setSubjects(items);
      }
      setSyncStatus('synced');
    }, () => {
      setSyncStatus('synced');
    });

    // 3. Study Sessions Subcollection
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const unsubSessions = onSnapshot(sessionsRef, (snap) => {
      const items: StudySession[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setSessions(items);
      setSyncStatus('synced');
    }, () => {
      setSyncStatus('synced');
    });

    // 4. Tasks Subcollection
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const items: StudyPlanTask[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setTasks(items);
    }, () => {});

    // 5. Daily Reviews Subcollection
    const reviewsRef = collection(db, 'users', userId, 'dailyReviews');
    const unsubReviews = onSnapshot(reviewsRef, (snap) => {
      const items: DailyReview[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => b.date.localeCompare(a.date));
      setDailyReviews(items);
    }, () => {});

    // 6. PYQ Subcollection
    const pyqsRef = collection(db, 'users', userId, 'pyqs');
    const unsubPyqs = onSnapshot(pyqsRef, (snap) => {
      const items: PYQRecord[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => b.date.localeCompare(a.date));
      setPyqs(items);
    }, () => {});

    // 7. Answer Writing Subcollection
    const answersRef = collection(db, 'users', userId, 'answerWriting');
    const unsubAnswers = onSnapshot(answersRef, (snap) => {
      const items: AnswerWritingRecord[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => b.date.localeCompare(a.date));
      setAnswers(items);
    }, () => {});

    // 8. Spaced Repetition Revision Subcollection
    const revsRef = collection(db, 'users', userId, 'revision');
    const unsubRevs = onSnapshot(revsRef, (snap) => {
      const items: RevisionItem[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => a.nextDue.localeCompare(b.nextDue));
      setRevisions(items);
    }, () => {});

    return () => {
      unsubUser();
      unsubSubjects();
      unsubSessions();
      unsubTasks();
      unsubReviews();
      unsubPyqs();
      unsubAnswers();
      unsubRevs();
    };
  }, [userId, user?.isLocal]);

  // Save changes to local storage backup
  useEffect(() => {
    if (!userId) return;
    try {
      const snapshot = {
        sessions,
        subjects,
        tasks,
        dailyReviews,
        pyqs,
        answers,
        revisions,
        goals,
        settings,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`studyos_data_${userId}`, JSON.stringify(snapshot));
    } catch {}
  }, [userId, sessions, subjects, tasks, dailyReviews, pyqs, answers, revisions, goals, settings]);

  // ===================== TIMER ACTIONS =====================

  const startSession = useCallback((params: {
    subjectId: string;
    topic: string;
    sessionGoalMinutes?: number;
    sessionType?: 'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading' | 'answer_writing' | 'pyq';
    taskId?: string;
  }) => {
    const subj = subjects.find((s) => s.id === params.subjectId) || {
      id: params.subjectId || `subj-${Date.now()}`,
      name: 'General Studies',
      color: '#6366f1',
    };

    const now = Date.now();
    const newSession: ActiveSession = {
      subjectId: subj.id,
      subjectName: subj.name,
      subjectColor: subj.color,
      topic: params.topic.trim() || `${subj.name} Study Session`,
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

  const cancelSession = useCallback(() => {
    isFinishingRef.current = false;
    setActiveSession(null);
    soundEngine.stopAmbientSound();
  }, []);

  const finishSession = useCallback(async (data: {
    topic: string;
    focusScore: number;
    accomplishment?: string;
    notes?: string;
  }): Promise<StudySession | null> => {
    if (!activeSession) return null;
    if (isFinishingRef.current) return null;
    if (!userId) return null;

    isFinishingRef.current = true;
    setSyncStatus('saving');

    const currentSession = activeSession;
    const now = Date.now();
    let finalSeconds = currentSession.accumulatedSeconds;
    if (!currentSession.isPaused) {
      const elapsed = Math.floor((now - currentSession.lastResumedTime) / 1000);
      finalSeconds += Math.max(0, elapsed);
    }

    const durationSeconds = Math.max(10, finalSeconds);
    const startTimeDate = new Date(currentSession.startTime);
    const startTimeIso = startTimeDate.toISOString();
    const endTimeIso = new Date(now).toISOString();
    const dateStr = getLocalDateString(startTimeDate);

    const newId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const completedSession: StudySession = {
      id: newId,
      userId,
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
      createdAt: endTimeIso,
    };

    try {
      // 1. Update local state immediately
      setSessions((prev) => [completedSession, ...prev.filter((s) => s.id !== newId)]);

      // 2. Write to Firestore if not local
      if (!user?.isLocal) {
        const sessionDocRef = doc(db, 'users', userId, 'sessions', newId);
        await setDoc(sessionDocRef, completedSession).catch((err) => {
          console.warn('Firestore session sync warning:', err);
        });

        if (currentSession.taskId) {
          const taskDocRef = doc(db, 'users', userId, 'tasks', currentSession.taskId);
          await updateDoc(taskDocRef, {
            completed: true,
            completedAt: endTimeIso,
          }).catch(() => {});
        }
      }

      if (currentSession.taskId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === currentSession.taskId ? { ...t, completed: true, completedAt: endTimeIso } : t))
        );
      }

      // 3. Clear active timer
      setActiveSession(null);
      soundEngine.stopAmbientSound();
      setSyncStatus('synced');

      if (settings.soundEnabled) {
        soundEngine.playCompletionChime();
      }

      try {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 },
          colors: [currentSession.subjectColor, '#6366f1', '#10b981', '#f59e0b'],
        });
      } catch {}

      sendAppNotification(
        'UPSC Session Saved! 🎯',
        `Logged ${Math.round(durationSeconds / 60)} min of ${currentSession.subjectName} with focus ${data.focusScore}/10.`
      );

      setTimeout(() => {
        isFinishingRef.current = false;
      }, 500);

      return completedSession;
    } catch (err) {
      console.warn('Session save fallback completed:', err);
      setActiveSession(null);
      setSyncStatus('synced');
      isFinishingRef.current = false;
      return completedSession;
    }
  }, [activeSession, userId, user?.isLocal, settings.soundEnabled]);

  // ===================== CRUD OPERATIONS =====================

  const addSubject = useCallback(async (subjData: Omit<Subject, 'id' | 'createdAt' | 'userId'>): Promise<Subject> => {
    if (!userId) throw new Error('Not authenticated');
    const newId = `subj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newSubject: Subject = {
      ...subjData,
      id: newId,
      userId,
      createdAt: now,
    };
    setSubjects((prev) => [...prev, newSubject]);
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'subjects', newId);
      await setDoc(ref, newSubject).catch(() => {});
    }
    return newSubject;
  }, [userId, user?.isLocal]);

  const updateSubject = useCallback(async (updated: Subject) => {
    if (!userId) return;
    setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'subjects', updated.id);
      await updateDoc(ref, {
        name: updated.name,
        color: updated.color,
        icon: updated.icon,
        category: updated.category || 'GS',
        weeklyTargetHours: updated.weeklyTargetHours,
        monthlyTargetHours: updated.monthlyTargetHours,
      }).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const deleteSubject = useCallback(async (id: string) => {
    if (!userId) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'subjects', id);
      await deleteDoc(ref).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const addSession = useCallback(async (sessData: Omit<StudySession, 'id' | 'userId'>): Promise<StudySession> => {
    if (!userId) throw new Error('Not authenticated');
    const newId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newSession: StudySession = {
      ...sessData,
      id: newId,
      userId,
      createdAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'sessions', newId);
      await setDoc(ref, newSession).catch(() => {});
    }
    return newSession;
  }, [userId, user?.isLocal]);

  const updateSession = useCallback(async (updated: StudySession) => {
    if (!userId) return;
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'sessions', updated.id);
      await updateDoc(ref, { ...updated }).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const deleteSession = useCallback(async (id: string) => {
    if (!userId) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'sessions', id);
      await deleteDoc(ref).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const addTask = useCallback(async (taskData: Omit<StudyPlanTask, 'id' | 'createdAt' | 'completed' | 'userId'>): Promise<StudyPlanTask> => {
    if (!userId) throw new Error('Not authenticated');
    const newId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: StudyPlanTask = {
      ...taskData,
      id: newId,
      userId,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'tasks', newId);
      await setDoc(ref, newTask).catch(() => {});
    }
    return newTask;
  }, [userId, user?.isLocal]);

  const toggleTask = useCallback(async (id: string) => {
    if (!userId) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const updatedStatus = !task.completed;
    const completedAt = updatedStatus ? new Date().toISOString() : null;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: updatedStatus, completedAt } : t))
    );
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'tasks', id);
      await updateDoc(ref, {
        completed: updatedStatus,
        completedAt,
      }).catch(() => {});
    }
  }, [userId, user?.isLocal, tasks]);

  const updateTask = useCallback(async (updated: StudyPlanTask) => {
    if (!userId) return;
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'tasks', updated.id);
      await updateDoc(ref, { ...updated }).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const deleteTask = useCallback(async (id: string) => {
    if (!userId) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'tasks', id);
      await deleteDoc(ref).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const addPYQ = useCallback(async (pyqData: Omit<PYQRecord, 'id' | 'createdAt' | 'userId'>): Promise<PYQRecord> => {
    if (!userId) throw new Error('Not authenticated');
    const newId = `pyq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPYQ: PYQRecord = {
      ...pyqData,
      id: newId,
      userId,
      createdAt: new Date().toISOString(),
    };
    setPyqs((prev) => [newPYQ, ...prev]);
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'pyqs', newId);
      await setDoc(ref, newPYQ).catch(() => {});
    }
    return newPYQ;
  }, [userId, user?.isLocal]);

  const deletePYQ = useCallback(async (id: string) => {
    if (!userId) return;
    setPyqs((prev) => prev.filter((p) => p.id !== id));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'pyqs', id);
      await deleteDoc(ref).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const addAnswerWriting = useCallback(async (ansData: Omit<AnswerWritingRecord, 'id' | 'createdAt' | 'userId'>): Promise<AnswerWritingRecord> => {
    if (!userId) throw new Error('Not authenticated');
    const newId = `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAns: AnswerWritingRecord = {
      ...ansData,
      id: newId,
      userId,
      createdAt: new Date().toISOString(),
    };
    setAnswers((prev) => [newAns, ...prev]);
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'answerWriting', newId);
      await setDoc(ref, newAns).catch(() => {});
    }
    return newAns;
  }, [userId, user?.isLocal]);

  const deleteAnswerWriting = useCallback(async (id: string) => {
    if (!userId) return;
    setAnswers((prev) => prev.filter((a) => a.id !== id));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'answerWriting', id);
      await deleteDoc(ref).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const addRevisionItem = useCallback(async (revData: Omit<RevisionItem, 'id' | 'createdAt' | 'userId' | 'status'>): Promise<RevisionItem> => {
    if (!userId) throw new Error('Not authenticated');
    const newId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRev: RevisionItem = {
      ...revData,
      id: newId,
      userId,
      status: revData.nextDue <= todayDateStr ? 'due' : 'upcoming',
      createdAt: new Date().toISOString(),
    };
    setRevisions((prev) => [...prev, newRev]);
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'revision', newId);
      await setDoc(ref, newRev).catch(() => {});
    }
    return newRev;
  }, [userId, user?.isLocal, todayDateStr]);

  const completeRevisionStage = useCallback(async (id: string) => {
    if (!userId) return;
    const rev = revisions.find((r) => r.id === id);
    if (!rev) return;

    // Spaced repetition intervals: 1 -> 3 days -> 7 days -> 15 days -> 30 days -> complete
    const intervals = [1, 3, 7, 15, 30];
    const nextStage = rev.stage + 1;
    const now = new Date();
    const lastRevStr = getLocalDateString(now);

    if (nextStage > intervals.length) {
      // Completed all 5 intervals
      setRevisions((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'completed' as const, lastRevised: lastRevStr } : r))
      );
      if (!user?.isLocal) {
        const ref = doc(db, 'users', userId, 'revision', id);
        await updateDoc(ref, {
          status: 'completed',
          lastRevised: lastRevStr,
        }).catch(() => {});
      }
    } else {
      const daysToAdd = intervals[nextStage - 1];
      const nextDueDate = new Date(now);
      nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);
      const nextDueStr = getLocalDateString(nextDueDate);

      setRevisions((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                stage: nextStage,
                lastRevised: lastRevStr,
                nextDue: nextDueStr,
                status: (nextDueStr <= todayDateStr ? 'due' : 'upcoming') as 'due' | 'upcoming',
              }
            : r
        )
      );

      if (!user?.isLocal) {
        const ref = doc(db, 'users', userId, 'revision', id);
        await updateDoc(ref, {
          stage: nextStage,
          lastRevised: lastRevStr,
          nextDue: nextDueStr,
          status: nextDueStr <= todayDateStr ? 'due' : 'upcoming',
        }).catch(() => {});
      }
    }
  }, [userId, user?.isLocal, revisions, todayDateStr]);

  const deleteRevisionItem = useCallback(async (id: string) => {
    if (!userId) return;
    setRevisions((prev) => prev.filter((r) => r.id !== id));
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'revision', id);
      await deleteDoc(ref).catch(() => {});
    }
  }, [userId, user?.isLocal]);

  const updateGoals = useCallback(async (newGoals: Partial<UserGoals>) => {
    if (!userId) return;
    const updated = { ...goals, ...newGoals };
    setGoals(updated);
    if (!user?.isLocal) {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        goals: updated,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [userId, user?.isLocal, goals]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!userId) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (!user?.isLocal) {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        settings: updated,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [userId, user?.isLocal, settings]);

  const setTheme = useCallback(async (theme: 'dark' | 'light') => {
    await updateSettings({ theme });
  }, [updateSettings]);

  const saveDailyReview = useCallback(async (reviewData: Omit<DailyReview, 'id' | 'createdAt' | 'userId'>): Promise<DailyReview> => {
    if (!userId) throw new Error('Not authenticated');
    const newId = `rev-${reviewData.date}`;
    const newReview: DailyReview = {
      ...reviewData,
      id: newId,
      userId,
      createdAt: new Date().toISOString(),
    };
    setDailyReviews((prev) => [newReview, ...prev.filter((r) => r.id !== newId)]);
    if (!user?.isLocal) {
      const ref = doc(db, 'users', userId, 'dailyReviews', newId);
      await setDoc(ref, newReview).catch(() => {});
    }
    return newReview;
  }, [userId, user?.isLocal]);

  const resetToCleanCurriculum = useCallback(async () => {
    if (!userId) return;
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    UPSC_DEFAULT_SUBJECTS.forEach((subj) => {
      const docId = `subj-${subj.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-${Math.random().toString(36).substring(2, 6)}`;
      const ref = doc(db, 'users', userId, 'subjects', docId);
      batch.set(ref, {
        ...subj,
        userId,
        createdAt: now,
      });
    });
    await batch.commit();
  }, [userId]);

  const exportDataJson = useCallback(() => {
    const data = {
      version: '3.0-multiuser',
      userId,
      exportedAt: new Date().toISOString(),
      sessions,
      subjects,
      tasks,
      goals,
      settings,
      dailyReviews,
      pyqs,
      answers,
      revisions,
    };
    return JSON.stringify(data, null, 2);
  }, [userId, sessions, subjects, tasks, goals, settings, dailyReviews, pyqs, answers, revisions]);

  // ===================== REAL-TIME ACCURATE CALCULATIONS =====================

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
  const targetSeconds = (goals.dailyTargetHours || 6) * 3600;
  const todayProgressPercent = Math.min(100, Math.round((todaySeconds / targetSeconds) * 100));

  const { weekSeconds, monthSeconds } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

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

  const streak = useMemo<StreakInfo>(() => {
    const minRequiredSec = (goals.minStreakMinutes || 30) * 60;
    const historyMap: Record<string, number> = {};

    sessions.forEach((s) => {
      historyMap[s.date] = (historyMap[s.date] || 0) + s.durationSeconds;
    });

    if (activeSession) {
      historyMap[todayDateStr] = (historyMap[todayDateStr] || 0) + timerSeconds;
    }

    const todaySec = historyMap[todayDateStr] || 0;
    const todayCompleted = todaySec >= minRequiredSec;
    const totalDaysStudied = Object.values(historyMap).filter((sec) => sec >= minRequiredSec).length;

    let current = 0;
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
        category: subj.category || 'GS',
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

  // GS vs Optional vs CSAT category breakdown
  const categoryStats = useMemo<CategoryStats[]>(() => {
    const categories: { key: SubjectCategory; label: string; color: string }[] = [
      { key: 'GS', label: 'General Studies (GS)', color: '#6366f1' },
      { key: 'OPTIONAL', label: 'Optional Subject', color: '#ec4899' },
      { key: 'CSAT', label: 'CSAT', color: '#f97316' },
      { key: 'ESSAY_CA', label: 'Essay & Current Affairs', color: '#10b981' },
      { key: 'OTHER', label: 'Other', color: '#64748b' },
    ];

    const totalSecondsAll = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    return categories.map((cat) => {
      const matchingSubjIds = new Set(subjects.filter((s) => (s.category || 'GS') === cat.key).map((s) => s.id));
      const catSessions = sessions.filter((s) => matchingSubjIds.has(s.subjectId));
      const sec = catSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      const hours = Number((sec / 3600).toFixed(1));
      const percent = totalSecondsAll > 0 ? Math.round((sec / totalSecondsAll) * 100) : 0;

      return {
        category: cat.key,
        label: cat.label,
        totalSeconds: sec,
        totalHours: hours,
        percent,
        sessionCount: catSessions.length,
        color: cat.color,
      };
    });
  }, [subjects, sessions]);

  const analytics = useMemo<AnalyticsSummary>(() => {
    const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalHours = Number((totalSeconds / 3600).toFixed(1));
    const avgSessionMinutes = sessions.length > 0 ? Math.round(totalSeconds / sessions.length / 60) : 0;

    const totalFocus = sessions.reduce((acc, s) => acc + s.focusScore, 0);
    const avgFocusScore = sessions.length > 0 ? Number((totalFocus / sessions.length).toFixed(1)) : 0;

    const sortedSubjs = [...subjectStats].filter((s) => s.totalSeconds > 0).sort((a, b) => b.totalSeconds - a.totalSeconds);
    const mostStudiedSubject = sortedSubjs.length > 0 ? sortedSubjs[0] : null;
    const leastStudiedSubject = sortedSubjs.length > 1 ? sortedSubjs[sortedSubjs.length - 1] : null;

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
      categoryDistribution: categoryStats,
    };
  }, [sessions, subjectStats, dailyAvgSeconds, categoryStats]);

  const value = {
    sessions,
    subjects,
    tasks,
    dailyReviews,
    pyqs,
    answers,
    revisions,
    goals,
    settings,
    activeSession,
    timerSeconds,
    syncStatus,
    isOnline,
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
    categoryStats,
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
    addPYQ,
    deletePYQ,
    addAnswerWriting,
    deleteAnswerWriting,
    addRevisionItem,
    completeRevisionStage,
    deleteRevisionItem,
    updateGoals,
    updateSettings,
    setTheme,
    saveDailyReview,
    resetToCleanCurriculum,
    exportDataJson,
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
