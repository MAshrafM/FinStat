// frontend/src/pages/trades/TradeForm.js
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';

const TradeForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
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

  // Effect to auto-calculate totalValue
  useEffect(() => {
    const { type, shares, price, fees } = formData;
    const numShares = parseFloat(shares) || 0;
    const numPrice = parseFloat(price) || 0;
    const numFees = parseFloat(fees) || 0;
    let total = 0;

    if (type === 'Buy') {
      total = (numShares * numPrice) + numFees;
    } else if (type === 'Sell') {
      total = (numShares * numPrice) - numFees;
    } else if (['TopUp', 'Dividend', 'Withdraw'].includes(type)) {
      // For cash transactions, totalValue is entered directly
      // We'll handle this by renaming the field in the UI
    }
    
    // Only auto-calculate for Buy/Sell
    if (['Buy', 'Sell'].includes(type)) {
        setFormData(prev => ({ ...prev, totalValue: total }));
    }

  }, [formData.type, formData.shares, formData.price, formData.fees]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCashChange = (e) => {
    // For cash transactions, the entered value is the totalValue
    setFormData(prev => ({ ...prev, totalValue: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  const isStockTrade = ['Buy', 'Sell', 'Dividend'].includes(formData.type);
  const isCashTrade = ['TopUp', 'Withdraw'].includes(formData.type);

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

      {isStockTrade && (
        <div className="form-group">
          <label>Stock Code</label>
          <input type="text" name="stockCode" placeholder="e.g., AAPL, COMI.CA" value={formData.stockCode} onChange={handleChange} required />
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
            <input type="number" step="any" name="shares" value={formData.shares} onChange={handleChange} required />
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
        <label>Iteration (Optional)</label>
        <input type="number" name="iteration" value={formData.iteration} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Total Value</label>
        <input type="text" value={formatCurrency(formData.totalValue)} readOnly disabled className="total-display" />
      </div>

      <button type="submit" className="action-button">{isEdit ? 'Update' : 'Create'} Trade</button>
    </form>
  );
};

export default TradeForm;
