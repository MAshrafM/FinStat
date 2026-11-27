// frontend/src/pages/certificates/AddCertificatePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCertificate } from '../../services/certificateService';
import CertificateForm from './CertificateForm';
import './Certificates.css';

const AddCertificatePage = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (data) => {
    try {
      setSubmitError('');
      await createCertificate(data);
      navigate('/certificates');
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create certificate');
    }
  };

  return (
    <div className="page-container cert-page-container cert-form-page">
      <div className="cert-header">
        <div className="cert-header-title-group">
          <p className="cert-breadcrumb">Assets &gt; Bank Certificates &gt; New Certificate</p>
          <h1>Add New Bank Certificate</h1>
        </div>
      </div>

      {submitError && (
        <div className="cert-submit-error" role="alert">
          <strong>Submission failed:</strong> {submitError}
        </div>
      )}

      <CertificateForm onFormSubmit={handleSubmit} />
    </div>
  );
};

export default AddCertificatePage;
