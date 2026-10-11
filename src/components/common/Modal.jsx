import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  const { settings } = useApp();
  const isNight = settings.theme === 'night';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidth} rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 max-h-[90vh] flex flex-col ${
          isNight
            ? 'bg-[#141418] border-[#27272A] text-[#F4F4F5]'
            : 'bg-white border-slate-200 text-[#1E293B]'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isNight ? 'border-[#27272A] bg-[#141418]' : 'border-slate-100 bg-slate-50'
        }`}>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isNight ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
