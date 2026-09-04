// frontend/src/pages/admin/__tests__/InsuranceConfig.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InsuranceConfigCard from '../InsuranceConfigCard';
import InsuranceConfigModal from '../InsuranceConfigModal';

describe('InsuranceConfigCard Component', () => {
  const mockConfig = {
    _id: 'ins-123',
    year: 2024,
    country: 'Egypt',
    employeeShare: 11,
    employerShare: 18.75,
    minInsurableIncome: 2000,
    maxInsurableIncome: 12600,
    isActive: true,
  };

  it('renders insurance metrics correctly', () => {
    render(
      <InsuranceConfigCard
        config={mockConfig}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggleActive={jest.fn()}
      />
    );

    expect(screen.getByText('2024 Social Insurance')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('11%')).toBeInTheDocument();
    expect(screen.getByText('18.75%')).toBeInTheDocument();
    expect(screen.getByText('2,000 EGP')).toBeInTheDocument();
    expect(screen.getByText('12,600 EGP')).toBeInTheDocument();
  });

  it('triggers onEdit, onDelete, and onToggleActive callbacks', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onToggleActive = jest.fn();

    render(
      <InsuranceConfigCard
        config={mockConfig}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleActive={onToggleActive}
      />
    );

    fireEvent.click(screen.getByLabelText(/Edit configuration/i));
    expect(onEdit).toHaveBeenCalledWith(mockConfig);

    fireEvent.click(screen.getByLabelText(/Delete configuration/i));
    expect(onDelete).toHaveBeenCalledWith(mockConfig);

    fireEvent.click(screen.getByLabelText(/Deactivate configuration/i));
    expect(onToggleActive).toHaveBeenCalledWith(mockConfig);
  });
});

describe('InsuranceConfigModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <InsuranceConfigModal
        isOpen={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(screen.queryByText(/New Social Insurance Configuration/i)).not.toBeInTheDocument();
  });

  it('validates that maxInsurableIncome is >= minInsurableIncome', () => {
    const onSave = jest.fn();
    render(
      <InsuranceConfigModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
        config={{
          year: 2024,
          employeeShare: 11,
          employerShare: 18.75,
          minInsurableIncome: 15000,
          maxInsurableIncome: 10000,
          isActive: true,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Update Configuration/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Max Insurable Income must be greater than or equal to Min Insurable Income/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits form with valid data', () => {
    const onSave = jest.fn();
    render(
      <InsuranceConfigModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
        config={{
          year: 2024,
          country: 'Egypt',
          employeeShare: 11,
          employerShare: 18.75,
          minInsurableIncome: 2000,
          maxInsurableIncome: 12600,
          isActive: true,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Update Configuration/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        year: 2024,
        employeeShare: 11,
        employerShare: 18.75,
        minInsurableIncome: 2000,
        maxInsurableIncome: 12600,
        isActive: true,
      })
    );
  });
});
