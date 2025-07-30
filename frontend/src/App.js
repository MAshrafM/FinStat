// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
// Paycheck Log
import PaycheckLog from './pages/PaycheckLog';
import AddPaycheck from './pages/AddPaycheck';
import EditPaycheck from './pages/EditPaycheck';
// Pay Analysis
import CalendarAnalysis from './pages/analysis/CalendarAnalysis';
import FiscalAnalysis from './pages/analysis/FiscalAnalysis';
// Salary Profile
import SalaryProfilePage from './pages/salary/SalaryProfilePage';
import SalaryHistory from './pages/salary/SalaryHistory';
import EditProfilePage from './pages/salary/EditProfilePage';
import EditHistoryRecord from './pages/salary/EditHistoryRecord';
import UpdateSalary from './pages/salary/UpdateSalary';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/paycheck-log" element={<PaycheckLog />} />
            <Route path="/paycheck-log/new" element={<AddPaycheck />} />
            <Route path="/paycheck-log/edit/:id" element={<EditPaycheck />} />
            <Route path="/analysis/calendar" element={<CalendarAnalysis />} />
            <Route path="/analysis/fiscal" element={<FiscalAnalysis />} />
            <Route path="/salary-profile" element={<SalaryProfilePage />} />
            <Route path="/salary-profile/history" element={<SalaryHistory />} />
            <Route path="/salary-profile/edit" element={<EditProfilePage />} />
            <Route path="/salary-profile/history/edit/:historyId" element={<EditHistoryRecord />} />
            <Route path="/salary-profile/update" element={<UpdateSalary />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
