import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Flame,
  Plus,
  BookMarked,
  Layers,
  Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { SubjectIcon } from './SubjectIcon';
import { formatSecondsToHms, formatSecondsToDisplay, formatMinutesToDisplay } from '../utils/formatters';
import { FinishSessionModal } from './FinishSessionModal';
import { ConfirmModal } from './ConfirmModal';

interface StudyTimerViewProps {
  onOpenSubjects: () => void;
}

export const StudyTimerView: React.FC<StudyTimerViewProps> = ({ onOpenSubjects }) => {
  const {
    subjects,
    activeSession,
    timerSeconds,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    settings,
    updateSettings,
    streak,
  } = useStudy();

  // Setup form states (when no active session)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [topic, setTopic] = useState<string>('');
  const [goalMinutes, setGoalMinutes] = useState<number | undefined>(45);
  const [sessionType, setSessionType] = useState<'deep_work' | 'revision' | 'practice' | 'exam_prep' | 'reading'>('deep_work');

  // Modals & UI states
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    startSession({
      subjectId: selectedSubject.id,
      topic: topic.trim() || `${selectedSubject.name} Focus Session`,
      sessionGoalMinutes: goalMinutes,
      sessionType,
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleAmbientChange = (type: any) => {
    updateSettings({ ambientSound: type });
  };

  // Preset goal chips
  const goalPresets = [
    { label: '25m (Pomo)', mins: 25 },
    { label: '45m (Focus)', mins: 45 },
    { label: '60m (Deep)', mins: 60 },
    { label: '90m (Block)', mins: 90 },
    { label: 'Stopwatch', mins: undefined },
  ];

  const sessionTypes = [
    { id: 'deep_work', label: 'Deep Work' },
    { id: 'practice', label: 'Practice' },
    { id: 'revision', label: 'Revision' },
    { id: 'exam_prep', label: 'Exam Prep' },
    { id: 'reading', label: 'Reading' },
  ];

  // Calculate circular progress if goal is set
  const goalSeconds = activeSession?.sessionGoalMinutes ? activeSession.sessionGoalMinutes * 60 : 0;
  const progressPercent = goalSeconds > 0 ? Math.min(100, Math.round((timerSeconds / goalSeconds) * 100)) : 0;

  // Active Session Display
  if (activeSession) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950 text-white p-6 sm:p-12' : ''
        }`}
      >
        {/* Top bar during active study */}
        <div className="w-full flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full animate-pulse shadow-sm"
              style={{ backgroundColor: activeSession.subjectColor }}
            />
            <span className="text-sm font-bold tracking-wide uppercase text-neutral-600 dark:text-neutral-400">
              {activeSession.subjectName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
              {activeSession.sessionType.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={isFullscreen ? 'Exit Fullscreen Focus' : 'Fullscreen Focus Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center Timer Display & Progress Ring */}
        <div className="relative flex flex-col items-center justify-center my-4 sm:my-8">
          
          {/* Subtle Outer Glow */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-opacity"
            style={{ backgroundColor: activeSession.subjectColor }}
          />

          {/* SVG Progress Circle */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-neutral-200 dark:stroke-neutral-800"
                strokeWidth="4"
                fill="transparent"
              />
              {goalSeconds > 0 ? (
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke={activeSession.subjectColor}
                  strokeWidth="4"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              ) : (
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke={activeSession.subjectColor}
                  strokeWidth="4"
                  strokeDasharray="8 8"
                  fill="transparent"
                  className="animate-spin-slow opacity-60"
                />
              )}
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              
              {/* Status indicator */}
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${activeSession.isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {activeSession.isPaused ? 'Session Paused' : 'Deep Study'}
                </span>
              </div>

              {/* Large Digital Clock */}
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-neutral-900 dark:text-white my-1">
                {formatSecondsToHms(timerSeconds)}
              </div>

              {/* Target Goal Info */}
              {activeSession.sessionGoalMinutes ? (
                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                  Goal: {activeSession.sessionGoalMinutes}m ({progressPercent}%)
                </div>
              ) : (
                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                  Open Stopwatch
                </div>
              )}
            </div>
          </div>

          {/* Current Topic Title */}
          <div className="mt-6 text-center max-w-md px-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {activeSession.topic}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Started at {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-4 sm:gap-6 my-6">
          
          {/* Pause / Resume Button */}
          <button
            onClick={activeSession.isPaused ? resumeSession : pauseSession}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 cursor-pointer ${
              activeSession.isPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
            }`}
            title={activeSession.isPaused ? 'Resume Study Timer' : 'Pause Study Timer'}
          >
            {activeSession.isPaused ? (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            ) : (
              <Pause className="w-7 h-7 fill-current" />
            )}
          </button>

          {/* Finish Session Button */}
          <button
            onClick={() => setShowFinishModal(true)}
            className="px-6 py-4 rounded-2xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer min-h-[48px]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Finish Session</span>
          </button>

          {/* Cancel / Discard Button */}
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="p-4 rounded-2xl bg-neutral-100 hover:bg-rose-50 dark:bg-neutral-800 dark:hover:bg-rose-950/40 text-neutral-600 hover:text-rose-600 dark:text-neutral-300 dark:hover:text-rose-400 transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="Cancel Session"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        {/* Focus Ambient Sound Bar */}
        <div className="w-full max-w-md p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] flex items-center justify-between gap-3 text-xs mt-4 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-[#FAFAFA] font-semibold">
            <Headphones className="w-4 h-4 text-[#6366F1]" />
            <span>Focus Sound:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'none', label: 'Off' },
              { id: 'white_noise', label: 'White' },
              { id: 'deep_brown', label: 'Brown' },
              { id: 'soft_rain', label: 'Rain' },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => handleAmbientChange(snd.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors min-h-[36px] cursor-pointer ${
                  settings.ambientSound === snd.id
                    ? 'bg-[#6366F1] text-white font-bold'
                    : 'bg-neutral-100 dark:bg-[#27272A] text-neutral-600 dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <ConfirmModal
          isOpen={showCancelConfirm}
          title="Discard Study Session?"
          message={`Are you sure you want to discard this ${formatSecondsToDisplay(timerSeconds)} study block? It will not be saved to your statistics.`}
          confirmText="Discard Session"
          cancelText="Keep Studying"
          variant="danger"
          onConfirm={() => {
            cancelSession();
            setShowCancelConfirm(false);
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />

        {/* Finish Session Modal */}
        <FinishSessionModal
          isOpen={showFinishModal}
          onClose={() => setShowFinishModal(false)}
          onSaved={() => setShowFinishModal(false)}
        />
      </motion.div>
    );
  }

  // Session Setup Form (When not active)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight uppercase font-mono text-neutral-900 dark:text-[#FAFAFA]">
          Study Timer
        </h1>
        <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-wider mt-1">
          Pick your subject, set your duration, and enter deep focus.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-10 text-center shadow-xl">
          <BookMarked className="w-10 h-10 text-neutral-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-[#FAFAFA]">No subjects found</h3>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-1 mb-4">
            Add at least one subject before launching a study timer.
          </p>
          <button
            onClick={onOpenSubjects}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subject</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleStart} className="space-y-6">
          
          {/* Step 1: Select Subject */}
          <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-[#27272A] text-neutral-900 dark:text-[#FAFAFA] flex items-center justify-center text-xs font-mono">1</span>
                <span>Choose Subject</span>
              </label>
              <button
                type="button"
                onClick={onOpenSubjects}
                className="text-xs font-semibold text-[#6366F1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Manage</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {subjects.map((subj) => {
                const isSelected = selectedSubjectId === subj.id;
                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all min-h-[50px] cursor-pointer ${
                      isSelected
                        ? 'border-[#6366F1] bg-neutral-50 dark:bg-[#27272A] text-neutral-900 dark:text-white font-bold ring-2 ring-[#6366F1]/20 shadow-xs'
                        : 'border-neutral-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-700 dark:text-[#A1A1AA] hover:border-neutral-300 dark:hover:border-[#3F3F46]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: subj.color }}
                    >
                      <SubjectIcon name={subj.icon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{subj.name}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-[#71717A] font-mono">
                        Target {subj.weeklyTargetHours}h/w
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: What are you studying? */}
          <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-xl">
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-[#27272A] text-neutral-900 dark:text-[#FAFAFA] flex items-center justify-center text-xs font-mono">2</span>
              <span>What are you studying? (Topic or Objective)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`e.g. ${selectedSubject ? selectedSubject.name : 'Calculus'} problem sets, Chapter 4 revision...`}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </div>

          {/* Step 3: Session Duration & Mode */}
          <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Goal Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Session Duration Goal</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {goalPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setGoalMinutes(preset.mins)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all min-h-[40px] cursor-pointer ${
                        goalMinutes === preset.mins
                          ? 'bg-[#6366F1] border-[#6366F1] text-white font-bold shadow-xs'
                          : 'border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Session Type</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sessionTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSessionType(type.id as any)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all min-h-[40px] cursor-pointer ${
                        sessionType === type.id
                          ? 'bg-[#6366F1] border-[#6366F1] text-white font-bold shadow-xs'
                          : 'border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A]'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] text-white dark:text-black font-semibold text-sm uppercase tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer min-h-[48px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Study Timer</span>
            {goalMinutes && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-700 dark:bg-neutral-200 text-white dark:text-black">
                {goalMinutes} min
              </span>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
};
