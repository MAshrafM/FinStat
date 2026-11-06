// frontend/src/pages/salary/TaxSimulator.js
import React, { useState, useEffect, useCallback } from 'react';
import { simulateSalary } from '../../services/taxService';
import './TaxSimulator.css';

const PRESET_SALARIES = [10000, 25000, 40000, 60000, 100000, 150000];

const TaxSimulator = () => {
  const [grossSalary, setGrossSalary] = useState(35000);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showEmployerCost, setShowEmployerCost] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [error, setError] = useState(null);

  // Run simulation calculation
  const runSimulation = useCallback(async (salaryAmount) => {
    if (!salaryAmount || salaryAmount <= 0) return;
    try {
      setError(null);
      const res = await simulateSalary({
        grossSalary: Number(salaryAmount),
        year: new Date().getFullYear(),
      });
      setSimulation(res.data || res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Simulation error');
    }
  }, []);

  // Debounced execution when slider moves
  useEffect(() => {
    const handler = setTimeout(() => {
      runSimulation(grossSalary);
    }, 150);
    return () => clearTimeout(handler);
  }, [grossSalary, runSimulation]);

  const handleSliderChange = (e) => {
    setGrossSalary(Number(e.target.value));
  };

  const handleInputChange = (e) => {
    const val = Number(e.target.value);
    setGrossSalary(isNaN(val) ? 0 : val);
  };

  const handlePresetClick = (amount) => {
    setGrossSalary(amount);
  };

  const monthly = simulation?.monthly || {};
  const annual = simulation?.annual || {};
  const deductions = simulation?.deductions || {};
  const displayData = isAnnual ? annual : monthly;

  return (
    <div className="tax-simulator-container">
      {/* Header */}
      <div className="tax-sim-header">
        <div>
          <h2>Interactive Egyptian Statutory Tax & Salary Modeler</h2>
          <p className="tax-sim-subtitle">
            Simulate gross-to-net pay, progressive Law 175/2023 brackets, and Law 148/2019 insurance in real time
          </p>
        </div>
        {simulation?.appliedYear && (
          <div className="statutory-badge-wrapper">
            <span className="statutory-year-badge">
              Using {simulation.appliedYear} Statutory Rules
            </span>
            {simulation.isFallbackConfig && (
              <span className="statutory-fallback-badge">Embedded Fallback</span>
            )}
          </div>
        )}
      </div>

      {/* Main Interactive Controls Card */}
      <div className="tax-controls-card">
        <div className="controls-top-row">
          <label htmlFor="gross-salary-input" className="control-label">
            Monthly Gross Salary (EGP)
          </label>
          <div className="view-mode-toggle" role="group" aria-label="View Mode Toggle">
            <button
              type="button"
              className={`view-toggle-btn ${!isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly View
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(true)}
            >
              Annual View
            </button>
          </div>
        </div>

        {/* Numeric Input & Presets */}
        <div className="salary-input-row">
          <div className="currency-input-wrapper">
            <span className="currency-prefix">EGP</span>
            <input
              id="gross-salary-input"
              type="number"
              min="0"
              max="1000000"
              step="500"
              className="salary-number-input"
              value={grossSalary || ''}
              onChange={handleInputChange}
              aria-label="Gross Salary Input"
            />
          </div>

          <div className="presets-group" role="group" aria-label="Quick Presets">
            {PRESET_SALARIES.map((p) => (
              <button
                key={p}
                type="button"
                className={`preset-pill ${grossSalary === p ? 'active' : ''}`}
                onClick={() => handlePresetClick(p)}
              >
                {(p / 1000)}k
              </button>
            ))}
          </div>
        </div>

        {/* Range Slider */}
        <div className="slider-wrapper">
          <input
            type="range"
            min="3000"
            max="200000"
            step="500"
            value={grossSalary}
            onChange={handleSliderChange}
            className="salary-range-slider"
            aria-label="Gross Salary Slider"
          />
          <div className="slider-ticks">
            <span>3k</span>
            <span>50k</span>
            <span>100k</span>
            <span>150k</span>
            <span>200k</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="tax-sim-error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="tax-kpi-grid">
        {/* Net Take-Home Pay */}
        <div className="tax-kpi-card highlight-takehome">
          <span className="kpi-label">Net Take-Home Pay</span>
          <div className="kpi-value text-green">
            EGP {Number(displayData.netPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="kpi-sub">
            {simulation?.netToGrossRatio || 0}% of gross earnings
          </span>
        </div>

        {/* Gross Salary */}
        <div className="tax-kpi-card">
          <span className="kpi-label">Gross Salary ({isAnnual ? 'Annual' : 'Monthly'})</span>
          <div className="kpi-value">
            EGP {Number(displayData.grossSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="kpi-sub">
            {isAnnual ? `EGP ${(monthly.grossSalary || 0).toLocaleString()} / mo` : `EGP ${(annual.grossSalary || 0).toLocaleString()} / yr`}
          </span>
        </div>

        {/* Effective Tax Rate */}
        <div className="tax-kpi-card">
          <span className="kpi-label">Effective Tax Rate</span>
          <div className="kpi-value">
            {simulation?.effectiveTaxRate || 0}%
          </div>
          <span className="kpi-sub">
            Top marginal rate: {simulation?.marginalTaxRate || 0}%
          </span>
        </div>

        {/* Total Deductions */}
        <div className="tax-kpi-card highlight-deductions">
          <span className="kpi-label">Total Deductions</span>
          <div className="kpi-value text-red">
            EGP {Number(displayData.totalDeductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="kpi-sub">
            Tax + Social Insurance + Martyrs Fund
          </span>
        </div>
      </div>

      {/* Progressive Tax Slices Meter */}
      {simulation?.bracketSlices && simulation.bracketSlices.length > 0 && (
        <div className="bracket-slices-card">
          <div className="bracket-card-head">
            <h3>Law 175/2023 Progressive Tax Bracket Breakdown</h3>
            <span className="bracket-head-note">Slices annual taxable base across statutory tiers</span>
          </div>

          <div className="bracket-table-wrapper">
            <table className="bracket-breakdown-table">
              <thead>
                <tr>
                  <th>Tier Level</th>
                  <th>Annual Bracket Range</th>
                  <th>Statutory Rate</th>
                  <th>Taxable Base Sliced</th>
                  <th>Annual Tax Generated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {simulation.bracketSlices.map((slice) => (
                  <tr key={slice.level} className={slice.isMatched ? 'slice-matched' : 'slice-unmatched'}>
                    <td>Level {slice.level}</td>
                    <td>{slice.bracket}</td>
                    <td>{slice.rate}%</td>
                    <td>
                      EGP {Number(slice.taxableAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      EGP {Number(slice.tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`slice-status-badge ${slice.isMatched ? 'active' : 'inactive'}`}>
                        {slice.isMatched ? 'Active Tier' : 'Unreached'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statutory Deductions Waterfall Table */}
      <div className="waterfall-card">
        <div className="waterfall-card-head">
          <h3>Statutory Deductions Waterfall</h3>
          <span className="waterfall-head-note">Calculation order under Egyptian Law 175/2023 & Law 148/2019</span>
        </div>

        <div className="waterfall-table-wrapper">
          <table className="waterfall-table">
            <thead>
              <tr>
                <th>Step / Line Item</th>
                <th>Statutory Law Basis</th>
                <th>Monthly (EGP)</th>
                <th>Annual (EGP)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Gross Salary</strong></td>
                <td>Employment Contract</td>
                <td>EGP {Number(monthly.grossSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>EGP {Number(annual.grossSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="deduction-row">
                <td>2. (-) Social Insurance (Employee 11%)</td>
                <td>
                  Law 148/2019 (Capped at EGP {Number(deductions?.socialInsurance?.maxCap || 12600).toLocaleString()})
                  {deductions?.socialInsurance?.isCapped && <span className="cap-tag">Capped</span>}
                </td>
                <td className="text-red">- EGP {Number(monthly.employeeSI || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-red">- EGP {Number(annual.employeeSI || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="exemption-row">
                <td>3. (-) Personal Exemption</td>
                <td>Law 175/2023 (EGP 20,000 / year)</td>
                <td>- EGP {Number(deductions?.personalExemption?.monthly || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>- EGP {Number(deductions?.personalExemption?.annual || 20000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="subtotal-row">
                <td><strong>(=) Net Annual Taxable Base</strong></td>
                <td>Gross - SI - Personal Exemption</td>
                <td>EGP {Number(monthly.netTaxableBase || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td><strong>EGP {Number(annual.netTaxableBase || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
              <tr className="deduction-row">
                <td>4. (-) Progressive Income Tax</td>
                <td>Law 175/2023 Sliced Brackets (Effective: {simulation?.effectiveTaxRate || 0}%)</td>
                <td className="text-red">- EGP {Number(monthly.incomeTax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-red">- EGP {Number(annual.incomeTax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="deduction-row">
                <td>5. (-) Martyrs Families Fund</td>
                <td>Law 4/2021 (0.05% of gross wage)</td>
                <td className="text-red">- EGP {Number(monthly.martyrsFund || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="text-red">- EGP {Number(annual.martyrsFund || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="final-net-row">
                <td><strong>(=) Net Take-Home Pay</strong></td>
                <td>Take-home earnings ({simulation?.netToGrossRatio || 0}%)</td>
                <td className="text-green">
                  <strong>EGP {Number(monthly.netPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="text-green">
                  <strong>EGP {Number(annual.netPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Employer Cost Section Toggle */}
      <div className="employer-cost-card">
        <button
          type="button"
          className="employer-cost-toggle-btn"
          onClick={() => setShowEmployerCost(!showEmployerCost)}
        >
          <span>{showEmployerCost ? 'Hide' : 'Show'} Employer Total Employment Cost (Law 148/2019)</span>
          <span className="toggle-indicator">{showEmployerCost ? '▲' : '▼'}</span>
        </button>

        {showEmployerCost && (
          <div className="employer-cost-content">
            <div className="employer-cost-grid">
              <div className="cost-item">
                <span className="cost-label">Employee Gross Salary</span>
                <span className="cost-value">EGP {Number(monthly.grossSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Employer Social Insurance (18.75%)</span>
                <span className="cost-value text-red">+ EGP {Number(monthly.employerSI || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="cost-item highlight">
                <span className="cost-label">Total Cost to Company</span>
                <span className="cost-value text-white">EGP {Number(monthly.totalEmployerCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <p className="employer-cost-note">
              Employer contributes 18.75% of the insurable wage base up to statutory ceiling (EGP {Number(deductions?.socialInsurance?.maxCap || 12600).toLocaleString()}).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxSimulator;
