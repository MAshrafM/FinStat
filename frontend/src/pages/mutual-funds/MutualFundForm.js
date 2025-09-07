// frontend/src/pages/mutual-funds/MutualFundForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { getMutualFundByCode, getAllMutualFundTrades } from '../../services/mutualFundService'; // Add these service functions

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

    const [codeSearching, setCodeSearching] = useState(false);
    const [codeFound, setCodeFound] = useState(false);
    const [unitsCalculating, setUnitsCalculating] = useState(false);
    const [totalUnitsForCode, setTotalUnitsForCode] = useState(0);

    
    const calculateTotalUnits = useCallback(async (code) => {
        if (!code) return;
        
        setUnitsCalculating(true);
        try {
            // Get all transactions for this fund code
            const allTransactions = await getAllMutualFundTrades();
            const codeTransactions = allTransactions.filter(t => t.code === code);
            
            // Calculate net units (Buy adds, Sell subtracts)
            const totalUnits = codeTransactions.reduce((sum, transaction) => {
                const units = parseFloat(transaction.units) || 0;
                if (transaction.type === 'Buy') {
                    return sum + units;
                } else if (transaction.type === 'Sell') {
                    return sum - units;
                }
                return sum; // Coupons don't affect unit count
            }, 0);
            
            setTotalUnitsForCode(totalUnits);
            
            // Auto-fill units for coupon transaction
            if (formData.type === 'Coupon') {
                setFormData(prev => ({
                    ...prev,
                    units: totalUnits.toString()
                }));
            }
        } catch (error) {
            console.error('Error calculating total units:', error);
            setTotalUnitsForCode(0);
        }
        setUnitsCalculating(false);
    }, [formData.type]);


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
    }, [formData]);

    // Effect to lookup fund details when code changes
    useEffect(() => {
        const lookupFundByCode = async () => {
            if (formData.code && formData.code.length >= 2) {
                setCodeSearching(true);
                try {
                    let fundData = await getMutualFundByCode(formData.code);
                    if (fundData) {
                        if (fundData.length > 0) {
                            setFormData(prev => ({
                                ...prev,
                                name: fundData[0].name
                            }));
                            setCodeFound(true);
                        }
                        
                        // If it's a coupon transaction, calculate total units
                        if (formData.type === 'Coupon') {
                            await calculateTotalUnits(formData.code);
                        }
                    } else {
                        setCodeFound(false);
                        setTotalUnitsForCode(0);
                    }
                } catch (error) {
                    console.error('Error looking up fund:', error);
                    setCodeFound(false);
                    setTotalUnitsForCode(0);
                }
                setCodeSearching(false);
            } else {
                setCodeFound(false);
                setTotalUnitsForCode(0);
            }
        };

        // Debounce the lookup to avoid too many API calls
        const timeoutId = setTimeout(lookupFundByCode, 300);
        return () => clearTimeout(timeoutId);
    }, [formData.code, formData.type, calculateTotalUnits]);

    // Effect to calculate units when transaction type changes to Coupon
    useEffect(() => {
        if (formData.type === 'Coupon' && formData.code && codeFound) {
            calculateTotalUnits(formData.code);
        } else if (formData.type !== 'Coupon') {
            setTotalUnitsForCode(0);
        }
    }, [formData.type, formData.code, codeFound, calculateTotalUnits]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Reset code status when manually changing name
        if (name === 'name') {
            setCodeFound(false);
        }
    };

    const handleCodeChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            code: value.toUpperCase(),
            name: '' // Clear name when code changes
        }));
        setCodeFound(false);
    };

    const handleCashChange = (e) => {
        const { name, value } = e.target
        let newData = { ...formData, [name]: value };
        // Handle cash input for coupon transactions
        let price = parseFloat(newData.price) || 0;
        let fees = parseFloat(newData.fees) || 0;
        let totalValue = price * (formData.units ? parseFloat(formData.units) : 0) - fees; // Default to 1 unit if none specified
        setFormData(prev => ({ ...prev, price: price, fees: fees, totalValue: totalValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFormSubmit(formData);
    };

    const isTrade = ['Buy', 'Sell'].includes(formData.type);
    const isCoupon = formData.type === 'Coupon';

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="standard-form">
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>Fund Code</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            name="code" 
                            placeholder="e.g., AZO" 
                            value={formData.code} 
                            onChange={handleCodeChange} 
                            required 
                            style={{
                                paddingRight: '2.5rem',
                                borderColor: codeFound ? '#10b981' : (formData.code && !codeSearching && !codeFound ? '#ef4444' : '#d1d5db')
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1.2rem'
                        }}>
                            {codeSearching ? (
                                <span style={{ color: '#6b7280' }}>🔍</span>
                            ) : codeFound ? (
                                <span style={{ color: '#10b981' }}>✅</span>
                            ) : formData.code && !codeSearching ? (
                                <span style={{ color: '#ef4444' }}>❌</span>
                            ) : null}
                        </div>
                    </div>
                    {codeSearching && (
                        <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                            Looking up fund details...
                        </small>
                    )}
                    {formData.code && !codeSearching && !codeFound && (
                        <small style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                            Fund code not found. Please enter the fund name manually.
                        </small>
                    )}
                </div>

                <div className="form-group">
                    <label>Fund Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        placeholder={codeFound ? formData.name : "e.g., AZ Opportunity Fund"}
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                        readOnly={codeFound}
                        style={{
                            backgroundColor: codeFound ? '#f9fafb' : 'white',
                            cursor: codeFound ? 'not-allowed' : 'text'
                        }}
                    />
                    {codeFound && (
                        <small style={{ color: '#10b981', fontSize: '0.8rem' }}>
                            ✓ Auto-filled from database {formData.name}
                        </small>
                    )}
                </div>

                <div className="form-group">
                    <label>Transaction Type</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="Buy">Buy</option>
                        <option value="Sell">Sell</option>
                        <option value="Coupon">Cash Coupon</option>
                    </select>
                </div>

                {isCoupon && (
                    <>
                        <div className="form-group">
                            <label>Units (Auto-calculated)</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="number" 
                                    step="any" 
                                    name="units" 
                                    value={formData.units} 
                                    onChange={handleChange}
                                    readOnly={codeFound && totalUnitsForCode > 0}
                                    style={{
                                        backgroundColor: (codeFound && totalUnitsForCode > 0) ? '#f0f9ff' : 'white',
                                        cursor: (codeFound && totalUnitsForCode > 0) ? 'not-allowed' : 'text'
                                    }}
                                />
                                {unitsCalculating && (
                                    <div style={{
                                        position: 'absolute',
                                        right: '0.5rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '1rem',
                                        color: '#6b7280'
                                    }}>
                                        ⏳
                                    </div>
                                )}
                            </div>
                            {codeFound && totalUnitsForCode > 0 && (
                                <small style={{ color: '#0ea5e9', fontSize: '0.8rem' }}>
                                    📊 Total units owned: {totalUnitsForCode.toFixed(4)} (auto-calculated)
                                </small>
                            )}
                            {codeFound && totalUnitsForCode === 0 && (
                                <small style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                                    ⚠️ No units found for this fund code
                                </small>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Coupon Amount</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                name="price" 
                                placeholder="Enter total cash received"
                                value={formData.price} 
                                onChange={handleCashChange} 
                                required 
                            />
                        </div>
                    </>
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
                    <input type="number" step="any" name="fees" value={formData.fees} onChange={isCoupon ? handleCashChange : handleChange} />
                </div>

                
                    <div className="form-group">
                        <label>Total Value</label>
                        <input type="text" value={formatCurrency(formData.totalValue)} readOnly disabled className="total-display" />
                    </div>
                

                <button type="submit" className="action-button">
                    {isEdit ? 'Update' : 'Create'} Transaction
                </button>
            </form>
        </div>
    );
};

export default MutualFundForm;