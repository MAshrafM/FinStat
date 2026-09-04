// frontend/src/pages/taxes/TaxesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { getBrackets } from '../../services/taxService';
import { getPaychecks } from '../../services/paycheckService';
import YearlyTaxTable from './YearlyTaxTable';
import './TaxesPage.css';

const TaxesPage = () => {
  const currentYear = new Date().getFullYear();
  const [taxInfo, setTaxInfo] = useState({ brackets: [], year: currentYear });
  const [paychecks, setPaychecks] = useState([]);
  const [processedData, setProcessedData] = useState({});

  const processTaxData = useCallback((paycheckList, activeTaxInfo, allYearConfigs) => {
    if (!paycheckList || paycheckList.length === 0) return;

    // Group paychecks by year
    const paychecksByYear = paycheckList.reduce((acc, p) => {
      const year = p.month ? p.month.substring(0, 4) : String(currentYear);
      (acc[year] = acc[year] || []).push(p);
      return acc;
    }, {});

    const allProcessedData = {};

    for (const year in paychecksByYear) {
      // Find matching tax bracket config for this year, fallback to active current taxInfo
      const yearConfig =
        allYearConfigs.find((c) => String(c.year) === String(year) && c.isActive !== false) ||
        allYearConfigs.find((c) => String(c.year) === String(year)) ||
        activeTaxInfo;

      const bracketsToUse = yearConfig && yearConfig.brackets && yearConfig.brackets.length > 0
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
      const sortedPaychecks = paychecksByYear[year].sort((a, b) => a.month.localeCompare(b.month));

      const processedPaychecks = sortedPaychecks.map((p) => {
        cumulativeGross += p.grossAmount || 0;

        // Match cumulative gross against sorted tax brackets
        const currentBracket = sortedBrackets.find((b, idx) => {
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

      allProcessedData[year] = {
        paychecks: processedPaychecks,
        summary: yearlySummary,
        brackets: sortedBrackets,
      };
    }

    // Calculate Rate of Change
    for (const year in allProcessedData) {
      const previousYear = String(Number(year) - 1);
      if (allProcessedData[previousYear]) {
        const currentTotal = allProcessedData[year].summary.taxDeduction;
        const previousTotal = allProcessedData[previousYear].summary.taxDeduction;
        if (previousTotal > 0) {
          allProcessedData[year].summary.rateOfChange = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else {
          allProcessedData[year].summary.rateOfChange = 0;
        }
      } else {
        allProcessedData[year].summary.rateOfChange = 0;
      }
    }

    setProcessedData(allProcessedData);
  }, [currentYear]);

  useEffect(() => {
    Promise.all([
      getBrackets(currentYear),
      getBrackets({ all: true }),
      getPaychecks(),
    ])
      .then(([currentTaxData, allTaxData, paycheckData]) => {
        const resolvedCurrent = currentTaxData || { brackets: [], year: currentYear };
        setTaxInfo(resolvedCurrent);
        setPaychecks(paycheckData || []);

        processTaxData(paycheckData || [], resolvedCurrent, Array.isArray(allTaxData) ? allTaxData : [resolvedCurrent]);
      })
      .catch((err) => console.error('Failed to load page data:', err));
  }, [currentYear, processTaxData]);

  const grandTotals = paychecks.reduce(
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

  const getColorForRate = (rate) => {
    const num = Number(rate) || 0;
    const normalized = num > 1 ? num / 100 : num; // 0 to 0.3
    const hue = Math.max(0, 120 - normalized * 3.5 * 120);
    return `hsl(${hue}, 70%, 94%)`;
  };

  const sortedYears = Object.keys(processedData).sort((a, b) => b - a);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tax Information</h1>
      </div>

      <div className="top-summary-container">
        {/* Grand Summary Card */}
        <div className="tax-card grand-summary-card">
          <h3>Grand Totals (All Time)</h3>
          <div className="yearly-summary-grid">
            <div className="summary-item">
              <span>Sum of Tax Ded.</span>
              <strong>{formatCurrency(grandTotals.sumOfTaxDeductions)}</strong>
            </div>
            <div className="summary-item highlight">
              <span>Sum of All Ded.</span>
              <strong>{formatCurrency(grandTotals.sumOfAllDeductions)}</strong>
            </div>
            <div className="summary-item highlight">
              <span>Sum of Gross (All)</span>
              <strong>{formatCurrency(grandTotals.sumOfGrossAll)}</strong>
            </div>
            <div className="summary-item highlight">
              <span>Sum of Net (All)</span>
              <strong>{formatCurrency(grandTotals.sumOfNetAll)}</strong>
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
      {sortedYears.map((year) => (
        <YearlyTaxTable
          key={year}
          year={year}
          processedPaychecks={processedData[year].paychecks}
          yearlySummary={processedData[year].summary}
          taxBrackets={processedData[year].brackets || taxInfo.brackets}
        />
      ))}
    </div>
  );
};

export default TaxesPage;
