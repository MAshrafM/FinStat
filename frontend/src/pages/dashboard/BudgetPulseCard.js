// frontend/src/pages/dashboard/BudgetPulseCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBullseye } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const BudgetPulseCard = ({ budgetProgressList = [], monthLabel = '' }) => {
  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div className="dash-panel-title">
          <span className="dash-panel-icon tone-violet">
            <FaBullseye aria-hidden="true" />
          </span>
          <div>
            <h2>Budget pulse</h2>
            <p>{monthLabel} · spending against category limits.</p>
          </div>
        </div>
        <Link to="/expenditures/budgets" className="dash-text-btn">
          Manage <FaArrowRight aria-hidden="true" />
        </Link>
      </div>

      {budgetProgressList.length > 0 ? (
        <div className="dash-budget-list">
          {budgetProgressList.map((budget) => {
            const barColor =
              budget.alertStatus === 'red'
                ? '#f87171'
                : budget.alertStatus === 'yellow'
                ? '#fbbf24'
                : '#34d399';
            return (
              <div key={budget.budgetId} className="dash-budget-item">
                <div className="dash-budget-top">
                  <strong>{budget.category}</strong>
                  <span style={{ color: barColor }}>{Math.round(budget.percentageUsed)}%</span>
                </div>
                <div className="dash-budget-track">
                  <span
                    style={{
                      width: `${Math.min(100, budget.percentageUsed)}%`,
                      background: barColor,
                    }}
                  />
                </div>
                <div className="dash-budget-bottom">
                  <span>{formatCurrency(budget.spentAmount)} spent</span>
                  <span>{formatCurrency(budget.budgetedAmount)} limit</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dash-empty compact">
          <FaBullseye aria-hidden="true" />
          <h3>No budgets for {monthLabel}</h3>
          <p>Create a category budget to track your monthly spending.</p>
          <Link to="/expenditures/budgets" className="dash-btn dash-btn-ghost">
            Set up budgets
          </Link>
        </div>
      )}
    </section>
  );
};

export default React.memo(BudgetPulseCard);
