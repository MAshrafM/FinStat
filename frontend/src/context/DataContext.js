// frontend/src/context/DataContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Import all the service functions we'll need
//import { getTradeSummary } from '../services/tradeService';
import { getGoldSummary, getGoldPrice } from '../services/goldService';
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
    const [goldSummary, setGoldSummary] = useState([]);
    const [marketPrices, setMarketPrices] = useState({});
    const [overallTotalPaid, setOverallTotalPaid] = useState(0);
    const [goldtotalNow, setGoldTotalNow] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effect to fetch all data when the provider mounts
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Use Promise.all to fetch everything concurrently for performance
                const [
                    goldSummaryData,
                    marketPricesData,
                ] = await Promise.all([
                    getGoldSummary(),
                    getGoldPrice(),
                    // ... add other fetch calls here
                ]);

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
                console.error("Failed to load global data:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []); // Empty dependency array means this runs once

    // The value that will be available to all consuming components
    const value = {
        goldSummary,
        marketPrices,
        overallTotalPaid,
        goldtotalNow,
        isLoading,
        error,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
