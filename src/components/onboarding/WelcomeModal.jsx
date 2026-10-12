import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { requestNotificationPermission } from '../../services/notificationService';
import { Bell, ArrowRight } from 'lucide-react';

import logoNight from '../../assets/HabitPlus_Logo_Night.svg';

export const WelcomeModal = () => {
  const { settings, updateSettings, t, loadSuggestedRoutine } = useApp();
  const [nameInput, setNameInput] = useState('');
  const [askingNotifications, setAskingNotifications] = useState(false);

  // If user already finished onboarding, do not display
  if (settings.onboardingDone) return null;

  const handleNameSubmit = (e) => {
    e.preventDefault();
    const finalName = nameInput.trim() || 'Champion';
    updateSettings({ name: finalName });
    setAskingNotifications(true);
  };

  const handleNotificationChoice = async (allow) => {
    if (allow) {
      const permission = await requestNotificationPermission();
      updateSettings({
        notificationsEnabled: permission === 'granted',
        onboardingDone: true,
      });
    } else {
      updateSettings({
        notificationsEnabled: false,
        onboardingDone: true,
      });
    }
    // Automatically initialize with suggested routine
    loadSuggestedRoutine();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-[340px] rounded-3xl bg-[#131317]/95 border border-zinc-800/80 p-5 text-center text-[#F4F4F5] shadow-2xl relative overflow-hidden backdrop-blur-xl ring-1 ring-white/5">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {!askingNotifications ? (
          <form onSubmit={handleNameSubmit} className="space-y-4 relative z-10">
            {/* Logo */}
            <div className="mx-auto flex justify-center pt-1">
              <img
                src={logoNight}
                alt="HabitPlus Logo"
                className="h-[52px] sm:h-[56px] w-auto max-w-[240px] object-contain"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white">{t.welcome}</h2>
              <p className="text-[12px] text-zinc-400 leading-snug px-1">
                {t.welcomeSub}
              </p>
            </div>

            {/* Name Input */}
            <div className="text-left space-y-1 pt-0.5">
              <label className="text-[11px] font-semibold text-zinc-300 block">
                {t.enterName}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t.namePlaceholder}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </div>

            {/* Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full h-11 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-950/50 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>{t.getStarted}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 relative z-10 py-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-white">Stay On Track</h2>
              <p className="text-[12px] text-zinc-400 leading-snug px-1">
                {t.notificationsPrompt}
              </p>
            </div>

            <div className="flex flex-col space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleNotificationChoice(true)}
                className="w-full h-11 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-950/40 transition-colors"
              >
                {t.allow}
              </button>
              <button
                type="button"
                onClick={() => handleNotificationChoice(false)}
                className="w-full py-2 px-4 rounded-xl font-medium text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {t.skip}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
