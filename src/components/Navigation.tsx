import React from 'react';
import {
  LayoutDashboard,
  Timer,
  BookMarked,
  History,
  BarChart3,
  CalendarCheck2,
  Sparkles,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Play,
  Pause,
  Maximize2,
  FileQuestion,
  PenTool,
  RotateCcw,
  User as UserIcon,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { useAuth } from '../context/AuthContext';
import { formatSecondsToHms } from '../utils/formatters';

export type TabType =
  | 'dashboard'
  | 'timer'
  | 'planner'
  | 'subjects'
  | 'pyqs'
  | 'answerWriting'
  | 'revision'
  | 'history'
  | 'analytics'
  | 'coach';

interface NavigationProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  openSettings: () => void;
  openDailyReview: () => void;
  openProfile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  openSettings,
  openDailyReview,
  openProfile,
}) => {
  const { user, profile } = useAuth();
  const { activeSession, timerSeconds, pauseSession, resumeSession, settings, setTheme, syncStatus, isOnline } = useStudy();

  const toggleTheme = () => {
    setTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'planner', label: 'Plan', icon: CalendarCheck2 },
    { id: 'subjects', label: 'Curriculum', icon: BookMarked },
    { id: 'pyqs', label: 'PYQs', icon: FileQuestion },
    { id: 'answerWriting', label: 'Mains Ans', icon: PenTool },
    { id: 'revision', label: 'Revision', icon: RotateCcw },
    { id: 'history', label: 'Logs', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'coach', label: 'AI Coach', icon: Sparkles },
  ];

  return (
    <>
      {/* Top Desktop & Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-[#27272A] bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 bg-[#6366F1] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm group-hover:scale-105 transition-transform font-mono">
                S
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight uppercase text-neutral-900 dark:text-[#FAFAFA] font-mono">
                  StudyOS
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-[#A5B4FC]">
                  UPSC
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isCoach = item.id === 'coach';

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-100 text-neutral-900 dark:bg-[#27272A] dark:text-[#FAFAFA] shadow-xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-[#A1A1AA] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#18181B]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isCoach ? 'text-indigo-500 dark:text-indigo-400' : ''}`} />
                    <span>{item.label}</span>
                    {isCoach && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-[#A5B4FC]">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Real-time Sync Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-[10px] font-mono text-neutral-600 dark:text-[#A1A1AA]">
              {syncStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                  <span>Syncing</span>
                </>
              ) : isOnline ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Live</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3 h-3 text-zinc-400" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Active Session Pill (Visible across all tabs when timer is running) */}
            {activeSession && currentTab !== 'timer' && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-neutral-900 dark:text-[#FAFAFA] text-xs font-mono shadow-xs animate-fade-in">
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: activeSession.subjectColor }}
                />
                <span className="font-semibold hidden sm:inline max-w-[90px] truncate">{activeSession.subjectName}</span>
                <span className="font-bold tracking-wider">{formatSecondsToHms(timerSeconds)}</span>
                
                <button
                  onClick={activeSession.isPaused ? resumeSession : pauseSession}
                  className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-700 dark:text-[#A1A1AA] transition-colors cursor-pointer"
                  title={activeSession.isPaused ? 'Resume' : 'Pause'}
                >
                  {activeSession.isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                </button>

                <button
                  onClick={() => setCurrentTab('timer')}
                  className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-700 dark:text-[#A1A1AA] transition-colors cursor-pointer"
                  title="Open Timer"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Daily Review Quick Button */}
            <button
              onClick={openDailyReview}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] text-neutral-800 dark:text-[#FAFAFA] border border-neutral-200 dark:border-[#27272A] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Review</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-[#A1A1AA] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#18181B] border border-transparent dark:hover:border-[#27272A] transition-colors cursor-pointer"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings Button */}
            <button
              onClick={openSettings}
              aria-label="Settings"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-[#A1A1AA] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#18181B] border border-transparent dark:hover:border-[#27272A] transition-colors cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* User Profile Badge */}
            <button
              onClick={openProfile}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-neutral-200 dark:border-[#27272A] transition-all cursor-pointer group"
              title="Aspirant Profile & Cloud Account"
            >
              <div className="w-6 h-6 rounded-lg bg-[#6366F1] text-white flex items-center justify-center font-bold text-xs uppercase font-mono shadow-xs">
                {(profile?.displayName || user?.displayName || 'U')[0]}
              </div>
              <div className="text-left hidden lg:block">
                <span className="text-xs font-bold text-neutral-900 dark:text-white block leading-none truncate max-w-[110px]">
                  {profile?.displayName || user?.displayName || 'Aspirant'}
                </span>
                <span className="text-[9px] text-neutral-400 dark:text-[#71717A] font-mono leading-none">
                  {profile?.targetService || 'IAS'} {profile?.upscYear || '2026'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Medium Screen Secondary Nav Bar */}
        <div className="hidden md:flex xl:hidden overflow-x-auto border-t border-neutral-200 dark:border-[#27272A] px-4 py-1.5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs whitespace-nowrap uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-[#27272A] dark:text-white font-bold'
                    : 'text-neutral-500 dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#09090B]/95 border-t border-neutral-200 dark:border-[#27272A] backdrop-blur-lg px-2 py-1.5 pb-safe overflow-x-auto">
        <div className="flex items-center justify-between min-w-full">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#6366F1] font-bold'
                    : 'text-neutral-500 dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="mt-0.5 truncate max-w-[48px]">{item.label}</span>
              </button>
            );
          })}

          {/* More menu on mobile for remaining tabs */}
          <button
            onClick={() => setCurrentTab(currentTab === 'pyqs' ? 'answerWriting' : currentTab === 'answerWriting' ? 'revision' : 'pyqs')}
            className="flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium text-neutral-500 dark:text-[#A1A1AA] cursor-pointer"
          >
            <FileQuestion className="w-4 h-4" />
            <span className="mt-0.5">UPSC Qs</span>
          </button>

          <button
            onClick={() => setCurrentTab('coach')}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium cursor-pointer ${
              currentTab === 'coach' ? 'text-[#6366F1] font-bold' : 'text-neutral-500 dark:text-[#A1A1AA]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="mt-0.5">AI Coach</span>
          </button>
        </div>
      </nav>
    </>
  );
};
