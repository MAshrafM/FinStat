// frontend/src/pages/salary/SalaryProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaHistory, FaEdit, FaUserEdit, FaPlus, FaTrash, FaCheck, FaCalculator } from 'react-icons/fa';
import { getProfile, saveProfile } from '../../services/salaryService';
import { getSalaryProfiles, deleteSalaryProfile, setDefaultSalaryProfile } from '../../services/salaryProfileService';
import { formatCurrency } from '../../utils/formatters';
import SalaryForm from '../../components/SalaryForm';
import ComponentTable from '../../components/salary/ComponentTable';
import { useToast } from '../../context/ToastContext';
import './SalaryProfile.css';

const SalaryProfilePage = () => {
  const isMobile = window.innerWidth <= 768;
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const singleProfile = await getProfile();
      setProfile(singleProfile);

      try {
        const multiRes = await getSalaryProfiles();
        if (multiRes && multiRes.profiles) {
          setAllProfiles(multiRes.profiles);
        }
      } catch (ignored) {}

      if (!singleProfile) {
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Failed to load salary profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSubmit = async (formData) => {
    try {
      await saveProfile(formData);
      setIsEditing(false);
      addToast('Salary profile saved successfully', 'success');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save salary profile', 'error');
    }
  };

  const handleSetDefault = async (profileId) => {
    try {
      await setDefaultSalaryProfile(profileId);
      addToast('Default salary profile updated', 'success');
      loadData();
    } catch (err) {
      addToast('Failed to set default profile', 'error');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this salary profile?')) return;
    try {
      await deleteSalaryProfile(profileId);
      addToast('Profile deleted successfully', 'success');
      loadData();
    } catch (err) {
      addToast('Failed to delete profile', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <p>Loading salary profile...</p>
      </div>
    );
  }

  // Active current salary record from salaryHistory or components
  const currentSalary =
    profile?.currentSalary ||
    (profile?.salaryHistory && profile.salaryHistory.length > 0
      ? [...profile.salaryHistory].sort(
          (a, b) => new Date(b.effectiveDate || 0) - new Date(a.effectiveDate || 0)
        )[0]
      : null);

  const monthlyGrossEstimate =
    profile?.monthlyGrossEstimate !== undefined
      ? profile.monthlyGrossEstimate
      : currentSalary
      ? (currentSalary.basicSalary || 0) +
        (currentSalary.basicProduction || 0) +
        (currentSalary.variables || 0) +
        (currentSalary.environment || 0) +
        (currentSalary.meal || 0) +
        (currentSalary.shift || 0) +
        (currentSalary.supervising || 0) +
        (currentSalary.others || 0)
      : 0;

  // If creating initial profile
  if (isEditing) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>{profile ? 'Edit Salary Profile' : 'Create Initial Salary Profile'}</h1>
        </div>
        <SalaryForm
          onFormSubmit={handleFormSubmit}
          initialData={profile}
          mode={profile ? 'update' : 'create'}
        />
        {profile && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button className="cancel-button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  if (profile && (!profile.salaryHistory || profile.salaryHistory.length === 0) && !currentSalary && (!profile.components || profile.components.length === 0)) {
    return (
      <div className="page-container">
        <div className="profile-card empty-history-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <div className="header-content">
              <h3>{profile.name}</h3>
              <p>
                {profile.title} - {profile.year}
              </p>
            </div>
            {!isMobile && (
              <Link to="/salary-profile/edit" className="header-action-icon" title="Edit Profile Details">
                <FaUserEdit />
              </Link>
            )}
          </div>
          <div className="card-body">
            <h4>No Salary Details Found</h4>
            <p>This profile doesn't have any salary history yet. Add the first set of salary details to get started.</p>
            <Link to="/salary-profile/update" className="submit-button" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-block' }}>
              Add Initial Salary Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveDateStr = currentSalary?.effectiveDate
    ? new Date(currentSalary.effectiveDate).toLocaleDateString()
    : (profile?.effectiveDate ? new Date(profile.effectiveDate).toLocaleDateString() : 'Active');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Salary Profile</h1>
          <p style={{ color: '#6c757d', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Manage your salary components, compensation structure, and history
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/salary/paychecks/new" className="nav-button" style={{ backgroundColor: '#2c3e50' }}>
            <FaCalculator /> Paycheck Calculator
          </Link>
          <Link to="/salary-profile/update" className="nav-button">
            <FaPlus /> Update Structure
          </Link>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="profile-card" style={{ maxWidth: '900px', margin: '0 auto 2.5rem auto' }}>
        <div className="card-header">
          <div className="header-content">
            <h3>
              {profile.title ? `${profile.title} ` : ''}{profile.name}
            </h3>
            <p>
              {profile.position ? `${profile.position} • ` : ''}{profile.year || new Date().getFullYear()}
            </p>
          </div>
          <Link to="/salary-profile/edit" className="header-action-icon" title="Edit Profile Details">
            <FaUserEdit />
          </Link>
        </div>

        <div className="card-body">
          <h4 style={{ marginBottom: '1rem' }}>Current Salary Details (as of {effectiveDateStr})</h4>
          {profile?.components && profile.components.length > 0 ? (
            <ComponentTable components={profile.components} readOnly={true} />
          ) : currentSalary ? (
            <ul>
              {Object.entries(currentSalary)
                .filter(
                  ([key]) =>
                    !['_id', 'effectiveDate', 'prepaid', 'user', '__v', 'createdAt', 'updatedAt'].includes(key) &&
                    !key.toLowerCase().endsWith('inpiastres') &&
                    typeof currentSalary[key] === 'number'
                )
                .map(([key, value]) => (
                  <li key={key}>
                    <span>
                      {key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim()}
                      :
                    </span>
                    <strong>{formatCurrency(value)}</strong>
                  </li>
                ))}
            </ul>
          ) : (
            <p style={{ color: '#7f8c8d' }}>No salary details logged yet.</p>
          )}
        </div>

        <div className="card-footer">
          <div className="gross-estimate">
            <span>Estimated Monthly Gross:</span>
            <strong>{formatCurrency(monthlyGrossEstimate)}</strong>
          </div>
          {currentSalary?.prepaid !== undefined && (
            <div className="gross-estimate prepaid">
              <span>Monthly Prepaid:</span>
              <strong>{formatCurrency(currentSalary.prepaid || 0)}</strong>
            </div>
          )}
          <div className="card-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            <Link to="/salary-profile/update" className="action-button" title="Update Salary">
              <FaEdit /> Update
            </Link>
            <Link to="/salary-profile/history" className="action-button" style={{ backgroundColor: '#2c3e50', color: '#fff' }} title="View History">
              <FaHistory /> History
            </Link>
          </div>
        </div>
      </div>

      {/* Multiple Profiles Section (if user has more than 1) */}
      {allProfiles.length > 1 && (
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>All Saved Salary Profiles</h3>
          <div className="profile-grid">
            {allProfiles.map((p) => {
              const isDefault = p.isDefault || p._id === profile?._id;
              const gross = p.monthlyGrossEstimate || 0;
              return (
                <div key={p._id} className="profile-card">
                  <div className="card-header" style={{ backgroundColor: isDefault ? '#2c3e50' : '#475569' }}>
                    <div className="header-content">
                      <h3 style={{ fontSize: '1.2rem' }}>{p.name}</h3>
                      <p style={{ fontSize: '0.85rem' }}>{p.title || 'Profile'} {isDefault && '• (Default)'}</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#64748b' }}>Estimated Gross:</span>
                      <strong style={{ color: '#009879' }}>{formatCurrency(gross)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>History / Components:</span>
                      <strong>{(p.salaryHistory || []).length || (p.components || []).length} records</strong>
                    </div>
                  </div>
                  <div className="card-footer" style={{ padding: '0.75rem 1rem' }}>
                    {!isDefault && (
                      <button
                        onClick={() => handleSetDefault(p._id)}
                        className="action-button"
                        style={{ backgroundColor: '#009879', color: '#fff', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        <FaCheck /> Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProfile(p._id)}
                      className="action-button"
                      style={{ backgroundColor: '#e74c3c', color: '#fff', fontSize: '0.8rem', padding: '0.4rem 0.8rem', marginLeft: 'auto' }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryProfilePage;
