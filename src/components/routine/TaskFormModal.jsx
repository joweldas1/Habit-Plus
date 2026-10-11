import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  timeToMinutes,
  crossesMidnight,
  checkOverlap,
} from '../../utils/timeUtils';

const CATEGORIES = [
  'English',
  'Fitness',
  'Work',
  'Personal',
  'Rest',
  'Growth',
  'Custom',
];

export const TaskFormModal = ({ isOpen, onClose, editingTask = null, onSave }) => {
  const { t, routine, settings } = useApp();
  const { showToast } = useToast();
  const isNight = settings.theme === 'night';

  const [title, setTitle] = useState('');
  const [type, setType] = useState('do');
  const [category, setCategory] = useState('Work');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setType(editingTask.type || 'do');
      setCategory(editingTask.category || 'Work');
      setStartTime(editingTask.startTime || '09:00');
      setEndTime(editingTask.endTime || '10:00');
    } else {
      setTitle('');
      setType('do');
      setCategory('Work');
      setStartTime('09:00');
      setEndTime('10:00');
    }
  }, [editingTask, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast(t.errTitleRequired, 'error');
      return;
    }

    const startM = timeToMinutes(startTime);
    const endM = timeToMinutes(endTime);

    if (endM <= startM) {
      showToast(t.errEndTimeBeforeStart, 'error');
      return;
    }

    if (crossesMidnight(startTime, endTime)) {
      showToast(t.errMidnightCross, 'error');
      return;
    }

    // Overlap validation
    const otherTasks = editingTask
      ? routine.filter((r) => r.id !== editingTask.id)
      : routine;

    const hasOverlap = otherTasks.some((other) =>
      checkOverlap(startTime, endTime, other.startTime, other.endTime)
    );

    if (hasOverlap) {
      showToast(t.errTimeOverlap, 'error');
      return;
    }

    const taskData = {
      id: editingTask ? editingTask.id : `routine_${Date.now()}`,
      title: title.trim(),
      type,
      category,
      startTime,
      endTime,
      points: editingTask ? editingTask.points : 10,
    };

    onSave(taskData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? t.editTask : t.addTask}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Title */}
        <div className="space-y-1">
          <label className={`font-semibold block ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>{t.taskTitle}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. English speaking drill"
            className={`w-full px-3.5 py-2.5 rounded-xl border transition-colors focus:outline-none ${
              isNight
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-violet-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-600 focus:bg-white'
            }`}
          />
        </div>

        {/* Task Type (Do vs Avoid) */}
        <div className="space-y-1">
          <label className={`font-semibold block ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>{t.taskType}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('do')}
              className={`py-2 px-3 rounded-xl font-medium border text-center transition-all ${
                type === 'do'
                  ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                  : isNight
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {t.typeDo}
            </button>
            <button
              type="button"
              onClick={() => setType('avoid')}
              className={`py-2 px-3 rounded-xl font-medium border text-center transition-all ${
                type === 'avoid'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : isNight
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {t.typeAvoid}
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className={`font-semibold block ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>{t.category}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border transition-colors focus:outline-none ${
              isNight
                ? 'bg-zinc-900 border-zinc-700 text-white focus:border-violet-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-600 focus:bg-white'
            }`}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t[`cat${cat}`] || cat}
              </option>
            ))}
          </select>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={`font-semibold block ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>{t.startTime}</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border transition-colors focus:outline-none ${
                isNight
                  ? 'bg-zinc-900 border-zinc-700 text-white focus:border-violet-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-600 focus:bg-white'
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className={`font-semibold block ${isNight ? 'text-zinc-300' : 'text-slate-700'}`}>{t.endTime}</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border transition-colors focus:outline-none ${
                isNight
                  ? 'bg-zinc-900 border-zinc-700 text-white focus:border-violet-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-600 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
              isNight
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className={`flex-1 py-3 px-4 rounded-xl font-semibold shadow-sm transition-colors ${
              isNight
                ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-purple-950/40'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-300/40'
            }`}
          >
            {t.saveTask}
          </button>
        </div>
      </form>
    </Modal>
  );
};
