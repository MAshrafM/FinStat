// frontend/src/pages/analysis/FiscalAnalysis.js
import React, { useState, useEffect } from 'react';
import { getPaychecks } from '../../services/paycheckService';
import SummaryRow from '../../components/SummaryRow';
import AnalysisCard from '../../components/AnalysisCard';

const FiscalAnalysis = () => {
  const [fiscalYearlyData, setFiscalYearlyData] = useState({});
    const [paychecks, setPaychecks] = useState({});
  
    useEffect(() => {
      getPaychecks().then(data => {
        setPaychecks(data);
      }).catch(err => console.error("Failed to load paychecks for analysis:", err));
    }, []);


  useEffect(() => {
    if (!Array.isArray(paychecks)) return;
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
  }, [paychecks]);

  const fiscalYears = Object.keys(fiscalYearlyData).sort().reverse();

  const grandTotal = fiscalYears.reduce((sum, fy) => sum + fiscalYearlyData[fy].reduce((s, p) => s + p.amount, 0), 0);
  const periodDetails = fiscalYears.map(fy => ({
    key: fy,
    value: fiscalYearlyData[fy].reduce((s, p) => s + p.amount, 0),
  }));

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
      <SummaryRow
            grandTotal={grandTotal}
            grandTotalTitle="Grand Total"
            periodDetails={periodDetails}
            periodTitle="Fiscal Yearly Totals & Growth"
      />
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
