// frontend/src/pages/mutual-funds/EditMutualFundPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTradeById, updateTrade } from '../../services/mutualFundService';
import MutualFundForm from './MutualFundForm';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/ui/Loading';
import './MutualFunds.css';

const EditMutualFundPage = () => {
  const navigate = useNavigate();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setLoadError(null);

    getTradeById(id)
      .then((data) => {
        if (isActive) setInitialData(data);
      })
      .catch((err) => {
        console.error('Failed to fetch transaction:', err);
        if (isActive) {
          setLoadError('Failed to load transaction data.');
          if (notify) notify('Failed to load transaction', 'error');
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id, notify]);

  const handleFormSubmit = async (formData) => {
    try {
      await updateTrade(id, formData);
      navigate('/mutual-funds');
    } catch (err) {
      console.error('Failed to update transaction:', err);
      if (notify) {
        notify(
          err.response?.data?.message || err.message || 'Error updating transaction',
          'error'
        );
      }
    }
  };

  return (
    <div className="page-container mf-page-container mf-form-page">
      <div className="mf-header">
        <div className="mf-header-title-group">
          <p className="mf-breadcrumb">Mutual Funds &gt; Edit Transaction</p>
          <h1>Edit Mutual Fund Transaction</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="mf-loading-wrap">
          <Loading variant="form-field" text="Loading transaction data..." />
        </div>
      ) : loadError ? (
        <div className="mf-error-card" role="alert">
          <h2>Unable to load transaction</h2>
          <p>{loadError}</p>
        </div>
      ) : (
        <MutualFundForm
          onFormSubmit={handleFormSubmit}
          initialData={initialData || {}}
          isEdit
        />
      )}
    </div>
  );
};

export default EditMutualFundPage;
