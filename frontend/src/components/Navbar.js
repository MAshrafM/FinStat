// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa'; // Import the plus icon
import './Navbar.css';

const addLogRoutes = [
  'paycheck-log',
  'expenditures',
  'trades',
  'mutual-funds',
  'gold-wallet',
  'certificates',
  'currency',
];
const Navbar = () => {
  const location = useLocation(); // Hook to get the current page URL
  const currentPath = location.pathname.replace(/^\//, ''); 
  return (
    <nav className="navbar">
      {/* Navbar brand or title */}
      <div className="navbar-brand">
        <Link to="/dashboard">Finance Dashboard</Link>
      </div>
      <div className="navbar-links">
        {addLogRoutes.map((route) => currentPath === route ? (
           // Debugging line to check if the button is rendered
          <Link key={route} to={`/${route}/new`} className="nav-button">
            <FaPlus /> <span className="nav-button-text">Add New Log</span>
          </Link>
        ) : null)}

        
      </div>
    </nav>
  );
};

export default Navbar;
