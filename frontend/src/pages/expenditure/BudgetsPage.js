// frontend/src/pages/expenditure/BudgetsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
} from '../../services/budgetService';
import { formatCurrency } from '../../utils/formatters';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { FaPlus, FaPencilAlt, FaTrash, FaChartPie } from 'react-icons/fa';
import './BudgetsPage.css';
import './RulesPage.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BudgetsPage = () => {
  const currentDate = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(currentDate.getMonth() / 3) + 1);

  const [budgetsProgress, setBudgetsProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
      alert(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget allocation?')) {
      try {
        await deleteBudget(budgetId);
        fetchProgress();
      } catch (err) {
        alert('Failed to delete budget');
      }
    }
  };

  // KPIs
  const totalBudgeted = budgetsProgress.reduce((sum, b) => sum + (b.budgetedAmount || 0), 0);
  const totalSpent = budgetsProgress.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallBurnRate = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 1000) / 10 : 0;

  const getCategoryColor = (catName) => {
    const found = EXPENDITURE_CATEGORIES.find((c) => c.name === catName);
    return found ? found.color : '#6b7280';
  };

  return (
    <div className="budgets-page-container">
      {/* Sub-navigation tabs */}
      <div className="rules-nav-tabs">
        <Link to="/expenditures" className="rules-nav-link">
          Expenditure Log
        </Link>
        <Link to="/expenditures/rules" className="rules-nav-link">
          Auto-Categorization Rules
        </Link>
        <Link to="/expenditures/budgets" className="rules-nav-link active">
          Budget Tracker
        </Link>
        <Link to="/expenditures/recurring" className="rules-nav-link">
          Recurring Detection
        </Link>
      </div>

      <div className="budgets-header">
        <div className="budgets-header-titles">
          <h1>Budget vs. Actual Tracker</h1>
          <p>
            Monitor real-time spending against your monthly, quarterly, or yearly targets with color-coded
            alerts.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <FaPlus /> Set New Budget
        </button>
      </div>

      {/* KPI Cards */}
      <div className="budget-kpis-grid">
        <div className="budget-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="budget-kpi-label">Total Allocated</div>
          <div className="budget-kpi-val" style={{ color: '#1e40af' }}>
            {formatCurrency(totalBudgeted)}
          </div>
        </div>

        <div className="budget-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="budget-kpi-label">Total Spent</div>
          <div className="budget-kpi-val" style={{ color: '#b45309' }}>
            {formatCurrency(totalSpent)}
          </div>
        </div>

        <div
          className="budget-kpi-card"
          style={{ borderLeft: `4px solid ${totalRemaining >= 0 ? '#10b981' : '#ef4444'}` }}
        >
          <div className="budget-kpi-label">Remaining Safe Balance</div>
          <div
            className="budget-kpi-val"
            style={{ color: totalRemaining >= 0 ? '#047857' : '#b91c1c' }}
          >
            {formatCurrency(totalRemaining)}
          </div>
        </div>

        <div className="budget-kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="budget-kpi-label">Overall Burn Rate</div>
          <div className="budget-kpi-val" style={{ color: '#6d28d9' }}>
            {overallBurnRate}%
          </div>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="budgets-filter-bar">
        <div className="filter-group">
          <label>Period:</label>
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Year:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {selectedPeriod === 'monthly' && (
          <div className="filter-group">
            <label>Month:</label>
            <select
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
            <label>Quarter:</label>
            <select
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

      {/* Budget Cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading budget progress...</div>
      ) : budgetsProgress.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px dashed #d1d5db',
            color: '#6b7280',
          }}
        >
          <FaChartPie style={{ fontSize: '2.5rem', color: '#9ca3af', marginBottom: '1rem' }} />
          <h3>No budgets found for this period</h3>
          <p style={{ margin: '0.5rem 0 1.5rem 0' }}>
            Set a spending limit for categories like Groceries, Dining, or Utilities to track progress.
          </p>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <FaPlus /> Set New Budget
          </button>
        </div>
      ) : (
        <div className="budget-cards-grid">
          {budgetsProgress.map((bp) => {
            const catColor = getCategoryColor(bp.category);
            const statusClass = `status-${bp.alertStatus}`;
            const barWidth = Math.min(100, Math.max(0, bp.percentageUsed));

            return (
              <div key={bp.budgetId} className={`budget-card ${statusClass}`}>
                <div>
                  <div className="budget-card-header">
                    <div>
                      <h3 className="budget-category-title">{bp.category}</h3>
                      <span className="cat-pill" style={{ backgroundColor: catColor, marginTop: '0.35rem' }}>
                        {bp.category}
                      </span>
                    </div>
                    <span className="budget-period-badge">
                      {bp.period === 'monthly'
                        ? `${MONTH_NAMES[(bp.month || 1) - 1]} ${bp.year}`
                        : bp.period === 'quarterly'
                        ? `Q${bp.quarter} ${bp.year}`
                        : `Year ${bp.year}`}
                    </span>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-bar ${bp.alertStatus}`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>

                  <div className="budget-financials-row">
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Spent</span>
                      <span className="budget-spent-val">{formatCurrency(bp.spentAmount)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Limit</span>
                      <strong style={{ fontSize: '1.1rem', color: '#374151' }}>
                        {formatCurrency(bp.budgetedAmount)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      className={`budget-remaining-tag ${bp.remainingAmount >= 0 ? 'safe' : 'danger'}`}
                    >
                      {bp.remainingAmount >= 0
                        ? `${formatCurrency(bp.remainingAmount)} remaining`
                        : `${formatCurrency(Math.abs(bp.remainingAmount))} over limit`}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {bp.percentageUsed}% used
                    </span>
                  </div>
                </div>

                <div className="rule-card-footer" style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Alert at {bp.alertThreshold}%
                  </div>
                  <div className="rule-actions">
                    <button
                      className="rule-action-btn"
                      title="Edit budget"
                      onClick={() => handleOpenEdit(bp)}
                    >
                      <FaPencilAlt />
                    </button>
                    <button
                      className="rule-action-btn delete"
                      title="Delete budget"
                      onClick={() => handleDelete(bp.budgetId)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Budget Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'Set Category Budget'}</h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <label>Category</label>
                  <select
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
                  <label>Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="form-row">
                  <label>Year</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>

                {formData.period === 'monthly' && (
                  <div className="form-row">
                    <label>Month</label>
                    <select
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
                    <label>Quarter</label>
                    <select
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
                  <label>Budget Allocation Amount (EGP)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label>Alert Trigger Threshold (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBudget ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
