// frontend/src/pages/certificates/EditCertificatePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCertificateById, updateCertificate } from '../../services/certificateService';
import { Loading } from '../../components/ui';
import CertificateForm from './CertificateForm';
import './Certificates.css';

const EditCertificatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const loadCertificate = useCallback(async () => {
    try {
      setFetchError('');
      const data = await getCertificateById(id);
      setCertificate(data);
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load certificate');
    }
  }, [id]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  const handleSubmit = async (data) => {
    try {
      setSubmitError('');
      await updateCertificate(id, data);
      navigate('/certificates');
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to update certificate');
    }
  };

  if (fetchError) {
    return (
      <div className="page-container cert-page-container cert-form-page">
        <div className="cert-header">
          <div className="cert-header-title-group">
            <p className="cert-breadcrumb">Assets &gt; Bank Certificates &gt; Edit Certificate</p>
            <h1>Edit Bank Certificate</h1>
          </div>
        </div>
        <div className="cert-error-card" role="alert">
          <h2>Failed to Load Certificate</h2>
          <p>{fetchError}</p>
          <div className="cert-error-actions">
            <button type="button" className="fs-btn fs-btn-secondary" onClick={loadCertificate}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="page-container cert-page-container cert-form-page">
        <Loading variant="form-field" text="Loading certificate..." />
      </div>
    );
  }

  return (
    <div className="page-container cert-page-container cert-form-page">
      <div className="cert-header">
        <div className="cert-header-title-group">
          <p className="cert-breadcrumb">Assets &gt; Bank Certificates &gt; Edit Certificate</p>
          <h1>Edit Bank Certificate</h1>
        </div>
      </div>

      {submitError && (
        <div className="cert-submit-error" role="alert">
          <strong>Update failed:</strong> {submitError}
        </div>
      )}

      <CertificateForm onFormSubmit={handleSubmit} initialData={certificate} isEdit={true} />
    </div>
  );
};

export default EditCertificatePage;
