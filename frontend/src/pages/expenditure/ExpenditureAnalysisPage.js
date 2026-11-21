// frontend/src/pages/expenditure/ExpenditureAnalysisPage.js
import React, { useState, useEffect } from 'react';
import { getAllExpendituresForAnalysis } from '../../services/expenditureService';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { formatCurrency } from '../../utils/formatters';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { PageHeader, Badge, Loading } from '../../components/ui';
import { getChartPalette, baseChartOptions, doughnutDefaults, ariaLabel } from '../../styles/chartTheme';
import './Expenditure.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDateParts = (dateInput) => {
  if (!dateInput) return { year: null, month: null };
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})/);
    if (match) {
      return {
        year: match[1],
        month: parseInt(match[2], 10) - 1, // 0-indexed (0 = Jan, 8 = Sep)
      };
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { year: null, month: null };
  return {
    year: d.getUTCFullYear().toString(),
    month: d.getUTCMonth(),
  };
};

const ExpenditureAnalysisPage = () => {
  const [yearlyData, setYearlyData] = useState({});
  const [overallSummary, setOverallSummary] = useState({
    totalWithdrawals: 0,
    totalTopups: 0,
    totalSavings: 0,
    volumeByType: { W: 0, T: 0, S: 0 },
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [allExpenditures, setAllExpenditures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTotal, setSearchTotal] = useState(null);
  const [includeSettlements, setIncludeSettlements] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getAllExpendituresForAnalysis()
      .then((expenditures) => {
        setAllExpenditures(Array.isArray(expenditures) ? expenditures : []);
      })
      .catch((err) => console.error('Failed to load analysis data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const processData = (expenditures, currentSearchTerm, shouldIncludeSettlements) => {
    // Exclude credit card settlement expenditures by default to avoid double-counting
    let workingExpenditures = expenditures;
    if (!shouldIncludeSettlements) {
      workingExpenditures = workingExpenditures.filter(
        (item) => !(item.categories && item.categories.includes('Credit Card Settlement'))
      );
    }

    // Filter data based on search term
    let filteredExpenditures = workingExpenditures;
    let currentSearchTotal = null;

    if (currentSearchTerm && currentSearchTerm.trim() !== '') {
      const lowercasedTerm = currentSearchTerm.toLowerCase();
      filteredExpenditures = expenditures.filter((item) => {
        const descMatches = item.description && item.description.toLowerCase().includes(lowercasedTerm);
        const catMatches = item.categories && item.categories.some((cat) => cat.toLowerCase().includes(lowercasedTerm));
        return descMatches || catMatches;
      });

      currentSearchTotal = filteredExpenditures.reduce((sum, item) => {
        return sum + Math.abs(Number(item.transactionValue) || 0);
      }, 0);
    }
    setSearchTotal(currentSearchTotal);

    const groupedData = {};
    const overallCategoryVolumes = {};
    EXPENDITURE_CATEGORIES.forEach((c) => {
      overallCategoryVolumes[c.name] = 0;
    });
    const overallTotals = {
      totalWithdrawals: 0,
      totalTopups: 0,
      totalSavings: 0,
      volumeByType: { W: 0, T: 0, S: 0 },
      categoryVolumes: overallCategoryVolumes,
    };

    const initializeYear = (year) => {
      if (!groupedData[year]) {
        const categoryVolumes = {};
        EXPENDITURE_CATEGORIES.forEach((c) => {
          categoryVolumes[c.name] = 0;
        });
        groupedData[year] = {
          byType: { W: 0, T: 0, S: 0, log: 0 },
          volumeByType: { W: 0, T: 0, S: 0 },
          byMonth: Array(12).fill(0).map(() => ({ withdrawals: 0, topups: 0, savings: 0 })),
          totalWithdrawals: 0,
          totalTopups: 0,
          totalSavings: 0,
          categoryVolumes,
        };
      }
    };

    expenditures.forEach((item) => {
      const { year, month } = parseDateParts(item.date);
      if (!year || month === null || month < 0 || month > 11) return;
      initializeYear(year);

      const transactionValue = Math.abs(Number(item.transactionValue) || 0);

      if (item.transactionType === 'W') {
        groupedData[year].byMonth[month].withdrawals += transactionValue;
        groupedData[year].totalWithdrawals += transactionValue;
        groupedData[year].volumeByType.W += transactionValue;
        overallTotals.totalWithdrawals += transactionValue;
        overallTotals.volumeByType.W += transactionValue;

        // Split categories values (explicit splits or fallback)
        if (item.splits && Array.isArray(item.splits) && item.splits.length > 0) {
          item.splits.forEach((split) => {
            const catName = split.category || 'Other';
            const splitVal = Math.abs(Number(split.amount) || 0);
            if (groupedData[year].categoryVolumes[catName] !== undefined) {
              groupedData[year].categoryVolumes[catName] += splitVal;
            }
            if (overallTotals.categoryVolumes[catName] !== undefined) {
              overallTotals.categoryVolumes[catName] += splitVal;
            }
          });
        } else {
          const itemCats = item.categories && item.categories.length > 0 ? item.categories : ['Other'];
          const splitVal = transactionValue / itemCats.length;
          itemCats.forEach((catName) => {
            if (groupedData[year].categoryVolumes[catName] !== undefined) {
              groupedData[year].categoryVolumes[catName] += splitVal;
            }
            if (overallTotals.categoryVolumes[catName] !== undefined) {
              overallTotals.categoryVolumes[catName] += splitVal;
            }
          });
        }
      } else if (item.transactionType === 'T') {
        groupedData[year].byMonth[month].topups += transactionValue;
        groupedData[year].totalTopups += transactionValue;
        groupedData[year].volumeByType.T += transactionValue;
        overallTotals.totalTopups += transactionValue;
        overallTotals.volumeByType.T += transactionValue;
      } else if (item.transactionType === 'S') {
        groupedData[year].byMonth[month].savings += transactionValue;
        groupedData[year].totalSavings += transactionValue;
        groupedData[year].volumeByType.S += transactionValue;
        overallTotals.totalSavings += transactionValue;
        overallTotals.volumeByType.S += transactionValue;
      }

      if (groupedData[year].byType[item.transactionType] !== undefined) {
        groupedData[year].byType[item.transactionType]++;
      }
    });

    // Calculate and Add Passive Bank Savings
    const monthlyBankRecords = {};

    expenditures.forEach((item) => {
      const { year, month } = parseDateParts(item.date);
      if (!year || month === null || month < 0 || month > 11) return;
      const key = `${year}-${month}`;

      if (!monthlyBankRecords[key]) {
        monthlyBankRecords[key] = [];
      }
      monthlyBankRecords[key].push({
        date: new Date(item.date),
        bank: item.runningBalances?.bank ?? item.bank ?? 0,
      });
    });

    for (const key in monthlyBankRecords) {
      const records = monthlyBankRecords[key];
      records.sort((a, b) => a.date - b.date);

      const startBank = records[0].bank;
      const endBank = records[records.length - 1].bank;
      const bankChange = endBank - startBank;

      if (bankChange > 0) {
        const [year, month] = key.split('-');
        const monthIndex = parseInt(month, 10);
        if (groupedData[year] && groupedData[year].byMonth[monthIndex]) {
          groupedData[year].byMonth[monthIndex].savings += bankChange;
          groupedData[year].totalSavings += bankChange;
          groupedData[year].volumeByType.S += bankChange;
          overallTotals.totalSavings += bankChange;
          overallTotals.volumeByType.S += bankChange;
        }
      }
    }

    setYearlyData(groupedData);
    setOverallSummary(overallTotals);
  };

  useEffect(() => {
    if (allExpenditures.length > 0) {
      processData(allExpenditures, searchTerm, includeSettlements);
    }
  }, [allExpenditures, searchTerm, includeSettlements]);

  const availableYears = Object.keys(yearlyData).sort((a, b) => b - a);
  const initialCategoryVolumes = {};
  EXPENDITURE_CATEGORIES.forEach((c) => {
    initialCategoryVolumes[c.name] = 0;
  });

  const dataForYear = yearlyData[selectedYear] || {
    byType: {},
    volumeByType: { W: 0, T: 0, S: 0 },
    byMonth: [],
    totalWithdrawals: 0,
    totalTopups: 0,
    totalSavings: 0,
    categoryVolumes: initialCategoryVolumes,
  };

  const palette = getChartPalette();

  // Chart 1: Overall pie chart data (by volume)
  const overallPieChartData = {
    labels: ['Withdrawals', 'Top-ups', 'Savings'],
    datasets: [{
      data: [
        overallSummary.volumeByType.W || 0,
        overallSummary.volumeByType.T || 0,
        overallSummary.volumeByType.S || 0,
      ],
      backgroundColor: [palette.grey1, palette.grey2, palette.grey3],
      borderWidth: 1,
      borderColor: palette.surface,
    }],
  };

  // Chart 2: Yearly pie chart data (by volume)
  const yearlyPieChartData = {
    labels: ['Withdrawals', 'Top-ups', 'Savings'],
    datasets: [{
      data: [
        dataForYear.volumeByType.W || 0,
        dataForYear.volumeByType.T || 0,
        dataForYear.volumeByType.S || 0,
      ],
      backgroundColor: [palette.grey1, palette.grey2, palette.grey3],
      borderWidth: 1,
      borderColor: palette.surface,
    }],
  };

  // Helper to cap category breakdown to top 5 + "Other" per §4.12 and G2 using standard theme palette
  const getCappedCategoryChartData = (categoryVolumes) => {
    const list = EXPENDITURE_CATEGORIES.map((c) => ({
      name: c.name,
      value: Math.round(categoryVolumes ? (categoryVolumes[c.name] || 0) : 0),
    })).filter((c) => c.value > 0);

    // Sort descending by spend value
    list.sort((a, b) => b.value - a.value);

    let labels = [];
    let values = [];

    if (list.length === 0) {
      labels = ['No Data'];
      values = [0];
    } else if (list.length <= 6) {
      labels = list.map((c) => c.name);
      values = list.map((c) => c.value);
    } else {
      const top5 = list.slice(0, 5);
      const otherTotal = list.slice(5).reduce((sum, c) => sum + c.value, 0);
      labels = [...top5.map((c) => c.name), 'Other'];
      values = [...top5.map((c) => c.value), otherTotal];
    }

    const standardCategoryPalette = [
      palette.grey1,
      palette.grey2,
      palette.grey3,
      palette.grey4,
      palette.warning,
      palette.positive,
    ];

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => standardCategoryPalette[i % standardCategoryPalette.length]),
        borderWidth: 1,
        borderColor: palette.surface,
      }],
    };
  };

  // Chart 3: Overall category pie chart data (capped at 6 series using theme tokens per §4.12)
  const overallCategoryLabels = EXPENDITURE_CATEGORIES.map((c) => c.name);
  const overallCategoryValues = EXPENDITURE_CATEGORIES.map((c) => {
    const val = overallSummary.categoryVolumes ? (overallSummary.categoryVolumes[c.name] || 0) : 0;
    return Math.round(val);
  });
  const overallCategoryPieChartData = getCappedCategoryChartData(overallSummary.categoryVolumes);

  // Chart 4: Yearly category pie chart data (capped at 6 series using theme tokens per §4.12)
  const yearlyCategoryLabels = EXPENDITURE_CATEGORIES.map((c) => c.name);
  const yearlyCategoryValues = EXPENDITURE_CATEGORIES.map((c) => {
    const val = dataForYear.categoryVolumes ? (dataForYear.categoryVolumes[c.name] || 0) : 0;
    return Math.round(val);
  });
  const yearlyCategoryPieChartData = getCappedCategoryChartData(dataForYear.categoryVolumes);

  // Chart 5: Bar chart data
  const barChartData = {
    labels: MONTH_NAMES,
    datasets: [
      {
        label: 'Withdrawals',
        data: dataForYear.byMonth.map((m) => m.withdrawals),
        backgroundColor: palette.grey1,
      },
      {
        label: 'Top-ups',
        data: dataForYear.byMonth.map((m) => m.topups),
        backgroundColor: palette.grey2,
      },
      {
        label: 'Savings',
        data: dataForYear.byMonth.map((m) => m.savings),
        backgroundColor: palette.grey3,
      },
    ],
  };

  const barChartOptions = baseChartOptions({
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
  });

  const pieChartOptions = doughnutDefaults({
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: palette.text2,
          font: { family: 'IBM Plex Sans, -apple-system, sans-serif', size: 12 },
        },
      },
    },
  });

  // Table calculations for Volume by Type
  const totalOverallVolume =
    (overallSummary.volumeByType.W || 0) +
    (overallSummary.volumeByType.T || 0) +
    (overallSummary.volumeByType.S || 0);

  const totalYearVolume =
    (dataForYear.volumeByType.W || 0) +
    (dataForYear.volumeByType.T || 0) +
    (dataForYear.volumeByType.S || 0);

  const totalOverallCategorySpend = overallCategoryValues.reduce((s, v) => s + v, 0);
  const totalYearCategorySpend = yearlyCategoryValues.reduce((s, v) => s + v, 0);

  return (
    <div className="fs-page expenditure-analysis-container" data-testid="expenditure-analysis-page">
      <PageHeader
        title="Expenditure Analysis"
        subtitle="Long-term cash outflow dynamics, multi-year volume breakdowns, and category concentrations."
      />

      {/* Overall Summary KPI Cards */}
      <div className="analysis-summary-grid">
        <div className="analysis-kpi-card" data-testid="kpi-total-withdrawals">
          <div className="analysis-kpi-label">Total Withdrawals (All Years)</div>
          <div className="analysis-kpi-val fs-num">{formatCurrency(overallSummary.totalWithdrawals)}</div>
        </div>
        <div className="analysis-kpi-card" data-testid="kpi-total-topups">
          <div className="analysis-kpi-label">Total Top-ups (All Years)</div>
          <div className="analysis-kpi-val fs-num">{formatCurrency(overallSummary.totalTopups)}</div>
        </div>
        <div className="analysis-kpi-card" data-testid="kpi-total-savings">
          <div className="analysis-kpi-label">Total Savings (All Years)</div>
          <div className="analysis-kpi-val fs-num">{formatCurrency(overallSummary.totalSavings)}</div>
        </div>
      </div>

      {/* Filter / Search Card */}
      <div className="analysis-card filter-card">
        <h2 className="analysis-card-title">Filter Expenditures</h2>
        <div className="analysis-filter-row">
          <div className="filter-group-search">
            <label htmlFor="analysis-search-input">Search by Description or Category</label>
            <div className="search-input-wrapper">
              <input
                id="analysis-search-input"
                type="text"
                className="form-control"
                placeholder="e.g., Groceries, Food & Dining, rent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group-year">
            <label htmlFor="analysis-year-select">Select Year</label>
            <select
              id="analysis-year-select"
              className="form-control"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="settlement-toggle-row">
          <label className="settlement-toggle-label">
            <input
              type="checkbox"
              checked={includeSettlements}
              onChange={(e) => setIncludeSettlements(e.target.checked)}
            />
            Include Credit Card Settlements (Gross Outflow View)
          </label>
          <span className="settlement-toggle-help">
            Settlements are excluded by default to avoid double-counting card purchases and bank payoff debits.
          </span>
        </div>
      </div>

      {/* Search Result Banner */}
      {searchTotal !== null && (
        <div className="analysis-card search-result-card" data-testid="search-results-summary">
          <h2 className="analysis-card-title">Search Results for &ldquo;{searchTerm}&rdquo;</h2>
          <div className="search-result-stat">
            <span className="search-result-label">Total Matching Spending</span>
            <strong className="search-result-val fs-num">{formatCurrency(searchTotal)}</strong>
          </div>
        </div>
      )}

      {/* Multi-Year & Selected Year Volume Charts (Charts 1 & 2) */}
      <div className="analysis-grid-2col">
        {/* Chart 1: Volume by Type (All Years) */}
        <div className="analysis-card chart-card" data-testid="card-chart-1">
          <h2 className="analysis-card-title">Volume by Type (All Years)</h2>
          <div
            className="chart-canvas-container"
            role="img"
            aria-label={ariaLabel('Volume by Type (All Years)', [
              { label: 'Withdrawals', value: formatCurrency(overallSummary.volumeByType.W) },
              { label: 'Top-ups', value: formatCurrency(overallSummary.volumeByType.T) },
              { label: 'Savings', value: formatCurrency(overallSummary.volumeByType.S) },
            ])}
          >
            <Pie data={overallPieChartData} options={pieChartOptions} />
          </div>

          {/* Accessible Table Alternative 1 */}
          <div className="table-container chart-data-table-wrapper fs-table-container">
            <table className="styled-table chart-data-table" data-testid="table-chart-1">
              <caption className="table-caption">Volume by Type (All Years) Alternative Data Table</caption>
              <thead>
                <tr>
                  <th scope="col">Transaction Type</th>
                  <th scope="col" className="cell-right">Total Volume</th>
                  <th scope="col" className="cell-right">Share</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Withdrawals</td>
                  <td className="cell-right fs-num">{formatCurrency(overallSummary.volumeByType.W || 0)}</td>
                  <td className="cell-right fs-num">
                    {totalOverallVolume > 0
                      ? `${Math.round(((overallSummary.volumeByType.W || 0) / totalOverallVolume) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr>
                  <td>Top-ups</td>
                  <td className="cell-right fs-num">{formatCurrency(overallSummary.volumeByType.T || 0)}</td>
                  <td className="cell-right fs-num">
                    {totalOverallVolume > 0
                      ? `${Math.round(((overallSummary.volumeByType.T || 0) / totalOverallVolume) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr>
                  <td>Savings</td>
                  <td className="cell-right fs-num">{formatCurrency(overallSummary.volumeByType.S || 0)}</td>
                  <td className="cell-right fs-num">
                    {totalOverallVolume > 0
                      ? `${Math.round(((overallSummary.volumeByType.S || 0) / totalOverallVolume) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart 2: Volume by Type for Selected Year */}
        <div className="analysis-card chart-card" data-testid="card-chart-2">
          <h2 className="analysis-card-title">Volume by Type ({selectedYear})</h2>
          <div
            className="chart-canvas-container"
            role="img"
            aria-label={ariaLabel(`Volume by Type (${selectedYear})`, [
              { label: 'Withdrawals', value: formatCurrency(dataForYear.volumeByType.W) },
              { label: 'Top-ups', value: formatCurrency(dataForYear.volumeByType.T) },
              { label: 'Savings', value: formatCurrency(dataForYear.volumeByType.S) },
            ])}
          >
            <Pie data={yearlyPieChartData} options={pieChartOptions} />
          </div>

          {/* Accessible Table Alternative 2 */}
          <div className="table-container chart-data-table-wrapper fs-table-container">
            <table className="styled-table chart-data-table" data-testid="table-chart-2">
              <caption className="table-caption">Volume by Type ({selectedYear}) Alternative Data Table</caption>
              <thead>
                <tr>
                  <th scope="col">Transaction Type</th>
                  <th scope="col" className="cell-right">Total Volume</th>
                  <th scope="col" className="cell-right">Share</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Withdrawals</td>
                  <td className="cell-right fs-num">{formatCurrency(dataForYear.volumeByType.W || 0)}</td>
                  <td className="cell-right fs-num">
                    {totalYearVolume > 0
                      ? `${Math.round(((dataForYear.volumeByType.W || 0) / totalYearVolume) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr>
                  <td>Top-ups</td>
                  <td className="cell-right fs-num">{formatCurrency(dataForYear.volumeByType.T || 0)}</td>
                  <td className="cell-right fs-num">
                    {totalYearVolume > 0
                      ? `${Math.round(((dataForYear.volumeByType.T || 0) / totalYearVolume) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr>
                  <td>Savings</td>
                  <td className="cell-right fs-num">{formatCurrency(dataForYear.volumeByType.S || 0)}</td>
                  <td className="cell-right fs-num">
                    {totalYearVolume > 0
                      ? `${Math.round(((dataForYear.volumeByType.S || 0) / totalYearVolume) * 100)}%`
                      : '0%'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Analysis Charts (Charts 3 & 4) */}
      <div className="analysis-grid-2col">
        {/* Chart 3: Category Breakdown (All Years) */}
        <div className="analysis-card chart-card" data-testid="card-chart-3">
          <h2 className="analysis-card-title">Category Breakdown (All Years)</h2>
          <div
            className="chart-canvas-container tall"
            role="img"
            aria-label={ariaLabel('Category Breakdown (All Years)', overallCategoryLabels.map((l, i) => ({
              label: l,
              value: formatCurrency(overallCategoryValues[i]),
            })))}
          >
            <Pie data={overallCategoryPieChartData} options={pieChartOptions} />
          </div>

          {/* Accessible Table Alternative 3 */}
          <div className="table-container chart-data-table-wrapper fs-table-container">
            <table className="styled-table chart-data-table" data-testid="table-chart-3">
              <caption className="table-caption">Category Breakdown (All Years) Alternative Data Table</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" className="cell-right">Total Spent</th>
                  <th scope="col" className="cell-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {overallCategoryLabels.map((cat, i) => {
                  const val = overallCategoryValues[i];
                  const pct = totalOverallCategorySpend > 0 ? Math.round((val / totalOverallCategorySpend) * 100) : 0;
                  return (
                    <tr key={cat}>
                      <td><Badge tone="neutral">{cat}</Badge></td>
                      <td className="cell-right fs-num">{formatCurrency(val)}</td>
                      <td className="cell-right fs-num">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart 4: Category Breakdown for Selected Year */}
        <div className="analysis-card chart-card" data-testid="card-chart-4">
          <h2 className="analysis-card-title">Category Breakdown for {selectedYear}</h2>
          <div
            className="chart-canvas-container tall"
            role="img"
            aria-label={ariaLabel(`Category Breakdown for ${selectedYear}`, yearlyCategoryLabels.map((l, i) => ({
              label: l,
              value: formatCurrency(yearlyCategoryValues[i]),
            })))}
          >
            <Pie data={yearlyCategoryPieChartData} options={pieChartOptions} />
          </div>

          {/* Accessible Table Alternative 4 */}
          <div className="table-container chart-data-table-wrapper fs-table-container">
            <table className="styled-table chart-data-table" data-testid="table-chart-4">
              <caption className="table-caption">Category Breakdown for {selectedYear} Alternative Data Table</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" className="cell-right">Total Spent</th>
                  <th scope="col" className="cell-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {yearlyCategoryLabels.map((cat, i) => {
                  const val = yearlyCategoryValues[i];
                  const pct = totalYearCategorySpend > 0 ? Math.round((val / totalYearCategorySpend) * 100) : 0;
                  return (
                    <tr key={cat}>
                      <td><Badge tone="neutral">{cat}</Badge></td>
                      <td className="cell-right fs-num">{formatCurrency(val)}</td>
                      <td className="cell-right fs-num">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Bar Chart (Chart 5) */}
      <div className="analysis-card chart-card" data-testid="card-chart-5">
        <h2 className="analysis-card-title">Monthly Breakdown for {selectedYear}</h2>
        <div
          className="ex-chart-wrapper"
          role="img"
          aria-label={ariaLabel(`Monthly Breakdown for ${selectedYear}`, MONTH_NAMES.map((m, i) => ({
            label: m,
            value: `Withdrawals: ${formatCurrency(dataForYear.byMonth[i]?.withdrawals || 0)}`,
          })))}
        >
          <div className="ex-chart-container">
            <Bar options={barChartOptions} data={barChartData} />
          </div>
        </div>

        {/* Accessible Table Alternative 5 */}
        <div className="table-container chart-data-table-wrapper fs-table-container">
          <div className="monthly-breakdown-desktop-table">
            <table className="styled-table chart-data-table" data-testid="table-chart-5">
              <caption className="table-caption">Monthly Breakdown for {selectedYear} Alternative Data Table</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col" className="cell-right">Withdrawals</th>
                  <th scope="col" className="cell-right">Top-ups</th>
                  <th scope="col" className="cell-right">Savings</th>
                  <th scope="col" className="cell-right">Net Flow</th>
                </tr>
              </thead>
              <tbody>
                {MONTH_NAMES.map((monthName, idx) => {
                  const m = dataForYear.byMonth[idx] || { withdrawals: 0, topups: 0, savings: 0 };
                  const net = m.topups - m.withdrawals;
                  return (
                    <tr key={monthName}>
                      <td><strong>{monthName}</strong></td>
                      <td className="cell-right fs-num">{formatCurrency(m.withdrawals)}</td>
                      <td className="cell-right fs-num">{formatCurrency(m.topups)}</td>
                      <td className="cell-right fs-num">{formatCurrency(m.savings)}</td>
                      <td className="cell-right fs-num">
                        <span className={net >= 0 ? 'fs-delta--positive' : 'fs-delta--negative'}>
                          {net >= 0 ? `+${formatCurrency(net)}` : `-${formatCurrency(Math.abs(net))}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* D19 Mobile Compact Cards (<= 768px) */}
          <div className="monthly-breakdown-mobile-cards" data-testid="table-chart-5-mobile">
            {MONTH_NAMES.map((monthName, idx) => {
              const m = dataForYear.byMonth[idx] || { withdrawals: 0, topups: 0, savings: 0 };
              const net = m.topups - m.withdrawals;
              return (
                <div key={monthName} className="monthly-breakdown-mobile-card">
                  <div className="monthly-breakdown-mobile-header">
                    <span className="monthly-breakdown-mobile-month">{monthName}</span>
                    <span className={`monthly-breakdown-mobile-net fs-num ${net >= 0 ? 'fs-delta--positive' : 'fs-delta--negative'}`}>
                      {net >= 0 ? `+${formatCurrency(net)}` : `-${formatCurrency(Math.abs(net))}`}
                    </span>
                  </div>
                  <div className="monthly-breakdown-mobile-row">
                    <span className="monthly-breakdown-mobile-label">Withdrawals</span>
                    <span className="fs-num">{formatCurrency(m.withdrawals)}</span>
                  </div>
                  <div className="monthly-breakdown-mobile-row">
                    <span className="monthly-breakdown-mobile-label">Top-ups</span>
                    <span className="fs-num">{formatCurrency(m.topups)}</span>
                  </div>
                  <div className="monthly-breakdown-mobile-row">
                    <span className="monthly-breakdown-mobile-label">Savings</span>
                    <span className="fs-num">{formatCurrency(m.savings)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="analysis-loading-overlay">
          <Loading variant="card" message="Loading expenditure analysis..." />
        </div>
      )}
    </div>
  );
};

export default ExpenditureAnalysisPage;
