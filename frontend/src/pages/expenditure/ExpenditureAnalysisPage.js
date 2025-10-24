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
    const [overallSummary, setOverallSummary] = useState({
        totalWithdrawals: 0,
        totalTopups: 0,
        totalSavings: 0,
        volumeByType: { W: 0, T: 0, S: 0 }
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [allExpenditures, setAllExpenditures] = useState([]);
    const [allPaychecks, setAllPaychecks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTotal, setSearchTotal] = useState(null);

    useEffect(() => {
        Promise.all([
            getAllExpendituresForAnalysis(),
            getPaychecks()
        ]).then(([expenditures, paychecks]) => {
            setAllExpenditures(expenditures);
            setAllPaychecks(paychecks);
        }).catch(err => console.error("Failed to load analysis data:", err));
    }, []);

    useEffect(() => {
        if (allExpenditures.length > 0) {
            processData(allExpenditures, allPaychecks, searchTerm);
        }
    }, [allExpenditures, allPaychecks, searchTerm]);

    const processData = (expenditures, paychecks, currentSearchTerm) => {
        // Filter data based on search term first
        let filteredExpenditures = expenditures;
        let currentSearchTotal = null;

        if (currentSearchTerm && currentSearchTerm.trim() !== '') {
            const lowercasedTerm = currentSearchTerm.toLowerCase();
            filteredExpenditures = expenditures.filter(item =>
                item.description && item.description.toLowerCase().includes(lowercasedTerm)
            );

            currentSearchTotal = filteredExpenditures.reduce((sum, item) => {
                return sum + item.transactionValue;
            }, 0);
        }
        setSearchTotal(currentSearchTotal);

        const groupedData = {};
        const overallTotals = {
            totalWithdrawals: 0,
            totalTopups: 0,
            totalSavings: 0,
            volumeByType: { W: 0, T: 0, S: 0 }
        };

        const initializeYear = (year) => {
            if (!groupedData[year]) {
                groupedData[year] = {
                    byType: { W: 0, T: 0, S: 0, log: 0 },
                    volumeByType: { W: 0, T: 0, S: 0 }, // Add volume tracking by type
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
                groupedData[year].volumeByType.W += transactionValue;
                overallTotals.totalWithdrawals += transactionValue;
                overallTotals.volumeByType.W += transactionValue;
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

            groupedData[year].byType[item.transactionType]++;
        });

        // Process Paychecks and merge into the data
        paychecks.forEach(p => {
            if (p.type === 'Prepaid') {
                const year = p.month.substring(0, 4);
                initializeYear(year);

                const month = parseInt(p.month.substring(5, 7), 10) - 1;

                groupedData[year].byMonth[month].topups += p.amount || 0;
                groupedData[year].totalTopups += p.amount || 0;
                groupedData[year].volumeByType.T += p.amount || 0;
                overallTotals.totalTopups += p.amount || 0;
                overallTotals.volumeByType.T += p.amount || 0;

                groupedData[year].byMonth[month].withdrawals += p.amount || 0;
                groupedData[year].totalWithdrawals += p.amount || 0;
                groupedData[year].volumeByType.W += p.amount || 0;
                overallTotals.totalWithdrawals += p.amount || 0;
                overallTotals.volumeByType.W += p.amount || 0;
            }
        });

        // Calculate and Add Passive Bank Savings
        const monthlyBankRecords = {};

        expenditures.forEach(item => {
            const date = new Date(item.date);
            const year = date.getFullYear().toString();
            const month = date.getMonth();
            const key = `${year}-${month}`;

            if (!monthlyBankRecords[key]) {
                monthlyBankRecords[key] = [];
            }
            monthlyBankRecords[key].push({
                date: date,
                bank: item.bank
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
                groupedData[year].byMonth[monthIndex].savings += bankChange;
                groupedData[year].totalSavings += bankChange;
                groupedData[year].volumeByType.S += bankChange;
                overallTotals.totalSavings += bankChange;
                overallTotals.volumeByType.S += bankChange;
            }
        }

        setYearlyData(groupedData);
        setOverallSummary(overallTotals);
    };

    const availableYears = Object.keys(yearlyData).sort((a, b) => b - a);
    const dataForYear = yearlyData[selectedYear] || {
        byType: {},
        volumeByType: { W: 0, T: 0, S: 0 },
        byMonth: [],
        totalWithdrawals: 0,
        totalTopups: 0,
        totalSavings: 0
    };

    // Overall pie chart data (by volume)
    const overallPieChartData = {
        labels: ['Withdrawals', 'Top-ups', 'Savings'],
        datasets: [{
            data: [
                overallSummary.volumeByType.W || 0,
                overallSummary.volumeByType.T || 0,
                overallSummary.volumeByType.S || 0
            ],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        }],
    };

    // Yearly pie chart data (by volume)
    const yearlyPieChartData = {
        labels: ['Withdrawals', 'Top-ups', 'Savings'],
        datasets: [{
            data: [
                dataForYear.volumeByType.W || 0,
                dataForYear.volumeByType.T || 0,
                dataForYear.volumeByType.S || 0
            ],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        }],
    };

    const barChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Withdrawals',
                data: dataForYear.byMonth.map(m => m.withdrawals),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
            {
                label: 'Top-ups',
                data: dataForYear.byMonth.map(m => m.topups),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
            },
            {
                label: 'Savings',
                data: dataForYear.byMonth.map(m => m.savings),
                backgroundColor: 'rgba(255, 206, 86, 0.7)',
            },
        ],
    };

   const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Overall Expenditure` },
    },
  };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Expenditure Analysis</h1>
            </div>

            {/* Overall Summary Card */}
            <div className="top-summary-container" style={{ marginBottom: '2rem' }}>
                <div className="tax-card">
                    <h3>Overall Summary (All Years)</h3>
                    <div className="yearly-summary-grid">
                        <div className="summary-item highlight" style={{ backgroundColor: '#fff0f2' }}>
                            <span>Total Withdrawals</span>
                            <strong>{formatCurrency(overallSummary.totalWithdrawals)}</strong>
                        </div>
                        <div className="summary-item highlight" style={{ backgroundColor: '#eef7ff' }}>
                            <span>Total Top-ups</span>
                            <strong>{formatCurrency(overallSummary.totalTopups)}</strong>
                        </div>
                        <div className="summary-item highlight" style={{ backgroundColor: '#fff9e9' }}>
                            <span>Total Savings</span>
                            <strong>{formatCurrency(overallSummary.totalSavings)}</strong>
                        </div>
                    </div>
                </div>
                <div className="tax-card">
                    <h3>Volume by Type (All Years)</h3>
                    <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={overallPieChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                    </div>
                </div>
            </div>

            {/* Enhanced Search Input */}
            <div className="tax-card" style={{ marginBottom: '2rem' }}>
                <h3>Filter Expenditures</h3>
                <div className="search-container" style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'end',
                    flexWrap: 'wrap'
                }}>
                    <div className="form-group" style={{ flex: '1', minWidth: '250px' }}>
                        <label htmlFor="search-input" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Search by Description
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                id="search-input"
                                placeholder="e.g., groceries, fuel, restaurant..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                            <div style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                pointerEvents: 'none'
                            }}>
                                🔍
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ minWidth: '150px' }}>
                        <label htmlFor="year-select" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Select Year
                        </label>
                        <select
                            id="year-select"
                            value={selectedYear}
                            onChange={e => setSelectedYear(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {availableYears.map(year =>
                                <option key={year} value={year}>{year}</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* Search Result Card */}
            {searchTotal !== null && (
                <div className="tax-card search-result-card" style={{
                    marginBottom: '2rem',
                    border: '2px solid #3b82f6',
                    backgroundColor: '#eff6ff'
                }}>
                    <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>
                        📊 Search Results for "{searchTerm}"
                    </h3>
                    <div className="summary-item highlight" style={{
                        backgroundColor: '#dbeafe',
                        border: '1px solid #93c5fd',
                        padding: '1rem',
                        borderRadius: '6px'
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>Total Spending</span>
                        <strong style={{ fontSize: '1.3rem', color: '#1e40af' }}>
                            {formatCurrency(searchTotal)}
                        </strong>
                    </div>
                </div>
            )}

            {/* Yearly Analysis */}
            <div className="top-summary-container">
                <div className="tax-card">
                    <h3>Summary for {selectedYear}</h3>
                    <div className="yearly-summary-grid">
                        <div className="summary-item highlight" style={{ backgroundColor: '#fff0f2' }}>
                            <span>Total Withdrawals</span>
                            <strong>{formatCurrency(dataForYear.totalWithdrawals)}</strong>
                        </div>
                        <div className="summary-item highlight" style={{ backgroundColor: '#eef7ff' }}>
                            <span>Total Top-ups</span>
                            <strong>{formatCurrency(dataForYear.totalTopups)}</strong>
                        </div>
                        <div className="summary-item highlight" style={{ backgroundColor: '#fff9e9' }}>
                            <span>Total Savings</span>
                            <strong>{formatCurrency(dataForYear.totalSavings)}</strong>
                        </div>
                    </div>
                </div>
                <div className="tax-card">
                    <h3>Volume by Type - {selectedYear}</h3>
                    <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={yearlyPieChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                    </div>
                </div>
            </div>

            <div className="tax-card" style={{ marginTop: '2rem' }}>
                <h3>Monthly Breakdown for {selectedYear}</h3>
                <div className="ex-chart-wrapper">
                    <div className="ex-chart-container">
                        <Bar options={barChartOptions} data={barChartData}  />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenditureAnalysisPage;