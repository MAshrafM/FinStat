// frontend/src/pages/taxes/ManageTaxBracketsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBrackets, updateBrackets } from '../../services/taxService';
import '../../components/PaycheckForm.css'; // Reuse form styles
import './TaxesPage.css'; // Reuse tax card styles

const ManageTaxBracketsPage = () => {
  const navigate = useNavigate();
  const [brackets, setBrackets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getBrackets()
      .then(data => setBrackets(data.brackets))
      .catch(err => setError('Could not load existing brackets.'));
  }, []);

  const handleInputChange = (index, field, value) => {
    const newBrackets = [...brackets];
    // Convert to number, but allow empty string for typing
    newBrackets[index][field] = value === '' ? '' : Number(value);
    setBrackets(newBrackets);
  };

  const handleRateChange = (index, field, value) => {
    const newBrackets = [...brackets];
    // Rate is a percentage, so handle it as a float
    newBrackets[index][field] = value === '' ? '' : parseFloat(value) / 100;
    setBrackets(newBrackets);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Basic validation to ensure no empty fields
      if (brackets.some(b => b.from === '' || b.to === '' || b.rate === '')) {
        setError('All fields are required. Please do not leave any inputs empty.');
        return;
      }
      await updateBrackets(brackets);
      navigate('/taxes');
    } catch (err) {
      console.error("Failed to update brackets:", err);
      setError('Failed to save the brackets. Please check the console.');
    }
  };

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="paycheck-form-container" style={{maxWidth: '800px'}}>
        <h3>Manage Tax Brackets</h3>
        <p>Update the values for each tax level. The "From" value of a level should match the "To" value of the previous level.</p>
        
        {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}

        {brackets.map((bracket, index) => (
          <div key={bracket.level || index} className="tax-bracket-edit-row">
            <div className="form-group level-indicator">
              <label>Level {bracket.level}</label>
            </div>
            <div className="form-group">
              <label htmlFor={`from-${index}`}>From ($)</label>
              <input id={`from-${index}`} type="number" value={bracket.from} onChange={(e) => handleInputChange(index, 'from', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor={`to-${index}`}>To ($)</label>
              <input id={`to-${index}`} type="number" value={bracket.to} onChange={(e) => handleInputChange(index, 'to', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor={`rate-${index}`}>Rate (%)</label>
              <input id={`rate-${index}`} type="number" step="0.1" value={bracket.rate * 100} onChange={(e) => handleRateChange(index, 'rate', e.target.value)} />
            </div>
          </div>
        ))}
        
        <button type="submit" className="submit-button" style={{marginTop: '2rem'}}>Save All Changes</button>
      </form>
      <Link to="/taxes" className="cancel-button" style={{textDecoration: 'none'}}>
        Back to Taxes
      </Link>
    </div>
  );
};

export default ManageTaxBracketsPage;
