import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  X,
  Target,
  Bell,
  Volume2,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../context/StudyContext';
import { requestNotificationPermission } from '../utils/notifications';
import { ConfirmModal } from './ConfirmModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    goals,
    updateGoals,
    sessions,
    subjects,
    tasks,
    dailyReviews,
    setTheme,
  } = useStudy();

  const [dailyHours, setDailyHours] = useState(goals.dailyTargetHours);
  const [weeklyHours, setWeeklyHours] = useState(goals.weeklyTargetHours);
  const [streakMinutes, setStreakMinutes] = useState(goals.minStreakMinutes);

  const [notificationStatus, setNotificationStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals({
      dailyTargetHours: Number(dailyHours) || 5,
      weeklyTargetHours: Number(weeklyHours) || 30,
      minStreakMinutes: Number(streakMinutes) || 30,
    });
    onClose();
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationStatus('granted');
      updateSettings({
        notifications: {
          ...settings.notifications,
          dailyReminder: true,
          goalReminder: true,
        },
      });
    } else {
      setNotificationStatus('denied');
      updateSettings({
        notifications: {
          ...settings.notifications,
          dailyReminder: false,
          goalReminder: false,
        },
      });
    }
  };

  // Export JSON
  const handleExportData = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      app: 'StudyOS',
      version: 2,
      sessions,
      subjects,
      tasks,
      dailyReviews,
      goals,
      settings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `studyos_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.sessions && json.subjects) {
          localStorage.setItem('studyos_sessions_v2', JSON.stringify(json.sessions));
          localStorage.setItem('studyos_subjects_v2', JSON.stringify(json.subjects));
          if (json.tasks) localStorage.setItem('studyos_tasks_v2', JSON.stringify(json.tasks));
          if (json.goals) localStorage.setItem('studyos_goals_v2', JSON.stringify(json.goals));
          if (json.dailyReviews) localStorage.setItem('studyos_daily_reviews_v2', JSON.stringify(json.dailyReviews));
          
          setImportSuccess(true);
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          setImportError('Invalid StudyOS JSON backup format.');
        }
      } catch (err) {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-neutral-900 dark:text-[#FAFAFA]">
              StudyOS Settings
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#27272A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveGoals} className="space-y-6 my-5">
          
          {/* Section 1: Study Goals & Targets */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA] mb-3 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Target & Streak Goals</span>
            </h3>

            <div className="space-y-3 bg-neutral-50 dark:bg-[#09090B] p-4 rounded-xl border border-neutral-200 dark:border-[#27272A]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-neutral-900 dark:text-[#FAFAFA] block uppercase tracking-wider">
                    Daily Study Target
                  </label>
                  <span className="text-[10px] text-neutral-400 dark:text-[#71717A]">Target hours shown on dashboard</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-16 px-2.5 py-1.5 text-right font-mono font-bold text-xs rounded-lg border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white"
                  />
                  <span className="text-xs text-neutral-500 dark:text-[#A1A1AA] font-mono">hrs</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-[#27272A]">
                <div>
                  <label className="text-xs font-bold text-neutral-900 dark:text-[#FAFAFA] block uppercase tracking-wider">
                    Weekly Study Target
                  </label>
                  <span className="text-[10px] text-neutral-400 dark:text-[#71717A]">Target hours across the week</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="1"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-16 px-2.5 py-1.5 text-right font-mono font-bold text-xs rounded-lg border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white"
                  />
                  <span className="text-xs text-neutral-500 dark:text-[#A1A1AA] font-mono">hrs</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-[#27272A]">
                <div>
                  <label className="text-xs font-bold text-neutral-900 dark:text-[#FAFAFA] block uppercase tracking-wider">
                    Minimum Streak Threshold
                  </label>
                  <span className="text-[10px] text-neutral-400 dark:text-[#71717A]">Minutes required to maintain streak</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="120"
                    step="5"
                    value={streakMinutes}
                    onChange={(e) => setStreakMinutes(Number(e.target.value))}
                    className="w-16 px-2.5 py-1.5 text-right font-mono font-bold text-xs rounded-lg border border-neutral-300 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white"
                  />
                  <span className="text-xs text-neutral-500 dark:text-[#A1A1AA] font-mono">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Preferences & Theme */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA] mb-3 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Preferences & Theme</span>
            </h3>

            <div className="space-y-3 bg-neutral-50 dark:bg-[#09090B] p-4 rounded-xl border border-neutral-200 dark:border-[#27272A] text-xs">
              
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-[#FAFAFA] block uppercase tracking-wider">Visual Theme</span>
                  <span className="text-[10px] text-neutral-400 dark:text-[#71717A]">Dark or Light Mode</span>
                </div>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                      settings.theme === 'light' ? 'bg-neutral-200 dark:bg-[#27272A] text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-[#71717A]'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                      settings.theme === 'dark' ? 'bg-neutral-900 dark:bg-[#27272A] text-white font-bold' : 'text-neutral-500 dark:text-[#71717A]'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* Sound toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-[#27272A]">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-[#FAFAFA] block uppercase tracking-wider">Session Sound Chimes</span>
                  <span className="text-[10px] text-neutral-400 dark:text-[#71717A]">Play chime on timer completion and start</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-[#6366F1] focus:ring-[#6366F1] cursor-pointer"
                />
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-[#27272A]">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-[#FAFAFA] block uppercase tracking-wider">Browser Notifications</span>
                  <span className="text-[10px] text-neutral-400 dark:text-[#71717A]">Alert when goal is reached</span>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] cursor-pointer"
                >
                  {notificationStatus === 'granted' ? 'Enabled ✓' : 'Allow'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Data Management */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-[#A1A1AA] mb-3 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Data & Backup</span>
            </h3>

            <div className="space-y-2 bg-neutral-50 dark:bg-[#09090B] p-4 rounded-xl border border-neutral-200 dark:border-[#27272A] text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-[#FAFAFA] uppercase tracking-wider text-[11px]">Export Full JSON Backup</p>
                  <p className="text-[10px] text-neutral-400 dark:text-[#71717A]">Save all study records to a local JSON file</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] font-semibold text-neutral-800 dark:text-[#FAFAFA] uppercase text-[11px] tracking-wider hover:bg-neutral-100 dark:hover:bg-[#27272A] cursor-pointer"
                >
                  Export
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-[#27272A]">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-[#FAFAFA] uppercase tracking-wider text-[11px]">Import JSON Backup</p>
                  <p className="text-[10px] text-neutral-400 dark:text-[#71717A]">Restore your previously exported records</p>
                </div>
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] font-semibold text-neutral-800 dark:text-[#FAFAFA] uppercase text-[11px] tracking-wider hover:bg-neutral-100 dark:hover:bg-[#27272A]">
                  Import
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>

              {importSuccess && (
                <p className="text-emerald-500 font-bold text-[10px] mt-1 font-mono">Data imported successfully! Reloading...</p>
              )}
              {importError && (
                <p className="text-rose-500 font-bold text-[10px] mt-1 font-mono">{importError}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-[#27272A]">
                <div>
                  <p className="font-bold text-rose-500 uppercase tracking-wider text-[11px]">Reset to Clean State</p>
                  <p className="text-[10px] text-neutral-400 dark:text-[#71717A]">Clear storage and reload</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold uppercase text-[11px] tracking-wider border border-rose-200 dark:border-rose-900 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-[#27272A] flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-[#27272A] text-xs font-semibold text-neutral-700 dark:text-[#A1A1AA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-[#E4E4E7] text-white dark:text-black text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
            >
              Save Goals
            </button>
          </div>
        </form>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset All StudyOS Data?"
        message="This will permanently delete all logged study sessions, customized subjects, tasks, and settings from local storage. Are you sure?"
        confirmText="Reset Everything"
        cancelText="Keep My Data"
        variant="danger"
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
