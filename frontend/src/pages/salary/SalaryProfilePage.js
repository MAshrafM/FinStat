// frontend/src/pages/salary/SalaryProfilePage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, saveProfile } from '../../services/salaryService';
import { formatCurrency } from '../../utils/formatters';
import { FaHistory, FaEdit, FaUserEdit } from 'react-icons/fa';
import SalaryForm from '../../components/SalaryForm'; // We'll reuse this
import './SalaryProfile.css';

const SalaryProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    setIsLoading(true);
    getProfile().then(data => {
      setProfile(data);
      // If no profile exists, immediately go into editing/creation mode.
      if (!data) {
        setIsEditing(true);
      }
      setIsLoading(false);
    });
  };

  const handleFormSubmit = async (formData) => {
    await saveProfile(formData);
    setIsEditing(false);
    loadProfile(); // Reload the profile to show the latest data
  };

  if (isLoading) {
    return <div className="page-container">Loading...</div>;
  }

  if (profile && profile.salaryHistory.length === 0) {
    return (
      <div className="page-container">
        <div className="profile-card empty-history-card" style={{maxWidth: '800px', margin: '0 auto'}}>
           <div className="card-header">
            <div className="header-content">
              <h3>{profile.name}</h3>
              <p>{profile.title} - {profile.year}</p>
            </div>
            <Link to="/salary-profile/edit" className="header-action-icon" title="Edit Profile Details">
              <FaUserEdit />
            </Link>
          </div>
          <div className="card-body">
            <h4>No Salary Details Found</h4>
            <p>This profile doesn't have any salary history yet. Add the first set of salary details to get started.</p>
            <Link to="/salary-profile/update" className="submit-button" style={{marginTop: '1rem', textDecoration: 'none'}}>
              Add Initial Salary Details
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // If we are in editing mode (or creating for the first time)
  if (isEditing) {
    return (
      <div className="page-container">
        <SalaryForm
          onFormSubmit={handleFormSubmit}
          initialData={profile} // Pass existing profile data to pre-fill
          mode={profile ? 'update' : 'create'}
        />
        {/* Allow canceling the edit if a profile already exists */}
        {profile && <button className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>}
      </div>
    );
  }

  // Default view: Display the profile
  return (
    <div className="page-container">
      <div className="profile-card" style={{maxWidth: '800px', margin: '0 auto'}}>
        <div className="card-header">
            <div className="header-content">
              <h3>{profile.title} {profile.name}</h3>
              <p>{profile.position} - {profile.year}</p>
            </div>
          <Link to="/salary-profile/edit" className="header-action-icon" title="Edit Profile Details">
            <FaUserEdit />
          </Link>
        </div>
        <div className="card-body">
          <h4>Current Salary Details (as of {new Date(profile.currentSalary.effectiveDate).toLocaleDateString()})</h4>
          <ul>
            {Object.entries(profile.currentSalary)
              .filter(([key]) => !['_id', 'effectiveDate', 'prepaid'].includes(key))
              .map(([key, value]) => (
                <li key={key}>
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                  <strong>{formatCurrency(value)}</strong>
                </li>
              ))}
          </ul>
        </div>
        <div className="card-footer">
          <div className="gross-estimate">
            <span>Monthly Gross Estimate:</span>
            <strong>{formatCurrency(profile.monthlyGrossEstimate)}</strong>
          </div>
          <div className="gross-estimate prepaid">
            <span>Monthly Prepaid:</span>
            <strong>{formatCurrency(profile.currentSalary.prepaid)}</strong>
          </div>
          <div className="card-actions">
            <Link to="/salary-profile/update" className="action-button" title="Update Salary">
                <FaEdit /> Update
            </Link>
            <Link to="/salary-profile/history" className="action-button" title="View History">
              <FaHistory /> History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryProfilePage;
