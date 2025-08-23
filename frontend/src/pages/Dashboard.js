// frontend/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegListAlt, FaUserTie, 
         FaMoneyBillWave, FaChartLine,
         FaBuilding, FaGem, FaBalanceScale, FaScroll, FaDollarSign, FaCreditCard
} from 'react-icons/fa'; // Import new icons
import './Dashboard.css'; // We will create this CSS file

const Dashboard = () => {
      return (
    <div className="page-container">
      <h1>Welcome to Your Dashboard</h1>
        <p>Select a feature to get started.</p>
        <div className="dashboard-summary" style={{justifyContent: "center"}}>
        <Link to="/summary" className="dashboard-card">
            <FaBalanceScale size={100} />
            <h2>Profile Summary</h2>
        </Link>
        </div>

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
        <Link to="/expenditures" className="dashboard-card">
          <FaMoneyBillWave size={50} />
          <h2>Expenditure Log</h2>
          <p>Track your bank and cash flow transactions.</p>
        </Link>
        <Link to="/trades" className="dashboard-card">
          <FaChartLine size={50} />
          <h2>Stock Trading</h2>
          <p>Log and track all your stock market trades.</p>
              </Link>
              <Link to="/mutual-funds" className="dashboard-card">
                  <FaBuilding size={50} />
                  <h2>Mutual Funds</h2>
                  <p>Log and track your mutual fund investments.</p>
              </Link>
              <Link to="/gold-wallet" className="dashboard-card">
                  <FaGem size={50} />
                  <h2>Gold Logs</h2>
                  <p>Log and track your gold purchases and sales.</p>
              </Link>
              <Link to="/certificates" className="dashboard-card">
                  <FaScroll size={50} />
                  <h2>Bank Certificates</h2>
                  <p>Track your fixed-income certificates of deposit.</p>
              </Link>
              <Link to="/currency" className="dashboard-card">
                  <FaDollarSign size={50} />
                  <h2>Foreign Currency</h2>
                  <p>Track your Foreign Currency Wallet.</p>
              </Link>
              <Link to="/credit-cards" className="dashboard-card">
                <FaCreditCard size={50} />
                <h2>Credit Cards</h2>
                <p>Manage credit card transactions and payments.</p>
              </Link>
      </div>
    </div>
  );
};

export default Dashboard;
