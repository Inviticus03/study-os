import React, { useState } from 'react';
import {
  FileQuestion,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  BarChart2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { PYQRecord } from '../types';

export const PYQTrackerView: React.FC = () => {
  const { pyqs, subjects, addPYQ, deletePYQ, todayDateStr } = useStudy();

  const [isAdding, setIsAdding] = useState(false);
  const [year, setYear] = useState<number>(2024);
  const [paper, setPaper] = useState<PYQRecord['paper']>('Prelims GS-1');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [totalQuestions, setTotalQuestions] = useState<number>(25);
  const [correctQuestions, setCorrectQuestions] = useState<number>(18);
  const [timeTakenMinutes, setTimeTakenMinutes] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');

  const [filterPaper, setFilterPaper] = useState<string>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === subjectId) || subjects[0] || { id: 'gen', name: 'General Studies' };

    await addPYQ({
      year: Number(year),
      paper,
      subjectId: subj.id,
      subjectName: subj.name,
      totalQuestions: Number(totalQuestions),
      correctQuestions: Number(correctQuestions),
      timeTakenMinutes: Number(timeTakenMinutes),
      notes: notes.trim() || undefined,
      date: todayDateStr,
    });

    setIsAdding(false);
    setNotes('');
  };

  const filteredPyqs = pyqs.filter((p) => {
    if (filterPaper !== 'all' && p.paper !== filterPaper) return false;
    return true;
  });

  const totalAttempted = pyqs.reduce((acc, p) => acc + p.totalQuestions, 0);
  const totalCorrect = pyqs.reduce((acc, p) => acc + p.correctQuestions, 0);
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase font-mono flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-[#6366F1]" />
            <span>PYQ Practice Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#A1A1AA] mt-0.5">
            Log and analyze your UPSC Previous Year Questions speed and accuracy.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Log PYQ Attempt</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#71717A] block">
            Total Questions Solved
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              {totalAttempted}
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">across {pyqs.length} tests</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#71717A] block">
            Overall Accuracy
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${overallAccuracy >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {overallAccuracy}%
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">({totalCorrect}/{totalAttempted})</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#71717A] block">
            Avg Speed per Question
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-500 dark:text-indigo-400">
              {totalAttempted > 0
                ? (
                    pyqs.reduce((acc, p) => acc + p.timeTakenMinutes, 0) /
                    totalAttempted *
                    60
                  ).toFixed(0) + 's'
                : '0s'}
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">target &lt; 72s</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-neutral-400 dark:text-[#71717A] shrink-0" />
        {['all', 'Prelims GS-1', 'Prelims CSAT', 'Mains GS-1', 'Mains GS-2', 'Mains GS-3', 'Mains GS-4'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPaper(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterPaper === p
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-bold'
                : 'bg-neutral-100 text-neutral-600 dark:bg-[#18181B] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {p === 'all' ? 'All Papers' : p}
          </button>
        ))}
      </div>

      {/* Modal for Adding PYQ */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl"
            >
              <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                Log UPSC PYQ Session
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      UPSC Year
                    </label>
                    <input
                      type="number"
                      required
                      min={2011}
                      max={2026}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Paper
                    </label>
                    <select
                      value={paper}
                      onChange={(e) => setPaper(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs"
                    >
                      <option value="Prelims GS-1">Prelims GS-1</option>
                      <option value="Prelims CSAT">Prelims CSAT</option>
                      <option value="Mains GS-1">Mains GS-1</option>
                      <option value="Mains GS-2">Mains GS-2</option>
                      <option value="Mains GS-3">Mains GS-3</option>
                      <option value="Mains GS-4">Mains GS-4</option>
                      <option value="Mains Optional-1">Mains Optional-1</option>
                      <option value="Mains Optional-2">Mains Optional-2</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                    Subject / Area
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Total Qs
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Correct Qs
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={totalQuestions}
                      value={correctQuestions}
                      onChange={(e) => setCorrectQuestions(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Time (Mins)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={timeTakenMinutes}
                      onChange={(e) => setTimeTakenMinutes(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                    Key Mistakes & Insights
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Elimination technique worked for Article 356 questions; got confused in monetary policy stance."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] text-xs font-semibold text-neutral-600 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold uppercase text-xs tracking-wider cursor-pointer"
                  >
                    Save PYQ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* List of PYQ Records */}
      <div className="space-y-3">
        {filteredPyqs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A]">
            <FileQuestion className="w-10 h-10 mx-auto text-neutral-400 dark:text-[#71717A] mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              No PYQ practice logged yet
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
              Consistent PYQ analysis is the cornerstone of UPSC preparation. Click "Log PYQ Attempt" above to record your test scores.
            </p>
          </div>
        ) : (
          filteredPyqs.map((pyq) => {
            const acc = pyq.totalQuestions > 0 ? Math.round((pyq.correctQuestions / pyq.totalQuestions) * 100) : 0;
            return (
              <div
                key={pyq.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-neutral-300 dark:hover:border-[#3F3F46] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#6366F1]/10 text-[#6366F1] dark:text-[#A5B4FC] text-[11px] font-bold font-mono">
                      UPSC {pyq.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#27272A] text-neutral-800 dark:text-zinc-300 text-[11px] font-semibold">
                      {pyq.paper}
                    </span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {pyq.subjectName}
                    </span>
                  </div>

                  {pyq.notes && (
                    <p className="text-xs text-neutral-600 dark:text-[#A1A1AA] italic pt-1">
                      "{pyq.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-[#27272A]">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-bold font-mono ${acc >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {pyq.correctQuestions}/{pyq.totalQuestions} ({acc}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 dark:text-[#71717A] font-mono block">
                      {pyq.timeTakenMinutes} mins • {pyq.date}
                    </span>
                  </div>

                  <button
                    onClick={() => deletePYQ(pyq.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 dark:text-[#71717A] dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
