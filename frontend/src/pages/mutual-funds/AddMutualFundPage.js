// frontend/src/pages/mutual-funds/AddMutualFundPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createTrade } from '../../services/mutualFundService';
import MutualFundForm from './MutualFundForm';
import { useToast } from '../../context/ToastContext';

const AddMutualFundPage = () => {
    const navigate = useNavigate();
    const { showToast, addToast } = useToast();
    const notify = showToast || addToast;
    const handleFormSubmit = async (formData) => {
        try {
            await createTrade(formData);
            navigate('/mutual-funds');
        } catch (err) {
            console.error("Failed to create transaction:", err);
            if (notify) notify(err.response?.data?.message || err.message || 'Error creating transaction', 'error');
        }
    };
    return (
        <div className="page-container">
            <div className="page-header"><h1>Add New Mutual Fund Transaction</h1></div>
            <MutualFundForm onFormSubmit={handleFormSubmit} />
        </div>
    );
};
export default AddMutualFundPage;
