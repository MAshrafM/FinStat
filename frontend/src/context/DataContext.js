import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { getAllTrades, getTradeSummary, getMarketData } from '../services/tradeService';
import { safeDivision, safePercentage } from '../utils/helper';
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
                const avgPrice = Math.abs(safeDivision(item.realizedPL, item.currentShares));
                const updatedItem = {
                    ...item,
                    avgPrice,
                    avgBuy: Math.abs(safeDivision(item.totDeals, item.currentShares)),
                    targetPrice: avgPrice * (1 + marginProfit),
                    targetSell: Math.abs(safeDivision(item.totDeals, item.currentShares)) * (1 + marginProfit),
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