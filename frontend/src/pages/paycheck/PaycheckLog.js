// frontend/src/pages/paycheck/PaycheckLog.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaCalculator } from 'react-icons/fa';
import PaycheckTable from './PaycheckTable';
import { getPaychecksLog, deletePaycheck, getPaychecks } from '../../services/paycheckService';
import PaginationControls from '../../components/PaginationControls';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { PageHeader, Button, Delta, Loading } from '../../components/ui';
import './PaycheckLog.css';

const PaycheckLog = () => {
    const { showToast } = useToast();
    const [paychecks, setPaychecks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedYear, setSelectedYear] = useState('all');
    const [deletingPaycheckId, setDeletingPaycheckId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [summaryData, setSummaryData] = useState({
        totalCash: 0,
        totalPrepaid: 0,
        overallTotal: 0,
        yearlyBreakdown: {},
        yearlyChanges: {}
    });

    const calculateSummaryData = useCallback((paychecksData) => {
        if (!Array.isArray(paychecksData)) return;
        let totalCash = 0;
        let totalPrepaid = 0;
        const yearlyBreakdown = {};

        // Process all paychecks
        paychecksData.forEach(paycheck => {
            const year = (paycheck.period || paycheck.month || '').substring(0, 4) || new Date(paycheck.payDate || paycheck.date || Date.now()).getFullYear().toString();
            const amount = Number(paycheck.netPay !== undefined && paycheck.netPay !== null && paycheck.netPay !== 0 ? paycheck.netPay : (paycheck.amount || 0));

            // Initialize year if not exists
            if (!yearlyBreakdown[year]) {
                yearlyBreakdown[year] = {
                    cash: 0,
                    prepaid: 0,
                    total: 0
                };
            }

            // Add to totals and yearly breakdown
            if (paycheck.type === 'Cash') {
                totalCash += amount;
                yearlyBreakdown[year].cash += amount;
            } else if (paycheck.type === 'Prepaid') {
                totalPrepaid += amount;
                yearlyBreakdown[year].prepaid += amount;
            } else {
                totalCash += amount;
                yearlyBreakdown[year].cash += amount;
            }

            yearlyBreakdown[year].total += amount;
        });

        // Calculate year-over-year changes
        const years = Object.keys(yearlyBreakdown).sort();
        const yearlyChanges = {};

        for (let i = 1; i < years.length; i++) {
            const currentYear = years[i];
            const previousYear = years[i - 1];
            const currentTotal = yearlyBreakdown[currentYear].total;
            const previousTotal = yearlyBreakdown[previousYear].total;

            if (previousTotal > 0) {
                const changeAmount = currentTotal - previousTotal;
                const changePercentage = ((changeAmount / previousTotal) * 100).toFixed(1);
                yearlyChanges[currentYear] = {
                    amount: changeAmount,
                    percentage: changePercentage,
                    direction: changeAmount >= 0 ? 'increase' : 'decrease'
                };
            }
        }

        setSummaryData({
            totalCash,
            totalPrepaid,
            overallTotal: totalCash + totalPrepaid,
            yearlyBreakdown,
            yearlyChanges
        });
    }, []);

    useEffect(() => {
        // Load all paychecks for summary calculations
        getPaychecks().then(response => {
            if (response) {
                const list = Array.isArray(response) ? response : (response.data || []);
                calculateSummaryData(list);
            }
        }).catch(err => {
            console.error('Failed to load all paychecks:', err);
        });
    }, [calculateSummaryData]);

    const loadPaychecks = useCallback((page, year = selectedYear) => {
        setIsLoading(true);
        getPaychecksLog(page, 25, year).then(response => {
            if (response) {
                const list = Array.isArray(response?.data)
                    ? response.data
                    : (Array.isArray(response) ? response : []);
                setPaychecks(list);
                setTotalPages(response?.totalPages || 1);
                setTotalCount(response?.total !== undefined ? response.total : list.length);
            }
        }).catch(err => {
            console.error('Failed to load paychecks:', err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [selectedYear]);

    useEffect(() => {
        loadPaychecks(currentPage, selectedYear);
    }, [currentPage, selectedYear, loadPaychecks]);

    const handleDeleteClick = (id) => {
        setDeletingPaycheckId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deletingPaycheckId) return;
        setIsDeleting(true);
        try {
            await deletePaycheck(deletingPaycheckId);
            showToast('Paycheck entry deleted successfully', 'success');
            setDeletingPaycheckId(null);
            loadPaychecks(currentPage, selectedYear);
            // Refresh summary data
            const updatedPaychecks = await getPaychecks();
            if (updatedPaychecks) {
                const list = Array.isArray(updatedPaychecks) ? updatedPaychecks : (updatedPaychecks.data || []);
                calculateSummaryData(list);
            }
        } catch (err) {
            console.error('Failed to delete paycheck:', err);
            showToast('Failed to delete paycheck entry', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleYearFilter = (year) => {
        setSelectedYear(year);
        setCurrentPage(1); // Reset to first page when changing filter
    };

    const availableYears = Object.keys(summaryData.yearlyBreakdown).sort((a, b) => b - a);

    return (
        <div className="fs-page">
            <PageHeader
                title="Paycheck Log"
                subtitle="Track monthly net salaries, prepaid distributions, and audit history"
                actions={
                    <div className="paycheck-header-actions">
                        <Button
                            as={Link}
                            to="/salary/profiles"
                            variant="secondary"
                            icon={<FaCalculator aria-hidden="true" />}
                        >
                            Salary Profile &amp; Components
                        </Button>
                        <ProtectedAction tooltip="View-only access">
                            <Button
                                as={Link}
                                to="/salary/paychecks/new"
                                variant="primary"
                                icon={<FaPlus aria-hidden="true" />}
                            >
                                Log Paycheck
                            </Button>
                        </ProtectedAction>
                    </div>
                }
            />

            {/* Overall Summary Card */}
            <div className="summary-section">
                <div className="tax-card fs-card">
                    <h2 className="paycheck-filter-title">💰 Overall Summary</h2>
                    <div className="paycheck-summary-grid">
                        <div className="paycheck-summary-card">
                            <div className="paycheck-summary-label">Total Cash</div>
                            <div className="paycheck-summary-value fs-num">
                                {formatCurrency(summaryData.totalCash)}
                            </div>
                        </div>
                        <div className="paycheck-summary-card">
                            <div className="paycheck-summary-label">Total Prepaid</div>
                            <div className="paycheck-summary-value fs-num">
                                {formatCurrency(summaryData.totalPrepaid)}
                            </div>
                        </div>
                        <div className="paycheck-summary-card">
                            <div className="paycheck-summary-label">Overall Total</div>
                            <div className="paycheck-summary-value fs-num">
                                {formatCurrency(summaryData.overallTotal)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yearly Breakdown */}
            <div className="yearly-breakdown-section">
                <div className="tax-card fs-card">
                    <h2 className="paycheck-filter-title">📊 Yearly Breakdown &amp; Growth</h2>
                    <div className="paycheck-yearly-grid">
                        {availableYears.map(year => {
                            const yearData = summaryData.yearlyBreakdown[year];
                            const changeData = summaryData.yearlyChanges[year];

                            return (
                                <div key={year} className="paycheck-year-card">
                                    <div className="paycheck-year-header">
                                        <h3 className="paycheck-year-title">{year}</h3>
                                        {changeData && (
                                            <Delta
                                                tone="neutral"
                                                sign={changeData.direction === 'increase' ? 'positive' : 'negative'}
                                                value={`${Math.abs(parseFloat(changeData.percentage))}%`}
                                                label="vs previous year"
                                            />
                                        )}
                                    </div>

                                    <div className="paycheck-year-rows">
                                        <div className="paycheck-year-row">
                                            <span>Cash:</span>
                                            <strong className="fs-num">{formatCurrency(yearData.cash)}</strong>
                                        </div>
                                        <div className="paycheck-year-row">
                                            <span>Prepaid:</span>
                                            <strong className="fs-num">{formatCurrency(yearData.prepaid)}</strong>
                                        </div>
                                        <div className="paycheck-year-total">
                                            <span>Total:</span>
                                            <strong className="fs-num">{formatCurrency(yearData.total)}</strong>
                                        </div>

                                        {changeData && (
                                            <div className="paycheck-year-diff">
                                                <span className="fs-num">{changeData.direction === 'increase' ? '+' : ''}{formatCurrency(changeData.amount)}</span> vs prev year
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
                <div className="paycheck-filter-card fs-card">
                    <h2 className="paycheck-filter-title">🔍 Filter by Year</h2>
                    <div className="paycheck-filter-chips">
                        <button
                            type="button"
                            onClick={() => handleYearFilter('all')}
                            className={`paycheck-filter-chip ${selectedYear === 'all' ? 'active' : ''}`}
                        >
                            All Years
                        </button>
                        {availableYears.map(year => (
                            <button
                                key={year}
                                type="button"
                                onClick={() => handleYearFilter(year)}
                                className={`paycheck-filter-chip ${selectedYear === year ? 'active' : ''}`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                    {selectedYear !== 'all' && (
                        <div className="paycheck-filter-notice">
                            📅 Showing paychecks for {selectedYear} only
                        </div>
                    )}
                </div>
            </div>

            {/* Paycheck Table */}
            <div className="table-section">
                {isLoading ? (
                    <Loading variant="table" rows={5} text="Loading paychecks..." />
                ) : (
                    <PaycheckTable paychecks={paychecks} onPaycheckDeleted={handleDeleteClick} />
                )}
                <PaginationControls
                    page={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    onPageChange={setCurrentPage}
                    showAlways
                />
            </div>

            <ConfirmModal
                isOpen={Boolean(deletingPaycheckId)}
                title="Delete Paycheck"
                message="Are you sure you want to delete this paycheck entry? This action cannot be undone."
                confirmText="Delete Paycheck"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => !isDeleting && setDeletingPaycheckId(null)}
            />
        </div>
    );
};

export default PaycheckLog;
