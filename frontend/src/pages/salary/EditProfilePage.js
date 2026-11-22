// frontend/src/pages/salary/EditProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, User } from 'lucide-react';
import { getProfile, updateProfileDetails } from '../../services/salaryService';
import { Loading } from '../../components/ui';
import './SalaryProfile.css';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    position: '',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    // Fetch the current profile to pre-fill the form
    getProfile()
      .then((profile) => {
        if (profile) {
          setFormData({
            name: profile.name || '',
            title: profile.title || '',
            position: profile.position || '',
            year: profile.year || new Date().getFullYear(),
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfileDetails(formData);
      navigate('/salary/profiles');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading variant="route" text="Loading profile details..." />;
  }

  return (
    <div className="fs-page edit-profile-page-container">
      <div className="page-header edit-profile-header">
        <div>
          <h1>Edit Profile Details</h1>
          <p className="edit-profile-subtitle">
            Update employee name, job title, organizational position, and operational tax year
          </p>
        </div>
        <Link to="/salary/profiles" className="fs-btn fs-btn-secondary">
          <ArrowLeft size={16} /> Back to Profiles
        </Link>
      </div>

      <div className="fs-form-card profile-form-card">
        <div className="fs-form-card-header">
          <User size={18} className="fs-form-icon" />
          <h3>Profile & Position Configuration</h3>
        </div>

        <form onSubmit={handleSubmit} className="fs-stacked-form" data-testid="edit-profile-form">
          <div className="fs-form-group">
            <label htmlFor="profile-name-input" className="fs-label">
              Full Name <span className="required-mark">*</span>
            </label>
            <input
              id="profile-name-input"
              className="fs-input"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="fs-form-group">
            <label htmlFor="profile-title-input" className="fs-label">
              Job Title <span className="required-mark">*</span>
            </label>
            <input
              id="profile-title-input"
              className="fs-input"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>

          <div className="fs-form-group">
            <label htmlFor="profile-position-input" className="fs-label">
              Position / Department
            </label>
            <input
              id="profile-position-input"
              className="fs-input"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="e.g. Engineering / Level 4"
            />
          </div>

          <div className="fs-form-group">
            <label htmlFor="profile-year-input" className="fs-label">
              Fiscal / Tax Year <span className="required-mark">*</span>
            </label>
            <input
              id="profile-year-input"
              type="number"
              className="fs-input fs-num"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
            />
          </div>

          <div className="fs-form-actions">
            <Link to="/salary/profiles" className="fs-btn fs-btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="fs-btn fs-btn-primary"
            >
              <Save size={16} />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
