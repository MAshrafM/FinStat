// frontend/src/pages/trades/EditTradePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTradeById, updateTrade } from '../../services/tradeService';
import TradeForm from './TradeForm';
import { useToast } from '../../context/ToastContext';

const EditTradePage = () => {
  const navigate = useNavigate();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    getTradeById(id)
      .then(data => setInitialData(data))
      .catch(err => console.error("Failed to fetch trade:", err));
  }, [id]);

  const handleFormSubmit = async (formData) => {
    try {
      await updateTrade(id, formData);
      navigate('/trades');
    } catch (err) {
      console.error("Failed to update trade:", err);
      if (notify) notify(err.response?.data?.message || err.message || 'Error updating trade', 'error');
    }
  };

  if (!initialData) return <p>Loading trade data...</p>;

  return (
    <div className="page-container">
      <div className="page-header"><h1>Edit Trade</h1></div>
      <TradeForm onFormSubmit={handleFormSubmit} initialData={initialData} isEdit={true} />
    </div>
  );
};
export default EditTradePage;
