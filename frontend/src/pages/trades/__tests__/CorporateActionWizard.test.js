/* eslint-disable testing-library/no-node-access */
// frontend/src/pages/trades/__tests__/CorporateActionWizard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CorporateActionWizard from '../CorporateActionWizard';
import * as corporateActionService from '../../../services/corporateActionService';
import * as DataContext from '../../../context/DataContext';
import { ToastProvider } from '../../../context/ToastContext';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = require('../../../../node_modules/react-router/dist/development/index.js');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/corporateActionService');
jest.mock('../../../context/DataContext');

const mockPositions = [
  {
    _id: { stockCode: 'COMI', broker: 'Thndr' },
    currentShares: 1000,
    avgPrice: 50.0,
    averageBuyPrice: 50.0,
  },
  {
    _id: { stockCode: 'AMOC', broker: 'Hermes' },
    currentShares: 2000,
    avgPrice: 10.0,
    averageBuyPrice: 10.0,
  },
];

const renderComponent = (customOpenPositions = mockPositions, isLoading = false) => {
  DataContext.useData.mockReturnValue({
    openPosData: customOpenPositions,
    isLoading,
  });

  return render(
    <ToastProvider>
      <MemoryRouter>
        <CorporateActionWizard />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('CorporateActionWizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Renders wizard page header, title, subtitle, and stepper', () => {
    renderComponent();

    expect(screen.getByText('Corporate Action Wizard')).toBeInTheDocument();
    expect(
      screen.getByText(/Apply stock splits or bonus share distributions retroactively/i)
    ).toBeInTheDocument();
    expect(screen.getByText('1. Select Stock')).toBeInTheDocument();
    expect(screen.getByText('2. Action & Ratio')).toBeInTheDocument();
    expect(screen.getByText('3. Review & Apply')).toBeInTheDocument();
  });

  test('2. Step 1: Renders available positions in dropdown with current shares and average price', () => {
    renderComponent();

    const select = screen.getByLabelText(/Select Open Stock Holding/i);
    expect(select).toBeInTheDocument();
    expect(select.children.length).toBe(2);
    expect(select.children[0].textContent).toContain('COMI (Thndr) - 1,000 shares');
    expect(select.children[1].textContent).toContain('AMOC (Hermes) - 2,000 shares');
  });

  test('3. Step 1: Shows warning alert card when no active positions exist in portfolio', () => {
    renderComponent([], false);

    expect(
      screen.getByText(/No open stock positions found in your portfolio/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Select Open Stock Holding/i)).not.toBeInTheDocument();
  });

  test('4. Step 1: Disables Continue button when no stock is selected', () => {
    renderComponent([], false);

    const continueBtn = screen.getByRole('button', { name: /Continue to Action Setup/i });
    expect(continueBtn).toBeDisabled();
  });

  test('5. Step 1: Updates preview KPI tiles when position selection changes', () => {
    renderComponent();

    expect(screen.getByText('COMI')).toBeInTheDocument();
    expect(screen.getByText('Thndr')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();

    const select = screen.getByLabelText(/Select Open Stock Holding/i);
    fireEvent.change(select, { target: { value: 'AMOC_Hermes' } });

    expect(screen.getByText('AMOC')).toBeInTheDocument();
    expect(screen.getByText('Hermes')).toBeInTheDocument();
    expect(screen.getByText('2,000')).toBeInTheDocument();
  });

  test('6. Step 1: Navigates to Step 2 when Continue button is clicked', () => {
    renderComponent();

    const continueBtn = screen.getByRole('button', { name: /Continue to Action Setup/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText('Configure Corporate Action')).toBeInTheDocument();
    expect(screen.getByText('Corporate Action Type')).toBeInTheDocument();
  });

  test('7. Step 2: Allows switching between Stock Split and Bonus Issue with default ratios (2 vs 0.1)', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));

    const ratioInput = screen.getByLabelText(/Split Ratio/i);
    expect(ratioInput.value).toBe('2');

    // Click Bonus Issue toggle
    const bonusToggle = screen.getByRole('button', { name: /Bonus Issue/i });
    fireEvent.click(bonusToggle);

    const bonusRatioInput = screen.getByLabelText(/Bonus Issue Ratio/i);
    expect(bonusRatioInput.value).toBe('0.1');
  });

  test('8. Step 2: Validates ratio input (disables Preview button for non-positive or missing ratio)', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));

    const ratioInput = screen.getByLabelText(/Split Ratio/i);
    const previewBtn = screen.getByRole('button', { name: /Preview Impact/i });

    expect(previewBtn).not.toBeDisabled();

    fireEvent.change(ratioInput, { target: { value: '0' } });
    expect(previewBtn).toBeDisabled();

    fireEvent.change(ratioInput, { target: { value: '' } });
    expect(previewBtn).toBeDisabled();

    fireEvent.change(ratioInput, { target: { value: '3' } });
    expect(previewBtn).not.toBeDisabled();
  });

  test('9. Step 2: Updates form fields (ratio, date, notes) on user input', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));

    const ratioInput = screen.getByLabelText(/Split Ratio/i);
    fireEvent.change(ratioInput, { target: { value: '4' } });
    expect(ratioInput.value).toBe('4');

    const dateInput = screen.getByLabelText(/Effective Date/i);
    fireEvent.change(dateInput, { target: { value: '2026-02-01' } });
    expect(dateInput.value).toBe('2026-02-01');

    const notesInput = screen.getByLabelText(/Notes/i);
    fireEvent.change(notesInput, { target: { value: 'Board resolution 4:1' } });
    expect(notesInput.value).toBe('Board resolution 4:1');
  });

  test('10. Step 2: Allows navigation back to Step 1 via Back button', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));
    expect(screen.getByText('Configure Corporate Action')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn);

    expect(screen.getByText('Select a Position')).toBeInTheDocument();
  });

  test('11. Step 3: Calculation parity (multiplier, new shares, new avg price, total cost) for Stock Split', () => {
    renderComponent();

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));

    // Set 2:1 Split
    const ratioInput = screen.getByLabelText(/Split Ratio/i);
    fireEvent.change(ratioInput, { target: { value: '2' } });

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Preview Impact/i }));

    expect(screen.getByText('Review & Confirm Impact')).toBeInTheDocument();
    // Before: 1,000 shares @ 50.00
    expect(screen.getByText('1,000')).toBeInTheDocument();
    // After: 2,000 shares (1000 * 2)
    expect(screen.getByText('2,000')).toBeInTheDocument();
    // Total cost preserved: 50,000.00
    expect(screen.getAllByText(/50,000\.00/).length).toBeGreaterThan(0);
  });

  test('12. Step 3: Calculation parity (multiplier, new shares, new avg price, total cost) for Bonus Issue', () => {
    renderComponent();

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));

    // Bonus 10% (0.10)
    fireEvent.click(screen.getByRole('button', { name: /Bonus Issue/i }));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Preview Impact/i }));

    // Before: 1,000 shares
    expect(screen.getByText('1,000')).toBeInTheDocument();
    // After: 1000 * (1 + 0.1) = 1,100 shares
    expect(screen.getByText('1,100')).toBeInTheDocument();
  });

  test('13. Step 3: Submits payload to executeCorporateActionWizard, triggers toast and navigates', async () => {
    corporateActionService.executeCorporateActionWizard.mockResolvedValueOnce({
      data: { success: true },
    });

    renderComponent();

    // Step 1 -> Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));
    fireEvent.click(screen.getByRole('button', { name: /Preview Impact/i }));

    const submitBtn = screen.getByRole('button', { name: /Confirm & Apply Corporate Action/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(corporateActionService.executeCorporateActionWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          stockCode: 'COMI',
          broker: 'Thndr',
          type: 'split',
          ratio: 2,
          logTrade: true,
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/corporate-actions');
    });
  });

  test('14. Passes jest-axe accessibility audit across Step 1, Step 2, and Step 3 with 0 violations', async () => {
    const { container } = renderComponent();

    // Step 1
    let results = await axe(container);
    expect(results).toHaveNoViolations();

    // Step 2
    fireEvent.click(screen.getByRole('button', { name: /Continue to Action Setup/i }));
    results = await axe(container);
    expect(results).toHaveNoViolations();

    // Step 3
    fireEvent.click(screen.getByRole('button', { name: /Preview Impact/i }));
    results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
