// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PaycheckLog from './pages/PaycheckLog';
import AddPaycheck from './pages/AddPaycheck';
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
