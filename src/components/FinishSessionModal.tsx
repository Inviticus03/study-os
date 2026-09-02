import React, { useState, useEffect } from 'react';
import { CheckCircle2, Star, Sparkles, X, Award, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { formatSecondsToDisplay, formatSecondsToHms } from '../utils/formatters';

interface FinishSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const FinishSessionModal: React.FC<FinishSessionModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { activeSession, timerSeconds, finishSession } = useStudy();

  const [topic, setTopic] = useState(activeSession?.topic || '');
  const [focusScore, setFocusScore] = useState<number>(8);
  const [accomplishment, setAccomplishment] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial values when modal opens
  useEffect(() => {
    if (activeSession) {
      setTopic(activeSession.topic || '');
    }
  }, [activeSession]);

  if (!isOpen || !activeSession) return null;

  const durationSec = Math.max(10, timerSeconds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const saved = finishSession({
        topic: topic.trim() || activeSession.topic,
        focusScore,
        accomplishment: accomplishment.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (saved) {
        onSaved();
      }
    } catch (err) {
      console.error('Failed to save session:', err);
      setIsSubmitting(false);
    }
  };

  const getFocusLabel = (score: number) => {
    if (score >= 9) return 'Pure Flow ⚡';
    if (score >= 8) return 'High Focus 🎯';
    if (score >= 6) return 'Good Focus 👍';
    if (score >= 4) return 'Moderate Focus ⏳';
    return 'Distracted 💭';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-neutral-100 dark:border-[#27272A] flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeSession.subjectColor }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A1A1AA]">
                  {activeSession.subjectName}
                </span>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-900 dark:text-[#FAFAFA] mt-1">
                Complete Study Session
              </h2>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Duration highlight card */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-[#A1A1AA]">Recorded Study Duration</p>
                <p className="text-2xl font-light text-neutral-900 dark:text-[#FAFAFA] font-mono tracking-tight mt-0.5">
                  {formatSecondsToDisplay(durationSec)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-500 dark:text-[#71717A] font-mono">
                  {formatSecondsToHms(durationSec)}
                </span>
              </div>
            </div>

            {/* What did you study? */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                What did you study? <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Integration by parts numericals & formula derivations"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>

            {/* Focus Score (1–10) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] uppercase tracking-wider">
                  Focus Score (1–10) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-[#6366F1]">
                  {focusScore} / 10 — {getFocusLabel(focusScore)}
                </span>
              </div>

              {/* Score Selector Pills */}
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setFocusScore(num)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[38px] cursor-pointer ${
                      focusScore === num
                        ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-600/30 scale-105'
                        : 'bg-neutral-100 dark:bg-[#27272A] text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-200 dark:hover:bg-[#3F3F46]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* What did you accomplish? */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>What did you accomplish?</span>
              </label>
              <textarea
                rows={2}
                value={accomplishment}
                onChange={(e) => setAccomplishment(e.target.value)}
                placeholder="e.g. Completed 12 problem sets, mastered 2 proof techniques"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>

            {/* Notes / Thoughts */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#6366F1]" />
                <span>Session Notes / Friction Points</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Energy was high early on. Need to review trigonometric identities tomorrow."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 dark:border-[#3F3F46] text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer min-h-[44px]"
              >
                Resume Timer
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save to History'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
