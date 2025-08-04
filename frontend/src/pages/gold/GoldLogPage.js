// frontend/src/pages/gold/GoldLogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGoldLogs, deleteGoldLog } from '../../services/goldService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import '../trades/Trades.css'; // Reuse styles

const GoldLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        getGoldLogs(currentPage).then(data => {
            setLogs(data.data);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
        }).catch(err => console.error("Failed to load gold logs:", err));
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this log?')) {
            await deleteGoldLog(id);
            getGoldLogs(currentPage).then(data => setLogs(data.data));
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gold Wallet Log</h1>
                <Link to="/gold-wallet/new" className="action-button">Add New Log</Link>
            </div>
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Item</th>
                            <th>Weight (g)</th>
                            <th>Price/g</th>
                            <th>Price</th>
                            <th>Paid</th>
                            <th>Taxes/Fees</th>
                            <th>Cost/g</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => {
                            const totalPrice = log.weight * log.price;
                            const taxes = log.paid - totalPrice;
                            const feesPerGram = taxes / log.weight;
                            return (
                                <tr key={log._id}>
                                    <td>{formatDate(log.date)}</td>
                                    <td>
                                        <p style={{ fontWeight: 'bold' }}>{log.item}</p>
                                        <p className="broker">{log.karat}K - by {log.seller || 'N/A'}</p>
                                    </td>
                                    <td>{log.weight.toFixed(2)}g</td>
                                    <td>{formatCurrency(log.price)}</td>
                                    <td>{formatCurrency(totalPrice)}</td>
                                    <td className="total-value">{formatCurrency(log.paid)}</td>
                                    <td>{formatCurrency(taxes)}</td>
                                    <td>{formatCurrency(feesPerGram)}</td>
                                    <td className="action-icons">
                                        <Link className="action-icon edit-icon" to={`/gold-wallet/edit/${log._id}`}><FaEdit /></Link>
                                        <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(log._id)} style={{ cursor: 'pointer', color: '#c0392b' }} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
};
export default GoldLogPage;
