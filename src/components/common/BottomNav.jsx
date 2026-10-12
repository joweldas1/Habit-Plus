import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, CalendarDays, Sparkles, History, Layers } from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab, t, settings } = useApp();
  const isNight = settings.theme === 'night';

  const tabs = [
    { id: 'dashboard', label: t.tabDashboard || 'Home', icon: LayoutDashboard },
    { id: 'tracker', label: t.tabTracker || 'Tracker', icon: Layers },
    { id: 'routine', label: t.tabRoutine, icon: CalendarDays },
    { id: 'mentor', label: t.tabMentor, icon: Sparkles },
    { id: 'history', label: t.tabHistory, icon: History },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto border-t backdrop-blur-xl px-1 py-1 transition-all duration-300 md:hidden ${
        isNight
          ? 'bg-[#09090B]/95 border-[#27272A] text-zinc-300'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-lg'
      }`}
    >
      <div className="grid grid-cols-5 gap-0.5 sm:gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? isNight
                    ? 'text-violet-400 bg-violet-500/15'
                    : 'text-violet-600 bg-violet-50'
                  : isNight
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-[18px] h-[18px] transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                )}
              </div>
              <span className={`text-[9.5px] mt-0.5 font-semibold truncate ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
