import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { updateExpenditure, getExpenditureById } from '../../services/expenditureService';
import { useToast } from '../../context/ToastContext';
import ExpenditureForm from './ExpenditureForm';

const EditExpenditurePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
      showToast('Expenditure updated successfully', 'success');
      navigate('/expenditures');
    } catch (error) {
      console.error("Failed to update expenditure:", error);
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