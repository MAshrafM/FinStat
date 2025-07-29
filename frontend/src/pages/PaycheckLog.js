// frontend/src/pages/PaycheckLog.js
import React, { useState, useEffect } from 'react';
import PaycheckTable from '../components/PaycheckTable';
import { getPaychecks, deletePaycheck } from '../services/paycheckService';

const PaycheckLog = () => {
  const [paychecks, setPaychecks] = useState([]);

  useEffect(() => {
    loadPaychecks();
  }, []);

  const loadPaychecks = async () => {
    const data = await getPaychecks();
    setPaychecks(data);
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
    </div>
  );
};

export default PaycheckLog;
