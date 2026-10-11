import React from 'react';
import { useApp } from '../../context/AppContext';
import { CircularGauge } from '../common/CircularGauge';
import { Award, Target, Flame, CheckCircle, XCircle, Clock } from 'lucide-react';

export const MetricsSummary = () => {
  const { dailyTasks, streakData, settings, t } = useApp();
  const isNight = settings.theme === 'night';

  const completedTasks = dailyTasks.filter((t) => t.status === 'done');
  const missedTasks = dailyTasks.filter((t) => t.status === 'missed');
  const remainingTasks = dailyTasks.filter((t) => t.status === 'upcoming' || t.status === 'active' || t.status === 'awaiting_done');

  const earnedPoints = completedTasks.reduce((acc, t) => acc + (t.points || 0), 0);
  const targetThreshold = settings.streakTargetPercent || 70;
  const targetPercentage = Math.min(100, Math.round((earnedPoints / targetThreshold) * 100));

  return (
    <div
      className={`w-full rounded-2xl border p-4 space-y-3 transition-all duration-300 ${
        isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* 3 Ring Gauges Grid */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800/40">
        {/* 1. Today's Points */}
        <CircularGauge
          value={earnedPoints}
          max={100}
          size={84}
          strokeWidth={7}
          label={t.todaysPoints}
          subLabel="/100"
          accentColor="#8B5CF6"
          secondaryColor="#A855F7"
          icon={Award}
          isThemeDay={!isNight}
        />

        {/* 2. Target Completion */}
        <CircularGauge
          value={targetPercentage}
          max={100}
          size={84}
          strokeWidth={7}
          label={t.targetCompletion}
          subLabel="%"
          accentColor="#38BDF8"
          secondaryColor="#0EA5E9"
          icon={Target}
          isThemeDay={!isNight}
        />

        {/* 3. Streak Meter */}
        <CircularGauge
          value={streakData.currentStreak}
          max={Math.max(10, streakData.longestStreak || 7)}
          size={84}
          strokeWidth={7}
          label={t.currentStreak}
          subLabel={t.streakDays}
          accentColor="#F59E0B"
          secondaryColor="#EF4444"
          icon={Flame}
          isThemeDay={!isNight}
        />
      </div>

      {/* Progress Pill Breakdown */}
      <div className="pt-2 border-t border-zinc-800/40 grid grid-cols-3 gap-2 text-center">
        <div className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{completedTasks.length} {t.completed}</span>
        </div>

        <div className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <XCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{missedTasks.length} {t.missed}</span>
        </div>

        <div className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{remainingTasks.length} {t.remaining}</span>
        </div>
      </div>
    </div>
  );
};
