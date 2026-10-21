// frontend/src/components/common/ViewOnlyBanner.js
import React from 'react';
import { useCanModify } from '../../context/AuthContext';
import './ViewOnlyBanner.css';

/**
 * Global banner displayed across authenticated pages when the current user has the viewer role.
 * Informs the user immediately that their account is in read-only mode.
 */
export const ViewOnlyBanner = () => {
  const { isViewer } = useCanModify();

  if (!isViewer) {
    return null;
  }

  return (
    <div className="view-only-banner" role="status" aria-live="polite">
      <span className="view-only-icon" aria-hidden="true">
        👁️
      </span>
      <span>
        You are viewing in <strong>read-only mode</strong>. Contact your administrator for edit access.
      </span>
    </div>
  );
};

export default ViewOnlyBanner;
