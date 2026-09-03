/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Navigation, TabType } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { StudyTimerView } from './components/StudyTimerView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { SubjectsView } from './components/SubjectsView';
import { PYQTrackerView } from './components/PYQTrackerView';
import { AnswerWritingView } from './components/AnswerWritingView';
import { RevisionView } from './components/RevisionView';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AICoachView } from './components/AICoachView';
import { SettingsModal } from './components/SettingsModal';
import { AIDailyReviewModal } from './components/AIDailyReviewModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthView } from './components/AuthView';
import { GraduationCap } from 'lucide-react';

function AuthenticatedApp() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { startSession } = useStudy();

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
        openProfile={() => setIsProfileOpen(true)}
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
            onOpenPYQs={() => setCurrentTab('pyqs')}
            onOpenAnswerWriting={() => setCurrentTab('answerWriting')}
            onOpenRevision={() => setCurrentTab('revision')}
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

        {currentTab === 'pyqs' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PYQTrackerView />
          </div>
        )}

        {currentTab === 'answerWriting' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnswerWritingView />
          </div>
        )}

        {currentTab === 'revision' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <RevisionView />
          </div>
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
        <span>UPSC Preparation Workspace • Cloud Synchronized</span>
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

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

function MainRoot() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-950 text-white">
        <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/15 text-[#6366F1] flex items-center justify-center border border-[#6366F1]/30 mb-3 animate-pulse">
          <GraduationCap className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">
          Connecting to UPSC Workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <StudyProvider>
      <AuthenticatedApp />
    </StudyProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRoot />
    </AuthProvider>
  );
}
