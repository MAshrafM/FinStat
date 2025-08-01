// frontend/src/pages/PaycheckLog.js
import React, { useState, useEffect } from 'react';
import PaycheckTable from '../../components/PaycheckTable';
import { getPaychecksLog, deletePaycheck } from '../../services/paycheckService';
import PaginationControls from '../../components/PaginationControls';

const PaycheckLog = () => {
  const [paychecks, setPaychecks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPaychecks(currentPage);
  }, [currentPage]);

  const loadPaychecks = (page) => {
    getPaychecksLog(page).then(response =>{
      setPaychecks(response.data);
      setTotalPages(response.totalPages);
    });
  };

  const handleDeletePaycheck = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deletePaycheck(id);
      loadPaychecks();
    }
  };

  return (
    <div className="page-container">
      <PaycheckTable paychecks={paychecks} onPaycheckDeleted={handleDeletePaycheck} />

      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default PaycheckLog;
