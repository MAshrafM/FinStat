// frontend/src/components/PaginationControls.js
import React from 'react';
import './PaginationControls.css'; // We will create this file

const PaginationControls = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Don't show controls if there's only one page
  }

  return (
    <div className="pagination-container">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        &laquo; Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default PaginationControls;
