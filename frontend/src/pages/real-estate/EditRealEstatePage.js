// frontend/src/pages/real-estate/EditRealEstatePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBuilding } from 'react-icons/fa';
import { getRealEstateById, updateRealEstate } from '../../services/realEstateService';
import Loading from '../../components/ui/Loading';
import RealEstateForm from './RealEstateForm';
import './RealEstate.css';

const EditRealEstatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const fetchProp = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await getRealEstateById(id);
      setProperty(data || null);
    } catch (err) {
      console.error('Failed to load property:', err);
      setFetchError(err.message || 'Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProp();
  }, [fetchProp]);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await updateRealEstate(id, payload);
      navigate('/real-estate');
    } catch (err) {
      console.error('Failed to update real estate property:', err);
      setSubmitError(err.message || 'Failed to update real estate property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container re-page-container re-form-page">
        <Loading variant="form-field" text="Loading property details..." />
      </div>
    );
  }

  return (
    <div className="page-container re-page-container re-form-page">
      <nav className="re-breadcrumb" aria-label="Breadcrumb">
        <span>Assets</span>
        <span aria-hidden="true">/</span>
        <Link to="/real-estate">Real Estate</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Edit</span>
      </nav>

      <Link to="/real-estate" className="re-back-link">
        <FaArrowLeft aria-hidden="true" /> Back to Real Estate
      </Link>

      <header className="re-header">
        <div className="re-header-left">
          <h1>Edit Real Estate Property</h1>
          <p className="re-header-subtitle">
            Update property valuation, details, or status.
          </p>
        </div>
      </header>

      {fetchError && (
        <div className="re-error-card" role="alert">
          <h2>Unable to Load Property Details</h2>
          <p>{fetchError}</p>
          <button type="button" className="fs-btn fs-btn-secondary" onClick={fetchProp}>
            Retry
          </button>
        </div>
      )}

      {!fetchError && !property && (
        <div className="re-empty-card">
          <div className="re-state-icon">
            <FaBuilding aria-hidden="true" />
          </div>
          <h2>Property Not Found</h2>
          <p>The requested real estate property could not be found.</p>
          <Link to="/real-estate" className="fs-btn fs-btn-secondary">
            Return to Real Estate
          </Link>
        </div>
      )}

      {!fetchError && property && (
        <>
          {submitError && (
            <div className="re-submit-error" role="alert">
              {submitError}
            </div>
          )}

          <RealEstateForm
            initialData={property}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditing={true}
          />
        </>
      )}
    </div>
  );
};

export default EditRealEstatePage;
