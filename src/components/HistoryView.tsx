import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  BookMarked,
  Award,
  FileText,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { StudySession } from '../types';
import {
  formatSecondsToDisplay,
  formatSecondsToHms,
  formatDateDisplay,
  formatTimeDisplay,
  getLocalDateString,
} from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export const HistoryView: React.FC = () => {
  const { sessions, subjects, deleteSession, updateSession, addSession } = useStudy();

  // Filters & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'longest' | 'highest_focus' | 'subject'>('newest');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);

  // Manual Log Form State
  const [logSubjectId, setLogSubjectId] = useState(subjects[0]?.id || '');
  const [logTopic, setLogTopic] = useState('');
  const [logDate, setLogDate] = useState(() => getLocalDateString());
  const [logDurationMinutes, setLogDurationMinutes] = useState(60);
  const [logFocusScore, setLogFocusScore] = useState(8);
  const [logAccomplishment, setLogAccomplishment] = useState('');
  const [logNotes, setLogNotes] = useState('');

  // Filter & Sort computation strictly from saved sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();

    // Start of week
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = getLocalDateString(now);

    return sessions.filter((s) => {
      // Subject filter
      if (selectedSubjectId !== 'all' && s.subjectId !== selectedSubjectId) {
        return false;
      }

      // Time range filter
      if (timeFilter === 'today' && s.date !== todayStr) {
        return false;
      }
      if (timeFilter === 'week') {
        const sessDate = new Date(s.startTime);
        if (sessDate < startOfWeek) return false;
      }
      if (timeFilter === 'month') {
        const sessDate = new Date(s.startTime);
        if (sessDate < startOfMonth) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTopic = s.topic.toLowerCase().includes(q);
        const matchNotes = s.notes?.toLowerCase().includes(q) || false;
        const matchAcc = s.accomplishment?.toLowerCase().includes(q) || false;
        const matchSubj = s.subjectName.toLowerCase().includes(q);
        if (!matchTopic && !matchNotes && !matchAcc && !matchSubj) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      }
      if (sortBy === 'longest') {
        return b.durationSeconds - a.durationSeconds;
      }
      if (sortBy === 'highest_focus') {
        return b.focusScore - a.focusScore;
      }
      if (sortBy === 'subject') {
        return a.subjectName.localeCompare(b.subjectName);
      }
      return 0;
    });
  }, [sessions, selectedSubjectId, timeFilter, searchQuery, sortBy]);

  // Total calculated for current filtered view
  const totalFilteredSeconds = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  }, [filteredSessions]);

  // Average focus score for current filtered view
  const avgFilteredFocus = useMemo(() => {
    if (filteredSessions.length === 0) return 0;
    const sum = filteredSessions.reduce((acc, s) => acc + s.focusScore, 0);
    return Number((sum / filteredSessions.length).toFixed(1));
  }, [filteredSessions]);

  // Export to CSV
  const handleExportCsv = () => {
    if (sessions.length === 0) return;
    const headers = ['ID', 'Date', 'Subject', 'Topic', 'Duration (min)', 'Focus Score', 'Start Time', 'End Time', 'Accomplishment', 'Notes'];
    const rows = sessions.map((s) => [
      s.id,
      s.date,
      `"${s.subjectName.replace(/"/g, '""')}"`,
      `"${s.topic.replace(/"/g, '""')}"`,
      Math.round(s.durationSeconds / 60),
      s.focusScore,
      s.startTime,
      s.endTime,
      `"${(s.accomplishment || '').replace(/"/g, '""')}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `studyos_history_${getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewLogModal = () => {
    setEditingSession(null);
    setLogSubjectId(subjects[0]?.id || '');
    setLogTopic('');
    setLogDate(getLocalDateString());
    setLogDurationMinutes(60);
    setLogFocusScore(8);
    setLogAccomplishment('');
    setLogNotes('');
    setIsLogModalOpen(true);
  };

  const openEditSessionModal = (sess: StudySession) => {
    setEditingSession(sess);
    setLogSubjectId(sess.subjectId);
    setLogTopic(sess.topic);
    setLogDate(sess.date);
    setLogDurationMinutes(Math.round(sess.durationSeconds / 60));
    setLogFocusScore(sess.focusScore);
    setLogAccomplishment(sess.accomplishment || '');
    setLogNotes(sess.notes || '');
    setIsLogModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTopic.trim()) return;

    const subj = subjects.find((s) => s.id === logSubjectId) || subjects[0];
    if (!subj) return;

    const durationSec = Math.max(60, Number(logDurationMinutes) * 60);

    if (editingSession) {
      updateSession({
        ...editingSession,
        subjectId: subj.id,
        subjectName: subj.name,
        subjectColor: subj.color,
        topic: logTopic.trim(),
        date: logDate,
        durationSeconds: durationSec,
        focusScore: logFocusScore,
        accomplishment: logAccomplishment.trim() || undefined,
        notes: logNotes.trim() || undefined,
      });
    } else {
      const nowIso = new Date().toISOString();
      addSession({
        subjectId: subj.id,
        subjectName: subj.name,
        subjectColor: subj.color,
        topic: logTopic.trim(),
        date: logDate,
        startTime: `${logDate}T10:00:00.000Z`,
        endTime: `${logDate}T11:00:00.000Z`,
        durationSeconds: durationSec,
        focusScore: logFocusScore,
        sessionType: 'deep_work',
        accomplishment: logAccomplishment.trim() || undefined,
        notes: logNotes.trim() || undefined,
      });
    }

    setIsLogModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
    >
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight uppercase font-mono text-neutral-900 dark:text-[#FAFAFA]">
            Study History
          </h1>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] uppercase tracking-wider mt-1">
            Complete archive of all completed focus sessions and reflections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={sessions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#27272A] text-xs font-semibold uppercase tracking-wider text-neutral-800 dark:text-[#FAFAFA] shadow-xs transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
            title="Export all sessions to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={openNewLogModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] text-white dark:text-black text-xs font-semibold uppercase tracking-wider shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Past Session</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-4 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Keyword Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, accomplishments, notes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </div>

          {/* Subject Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="sm:col-span-3 flex items-center gap-1 bg-neutral-100 dark:bg-[#09090B] p-1 rounded-xl border border-neutral-200 dark:border-[#27272A]">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeFilter(t.id as any)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all min-h-[32px] cursor-pointer ${
                  timeFilter === t.id
                    ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-[#FAFAFA] shadow-xs'
                    : 'text-neutral-500 dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              <option value="newest">Newest First</option>
              <option value="longest">Longest Duration</option>
              <option value="highest_focus">Highest Focus</option>
              <option value="subject">Subject Name</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 dark:text-[#A1A1AA] pt-2 border-t border-neutral-100 dark:border-[#27272A] font-mono">
          <span>
            Showing <strong className="text-neutral-900 dark:text-[#FAFAFA]">{filteredSessions.length}</strong> session(s)
          </span>
          <div className="flex items-center gap-4">
            <span>
              Total Focus: <strong className="text-neutral-900 dark:text-[#FAFAFA]">{formatSecondsToDisplay(totalFilteredSeconds)}</strong>
            </span>
            <span>
              Avg Focus: <strong className="text-[#6366F1]">{avgFilteredFocus > 0 ? `${avgFilteredFocus}/10` : '—'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sessions List or Empty State */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-12 text-center shadow-xl">
          <Clock className="w-10 h-10 text-neutral-400 dark:text-[#71717A] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-[#FAFAFA]">No study sessions found</h3>
          <p className="text-xs text-neutral-500 dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            {searchQuery || selectedSubjectId !== 'all' || timeFilter !== 'all'
              ? 'No sessions matched your search filters. Try clearing or expanding your criteria.'
              : 'You have not logged any study sessions yet. Start your first study timer!'}
          </p>
          {(searchQuery || selectedSubjectId !== 'all' || timeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectId('all');
                setTimeFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#27272A] text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-[#FAFAFA] hover:bg-neutral-200 dark:hover:bg-[#3F3F46] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((sess) => (
            <div
              key={sess.id}
              className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-neutral-300 dark:hover:border-[#3F3F46] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Left Subject badge & Topic */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: sess.subjectColor }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-[#FAFAFA]">
                        {sess.subjectName}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-[#71717A] font-mono">
                        • {formatDateDisplay(sess.date)} at {formatTimeDisplay(sess.startTime)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#FAFAFA] mt-0.5">
                      {sess.topic}
                    </h3>

                    {/* Accomplishment & Notes details */}
                    {sess.accomplishment && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-[#A1A1AA] mt-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{sess.accomplishment}</span>
                      </div>
                    )}

                    {sess.notes && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-[#71717A] mt-1">
                        <FileText className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
                        <span className="italic truncate">{sess.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right duration, focus score, & actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-[#27272A]">
                  
                  {/* Focus Score pill */}
                  <div className="text-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-[#71717A] block">Focus</span>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#27272A] text-[#6366F1]">
                      {sess.focusScore}/10
                    </span>
                  </div>

                  {/* Duration Display */}
                  <div className="text-right min-w-[70px]">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-[#71717A] block">Duration</span>
                    <span className="text-sm font-bold font-mono text-neutral-900 dark:text-[#FAFAFA]">
                      {formatSecondsToDisplay(sess.durationSeconds)}
                    </span>
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditSessionModal(sess)}
                      className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                      title="Edit Session Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSessionToDelete(sess)}
                      className="p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual / Edit Session Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#27272A]">
              <h2 className="text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-[#FAFAFA]">
                {editingSession ? 'Edit Study Session' : 'Log Past Study Session'}
              </h2>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 pt-4">
              
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={logSubjectId}
                  onChange={(e) => setLogSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Topic / What did you study? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={logTopic}
                  onChange={(e) => setLogTopic(e.target.value)}
                  placeholder="e.g. Thermodynamics Carnot Cycle & Entropy Numerical Analysis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              {/* Date & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1">
                    Study Date
                  </label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    required
                    value={logDurationMinutes}
                    onChange={(e) => setLogDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Focus Score (1–10) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Focus Score ({logFocusScore} / 10)
                </label>
                <div className="grid grid-cols-10 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLogFocusScore(num)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[36px] cursor-pointer ${
                        logFocusScore === num
                          ? 'bg-[#6366F1] text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-[#27272A] text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-200 dark:hover:bg-[#3F3F46]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accomplishment */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Accomplishment (Optional)
                </label>
                <input
                  type="text"
                  value={logAccomplishment}
                  onChange={(e) => setLogAccomplishment(e.target.value)}
                  placeholder="e.g. Solved 10 questions, memorized 4 proofs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-[#A1A1AA] mb-1.5">
                  Session Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Key concepts to revisit..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#09090B] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#3F3F46] text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] hover:bg-neutral-100 dark:hover:bg-[#27272A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider shadow-md hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] cursor-pointer"
                >
                  {editingSession ? 'Update Session' : 'Save Session'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={sessionToDelete !== null}
        title="Delete Study Session?"
        message={`Are you sure you want to delete "${sessionToDelete?.topic}" (${formatSecondsToDisplay(sessionToDelete?.durationSeconds || 0)})? This will remove this block from your total statistics.`}
        confirmText="Delete Session"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </motion.div>
  );
};
