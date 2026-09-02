// frontend/src/pages/salary/UpdateSalary.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, RefreshCw, Briefcase } from 'lucide-react';
import { getProfile, saveProfile } from '../../services/salaryService';
import { updateSalaryProfile } from '../../services/salaryProfileService';
import ComponentTable from '../../components/salary/ComponentTable';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import './SalaryProfile.css';

const convertLegacyDetailsToComponents = (details) => {
  if (!details) return [];
  const comps = [];
  if (details.basicSalary) comps.push({ name: 'Basic Salary', category: 'basic', type: 'fixed', value: details.basicSalary, calculationBasis: 'gross', isTaxable: true, isInsurable: true, isActive: true });
  if (details.basicProduction) comps.push({ name: 'Basic Production', category: 'allowance', type: 'fixed', value: details.basicProduction, calculationBasis: 'gross', isTaxable: true, isInsurable: true, isActive: true });
  if (details.variables) comps.push({ name: 'Variables', category: 'allowance', type: 'fixed', value: details.variables, calculationBasis: 'gross', isTaxable: true, isInsurable: true, isActive: true });
  if (details.environment) comps.push({ name: 'Environment Allowance', category: 'allowance', type: 'fixed', value: details.environment, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true });
  if (details.meal) comps.push({ name: 'Meal Allowance', category: 'allowance', type: 'fixed', value: details.meal, calculationBasis: 'gross', isTaxable: false, isInsurable: false, isActive: true });
  if (details.shift) comps.push({ name: 'Shift Allowance', category: 'allowance', type: 'fixed', value: details.shift, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true });
  if (details.supervising) comps.push({ name: 'Supervising Allowance', category: 'allowance', type: 'fixed', value: details.supervising, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true });
  if (details.others) comps.push({ name: 'Other Allowances', category: 'allowance', type: 'fixed', value: details.others, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true });
  if (details.bonds) comps.push({ name: 'Bonds', category: 'bonus', type: 'fixed', value: details.bonds, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true });
  return comps;
};

const DEFAULT_INITIAL_COMPONENTS = [
  { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 10000, calculationBasis: 'gross', isTaxable: true, isInsurable: true, isActive: true },
  { name: 'Housing Allowance', category: 'allowance', type: 'fixed', value: 2000, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true },
  { name: 'Transport Allowance', category: 'allowance', type: 'fixed', value: 1000, calculationBasis: 'gross', isTaxable: false, isInsurable: false, isActive: true },
];

const UpdateSalary = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: 'Main Salary Profile',
    title: '',
    position: '',
    year: new Date().getFullYear(),
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [components, setComponents] = useState(DEFAULT_INITIAL_COMPONENTS);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const res = await getProfile();
        if (res) {
          setProfile(res);
          setFormData({
            name: res.name || 'Main Salary Profile',
            title: res.title || '',
            position: res.position || '',
            year: res.year || new Date().getFullYear(),
            effectiveDate: res.effectiveDate ? res.effectiveDate.split('T')[0] : new Date().toISOString().split('T')[0],
          });

          if (res.components && res.components.length > 0) {
            setComponents(res.components);
          } else if (res.currentSalary) {
            const converted = convertLegacyDetailsToComponents(res.currentSalary);
            if (converted.length > 0) setComponents(converted);
          } else if (res.salaryHistory && res.salaryHistory.length > 0) {
            const converted = convertLegacyDetailsToComponents(res.salaryHistory[0]);
            if (converted.length > 0) setComponents(converted);
          }
        }
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to load salary profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [addToast]);

  const summary = useMemo(() => {
    const active = components.filter(c => c && c.isActive !== false);
    const basicSum = active
      .filter(c => c.category === 'basic')
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

    let gross = 0;
    // Fixed earnings
    active.forEach(c => {
      if (c.category !== 'deduction' && (c.type === 'fixed' || !c.type)) {
        gross += (Number(c.value) || 0);
      }
    });
    // Percentage earnings
    active.forEach(c => {
      if (c.category !== 'deduction' && c.type === 'percentage') {
        const basis = c.calculationBasis === 'basic' ? basicSum : gross;
        gross += (basis * (Number(c.value) || 0)) / 100;
      }
    });

    const insurableGross = active
      .filter(c => c.category !== 'deduction' && c.isInsurable !== false)
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

    const taxableGross = active
      .filter(c => c.category !== 'deduction' && c.isTaxable !== false)
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

    return {
      basicSum,
      estimatedGross: Math.round(gross * 100) / 100,
      insurableGross: Math.round(insurableGross * 100) / 100,
      taxableGross: Math.round(taxableGross * 100) / 100,
    };
  }, [components]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Profile Name is required', 'error');
      return;
    }
    if (!formData.title.trim()) {
      addToast('Job Title is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const cleanComponents = components.map(c => ({
        name: (c.name || 'Component').trim(),
        category: c.category || 'allowance',
        type: c.type || 'fixed',
        value: Number(c.value) || 0,
        calculationBasis: c.calculationBasis || 'gross',
        isTaxable: c.isTaxable !== false,
        isInsurable: c.isInsurable !== false,
        isActive: c.isActive !== false,
      }));

      const payload = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        position: formData.position?.trim() || undefined,
        year: Number(formData.year) || new Date().getFullYear(),
        effectiveDate: formData.effectiveDate,
        components: cleanComponents,
      };

      if (profile && profile._id) {
        try {
          await updateSalaryProfile(profile._id, payload);
        } catch (updateErr) {
          await saveProfile(payload);
        }
      } else {
        await saveProfile(payload);
      }

      addToast('Salary profile updated successfully with improved components structure!', 'success');
      navigate('/salary-profile');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update salary profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <RefreshCw className="spinning-icon" size={32} style={{ color: '#009879', marginBottom: '1rem' }} />
        <p style={{ color: '#6c757d' }}>Loading salary profile structure...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Update Salary Structure</h1>
          <p style={{ color: '#6c757d', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Customize your compensation breakdown, allowances, insurable badges, and tax rules
          </p>
        </div>
        <Link to="/salary-profile" className="nav-button" style={{ backgroundColor: '#64748b', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Salary Profile
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile Metadata Card */}
        <div className="profile-card" style={{ maxWidth: '100%', margin: 0, padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: '#2c3e50', fontSize: '1.15rem', marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={20} color="#009879" /> Profile & Role Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Profile Name *
              </label>
              <input
                type="text"
                className="component-input"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Senior Software Engineer Profile"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Job Title *
              </label>
              <input
                type="text"
                className="component-input"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Lead Developer"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Position / Level
              </label>
              <input
                type="text"
                className="component-input"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Full-time / Grade 4"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Effective Year *
              </label>
              <input
                type="number"
                className="component-input"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Effective Date
              </label>
              <input
                type="date"
                className="component-input"
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Components Table Card */}
        <div className="profile-card" style={{ maxWidth: '100%', margin: 0, padding: '1.5rem', borderRadius: '12px' }}>
          <ComponentTable
            components={components}
            onChange={setComponents}
            readOnly={false}
          />
        </div>

        {/* Live Structure Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Basic Salary</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#6366f1', marginTop: '0.25rem' }}>
              {formatCurrency(summary.basicSum)}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Gross</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#009879', marginTop: '0.25rem' }}>
              {formatCurrency(summary.estimatedGross)}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Insurable Earnings</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>
              {formatCurrency(summary.insurableGross)}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Taxable Earnings</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
              {formatCurrency(summary.taxableGross)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
          <Link to="/salary-profile" className="cancel-button" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="submit-button"
            style={{ padding: '0.75rem 1.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Salary Structure'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateSalary;
