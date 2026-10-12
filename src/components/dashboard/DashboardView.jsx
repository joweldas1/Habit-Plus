import React from 'react';
import { useApp } from '../../context/AppContext';
import { LiveClock } from './LiveClock';
import { MetricsSummary } from './MetricsSummary';
import { LiveFocusSpotlight } from './LiveFocusSpotlight';
import { TaskTimelineCard } from './TaskTimelineCard';
import {
  Layers,
  ArrowRight,
  CalendarPlus,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const DashboardView = () => {
  const { dailyTasks, setActiveTab, t, settings } = useApp();
  const isNight = settings.theme === 'night';

  // Next 2 upcoming tasks for a clean, non-cluttered preview
  const upcomingTasks = dailyTasks
    .filter((task) => task.status === 'upcoming')
    .slice(0, 2);

  return (
    <div className="max-w-2xl lg:max-w-3xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 py-1 sm:py-2 animate-in fade-in duration-300">
      {/* 1. Live Time & Date Atmosphere */}
      <LiveClock />

      {/* 2. Razor-Sharp Centerpiece: Live Focus Spotlight */}
      {dailyTasks.length > 0 ? (
        <LiveFocusSpotlight />
      ) : (
        <div
          className={`p-6 sm:p-8 text-center rounded-2xl border border-dashed space-y-3 ${
            isNight ? 'border-zinc-800 bg-[#141418]/60' : 'border-slate-300 bg-white'
          }`}
        >
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 w-fit mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight">No Habits Scheduled Today</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {t.noTasksToday || 'Head to Routine tab to set up your master daily routine or generate one with AI!'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('routine')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
              isNight
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Open Routine Planner</span>
          </button>
        </div>
      )}

      {/* 3. Daily Momentum & Gauges */}
      <MetricsSummary />

      {/* 4. One-Click Gateway to Full 24-Hour Timeline Tracker */}
      {dailyTasks.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex items-center justify-between group active:scale-98 cursor-pointer ${
              isNight
                ? 'bg-gradient-to-r from-violet-950/30 via-[#16161D] to-violet-950/20 border-violet-500/25 hover:border-violet-500/50 hover:bg-violet-950/40'
                : 'bg-gradient-to-r from-violet-50 via-white to-sky-50 border-violet-200/90 hover:border-violet-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-violet-500/15 text-violet-400 shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="text-xs sm:text-sm font-bold tracking-tight truncate">
                  {t.viewFullTracker || "View Full 24-Hour Timeline Tracker"}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                  {dailyTasks.length} {dailyTasks.length === 1 ? 'habit scheduled' : 'habits scheduled'} • Detailed breakdown & filters
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-semibold text-violet-400 group-hover:translate-x-1 transition-transform shrink-0 pl-2">
              <span className="hidden sm:inline">Open Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Clean Up-Next Preview (Max 2 items for zero clutter) */}
          {upcomingTasks.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>Up Next on Today's Schedule</span>
                </span>
                <button
                  onClick={() => setActiveTab('tracker')}
                  className="text-[10.5px] sm:text-[11px] font-medium text-violet-400 hover:text-violet-300 flex items-center gap-0.5"
                >
                  <span>See all ({dailyTasks.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <TaskTimelineCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
