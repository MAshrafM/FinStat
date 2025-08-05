// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa'; // Import the plus icon
import './Navbar.css';

const Navbar = () => {
  const location = useLocation(); // Hook to get the current page URL

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">Finance Dashboard</Link>
      </div>
      <div className="navbar-links">
        {/* Only show the "Add New Log" button on the paycheck log page */}
        {location.pathname === '/paycheck-log' && (
          <Link to="/paycheck-log/new" className="nav-button">
            <FaPlus /> Add New Log
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
