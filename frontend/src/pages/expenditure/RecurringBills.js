// frontend/src/pages/expenditure/RecurringBills.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCalendarCheck, FaClock, FaPlus, FaMoneyBillWave, FaTrash, FaEdit, FaCheckCircle, FaPause, FaPlay } from 'react-icons/fa';
import {
  getRecurringBills,
  getUpcomingBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  payRecurringBill,
} from '../../services/recurringBillService';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Button, Badge, Loading, EmptyState } from '../../components/ui';
import './RecurringBills.css';
import './RulesPage.css'; // For modal styles

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const PAYMENT_METHODS = [
  { value: 'Bank', label: 'Bank Account' },
  { value: 'Cash', label: 'Cash Ledger' },
  { value: 'Prepaid', label: 'Prepaid Card' },
];

const INITIAL_FORM = {
  name: '',
  category: 'Utilities',
  amount: '',
  frequency: 'monthly',
  dueDay: 1,
  nextDueDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'Bank',
  reminderDaysBefore: 3,
  notes: '',
};

const RecurringBills = () => {
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [bills, setBills] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [upcomingTotal, setUpcomingTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm action states
  const [billToPay, setBillToPay] = useState(null);
  const [billToDelete, setBillToDelete] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const loadBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const [billsRes, upcomingRes] = await Promise.all([
        getRecurringBills(),
        getUpcomingBills({ days: 3 }),
      ]);
      setBills(billsRes?.bills || billsRes?.data || []);
      setUpcomingCount(upcomingRes?.upcomingCount || 0);
      setUpcomingTotal(upcomingRes?.totalDue || 0);
    } catch (err) {
      console.error('Failed to load bills:', err);
      if (notify) notify('Failed to load recurring bills', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // KPIs calculation
  const { monthlyTotal, activeCount } = useMemo(() => {
    let monthly = 0;
    let active = 0;
    bills.forEach((b) => {
      if (b.isActive) {
        active += 1;
        const amt = Number(b.amount) || 0;
        if (b.frequency === 'weekly') monthly += amt * 4.33;
        else if (b.frequency === 'monthly') monthly += amt;
        else if (b.frequency === 'quarterly') monthly += amt / 3;
        else if (b.frequency === 'yearly') monthly += amt / 12;
      }
    });
    return { monthlyTotal: Math.round(monthly), activeCount: active };
  }, [bills]);

  const openCreateModal = () => {
    setEditingBill(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (bill) => {
    setEditingBill(bill);
    setFormData({
      name: bill.name,
      category: bill.category || 'Utilities',
      amount: bill.amount,
      frequency: bill.frequency || 'monthly',
      dueDay: bill.dueDay || 1,
      nextDueDate: bill.nextDueDate ? new Date(bill.nextDueDate).toISOString().split('T')[0] : '',
      paymentMethod: bill.paymentMethod || 'Bank',
      reminderDaysBefore: bill.reminderDaysBefore ?? 3,
      notes: bill.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBill(null);
    setFormData(INITIAL_FORM);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' || name === 'dueDay' || name === 'reminderDaysBefore' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      if (notify) notify('Please provide a name and positive amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBill) {
        await updateRecurringBill(editingBill._id, formData);
        if (notify) notify('Recurring bill updated successfully', 'success');
      } else {
        await createRecurringBill(formData);
        if (notify) notify('Recurring bill created successfully', 'success');
      }
      closeModal();
      await loadBills();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      if (notify) notify(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (bill) => {
    try {
      await updateRecurringBill(bill._id, { isActive: !bill.isActive });
      if (notify) notify(`Bill ${bill.isActive ? 'paused' : 'activated'} successfully`, 'success');
      await loadBills();
    } catch (err) {
      if (notify) notify('Failed to toggle bill status', 'error');
    }
  };

  const handleConfirmPay = async () => {
    if (!billToPay) return;
    setIsProcessingAction(true);
    try {
      await payRecurringBill(billToPay._id, {
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: billToPay.paymentMethod,
      });
      if (notify) notify(`Bill "${billToPay.name}" paid and logged to expenditures`, 'success');
      setBillToPay(null);
      await loadBills();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment failed';
      if (notify) notify(msg, 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;
    setIsProcessingAction(true);
    try {
      await deleteRecurringBill(billToDelete._id);
      if (notify) notify(`Bill "${billToDelete.name}" deleted successfully`, 'success');
      setBillToDelete(null);
      await loadBills();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Deletion failed';
      if (notify) notify(msg, 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getBillStatus = (bill) => {
    if (!bill.isActive) {
      return { label: 'Paused', tone: 'neutral' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: 'Overdue', tone: 'negative' };
    }
    if (diffDays <= 3) {
      return { label: 'Due Soon', tone: 'warning' };
    }
    return { label: 'Active', tone: 'positive' };
  };

  return (
    <div className="fs-page recurring-bills-container" data-testid="recurring-bills-page">
      <PageHeader
        title="Recurring Bills & Schedules"
        subtitle="Track subscriptions, utilities, and scheduled payments with automatic due-date roll-forward."
        actions={
          <ProtectedAction>
            <Button
              variant="primary"
              onClick={openCreateModal}
              data-testid="add-bill-button"
            >
              <FaPlus aria-hidden="true" /> Add Recurring Bill
            </Button>
          </ProtectedAction>
        }
      />

      {/* KPI Cards */}
      <div className="recurring-bills-kpi-grid">
        <div className="recurring-kpi-card" data-testid="kpi-monthly-total">
          <div className="recurring-kpi-icon primary">
            <FaMoneyBillWave aria-hidden="true" />
          </div>
          <div className="recurring-kpi-content">
            <span className="recurring-kpi-label">Scheduled Monthly Total</span>
            <span className="recurring-kpi-value fs-num">{formatCurrency(monthlyTotal)}</span>
          </div>
        </div>

        <div className="recurring-kpi-card" data-testid="kpi-due-soon">
          <div className="recurring-kpi-icon warning">
            <FaClock aria-hidden="true" />
          </div>
          <div className="recurring-kpi-content">
            <span className="recurring-kpi-label">Due in Next 3 Days</span>
            <span className="recurring-kpi-value fs-num">
              {upcomingCount} ({formatCurrency(upcomingTotal)})
            </span>
          </div>
        </div>

        <div className="recurring-kpi-card" data-testid="kpi-active-count">
          <div className="recurring-kpi-icon success">
            <FaCalendarCheck aria-hidden="true" />
          </div>
          <div className="recurring-kpi-content">
            <span className="recurring-kpi-label">Active Schedules</span>
            <span className="recurring-kpi-value fs-num">{activeCount} bills</span>
          </div>
        </div>
      </div>

      {/* Bills Table Container */}
      <div className="table-container recurring-bills-table-wrapper fs-table-container">
        {isLoading ? (
          <Loading variant="table" message="Loading recurring bills..." />
        ) : bills.length === 0 ? (
          <div data-testid="empty-bills-state">
            <EmptyState
              icon={<FaCalendarCheck />}
              title="No recurring bills configured yet"
              description="Schedule your monthly rent, streaming subscriptions, and utilities to stay organized."
              action={
                <ProtectedAction>
                  <Button variant="primary" onClick={openCreateModal}>
                    <FaPlus aria-hidden="true" /> Add Recurring Bill
                  </Button>
                </ProtectedAction>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="recurring-bills-desktop-table">
              <table className="styled-table recurring-bills-table" data-testid="bills-table">
                <thead>
                  <tr>
                    <th scope="col">Bill Name</th>
                    <th scope="col">Category</th>
                    <th scope="col" className="cell-right">Amount</th>
                    <th scope="col">Frequency</th>
                    <th scope="col">Next Due Date</th>
                    <th scope="col">Account</th>
                    <th scope="col" className="cell-center">Status</th>
                    <th scope="col" className="cell-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => {
                    const status = getBillStatus(bill);
                    return (
                      <tr key={bill._id} data-testid={`bill-row-${bill._id}`}>
                        <td className="bill-name-cell">
                          <strong>{bill.name}</strong>
                          {bill.notes && <div className="bill-notes">{bill.notes}</div>}
                        </td>
                        <td>
                          <Badge tone="neutral">{bill.category}</Badge>
                        </td>
                        <td className="cell-right fs-num">{formatCurrency(bill.amount)}</td>
                        <td className="bill-frequency">{bill.frequency}</td>
                        <td className="fs-num">{bill.nextDueDate ? formatDate(bill.nextDueDate) : '-'}</td>
                        <td>{bill.paymentMethod}</td>
                        <td className="cell-center">
                          <Badge tone={status.tone} data-testid={`status-badge-${bill._id}`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="cell-center">
                          <div className="bill-actions">
                            <ProtectedAction>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setBillToPay(bill)}
                                title="Pay & Log Expense"
                                aria-label={`Pay ${bill.name}`}
                                data-testid={`pay-bill-${bill._id}`}
                              >
                                <FaCheckCircle aria-hidden="true" /> Pay
                              </Button>
                            </ProtectedAction>

                            <ProtectedAction>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleActive(bill)}
                                title={bill.isActive ? 'Pause Schedule' : 'Resume Schedule'}
                                aria-label={`${bill.isActive ? 'Pause' : 'Resume'} ${bill.name}`}
                                data-testid={`toggle-bill-${bill._id}`}
                              >
                                {bill.isActive ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
                              </Button>
                            </ProtectedAction>

                            <ProtectedAction>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditModal(bill)}
                                title="Edit Bill"
                                aria-label={`Edit ${bill.name}`}
                                data-testid={`edit-bill-${bill._id}`}
                              >
                                <FaEdit aria-hidden="true" />
                              </Button>
                            </ProtectedAction>

                            <ProtectedAction>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setBillToDelete(bill)}
                                title="Delete Schedule"
                                aria-label={`Delete ${bill.name}`}
                                data-testid={`delete-bill-${bill._id}`}
                              >
                                <FaTrash aria-hidden="true" />
                              </Button>
                            </ProtectedAction>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (D19) */}
            <div className="recurring-bills-mobile-cards">
              {bills.map((bill) => {
                const status = getBillStatus(bill);
                return (
                  <div key={bill._id} className="recurring-bill-mobile-card">
                    <div className="recurring-bill-mobile-header">
                      <div>
                        <strong>{bill.name}</strong>
                        {bill.notes && <div className="bill-notes">{bill.notes}</div>}
                      </div>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <div className="recurring-bill-mobile-row">
                      <span className="recurring-bill-mobile-label">Amount</span>
                      <strong className="fs-num">{formatCurrency(bill.amount)}</strong>
                    </div>
                    <div className="recurring-bill-mobile-row">
                      <span className="recurring-bill-mobile-label">Category</span>
                      <Badge tone="neutral">{bill.category}</Badge>
                    </div>
                    <div className="recurring-bill-mobile-row">
                      <span className="recurring-bill-mobile-label">Frequency</span>
                      <span className="bill-frequency">{bill.frequency}</span>
                    </div>
                    <div className="recurring-bill-mobile-row">
                      <span className="recurring-bill-mobile-label">Next Due</span>
                      <span className="fs-num">{bill.nextDueDate ? formatDate(bill.nextDueDate) : '-'}</span>
                    </div>
                    <div className="recurring-bill-mobile-row">
                      <span className="recurring-bill-mobile-label">Account</span>
                      <span>{bill.paymentMethod}</span>
                    </div>
                    <div className="recurring-bill-mobile-actions">
                      <ProtectedAction>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setBillToPay(bill)}
                          aria-label={`Pay ${bill.name}`}
                        >
                          <FaCheckCircle aria-hidden="true" /> Pay
                        </Button>
                      </ProtectedAction>
                      <ProtectedAction>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleActive(bill)}
                          aria-label={`${bill.isActive ? 'Pause' : 'Resume'} ${bill.name}`}
                        >
                          {bill.isActive ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
                        </Button>
                      </ProtectedAction>
                      <ProtectedAction>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(bill)}
                          aria-label={`Edit ${bill.name}`}
                        >
                          <FaEdit aria-hidden="true" />
                        </Button>
                      </ProtectedAction>
                      <ProtectedAction>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setBillToDelete(bill)}
                          aria-label={`Delete ${bill.name}`}
                        >
                          <FaTrash aria-hidden="true" />
                        </Button>
                      </ProtectedAction>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Bill Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={closeModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeModal();
          }}
          data-testid="bill-modal"
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-modal-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="bill-modal-title">{editingBill ? 'Edit Recurring Bill' : 'Add Recurring Bill'}</h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close modal"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveBill}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="bill-name">Bill Name *</label>
                  <input
                    id="bill-name"
                    name="name"
                    type="text"
                    required
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Internet, Rent, Electricity"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bill-category">Category *</label>
                    <select
                      id="bill-category"
                      name="category"
                      className="form-control"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      {EXPENDITURE_CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bill-amount">Amount (EGP) *</label>
                    <input
                      id="bill-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="form-control"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bill-frequency">Frequency *</label>
                    <select
                      id="bill-frequency"
                      name="frequency"
                      className="form-control"
                      value={formData.frequency}
                      onChange={handleInputChange}
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bill-dueDay">Day of Month (1-31) *</label>
                    <input
                      id="bill-dueDay"
                      name="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      required
                      className="form-control"
                      value={formData.dueDay}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bill-nextDueDate">Next Due Date *</label>
                    <input
                      id="bill-nextDueDate"
                      name="nextDueDate"
                      type="date"
                      required
                      className="form-control"
                      value={formData.nextDueDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bill-paymentMethod">Payment Account *</label>
                    <select
                      id="bill-paymentMethod"
                      name="paymentMethod"
                      className="form-control"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm.value} value={pm.value}>
                          {pm.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bill-notes">Notes / Provider</label>
                  <input
                    id="bill-notes"
                    name="notes"
                    type="text"
                    className="form-control"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Optional notes or account number"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  data-testid="submit-bill-form"
                >
                  {isSubmitting ? 'Saving...' : editingBill ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(billToPay)}
        title="Record Bill Payment"
        message={
          billToPay
            ? `Record a payment of ${formatCurrency(billToPay.amount)} for "${billToPay.name}"? This will log an expenditure from your ${billToPay.paymentMethod} ledger and advance the due date to next cycle.`
            : ''
        }
        confirmText="Pay & Record"
        cancelText="Cancel"
        variant="primary"
        isLoading={isProcessingAction}
        onConfirm={handleConfirmPay}
        onCancel={() => setBillToPay(null)}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(billToDelete)}
        title="Delete Recurring Schedule"
        message={
          billToDelete
            ? `Are you sure you want to delete the schedule for "${billToDelete.name}"? Past expenditure logs recorded from this bill will remain intact.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isProcessingAction}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBillToDelete(null)}
      />
    </div>
  );
};

export default RecurringBills;
