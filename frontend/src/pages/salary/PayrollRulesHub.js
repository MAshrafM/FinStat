// frontend/src/pages/salary/PayrollRulesHub.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaSlidersH } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';
import { getBrackets } from '../../services/taxService';
import { getPaychecks } from '../../services/paycheckService';
import { getRecords } from '../../services/socialInsuranceService';
import YearlyTaxTable from '../taxes/YearlyTaxTable';
import SummaryRow from '../../components/SummaryRow';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import '../taxes/TaxesPage.css';
import './SalaryProfile.css';

const RULES_TABS = [
  { id: 'taxes', label: 'Income Tax Brackets' },
  { id: 'insurance', label: 'Social Insurance Rules' },
];

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
    <div className="fs-page payroll-rules-page">
      <PageHeader
        title="Payroll & Statutory Rules"
        subtitle="Consolidated statutory rules, income tax bracket progressions, and social insurance obligations."
        actions={
          <Button
            as={Link}
            to="/salary/simulator"
            variant="secondary"
            icon={<FaSlidersH />}
          >
            Tax &amp; Salary Simulator
          </Button>
        }
      />

      <div className="rules-tabs-container" role="region" aria-label="Payroll Rules Sections">
        <Tabs
          tabs={RULES_TABS}
          activeTab={activeTab}
          onChange={handleTabChange}
          ariaLabel="Payroll Rules Sections"
        />
      </div>

      {isLoading ? (
        <Loading variant="card" text="Loading payroll rules..." />
      ) : activeTab === 'taxes' ? (
        /* TAXES TAB CONTENT */
        <div data-testid="taxes-tab-panel" className="taxes-tab-content">
          <div className="top-summary-container">
            {/* Grand Summary Card */}
            <div className="tax-card grand-summary-card fs-card">
              <h2 className="summary-card-title">Grand Totals (All Time)</h2>
              <div className="yearly-summary-grid">
                <div className="summary-item">
                  <span>Sum of Tax Ded.</span>
                  <strong className="fs-num">{formatCurrency(grandTaxTotals.sumOfTaxDeductions)}</strong>
                </div>
                <div className="summary-item highlight">
                  <span>Sum of All Ded.</span>
                  <strong className="fs-num">{formatCurrency(grandTaxTotals.sumOfAllDeductions)}</strong>
                </div>
                <div className="summary-item highlight">
                  <span>Sum of Gross (All)</span>
                  <strong className="fs-num">{formatCurrency(grandTaxTotals.sumOfGrossAll)}</strong>
                </div>
                <div className="summary-item highlight">
                  <span>Sum of Net (All)</span>
                  <strong className="fs-num">{formatCurrency(grandTaxTotals.sumOfNetAll)}</strong>
                </div>
              </div>
            </div>

            {/* Current Active Tax Brackets Card */}
            <div className="tax-card active-brackets-card fs-card">
              <div className="tax-card-header">
                <h2 className="tax-card-title">Current Tax Brackets ({taxInfo.year || currentYear})</h2>
                <Badge
                  tone="neutral"
                  label={taxInfo.isActive !== false ? 'Active' : 'Inactive'}
                >
                  {taxInfo.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="tax-exemption-note">
                Personal Exemption:{' '}
                <strong className="fs-num">
                  {Number(taxInfo.personalExemption || 0).toLocaleString()} EGP / yr
                </strong>
                {taxInfo.country && <span> • {taxInfo.country}</span>}
              </p>

              <div className="table-responsive-container">
                <table className="styled-table custom-component-table">
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
                        <tr key={bracket.level || idx}>
                          <td data-label="Level">Level {bracket.level || idx + 1}</td>
                          <td data-label="From" className="fs-num">{formatCurrency(bracket.from)}</td>
                          <td data-label="To" className="fs-num">{isInfinity ? '∞' : formatCurrency(bracket.to)}</td>
                          <td data-label="Rate" className="fs-num">{ratePercent}%</td>
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
        <div data-testid="insurance-tab-panel" className="insurance-tab-content">
          {insuranceRecords.length > 0 && (
            <SummaryRow
              grandTotal={totalInsurancePaid}
              grandTotalTitle="Total Insurance Paid to Date"
              periodDetails={yearlyBurdenDetails}
              periodTitle="Yearly Burden & Rate of Change"
            />
          )}

          {/* Display Cards */}
          <div className="salary-profiles-grid profile-grid insurance-grid">
            {insuranceRecords.map((record) => (
              <div key={record.year} className="salary-profile-card profile-card fs-card">
                <div className="card-header">
                  <h2 className="profile-card-name">{record.year}</h2>
                </div>
                <div className="card-body">
                  <ul className="salary-breakdown-list">
                    <li>
                      <span>Registered Income:</span>
                      <strong className="fs-num">{formatCurrency(record.registeredIncome)}</strong>
                    </li>
                    <li>
                      <span>Yearly Income:</span>
                      <strong className="fs-num">{formatCurrency(record.yearlyIncome)}</strong>
                    </li>
                    <li>
                      <span>Individual Share:</span>
                      <strong className="fs-num">{Number(record.individualShare * 100).toFixed(1)}%</strong>
                    </li>
                    <li>
                      <span>Yearly Burden:</span>
                      <strong className="fs-num">{formatCurrency(record.burden)}</strong>
                    </li>
                    <li className="insurance-remaining-item">
                      <span>Remaining Burden:</span>
                      <strong className="fs-num">{formatCurrency(calculateRemaining(record))}</strong>
                    </li>
                  </ul>
                  <h4 className="card-section-title">Monthly Deductions:</h4>
                  <ul className="salary-breakdown-list">
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
                          <strong className="fs-num">{formatCurrency(p.insuranceDeduction)}</strong>
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
