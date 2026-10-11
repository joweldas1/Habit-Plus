import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Calendar,
  Briefcase,
  Dumbbell,
  BookOpen,
  Heart,
  Moon,
  Sparkles,
  Zap,
} from 'lucide-react';

const CategorySymbol = ({ category, className }) => {
  switch (category) {
    case 'English':
      return <BookOpen className={className} />;
    case 'Fitness':
      return <Dumbbell className={className} />;
    case 'Work':
      return <Briefcase className={className} />;
    case 'Personal':
      return <Heart className={className} />;
    case 'Rest':
      return <Moon className={className} />;
    case 'Growth':
      return <Sparkles className={className} />;
    case 'Custom':
    default:
      return <Zap className={className} />;
  }
};

export const LiveClock = () => {
  const { currentTime, settings, dailyTasks = [] } = useApp();
  const isNight = settings.theme === 'night';

  const formatHours = () => {
    let hours = currentTime.getHours();
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return {
      time: `${hours}:${minutes}:${seconds}`,
      ampm,
    };
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const { time, ampm } = formatHours();

  // Find active / running task for icon styling
  const activeTask = dailyTasks.find(
    (task) => task.status === 'active' || task.status === 'awaiting_done'
  );

  return (
    <div
      className={`w-full rounded-2xl border p-4 transition-all duration-300 ${
        isNight
          ? 'bg-gradient-to-r from-[#141418] via-[#16161D] to-[#141418] border-[#27272A]'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Dynamic Icon Box + Live Tracker & Time */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                activeTask
                  ? activeTask.status === 'awaiting_done'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : isNight
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : isNight
                    ? 'bg-purple-500/15 border-purple-500/20 text-[#8B5CF6]'
                    : 'bg-purple-50 border-purple-200 text-purple-600'
              }`}
            >
              {activeTask ? (
                <CategorySymbol
                  category={activeTask.category}
                  className="w-5 h-5"
                />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            {/* Top row: LIVE TRACKER */}
            <span
              className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block leading-none ${
                isNight ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              Live Tracker
            </span>

            {/* Bottom row: Digital Clock */}
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span
                className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}
              >
                {time}
              </span>
              <span className="text-xs font-bold text-violet-500 uppercase leading-none">{ampm}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Calendar & Date */}
        <div
          className={`shrink-0 text-right flex items-center space-x-2 ${
            isNight ? 'text-zinc-400' : 'text-slate-600'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#38BDF8]" />
          <span className="text-xs font-medium">{formatDate()}</span>
        </div>
      </div>
    </div>
  );
};
