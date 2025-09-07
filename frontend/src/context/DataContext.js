// frontend/src/context/DataContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Import all the service functions we'll need
import { getAllTrades, getTradeSummary, getMarketData } from '../services/tradeService';
import { safeDivision, safePercentage } from '../utils/helper'; // Import any helper functions you need 
import { getOverallSummary } from '../services/creditCardService'; // Import credit card service functions
// ... import other services as needed (mutual funds, certificates, etc.)

// 1. Create the Context
const DataContext = createContext();

// 2. Create a custom hook for easy consumption
export const useData = () => {
    return useContext(DataContext);
};

// 3. Create the Provider Component
export const DataProvider = ({ children }) => {
    // State for all our global data
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);
    // Stocks
    const [stSummaryData, setStSummaryData] = useState([]);
    const [openPosData, setOpenPosData] = useState([]);
    const [endPosData, setEndPosData] = useState([]);
    const [stMarketPrices, setStMarketPrices] = useState({}); // Store market prices for stocks
    const [summaryMetrics, setSummaryMetrics] = useState({}); // Summary metrics if needed
    const [tradesData, setTradesData] = useState([]); // Store trades data in state
    // Credit Cards
    const [creditCardsSummary, setCreditCardsSummary] = useState([]); // Store credit card data in state
    // Responsive 
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    // Margin profit percentage for stocks
    const marginProfit = 0.2; // Margin profit percentage for calculations


    // Function to calculate summary metrics
    const calculateSummaryMetrics = (trades, openPositions, closedPositions) => {
        if (!trades || !Array.isArray(trades)) {
            console.warn('No trades data available for metrics calculation');
            return {};
        }

        let totalBuy = trades.filter(t => t && t.type === 'Buy').reduce((sum, t) => sum + (t.totalValue || 0), 0);
        let totalSell = trades.filter(t => t && t.type === 'Sell').reduce((sum, t) => sum + (t.totalValue || 0), 0);
        let totalDividends = trades.filter(t => t && t.type === 'Dividend').reduce((sum, t) => sum + (t.totalValue || 0), 0);
        
        const metrics = {};
        metrics.topUps = trades.filter(t => t && t.type === 'TopUp').reduce((sum, t) => sum + (t.totalValue || 0), 0);
        metrics.withdraws = trades.filter(t => t && t.type === 'Withdraw').reduce((sum, t) => sum + (t.totalValue || 0), 0);
        metrics.totalFees = trades.reduce((sum, t) => sum + (t && t.fees ? t.fees : 0), 0);
        metrics.totalTrades = openPositions.reduce((sum, t) => sum - (t && t.totDeals ? t.totDeals : 0), 0);
        metrics.totalTradesNow = openPositions.reduce((sum, item) => sum + (item && item.totalValueNow ? item.totalValueNow : 0), 0);
        metrics.walletBalance = metrics.topUps + totalSell + totalDividends - totalBuy - metrics.withdraws - metrics.totalFees;
        metrics.realizedProfit = closedPositions.reduce((sum, item) => sum + (item && item.totalSellValue ? item.totalSellValue : 0), 0) - closedPositions.reduce((sum, item) => sum + (item && item.totalBuyValue ? item.totalBuyValue : 0), 0);
        metrics.totalProfitNow = metrics.totalTradesNow + metrics.walletBalance - metrics.topUps;

        return metrics;
    };

    // Function to refresh stock data (can be called from components)
    const refreshStockData = async () => {
        try {
            console.log('Refreshing stock data...');
            const [newStMarketData, newStSummaryData, newTrades] = await Promise.all([
                getMarketData(),
                getTradeSummary(),
                getAllTrades()
            ]);

            let marketMap = {};
            if (newStMarketData && newStMarketData.prices) {
                marketMap = newStMarketData.prices.reduce((acc, item) => {
                    if (item.code) {
                        acc[item.code] = item.value;
                    }
                    return acc;
                }, {});
                setStMarketPrices(marketMap);
            }

            setStSummaryData(newStSummaryData);
            
            const { openPositions, closedPositions } = loadSummaryData(newStSummaryData, marketMap);

            // Recalculate metrics with fresh data
            if (newTrades && Array.isArray(newTrades)) {
                let totalBuy = newTrades.filter(t => t && t.type === 'Buy').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                let totalSell = newTrades.filter(t => t && t.type === 'Sell').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                let totalDividends = newTrades.filter(t => t && t.type === 'Dividend').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                
                const metrics = {};
                metrics.topUps = newTrades.filter(t => t && t.type === 'TopUp').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                metrics.withdraws = newTrades.filter(t => t && t.type === 'Withdraw').reduce((sum, t) => sum + (t.totalValue || 0), 0);
                metrics.totalFees = newTrades.reduce((sum, t) => sum + (t && t.fees ? t.fees : 0), 0);
                metrics.totalTrades = openPositions.reduce((sum, t) => sum - (t && t.totDeals ? t.totDeals : 0), 0);
                metrics.totalTradesNow = openPositions.reduce((sum, item) => sum + (item && item.totalValueNow ? item.totalValueNow : 0), 0);
                metrics.walletBalance = metrics.topUps + totalSell + totalDividends - totalBuy - metrics.withdraws - metrics.totalFees;
                metrics.realizedProfit = closedPositions.reduce((sum, item) => sum + (item && item.totalSellValue ? item.totalSellValue : 0), 0) - closedPositions.reduce((sum, item) => sum + (item && item.totalBuyValue ? item.totalBuyValue : 0), 0);
                metrics.totalProfitNow = metrics.totalTradesNow + metrics.walletBalance - metrics.topUps;

                setSummaryMetrics(metrics);
                console.log('Stock data refreshed successfully');
            }
        } catch (error) {
            console.error('Error refreshing stock data:', error);
        }
    };

    const loadSummaryData = (data, market) => {
        const openPositions = [];
        const closedPositions = [];
        for (const item of data) {
            if (item.currentShares > 0 && item._id.iteration >= 0) {
                item.avgPrice = Math.abs(item.realizedPL / item.currentShares); // avgPrice is the average price of shares currently held
                item.avgBuy = Math.abs(item.totDeals / item.currentShares); // avgBuy is the average price paid for shares
                item.targetPrice = item.avgPrice * (1 + marginProfit); // Target price is avgPrice + margin profit  
                item.targetSell = item.avgBuy * (1 + marginProfit); // Target sell price is avgBuy + margin profit
                item.totalValueNow = market[item._id.stockCode] * item.currentShares;
                item.changeNow = safePercentage(item.totalValueNow, Math.abs(item.realizedPL)); // Calculate change percentage
                openPositions.push(item);

            } else {
                if (item._id.stockCode) {
                    item.profitPercentage = safeDivision(item.realizedPL, item.totalBuyValue); // profitPercentage is the percentage profit made on the trade
                    if(tradesData){
                        let lastSell = tradesData.filter(t => t.stockCode === item._id.stockCode && t.iteration === item._id.iteration && t.broker === item._id.broker && t.type === "Sell");
                        if (lastSell && lastSell.length > 0) {
                            item.sellingPrice = lastSell.pop().price || 0;
                        }
                    }
                    closedPositions.push(item);
                }
            }
        }
        return { openPositions, closedPositions };
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setLoadingProgress(0);
                // Use Promise.all to fetch everything concurrently for performance
                const [
                    stSummaryData,
                    stMarketData,
                    trades,
                    creditCardsSummary,
                ] = await Promise.all([
                    getTradeSummary(),
                    getMarketData(),
                    getAllTrades(),
                    getOverallSummary(), // Fetch credit card summary
                    // ... add other fetch calls here
                ]);
                setLoadingProgress(30); // Update loading progress

                setStSummaryData(stSummaryData);
                setTradesData(trades);
                setCreditCardsSummary(creditCardsSummary); // Set credit card summary in state
                setLoadingProgress(50); // Update loading progress

                
                setLoadingProgress(70); // Update loading progress
                // Stocks
                let marketMap = {};
                if (stMarketData && stMarketData.prices) {
                    marketMap = stMarketData.prices.reduce((acc, item) => {
                        if (item.code) {
                            acc[item.code] = item.value;
                        }
                        return acc;
                    }, {});
                    setStMarketPrices(marketMap);
                }
                const {openPositions, closedPositions} = loadSummaryData(stSummaryData, marketMap);
                setOpenPosData(openPositions);
                setEndPosData(closedPositions);
                // Calculate summary metrics
                if(trades && Array.isArray(trades)) {
                    const metrics = calculateSummaryMetrics(trades, openPositions, closedPositions);
                    setSummaryMetrics(metrics);
                }
              
                setLoadingProgress(100); // Update loading progress
            } catch (err) {
                console.error("Failed to load global data:", err);
                setError(err);
            } finally {
                // Small delay to simulate loading time
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };

        fetchAllData();
    }, []); // Empty dependency array means this runs once


    // Separate effect to handle stock market price updates and recalculate positions
    useEffect(() => {
        if (stMarketPrices && Object.keys(stMarketPrices).length > 0 && stSummaryData && stSummaryData.length > 0) {     
            const { openPositions, closedPositions } = loadSummaryData(stSummaryData, stMarketPrices);  
            const metrics = calculateSummaryMetrics(tradesData, openPositions, closedPositions);
            setSummaryMetrics(metrics);
        }
    }, [stMarketPrices, stSummaryData, tradesData]); // Runs when market prices or summary data changes

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    // The value that will be available to all consuming components
    const value = {
        stSummaryData,
        openPosData,
        endPosData,
        stMarketPrices,
        summaryMetrics,
        tradesData,
        creditCardsSummary,
        isLoading,
        isMobile,
        error,
        loadingProgress, // Added progress for more detailed loading feedback
        refreshStockData, // Add stock refresh function to context
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
