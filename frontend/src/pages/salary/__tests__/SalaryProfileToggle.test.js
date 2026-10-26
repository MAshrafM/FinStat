jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}), { virtual: true });

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpdateSalary from '../UpdateSalary';
import ComponentTable from '../../../components/salary/ComponentTable';
import { getProfile, saveProfile } from '../../../services/salaryService';
import { updateSalaryProfile } from '../../../services/salaryProfileService';
import { ToastProvider } from '../../../context/ToastContext';

jest.mock('../../../services/salaryService', () => ({
  getProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

jest.mock('../../../services/salaryProfileService', () => ({
  updateSalaryProfile: jest.fn(),
}));

describe('Step 4D.3: [MF-DEF-009] Salary Profile Component Toggle State Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ComponentTable renders Active column header and locks basic salary toggle', () => {
    const mockComponents = [
      { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 12000, isActive: true },
      { name: 'Housing Allowance', category: 'allowance', type: 'fixed', value: 3000, isActive: true },
    ];
    const onChange = jest.fn();

    render(
      <ComponentTable
        components={mockComponents}
        onChange={onChange}
        readOnly={false}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();

    const basicToggle = screen.getByLabelText('Toggle active for Basic Salary');
    expect(basicToggle).toBeInTheDocument();
    expect(basicToggle).toBeDisabled();
    expect(basicToggle.checked).toBe(true);

    const allowanceToggle = screen.getByLabelText('Toggle active for Housing Allowance');
    expect(allowanceToggle).toBeInTheDocument();
    expect(allowanceToggle).not.toBeDisabled();
    expect(allowanceToggle.checked).toBe(true);
  });

  test('unchecking allowance toggle triggers onChange with isActive: false and renders Inactive badge', () => {
    const mockComponents = [
      { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 12000, isActive: true },
      { name: 'Transport Allowance', category: 'allowance', type: 'fixed', value: 1500, isActive: true },
    ];
    const onChange = jest.fn();

    const { rerender } = render(
      <ComponentTable
        components={mockComponents}
        onChange={onChange}
        readOnly={false}
      />
    );

    const transportToggle = screen.getByLabelText('Toggle active for Transport Allowance');
    fireEvent.click(transportToggle);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedPayload = onChange.mock.calls[0][0];
    expect(updatedPayload[1].isActive).toBe(false);

    // Re-render with inactive state to verify visual indicator
    rerender(
      <ComponentTable
        components={[
          mockComponents[0],
          { ...mockComponents[1], isActive: false },
        ]}
        onChange={onChange}
        readOnly={false}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
    const inactiveToggle = screen.getByLabelText('Toggle active for Transport Allowance');
    expect(inactiveToggle.checked).toBe(false);
  });

  test('submitting UpdateSalary with disabled allowance sets isActive: false and value: 0 in payload', async () => {
    const mockProfile = {
      _id: 'prof_toggle_test',
      name: 'Executive Profile',
      title: 'VP Engineering',
      position: 'Senior Exec',
      year: 2025,
      effectiveDate: '2025-01-01',
      components: [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 20000, isActive: true },
        { name: 'Mobile Allowance', category: 'allowance', type: 'fixed', value: 1000, isActive: true },
      ],
    };

    getProfile.mockResolvedValue(mockProfile);
    updateSalaryProfile.mockResolvedValue({ success: true });

    render(
      <ToastProvider>
        <UpdateSalary />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Executive Profile')).toBeInTheDocument();
    });

    // Uncheck Mobile Allowance
    const mobileToggle = screen.getByLabelText('Toggle active for Mobile Allowance');
    expect(mobileToggle.checked).toBe(true);
    fireEvent.click(mobileToggle);
    expect(mobileToggle.checked).toBe(false);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Save Salary Structure/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSalaryProfile).toHaveBeenCalledTimes(1);
    });

    const callArgs = updateSalaryProfile.mock.calls[0];
    expect(callArgs[0]).toBe('prof_toggle_test');
    const submittedComponents = callArgs[1].components;

    // Basic salary remains active with original value
    expect(submittedComponents[0].name).toBe('Basic Salary');
    expect(submittedComponents[0].isActive).toBe(true);
    expect(submittedComponents[0].value).toBe(20000);

    // Mobile allowance is inactive with value: 0
    expect(submittedComponents[1].name).toBe('Mobile Allowance');
    expect(submittedComponents[1].isActive).toBe(false);
    expect(submittedComponents[1].value).toBe(0);
  });

  test('reloading profile with isActive: false preserves inactive state across reloads', async () => {
    const mockProfile = {
      _id: 'prof_persisted_inactive',
      name: 'Persisted Profile',
      title: 'Dev Lead',
      year: 2025,
      components: [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isActive: true },
        { name: 'Gym Allowance', category: 'allowance', type: 'fixed', value: 0, isActive: false },
      ],
    };

    getProfile.mockResolvedValue(mockProfile);

    render(
      <ToastProvider>
        <UpdateSalary />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Persisted Profile')).toBeInTheDocument();
    });

    const gymToggle = screen.getByLabelText('Toggle active for Gym Allowance');
    expect(gymToggle.checked).toBe(false);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
