// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
// Paycheck Log
import PaycheckLog from './pages/paycheck/PaycheckLog';
import AddPaycheck from './pages/paycheck/AddPaycheck';
import EditPaycheck from './pages/paycheck/EditPaycheck';
// Pay Analysis
import CalendarAnalysis from './pages/analysis/CalendarAnalysis';
import FiscalAnalysis from './pages/analysis/FiscalAnalysis';
// Salary Profile
import SalaryProfilePage from './pages/salary/SalaryProfilePage';
import SalaryHistory from './pages/salary/SalaryHistory';
import EditProfilePage from './pages/salary/EditProfilePage';
import EditHistoryRecord from './pages/salary/EditHistoryRecord';
import UpdateSalary from './pages/salary/UpdateSalary';
// Social Insurance
import SocialInsurancePage from './pages/insurance/SocialInsurancePage';
import ManageInsurancePage from './pages/insurance/ManageInsurancePage';
// Taxes
import TaxesPage from './pages/taxes/TaxesPage';
import ManageTaxBracketsPage from './pages/taxes/ManageTaxBracketsPage';
// Expenditures
import ExpenditureLogPage from './pages/expenditure/ExpenditureLogPage';
import AddExpenditurePage from './pages/expenditure/AddExpenditurePage';
import EditExpenditurePage from './pages/expenditure/EditExpenditurePage';
import ExpenditureAnalysisPage from './pages/expenditure/ExpenditureAnalysisPage';
// Trades
import TradeLogPage from './pages/trades/TradeLogPage';
import AddTradePage from './pages/trades/AddTradePage';
import EditTradePage from './pages/trades/EditTradePage';
import TradeSummaryPage from './pages/trades/TradeSummaryPage';

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
            <Route path="/social-insurance" element={<SocialInsurancePage />} />
            <Route path="/social-insurance/manage" element={<ManageInsurancePage />} />
            <Route path="/taxes" element={<TaxesPage />} />
            <Route path="/taxes/manage" element={<ManageTaxBracketsPage />} />
            <Route path="/expenditures" element={<ExpenditureLogPage />} />
            <Route path="/expenditures/new" element={<AddExpenditurePage />} />
            <Route path="/expenditures/edit/:id" element={<EditExpenditurePage />} />
            <Route path="/expenditure-analysis" element={<ExpenditureAnalysisPage />} />
            <Route path="/trades" element={<TradeLogPage />} />
            <Route path="/trades/new" element={<AddTradePage />} />
                      <Route path="/trades/edit/:id" element={<EditTradePage />} />
                      <Route path="/trade-summary" element={<TradeSummaryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
