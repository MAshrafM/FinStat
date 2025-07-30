// frontend/src/pages/salary/EditHistoryRecord.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProfile, updateHistoryRecord } from '../../services/salaryService';
import '../../components/PaycheckForm.css'; // Reuse form styles

const EditHistoryRecord = () => {
  const { historyId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    // We need to get the whole profile to find the specific record to edit
    getProfile().then(profile => {
      if (profile) {
        const historyRecord = profile.salaryHistory.find(r => r._id === historyId);
        if (historyRecord) {
          // Format date for the input[type=date]
          historyRecord.effectiveDate = new Date(historyRecord.effectiveDate).toISOString().slice(0, 10);
          setRecord(historyRecord);
        }
      }
    });
  }, [historyId]);

  const handleChange = (e) => {
    setRecord({ ...record, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert numeric fields back to numbers before sending
    const dataToSubmit = { ...record };
    for (const key in dataToSubmit) {
      if (key !== 'effectiveDate' && key !== '_id') {
        dataToSubmit[key] = parseFloat(dataToSubmit[key]) || 0;
      }
    }
    await updateHistoryRecord(historyId, dataToSubmit);
    navigate('/salary-profile/history');
  };

  if (!record) return <div className="page-container">Loading record...</div>;

  const salaryFields = [
    'basicSalary', 'basicProduction', 'prepaid', 'variables', 'environment',
    'meal', 'shift', 'supervising', 'others', 'bonds'
  ];

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="paycheck-form-container">
        <h3>Edit Historical Record</h3>
        <div className="form-group">
          <label>Effective Date</label>
          <input type="date" name="effectiveDate" value={record.effectiveDate} onChange={handleChange} required />
        </div>
        {salaryFields.map(field => (
          <div className="form-group" key={field}>
            <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input type="number" name={field} value={record[field]} onChange={handleChange} />
          </div>
        ))}
        <button type="submit" className="submit-button">Save Changes</button>
      </form>
      <Link to="/salary-profile/history" className="cancel-button" style={{textDecoration: 'none'}}>
        Cancel
      </Link>
    </div>
  );
};

export default EditHistoryRecord;
