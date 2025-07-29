// frontend/src/pages/analysis/CalendarAnalysis.js
import React, { useState, useEffect } from 'react';
import { getPaychecks } from '../../services/paycheckService';
import AnalysisCard from '../../components/AnalysisCard';

const CalendarAnalysis = () => {
  const [yearlyData, setYearlyData] = useState({});

  useEffect(() => {
    const processData = async () => {
      const paychecks = await getPaychecks();
      const groupedByYear = paychecks.reduce((acc, p) => {
        const year = p.month.substring(0, 4); // "2024-07" -> "2024"
        (acc[year] = acc[year] || []).push(p);
        return acc;
      }, {});
      setYearlyData(groupedByYear);
    };
    processData();
  }, []);

  const years = Object.keys(yearlyData).sort((a, b) => b - a); // Sort years descending

  // Define month labels for a calendar year
  const calendarMonthLabels = (year) => [
    `${year}-01`, `${year}-02`, `${year}-03`, `${year}-04`,
    `${year}-05`, `${year}-06`, `${year}-07`, `${year}-08`,
    `${year}-09`, `${year}-10`, `${year}-11`, `${year}-12`,
  ];

  return (
    <div className="page-container">
      <h1>Calendar Year Analysis</h1>
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
