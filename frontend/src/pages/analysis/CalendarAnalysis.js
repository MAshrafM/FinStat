// frontend/src/pages/analysis/CalendarAnalysis.js
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Backward-compatible redirect wrapper.
 * Consolidated into PayrollAnalyticsPage in Phase 6A (SIMP-002).
 */
const CalendarAnalysis = () => {
  return <Navigate to="/analysis/payroll?cycle=calendar" replace />;
};

export default CalendarAnalysis;
