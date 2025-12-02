import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getAllTrades, getTradeSummary, getMarketData } from '../services/tradeService';
import { safeDivision, safePercentage, safePercet } from '../utils/helper';
import isEqual from 'lodash/isEqual';

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);
    const [stSummaryData, setStSummaryData] = useState([]);
    const [openPosData, setOpenPosData] = useState([]);
    const [endPosData, setEndPosData] = useState([]);
    const [stMarketPrices, setStMarketPrices] = useState({});
    const [summaryMetrics, setSummaryMetrics] = useState({});
    const [tradesData, setTradesData] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const marginProfit = 0.2;
/*
    const calculateSummaryMetrics = useCallback((trades, openPositions, closedPositions) => {
        if (!trades || !Array.isArray(trades)) {
            console.warn('No trades data available for metrics calculation');
            return {};
        }

        const totalBuy = trades.reduce((sum, t) => (t?.type === 'Buy' ? sum + (t.totalValue || 0) : sum), 0);
        const totalSell = trades.reduce((sum, t) => (t?.type === 'Sell' ? sum + (t.totalValue || 0) : sum), 0);
        const totalDividends = trades.reduce((sum, t) => (t?.type === 'Dividend' ? sum + (t.totalValue || 0) : sum), 0);

        const metrics = {
            topUps: trades.reduce((sum, t) => (t?.type === 'TopUp' ? sum + (t.totalValue || 0) : sum), 0),
            withdraws: trades.reduce((sum, t) => (t?.type === 'Withdraw' ? sum + (t.totalValue || 0) : sum), 0),
            totalFees: trades.reduce((sum, t) => sum + (t?.fees || 0), 0),
            totalTrades: openPositions.reduce((sum, t) => sum - (t?.totDeals || 0), 0),
            totalTradesNow: openPositions.reduce((sum, item) => sum + (item?.totalValueNow || 0), 0),
        };
        metrics.walletBalance = metrics.topUps + totalSell + totalDividends - totalBuy - metrics.withdraws - metrics.totalFees;
        metrics.realizedProfit =
            closedPositions.reduce((sum, item) => sum + (item?.totalSellValue || 0), 0) -
            closedPositions.reduce((sum, item) => sum + (item?.totalBuyValue || 0), 0);
        metrics.totalProfitNow = metrics.totalTradesNow + metrics.walletBalance - metrics.topUps;

        return metrics;
    }, []);

    const computeSummaryData = useCallback((data, market, trades) => {
        const openPositions = [];
        const closedPositions = [];
        for (const item of data || []) {
            if (item?.currentShares > 0 && item?._id?.iteration >= 0) {
                const avgPrice = Math.abs(safeDivision(item.realizedPL, item.currentShares))/100;
                const updatedItem = {
                    ...item,
                    avgPrice,
                    avgBuy: Math.abs(safeDivision(item.totDeals, item.currentShares))/100,
                    targetPrice: avgPrice * (1 + marginProfit),
                    targetSell: (Math.abs(safeDivision(item.totDeals, item.currentShares))/100) * (1 + marginProfit),
                    totalValueNow: (market[item._id.stockCode] || 0) * item.currentShares,
                    changeNow: safePercentage(
                        (market[item._id.stockCode] || 0) * item.currentShares,
                        Math.abs(item.realizedPL)
                    ),
                };
                openPositions.push(updatedItem);
            } else if (item?._id?.stockCode) {
                let sellingPrice = 0;
                if (trades && Array.isArray(trades)) {
                    const lastSell = trades.filter(
                        (t) =>
                            t?.stockCode === item._id.stockCode &&
                            t?.iteration === item._id.iteration &&
                            t?.broker === item._id.broker &&
                            t?.type === 'Sell'
                    );
                    if (lastSell.length > 0) {
                        sellingPrice = lastSell.pop()?.price || 0;
                    }
                }
                const updatedItem = {
                    ...item,
                    profitPercentage: safeDivision(item.realizedPL, item.totalBuyValue),
                    sellingPrice,
                };
                closedPositions.push(updatedItem);
            }
        }
        return { openPositions, closedPositions };
    }, [marginProfit]);
*/

    const calculateSummaryMetrics = useCallback((trades, openPositions, closedPositions) => {
        if (!trades || !Array.isArray(trades)) {
            console.warn('No trades data available for metrics calculation');
            return {};
        }

        // Basic totals from raw trade list
        const totalBuy = trades.reduce((sum, t) => (t?.type === 'Buy' ? sum + (t.totalValue || 0) : sum), 0);
        const totalSell = trades.reduce((sum, t) => (t?.type === 'Sell' ? sum + (t.totalValue || 0) : sum), 0);
        const totalDividends = trades.reduce((sum, t) => (t?.type === 'Dividend' ? sum + (t.totalValue || 0) : sum), 0);

        const metrics = {
            topUps: trades.reduce((sum, t) => (t?.type === 'TopUp' ? sum + (t.totalValue || 0) : sum), 0),
            withdraws: trades.reduce((sum, t) => (t?.type === 'Withdraw' ? sum + (t.totalValue || 0) : sum), 0),
            totalFees: trades.reduce((sum, t) => sum + (t?.fees || 0), 0),
            
            // Net Cash Flow (Money In vs Money Out)
            // Note: Check if your backend sends 'netCashFlow' or 'totDeals'. Use that if available.
            totalTrades: openPositions.reduce((sum, t) => sum + (t?.netCashFlow || t?.totDeals || 0), 0),
            
            // Current value of portfolio
            totalTradesNow: openPositions.reduce((sum, item) => sum + (item?.totalValueNow || 0), 0),
        };

        // Wallet Balance = Cash In - Cash Out (This logic remains valid)
        metrics.walletBalance = metrics.topUps + totalSell + totalDividends - totalBuy - metrics.withdraws - metrics.totalFees;

        // --- FIX HERE ---
        // Instead of (Sell - Buy), sum the realizedPL field from the backend.
        // We look at BOTH open and closed positions because an open position might have partial realized profit.
        const realizedOpen = openPositions.reduce((sum, item) => sum + (item?.realizedPL || 0), 0);
        const realizedClosed = closedPositions.reduce((sum, item) => sum + (item?.realizedPL || 0), 0);
        
        metrics.realizedProfit = realizedOpen + realizedClosed;

        // Total Profit Now = Unrealized Gain/Loss + Realized Profit
        // Or simpler: (Portfolio Value + Cash Balance) - Net Deposit
        metrics.totalProfitNow = (metrics.totalTradesNow + metrics.walletBalance) - (metrics.topUps - metrics.withdraws);

        return metrics;
    }, []);

    const computeSummaryData = useCallback((data, market, trades) => {
        const openPositions = [];
        const closedPositions = [];

        for (const item of data || []) {
            // --- OPEN POSITIONS ---
            if (item?.currentShares > 0 && item?._id?.iteration >= 0) {
                
                // USE BACKEND VALUE: The backend now calculates the true weighted average price
                // Ensure you match the field name from your backend aggregation (averageBuyPrice)
                const avgPrice = item.averageBuyPrice || 0; 

                // Use the new Adjusted Price from backend
                const adjustedAvg = item.adjustedAvgPrice || 0;

                const netBreakEven = item.netBreakEvenPrice || 0;

                // Calculate current value based on market price
                const currentMarketPrice = market[item._id.stockCode] || 0;
                const totalValueNow = currentMarketPrice * item.currentShares;

                const totalAdjustedCost = netBreakEven * item.currentShares;
                
                // Calculate Cost Basis of currently held shares
                const totalCostBasis = avgPrice * item.currentShares;

                // Unrealized P/L (Paper Profit)
                const unrealizedPL = totalValueNow - totalCostBasis;

                const updatedItem = {
                    ...item,
                    avgPrice: avgPrice, // The price you paid on average
                    
                    // Target Price logic (Example: +20% from average cost)
                    targetPrice: avgPrice * (1 + marginProfit),

                    breakEvenPrice: adjustedAvg,
                    breakEvenTarget: netBreakEven * (1 + marginProfit),

                    netBreakEven: netBreakEven,
                    
                    // Current Market Value
                    totalValueNow: totalValueNow,
                    
                    // Change Now: Percentage difference between Market Price and Avg Buy Price
                    changeNow: totalAdjustedCost > 0 ?safeDivision((totalValueNow - totalAdjustedCost), totalAdjustedCost) : safeDivision(-1*item.totDeals, totalValueNow),
                    
                    // Add the actual Unrealized P/L amount for display
                    unrealizedPL: unrealizedPL 
                };
                openPositions.push(updatedItem);
            } 
            
            // --- CLOSED POSITIONS ---
            // (Items where you might have sold everything, or partial history)
            else if (item?._id?.stockCode) {
                let sellingPrice = 0;
                
                // (Your existing logic to find the last sell price is fine)
                if (trades && Array.isArray(trades)) {
                    const lastSell = trades.filter(
                        (t) =>
                            t?.stockCode === item._id.stockCode &&
                            t?.iteration === item._id.iteration &&
                            t?.broker === item._id.broker &&
                            t?.type === 'Sell'
                    );
                    if (lastSell.length > 0) {
                        sellingPrice = lastSell.pop()?.price || 0;
                    }
                }

                const updatedItem = {
                    ...item,
                    // USE BACKEND VALUE: realizedPL is now correct from the DB. 
                    // Don't recalculate it here.
                    profitPercentage: safeDivision(item.realizedPL, item.costOfSoldShares || item.totalSellValue), 
                    sellingPrice,
                };
                closedPositions.push(updatedItem);
            }
        }
        return { openPositions, closedPositions };
    }, [marginProfit]);

    // Memoize summary data to ensure stable references
    const { openPositions, closedPositions } = useMemo(() => {
        return computeSummaryData(stSummaryData, stMarketPrices, tradesData);
    }, [stSummaryData, stMarketPrices, tradesData, computeSummaryData]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setLoadingProgress(0);
                const [stSummaryData, stMarketData, trades] = await Promise.all([
                    getTradeSummary(),
                    getMarketData(),
                    getAllTrades(),
                ]);
                setLoadingProgress(30);

                setStSummaryData(stSummaryData);
                setTradesData(trades);
                setLoadingProgress(50);

                let marketMap = {};
                if (stMarketData?.prices) {
                    marketMap = stMarketData.prices.reduce((acc, item) => {
                        if (item?.code) {
                            acc[item.code] = item.value;
                        }
                        return acc;
                    }, {});
                    setStMarketPrices(marketMap);
                }

                // Update derived state
                const { openPositions, closedPositions } = computeSummaryData(stSummaryData, marketMap, trades);
                setOpenPosData((prev) => (isEqual(prev, openPositions) ? prev : openPositions));
                setEndPosData((prev) => (isEqual(prev, closedPositions) ? prev : closedPositions));

                if (trades && Array.isArray(trades)) {
                    const metrics = calculateSummaryMetrics(trades, openPositions, closedPositions);
                    setSummaryMetrics((prev) => (isEqual(prev, metrics) ? prev : metrics));
                }

                setLoadingProgress(100);
            } catch (err) {
                console.error('Failed to load global data:', err);
                setError(err);
            } finally {
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };

        fetchAllData();
    }, [computeSummaryData, calculateSummaryMetrics]);

    useEffect(() => {
        // Update derived state when memoized data changes
        setOpenPosData((prev) => (isEqual(prev, openPositions) ? prev : openPositions));
        setEndPosData((prev) => (isEqual(prev, closedPositions) ? prev : closedPositions));
        if (tradesData && Array.isArray(tradesData)) {
            const metrics = calculateSummaryMetrics(tradesData, openPositions, closedPositions);
            setSummaryMetrics((prev) => (isEqual(prev, metrics) ? prev : metrics));
        }
    }, [openPositions, closedPositions, tradesData, calculateSummaryMetrics]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const value = {
        stSummaryData,
        openPosData,
        endPosData,
        stMarketPrices,
        summaryMetrics,
        tradesData,
        isLoading,
        isMobile,
        error,
        loadingProgress,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};