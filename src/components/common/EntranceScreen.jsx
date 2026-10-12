import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import logoNight from '../../assets/HabitPlus_Logo_Night.svg';
import logoDay from '../../assets/HabitPlus_Logo_Day.svg';
import { Sparkles } from 'lucide-react';

export const EntranceScreen = ({ onFinish }) => {
  const { settings, t } = useApp();
  const isNight = settings.theme === 'night';
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress fill over ~3 seconds
    const intervalTime = 30; // ms
    const totalDuration = 2800; // ms
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, intervalTime);

    // Trigger fade-out animation at 3 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3100);

    // Complete and unmount at ~3.7 seconds
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3700);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-all duration-700 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      } ${
        isNight
          ? 'bg-[#09090B] text-white'
          : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full blur-[110px] sm:blur-[140px] transition-all duration-1000 ${
            isNight
              ? 'bg-gradient-to-tr from-purple-900/35 via-violet-600/20 to-sky-500/25'
              : 'bg-gradient-to-tr from-purple-300/40 via-violet-200/30 to-sky-200/40'
          }`}
        />
      </div>

      {/* Top right Skip button */}
      <button
        onClick={handleSkip}
        className={`absolute top-5 right-5 sm:top-7 sm:right-7 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all z-20 cursor-pointer ${
          isNight
            ? 'bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-400 hover:text-white border border-zinc-700/50'
            : 'bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-xs'
        }`}
      >
        Skip ➔
      </button>

      {/* Centered Brand Presentation */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-700">
        {/* Glowing Logo */}
        <div className="relative mb-6 sm:mb-8 group">
          <div
            className={`absolute -inset-3 rounded-2xl blur-xl opacity-60 transition-opacity duration-1000 ${
              isNight ? 'bg-violet-600/30' : 'bg-violet-400/25'
            }`}
          />
          <img
            src={isNight ? logoNight : logoDay}
            alt="HabitPlus Logo"
            className="relative h-12 sm:h-14 md:h-16 w-auto max-w-[220px] sm:max-w-[260px] object-contain drop-shadow-md"
          />
        </div>

        {/* Dynamic Tagline with Shimmer */}
        <div className="space-y-1.5 mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            {t.appName || 'HabitPlus'}
          </h2>
          <p
            className={`text-xs sm:text-sm font-medium ${
              isNight ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            {t.tagline || 'Gamified Habit Tracker & Routine Manager'}
          </p>
        </div>

        {/* 3-Second Precision Progress Indicator */}
        <div className="w-56 sm:w-64 space-y-2">
          <div
            className={`h-1.5 w-full rounded-full overflow-hidden p-0.5 ${
              isNight ? 'bg-zinc-800/80 border border-zinc-700/40' : 'bg-slate-200 border border-slate-300/60'
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(139,92,246,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono font-medium text-zinc-400 px-0.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-violet-400 animate-spin" />
              <span>Initializing Focus Systems...</span>
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
