import React, { useState } from 'react';
import {
  PenTool,
  Plus,
  Trash2,
  Clock,
  Award,
  CheckCircle2,
  FileText,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { AnswerWritingRecord } from '../types';

export const AnswerWritingView: React.FC = () => {
  const { answers, subjects, addAnswerWriting, deleteAnswerWriting, todayDateStr } = useStudy();

  const [isAdding, setIsAdding] = useState(false);
  const [question, setQuestion] = useState('');
  const [paper, setPaper] = useState<AnswerWritingRecord['paper']>('GS-2');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [wordCount, setWordCount] = useState<number>(250);
  const [timeTakenMinutes, setTimeTakenMinutes] = useState<number>(9);
  const [maxMarks, setMaxMarks] = useState<number>(15);
  const [marksAwarded, setMarksAwarded] = useState<number>(7);
  const [selfFeedback, setSelfFeedback] = useState<string>('');

  const [filterPaper, setFilterPaper] = useState<string>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === subjectId) || subjects[0] || { id: 'gen', name: 'General Studies' };

    await addAnswerWriting({
      question: question.trim(),
      paper,
      subjectId: subj.id,
      subjectName: subj.name,
      wordCount: Number(wordCount),
      timeTakenMinutes: Number(timeTakenMinutes),
      maxMarks: Number(maxMarks),
      marksAwarded: Number(marksAwarded),
      selfFeedback: selfFeedback.trim() || undefined,
      date: todayDateStr,
    });

    setIsAdding(false);
    setQuestion('');
    setSelfFeedback('');
  };

  const filteredAnswers = answers.filter((a) => {
    if (filterPaper !== 'all' && a.paper !== filterPaper) return false;
    return true;
  });

  const totalAnswers = answers.length;
  const avgTime = totalAnswers > 0 ? (answers.reduce((acc, a) => acc + a.timeTakenMinutes, 0) / totalAnswers).toFixed(1) : '0';
  const totalMarksAwarded = answers.reduce((acc, a) => acc + (a.marksAwarded || 0), 0);
  const totalMaxMarks = answers.reduce((acc, a) => acc + a.maxMarks, 0);
  const avgScorePct = totalMaxMarks > 0 ? Math.round((totalMarksAwarded / totalMaxMarks) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase font-mono flex items-center gap-2">
            <PenTool className="w-6 h-6 text-[#6366F1]" />
            <span>Mains Answer Writing</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#A1A1AA] mt-0.5">
            Log UPSC Mains descriptive answers, evaluate timing benchmarks & structure.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Log Answer Written</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#71717A] block">
            Total Answers Logged
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              {totalAnswers}
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">Mains Qs written</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#71717A] block">
            Avg Time per Answer
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-500 dark:text-indigo-400">
              {avgTime}m
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">target 7m (10M) / 10m (15M)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#71717A] block">
            Avg Marks Efficiency
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${avgScorePct >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {avgScorePct}%
            </span>
            <span className="text-xs text-neutral-500 dark:text-[#A1A1AA]">({totalMarksAwarded}/{totalMaxMarks} M)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-neutral-400 dark:text-[#71717A] shrink-0" />
        {['all', 'GS-1', 'GS-2', 'GS-3', 'GS-4', 'Optional-1', 'Optional-2', 'Essay'].map((p) => (
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

      {/* Modal for Logging Answer */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl"
            >
              <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                Log UPSC Mains Answer
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                    Question / Directive
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. Discuss the constitutional mechanisms for inter-state water dispute resolution in India. Highlight recent bottlenecks. (15 Marks, 250 Words)"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Paper
                    </label>
                    <select
                      value={paper}
                      onChange={(e) => setPaper(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs"
                    >
                      <option value="GS-1">GS-1 (History, Society, Geo)</option>
                      <option value="GS-2">GS-2 (Polity, IR, Governance)</option>
                      <option value="GS-3">GS-3 (Economy, S&T, Env, Sec)</option>
                      <option value="GS-4">GS-4 (Ethics & Integrity)</option>
                      <option value="Optional-1">Optional Paper 1</option>
                      <option value="Optional-2">Optional Paper 2</option>
                      <option value="Essay">Essay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Subject Tag
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
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Words
                    </label>
                    <input
                      type="number"
                      required
                      min={50}
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Time (Min)
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

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Max M
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                      Awarded
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      required
                      min={0}
                      max={maxMarks}
                      value={marksAwarded}
                      onChange={(e) => setMarksAwarded(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono font-bold text-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA] mb-1">
                    Self-Evaluation & Value Addition
                  </label>
                  <textarea
                    rows={2}
                    value={selfFeedback}
                    onChange={(e) => setSelfFeedback(e.target.value)}
                    placeholder="e.g. Added Article 262 and Inter-State River Water Disputes Act 1956. Need to draw a cleaner India river basin schematic next time."
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
                    Save Answer Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Answer Records List */}
      <div className="space-y-3">
        {filteredAnswers.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A]">
            <PenTool className="w-10 h-10 mx-auto text-neutral-400 dark:text-[#71717A] mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              No Mains answer logs found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
              Regular answer writing builds presentation, speed, and structural coherence for UPSC Mains. Log your answers using the button above.
            </p>
          </div>
        ) : (
          filteredAnswers.map((ans) => (
            <div
              key={ans.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] space-y-3 shadow-xs hover:border-neutral-300 dark:hover:border-[#3F3F46] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#6366F1]/10 text-[#6366F1] dark:text-[#A5B4FC] text-[11px] font-bold font-mono">
                      {ans.paper}
                    </span>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-zinc-300">
                      {ans.subjectName}
                    </span>
                    <span className="text-[11px] text-neutral-400 dark:text-[#71717A] font-mono">
                      • {ans.date}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
                    {ans.question}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-emerald-500">
                      {ans.marksAwarded ?? '-'}/{ans.maxMarks} M
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-[#71717A] block font-mono">
                      {ans.wordCount}w • {ans.timeTakenMinutes}m
                    </span>
                  </div>

                  <button
                    onClick={() => deleteAnswerWriting(ans.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 dark:text-[#71717A] dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete answer log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {ans.selfFeedback && (
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] text-xs text-neutral-600 dark:text-[#A1A1AA]">
                  <span className="font-bold text-neutral-800 dark:text-zinc-200 block mb-0.5 text-[10px] uppercase tracking-wider">
                    Self-Critique & Key Value Additions:
                  </span>
                  {ans.selfFeedback}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
