// frontend/src/pages/certificates/CertificateLogPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { deleteCurrency } from '../../services/currencyService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useCurrData } from '../../context/CurrContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import '../trades/Trades.css'; // Reuse styles
import '../../components/SummaryRow.css'; // Reuse styles


const CurrencyLogPage = () => {
    // Use the global data context
    const { currency, currencySummary, isLoading } = useCurrData(); // Access any global data if needed


    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this certificate?')) {
            await deleteCurrency(id);
        }
    };

    if (isLoading) {
        return <p className="page-container">Loading Foreign Currency...</p>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Foreign Cuurency</h1>
            </div>         
                {currencySummary && currencySummary.length > 0 && (
                    currencySummary.map((curr) => (
                    <div className="summary-row" key={curr._id}>
                        <div className="summary-item highlight">
                            <span>{curr._id}</span>
                        </div>
                        <div className="summary-item">
                            <span>Total Amount: <strong>{formatCurrency(curr.totalAmount)}</strong></span>
                        </div>
                        <div className="summary-item">
                            <span>Total Paid:  <strong>{formatCurrency(curr.totalPrice)}</strong></span>
                        </div>
                        <div className="summary-item">
                            <span>Current Price:  <strong>{formatCurrency(curr.currentPrice)}</strong></span>
                        </div>
                        <div className="summary-item">
                            <span>Current Value:  <strong>{formatCurrency(curr.currentPrice * curr.totalAmount)}</strong></span>
                        </div>
                    </div>
                    ))
                )}


            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Amount</th>
                            <th>Price</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currency.map(curr => {
                            return (
                                <tr key={curr._id}>
                                    <td style={{ fontWeight: 'bold' }} data-label="Name">{curr.name}</td>
                                    <td className="total-value" data-label="Amount">{formatCurrency(curr.amount)}</td>
                                    <td data-label="Price">{formatCurrency(curr.price)}</td>
                                    <td data-label="Date">{formatDate(curr.date)}</td>
                                    <td className="action-icons" data-label="Actions">
                                        <Link className="action-icon edit-icon" to={`/currency/edit/${curr._id}`}><FaEdit /></Link>
                                        <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(curr._id)} style={{ cursor: 'pointer', color: '#c0392b' }} />
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
export default CurrencyLogPage;
