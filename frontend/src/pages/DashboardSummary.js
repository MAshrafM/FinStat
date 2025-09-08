// frontend/src/pages/Dashboard.js
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarAlt, FaChartArea,
         FaShieldAlt, FaFileInvoiceDollar,
         FaChartPie, FaBookOpen, FaBook,
     FaBalanceScale} from 'react-icons/fa'; // Import new icons
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
    // Fetch and cache dashboard data
    const { summaryMetrics = {} } = useData(); // Access any global data if needed
    const {overallTotalPaid = 0, goldtotalNow = 0} = useGoldData();
    const {overallTotals = {}} = useMFData();
    const {certificateSummary = {}} = useCertData();
    const {currencySummary = []} = useCurrData();
    const {bankAccountData = {}} = useBankData();
    const {creditCardsSummary = {}} = useCreditData();

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
        const mfProfit = safeNumber(safeObject(overallTotals).totalProfit);
        
        const stockAmount = safeNumber(safeObject(summaryMetrics).topUps);
        const stockProfit = safeNumber(safeObject(summaryMetrics).totalProfitNow);
        const stockCurrent = stockAmount + stockProfit;
        
        const bankBalance = safeNumber(safeObject(bankAccountData).bank);
        const creditAvailable = safeNumber(safeObject(creditCardsSummary).totalAvailable);
        const creditOutstanding = safeNumber(safeObject(creditCardsSummary).totalOutstanding);

        // Real estate (hardcoded values)
        const realEstatePaid = 334125;
        const realEstateValue = 800000;

        // Total calculations
        const totalPaid = goldPaid + certAmount + mfAmount + stockAmount + bankBalance + currencyTotalPrice;
        const totalCurrent = goldCurrent + certAmount + mfValue + stockCurrent + bankBalance + currencyCurrentValue;

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
            realEstatePaid, realEstateValue,
            totalPaid, totalCurrent
        };
    }, [
        overallTotalPaid, goldtotalNow, certificateSummary, overallTotals,
        summaryMetrics, bankAccountData, creditCardsSummary, safeCurrencySummary
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
      <h1>Welcome to Your Dashboard</h1>
          <p>Select a feature to get started.</p>
          <div className="dashboard-summary">
                  <h2>Total Current Holdings</h2>
                  <h2>{formatCurrency(displayData.calculations.totalCurrent)}</h2>
          </div>

          <div className="dashboard-summary dashboard-charts">
                <div className="chart-container">
                    <h3>Total Paid Amounts</h3>
                    <div style={{ height: '400px', display: 'flex', justifyContent: 'center'}}>
                        <Pie data={displayData.chartData.paidAmountsData} options={chartOptions} />
                    </div>
                </div>
                <div className="chart-container">
                    <h3>Current Values</h3>
                    <div style={{ height: '400px', display: 'flex', justifyContent: 'center'}}>
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
                          <span className="description">Total Amount</span>
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
                      <h3>Realstate</h3>
                      <div className="dashboard-card-items">
                          <div className="dashboard-card-item">
                              <span className="description">Paid</span>
                              <span className="value">{formatCurrency(displayData.calculations.realEstatePaid)}</span>
                          </div>
                          <div className="dashboard-card-item">
                              <span className="description">Estimated Sell</span>
                              <span className="value">{formatCurrency(displayData.calculations.realEstateValue)}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      <div className="dashboard-grid">
        <Link to="/analysis/calendar" className="dashboard-card">
          <FaRegCalendarAlt size={50} />
          <h2>Calendar Year Analysis</h2>
          <p>Analyze income from January to December of each year.</p>
        </Link>
        <Link to="/analysis/fiscal" className="dashboard-card">
          <FaChartArea size={50} />
          <h2>Fiscal Year Analysis</h2>
          <p>Analyze income based on a July to June fiscal cycle.</p>
        </Link>
        <Link to="/expenditure-analysis" className="dashboard-card">
          <FaChartPie size={50} />
          <h2>Expenditure Analysis</h2>
          <p>Visualize your spending habits and fund flow.</p>
        </Link>
        <Link to="/social-insurance" className="dashboard-card">
          <FaShieldAlt size={50} />
          <h2>Social Insurance</h2>
          <p>Track yearly registered income and paycheck deductions.</p>
        </Link>
        <Link to="/taxes" className="dashboard-card">
          <FaFileInvoiceDollar size={50} />
          <h2>Taxes</h2>
          <p>View tax brackets and track yearly tax deductions.</p>
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
