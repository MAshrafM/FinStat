// frontend/src/pages/certificates/EditCertificatePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCertificateById, updateCertificate } from '../../services/certificateService';
import CertificateForm from './CertificateForm';

const EditCertificatePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [certificate, setCertificate] = useState(null);

    useEffect(() => {
        getCertificateById(id).then(setCertificate);
    }, [id]);

    const handleSubmit = async (data) => {
        await updateCertificate(id, data);
        navigate('/certificates');
    };

    if (!certificate) return <p>Loading...</p>;

    return (
        <div className="page-container">
            <div className="page-header"><h1>Edit Bank Certificate</h1></div>
            <CertificateForm onFormSubmit={handleSubmit} initialData={certificate} isEdit={true} />
        </div>
    );
};
export default EditCertificatePage;
