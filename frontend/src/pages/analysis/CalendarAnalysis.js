// frontend/src/pages/analysis/CalendarAnalysis.js
import React, { useState, useEffect } from 'react';
import { getPaychecks } from '../../services/paycheckService';
import SummaryRow from '../../components/SummaryRow';
import AnalysisCard from '../../components/AnalysisCard';

const CalendarAnalysis = () => {
  const [yearlyData, setYearlyData] = useState({});
  const [paychecks, setPaychecks] = useState({});

  useEffect(() => {
    getPaychecks().then(data => {
      setPaychecks(data);
    }).catch(err => console.error("Failed to load paychecks for analysis:", err));
  }, []);

  useEffect(() => {
    if (!Array.isArray(paychecks)) return;
    const groupedByYear = paychecks.reduce((acc, p) => {
      const year = p.month.substring(0, 4); // "2024-07" -> "2024"
      (acc[year] = acc[year] || []).push(p);
      return acc;
    }, {});
    setYearlyData(groupedByYear);
  }, [paychecks]);

  const years = Object.keys(yearlyData).sort((a, b) => b - a); // Sort years descending

  const grandTotal = years.reduce((sum, year) => sum + yearlyData[year].reduce((s, p) => s + p.amount, 0), 0);
  const periodDetails = years.map(year => ({
    key: year,
    value: yearlyData[year].reduce((s, p) => s + p.amount, 0),
  }));

  // Define month labels for a calendar year
  const calendarMonthLabels = (year) => [
    `${year}-01`, `${year}-02`, `${year}-03`, `${year}-04`,
    `${year}-05`, `${year}-06`, `${year}-07`, `${year}-08`,
    `${year}-09`, `${year}-10`, `${year}-11`, `${year}-12`,
  ];

  return (
    <div className="page-container">
      <h1>Calendar Year Analysis</h1>
      <SummaryRow
            grandTotal={grandTotal}
            grandTotalTitle="Grand Total"
            periodDetails={periodDetails}
            periodTitle="Yearly Totals & Growth"
      />
      {years.length > 0 ? (
        years.map(year => (
          <AnalysisCard
            key={year}
            title={`Calendar Year ${year}`}
            paychecks={yearlyData[year]}
            monthLabels={calendarMonthLabels(year)}
          />
        ))
      ) : (
        <p>No paycheck data available to analyze.</p>
      )}
    </div>
  );
};

export default CalendarAnalysis;
