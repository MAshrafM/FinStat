// frontend/src/pages/EditPaycheck.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PaycheckForm from '../components/PaycheckForm';
import { getPaycheckById, updatePaycheck } from '../services/paycheckService';

const EditPaycheck = () => {
  const { id } = useParams(); // Gets the ':id' from the URL
  const navigate = useNavigate();
  const [existingPaycheck, setExistingPaycheck] = useState(null);

  // Fetch the paycheck data when the component loads
  useEffect(() => {
    const fetchPaycheck = async () => {
      const data = await getPaycheckById(id);
      setExistingPaycheck(data);
    };
    fetchPaycheck();
  }, [id]);

  const handleUpdatePaycheck = async (paycheckData) => {
    await updatePaycheck(id, paycheckData);
    navigate('/paycheck-log'); // Go back to the log after updating
  };

  // Show a loading message until the data is fetched
  if (!existingPaycheck) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      {/* Pass the existing data and the update handler to the form */}
      <PaycheckForm
        onFormSubmit={handleUpdatePaycheck}
        initialData={existingPaycheck}
      />
    </div>
  );
};

export default EditPaycheck;
