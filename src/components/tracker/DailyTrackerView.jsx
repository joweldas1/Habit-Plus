import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskTimelineCard } from '../dashboard/TaskTimelineCard';
import { CoverageBar } from '../routine/CoverageBar';
import { CalendarPlus, Layers } from 'lucide-react';

export const DailyTrackerView = () => {
  const { dailyTasks, routine, setActiveTab, t, settings } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'running' | 'upcoming' | 'done' | 'missed'
  const isNight = settings.theme === 'night';

  const runningCount = dailyTasks.filter(
    (t) => t.status === 'active' || t.status === 'awaiting_done'
  ).length;
  const upcomingCount = dailyTasks.filter((t) => t.status === 'upcoming').length;
  const doneCount = dailyTasks.filter((t) => t.status === 'done').length;
  const missedCount = dailyTasks.filter((t) => t.status === 'missed').length;

  const filteredTasks = dailyTasks.filter((task) => {
    if (filter === 'running') return task.status === 'active' || task.status === 'awaiting_done';
    if (filter === 'upcoming') return task.status === 'upcoming';
    if (filter === 'done') return task.status === 'done';
    if (filter === 'missed') return task.status === 'missed';
    return true;
  });

  const filterOptions = [
    { id: 'all', label: 'All', count: dailyTasks.length },
    { id: 'running', label: 'Running', count: runningCount },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'done', label: 'Done', count: doneCount },
    { id: 'missed', label: 'Missed', count: missedCount },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-violet-500/15 text-violet-400">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
              {t.trackerTitle || "Today's Habit Tracker"}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 pl-0.5">
            {t.trackerSub || "24-hour timeline, live focus countdowns, and completion logging."}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            {dailyTasks.length} {dailyTasks.length === 1 ? 'Habit' : 'Habits'} Today
          </span>
          {doneCount > 0 && (
            <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {doneCount} Completed
            </span>
          )}
        </div>
      </div>

      {/* 24-Hour Coverage Bar for today */}
      <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
        isNight ? 'bg-[#141418] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <CoverageBar tasks={dailyTasks.length > 0 ? dailyTasks : routine} />
      </div>

      {/* Interactive Filter Pills */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterOptions.map((opt) => {
            const isSelected = filter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                  isSelected
                    ? isNight
                      ? 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-400/30'
                      : 'bg-violet-600 text-white shadow-sm'
                    : isNight
                    ? 'bg-[#141418] border border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isNight
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setActiveTab('routine')}
          className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center space-x-1 shrink-0"
        >
          <span>Edit Routine ➔</span>
        </button>
      </div>

      {/* Filtered Timeline List */}
      {dailyTasks.length === 0 ? (
        <div
          className={`p-8 md:p-12 text-center rounded-2xl border border-dashed space-y-3 ${
            isNight ? 'border-zinc-800 bg-[#141418]/50' : 'border-slate-300 bg-white'
          }`}
        >
          <p className="text-xs sm:text-sm text-zinc-400">
            {t.noTasksToday}
          </p>
          <button
            onClick={() => setActiveTab('routine')}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors ${
              isNight
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Go to Routine Planner</span>
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          className={`p-8 text-center rounded-2xl border border-dashed text-xs sm:text-sm text-zinc-400 ${
            isNight ? 'border-zinc-800 bg-[#141418]/30' : 'border-slate-300 bg-white'
          }`}
        >
          No tasks found under the "{filter}" filter.
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3.5">
          {filteredTasks.map((task) => (
            <TaskTimelineCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
