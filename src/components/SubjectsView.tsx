import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Target,
  BarChart2,
  Check,
  X,
  BookMarked,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { Subject, SubjectCategory } from '../types';
import { SubjectIcon, SUBJECT_ICON_OPTIONS, SUBJECT_COLOR_OPTIONS } from './SubjectIcon';
import { formatMinutesToDisplay } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { UPSC_DEFAULT_SUBJECTS } from '../data/upscData';

export const SubjectsView: React.FC = () => {
  const { subjects, subjectStats, addSubject, updateSubject, deleteSubject } = useStudy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Subject to delete state for ConfirmModal
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState('BookOpen');
  const [category, setCategory] = useState<SubjectCategory>('GS');
  const [weeklyTargetHours, setWeeklyTargetHours] = useState(6);
  const [monthlyTargetHours, setMonthlyTargetHours] = useState(25);

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setColor(SUBJECT_COLOR_OPTIONS[Math.floor(Math.random() * SUBJECT_COLOR_OPTIONS.length)]);
    setIcon('BookOpen');
    setCategory('GS');
    setWeeklyTargetHours(6);
    setMonthlyTargetHours(25);
    setIsModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setEditingSubject(subj);
    setName(subj.name);
    setColor(subj.color);
    setIcon(subj.icon);
    setCategory(subj.category || 'GS');
    setWeeklyTargetHours(subj.weeklyTargetHours);
    setMonthlyTargetHours(subj.monthlyTargetHours);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSubject) {
      updateSubject({
        ...editingSubject,
        name: name.trim(),
        color,
        icon,
        category,
        weeklyTargetHours: Number(weeklyTargetHours) || 1,
        monthlyTargetHours: Number(monthlyTargetHours) || 1,
      });
    } else {
      addSubject({
        name: name.trim(),
        color,
        icon,
        category,
        weeklyTargetHours: Number(weeklyTargetHours) || 1,
        monthlyTargetHours: Number(monthlyTargetHours) || 1,
      });
    }
    setIsModalOpen(false);
  };

  const handleSeedDefaults = async () => {
    for (const item of UPSC_DEFAULT_SUBJECTS) {
      if (!subjects.some((s) => s.name.toLowerCase() === item.name.toLowerCase())) {
        await addSubject(item);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase font-mono text-neutral-900 dark:text-[#FAFAFA] flex items-center gap-2.5">
            <BookMarked className="w-7 h-7 text-[#6366F1]" />
            <span>UPSC Syllabus & Curriculum</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#A1A1AA] mt-1">
            Manage your GS 1-4 papers, Optional Subject, CSAT, Essay, and Current Affairs modules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSeedDefaults}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5"
            title="Import official standard UPSC curriculum"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Load Default GS/Optional</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Paper</span>
          </button>
        </div>
      </div>

      {/* Grid of Subject Cards or Empty State */}
      {subjects.length === 0 ? (
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-3xl p-12 text-center shadow-xl">
          <BookMarked className="w-12 h-12 text-neutral-400 dark:text-[#71717A] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-[#FAFAFA]">No Subjects Configured</h3>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-1 mb-5 max-w-sm mx-auto">
            Load the default UPSC CSE blueprint or create custom subjects for your preparation.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeedDefaults}
              className="px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold uppercase tracking-wider shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load UPSC Syllabus (10 Modules)</span>
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-[#27272A] text-xs font-semibold cursor-pointer"
            >
              Create Blank Subject
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjectStats.map((stat) => {
            const rawSubj = subjects.find((s) => s.id === stat.id);
            const weeklyTargetMins = stat.weeklyTargetHours * 60;
            const weeklyProgress = weeklyTargetMins > 0 ? Math.min(100, Math.round((stat.weeklyMinutes / weeklyTargetMins) * 100)) : 0;

            return (
              <div
                key={stat.id}
                className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-neutral-300 dark:hover:border-[#3F3F46] transition-all"
              >
                <div>
                  {/* Top Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: stat.color }}
                      >
                        <SubjectIcon name={stat.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-[#FAFAFA]">
                          {stat.name}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-[#71717A]">
                          {stat.sessionCount} logged session(s)
                        </p>
                      </div>
                    </div>

                    {rawSubj && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(rawSubj)}
                          className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSubjectToDelete(rawSubj)}
                          className="p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Primary Stats */}
                  <div className="grid grid-cols-2 gap-2.5 my-4">
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-100 dark:border-[#27272A]">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#A1A1AA]">
                        Total Studied
                      </span>
                      <p className="text-sm font-semibold font-mono text-neutral-900 dark:text-[#FAFAFA] mt-0.5">
                        {formatMinutesToDisplay(stat.totalMinutes)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-100 dark:border-[#27272A]">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#A1A1AA]">
                        Avg Focus Score
                      </span>
                      <p className="text-sm font-semibold font-mono text-[#6366F1] mt-0.5">
                        {stat.avgFocus > 0 ? `${stat.avgFocus} / 10` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Weekly Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-[#27272A]">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-500 dark:text-[#A1A1AA] text-[11px] uppercase tracking-wider font-semibold">
                        This Week
                      </span>
                      <span className="font-semibold text-neutral-800 dark:text-[#FAFAFA]">
                        {formatMinutesToDisplay(stat.weeklyMinutes)} / {stat.weeklyTargetHours}h ({weeklyProgress}%)
                      </span>
                    </div>

                    <div className="w-full bg-neutral-100 dark:bg-[#27272A] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${weeklyProgress}%`,
                          backgroundColor: stat.color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer target info */}
                <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-neutral-500 dark:text-[#71717A] border-t border-neutral-100 dark:border-[#27272A]">
                  <span>Monthly Goal: {stat.monthlyTargetHours}h</span>
                  <span>Avg {stat.sessionCount > 0 ? Math.round(stat.totalMinutes / stat.sessionCount) : 0}m/session</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subject Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#27272A]">
              <h2 className="text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-[#FAFAFA]">
                {editingSubject ? 'Edit UPSC Subject' : 'Add UPSC Subject'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GS-1: Ancient & Medieval History"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Curriculum Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SubjectCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-medium"
                >
                  <option value="GS">General Studies (GS 1 / 2 / 3 / 4 / Prelims)</option>
                  <option value="OPTIONAL">Optional Subject (Paper I & II)</option>
                  <option value="CSAT">CSAT (Paper II Aptitude & Comprehension)</option>
                  <option value="ESSAY_CA">Essay & Daily Current Affairs</option>
                </select>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Badge Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {SUBJECT_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                        color === c ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Icon
                </label>
                <div className="flex items-center gap-2 flex-wrap max-h-28 overflow-y-auto p-1">
                  {SUBJECT_ICON_OPTIONS.map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIcon(ic.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        icon === ic.id
                          ? 'border-[#6366F1] bg-[#6366F1]/15 text-[#6366F1]'
                          : 'border-neutral-200 dark:border-[#27272A] text-neutral-600 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A]'
                      }`}
                    >
                      <SubjectIcon name={ic.id} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Targets */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1">
                    Weekly Goal (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={weeklyTargetHours}
                    onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1">
                    Monthly Goal (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={monthlyTargetHours}
                    onChange={(e) => setMonthlyTargetHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#3F3F46] text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider shadow-md hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] cursor-pointer"
                >
                  {editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      <ConfirmModal
        isOpen={subjectToDelete !== null}
        title={`Delete "${subjectToDelete?.name}"?`}
        message="Are you sure you want to remove this subject? Logged sessions will remain in your history archive, but this subject will be removed from your active curriculum list."
        confirmText="Delete Subject"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (subjectToDelete) {
            deleteSubject(subjectToDelete.id);
            setSubjectToDelete(null);
          }
        }}
        onCancel={() => setSubjectToDelete(null)}
      />
    </motion.div>
  );
};
