import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/common/ToastContainer';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'error', duration = 4500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  if (typeof window !== 'undefined') {
    window.__showToast = showToast;
  }

  React.useEffect(() => {
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
      };
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, addToast: showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
