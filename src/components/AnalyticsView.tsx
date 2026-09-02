import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  Award,
  Calendar,
  Sparkles,
  Zap,
  Target,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { formatSecondsToDisplay, formatMinutesToDisplay, getLocalDateString } from '../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { sessions, streak, subjectStats, analytics, goals } = useStudy();
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

  // Days list for chart (7 or 30 days)
  const daysCount = timeRange === '7days' ? 7 : 30;

  const chartDays = useMemo(() => {
    const result: { dateStr: string; label: string; totalSeconds: number; focusSum: number; count: number }[] = [];
    const dateMap: Record<string, { totalSeconds: number; focusSum: number; count: number }> = {};

    sessions.forEach((s) => {
      if (!dateMap[s.date]) {
        dateMap[s.date] = { totalSeconds: 0, focusSum: 0, count: 0 };
      }
      dateMap[s.date].totalSeconds += s.durationSeconds;
      dateMap[s.date].focusSum += s.focusScore;
      dateMap[s.date].count += 1;
    });

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const entry = dateMap[dateStr] || { totalSeconds: 0, focusSum: 0, count: 0 };

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

      result.push({
        dateStr,
        label: timeRange === '7days' ? dayName : monthDay,
        totalSeconds: entry.totalSeconds,
        focusSum: entry.focusSum,
        count: entry.count,
      });
    }

    return result;
  }, [sessions, daysCount, timeRange]);

  // Max daily hours in range for chart scale
  const maxSecondsInRange = useMemo(() => {
    const maxSec = Math.max(...chartDays.map((d) => d.totalSeconds), (goals.dailyTargetHours || 5) * 3600);
    return Math.max(3600 * 6, maxSec);
  }, [chartDays, goals.dailyTargetHours]);

  const targetHours = goals.dailyTargetHours || 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8"
    >
      {/* Header & Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight uppercase font-mono text-neutral-900 dark:text-[#FAFAFA]">
            Study Analytics & Insights
          </h1>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-wider mt-1">
            Real calculated telemetry on your daily output, subject distribution, focus peaks, and streaks.
          </p>
        </div>

        {/* 7-Day vs 30-Day Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] self-start sm:self-auto">
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer min-h-[36px] ${
              timeRange === '7days'
                ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-[#FAFAFA] shadow-xs'
                : 'text-neutral-600 dark:text-[#71717A] hover:text-neutral-900 dark:hover:text-[#FAFAFA]'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer min-h-[36px] ${
              timeRange === '30days'
                ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-[#FAFAFA] shadow-xs'
                : 'text-neutral-600 dark:text-[#71717A] hover:text-neutral-900 dark:hover:text-[#FAFAFA]'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Primary Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Hours */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-neutral-500 dark:text-[#A1A1AA]">
            <span className="text-xs font-bold uppercase tracking-widest">Total Studied</span>
            <Clock className="w-4 h-4 text-[#6366F1]" />
          </div>
          <p className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-neutral-900 dark:text-[#FAFAFA] mt-2">
            {analytics.totalHours}h
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-[#71717A] mt-1 font-mono">{sessions.length} total session(s)</p>
        </div>

        {/* Avg Hours / Day */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-neutral-500 dark:text-[#A1A1AA]">
            <span className="text-xs font-bold uppercase tracking-widest">Daily Average</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-neutral-900 dark:text-[#FAFAFA] mt-2">
            {analytics.dailyAvgHours}h
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-[#71717A] mt-1 font-mono">Target: {goals.dailyTargetHours}h / day</p>
        </div>

        {/* Avg Session Length */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-neutral-500 dark:text-[#A1A1AA]">
            <span className="text-xs font-bold uppercase tracking-widest">Avg Session</span>
            <Layers className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-neutral-900 dark:text-[#FAFAFA] mt-2">
            {analytics.avgSessionMinutes}m
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-[#71717A] mt-1 font-mono">Mean duration</p>
        </div>

        {/* Avg Focus Score */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-neutral-500 dark:text-[#A1A1AA]">
            <span className="text-xs font-bold uppercase tracking-widest">Avg Focus</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-[#6366F1] mt-2">
            {analytics.avgFocusScore > 0 ? `${analytics.avgFocusScore}` : '—'} <span className="text-sm font-normal text-neutral-400">/ 10</span>
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-[#71717A] mt-1 font-mono">Cognitive quality</p>
        </div>

      </div>

      {/* Main Bar Chart: Daily Study Output */}
      <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-[#FAFAFA] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#6366F1]" />
              <span>Daily Study Output & Goal Benchmark</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#71717A] mt-0.5">
              Target baseline: {targetHours} hours / day
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-[#A1A1AA]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1]" />
              <span>Studied</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500" />
              <span>Target ({targetHours}h)</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="relative pt-6 pb-2">
          
          {/* Target Line */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-500/50 z-10 pointer-events-none"
            style={{
              bottom: `${Math.min(95, Math.max(5, ((targetHours * 3600) / maxSecondsInRange) * 100))}%`,
            }}
          >
            <span className="absolute right-0 -top-5 text-[10px] font-mono text-emerald-500 font-bold bg-white dark:bg-[#18181B] px-1 rounded">
              {targetHours}h Goal
            </span>
          </div>

          {/* Bars Container */}
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-52 sm:h-64 pt-6">
            {chartDays.map((d, idx) => {
              const heightPercent = d.totalSeconds > 0
                ? Math.min(100, Math.max(6, Math.round((d.totalSeconds / maxSecondsInRange) * 100)))
                : 2;
              const metGoal = d.totalSeconds >= targetHours * 3600;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-neutral-900 dark:bg-white text-white dark:text-black text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                    <p className="font-bold">{d.dateStr}</p>
                    <p>{formatSecondsToDisplay(d.totalSeconds)} ({d.count} sessions)</p>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      metGoal
                        ? 'bg-emerald-500 hover:bg-emerald-400'
                        : d.totalSeconds > 0
                        ? 'bg-[#6366F1] hover:bg-indigo-400'
                        : 'bg-neutral-100 dark:bg-[#27272A]/40'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {/* Day Label */}
                  <span className="text-[10px] text-neutral-400 dark:text-[#71717A] mt-2 font-mono truncate max-w-full">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Subject Breakdown Table */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-[#FAFAFA] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#6366F1]" />
            <span>Subject Time Distribution</span>
          </h2>

          <div className="space-y-3.5">
            {subjectStats.map((stat) => {
              const totalAllMins = Math.max(1, Math.round(analytics.totalSeconds / 60));
              const sharePercent = Math.round((stat.totalMinutes / totalAllMins) * 100);

              return (
                <div key={stat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="font-semibold text-neutral-900 dark:text-[#FAFAFA]">
                        {stat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-neutral-500 dark:text-[#71717A]">
                        {formatMinutesToDisplay(stat.totalMinutes)}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-900 dark:text-[#FAFAFA] w-10 text-right">
                        {sharePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-neutral-100 dark:bg-[#27272A] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${sharePercent}%`,
                        backgroundColor: stat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cognitive & Habit Telemetry Cards */}
        <div className="space-y-4">
          
          {/* Best Day & Peak Time Window */}
          <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900 dark:text-[#FAFAFA] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Cognitive Patterns & Peak Windows</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A]">
                <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#A1A1AA]">Most Productive Day</p>
                <p className="text-base font-bold text-neutral-900 dark:text-[#FAFAFA] mt-0.5">
                  {analytics.bestStudyDay ? analytics.bestStudyDay.dayName : '—'}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  {analytics.bestStudyDay ? `Avg ${analytics.bestStudyDay.avgHours}h per day` : 'Collecting data'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A]">
                <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#A1A1AA]">Peak Focus Window</p>
                <p className="text-base font-bold text-[#6366F1] mt-0.5">
                  {analytics.bestStudyTime ? analytics.bestStudyTime.windowName : '—'}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  {analytics.bestStudyTime ? `Avg Focus: ${analytics.bestStudyTime.avgFocus}/10` : 'Collecting data'}
                </p>
              </div>
            </div>
          </div>

          {/* Subject Focus Leaders */}
          <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#A1A1AA]">Most Studied Subject</p>
                <div className="flex items-center gap-2 mt-1">
                  {analytics.mostStudiedSubject && (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: analytics.mostStudiedSubject.color }}
                    />
                  )}
                  <p className="text-base font-bold text-neutral-900 dark:text-[#FAFAFA]">
                    {analytics.mostStudiedSubject ? analytics.mostStudiedSubject.name : '—'}
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-[#71717A] mt-0.5 font-mono">
                  {analytics.mostStudiedSubject ? formatMinutesToDisplay(analytics.mostStudiedSubject.totalMinutes) : ''}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#A1A1AA]">Least Studied Subject</p>
                <div className="flex items-center gap-2 mt-1">
                  {analytics.leastStudiedSubject && (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: analytics.leastStudiedSubject.color }}
                    />
                  )}
                  <p className="text-base font-bold text-neutral-900 dark:text-[#FAFAFA]">
                    {analytics.leastStudiedSubject ? analytics.leastStudiedSubject.name : '—'}
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-[#71717A] mt-0.5 font-mono">
                  {analytics.leastStudiedSubject ? formatMinutesToDisplay(analytics.leastStudiedSubject.totalMinutes) : ''}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};
