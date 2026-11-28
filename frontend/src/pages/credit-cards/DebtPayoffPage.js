// frontend/src/pages/credit-cards/DebtPayoffPage.js
import React, { useState, useEffect } from 'react';
import CreditCardSubNav from '../../components/creditCards/CreditCardSubNav';
import { calculatePayoff, savePlan, getSavedPlans } from '../../services/debtPayoffService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  FaSnowflake,
  FaBolt,
  FaPiggyBank,
  FaCalendarCheck,
  FaBookmark,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import './DebtPayoffPage.css';

const DebtPayoffPage = () => {
  const { canModify } = useCanModify();
  const { showToast } = useToast();
  const [strategy, setStrategy] = useState('snowball');
  const [monthlyBudget, setMonthlyBudget] = useState('2000');
  const [planResult, setPlanResult] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [error, setError] = useState('');
  const [expandedCompKeys, setExpandedCompKeys] = useState(() => new Set());
  const [expandedSchedKeys, setExpandedSchedKeys] = useState(() => new Set());

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
        schedule: planResult.schedule.slice(0, 60),
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

  const toggleKey = (setter, key) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const comparison = planResult?.comparison;
  const comparisonRows = comparison
    ? [
        {
          id: 'snowball',
          label: 'Snowball',
          months: comparison.snowball?.monthsToPayoff ?? 0,
          interestPaid: formatCurrency((comparison.snowball?.totalInterestPaidInPiastres || 0) / 100),
          interestSaved: formatCurrency(
            Math.max(
              0,
              ((comparison.minimumOnly?.totalInterestPaidInPiastres || 0) -
                (comparison.snowball?.totalInterestPaidInPiastres || 0)) /
                100
            )
          ),
          isSelected: strategy === 'snowball',
          status: strategy === 'snowball' ? 'Active Simulation' : 'Available',
        },
        {
          id: 'avalanche',
          label: 'Avalanche',
          months: comparison.avalanche?.monthsToPayoff ?? 0,
          interestPaid: formatCurrency((comparison.avalanche?.totalInterestPaidInPiastres || 0) / 100),
          interestSaved: formatCurrency(
            Math.max(
              0,
              ((comparison.minimumOnly?.totalInterestPaidInPiastres || 0) -
                (comparison.avalanche?.totalInterestPaidInPiastres || 0)) /
                100
            )
          ),
          isSelected: strategy === 'avalanche',
          status: strategy === 'avalanche' ? 'Active Simulation' : 'Available',
        },
        {
          id: 'minimum',
          label: 'Minimum Only (Baseline)',
          months: comparison.minimumOnly?.monthsToPayoff ?? 0,
          interestPaid: formatCurrency((comparison.minimumOnly?.totalInterestPaidInPiastres || 0) / 100),
          interestSaved: formatCurrency(0),
          isSelected: false,
          status: 'Baseline',
        },
      ]
    : [];

  return (
    <div className="page-container dp-page">
      <CreditCardSubNav />

      <div className="dp-header">
        <h1>Debt Payoff Planner</h1>
        <p className="dp-subtitle">
          Optimize debt repayment using Snowball (quick wins) or Avalanche (maximum interest savings).
        </p>
      </div>

      {/* Strategy Control Panel */}
      <div className="dp-control-card">
        <form onSubmit={handleSimulate}>
          <div className="dp-strategy-grid">
            <button
              type="button"
              aria-pressed={strategy === 'snowball'}
              className={`dp-strategy-btn ${strategy === 'snowball' ? 'is-active' : ''}`}
              onClick={() => setStrategy('snowball')}
            >
              <FaSnowflake className="dp-strategy-icon" aria-hidden="true" />
              <div className="dp-strategy-copy">
                <strong>Debt Snowball</strong>
                <span>Pay lowest balance first (psychological momentum)</span>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={strategy === 'avalanche'}
              className={`dp-strategy-btn ${strategy === 'avalanche' ? 'is-active' : ''}`}
              onClick={() => setStrategy('avalanche')}
            >
              <FaBolt className="dp-strategy-icon" aria-hidden="true" />
              <div className="dp-strategy-copy">
                <strong>Debt Avalanche</strong>
                <span>Pay highest APR first (mathematically saves the most)</span>
              </div>
            </button>
          </div>

          <div className="dp-budget-group">
            <label htmlFor="dp-monthly-budget" className="dp-budget-label">
              Total Monthly Payment Budget (EGP):
            </label>
            <div className="dp-budget-row">
              <input
                id="dp-monthly-budget"
                type="number"
                step="50"
                min="100"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="2000"
                required
                className="dp-budget-input fs-num"
              />
              <button
                type="submit"
                className="fs-btn fs-btn-secondary dp-action-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Calculating...' : 'Recalculate'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="dp-error-card" role="alert">
          <h2>Simulation Error</h2>
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="dp-loading-wrap">
          <Loading variant="card" text="Calculating payoff projection..." />
        </div>
      )}

      {/* Simulation Results */}
      {!isLoading && planResult && (!planResult.cards || planResult.cards.length === 0) && (
        <div className="dp-empty-card">
          <h2>No Active Card Balances</h2>
          <p>All credit cards currently have a zero balance, so no debt payoff schedule is required.</p>
        </div>
      )}

      {!isLoading && planResult && planResult.cards && planResult.cards.length > 0 && (
        <>
          {/* Key Metric Highlights */}
          <div className="dp-metrics-grid">
            <div className="dp-metric-card">
              <div className="dp-metric-icon" aria-hidden="true">
                <FaPiggyBank size={20} />
              </div>
              <div className="dp-metric-body">
                <span className="dp-metric-label">Total Interest Saved</span>
                <span className="dp-metric-value fs-num">
                  {formatCurrency((planResult.totalInterestSavedInPiastres || 0) / 100)}
                </span>
                <span className="dp-metric-hint">Compared to minimum-only baseline</span>
              </div>
            </div>

            <div className="dp-metric-card">
              <div className="dp-metric-icon" aria-hidden="true">
                <FaCalendarCheck size={20} />
              </div>
              <div className="dp-metric-body">
                <span className="dp-metric-label">Projected Debt-Free Date</span>
                <span className="dp-metric-value fs-num">
                  {formatDate(planResult.projectedPayoffDate)}
                </span>
                <span className="dp-metric-hint fs-num">
                  {planResult.monthsToPayoff} months to zero balance
                </span>
              </div>
            </div>

            <div className="dp-metric-card">
              <div className="dp-metric-icon" aria-hidden="true">
                <FaBolt size={20} />
              </div>
              <div className="dp-metric-body">
                <span className="dp-metric-label">Total Interest Paid</span>
                <span className="dp-metric-value fs-num">
                  {formatCurrency((planResult.totalInterestPaidInPiastres || 0) / 100)}
                </span>
                <span className="dp-metric-hint">Across all cards during payoff</span>
              </div>
            </div>
          </div>

          {/* Strategy Comparison Card */}
          {comparison && (
            <section className="dp-section" aria-label="Strategy Comparison">
              <div className="dp-section-header">
                <h2 className="dp-section-title">Strategy Comparison vs. Minimum Baseline</h2>
              </div>

              <div className="dp-table-card">
                <table className="dp-table dp-comparison-table">
                  <thead>
                    <tr>
                      <th scope="col">Strategy</th>
                      <th scope="col" className="dp-th-num">Time to Debt-Free</th>
                      <th scope="col" className="dp-th-num">Total Interest Paid</th>
                      <th scope="col" className="dp-th-num">Interest Saved</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.id} className={row.isSelected ? 'is-selected' : ''}>
                        <td><strong>{row.label}</strong></td>
                        <td className="dp-td-num fs-num">{row.months} months</td>
                        <td className="dp-td-num fs-num">{row.interestPaid}</td>
                        <td className="dp-td-num fs-num">{row.interestSaved}</td>
                        <td>
                          {row.isSelected ? (
                            <Badge tone="neutral">{row.status}</Badge>
                          ) : (
                            row.status
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dp-mobile-cards" data-testid="dp-comparison-mobile-cards">
                {comparisonRows.map((row) => {
                  const isExpanded = expandedCompKeys.has(row.id);
                  return (
                    <article key={row.id} className="dp-mobile-card">
                      <div className="dp-mobile-card-summary">
                        <div className="dp-mobile-card-main">
                          <span className="dp-mobile-card-title">{row.label}</span>
                          {row.isSelected ? (
                            <Badge tone="neutral">{row.status}</Badge>
                          ) : (
                            <span className="dp-mobile-card-sub">{row.status}</span>
                          )}
                        </div>
                        <div className="dp-mobile-card-val fs-num">{row.months} mos</div>
                      </div>

                      <button
                        type="button"
                        className="dp-mobile-expand-btn"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} comparison details for ${row.label}`}
                        onClick={() => toggleKey(setExpandedCompKeys, row.id)}
                      >
                        <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                        {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                      </button>

                      {isExpanded && (
                        <div className="dp-mobile-details">
                          <div className="dp-mobile-detail-item">
                            <span className="dp-mobile-detail-label">Total Interest Paid</span>
                            <span className="dp-mobile-detail-value fs-num">{row.interestPaid}</span>
                          </div>
                          <div className="dp-mobile-detail-item">
                            <span className="dp-mobile-detail-label">Interest Saved</span>
                            <span className="dp-mobile-detail-value fs-num">{row.interestSaved}</span>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="dp-section-footer">
                <ProtectedAction tooltip="View-only access">
                  <button
                    type="button"
                    className="fs-btn fs-btn-primary dp-action-btn"
                    onClick={handleSaveActivePlan}
                    disabled={isSaving}
                  >
                    <FaBookmark aria-hidden="true" /> {isSaving ? 'Saving...' : 'Save As Active Plan'}
                  </button>
                </ProtectedAction>
              </div>
            </section>
          )}

          {/* Month-by-Month Schedule Accordion */}
          <section className="dp-section" aria-label="Month-by-Month Payment Schedule">
            <div className="dp-section-header">
              <h2 className="dp-section-title">Month-by-Month Payment Schedule</h2>
              <button
                type="button"
                className="fs-btn fs-btn-secondary dp-action-btn"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                {showSchedule ? 'Hide Schedule' : `Show All ${planResult.monthsToPayoff} Months`}
              </button>
            </div>

            {showSchedule && (
              <>
                <div className="dp-table-card">
                  <table className="dp-table">
                    <thead>
                      <tr>
                        <th scope="col">Month #</th>
                        <th scope="col">Card</th>
                        <th scope="col" className="dp-th-num">Monthly Payment</th>
                        <th scope="col" className="dp-th-num">Interest Charged</th>
                        <th scope="col" className="dp-th-num">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planResult.schedule.map((s, idx) => (
                        <tr key={idx}>
                          <td className="fs-num"><strong>Month {s.month}</strong></td>
                          <td>{s.cardName || 'Card'}</td>
                          <td className="dp-td-num fs-num">{formatCurrency(s.paymentInPiastres / 100)}</td>
                          <td className="dp-td-num fs-num">{formatCurrency(s.interestChargedInPiastres / 100)}</td>
                          <td className="dp-td-num fs-num">{formatCurrency(s.remainingBalanceInPiastres / 100)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="dp-mobile-cards" data-testid="dp-schedule-mobile-cards">
                  {planResult.schedule.map((s, idx) => {
                    const key = `sched-${idx}`;
                    const isExpanded = expandedSchedKeys.has(key);
                    return (
                      <article key={key} className="dp-mobile-card">
                        <div className="dp-mobile-card-summary">
                          <div className="dp-mobile-card-main">
                            <span className="dp-mobile-card-title fs-num">Month {s.month}</span>
                            <span className="dp-mobile-card-sub">{s.cardName || 'Card'}</span>
                          </div>
                          <div className="dp-mobile-card-val fs-num">
                            {formatCurrency(s.paymentInPiastres / 100)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="dp-mobile-expand-btn"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} schedule details for Month ${s.month}`}
                          onClick={() => toggleKey(setExpandedSchedKeys, key)}
                        >
                          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                          {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                        </button>

                        {isExpanded && (
                          <div className="dp-mobile-details">
                            <div className="dp-mobile-detail-item">
                              <span className="dp-mobile-detail-label">Interest Charged</span>
                              <span className="dp-mobile-detail-value fs-num">
                                {formatCurrency(s.interestChargedInPiastres / 100)}
                              </span>
                            </div>
                            <div className="dp-mobile-detail-item">
                              <span className="dp-mobile-detail-label">Remaining Balance</span>
                              <span className="dp-mobile-detail-value fs-num">
                                {formatCurrency(s.remainingBalanceInPiastres / 100)}
                              </span>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default DebtPayoffPage;
