// frontend/src/pages/admin/DeleteConfirmModal.js
import React, { useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useModalFocus } from './useModalFocus';

const DeleteConfirmModal = ({
  isOpen,
  title = 'Delete Configuration',
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const modalRef = useRef(null);

  useModalFocus(isOpen, loading ? null : onCancel, modalRef);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="modal-content admin-modal-card delete-dialog-card" ref={modalRef}>
        <div className="admin-modal-header">
          <div className="delete-dialog-header">
            <div className="delete-icon-circle" aria-hidden="true">
              <AlertTriangle size={20} />
            </div>
            <h3 id="delete-dialog-title" className="delete-dialog-title">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
            disabled={loading}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <p className="delete-dialog-message">
          {message || 'Are you sure you want to delete this configuration? This action cannot be undone.'}
        </p>

        <div className="delete-dialog-footer">
          <button
            type="button"
            className="fs-btn fs-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="fs-btn fs-btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
