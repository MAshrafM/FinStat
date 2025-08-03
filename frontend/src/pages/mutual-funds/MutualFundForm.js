// frontend/src/pages/mutual-funds/MutualFundForm.js
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';

const MutualFundForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        name: '',
        code: '',
        type: 'Buy',
        units: '',
        price: '',
        fees: '',
        totalValue: 0,
    });

    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
                name: initialData.name || '',
                code: initialData.code || '',
                type: initialData.type || 'Buy',
                units: initialData.units || '',
                price: initialData.price || '',
                fees: initialData.fees || '',
                totalValue: initialData.totalValue || 0,
            });
        }
    }, [initialData, isEdit]);

    // Effect to auto-calculate totalValue
    useEffect(() => {
        const { type, units, price, fees } = formData;
        const numUnits = parseFloat(units) || 0;
        const numPrice = parseFloat(price) || 0;
        const numFees = parseFloat(fees) || 0;
        let total = 0;

        if (type === 'Buy') {
            total = (numUnits * numPrice) + numFees;
        } else if (type === 'Sell') {
            total = (numUnits * numPrice) - numFees;
        }

        if (['Buy', 'Sell'].includes(type)) {
            setFormData(prev => ({ ...prev, totalValue: total }));
        }
    }, [formData.type, formData.units, formData.price, formData.fees]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCashChange = (e) => {
        // For cash coupons, the entered value is the totalValue
        setFormData(prev => ({ ...prev, totalValue: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFormSubmit(formData);
    };

    const isTrade = ['Buy', 'Sell'].includes(formData.type);

    return (
        <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Fund Name</label>
                <input type="text" name="name" placeholder="e.g., AZ Opportunity Fund" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Fund Code</label>
                <input type="text" name="code" placeholder="e.g., AZO" value={formData.code} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>Transaction Type</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                    <option value="Coupon">Cash Coupon</option>
                </select>
            </div>

            {formData.type === 'Coupon' && (
                <div className="form-group">
                    <label>Coupon Amount</label>
                    <input type="number" step="0.01" name="totalValue" placeholder="Enter total cash received" value={formData.totalValue} onChange={handleCashChange} required />
                </div>
            )}

            {isTrade && (
                <>
                    <div className="form-group">
                        <label>Units</label>
                        <input type="number" step="any" name="units" value={formData.units} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Price per Unit</label>
                        <input type="number" step="any" name="price" value={formData.price} onChange={handleChange} required />
                    </div>
                </>
            )}

            <div className="form-group">
                <label>Fees</label>
                <input type="number" step="any" name="fees" value={formData.fees} onChange={handleChange} />
            </div>

            <div className="form-group">
                <label>Total Value</label>
                <input type="text" value={formatCurrency(formData.totalValue)} readOnly disabled className="total-display" />
            </div>

            <button type="submit" className="action-button">{isEdit ? 'Update' : 'Create'} Transaction</button>
        </form>
    );
};

export default MutualFundForm;
