// frontend/src/pages/mutual-funds/MutualFundLogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMutualFundTrades, deleteTrade } from '../../services/mutualFundService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import '../trades/Trades.css'; // Reuse the same CSS as the stock trades page

const MutualFundLogPage = () => {
    const [trades, setTrades] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadTrades = (page) => {
        getMutualFundTrades(page)
            .then(data => {
                setTrades(data.data);
                setTotalPages(data.totalPages);
                setCurrentPage(data.currentPage);
            })
            .catch(err => console.error("Failed to load mutual fund trades:", err));
    };

    useEffect(() => {
        loadTrades(currentPage);
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await deleteTrade(id);
                loadTrades(currentPage); // Refresh the list
            } catch (err) {
                console.error("Failed to delete transaction:", err);
                alert('Failed to delete transaction.');
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Mutual Fund Log</h1>
                <Link to="/mutual-funds/new" className="action-button">Add New Transaction</Link>
            </div>

            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Name / Code</th>
                            <th>Type</th>
                            <th>Units</th>
                            <th>Price</th>
                            <th>Fees</th>
                            <th>Total Value</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map(trade => (
                            <tr key={trade._id}>
                                <td>{formatDate(trade.date)}</td>
                                <td>
                                    <p style={{ fontWeight: 'bold' }}>{trade.code}</p>
                                    <p className="broker">{trade.name}</p>
                                </td>
                                <td className={`trade-type-${trade.type.toLowerCase()}`}>{trade.type}</td>
                                <td>{trade.units || 'N/A'}</td>
                                <td>{trade.price ? formatCurrency(trade.price) : 'N/A'}</td>
                                <td>{formatCurrency(trade.fees)}</td>
                                <td className="total-value">{formatCurrency(trade.totalValue)}</td>
                                <td className="action-icons">
                                    <Link className="action-icon edit-icon" to={`/mutual-funds/edit/${trade._id}`}><FaEdit /></Link>
                                    <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(trade._id)} style={{ cursor: 'pointer', color: '#c0392b' }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
};

export default MutualFundLogPage;
