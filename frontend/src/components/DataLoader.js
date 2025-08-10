import React from 'react';
import { useData } from '../context/DataContext';

const DataLoader = ({ children }) => {
    const { isLoading, loadingProgress, error } = useData();

    const styles = {
        container: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
            padding: '20px'
        },
        errorContainer: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            padding: '20px'
        },
        card: {
            textAlign: 'center',
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '400px',
            width: '100%',
            margin: '0 16px'
        },
        errorCard: {
            textAlign: 'center',
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '100%',
            margin: '0 16px'
        },
        progressContainer: {
            position: 'relative',
            width: '128px',
            height: '128px',
            margin: '0 auto 24px auto'
        },
        progressSvg: {
            width: '128px',
            height: '128px',
            transform: 'rotate(-90deg)'
        },
        progressText: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#374151'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
        },
        errorTitle: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
        },
        message: {
            color: '#6b7280',
            marginBottom: '16px',
            fontSize: '16px'
        },
        errorMessage: {
            color: '#6b7280',
            marginBottom: '16px',
            fontSize: '16px'
        },
        progressBar: {
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            marginBottom: '16px',
            overflow: 'hidden'
        },
        progressFill: {
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '4px',
            transition: 'width 0.5s ease-out',
            width: `${loadingProgress}%`
        },
        dotsContainer: {
            display: 'flex',
            justifyContent: 'center',
            gap: '4px'
        },
        dot: {
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite ease-in-out both'
        },
        retryButton: {
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
        },
        errorIcon: {
            fontSize: '60px',
            marginBottom: '16px'
        }
    };

    // Add keyframe animation for bouncing dots
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounce {
                0%, 80%, 100% {
                    transform: scale(0);
                }
                40% {
                    transform: scale(1.0);
                }
            }
            
            .dot-1 { animation-delay: -0.32s; }
            .dot-2 { animation-delay: -0.16s; }
            .dot-3 { animation-delay: 0s; }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>⚠️</div>
                    <h2 style={styles.errorTitle}>Error Loading Data</h2>
                    <p style={styles.errorMessage}>
                        {error.message || 'An unexpected error occurred while loading your data.'}
                    </p>
                    <button 
                        style={styles.retryButton}
                        onClick={() => window.location.reload()}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        const circumference = 2 * Math.PI * 40;
        const strokeDashoffset = circumference - (loadingProgress / 100) * circumference;

        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    {/* Circular Progress */}
                    <div style={styles.progressContainer}>
                        <svg style={styles.progressSvg} viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                                fill="transparent"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="#3b82f6"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{
                                    transition: 'stroke-dashoffset 0.5s ease-out'
                                }}
                            />
                        </svg>
                        <div style={styles.progressText}>
                            {Math.round(loadingProgress)}%
                        </div>
                    </div>

                    {/* Loading text */}
                    <h2 style={styles.title}>Loading Your Portfolio</h2>
                    <p style={styles.message}>
                        {getLoadingMessage(loadingProgress)}
                    </p>

                    {/* Progress bar */}
                    <div style={styles.progressBar}>
                        <div style={styles.progressFill}></div>
                    </div>

                    {/* Animated dots */}
                    <div style={styles.dotsContainer}>
                        <div style={{...styles.dot}} className="dot-1"></div>
                        <div style={{...styles.dot}} className="dot-2"></div>
                        <div style={{...styles.dot}} className="dot-3"></div>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

// Helper function to show contextual loading messages
const getLoadingMessage = (progress) => {
    if (progress < 20) return "Connecting to data sources...";
    if (progress < 40) return "Fetching portfolio data...";
    if (progress < 60) return "Processing gold investments...";
    if (progress < 70) return "Calculating certificate returns...";
    if (progress < 80) return "Loading mutual fund prices...";
    if (progress < 90) return "Analyzing stock positions...";
    if (progress < 100) return "Finalizing calculations...";
    return "Almost ready!";
};

export default DataLoader;