import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatTimeRange12h,
  formatTime12h,
  timeToMinutes,
} from '../../utils/timeUtils';
import {
  Sparkles,
  Check,
  AlertTriangle,
  ArrowRight,
  Coffee,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const LiveFocusSpotlight = () => {
  const { dailyTasks, markTaskDone, currentTime, settings, t } = useApp();
  const isNight = settings.theme === 'night';

  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Find currently running or awaiting done task
  const activeTask = dailyTasks.find(
    (task) => task.status === 'active' || task.status === 'awaiting_done'
  );

  // Find next upcoming task
  const nextTask = dailyTasks.find((task) => task.status === 'upcoming');

  // If active task exists, calculate running duration & remaining time
  let elapsedMin = 0;
  let totalDurationMin = 0;
  let remainingMin = 0;
  let progressPercent = 0;

  if (activeTask) {
    const startMin = timeToMinutes(activeTask.startTime);
    const endMin = timeToMinutes(activeTask.endTime);
    totalDurationMin = Math.max(1, endMin - startMin);

    if (activeTask.status === 'active') {
      elapsedMin = Math.max(0, nowMin - startMin);
      remainingMin = Math.max(0, endMin - nowMin);
      progressPercent = Math.min(
        100,
        Math.max(0, Math.round((elapsedMin / totalDurationMin) * 100))
      );
    } else {
      // awaiting_done (in grace period)
      elapsedMin = totalDurationMin;
      remainingMin = 0;
      progressPercent = 100;
    }
  }

  // Calculate starts in minutes for next task
  let nextStartsInMin = null;
  if (nextTask) {
    const nextStartMin = timeToMinutes(nextTask.startTime);
    nextStartsInMin = Math.max(0, nextStartMin - nowMin);
  }

  const formatMins = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
        isNight
          ? 'bg-gradient-to-br from-[#161426] via-[#141418] to-[#171424] border-violet-500/30 shadow-lg shadow-purple-950/20'
          : 'bg-gradient-to-br from-violet-50/70 via-white to-sky-50/50 border-violet-200/80 shadow-sm'
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left Section (7 cols): Currently Running Task */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <Sparkles className="w-3 h-3 animate-spin text-violet-400" />
              <span>{t.currentFocus || 'Current Focus'}</span>
            </span>

            {activeTask?.status === 'active' && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-dot" />
                <span>Running</span>
              </span>
            )}

            {activeTask?.status === 'awaiting_done' && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" />
                <span>Grace Window</span>
              </span>
            )}
          </div>

          {activeTask ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">
                    {activeTask.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs mt-0.5">
                    <span
                      className={`font-mono font-medium ${
                        isNight ? 'text-zinc-400' : 'text-slate-600'
                      }`}
                    >
                      {formatTimeRange12h(
                        activeTask.startTime,
                        activeTask.endTime
                      )}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="font-semibold text-violet-400">
                      +{activeTask.points} pts
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-[11px] px-2 py-0.2 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300">
                      {activeTask.category}
                    </span>
                  </div>
                </div>

                {/* Quick Done button - Smaller and gated until exact time finishes */}
                {activeTask.status === 'awaiting_done' ? (
                  <button
                    onClick={() => markTaskDone(activeTask.id)}
                    className={`shrink-0 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center space-x-1 animate-pulse ${
                      isNight
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-400/40'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 border border-emerald-600'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>{t.markDone}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => markTaskDone(activeTask.id)}
                    title={`Task is still running! Unlocks at ${formatTime12h(activeTask.endTime)} (${remainingMin}m left)`}
                    className={`shrink-0 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-medium transition-all flex items-center space-x-1 opacity-70 hover:opacity-90 active:scale-95 cursor-pointer ${
                      isNight
                        ? 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 hover:border-zinc-600'
                        : 'bg-slate-100 text-slate-600 border border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-violet-400" />
                    <span>{t.markDone} ({remainingMin}m)</span>
                  </button>
                )}
              </div>

              {/* Live Running Time & Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className={isNight ? 'text-zinc-300' : 'text-slate-700'}>
                    {t.runningFor || 'Running for'}:{' '}
                    <span className="font-mono font-bold text-violet-400">
                      {formatMins(elapsedMin)}
                    </span>{' '}
                    <span className="text-zinc-400 font-normal">
                      / {formatMins(totalDurationMin)}
                    </span>
                  </span>

                  <span
                    className={`text-[11px] ${
                      isNight ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    {activeTask.status === 'awaiting_done' ? (
                      <span className="text-amber-400 font-semibold">
                        Awaiting check-in
                      </span>
                    ) : (
                      <>
                        <span className="font-mono font-bold text-sky-400">
                          {formatMins(remainingMin)}
                        </span>{' '}
                        {t.timeRemaining || 'left'}
                      </>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full rounded-full h-2 overflow-hidden ${
                    isNight ? 'bg-zinc-800/80' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-sky-400 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 py-2">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {t.noActiveTask || 'Free Time • No active task right now'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Recharge or review your upcoming goals.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Section (5 cols): Up Next Preview Card */}
        <div
          className={`lg:col-span-5 rounded-xl p-3 sm:p-3.5 border transition-all ${
            isNight
              ? 'bg-[#141418]/90 border-zinc-800'
              : 'bg-white/90 border-slate-200/90 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-sky-400" />
              {t.upNext || 'Up Next'}
            </span>

            {nextStartsInMin !== null && (
              <span className="text-[11px] font-semibold text-sky-400 font-mono">
                {t.startsIn || 'Starts in'} {formatMins(nextStartsInMin)}
              </span>
            )}
          </div>

          {nextTask ? (
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold tracking-tight truncate pr-2">
                  {nextTask.title}
                </h4>
                <span className="text-xs font-bold text-violet-400 shrink-0">
                  +{nextTask.points} pts
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-zinc-400">
                <span className="font-mono">
                  {formatTime12h(nextTask.startTime)}
                </span>
                <span>•</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-800/60 text-zinc-300 border border-zinc-700/40">
                  {nextTask.category}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 py-1 text-zinc-400 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No more upcoming tasks scheduled today!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
