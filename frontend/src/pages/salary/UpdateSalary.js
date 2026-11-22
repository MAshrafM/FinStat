// frontend/src/pages/salary/UpdateSalary.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Briefcase } from 'lucide-react';
import { getProfile, saveProfile } from '../../services/salaryService';
import { updateSalaryProfile } from '../../services/salaryProfileService';
import ComponentTable from '../../components/salary/ComponentTable';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../../components/ui';
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
    const active = components.filter((c) => c && c.isActive !== false);
    const basicSum = active
      .filter((c) => c.category === 'basic')
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

    let gross = 0;
    // Fixed earnings
    active.forEach((c) => {
      if (c.category !== 'deduction' && (c.type === 'fixed' || !c.type)) {
        gross += Number(c.value) || 0;
      }
    });
    // Percentage earnings
    active.forEach((c) => {
      if (c.category !== 'deduction' && c.type === 'percentage') {
        const basis = c.calculationBasis === 'basic' ? basicSum : gross;
        gross += (basis * (Number(c.value) || 0)) / 100;
      }
    });

    const insurableGross = active
      .filter((c) => c.category !== 'deduction' && c.isInsurable !== false)
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

    const taxableGross = active
      .filter((c) => c.category !== 'deduction' && c.isTaxable !== false)
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
      const cleanComponents = components.map((c) => {
        const isActive = c.isActive !== false;
        return {
          name: (c.name || 'Component').trim(),
          category: c.category || 'allowance',
          type: c.type || 'fixed',
          value: isActive ? Number(c.value) || 0 : 0,
          calculationBasis: c.calculationBasis || 'gross',
          isTaxable: c.isTaxable !== false,
          isInsurable: c.isInsurable !== false,
          isActive,
        };
      });

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
      navigate('/salary/profiles');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update salary profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading variant="route" text="Loading salary profile structure..." />;
  }

  return (
    <div className="fs-page update-salary-container">
      <div className="page-header update-salary-header">
        <div>
          <h1>Update Salary Structure</h1>
          <p className="update-salary-subtitle">
            Customize compensation breakdown, allowances, insurable badges, and tax rules
          </p>
        </div>
        <Link to="/salary/profiles" className="fs-btn fs-btn-secondary">
          <ArrowLeft size={16} /> Back to Salary Profile
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="update-salary-form" data-testid="update-salary-form">
        {/* Profile Metadata Card */}
        <div className="fs-form-card update-salary-meta-card">
          <div className="fs-form-card-header">
            <Briefcase size={18} className="fs-form-icon" />
            <h3>Profile & Role Information</h3>
          </div>

          <div className="update-salary-grid">
            <div className="fs-form-group">
              <label htmlFor="update-profile-name" className="fs-label">
                Profile Name <span className="required-mark">*</span>
              </label>
              <input
                id="update-profile-name"
                type="text"
                className="fs-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Senior Software Engineer Profile"
                required
              />
            </div>

            <div className="fs-form-group">
              <label htmlFor="update-profile-title" className="fs-label">
                Job Title <span className="required-mark">*</span>
              </label>
              <input
                id="update-profile-title"
                type="text"
                className="fs-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Lead Developer"
                required
              />
            </div>

            <div className="fs-form-group">
              <label htmlFor="update-profile-position" className="fs-label">
                Position / Level
              </label>
              <input
                id="update-profile-position"
                type="text"
                className="fs-input"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Full-time / Grade 4"
              />
            </div>

            <div className="fs-form-group">
              <label htmlFor="update-profile-year" className="fs-label">
                Effective Year <span className="required-mark">*</span>
              </label>
              <input
                id="update-profile-year"
                type="number"
                className="fs-input fs-num"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                required
              />
            </div>

            <div className="fs-form-group">
              <label htmlFor="update-profile-date" className="fs-label">
                Effective Date
              </label>
              <input
                id="update-profile-date"
                type="date"
                className="fs-input"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Components Table Card */}
        <div className="fs-form-card update-components-card">
          <ComponentTable
            components={components}
            onChange={setComponents}
            readOnly={false}
          />
        </div>

        {/* Live Structure Summary Cards (Neutral Dark Graphite Invariant I15) */}
        <div className="update-salary-kpi-grid">
          <div className="update-kpi-card fs-card">
            <span className="update-kpi-label">Basic Salary</span>
            <div className="update-kpi-value fs-num">
              {formatCurrency(summary.basicSum)}
            </div>
          </div>

          <div className="update-kpi-card fs-card">
            <span className="update-kpi-label">Estimated Gross</span>
            <div className="update-kpi-value fs-num">
              {formatCurrency(summary.estimatedGross)}
            </div>
          </div>

          <div className="update-kpi-card fs-card">
            <span className="update-kpi-label">Insurable Earnings</span>
            <div className="update-kpi-value fs-num">
              {formatCurrency(summary.insurableGross)}
            </div>
          </div>

          <div className="update-kpi-card fs-card">
            <span className="update-kpi-label">Taxable Earnings</span>
            <div className="update-kpi-value fs-num">
              {formatCurrency(summary.taxableGross)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="update-salary-actions">
          <Link to="/salary/profiles" className="fs-btn fs-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="fs-btn fs-btn-primary"
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
