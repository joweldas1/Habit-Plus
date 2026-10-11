import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatTimeRange12h,
  getRemainingTimeDisplay,
  timeToMinutes,
} from '../../utils/timeUtils';
import { Check, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

export const TaskTimelineCard = ({ task }) => {
  const { markTaskDone, currentTime, settings, t } = useApp();
  const isNight = settings.theme === 'night';

  const status = task.status; // 'upcoming' | 'active' | 'awaiting_done' | 'done' | 'missed'
  const isDone = status === 'done';
  const isMissed = status === 'missed';
  const isActive = status === 'active';
  const isAwaitingDone = status === 'awaiting_done';
  const isUpcoming = status === 'upcoming';

  const canMarkDone = isAwaitingDone;

  // Calculate live progress percentage within active block
  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMin = timeToMinutes(task.startTime);
  const endMin = timeToMinutes(task.endTime);
  const duration = Math.max(1, endMin - startMin);

  let activeProgress = 0;
  if (isActive) {
    activeProgress = Math.min(100, Math.max(0, Math.round(((nowMin - startMin) / duration) * 100)));
  }

  // Visual styling based on state
  let containerStyle;

  if (isActive) {
    containerStyle = isNight
      ? 'border-[#8B5CF6] bg-gradient-to-r from-purple-950/40 via-[#161426] to-purple-950/20 shadow-lg shadow-purple-950/50 animate-pulse-glow'
      : 'border-violet-400 bg-violet-50/60 shadow-md ring-1 ring-violet-400/30';
  } else if (isAwaitingDone) {
    containerStyle = isNight
      ? 'border-amber-500/80 bg-amber-950/30'
      : 'border-amber-400 bg-amber-50/80';
  } else if (isDone) {
    containerStyle = isNight
      ? 'border-emerald-500/30 bg-[#121E19]/60 opacity-80'
      : 'border-emerald-200 bg-emerald-50/60 opacity-90';
  } else if (isMissed) {
    containerStyle = isNight
      ? 'border-rose-900/40 bg-[#1A1215]/60 opacity-55'
      : 'border-slate-200 bg-slate-50/60 opacity-60';
  } else {
    // upcoming
    containerStyle = isNight
      ? 'border-[#27272A] bg-[#141418] hover:border-zinc-700'
      : 'border-slate-200/90 bg-white shadow-xs hover:border-slate-300';
  }

  const categoryColor = {
    English: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
    Fitness: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    Work: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
    Personal: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
    Rest: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10',
    Growth: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    Custom: 'text-teal-400 border-teal-400/30 bg-teal-400/10',
  }[task.category] || 'text-zinc-400 border-zinc-400/30 bg-zinc-400/10';

  return (
    <div
      className={`relative w-full rounded-xl sm:rounded-2xl border p-3 sm:p-4 transition-all duration-300 ${containerStyle}`}
    >
      {/* Active "NOW" Live Badge */}
      {isActive && (
        <div className="absolute -top-2.5 right-3 sm:right-4 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] text-[9.5px] sm:text-[10px] font-bold text-white shadow-md uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-dot" />
          <span>NOW</span>
        </div>
      )}

      {/* Awaiting Done Grace Badge */}
      {isAwaitingDone && (
        <div className="absolute -top-2.5 right-3 sm:right-4 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500 text-[9.5px] sm:text-[10px] font-bold text-black shadow-md uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3" />
          <span>{t.gracePeriod}</span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1 pr-2 flex-1">
          {/* Header metadata: Time & Category */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs">
            <span className={`font-semibold font-mono flex items-center gap-1 ${isNight ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Clock className="w-3.5 h-3.5 opacity-70" />
              {formatTimeRange12h(task.startTime, task.endTime)}
            </span>

            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-semibold border ${categoryColor}`}>
              {task.category}
            </span>

            {task.type === 'avoid' && (
              <span className="px-1.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Avoid
              </span>
            )}
          </div>

          {/* Title & Points */}
          <div className="flex items-baseline space-x-1.5 sm:space-x-2 pt-0.5">
            <h4
              className={`text-xs sm:text-sm md:text-base font-semibold tracking-tight ${
                isDone ? 'line-through opacity-70' : isMissed ? 'line-through text-rose-400/80' : ''
              }`}
            >
              {task.title}
            </h4>
            <span className="text-[11px] sm:text-xs font-bold text-[#8B5CF6] whitespace-nowrap">
              +{task.points} pts
            </span>
          </div>

          {/* Countdown & Live status caption */}
          {(isActive || isAwaitingDone || isUpcoming) && (
            <p className={`text-[10px] sm:text-[11px] font-medium ${isNight ? 'text-zinc-400' : 'text-slate-500'}`}>
              {getRemainingTimeDisplay(task, currentTime)}
            </p>
          )}
        </div>

        {/* Action Button / Status Badge */}
        <div className="shrink-0 flex items-center">
          {isDone ? (
            <div className="flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.alreadyDone}</span>
            </div>
          ) : isMissed ? (
            <div className="flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] sm:text-xs font-bold">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.lockedMissed}</span>
            </div>
          ) : canMarkDone ? (
            <button
              onClick={() => markTaskDone(task.id)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center space-x-1 animate-pulse ${
                isNight
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-400/40'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 border border-emerald-600'
              }`}
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>{t.markDone}</span>
            </button>
          ) : isActive ? (
            <button
              onClick={() => markTaskDone(task.id)}
              title={`Task in progress! Unlocks at ${formatTimeRange12h(task.startTime, task.endTime).split('–')[1]?.trim() || ''} (${endMin - nowMin}m left)`}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-medium transition-all flex items-center space-x-1 opacity-70 hover:opacity-90 active:scale-95 cursor-pointer ${
                isNight
                  ? 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 hover:border-zinc-600'
                  : 'bg-slate-100 text-slate-600 border border-slate-300 hover:border-slate-400'
              }`}
            >
              <Clock className="w-3 h-3 text-violet-400 animate-pulse" />
              <span>Running ({endMin - nowMin}m)</span>
            </button>
          ) : (
            <div className={`px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-medium border ${
              isNight
                ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700/60'
                : 'bg-slate-100 text-slate-500 border-slate-200/90'
            }`}>
              Upcoming
            </div>
          )}
        </div>
      </div>

      {/* Live progress bar for active task */}
      {isActive && (
        <div className={`mt-3 w-full rounded-full h-1.5 overflow-hidden ${isNight ? 'bg-zinc-800/80' : 'bg-slate-200'}`}>
          <div
            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${activeProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
