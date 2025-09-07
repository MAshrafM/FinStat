// frontend/src/context/BankContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// Service
import { getLatestExpenditure } from '../services/expenditureService';
// 1. Create the Context
const BankContext = createContext();
// 2. Create a custom hook for easy consumption
export const useBankData = () => {
    return useContext(BankContext);
};

export const BankProvider = ({ children }) => {
    // Bank Account Data
    const [bankAccountData, setBankAccountData] = useState({}); // Bank account data if needed
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBankData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const bankAccountData = await getLatestExpenditure();
                setBankAccountData(bankAccountData);
            } catch (err) {
                console.error("Failed to load Bank data:", err);
                setError(err);
            } finally {
                // Small delay to simulate loading time
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };
        fetchBankData();
    }, []);

    const value = {bankAccountData, isLoading, error};

    return (
        <BankContext.Provider value={value}>
            {children}
        </BankContext.Provider>
    );

};