// frontend/src/pages/mutual-funds/EditMutualFundPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTradeById, updateTrade } from '../../services/mutualFundService';
import MutualFundForm from './MutualFundForm';
import { useToast } from '../../context/ToastContext';

const EditMutualFundPage = () => {
    const navigate = useNavigate();
    const { showToast, addToast } = useToast();
    const notify = showToast || addToast;
    const { id } = useParams();
    const [initialData, setInitialData] = useState(null);

    useEffect(() => {
        getTradeById(id)
            .then(data => setInitialData(data))
            .catch(err => console.error("Failed to fetch transaction:", err));
    }, [id]);

    const handleFormSubmit = async (formData) => {
        try {
            await updateTrade(id, formData);
            navigate('/mutual-funds');
        } catch (err) {
            console.error("Failed to update transaction:", err);
            if (notify) notify(err.response?.data?.message || err.message || 'Error updating transaction', 'error');
        }
    };

    if (!initialData) return <p>Loading transaction data...</p>;

    return (
        <div className="page-container">
            <div className="page-header"><h1>Edit Mutual Fund Transaction</h1></div>
            <MutualFundForm onFormSubmit={handleFormSubmit} initialData={initialData} isEdit={true} />
        </div>
    );
};
export default EditMutualFundPage;
