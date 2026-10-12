import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  exportAllData,
  validateAndImportData,
  resetAllData,
} from '../../services/storageService';
import {
  requestNotificationPermission,
  sendTestNotification,
} from '../../services/notificationService';
import {
  Moon,
  Sun,
  Languages,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Save,
} from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    t,
  } = useApp();
  const { showToast } = useToast();
  const isNight = settings.theme === 'night';

  const [nameInput, setNameInput] = useState(settings.name || '');
  const [streakTargetInput, setStreakTargetInput] = useState(settings.streakTargetPercent || 70);

  const handleSaveProfile = () => {
    updateSettings({
      name: nameInput.trim() || 'Champion',
      streakTargetPercent: Math.min(100, Math.max(10, parseInt(streakTargetInput, 10) || 70)),
    });
    showToast('Settings updated!', 'success');
  };

  const handleToggleTheme = () => {
    updateSettings({ theme: isNight ? 'day' : 'night' });
  };

  const handleToggleLanguage = () => {
    const nextLang = settings.language === 'en' ? 'bn' : 'en';
    updateSettings({ language: nextLang });
    showToast(nextLang === 'bn' ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে' : 'Language switched to English', 'info');
  };

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        updateSettings({ notificationsEnabled: true });
        showToast('Local notifications activated!', 'success');
        // Instantly fire a test notification to confirm mobile device compatibility
        sendTestNotification();
      } else {
        showToast('Notification permission was not granted by browser.', 'warning');
      }
    } else {
      updateSettings({ notificationsEnabled: false });
      showToast('Notifications silenced.', 'info');
    }
  };

  const handleTestNotification = async () => {
    const res = await sendTestNotification();
    if (res.success) {
      showToast('Alert sent! Check your notification bar / lock screen.', 'success');
    } else if (res.reason === 'permission_denied') {
      showToast('Please enable notifications in your browser/device settings.', 'warning');
    } else {
      showToast('Notifications not supported in this browser.', 'warning');
    }
  };

  const handleExport = () => {
    exportAllData();
    showToast('Backup JSON file downloaded!', 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const success = validateAndImportData(content);
      if (success) {
        showToast(t.dataRestored, 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        showToast(t.invalidBackupFile, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm(t.confirmReset)) {
      resetAllData();
      showToast('All app data cleared.', 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.settingsTitle}>
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Profile Card */}
        <div
          className={`p-3.5 rounded-2xl border space-y-3 ${
            isNight ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="space-y-1">
            <label className={`font-semibold block ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>{t.userName}</label>
            <div className="flex items-center space-x-2">
              <div
                title="Profile Avatar Preview"
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/10 select-none uppercase"
              >
                {(nameInput.trim() || 'U').charAt(0).toUpperCase()}
              </div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t.namePlaceholder}
                className={`flex-1 px-3 py-2 rounded-xl border focus:outline-none transition-colors ${
                  isNight
                    ? 'bg-black border-zinc-700 text-white focus:border-violet-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-violet-600'
                }`}
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1 shadow-sm transition-colors ${
                  isNight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className={`font-semibold ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>Streak Target (% of 100)</label>
              <span className="font-bold text-violet-500 tabular-nums">{streakTargetInput}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={streakTargetInput}
              onChange={(e) => setStreakTargetInput(e.target.value)}
              onMouseUp={handleSaveProfile}
              onTouchEnd={handleSaveProfile}
              className="w-full accent-violet-600"
            />
          </div>
        </div>

        {/* Preferences Toggles */}
        <div
          className={`p-3.5 rounded-2xl border space-y-3 ${
            isNight ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* Theme Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {isNight ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span className="font-semibold">{t.themeMode}</span>
            </div>
            <button
              onClick={handleToggleTheme}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                isNight
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {isNight ? t.themeNight : t.themeDay}
            </button>
          </div>

          {/* Language Switch */}
          <div className={`flex items-center justify-between pt-1 border-t ${
            isNight ? 'border-zinc-800/60' : 'border-slate-200'
          }`}>
            <div className="flex items-center space-x-2.5">
              <Languages className="w-4 h-4 text-sky-400" />
              <span className="font-semibold">{t.languageSetting}</span>
            </div>
            <button
              onClick={handleToggleLanguage}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                isNight
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {settings.language === 'en' ? 'English (EN)' : 'বাংলা (BN)'}
            </button>
          </div>

          {/* Notifications Toggle & Instant Test */}
          <div className={`space-y-2 pt-1 border-t ${
            isNight ? 'border-zinc-800/60' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{t.notifications}</span>
              </div>
              <div className="flex items-center space-x-2">
                {settings.notificationsEnabled && (
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                      isNight
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                        : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    🔔 Test Alert
                  </button>
                )}
                <button
                  onClick={handleToggleNotifications}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    settings.notificationsEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isNight
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        : 'bg-white text-slate-600 border border-slate-300'
                  }`}
                >
                  {settings.notificationsEnabled ? 'Active ✓' : 'Disabled'}
                </button>
              </div>
            </div>
            {settings.notificationsEnabled && (
              <p className="text-[11px] text-zinc-400">
                Supports background reminders on mobile (Android/iOS PWA) & desktop. Tap "Test Alert" to verify sound and vibration.
              </p>
            )}
          </div>
        </div>

        {/* Backup & Restore Strip */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExport}
            className={`py-2.5 px-3 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
              isNight
                ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span className="truncate">Export JSON</span>
          </button>

          <label className={`py-2.5 px-3 rounded-xl border font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
            isNight
              ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
          }`}>
            <Upload className="w-4 h-4 text-emerald-400" />
            <span className="truncate">Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {/* Danger Zone: Reset */}
        <div className="pt-2">
          <button
            onClick={handleReset}
            className={`w-full py-2.5 px-3 rounded-xl border font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors ${
              isNight
                ? 'border-rose-900/30 bg-rose-950/15 hover:bg-rose-950/30 text-rose-400'
                : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetData}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
