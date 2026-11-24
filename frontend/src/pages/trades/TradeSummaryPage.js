// frontend/src/pages/trades/TradeSummaryPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { sortData, getNextSortConfig } from '../../utils/helper';
import { Delta, Loading } from '../../components/ui';
import './Trades.css'; // Reuse the same CSS file
import '../../components/SummaryRow.css'; // Reuse summary row styles
import '../../components/Table.css'; // Reuse table styles

const TradeSummaryPage = () => {
    const { openPosData,
        endPosData,
        stMarketPrices = {},
        summaryMetrics,
        isLoading } = useData();

    const [closeSortConfig, setCloseSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const [openSortConfig, setOpenSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const [expandedOpenCards, setExpandedOpenCards] = useState(new Set());
    const [expandedCloseCards, setExpandedCloseCards] = useState(new Set());
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.innerWidth <= 768
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleOpenCard = (key) => {
        setExpandedOpenCards(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleCloseCard = (key) => {
        setExpandedCloseCards(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const daysBetween = useCallback((date1, date2) => {
        if (!date1 || !date2) return '';
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    }, []);

    const getCloseSortValue = useCallback((item, key) => {
        switch (key) {
            case 'stockCode':
                return item._id?.stockCode || '';
            case 'tradingPL':
                return item.tradingPL || 0;
            case 'dividendIncome':
                return item.dividendIncome || 0;
            case 'realizedPL':
                return item.totalRealizedReturn || 0;
            case 'profitPercentage':
                return item.profitPercentage || 0;
            case 'sellPrice':
                return item.sellingPrice || 0;
            case 'totalSell':
                return item.totalSellValue || 0;
            case 'totalBuy':
                return item.totalBuyValue || 0;
            case 'totalFees':
                return item.totalFees || 0;
            case 'tradeCount':
                return item.tradeCount || 0;
            case 'dateRange':
                return new Date(item.firstTradeDate || 0);
            case 'days':
                return daysBetween(item.firstTradeDate, item.lastTradeDate);
            default:
                return '';
        }
    }, [daysBetween]);

    const getOpenSortValue = useCallback((item, key) => {
        switch (key) {
            case 'stockCode':
                return item._id?.stockCode || '';
            case 'realizedPL':
                return Math.abs(item.totalRealizedReturn || 0);
            case 'deals':
                return Math.abs(item.totDeals || 0);
            case 'shares':
                return item.currentShares || 0;
            case 'avgPrice':
                return Math.abs(item.avgPrice || 0);
            case 'target':
                return Math.abs(item.targetPrice || 0);
            case 'sell0':
                return Math.abs(item.targetSell || 0);
            case 'currPrice':
                return stMarketPrices[item._id?.stockCode] || 0;
            case 'currValue':
                return item.totalValueNow || 0;
            case 'currChange':
                return item.changeNow || 0;
            case 'fees':
                return item.totalFees || 0;
            case 'counts':
                return item.tradeCount || 0;
            case 'range':
                return new Date(item.firstTradeDate || 0);
            default:
                return '';
        }
    }, [stMarketPrices]);

    // Memoized sorted data - moved to top level before any other functions
    const sortedEndPosData = useMemo(
        () => sortData(endPosData || [], closeSortConfig, getCloseSortValue),
        [endPosData, closeSortConfig, getCloseSortValue]
    );

    // Memoized sorted data for Open Positions
    const sortedOpenPosData = useMemo(
        () => sortData(openPosData || [], openSortConfig, getOpenSortValue),
        [openPosData, openSortConfig, getOpenSortValue]
    );

    // Function to handle sorting for Close Positions
    const handleCloseSort = (key) => setCloseSortConfig(getNextSortConfig(closeSortConfig, key));
    const handleOpenSort = (key) => setOpenSortConfig(getNextSortConfig(openSortConfig, key));

    // Function to render sort indicator
    const getCloseSortIndicator = (columnKey) => {
        if (closeSortConfig.key !== columnKey) {
            return ' ⇅';
        }
        return closeSortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    const getOpenSortIndicator = (columnKey) => {
        if (openSortConfig.key !== columnKey) {
            return ' ⇅';
        }
        return openSortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    if (isLoading) {
        return (
            <div className="page-container trade-summary-page">
                <Loading variant="card" />
            </div>
        );
    }

    return (
        <div className="page-container trade-summary-page">
            <div className="page-header">
                <p className="trade-log-subtitle">Stock Trading &gt; Position Summary</p>
                <h1>Trade Position Summary</h1>
            </div>

            {summaryMetrics && summaryMetrics.brokerMetrics && (
                <div className="broker-summaries-section">
                    <h2 className="section-title">Broker Summaries</h2>
                    <div className="broker-summaries">
                        {Object.entries(summaryMetrics.brokerMetrics).map(([broker, metrics]) => (
                            <div key={broker} className="kpi-card">
                                <h3 className="broker-title">{broker}</h3>
                                <div className="broker-metrics-grid">
                                    <div>
                                        <div className="kpi-card-header">Net Deposits</div>
                                        <div className="kpi-card-value fs-num">{formatCurrency(metrics.netDeposits)}</div>
                                    </div>
                                    <div>
                                        <div className="kpi-card-header">Investment</div>
                                        <div className="kpi-card-value fs-num">{formatCurrency(metrics.totalTradesNow)}</div>
                                    </div>
                                    <div>
                                        <div className="kpi-card-header">Wallet</div>
                                        <div className="kpi-card-value fs-num">{formatCurrency(metrics.walletBalance)}</div>
                                    </div>
                                    <div>
                                        <div className="kpi-card-header">Profit %</div>
                                        <div className="kpi-card-value fs-num">
                                            <Delta
                                                value={`${Math.abs(metrics.profitPercentage || 0).toFixed(2)}%`}
                                                tone={(metrics.profitPercentage || 0) > 0 ? 'positive' : (metrics.profitPercentage || 0) < 0 ? 'negative' : 'neutral'}
                                                sign={(metrics.profitPercentage || 0) > 0 ? 'positive' : (metrics.profitPercentage || 0) < 0 ? 'negative' : 'none'}
                                                label={(metrics.profitPercentage || 0) >= 0 ? 'Profit' : 'Loss'}
                                                className="fs-num"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {summaryMetrics && (
                <div className="overview-container">
                    <h2 className="section-title">Total Overview</h2>
                    <div className="summary-row">
                        <div className="kpi-card">
                            <div className="kpi-card-header">Total Net Deposits</div>
                            <div className="kpi-card-value fs-num">{formatCurrency(summaryMetrics.netDeposits)}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-card-header">Total Deals</div>
                            <div className="kpi-card-value fs-num">{formatCurrency(summaryMetrics.totalTrades)}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-card-header">Total Investment Now</div>
                            <div className="kpi-card-value fs-num">{formatCurrency(summaryMetrics.totalTradesNow)}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-card-header">Investment Wallet</div>
                            <div className="kpi-card-value fs-num">{formatCurrency(summaryMetrics.walletBalance)}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-card-header">Realized Profit</div>
                            <div className="kpi-card-value fs-num">
                                <Delta
                                    value={formatCurrency(Math.abs(summaryMetrics.realizedProfit || 0))}
                                    tone={(summaryMetrics.realizedProfit || 0) > 0 ? 'positive' : (summaryMetrics.realizedProfit || 0) < 0 ? 'negative' : 'neutral'}
                                    sign={(summaryMetrics.realizedProfit || 0) > 0 ? 'positive' : (summaryMetrics.realizedProfit || 0) < 0 ? 'negative' : 'none'}
                                    label={(summaryMetrics.realizedProfit || 0) >= 0 ? 'Profit' : 'Loss'}
                                    className="fs-num"
                                />
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-card-header">Total Profit Now</div>
                            <div className="kpi-card-value fs-num">
                                <Delta
                                    value={formatCurrency(Math.abs(summaryMetrics.totalProfitNow || 0))}
                                    tone={(summaryMetrics.totalProfitNow || 0) > 0 ? 'positive' : (summaryMetrics.totalProfitNow || 0) < 0 ? 'negative' : 'neutral'}
                                    sign={(summaryMetrics.totalProfitNow || 0) > 0 ? 'positive' : (summaryMetrics.totalProfitNow || 0) < 0 ? 'negative' : 'none'}
                                    label={(summaryMetrics.totalProfitNow || 0) >= 0 ? 'Profit' : 'Loss'}
                                    className="fs-num"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="positions-section">
                <h2 className="section-title">Open Positions</h2>

                {isMobile ? (
                    /* Mobile Compact-Expand Cards (<=768px, D19) */
                    <div className="trades-mobile-cards" data-testid="open-positions-mobile-cards">
                    {sortedOpenPosData.length === 0 ? (
                        <div className="empty-trades-box">
                            <p>No open positions found.</p>
                        </div>
                    ) : (
                        sortedOpenPosData.map((item, index) => {
                            const cardKey = `${item._id?.stockCode || 'pos'}-${item._id?.iteration || index}-${item._id?.broker || 'b'}`;
                            const isExpanded = expandedOpenCards.has(cardKey);
                            return (
                                <article key={cardKey} className="trade-card trade-mobile-card">
                                    <div className="trade-card-header">
                                        <div className="trade-card-header-left">
                                            <span className="stock-code-title"><strong>{item._id?.stockCode}</strong></span>
                                            {item._id?.broker && <span className="trade-card-broker-chip">{item._id?.broker}</span>}
                                            {item._id?.iteration && <span className="trade-card-sub-info">Iter: {item._id.iteration}</span>}
                                        </div>
                                        <div className="trade-card-header-right">
                                            <div className="trade-card-total fs-num">{formatCurrency(item.totalValueNow)}</div>
                                            <div className="trade-card-pnl fs-num">
                                                <Delta
                                                    value={formatCurrency(Math.abs(item.unrealizedPL || 0))}
                                                    tone={(item.unrealizedPL || 0) > 0 ? 'positive' : (item.unrealizedPL || 0) < 0 ? 'negative' : 'neutral'}
                                                    sign={(item.unrealizedPL || 0) > 0 ? 'positive' : (item.unrealizedPL || 0) < 0 ? 'negative' : 'none'}
                                                    label={(item.unrealizedPL || 0) >= 0 ? 'Gain' : 'Loss'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="trade-card-expander-btn"
                                        aria-expanded={isExpanded}
                                        onClick={() => toggleOpenCard(cardKey)}
                                        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${item._id?.stockCode}`}
                                    >
                                        {isExpanded ? 'Hide details ▲' : 'Show all fields ▼'}
                                    </button>

                                    {isExpanded && (
                                        <div className="trade-card-drawer">
                                            <div className="trade-card-grid">
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Current Shares</span>
                                                    <span className="trade-card-val fs-num">{item.currentShares}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Market Price</span>
                                                    <span className="trade-card-val fs-num">
                                                        {stMarketPrices[item._id?.stockCode] ? formatCurrency(stMarketPrices[item._id?.stockCode]) : '-'}
                                                    </span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Price Change</span>
                                                    <span className="trade-card-val fs-num">
                                                        <Delta
                                                            value={`${Math.abs(item.changeNow || 0)}%`}
                                                            tone={(item.changeNow || 0) > 0 ? 'positive' : (item.changeNow || 0) < 0 ? 'negative' : 'neutral'}
                                                            sign={(item.changeNow || 0) > 0 ? 'positive' : (item.changeNow || 0) < 0 ? 'negative' : 'none'}
                                                            label={(item.changeNow || 0) >= 0 ? 'Increase' : 'Decrease'}
                                                        />
                                                    </span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">All Deals Value</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.totDeals)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Break Even Price</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.breakEvenPrice)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Net Break Even</span>
                                                    <span className="trade-card-val fs-num">
                                                        {item.netBreakEven < 0 ? <span className="free-ride-badge">Free Ride</span> : formatCurrency(item.netBreakEven)}
                                                    </span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Target Sell</span>
                                                    <span className="trade-card-val fs-num">
                                                        {item.netBreakEven < 0 ? <span className="free-ride-badge">Free Ride</span> : formatCurrency(item.breakEvenTarget)}
                                                    </span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Total Fees</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.totalFees)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Trade Count</span>
                                                    <span className="trade-card-val fs-num">{item.tradeCount}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Holding Period</span>
                                                    <span className="trade-card-val">{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                </div>
                ) : (
                /* Desktop Dense Table (>768px, Reference Frame 01) */
                <div className="trades-desktop-table table-container">
                    <table className="styled-table">
                    <thead>
                        <tr>
                            <th
                                onClick={() => handleOpenSort('stockCode')}
                                className="sortable"
                                title="Click to sort by Stock Code"
                            >
                                Stock Code{getOpenSortIndicator('stockCode')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('realizedPL')}
                                className="sortable"
                                title="Click to sort by Realized P/L"
                            >
                                UnReal P/L{getOpenSortIndicator('realizedPL')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('deals')}
                                className="sortable"
                                title="Click to sort by Deals"
                            >
                                All Deals {getOpenSortIndicator('deals')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('shares')}
                                className="sortable"
                                title="Click to sort by Shares"
                            >
                                Shares{getOpenSortIndicator('shares')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('target')}
                                className="sortable"
                                title="Click to sort by Target"
                            >
                                Net BE{getOpenSortIndicator('target')}
                            </th>
                            <th>
                                BE Price
                            </th>
                            <th
                                onClick={() => handleOpenSort('sell0')}
                                className="sortable"
                                title="Click to sort by Sell 0"
                            >
                                Sell 0{getOpenSortIndicator('sell0')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('currPrice')}
                                className="sortable"
                                title="Click to sort by Curr Price"
                            >
                                Price{getOpenSortIndicator('currPrice')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('currValue')}
                                className="sortable"
                                title="Click to sort by Curr Value"
                            >
                                Tot. Value{getOpenSortIndicator('currValue')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('currChange')}
                                className="sortable"
                                title="Click to sort by Curr Change"
                            >
                                Change{getOpenSortIndicator('currChange')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('fees')}
                                className="sortable"
                                title="Click to sort by Fees"
                            >
                                Fees{getOpenSortIndicator('fees')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('counts')}
                                className="sortable"
                                title="Click to sort by Counts"
                            >
                                Counts{getOpenSortIndicator('counts')}
                            </th>
                            <th
                                onClick={() => handleOpenSort('range')}
                                className="sortable"
                                title="Click to sort by Range"
                            >
                                Range{getOpenSortIndicator('range')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedOpenPosData.map((item, index) => (
                            <tr key={index} className="trade-card">
                                <td data-label="Code">
                                    <p className="stock-code-title"><strong>{item._id?.stockCode}</strong></p>
                                    <p>{item._id?.iteration || '0'}</p>
                                    <p className="broker">{item._id?.broker}</p>
                                </td>
                                <td data-label="UnRealized P/L" className="total-value fs-num">
                                    <Delta
                                        value={formatCurrency(Math.abs(item.unrealizedPL || 0))}
                                        tone={(item.unrealizedPL || 0) > 0 ? 'positive' : (item.unrealizedPL || 0) < 0 ? 'negative' : 'neutral'}
                                        sign={(item.unrealizedPL || 0) > 0 ? 'positive' : (item.unrealizedPL || 0) < 0 ? 'negative' : 'none'}
                                        label={(item.unrealizedPL || 0) >= 0 ? 'Gain' : 'Loss'}
                                    />
                                </td>
                                <td data-label="Deals" className="fs-num">
                                    {formatCurrency(item.totDeals)}
                                </td>
                                <td data-label="Shares" className="fs-num">
                                    <strong>{item.currentShares}</strong>
                                </td>
                                <td data-label="Net Break Even" className="fs-num">
                                    {item.netBreakEven < 0 ? <span className="free-ride-badge">Free Ride</span> : formatCurrency(item.netBreakEven)}
                                </td>
                                <td data-label="Break Even Price" className="fs-num">{formatCurrency(item.breakEvenPrice)}</td>
                                <td data-label="Target Sell" className="fs-num">
                                    {item.netBreakEven < 0 ? <span className="free-ride-badge">Free Ride</span> : formatCurrency(item.breakEvenTarget)}
                                </td>
                                <td data-label="Price" className="fs-num">
                                    {stMarketPrices[item._id?.stockCode] ? formatCurrency(stMarketPrices[item._id?.stockCode]) : '-'}
                                </td>
                                <td data-label="Total Now" className="total-value fs-num">
                                    {formatCurrency(item.totalValueNow)}
                                </td>
                                <td data-label="Change" className="total-value fs-num">
                                    <Delta
                                        value={`${Math.abs(item.changeNow || 0)}%`}
                                        tone={(item.changeNow || 0) > 0 ? 'positive' : (item.changeNow || 0) < 0 ? 'negative' : 'neutral'}
                                        sign={(item.changeNow || 0) > 0 ? 'positive' : (item.changeNow || 0) < 0 ? 'negative' : 'none'}
                                        label={(item.changeNow || 0) >= 0 ? 'Increase' : 'Decrease'}
                                    />
                                </td>
                                <td data-label="Fees" className="fs-num">{formatCurrency(item.totalFees)}</td>
                                <td data-label="Count" className="fs-num">{item.tradeCount}</td>
                                <td data-label="Period">{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
            </div>

            <div className="positions-section">
                <h2 className="section-title">Close Positions</h2>

                {isMobile ? (
                    /* Mobile Compact-Expand Cards (<=768px, D19) */
                    <div className="trades-mobile-cards" data-testid="closed-positions-mobile-cards">
                    {sortedEndPosData.length === 0 ? (
                        <div className="empty-trades-box">
                            <p>No closed positions found.</p>
                        </div>
                    ) : (
                        sortedEndPosData.map((item, index) => {
                            const cardKey = `closed-${item._id?.stockCode || 'pos'}-${item._id?.iteration || index}-${item._id?.broker || 'b'}`;
                            const isExpanded = expandedCloseCards.has(cardKey);
                            return (
                                <article key={cardKey} className="trade-card trade-mobile-card">
                                    <div className="trade-card-header">
                                        <div className="trade-card-header-left">
                                            <span className="stock-code-title"><strong>{item._id?.stockCode}</strong></span>
                                            {item._id?.broker && <span className="trade-card-broker-chip">{item._id?.broker}</span>}
                                            {item._id?.iteration && <span className="trade-card-sub-info">Iter: {item._id.iteration}</span>}
                                        </div>
                                        <div className="trade-card-header-right">
                                            <div className="trade-card-pnl fs-num">
                                                <Delta
                                                    value={formatCurrency(Math.abs(item.tradingPL || 0))}
                                                    tone={(item.tradingPL || 0) > 0 ? 'positive' : (item.tradingPL || 0) < 0 ? 'negative' : 'neutral'}
                                                    sign={(item.tradingPL || 0) > 0 ? 'positive' : (item.tradingPL || 0) < 0 ? 'negative' : 'none'}
                                                    label={(item.tradingPL || 0) >= 0 ? 'Gain' : 'Loss'}
                                                />
                                            </div>
                                            <div className="trade-card-sub-info fs-num">
                                                <Delta
                                                    value={`${Math.abs(item.profitPercentage || 0)}%`}
                                                    tone={(item.profitPercentage || 0) > 0 ? 'positive' : (item.profitPercentage || 0) < 0 ? 'negative' : 'neutral'}
                                                    sign={(item.profitPercentage || 0) > 0 ? 'positive' : (item.profitPercentage || 0) < 0 ? 'negative' : 'none'}
                                                    label={(item.profitPercentage || 0) >= 0 ? 'Gain' : 'Loss'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="trade-card-expander-btn"
                                        aria-expanded={isExpanded}
                                        onClick={() => toggleCloseCard(cardKey)}
                                        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for closed position ${item._id?.stockCode}`}
                                    >
                                        {isExpanded ? 'Hide details ▲' : 'Show all fields ▼'}
                                    </button>

                                    {isExpanded && (
                                        <div className="trade-card-drawer">
                                            <div className="trade-card-grid">
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Total Realized Return</span>
                                                    <span className="trade-card-val fs-num">
                                                        <Delta
                                                            value={formatCurrency(Math.abs(item.totalRealizedReturn || 0))}
                                                            tone={(item.totalRealizedReturn || 0) > 0 ? 'positive' : (item.totalRealizedReturn || 0) < 0 ? 'negative' : 'neutral'}
                                                            sign={(item.totalRealizedReturn || 0) > 0 ? 'positive' : (item.totalRealizedReturn || 0) < 0 ? 'negative' : 'none'}
                                                            label={(item.totalRealizedReturn || 0) >= 0 ? 'Gain' : 'Loss'}
                                                        />
                                                    </span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Dividends</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.dividendIncome || 0)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Total Buy Value</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.totalBuyValue)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Total Sell Value</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.totalSellValue)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Selling Price</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.sellingPrice || 0)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Total Fees</span>
                                                    <span className="trade-card-val fs-num">{formatCurrency(item.totalFees)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Trade Count</span>
                                                    <span className="trade-card-val fs-num">{item.tradeCount}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Holding Period</span>
                                                    <span className="trade-card-val">{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</span>
                                                </div>
                                                <div className="trade-card-field">
                                                    <span className="trade-card-label">Days Held</span>
                                                    <span className="trade-card-val fs-num">{daysBetween(item.firstTradeDate, item.lastTradeDate)} days</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                </div>
                ) : (
                /* Desktop Dense Table (>768px, Reference Frame 01) */
                <div className="trades-desktop-table table-container">
                    <table className="styled-table">
                    <thead>
                        <tr>
                            <th
                                onClick={() => handleCloseSort('stockCode')}
                                className="sortable"
                                title="Click to sort by Stock Code"
                            >
                                Stock Code{getCloseSortIndicator('stockCode')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('tradingPL')}
                                className="sortable"
                                title="Click to sort by Trading P/L"
                            >
                                Trading P/L{getCloseSortIndicator('tradingPL')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('dividendIncome')}
                                className="sortable"
                                title="Click to sort by Dividends"
                            >
                                Dividends{getCloseSortIndicator('dividendIncome')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('realizedPL')}
                                className="sortable"
                                title="Click to sort by Total Return"
                            >
                                Total Return{getCloseSortIndicator('realizedPL')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('profitPercentage')}
                                className="sortable"
                                title="Click to sort by Profit %"
                            >
                                Profit %{getCloseSortIndicator('profitPercentage')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('sellPrice')}
                                className="sortable"
                                title="Click to sort by Sell Price"
                            >
                                Sell Price{getCloseSortIndicator('sellPrice')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('totalSell')}
                                className="sortable"
                                title="Click to sort by Total Sell"
                            >
                                Total Sell{getCloseSortIndicator('totalSell')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('totalBuy')}
                                className="sortable"
                                title="Click to sort by Total Buy"
                            >
                                Total Buy{getCloseSortIndicator('totalBuy')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('totalFees')}
                                className="sortable"
                                title="Click to sort by Total Fees"
                            >
                                Total Fees{getCloseSortIndicator('totalFees')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('tradeCount')}
                                className="sortable"
                                title="Click to sort by Trade Count"
                            >
                                Trade Count{getCloseSortIndicator('tradeCount')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('dateRange')}
                                className="sortable"
                                title="Click to sort by Date Range"
                            >
                                Date Range{getCloseSortIndicator('dateRange')}
                            </th>
                            <th
                                onClick={() => handleCloseSort('days')}
                                className="sortable"
                                title="Click to sort by Days"
                            >
                                Days{getCloseSortIndicator('days')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEndPosData.map((item, index) => (
                            <tr key={index} className="trade-card">
                                <td data-label="Code">
                                    <p className="stock-code-title"><strong>{item._id?.stockCode}</strong></p>
                                    <p>{item._id?.iteration || '0'}</p>
                                    <p className="broker">{item._id?.broker}</p>
                                </td>
                                <td data-label="Trading P/L" className="total-value fs-num">
                                    <Delta
                                        value={formatCurrency(Math.abs(item.tradingPL || 0))}
                                        tone={(item.tradingPL || 0) > 0 ? 'positive' : (item.tradingPL || 0) < 0 ? 'negative' : 'neutral'}
                                        sign={(item.tradingPL || 0) > 0 ? 'positive' : (item.tradingPL || 0) < 0 ? 'negative' : 'none'}
                                        label={(item.tradingPL || 0) >= 0 ? 'Gain' : 'Loss'}
                                    />
                                </td>
                                <td data-label="Dividends" className="total-value fs-num">
                                    {formatCurrency(item.dividendIncome || 0)}
                                </td>
                                <td data-label="Total Return" className="total-value fs-num">
                                    <Delta
                                        value={formatCurrency(Math.abs(item.totalRealizedReturn || 0))}
                                        tone={(item.totalRealizedReturn || 0) > 0 ? 'positive' : (item.totalRealizedReturn || 0) < 0 ? 'negative' : 'neutral'}
                                        sign={(item.totalRealizedReturn || 0) > 0 ? 'positive' : (item.totalRealizedReturn || 0) < 0 ? 'negative' : 'none'}
                                        label={(item.totalRealizedReturn || 0) >= 0 ? 'Gain' : 'Loss'}
                                    />
                                </td>
                                <td data-label="Profit" className="fs-num">
                                    <Delta
                                        value={`${Math.abs(item.profitPercentage || 0)}%`}
                                        tone={(item.profitPercentage || 0) > 0 ? 'positive' : (item.profitPercentage || 0) < 0 ? 'negative' : 'neutral'}
                                        sign={(item.profitPercentage || 0) > 0 ? 'positive' : (item.profitPercentage || 0) < 0 ? 'negative' : 'none'}
                                        label={(item.profitPercentage || 0) >= 0 ? 'Gain' : 'Loss'}
                                    />
                                </td>
                                <td data-label="Selling Price" className="fs-num">
                                    {formatCurrency(item.sellingPrice || 0)}
                                </td>
                                <td data-label="Total Buy" className="fs-num">{formatCurrency(item.totalBuyValue)}</td>
                                <td data-label="Total Sell" className="fs-num">{formatCurrency(item.totalSellValue)}</td>
                                <td data-label="Fees" className="fs-num">{formatCurrency(item.totalFees)}</td>
                                <td data-label="Count" className="fs-num">{item.tradeCount}</td>
                                <td data-label="Period">{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                                <td data-label="Days" className="fs-num">
                                    <span>
                                        {daysBetween(item.firstTradeDate, item.lastTradeDate)} days
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
            </div>
        </div>
    );
};

export default TradeSummaryPage;
