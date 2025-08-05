// frontend/src/pages/certificates/CertificateLogPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { deleteCertificate } from '../../services/certificateService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useData } from '../../context/DataContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import '../trades/Trades.css'; // Reuse styles

const CertificateLogPage = () => {
    // Use the global data context
    const { certificates } = useData(); // Access any global data if needed

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this certificate?')) {
            await deleteCertificate(id);
        }
    };

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

    const calculateSummary = () => {
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

    const summary = calculateSummary();

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
                        width: `${progress}%`,
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
                            {daysRemaining} days left
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


    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Bank Certificates</h1>
                <Link to="/certificates/new" className="action-button">Add New Certificate</Link>
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
                            {summary.activeCertificates}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            out of {summary.totalCertificates} total
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
                            {formatCurrency(summary.totalActiveAmount)}
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
                            {formatCurrency(summary.totalExpectedReturns)}
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
                            <div style={{ color: '#4CAF50' }}>✓ {summary.activeCertificates} Active</div>
                            <div style={{ color: '#ff9800' }}>⏳ {summary.futureCertificates} Future</div>
                            <div style={{ color: '#f44336' }}>✗ {summary.expiredCertificates} Expired</div>
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
                            <th>total interest</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.map(cert => {
                            const years = cert.period / 12;
                            const totalReturn = cert.amount * (1 + (cert.interest / 100) * years);
                            const interest = (cert.amount * cert.interest / 100) * years;
                            const maturityDate = new Date(cert.startDate);
                            maturityDate.setMonth(maturityDate.getMonth() + cert.period);

                            const { progress, isExpired, isActive, daysRemaining } = calculateProgress(cert.startDate, cert.period);

                            return (
                                <tr key={cert._id} style={{backgroundColor: isExpired ? '#ffebee' : 'transparent'}}>
                                    <td style={{ fontWeight: 'bold' }}>{cert.name}</td>
                                    <td className="total-value">{formatCurrency(cert.amount)}</td>
                                    <td>{cert.interest.toFixed(2)}%</td>
                                    <td>{cert.period} months</td>
                                    <td>
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
                                    }}>
                                        {formatDate(maturityDate)}
                                    </td>
                                    <td>{formatCurrency(totalReturn)}</td>
                                    <td>{formatCurrency(interest)}</td>
                                    <td className="action-icons">
                                        <Link className="action-icon edit-icon" to={`/certificates/edit/${cert._id}`}><FaEdit /></Link>
                                        <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(cert._id)} style={{ cursor: 'pointer', color: '#c0392b' }} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default CertificateLogPage;
