// frontend/src/pages/gold/EditGoldPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGoldLogById, updateGoldLog } from '../../services/goldService';
import { Loading } from '../../components/ui';
import GoldForm from './GoldForm';
import './GoldWallet.css';

const EditGoldPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [log, setLog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let isActive = true;
        setIsLoading(true);
        setLoadError('');

        getGoldLogById(id)
            .then((data) => {
                if (isActive) setLog(data);
            })
            .catch((err) => {
                if (isActive) setLoadError(err?.message || 'Failed to load gold entry.');
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [id]);

    const handleSubmit = async (data) => {
        await updateGoldLog(id, data);
        navigate('/gold-wallet');
    };

    return (
        <div className="page-container gold-page-container gold-form-page">
            <header className="gold-header">
                <div className="gold-header-title-group">
                    <p className="gold-breadcrumb">Gold &gt; Edit Transaction</p>
                    <h1>Edit Gold Purchase</h1>
                </div>
            </header>

            {isLoading ? (
                <div className="gold-loading-wrap">
                    <Loading variant="form-field" text="Loading gold entry..." />
                </div>
            ) : loadError ? (
                <div className="gold-error-card" role="alert">
                    <h2>Unable to load gold entry</h2>
                    <p>{loadError}</p>
                </div>
            ) : (
                <GoldForm onFormSubmit={handleSubmit} initialData={log || {}} isEdit />
            )}
        </div>
    );
};
export default EditGoldPage;
