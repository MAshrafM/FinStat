// frontend/src/pages/expenditure/EditExpenditurePage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getExpenditureById, updateExpenditure } from '../../services/expenditureService';
import ExpenditureForm from './ExpenditureForm';

const EditExpenditurePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    getExpenditureById(id)
      .then(setInitialData)
      .catch(err => console.error("Failed to fetch expenditure:", err));
  }, [id]);

  const handleUpdateExpenditure = async (data) => {
    try {
      await updateExpenditure(id, data);
      navigate('/expenditures');
    } catch (error) {
      console.error("Failed to update expenditure:", error);
    }
  };

  if (!initialData) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      <ExpenditureForm
        onSubmit={handleUpdateExpenditure}
        initialData={initialData}
        mode="edit"
      />
      <Link to="/expenditures" className="cancel-button" style={{textDecoration: 'none'}}>
        Cancel
      </Link>
    </div>
  );
};

export default EditExpenditurePage;
