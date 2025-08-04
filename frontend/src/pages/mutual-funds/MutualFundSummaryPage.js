// frontend/src/pages/mutual-funds/MutualFundSummaryPage.js
import React, { useState, useEffect } from 'react';
import { getMutualFundSummary, getLastPrice } from '../../services/mutualFundService';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import '../../components/SummaryRow.css'; // Reuse styles

const MutualFundSummaryPage = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [overallTotals, setOverallTotals] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastPriceData, setLastPriceData] = useState(null);

    const loadLastPrice = async (fundName) => {
        if (fundName) {
            try {
                const lastprices = await Promise.all(fundName.map(name => {
                    return getLastPrice(name).then(data => {
                        let fName = data.rows.find(f => f.name === name);
                        if (!fName) {
                            console.warn(`No data found for fund: ${name}`);
                            return { name, lastPrice: 0 }; // Default to 0 if no data found
                        }
                        return { name, lastPrice: fName.price || 0 }; // Default to 0 if no price found
                    });
                }));
                setLastPriceData(lastprices);
                
            } catch (error) {
                console.error("Error loading last prices:", error);
                setLastPriceData([]);
            }
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getMutualFundSummary();
                setSummaryData(data);

                // Load last prices for all funds
                await loadLastPrice(data.map(item => item._id.name));
                // Calculate the overall totals for the summary row
                const totalOfAllMF = data.reduce((sum, item) => sum + item.totalValue, 0);
                const totalOfAllCoupons = data.reduce((sum, item) => sum + item.totalCouponValue, 0);
                const newTotal = totalOfAllMF - totalOfAllCoupons;
                // Calculate the current Selling value
                const totalSellingValue = data.reduce((sum, item) =>
                    sum + ((lastPriceData.find(f => f.name === item._id.name).lastPrice || 0) * item.currentUnits), 0
                );
                const totalProfit = ((totalSellingValue / newTotal) - 1) * 100;
                setOverallTotals({
                    totalOfAllMF,
                    totalOfAllCoupons,
                    newTotal,
                    totalSellingValue,
                    totalProfit
                });

            } catch (err) {
                console.error("Failed to load mutual fund summary:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [lastPriceData]);



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
                        {summaryData.map((item, index) => {
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