import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col space-y-2 w-[90%] max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let bgStyle = 'bg-[#18181B] border-[#27272A] text-[#F4F4F5]';
        let icon = <Info className="w-5 h-5 text-[#38BDF8] shrink-0" />;

        if (toast.type === 'success') {
          bgStyle = 'bg-[#064E3B]/90 border-[#059669] text-[#ECFDF5]';
          icon = <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />;
        } else if (toast.type === 'error') {
          bgStyle = 'bg-[#4C0519]/90 border-[#E11D48] text-[#FFF1F2]';
          icon = <AlertCircle className="w-5 h-5 text-[#F43F5E] shrink-0" />;
        } else if (toast.type === 'warning') {
          bgStyle = 'bg-[#451A03]/90 border-[#D97706] text-[#FFFBEB]';
          icon = <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${bgStyle}`}
          >
            <div className="flex items-center space-x-3 mr-2">
              {icon}
              <p className="text-xs sm:text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
