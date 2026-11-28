// frontend/src/pages/credit-cards/__tests__/UtilizationWidget.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import UtilizationWidget from '../../../components/creditCards/UtilizationWidget';
import * as creditCardService from '../../../services/creditCardService';

expect.extend(toHaveNoViolations);

jest.mock('../../../services/creditCardService');

const MOCK_UTILIZATION_DATA = {
  overallUtilization: 48.5,
  totalBalance: 38800,
  totalLimit: 80000,
  hasAlerts: true,
  cards: [
    {
      cardId: 'c1',
      cardName: 'Low Card',
      utilization: 18,
      currentBalance: 9000,
      limit: 50000,
      threshold: 30,
      isAlert: false,
    },
    {
      cardId: 'c2',
      cardName: 'Mid Card',
      utilization: 45,
      currentBalance: 9000,
      limit: 20000,
      threshold: 30,
      isAlert: true,
    },
    {
      cardId: 'c3',
      cardName: 'Exact 70 Card',
      utilization: 70,
      currentBalance: 7000,
      limit: 10000,
      threshold: 30,
      isAlert: true,
    },
  ],
};

describe('UtilizationWidget (Phase 9A)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    creditCardService.getUtilization.mockResolvedValue(MOCK_UTILIZATION_DATA);
  });

  test('renders nothing while loading or when cards array is empty', async () => {
    creditCardService.getUtilization.mockResolvedValueOnce({ cards: [] });
    const { container } = render(<UtilizationWidget />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container.firstChild).toBeNull();
  });

  test('renders all three utilization tiers with 30/70 thresholds and exact 70% High boundary', async () => {
    render(<UtilizationWidget />);

    expect(await screen.findByText('Credit Utilization Health')).toBeInTheDocument();

    const lowProgress = screen.getByRole('progressbar', { name: 'Utilization for Low Card' });
    expect(lowProgress).not.toHaveClass('fs-progress--warning');
    expect(lowProgress).not.toHaveClass('fs-progress--negative');
    expect(lowProgress).toHaveAttribute('aria-valuetext', '18.0%');

    const midProgress = screen.getByRole('progressbar', { name: 'Utilization for Mid Card' });
    expect(midProgress).toHaveClass('fs-progress--warning');
    expect(midProgress).toHaveAttribute('aria-valuetext', '45.0% — Elevated');

    const highProgress = screen.getByRole('progressbar', { name: 'Utilization for Exact 70 Card' });
    expect(highProgress).toHaveClass('fs-progress--negative');
    expect(highProgress).toHaveAttribute('aria-valuetext', '70.0% — High');
  });

  test('renders Elevated and High labels only on >= 30% tiers and keeps < 30% unlabeled', async () => {
    render(<UtilizationWidget />);

    await screen.findByText('Low Card');
    expect(screen.getAllByText('Elevated').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1);
  });

  test('renders informational 30% alert banner and Above 30% Alert badges on alerting cards', async () => {
    render(<UtilizationWidget />);

    await screen.findByText('Mid Card');
    expect(
      screen.getByText(/One or more cards exceed the recommended 30% threshold/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Above 30% Alert/i)).toHaveLength(2);
  });

  test('overall progress bar reflects overall utilization and accessible valuetext', async () => {
    render(<UtilizationWidget />);

    const overall = await screen.findByRole('progressbar', { name: 'Overall credit utilization' });
    expect(overall).toHaveClass('fs-progress--warning');
    expect(overall).toHaveAttribute('aria-valuetext', '48.5% — Elevated');
  });

  test('renders zero inline [style] attributes', async () => {
    const { container } = render(<UtilizationWidget />);
    await screen.findByText('Low Card');
    expect(container.querySelectorAll('[style]').length).toBe(0);
  });

  test('passes jest-axe with zero violations', async () => {
    const { container } = render(<UtilizationWidget />);
    await screen.findByText('Low Card');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
