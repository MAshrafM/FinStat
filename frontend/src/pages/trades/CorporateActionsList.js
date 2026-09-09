// frontend/src/pages/trades/CorporateActionsList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, RefreshCw, Layers } from 'lucide-react';
import { getCorporateActions, deleteCorporateAction } from '../../services/corporateActionService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import '../../components/Table.css';
import '../trades/Trades.css';
import './CorporateActionsList.css';

const CorporateActionsList = () => {
  const { addToast } = useToast();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

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

  const handleDeleteClick = (action) => {
    setSelectedAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
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
            className="btn btn-secondary ca-btn ca-btn-secondary"
            title="Refresh action list"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <Link
            to="/corporate-actions/wizard"
            className="btn btn-primary ca-btn ca-btn-primary"
            title="Launch Action Wizard"
          >
            <Plus size={16} /> Launch Action Wizard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="ca-loading-state">
          <div className="ca-loading-spinner" />
          <span>Loading corporate actions...</span>
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
          <Link to="/corporate-actions/wizard" className="btn btn-primary ca-btn ca-btn-primary ca-btn-lg">
            <Plus size={18} /> Apply First Corporate Action
          </Link>
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: '20px' }}>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Broker</th>
                <th>Action Type</th>
                <th>Ratio</th>
                <th>Effective Date</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((act) => (
                <tr key={act._id}>
                  <td data-label="Stock" style={{ fontWeight: 'bold' }}>
                    {act.stockCode}
                  </td>
                  <td data-label="Broker">{act.broker}</td>
                  <td data-label="Type">
                    <span className={`ca-badge ${act.type === 'split' ? 'ca-badge-split' : 'ca-badge-bonus'}`}>
                      {act.type === 'split' ? 'Stock Split' : 'Bonus Issue'}
                    </span>
                  </td>
                  <td data-label="Ratio" style={{ fontWeight: 'bold' }}>
                    {act.type === 'split' ? `${act.ratio}:1` : `${(act.ratio * 100).toFixed(1)}%`}
                  </td>
                  <td data-label="Effective Date">{formatDate(act.effectiveDate)}</td>
                  <td data-label="Notes" style={{ color: '#64748b', maxWidth: '240px' }}>
                    {act.notes || '-'}
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(act)}
                      className="ca-btn-table-delete"
                      title="Remove corporate action"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAction && (
        <div className="ca-modal-overlay">
          <div className="ca-modal-card">
            <h3>Remove Corporate Action?</h3>
            <p>
              Are you sure you want to remove the <strong>{selectedAction.type === 'split' ? 'Stock Split' : 'Bonus Issue'}</strong> on <strong>{selectedAction.stockCode}</strong>? This will immediately revert the on-the-fly adjusted shares and average price for your portfolio.
            </p>
            <div className="ca-modal-actions">
              <button
                type="button"
                className="btn btn-secondary ca-btn ca-btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger ca-btn ca-btn-danger"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateActionsList;
