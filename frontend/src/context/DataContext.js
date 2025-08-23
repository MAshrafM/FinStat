// frontend/src/context/DataContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Import all the service functions we'll need
import { getGoldSummary, getGoldPrice } from '../services/goldService';
import { getCertificates } from '../services/certificateService';
import { getMutualFundSummary, getLastPrice } from '../services/mutualFundService';
import { getAllTrades, getTradeSummary, getMarketData } from '../services/tradeService';
import { getLatestExpenditure } from '../services/expenditureService';
import { safeDivision, safePercentage } from '../utils/helper'; // Import any helper functions you need 
import { getCurrency, getCurrencySummary, getCurrencyPrice } from '../services/currencyService'; // Import currency service functions
import { getOverallSummary } from '../services/creditCardService'; // Import credit card service functions
// ... import other services as needed (mutual funds, certificates, etc.)

// 1. Create the Context
const DataContext = createContext();

// 2. Create a custom hook for easy consumption
export const useData = () => {
    return useContext(DataContext);
};

const currencyMap ={
    'Dollar': 'USD',
    'Euro': 'EUR',
    'Pound': 'GBP',
    'Yen': 'JPY',
    'Riyal': 'SAR',
}

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
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
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
    const [tradesData, setTradesData] = useState([]); // Store trades data in state
    // Currency
    const [currency, setCurrency] = useState([]); // Store currency data in state
    const [currencySummary, setCurrencySummary] = useState({}); // Store currency summary if needed
    const [currencyPrice, setCurrencyPrice] = useState({}); // Store currency price if needed

    // Bank Account Data
    const [bankAccountData, setBankAccountData] = useState({}); // Bank account data if needed
    // Credit Cards
    const [creditCardsSummary, setCreditCardsSummary] = useState([]); // Store credit card data in state
    // Responsive 
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    // Margin profit percentage for stocks
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
        if (!fundName || fundName.length === 0) {
            return [];
        }
        try {
            const lastprices = await Promise.all(fundName.map( async (name) => {
                if (!name) {
                    console.warn("Empty fund name provided, skipping...");
                    return { name: name || 'unknown' , lastPrice: 0 }; // Default to 0 if no name provided
                }

                try {
                    const data = await getLastPrice(name);
                    if (!data || !data.rows || !Array.isArray(data.rows)) {
                        console.warn(`No data found for fund: ${name}`);
                        return { name, lastPrice: 0 }; // Default to 0 if no data found
                    }

                    let fName = data.rows.find(f => f.name === name);
                    if (!fName) {
                        console.warn(`No data found for fund: ${name}`);
                        return { name, lastPrice: 0 }; // Default to 0 if no data found
                    }
                    return { name, lastPrice: fName.price || 0 }; // Default to 0 if no price found
                } catch (error) {
                    console.error(`Error fetching last price for ${name}:`, error);
                    return { name, lastPrice: 0 }; // Default to 0 if error occurs
                }
            }));
            setLastPriceData(lastprices);
            return lastprices;
        } catch (error) {
            console.error("Error loading last prices:", error);
            setLastPriceData([]);
            return [];
        }
    };

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

    // Function to refresh last prices (can be called from components)
    const refreshLastPrices = async () => {
        if (mfSummaryData && Array.isArray(mfSummaryData)) {
            const fundNames = mfSummaryData
                .filter(item => item && item._id && item._id.name)
                .map(item => item._id.name);
            
            const newPrices = await loadLastPrice(fundNames);
            
            // Recalculate totals with new prices
            if (newPrices && newPrices.length > 0) {
                const totalOfAllMF = mfSummaryData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
                const totalOfAllCoupons = mfSummaryData.reduce((sum, item) => sum + (item.totalCouponValue || 0), 0);
                const newTotal = totalOfAllMF - totalOfAllCoupons;
                
                const totalSellingValue = mfSummaryData.reduce((sum, item) => {
                    const priceData = newPrices.find(f => f && f.name === item._id.name);
                    const lastPrice = (priceData && priceData.lastPrice) ? priceData.lastPrice : 0;
                    const currentUnits = item.currentUnits || 0;
                    return sum + (lastPrice * currentUnits);
                }, 0);
                
                const totalProfit = safePercentage(totalSellingValue, newTotal);
                setOverallTotals(prev => ({
                    ...prev,
                    totalSellingValue,
                    totalProfit
                }));
                
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
                    goldSummaryData,
                    marketPricesData,
                    certificatesData,
                    mfSummaryData,
                    stSummaryData,
                    stMarketData,
                    trades,
                    bankAccountData,
                    currency,
                    currencySummary,
                    currencyPrice,
                    creditCardsSummary,
                ] = await Promise.all([
                    getGoldSummary(),
                    getGoldPrice(),
                    getCertificates(),
                    getMutualFundSummary(),
                    getTradeSummary(),
                    getMarketData(),
                    getAllTrades(),
                    getLatestExpenditure(),
                    getCurrency(), // Fetch currency data 
                    getCurrencySummary(), // Fetch currency summary
                    getCurrencyPrice(), // Fetch currency price
                    getOverallSummary(), // Fetch credit card summary
                    // ... add other fetch calls here
                ]);
                setLoadingProgress(30); // Update loading progress

                setGoldSummary(goldSummaryData);
                setMarketPrices(marketPricesData);
                setCertificates(certificatesData);
                setMfSummaryData(mfSummaryData);
                setStSummaryData(stSummaryData);
                setBankAccountData(bankAccountData);
                setTradesData(trades);
                setCurrency(currency); // Set currency data in state
                setCurrencyPrice(currencyPrice); // Set currency price in state
                setCreditCardsSummary(creditCardsSummary); // Set credit card summary in state
                setLoadingProgress(50); // Update loading progress

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

                setLoadingProgress(60); // Update loading progress

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

                setLoadingProgress(70); // Update loading progress

                let fundNames = [];
                if (mfSummaryData && Array.isArray(mfSummaryData)) {
                    fundNames = mfSummaryData
                        .filter(item => item && item._id && item._id.name)
                        .map(item => item._id.name);
                }
                const lastPrices = await loadLastPrice(fundNames);

                setLoadingProgress(80); // Update loading progress

                // Mutual Fund Summary Calculation
                const totalOfAllMF = mfSummaryData.reduce((sum, item) => sum + item.totalValue, 0);
                const totalOfAllCoupons = mfSummaryData.reduce((sum, item) => sum + item.totalCouponValue, 0);
                const newTotal = totalOfAllMF - totalOfAllCoupons;
                // Calculate the current Selling value
                const totalSellingValue = mfSummaryData.reduce((sum, item) => {
                    if(!Array.isArray(lastPriceData) || lastPrices.length === 0) {
                        return sum;
                    }
                    const priceData = lastPriceData.find(f => f.name === item._id.name);
                    const lastPrice = priceData ? priceData.lastPrice : 0;
                    return sum + (item.currentUnits * lastPrice);
                }, 0);
                const totalProfit = safePercentage(totalSellingValue, newTotal);
                
                setOverallTotals({
                    totalOfAllMF,
                    totalOfAllCoupons,
                    newTotal,
                    totalSellingValue,
                    totalProfit
                });

                setLoadingProgress(90); // Update loading progress
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

                if(currencySummary && currencyPrice && currencyPrice.length > 0) {
                    currencySummary.map((curr) => {
                        let currencyCode = currencyMap[curr._id]; // Fallback to name if not found
                        let price = currencyPrice.find((p) => p.currencyID === currencyCode);
                        if (price) {
                            curr.currentPrice = price.sellRate;
                        }
            
                    })
                }

                setCurrencySummary(currencySummary); // Set currency summary in state


                
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

    // Effect to calculate overall totals for mutual funds
    useEffect(() => {
if (lastPriceData && lastPriceData.length > 0 && mfSummaryData && mfSummaryData.length > 0) {
            
            const totalOfAllMF = mfSummaryData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
            const totalOfAllCoupons = mfSummaryData.reduce((sum, item) => sum + (item.totalCouponValue || 0), 0);
            const newTotal = totalOfAllMF - totalOfAllCoupons;
            
            const totalSellingValue = mfSummaryData.reduce((sum, item) => {
                const priceData = lastPriceData.find(f => f && f.name === item._id.name);
                const lastPrice = (priceData && priceData.lastPrice) ? priceData.lastPrice : 0;
                const currentUnits = item.currentUnits || 0;
                              
                return sum + (lastPrice * currentUnits);
            }, 0);
            
            const totalProfit = safePercentage(totalSellingValue, newTotal);
            
            setOverallTotals(prev => ({
                ...prev,
                totalSellingValue,
                totalProfit
            }));
            
        }
    }, [lastPriceData, mfSummaryData]); // Empty dependency array means this runs once
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
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
        tradesData,
        currency,
        currencySummary,
        currencyPrice,
        creditCardsSummary,
        isLoading,
        isMobile,
        error,
        loadingProgress, // Added progress for more detailed loading feedback
        refreshLastPrices, // Add refresh function to context
        refreshStockData, // Add stock refresh function to context
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
