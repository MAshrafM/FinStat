// frontend/src/pages/trades/TradeSummaryPage.js
import React, {useState, useMemo, useCallback} from 'react';
//import { getAllTrades, getTradeSummary, getMarketData } from '../../services/tradeService';
import { useData } from '../../context/DataContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { sortData, getNextSortConfig } from '../../utils/helper';
import './Trades.css'; // Reuse the same CSS file
import '../../components/SummaryRow.css'; // Reuse summary row styles'
import '../../components/Table.css'; // Reuse table styles

const TradeSummaryPage = () => {
    const { openPosData,
        endPosData,
        stMarketPrices,
        summaryMetrics,
        isLoading, } = useData();

    const [closeSortConfig, setCloseSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const [openSortConfig, setOpenSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const daysBetween = useCallback((date1, date2) => {
        if (!date1 || !date2) return '';
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    }, []);

    const getCloseSortValue = useCallback((item, key) => {
        switch (key) {
        case 'stockCode':
            return item._id.stockCode;
        case 'realizedPL':
            return item.realizedPL;
        case 'profitPercentage':
            return item.profitPercentage;
        case 'sellPrice':
            return item.sellingPrice || 0;
        case 'totalSell':
            return item.totalSellValue;
        case 'totalBuy':
            return item.totalBuyValue;
        case 'totalFees':
            return item.totalFees;
        case 'tradeCount':
            return item.tradeCount;
        case 'dateRange':
            return new Date(item.firstTradeDate);
        case 'days':
            return daysBetween(item.firstTradeDate, item.lastTradeDate);
        default:
            return '';
        }
    }, [daysBetween]);

    const getOpenSortValue = useCallback((item, key) => {
      switch (key) {
        case 'stockCode':
          return item._id.stockCode;
        case 'realizedPL':
          return Math.abs(item.realizedPL);
        case 'deals':
          return Math.abs(item.totDeals);
        case 'shares':
          return item.currentShares;
        case 'avgPrice':
          return Math.abs(item.avgPrice);
        case 'avgSell':
          return Math.abs(item.avgBuy);
        case 'target':
          return Math.abs(item.targetPrice);
        case 'sell0':
          return Math.abs(item.targetSell);
        case 'currPrice':
          return stMarketPrices[item._id.stockCode] || 0;
        case 'currValue':
          return item.totalValueNow;
        case 'currChange':
          return item.changeNow;
        case 'fees':
          return item.totalFees;
        case 'counts':
          return item.tradeCount;
        case 'range':
          return new Date(item.firstTradeDate);
        default:
          return '';
      }
    }, [stMarketPrices]);


  // Memoized sorted data - moved to top level before any other functions
  const sortedEndPosData = useMemo(
    () => sortData(endPosData, closeSortConfig, getCloseSortValue),
    [endPosData, closeSortConfig, getCloseSortValue]
  );
  
  // Memoized sorted data for Open Positions
  const sortedOpenPosData = useMemo(
    () => sortData(openPosData, openSortConfig, getOpenSortValue),
    [openPosData, openSortConfig, getOpenSortValue]
  );

  // Function to handle sorting for Close Positions
  const handleCloseSort = (key) => setCloseSortConfig(getNextSortConfig(closeSortConfig, key));
  const handleOpenSort = (key) => setOpenSortConfig(getNextSortConfig(openSortConfig, key));


  // Function to render sort indicator
  const getCloseSortIndicator = (columnKey) => {
    if (closeSortConfig.key !== columnKey) {
      return ' ⇅'; // No sort indicator
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
                            <th 
                                onClick={() => handleOpenSort('stockCode')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Stock Code"
                            >
                                Stock Code{getOpenSortIndicator('stockCode')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('realizedPL')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Realized P/L"
                            >
                                Realized P/L{getOpenSortIndicator('realizedPL')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('deals')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Deals"
                            >
                                All Deals {getOpenSortIndicator('deals')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('shares')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Shares"
                            >
                                Shares{getOpenSortIndicator('shares')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('avgPrice')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Avg Price"
                            >
                                Avg Price{getOpenSortIndicator('avgPrice')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('avgSell')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Avg Sell"
                            >
                                Avg Sell{getOpenSortIndicator('avgSell')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('target')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Target"
                            >
                                Target{getOpenSortIndicator('target')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('sell0')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Sell 0"
                            >
                                Sell 0{getOpenSortIndicator('sell0')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('currPrice')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Curr Price"
                            >
                                Price{getOpenSortIndicator('currPrice')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('currValue')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Curr Value"
                            >
                                Tot. Value{getOpenSortIndicator('currValue')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('currChange')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Curr Change"
                            >
                                Change{getOpenSortIndicator('currChange')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('fees')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Fees"
                            >
                                Fees{getOpenSortIndicator('fees')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('counts')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Counts"
                            >
                                Counts{getOpenSortIndicator('counts')}
                            </th>
                            <th 
                                onClick={() => handleOpenSort('range')} 
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Click to sort by Range"
                            >
                                Range{getOpenSortIndicator('range')}
                            </th>
                            </tr>
                        </thead>
                    <tbody>
                        {sortedOpenPosData.map((item, index) => (
                            <tr key={index}>
                                <td data-label="Code">
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
                                <td data-label="Target Price">{formatCurrency(Math.abs(item.targetPrice))}</td>
                                <td data-label="Target Sell">{formatCurrency(Math.abs(item.targetSell))}</td>
                                <td data-label="Price" style={{ color: Math.abs(item.avgPrice) > stMarketPrices[item._id.stockCode] ? '#c0392b' : '#27ae60' }}>${stMarketPrices[item._id.stockCode]}</td>
                                <td data-label="Total Now" className="total-value" style={{ color: item.totalValueNow >= Math.abs(item.totDeals) ? '#27ae60' : '#c0392b' }}>{formatCurrency(item.totalValueNow)}</td>
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
                        <th 
                        onClick={() => handleCloseSort('stockCode')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Stock Code"
                        >
                        Stock Code{getCloseSortIndicator('stockCode')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('realizedPL')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Realized P/L"
                        >
                        Realized P/L{getCloseSortIndicator('realizedPL')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('profitPercentage')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Profit %"
                        >
                        Profit %{getCloseSortIndicator('profitPercentage')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('sellPrice')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Sell Price"
                        >
                        Sell Price{getCloseSortIndicator('sellPrice')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('totalSell')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Total Sell"
                        >
                        Total Sell{getCloseSortIndicator('totalSell')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('totalBuy')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Total Buy"
                        >
                        Total Buy{getCloseSortIndicator('totalBuy')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('totalFees')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Total Fees"
                        >
                        Total Fees{getCloseSortIndicator('totalFees')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('tradeCount')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Trade Count"
                        >
                        Trade Count{getCloseSortIndicator('tradeCount')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('dateRange')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Date Range"
                        >
                        Date Range{getCloseSortIndicator('dateRange')}
                        </th>
                        <th 
                        onClick={() => handleCloseSort('days')} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by Days"
                        >
                        Days{getCloseSortIndicator('days')}
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedEndPosData.map((item, index) => (
                        <tr key={index}>
                        <td data-label="Code">
                            <p style={{ fontWeight: 'bold' }}>{item._id.stockCode}</p>
                            <p>{item._id.iteration || '0'}</p>
                            <p className="broker">{item._id.broker}</p>
                        </td>
                        <td data-label="Realized P/L" className="total-value" style={{ color: item.realizedPL >= 0 ? '#27ae60' : '#c0392b' }}>
                            {formatCurrency(item.realizedPL)}
                        </td>
                        <td data-label="Profit" style={{ color: item.profitPercentage >= 0 ? '#27ae60' : '#c0392b' }}>{item.profitPercentage} %</td>
                        <td data-label="Selling Price" style={{ color: item.sellingPrice > stMarketPrices[item._id.stockCode] ? '#27ae60' : '#c0392b'}}>{formatCurrency(item.sellingPrice || 0)}</td>
                        <td data-label="Total Buy"> {formatCurrency(item.totalBuyValue)}</td>
                        <td data-label="Total Sell"> {formatCurrency(item.totalSellValue)}</td>
                        <td data-label="Fees">{formatCurrency(item.totalFees)}</td>
                        <td data-label="Count">{item.tradeCount}</td>
                        <td data-label="Period">{formatDate(item.firstTradeDate)} - {formatDate(item.lastTradeDate)}</td>
                        <td data-label="Days">
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
