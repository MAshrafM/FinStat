// frontend/src/pages/analysis/FiscalAnalysis.js
import React, { useState, useEffect } from 'react';
import { getPaychecks } from '../../services/paycheckService';
import AnalysisCard from '../../components/AnalysisCard';

const FiscalAnalysis = () => {
  const [fiscalYearlyData, setFiscalYearlyData] = useState({});

  useEffect(() => {
    const processData = async () => {
      const paychecks = await getPaychecks();
      const groupedByFiscalYear = paychecks.reduce((acc, p) => {
        const date = new Date(p.month + '-02'); // Use 2nd day to avoid timezone issues
        const month = date.getMonth(); // 0 = Jan, 6 = July
        let fiscalYear = date.getFullYear();
        // If the month is before July (Jan-June), it belongs to the previous fiscal year
        if (month < 6) {
          fiscalYear--;
        }
        const fiscalYearLabel = `FY ${fiscalYear}-${fiscalYear + 1}`;
        (acc[fiscalYearLabel] = acc[fiscalYearLabel] || []).push(p);
        return acc;
      }, {});
      setFiscalYearlyData(groupedByFiscalYear);
    };
    processData();
  }, []);

  const fiscalYears = Object.keys(fiscalYearlyData).sort().reverse();

  // Define month labels for a fiscal year
  const fiscalMonthLabels = (fiscalYearLabel) => {
    const startYear = parseInt(fiscalYearLabel.substring(3, 7));
    const endYear = startYear + 1;
    return [
      `${startYear}-07`, `${startYear}-08`, `${startYear}-09`, `${startYear}-10`, `${startYear}-11`, `${startYear}-12`,
      `${endYear}-01`, `${endYear}-02`, `${endYear}-03`, `${endYear}-04`, `${endYear}-05`, `${endYear}-06`,
    ];
  };

  return (
    <div className="page-container">
      <h1>Fiscal Year Analysis</h1>
      {fiscalYears.length > 0 ? (
        fiscalYears.map(fy => (
          <AnalysisCard
            key={fy}
            title={fy}
            paychecks={fiscalYearlyData[fy]}
            monthLabels={fiscalMonthLabels(fy)}
          />
        ))
      ) : (
        <p>No paycheck data available to analyze.</p>
      )}
    </div>
  );
};

export default FiscalAnalysis;
