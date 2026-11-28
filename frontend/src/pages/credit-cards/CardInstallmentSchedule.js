// frontend/src/pages/credit-cards/CardInstallmentSchedule.js
import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/ui/Badge';

const getIsMobile = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 768px)').matches;

const computeInstallmentRow = (inst) => {
  const totalInPiastres = inst.amountInPiastres ?? (inst.amount != null ? Math.round(inst.amount * 100) : 0);
  const paidInPiastres = inst.paidAmountInPiastres ?? (inst.paidAmount != null ? Math.round(inst.paidAmount * 100) : 0);
  const totalMonths = inst.installmentDetails?.months || 1;
  const monthlyInPiastres = inst.installmentDetails?.monthlyPrincipalInPiastres ??
    (inst.installmentDetails?.monthlyPrincipal != null
      ? Math.round(inst.installmentDetails.monthlyPrincipal * 100)
      : Math.floor(totalInPiastres / totalMonths));

  const remainingPrincipalInPiastres = Math.max(0, totalInPiastres - paidInPiastres);
  const remainingPrincipal = remainingPrincipalInPiastres / 100;
  const monthsPaid = monthlyInPiastres > 0
    ? Math.min(totalMonths, Math.floor(paidInPiastres / monthlyInPiastres))
    : 0;
  const remainingMonths = Math.max(0, totalMonths - monthsPaid);
  const cyclePaidInPiastres = inst.installmentDetails?.cyclePaidInPiastres ?? 0;
  const isCycleSatisfied = cyclePaidInPiastres >= monthlyInPiastres && monthlyInPiastres > 0;

  let projectedDateStr = '—';
  if (inst.date && remainingMonths > 0) {
    const startDate = new Date(inst.date);
    const compDate = new Date(startDate.getFullYear(), startDate.getMonth() + totalMonths, startDate.getDate());
    projectedDateStr = formatDate(compDate);
  } else if (remainingMonths === 0) {
    projectedDateStr = 'Completed';
  }

  return {
    totalInPiastres,
    paidInPiastres,
    monthlyInPiastres,
    remainingPrincipal,
    remainingMonths,
    isCycleSatisfied,
    projectedDateStr,
  };
};

const CardInstallmentSchedule = ({ installments = [] }) => {
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const toggleExpand = (key) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (!installments || installments.length === 0) {
    return (
      <section className="cc-section" aria-label="Active Installment Plans">
        <div className="cc-empty-card">
          <h3>Active Installment Plans</h3>
          <p>
            No active installment plans on this card. Convert large purchases to 0% installments to smooth cash flows.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="cc-section" aria-label="Active Installment Plans">
      <div className="cc-section-header">
        <h2 className="cc-section-title">Active Installment Plans</h2>
        <Badge tone="neutral">
          {installments.length} {installments.length === 1 ? 'Plan' : 'Plans'} Active
        </Badge>
      </div>

      {/* Desktop / Tablet Table (Waiver W-9A-1 > 768px) or Mobile D19 Cards (<= 768px) */}
      {!isMobile ? (
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th scope="col">Description</th>
                <th scope="col" className="cc-th-num">Total Value</th>
                <th scope="col" className="cc-th-num">Paid So Far</th>
                <th scope="col" className="cc-th-num">Monthly Due</th>
                <th scope="col" className="cc-th-num">Remaining</th>
                <th scope="col" className="cc-th-num">Remaining Principal</th>
                <th scope="col">Completion</th>
                <th scope="col">Cycle Status</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((inst, index) => {
                const row = computeInstallmentRow(inst);
                return (
                  <tr key={inst._id || index}>
                    <td>
                      <div className="cc-mobile-card-title">
                        {inst.description || inst.merchant || 'Installment Purchase'}
                      </div>
                      {inst.date && (
                        <div className="cc-cell-sub">Started {formatDate(inst.date)}</div>
                      )}
                    </td>
                    <td className="cc-td-num fs-num">{formatCurrency(row.totalInPiastres / 100)}</td>
                    <td className="cc-td-num fs-num">{formatCurrency(row.paidInPiastres / 100)}</td>
                    <td className="cc-td-num fs-num">{formatCurrency(row.monthlyInPiastres / 100)}</td>
                    <td className="cc-td-num fs-num">{row.remainingMonths} mos</td>
                    <td className="cc-td-num fs-num">{formatCurrency(row.remainingPrincipal)}</td>
                    <td>{row.projectedDateStr}</td>
                    <td>
                      <Badge tone="neutral">
                        {row.isCycleSatisfied ? 'Cycle Paid' : 'Due This Cycle'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cc-mobile-cards" data-testid="cc-installments-mobile-cards">
          {installments.map((inst, index) => {
            const key = inst._id || `inst-${index}`;
            const row = computeInstallmentRow(inst);
            const isExpanded = expandedIds.has(key);
            const label = inst.description || inst.merchant || 'Installment Purchase';

            return (
              <article key={key} className="cc-mobile-card">
                <div className="cc-mobile-card-summary">
                  <div className="cc-mobile-card-main">
                    <span className="cc-mobile-card-title">{label}</span>
                    <Badge tone="neutral">
                      {row.isCycleSatisfied ? 'Cycle Paid' : 'Due This Cycle'}
                    </Badge>
                  </div>
                  <div className="cc-mobile-card-val">
                    <div className="cc-mobile-card-title fs-num">{formatCurrency(row.remainingPrincipal)}</div>
                    <div className="cc-cell-sub fs-num">{row.remainingMonths} mos left</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="cc-mobile-expand-btn"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Hide' : 'Show'} installment details for ${label}`}
                  onClick={() => toggleExpand(key)}
                >
                  <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                  {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                </button>

                {isExpanded && (
                  <div className="cc-mobile-details">
                    <div className="cc-mobile-detail-item">
                      <span className="cc-mobile-detail-label">Total Value</span>
                      <span className="cc-mobile-detail-value fs-num">
                        {formatCurrency(row.totalInPiastres / 100)}
                      </span>
                    </div>
                    <div className="cc-mobile-detail-item">
                      <span className="cc-mobile-detail-label">Paid So Far</span>
                      <span className="cc-mobile-detail-value fs-num">
                        {formatCurrency(row.paidInPiastres / 100)}
                      </span>
                    </div>
                    <div className="cc-mobile-detail-item">
                      <span className="cc-mobile-detail-label">Monthly Due</span>
                      <span className="cc-mobile-detail-value fs-num">
                        {formatCurrency(row.monthlyInPiastres / 100)}
                      </span>
                    </div>
                    <div className="cc-mobile-detail-item">
                      <span className="cc-mobile-detail-label">Completion</span>
                      <span className="cc-mobile-detail-value">{row.projectedDateStr}</span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CardInstallmentSchedule;
