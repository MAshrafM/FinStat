// frontend/src/pages/expenditure/AddExpenditurePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpenditure, getLatestExpenditure } from '../../services/expenditureService';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Loading } from '../../components/ui';
import ExpenditureSubNav from './ExpenditureSubNav';
import ExpenditureForm from './ExpenditureForm';
import './Expenditure.css';

const AddExpenditurePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lastRecord, setLastRecord] = useState({ bank: 0, cash: 0, prepaid: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLatestExpenditure()
      .then((data) => {
        if (data) {
          setLastRecord({ bank: data.bank, cash: data.cash, prepaid: data.prepaid || 0 });
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch latest expenditure:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (dataToSubmit) => {
    try {
      await createExpenditure(dataToSubmit);
      showToast('Expenditure added successfully', 'success');
      navigate('/expenditures');
    } catch (error) {
      console.error('Failed to create expenditure:', error);
    }
  };

  return (
    <div className="fs-page">
      <PageHeader
        title="New Expenditure"
        subtitle="Record a single or split transaction"
      />
      <ExpenditureSubNav />
      {isLoading ? (
        <Loading variant="form-field" text="Loading expenditure..." />
      ) : (
        <ExpenditureForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/expenditures')}
          mode="create"
          lastRecord={lastRecord}
        />
      )}
    </div>
  );
};

export default AddExpenditurePage;
