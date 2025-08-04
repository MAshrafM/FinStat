// frontend/src/pages/certificates/AddCertificatePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createCertificate } from '../../services/certificateService';
import CertificateForm from './CertificateForm';

const AddCertificatePage = () => {
    const navigate = useNavigate();
    const handleSubmit = async (data) => {
        await createCertificate(data);
        navigate('/certificates');
    };
    return (
        <div className="page-container">
            <div className="page-header"><h1>Add New Bank Certificate</h1></div>
            <CertificateForm onFormSubmit={handleSubmit} />
        </div>
    );
};
export default AddCertificatePage;
