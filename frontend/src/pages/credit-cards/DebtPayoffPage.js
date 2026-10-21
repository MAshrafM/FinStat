// frontend/src/pages/credit-cards/DebtPayoffPage.js
import React, { useState, useEffect } from 'react';
import CreditCardSubNav from '../../components/creditCards/CreditCardSubNav';
import { calculatePayoff, savePlan, getSavedPlans } from '../../services/debtPayoffService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { FaSnowflake, FaBolt, FaPiggyBank, FaCalendarCheck, FaBookmark } from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import './DebtPayoffPage.css';

const DebtPayoffPage = () => {
  const canModify = useCanModify();
  const { showToast } = useToast();
  const [strategy, setStrategy] = useState('snowball');
  const [monthlyBudget, setMonthlyBudget] = useState('2000');
  const [planResult, setPlanResult] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [error, setError] = useState('');

  // Fetch saved plans on initial mount
  useEffect(() => {
    getSavedPlans()
      .then((plans) => setSavedPlans(plans))
      .catch((err) => console.error('Failed to load saved plans:', err));
  }, []);

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    const budgetNum = parseFloat(monthlyBudget);
    if (!budgetNum || budgetNum <= 0) {
      setError('Please enter a valid monthly budget.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const result = await calculatePayoff({
        strategy,
        monthlyBudget: budgetNum,
      });
      setPlanResult(result);
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err.message || 'Simulation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSimulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy]);

  const handleSaveActivePlan = async () => {
    if (!canModify) return;
    if (!planResult || !planResult.cards || planResult.cards.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        strategy: planResult.strategy,
        monthlyBudget: planResult.monthlyBudget,
        cards: planResult.cards.map((c) => ({
          cardId: c.cardId,
          balanceInPiastres: c.balanceInPiastres,
          minimumPaymentInPiastres: c.minimumPaymentInPiastres,
          apr: c.apr,
        })),
        projectedPayoffDate: planResult.projectedPayoffDate,
        totalInterestPaidInPiastres: planResult.totalInterestPaidInPiastres,
        totalInterestSavedInPiastres: planResult.totalInterestSavedInPiastres,
        schedule: planResult.schedule.slice(0, 60), // store up to 5 years schedule
      };
      const saved = await savePlan(payload);
      showToast('Debt payoff plan saved as active strategy!', 'success');
      setSavedPlans([saved, ...savedPlans]);
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.message || 'Failed to save plan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const comparison = planResult?.comparison;

  return (
    <div className="page-container">
      <CreditCardSubNav />

      <div className="page-header">
        <div>
          <h1>Debt Payoff Planner</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Optimize debt repayment using Snowball (quick wins) or Avalanche (maximum interest savings).
          </p>
        </div>
      </div>

      {/* Strategy Control Panel */}
      <div className="payoff-control-card">
        <form onSubmit={handleSimulate} className="payoff-controls-form">
          <div className="strategy-buttons-group">
            <button
              type="button"
              className={`strategy-btn ${strategy === 'snowball' ? 'active-snowball' : ''}`}
              onClick={() => setStrategy('snowball')}
            >
              <FaSnowflake className="strategy-btn-icon" />
              <div>
                <strong>Debt Snowball</strong>
                <span>Pay lowest balance first (psychological momentum)</span>
              </div>
            </button>

            <button
              type="button"
              className={`strategy-btn ${strategy === 'avalanche' ? 'active-avalanche' : ''}`}
              onClick={() => setStrategy('avalanche')}
            >
              <FaBolt className="strategy-btn-icon" />
              <div>
                <strong>Debt Avalanche</strong>
                <span>Pay highest APR first (mathematically saves the most)</span>
              </div>
            </button>
          </div>

          <div className="budget-input-group">
            <label>Total Monthly Payment Budget (EGP):</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="number"
                step="50"
                min="100"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="2000"
                required
                className="budget-input"
              />
              <button type="submit" className="action-button" disabled={isLoading} style={{ whiteSpace: 'nowrap' }}>
                {isLoading ? 'Calculating...' : 'Recalculate'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Simulation Results */}
      {planResult && (
        <>
          {/* Key Metric Highlights */}
          <div className="payoff-metrics-grid">
            <div className="payoff-metric-box">
              <div className="metric-box-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <FaPiggyBank size={22} />
              </div>
              <div>
                <span className="box-label">Total Interest Saved</span>
                <span className="box-val highlight-green">
                  {formatCurrency((planResult.totalInterestSavedInPiastres || 0) / 100)}
                </span>
                <span className="box-sub">Compared to minimum-only baseline</span>
              </div>
            </div>

            <div className="payoff-metric-box">
              <div className="metric-box-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <FaCalendarCheck size={22} />
              </div>
              <div>
                <span className="box-label">Projected Debt-Free Date</span>
                <span className="box-val">
                  {formatDate(planResult.projectedPayoffDate)}
                </span>
                <span className="box-sub">{planResult.monthsToPayoff} months to zero balance</span>
              </div>
            </div>

            <div className="payoff-metric-box">
              <div className="metric-box-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <FaBolt size={22} />
              </div>
              <div>
                <span className="box-label">Total Interest Paid</span>
                <span className="box-val">
                  {formatCurrency((planResult.totalInterestPaidInPiastres || 0) / 100)}
                </span>
                <span className="box-sub">Across all cards during payoff</span>
              </div>
            </div>
          </div>

          {/* Strategy Comparison Card */}
          {comparison && (
            <div className="comparison-card">
              <h3>Strategy Comparison vs. Minimum Baseline</h3>
              <div className="comparison-table-wrap">
                <table className="styled-table comparison-table">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Time to Debt-Free</th>
                      <th>Total Interest Paid</th>
                      <th>Interest Saved</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={strategy === 'snowball' ? 'row-selected' : ''}>
                      <td><strong>❄️ Snowball</strong></td>
                      <td>{comparison.snowball?.monthsToPayoff} months</td>
                      <td>{formatCurrency((comparison.snowball?.totalInterestPaidInPiastres || 0) / 100)}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>
                        {formatCurrency(
                          Math.max(
                            0,
                            ((comparison.minimumOnly?.totalInterestPaidInPiastres || 0) -
                              (comparison.snowball?.totalInterestPaidInPiastres || 0)) /
                              100
                          )
                        )}
                      </td>
                      <td>{strategy === 'snowball' ? <span className="active-tag">Active Simulation</span> : '-'}</td>
                    </tr>
                    <tr className={strategy === 'avalanche' ? 'row-selected' : ''}>
                      <td><strong>⚡ Avalanche</strong></td>
                      <td>{comparison.avalanche?.monthsToPayoff} months</td>
                      <td>{formatCurrency((comparison.avalanche?.totalInterestPaidInPiastres || 0) / 100)}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>
                        {formatCurrency(
                          Math.max(
                            0,
                            ((comparison.minimumOnly?.totalInterestPaidInPiastres || 0) -
                              (comparison.avalanche?.totalInterestPaidInPiastres || 0)) /
                              100
                          )
                        )}
                      </td>
                      <td>{strategy === 'avalanche' ? <span className="active-tag">Active Simulation</span> : '-'}</td>
                    </tr>
                    <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                      <td><strong>⏳ Minimum Only (Baseline)</strong></td>
                      <td>{comparison.minimumOnly?.monthsToPayoff} months</td>
                      <td>{formatCurrency((comparison.minimumOnly?.totalInterestPaidInPiastres || 0) / 100)}</td>
                      <td>0 EGP</td>
                      <td>Baseline</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <ProtectedAction tooltip="View-only access">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveActivePlan}
                    disabled={isSaving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <FaBookmark /> {isSaving ? 'Saving...' : 'Save As Active Plan'}
                  </button>
                </ProtectedAction>
              </div>
            </div>
          )}

          {/* Month-by-Month Schedule Accordion */}
          <div className="schedule-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Month-by-Month Payment Schedule</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSchedule(!showSchedule)}
                style={{ fontSize: '0.85rem' }}
              >
                {showSchedule ? 'Hide Schedule' : `Show All ${planResult.monthsToPayoff} Months`}
              </button>
            </div>

            {showSchedule && (
              <div className="table-container">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Month #</th>
                      <th>Card</th>
                      <th>Monthly Payment</th>
                      <th>Interest Charged</th>
                      <th>Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planResult.schedule.map((s, idx) => (
                      <tr key={idx}>
                        <td><strong>Month {s.month}</strong></td>
                        <td>{s.cardName || 'Card'}</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(s.paymentInPiastres / 100)}</td>
                        <td style={{ color: '#dc2626' }}>{formatCurrency(s.interestChargedInPiastres / 100)}</td>
                        <td>{formatCurrency(s.remainingBalanceInPiastres / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DebtPayoffPage;
