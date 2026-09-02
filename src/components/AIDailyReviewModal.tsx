import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Calendar,
  Clock,
  Zap,
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStudy } from '../context/StudyContext';
import { formatSecondsToDisplay, formatDateDisplay } from '../utils/formatters';

interface AIDailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIDailyReviewModal: React.FC<AIDailyReviewModalProps> = ({ isOpen, onClose }) => {
  const { sessions, subjects, streak, goals, todayDateStr, dailyReviews, saveDailyReview } = useStudy();

  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Filter sessions for selected date
  const daySessions = sessions.filter((s) => s.date === selectedDate);
  const totalSeconds = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const avgFocus = daySessions.length > 0
    ? Number((daySessions.reduce((acc, s) => acc + s.focusScore, 0) / daySessions.length).toFixed(1))
    : 0;

  const subjectsStudied = Array.from(new Set(daySessions.map((s) => s.subjectName)));

  // Check if we already have a saved review for this date
  const existingReview = dailyReviews.find((r) => r.date === selectedDate);

  const handleGenerateReview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/daily-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          sessions: daySessions,
          subjects,
          goals,
          streak,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.review) {
        saveDailyReview({
          date: selectedDate,
          summary: data.review.summary || `Completed ${totalMinutes}m of focused study across ${daySessions.length} session(s).`,
          whatWentWell: data.review.whatWentWell || [],
          whatCouldImprove: data.review.whatCouldImprove || [],
          recommendationForTomorrow: data.review.recommendationForTomorrow || data.review.tomorrowRecommendation || 'Maintain your consistent study routine.',
          rating: totalSeconds >= (goals.dailyTargetHours || 5) * 3600 ? 'Exceptional' : 'Solid',
          totalMinutes,
          sessionCount: daySessions.length,
          avgFocus,
        });
      }
    } catch (err) {
      console.error('Failed to generate daily review:', err);
      // Fallback local synthesis
      saveDailyReview({
        date: selectedDate,
        summary: `Completed ${formatSecondsToDisplay(totalSeconds)} study volume across ${daySessions.length} sessions.`,
        whatWentWell: [
          `Logged ${formatSecondsToDisplay(totalSeconds)} across ${daySessions.length} sessions.`,
          `Maintained an average cognitive focus score of ${avgFocus}/10.`,
        ],
        whatCouldImprove: [
          totalSeconds < (goals.dailyTargetHours || 5) * 3600
            ? 'Paced slightly under daily target; schedule your primary subject earlier in the day.'
            : 'Continue taking short 5-minute restorative breaks between marathon blocks.',
        ],
        recommendationForTomorrow: 'Start your highest-friction topic during your peak morning energy window.',
        rating: 'Solid',
        totalMinutes,
        sessionCount: daySessions.length,
        avgFocus,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-neutral-900 dark:text-[#FAFAFA]">
                AI Daily Study Review
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-wider">
                Automated cognitive summary and recommendations for tomorrow.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="my-4 flex items-center justify-between bg-neutral-50 dark:bg-[#09090B] p-3 rounded-xl border border-neutral-200 dark:border-[#27272A]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA]">
            <Calendar className="w-4 h-4 text-[#6366F1]" />
            <span>Select Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white font-mono"
          />
        </div>

        {/* Day's Snapshot Cards */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-[#A1A1AA]">Total Study</p>
            <p className="text-base font-medium font-mono text-neutral-900 dark:text-[#FAFAFA] mt-0.5">
              {formatSecondsToDisplay(totalSeconds)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-[#A1A1AA]">Sessions</p>
            <p className="text-base font-medium font-mono text-neutral-900 dark:text-[#FAFAFA] mt-0.5">
              {daySessions.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A] text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-[#A1A1AA]">Avg Focus</p>
            <p className="text-base font-medium font-mono text-[#6366F1] mt-0.5">
              {avgFocus > 0 ? `${avgFocus}/10` : '—'}
            </p>
          </div>
        </div>

        {/* Subjects Studied Tags */}
        {subjectsStudied.length > 0 && (
          <div className="mb-4">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-widest">Subjects Covered:</span>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {subjectsStudied.map((s) => (
                <span key={s} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-[#09090B] text-neutral-700 dark:text-[#A1A1AA] border border-neutral-200 dark:border-[#27272A]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review Content */}
        {existingReview ? (
          <div className="space-y-3 my-4">
            
            {/* Summary */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#09090B] border border-neutral-200 dark:border-[#27272A]">
              <p className="text-xs text-neutral-700 dark:text-[#A1A1AA] leading-relaxed">
                {existingReview.summary}
              </p>
            </div>

            {/* What went well */}
            <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>What Went Well</span>
              </h4>
              <ul className="space-y-1 text-xs text-emerald-900 dark:text-emerald-300 list-disc list-inside">
                {existingReview.whatWentWell.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            {/* What could improve */}
            <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Areas for Optimization</span>
              </h4>
              <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-300 list-disc list-inside">
                {existingReview.whatCouldImprove.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            {/* Tomorrow's recommendation */}
            <div className="p-4 rounded-xl bg-[#6366F1]/5 dark:bg-[#6366F1]/10 border border-[#6366F1]/20 dark:border-[#6366F1]/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6366F1] flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-4 h-4 text-[#6366F1]" />
                <span>Recommendation for Tomorrow</span>
              </h4>
              <p className="text-xs text-neutral-800 dark:text-[#FAFAFA] leading-relaxed font-medium">
                {existingReview.recommendationForTomorrow}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-[#27272A] rounded-xl my-4">
            <Sparkles className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-neutral-700 dark:text-[#A1A1AA]">
              {daySessions.length > 0
                ? 'Ready to generate daily review for this date.'
                : 'No study sessions logged on this date.'}
            </p>
          </div>
        )}

        {/* Generate / Regenerate Button */}
        <div className="pt-3 border-t border-neutral-100 dark:border-[#27272A] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleGenerateReview}
            disabled={isLoading || daySessions.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] text-white dark:text-black text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Day...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                <span>{existingReview ? 'Regenerate Review' : 'Generate Daily Review'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
