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
      <div className="w-full max-w-sm rounded-3xl bg-[#141418] border border-[#27272A] p-6 text-center text-[#F4F4F5] shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {!askingNotifications ? (
          <form onSubmit={handleNameSubmit} className="space-y-5 relative z-10">
            <div className="mx-auto flex justify-center">
              <img
                src={logoNight}
                alt="HabitPlus Logo"
                className="h-16 sm:h-20 w-auto max-w-[280px] object-contain"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t.welcome}</h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {t.welcomeSub}
              </p>
            </div>

            <div className="text-left space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {t.enterName}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t.namePlaceholder}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <span>{t.getStarted}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-5 relative z-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-7 h-7 animate-bounce" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight">Stay On Track</h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {t.notificationsPrompt}
              </p>
            </div>

            <div className="flex flex-col space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleNotificationChoice(true)}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-[#8B5CF6] text-white shadow-lg shadow-purple-600/30 hover:bg-[#7C3AED] transition-colors"
              >
                {t.allow}
              </button>
              <button
                type="button"
                onClick={() => handleNotificationChoice(false)}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
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
