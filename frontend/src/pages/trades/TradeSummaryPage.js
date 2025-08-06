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
        /*
    const [trades, setTrades] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    const [openPosData, setOpenPosData] = useState([]);
    const [endPosData, setEndPosData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [marketPrices, setMarketPrices] = useState({}); // Store market prices for stocks
    const [summaryMetrics, setSummaryMetrics] = useState(null); // Summary metrics if needed
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

            if (trades && openPosData && endPosData) {
                let totalBuy = trades.filter(t => t.type === 'Buy').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                let totalSell = trades.filter(t => t.type === 'Sell').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                let totalDividends = trades.filter(t => t.type === 'Dividend').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                const metrics = {};

                metrics.topUps = trades.filter(t => t.type === 'TopUp').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                metrics.withdraws = trades.filter(t => t.type === 'Withdraw').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                metrics.totalFees = trades.reduce((sum, t) => sum + (t.fees || 0), 0);
                metrics.totalTrades = openPosData.reduce((sum, t) => sum - (t.totDeals || 0), 0);
                metrics.totalTradesNow = openPosData.reduce((sum, item) => sum + (item.totalValueNow || 0), 0);
                metrics.walletBalance = metrics.topUps + totalSell + totalDividends - totalBuy - metrics.withdraws - metrics.totalFees;
                metrics.realizedProfit = endPosData.reduce((sum, item) => sum + (item.totalSellValue || 0), 0) - endPosData.reduce((sum, item) => sum + (item.totalBuyValue || 0), 0);
                metrics.totalProfitNow = metrics.totalTradesNow + metrics.walletBalance - metrics.topUps;

                setSummaryMetrics(metrics);
            }
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load trade summary:", err);
            setIsLoading(false);
        });
    }, [summaryData, marketPrices, summaryMetrics, openPosData, endPosData]);
    const loadSummaryData = (data, market) => {
        const openPositions = [];
        const closedPositions = [];
        for (const item of data) {
            if (item.currentShares > 0 && item._id.iteration >= 0) {
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
        setSummaryData(data);
        setOpenPosData(openPositions)
        setEndPosData(closedPositions);
    };
    */
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
                                <td style={{ color: Math.abs(item.avgPrice) > stMarketPrices[item._id.stockCode] ? '#c0392b' : '#27ae60' }}>${stMarketPrices[item._id.stockCode]}</td>
                                <td className="total-value" style={{ color: item.totalValueNow >= item.totalBuyValue ? '#27ae60' : '#c0392b' }}>{formatCurrency(item.totalValueNow)}</td>
                                <td className="total-value" style={{ color: item.changeNow > 0 ? '#27ae60' : '#c0392b' }} >{item.changeNow}%</td>
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
                            <th>Days</th>
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
                                <td style={{ color: item.profitPercentage >= 0 ? '#27ae60' : '#c0392b' }}>{item.profitPercentage} %</td>
                                <td> {formatCurrency(item.totalBuyValue)}</td>
                                <td> {formatCurrency(item.totalSellValue)}</td>
                                <td>{formatCurrency(item.totalFees)}</td>
                                <td>{item.tradeCount}</td>
                                <td>{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                                <td>
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
