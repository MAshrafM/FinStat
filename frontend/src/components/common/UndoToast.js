// frontend/src/components/common/UndoToast.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaUndo, FaTrashAlt } from 'react-icons/fa';
import './UndoToast.css';

/**
 * 10-Second Undo Banner for soft-deleted items [FEAT-006, GAP-004]
 * Displays floating notification with animated countdown and instant restore trigger.
 */
const UndoToast = ({
  isOpen,
  message = 'Item deleted',
  duration = 10,
  onUndo,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isUndoing, setIsUndoing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(duration);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(duration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (onDismiss) onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, duration, onDismiss]);

  if (!isOpen) return null;

  const handleUndoClick = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsUndoing(true);
    try {
      if (onUndo) await onUndo();
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      setIsUndoing(false);
      if (onDismiss) onDismiss();
    }
  };

  const handleDismissClick = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (onDismiss) onDismiss();
  };

  const progressPercent = Math.max(0, (timeLeft / duration) * 100);

  return (
    <div
      className="undo-toast-wrapper"
      role="alert"
      aria-live="assertive"
      data-testid="undo-toast"
    >
      <div className="undo-toast-body">
        <div className="undo-toast-message">
          <span className="undo-toast-icon">
            <FaTrashAlt aria-hidden="true" />
          </span>
          <span>
            {message} ({timeLeft}s)
          </span>
        </div>
        <div className="undo-toast-actions">
          <button
            type="button"
            className="btn-undo-action"
            onClick={handleUndoClick}
            disabled={isUndoing}
            data-testid="undo-button"
          >
            <FaUndo aria-hidden="true" /> {isUndoing ? 'Restoring...' : 'Undo'}
          </button>
          <button
            type="button"
            className="btn-undo-dismiss"
            onClick={handleDismissClick}
            aria-label="Dismiss notification"
            data-testid="undo-dismiss-button"
          >
            &times;
          </button>
        </div>
      </div>
      <div className="undo-toast-progress-track">
        <div
          className="undo-toast-progress-bar"
          style={{ width: `${progressPercent}%` }}
          data-testid="undo-progress-bar"
        />
      </div>
    </div>
  );
};

UndoToast.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string,
  duration: PropTypes.number,
  onUndo: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default UndoToast;
