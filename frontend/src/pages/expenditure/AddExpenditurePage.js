// frontend/src/pages/expenditure/AddExpenditurePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createExpenditure, getLatestExpenditure } from '../../services/expenditureService';
import ExpenditureForm from './ExpenditureForm';

const AddExpenditurePage = () => {
  const navigate = useNavigate();
  const [lastRecord, setLastRecord] = useState({ bank: 0, cash: 0, prepaid: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLatestExpenditure()
      .then(data => {
        if (data) {
          setLastRecord({ bank: data.bank, cash: data.cash, prepaid: data.prepaid || 0 });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch latest expenditure:", err);
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (dataToSubmit) => {

    try {
      await createExpenditure(dataToSubmit);
      navigate('/expenditures');
    } catch (error) {
      console.error("Failed to create expenditure:", error);
      console.error("Error details:", error.message);
      alert(`Failed to create expenditure: ${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="page-container">Loading latest record...</div>;
  }

  return (
    <div className="page-container">
      <ExpenditureForm
        onSubmit={handleSubmit}
        mode="create"
        lastRecord={lastRecord}
      />
      <Link to="/expenditures" className="cancel-button" style={{ textDecoration: 'none' }}>
        Cancel
      </Link>
    </div>
  );
};

export default AddExpenditurePage;