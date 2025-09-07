// frontend/src/context/CertContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// Service
import { getCertificates } from '../services/certificateService';
import Summary from '../pages/DashboardSummary';
// 1. Create the Context
const CertContext = createContext();
// 2. Create a custom hook for easy consumption
export const useCertData = () => {
    return useContext(CertContext);
};

export const CertProvider = ({ children }) => {
    // Certificates
    const [certificates, setCertificates] = useState([]);
    const [certificateSummary, setCertificateSummary] = useState({});
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);


    const calculateProgress = (startDate, period) => {
        const start = new Date(startDate);
        const now = new Date();
        const maturity = new Date(start);
        maturity.setMonth(maturity.getMonth() + period);

        const totalDuration = maturity.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();

        const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
        const isExpired = now > maturity;
        const isActive = now >= start && now <= maturity;
        const daysRemaining = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));

        return { progress, isExpired, isActive, daysRemaining };
    };

    // Certificate Summary Calculation
    const calculateSummary = (certificates) => {
        let activeCertificates = 0;
        let totalActiveAmount = 0;
        let expiredCertificates = 0;
        let futureCertificates = 0;
        let totalExpectedReturns = 0;

        certificates.forEach(cert => {
            const { isExpired, isActive } = calculateProgress(cert.startDate, cert.period);
            const years = cert.period / 12;
            const totalReturn = cert.amount * (1 + (cert.interest / 100) * years);

            if (isActive) {
                activeCertificates++;
                totalActiveAmount += cert.amount;
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
            totalCertificates: certificates.length
        };
    };

    useEffect(() => {
        const fetchCertData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const certificatesData = await getCertificates();
                setCertificates(certificatesData);
                let summary = calculateSummary(certificatesData);
                setCertificateSummary(summary);

            } catch (err) {
                console.error("Failed to load Certificate data:", err);
                setError(err);
            } finally {
                // Small delay to simulate loading time
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };

        fetchCertData();
    },[]);

    const value = {
        certificates,
        certificateSummary,
        calculateProgress,
        isLoading,
        error
    }

    return (
        <CertContext.Provider value={value}>
            {children}
        </CertContext.Provider>
    );
};