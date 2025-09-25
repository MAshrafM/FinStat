// frontend/src/pages/gold/GoldSummaryPage.js
import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import '../../components/SummaryRow.css'; // Reuse styles
import { useGoldData } from '../../context/GoldContext';

const GoldSummaryPage = () => {
    // Use the Gold data context if needed
    const { goldSummary, 
            marketPrices,  
            overallTotalPaid, 
            goldtotalNow, 
            isLoading, } = useGoldData(); // Access any global data if needed
   
    const { holdSummary, soldSummary } = useMemo(() => {
        const hold = goldSummary.filter(item => item.status === 'hold' || !item.status).sort((a, b) => b.karat - a.karat);
        const sold = goldSummary.filter(item => item.status === 'sold').sort((a, b) => b.karat - a.karat);
        return { holdSummary: hold, soldSummary: sold };
    }, [goldSummary]);

    const overallSoldValue = soldSummary.reduce((acc, item) => acc + item.totalSellingPrice, 0);

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
                <div className="summary-item">
                    <span>Total Paid (Holdings)</span>
                    <strong>{formatCurrency(overallTotalPaid)}</strong>
                </div>
                <div className="summary-item">
                    <span>Current Value (Holdings)</span>
                    <strong>{formatCurrency(goldtotalNow)}</strong>
                </div>
                <div className="summary-item highlight">
                    <span>P/L (Holdings)</span>
                    <strong>{(((goldtotalNow / overallTotalPaid) - 1) * 100).toFixed(2)}%</strong>
                </div>
                <div className="summary-item">
                    <span>Total Sold Value</span>
                    <strong>{formatCurrency(overallSoldValue)}</strong>
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
                        {holdSummary.map((item) => {
                            const karat = item.karat;
                            const currentPricePerGram = marketPrices[karat] || 0;
                            const currentValue = item.totalWeight * currentPricePerGram;
                            const profitLoss = currentValue - item.totalPaid;
                            const rateOfChange = item.totalPaid > 0 ? (profitLoss / item.totalPaid) * 100 : 0;

                            return (
                                <tr key={`hold-${karat}`}>
                                    <td data-label="Karat" style={{ fontWeight: 'bold' }}>{karat}K</td>
                                    <td data-label="Weight">{item.totalWeight.toFixed(4)}g</td>
                                    <td data-label="Paid">{formatCurrency(item.totalPaid)}</td>
                                    <td data-label="Curr. Price">{currentPricePerGram}</td>
                                    <td data-label="Value" className="total-value">{formatCurrency(currentValue)}</td>
                                    <td data-label="Change" style={{ color: profitLoss >= 0 ? '#27ae60' : '#c0392b' }}>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>{formatCurrency(profitLoss)}</p>
                                        <p style={{ margin: 0, fontSize: '0.9em' }}>({rateOfChange.toFixed(2)}%)</p>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="page-header" style={{marginTop: '2rem'}}>
                <h1>Sold Gold Summary</h1>
            </div>
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Karat</th>
                            <th>Total Weight (g)</th>
                            <th>Total Paid</th>
                            <th>Total Selling Price</th>
                            <th>Avg. Holding Period</th>
                            <th>P/L & Rate of Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {soldSummary.map((item) => {
                            const karat = item.karat;
                            const profitLoss = item.totalSellingPrice - item.totalPaid;
                            const rateOfChange = item.totalPaid > 0 ? (profitLoss / item.totalPaid) * 100 : 0;

                            return (
                                <tr key={`sold-${karat}`}>
                                    <td data-label="Karat" style={{ fontWeight: 'bold' }}>{karat}K</td>
                                    <td data-label="Weight">{item.totalWeight.toFixed(4)}g</td>
                                    <td data-label="Paid">{formatCurrency(item.totalPaid)}</td>
                                    <td data-label="Selling Price" className="total-value">{formatCurrency(item.totalSellingPrice)}</td>
                                    <td data-label="Holding Period">{item.avgHoldingDays.toFixed(0)} days</td>
                                    <td data-label="Change" style={{ color: profitLoss >= 0 ? '#27ae60' : '#c0392b' }}>
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
