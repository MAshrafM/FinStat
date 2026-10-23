// frontend/src/pages/credit-cards/CardInstallmentSchedule.js
import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CardInstallmentSchedule = ({ installments = [] }) => {
  if (!installments || installments.length === 0) {
    return (
      <div className="card shadow-sm mt-4 p-4" style={{ backgroundColor: '#fcfcfc', border: '1px dashed #ced4da', borderRadius: '8px' }}>
        <h5 style={{ fontWeight: 600, color: '#495057', marginBottom: '8px' }}>Active Installment Plans</h5>
        <p className="text-muted mb-0" style={{ fontSize: '14px', color: '#6c757d' }}>
          No active installment plans on this card. Convert large purchases to 0% installments to smooth cash flows.
        </p>
      </div>
    );
  }

  return (
    <div className="card shadow-sm mt-4 p-4" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e9ecef' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 style={{ fontWeight: 600, color: '#2c3e50', margin: 0 }}>Active Installment Plans</h5>
        <span className="badge bg-primary" style={{ fontSize: '12px', padding: '5px 10px', background: '#3498db', color: '#fff', borderRadius: '4px' }}>
          {installments.length} {installments.length === 1 ? 'Plan' : 'Plans'} Active
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ width: '100%', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <tr>
              <th style={{ padding: '10px' }}>Description</th>
              <th style={{ padding: '10px' }}>Total Value</th>
              <th style={{ padding: '10px' }}>Paid So Far</th>
              <th style={{ padding: '10px' }}>Monthly Due</th>
              <th style={{ padding: '10px' }}>Remaining</th>
              <th style={{ padding: '10px' }}>Remaining Principal</th>
              <th style={{ padding: '10px' }}>Completion</th>
              <th style={{ padding: '10px' }}>Cycle Status</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((inst, index) => {
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

              return (
                <tr key={inst._id || index} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 500, color: '#333' }}>
                    {inst.description || inst.merchant || 'Installment Purchase'}
                    {inst.date && (
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        Started {formatDate(inst.date)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px' }}>{formatCurrency(totalInPiastres / 100)}</td>
                  <td style={{ padding: '12px 10px', color: '#27ae60' }}>{formatCurrency(paidInPiastres / 100)}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 500 }}>{formatCurrency(monthlyInPiastres / 100)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    {remainingMonths} mos
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 600, color: '#2c3e50' }}>
                    {formatCurrency(remainingPrincipal)}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#666' }}>{projectedDateStr}</td>
                  <td style={{ padding: '12px 10px' }}>
                    {isCycleSatisfied ? (
                      <span className="badge badge-success" style={{ backgroundColor: '#27ae60', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        Cycle Paid
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ backgroundColor: '#e67e22', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        Due This Cycle
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CardInstallmentSchedule;
