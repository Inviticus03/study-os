import { Subject, StudySession, StudyPlanTask, UserGoals, UserSettings, DailyReview } from '../types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-maths',
    name: 'Mathematics',
    color: '#6366f1', // Indigo
    icon: 'Calculator',
    weeklyTargetHours: 6,
    monthlyTargetHours: 25,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'subj-physics',
    name: 'Physics',
    color: '#0ea5e9', // Sky Blue
    icon: 'Atom',
    weeklyTargetHours: 5,
    monthlyTargetHours: 20,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'subj-chemistry',
    name: 'Chemistry',
    color: '#10b981', // Emerald
    icon: 'FlaskConical',
    weeklyTargetHours: 4,
    monthlyTargetHours: 16,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'subj-cs',
    name: 'Computer Science',
    color: '#8b5cf6', // Violet
    icon: 'Code',
    weeklyTargetHours: 6,
    monthlyTargetHours: 24,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'subj-english',
    name: 'English',
    color: '#f59e0b', // Amber
    icon: 'BookOpen',
    weeklyTargetHours: 3,
    monthlyTargetHours: 12,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'subj-biology',
    name: 'Biology',
    color: '#14b8a6', // Teal
    icon: 'Dna',
    weeklyTargetHours: 3,
    monthlyTargetHours: 12,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'subj-other',
    name: 'Other',
    color: '#64748b', // Slate
    icon: 'Sparkles',
    weeklyTargetHours: 2,
    monthlyTargetHours: 8,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export const INITIAL_GOALS: UserGoals = {
  dailyTargetHours: 5,
  weeklyTargetHours: 30,
  minStreakMinutes: 30,
};

export const INITIAL_SETTINGS: UserSettings = {
  theme: 'dark',
  soundEnabled: true,
  ambientSound: 'none',
  ambientVolume: 0.4,
  notifications: {
    dailyReminder: true,
    dailyReminderTime: '09:00',
    goalReminder: true,
    breakReminder: true,
    breakIntervalMinutes: 50,
    endOfDayReview: true,
    endOfDayReviewTime: '21:30',
  },
};

// Generate realistic dynamic date strings based on current date
function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function generateInitialSessions(): StudySession[] {
  const today = getDateStr(0);
  const d1 = getDateStr(1);
  const d2 = getDateStr(2);
  const d3 = getDateStr(3);
  const d4 = getDateStr(4);
  const d5 = getDateStr(5);
  const d6 = getDateStr(6);
  const d7 = getDateStr(7);
  const d8 = getDateStr(8);
  const d9 = getDateStr(9);
  const d10 = getDateStr(10);
  const d11 = getDateStr(11);

  return [
    // Today's sessions: Total 3h 25m = 205 mins (12,300 seconds)
    {
      id: 'sess-today-1',
      date: today,
      subjectId: 'subj-maths',
      subjectName: 'Mathematics',
      subjectColor: '#6366f1',
      startTime: `${today}T09:00:00.000Z`,
      endTime: `${today}T10:30:00.000Z`,
      durationSeconds: 90 * 60, // 1h 30m
      topic: 'Calculus: Integration by Parts & Trigonometric Substitution',
      focusScore: 9,
      sessionType: 'deep_work',
      accomplishment: 'Solved 15 textbook problem sets and memorized integration identities.',
      notes: 'Morning energy was high. Coffee helped focus on derivation steps.',
    },
    {
      id: 'sess-today-2',
      date: today,
      subjectId: 'subj-physics',
      subjectName: 'Physics',
      subjectColor: '#0ea5e9',
      startTime: `${today}T11:15:00.000Z`,
      endTime: `${today}T12:30:00.000Z`,
      durationSeconds: 75 * 60, // 1h 15m
      topic: 'Electrostatics & Coulomb Law Applications',
      focusScore: 8,
      sessionType: 'practice',
      accomplishment: 'Completed Gauss law numerical problems and field vector graphs.',
      notes: 'Need to review dipole moment derivations again.',
    },
    {
      id: 'sess-today-3',
      date: today,
      subjectId: 'subj-cs',
      subjectName: 'Computer Science',
      subjectColor: '#8b5cf6',
      startTime: `${today}T15:00:00.000Z`,
      endTime: `${today}T15:40:00.000Z`,
      durationSeconds: 40 * 60, // 40m
      topic: 'Dynamic Programming: 0/1 Knapsack & Memoization',
      focusScore: 9,
      sessionType: 'deep_work',
      accomplishment: 'Implemented recursion trees and bottom-up DP table space optimization.',
      notes: 'Very clear conceptual understanding after drawing 2D matrices.',
    },

    // Yesterday (d1) - 4h 30m
    {
      id: 'sess-d1-1',
      date: d1,
      subjectId: 'subj-cs',
      subjectName: 'Computer Science',
      subjectColor: '#8b5cf6',
      startTime: `${d1}T09:30:00.000Z`,
      endTime: `${d1}T11:30:00.000Z`,
      durationSeconds: 120 * 60, // 2h
      topic: 'Graph Algorithms: Dijkstra & BFS/DFS Traversal',
      focusScore: 9,
      sessionType: 'deep_work',
      accomplishment: 'Implemented Dijkstra with priority queue and solved 3 graph problems.',
    },
    {
      id: 'sess-d1-2',
      date: d1,
      subjectId: 'subj-chemistry',
      subjectName: 'Chemistry',
      subjectColor: '#10b981',
      startTime: `${d1}T14:00:00.000Z`,
      endTime: `${d1}T15:30:00.000Z`,
      durationSeconds: 90 * 60, // 1h 30m
      topic: 'Organic Chemistry: Aldehydes, Ketones & Nucleophilic Addition',
      focusScore: 8,
      sessionType: 'revision',
      accomplishment: 'Created synthesis reaction flowcharts and reaction mechanism flashcards.',
    },
    {
      id: 'sess-d1-3',
      date: d1,
      subjectId: 'subj-english',
      subjectName: 'English',
      subjectColor: '#f59e0b',
      startTime: `${d1}T17:00:00.000Z`,
      endTime: `${d1}T18:00:00.000Z`,
      durationSeconds: 60 * 60, // 1h
      topic: 'Literature Analysis & Essay Structure Revision',
      focusScore: 8,
      sessionType: 'reading',
      accomplishment: 'Outlined thesis statement and 3 supporting analytical arguments.',
    },

    // Day 2 ago (d2) - 5h 15m
    {
      id: 'sess-d2-1',
      date: d2,
      subjectId: 'subj-maths',
      subjectName: 'Mathematics',
      subjectColor: '#6366f1',
      startTime: `${d2}T08:45:00.000Z`,
      endTime: `${d2}T11:00:00.000Z`,
      durationSeconds: 135 * 60, // 2h 15m
      topic: 'Differential Equations: Linear & Homogeneous Equations',
      focusScore: 9,
      sessionType: 'deep_work',
      accomplishment: 'Derived integrating factor formulas and solved 12 past paper problems.',
    },
    {
      id: 'sess-d2-2',
      date: d2,
      subjectId: 'subj-physics',
      subjectName: 'Physics',
      subjectColor: '#0ea5e9',
      startTime: `${d2}T13:30:00.000Z`,
      endTime: `${d2}T15:30:00.000Z`,
      durationSeconds: 120 * 60, // 2h
      topic: 'Electromagnetic Waves & Wave Optics Interference',
      focusScore: 8,
      sessionType: 'practice',
      accomplishment: 'Solved Young double slit numericals with phase shift calculations.',
    },
    {
      id: 'sess-d2-3',
      date: d2,
      subjectId: 'subj-biology',
      subjectName: 'Biology',
      subjectColor: '#14b8a6',
      startTime: `${d2}T16:30:00.000Z`,
      endTime: `${d2}T17:30:00.000Z`,
      durationSeconds: 60 * 60, // 1h
      topic: 'Cellular Respiration & Krebs Cycle ATP Balance',
      focusScore: 7,
      sessionType: 'revision',
      accomplishment: 'Drew pathway diagrams and enzyme regulation points.',
    },

    // Days 3 to 11 (maintaining continuous streak > 30 min daily)
    {
      id: 'sess-d3-1',
      date: d3,
      subjectId: 'subj-chemistry',
      subjectName: 'Chemistry',
      subjectColor: '#10b981',
      startTime: `${d3}T10:00:00.000Z`,
      endTime: `${d3}T12:30:00.000Z`,
      durationSeconds: 150 * 60, // 2.5h
      topic: 'Chemical Kinetics: Rate Laws & Arrhenius Activation Energy',
      focusScore: 8,
      sessionType: 'deep_work',
    },
    {
      id: 'sess-d3-2',
      date: d3,
      subjectId: 'subj-maths',
      subjectName: 'Mathematics',
      subjectColor: '#6366f1',
      startTime: `${d3}T15:00:00.000Z`,
      endTime: `${d3}T17:00:00.000Z`,
      durationSeconds: 120 * 60, // 2h
      topic: 'Vectors & 3D Geometry in Cartesian Space',
      focusScore: 9,
      sessionType: 'practice',
    },

    {
      id: 'sess-d4-1',
      date: d4,
      subjectId: 'subj-cs',
      subjectName: 'Computer Science',
      subjectColor: '#8b5cf6',
      startTime: `${d4}T09:00:00.000Z`,
      endTime: `${d4}T11:45:00.000Z`,
      durationSeconds: 165 * 60, // 2h 45m
      topic: 'Database Systems: Normalization & Indexing B-Trees',
      focusScore: 9,
      sessionType: 'deep_work',
    },
    {
      id: 'sess-d4-2',
      date: d4,
      subjectId: 'subj-physics',
      subjectName: 'Physics',
      subjectColor: '#0ea5e9',
      startTime: `${d4}T14:30:00.000Z`,
      endTime: `${d4}T16:00:00.000Z`,
      durationSeconds: 90 * 60, // 1.5h
      topic: 'Thermodynamics: Heat Engines & Carnot Cycle Efficiency',
      focusScore: 8,
      sessionType: 'practice',
    },

    {
      id: 'sess-d5-1',
      date: d5,
      subjectId: 'subj-maths',
      subjectName: 'Mathematics',
      subjectColor: '#6366f1',
      startTime: `${d5}T10:00:00.000Z`,
      endTime: `${d5}T13:00:00.000Z`,
      durationSeconds: 180 * 60, // 3h
      topic: 'Probability: Bayes Theorem & Random Variable Distributions',
      focusScore: 9,
      sessionType: 'deep_work',
    },

    {
      id: 'sess-d6-1',
      date: d6,
      subjectId: 'subj-physics',
      subjectName: 'Physics',
      subjectColor: '#0ea5e9',
      startTime: `${d6}T09:15:00.000Z`,
      endTime: `${d6}T12:15:00.000Z`,
      durationSeconds: 180 * 60, // 3h
      topic: 'Rotational Dynamics: Moment of Inertia & Angular Momentum',
      focusScore: 9,
      sessionType: 'deep_work',
    },
    {
      id: 'sess-d6-2',
      date: d6,
      subjectId: 'subj-english',
      subjectName: 'English',
      subjectColor: '#f59e0b',
      startTime: `${d6}T15:00:00.000Z`,
      endTime: `${d6}T16:15:00.000Z`,
      durationSeconds: 75 * 60, // 1h 15m
      topic: 'Critical Reading & Argument Reconstruction',
      focusScore: 8,
      sessionType: 'reading',
    },

    {
      id: 'sess-d7-1',
      date: d7,
      subjectId: 'subj-cs',
      subjectName: 'Computer Science',
      subjectColor: '#8b5cf6',
      startTime: `${d7}T11:00:00.000Z`,
      endTime: `${d7}T13:30:00.000Z`,
      durationSeconds: 150 * 60, // 2.5h
      topic: 'Operating Systems: Concurrency, Mutex Locks & Semaphores',
      focusScore: 9,
      sessionType: 'deep_work',
    },
    {
      id: 'sess-d8-1',
      date: d8,
      subjectId: 'subj-chemistry',
      subjectName: 'Chemistry',
      subjectColor: '#10b981',
      startTime: `${d8}T09:00:00.000Z`,
      endTime: `${d8}T11:30:00.000Z`,
      durationSeconds: 150 * 60, // 2.5h
      topic: 'Coordination Chemistry & Crystal Field Theory',
      focusScore: 8,
      sessionType: 'revision',
    },
    {
      id: 'sess-d9-1',
      date: d9,
      subjectId: 'subj-maths',
      subjectName: 'Mathematics',
      subjectColor: '#6366f1',
      startTime: `${d9}T14:00:00.000Z`,
      endTime: `${d9}T16:45:00.000Z`,
      durationSeconds: 165 * 60, // 2h 45m
      topic: 'Matrices, Determinants & System of Linear Equations',
      focusScore: 9,
      sessionType: 'deep_work',
    },
    {
      id: 'sess-d10-1',
      date: d10,
      subjectId: 'subj-physics',
      subjectName: 'Physics',
      subjectColor: '#0ea5e9',
      startTime: `${d10}T10:00:00.000Z`,
      endTime: `${d10}T12:40:00.000Z`,
      durationSeconds: 160 * 60, // 2h 40m
      topic: 'Magnetism: Biot-Savart Law & Ampere Circuital Law',
      focusScore: 8,
      sessionType: 'practice',
    },
    {
      id: 'sess-d11-1',
      date: d11,
      subjectId: 'subj-cs',
      subjectName: 'Computer Science',
      subjectColor: '#8b5cf6',
      startTime: `${d11}T09:00:00.000Z`,
      endTime: `${d11}T11:30:00.000Z`,
      durationSeconds: 150 * 60, // 2.5h
      topic: 'Computer Networks: TCP/IP Stack & Congestion Control',
      focusScore: 9,
      sessionType: 'deep_work',
    },
  ];
}

export function generateInitialTasks(): StudyPlanTask[] {
  const today = getDateStr(0);
  return [
    {
      id: 'task-1',
      subjectId: 'subj-maths',
      subjectName: 'Mathematics',
      subjectColor: '#6366f1',
      task: 'Integration practice: 15 definite integral problems',
      estimatedMinutes: 60,
      priority: 'high',
      date: today,
      completed: true,
      completedAt: `${today}T10:30:00.000Z`,
      createdAt: `${today}T08:00:00.000Z`,
    },
    {
      id: 'task-2',
      subjectId: 'subj-physics',
      subjectName: 'Physics',
      subjectColor: '#0ea5e9',
      task: 'Electrostatics: Gauss Law & Electric Potential numericals',
      estimatedMinutes: 90,
      priority: 'high',
      date: today,
      completed: true,
      completedAt: `${today}T12:30:00.000Z`,
      createdAt: `${today}T08:00:00.000Z`,
    },
    {
      id: 'task-3',
      subjectId: 'subj-chemistry',
      subjectName: 'Chemistry',
      subjectColor: '#10b981',
      task: 'Organic Chemistry: Aldol Condensation revision & mechanisms',
      estimatedMinutes: 45,
      priority: 'medium',
      date: today,
      completed: false,
      createdAt: `${today}T08:00:00.000Z`,
    },
    {
      id: 'task-4',
      subjectId: 'subj-cs',
      subjectName: 'Computer Science',
      subjectColor: '#8b5cf6',
      task: 'Dynamic Programming: 2 LeetCode Medium problem sets',
      estimatedMinutes: 50,
      priority: 'high',
      date: today,
      completed: true,
      completedAt: `${today}T15:40:00.000Z`,
      createdAt: `${today}T08:00:00.000Z`,
    },
  ];
}

export function generateInitialDailyReviews(): DailyReview[] {
  const yesterday = getDateStr(1);
  return [
    {
      id: 'review-yesterday',
      date: yesterday,
      summary: 'Completed 4.5h of high-yield study across Computer Science, Chemistry, and English literature.',
      whatWentWell: [
        'Dijkstra algorithm implementation session was exceptionally focused (9/10).',
        'Balanced technical coding with verbal essay outlining.',
      ],
      whatCouldImprove: [
        'Fell 30 minutes short of the 5.0h daily target.',
        'Afternoon session started 20 minutes later than planned.',
      ],
      recommendationForTomorrow: 'Start with Mathematics calculus block first thing in the morning to capture peak focus window.',
      rating: 'Solid',
      totalMinutes: 270,
      sessionCount: 3,
      avgFocus: 8.3,
      createdAt: `${yesterday}T21:45:00.000Z`,
    },
  ];
}
