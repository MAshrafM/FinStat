// frontend/src/pages/gold/GoldForm.js
import React, { useState, useEffect } from 'react';

const GoldForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        item: '',
        karat: '24',
        weight: '',
        price: '',
        paid: '',
        seller: '',
    });

    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
                item: initialData.item || '',
                karat: initialData.karat || '24',
                weight: initialData.weight || '',
                price: initialData.price || '',
                paid: initialData.paid || '',
                seller: initialData.seller || '',
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
            <div className="form-group"><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
            <div className="form-group"><label>Item Description</label><input type="text" name="item" placeholder="e.g., 1oz Bar, Wedding Ring" value={formData.item} onChange={handleChange} required /></div>
            <div className="form-group"><label>Karat</label><input type="number" name="karat" placeholder="24, 22, 21, 18..." value={formData.karat} onChange={handleChange} required /></div>
            <div className="form-group"><label>Weight (grams)</label><input type="number" step="any" name="weight" value={formData.weight} onChange={handleChange} required /></div>
            <div className="form-group"><label>Price per Gram</label><input type="number" step="any" name="price" value={formData.price} onChange={handleChange} required /></div>
            <div className="form-group"><label>Total Amount Paid</label><input type="number" step="any" name="paid" value={formData.paid} onChange={handleChange} required /></div>
            <div className="form-group"><label>Seller (Optional)</label><input type="text" name="seller" value={formData.seller} onChange={handleChange} /></div>
            <button type="submit" className="action-button">{isEdit ? 'Update' : 'Create'} Log</button>
        </form>
    );
};
export default GoldForm;
