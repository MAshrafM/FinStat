/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/certificates/__tests__/CertificateDetailPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CertificateDetailPage from '../CertificateDetailPage';
import * as certificateService from '../../../services/certificateService';
import * as AuthContext from '../../../context/AuthContext';
import { getChartPalette } from '../../../styles/chartTheme';
import { formatCurrency } from '../../../utils/formatters';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/certificateService');

const mockShowToast = jest.fn();
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, addToast: mockShowToast }),
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, plugins = [] }) => {
    global.__CERT_DETAIL_PLUGINS__ = plugins;
    return (
      <div
        data-testid="cert-line-chart"
        data-options={JSON.stringify(options)}
        data-plugin-ids={JSON.stringify(plugins.map((plugin) => plugin.id))}
      >
        {JSON.stringify(data)}
      </div>
    );
  },
}));

const baseCert = {
  _id: 'cert-1',
  name: 'NBE Platinum 20%',
  amount: 100000,
  interest: 20,
  period: 12,
  payoutInterval: 'monthly',
  startDate: '2025-07-15T00:00:00.000Z',
  maturityDate: '2026-07-15T00:00:00.000Z',
  daysRemaining: 181,
  daysElapsed: 184,
  displayStatus: 'active',
  status: 'active',
  accruedInterest: 10000,
  totalInterestEarned: 15000,
  periodicInterest: 1666.67,
  isPayoutDue: true,
  nextDuePayoutDate: '2026-01-15T00:00:00.000Z',
  nextPayoutDate: '2026-02-15T00:00:00.000Z',
  sourceAccount: 'Bank',
  autoReinvest: false,
  trajectory: {
    labels: ['Aug 2025', 'Sep 2025', 'Jul 2026'],
    actualSeries: [1667, 10000, null],
    projectedSeries: [1667, 8333, 20000],
  },
};

const renderDetailPage = ({ route = '/certificates/cert-1', canModify = true } = {}) => {
  jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
    canModify,
    isViewer: !canModify,
  });
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/certificates/:id" element={<CertificateDetailPage />} />
        <Route path="/certificates" element={<div data-testid="cert-list-route">Certificates List</div>} />
        <Route path="/certificates/edit/:id" element={<div data-testid="cert-edit-route">Edit Certificate</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Phase 8C — CertificateDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__CERT_DETAIL_PLUGINS__ = [];
    certificateService.getCertificateById.mockResolvedValue(baseCert);
    certificateService.getAccruedInterest.mockResolvedValue({
      accruedInterest: 10250,
      daysElapsed: 185,
      nextPayoutDate: '2026-02-15T00:00:00.000Z',
      totalEarned: 15250,
    });
    certificateService.processCertificatePayout.mockResolvedValue({
      message: 'Interest payout processed successfully!',
    });
    certificateService.withdrawCertificate.mockResolvedValue({
      message: 'Certificate marked as withdrawn',
    });
    certificateService.deleteCertificate.mockResolvedValue({
      message: 'Certificate deleted successfully',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. renders loading card state while fetching certificate details', () => {
    certificateService.getCertificateById.mockReturnValue(new Promise(() => {}));
    renderDetailPage();
    expect(screen.getByText('Loading certificate details...')).toBeInTheDocument();
  });

  it('2. renders tokenized error card with Retry calling fetchCertDetails on rejection', async () => {
    certificateService.getCertificateById
      .mockRejectedValueOnce(new Error('Database timeout'))
      .mockResolvedValueOnce(baseCert);

    renderDetailPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('cert-error-card');
    expect(within(alert).getByText('Failed to Load Certificate')).toBeInTheDocument();
    expect(within(alert).getByText('Database timeout')).toBeInTheDocument();

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();
    expect(certificateService.getCertificateById).toHaveBeenCalledTimes(2);
  });

  it('3. renders empty not-found card with Return to Certificates link when cert is null', async () => {
    certificateService.getCertificateById.mockResolvedValueOnce(null);
    const { container } = renderDetailPage();

    expect(await screen.findByRole('heading', { name: 'Certificate Not Found' })).toBeInTheDocument();
    expect(container.querySelector('.cert-empty-card')).toBeInTheDocument();
    const backBtn = screen.getByRole('link', { name: 'Return to Certificates' });
    expect(backBtn).toHaveAttribute('href', '/certificates');
    expect(backBtn).toHaveClass('fs-btn', 'fs-btn-secondary');
  });

  it('4. renders un-underlined back link, flat hero, and neutral Badge chips across all 5 statuses with zero emojis', async () => {
    const statuses = [
      ['active', 'Active'],
      ['maturing_soon', 'Maturing Soon'],
      ['future', 'Future'],
      ['matured', 'Matured'],
      ['withdrawn', 'Withdrawn'],
    ];

    for (const [displayStatus, expectedLabel] of statuses) {
      certificateService.getCertificateById.mockResolvedValueOnce({
        ...baseCert,
        displayStatus,
        status: displayStatus === 'withdrawn' ? 'withdrawn' : 'active',
      });
      const { container, unmount } = renderDetailPage();
      expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

      const backLink = screen.getByRole('link', { name: /Back to Certificates/i });
      expect(backLink).toHaveClass('cert-back-link');
      expect(backLink).not.toHaveClass('cert-name-link');

      const hero = container.querySelector('.cert-detail-hero');
      expect(hero).toHaveTextContent(expectedLabel);
      expect(hero).toHaveTextContent('181 days remaining');
      expect(hero.textContent).not.toMatch(/[\u{1F534}\u{1F7E1}\u{1F7E2}\u{26AA}\u{23F3}]/u);
      expect(hero.querySelectorAll('.cert-status-badge svg[aria-hidden="true"]').length).toBeGreaterThanOrEqual(2);
      unmount();
    }
  });

  it('5. enforces Single Primary CTA per visible section with and without Payout Due banner', async () => {
    // Banner visible -> Disburse Payout Now is primary, top-bar Add Interest Payout is secondary
    const { container, unmount } = renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

    const disburseBtn = screen.getByRole('button', { name: /Disburse Payout Now/i });
    const addPayoutBtn = screen.getByTestId('add-payout-btn');
    expect(disburseBtn).toHaveClass('fs-btn-primary');
    expect(addPayoutBtn).toHaveClass('fs-btn-secondary');
    expect(container.querySelectorAll('.cert-detail-page .fs-btn-primary')).toHaveLength(1);
    unmount();

    // Banner absent -> top-bar Add Interest Payout is single primary CTA
    certificateService.getCertificateById.mockResolvedValueOnce({
      ...baseCert,
      isPayoutDue: false,
    });
    const { container: secondContainer } = renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Disburse Payout Now/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('add-payout-btn')).toHaveClass('fs-btn-primary');
    expect(secondContainer.querySelectorAll('.cert-detail-page .fs-btn-primary')).toHaveLength(1);
  });

  it('6. renders 6 neutral KPI metric cards with .fs-num figures and triggers manual accrual refresh', async () => {
    const { container } = renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

    const metricTiles = container.querySelectorAll('.cert-metric-tile');
    expect(metricTiles).toHaveLength(6);
    expect(container.querySelectorAll('.cert-metric-tile .fs-num').length).toBeGreaterThanOrEqual(6);

    const refreshBtn = screen.getByRole('button', { name: 'Refresh live accrued interest' });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(certificateService.getAccruedInterest).toHaveBeenCalledWith('cert-1');
    });
    await waitFor(() => {
      expect(screen.getByText(/185/)).toBeInTheDocument();
    });
  });

  it('7. configures dual-series Line chart via chartTheme palette without hardcoded hex or accent series', async () => {
    renderDetailPage();
    const chartEl = await screen.findByTestId('cert-line-chart');
    const parsedData = JSON.parse(chartEl.textContent);
    const palette = getChartPalette();

    expect(parsedData.datasets).toHaveLength(2);
    expect(palette.greys).toContain(parsedData.datasets[0].borderColor);
    expect(palette.greys).toContain(parsedData.datasets[1].borderColor);
    expect(parsedData.datasets[0].backgroundColor).toMatch(/^rgba\(/);
    expect(parsedData.datasets[1].borderDash).toEqual([6, 6]);
  });

  it('8. registers local certLastPointLabelPlugin drawing both endpoints and exposes accessible summary + 8A trajectory table', async () => {
    renderDetailPage();
    const wrapper = await screen.findByTestId('cert-chart-canvas-wrapper');
    expect(wrapper).toHaveAttribute('data-plugin-ids', 'certLastPointLabelPlugin');
    expect(wrapper).toHaveAttribute('aria-label', expect.stringContaining('Interest Accrual Trajectory (Dual Series)'));

    const summary = screen.getByTestId('cert-chart-summary');
    expect(summary).toHaveTextContent('Interest Accrual Trajectory (Dual Series)');

    const plugin = global.__CERT_DETAIL_PLUGINS__.find((p) => p.id === 'certLastPointLabelPlugin');
    expect(plugin).toBeDefined();

    const ctx = {
      save: jest.fn(),
      restore: jest.fn(),
      fillText: jest.fn(),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    };

    plugin.afterDatasetsDraw({
      ctx,
      data: {
        datasets: [
          { data: [1667, 10000, null] },
          { data: [1667, 8333, 20000] },
        ],
      },
      getDatasetMeta: (dsIdx) => ({
        data: dsIdx === 0
          ? [{ x: 10, y: 120 }, { x: 40, y: 80 }, null]
          : [{ x: 10, y: 120 }, { x: 40, y: 90 }, { x: 80, y: 40 }],
      }),
    });

    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledWith(`Actual: ${formatCurrency(10000)}`, 32, 72);
    expect(ctx.fillText).toHaveBeenCalledWith(`Projected: ${formatCurrency(20000)}`, 72, 32);
    expect(ctx.restore).toHaveBeenCalledTimes(1);

    const table = screen.getByTestId('cert-trajectory-table');
    expect(table).toHaveAccessibleName('Actual vs. Projected Interest Accrual Trajectory');
    const colHeaders = Array.from(table.querySelectorAll('th[scope="col"]')).map((th) => th.textContent);
    expect(colHeaders).toEqual(['Period', 'Actual Accrued', 'Projected Accrual']);
    expect(table.querySelector('tbody tr td')).toHaveAttribute('data-label', 'Period');
  });

  it('9. renders D19 trajectory mobile cards and toggles expander revealing Projected Accrual', async () => {
    renderDetailPage();
    const cardsContainer = await screen.findByTestId('cert-trajectory-mobile-cards');
    const expandBtn = within(cardsContainer).getByRole('button', { name: /Expand Aug 2025 projection/i });
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(expandBtn);
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
    const panelId = expandBtn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    expect(panel).toHaveTextContent('Projected Accrual');
    expect(panel).toHaveTextContent(formatCurrency(1667));
  });

  it('10. enforces ProtectedAction read-only gating for viewer role on payout buttons', async () => {
    renderDetailPage({ canModify: false });
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

    const addPayoutBtn = screen.getByTestId('add-payout-btn');
    const disburseBtn = screen.getByRole('button', { name: /Disburse Payout Now/i });
    expect(addPayoutBtn).toBeDisabled();
    expect(disburseBtn).toBeDisabled();
  });

  it('11. opens Payout modal, preserves Destination Account label, submits exact payload, and supports Cancel', async () => {
    renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-payout-btn'));
    const dialog = screen.getByRole('dialog', { name: /Add Interest Payout/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('button', { name: /Confirm Payout/i })).toHaveClass('fs-btn-primary');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-payout-btn'));
    const reopened = screen.getByRole('dialog', { name: /Add Interest Payout/i });
    const accountSelect = within(reopened).getByLabelText('Destination Account');
    expect(accountSelect).toHaveAttribute('id', 'detail-payout-account-select');
    fireEvent.change(accountSelect, { target: { value: 'Cash' } });
    fireEvent.change(within(reopened).getByLabelText('Payout Date'), { target: { value: '2026-01-15' } });
    fireEvent.click(within(reopened).getByRole('button', { name: /Confirm Payout/i }));

    await waitFor(() => {
      expect(certificateService.processCertificatePayout).toHaveBeenCalledWith('cert-1', {
        payoutDate: '2026-01-15',
        destinationAccount: 'Cash',
      });
    });
  });

  it('12. opens Withdraw modal, preserves Deposit Proceeds To: label, submits destinationAccount payload, and supports Cancel', async () => {
    renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Withdraw/i }));
    const dialog = screen.getByRole('dialog', { name: /Withdraw Certificate Early/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Estimated Total Payout:')).toBeInTheDocument();

    const confirmBtn = within(dialog).getByRole('button', { name: 'Confirm Withdrawal' });
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveClass('cert-withdraw-confirm-btn');

    const destSelect = within(dialog).getByLabelText('Deposit Proceeds To:');
    expect(destSelect).toHaveAttribute('id', 'detail-withdraw-destination-account');
    fireEvent.change(destSelect, { target: { value: 'Prepaid' } });
    fireEvent.change(within(dialog).getByLabelText('Withdrawal Reason (Optional):'), {
      target: { value: 'Emergency cash' },
    });
    fireEvent.click(within(dialog).getByLabelText(/I understand this certificate will be marked as withdrawn/i));
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(certificateService.withdrawCertificate).toHaveBeenCalledWith('cert-1', {
        withdrawalDate: expect.any(String),
        withdrawalReason: 'Emergency cash',
        confirmWithdrawal: true,
        destinationAccount: 'Prepaid',
      });
    });
  });

  it('13. opens shared ConfirmModal on Delete, supports Cancel, and navigates after confirmation', async () => {
    renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(certificateService.deleteCertificate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    const confirmDialog = screen.getByRole('dialog');
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(certificateService.deleteCertificate).toHaveBeenCalledWith('cert-1');
    });
    expect(await screen.findByTestId('cert-list-route')).toBeInTheDocument();
  });

  it('14. implements full APG focus lifecycle (initial closeBtn focus, Tab trap, Escape close, trigger focus restore)', async () => {
    renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();

    const withdrawTrigger = screen.getByRole('button', { name: /Withdraw/i });
    withdrawTrigger.focus();
    fireEvent.click(withdrawTrigger);

    const dialog = screen.getByRole('dialog', { name: /Withdraw Certificate Early/i });
    const closeBtn = within(dialog).getByRole('button', { name: 'Close withdrawal modal' });
    await waitFor(() => expect(closeBtn).toHaveFocus());

    const cancelBtn = within(dialog).getByRole('button', { name: 'Cancel' });
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(cancelBtn).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(closeBtn).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(withdrawTrigger).toHaveFocus();
  });

  it('15. renders zero inline style attributes across detail view and opened Withdraw/Payout dialogs', async () => {
    const { container } = renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();
    expect(container.querySelectorAll('[style]')).toHaveLength(0);

    fireEvent.click(screen.getByTestId('add-payout-btn'));
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
    fireEvent.keyDown(window, { key: 'Escape' });

    fireEvent.click(screen.getByRole('button', { name: /Withdraw/i }));
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('16. passes jest-axe accessibility checks with zero critical/serious violations', async () => {
    const { container } = renderDetailPage();
    expect(await screen.findByRole('heading', { name: 'NBE Platinum 20%' })).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
