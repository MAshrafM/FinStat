// frontend/src/pages/mutual-funds/MutualFundSummaryPage.js
import React, { useState, useEffect } from 'react';
import { getMutualFundSummary } from '../../services/mutualFundService';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import '../../components/SummaryRow.css'; // Reuse styles

const MutualFundSummaryPage = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [overallTotals, setOverallTotals] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getMutualFundSummary()
            .then(data => {
                setSummaryData(data);

                // Calculate the overall totals for the summary row
                const totalOfAllMF = data.reduce((sum, item) => sum + item.totalValue, 0);
                const totalOfAllCoupons = data.reduce((sum, item) => sum + item.totalCouponValue, 0);
                const newTotal = totalOfAllMF - totalOfAllCoupons;

                setOverallTotals({
                    totalOfAllMF,
                    totalOfAllCoupons,
                    newTotal,
                });

                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load mutual fund summary:", err);
                setIsLoading(false);
            });
    }, []);

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
                    <div className="summary-item highlight">
                        <span>New Total</span>
                        <strong>{formatCurrency(overallTotals.newTotal)}</strong>
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
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.map((item, index) => {
                            const valueWithoutCoupons = item.totalValue - item.totalCouponValue;
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