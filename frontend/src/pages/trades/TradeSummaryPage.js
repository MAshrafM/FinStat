// frontend/src/pages/trades/TradeSummaryPage.js
import React from 'react';
//import { getAllTrades, getTradeSummary, getMarketData } from '../../services/tradeService';
import { useData } from '../../context/DataContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import './Trades.css'; // Reuse the same CSS file
import '../../components/SummaryRow.css'; // Reuse summary row styles'

const TradeSummaryPage = () => {
    const { openPosData,
        endPosData,
        stMarketPrices,
        summaryMetrics,
        isLoading, } = useData();
        
    function daysBetween(date1, date2) {
        if (!date1 || !date2) return '';
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    };

    if (isLoading) {
        return <p className="page-container">Loading summary data...</p>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Trade Position Summary</h1>
            </div>
            {summaryMetrics && (
                <div className="summary-row">
                    <div className="summary-item">
                        <h4>Total Top Ups</h4>
                        <strong className="value">{formatCurrency(summaryMetrics.topUps)}</strong>
                    </div>
                    <div className="summary-item">
                        <h4>Total Deals</h4>
                        <strong className="value">{formatCurrency(summaryMetrics.totalTrades)}</strong>
                    </div>
                    <div className="summary-item">
                        <h4>Total Investment Now</h4>
                        <strong className="value">{formatCurrency(summaryMetrics.totalTradesNow)}</strong>
                    </div>
                    <div className="summary-item">
                        <h4>Investment Wallet</h4>
                        <strong className="value">{formatCurrency(summaryMetrics.walletBalance)}</strong>
                    </div>
                    <div className="summary-item">
                        <h4>Realized Profilt</h4>
                        <strong className="value">{formatCurrency(summaryMetrics.realizedProfit)}</strong>
                    </div>
                    <div className="summary-item">
                        <h4>Total Profilt Now</h4>
                        <strong className="value">{formatCurrency(summaryMetrics.totalProfitNow)}</strong>
                    </div>
                </div>
            )}

            <div className="table-container">
                <h2>Open Positions</h2>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Stock Code</th>
                            <th>Realized P/L</th>
                            <th>Deals</th>
                            <th>Shares</th>
                            <th>Avg Price</th>
                            <th>Avg Sell</th>
                            <th>Target</th>
                            <th>Sell 0</th>
                            <th>Curr Price</th>
                            <th>Curr Value</th>
                            <th>Curr Change</th>
                            <th>Fees</th>
                            <th>Counts</th>
                            <th>Range</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                        {openPosData.map((item, index) => (
                            <tr key={index}>
                                <td data-label="Stock Code">
                                    <p style={{ fontWeight: 'bold' }}>{item._id.stockCode}</p>
                                    <p>{item._id.iteration || '0'}</p>
                                    <p className="broker">{item._id.broker}</p>
                                </td>
                                <td data-label="Realized P/L" className="total-value" style={{ color: Math.abs(item.realizedPL) <= item.totalValueNow ? '#27ae60' : '#c0392b' }}>
                                    {formatCurrency(Math.abs(item.realizedPL))}
                                </td>
                                <td data-label="Deals" style={{ color: Math.abs(item.totDeals) <= item.totalValueNow ? '#27ae60' : '#c0392b' }}>{formatCurrency(Math.abs(item.totDeals))}</td>
            
                                <td data-label="Shares" style={{ fontWeight: 'bold' }}>{item.currentShares}</td>
                                <td data-label="Avg Price">{formatCurrency(Math.abs(item.avgPrice))}</td>
                                <td data-label="Avg Buy">{formatCurrency(Math.abs(item.avgBuy))}</td>
                                <td data-label="Target">{formatCurrency(Math.abs(item.targetPrice))}</td>
                                <td data-label="Target Sell">{formatCurrency(Math.abs(item.targetSell))}</td>
                                <td data-label="Current Price" style={{ color: Math.abs(item.avgPrice) > stMarketPrices[item._id.stockCode] ? '#c0392b' : '#27ae60' }}>${stMarketPrices[item._id.stockCode]}</td>
                                <td data-label="Value Now" className="total-value" style={{ color: item.totalValueNow >= Math.abs(item.totDeals) ? '#27ae60' : '#c0392b' }}>{formatCurrency(item.totalValueNow)}</td>
                                <td data-label="Change" className="total-value" style={{ color: item.changeNow > 0 ? '#27ae60' : '#c0392b' }} >{item.changeNow}%</td>
                                <td data-label="Fees">{formatCurrency(item.totalFees)}</td>
                                <td data-label="Count">{item.tradeCount}</td>
                                <td data-label="Period">{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-container">
                <h2>Close Positions</h2>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Stock Code</th>
                            <th>Realized P/L</th>
                            <th>Profit %</th>
                            <th>Sell Price</th>
                            <th>Total Sell</th>
                            <th>Total Buy</th>
                            <th>Total Fees</th>
                            <th>Trade Count</th>
                            <th>Date Range</th>
                            <th>Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        {endPosData.map((item, index) => (
                            <tr key={index}>
                                <td data-label="Code">
                                    <p style={{ fontWeight: 'bold' }}>{item._id.stockCode}</p>
                                    <p>{item._id.iteration || '0'}</p>
                                    <p className="broker">{item._id.broker}</p>
                                </td>
                                <td data-label="Realized P/L" className="total-value" style={{ color: item.realizedPL >= 0 ? '#27ae60' : '#c0392b' }}>
                                    {formatCurrency(item.realizedPL)}
                                </td>
<<<<<<< HEAD
                                <td data-label="Profit" style={{ color: item.profitPercentage >= 0 ? '#27ae60' : '#c0392b' }}>{item.profitPercentage} %</td>
                                <td data-label="Total Buy"> {formatCurrency(item.totalBuyValue)}</td>
                                <td data-label="Total Sell"> {formatCurrency(item.totalSellValue)}</td>
                                <td data-label="Fees">{formatCurrency(item.totalFees)}</td>
                                <td data-label="Count">{item.tradeCount}</td>
                                <td data-label="Period">{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                                <td data-label="Days">
=======
                                <td style={{ color: item.profitPercentage >= 0 ? '#27ae60' : '#c0392b' }}>{item.profitPercentage} %</td>
                                <td style={{ color: item.sellingPrice > stMarketPrices[item._id.stockCode] ? '#27ae60' : '#c0392b'}}>{formatCurrency(item.sellingPrice || 0)}</td>
                                <td> {formatCurrency(item.totalBuyValue)}</td>
                                <td> {formatCurrency(item.totalSellValue)}</td>
                                <td>{formatCurrency(item.totalFees)}</td>
                                <td>{item.tradeCount}</td>
                                <td>{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                                <td>
>>>>>>> add-features
                                    <span style={{ fontSize: '0.9em', color: '#888' }}>
                                        {daysBetween(item.firstTradeDate, item.lastTradeDate)} days
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradeSummaryPage;
