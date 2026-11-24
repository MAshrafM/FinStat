/* eslint-disable testing-library/no-node-access */
// frontend/src/pages/trades/__tests__/CorporateActionsList.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CorporateActionsList from '../CorporateActionsList';
import * as corporateActionService from '../../../services/corporateActionService';
import { ToastProvider } from '../../../context/ToastContext';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/corporateActionService');

const mockCorporateActions = [
  {
    _id: 'ca-1',
    stockCode: 'COMI',
    broker: 'Thndr',
    type: 'split',
    ratio: 2,
    effectiveDate: '2026-01-15T00:00:00.000Z',
    notes: '2:1 Stock Split approved by EGX',
  },
  {
    _id: 'ca-2',
    stockCode: 'AMOC',
    broker: 'Hermes',
    type: 'bonus',
    ratio: 0.1,
    effectiveDate: '2026-01-10T00:00:00.000Z',
    notes: '10% Bonus Share Distribution',
  },
];

const renderComponent = (canModify = true) => {
  jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
    isViewOnly: !canModify,
    user: { role: canModify ? 'admin' : 'viewer', username: 'testuser' },
  });
  jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
    canModify,
    isViewer: !canModify,
    isAdmin: canModify,
    isManager: canModify,
    role: canModify ? 'admin' : 'viewer',
  });

  return render(
    <ToastProvider>
      <MemoryRouter>
        <CorporateActionsList />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('CorporateActionsList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Renders registry header, title, and subtitle', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent();

    expect(screen.getByText('Corporate Actions Registry')).toBeInTheDocument();
    expect(
      screen.getByText(/Historical splits and bonus share events applied dynamically/i)
    ).toBeInTheDocument();
    expect(screen.getByTitle('Refresh action list')).toBeInTheDocument();
    expect(screen.getByTitle('Launch Action Wizard')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });
  });

  test('2. Displays loading skeleton when fetching', () => {
    corporateActionService.getCorporateActions.mockReturnValueOnce(new Promise(() => {}));

    renderComponent();

    expect(screen.getByText('Loading corporate actions...')).toBeInTheDocument();
  });

  test('3. Displays empty state message and CTA button when no actions exist', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: [] },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No Corporate Actions Registered')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Record stock splits and bonus distributions to automatically adjust share quantities/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Apply First Corporate Action')).toBeInTheDocument();
  });

  test('4. Renders action table with stock, broker, action type, ratio, date, and notes', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    expect(screen.getByText('AMOC')).toBeInTheDocument();
    expect(screen.getByText('Thndr')).toBeInTheDocument();
    expect(screen.getByText('Hermes')).toBeInTheDocument();
    expect(screen.getByText('2:1 Stock Split approved by EGX')).toBeInTheDocument();
    expect(screen.getByText('10% Bonus Share Distribution')).toBeInTheDocument();
  });

  test('5. Formats split ratio as "X:1" and bonus issue ratio as percentage "X.X%"', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('2:1').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('10.0%').length).toBeGreaterThan(0);
  });

  test('6. Opens delete confirmation dialog when Remove button clicked', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle('Remove corporate action');
    fireEvent.click(removeButtons[0]);

    expect(screen.getByText('Remove Corporate Action?')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to remove the/i)).toBeInTheDocument();
  });

  test('7. Cancels delete dialog when Cancel button clicked', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle('Remove corporate action');
    fireEvent.click(removeButtons[0]);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Remove Corporate Action?')).not.toBeInTheDocument();
    });
  });

  test('8. Confirms deletion, dispatches API call, and refreshes list', async () => {
    corporateActionService.getCorporateActions
      .mockResolvedValueOnce({ data: { data: mockCorporateActions } })
      .mockResolvedValueOnce({ data: { data: [mockCorporateActions[1]] } });

    corporateActionService.deleteCorporateAction.mockResolvedValueOnce({
      data: { success: true },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle('Remove corporate action');
    fireEvent.click(removeButtons[0]);

    const confirmButton = screen.getByRole('button', { name: 'Confirm Remove' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(corporateActionService.deleteCorporateAction).toHaveBeenCalledWith('ca-1');
    });

    await waitFor(() => {
      expect(screen.queryByText('Remove Corporate Action?')).not.toBeInTheDocument();
    });
  });

  test('9. Closes delete dialog when Escape key is pressed', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle('Remove corporate action');
    fireEvent.click(removeButtons[0]);

    expect(screen.getByText('Remove Corporate Action?')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Remove Corporate Action?')).not.toBeInTheDocument();
    });
  });

  test('10. Toggles mobile card expand/collapse to reveal details and mobile action button', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    const expanderButtons = screen.getAllByLabelText('Expand corporate action details');
    expect(expanderButtons.length).toBe(2);

    // Click expander on first mobile card
    fireEvent.click(expanderButtons[0]);

    expect(screen.getByText('Remove Corporate Action')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse corporate action details')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(screen.getByLabelText('Collapse corporate action details'));
    expect(screen.queryByText('Remove Corporate Action')).not.toBeInTheDocument();
  });

  test('11. Restricts delete action in read-only / viewer mode (canModify = false)', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    renderComponent(false); // viewer mode

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    const removeButtons = screen.queryAllByTitle('Remove corporate action');
    expect(removeButtons.length).toBe(0);
  });

  test('12. Passes jest-axe accessibility audit with 0 violations', async () => {
    corporateActionService.getCorporateActions.mockResolvedValueOnce({
      data: { data: mockCorporateActions },
    });

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMI')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
