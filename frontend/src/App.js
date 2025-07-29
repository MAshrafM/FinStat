// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PaycheckLog from './pages/PaycheckLog';
import AddPaycheck from './pages/AddPaycheck';
import EditPaycheck from './pages/EditPaycheck';
import CalendarAnalysis from './pages/analysis/CalendarAnalysis';
import FiscalAnalysis from './pages/analysis/FiscalAnalysis';
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
