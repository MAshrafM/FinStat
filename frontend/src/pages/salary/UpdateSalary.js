// frontend/src/pages/salary/UpdateSalary.js
import React, { useState, useEffect } from 'react';
// REMOVE useParams from this import
import { useNavigate } from 'react-router-dom';
// The service call will need to be changed
import { getProfile, saveProfile } from '../../services/salaryService';
import SalaryForm from '../../components/SalaryForm';

const UpdateSalary = () => {
  // REMOVE this line: const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // CHANGE this to fetch the single profile
    getProfile().then(setProfile);
  }, []); // REMOVE id from the dependency array

  const handleUpdateSalary = async (salaryDetails) => {
    try {
      // We need to combine the existing profile data with the new salary details
      const dataToSubmit = {
        ...profile, // includes name, title, etc.
        salaryDetails: salaryDetails,
      };
      await saveProfile(dataToSubmit);
      navigate('/salary-profile');
    } catch (error) {
      console.error("Failed to update salary:", error);
    }
  };

  if (!profile) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <SalaryForm
        onFormSubmit={handleUpdateSalary}
        initialData={profile}
        mode="update"
      />
    </div>
  );
};

export default UpdateSalary;
