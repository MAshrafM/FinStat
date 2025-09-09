// frontend/src/pages/PaycheckLog.js
import React, { useState, useEffect, useCallback } from 'react';
import PaycheckTable from './PaycheckTable';
import { getPaychecksLog, deletePaycheck, getPaychecks } from '../../services/paycheckService';
import PaginationControls from '../../components/PaginationControls';
import { formatCurrency } from '../../utils/formatters';

const PaycheckLog = () => {
    const [paychecks, setPaychecks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedYear, setSelectedYear] = useState('all');
    const [summaryData, setSummaryData] = useState({
        totalCash: 0,
        totalPrepaid: 0,
        overallTotal: 0,
        yearlyBreakdown: {},
        yearlyChanges: {}
    });

    useEffect(() => {
        // Load all paychecks for summary calculations
        getPaychecks().then(response => {
            calculateSummaryData(response);
        });
    }, []);

    const calculateSummaryData = (paychecksData) => {
        let totalCash = 0;
        let totalPrepaid = 0;
        const yearlyBreakdown = {};

        // Process all paychecks
        paychecksData.forEach(paycheck => {
            const year = paycheck.month.substring(0, 4);
            const amount = paycheck.amount || 0;

            // Initialize year if not exists
            if (!yearlyBreakdown[year]) {
                yearlyBreakdown[year] = {
                    cash: 0,
                    prepaid: 0,
                    total: 0
                };
            }

            // Add to totals and yearly breakdown
            if (paycheck.type === 'Cash') {
                totalCash += amount;
                yearlyBreakdown[year].cash += amount;
            } else if (paycheck.type === 'Prepaid') {
                totalPrepaid += amount;
                yearlyBreakdown[year].prepaid += amount;
            }

            yearlyBreakdown[year].total += amount;
        });

        // Calculate year-over-year changes
        const years = Object.keys(yearlyBreakdown).sort();
        const yearlyChanges = {};

        for (let i = 1; i < years.length; i++) {
            const currentYear = years[i];
            const previousYear = years[i - 1];
            const currentTotal = yearlyBreakdown[currentYear].total;
            const previousTotal = yearlyBreakdown[previousYear].total;

            if (previousTotal > 0) {
                const changeAmount = currentTotal - previousTotal;
                const changePercentage = ((changeAmount / previousTotal) * 100).toFixed(1);
                yearlyChanges[currentYear] = {
                    amount: changeAmount,
                    percentage: changePercentage,
                    direction: changeAmount >= 0 ? 'increase' : 'decrease'
                };
            }
        }

        setSummaryData({
            totalCash,
            totalPrepaid,
            overallTotal: totalCash + totalPrepaid,
            yearlyBreakdown,
            yearlyChanges
        });
    };

    const loadPaychecks = useCallback((page, year = selectedYear) => {
        getPaychecksLog(page, 25, year).then(response => {
            setPaychecks(response.data);
            setTotalPages(response.totalPages);
        });
    }, [selectedYear]);

    useEffect(() => {
        loadPaychecks(currentPage, selectedYear);
    }, [currentPage, selectedYear, loadPaychecks]);

    const handleDeletePaycheck = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            await deletePaycheck(id);
            loadPaychecks(currentPage);
            // Refresh summary data
            const updatedPaychecks = await getPaychecks();
            calculateSummaryData(updatedPaychecks);
        }
    };

    const handleYearFilter = (year) => {
        setSelectedYear(year);
        setCurrentPage(1); // Reset to first page when changing filter
    };

    const availableYears = Object.keys(summaryData.yearlyBreakdown).sort((a, b) => b - a);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Paycheck Log</h1>
            </div>

            {/* Overall Summary Card */}
            <div className="summary-section" style={{ marginBottom: '2rem' }}>
                <div className="tax-card">
                    <h3>💰 Overall Summary</h3>
                    <div className="summary-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div className="summary-item highlight" style={{
                            backgroundColor: '#f0f9ff',
                            border: '2px solid #0ea5e9',
                            borderRadius: '8px',
                            padding: '1rem'
                        }}>
                            <span style={{ color: '#0369a1', fontWeight: '500' }}>Total Cash</span>
                            <strong style={{ color: '#0369a1', fontSize: '1.4rem' }}>
                                {formatCurrency(summaryData.totalCash)}
                            </strong>
                        </div>
                        <div className="summary-item highlight" style={{
                            backgroundColor: '#fef3c7',
                            border: '2px solid #f59e0b',
                            borderRadius: '8px',
                            padding: '1rem'
                        }}>
                            <span style={{ color: '#d97706', fontWeight: '500' }}>Total Prepaid</span>
                            <strong style={{ color: '#d97706', fontSize: '1.4rem' }}>
                                {formatCurrency(summaryData.totalPrepaid)}
                            </strong>
                        </div>
                        <div className="summary-item highlight" style={{
                            backgroundColor: '#ecfdf5',
                            border: '2px solid #10b981',
                            borderRadius: '8px',
                            padding: '1rem'
                        }}>
                            <span style={{ color: '#047857', fontWeight: '500' }}>Overall Total</span>
                            <strong style={{ color: '#047857', fontSize: '1.4rem' }}>
                                {formatCurrency(summaryData.overallTotal)}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yearly Breakdown */}
            <div className="yearly-breakdown-section" style={{ marginBottom: '2rem' }}>
                <div className="tax-card">
                    <h3>📊 Yearly Breakdown & Growth</h3>
                    <div className="yearly-cards" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {availableYears.map(year => {
                            const yearData = summaryData.yearlyBreakdown[year];
                            const changeData = summaryData.yearlyChanges[year];

                            return (
                                <div key={year} className="year-card" style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <h4 style={{ margin: 0, color: '#374151', fontSize: '1.2rem' }}>{year}</h4>
                                        {changeData && (
                                            <div style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                fontWeight: '500',
                                                backgroundColor: changeData.direction === 'increase' ? '#dcfce7' : '#fef2f2',
                                                color: changeData.direction === 'increase' ? '#166534' : '#dc2626'
                                            }}>
                                                {changeData.direction === 'increase' ? '↗️' : '↘️'} {changeData.percentage}%
                                            </div>
                                        )}
                                    </div>

                                    <div className="year-details" style={{ fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span>Cash:</span>
                                            <strong>{formatCurrency(yearData.cash)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span>Prepaid:</span>
                                            <strong>{formatCurrency(yearData.prepaid)}</strong>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: '0.5rem',
                                            borderTop: '1px solid #d1d5db',
                                            fontWeight: '600'
                                        }}>
                                            <span>Total:</span>
                                            <strong>{formatCurrency(yearData.total)}</strong>
                                        </div>

                                        {changeData && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                fontSize: '0.8rem',
                                                color: '#6b7280'
                                            }}>
                                                {changeData.direction === 'increase' ? '+' : ''}{formatCurrency(changeData.amount)} vs prev year
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section" style={{ marginBottom: '2rem' }}>
                <div className="tax-card">
                    <h3>🔍 Filter by Year</h3>
                    <div className="filter-buttons" style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => handleYearFilter('all')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: selectedYear === 'all' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: selectedYear === 'all' ? '#eff6ff' : 'white',
                                color: selectedYear === 'all' ? '#1e40af' : '#374151',
                                cursor: 'pointer',
                                fontWeight: selectedYear === 'all' ? '600' : '400'
                            }}
                        >
                            All Years
                        </button>
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => handleYearFilter(year)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: selectedYear === year ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    backgroundColor: selectedYear === year ? '#eff6ff' : 'white',
                                    color: selectedYear === year ? '#1e40af' : '#374151',
                                    cursor: 'pointer',
                                    fontWeight: selectedYear === year ? '600' : '400'
                                }}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                    {selectedYear !== 'all' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            color: '#4b5563'
                        }}>
                            📅 Showing paychecks for {selectedYear} only
                        </div>
                    )}
                </div>
            </div>

            {/* Paycheck Table */}
            <div className="table-section">
                <PaycheckTable paychecks={paychecks} onPaycheckDeleted={handleDeletePaycheck} />
                <PaginationControls
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default PaycheckLog;