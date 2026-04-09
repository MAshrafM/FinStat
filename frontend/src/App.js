// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // Keep standard import for immediate auth evaluation
import './App.css';
import './components/Table.css';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Summary = React.lazy(() => import('./pages/DashboardSummary'));
// Paycheck Log
const PaycheckLog = React.lazy(() => import('./pages/paycheck/PaycheckLog'));
const AddPaycheck = React.lazy(() => import('./pages/paycheck/AddPaycheck'));
const EditPaycheck = React.lazy(() => import('./pages/paycheck/EditPaycheck'));
// Pay Analysis
const CalendarAnalysis = React.lazy(() => import('./pages/analysis/CalendarAnalysis'));
const FiscalAnalysis = React.lazy(() => import('./pages/analysis/FiscalAnalysis'));
// Salary Profile
const SalaryProfilePage = React.lazy(() => import('./pages/salary/SalaryProfilePage'));
const SalaryHistory = React.lazy(() => import('./pages/salary/SalaryHistory'));
const EditProfilePage = React.lazy(() => import('./pages/salary/EditProfilePage'));
const EditHistoryRecord = React.lazy(() => import('./pages/salary/EditHistoryRecord'));
const UpdateSalary = React.lazy(() => import('./pages/salary/UpdateSalary'));
// Social Insurance
const SocialInsurancePage = React.lazy(() => import('./pages/insurance/SocialInsurancePage'));
const ManageInsurancePage = React.lazy(() => import('./pages/insurance/ManageInsurancePage'));
// Taxes
const TaxesPage = React.lazy(() => import('./pages/taxes/TaxesPage'));
const ManageTaxBracketsPage = React.lazy(() => import('./pages/taxes/ManageTaxBracketsPage'));
// Expenditures
const ExpenditureLogPage = React.lazy(() => import('./pages/expenditure/ExpenditureLogPage'));
const AddExpenditurePage = React.lazy(() => import('./pages/expenditure/AddExpenditurePage'));
const EditExpenditurePage = React.lazy(() => import('./pages/expenditure/EditExpenditurePage'));
const ExpenditureAnalysisPage = React.lazy(() => import('./pages/expenditure/ExpenditureAnalysisPage'));
// Trades
const TradeLogPage = React.lazy(() => import('./pages/trades/TradeLogPage'));
const AddTradePage = React.lazy(() => import('./pages/trades/AddTradePage'));
const EditTradePage = React.lazy(() => import('./pages/trades/EditTradePage'));
const TradeSummaryPage = React.lazy(() => import('./pages/trades/TradeSummaryPage'));
// Mutual Funds
const MutualFundLogPage = React.lazy(() => import('./pages/mutual-funds/MutualFundLogPage'));
const AddMutualFundPage = React.lazy(() => import('./pages/mutual-funds/AddMutualFundPage'));
const EditMutualFundPage = React.lazy(() => import('./pages/mutual-funds/EditMutualFundPage'));
const MutualFundSummaryPage = React.lazy(() => import('./pages/mutual-funds/MutualFundSummaryPage'));
// Gold Logs
const GoldLogPage = React.lazy(() => import('./pages/gold/GoldLogPage'));
const AddGoldPage = React.lazy(() => import('./pages/gold/AddGoldPage'));
const EditGoldPage = React.lazy(() => import('./pages/gold/EditGoldPage'));
const GoldSummaryPage = React.lazy(() => import('./pages/gold/GoldSummaryPage'));
// Certificates
const CertificateLogPage = React.lazy(() => import('./pages/certificates/CertificateLogPage'));
const AddCertificatePage = React.lazy(() => import('./pages/certificates/AddCertificatePage'));
const EditCertificatePage = React.lazy(() => import('./pages/certificates/EditCertificatePage'));
// Currency
const CurrencyLogPage = React.lazy(() => import('./pages/currency/CurrencyLogPage'));
const AddCurrencyPage = React.lazy(() => import('./pages/currency/AddCurrencyPage'));
const EditCurrencyPage = React.lazy(() => import('./pages/currency/EditCurrencyPage'));
// Credit Cards
const CreditCardPage = React.lazy(() => import('./pages/credit-cards/CreditCardPage'));

function App() {
  return (
    <Router>
      <React.Suspense fallback={<div className="loading-spinner">Loading...</div>}>
        <Routes>
          <Route path="*" element={<LandingPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/summary" element={<Summary />} />
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
            <Route path="/credit-cards" element={<CreditCardPage />} />
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
