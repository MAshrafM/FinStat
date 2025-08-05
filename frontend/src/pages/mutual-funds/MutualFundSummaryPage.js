// frontend/src/pages/mutual-funds/MutualFundSummaryPage.js
import React from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import '../../components/SummaryRow.css'; // Reuse styles

const MutualFundSummaryPage = () => {
    const { mfSummaryData, overallTotals, lastPriceData, isLoading } = useData();
    
    if (isLoading) {
        return <p className="page-container">Loading summary data...</p>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Mutual Fund Holdings Summary</h1>
            </div>

            {/* The main summary row at the top */}
            {overallTotals && (
                <div className="summary-row">
                    <div className="summary-item">
                        <span>Total of all MF</span>
                        <strong>{formatCurrency(overallTotals.totalOfAllMF)}</strong>
                    </div>
                    <div className="summary-item">
                        <span>Total of all Coupons</span>
                        <strong>{formatCurrency(overallTotals.totalOfAllCoupons)}</strong>
                    </div>
                    <div className="summary-item">
                        <span>New Total</span>
                        <strong>{formatCurrency(overallTotals.newTotal)}</strong>
                    </div>
                    <div className="summary-item highlight">
                        <span>Selling Value</span>
                        <strong>{formatCurrency(overallTotals.totalSellingValue)}</strong>
                    </div>
                    <div className="summary-item highlight">
                        <span>Profit</span>
                        <strong>{overallTotals.totalProfit.toFixed(2)}%</strong>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Fund Name / Code</th>
                            <th>Current Units</th>
                            <th>Avg. Price Paid</th>
                            <th>Total Value (Cost Basis)</th>
                            <th>Total Coupons</th>
                            <th>Value (Excluding Coupons)</th>
                            <th>Current Prices</th>
                            <th>Selling Value</th>
                            <th>% Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mfSummaryData.map((item, index) => {
                            const valueWithoutCoupons = item.totalValue - item.totalCouponValue;
                            const row = lastPriceData.find(n => n.name === item._id.name);
                            const sellingValue = row.lastPrice * item.currentUnits;
                            const totalProfit = ((sellingValue / valueWithoutCoupons) - 1) * 100;
                            return (
                                <tr key={index}>
                                    <td>
                                        <p style={{ fontWeight: 'bold' }}>{item._id.name}</p>
                                        <p className="broker">{item._id.code}</p>
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>{item.currentUnits}</td>
                                    <td>{formatCurrency(item.averagePrice)}</td>
                                    <td className="total-value">{formatCurrency(item.totalValue)}</td>
                                    <td>{formatCurrency(item.totalCouponValue)}</td>
                                    <td>{formatCurrency(valueWithoutCoupons)}</td>
                                    <td>{formatCurrency(row.lastPrice)}</td>
                                    <td className="total-value" style={{ color: sellingValue > item.totalValue ? '#27ae60' : '#c0392b' }}>{formatCurrency(sellingValue)}</td>
                                    <td style={{ color: totalProfit > 0 ? '#27ae60' : '#c0392b' }}>{totalProfit.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MutualFundSummaryPage;