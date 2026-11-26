// frontend/src/pages/gold/AddGoldPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createGoldLog } from '../../services/goldService';
import GoldForm from './GoldForm';
import './GoldWallet.css';

const AddGoldPage = () => {
    const navigate = useNavigate();
    const handleSubmit = async (data) => {
        await createGoldLog(data);
        navigate('/gold-wallet');
    };
    return (
        <div className="page-container gold-page-container gold-form-page">
            <header className="gold-header">
                <div className="gold-header-title-group">
                    <p className="gold-breadcrumb">Gold &gt; New Transaction</p>
                    <h1>Add Gold Purchase</h1>
                </div>
            </header>
            <GoldForm onFormSubmit={handleSubmit} />
        </div>
    );
};
export default AddGoldPage;
