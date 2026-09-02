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
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatSecondsToHms } from '../utils/formatters';

export type TabType = 'dashboard' | 'timer' | 'planner' | 'subjects' | 'history' | 'analytics' | 'coach';

interface NavigationProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  openSettings: () => void;
  openDailyReview: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  openSettings,
  openDailyReview,
}) => {
  const { activeSession, timerSeconds, pauseSession, resumeSession, settings, setTheme } = useStudy();

  const toggleTheme = () => {
    setTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timer', label: 'Study Timer', icon: Timer },
    { id: 'planner', label: 'Study Plan', icon: CalendarCheck2 },
    { id: 'subjects', label: 'Subjects', icon: BookMarked },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'coach', label: 'AI Coach', icon: Sparkles },
  ];

  return (
    <>
      {/* Top Desktop & Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-[#27272A] bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm group-hover:scale-105 transition-transform">
                S
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg sm:text-xl tracking-tight uppercase text-neutral-900 dark:text-[#FAFAFA]">
                  StudyOS
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isCoach = item.id === 'coach';

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-neutral-100 text-neutral-900 dark:bg-[#27272A] dark:text-[#FAFAFA] shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-[#A1A1AA] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#18181B]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isCoach ? 'text-indigo-500 dark:text-indigo-400' : ''}`} />
                    <span>{item.label}</span>
                    {isCoach && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-[#A5B4FC]">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Date Display */}
            <div className="text-right hidden lg:block pr-2 border-r border-neutral-200 dark:border-[#27272A]">
              <p className="text-[10px] text-[#A1A1AA] uppercase tracking-widest font-semibold">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
              <p className="text-xs font-medium text-neutral-800 dark:text-[#FAFAFA]">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Active Session Pill (Visible across all tabs when timer is running) */}
            {activeSession && currentTab !== 'timer' && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-neutral-900 dark:text-[#FAFAFA] text-xs font-mono shadow-xs animate-fade-in">
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: activeSession.subjectColor }}
                />
                <span className="font-semibold hidden sm:inline max-w-[100px] truncate">{activeSession.subjectName}</span>
                <span className="font-bold tracking-wider">{formatSecondsToHms(timerSeconds)}</span>
                
                <button
                  onClick={activeSession.isPaused ? resumeSession : pauseSession}
                  className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-700 dark:text-[#A1A1AA] transition-colors"
                  title={activeSession.isPaused ? 'Resume Session' : 'Pause Session'}
                >
                  {activeSession.isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                </button>

                <button
                  onClick={() => setCurrentTab('timer')}
                  className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-[#27272A] text-neutral-700 dark:text-[#A1A1AA] transition-colors"
                  title="Open Study Timer View"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Daily Review Quick Button */}
            <button
              onClick={openDailyReview}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] text-neutral-800 dark:text-[#FAFAFA] border border-neutral-200 dark:border-[#27272A] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Review</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-[#A1A1AA] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#18181B] border border-transparent dark:hover:border-[#27272A] transition-colors"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings Button */}
            <button
              onClick={openSettings}
              aria-label="Settings"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-[#A1A1AA] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#18181B] border border-transparent dark:hover:border-[#27272A] transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#09090B]/95 border-t border-neutral-200 dark:border-[#27272A] backdrop-blur-lg px-2 py-1.5 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isCoach = item.id === 'coach';

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-[#6366F1] font-bold'
                    : 'text-neutral-500 dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {isCoach && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#6366F1] animate-pulse"></span>
                  )}
                </div>
                <span className="mt-0.5 truncate max-w-[54px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
