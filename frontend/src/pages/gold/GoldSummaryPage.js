// frontend/src/pages/gold/GoldSummaryPage.js
import React, { useState, useEffect } from 'react';
import { getGoldSummary, getGoldPrice } from '../../services/goldService';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import '../../components/SummaryRow.css'; // Reuse styles

const GoldSummaryPage = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [marketPrices, setMarketPrices] = useState({}); // To store { "24": price, "22": price }
    const [overallTotalPaid, setOverallTotalPaid] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [totalNow, setTotalNow] = useState(0);

    useEffect(() => {
        // Fetch both your internal summary and the external market data
        Promise.all([
            getGoldSummary(),
            getGoldPrice()
        ])
            .then(([summary, prices]) => {
                setSummaryData(summary);
                console.log(prices);
                if (!prices || Object.keys(prices).length === 0) {
                    console.warn("No market prices found, using default values");
                    // Fallback to default prices if none are provided
                    prices = {
                        "24": 0,
                        "22": 0,
                        "18": 0,
                    };
                }
                setMarketPrices(prices); 

                // Calculate the overall total paid for the summary row
                const totalPaid = summary.reduce((sum, item) => sum + item.totalPaid, 0);
                setOverallTotalPaid(totalPaid);

                const totalNow = summary.reduce((previous, item) => {
                    const karat = item._id;
                    const currentPricePerGram = prices[karat] || 0;
                    const currentValue = item.totalWeight * currentPricePerGram;
                    return previous + currentValue;
                }, 0);

                setTotalNow(totalNow);

                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load data:", err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return <p className="page-container">Loading gold summary and market prices...</p>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gold Holdings Summary</h1>
            </div>

            {/* The main summary row at the top */}
            <div className="summary-row">
                <div className="summary-item highlight">
                    <span>Total Amount Paid (All Karats)</span>
                    <strong>{formatCurrency(overallTotalPaid)}</strong>
                </div>
                <div className="summary-item highlight">
                    <span>Total Amount Now (All Karats)</span>
                    <strong>{formatCurrency(totalNow)}</strong>
                </div>
                <div className="summary-item highlight">
                    <span>Rate of Change</span>
                    <strong>{(((totalNow / overallTotalPaid) - 1) * 100).toFixed(2)}%</strong>
                </div>
            </div>

            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Karat</th>
                            <th>Total Weight (g)</th>
                            <th>Total Paid</th>
                            <th>Current Price/g</th>
                            <th>Current Market Value</th>
                            <th>P/L & Rate of Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.map((item) => {
                            const karat = item._id;
                            const currentPricePerGram = marketPrices[karat] || 0;
                            const currentValue = item.totalWeight * currentPricePerGram;
                            const profitLoss = currentValue - item.totalPaid;
                            const rateOfChange = item.totalPaid > 0 ? (profitLoss / item.totalPaid) * 100 : 0;

                            return (
                                <tr key={karat}>
                                    <td style={{ fontWeight: 'bold' }}>{karat}K</td>
                                    <td>{item.totalWeight.toFixed(2)}g</td>
                                    <td>{formatCurrency(item.totalPaid)}</td>
                                    <td>{currentPricePerGram}</td>
                                    <td className="total-value">{formatCurrency(currentValue)}</td>
                                    <td style={{ color: profitLoss >= 0 ? '#27ae60' : '#c0392b' }}>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>{formatCurrency(profitLoss)}</p>
                                        <p style={{ margin: 0, fontSize: '0.9em' }}>({rateOfChange.toFixed(2)}%)</p>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GoldSummaryPage;
