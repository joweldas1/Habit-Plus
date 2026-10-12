import React from 'react';
import { useApp } from '../../context/AppContext';
import { getGreetingKey } from '../../utils/timeUtils';
import {
  Settings,
  Moon,
  Sun,
  Flame,
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  History,
  Layers,
} from 'lucide-react';
import logoNight from '../../assets/HabitPlus_Logo_Night.svg';
import logoDay from '../../assets/HabitPlus_Logo_Day.svg';

export const Header = () => {
  const {
    settings,
    updateSettings,
    streakData,
    setIsSettingsOpen,
    activeTab,
    setActiveTab,
    t,
  } = useApp();
  const isNight = settings.theme === 'night';
  const greetingKey = getGreetingKey();

  const toggleTheme = () => {
    updateSettings({ theme: isNight ? 'day' : 'night' });
  };

  const navItems = [
    { id: 'dashboard', label: t.tabDashboard, icon: LayoutDashboard },
    { id: 'tracker', label: t.tabTracker || 'Tracker', icon: Layers },
    { id: 'routine', label: t.tabRoutine, icon: CalendarDays },
    { id: 'mentor', label: t.tabMentor, icon: Sparkles },
    { id: 'history', label: t.tabHistory, icon: History },
  ];

  return (
    <header className={`py-1.5 px-2.5 sm:py-2 sm:px-3 md:px-5 rounded-2xl border transition-all duration-300 backdrop-blur-md flex items-center justify-between ${
      isNight ? 'bg-[#141418]/95 border-[#27272A]' : 'bg-white/95 border-slate-200/80 shadow-sm'
    }`}>
      {/* Brand & Greeting */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="focus:outline-none flex items-center transition-transform hover:scale-102 active:scale-98"
          aria-label="HabitPlus Home"
        >
          <img
            src={isNight ? logoNight : logoDay}
            alt="HabitPlus Logo"
            className="h-[35px] sm:h-10 md:h-12 w-auto max-w-[155px] sm:max-w-[185px] md:max-w-[215px] object-contain"
          />
        </button>

        <div className={`hidden sm:block border-l pl-3 ${
          isNight ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
        }`}>
          <p className="text-xs font-medium">
            {t[greetingKey]}{settings.name ? `, ${settings.name}` : ''}
          </p>
        </div>
      </div>

      {/* Desktop / Tablet Navigation Pills */}
      <nav className={`hidden md:flex items-center space-x-1 p-1 rounded-2xl border transition-all ${
        isNight ? 'bg-black/30 border-white/5' : 'bg-slate-100/90 border-slate-200/80'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? isNight
                    ? 'bg-violet-600 text-white shadow-sm shadow-purple-950/40'
                    : 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : isNight
                    ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Actions (Streak, Theme, Settings) */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        {/* Streak Flame Badge */}
        {streakData.currentStreak > 0 && (
          <div className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="font-mono">{streakData.currentStreak}d</span>
          </div>
        )}

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
            isNight
              ? 'bg-[#181820] border-[#27272A] text-zinc-300 hover:text-white hover:border-zinc-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black hover:border-slate-300 shadow-sm'
          }`}
        >
          {isNight ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Open Settings"
          className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl border transition-all duration-200 ${
            isNight
              ? 'bg-[#181820] border-[#27272A] text-zinc-300 hover:text-white hover:border-zinc-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black hover:border-slate-300 shadow-sm'
          }`}
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8B5CF6]" />
        </button>
      </div>
    </header>
  );
};
