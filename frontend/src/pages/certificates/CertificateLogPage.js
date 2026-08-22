// frontend/src/pages/certificates/CertificateLogPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { deleteCertificate } from '../../services/certificateService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useCertData } from '../../context/CertContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import '../trades/Trades.css'; // Reuse styles

const CertificateLogPage = () => {
    // Use the global data context
    const { certificates = [], certificateSummary = {}, isLoading, calculateProgress, refreshCertificates } = useCertData();

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this certificate?')) {
            try {
                await deleteCertificate(id);
                if (typeof refreshCertificates === 'function') {
                    refreshCertificates();
                }
            } catch (err) {
                console.error("Failed to delete certificate:", err);
            }
        }
    };

    const ProgressBar = ({ progress, isExpired, daysRemaining, isActive }) => {
        let progressColor = '#4CAF50'; // Green for healthy
        let status = 'Active';

        if (isExpired) {
            progressColor = '#f44336'; // Red for expired
            status = 'Expired';
        } else if (!isActive) {
            progressColor = '#9e9e9e'; // Gray for future
            status = 'Future';
        } else if (progress > 80) {
            progressColor = '#ff9800'; // Orange for near maturity
            status = 'Near Maturity';
        }

        return (
            <div style={{ minWidth: '120px' }}>
                <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '4px'
                }}>
                    <div style={{
                        width: `${Math.max(0, Math.min(100, progress || 0))}%`,
                        height: '100%',
                        backgroundColor: progressColor,
                        transition: 'width 0.3s ease'
                    }} />
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center'
                }}>
                    {isExpired ? (
                        <span style={{ color: '#f44336', fontWeight: 'bold' }}>
                            Expired
                        </span>
                    ) : !isActive ? (
                    <span style={{ color: '#9e9e9e', fontWeight: 'bold' }}>
                        Future
                    </span>) :(
                        <span>
                            {daysRemaining || 0} days left
                        </span>
                    )}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: progressColor,
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {status}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return <p className="page-container">Loading Certificates...</p>;
    }

    const safeCertList = Array.isArray(certificates) ? certificates : [];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Bank Certificates</h1>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>Portfolio Summary</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', opacity: '0.9' }}>Active Certificates</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                            {certificateSummary.activeCertificates || 0}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            out of {certificateSummary.totalCertificates || safeCertList.length} total
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', opacity: '0.9' }}>Active Investment</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                            {formatCurrency(certificateSummary.totalActiveAmount || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            currently invested
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', opacity: '0.9' }}>Expected Returns</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                            {formatCurrency(certificateSummary.totalExpectedReturns || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            from active certificates
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', opacity: '0.9' }}>Portfolio Status</div>
                        <div style={{ fontSize: '14px', margin: '5px 0' }}>
                            <div style={{ color: '#4CAF50' }}>✓ {certificateSummary.activeCertificates || 0} Active</div>
                            <div style={{ color: '#ff9800' }}>⏳ {certificateSummary.futureCertificates || 0} Future</div>
                            <div style={{ color: '#f44336' }}>✗ {certificateSummary.expiredCertificates || 0} Expired</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Principal Amount</th>
                            <th>Interest Rate</th>
                            <th>Period</th>
                            <th>Progress</th>
                            <th>Maturity Date</th>
                            <th>Total Return</th>
                            <th>Total Interest</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeCertList.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No bank certificates found. Click <strong>Add Certificate</strong> above to get started.
                                </td>
                            </tr>
                        ) : (
                            safeCertList.map(cert => {
                                const amount = Number(cert.amount) || 0;
                                const interestRate = Number(cert.interest) || 0;
                                const period = Number(cert.period) || 0;
                                const years = period / 12;
                                const totalReturn = amount * (1 + (interestRate / 100) * years);
                                const interestAmount = (amount * interestRate / 100) * years;
                                const maturityDate = cert.startDate ? new Date(cert.startDate) : null;
                                if (maturityDate) {
                                    maturityDate.setMonth(maturityDate.getMonth() + period);
                                }

                                const progressData = calculateProgress ? calculateProgress(cert.startDate, period) : { progress: 0, isExpired: false, isActive: false, daysRemaining: 0 };
                                const { progress, isExpired, isActive, daysRemaining } = progressData;

                                return (
                                    <tr key={cert._id} style={{backgroundColor: isExpired ? '#ffebee' : 'transparent'}}>
                                        <td style={{ fontWeight: 'bold' }} data-label="Name">{cert.name || 'Unnamed'}</td>
                                        <td className="total-value" data-label="Amount">{formatCurrency(amount)}</td>
                                        <td data-label="Interest">{interestRate.toFixed(2)}%</td>
                                        <td data-label="Period">{period} months</td>
                                        <td data-label="Progress">
                                            <ProgressBar
                                                progress={progress}
                                                isExpired={isExpired}
                                                isActive={isActive}
                                                daysRemaining={daysRemaining}
                                            />
                                        </td>
                                        <td style={{
                                            color: isExpired ? '#f44336' : 'inherit',
                                            fontWeight: isExpired ? 'bold' : 'normal'
                                        }} data-label="Maturity Date">
                                            {maturityDate ? formatDate(maturityDate) : '-'}
                                        </td>
                                        <td data-label="Return">{formatCurrency(totalReturn)}</td>
                                        <td data-label="Total Interest">{formatCurrency(interestAmount)}</td>
                                        <td className="action-icons" data-label="Actions">
                                            <Link className="action-icon edit-icon" to={`/certificates/edit/${cert._id}`}><FaEdit /></Link>
                                            <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(cert._id)} style={{ cursor: 'pointer', color: '#c0392b' }} />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default CertificateLogPage;
