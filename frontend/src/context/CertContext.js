// frontend/src/context/CertContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Service
import { getCertificates } from '../services/certificateService';
// 1. Create the Context
const CertContext = createContext();
// 2. Create a custom hook for easy consumption
export const useCertData = () => {
    return useContext(CertContext);
};

export const CertProvider = ({ children }) => {
    // Certificates
    const [certificates, setCertificates] = useState([]);
    const [certificateSummary, setCertificateSummary] = useState({
        activeCertificates: 0,
        totalActiveAmount: 0,
        expiredCertificates: 0,
        futureCertificates: 0,
        totalExpectedReturns: 0,
        totalCertificates: 0
    });
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const calculateProgress = (startDate, period) => {
        if (!startDate || !period) {
            return { progress: 0, isExpired: false, isActive: false, daysRemaining: 0 };
        }
        const start = new Date(startDate);
        const now = new Date();
        const numPeriod = Number(period) || 0;
        const maturity = new Date(start);
        maturity.setMonth(maturity.getMonth() + numPeriod);

        const totalDuration = maturity.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();

        const progress = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;
        const isExpired = now > maturity;
        const isActive = now >= start && now <= maturity;
        const daysRemaining = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));

        return { progress, isExpired, isActive, daysRemaining };
    };

    // Certificate Summary Calculation
    const calculateSummary = useCallback((certList) => {
        let activeCertificates = 0;
        let totalActiveAmount = 0;
        let expiredCertificates = 0;
        let futureCertificates = 0;
        let totalExpectedReturns = 0;

        if (!Array.isArray(certList)) {
            return {
                activeCertificates: 0,
                totalActiveAmount: 0,
                expiredCertificates: 0,
                futureCertificates: 0,
                totalExpectedReturns: 0,
                totalCertificates: 0
            };
        }

        certList.forEach(cert => {
            if (!cert) return;
            const amount = Number(cert.amount) || 0;
            const interest = Number(cert.interest) || 0;
            const period = Number(cert.period) || 0;

            const { isExpired, isActive } = calculateProgress(cert.startDate, period);
            const years = period / 12;
            const totalReturn = amount * (1 + (interest / 100) * years);

            if (isActive) {
                activeCertificates++;
                totalActiveAmount += amount;
                totalExpectedReturns += totalReturn;
            } else if (isExpired) {
                expiredCertificates++;
            } else {
                futureCertificates++;
            }
        });

        return {
            activeCertificates,
            totalActiveAmount,
            expiredCertificates,
            futureCertificates,
            totalExpectedReturns,
            totalCertificates: certList.length
        };
    }, []);

    const fetchCertData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const certificatesData = await getCertificates();
            const safeList = Array.isArray(certificatesData) ? certificatesData : (Array.isArray(certificatesData?.data) ? certificatesData.data : []);
            setCertificates(safeList);
            const summary = calculateSummary(safeList);
            setCertificateSummary(summary);
        } catch (err) {
            console.error("Failed to load Certificate data:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [calculateSummary]);

    useEffect(() => {
        fetchCertData();
    }, [fetchCertData]);

    const value = {
        certificates,
        certificateSummary,
        calculateProgress,
        refreshCertificates: fetchCertData,
        isLoading,
        error
    };

    return (
        <CertContext.Provider value={value}>
            {children}
        </CertContext.Provider>
    );
};