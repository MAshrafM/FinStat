// frontend/src/pages/real-estate/EditRealEstatePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRealEstateById, updateRealEstate } from '../../services/realEstateService';
import RealEstateForm from './RealEstateForm';
import './RealEstate.css';

const EditRealEstatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProp = async () => {
      try {
        setIsLoading(true);
        const data = await getRealEstateById(id);
        setProperty(data);
      } catch (err) {
        console.error('Failed to load property:', err);
        setError(err.message || 'Failed to load property details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProp();
  }, [id]);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await updateRealEstate(id, payload);
      navigate('/real-estate');
    } catch (err) {
      console.error('Failed to update real estate property:', err);
      setError(err.message || 'Failed to update real estate property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="real-estate-page-wrapper">
        <div className="real-estate-container">
          <div className="empty-holdings-box" style={{ paddingTop: '80px' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Loading Property Details...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="real-estate-page-wrapper">
      <div className="real-estate-container">
        <div className="real-estate-header" style={{ marginBottom: '20px' }}>
          <div className="real-estate-header-left">
            <h1>Edit Real Estate Property</h1>
            <p>Update property valuation, details, or status.</p>
          </div>
        </div>

        {error && (
          <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', maxWidth: '720px', margin: '0 auto 20px' }}>
            {error}
          </div>
        )}

        {property && (
          <RealEstateForm
            initialData={property}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditing={true}
          />
        )}
      </div>
    </div>
  );
};

export default EditRealEstatePage;
