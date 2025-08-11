// frontend/src/pages/certificates/EditCertificatePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrencyById, updateCurrency } from '../../services/currencyService';
import CurrencyForm from './CurrencyForm';

const EditCurrencyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currency, setCurrency] = useState(null);

    useEffect(() => {
        getCurrencyById(id).then(setCurrency);
    }, [id]);

    const handleSubmit = async (data) => {
        await updateCurrency(id, data);
        navigate('/currency');
    };

    if (!currency) return <p>Loading...</p>;

    return (
        <div className="page-container">
            <div className="page-header"><h1>Edit Foreign Currency</h1></div>
            <CurrencyForm onFormSubmit={handleSubmit} initialData={currency} isEdit={true} />
        </div>
    );
};
export default EditCurrencyPage;
