import React from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon toast-icon-success" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon toast-icon-warning" size={20} />;
      case 'info':
        return <Info className="toast-icon toast-icon-info" size={20} />;
      case 'error':
      default:
        return <AlertCircle className="toast-icon toast-icon-error" size={20} />;
    }
  };

  const content = (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type || 'error'}`}
          role="alert"
        >
          <div className="toast-content">
            {getIcon(toast.type)}
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            className="toast-close-btn"
            onClick={() => onDismiss(toast.id)}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return ReactDOM.createPortal(content, document.body);
  }

  return content;
};

export default ToastContainer;

