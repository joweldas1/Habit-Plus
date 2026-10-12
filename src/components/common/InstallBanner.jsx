import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { Modal } from './Modal';

export const InstallBanner = ({ compact = false }) => {
  const { installPromptEvent, isStandalone, t, settings } = useApp();
  const { showToast } = useToast();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalledOrDismissed, setIsInstalledOrDismissed] = useState(() => {
    try {
      return (
        localStorage.getItem('habitplus_pwa_installed') === 'true' ||
        localStorage.getItem('habitplus_install_dismissed') === 'true'
      );
    } catch {
      return false;
    }
  });

  const isNight = settings.theme === 'night';

  useEffect(() => {
    const handleAppInstalled = () => {
      try {
        localStorage.setItem('habitplus_pwa_installed', 'true');
      } catch {
        // ignore
      }
      setIsInstalledOrDismissed(true);
      showToast('HabitPlus successfully installed!', 'success');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [showToast]);

  // If already running standalone or installed or dismissed, completely remove from UI!
  if (isStandalone || isInstalledOrDismissed) return null;

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      // Android / Chrome direct prompt
      try {
        installPromptEvent.prompt();
        const choiceResult = await installPromptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          try {
            localStorage.setItem('habitplus_pwa_installed', 'true');
          } catch {
            // ignore
          }
          setIsInstalledOrDismissed(true);
          showToast('HabitPlus successfully installed!', 'success');
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // iOS Safari or browser without beforeinstallprompt
      setShowIosGuide(true);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    try {
      localStorage.setItem('habitplus_install_dismissed', 'true');
    } catch {
      // ignore
    }
    setIsInstalledOrDismissed(true);
  };

  return (
    <>
      <div
        className={`w-full rounded-xl sm:rounded-2xl border transition-all duration-300 flex items-center justify-between ${
          compact ? 'py-1.5 px-2.5 sm:py-2 sm:px-3' : 'p-2.5 sm:p-3.5'
        } ${
          isNight
            ? 'bg-violet-950/20 border-violet-500/25'
            : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pr-2">
          <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0 ${
            isNight ? 'bg-violet-500/15 text-violet-400' : 'bg-slate-100 text-slate-700'
          }`}>
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold tracking-tight truncate">
              {t.installPromptTitle}
            </h4>
            <p className={`text-[10px] sm:text-[11px] truncate ${
              isNight ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              {t.installPromptDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-sm active:scale-95 transition-all ${
              isNight
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {t.installButton}
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            title="Dismiss"
            className={`p-1.5 rounded-lg transition-colors ${
              isNight
                ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Instructions Modal */}
      <Modal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        title="Add to Home Screen (iPhone / iPad)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-zinc-400">
            Follow these 2 simple steps in Safari to install HabitPlus without an App Store download:
          </p>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold block text-zinc-200">Step 1</span>
              <span className="text-zinc-400 text-xs">
                Tap the <strong>Share</strong> icon in the bottom Safari toolbar.
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
              <PlusSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold block text-zinc-200">Step 2</span>
              <span className="text-zinc-400 text-xs">
                Scroll down and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong>.
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowIosGuide(false)}
            className="w-full py-3 rounded-xl font-semibold bg-[#8B5CF6] text-white"
          >
            {t.close}
          </button>
        </div>
      </Modal>
    </>
  );
};
