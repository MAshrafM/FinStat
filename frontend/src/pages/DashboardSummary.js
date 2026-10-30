// frontend/src/pages/Dashboard.js
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaRegCalendarAlt,
    FaChartPie, FaBookOpen, FaBook,
    FaBalanceScale
} from 'react-icons/fa'; // Import new icons
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { useData } from '../context/DataContext';
import { useGoldData } from '../context/GoldContext';
import { useMFData } from '../context/MFContext';
import { useCertData } from '../context/CertContext';
import { useCurrData } from '../context/CurrContext';
import { useBankData } from '../context/BankContext';
import { useCreditData } from '../context/CreditContext';
import { getRealEstates } from '../services/realEstateService';
import { getBudgetProgress } from '../services/budgetService';
import { getCertificates } from '../services/certificateService';
import { getCurrency } from '../services/currencyService';

import { formatCurrency } from '../utils/formatters'; // Utility to format currency }
import { safePercentage, normDiv } from '../utils/helper'; // Import safe division and percentage functions }
import './Dashboard.css'; // We will create this CSS file

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// Constants
const INIT_YEAR = 2022;
const CURRENT_YEAR = new Date().getFullYear();
const INVESTMENT_PERIOD = CURRENT_YEAR - INIT_YEAR;
// Cache for dashboard data
let dashboardCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// Safe data access helpers
const safeArray = (data) => Array.isArray(data) ? data : [];
const safeNumber = (value) => typeof value === 'number' && !isNaN(value) ? value : 0;
const safeObject = (obj) => obj && typeof obj === 'object' ? obj : {};

const Summary = () => {
    // Local loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [budgetProgressList, setBudgetProgressList] = useState([]);
    const [savingsForexSummary, setSavingsForexSummary] = useState({
        totalCertValue: 0,
        activeCertCount: 0,
        totalForexValue: 0,
        totalForexGainLoss: 0,
        forexHoldingCount: 0,
    });

    // Fetch and cache dashboard data
    const { summaryMetrics = {} } = useData(); // Access any global data if needed
    const { overallTotalPaid = 0, goldtotalNow = 0 } = useGoldData();
    const { overallTotals = {} } = useMFData();
    const { certificateSummary = {} } = useCertData();
    const { currencySummary = [] } = useCurrData();
    const { bankAccountData = {} } = useBankData();
    const { creditCardsSummary = {} } = useCreditData();
    const [realEstates, setRealEstates] = useState([]);

    useEffect(() => {
        getRealEstates({ status: 'Owned' })
            .then((data) => setRealEstates(data || []))
            .catch((err) => console.error('Failed to load real estate for summary:', err));

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        getBudgetProgress({ period: 'monthly', year: currentYear, month: currentMonth })
            .then((res) => {
                const list = Array.isArray(res) ? res : res?.data || [];
                setBudgetProgressList(list);
            })
            .catch(() => setBudgetProgressList([]));

        Promise.all([
            getCertificates().catch(() => []),
            getCurrency().catch(() => []),
        ]).then(([certsRes, currRes]) => {
            const certs = Array.isArray(certsRes) ? certsRes : certsRes?.data || [];
            const currs = Array.isArray(currRes) ? currRes : currRes?.data || [];

            const now = new Date();
            const activeCerts = certs.filter((c) => {
                if (c.status === 'withdrawn' || c.status === 'matured') return false;
                if (c.displayStatus === 'withdrawn' || c.displayStatus === 'matured' || c.displayStatus === 'future') return false;

                const start = c.startDate ? new Date(c.startDate) : null;
                if (start && now < start) return false;

                let mat = c.maturityDate ? new Date(c.maturityDate) : null;
                if (!mat && start && c.period) {
                    mat = new Date(start);
                    mat.setMonth(mat.getMonth() + Number(c.period));
                }
                if (mat && now > mat) return false;

                return true;
            });
            const totalCertValue = activeCerts.reduce((acc, c) => acc + Number(c.amount || 0), 0);

            const totalForexValue = currs.reduce(
                (acc, c) => acc + Number(c.currentValue || c.amount * (c.currentRate || c.purchaseRate || 0) || 0),
                0
            );
            const totalForexCost = currs.reduce((acc, c) => acc + Number(c.costBasis || c.price || 0), 0);
            const totalForexGainLoss = totalForexValue - totalForexCost;

            setSavingsForexSummary({
                totalCertValue,
                activeCertCount: activeCerts.length,
                totalForexValue,
                totalForexGainLoss,
                forexHoldingCount: currs.length,
            });
        }).catch(() => {});
    }, []);

    // Safely process currency data
    const safeCurrencySummary = useMemo(() => {
        return safeArray(currencySummary);
    }, [currencySummary]);

    // Memoized calculations to prevent recalculation on every render
    const calculations = useMemo(() => {
        const currencyTotalPrice = safeCurrencySummary.reduce((sum, item) =>
            sum + safeNumber(item.totalPrice), 0);
        const currencyCurrentValue = safeCurrencySummary.reduce((sum, item) =>
            sum + (safeNumber(item.currentPrice) * safeNumber(item.totalAmount)), 0);

        const goldPaid = safeNumber(overallTotalPaid);
        const goldCurrent = safeNumber(goldtotalNow);

        const certAmount = safeNumber(safeObject(certificateSummary).totalActiveAmount);
        const certReturns = safeNumber(safeObject(certificateSummary).totalExpectedReturns);

        const mfAmount = safeNumber(safeObject(overallTotals).totalOfAllMF);
        const mfValue = safeNumber(safeObject(overallTotals).totalSellingValue);
        const mfProfit = safeObject(overallTotals).totalProfit;

        const stockAmount = safeNumber(safeObject(summaryMetrics).netDeposits);
        const stockProfit = safeNumber(safeObject(summaryMetrics).totalProfitNow);
        const stockCurrent = stockAmount + stockProfit;

        const bankBalance = safeNumber(safeObject(bankAccountData).bank);
        const creditAvailable = safeNumber(safeObject(creditCardsSummary).totalAvailable);
        const creditOutstanding = safeNumber(safeObject(creditCardsSummary).totalOutstanding);

        // Real estate (dynamic from DB)
        const realEstateTotalPaid = realEstates.reduce((sum, item) => sum + safeNumber(item.purchasePrice), 0);
        const realEstateTotalCurrent = realEstates.reduce((sum, item) => sum + safeNumber(item.currentValuation), 0);

        // Total calculations
        const totalPaid = goldPaid + certAmount + mfAmount + stockAmount + bankBalance + currencyTotalPrice + realEstateTotalPaid;
        const totalCurrent = goldCurrent + certAmount + mfValue + stockCurrent + bankBalance + currencyCurrentValue + realEstateTotalCurrent;

        // CAGR calculations with safe division
        const goldCAGR = goldPaid > 0 ? ((Math.pow(normDiv(goldCurrent, goldPaid), (1 / INVESTMENT_PERIOD)) - 1) * 100).toFixed(2) : 0;
        const certCAGR = certAmount > 0 ? ((Math.pow(normDiv(certReturns, certAmount), (1 / INVESTMENT_PERIOD)) - 1) * 100).toFixed(2) : 0;
        const mfCAGR = mfAmount > 0 ? ((Math.pow(normDiv(mfValue, mfAmount), (1 / INVESTMENT_PERIOD)) - 1) * 100).toFixed(2) : 0;
        const stockCAGR = stockAmount > 0 ? ((Math.pow(normDiv(stockCurrent, stockAmount), (1 / INVESTMENT_PERIOD)) - 1) * 100).toFixed(2) : 0;

        return {
            goldPaid, goldCurrent, goldCAGR,
            certAmount, certReturns, certCAGR,
            mfAmount, mfValue, mfProfit, mfCAGR,
            stockAmount, stockCurrent, stockCAGR,
            bankBalance, creditAvailable, creditOutstanding,
            currencyTotalPrice, currencyCurrentValue,
            realEstateTotalPaid, realEstateTotalCurrent,
            realEstates,
            totalPaid, totalCurrent
        };
    }, [
        overallTotalPaid, goldtotalNow, certificateSummary, overallTotals,
        summaryMetrics, bankAccountData, creditCardsSummary, safeCurrencySummary, realEstates
    ]);

    // Memoized chart data
    const chartData = useMemo(() => {
        const paidAmountsData = {
            labels: ['Gold', 'Bank Certificates', 'MF Funds', 'Stock Trading', 'Bank Account', 'Foreign Currency'],
            datasets: [{
                label: 'Total Paid Amounts',
                data: [
                    calculations.goldPaid,
                    calculations.certAmount,
                    calculations.mfAmount,
                    calculations.stockAmount,
                    calculations.bankBalance,
                    calculations.currencyTotalPrice,
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            }],
        };

        const currentValuesData = {
            labels: ['Gold', 'Bank Certificates', 'MF Funds', 'Stock Trading', 'Bank Account', 'Foreign Currency'],
            datasets: [{
                label: 'Current Values',
                data: [
                    calculations.goldCurrent,
                    calculations.certAmount,
                    calculations.mfValue,
                    calculations.stockCurrent,
                    calculations.bankBalance,
                    calculations.currencyCurrentValue,
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            }],
        };

        return { paidAmountsData, currentValuesData };
    }, [calculations]);

    // Chart options (memoized to prevent re-creation)
    const chartOptions = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.label}: ${formatCurrency(context.raw)}`;
                    },
                },
            },
            datalabels: {
                formatter: (value, context) => {
                    const total = context.dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return percentage > 0 ? `${percentage}%` : '';
                },
                color: '#fff',
                font: {
                    weight: 'bold',
                },
                anchor: 'center',
                align: 'center',
            },
        },
    }), []);

    // Check if data is still loading
    useEffect(() => {
        const hasMinimumData = summaryMetrics && overallTotalPaid !== undefined &&
            overallTotals && certificateSummary &&
            safeCurrencySummary && bankAccountData && creditCardsSummary;

        if (hasMinimumData) {
            setIsLoading(false);
            setError(null);
        }
    }, [summaryMetrics, overallTotalPaid, overallTotals, certificateSummary,
        safeCurrencySummary, bankAccountData, creditCardsSummary]);

    // Cache dashboard data
    useEffect(() => {
        if (!isLoading && calculations) {
            const now = Date.now();
            dashboardCache = { calculations, chartData, timestamp: now };
            lastCacheTime = now;
        }
    }, [isLoading, calculations, chartData]);

    // Use cached data if available and fresh
    const shouldUseCache = useCallback(() => {
        if (!dashboardCache || !lastCacheTime) return false;
        return (Date.now() - lastCacheTime) < CACHE_DURATION;
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your financial dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="page-container">
                <div className="error-container">
                    <h2>Unable to load dashboard</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    // Use cached data if available
    const displayData = shouldUseCache() ? dashboardCache : { calculations, chartData };


    return (
        <div className="page-container">
            <h1>Profile Summary</h1>
            <p>Comprehensive overview of your complete financial portfolio and holdings.</p>
            <div className="dashboard-summary">
                <h2>Total Current Holdings</h2>
                <h2>{formatCurrency(displayData.calculations.totalCurrent)}</h2>
            </div>

            {/* Savings & Forex Summary Card Widget */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    borderRadius: '16px',
                    border: '1px solid #4338ca',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                        <span>🏛️</span> Savings, Fixed Income &amp; Foreign Currency
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link to="/certificates" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                            Certificates &rarr;
                        </Link>
                        <Link to="/currency" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                            Currency Wallet &rarr;
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Certificate Value</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', margin: '4px 0', color: '#c7d2fe' }}>
                            {formatCurrency(savingsForexSummary.totalCertValue)}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                            {savingsForexSummary.activeCertCount} active bank certificate(s)
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Foreign Currency Value</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', margin: '4px 0', color: '#7dd3fc' }}>
                            {formatCurrency(savingsForexSummary.totalForexValue)}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                            EGP equivalent ({savingsForexSummary.forexHoldingCount} holdings)
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unrealized Forex Gain / Loss</div>
                        <div
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                margin: '4px 0',
                                color: savingsForexSummary.totalForexGainLoss >= 0 ? '#4ade80' : '#f87171',
                            }}
                        >
                            {savingsForexSummary.totalForexGainLoss >= 0 ? '+' : ''}
                            {formatCurrency(savingsForexSummary.totalForexGainLoss)}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                            calculated via daily CIB rates
                        </div>
                    </div>
                </div>
            </div>

            {/* Budget Progress Preview Widget */}
            {budgetProgressList.length > 0 && (
                <div
                    style={{
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        padding: '1.25rem 1.5rem',
                        marginBottom: '2rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaChartPie style={{ color: '#3b82f6' }} /> Current Month Budget ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
                        </h3>
                        <Link
                            to="/expenditures/budgets"
                            style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                        >
                            View All Budgets &rarr;
                        </Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        {budgetProgressList.map((bp) => {
                            const barColor =
                                bp.alertStatus === 'red' ? '#ef4444' : bp.alertStatus === 'yellow' ? '#f59e0b' : '#10b981';
                            return (
                                <div
                                    key={bp.budgetId}
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '0.85rem 1rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                        <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{bp.category}</strong>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: barColor }}>
                                            {bp.percentageUsed}%
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            height: '6px',
                                            background: '#e2e8f0',
                                            borderRadius: '9999px',
                                            overflow: 'hidden',
                                            marginBottom: '0.35rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${Math.min(100, bp.percentageUsed)}%`,
                                                background: barColor,
                                                borderRadius: '9999px',
                                            }}
                                        ></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                                        <span>Spent: {formatCurrency(bp.spentAmount)}</span>
                                        <span>Limit: {formatCurrency(bp.budgetedAmount)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="dashboard-summary dashboard-charts">
                <div className="sum-chart-container">
                    <h3>Total Paid Amounts</h3>
                    <div style={{ height: '400px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={displayData.chartData.paidAmountsData} options={chartOptions} />
                    </div>
                </div>
                <div className="sum-chart-container">
                    <h3>Current Values</h3>
                    <div style={{ height: '400px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={displayData.chartData.currentValuesData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <div className="dashboard-summary">
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>Gold</h3>
                        <div className="dashboard-card-items">
                            <div className="dashboard-card-item">
                                <span className="description">Total Paid:</span>
                                <span className="value">{formatCurrency(displayData.calculations.goldPaid)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Total Now:</span>
                                <span className="value">{formatCurrency(displayData.calculations.goldCurrent)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Change:</span>
                                <span className="value">{safePercentage(displayData.calculations.goldCurrent, displayData.calculations.goldPaid)}%</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">CAGR:</span>
                                <span className="value">{displayData.calculations.goldCAGR}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-card">
                        <h3>Bank Certificates</h3>
                        <div className="dashboard-card-items">
                            <div className="dashboard-card-item">
                                <span className="description">Total Amount</span>
                                <span className="value">{formatCurrency(displayData.calculations.certAmount)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Exp. Returns</span>
                                <span className="value">{formatCurrency(displayData.calculations.certReturns)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Change:</span>
                                <span className="value">{safePercentage(displayData.calculations.certReturns, displayData.calculations.certAmount)}%</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">CAGR:</span>
                                <span className="value">{displayData.calculations.certCAGR}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>MF Funds</h3>
                        <div className="dashboard-card-items">
                            <div className="dashboard-card-item">
                                <span className="description">Total Amount</span>
                                <span className="value">{formatCurrency(displayData.calculations.mfAmount)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Selling Value</span>
                                <span className="value">{formatCurrency(displayData.calculations.mfValue)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Change:</span>
                                <span className="value">{(displayData.calculations.mfProfit)} %</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">CAGR:</span>
                                <span className="value">{displayData.calculations.mfCAGR}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Stock Trading</h3>
                        <div className="dashboard-card-items">
                            <div className="dashboard-card-item">
                                <span className="description">Net Deposits</span>
                                <span className="value">{formatCurrency(displayData.calculations.stockAmount)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Current Value</span>
                                <span className="value">{formatCurrency(displayData.calculations.stockCurrent)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Change:</span>
                                <span className="value">{safePercentage(displayData.calculations.stockCurrent, displayData.calculations.stockAmount)} %</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">CAGR:</span>
                                <span className="value">{displayData.calculations.stockCAGR}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-card">
                        <h3>Bank Account</h3>
                        <div className="dashboard-card-items">
                            <div className="dashboard-card-item">
                                <span className="description">Balance</span>
                                <span className="value">{formatCurrency(displayData.calculations.bankBalance)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Credit Av. Limit</span>
                                <span className="value">{formatCurrency(displayData.calculations.creditAvailable)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Credit Due</span>
                                <span className="value">{formatCurrency(displayData.calculations.creditOutstanding)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Foreign Currency Card */}
                    <div className="dashboard-card">
                        <h3>Foreign Currency</h3>
                        {safeCurrencySummary.length > 0 ? (
                            safeCurrencySummary.map((curr) => (
                                <div key={curr._id || Math.random()} className="dashboard-card-items">
                                    <div className="dashboard-card-item">
                                        <span className="description">Currency</span>
                                        <span className="value">{curr._id}</span>
                                    </div>
                                    <div className="dashboard-card-item">
                                        <span className="description">Total Amount</span>
                                        <span className="value">{formatCurrency(safeNumber(curr.totalAmount))}</span>
                                    </div>
                                    <div className="dashboard-card-item">
                                        <span className="description">Current Value</span>
                                        <span className="value">{formatCurrency(safeNumber(curr.currentPrice) * safeNumber(curr.totalAmount))}</span>
                                    </div>
                                    <div className="dashboard-card-item">
                                        <span className="description">Rate</span>
                                        <span className="value">{safePercentage(safeNumber(curr.currentPrice) * safeNumber(curr.totalAmount), safeNumber(curr.totalPrice))}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="dashboard-card-items">
                                <div className="dashboard-card-item">
                                    <span className="description">No currency data available</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="dashboard-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0 }}>Real Estate</h3>
                            <Link to="/real-estate" style={{ color: '#38bdf8', fontSize: '0.85rem', textDecoration: 'none' }}>
                                Manage ↗
                            </Link>
                        </div>
                        {realEstates && realEstates.length > 0 ? (
                            realEstates.map((prop) => (
                                <div key={prop._id} className="dashboard-card-items" style={{ marginBottom: '12px' }}>
                                    <div className="dashboard-card-item">
                                        <span className="description">{prop.name}</span>
                                        <span className="value">{prop.area > 0 ? `${prop.area}m²` : prop.type}</span>
                                    </div>
                                    <div className="dashboard-card-item">
                                        <span className="description">Paid</span>
                                        <span className="value">{formatCurrency(prop.purchasePrice)}</span>
                                    </div>
                                    <div className="dashboard-card-item">
                                        <span className="description">Est. Valuation</span>
                                        <span className="value">{formatCurrency(prop.currentValuation)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="dashboard-card-items">
                                <div className="dashboard-card-item">
                                    <span className="description">No real estate recorded</span>
                                    <Link to="/real-estate/new" style={{ color: '#ec4899', fontSize: '0.85rem' }}>+ Add Property</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="dashboard-grid">
                <Link to="/analysis/payroll" className="dashboard-card">
                    <FaRegCalendarAlt size={50} />
                    <h2>Payroll Analytics</h2>
                    <p>Analyze income across Calendar and Fiscal cycles with interactive switching.</p>
                </Link>
                <Link to="/expenditure-analysis" className="dashboard-card">
                    <FaChartPie size={50} />
                    <h2>Expenditure Analysis</h2>
                    <p>Visualize your spending habits and fund flow.</p>
                </Link>
                <Link to="/trade-summary" className="dashboard-card">
                    <FaBookOpen size={50} />
                    <h2>Trade Summary</h2>
                    <p>View aggregated results of your trading positions.</p>
                </Link>
                <Link to="/mutual-funds/summary" className="dashboard-card">
                    <FaBook size={50} />
                    <h2>Mutual Fund Summary</h2>
                    <p>View aggregated results of your fund investments.</p>
                </Link>
                <Link to="/gold-wallet/summary" className="dashboard-card">
                    <FaBalanceScale size={50} />
                    <h2>Gold Summary</h2>
                    <p>View summary and performance of your gold assets.</p>
                </Link>
            </div>
        </div>
    );
};

export default Summary;
