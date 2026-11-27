// frontend/src/pages/currency/AddCurrencyPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { createCurrency } from '../../services/currencyService';
import CurrencyForm from './CurrencyForm';
import './Currency.css';

const AddCurrencyPage = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await createCurrency(data);
      navigate('/currency');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create currency holding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container curr-page-container curr-form-page">
      <div className="curr-detail-top-bar">
        <Link to="/currency" className="curr-back-link">
          <FaArrowLeft aria-hidden="true" /> Back to Foreign Currency
        </Link>
      </div>
      <div className="curr-header">
        <div className="curr-header-title-group">
          <p className="curr-breadcrumb">Assets / Foreign Currency / New</p>
          <h1>Add New Currency</h1>
        </div>
      </div>
      {submitError && (
        <div className="curr-submit-error" role="alert">
          {submitError}
        </div>
      )}
      <CurrencyForm onFormSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};

export default AddCurrencyPage;
