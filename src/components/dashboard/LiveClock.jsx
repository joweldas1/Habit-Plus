import React from 'react';
import { useApp } from '../../context/AppContext';
import { timeToMinutes } from '../../utils/timeUtils';
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
  Coffee,
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

  // Find active / running task
  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const activeTask = dailyTasks.find(
    (task) => task.status === 'active' || task.status === 'awaiting_done'
  );
  const nextTask = !activeTask
    ? dailyTasks.find((task) => task.status === 'upcoming')
    : null;

  let remainingMin = 0;
  if (activeTask && activeTask.status === 'active') {
    const endMin = timeToMinutes(activeTask.endTime);
    remainingMin = Math.max(0, endMin - nowMin);
  }

  return (
    <div
      className={`w-full rounded-2xl border p-4 transition-all duration-300 ${
        isNight
          ? 'bg-gradient-to-r from-[#141418] via-[#16161D] to-[#141418] border-[#27272A]'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Dynamic Icon Box + Live Tracker & Running Task Pill */}
        <div className="flex items-center space-x-3 min-w-0">
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
                  className="w-5 h-5 animate-pulse"
                />
              ) : (
                <Clock className="w-5 h-5 animate-pulse" />
              )}
            </div>

            {/* Pulsing Dot on Icon when task is active */}
            {activeTask && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    activeTask.status === 'awaiting_done'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                ></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            {/* Top row: LIVE TRACKER + Current Running Task Symbol Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider shrink-0 ${
                  isNight ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                Live Tracker
              </span>

              {/* Running task symbol badge */}
              {activeTask ? (
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                    activeTask.status === 'awaiting_done'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse'
                      : isNight
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                  }`}
                  title={`${activeTask.title} (${activeTask.startTime} - ${activeTask.endTime})`}
                >
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <CategorySymbol
                    category={activeTask.category}
                    className="w-3 h-3 shrink-0"
                  />
                  <span className="truncate max-w-[110px] sm:max-w-[150px] md:max-w-[180px]">
                    {activeTask.title}
                  </span>
                  {remainingMin > 0 && (
                    <span className="text-[10px] opacity-75 font-mono font-normal">
                      · {remainingMin}m left
                    </span>
                  )}
                </div>
              ) : nextTask ? (
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    isNight
                      ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                  title={`Next: ${nextTask.title}`}
                >
                  <CategorySymbol
                    category={nextTask.category}
                    className="w-3 h-3 opacity-70 shrink-0"
                  />
                  <span className="truncate max-w-[90px] sm:max-w-[130px]">
                    Next: {nextTask.title}
                  </span>
                </div>
              ) : (
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    isNight
                      ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  <Coffee className="w-3 h-3 opacity-60 shrink-0" />
                  <span>Free Time</span>
                </div>
              )}
            </div>

            {/* Bottom row: Digital Clock */}
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span
                className={`text-2xl font-bold tracking-tight tabular-nums ${
                  isNight ? 'text-white' : 'text-slate-900'
                }`}
              >
                {time}
              </span>
              <span className="text-xs font-bold text-violet-500 uppercase">{ampm}</span>
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
