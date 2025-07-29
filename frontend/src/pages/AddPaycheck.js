// frontend/src/pages/AddPaycheck.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PaycheckForm from '../components/PaycheckForm';
import { createPaycheck } from '../services/paycheckService';

const AddPaycheck = () => {
  const navigate = useNavigate(); // Hook to programmatically navigate

  const handleAddPaycheck = async (paycheck) => {
    await createPaycheck(paycheck);
    navigate('/paycheck-log'); // Go back to the log after adding
  };

  return (
    <div className="page-container">
      <PaycheckForm onFormSubmit={handleAddPaycheck} />
    </div>
  );
};

export default AddPaycheck;
