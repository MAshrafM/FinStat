// frontend/src/pages/salary/EditHistoryRecord.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, History } from 'lucide-react';
import { getProfile, updateHistoryRecord } from '../../services/salaryService';
import { Loading } from '../../components/ui';
import './SalaryProfile.css';

const SALARY_FIELDS = [
  { key: 'basicSalary', label: 'Basic Salary' },
  { key: 'basicProduction', label: 'Basic Production' },
  { key: 'variables', label: 'Variables' },
  { key: 'environment', label: 'Environment' },
  { key: 'meal', label: 'Meal' },
  { key: 'shift', label: 'Shift' },
  { key: 'supervising', label: 'Supervising' },
  { key: 'others', label: 'Others' },
  { key: 'prepaid', label: 'Prepaid' },
  { key: 'bonds', label: 'Bonds' },
];

const EditHistoryRecord = () => {
  const { historyId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // We need to get the whole profile to find the specific record to edit
    getProfile()
      .then((profile) => {
        if (profile) {
          const historyRecord = (profile.salaryHistory || []).find((r) => r._id === historyId);
          if (historyRecord) {
            // Format date for the input[type=date]
            const formattedDate = historyRecord.effectiveDate
              ? new Date(historyRecord.effectiveDate).toISOString().slice(0, 10)
              : '';
            setRecord({ ...historyRecord, effectiveDate: formattedDate });
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [historyId]);

  const handleChange = (e) => {
    setRecord({ ...record, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Convert numeric fields back to numbers before sending
      const dataToSubmit = { ...record };
      for (const key in dataToSubmit) {
        if (key !== 'effectiveDate' && key !== '_id') {
          dataToSubmit[key] = parseFloat(dataToSubmit[key]) || 0;
        }
      }
      await updateHistoryRecord(historyId, dataToSubmit);
      navigate('/salary-profile/history');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !record) {
    return <Loading variant="route" text="Loading historical record..." />;
  }

  return (
    <div className="fs-page edit-history-page-container">
      <div className="page-header edit-history-header">
        <div>
          <h1>Edit Historical Record</h1>
          <p className="edit-history-subtitle">
            Update effective date and individual salary component allowances for this historical snapshot
          </p>
        </div>
        <Link to="/salary-profile/history" className="fs-btn fs-btn-secondary">
          <ArrowLeft size={16} /> Back to History
        </Link>
      </div>

      <div className="fs-form-card history-form-card">
        <div className="fs-form-card-header">
          <History size={18} className="fs-form-icon" />
          <h3>Historical Salary Structure</h3>
        </div>

        <form onSubmit={handleSubmit} className="fs-stacked-form" data-testid="edit-history-record-form">
          <div className="fs-form-group">
            <label htmlFor="history-effective-date" className="fs-label">
              Effective Date <span className="required-mark">*</span>
            </label>
            <input
              id="history-effective-date"
              type="date"
              className="fs-input"
              name="effectiveDate"
              value={record.effectiveDate || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="history-fields-grid">
            {SALARY_FIELDS.map(({ key, label }) => (
              <div className="fs-form-group" key={key}>
                <label htmlFor={`history-${key}`} className="fs-label">
                  {label}
                </label>
                <input
                  id={`history-${key}`}
                  type="number"
                  step="any"
                  className="fs-input fs-num"
                  name={key}
                  value={record[key] !== undefined ? record[key] : ''}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          <div className="fs-form-actions">
            <Link to="/salary-profile/history" className="fs-btn fs-btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="fs-btn fs-btn-primary"
            >
              <Save size={16} />
              {saving ? 'Saving Historical Record...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHistoryRecord;
