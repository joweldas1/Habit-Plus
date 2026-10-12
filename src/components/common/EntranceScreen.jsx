import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import logoNight from '../../assets/HabitPlus_Logo_Night.svg';
import logoDay from '../../assets/HabitPlus_Logo_Day.svg';

export const EntranceScreen = ({ onFinish }) => {
  const { settings, t } = useApp();
  const isNight = settings.theme === 'night';
  const [isFadingOut, setIsFadingOut] = useState(false);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    // Ultra-smooth 1.0s native app entrance splash: 700ms hold -> 300ms fadeout -> done!
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 700);

    const finishTimer = setTimeout(() => {
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    }, 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    }, 100);
  };

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-all duration-300 ease-out cursor-pointer ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      } ${
        isNight ? 'bg-[#09090B] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full blur-[110px] sm:blur-[140px] transition-all duration-700 ${
            isNight
              ? 'bg-gradient-to-tr from-purple-900/35 via-violet-600/20 to-sky-500/25'
              : 'bg-gradient-to-tr from-purple-300/40 via-violet-200/30 to-sky-200/40'
          }`}
        />
      </div>

      {/* Centered Brand Presentation */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Glowing Logo */}
        <div className="relative mb-4 sm:mb-6 group">
          <div
            className={`absolute -inset-3 rounded-2xl blur-xl opacity-60 transition-opacity duration-700 ${
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
        <div className="space-y-1">
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
      </div>
    </div>
  );
};
