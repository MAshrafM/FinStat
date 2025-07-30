// frontend/src/pages/taxes/TaxesPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { FaEdit } from 'react-icons/fa';
import { getBrackets } from '../../services/taxService';
import { getPaychecks } from '../../services/paycheckService';
import YearlyTaxTable from './YearlyTaxTable';
import './TaxesPage.css'; // We will create this CSS file


const TaxesPage = () => {
  const [taxInfo, setTaxInfo] = useState({ brackets: [] });
  const [paychecks, setPaychecks] = useState([]);
  const [processedData, setProcessedData] = useState({});

  useEffect(() => {
    Promise.all([
      getBrackets(),
      getPaychecks()
    ]).then(([taxData, paycheckData]) => {
      setTaxInfo(taxData);
      setPaychecks(paycheckData);
    }).catch(err => console.error("Failed to load page data:", err));
  }, []);

  useEffect(() => {
    if (paychecks.length === 0 || taxInfo.brackets.length === 0) return;

    // Group paychecks by year
    const paychecksByYear = paychecks.reduce((acc, p) => {
      const year = p.month.substring(0, 4);
      (acc[year] = acc[year] || []).push(p);
      return acc;
    }, {});

    const allProcessedData = {};

    // Process each year's data
    for (const year in paychecksByYear) {
      let cumulativeGross = 0;
      // Sort paychecks by month to ensure correct cumulative calculation
      const sortedPaychecks = paychecksByYear[year].sort((a, b) => a.month.localeCompare(b.month));

      allProcessedData[year] = sortedPaychecks.map(p => {
        cumulativeGross += p.grossAmount;

        // Find which tax bracket the cumulative gross falls into
        const currentBracket = taxInfo.brackets.find(
          b => cumulativeGross > b.from && cumulativeGross <= b.to
        );

        // Calculate effective tax rate for this specific paycheck
        const effectiveRate = p.grossAmount > 0 ? (p.taxDeduction / p.grossAmount) * 100 : 0;

        return {
          ...p,
          effectiveRate: effectiveRate,
          bracketLevel: currentBracket ? currentBracket.level : null,
        };
      });
    }
    setProcessedData(allProcessedData);
  }, [paychecks, taxInfo]);

  // Helper to get a color based on the rate
  const getColorForRate = (rate) => {
    const hue = 120 - (rate * 2 * 240); // Green (120) to Red (-120)
    return `hsl(${hue}, 70%, 90%)`; // Light pastel colors
  };

  // Define the sortedYears variable *before* the return statement.
  const sortedYears = Object.keys(processedData).sort((a, b) => b - a);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tax Information</h1>
        <Link to="/taxes/manage" className="nav-button">
          <FaEdit /> Manage Brackets
        </Link>
      </div>

      <div className="tax-card">
        <h3>Current Tax Brackets</h3>
        <p>Last Updated: {new Date(taxInfo.lastUpdated).toLocaleString()}</p>
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
              {taxInfo.brackets.map(bracket => (
                <tr key={bracket.level} style={{ backgroundColor: getColorForRate(bracket.rate) }}>
                  <td>{bracket.level}</td>
                  <td>{formatCurrency(bracket.from)}</td>
                  <td>{formatCurrency(bracket.to)}</td>
                  <td>{(bracket.rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* We can add another card here later to show yearly tax deduction summaries */}
      {sortedYears.map(year => (
        <YearlyTaxTable
          key={year}
          year={year}
          processedPaychecks={processedData[year]}
          taxBrackets={taxInfo.brackets}
        />
      ))}
    </div>
  );
};

export default TaxesPage;
