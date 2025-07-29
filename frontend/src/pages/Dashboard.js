// frontend/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="page-container">
      <h1>Welcome to Your Dashboard</h1>
      <p>Select a feature to get started.</p>
      <Link to="/paycheck-log" className="dashboard-button">
        Go to Paycheck Log
      </Link>
    </div>
  );
};

export default Dashboard;
