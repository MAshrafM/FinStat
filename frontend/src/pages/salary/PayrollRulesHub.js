// frontend/src/pages/salary/PayrollRulesHub.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getBrackets } from '../../services/taxService';
import { getPaychecks } from '../../services/paycheckService';
import { getRecords } from '../../services/socialInsuranceService';
import YearlyTaxTable from '../taxes/YearlyTaxTable';
import SummaryRow from '../../components/SummaryRow';
import '../taxes/TaxesPage.css';
import './SalaryProfile.css';

const PayrollRulesHub = ({ initialTab }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Determine active tab: prop > URL param > default 'taxes'
  const urlTab = searchParams.get('tab');
  const resolvedTab = initialTab || (urlTab === 'insurance' ? 'insurance' : 'taxes');
  const [activeTab, setActiveTab] = useState(resolvedTab);

  // Synchronize state when URL or prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (urlTab === 'insurance' || urlTab === 'taxes') {
      setActiveTab(urlTab);
    }
  }, [initialTab, urlTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // State for Taxes & Insurance data
  const [taxInfo, setTaxInfo] = useState({ brackets: [], year: currentYear });
  const [insuranceRecords, setInsuranceRecords] = useState([]);
  const [paychecks, setPaychecks] = useState([]);
  const [processedTaxData, setProcessedTaxData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Process Tax Data for YearlyTaxTable
  const processTaxData = useCallback((paycheckList, activeTaxInfo, allYearConfigs) => {
    if (!paycheckList || paycheckList.length === 0) return;

    const paychecksByYear = paycheckList.reduce((acc, p) => {
      const year = p.month ? p.month.substring(0, 4) : String(currentYear);
      (acc[year] = acc[year] || []).push(p);
      return acc;
    }, {});

    const allProcessed = {};

    for (const year in paychecksByYear) {
      const yearConfig =
        allYearConfigs.find((c) => String(c.year) === String(year) && c.isActive !== false) ||
        allYearConfigs.find((c) => String(c.year) === String(year)) ||
        activeTaxInfo;

      const bracketsToUse =
        yearConfig && yearConfig.brackets && yearConfig.brackets.length > 0
          ? yearConfig.brackets
          : activeTaxInfo.brackets || [];

      const sortedBrackets = [...bracketsToUse].sort((a, b) => (Number(a.from) || 0) - (Number(b.from) || 0));

      const yearlySummary = paychecksByYear[year].reduce(
        (totals, p) => {
          totals.grossAmount += p.grossAmount || 0;
          totals.prepaid += p.type === 'Prepaid' ? p.amount || 0 : 0;
          totals.amount += p.type === 'Cash' ? p.amount || 0 : 0;
          totals.taxDeduction += p.taxDeduction || 0;
          totals.insuranceDeduction += p.insuranceDeduction || 0;
          return totals;
        },
        { grossAmount: 0, prepaid: 0, amount: 0, taxDeduction: 0, insuranceDeduction: 0 }
      );

      let cumulativeGross = 0;
      const sortedPaychecks = [...paychecksByYear[year]].sort((a, b) => a.month.localeCompare(b.month));

      const processedPaychecks = sortedPaychecks.map((p) => {
        cumulativeGross += p.grossAmount || 0;

        const currentBracket =
          sortedBrackets.find((b, idx) => {
            const isLast = idx === sortedBrackets.length - 1 || Number(b.to) >= 100000000;
            if (isLast) return cumulativeGross >= Number(b.from);
            return cumulativeGross >= Number(b.from) && cumulativeGross <= Number(b.to);
          }) || sortedBrackets[0];

        const rawRate = currentBracket ? Number(currentBracket.rate) : 0;
        const bracketRate = rawRate <= 1 && rawRate > 0 ? Number((rawRate * 100).toFixed(1)) : rawRate;
        const effectiveRate = p.grossAmount > 0 ? (p.taxDeduction / p.grossAmount) * 100 : 0;

        return {
          ...p,
          effectiveRate,
          bracketLevel: currentBracket ? currentBracket.level : null,
          bracketRate,
        };
      });

      allProcessed[year] = {
        paychecks: processedPaychecks,
        summary: yearlySummary,
        brackets: sortedBrackets,
      };
    }

    // Rate of Change across years
    for (const year in allProcessed) {
      const prevYear = String(Number(year) - 1);
      if (allProcessed[prevYear]) {
        const curTax = allProcessed[year].summary.taxDeduction;
        const prevTax = allProcessed[prevYear].summary.taxDeduction;
        allProcessed[year].summary.rateOfChange = prevTax > 0 ? ((curTax - prevTax) / prevTax) * 100 : 0;
      } else {
        allProcessed[year].summary.rateOfChange = 0;
      }
    }

    setProcessedTaxData(allProcessed);
  }, [currentYear]);

  // Load all rules data concurrently
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getBrackets(currentYear).catch(() => null),
      getBrackets({ all: true }).catch(() => []),
      getRecords().catch(() => []),
      getPaychecks().catch(() => []),
    ])
      .then(([currentTax, allTax, records, paycheckList]) => {
        const resolvedTax = currentTax || { brackets: [], year: currentYear };
        const safePaychecks = Array.isArray(paycheckList) ? paycheckList : [];
        const safeAllTax = Array.isArray(allTax) ? allTax : [resolvedTax];

        setTaxInfo(resolvedTax);
        setInsuranceRecords(Array.isArray(records) ? records : []);
        setPaychecks(safePaychecks);

        processTaxData(safePaychecks, resolvedTax, safeAllTax);
      })
      .catch((err) => {
        console.error('Failed to load payroll rules data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentYear, processTaxData]);

  // Grand totals calculation for Tax tab
  const grandTaxTotals = useMemo(() => {
    return paychecks.reduce(
      (totals, p) => {
        const prepaidAmount = p.type === 'Prepaid' ? p.amount || 0 : 0;
        totals.sumOfTaxDeductions += p.taxDeduction || 0;
        totals.sumOfAllDeductions += (p.taxDeduction || 0) + (p.insuranceDeduction || 0);
        totals.sumOfGrossAll += (p.grossAmount || 0) + prepaidAmount;
        totals.sumOfNetAll += p.amount || 0;
        return totals;
      },
      { sumOfTaxDeductions: 0, sumOfAllDeductions: 0, sumOfGrossAll: 0, sumOfNetAll: 0 }
    );
  }, [paychecks]);

  const getColorForRate = (rate) => {
    const num = Number(rate) || 0;
    const normalized = num > 1 ? num / 100 : num;
    const hue = Math.max(0, 120 - normalized * 3.5 * 120);
    return `hsl(${hue}, 70%, 94%)`;
  };

  const sortedTaxYears = Object.keys(processedTaxData).sort((a, b) => b - a);

  // Social insurance calculations
  const calculateRemaining = (record) => {
    const yearPaychecks = paychecks.filter((p) => p.month && p.month.startsWith(String(record.year)));
    const totalDeducted = yearPaychecks.reduce((sum, p) => sum + (p.insuranceDeduction || 0), 0);
    return (record.burden || 0) - totalDeducted;
  };

  const totalInsurancePaid = useMemo(() => {
    return paychecks.reduce((sum, p) => sum + (p.insuranceDeduction || 0), 0);
  }, [paychecks]);

  const yearlyBurdenDetails = useMemo(() => {
    return [...insuranceRecords]
      .sort((a, b) => b.year - a.year)
      .map((record) => ({
        key: record.year,
        value: record.burden,
      }));
  }, [insuranceRecords]);

  return (
    <div className="page-container">
      {/* Header with Tab Navigation */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Payroll &amp; Statutory Rules</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Consolidated statutory rules, income tax bracket progressions, and social insurance obligations.
          </p>
        </div>

        {/* Tab Buttons */}
        <div
          role="tablist"
          aria-label="Payroll Rules Sections"
          style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'taxes'}
            onClick={() => handleTabChange('taxes')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'taxes' ? '#6c5ce7' : 'transparent',
              color: activeTab === 'taxes' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📋 Income Tax Brackets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'insurance'}
            onClick={() => handleTabChange('insurance')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'insurance' ? '#6c5ce7' : 'transparent',
              color: activeTab === 'insurance' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🛡️ Social Insurance Rules
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Loading payroll rules...
        </div>
      ) : activeTab === 'taxes' ? (
        /* TAXES TAB CONTENT */
        <div data-testid="taxes-tab-panel">
          <div className="top-summary-container">
            {/* Grand Summary Card */}
            <div className="tax-card grand-summary-card">
              <h3>Grand Totals (All Time)</h3>
              <div className="yearly-summary-grid">
                <div className="summary-item">
                  <span>Sum of Tax Ded.</span>
                  <strong>{formatCurrency(grandTaxTotals.sumOfTaxDeductions)}</strong>
                </div>
                <div className="summary-item highlight">
                  <span>Sum of All Ded.</span>
                  <strong>{formatCurrency(grandTaxTotals.sumOfAllDeductions)}</strong>
                </div>
                <div className="summary-item highlight">
                  <span>Sum of Gross (All)</span>
                  <strong>{formatCurrency(grandTaxTotals.sumOfGrossAll)}</strong>
                </div>
                <div className="summary-item highlight">
                  <span>Sum of Net (All)</span>
                  <strong>{formatCurrency(grandTaxTotals.sumOfNetAll)}</strong>
                </div>
              </div>
            </div>

            {/* Current Active Tax Brackets Card */}
            <div className="tax-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>Current Tax Brackets ({taxInfo.year || currentYear})</h3>
                <span
                  style={{
                    backgroundColor: taxInfo.isActive !== false ? '#ecfdf5' : '#fffbeb',
                    color: taxInfo.isActive !== false ? '#047857' : '#b45309',
                    border: `1px solid ${taxInfo.isActive !== false ? '#a7f3d0' : '#fde68a'}`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {taxInfo.isActive !== false ? '🟢 Active' : '🟡 Inactive'}
                </span>
              </div>

              <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#64748b' }}>
                Personal Exemption:{' '}
                <strong style={{ color: '#0284c7' }}>
                  {Number(taxInfo.personalExemption || 0).toLocaleString()} EGP / yr
                </strong>
                {taxInfo.country && <span> • {taxInfo.country}</span>}
              </p>

              <div className="table-container">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(taxInfo.brackets || []).map((bracket, idx) => {
                      const rateVal = Number(bracket.rate) || 0;
                      const ratePercent = rateVal <= 1 && rateVal > 0 ? (rateVal * 100).toFixed(1) : rateVal;
                      const isInfinity = Number(bracket.to) >= 100000000;

                      return (
                        <tr key={bracket.level || idx} style={{ backgroundColor: getColorForRate(rateVal) }}>
                          <td data-label="Level">Level {bracket.level || idx + 1}</td>
                          <td data-label="From">{formatCurrency(bracket.from)}</td>
                          <td data-label="To">{isInfinity ? '∞' : formatCurrency(bracket.to)}</td>
                          <td data-label="Rate" style={{ fontWeight: 600 }}>{ratePercent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Yearly Tax Deduction Tables */}
          {sortedTaxYears.map((year) => (
            <YearlyTaxTable
              key={year}
              year={year}
              processedPaychecks={processedTaxData[year].paychecks}
              yearlySummary={processedTaxData[year].summary}
              taxBrackets={processedTaxData[year].brackets || taxInfo.brackets}
            />
          ))}
        </div>
      ) : (
        /* SOCIAL INSURANCE TAB CONTENT */
        <div data-testid="insurance-tab-panel">
          {insuranceRecords.length > 0 && (
            <SummaryRow
              grandTotal={totalInsurancePaid}
              grandTotalTitle="Total Insurance Paid to Date"
              periodDetails={yearlyBurdenDetails}
              periodTitle="Yearly Burden & Rate of Change"
            />
          )}

          {/* Display Cards */}
          <div className="profile-grid" style={{ marginTop: '1.5rem' }}>
            {insuranceRecords.map((record) => (
              <div key={record.year} className="profile-card">
                <div className="card-header">
                  <h3>{record.year}</h3>
                </div>
                <div className="card-body">
                  <ul>
                    <li>
                      <span>Registered Income:</span>
                      <strong>{formatCurrency(record.registeredIncome)}</strong>
                    </li>
                    <li>
                      <span>Yearly Income:</span>
                      <strong>{formatCurrency(record.yearlyIncome)}</strong>
                    </li>
                    <li>
                      <span>Individual Share:</span>
                      <strong>{Number(record.individualShare * 100).toFixed(1)}%</strong>
                    </li>
                    <li>
                      <span>Yearly Burden:</span>
                      <strong>{formatCurrency(record.burden)}</strong>
                    </li>
                    <li style={{ backgroundColor: 'rgba(241, 196, 15, 0.15)' }}>
                      <span>Remaining Burden:</span>
                      <strong>{formatCurrency(calculateRemaining(record))}</strong>
                    </li>
                  </ul>
                  <h4 style={{ marginTop: '1.5rem' }}>Monthly Deductions:</h4>
                  <ul>
                    {paychecks
                      .filter(
                        (p) =>
                          p.month &&
                          p.month.startsWith(String(record.year)) &&
                          (p.insuranceDeduction || 0) > 0
                      )
                      .map((p) => (
                        <li key={p._id}>
                          <span>{p.month}:</span>
                          <strong>{formatCurrency(p.insuranceDeduction)}</strong>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollRulesHub;

