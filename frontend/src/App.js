// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
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
// Mutual Funds
import MutualFundLogPage from './pages/mutual-funds/MutualFundLogPage';
import AddMutualFundPage from './pages/mutual-funds/AddMutualFundPage';
import EditMutualFundPage from './pages/mutual-funds/EditMutualFundPage';
import MutualFundSummaryPage from './pages/mutual-funds/MutualFundSummaryPage';
// Gold Logs
import GoldLogPage from './pages/gold/GoldLogPage';
import AddGoldPage from './pages/gold/AddGoldPage';
import EditGoldPage from './pages/gold/EditGoldPage';
import GoldSummaryPage from './pages/gold/GoldSummaryPage';
// Certificates
import CertificateLogPage from './pages/certificates/CertificateLogPage';
import AddCertificatePage from './pages/certificates/AddCertificatePage';
import EditCertificatePage from './pages/certificates/EditCertificatePage';
// Currency
import CurrencyLogPage from './pages/currency/CurrencyLogPage';
import AddCurrencyPage from './pages/currency/AddCurrencyPage';
import EditCurrencyPage from './pages/currency/EditCurrencyPage';


import './App.css';

function App() {
  return (
      <Router>
          <Routes>
              <Route path="*" element={<LandingPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
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
                    <Route path="/mutual-funds" element={<MutualFundLogPage />} />
                    <Route path="/mutual-funds/new" element={<AddMutualFundPage />} />
                    <Route path="/mutual-funds/edit/:id" element={<EditMutualFundPage />} />
                    <Route path="/mutual-funds/summary" element={<MutualFundSummaryPage />} />
                    <Route path="/gold-wallet" element={<GoldLogPage />} />
                    <Route path="/gold-wallet/new" element={<AddGoldPage />} />
                    <Route path="/gold-wallet/edit/:id" element={<EditGoldPage />} />
                    <Route path="/gold-wallet/summary" element={<GoldSummaryPage />} />
                    <Route path="/certificates" element={<CertificateLogPage />} />
                    <Route path="/certificates/new" element={<AddCertificatePage />} />
                      <Route path="/certificates/edit/:id" element={<EditCertificatePage />} />
                    <Route path="/currency" element={<CurrencyLogPage />} />
                    <Route path="/currency/new" element={<AddCurrencyPage />} />
                    <Route path="/currency/edit/:id" element={<EditCurrencyPage />} />
                </Route>
          </Routes>
    </Router>
  );
}

export default App;
