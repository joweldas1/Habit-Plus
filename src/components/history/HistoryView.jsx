import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnalyticsChart } from './AnalyticsChart';
import { DayDetailModal } from './DayDetailModal';
import {
  ShieldCheck,
  Award,
  Flame,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

export const HistoryView = () => {
  const { historyLogs, streakData, settings, t } = useApp();
  const [selectedDay, setSelectedDay] = useState(null);
  const isNight = settings.theme === 'night';

  const totalDays = historyLogs.length;
  const bestDayScore = totalDays
    ? Math.max(...historyLogs.map((h) => h.score || 0))
    : 0;

  const targetMetDays = historyLogs.filter((h) => h.targetMet).length;
  const consistencyRate = totalDays ? Math.round((targetMetDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">{t.historyTitle}</h2>
        <p className="text-[11px] sm:text-xs text-zinc-400">{t.historySub}</p>
      </div>

      {/* Highlights Grid: 2 cols on mobile, 4 cols on tablet and desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
        <div
          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
            isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-zinc-400 font-medium">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <span className="truncate">{t.bestDayScore}</span>
          </div>
          <span className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight mt-0.5 sm:mt-1 block font-mono ${
            isNight ? 'text-white' : 'text-slate-900'
          }`}>
            {bestDayScore} <span className="text-[10px] sm:text-xs text-zinc-400 font-normal">/100</span>
          </span>
        </div>

        <div
          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
            isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-zinc-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#38BDF8]" />
            <span className="truncate">{t.consistencyRate}</span>
          </div>
          <span className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight mt-0.5 sm:mt-1 block font-mono ${
            isNight ? 'text-white' : 'text-slate-900'
          }`}>
            {consistencyRate}%
          </span>
        </div>

        <div
          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
            isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-zinc-400 font-medium">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="truncate">{t.longestStreak}</span>
          </div>
          <span className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight mt-0.5 sm:mt-1 block font-mono ${
            isNight ? 'text-white' : 'text-slate-900'
          }`}>
            {streakData.longestStreak} {t.streakDays}
          </span>
        </div>

        <div
          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
            isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-zinc-400 font-medium">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="truncate">{t.totalLoggedDays}</span>
          </div>
          <span className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight mt-0.5 sm:mt-1 block font-mono ${
            isNight ? 'text-white' : 'text-slate-900'
          }`}>
            {totalDays} {t.streakDays}
          </span>
        </div>
      </div>

      {/* Main Responsive Split: Left = Chart & Security; Right = Daily Records */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Bar Chart & Security Notice */}
        <div className="md:col-span-6 lg:col-span-7 space-y-4">
          <AnalyticsChart logs={historyLogs} />

          {/* Anti-cheat Immutability Badge */}
          <div className="flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-purple-300 text-xs">
            <ShieldCheck className="w-5 h-5 text-[#8B5CF6] shrink-0" />
            <span>{t.immutableNotice}</span>
          </div>
        </div>

        {/* Right Column: Day by Day Log List */}
        <div className="md:col-span-6 lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Daily Discipline Logs
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">
              {historyLogs.length} Logged
            </span>
          </div>

          {historyLogs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 space-y-2">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">{t.noHistoryYet}</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5">
              {historyLogs.map((log) => (
                <button
                  key={log.date}
                  onClick={() => setSelectedDay(log)}
                  className={`w-full p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border flex items-center justify-between text-left transition-all hover:scale-[1.01] ${
                    isNight
                      ? 'bg-[#141418] border-[#27272A] hover:border-zinc-700'
                      : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <span className="font-bold text-xs sm:text-sm text-white font-mono">{log.date}</span>
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold border ${
                          log.targetMet
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        {log.targetMet ? 'Met' : 'Missed'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs text-zinc-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {log.doneCount} Done
                      </span>
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {log.missedCount} Missed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-bold text-[#8B5CF6] font-mono block">
                        {log.score}
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] text-zinc-500">/ 100 pts</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        dayLog={selectedDay}
      />
    </div>
  );
};
