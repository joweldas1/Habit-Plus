import React from 'react';
import { Modal } from '../common/Modal';
import { formatTimeRange12h } from '../../utils/timeUtils';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, XCircle, Award } from 'lucide-react';

export const DayDetailModal = ({ isOpen, onClose, dayLog }) => {
  const { settings } = useApp();
  if (!dayLog) return null;

  const isNight = settings.theme === 'night';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Day Breakdown — ${dayLog.date}`}>
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Score & Target Summary Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            dayLog.targetMet
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : isNight
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${
              isNight ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-100 text-slate-700'
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[11px] font-medium uppercase tracking-wider block ${
                isNight ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                Final Score
              </span>
              <span className={`text-xl font-bold tracking-tight tabular-nums ${
                isNight ? 'text-white' : 'text-slate-900'
              }`}>
                {dayLog.score} / {dayLog.totalPossiblePoints || 100} pts
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                dayLog.targetMet
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {dayLog.targetMet ? 'Target Met ✓' : 'Below Target'}
            </span>
          </div>
        </div>

        {/* Task list for that day */}
        <div className="space-y-2 pt-1">
          <h4 className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">
            Disciplines Recorded ({dayLog.tasks?.length || 0})
          </h4>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {dayLog.tasks?.map((task, idx) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id || idx}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isNight
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-zinc-400 font-mono">
                        {formatTimeRange12h(task.startTime, task.endTime)}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {task.category}
                      </span>
                    </div>
                    <span className="font-medium text-xs text-white block">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="font-bold text-xs text-[#8B5CF6]">
                      +{task.points} pts
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
