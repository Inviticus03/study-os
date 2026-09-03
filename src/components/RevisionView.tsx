import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  BookOpen,
  Sparkles,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { getLocalDateString } from '../utils/formatters';

export const RevisionView: React.FC = () => {
  const { revisions, subjects, addRevisionItem, completeRevisionStage, deleteRevisionItem, todayDateStr } = useStudy();

  const [isAdding, setIsAdding] = useState(false);
  const [topic, setTopic] = useState('');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [notes, setNotes] = useState('');

  const [activeFilter, setActiveFilter] = useState<'due' | 'upcoming' | 'completed' | 'all'>('due');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const subj = subjects.find((s) => s.id === subjectId) || subjects[0] || { id: 'subj-gen', name: 'General Studies', color: '#6366F1' };

    // Next due is tomorrow for Stage 1
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);

    await addRevisionItem({
      topic: topic.trim(),
      subjectId: subj.id,
      subjectName: subj.name,
      subjectColor: subj.color,
      stage: 1,
      nextDue: tomorrowStr,
      notes: notes.trim() || undefined,
    });

    setIsAdding(false);
    setTopic('');
    setNotes('');
  };

  const dueItems = revisions.filter((r) => r.status !== 'completed' && r.nextDue <= todayDateStr);
  const upcomingItems = revisions.filter((r) => r.status !== 'completed' && r.nextDue > todayDateStr);
  const completedItems = revisions.filter((r) => r.status === 'completed');

  const displayedItems = revisions.filter((r) => {
    if (activeFilter === 'due') return r.status !== 'completed' && r.nextDue <= todayDateStr;
    if (activeFilter === 'upcoming') return r.status !== 'completed' && r.nextDue > todayDateStr;
    if (activeFilter === 'completed') return r.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase font-mono flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#6366F1]" />
            <span>Spaced Repetition & Revision</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#A1A1AA] mt-0.5">
            5-Stage Spaced Repetition (1d &rarr; 3d &rarr; 7d &rarr; 15d &rarr; 30d) for long-term UPSC recall.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add Topic for Revision</span>
        </button>
      </div>

      {/* Spaced Repetition KPI overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Due for Revision Today</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              {dueItems.length}
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">topics pending</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming Memory Loops</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              {upcomingItems.length}
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">in schedule</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mastered Topics (5 Stages)</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-500">
              {completedItems.length}
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">retained</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'due', label: `Due Today (${dueItems.length})` },
          { id: 'upcoming', label: `Upcoming (${upcomingItems.length})` },
          { id: 'completed', label: `Mastered (${completedItems.length})` },
          { id: 'all', label: `All Topics (${revisions.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-bold'
                : 'bg-neutral-100 text-neutral-600 dark:bg-[#18181B] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modal to Add Revision Topic */}
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
                Add UPSC Topic to Spaced Repetition
              </h2>

              <form onSubmit={handleAdd} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                    Topic / Concept
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Fundamental Rights Article 14-19 Landmark Judgments"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                    Subject
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

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                    Key Memory Triggers / Formulas
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Maneka Gandhi case (procedure established vs due process), Kesavananda basic structure doctrine."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px]">
                  <span className="font-bold block mb-0.5">Automated 5-Stage Schedule:</span>
                  1st Revision: Tomorrow &bull; 2nd: +3d &bull; 3rd: +7d &bull; 4th: +15d &bull; 5th: +30d
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
                    Start Revision Track
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revision List */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A]">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              {activeFilter === 'due' ? 'All caught up on today’s revisions!' : 'No topics in this revision filter'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
              Add difficult syllabus topics to Spaced Repetition so you never forget factual data, articles, and case laws.
            </p>
          </div>
        ) : (
          displayedItems.map((item) => {
            const isDue = item.status !== 'completed' && item.nextDue <= todayDateStr;
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-white dark:bg-[#18181B] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  isDue
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : 'border-neutral-200 dark:border-[#27272A]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.subjectColor || '#6366F1' }}
                    />
                    <span className="text-xs font-semibold text-neutral-700 dark:text-zinc-300">
                      {item.subjectName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#27272A] text-[10px] font-bold font-mono text-neutral-600 dark:text-[#A1A1AA]">
                      Stage {item.stage}/5
                    </span>
                    {isDue && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-bold font-mono">
                        DUE TODAY
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-mono">
                        MASTERED (100%)
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {item.topic}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] italic">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-[#27272A]">
                  <div className="text-right">
                    <span className="text-xs font-mono text-neutral-500 dark:text-[#A1A1AA] block">
                      Next Due: {item.nextDue}
                    </span>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => completeRevisionStage(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Revised!</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteRevisionItem(item.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 dark:text-[#71717A] dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete item"
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
