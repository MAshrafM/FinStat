import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ToastContainer from '../components/common/ToastContainer';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'error', duration = 4500) => {
    if (!message) return;

    setToasts((prev) => {
      const existing = prev.find((t) => t.message === message && t.type === type);
      if (existing) {
        if (duration > 0) {
          const prevTimer = timersRef.current.get(existing.id);
          if (prevTimer) clearTimeout(prevTimer);
          timersRef.current.set(
            existing.id,
            setTimeout(() => removeToast(existing.id), duration)
          );
        }
        return prev;
      }

      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      if (duration > 0) {
        timersRef.current.set(
          id,
          setTimeout(() => removeToast(id), duration)
        );
      }
      return [...prev, { id, message, type, duration }];
    });
  }, [removeToast]);

  if (typeof window !== 'undefined') {
    window.__showToast = showToast;
  }

  React.useEffect(() => {
    const timers = timersRef.current;
    if (typeof window !== 'undefined') {
      window.__showToast = showToast;
    }

    const handleGlobalToast = (event) => {
      if (event.detail && event.detail.message) {
        showToast(event.detail.message, event.detail.type || 'error', event.detail.duration || 4500);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('app:toast', handleGlobalToast);
      return () => {
        window.removeEventListener('app:toast', handleGlobalToast);
        timers.forEach((timerId) => clearTimeout(timerId));
        timers.clear();
      };
    }
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, addToast: showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

const fallbackToast = {
  showToast: () => { },
  addToast: () => { },
  removeToast: () => { },
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return fallbackToast;
  }
  return context;
};
