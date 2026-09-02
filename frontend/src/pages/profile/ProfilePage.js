// frontend/src/pages/profile/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { User, Briefcase, Phone, Mail, MapPin, Calendar, CreditCard, Save, RefreshCw, Shield } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    fullName: '',
    dateOfBirth: '',
    nationalId: '',
    phone: '',
    address: '',
    title: '',
    company: '',
    department: '',
    employeeId: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUserProfile();
      if (res && res.user) {
        const u = res.user;
        setFormData({
          username: u.username || '',
          email: u.email || '',
          role: u.role || 'viewer',
          fullName: u.fullName || '',
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '',
          nationalId: u.nationalId || '',
          phone: u.phone || '',
          address: u.address || '',
          title: u.title || '',
          company: u.company || '',
          department: u.department || '',
          employeeId: u.employeeId || '',
        });
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load profile details', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateUserProfile({
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth || null,
        nationalId: formData.nationalId || null,
        phone: formData.phone || null,
        address: formData.address || null,
        title: formData.title || null,
        company: formData.company || null,
        department: formData.department || null,
        employeeId: formData.employeeId || null,
        email: formData.email || undefined,
      });

      addToast(res.message || 'Profile updated successfully!', 'success');
      const currentStored = localStorage.getItem('user');
      if (currentStored) {
        try {
          const parsed = JSON.parse(currentStored);
          parsed.fullName = formData.fullName;
          parsed.email = formData.email;
          localStorage.setItem('user', JSON.stringify(parsed));
        } catch (ignored) {}
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <RefreshCw className="spinning-icon" size={32} style={{ color: '#009879', marginBottom: '1rem' }} />
        <p style={{ color: '#6c757d' }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="profile-page-header">
        <div>
          <h1 className="profile-title">User Profile Management</h1>
          <p className="profile-subtitle">Manage your personal information, employment credentials, and system identity</p>
        </div>
        <div className="profile-role-badge">
          <span className="role-pill">{formData.role.toUpperCase()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form-grid">
        {/* Personal Information Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="card-icon-bubble">
              <User size={22} />
            </div>
            <div>
              <h3 className="card-title">Personal Information</h3>
              <p className="card-desc">Personal details and identification</p>
            </div>
          </div>

          <div className="card-body-grid">
            <div className="form-group full-width">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                style={{ paddingLeft: '14px' }}
                placeholder="e.g. Johnathan Doe"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">National ID / Passport</label>
              <div className="input-with-icon">
                <CreditCard size={16} className="input-icon" />
                <input
                  type="text"
                  name="nationalId"
                  className="form-input"
                  placeholder="e.g. 29501011234567"
                  value={formData.nationalId}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="e.g. +20 100 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Residential Address</label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  placeholder="e.g. 12 El-Galaa St, Heliopolis, Cairo"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional & Employment Information Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="card-icon-bubble professional-bubble">
              <Briefcase size={22} />
            </div>
            <div>
              <h3 className="card-title">Professional & Employment Details</h3>
              <p className="card-desc">Job credentials, position, and organization assignment</p>
            </div>
          </div>

          <div className="card-body-grid">
            <div className="form-group">
              <label className="form-label">Job Title / Role</label>
              <input
                type="text"
                name="title"
                className="form-input"
                style={{ paddingLeft: '14px' }}
                placeholder="e.g. Senior Software Architect"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company / Employer</label>
              <input
                type="text"
                name="company"
                className="form-input"
                style={{ paddingLeft: '14px' }}
                placeholder="e.g. FinStat Global"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department / Unit</label>
              <input
                type="text"
                name="department"
                className="form-input"
                style={{ paddingLeft: '14px' }}
                placeholder="e.g. Engineering & Platform"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employee / Staff ID</label>
              <input
                type="text"
                name="employeeId"
                className="form-input"
                style={{ paddingLeft: '14px' }}
                placeholder="e.g. EMP-9821"
                value={formData.employeeId}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* System Credentials & Role (Read-Only) */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="card-icon-bubble">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="card-title">System Account</h3>
              <p className="card-desc">Authentication identifier and access permissions</p>
            </div>
          </div>

          <div className="card-body-grid">
            <div className="form-group">
              <label className="form-label">System Username</label>
              <input
                type="text"
                className="form-input disabled-input"
                value={formData.username}
                disabled
              />
              <span className="form-input-help">Username cannot be changed directly</span>
            </div>

            <div className="form-group">
              <label className="form-label">Access Role</label>
              <input
                type="text"
                className="form-input disabled-input"
                value={formData.role.toUpperCase()}
                disabled
              />
              <span className="form-input-help">Permissions managed by system administrator</span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="profile-actions-bar">
          <button type="submit" className="btn-save-profile" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="spinning-icon" size={18} />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
