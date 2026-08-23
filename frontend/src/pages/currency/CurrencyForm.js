// frontend/src/pages/currency/CurrencyForm.js
import React, { useState, useEffect } from 'react';
import { currencyMap } from '../../context/CurrContext';

const CURRENCY_OPTIONS = Object.keys(currencyMap);

const CurrencyForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
    const [formData, setFormData] = useState({
        name: CURRENCY_OPTIONS[0] || '',
        amount: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                name: initialData.name || CURRENCY_OPTIONS[0] || '',
                amount: initialData.amount || '',
                price: initialData.price || '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
            });
        }
    }, [initialData, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFormSubmit({
            ...formData,
            amount: parseFloat(formData.amount),
            price: parseFloat(formData.price),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-group">
                <label>Currency Name</label>
                <select name="name" value={formData.name} onChange={handleChange} required>
                    {CURRENCY_OPTIONS.map((curr) => (
                        <option key={curr} value={curr}>
                            {curr}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group"><label>Principal Amount</label><input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} required /></div>
            <div className="form-group"><label>Price Paid</label><input type="number" step="any" name="price" placeholder="e.g., 51.0" value={formData.price} onChange={handleChange} required /></div>
            <div className="form-group"><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
            <button type="submit" className="action-button">{isEdit ? 'Update' : 'Create'} Currency</button>
        </form>
    );
};
export default CurrencyForm;

