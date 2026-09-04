// frontend/src/pages/admin/DeleteConfirmModal.js
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({
  isOpen,
  title = 'Delete Configuration',
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
      <div className="admin-modal-card admin-delete-dialog animate-slide-up">
        <div className="delete-dialog-header">
          <div className="delete-warning-icon-wrapper" aria-hidden="true">
            <AlertTriangle size={24} />
          </div>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="delete-dialog-body">
          <h3 id="delete-dialog-title" className="delete-dialog-title">
            {title}
          </h3>
          <p className="delete-dialog-message">
            {message || 'Are you sure you want to delete this configuration? This action cannot be undone.'}
          </p>
        </div>

        <div className="delete-dialog-footer">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn-danger"
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
