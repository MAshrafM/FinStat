// frontend/src/pages/Dashboard.js
import React from 'react';
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
import { formatCurrency } from '../utils/formatters'; // Utility to format currency }
import { safePercentage, normDiv } from '../utils/helper'; // Import safe division and percentage functions }
import './Dashboard.css'; // We will create this CSS file

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const Summary = () => {
    const initYear = 2022; // Set your initial year here
    const currentYear = new Date().getFullYear();
    const investmentPeriod = currentYear - initYear; // Calculate the number of years since initYear
    const {
        certificateSummary,
        summaryMetrics,
        bankAccountData,
        currencySummary,
        creditCardsSummary,
    } = useData(); // Access any global data if needed
    const {overallTotalPaid, goldtotalNow} = useGoldData();
    const {overallTotals} = useMFData();

    // Data for Pie Chart 1: Total Paid Amounts
    const paidAmountsData = {
        labels: ['Gold', 'Bank Certificates', 'MF Funds', 'Stock Trading', 'Bank Account', 'Foreign Currency'],
        datasets: [
            {
                label: 'Total Paid Amounts',
                data: [
                    overallTotalPaid || 0,
                    certificateSummary.totalActiveAmount || 0,
                    overallTotals.totalOfAllMF || 0,
                    summaryMetrics.topUps || 0,
                    bankAccountData.bank || 0,
                    currencySummary.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
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
            },
        ],
    };
    // Data for Pie Chart 2: Current Value of Investments
    const currentValuesData = {
        labels: ['Gold', 'Bank Certificates', 'MF Funds', 'Stock Trading', 'Bank Account', 'Foreign Currency'],
        datasets: [
            {
                label: 'Current Values',
                data: [
                    goldtotalNow || 0,
                    certificateSummary.totalActiveAmount || 0,
                    overallTotals.totalSellingValue || 0,
                    (summaryMetrics.topUps + summaryMetrics.totalProfitNow) || 0,
                    bankAccountData.bank || 0,
                    currencySummary.reduce((sum, item) => sum + (item.currentPrice * item.totalAmount || 0), 0),
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
            },
        ],
    };

    // Chart options
    const chartOptions = {
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
    };

  return (
    <div className="page-container">
      <h1>Welcome to Your Dashboard</h1>
          <p>Select a feature to get started.</p>
          <div className="dashboard-summary">
                  <h2>Total Current Holdings</h2>
                  <h2>
                      {
                          formatCurrency(
                              goldtotalNow +
                              certificateSummary.totalActiveAmount +
                              overallTotals.totalSellingValue +
                              summaryMetrics.topUps + summaryMetrics.totalProfitNow +
                              bankAccountData.bank + currencySummary.reduce((sum,item) => sum + (item.currentPrice * item.totalAmount), 0)
                              
                          )
                      }
                  </h2>
          </div>

          <div className="dashboard-summary dashboard-charts">
                <div className="chart-container">
                    <h3>Total Paid Amounts</h3>
                    <div style={{ height: '400px', display: 'flex', justifyContent: 'center'}}>
                        <Pie data={paidAmountsData} options={chartOptions} />
                    </div>
                </div>
                <div className="chart-container">
                    <h3>Current Values</h3>
                    <div style={{ height: '400px', display: 'flex', justifyContent: 'center'}}>
                        <Pie data={currentValuesData} options={chartOptions} />
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
                          <span className="value">{formatCurrency(overallTotalPaid)}</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">Total Now:</span>
                          <span className="value">{formatCurrency(goldtotalNow)}</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">Change:</span>
                          <span className="value">{safePercentage(goldtotalNow, overallTotalPaid)}%</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">CAGR:</span>
                          <span className="value">{((Math.pow(normDiv(goldtotalNow, overallTotalPaid), (1 / investmentPeriod)) - 1) * 100).toFixed(2)}%</span>
                      </div>
                  </div>
              </div>
              <div className="dashboard-card">
                  <h3>Bank Certificates</h3>
                  <div className="dashboard-card-items">
                      <div className="dashboard-card-item">
                          <span className="description">Total Amount</span>
                          <span className="value">{formatCurrency(certificateSummary.totalActiveAmount)}</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">Exp. Returns</span>
                          <span className="value">{formatCurrency(certificateSummary.totalExpectedReturns)}</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">Change:</span>
                              <span className="value">{safePercentage(certificateSummary.totalExpectedReturns, certificateSummary.totalActiveAmount)}%</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">CAGR:</span>
                          <span className="value">{((Math.pow(normDiv(certificateSummary.totalExpectedReturns, certificateSummary.totalActiveAmount), (1 / investmentPeriod)) - 1) * 100).toFixed(2)}%</span>
                      </div>
                  </div>
              </div>

              <div className="dashboard-card">
                  <h3>MF Funds</h3>
                  <div className="dashboard-card-items">
                      <div className="dashboard-card-item">
                          <span className="description">Total Amount</span>
                          <span className="value">{formatCurrency(overallTotals.totalOfAllMF)}</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">Selling Value</span>
                          <span className="value">{formatCurrency(overallTotals.totalSellingValue)}</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">Change:</span>
                              <span className="value">{(overallTotals.totalProfit)} %</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">CAGR:</span>
                          <span className="value">{((Math.pow(normDiv(overallTotals.totalSellingValue, overallTotals.totalOfAllMF), (1 / investmentPeriod)) - 1) * 100).toFixed(2)}%</span>
                      </div>
                  </div>
              </div>

              <div className="dashboard-card">
                  <h3>Stock Trading</h3>
                  <div className="dashboard-card-items">
                      <div className="dashboard-card-item">
                          <span className="description">Total Amount</span>
                          <span className="value">{formatCurrency(summaryMetrics.topUps)}</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">Current Value</span>
                          <span className="value">{formatCurrency(summaryMetrics.topUps + summaryMetrics.totalProfitNow)}</span>
                      </div>
                      <div className="dashboard-card-item">
                              <span className="description">Change:</span>
                              <span className="value">{safePercentage((summaryMetrics.totalProfitNow + summaryMetrics.topUps), summaryMetrics.topUps)} %</span>
                      </div>
                      <div className="dashboard-card-item">
                          <span className="description">CAGR:</span>
                          <span className="value">{((Math.pow(normDiv((summaryMetrics.totalProfitNow + summaryMetrics.topUps), summaryMetrics.topUps), (1 / investmentPeriod)) - 1) * 100).toFixed(2)}%</span>
                      </div>
                  </div>
                  </div>
                  <div className="dashboard-card">
                      <h3>Bank Account</h3>
                      <div className="dashboard-card-items">
                          <div className="dashboard-card-item">
                              <span className="description">Balance</span>
                              <span className="value">{formatCurrency(bankAccountData.bank)}</span>
                          </div>
                          <div className="dashboard-card-item">
                              <span className="description">Credit Av. Limit</span>
                              <span className="value">{formatCurrency(creditCardsSummary.totalAvailable)}</span>
                          </div>
                          <div className="dashboard-card-item">
                              <span className="description">Credit Due</span>
                              <span className="value">{formatCurrency(creditCardsSummary.totalOutstanding)}</span>
                          </div>
                      </div>
                  </div>

                  <div className="dashboard-card">
                      <h3>Foreign Currency</h3>
                      {currencySummary && currencySummary.length > 0 && (
                    currencySummary.map((curr) => (
                        <div key={curr._id} className="dashboard-card-items">
                            <div className="dashboard-card-item">
                                <span className="description">Currency</span>
                                <span className="value">{curr._id}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Total Amount</span>
                                <span className="value">{formatCurrency(curr.totalAmount)}</span>
                            </div>
                            <div className="dashboard-card-item">
                                <span className="description">Current Value</span>
                                <span className="value">{formatCurrency(curr.currentPrice * curr.totalAmount)} </span>
                            </div>

                            <div className="dashboard-card-item">
                                <span className="description">Rate</span>
                                <span className="value">{safePercentage(curr.currentPrice * curr.totalAmount, curr.totalPrice)} %</span>
                            </div>
                        </div>
                        
                    ))
                    )}
                    </div>
                  <div className="dashboard-card">
                      <h3>Realstate</h3>
                      <div className="dashboard-card-items">
                          <div className="dashboard-card-item">
                              <span className="description">Paid</span>
                              <span className="value">{formatCurrency(334125)}</span>
                          </div>
                          <div className="dashboard-card-item">
                              <span className="description">Estimated Sell</span>
                              <span className="value">{formatCurrency(800000)}</span>
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
