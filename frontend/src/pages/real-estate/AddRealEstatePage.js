// frontend/src/pages/real-estate/AddRealEstatePage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { createRealEstate } from '../../services/realEstateService';
import RealEstateForm from './RealEstateForm';
import './RealEstate.css';

const AddRealEstatePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createRealEstate(payload);
      navigate('/real-estate');
    } catch (err) {
      console.error('Failed to create real estate property:', err);
      setError(err.message || 'Failed to create real estate property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container re-page-container re-form-page">
      <nav className="re-breadcrumb" aria-label="Breadcrumb">
        <span>Assets</span>
        <span aria-hidden="true">/</span>
        <Link to="/real-estate">Real Estate</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New</span>
      </nav>

      <Link to="/real-estate" className="re-back-link">
        <FaArrowLeft aria-hidden="true" /> Back to Real Estate
      </Link>

      <header className="re-header">
        <div className="re-header-left">
          <h1>Add Real Estate Property</h1>
          <p className="re-header-subtitle">
            Record a new property with purchase cost and estimated valuation.
          </p>
        </div>
      </header>

      {error && (
        <div className="re-submit-error" role="alert">
          {error}
        </div>
      )}

      <RealEstateForm onSubmit={handleSubmit} isSubmitting={isSubmitting} isEditing={false} />
    </div>
  );
};

export default AddRealEstatePage;
