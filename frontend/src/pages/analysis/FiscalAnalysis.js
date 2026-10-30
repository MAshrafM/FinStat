// frontend/src/pages/analysis/FiscalAnalysis.js
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Backward-compatible redirect wrapper.
 * Consolidated into PayrollAnalyticsPage in Phase 6A (SIMP-002).
 */
const FiscalAnalysis = () => {
  return <Navigate to="/analysis/payroll?cycle=fiscal" replace />;
};

export default FiscalAnalysis;
