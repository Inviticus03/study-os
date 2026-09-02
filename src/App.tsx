/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Navigation, TabType } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { StudyTimerView } from './components/StudyTimerView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { SubjectsView } from './components/SubjectsView';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AICoachView } from './components/AICoachView';
import { SettingsModal } from './components/SettingsModal';
import { AIDailyReviewModal } from './components/AIDailyReviewModal';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);

  const { startSession, activeSession } = useStudy();

  const handleStartTaskTimer = (subjectId: string, topic: string, mins: number, taskId: string) => {
    startSession({
      subjectId,
      topic,
      sessionGoalMinutes: mins,
      sessionType: 'deep_work',
      taskId,
    });
    setCurrentTab('timer');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#09090B] text-neutral-900 dark:text-[#FAFAFA] flex flex-col font-sans selection:bg-[#6366F1]/20 selection:text-[#6366F1]">
      
      {/* Navigation Header */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openSettings={() => setIsSettingsOpen(true)}
        openDailyReview={() => setIsDailyReviewOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-8">
        {currentTab === 'dashboard' && (
          <HomeDashboard
            onStartStudying={() => setCurrentTab('timer')}
            onOpenPlanner={() => setCurrentTab('planner')}
            onOpenDailyReview={() => setIsDailyReviewOpen(true)}
            onOpenAnalytics={() => setCurrentTab('analytics')}
            onOpenHistory={() => setCurrentTab('history')}
            onOpenTimerWithTask={handleStartTaskTimer}
          />
        )}

        {currentTab === 'timer' && (
          <StudyTimerView onOpenSubjects={() => setCurrentTab('subjects')} />
        )}

        {currentTab === 'planner' && (
          <StudyPlannerView onStartTaskTimer={handleStartTaskTimer} />
        )}

        {currentTab === 'subjects' && (
          <SubjectsView />
        )}

        {currentTab === 'history' && (
          <HistoryView />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView />
        )}

        {currentTab === 'coach' && (
          <AICoachView />
        )}
      </main>

      {/* Utility Footer (Desktop) */}
      <footer className="hidden md:flex px-8 py-3 bg-white dark:bg-[#09090B] border-t border-neutral-200 dark:border-[#27272A] justify-between items-center text-[11px] text-neutral-500 dark:text-[#52525B] uppercase tracking-wider">
        <span>Ready for next session? Choose a subject and tap start.</span>
        <span className="font-mono">StudyOS Engine: Ready</span>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AIDailyReviewModal
        isOpen={isDailyReviewOpen}
        onClose={() => setIsDailyReviewOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}
