// frontend/src/pages/trades/AddTradePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createTrade } from '../../services/tradeService';
import TradeForm from './TradeForm';

const AddTradePage = () => {
  const navigate = useNavigate();
  const handleFormSubmit = async (formData) => {
    try {
      await createTrade(formData);
      navigate('/trades');
    } catch (err) {
      console.error("Failed to create trade:", err);
      alert('Error creating trade. See console for details.');
    }
  };
  return (
    <div className="page-container">
      <div className="page-header"><h1>Add New Trade</h1></div>
      <TradeForm onFormSubmit={handleFormSubmit} />
    </div>
  );
};
export default AddTradePage;
