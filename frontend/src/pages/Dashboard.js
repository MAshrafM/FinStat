// frontend/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegListAlt, FaRegCalendarAlt, FaChartLine, FaUserTie, FaShieldAlt } from 'react-icons/fa'; // Import new icons
import './Dashboard.css'; // We will create this CSS file

const Dashboard = () => {
  return (
    <div className="page-container">
      <h1>Welcome to Your Dashboard</h1>
      <p>Select a feature to get started.</p>
      <div className="dashboard-grid">
        <Link to="/salary-profile" className="dashboard-card">
          <FaUserTie size={50} />
          <h2>Salary Profile</h2>
          <p>Model and track historical salary information and projections.</p>
        </Link>
        <Link to="/paycheck-log" className="dashboard-card">
          <FaRegListAlt size={50} />
          <h2>Paycheck Log</h2>
          <p>View, add, edit, and delete individual paycheck entries.</p>
        </Link>
        <Link to="/analysis/calendar" className="dashboard-card">
          <FaRegCalendarAlt size={50} />
          <h2>Calendar Year Analysis</h2>
          <p>Analyze income from January to December of each year.</p>
        </Link>
        <Link to="/analysis/fiscal" className="dashboard-card">
          <FaChartLine size={50} />
          <h2>Fiscal Year Analysis</h2>
          <p>Analyze income based on a July to June fiscal cycle.</p>
        </Link>
        <Link to="/social-insurance" className="dashboard-card">
          <FaShieldAlt size={50} />
          <h2>Social Insurance</h2>
          <p>Track yearly registered income and paycheck deductions.</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
