// frontend/src/pages/trades/CorporateActionsList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, RefreshCw, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { getCorporateActions, deleteCorporateAction } from '../../services/corporateActionService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import './CorporateActionsList.css';

const CorporateActionsList = () => {
  const canModifyHook = useCanModify();
  const canModify = typeof canModifyHook === 'boolean' ? canModifyHook : (canModifyHook?.canModify ?? true);
  const { addToast } = useToast();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [expandedCardIds, setExpandedCardIds] = useState(new Set());

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCorporateActions({ limit: 100 });
      setActions(res?.data?.data || res?.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load corporate actions', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Handle Escape key to close delete modal
  useEffect(() => {
    if (!showConfirmModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && deletingId === null) {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmModal, deletingId]);

  const handleDeleteClick = (action) => {
    if (!canModify) return;
    setSelectedAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!canModify) return;
    if (!selectedAction) return;
    try {
      setDeletingId(selectedAction._id);
      await deleteCorporateAction(selectedAction._id);
      addToast('Corporate action removed. Portfolio cache invalidated.', 'success');
      setShowConfirmModal(false);
      setSelectedAction(null);
      fetchActions();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete corporate action', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleCardExpand = (id) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="page-container ca-page-container">
      <div className="ca-header">
        <div className="ca-header-title-group">
          <h1>Corporate Actions Registry</h1>
          <p>
            Historical splits and bonus share events applied dynamically to your portfolio.
          </p>
        </div>
        <div className="ca-header-actions">
          <button
            type="button"
            onClick={fetchActions}
            className="ca-btn ca-btn-secondary"
            title="Refresh action list"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <ProtectedAction tooltip="View-only access">
            <Link
              to="/corporate-actions/wizard"
              className="ca-btn ca-btn-primary"
              title="Launch Action Wizard"
            >
              <Plus size={16} /> Launch Action Wizard
            </Link>
          </ProtectedAction>
        </div>
      </div>

      {loading ? (
        <div className="ca-loading-wrap">
          <Loading variant="table" text="Loading corporate actions..." rows={4} />
        </div>
      ) : actions.length === 0 ? (
        <div className="ca-empty-card">
          <div className="ca-empty-icon-wrap">
            <Layers size={36} />
          </div>
          <h3>No Corporate Actions Registered</h3>
          <p>
            Record stock splits and bonus distributions to automatically adjust share quantities and prices for pre-event trades.
          </p>
          <ProtectedAction tooltip="View-only access">
            <Link to="/corporate-actions/wizard" className="ca-btn ca-btn-primary ca-btn-lg">
              <Plus size={18} /> Apply First Corporate Action
            </Link>
          </ProtectedAction>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table */}
          <div className="ca-table-wrap">
            <table className="ca-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Broker</th>
                  <th>Action Type</th>
                  <th>Ratio</th>
                  <th>Effective Date</th>
                  <th>Notes</th>
                  <th className="ca-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act._id}>
                    <td className="ca-cell-stock" data-label="Stock">
                      {act.stockCode}
                    </td>
                    <td data-label="Broker">{act.broker}</td>
                    <td data-label="Type">
                      <span className={`ca-badge ${act.type === 'split' ? 'ca-badge-split' : 'ca-badge-bonus'}`}>
                        {act.type === 'split' ? 'Stock Split' : 'Bonus Issue'}
                      </span>
                    </td>
                    <td className="ca-cell-ratio" data-label="Ratio">
                      {act.type === 'split' ? `${act.ratio}:1` : `${(act.ratio * 100).toFixed(1)}%`}
                    </td>
                    <td data-label="Effective Date">{formatDate(act.effectiveDate)}</td>
                    <td className="ca-cell-notes" data-label="Notes">
                      {act.notes || '-'}
                    </td>
                    <td className="ca-cell-actions" data-label="Actions">
                      <ProtectedAction tooltip="View-only access">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(act)}
                          className="ca-btn-table-delete"
                          title="Remove corporate action"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </ProtectedAction>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (<= 768px per D19) */}
          <div className="ca-mobile-card-list">
            {actions.map((act) => {
              const isExpanded = expandedCardIds.has(act._id);
              return (
                <div key={act._id} className="ca-mobile-card">
                  <div className="ca-card-compact-row">
                    <div className="ca-card-primary-fields">
                      <span className="ca-card-stock">{act.stockCode}</span>
                      <span className={`ca-badge ${act.type === 'split' ? 'ca-badge-split' : 'ca-badge-bonus'}`}>
                        {act.type === 'split' ? 'Stock Split' : 'Bonus Issue'}
                      </span>
                      <span className="ca-card-ratio">
                        {act.type === 'split' ? `${act.ratio}:1` : `${(act.ratio * 100).toFixed(1)}%`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="ca-card-expander-btn"
                      onClick={() => toggleCardExpand(act._id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Collapse corporate action details' : 'Expand corporate action details'}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="ca-card-expanded-content">
                      <div className="ca-card-detail-item">
                        <span className="ca-card-detail-label">Broker</span>
                        <span className="ca-card-detail-val">{act.broker}</span>
                      </div>
                      <div className="ca-card-detail-item">
                        <span className="ca-card-detail-label">Effective Date</span>
                        <span className="ca-card-detail-val">{formatDate(act.effectiveDate)}</span>
                      </div>
                      <div className="ca-card-detail-item">
                        <span className="ca-card-detail-label">Notes</span>
                        <span className="ca-card-detail-val">{act.notes || '-'}</span>
                      </div>
                      <div className="ca-card-actions">
                        <ProtectedAction tooltip="View-only access">
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(act)}
                            className="ca-btn-table-delete ca-btn-mobile-delete"
                            title="Remove corporate action"
                          >
                            <Trash2 size={14} /> Remove Corporate Action
                          </button>
                        </ProtectedAction>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAction && (
        <div
          className="ca-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ca-delete-dialog-title"
          aria-describedby="ca-delete-dialog-desc"
        >
          <div className="ca-modal-card">
            <h3 id="ca-delete-dialog-title">Remove Corporate Action?</h3>
            <p id="ca-delete-dialog-desc">
              Are you sure you want to remove the <strong>{selectedAction.type === 'split' ? 'Stock Split' : 'Bonus Issue'}</strong> on <strong>{selectedAction.stockCode}</strong>? This will immediately revert the on-the-fly adjusted shares and average price for your portfolio.
            </p>
            <div className="ca-modal-actions">
              <button
                type="button"
                className="ca-btn ca-btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <ProtectedAction tooltip="View-only access">
                <button
                  type="button"
                  className="ca-btn ca-btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={deletingId !== null}
                >
                  {deletingId ? 'Removing...' : 'Confirm Remove'}
                </button>
              </ProtectedAction>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateActionsList;
