import React from 'react';
import { useApp } from '../../context/AppContext';
import { LiveClock } from './LiveClock';
import { MetricsSummary } from './MetricsSummary';
import { TaskTimelineCard } from './TaskTimelineCard';
import { LiveFocusSpotlight } from './LiveFocusSpotlight';
import { CoverageBar } from '../routine/CoverageBar';
import { InstallBanner } from '../common/InstallBanner';
import { ListFilter, CalendarPlus } from 'lucide-react';

export const DashboardView = () => {
  const { dailyTasks, routine, setActiveTab, t, isStandalone, settings } = useApp();
  const isNight = settings.theme === 'night';

  return (
    <div className="animate-in fade-in duration-300">
      {/* Responsive Grid: 1 col on mobile, 12 cols on md+ tablet/desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-6 items-start">
        {/* Left Column (Sticky Sidebar on Tablet/Laptop/PC): Live Clock, Gauges & 24h Coverage */}
        <div className="md:col-span-5 lg:col-span-4 space-y-3 sm:space-y-4 md:sticky md:top-0">
          {!isStandalone && <InstallBanner />}
          <LiveClock />
          <MetricsSummary />
          {/* 24-Hour Coverage Meter on Dashboard */}
          <CoverageBar tasks={dailyTasks.length > 0 ? dailyTasks : routine} />
        </div>

        {/* Right Column: Live Focus Spotlight & 24-Hour Timeline */}
        <div className="md:col-span-7 lg:col-span-8 space-y-3 sm:space-y-4">
          {/* Live Focus Spotlight */}
          {dailyTasks.length > 0 && <LiveFocusSpotlight />}

          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <ListFilter className="w-3.5 h-3.5 text-violet-400" />
              <span>Today's 24-Hour Timeline</span>
            </div>
            <span className="text-[11px] font-medium text-zinc-500 font-mono">
              {dailyTasks.length} Scheduled
            </span>
          </div>

          {dailyTasks.length === 0 ? (
            <div className={`p-8 md:p-12 text-center rounded-2xl border border-dashed space-y-3 ${
              isNight ? 'border-zinc-800' : 'border-slate-300 bg-white'
            }`}>
              <p className="text-xs sm:text-sm text-zinc-400">
                {t.noTasksToday}
              </p>
              <button
                onClick={() => setActiveTab('routine')}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors ${
                  isNight ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Go to Routine Planner</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {dailyTasks.map((task) => (
                <TaskTimelineCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
