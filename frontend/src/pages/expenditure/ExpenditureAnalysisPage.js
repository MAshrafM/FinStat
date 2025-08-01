// frontend/src/pages/expenditure/ExpenditureAnalysisPage.js
import React, { useState, useEffect } from 'react';
import { getAllExpendituresForAnalysis } from '../../services/expenditureService';
import { getPaychecks } from '../../services/paycheckService';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { formatCurrency } from '../../utils/formatters';
import './Expenditure.css'; // Reuse styles

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ExpenditureAnalysisPage = () => {
  const [yearlyData, setYearlyData] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [allExpenditures, setAllExpenditures] = useState([]); // <-- Store the original, unfiltered data
  const [allPaychecks, setAllPaychecks] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // <--  State for the search term
  const [searchTotal, setSearchTotal] = useState(null);

  useEffect(() => {
    Promise.all([
        getAllExpendituresForAnalysis(),
        getPaychecks()
    ]).then(([expenditures, paychecks]) => {
      // Pass both to the processing function
      setAllExpenditures(expenditures); // Store the full dataset
      setAllPaychecks(paychecks);     // Store the full dataset
    }).catch(err => console.error("Failed to load analysis data:", err));
  }, []);

  // ---  useEffect to re-process data when filters change ---
  useEffect(() => {
    // Only run if we have data to process
    if (allExpenditures.length > 0) {
      processData(allExpenditures, allPaychecks, searchTerm);
    }
  }, [allExpenditures, allPaychecks, searchTerm]); // Re-run when search term changes!

  const processData = (expenditures, paychecks, currentSearchTerm) => {
    // --- Filter data based on search term first ---
    let filteredExpenditures = expenditures;
    let currentSearchTotal = null;

    if (currentSearchTerm && currentSearchTerm.trim() !== '') {
      const lowercasedTerm = currentSearchTerm.toLowerCase();
      filteredExpenditures = expenditures.filter(item => 
        item.description && item.description.toLowerCase().includes(lowercasedTerm)
      );

      // Calculate the total for the searched items
      currentSearchTotal = filteredExpenditures.reduce((sum, item) => {
        return sum + item.transactionValue;
      }, 0);
    }
    setSearchTotal(currentSearchTotal);

    const groupedData = {};
    const initializeYear = (year) => {
    if (!groupedData[year]) {
        groupedData[year] = {
            byType: { W: 0, T: 0, S: 0, log: 0 },
            byMonth: Array(12).fill(0).map(() => ({ withdrawals: 0, topups: 0, savings: 0 })),
            totalWithdrawals: 0,
            totalTopups: 0,
            totalSavings: 0,
        };
      }
    };
  expenditures.forEach((item) => {
    const year = new Date(item.date).getFullYear().toString();
    initializeYear(year);
    
    const month = new Date(item.date).getMonth();
    const transactionValue = item.transactionValue;

    if (item.transactionType === 'W') {
      groupedData[year].byMonth[month].withdrawals += transactionValue;
      groupedData[year].totalWithdrawals += transactionValue;
    } else if (item.transactionType === 'T') {
      groupedData[year].byMonth[month].topups += transactionValue;
      groupedData[year].totalTopups += transactionValue;
    } else if (item.transactionType === 'S') {
      groupedData[year].byMonth[month].savings += transactionValue;
      groupedData[year].totalSavings += transactionValue;
    }
    
    groupedData[year].byType[item.transactionType]++;
  });

  // --- Part 2: Process Paychecks and merge into the data ---
  paychecks.forEach(p => {
    if (p.type === 'Prepaid') {
      const year = p.month.substring(0, 4);
      initializeYear(year);
      
      // The month from "YYYY-MM" format is 1-based, so subtract 1
      const month = parseInt(p.month.substring(5, 7), 10) - 1;
      
      // Add the prepaid amount to the 'Topups' for that month
      groupedData[year].byMonth[month].topups += p.amount || 0;
      groupedData[year].totalTopups += p.amount || 0;

      // Conceptually, we also add it to withdrawals, as this money is
      // now available to be spent from the "prepaid" balance.
      // This represents the "spending" of the prepaid card.
      groupedData[year].byMonth[month].withdrawals += p.amount || 0;
      groupedData[year].totalWithdrawals += p.amount || 0;
    }
  });

  // --- Part 3: NEW - Calculate and Add Passive Bank Savings ---
    const monthlyBankRecords = {};

    // First pass: collect all records by month
    expenditures.forEach(item => {
    const date = new Date(item.date);
    const year = date.getFullYear().toString();
    // When creating the key, use 0-11 indexing to match your array
    const month = date.getMonth(); // Keep as 0-11, don't add 1
    const key = `${year}-${month}`;
    
    if (!monthlyBankRecords[key]) {
        monthlyBankRecords[key] = [];
    }
    monthlyBankRecords[key].push({
        date: date,
        bank: item.bank
    });
    });

    // Second pass: find first and last for each month
    for (const key in monthlyBankRecords) {
    const records = monthlyBankRecords[key];
    
    // Sort by date to ensure we get true first/last
    records.sort((a, b) => a.date - b.date);
    
    const startBank = records[0].bank;
    const endBank = records[records.length - 1].bank;
    const bankChange = endBank - startBank;
    
    if (bankChange > 0) {
        const [year, month] = key.split('-');
        const monthIndex = parseInt(month, 10); // Now this will be 0-11
        groupedData[year].byMonth[monthIndex].savings += bankChange;
    }
    }

    setYearlyData(groupedData);
  };

  const availableYears = Object.keys(yearlyData).sort((a, b) => b - a);
  const dataForYear = yearlyData[selectedYear] || { byType: {}, byMonth: [], totalWithdrawals: 0 };

  const pieChartData = {
    labels: ['Withdrawals', 'Top-ups', 'Savings', 'Logs'],
    datasets: [{
      data: [dataForYear.byType.W || 0, dataForYear.byType.T || 0, dataForYear.byType.S || 0, dataForYear.byType.na || 0],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    }],
  };

  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
    {
      label: 'Withdrawals',
      // Map the monthly data to get just the withdrawals
      data: dataForYear.byMonth.map(m => m.withdrawals),
      backgroundColor: 'rgba(255, 99, 132, 0.7)', // Red
    },
    {
      label: 'Top-ups',
      // Map the monthly data to get just the topups
      data: dataForYear.byMonth.map(m => m.topups),
      backgroundColor: 'rgba(54, 162, 235, 0.7)', // Blue
    },
    {
      label: 'Savings',
      // Map the monthly data to get just the savings
      data: dataForYear.byMonth.map(m => m.savings),
      backgroundColor: 'rgba(255, 206, 86, 0.7)', // Yellow
    },
  ],
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Expenditure Analysis</h1>

        {/* --- Search Input Field --- */}
        <div className="form-group">
          <label htmlFor="search-input">Filter by Description:</label>
          <input
            type="text"
            id="search-input"
            placeholder="e.g., groceries, fuel..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ minWidth: '250px' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="year-select">Select Year:</label>
          <select id="year-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      {/* --- NEW: Display Search Result Card --- */}
      {searchTotal !== null && (
        <div className="tax-card search-result-card">
          <h3>Filtered Results for "{searchTerm}"</h3>
          <div className="summary-item highlight">
            <span>Total Spending</span>
            <strong>{formatCurrency(searchTotal)}</strong>
          </div>
        </div>
      )}

      <div className="top-summary-container">
        <div className="tax-card">
          <h3>Summary for {selectedYear}</h3>
          <div className="yearly-summary-grid" style={{gridTemplateColumns: 'repeat(2, minmax(150px, 1fr))'}}>
            <div className="summary-item highlight" style={{backgroundColor: '#fff0f2'}}>
                <span>Total Withdrawals</span>
                <strong>{formatCurrency(dataForYear.totalWithdrawals)}</strong>
            </div>
            <div className="summary-item highlight" style={{backgroundColor: '#eef7ff'}}>
                <span>Total Top-ups</span>
                <strong>{formatCurrency(dataForYear.totalTopups)}</strong>
            </div>
            <div className="summary-item highlight" style={{backgroundColor: '#fff9e9'}}>
                <span>Total Savings</span>
                <strong>{formatCurrency(dataForYear.totalSavings)}</strong>
            </div>
            </div>
        </div>
        <div className="tax-card">
          <h3>Transactions by Type</h3>
          <div style={{height: '250px', display: 'flex', justifyContent: 'center'}}>
            <Pie data={pieChartData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
      </div>

      <div className="tax-card" style={{marginTop: '2rem'}}>
        <h3>Withdrawals by Month for {selectedYear}</h3>
        <Bar data={barChartData} />
      </div>
    </div>
  );
};

export default ExpenditureAnalysisPage;
