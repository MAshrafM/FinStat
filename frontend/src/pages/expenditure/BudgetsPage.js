// frontend/src/pages/expenditure/BudgetsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import ExpenditureSubNav from './ExpenditureSubNav';
import {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
} from '../../services/budgetService';
import { formatCurrency } from '../../utils/formatters';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { FaPlus, FaPencilAlt, FaTrash, FaChartPie, FaHistory, FaCalendarAlt } from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Button, Badge, Loading, EmptyState } from '../../components/ui';
import './BudgetsPage.css';
import './RulesPage.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BudgetsPage = () => {
  const canModifyContext = useCanModify();
  const canModify = canModifyContext?.canModify ?? (typeof canModifyContext === 'boolean' ? canModifyContext : true);
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const currentDate = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(currentDate.getMonth() / 3) + 1);

  const [budgetsProgress, setBudgetsProgress] = useState([]);
  const [prevBudgetsProgress, setPrevBudgetsProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [formData, setFormData] = useState({
    category: EXPENDITURE_CATEGORIES[0]?.name || 'Groceries',
    period: 'monthly',
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    quarter: Math.floor(currentDate.getMonth() / 3) + 1,
    amount: '',
    alertThreshold: 80,
  });

  const fetchProgress = useCallback(() => {
    setIsLoading(true);
    const filter = {
      period: selectedPeriod,
      year: selectedYear,
    };
    if (selectedPeriod === 'monthly') filter.month = selectedMonth;
    if (selectedPeriod === 'quarterly') filter.quarter = selectedQuarter;

    getBudgetProgress(filter)
      .then((res) => {
        setBudgetsProgress(Array.isArray(res) ? res : res?.data || []);
      })
      .catch((err) => {
        console.error('Failed to load budget progress:', err);
        setBudgetsProgress([]);
      })
      .finally(() => setIsLoading(false));

    // When viewing monthly budgets, also fetch previous month's final outcome
    if (selectedPeriod === 'monthly') {
      setIsLoadingPrev(true);
      const pm = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const py = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

      getBudgetProgress({ period: 'monthly', year: py, month: pm })
        .then((res) => {
          setPrevBudgetsProgress(Array.isArray(res) ? res : res?.data || []);
        })
        .catch((err) => {
          console.error('Failed to load previous month budget progress:', err);
          setPrevBudgetsProgress([]);
        })
        .finally(() => setIsLoadingPrev(false));
    } else {
      setPrevBudgetsProgress([]);
    }
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setFormData({
      category: EXPENDITURE_CATEGORIES[0]?.name || 'Groceries',
      period: selectedPeriod,
      year: selectedYear,
      month: selectedMonth,
      quarter: selectedQuarter,
      amount: '',
      alertThreshold: 80,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bProgress) => {
    const budget = bProgress.budget;
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      period: budget.period,
      year: budget.year,
      month: budget.month || selectedMonth,
      quarter: budget.quarter || selectedQuarter,
      amount: budget.amount,
      alertThreshold: budget.alertThreshold || 80,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canModify) return;
    const payload = {
      category: formData.category,
      period: formData.period,
      year: parseInt(formData.year, 10),
      amount: parseFloat(formData.amount),
      alertThreshold: parseInt(formData.alertThreshold, 10) || 80,
    };
    if (formData.period === 'monthly') payload.month = parseInt(formData.month, 10);
    if (formData.period === 'quarterly') payload.quarter = parseInt(formData.quarter, 10);

    try {
      if (editingBudget) {
        await updateBudget(editingBudget._id, payload);
      } else {
        await createBudget(payload);
      }
      setIsModalOpen(false);
      fetchProgress();
    } catch (err) {
      if (notify) notify(err.response?.data?.message || 'Failed to save budget', 'error');
    }
  };

  const handleDelete = (budgetId) => {
    if (!canModify) return;
    setBudgetToDelete(budgetId);
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await deleteBudget(budgetToDelete);
      if (notify) notify('Budget allocation deleted successfully', 'success');
      setBudgetToDelete(null);
      fetchProgress();
    } catch (err) {
      if (notify) notify('Failed to delete budget', 'error');
    }
  };

  // KPIs
  const totalBudgeted = budgetsProgress.reduce((sum, b) => sum + (b.budgetedAmount || 0), 0);
  const totalSpent = budgetsProgress.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallBurnRate = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 1000) / 10 : 0;

  // Previous Month Date & KPIs
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const prevTotalBudgeted = prevBudgetsProgress.reduce((sum, b) => sum + (b.budgetedAmount || 0), 0);
  const prevTotalSpent = prevBudgetsProgress.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const prevTotalRemaining = prevTotalBudgeted - prevTotalSpent;
  const prevOverallBurnRate =
    prevTotalBudgeted > 0 ? Math.round((prevTotalSpent / prevTotalBudgeted) * 1000) / 10 : 0;

  const handleOpenCreateForMonth = (year, month) => {
    setEditingBudget(null);
    setFormData({
      category: EXPENDITURE_CATEGORIES[0]?.name || 'Groceries',
      period: 'monthly',
      year,
      month,
      quarter: Math.floor((month - 1) / 3) + 1,
      amount: '',
      alertThreshold: 80,
    });
    setIsModalOpen(true);
  };

  const getProgressModifier = (pct) => {
    if (pct > 100) return 'fs-progress--negative';
    if (pct >= 80) return 'fs-progress--warning';
    return '';
  };

  return (
    <div className="fs-page budgets-page-container" data-testid="budgets-page">
      {/* Sub-navigation tabs */}
      <ExpenditureSubNav />

      <PageHeader
        title="Budget vs. Actual Tracker"
        subtitle="Monitor real-time spending against your monthly, quarterly, or yearly targets with color-coded alerts."
        actions={
          <ProtectedAction tooltip="View-only access">
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              data-testid="set-budget-btn"
            >
              <FaPlus /> Set New Budget
            </Button>
          </ProtectedAction>
        }
      />

      {/* KPI Cards */}
      <div className="budget-kpis-grid">
        <div className="budget-kpi-card" data-testid="kpi-total-allocated">
          <div className="budget-kpi-label">Total Allocated</div>
          <div className="budget-kpi-val fs-num">
            {formatCurrency(totalBudgeted)}
          </div>
        </div>

        <div className="budget-kpi-card" data-testid="kpi-total-spent">
          <div className="budget-kpi-label">Total Spent</div>
          <div className="budget-kpi-val fs-num">
            {formatCurrency(totalSpent)}
          </div>
        </div>

        <div className="budget-kpi-card" data-testid="kpi-remaining-balance">
          <div className="budget-kpi-label">Remaining Safe Balance</div>
          <div className={`budget-kpi-val fs-num ${totalRemaining >= 0 ? 'fs-delta--positive' : 'fs-delta--negative'}`}>
            {formatCurrency(totalRemaining)}
          </div>
        </div>

        <div className="budget-kpi-card" data-testid="kpi-burn-rate">
          <div className="budget-kpi-label">Overall Burn Rate</div>
          <div className="budget-kpi-val fs-num">
            {overallBurnRate}%
          </div>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="budgets-filter-bar">
        <div className="filter-group">
          <label htmlFor="budget-period-select">Period:</label>
          <select
            id="budget-period-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="budget-year-select">Year:</label>
          <select
            id="budget-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {selectedPeriod === 'monthly' && (
          <div className="filter-group">
            <label htmlFor="budget-month-select">Month:</label>
            <select
              id="budget-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedPeriod === 'quarterly' && (
          <div className="filter-group">
            <label htmlFor="budget-quarter-select">Quarter:</label>
            <select
              id="budget-quarter-select"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(parseInt(e.target.value, 10))}
            >
              <option value={1}>Q1 (Jan - Mar)</option>
              <option value={2}>Q2 (Apr - Jun)</option>
              <option value={3}>Q3 (Jul - Sep)</option>
              <option value={4}>Q4 (Oct - Dec)</option>
            </select>
          </div>
        )}
      </div>

      {/* Current Month / Selected Period Budget Cards */}
      <div className="budget-section">
        <div className="budget-section-header">
          <h2 className="budget-section-title">
            <FaCalendarAlt className="budget-section-icon" />
            {selectedPeriod === 'monthly'
              ? `Current Month Targets (${MONTH_NAMES[selectedMonth - 1]} ${selectedYear})`
              : selectedPeriod === 'quarterly'
              ? `Quarter Targets (Q${selectedQuarter} ${selectedYear})`
              : `Annual Targets (${selectedYear})`}
          </h2>
          <span className="budget-section-sub">
            {selectedPeriod === 'monthly' ? 'Active month spending targets & live progress' : 'Target allocations'}
          </span>
        </div>

        {isLoading ? (
          <Loading variant="card" message="Loading budget progress..." />
        ) : budgetsProgress.length === 0 ? (
          <EmptyState
            icon={<FaChartPie />}
            title="No budgets found for this period"
            description="Set a spending limit for categories like Groceries, Dining, or Utilities to track progress."
            action={
              <ProtectedAction tooltip="View-only access">
                <Button
                  variant="primary"
                  onClick={handleOpenCreate}
                  data-testid="empty-set-budget-btn"
                >
                  <FaPlus /> Set New Budget
                </Button>
              </ProtectedAction>
            }
          />
        ) : (
          <div className="budget-cards-grid">
            {budgetsProgress.map((bp) => {
              const statusClass = `status-${bp.alertStatus}`;
              const barWidth = Math.min(100, Math.max(0, bp.percentageUsed));

              return (
                <div key={bp.budgetId} className={`budget-card ${statusClass}`} data-testid={`budget-card-${bp.category}`}>
                  <div className="budget-card-body">
                    <div className="budget-card-header">
                      <div>
                        <h3 className="budget-category-title">{bp.category}</h3>
                        <Badge tone="neutral" className="budget-cat-badge">
                          {bp.category}
                        </Badge>
                      </div>
                      <span className="budget-period-badge">
                        {bp.period === 'monthly'
                          ? `${MONTH_NAMES[(bp.month || 1) - 1]} ${bp.year}`
                          : bp.period === 'quarterly'
                          ? `Q${bp.quarter} ${bp.year}`
                          : `Year ${bp.year}`}
                      </span>
                    </div>

                    <div
                      className={`fs-progress ${getProgressModifier(bp.percentageUsed)}`}
                      role="progressbar"
                      aria-valuenow={Math.min(bp.percentageUsed, 100)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`${bp.category} budget usage: ${bp.percentageUsed}%`}
                    >
                      <div
                        className="fs-progress-bar"
                        ref={(el) => {
                          if (el) el.style.width = `${barWidth}%`;
                        }}
                      />
                    </div>

                    <div className="budget-financials-row">
                      <div>
                        <span className="budget-fin-label">Spent</span>
                        <span className="budget-spent-val fs-num">{formatCurrency(bp.spentAmount)}</span>
                      </div>
                      <div className="budget-limit-col">
                        <span className="budget-fin-label">Limit</span>
                        <strong className="budget-limit-val fs-num">
                          {formatCurrency(bp.budgetedAmount)}
                        </strong>
                      </div>
                    </div>

                    <div className="budget-status-row">
                      <Badge tone={bp.remainingAmount >= 0 ? 'neutral' : 'negative'}>
                        {bp.remainingAmount >= 0
                          ? `${formatCurrency(bp.remainingAmount)} remaining`
                          : `${formatCurrency(Math.abs(bp.remainingAmount))} over limit`}
                      </Badge>
                      <span className={`budget-pct-val fs-num ${bp.percentageUsed > 100 ? 'fs-delta--negative' : bp.percentageUsed >= 80 ? 'fs-delta--warning' : ''}`}>
                        {bp.percentageUsed}% used
                      </span>
                    </div>
                  </div>

                  <div className="rule-card-footer">
                    <div className="budget-alert-threshold">
                      Alert at {bp.alertThreshold}%
                    </div>
                    <div className="rule-actions">
                      <ProtectedAction tooltip="View-only access">
                        <button
                          type="button"
                          className="rule-action-btn"
                          title="Edit budget"
                          aria-label={`Edit ${bp.category} budget`}
                          onClick={() => handleOpenEdit(bp)}
                        >
                          <FaPencilAlt />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction tooltip="View-only access">
                        <button
                          type="button"
                          className="rule-action-btn delete"
                          title="Delete budget"
                          aria-label={`Delete ${bp.category} budget`}
                          onClick={() => handleDelete(bp.budgetId)}
                        >
                          <FaTrash />
                        </button>
                      </ProtectedAction>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Previous Month Performance & Final Outcome Section (Table) */}
      {selectedPeriod === 'monthly' && (
        <div className="budget-section previous-month-section">
          <div className="budget-section-header">
            <div className="previous-month-header-content">
              <div>
                <h2 className="budget-section-title">
                  <FaHistory className="budget-section-icon" />
                  Previous Month Final Outcome ({MONTH_NAMES[prevMonth - 1]} {prevYear})
                </h2>
                <span className="budget-section-sub">
                  Historical spending comparison, variance, and final settled outcome
                </span>
              </div>
              {prevBudgetsProgress.length > 0 && (
                <Badge
                  tone={prevTotalRemaining >= 0 ? 'positive' : 'negative'}
                  className="budget-outcome-summary-badge"
                >
                  Overall Result: {prevTotalRemaining >= 0 ? `Net Saved ${formatCurrency(prevTotalRemaining)}` : `Net Over ${formatCurrency(Math.abs(prevTotalRemaining))}`} ({prevOverallBurnRate}% burn rate)
                </Badge>
              )}
            </div>
          </div>

          {isLoadingPrev ? (
            <Loading variant="table" message="Loading previous month final outcome..." />
          ) : prevBudgetsProgress.length === 0 ? (
            <EmptyState
              icon={<FaHistory />}
              title={`No budget entries found for ${MONTH_NAMES[prevMonth - 1]} ${prevYear}`}
              description="You can retroactively record budget allocations for previous months to track historical performance."
              action={
                <ProtectedAction tooltip="View-only access">
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenCreateForMonth(prevYear, prevMonth)}
                  >
                    <FaPlus /> Set Budget for {MONTH_NAMES[prevMonth - 1]} {prevYear}
                  </Button>
                </ProtectedAction>
              }
            />
          ) : (
            <>
              {/* Desktop Outcome Table */}
              <div className="table-container budget-outcome-desktop-table fs-table-container">
                <table className="styled-table budget-outcome-table" data-testid="budget-outcome-table">
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col" className="cell-right">Budget Target</th>
                      <th scope="col" className="cell-right">Actual Spent</th>
                      <th scope="col" className="cell-right">Variance / Diff</th>
                      <th scope="col" className="cell-center">% Used</th>
                      <th scope="col" className="cell-center">Final Outcome</th>
                      <th scope="col" className="cell-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prevBudgetsProgress.map((bp) => {
                      const isUnderBudget = bp.remainingAmount >= 0;
                      return (
                        <tr key={bp.budgetId}>
                          <td>
                            <Badge tone="neutral">{bp.category}</Badge>
                          </td>
                          <td className="cell-right fs-num">
                            {formatCurrency(bp.budgetedAmount)}
                          </td>
                          <td className="cell-right fs-num">
                            {formatCurrency(bp.spentAmount)}
                          </td>
                          <td className="cell-right fs-num">
                            <span className={isUnderBudget ? 'fs-delta--positive' : 'fs-delta--negative'}>
                              {isUnderBudget
                                ? `+${formatCurrency(bp.remainingAmount)}`
                                : `-${formatCurrency(Math.abs(bp.remainingAmount))}`}
                            </span>
                          </td>
                          <td className="cell-center fs-num">
                            <span
                              className={
                                bp.percentageUsed > 100
                                  ? 'fs-delta--negative'
                                  : bp.percentageUsed >= 80
                                  ? 'fs-delta--warning'
                                  : ''
                              }
                            >
                              {bp.percentageUsed}%
                            </span>
                          </td>
                          <td className="cell-center">
                            <Badge tone={isUnderBudget ? 'neutral' : 'negative'}>
                              {isUnderBudget ? 'Within Budget' : 'Over Budget'}
                            </Badge>
                          </td>
                          <td className="action-cell cell-center">
                            <div className="table-actions">
                              <ProtectedAction tooltip="View-only access">
                                <button
                                  type="button"
                                  className="rule-action-btn"
                                  title="Edit budget"
                                  aria-label={`Edit ${bp.category} budget`}
                                  onClick={() => handleOpenEdit(bp)}
                                >
                                  <FaPencilAlt />
                                </button>
                              </ProtectedAction>
                              <ProtectedAction tooltip="View-only access">
                                <button
                                  type="button"
                                  className="rule-action-btn delete"
                                  title="Delete budget"
                                  aria-label={`Delete ${bp.category} budget`}
                                  onClick={() => handleDelete(bp.budgetId)}
                                >
                                  <FaTrash />
                                </button>
                              </ProtectedAction>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="budget-table-total-row">
                      <th scope="row">Total</th>
                      <td className="cell-right fs-num">{formatCurrency(prevTotalBudgeted)}</td>
                      <td className="cell-right fs-num">{formatCurrency(prevTotalSpent)}</td>
                      <td className="cell-right fs-num">
                        <span className={prevTotalRemaining >= 0 ? 'fs-delta--positive' : 'fs-delta--negative'}>
                          {prevTotalRemaining >= 0
                            ? `+${formatCurrency(prevTotalRemaining)}`
                            : `-${formatCurrency(Math.abs(prevTotalRemaining))}`}
                        </span>
                      </td>
                      <td className="cell-center fs-num">{prevOverallBurnRate}%</td>
                      <td className="cell-center">
                        <Badge tone={prevTotalRemaining >= 0 ? 'neutral' : 'negative'}>
                          {prevTotalRemaining >= 0 ? 'Net Surplus' : 'Net Deficit'}
                        </Badge>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile D19 Outcome Cards (<= 768px) */}
              <div className="budget-outcome-mobile-cards">
                {prevBudgetsProgress.map((bp) => {
                  const isUnderBudget = bp.remainingAmount >= 0;
                  return (
                    <div key={bp.budgetId} className="budget-outcome-mobile-card">
                      <div className="budget-outcome-mobile-header">
                        <Badge tone="neutral">{bp.category}</Badge>
                        <Badge tone={isUnderBudget ? 'neutral' : 'negative'}>
                          {isUnderBudget ? 'Within Budget' : 'Over Budget'}
                        </Badge>
                      </div>
                      <div className="budget-outcome-mobile-row">
                        <span className="budget-outcome-mobile-label">Target</span>
                        <span className="fs-num">{formatCurrency(bp.budgetedAmount)}</span>
                      </div>
                      <div className="budget-outcome-mobile-row">
                        <span className="budget-outcome-mobile-label">Spent</span>
                        <span className="fs-num">{formatCurrency(bp.spentAmount)}</span>
                      </div>
                      <div className="budget-outcome-mobile-row">
                        <span className="budget-outcome-mobile-label">Variance</span>
                        <span className={`fs-num ${isUnderBudget ? 'fs-delta--positive' : 'fs-delta--negative'}`}>
                          {isUnderBudget
                            ? `+${formatCurrency(bp.remainingAmount)}`
                            : `-${formatCurrency(Math.abs(bp.remainingAmount))}`}
                        </span>
                      </div>
                      <div className="budget-outcome-mobile-row">
                        <span className="budget-outcome-mobile-label">Usage</span>
                        <span className="fs-num">{bp.percentageUsed}%</span>
                      </div>
                      <div className="budget-outcome-mobile-actions">
                        <ProtectedAction tooltip="View-only access">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(bp)}
                          >
                            <FaPencilAlt /> Edit
                          </Button>
                        </ProtectedAction>
                        <ProtectedAction tooltip="View-only access">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(bp.budgetId)}
                          >
                            <FaTrash /> Delete
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
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(budgetToDelete)}
        title="Delete Budget Allocation"
        message="Are you sure you want to delete this budget allocation?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setBudgetToDelete(null)}
      />

      {/* Create / Edit Budget Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
          }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="budget-modal-title" className="modal-title">
                {editingBudget ? 'Edit Budget' : 'Set Category Budget'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <label htmlFor="budget-form-category">Category</label>
                  <select
                    id="budget-form-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENDITURE_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="budget-form-period">Period</label>
                  <select
                    id="budget-form-period"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="budget-form-year">Year</label>
                  <input
                    id="budget-form-year"
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>

                {formData.period === 'monthly' && (
                  <div className="form-row">
                    <label htmlFor="budget-form-month">Month</label>
                    <select
                      id="budget-form-month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.period === 'quarterly' && (
                  <div className="form-row">
                    <label htmlFor="budget-form-quarter">Quarter</label>
                    <select
                      id="budget-form-quarter"
                      value={formData.quarter}
                      onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                    >
                      <option value={1}>Q1 (Jan - Mar)</option>
                      <option value={2}>Q2 (Apr - Jun)</option>
                      <option value={3}>Q3 (Jul - Sep)</option>
                      <option value={4}>Q4 (Oct - Dec)</option>
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <label htmlFor="budget-form-amount">Budget Allocation Amount (EGP)</label>
                  <input
                    id="budget-form-amount"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="budget-form-alert">Alert Trigger Threshold (%)</label>
                  <input
                    id="budget-form-alert"
                    type="number"
                    min="10"
                    max="100"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <ProtectedAction tooltip="View-only access">
                  <Button
                    type="submit"
                    variant="primary"
                    data-testid="save-budget-submit-btn"
                  >
                    {editingBudget ? 'Update Budget' : 'Save Budget'}
                  </Button>
                </ProtectedAction>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
