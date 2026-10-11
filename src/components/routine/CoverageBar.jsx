import React from 'react';
import { calculateCoverage, formatTimeRange12h } from '../../utils/timeUtils';
import { useApp } from '../../context/AppContext';
import { PieChart, AlertCircle } from 'lucide-react';

export const CoverageBar = ({ tasks }) => {
  const { t, settings } = useApp();
  const isNight = settings.theme === 'night';
  const { coveredHours, percentage, gaps } = calculateCoverage(tasks);

  return (
    <div
      className={`w-full rounded-2xl border p-4 space-y-3 transition-all duration-300 ${
        isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold flex items-center gap-1.5 ${isNight ? 'text-zinc-200' : 'text-slate-800'}`}>
          <PieChart className="w-4 h-4 text-[#8B5CF6]" />
          {t.coverageTitle}
        </span>
        <span className={`font-bold font-mono ${isNight ? 'text-[#38BDF8]' : 'text-sky-600'}`}>
          {coveredHours} / 24 hrs ({percentage}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full rounded-full h-2.5 overflow-hidden ${isNight ? 'bg-zinc-800/80' : 'bg-slate-100 border border-slate-200'}`}>
        <div
          className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#38BDF8] to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Gaps Notice with Perfect Vertical & Horizontal Alignment */}
      {gaps.length > 0 && percentage < 100 && (
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[11px] sm:text-xs transition-all ${
            isNight
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              : 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-2xs'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap leading-tight">
            <span className="font-semibold shrink-0">{t.gapsFound}:</span>
            <span className={isNight ? 'text-zinc-300' : 'text-slate-700'}>
              {gaps.map((g) => formatTimeRange12h(g.start, g.end)).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
