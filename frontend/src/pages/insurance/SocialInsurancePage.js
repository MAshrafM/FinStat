// frontend/src/pages/insurance/SocialInsurancePage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPaychecks } from '../../services/paycheckService';
import { getRecords } from '../../services/socialInsuranceService';
import { formatCurrency } from '../../utils/formatters';
import { FaEdit } from 'react-icons/fa';
import '../salary/SalaryProfile.css'; // Reuse styles

const SocialInsurancePage = () => {
  const [insuranceRecords, setInsuranceRecords] = useState([]);
  const [paychecks, setPaychecks] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getRecords().then(setInsuranceRecords);
    getPaychecks().then(setPaychecks);
  };


  // This function calculates the remaining burden for a given year
  const calculateRemaining = (record) => {
    const yearPaychecks = paychecks.filter(p => p.month.startsWith(record.year));
    const totalDeducted = yearPaychecks.reduce((sum, p) => sum + p.insuranceDeduction, 0);
    return record.burden - totalDeducted;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Social Insurance</h1>
        <Link to="/social-insurance/manage" className="nav-button">
          <FaEdit /> Manage Yearly Records
        </Link>
      </div>

      {/* Display Cards */}
      <div className="profile-grid">
        {insuranceRecords.map(record => (
          <div key={record.year} className="profile-card">
            <div className="card-header"><h3>{record.year}</h3></div>
            <div className="card-body">
              <ul>
                <li><span>Registered Income:</span><strong>{formatCurrency(record.registeredIncome)}</strong></li>
                <li><span>Yearly Income:</span><strong>{formatCurrency(record.yearlyIncome)}</strong></li>
                <li><span>Individual Share:</span><strong>{(record.individualShare * 100)}%</strong></li>
                <li><span>Yearly Burden:</span><strong>{formatCurrency(record.burden)}</strong></li>
                <li style={{backgroundColor: '#f1c40f20'}}><span>Remaining Burden:</span><strong>{formatCurrency(calculateRemaining(record))}</strong></li>
              </ul>
              <h4 style={{marginTop: '1.5rem'}}>Monthly Deductions:</h4>
              <ul>
                {paychecks.filter(p => p.month.startsWith(record.year) && p.insuranceDeduction > 0).map(p => (
                  <li key={p._id}><span>{p.month}:</span><strong>{formatCurrency(p.insuranceDeduction)}</strong></li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialInsurancePage;
