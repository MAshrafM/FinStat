// frontend/src/pages/currency/EditCurrencyPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { getCurrencyById, updateCurrency } from '../../services/currencyService';
import { Loading } from '../../components/ui';
import CurrencyForm from './CurrencyForm';
import './Currency.css';

const EditCurrencyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHolding = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await getCurrencyById(id);
      setCurrency(data);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load currency holding.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHolding();
  }, [fetchHolding]);

  const handleSubmit = async (data) => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await updateCurrency(id, data);
      navigate('/currency');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to update currency holding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container curr-page-container curr-form-page">
        <Loading variant="form-field" text="Loading foreign currency details..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-container curr-page-container curr-form-page">
        <div className="curr-detail-top-bar">
          <Link to="/currency" className="curr-back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Foreign Currency
          </Link>
        </div>
        <div className="curr-error-card" role="alert">
          <h2>Unable to Load Currency Holding</h2>
          <p>{fetchError}</p>
          <div className="curr-error-actions">
            <button type="button" className="fs-btn fs-btn-secondary" onClick={fetchHolding}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currency) {
    return (
      <div className="page-container curr-page-container curr-form-page">
        <div className="curr-detail-top-bar">
          <Link to="/currency" className="curr-back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Foreign Currency
          </Link>
        </div>
        <div className="curr-empty-card">
          <h2>Currency Position Not Found</h2>
          <p>The requested foreign currency entry could not be located.</p>
          <div className="curr-error-actions">
            <Link to="/currency" className="fs-btn fs-btn-secondary">
              Return to Currency Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container curr-page-container curr-form-page">
      <div className="curr-detail-top-bar">
        <Link to="/currency" className="curr-back-link">
          <FaArrowLeft aria-hidden="true" /> Back to Foreign Currency
        </Link>
      </div>
      <div className="curr-header">
        <div className="curr-header-title-group">
          <p className="curr-breadcrumb">Assets / Foreign Currency / Edit</p>
          <h1>Edit Foreign Currency</h1>
        </div>
      </div>
      {submitError && (
        <div className="curr-submit-error" role="alert">
          {submitError}
        </div>
      )}
      <CurrencyForm
        onFormSubmit={handleSubmit}
        initialData={currency}
        isEdit={true}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EditCurrencyPage;
