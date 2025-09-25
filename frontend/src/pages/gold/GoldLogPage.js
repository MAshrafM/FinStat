// frontend/src/pages/gold/GoldLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getGoldLogs, deleteGoldLog } from '../../services/goldService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import '../trades/Trades.css'; // Reuse styles

const GoldLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const fetchLogs = useCallback((page, status, sortKey, sortDir) => {
        console.log(`%c[FETCHING] Page: ${page}, Status: ${status}, Sort: ${sortKey} ${sortDir}`, 'color: blue; font-weight: bold;');
        getGoldLogs(page, status, sortKey, sortDir)
            .then(data => {
                setLogs(data.data);
                setTotalPages(data.totalPages);
                setCurrentPage(data.currentPage);
            })
            .catch(err => console.error("Failed to load gold logs:", err));
    }, []);

    useEffect(() => {
        console.log(`%c[EFFECT] Triggered. Deps: page=${currentPage}, status=${filterStatus}, sort=${sortConfig.key}`, 'color: green;');
        fetchLogs(currentPage, filterStatus, sortConfig.key, sortConfig.direction);
    }, [currentPage, filterStatus, sortConfig.key, sortConfig.direction, fetchLogs]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this log?')) {
            await deleteGoldLog(id);
            // Refetch with current settings
            fetchLogs(currentPage, filterStatus, sortConfig.key, sortConfig.direction);
        }
    };

    const handleFilterChange = (newStatus) => {
        console.log(`%c[ACTION] handleFilterChange called with: ${newStatus}`, 'color: orange;');
        setFilterStatus(newStatus);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        console.log(`%c[ACTION] handleSort called with: ${key}`, 'color: orange;');
        setSortConfig(prevSortConfig => {
            const newDirection = prevSortConfig.key === key && prevSortConfig.direction === 'asc' ? 'desc' : 'asc';
            return { key, direction: newDirection };
        });
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <FaSort />;
        }
        return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gold Wallet Log</h1>
            </div>
            <div className="filter-controls">
                <button onClick={() => handleFilterChange('all')} className={filterStatus === 'all' ? 'active' : ''}>All</button>
                <button onClick={() => handleFilterChange('hold')} className={filterStatus === 'hold' ? 'active' : ''}>Hold</button>
                <button onClick={() => handleFilterChange('sold')} className={filterStatus === 'sold' ? 'active' : ''}>Sold</button>
            </div>
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                Date {getSortIcon('date')}
                            </th>
                            <th>Item</th>
                            <th onClick={() => handleSort('karat')} style={{ cursor: 'pointer' }}>
                                Karat {getSortIcon('karat')}
                            </th>
                            <th onClick={() => handleSort('weight')} style={{ cursor: 'pointer' }}>
                                Weight (g) {getSortIcon('weight')}
                            </th>
                            <th>Price/g</th>
                            <th>Price</th>
                            <th>Paid</th>
                            <th>Taxes/Fees</th>
                            <th>Cost/g</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => {
                            const totalPrice = log.weight * log.price;
                            const taxes = log.paid - totalPrice;
                            const feesPerGram = taxes / log.weight;
                            const statusClass = log.status === 'sold' ? 'status-icon sold' : 'status-icon hold';
                            return (
                                <tr key={log._id}>
                                    <td data-label="Date">{formatDate(log.date)}</td>
                                    <td data-label="Item">
                                        <p style={{ fontWeight: 'bold' }}>{log.item}</p>
                                        <p className="broker">by {log.seller || 'N/A'}</p>
                                    </td>
                                    <td data-label="Karat">{log.karat}K</td>
                                    <td data-label="Weight">{log.weight.toFixed(4)}g</td>
                                    <td data-label="Price/g">{formatCurrency(log.price)}</td>
                                    <td data-label="Price">{formatCurrency(totalPrice)}</td>
                                    <td data-label="Paid" className="total-value">{formatCurrency(log.paid)}</td>
                                    <td data-label="Taxes">{formatCurrency(taxes)}</td>
                                    <td data-label="Cost/g">{formatCurrency(feesPerGram)}</td>
                                    <td data-label="Status"><span className={statusClass}></span></td>
                                    <td data-label="Actions" className="action-icons">
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
