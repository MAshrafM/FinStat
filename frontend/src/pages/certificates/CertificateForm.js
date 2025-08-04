// frontend/src/pages/certificates/CertificateForm.js
import React, { useState, useEffect } from 'react';

const CertificateForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        period: '',
        amount: '',
        interest: '',
        startDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                name: initialData.name || '',
                period: initialData.period || '',
                amount: initialData.amount || '',
                interest: initialData.interest || '',
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
            });
        }
    }, [initialData, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFormSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-group"><label>Certificate Name</label><input type="text" name="name" placeholder="e.g., Platinum Certificate" value={formData.name} onChange={handleChange} required /></div>
            <div className="form-group"><label>Period (in months)</label><input type="number" name="period" placeholder="e.g., 36" value={formData.period} onChange={handleChange} required /></div>
            <div className="form-group"><label>Principal Amount</label><input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} required /></div>
            <div className="form-group"><label>Annual Interest Rate (%)</label><input type="number" step="any" name="interest" placeholder="e.g., 18.5" value={formData.interest} onChange={handleChange} required /></div>
            <div className="form-group"><label>Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required /></div>
            <button type="submit" className="action-button">{isEdit ? 'Update' : 'Create'} Certificate</button>
        </form>
    );
};
export default CertificateForm;
