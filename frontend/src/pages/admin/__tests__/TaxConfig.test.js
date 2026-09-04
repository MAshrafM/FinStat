// frontend/src/pages/admin/__tests__/TaxConfig.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaxConfigCard from '../TaxConfigCard';
import TaxConfigModal from '../TaxConfigModal';
import DeleteConfirmModal from '../DeleteConfirmModal';

describe('TaxConfigCard Component', () => {
  const mockConfig = {
    _id: 'tax-123',
    year: 2024,
    country: 'Egypt',
    personalExemption: 15000,
    isActive: true,
    brackets: [
      { _id: 'b1', level: 1, from: 0, to: 15000, rate: 0 },
      { _id: 'b2', level: 2, from: 15001, to: 30000, rate: 2.5 },
      { _id: 'b3', level: 3, from: 30001, to: 100000000, rate: 22.5 },
    ],
  };

  it('renders tax configuration details correctly', () => {
    render(
      <TaxConfigCard
        config={mockConfig}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggleActive={jest.fn()}
      />
    );

    expect(screen.getByText('2024 Tax Brackets')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('15,000 EGP')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('22.5%')).toBeInTheDocument();
    expect(screen.getByText('∞')).toBeInTheDocument();
  });

  it('calls onEdit, onDelete, and onToggleActive callbacks', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onToggleActive = jest.fn();

    render(
      <TaxConfigCard
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

  it('renders inactive status badge correctly', () => {
    const inactiveConfig = { ...mockConfig, isActive: false };
    render(
      <TaxConfigCard
        config={inactiveConfig}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onToggleActive={jest.fn()}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByLabelText(/Activate configuration/i)).toBeInTheDocument();
  });
});

describe('TaxConfigModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <TaxConfigModal
        isOpen={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(screen.queryByText(/New Tax Bracket Configuration/i)).not.toBeInTheDocument();
  });

  it('renders create mode with default fields and allows adding bracket tier', () => {
    const onSave = jest.fn();
    render(
      <TaxConfigModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    expect(screen.getByText('New Tax Bracket Configuration')).toBeInTheDocument();

    const addRowBtn = screen.getByText(/Add Row/i);
    fireEvent.click(addRowBtn);

    // Initial default has 7 tiers, adding 1 makes 8
    expect(screen.getByText('#8')).toBeInTheDocument();
  });

  it('validates that To is greater than From', () => {
    const onSave = jest.fn();
    render(
      <TaxConfigModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
        config={{
          year: 2024,
          personalExemption: 15000,
          isActive: true,
          brackets: [{ level: 1, from: 50000, to: 40000, rate: 10 }],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Update Configuration/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/'To' \(40000\) must be strictly greater than 'From' \(50000\)/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with valid data', () => {
    const onSave = jest.fn();
    render(
      <TaxConfigModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
        config={{
          year: 2024,
          country: 'Egypt',
          personalExemption: 15000,
          isActive: true,
          brackets: [
            { level: 1, from: 0, to: 15000, rate: 0 },
            { level: 2, from: 15001, to: 30000, rate: 2.5 },
          ],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Update Configuration/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        year: 2024,
        country: 'Egypt',
        personalExemption: 15000,
        isActive: true,
      })
    );
  });
});

describe('DeleteConfirmModal Component', () => {
  it('renders confirmation message and handles confirm/cancel', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <DeleteConfirmModal
        isOpen={true}
        title="Delete 2024 Tax Brackets"
        message="Are you sure you want to delete the 2024 Tax Brackets configuration? This action cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Delete 2024 Tax Brackets')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete the 2024 Tax Brackets configuration\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Delete Configuration/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
