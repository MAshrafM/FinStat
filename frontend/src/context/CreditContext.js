// frontend/src/context/BankContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// Service
import { getOverallSummary } from '../services/creditCardService'; // Import credit card service functions
// 1. Create the Context
const CreditContext = createContext();
// 2. Create a custom hook for easy consumption
export const useCreditData = () => {
    return useContext(CreditContext);
};

export const CreditProvider = ({ children }) => {

    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Credit Cards
    const [creditCardsSummary, setCreditCardsSummary] = useState([]); // Store credit card data in state

    useEffect(() => {
        const fetchCreditData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const creditCardsSummary = await getOverallSummary();
                setCreditCardsSummary(creditCardsSummary);
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

        fetchCreditData();
    }, []);

    const value = { creditCardsSummary, isLoading, error};

    return (
        <CreditContext.Provider value={value}>
            {children}
        </CreditContext.Provider>
    );

};