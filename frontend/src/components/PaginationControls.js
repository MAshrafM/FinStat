// frontend/src/components/PaginationControls.js
import React from 'react';
import './PaginationControls.css'; // We will create this file

const PaginationControls = ({
  page = 1,
  currentPage,
  totalPages = 1,
  totalCount,
  onPageChange,
  showAlways = false,
}) => {
  const activePage = page || currentPage || 1;
  if (totalPages <= 1 && !showAlways) {
    return null;
  }

  return (
    <div className="pagination-container">
      <button
        onClick={() => onPageChange(activePage - 1)}
        disabled={activePage <= 1}
      >
        &laquo; Previous
      </button>
      <span>
        Page {activePage} of {totalPages}
        {totalCount !== undefined ? ` (${totalCount} total)` : ''}
      </span>
      <button
        onClick={() => onPageChange(activePage + 1)}
        disabled={activePage >= totalPages}
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default PaginationControls;
