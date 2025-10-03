// frontend/src/context/MFContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Service
import { getMutualFundSummary, getLastPrice } from '../services/mutualFundService';
// Helpers
import { safePercentage } from '../utils/helper'; // Import any helper functions you need 
// 1. Create the Context
const MFContext = createContext();
// 2. Create a custom hook for easy consumption
export const useMFData = () => {
    return useContext(MFContext);
};
// 3. Create the Provider Component
export const MFProvider = ({ children }) => {
    const [mfSummaryData, setMfSummaryData] = useState([]);
    const [overallTotals, setOverallTotals] = useState({});
    const [lastPriceData, setLastPriceData] = useState(null);
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Recent Prices
    const loadLastPrice = useCallback(async (fundName) => {
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
    }, []);

    // Calculate totals to avoid code duplication
    const calculateTotals = useCallback(
        (summaryData, prices) => {
            if (!summaryData || !Array.isArray(summaryData) || !prices || !Array.isArray(prices)) {
                return { totalOfAllMF: 0, totalOfAllCoupons: 0, newTotal: 0, totalSellingValue: 0, totalProfit: 0 };
            }

            const totalOfAllMF = summaryData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
            const totalOfAllCoupons = summaryData.reduce((sum, item) => sum + (item.totalCouponValue || 0), 0);
            const newTotal = totalOfAllMF - totalOfAllCoupons;

            const totalSellingValue = summaryData.reduce((sum, item) => {
                const priceData = prices.find((f) => f && f.name === item._id.name);
                const lastPrice = priceData && priceData.lastPrice ? priceData.lastPrice : 0;
                const currentUnits = item.currentUnits || 0;
                return sum + lastPrice * currentUnits;
            }, 0);

            const totalProfit = safePercentage(totalSellingValue, newTotal);

            return {
                totalOfAllMF,
                totalOfAllCoupons,
                newTotal,
                totalSellingValue,
                totalProfit,
            };
        },
        []
    );

    // Referesh Last Prices
    const refreshLastPrices = useCallback(async () => {
        if (mfSummaryData && Array.isArray(mfSummaryData)) {
            const fundNames = mfSummaryData
                .filter(item => item && item._id && item._id.name)
                .map(item => item._id.name);
            
            const newPrices = await loadLastPrice(fundNames);
            
            // Recalculate totals with new prices
            if (newPrices && newPrices.length > 0) {
                const totals = calculateTotals(mfSummaryData, newPrices);
                setOverallTotals((prev) => ({
                    ...prev,
                    totalSellingValue: totals.totalSellingValue,
                    totalProfit: totals.totalProfit,
                }));
            }
        }
    }, [mfSummaryData, loadLastPrice, calculateTotals]);

    useEffect(() => {
        const fetchMFData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const mfSummaryData = await getMutualFundSummary();
                setMfSummaryData(mfSummaryData);
                let fundNames = [];
                if (mfSummaryData && Array.isArray(mfSummaryData)) {
                    fundNames = mfSummaryData
                        .filter(item => item && item._id && item._id.name)
                        .map(item => item._id.name);
                }
                const lastPrices = await loadLastPrice(fundNames);

                // Mutual Fund Summary Calculation
                //const totals = calculateTotals(mfSummaryData, lastPrices);
                //setOverallTotals(totals);
            } catch (err) {
                console.error("Failed to load MF data:", err);
                setError(err);
            } finally {
                // Small delay to simulate loading time
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };

        fetchMFData();
    }, [loadLastPrice, calculateTotals]);

    useEffect(() => {
         if (lastPriceData && lastPriceData.length > 0 && mfSummaryData && mfSummaryData.length > 0) {   
            const totals = calculateTotals(mfSummaryData, lastPriceData);
            setOverallTotals((prev) => ({
                ...prev,
                totalSellingValue: totals.totalSellingValue,
                totalProfit: totals.totalProfit,
            }));
        }
    }, [lastPriceData, mfSummaryData, calculateTotals]); // Empty dependency array means this runs once

    const value = {
        mfSummaryData,
        overallTotals,
        lastPriceData,
        isLoading,
        error,
        refreshLastPrices
    };

    return (
        <MFContext.Provider value={value}>
            {children}
        </MFContext.Provider>
    );
}