// frontend/src/pages/trades/TradeSummaryPage.js
import React, { useState, useEffect } from 'react';
import { getAllTrades, getTradeSummary, getMarketData } from '../../services/tradeService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import './Trades.css'; // Reuse the same CSS file
import '../../components/SummaryRow.css'; // Reuse summary row styles'

const TradeSummaryPage = () => {
    //const [trades, setTrades] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    const [endPosData, setEndPosData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [marketPrices, setMarketPrices] = useState({}); // Store market prices for stocks
    const marginProfit = 0.2;

    useEffect(() => {
        Promise.all([
            getTradeSummary(),
            getMarketData(),
            getAllTrades()
        ]).then(([summaryData, marketData, trades]) => {
            let marketMap = {};
            if (marketData) {
                marketMap = marketData.prices.reduce((acc, item) => {
                    if (item.code) {
                        acc[item.code] = item.value;
                    }
                    return acc;
                }, {});
                setMarketPrices(marketMap);
            }

            loadSummaryData(summaryData, marketMap);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load trade summary:", err);
            setIsLoading(false);
        });
    }, [marketPrices]);
    const loadSummaryData = (data, market) => {
        const openPositions = [];
        const closedPositions = [];
        for (const item of data) {
            if (item.currentShares > 0) {
                item.avgPrice = item.realizedPL / item.currentShares; // avgPrice is the average price of shares currently held
                item.avgBuy = item.totDeals / item.currentShares; // avgBuy is the average price paid for shares
                item.targetPrice = item.avgPrice * (1 + marginProfit); // Target price is avgPrice + margin profit  
                item.targetSell = item.avgBuy * (1 + marginProfit); // Target sell price is avgBuy + margin profit
                item.totalValueNow = market[item._id.stockCode] * item.currentShares;
                item.changeNow = ((item.totalValueNow / Math.abs(item.realizedPL)) - 1)*100; // Calculate change percentage
                openPositions.push(item);
                
            } else {
                if (item._id.stockCode) {
                    item.profitPercentage = (item.realizedPL / item.totalBuyValue) * 100; // profitPercentage is the percentage profit made on the trade
                    closedPositions.push(item);
                }
            }
        }
        setSummaryData(openPositions);
        setEndPosData(closedPositions);
    };

    if (isLoading) {
        return <p className="page-container">Loading summary data...</p>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Trade Position Summary</h1>
            </div>
            <div className="summary-row">

            </div>

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
                        {summaryData.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <p style={{ fontWeight: 'bold' }}>{item._id.stockCode}</p>
                                    <p>{item._id.iteration || '0'}</p>
                                    <p className="broker">{item._id.broker}</p>
                                </td>
                                <td className="total-value" style={{ color: item.realizedPL >= 0 ? '#27ae60' : '#c0392b' }}>
                                    {formatCurrency(Math.abs(item.realizedPL))}
                                </td>
                                <td style={{ color: item.realizedPL > item.totDeals ? '#27ae60' : '#c0392b' }}>{formatCurrency(Math.abs(item.totDeals))}</td>
            
                                <td style={{ fontWeight: 'bold' }}>{item.currentShares}</td>
                                <td>{formatCurrency(Math.abs(item.avgPrice))}</td>
                                <td>{formatCurrency(Math.abs(item.avgBuy))}</td>
                                <td>{formatCurrency(Math.abs(item.targetPrice))}</td>
                                <td>{formatCurrency(Math.abs(item.targetSell))}</td>
                                <td style={{ color: Math.abs(item.avgPrice) > marketPrices[item._id.stockCode] ? '#c0392b' : '#27ae60' }}>${marketPrices[item._id.stockCode]}</td>
                                <td className="total-value" style={{ color: item.totalValueNow >= item.totalBuyValue ? '#27ae60' : '#c0392b' }}>{formatCurrency(item.totalValueNow)}</td>
                                <td className="total-value" style={{ color: item.changeNow > 0 ? '#27ae60' : '#c0392b' }} >{item.changeNow.toFixed(2)}%</td>
                                <td>{formatCurrency(item.totalFees)}</td>
                                <td>{item.tradeCount}</td>
                                <td>{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
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
                            <th>Total Sell</th>
                            <th>Total Buy</th>
                            <th>Total Fees</th>
                            <th>Trade Count</th>
                            <th>Date Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        {endPosData.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <p style={{ fontWeight: 'bold' }}>{item._id.stockCode}</p>
                                    <p>{item._id.iteration || '0'}</p>
                                    <p className="broker">{item._id.broker}</p>
                                </td>
                                <td className="total-value" style={{ color: item.realizedPL >= 0 ? '#27ae60' : '#c0392b' }}>
                                    {formatCurrency(item.realizedPL)}
                                </td>
                                <td style={{ color: item.profitPercentage >= 0 ? '#27ae60' : '#c0392b' }}>{item.profitPercentage.toFixed(2)} %</td>
                                <td> {formatCurrency(item.totalBuyValue)}</td>
                                <td> {formatCurrency(item.totalSellValue)}</td>
                                <td>{formatCurrency(item.totalFees)}</td>
                                <td>{item.tradeCount}</td>
                                <td>{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradeSummaryPage;
