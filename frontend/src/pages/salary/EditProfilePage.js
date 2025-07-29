// frontend/src/pages/salary/EditProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProfile, updateProfileDetails } from '../../services/salaryService';
import '../../components/PaycheckForm.css'; // Reuse form styles

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    position: '',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    // Fetch the current profile to pre-fill the form
    getProfile().then(profile => {
      if (profile) {
        setFormData({
          name: profile.name,
          title: profile.title,
          position: profile.position,
          year: profile.year,
        });
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfileDetails(formData);
    navigate('/salary-profile');
  };

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="paycheck-form-container">
        <h3>Edit Profile Details</h3>
        <div className="form-group">
          <label>Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Title</label>
          <input name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Position</label>
          <input name="position" value={formData.position} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Year</label>
          <input type="number" name="year" value={formData.year} onChange={handleChange} required />
        </div>
        <button type="submit" className="submit-button">Save Changes</button>
      </form>
      <Link to="/salary-profile" className="cancel-button" style={{textDecoration: 'none'}}>
        Cancel
      </Link>
    </div>
  );
};

export default EditProfilePage;
