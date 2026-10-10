// frontend/src/pages/certificates/CertificateForm.js
import React, { useState, useEffect } from 'react';

const CertificateForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        period: '',
        amount: '',
        interest: '',
        payoutInterval: 'monthly',
        lastPayoutDate: '',
        startDate: new Date().toISOString().split('T')[0],
    });
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                name: initialData.name || '',
                period: initialData.period || '',
                amount: initialData.amount || '',
                interest: initialData.interest || '',
                payoutInterval: initialData.payoutInterval || 'monthly',
                lastPayoutDate: initialData.lastPayoutDate ? new Date(initialData.lastPayoutDate).toISOString().split('T')[0] : '',
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
            });
        }
    }, [initialData, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setValidationError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation for lastPayoutDate
        if (formData.lastPayoutDate) {
            const lastPayout = new Date(formData.lastPayoutDate);
            const start = new Date(formData.startDate);
            const today = new Date();

            if (lastPayout < start) {
                setValidationError('Last payout date cannot be earlier than certificate start date.');
                return;
            }
            if (lastPayout > today) {
                setValidationError('Last payout date cannot be in the future.');
                return;
            }
        }

        onFormSubmit({
            ...formData,
            period: parseInt(formData.period, 10),
            amount: parseFloat(formData.amount),
            interest: parseFloat(formData.interest),
            lastPayoutDate: formData.lastPayoutDate ? new Date(formData.lastPayoutDate).toISOString() : undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="standard-form">
            {validationError && (
                <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px',
                }}>
                    {validationError}
                </div>
            )}

            <div className="form-group">
                <label>Certificate Name</label>
                <input type="text" name="name" placeholder="e.g., Platinum 3Y Certificate" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Period (in months)</label>
                <input type="number" name="period" placeholder="e.g., 36" value={formData.period} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Principal Amount (EGP)</label>
                <input type="number" step="any" name="amount" placeholder="e.g., 50000" value={formData.amount} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Annual Interest Rate (%)</label>
                <input type="number" step="any" name="interest" placeholder="e.g., 18.5" value={formData.interest} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Payout Frequency Interval</label>
                <select name="payoutInterval" value={formData.payoutInterval} onChange={handleChange} required>
                    <option value="monthly">Monthly (Every 1 month)</option>
                    <option value="quarterly">Quarterly (Every 3 months)</option>
                    <option value="annually">Annually (Every 12 months)</option>
                </select>
            </div>

            <div className="form-group">
                <label>Start / Issue Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Last Interest Payout Date (Optional)</label>
                <input type="date" name="lastPayoutDate" value={formData.lastPayoutDate} onChange={handleChange} />
                <small style={{ color: '#6b7280', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                    The date of the last interest disbursement. If no payout has occurred yet, leave blank (accrual starts from start date).
                </small>
            </div>

            <button type="submit" className="action-button">{isEdit ? 'Update' : 'Create'} Certificate</button>
        </form>
    );
};

export default CertificateForm;
