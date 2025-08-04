// frontend/src/pages/gold/EditGoldPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGoldLogById, updateGoldLog } from '../../services/goldService';
import GoldForm from './GoldForm';

const EditGoldPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [log, setLog] = useState(null);

    useEffect(() => {
        getGoldLogById(id).then(setLog);
    }, [id]);

    const handleSubmit = async (data) => {
        await updateGoldLog(id, data);
        navigate('/gold-wallet');
    };

    if (!log) return <p>Loading...</p>;

    return (
        <div className="page-container">
            <div className="page-header"><h1>Edit Gold Purchase</h1></div>
            <GoldForm onFormSubmit={handleSubmit} initialData={log} isEdit={true} />
        </div>
    );
};
export default EditGoldPage;
