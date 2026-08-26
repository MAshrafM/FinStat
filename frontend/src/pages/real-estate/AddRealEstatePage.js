// frontend/src/pages/real-estate/AddRealEstatePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="real-estate-page-wrapper">
      <div className="real-estate-container">
        <div className="real-estate-header" style={{ marginBottom: '20px' }}>
          <div className="real-estate-header-left">
            <h1>Add Real Estate Property</h1>
            <p>Record a new property with purchase cost and estimated valuation.</p>
          </div>
        </div>

        {error && (
          <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', maxWidth: '720px', margin: '0 auto 20px' }}>
            {error}
          </div>
        )}

        <RealEstateForm onSubmit={handleSubmit} isSubmitting={isSubmitting} isEditing={false} />
      </div>
    </div>
  );
};

export default AddRealEstatePage;
