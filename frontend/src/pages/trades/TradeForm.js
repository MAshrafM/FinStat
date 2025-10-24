// frontend/src/pages/trades/TradeForm.js
import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useData } from '../../context/DataContext';

const TradeForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
    const { openPosData } = useData();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        broker: 'Thndr',
        type: 'Buy',
        stockCode: '',
        shares: '',
        price: '',
        fees: '',
        totalValue: 0,
        iteration: '',
    });

    // Get stock info for selected stock code (filtered by broker)
    const getSelectedStockInfo = (stockCode) => {
        if (!stockCode || !openPosData) return null;

        return openPosData.find(position =>
            position._id.stockCode === stockCode &&
            position._id.broker === formData.broker
        );
    };

    const selectedStockInfo = getSelectedStockInfo(formData.stockCode);
    //console.log('Selected Stock Info:', selectedStockInfo);

    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
                broker: initialData.broker || 'Thndr',
                type: initialData.type || 'Buy',
                stockCode: initialData.stockCode || '',
                shares: initialData.shares || '',
                price: initialData.price || '',
                fees: initialData.fees || '',
                totalValue: initialData.totalValue || 0,
                iteration: initialData.iteration || '',
            });
        }
    }, [initialData, isEdit]);

    // Effect to auto-calculate totalValue for Buy/Sell trades
    useEffect(() => {
        const { type, shares, price, fees } = formData;
        if (['Buy', 'Sell'].includes(type)) {
            const numShares = parseFloat(shares) || 0;
            const numPrice = parseFloat(price) || 0;
            const numFees = parseFloat(fees) || 0;

            const newTotalValue = type === 'Buy'
                ? (numShares * numPrice) + numFees
                : (numShares * numPrice) - numFees;

            setFormData(prev => ({ ...prev, totalValue: newTotalValue }));
        }
    }, [formData.type, formData.shares, formData.price, formData.fees]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // If changing transaction type to/from Sell or broker, clear stockCode
        if (name === 'type' || (name === 'broker' && formData.type === 'Sell')) {
            setFormData(prev => ({ ...prev, [name]: value, stockCode: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCashChange = (e) => {
        // For cash transactions, the entered value is the totalValue
        setFormData(prev => ({ ...prev, totalValue: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation for sell transactions
        if (formData.type === 'Sell') {
            const sharesToSell = parseFloat(formData.shares) || 0;
            const availableShares = selectedStockInfo ? parseFloat(selectedStockInfo.currentShares) || 0 : 0;

            if (sharesToSell > availableShares) {
                alert(`Cannot sell ${sharesToSell} shares. You only have ${availableShares} shares available.`);
                return;
            }
        }

        onFormSubmit(formData);
    };

    const isStockTrade = ['Buy', 'Sell', 'Dividend'].includes(formData.type);
    const isCashTrade = ['TopUp', 'Withdraw'].includes(formData.type);
    const isSellTransaction = formData.type === 'Sell';

    return (
        <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Broker</label>
                <select name="broker" value={formData.broker} onChange={handleChange}>
                    <option value="Thndr">Thndr</option>
                    <option value="EFG">EFG</option>
                </select>
            </div>
            <div className="form-group">
                <label>Transaction Type</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                    <option value="TopUp">Top-up (Cash Deposit)</option>
                    <option value="Withdraw">Withdraw (Cash)</option>
                    <option value="Dividend">Dividend</option>
                </select>
            </div>

            {isStockTrade && !isSellTransaction && (
                <div className="form-group">
                    <label>Stock Code</label>
                    <input type="text" name="stockCode" placeholder="e.g., AAPL, COMI.CA" value={formData.stockCode} onChange={handleChange} required />
                </div>
            )}

            {isSellTransaction && (
                <div className="form-group">
                    <label>Select Stock to Sell</label>
                    <select name="stockCode" value={formData.stockCode} onChange={handleChange} required>
                        <option value="">-- Select a stock --</option>
                        {openPosData && openPosData
                            .filter(position => position._id.broker === formData.broker)
                            .map(position => (
                                <option key={`${position._id.stockCode}-${position._id.iteration}`} value={position._id.stockCode}>
                                    {position._id.stockCode} ({parseFloat(position.currentShares || 0).toLocaleString()} shares available - Iteration {position._id.iteration})
                                </option>
                            ))}
                    </select>

                    {selectedStockInfo && (
                        <div className="stock-info" style={{
                            marginTop: '10px',
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            <div><strong>Stock:</strong> {selectedStockInfo._id.stockCode}</div>
                            <div><strong>Current Shares:</strong> {parseFloat(selectedStockInfo.currentShares || 0).toLocaleString()}</div>
                            <div><strong>Current Iteration:</strong> {selectedStockInfo._id.iteration}</div>
                            <div><strong>Average Price:</strong> {formatCurrency(selectedStockInfo.avgPrice)}</div>
                            {selectedStockInfo.targetSell && (
                                <div><strong>Target Sell:</strong> {formatCurrency(selectedStockInfo.targetSell)}</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isCashTrade && (
                <div className="form-group">
                    <label>Amount</label>
                    <input type="number" step="0.01" name="totalValue" placeholder="Enter cash amount" value={formData.totalValue} onChange={handleCashChange} required />
                </div>
            )}

            {formData.type === 'Dividend' && (
                <div className="form-group">
                    <label>Dividend Amount Cash</label>
                    <input type="number" step="0.01" name="totalValue" placeholder="Enter total dividend received" value={formData.totalValue} onChange={handleCashChange} required />
                    <label>Dividend Amount Shares</label>
                    <input type="number" name="shares" placeholder="Enter total dividend received" value={formData.shares} onChange={handleChange} required />
                </div>
            )}

            {['Buy', 'Sell'].includes(formData.type) && (
                <>
                    <div className="form-group">
                        <label>Shares</label>
                        <input
                            type="number"
                            step="any"
                            name="shares"
                            value={formData.shares}
                            onChange={handleChange}
                            required
                            max={isSellTransaction && selectedStockInfo ? selectedStockInfo.currentShares : undefined}
                            placeholder={isSellTransaction && selectedStockInfo ? `Max: ${selectedStockInfo.currentShares}` : ''}
                        />
                        {isSellTransaction && selectedStockInfo && parseFloat(formData.shares) > parseFloat(selectedStockInfo.currentShares) && (
                            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                                ⚠️ Cannot sell more than {selectedStockInfo.currentShares} shares
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Price per Share</label>
                        <input type="number" step="any" name="price" value={formData.price} onChange={handleChange} required />
                    </div>
                </>
            )}

            <div className="form-group">
                <label>Fees</label>
                <input type="number" step="any" name="fees" value={formData.fees} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Iteration</label>
                <input type="number" name="iteration" value={formData.iteration} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Total Value</label>
                <input type="text" 
                    value={formatCurrency(formData.totalValue)} 
                    readOnly 
                    disabled 
                    className="total-display" />
            </div>

            <button type="submit" className="action-button">{isEdit ? 'Update' : 'Create'} Trade</button>
        </form>
    );
};

export default TradeForm;