import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const recentMessagesRef = useRef(new Map());

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    if (!message) return;

    const trimmedMsg = message.trim();
    const now = Date.now();

    // Check if the same message was triggered within the last 1500ms
    const lastShown = recentMessagesRef.current.get(trimmedMsg);
    if (lastShown && now - lastShown < 1500) {
      return; // Debounce rapid identical toasts
    }
    recentMessagesRef.current.set(trimmedMsg, now);

    // Clean up recent messages map periodically
    if (recentMessagesRef.current.size > 20) {
      for (const [msg, time] of recentMessagesRef.current.entries()) {
        if (now - time > 5000) {
          recentMessagesRef.current.delete(msg);
        }
      }
    }

    const id = `${now}_${Math.random().toString(36).substring(2, 6)}`;

    setToasts((prev) => {
      // Never display a duplicate toast if the exact message is already visible
      if (prev.some((t) => t.message === trimmedMsg)) {
        return prev;
      }
      // Cap at 3 visible toasts to prevent vertical stacking clutter
      const trimmedList = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [...trimmedList, { id, message: trimmedMsg, type }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
