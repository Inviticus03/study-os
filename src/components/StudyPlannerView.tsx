import React, { useState, useMemo } from 'react';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  Trash2,
  Clock,
  AlertCircle,
  X,
  Target,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { StudyPlanTask } from '../types';
import { formatDateDisplay, formatMinutesToDisplay, getLocalDateString } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface StudyPlannerViewProps {
  onStartTaskTimer: (subjectId: string, topic: string, mins: number, taskId: string) => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({ onStartTaskTimer }) => {
  const { tasks, subjects, addTask, toggleTask, deleteTask, todayDateStr } = useStudy();

  const [filter, setFilter] = useState<'today' | 'upcoming' | 'completed' | 'all'>('today');

  // New task form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [taskText, setTaskText] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [taskDate, setTaskDate] = useState(todayDateStr);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState<StudyPlanTask | null>(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === 'today') return t.date === todayDateStr && !t.completed;
      if (filter === 'upcoming') return t.date > todayDateStr && !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [tasks, filter, todayDateStr]);

  // Today's planned metrics
  const todayAllTasks = tasks.filter((t) => t.date === todayDateStr);
  const todayPlannedMinutes = todayAllTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const todayCompletedMinutes = todayAllTasks.filter((t) => t.completed).reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const todayProgress = todayPlannedMinutes > 0 ? Math.round((todayCompletedMinutes / todayPlannedMinutes) * 100) : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const subj = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
    if (!subj) return;

    addTask({
      subjectId: subj.id,
      subjectName: subj.name,
      subjectColor: subj.color,
      task: taskText.trim(),
      estimatedMinutes: Number(estimatedMinutes) || 30,
      date: taskDate,
      priority,
    });

    setTaskText('');
    setIsModalOpen(false);
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
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight uppercase font-mono text-neutral-900 dark:text-[#FAFAFA]">
            Study Planner
          </h1>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-wider mt-1">
            Map out daily study tasks, estimate focused minutes, and launch timer sessions directly.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] text-white dark:text-black text-xs font-semibold uppercase tracking-wider shadow-md transition-all self-start sm:self-auto cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Task</span>
        </button>
      </div>

      {/* Today's Planner Progress Banner */}
      <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA]">
              Today's Execution Target
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-light font-mono text-neutral-900 dark:text-[#FAFAFA]">
                {formatMinutesToDisplay(todayCompletedMinutes)} / {formatMinutesToDisplay(todayPlannedMinutes)}
              </span>
              <span className="text-xs font-semibold text-[#6366F1] font-mono">
                ({todayProgress}% completed)
              </span>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-[#27272A] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6366F1] transition-all duration-500"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'today', label: `Today's Tasks (${todayAllTasks.filter((t) => !t.completed).length})` },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: `All (${tasks.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer min-h-[38px] ${
              filter === tab.id
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xs font-bold'
                : 'bg-white dark:bg-[#18181B] text-neutral-600 dark:text-[#A1A1AA] border border-neutral-200 dark:border-[#27272A] hover:bg-neutral-50 dark:hover:bg-[#27272A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List or Empty State */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-12 text-center shadow-xl">
          <ListTodo className="w-10 h-10 text-neutral-400 dark:text-[#71717A] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-[#FAFAFA]">No tasks in this view</h3>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            {filter === 'today'
              ? "You don't have any pending study tasks planned for today."
              : filter === 'completed'
              ? 'No completed tasks yet. Check off a task or run a session timer!'
              : 'Add your study objectives to organize your revision.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold uppercase tracking-wider shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const priorityColors = {
              high: 'border-rose-300 dark:border-rose-900/60 bg-rose-500/10 text-rose-600 dark:text-rose-400',
              medium: 'border-amber-300 dark:border-amber-900/60 bg-amber-500/10 text-amber-600 dark:text-amber-400',
              low: 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            };

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-[#18181B] border rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  task.completed
                    ? 'border-neutral-200 dark:border-[#27272A] opacity-60'
                    : 'border-neutral-200 dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-[#3F3F46]'
                }`}
              >
                {/* Left side checkbox & title */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 text-neutral-400 hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                    title={task.completed ? 'Mark pending' : 'Mark completed'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${task.subjectColor}20`,
                          color: task.subjectColor,
                        }}
                      >
                        {task.subjectName}
                      </span>

                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>

                      <span className="text-[10px] text-neutral-400 dark:text-[#71717A] font-mono">
                        {formatDateDisplay(task.date)}
                      </span>
                    </div>

                    <p
                      className={`text-sm font-semibold mt-1.5 ${
                        task.completed
                          ? 'line-through text-neutral-400 dark:text-[#71717A]'
                          : 'text-neutral-900 dark:text-[#FAFAFA]'
                      }`}
                    >
                      {task.task}
                    </p>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-[#27272A]">
                  <span className="text-xs font-mono text-neutral-500 dark:text-[#A1A1AA] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{task.estimatedMinutes} min</span>
                  </span>

                  {!task.completed && (
                    <button
                      onClick={() => onStartTaskTimer(task.subjectId, task.task, task.estimatedMinutes, task.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] text-xs font-bold uppercase tracking-wider shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Launch Timer</span>
                    </button>
                  )}

                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#27272A]">
              <h2 className="text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-[#FAFAFA]">
                Add Study Plan Task
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Task / Objective <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="e.g. Read Chapter 5 & solve problems 1-15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              {/* Date & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1">
                    Est. Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        priority === p
                          ? 'bg-[#6366F1] text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-[#27272A] text-neutral-600 dark:text-[#A1A1AA] hover:bg-neutral-200 dark:hover:bg-[#3F3F46]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#3F3F46] text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider shadow-md hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={taskToDelete !== null}
        title="Delete Planned Task?"
        message={`Are you sure you want to remove "${taskToDelete?.task}" from your planner?`}
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
        onCancel={() => setTaskToDelete(null)}
      />
    </motion.div>
  );
};
