// frontend/src/context/GoldContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// Service
import { getGoldSummary, getGoldPrice } from '../services/goldService';

// 1. Create the Context
const GoldContext = createContext();
// 2. Create a custom hook for easy consumption
export const useGoldData = () => {
    return useContext(GoldContext);
};

// 3. Create the Provider Component
export const GoldProvider = ({ children }) => {
    // Gold
    const [goldSummary, setGoldSummary] = useState([]);
    const [marketPrices, setMarketPrices] = useState({});
    const [overallTotalPaid, setOverallTotalPaid] = useState(0);
    const [goldtotalNow, setGoldTotalNow] = useState(0);
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGoldData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [goldSummaryData,marketPricesData] = await Promise.all([getGoldSummary(), getGoldPrice()]);
                setGoldSummary(goldSummaryData);
                setMarketPrices(marketPricesData);
                let totalP = goldSummaryData.reduce((sum, item) => sum + item.totalPaid, 0);
                setOverallTotalPaid(totalP);

                const totalNow = goldSummaryData.reduce((previous, item) => {
                    const karat = item._id;
                    const currentPricePerGram = marketPricesData[karat] || 0;
                    const currentValue = item.totalWeight * currentPricePerGram;
                    return previous + currentValue;
                }, 0);
                setGoldTotalNow(totalNow);
            } catch (err) {
                console.error("Failed to load Gold data:", err);
                setError(err);
            } finally {
                // Small delay to simulate loading time
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        }
        fetchGoldData();
    }, []);

    const value = {
        goldSummary,
        marketPrices,
        overallTotalPaid,
        goldtotalNow,
        isLoading,
        error,
    }

    return (
        <GoldContext.Provider value={value}>
            {children}
        </GoldContext.Provider>
    )
}
