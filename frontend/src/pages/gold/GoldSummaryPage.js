// frontend/src/pages/gold/GoldSummaryPage.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import '../../components/SummaryRow.css'; // Reuse styles
import { useData } from '../../context/DataContext';

const GoldSummaryPage = () => {
    // Use the global data context if needed
    const { goldSummary, marketPrices,  overallTotalPaid, goldtotalNow, isLoading, } = useData(); // Access any global data if needed
   
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
                    <strong>{formatCurrency(goldtotalNow)}</strong>
                </div>
                <div className="summary-item highlight">
                    <span>Rate of Change</span>
                    <strong>{(((goldtotalNow / overallTotalPaid) - 1) * 100).toFixed(2)}%</strong>
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
                        {goldSummary.map((item) => {
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
