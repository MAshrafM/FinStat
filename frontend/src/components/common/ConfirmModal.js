// frontend/src/components/common/ConfirmModal.js
import React, { useEffect, useRef } from 'react';
import './ConfirmModal.css';

/**
 * Accessible confirmation modal replacing window.confirm across the application.
 * [SIMP-009, GAP-010]
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility
 * @param {string} props.title - Modal heading
 * @param {React.ReactNode} props.message - Descriptive text or confirmation prompt
 * @param {string} [props.confirmText='Confirm'] - Label for confirmation button
 * @param {string} [props.cancelText='Cancel'] - Label for dismissal button
 * @param {'danger'|'default'|'primary'} [props.variant='danger'] - Visual style of confirm button
 * @param {boolean} [props.isLoading=false] - Disables buttons and displays busy state
 * @param {Function} props.onConfirm - Callback when confirmed
 * @param {Function} props.onCancel - Callback when canceled/closed
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const prevActiveElement = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus confirm button on open
    const focusTimeout = setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 10);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isLoading && onCancel) {
          e.preventDefault();
          onCancel();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimeout);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (prevActiveElement && typeof prevActiveElement.focus === 'function') {
        prevActiveElement.focus();
      }
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading && onCancel) {
      onCancel();
    }
  };

  const isDanger = variant === 'danger';

  return (
    <div
      className="confirm-modal-overlay"
      data-testid="confirm-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="confirm-modal-content"
        data-testid="confirm-modal-content"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
        </div>

        <div className="confirm-modal-body">
          <p id="confirm-modal-message" className="confirm-modal-message">
            {message}
          </p>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            ref={cancelBtnRef}
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            className={`confirm-modal-btn ${
              isDanger ? 'confirm-modal-btn-danger' : 'confirm-modal-btn-primary'
            }`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export { ConfirmModal };
export default ConfirmModal;

