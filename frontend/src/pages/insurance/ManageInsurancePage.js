// frontend/src/pages/insurance/ManageInsurancePage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveRecord } from '../../services/socialInsuranceService';
import '../../components/PaycheckForm.css'; // Reuse form styles

const ManageInsurancePage = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [income, setIncome] = useState('');
  const [error, setError] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      await saveRecord({ year, registeredIncome: Number(income) });
      navigate('/social-insurance'); // Go back to the main view on success
    } catch (err) {
      console.error("Failed to save record:", err);
      setError('Failed to save the record.');
    }
  };

  return (
    <div className="page-container">
      <form onSubmit={handleFormSubmit} className="paycheck-form-container" style={{maxWidth: '600px', margin: '0 auto'}}>
        <h3>Add / Update Yearly Record</h3>
        <p>Enter a year and the registered income. If the year already exists, its income will be updated. Otherwise, a new record will be created.</p>
        
        {error && <p style={{color: 'red'}}>{error}</p>}

        <div className="form-group">
          <label htmlFor="year">Year</label>
          <input id="year" type="number" value={year} onChange={e => setYear(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="income">Registered Income</label>
          <input id="income" type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g., 3000" required />
        </div>
        <button type="submit" className="submit-button">Save Record</button>
      </form>
      <Link to="/social-insurance" className="cancel-button" style={{textDecoration: 'none'}}>
        Back to Social Insurance
      </Link>
    </div>
  );
};

export default ManageInsurancePage;
