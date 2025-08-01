// frontend/src/pages/expenditure/EditExpenditurePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { updateExpenditure, getExpenditureById } from '../../services/expenditureService';
import ExpenditureForm from './ExpenditureForm';

const EditExpenditurePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [expenditure, setExpenditure] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getExpenditureById(id)
      .then(data => {
        setExpenditure(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch expenditure:", err);
        setIsLoading(false);
      });
  }, [id]);

  const handleSubmit = async (dataToSubmit) => {
    try {
      await updateExpenditure(id, dataToSubmit);
      navigate('/expenditures');
    } catch (error) {
      console.error("Failed to update expenditure:", error);
      console.error("Error details:", error.message);
      alert(`Failed to update expenditure: ${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="page-container">Loading expenditure...</div>;
  }

  if (!expenditure) {
    return <div className="page-container">Expenditure not found</div>;
  }

  return (
    <div className="page-container">
      <ExpenditureForm 
        onSubmit={handleSubmit}
        mode="edit"
        initialData={expenditure}
      />
      <Link to="/expenditures" className="cancel-button" style={{textDecoration: 'none'}}>
        Cancel
      </Link>
    </div>
  );
};

export default EditExpenditurePage;