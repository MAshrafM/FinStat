// frontend/src/pages/salary/PaycheckListPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit3, Trash2, Calendar, DollarSign, Receipt, Shield, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import ComponentTable from '../../components/salary/ComponentTable';
import { getPaychecksLog, deletePaycheck, getPaycheckById } from '../../services/paycheckService';
import { useToast } from '../../context/ToastContext';
import './PaycheckListPage.css';

const PaycheckListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [paychecks, setPaychecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedYear, setSelectedYear] = useState('');
  const [viewingPaycheck, setViewingPaycheck] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchPaychecks = async (currentPage = 1, year = selectedYear) => {
    try {
      setLoading(true);
      const res = await getPaychecksLog(currentPage, 12, year || undefined);
      if (res) {
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
        setPaychecks(list);
        setTotalPages(res.totalPages || res.data?.totalPages || 1);
        setPage(res.page || res.data?.page || 1);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch paychecks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaychecks(page, selectedYear);
  }, [page, selectedYear]);

  const handleOpenViewModal = async (paycheckId) => {
    try {
      const pc = await getPaycheckById(paycheckId);
      setViewingPaycheck(pc);
      setViewModalOpen(true);
    } catch (err) {
      addToast('Failed to load paycheck details', 'error');
    }
  };

  const handleDeletePaycheck = async (id) => {
    if (!window.confirm('Are you sure you want to delete this paycheck record?')) return;
    try {
      await deletePaycheck(id);
      addToast('Paycheck deleted successfully', 'success');
      fetchPaychecks(page, selectedYear);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete paycheck', 'error');
    }
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="content-container">
        <div className="paycheck-list-header">
          <div>
            <h1 className="list-title">Paycheck Ledger & Audit Log</h1>
            <p className="list-subtitle">History of monthly salary payslips, deductions, and tax audit records</p>
          </div>
          <button className="btn-log-paycheck" onClick={() => navigate('/salary/paychecks/new')}>
            <Plus size={18} />
            <span>Log New Paycheck</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="paycheck-filter-bar">
          <div className="filter-group">
            <label className="filter-label">Filter Year:</label>
            <input
              type="number"
              placeholder="e.g. 2025"
              className="year-filter-input"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="loading-state">Loading paychecks...</div>
        ) : paychecks.length === 0 ? (
          <div className="empty-state-card">
            <FileText size={48} className="empty-icon" />
            <h3>No Paychecks Found</h3>
            <p>You have not logged any paychecks for the selected criteria.</p>
            <button className="btn-log-paycheck mt-4" onClick={() => navigate('/salary/paychecks/new')}>
              <Plus size={18} /> Log First Paycheck
            </button>
          </div>
        ) : (
          <div className="paycheck-table-container">
            <table className="finstat-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Pay Date</th>
                  <th>Gross Salary</th>
                  <th>Tax Deducted</th>
                  <th>Insurance</th>
                  <th>Net Pay</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paychecks.map(pc => {
                  const gross = pc.grossSalary || pc.grossAmount || 0;
                  const net = pc.netPay !== undefined ? pc.netPay : (pc.amount || 0);
                  const tax = pc.taxDetails?.actualTax !== undefined ? pc.taxDetails.actualTax : (pc.taxDeduction || 0);
                  const ins = pc.insuranceDetails?.actualEmployeeShare !== undefined ? pc.insuranceDetails.actualEmployeeShare : (pc.insuranceDeduction || 0);

                  return (
                    <tr key={pc._id}>
                      <td>
                        <span className="period-badge">{pc.period || pc.month}</span>
                      </td>
                      <td>{pc.payDate ? new Date(pc.payDate).toLocaleDateString() : (pc.date ? new Date(pc.date).toLocaleDateString() : 'N/A')}</td>
                      <td className="font-semibold text-slate-200">{gross.toLocaleString()} EGP</td>
                      <td className="text-rose-400">{tax.toLocaleString()} EGP</td>
                      <td className="text-orange-400">{ins.toLocaleString()} EGP</td>
                      <td className="font-bold text-emerald-400">{net.toLocaleString()} EGP</td>
                      <td>
                        <div className="table-action-btns">
                          <button
                            className="action-btn view-btn"
                            title="View Full Breakdown"
                            onClick={() => handleOpenViewModal(pc._id)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="action-btn edit-btn"
                            title="Edit Paycheck"
                            onClick={() => navigate(`/salary/paychecks/edit/${pc._id}`)}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            title="Delete Paycheck"
                            onClick={() => handleDeletePaycheck(pc._id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button
                  className="page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: View Paycheck Details */}
        {viewModalOpen && viewingPaycheck && (
          <div className="modal-backdrop">
            <div className="modal-content-card max-w-4xl">
              <div className="modal-header">
                <div>
                  <h3 className="flex items-center gap-2">
                    Paycheck Breakdown — {viewingPaycheck.period || viewingPaycheck.month}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Pay Date: {viewingPaycheck.payDate ? new Date(viewingPaycheck.payDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <button className="close-modal-btn" onClick={() => setViewModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-paddings">
                {/* Summary Metrics */}
                <div className="audit-metrics-grid">
                  <div className="audit-card">
                    <span className="audit-label">Gross Salary</span>
                    <span className="audit-value font-bold text-slate-100">
                      {(viewingPaycheck.grossSalary || viewingPaycheck.grossAmount || 0).toLocaleString()} EGP
                    </span>
                  </div>

                  <div className="audit-card">
                    <div className="flex justify-between items-center">
                      <span className="audit-label">Income Tax</span>
                      {viewingPaycheck.taxDetails?.expectedTax !== undefined && (
                        <span className="audit-sub">Exp: {viewingPaycheck.taxDetails.expectedTax.toLocaleString()} EGP</span>
                      )}
                    </div>
                    <span className="audit-value font-bold text-rose-400">
                      {(viewingPaycheck.taxDetails?.actualTax !== undefined ? viewingPaycheck.taxDetails.actualTax : (viewingPaycheck.taxDeduction || 0)).toLocaleString()} EGP
                    </span>
                  </div>

                  <div className="audit-card">
                    <div className="flex justify-between items-center">
                      <span className="audit-label">Social Insurance</span>
                      {viewingPaycheck.insuranceDetails?.expectedEmployeeShare !== undefined && (
                        <span className="audit-sub">Exp: {viewingPaycheck.insuranceDetails.expectedEmployeeShare.toLocaleString()} EGP</span>
                      )}
                    </div>
                    <span className="audit-value font-bold text-orange-400">
                      {(viewingPaycheck.insuranceDetails?.actualEmployeeShare !== undefined ? viewingPaycheck.insuranceDetails.actualEmployeeShare : (viewingPaycheck.insuranceDeduction || 0)).toLocaleString()} EGP
                    </span>
                  </div>

                  <div className="audit-card highlight-emerald">
                    <span className="audit-label">Net Disbursed Pay</span>
                    <span className="audit-value font-bold text-emerald-400">
                      {(viewingPaycheck.netPay !== undefined ? viewingPaycheck.netPay : (viewingPaycheck.amount || 0)).toLocaleString()} EGP
                    </span>
                  </div>
                </div>

                {/* Component Breakdown Table */}
                <div className="mt-6">
                  <ComponentTable
                    components={viewingPaycheck.components || []}
                    onChange={() => {}}
                    readOnly={true}
                  />
                </div>

                {/* Notes */}
                {viewingPaycheck.notes && (
                  <div className="view-notes-box">
                    <span className="font-semibold text-slate-300">Notes:</span> {viewingPaycheck.notes}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setViewModalOpen(false);
                    navigate(`/salary/paychecks/edit/${viewingPaycheck._id}`);
                  }}
                >
                  Edit Paycheck
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaycheckListPage;
