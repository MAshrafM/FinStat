// frontend/src/context/DataContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Import all the service functions we'll need
import { getGoldSummary, getGoldPrice } from '../services/goldService';
import { getCertificates } from '../services/certificateService';
import { getMutualFundSummary, getLastPrice } from '../services/mutualFundService';
import { getAllTrades, getTradeSummary, getMarketData } from '../services/tradeService';
import { getLatestExpenditure } from '../services/expenditureService';
import { safeDivision, safePercentage } from '../utils/helper'; // Import any helper functions you need 
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
    // Gold
    const [goldSummary, setGoldSummary] = useState([]);
    const [marketPrices, setMarketPrices] = useState({});
    const [overallTotalPaid, setOverallTotalPaid] = useState(0);
    const [goldtotalNow, setGoldTotalNow] = useState(0);
    // Certificates
    const [certificates, setCertificates] = useState([]);
    const [certificateSummary, setCertificateSummary] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Mutual Funds
    const [mfSummaryData, setMfSummaryData] = useState([]);
    const [overallTotals, setOverallTotals] = useState({});
    const [lastPriceData, setLastPriceData] = useState(null);
    // Stocks
    const [stSummaryData, setStSummaryData] = useState([]);
    const [openPosData, setOpenPosData] = useState([]);
    const [endPosData, setEndPosData] = useState([]);
    const [stMarketPrices, setStMarketPrices] = useState({}); // Store market prices for stocks
    const [summaryMetrics, setSummaryMetrics] = useState({}); // Summary metrics if needed
    const [bankAccountData, setBankAccountData] = useState({}); // Bank account data if needed

    const marginProfit = 0.2; // Margin profit percentage for calculations

    // Effect to fetch all data when the provider mounts

    const calculateProgress = (startDate, period) => {
        const start = new Date(startDate);
        const now = new Date();
        const maturity = new Date(start);
        maturity.setMonth(maturity.getMonth() + period);
        const isActive = now >= start && now <= maturity;
        return { isActive };
    };

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
                    closedPositions.push(item);
                }
            }
        }
        setStSummaryData(data);
        setOpenPosData(openPositions)
        setEndPosData(closedPositions);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Use Promise.all to fetch everything concurrently for performance
                const [
                    goldSummaryData,
                    marketPricesData,
                    certificatesData,
                    mfSummaryData,
                    stSummaryData,
                    stMarketData,
                    trades,
                    bankAccountData
                ] = await Promise.all([
                    getGoldSummary(),
                    getGoldPrice(),
                    getCertificates(),
                    getMutualFundSummary(),
                    getTradeSummary(),
                    getMarketData(),
                    getAllTrades(),
                    getLatestExpenditure() 
                    // ... add other fetch calls here
                ]);

                setGoldSummary(goldSummaryData);
                setMarketPrices(marketPricesData);
                setCertificates(certificatesData);
                setMfSummaryData(mfSummaryData);
                // Calculate overall total paid and current value for gold
                let totalP = goldSummaryData.reduce((sum, item) => sum + item.totalPaid, 0);
                setOverallTotalPaid(totalP);
                const totalNow = goldSummaryData.reduce((previous, item) => {
                    const karat = item._id;
                    const currentPricePerGram = marketPricesData[karat] || 0;
                    const currentValue = item.totalWeight * currentPricePerGram;
                    return previous + currentValue;
                }, 0);
                setGoldTotalNow(totalNow);

                // Certificate Summary Calculation
                const certificateSummary = certificatesData.reduce((previous, cert) => {
                    const { isActive } = calculateProgress(cert.startDate, cert.period);
                    const years = cert.period / 12;
                    const totalReturn = cert.amount * (1 + (cert.interest / 100) * years);

                    if (isActive) {
                        return {
                            totalActiveAmount: previous.totalActiveAmount + cert.amount,
                            totalExpectedReturns: previous.totalExpectedReturns + totalReturn
                        };
                    }
                    return previous; // Return previous state if certificate is not active
                }, { totalActiveAmount: 0, totalExpectedReturns: 0 }); // Initial accumulator value
                setCertificateSummary(certificateSummary);

                // Mutual Fund Summary Calculation
                await loadLastPrice(mfSummaryData.map(item => item._id.name));
                // Calculate the overall totals for the summary row
                const totalOfAllMF = mfSummaryData.reduce((sum, item) => sum + item.totalValue, 0);
                const totalOfAllCoupons = mfSummaryData.reduce((sum, item) => sum + item.totalCouponValue, 0);
                const newTotal = totalOfAllMF - totalOfAllCoupons;
                // Calculate the current Selling value
                const totalSellingValue = mfSummaryData.reduce((sum, item) =>
                    sum + ((lastPriceData.find(f => f.name === item._id.name).lastPrice || 0) * item.currentUnits), 0
                );
                const totalProfit = safePercentage(totalSellingValue, newTotal);
                
                setOverallTotals({
                    totalOfAllMF,
                    totalOfAllCoupons,
                    newTotal,
                    totalSellingValue,
                    totalProfit
                });

                // Stocks
                let marketMap = {};
                if (stMarketData) {
                    marketMap = stMarketData.prices.reduce((acc, item) => {
                        if (item.code) {
                            acc[item.code] = item.value;
                        }
                        return acc;
                    }, {});
                    setStMarketPrices(marketMap);
                }
                loadSummaryData(stSummaryData, marketMap);

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

                    // bankAccountData
                    if (bankAccountData) {
                        setBankAccountData(bankAccountData);
                    }

                }

            } catch (err) {
                console.error("Failed to load global data:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [lastPriceData, openPosData, endPosData]); // Empty dependency array means this runs once

    // The value that will be available to all consuming components
    const value = {
        goldSummary,
        marketPrices,
        overallTotalPaid,
        goldtotalNow,
        certificates,
        certificateSummary,
        mfSummaryData,
        overallTotals,
        lastPriceData,
        stSummaryData,
        openPosData,
        endPosData,
        stMarketPrices,
        summaryMetrics,
        bankAccountData,
        isLoading,
        error,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
