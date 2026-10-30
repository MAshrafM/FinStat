// frontend/src/pages/analysis/PayrollAnalyticsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPaychecks } from '../../services/paycheckService';
import SummaryRow from '../../components/SummaryRow';
import AnalysisCard from '../../components/AnalysisCard';

const PayrollAnalyticsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Read initial cycle from URL query param ?cycle=calendar|fiscal
  const initialCycle = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const paramCycle = params.get('cycle');
    return paramCycle === 'fiscal' ? 'fiscal' : 'calendar';
  }, [location.search]);

  const [cycleMode, setCycleMode] = useState(initialCycle);
  const [paychecks, setPaychecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state if URL search changes externally
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paramCycle = params.get('cycle');
    if (paramCycle === 'fiscal' || paramCycle === 'calendar') {
      setCycleMode(paramCycle);
    }
  }, [location.search]);

  // Fetch paychecks once on mount
  useEffect(() => {
    setIsLoading(true);
    getPaychecks()
      .then((data) => {
        setPaychecks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load paychecks for analysis:', err);
        setPaychecks([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleCycleChange = (mode) => {
    setCycleMode(mode);
    const params = new URLSearchParams(location.search);
    params.set('cycle', mode);
    navigate({ search: params.toString() }, { replace: true });
  };

  // Calendar year grouping
  const calendarData = useMemo(() => {
    if (!Array.isArray(paychecks) || paychecks.length === 0) {
      return { years: [], yearlyData: {}, grandTotal: 0, periodDetails: [] };
    }

    const yearlyData = paychecks.reduce((acc, p) => {
      const year = p.month ? p.month.substring(0, 4) : 'Unknown';
      (acc[year] = acc[year] || []).push(p);
      return acc;
    }, {});

    const years = Object.keys(yearlyData).sort((a, b) => b.localeCompare(a));
    const grandTotal = years.reduce(
      (sum, year) => sum + yearlyData[year].reduce((s, p) => s + (p.amount || 0), 0),
      0
    );
    const periodDetails = years.map((year) => ({
      key: year,
      value: yearlyData[year].reduce((s, p) => s + (p.amount || 0), 0),
    }));

    return { years, yearlyData, grandTotal, periodDetails };
  }, [paychecks]);

  // Fiscal year grouping (July - June)
  const fiscalData = useMemo(() => {
    if (!Array.isArray(paychecks) || paychecks.length === 0) {
      return { fiscalYears: [], fiscalYearlyData: {}, grandTotal: 0, periodDetails: [] };
    }

    const fiscalYearlyData = paychecks.reduce((acc, p) => {
      if (!p.month) return acc;
      const date = new Date(p.month + '-02');
      const month = date.getMonth(); // 0 = Jan, 6 = July
      let fiscalYear = date.getFullYear();
      if (month < 6) {
        fiscalYear--;
      }
      const fiscalYearLabel = `FY ${fiscalYear}-${fiscalYear + 1}`;
      (acc[fiscalYearLabel] = acc[fiscalYearLabel] || []).push(p);
      return acc;
    }, {});

    const fiscalYears = Object.keys(fiscalYearlyData).sort().reverse();
    const grandTotal = fiscalYears.reduce(
      (sum, fy) => sum + fiscalYearlyData[fy].reduce((s, p) => s + (p.amount || 0), 0),
      0
    );
    const periodDetails = fiscalYears.map((fy) => ({
      key: fy,
      value: fiscalYearlyData[fy].reduce((s, p) => s + (p.amount || 0), 0),
    }));

    return { fiscalYears, fiscalYearlyData, grandTotal, periodDetails };
  }, [paychecks]);

  const calendarMonthLabels = (year) => [
    `${year}-01`, `${year}-02`, `${year}-03`, `${year}-04`,
    `${year}-05`, `${year}-06`, `${year}-07`, `${year}-08`,
    `${year}-09`, `${year}-10`, `${year}-11`, `${year}-12`,
  ];

  const fiscalMonthLabels = (fiscalYearLabel) => {
    const startYear = parseInt(fiscalYearLabel.substring(3, 7), 10);
    const endYear = startYear + 1;
    return [
      `${startYear}-07`, `${startYear}-08`, `${startYear}-09`, `${startYear}-10`, `${startYear}-11`, `${startYear}-12`,
      `${endYear}-01`, `${endYear}-02`, `${endYear}-03`, `${endYear}-04`, `${endYear}-05`, `${endYear}-06`,
    ];
  };

  const isFiscal = cycleMode === 'fiscal';
  const hasData = paychecks.length > 0;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Payroll Analytics</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Consolidated income and payroll analysis across Calendar and Fiscal cycles.
          </p>
        </div>

        {/* Segmented Cycle Toggle Bar */}
        <div
          role="group"
          aria-label="Payroll Cycle Mode"
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
            onClick={() => handleCycleChange('calendar')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: !isFiscal ? '#6c7ce7' : 'transparent',
              color: !isFiscal ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📅 Calendar Year
          </button>
          <button
            type="button"
            onClick={() => handleCycleChange('fiscal')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: isFiscal ? '#6c7ce7' : 'transparent',
              color: isFiscal ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🏛️ Fiscal Year
          </button>
        </div>
      </div>

      {hasData ? (
        <>
          <SummaryRow
            grandTotal={isFiscal ? fiscalData.grandTotal : calendarData.grandTotal}
            grandTotalTitle={isFiscal ? 'Fiscal Grand Total' : 'Calendar Grand Total'}
            periodDetails={isFiscal ? fiscalData.periodDetails : calendarData.periodDetails}
            periodTitle={isFiscal ? 'Fiscal Yearly Totals & Growth' : 'Yearly Totals & Growth'}
          />

          {!isFiscal ? (
            calendarData.years.map((year) => (
              <AnalysisCard
                key={year}
                title={`Calendar Year ${year}`}
                paychecks={calendarData.yearlyData[year]}
                monthLabels={calendarMonthLabels(year)}
              />
            ))
          ) : (
            fiscalData.fiscalYears.map((fy) => (
              <AnalysisCard
                key={fy}
                title={fy}
                paychecks={fiscalData.fiscalYearlyData[fy]}
                monthLabels={fiscalMonthLabels(fy)}
              />
            ))
          )}
        </>
      ) : (
        !isLoading && <p>No paycheck data available to analyze.</p>
      )}
    </div>
  );
};

export default PayrollAnalyticsPage;

