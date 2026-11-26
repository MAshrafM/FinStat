// frontend/src/pages/mutual-funds/AddMutualFundPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createTrade } from '../../services/mutualFundService';
import MutualFundForm from './MutualFundForm';
import { useToast } from '../../context/ToastContext';
import './MutualFunds.css';

const AddMutualFundPage = () => {
  const navigate = useNavigate();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const handleFormSubmit = async (formData) => {
    try {
      await createTrade(formData);
      navigate('/mutual-funds');
    } catch (err) {
      console.error('Failed to create transaction:', err);
      if (notify) {
        notify(
          err.response?.data?.message || err.message || 'Error creating transaction',
          'error'
        );
      }
    }
  };
  return (
    <div className="page-container mf-page-container mf-form-page">
      <div className="mf-header">
        <div className="mf-header-title-group">
          <p className="mf-breadcrumb">Mutual Funds &gt; New Transaction</p>
          <h1>Add New Mutual Fund Transaction</h1>
        </div>
      </div>
      <MutualFundForm onFormSubmit={handleFormSubmit} />
    </div>
  );
};

export default AddMutualFundPage;
