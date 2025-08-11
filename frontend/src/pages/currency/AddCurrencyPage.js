// frontend/src/pages/currency/AddCurrencyPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createCurrency } from '../../services/currencyService';
import CurrencyForm from './CurrencyForm';

const AddCurrencyPage = () => {
    const navigate = useNavigate();
    const handleSubmit = async (data) => {
        await createCurrency(data);
        navigate('/currency');
    };
    return (
        <div className="page-container">
            <div className="page-header"><h1>Add New Currency</h1></div>
            <CurrencyForm onFormSubmit={handleSubmit} />
        </div>
    );
};
export default AddCurrencyPage;
