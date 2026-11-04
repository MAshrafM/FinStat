// frontend/src/pages/trades/AddTradePage.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createTrade } from '../../services/tradeService';
import { useToast } from '../../context/ToastContext';
import TradeForm from './TradeForm';

const AddTradePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const prefill = location.state?.prefill || {};
  const initialData = {
    ...prefill,
    stockCode: prefill.stockCode || prefill.ticker || '',
    type: prefill.type || (prefill.action ? (prefill.action.toUpperCase() === 'SELL' ? 'Sell' : 'Buy') : 'Buy'),
  };

  const handleFormSubmit = async (formData) => {
    try {
      await createTrade(formData);
      if (notify) notify('Trade created successfully!', 'success');
      navigate('/trades');
    } catch (err) {
      console.error("Failed to create trade:", err);
      if (notify) notify(err.response?.data?.message || err.message || 'Error creating trade. See console for details.', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header"><h1>Add New Trade</h1></div>
      <TradeForm initialData={initialData} onFormSubmit={handleFormSubmit} />
    </div>
  );
};

export default AddTradePage;
