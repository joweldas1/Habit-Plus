import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { CoverageBar } from './CoverageBar';
import { TaskFormModal } from './TaskFormModal';
import { formatTimeRange12h, timeToMinutes } from '../../utils/timeUtils';
import {
  Plus,
  Sparkles,
  RotateCcw,
  Trash2,
  Edit2,
  Clock,
  Layers,
  Loader2,
} from 'lucide-react';

export const RoutineManager = () => {
  const {
    routine,
    setRoutine,
    dailyTasks,
    loadSuggestedRoutine,
    clearRoutine,
    triggerPointRedistribution,
    isAiLoading,
    settings,
    t,
  } = useApp();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const isNight = settings.theme === 'night';

  const handleOpenAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    const todayMatch = dailyTasks.find((d) => d.routineId === task.id);
    if (todayMatch && (todayMatch.status === 'done' || todayMatch.status === 'missed')) {
      showToast('Completed or missed instances for today are locked. Edit will apply to upcoming/tomorrow.', 'info');
    }
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (taskId) => {
    if (window.confirm(t.confirmDelete)) {
      const updated = routine.filter((r) => r.id !== taskId);
      setRoutine(updated);
      triggerPointRedistribution(updated);
      showToast('Task removed and 100 marks redistributed.', 'info');
    }
  };

  const handleSaveTask = async (taskData) => {
    let updated;
    if (editingTask) {
      updated = routine.map((r) => (r.id === taskData.id ? taskData : r));
    } else {
      updated = [...routine, taskData];
    }

    updated.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    await setRoutine(updated);
    await triggerPointRedistribution(updated);
  };

  const sortedRoutine = [...routine].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  return (
    <div className="animate-in fade-in duration-300">
      {/* Responsive Grid: 1 col on mobile, 12 cols on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* Left Column (Sticky Control Sidebar on Tablet/Laptop/PC): Planner Actions & Coverage */}
        <div className="md:col-span-5 lg:col-span-4 space-y-4 md:sticky md:top-0">
          <div className="space-y-1">
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{t.routinePlanner}</h2>
            <p className="text-xs text-zinc-400">{t.routineSub}</p>
          </div>

          {/* Action Button Strip */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleOpenAdd}
              className={`h-11 sm:h-12 flex items-center justify-center space-x-1.5 px-3 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 shadow-sm ${
                isNight
                  ? 'bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/40 shadow-purple-950/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-slate-300/40'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.addTask}</span>
            </button>

            <button
              onClick={() => triggerPointRedistribution()}
              disabled={isAiLoading || routine.length === 0}
              className={`h-11 sm:h-12 flex items-center justify-center space-x-1.5 px-3 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 disabled:opacity-50 border shadow-sm ${
                isNight
                  ? 'bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 border-violet-500/30 hover:border-violet-400/50'
                  : 'bg-violet-50 hover:bg-violet-100 text-violet-800 border-violet-200 hover:border-violet-300'
              }`}
            >
              {isAiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-violet-400" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 text-violet-400" />
              )}
              <span className="truncate">{isAiLoading ? t.calculatingPoints : t.redistributePoints}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 pt-0.5">
            <button
              onClick={loadSuggestedRoutine}
              className={`flex-1 h-9 px-3 rounded-xl text-[11px] font-medium border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isNight
                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.useSuggested}</span>
            </button>

            <button
              onClick={clearRoutine}
              className={`h-9 px-3 rounded-xl text-[11px] font-medium border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isNight
                  ? 'bg-rose-950/20 border-rose-900/30 text-rose-400 hover:bg-rose-950/40'
                  : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.clearRoutine}</span>
            </button>
          </div>

          {/* 24-hr Coverage Visualizer */}
          <CoverageBar tasks={routine} />
        </div>

        {/* Right Column: Routine Habit Blocks List */}
        <div className="md:col-span-7 lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Template Habit Blocks ({routine.length})
            </span>
            <span>100 Marks Total</span>
          </div>

          {sortedRoutine.length === 0 ? (
            <div className="p-8 md:p-12 text-center rounded-2xl border border-dashed border-zinc-800 space-y-3">
              <p className="text-xs sm:text-sm text-zinc-400">{t.emptyRoutine}</p>
              <button
                onClick={loadSuggestedRoutine}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#8B5CF6] text-white"
              >
                {t.useSuggested}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedRoutine.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.005] ${
                    isNight ? 'bg-[#141418] border-[#27272A] hover:border-zinc-700' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-semibold text-zinc-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        {formatTimeRange12h(task.startTime, task.endTime)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {task.category}
                      </span>
                      {task.type === 'avoid' && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Avoid
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <h4 className="text-sm font-semibold tracking-tight">{task.title}</h4>
                      <span className="text-xs font-bold text-[#8B5CF6]">
                        +{task.points || 0} pts
                      </span>
                    </div>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className={`p-2 rounded-xl transition-colors ${
                        isNight
                          ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Edit Habit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className={`p-2 rounded-xl transition-colors ${
                        isNight
                          ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30'
                          : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                      }`}
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTask={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
};
