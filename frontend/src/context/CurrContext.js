// frontend/src/context/CertContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// Service
import { getCurrency, getCurrencySummary, getCurrencyPrice } from '../services/currencyService'; // Import currency service functions
// 1. Create the Context
const CurrContext = createContext();
// 2. Create a custom hook for easy consumption
export const useCurrData = () => {
    return useContext(CurrContext);
};

const currencyMap ={
    'Dollar': 'USD',
    'Euro': 'EUR',
    'Pound': 'GBP',
    'Yen': 'JPY',
    'Riyal': 'SAR',
}

export const CurrProvider = ({ children }) => {
    // Currency
    const [currency, setCurrency] = useState([]); // Store currency data in state
    const [currencySummary, setCurrencySummary] = useState([]); // Store currency summary if needed
    const [currencyPrice, setCurrencyPrice] = useState({}); // Store currency price if needed
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // Use Promise.all to fetch everything concurrently for performance
                const [currency, currencySummary, currencyPrice] = await Promise.all([getCurrency(), // Fetch currency data 
                                    getCurrencySummary(), // Fetch currency summary
                                    getCurrencyPrice() // Fetch currency price
                ]);
                setCurrency(currency); // Set currency data in state
                setCurrencyPrice(currencyPrice); // Set currency price in state

                if(currencySummary && currencyPrice && currencyPrice.length > 0) {
                    currencySummary.forEach((curr) => {
                        let currencyCode = currencyMap[curr._id]; // Fallback to name if not found
                        let price = currencyPrice.find((p) => p.currencyID === currencyCode);
                        if (price) {
                            curr.currentPrice = price.sellRate;
                        }
                    })
                }

                setCurrencySummary(currencySummary); // Set currency summary in state
            } catch (err) {
                console.error("Failed to load Currency data:", err);
                setError(err);
            } finally {
                // Small delay to simulate loading time
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };

        fetchCurrData();
    }, []);

    const value = {
        currency,
        currencySummary,
        currencyPrice,
        isLoading,
        error
    };

    return (
        <CurrContext.Provider value={value}>
            {children}
        </CurrContext.Provider>
    );
};