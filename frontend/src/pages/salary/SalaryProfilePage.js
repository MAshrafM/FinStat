// frontend/src/pages/salary/SalaryProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaHistory, FaEdit, FaUserEdit, FaPlus, FaTrash, FaCheck, FaCalculator, FaSlidersH } from 'react-icons/fa';
import { getProfile, saveProfile } from '../../services/salaryService';
import { getSalaryProfiles, deleteSalaryProfile, setDefaultSalaryProfile } from '../../services/salaryProfileService';
import { formatCurrency } from '../../utils/formatters';
import SalaryForm from '../../components/SalaryForm';
import ComponentTable from '../../components/salary/ComponentTable';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import { useToast } from '../../context/ToastContext';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import './SalaryProfile.css';

const SalaryProfilePage = () => {
  const { canModify } = useCanModify();
  const isMobile = window.innerWidth <= 768;
  const { addToast } = useToast();

  const [profileToDelete, setProfileToDelete] = useState(null);
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
    if (!canModify) return;
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
    if (!canModify) return;
    try {
      await setDefaultSalaryProfile(profileId);
      addToast('Default salary profile updated', 'success');
      loadData();
    } catch (err) {
      addToast('Failed to set default profile', 'error');
    }
  };

  const handleDeleteProfile = (profileId) => {
    if (!canModify) return;
    setProfileToDelete(profileId);
  };

  const handleConfirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      await deleteSalaryProfile(profileToDelete);
      addToast('Profile deleted successfully', 'success');
      setProfileToDelete(null);
      loadData();
    } catch (err) {
      addToast('Failed to delete profile', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="fs-page salary-profile-page">
        <Loading variant="card" text="Loading salary profile..." />
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
      <div className="fs-page salary-profile-page">
        <PageHeader
          title={profile ? 'Edit Salary Profile' : 'Create Initial Salary Profile'}
        />
        <SalaryForm
          onFormSubmit={handleFormSubmit}
          initialData={profile}
          mode={profile ? 'update' : 'create'}
        />
        {profile && (
          <div className="salary-cancel-wrapper">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (profile && (!profile.salaryHistory || profile.salaryHistory.length === 0) && !currentSalary && (!profile.components || profile.components.length === 0)) {
    return (
      <div className="fs-page salary-profile-page">
        <div className="salary-profile-card profile-card empty-history-card">
          <div className="card-header">
            <div className="header-content">
              <h2 className="profile-card-name">{profile.name}</h2>
              <p>
                {profile.title} - {profile.year}
              </p>
            </div>
            {!isMobile && (
              <ProtectedAction tooltip="View-only access">
                <Link to="/salary-profile/edit" className="header-action-icon" title="Edit Profile Details">
                  <FaUserEdit />
                </Link>
              </ProtectedAction>
            )}
          </div>
          <div className="card-body salary-empty-state">
            <h3 className="empty-state-heading">No Salary Details Found</h3>
            <p>This profile doesn't have any salary history yet. Add the first set of salary details to get started.</p>
            <ProtectedAction tooltip="View-only access">
              <Button as={Link} to="/salary-profile/update" variant="primary" icon={<FaPlus />}>
                Add Initial Salary Details
              </Button>
            </ProtectedAction>
          </div>
        </div>
      </div>
    );
  }

  const effectiveDateStr = currentSalary?.effectiveDate
    ? new Date(currentSalary.effectiveDate).toLocaleDateString()
    : (profile?.effectiveDate ? new Date(profile.effectiveDate).toLocaleDateString() : 'Active');

  return (
    <div className="fs-page salary-profile-page">
      <PageHeader
        title="Salary Profile"
        subtitle="Manage your salary components, compensation structure, and history"
        actions={
          <div className="salary-header-actions">
            <Button as={Link} to="/salary/simulator" variant="secondary" icon={<FaSlidersH />}>
              Tax Simulator
            </Button>
            <Button as={Link} to="/salary/paychecks/new" variant="secondary" icon={<FaCalculator />}>
              Paycheck Calculator
            </Button>
            <ProtectedAction tooltip="View-only access">
              <Button as={Link} to="/salary-profile/update" variant="primary" icon={<FaPlus />}>
                Update Structure
              </Button>
            </ProtectedAction>
          </div>
        }
      />

      {/* Main Profile Card */}
      <div className="salary-profile-card profile-card">
        <div className="card-header">
          <div className="header-content">
            <h2 className="profile-card-name">
              {profile?.title ? `${profile.title} ` : ''}{profile?.name}
            </h2>
            <p>
              {profile?.position ? `${profile.position} • ` : ''}{profile?.year || new Date().getFullYear()}
            </p>
          </div>
          <ProtectedAction tooltip="View-only access">
            <Link to="/salary-profile/edit" className="header-action-icon" title="Edit Profile Details">
              <FaUserEdit />
            </Link>
          </ProtectedAction>
        </div>

        <div className="card-body">
          <h3 className="card-section-title">Current Salary Details (as of {effectiveDateStr})</h3>
          {profile?.components && profile.components.length > 0 ? (
            <ComponentTable components={profile.components} readOnly={true} />
          ) : currentSalary ? (
            <ul className="salary-breakdown-list">
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
                    <strong className="fs-num">{formatCurrency(value)}</strong>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="no-salary-details-text">No salary details logged yet.</p>
          )}
        </div>

        <div className="card-footer">
          <div className="gross-estimate">
            <span>Estimated Monthly Gross:</span>
            <strong className="fs-num">{formatCurrency(monthlyGrossEstimate)}</strong>
          </div>
          {currentSalary?.prepaid !== undefined && (
            <div className="gross-estimate prepaid">
              <span>Monthly Prepaid:</span>
              <strong className="fs-num">{formatCurrency(currentSalary.prepaid || 0)}</strong>
            </div>
          )}
          <div className="salary-card-actions card-actions">
            <ProtectedAction tooltip="View-only access">
              <Button as={Link} to="/salary-profile/update" variant="primary" size="sm" icon={<FaEdit />} title="Update Salary">
                Update
              </Button>
            </ProtectedAction>
            <Button as={Link} to="/salary-profile/history" variant="secondary" size="sm" icon={<FaHistory />} title="View History">
              History
            </Button>
          </div>
        </div>
      </div>

      {/* Multiple Profiles Section (if user has more than 1) */}
      {allProfiles.length > 1 && (
        <div className="all-profiles-section">
          <h2 className="section-title">All Saved Salary Profiles</h2>
          <div className="salary-profiles-grid profile-grid">
            {allProfiles.map((p) => {
              const isDefault = p.isDefault || p._id === profile?._id;
              const gross = p.monthlyGrossEstimate || 0;
              return (
                <div key={p._id} className="salary-profile-card profile-card">
                  <div className={`card-header ${isDefault ? 'default-profile-header' : ''}`}>
                    <div className="header-content">
                      <div className="profile-card-title-row">
                        <h3 className="profile-card-name">{p.name}</h3>
                        {isDefault && <Badge tone="neutral" label="Default">Default</Badge>}
                      </div>
                      <p className="profile-card-subtitle">{p.title || 'Profile'}</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="profile-metric-row">
                      <span className="metric-label">Estimated Gross:</span>
                      <strong className="metric-value fs-num">{formatCurrency(gross)}</strong>
                    </div>
                    <div className="profile-metric-row">
                      <span className="metric-label">History / Components:</span>
                      <strong className="metric-value fs-num">{(p.salaryHistory || []).length || (p.components || []).length} records</strong>
                    </div>
                  </div>
                  <div className="card-footer profile-card-footer">
                    {!isDefault && (
                      <ProtectedAction tooltip="View-only access">
                        <Button
                          onClick={() => handleSetDefault(p._id)}
                          variant="secondary"
                          size="sm"
                          icon={<FaCheck />}
                        >
                          Set Default
                        </Button>
                      </ProtectedAction>
                    )}
                    <ProtectedAction tooltip="View-only access">
                      <Button
                        onClick={() => handleDeleteProfile(p._id)}
                        variant="danger"
                        size="sm"
                        className="delete-profile-btn"
                        icon={<FaTrash />}
                        aria-label={`Delete profile ${p.name}`}
                      />
                    </ProtectedAction>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={Boolean(profileToDelete)}
        title="Delete Salary Profile"
        message="Are you sure you want to delete this salary profile?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDeleteProfile}
        onCancel={() => setProfileToDelete(null)}
      />
    </div>
  );
};

export default SalaryProfilePage;
