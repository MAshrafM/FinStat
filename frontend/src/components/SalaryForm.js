// frontend/src/components/SalaryForm.js
import React, { useState, useEffect } from 'react';
import './PaycheckForm.css'; // We can reuse the form styling we already have

const SalaryForm = ({ onFormSubmit, initialData = {}, mode = 'create' }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    title: '',
    position: '',
    year: new Date().getFullYear(),
  });

  const [salaryDetails, setSalaryDetails] = useState({
    effectiveDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    basicSalary: 0,
    basicProduction: 0,
    prepaid: 0,
    variables: 0,
    environment: 0,
    meal: 0,
    shift: 0,
    supervising: 0,
    others: 0,
    bonds: 0,
  });

  useEffect(() => {
    if (mode === 'update' && initialData) {
      // In update mode, pre-fill the main profile data but not the salary form
      setProfileData({
        name: initialData.name || '',
        title: initialData.title || '',
        position: initialData.position || '',
        year: initialData.year || new Date().getFullYear(),
      });
      // Optionally pre-fill the form with the latest salary details to make small edits easier
      if (initialData.currentSalary) {
        setSalaryDetails({ ...initialData.currentSalary, effectiveDate: new Date().toISOString().slice(0, 10) });
      }
    }
  }, [initialData, mode]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSalaryChange = (e) => {
    setSalaryDetails({ ...salaryDetails, [e.target.name]: parseFloat(e.target.value) || 0 });
  };
  
  const handleDateChange = (e) => {
    setSalaryDetails({ ...salaryDetails, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
        ...profileData,
        salaryDetails: salaryDetails,
    };
    onFormSubmit(dataToSubmit);
  };

  const salaryFields = [
    'basicSalary', 'basicProduction', 'prepaid', 'variables', 'environment', 
    'meal', 'shift', 'supervising', 'others', 'bonds'
  ];

  return (
    <form onSubmit={handleSubmit} className="paycheck-form-container">
      <h3>{mode === 'create' ? 'Create New Salary Profile' : `Update Salary for ${profileData.name}`}</h3>

      {mode === 'create' && (
        <>
          <div className="form-group"><label>Name</label><input name="name" value={profileData.name} onChange={handleProfileChange} required /></div>
          <div className="form-group"><label>Title</label><input name="title" value={profileData.title} onChange={handleProfileChange} required /></div>
          <div className="form-group"><label>Position</label><input name="position" value={profileData.position} onChange={handleProfileChange} /></div>
          <div className="form-group"><label>Year</label><input type="number" name="year" value={profileData.year} onChange={handleProfileChange} required /></div>
        </>
      )}

      <div className="form-group">
        <label>Effective Date for these values</label>
        <input type="date" name="effectiveDate" value={salaryDetails.effectiveDate} onChange={handleDateChange} required />
      </div>

      {salaryFields.map(field => (
        <div className="form-group" key={field}>
          <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
          <input type="number" name={field} value={salaryDetails[field]} onChange={handleSalaryChange} />
        </div>
      ))}

      <button type="submit" className="submit-button">
        {mode === 'create' ? 'Create Profile' : 'Submit Update'}
      </button>
    </form>
  );
};

export default SalaryForm;
