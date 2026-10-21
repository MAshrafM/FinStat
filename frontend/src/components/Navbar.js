// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { useCanModify } from '../context/AuthContext';
import ProtectedAction from './common/ProtectedAction';
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
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\//, '');
  const { isViewer } = useCanModify();

  return (
    <nav className="navbar">
      {/* Navbar brand or title */}
      <div className="navbar-brand">
        <Link to="/dashboard">Finance Dashboard</Link>
        {isViewer && <span className="role-badge role-badge-viewer">Read-Only</span>}
      </div>
      <div className="navbar-links">
        {addLogRoutes.map((route) =>
          currentPath === route ? (
            <ProtectedAction key={route} hide={true}>
              <Link to={`/${route}/new`} className="nav-button">
                <FaPlus /> <span className="nav-button-text">Add New Log</span>
              </Link>
            </ProtectedAction>
          ) : null
        )}
      </div>
    </nav>
  );
};

export default Navbar;
