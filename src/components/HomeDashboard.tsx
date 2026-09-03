import React, { useState, useMemo } from 'react';
import {
  Play,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Circle,
  Plus,
  Target,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Calendar,
  Layers,
  FileQuestion,
  PenTool,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { useAuth } from '../context/AuthContext';
import { formatSecondsToDisplay } from '../utils/formatters';

interface HomeDashboardProps {
  onStartStudying: () => void;
  onOpenPlanner: () => void;
  onOpenDailyReview: () => void;
  onOpenAnalytics: () => void;
  onOpenHistory: () => void;
  onOpenPYQs: () => void;
  onOpenAnswerWriting: () => void;
  onOpenRevision: () => void;
  onOpenTimerWithTask: (subjectId: string, topic: string, mins: number, taskId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartStudying,
  onOpenPlanner,
  onOpenDailyReview,
  onOpenAnalytics,
  onOpenHistory,
  onOpenPYQs,
  onOpenAnswerWriting,
  onOpenRevision,
  onOpenTimerWithTask,
}) => {
  const { profile } = useAuth();
  const {
    todaySeconds,
    todayProgressPercent,
    todaySessions,
    streak,
    goals,
    tasks,
    toggleTask,
    dailyReviews,
    todayDateStr,
    sessions,
    subjects,
    pyqs,
    answers,
    revisions,
    startSession,
  } = useStudy();

  const targetHours = goals.dailyTargetHours || 6;
  const targetSeconds = targetHours * 3600;

  // Quick Start Form state on Dashboard
  const [quickSubjectId, setQuickSubjectId] = useState(subjects[0]?.id || '');
  const [quickTopic, setQuickTopic] = useState('');
  const [quickDuration, setQuickDuration] = useState<number | undefined>(45);

  const selectedQuickSubject = subjects.find((s) => s.id === quickSubjectId) || subjects[0];

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickSubject) {
      onStartStudying();
      return;
    }
    startSession({
      subjectId: selectedQuickSubject.id,
      topic: quickTopic.trim() || `${selectedQuickSubject.name} Focus Session`,
      sessionGoalMinutes: quickDuration,
      sessionType: 'deep_work',
    });
    onStartStudying();
  };

  // Today's planner tasks
  const todayTasks = tasks.filter((t) => t.date === todayDateStr);

  // Latest daily review for today
  const todayReview = dailyReviews.find((r) => r.date === todayDateStr);

  // Average focus score
  const avgFocusScore = useMemo(() => {
    const list = todaySessions.length > 0 ? todaySessions : sessions;
    if (list.length === 0) return '—';
    const sum = list.reduce((acc, s) => acc + s.focusScore, 0);
    return (sum / list.length).toFixed(1);
  }, [todaySessions, sessions]);

  // Due revisions count
  const dueRevisionsCount = revisions.filter((r) => r.status !== 'completed' && r.nextDue <= todayDateStr).length;

  // Weekly Activity Bar Chart
  const weeklyDays = useMemo(() => {
    const days: { dayName: string; dateStr: string; heightPercent: number; isToday: boolean; seconds: number }[] = [];
    const dateMap: Record<string, number> = {};

    sessions.forEach((s) => {
      dateMap[s.date] = (dateMap[s.date] || 0) + s.durationSeconds;
    });

    const maxSec = Math.max(...Object.values(dateMap), targetSeconds, 3600 * 6);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const sec = dateMap[dateStr] || 0;
      const heightPercent = sec > 0 ? Math.max(10, Math.min(100, Math.round((sec / maxSec) * 100))) : 4;

      days.push({
        dayName,
        dateStr,
        heightPercent,
        isToday: dateStr === todayDateStr,
        seconds: sec,
      });
    }

    return days;
  }, [sessions, targetSeconds, todayDateStr]);

  const durationOptions = [
    { label: '25m', mins: 25 },
    { label: '45m', mins: 45 },
    { label: '60m', mins: 60 },
    { label: 'Stopwatch', mins: undefined },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8"
    >
      
      {/* ================= HERO FOCUS SECTION (Primary Centerpiece) ================= */}
      <section className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden transition-all">
        {/* Subtle accent backdrop glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/5 dark:bg-[#6366F1]/10 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
          
          {/* Left Hero Overview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-[#6366F1]/15 text-[#6366F1] border border-indigo-200/60 dark:border-[#6366F1]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-ping" />
                Target UPSC {profile?.upscYear || '2026'} ({profile?.targetService || 'IAS'})
              </span>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{streak.current} {streak.current === 1 ? 'Day' : 'Days'} Streak</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA]">
                Today's Focus Time
              </p>
              <h1 className="text-4xl sm:text-6xl font-light font-mono tracking-tight text-neutral-900 dark:text-[#FAFAFA] mt-1">
                {formatSecondsToDisplay(todaySeconds)}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-[#71717A] mt-1 font-medium">
                Daily Target: {targetHours}h 00m ({todayProgressPercent}% completed)
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-neutral-100 dark:bg-[#27272A] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#6366F1] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, todayProgressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>0h</span>
                <span>{targetHours}h Target</span>
              </div>
            </div>
          </div>

          {/* Right Hero Action: Quick Focus Launcher Form */}
          <div className="lg:col-span-7 bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-[#FAFAFA] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#6366F1]" />
                <span>Quick Study Launcher</span>
              </span>
              <button
                type="button"
                onClick={onStartStudying}
                className="text-[11px] font-semibold text-[#6366F1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Timer View</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <form onSubmit={handleQuickStart} className="space-y-3.5">
              
              {/* Subject Selection Pills */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-2">
                  1. Select Subject / GS Paper
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {subjects.map((s) => {
                    const isSelected = (selectedQuickSubject?.id || '') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setQuickSubjectId(s.id)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md ring-2 ring-[#6366F1]/30'
                            : 'bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-neutral-700 dark:text-[#A1A1AA] hover:border-neutral-300 dark:hover:border-[#3F3F46]'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span>{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1.5">
                  2. Focus Directive / Chapter (Optional)
                </label>
                <input
                  type="text"
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  placeholder={`e.g. Laxmikanth: Emergency Provisions & Basic Structure doctrine`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              {/* Duration Goal & Launch Button */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-5 flex items-center gap-1.5">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setQuickDuration(opt.mins)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all text-center min-h-[44px] cursor-pointer ${
                        quickDuration === opt.mins
                          ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-xs'
                          : 'bg-white dark:bg-[#18181B] border-neutral-200 dark:border-[#27272A] text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="sm:col-span-7">
                  <button
                    type="submit"
                    className="w-full min-h-[44px] bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] font-bold py-3 px-5 rounded-xl shadow-lg flex items-center justify-center gap-2.5 uppercase tracking-wide text-xs sm:text-sm transition-all transform active:scale-98 cursor-pointer group"
                  >
                    <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                    <span>Start Study Session</span>
                    {quickDuration && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-neutral-700 dark:bg-neutral-200 text-white dark:text-black">
                        {quickDuration}m
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </section>

      {/* ================= UPSC QUICK ACTION TILES ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* PYQ Hub Tile */}
        <button
          onClick={onOpenPYQs}
          className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:border-[#6366F1] dark:hover:border-[#6366F1] text-left transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white group-hover:text-[#6366F1]">
              {pyqs.length} Tests Logged →
            </span>
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Prelims & Mains PYQ Tracker
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-0.5">
            Analyze accuracy & speed per question across UPSC papers.
          </p>
        </button>

        {/* Mains Answer Writing Tile */}
        <button
          onClick={onOpenAnswerWriting}
          className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:border-[#6366F1] dark:hover:border-[#6366F1] text-left transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white group-hover:text-[#6366F1]">
              {answers.length} Answers →
            </span>
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Mains Answer Writing
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-0.5">
            Track word count, marks evaluation, structure & feedback.
          </p>
        </button>

        {/* Spaced Repetition Revision Tile */}
        <button
          onClick={onOpenRevision}
          className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:border-[#6366F1] dark:hover:border-[#6366F1] text-left transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className={`text-xs font-mono font-bold ${dueRevisionsCount > 0 ? 'text-rose-500' : 'text-neutral-900 dark:text-white'}`}>
              {dueRevisionsCount} Due Today →
            </span>
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Spaced Repetition Engine
          </h3>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-0.5">
            5-Stage revision cycles to ensure long-term retention.
          </p>
        </button>
      </div>

      {/* ================= 3-COLUMN DASHBOARD GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (col-span-4): Today's Plan */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Today's Plan</span>
            </h2>
            <button
              onClick={onOpenPlanner}
              className="text-xs text-[#6366F1] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {todayTasks.length === 0 ? (
              <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 rounded-2xl text-center shadow-xs">
                <Calendar className="w-8 h-8 text-neutral-400 dark:text-[#71717A] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-neutral-900 dark:text-[#FAFAFA]">No study targets set for today</p>
                <p className="text-[11px] text-neutral-500 dark:text-[#71717A] mt-0.5">Schedule daily syllabus targets to stay accountable.</p>
                <button
                  onClick={onOpenPlanner}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#27272A] text-xs font-bold text-neutral-800 dark:text-[#FAFAFA] hover:bg-neutral-200 dark:hover:bg-[#3F3F46] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Daily Target</span>
                </button>
              </div>
            ) : (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-3.5 rounded-xl shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-[#3F3F46]"
                >
                  <div
                    className="w-1.5 h-9 rounded-full shrink-0"
                    style={{ backgroundColor: t.subjectColor }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold truncate ${t.completed ? 'line-through text-neutral-400 dark:text-[#71717A]' : 'text-neutral-900 dark:text-[#FAFAFA]'}`}>
                      {t.task}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-[#71717A] mt-0.5">
                      {t.subjectName} • {t.estimatedMinutes}m • Priority {t.priority}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!t.completed && (
                      <button
                        onClick={() => onOpenTimerWithTask(t.subjectId, t.task, t.estimatedMinutes, t.id)}
                        className="p-2 rounded-lg bg-neutral-100 dark:bg-[#27272A] hover:bg-neutral-200 dark:hover:bg-[#3F3F46] text-[#6366F1] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        title="Start timer for this task"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}

                    <button
                      onClick={() => toggleTask(t.id)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Center Column (col-span-5): Recent Sessions */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Today's Sessions</span>
            </h2>
            <button
              onClick={onOpenHistory}
              className="text-xs text-[#6366F1] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>All History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-[#27272A] shadow-xs">
            {todaySessions.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-8 h-8 text-neutral-400 dark:text-[#71717A] mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-neutral-900 dark:text-[#FAFAFA]">No study sessions logged today</p>
                <p className="text-[11px] text-neutral-500 dark:text-[#71717A] mt-1">Tap the Start Study Session button above to log your first block!</p>
              </div>
            ) : (
              todaySessions.slice(0, 5).map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#18181B] hover:bg-neutral-50 dark:hover:bg-[#27272A]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sess.subjectColor }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-[#FAFAFA] truncate block">
                        {sess.subjectName}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-[#71717A] truncate block mt-0.5">
                        {sess.topic}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#27272A] text-neutral-700 dark:text-[#FAFAFA] font-mono">
                        {sess.focusScore}/10
                      </span>
                    </div>

                    <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 dark:text-[#FAFAFA]">
                      {formatSecondsToDisplay(sess.durationSeconds)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column (col-span-3): Weekly Chart & AI Coach Recommendation */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-5">
          
          {/* Weekly Overview Bar Chart */}
          <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-widest">
                7-Day Activity
              </h2>
              <button
                onClick={onOpenAnalytics}
                className="text-[10px] text-[#6366F1] font-semibold hover:underline cursor-pointer"
              >
                Analytics
              </button>
            </div>

            <div className="flex items-end justify-between gap-1.5 h-28 pt-2">
              {weeklyDays.map((d, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      d.isToday
                        ? 'bg-[#6366F1]'
                        : d.seconds > 0
                        ? 'bg-neutral-300 dark:bg-[#27272A] hover:bg-neutral-400 dark:hover:bg-[#3F3F46]'
                        : 'bg-neutral-100 dark:bg-[#27272A]/40'
                    }`}
                    style={{ height: `${d.heightPercent}%` }}
                    title={`${d.dayName}: ${formatSecondsToDisplay(d.seconds)}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-2 text-[10px] text-neutral-400 dark:text-[#71717A] font-mono uppercase">
              {weeklyDays.map((d, idx) => (
                <span key={idx} className={d.isToday ? 'text-[#6366F1] font-bold' : ''}>
                  {d.dayName}
                </span>
              ))}
            </div>
          </div>

          {/* Study Coach AI Preview Card */}
          <div className="bg-gradient-to-br from-[#1E1B4B] to-[#18181B] border border-[#312E81] rounded-2xl p-5 flex flex-col gap-2.5 relative overflow-hidden shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-[#A5B4FC] uppercase tracking-widest">
                Coach AI Insight
              </h3>
            </div>

            <p className="text-xs text-[#C7D2FE] leading-relaxed line-clamp-3">
              {todayReview
                ? `"${todayReview.recommendationForTomorrow}"`
                : `"Maintain your daily streak of ${streak.current} days. Target GS consistency and spaced revisions to lock in core retention!"`}
            </p>

            <button
              onClick={onOpenDailyReview}
              className="text-[11px] font-semibold text-white hover:text-indigo-200 mt-1 self-start underline transition-colors cursor-pointer"
            >
              {todayReview ? 'View Full Daily Review →' : 'Run Daily Review →'}
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-3.5 rounded-xl shadow-xs">
              <p className="text-[10px] text-neutral-500 dark:text-[#A1A1AA] uppercase font-semibold">Avg Focus</p>
              <p className="text-lg font-mono mt-0.5 text-[#6366F1] font-bold">
                {avgFocusScore} / 10
              </p>
            </div>

            <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-3.5 rounded-xl shadow-xs">
              <p className="text-[10px] text-neutral-500 dark:text-[#A1A1AA] uppercase font-semibold">Sessions</p>
              <p className="text-lg font-mono mt-0.5 text-neutral-900 dark:text-[#FAFAFA] font-bold">
                {sessions.length}
              </p>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
};
