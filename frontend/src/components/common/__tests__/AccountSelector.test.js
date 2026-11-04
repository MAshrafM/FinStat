// frontend/src/components/common/__tests__/AccountSelector.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountSelector from '../AccountSelector';

describe('AccountSelector Component Unit Tests [7C.0a0]', () => {
  test('renders source options (Bank, Cash) by default', () => {
    render(<AccountSelector value="Bank" onChange={jest.fn()} />);

    expect(screen.getByText('Paid From (Source Account)')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bank Account' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cash Ledger' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  test('renders destination options (Bank, Cash, Prepaid) when direction="destination"', () => {
    render(<AccountSelector direction="destination" value="Bank" onChange={jest.fn()} />);

    expect(screen.getByText('Deposit To (Destination Account)')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bank Account' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cash Ledger' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Prepaid Card' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  test('does NOT include Prepaid in source mode', () => {
    render(<AccountSelector direction="source" value="Bank" onChange={jest.fn()} />);

    expect(screen.queryByText('Prepaid Card')).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Prepaid Card' })).toBeNull();
  });

  test('calls onChange handler when selection changes', () => {
    const handleChange = jest.fn();
    render(<AccountSelector value="Bank" onChange={handleChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Cash' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('uses custom label when provided', () => {
    render(
      <AccountSelector
        label="Settlement Funding Source"
        value="Bank"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Settlement Funding Source')).toBeInTheDocument();
    expect(screen.queryByText('Paid From (Source Account)')).not.toBeInTheDocument();
  });

  test('disables select element when disabled=true', () => {
    render(<AccountSelector disabled={true} value="Bank" onChange={jest.fn()} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  test('respects custom name and className props', () => {
    const { container } = render(
      <AccountSelector
        name="customAccountField"
        className="custom-form-group"
        value="Bank"
        onChange={jest.fn()}
      />
    );

    expect(container.firstChild).toHaveClass('custom-form-group');
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('name', 'customAccountField');
  });
});
