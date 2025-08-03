// frontend/src/pages/mutual-funds/AddMutualFundPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createTrade } from '../../services/mutualFundService';
import MutualFundForm from './MutualFundForm';

const AddMutualFundPage = () => {
    const navigate = useNavigate();
    const handleFormSubmit = async (formData) => {
        try {
            await createTrade(formData);
            navigate('/mutual-funds');
        } catch (err) {
            console.error("Failed to create transaction:", err);
            alert('Error creating transaction. See console for details.');
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
