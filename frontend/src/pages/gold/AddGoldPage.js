// frontend/src/pages/gold/AddGoldPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createGoldLog } from '../../services/goldService';
import GoldForm from './GoldForm';

const AddGoldPage = () => {
    const navigate = useNavigate();
    const handleSubmit = async (data) => {
        await createGoldLog(data);
        navigate('/gold-wallet');
    };
    return (
        <div className="page-container">
            <div className="page-header"><h1>Add Gold Purchase</h1></div>
            <GoldForm onFormSubmit={handleSubmit} />
        </div>
    );
};
export default AddGoldPage;
