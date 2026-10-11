import React from 'react';
import { useApp } from '../../context/AppContext';

export const AnalyticsChart = ({ logs = [] }) => {
  const { settings } = useApp();
  const isNight = settings.theme === 'night';

  // Last 7 days in chronological order
  const recentDays = logs.slice(0, 7).reverse();

  if (recentDays.length === 0) return null;

  return (
    <div
      className={`w-full rounded-2xl border p-4 space-y-3 transition-all ${
        isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${isNight ? 'text-zinc-200' : 'text-slate-800'}`}>Weekly Consistency Trend</span>
        <span className={`text-[11px] ${isNight ? 'text-zinc-400' : 'text-slate-500'}`}>Target Line: 70 pts</span>
      </div>

      <div className="h-36 w-full flex items-end justify-between gap-2 pt-4 px-1 pb-1 relative">
        {/* 70% Target Benchmark Line */}
        <div
          className="absolute left-0 right-0 border-b border-dashed border-amber-500/40 pointer-events-none z-10 flex items-center justify-end"
          style={{ bottom: '70%' }}
        >
          <span className={`text-[9px] font-bold px-1 rounded -translate-y-2 ${
            isNight ? 'bg-zinc-900 text-amber-400' : 'bg-amber-100 text-amber-800'
          }`}>
            70 pts
          </span>
        </div>

        {recentDays.map((day) => {
          const heightPercent = Math.min(100, Math.max(8, day.score));
          const isTargetMet = day.score >= 70;
          const shortDate = day.date.slice(5); // MM-DD

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Score tooltip on hover */}
              <span className={`text-[10px] font-bold mb-1 opacity-80 group-hover:opacity-100 transition-opacity tabular-nums ${
                isNight ? 'text-zinc-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
              }`}>
                {day.score}
              </span>

              {/* Bar */}
              <div className={`w-full max-w-[28px] rounded-t-lg overflow-hidden flex flex-col justify-end h-full ${
                isNight ? 'bg-zinc-800' : 'bg-slate-100'
              }`}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                    isTargetMet
                      ? 'bg-gradient-to-t from-[#8B5CF6] to-[#38BDF8]'
                      : 'bg-gradient-to-t from-rose-600 to-rose-400'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Day Label */}
              <span className="text-[10px] font-medium text-zinc-500 mt-1.5 font-mono">
                {shortDate}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
