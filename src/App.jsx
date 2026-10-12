import React, { useRef, useEffect, useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/common/ToastContainer';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { DailyTrackerView } from './components/tracker/DailyTrackerView';
import { RoutineManager } from './components/routine/RoutineManager';
import { AIMentorChat } from './components/mentor/AIMentorChat';
import { HistoryView } from './components/history/HistoryView';
import { WelcomeModal } from './components/onboarding/WelcomeModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AIConnectionTestModal } from './components/settings/AIConnectionTestModal';
import { EntranceScreen } from './components/common/EntranceScreen';

function MainAppShell() {
  const { activeTab, settings, isSettingsOpen, setIsSettingsOpen, isAIConnectionTestOpen, setIsAIConnectionTestOpen } = useApp();
  const isNight = settings.theme === 'night';
  const mainRef = useRef(null);

  // 3-4 second sleek entrance splash animation on entry
  const [showEntrance, setShowEntrance] = useState(() => {
    try {
      return sessionStorage.getItem('habitplus_entrance_seen') !== 'true';
    } catch {
      return true;
    }
  });

  const handleFinishEntrance = () => {
    try {
      sessionStorage.setItem('habitplus_entrance_seen', 'true');
    } catch {
      // ignore
    }
    setShowEntrance(false);
  };

  // Automatically reset scroll position to top whenever switching tabs to prevent glitching/stuck UI
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div
      className={`h-screen h-[100dvh] max-h-screen max-h-[100dvh] overflow-hidden transition-colors duration-300 relative selection:bg-purple-500 selection:text-white flex flex-col ${
        isNight ? 'bg-[#09090B] text-[#F4F4F5]' : 'bg-[#E2E8F0] text-[#1E293B]'
      }`}
    >
      {/* 3-4s Entrance Splash Animation */}
      {showEntrance && <EntranceScreen onFinish={handleFinishEntrance} />}

      {/* Night mode soft radial ambient glow (purple-to-blue) framing content */}
      {isNight && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-900/20 via-indigo-900/15 to-sky-900/20 rounded-full blur-[120px]" />
        </div>
      )}

      {/* Responsive Wrapper Container: constrained to 100vh height */}
      <div className="relative z-10 w-full max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto h-full max-h-full px-2.5 sm:px-4 md:px-8 pt-2 sm:pt-3 pb-1 md:pb-3 flex flex-col min-h-0 overflow-hidden">
        {/* Header - Fixed top */}
        <div className="shrink-0 mb-1.5 sm:mb-2.5">
          <Header />
        </div>

        {/* Tab Content - Scrollable interior filling remaining 100vh space */}
        <main
          ref={mainRef}
          className={`flex-1 min-h-0 overflow-x-hidden pr-0.5 sm:pr-1 ${
            activeTab === 'mentor'
              ? 'overflow-hidden flex flex-col pb-16 md:pb-1'
              : 'overflow-y-auto pb-16 md:pb-2'
          }`}
        >
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'tracker' && <DailyTrackerView />}
          {activeTab === 'routine' && <RoutineManager />}
          {activeTab === 'mentor' && <AIMentorChat />}
          {activeTab === 'history' && <HistoryView />}
        </main>
      </div>

      {/* Bottom Sticky Navigation */}
      <BottomNav />

      {/* Global Modals */}
      <WelcomeModal />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AIConnectionTestModal
        isOpen={isAIConnectionTestOpen}
        onClose={() => setIsAIConnectionTestOpen(false)}
      />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <MainAppShell />
      </AppProvider>
    </ToastProvider>
  );
}
