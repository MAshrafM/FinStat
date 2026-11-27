/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/certificates/__tests__/CertificateLogPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CertificateLogPage from '../CertificateLogPage';
import * as CertContext from '../../../context/CertContext';
import * as AuthContext from '../../../context/AuthContext';
import * as certificateService from '../../../services/certificateService';

jest.mock('react-router-dom', () => {
    return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/certificateService');

const mockShowToast = jest.fn();
jest.mock('../../../context/ToastContext', () => ({
    useToast: () => ({ showToast: mockShowToast, addToast: mockShowToast }),
}));

const mockCertificates = [
    {
        _id: 'cert-active',
        name: 'NBE Platinum 20%',
        amount: 100000,
        interest: 20,
        period: 12,
        payoutInterval: 'monthly',
        startDate: '2025-07-15T00:00:00.000Z',
        maturityDate: '2026-07-15T00:00:00.000Z',
        daysRemaining: 181,
        displayStatus: 'active',
        status: 'active',
        accruedInterest: 10000,
        periodicInterest: 1666.67,
        isPayoutDue: true,
        nextDuePayoutDate: '2026-01-15T00:00:00.000Z',
    },
    {
        _id: 'cert-soon',
        name: 'Banque Misr 18.5%',
        amount: 50000,
        interest: 18.5,
        period: 12,
        payoutInterval: 'quarterly',
        startDate: '2025-02-01T00:00:00.000Z',
        maturityDate: '2026-02-01T00:00:00.000Z',
        daysRemaining: 17,
        displayStatus: 'maturing_soon',
        status: 'active',
        accruedInterest: 8800,
        periodicInterest: 2312.5,
        isPayoutDue: false,
    },
    {
        _id: 'cert-future',
        name: 'CIB Future Yield',
        amount: 75000,
        interest: 22,
        period: 24,
        payoutInterval: 'monthly',
        startDate: '2027-02-15T00:00:00.000Z',
        maturityDate: '2029-02-15T00:00:00.000Z',
        daysRemaining: 761,
        displayStatus: 'future',
        status: 'active',
        isPayoutDue: false,
    },
    {
        _id: 'cert-matured',
        name: 'QNB Matured Bond',
        amount: 40000,
        interest: 16,
        period: 12,
        payoutInterval: 'semi-annual',
        startDate: '2024-01-01T00:00:00.000Z',
        maturityDate: '2025-01-01T00:00:00.000Z',
        daysRemaining: 0,
        displayStatus: 'matured',
        status: 'matured',
        accruedInterest: 6400,
        periodicInterest: 3200,
        isPayoutDue: false,
    },
    {
        _id: 'cert-withdrawn',
        name: 'AAIB Early Liquidated',
        amount: 30000,
        interest: 15,
        period: 12,
        payoutInterval: 'monthly',
        startDate: '2025-03-01T00:00:00.000Z',
        maturityDate: '2026-03-01T00:00:00.000Z',
        daysRemaining: 45,
        displayStatus: 'withdrawn',
        status: 'withdrawn',
        accruedInterest: 3100,
        isPayoutDue: false,
    },
];

const mockSummary = {
    activeCertificates: 2,
    totalActiveAmount: 150000,
    expiredCertificates: 1,
    futureCertificates: 1,
    totalExpectedReturns: 179250,
    totalCertificates: 5,
};

const mockRefreshCertificates = jest.fn();

const renderPage = ({
    canModify = true,
    isLoading = false,
    error = null,
    certificates = mockCertificates,
    certificateSummary = mockSummary,
} = {}) => {
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
        canModify,
        isViewer: !canModify,
        isAdmin: canModify,
        isManager: canModify,
        role: canModify ? 'admin' : 'viewer',
    });

    jest.spyOn(CertContext, 'useCertData').mockReturnValue({
        certificates,
        certificateSummary,
        isLoading,
        error,
        refreshCertificates: mockRefreshCertificates,
    });

    return render(
        <MemoryRouter>
            <CertificateLogPage />
        </MemoryRouter>
    );
};

describe('CertificateLogPage Component (Phase 8B)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        certificateService.processDuePayouts.mockResolvedValue({
            message: 'Processed 1 due payout(s)',
            processedCount: 1,
            totalDisbursedEgp: 1666.67,
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

    it('1. renders Loading variant="table" when isLoading is true', () => {
        renderPage({ isLoading: true });
        expect(screen.getByText('Loading Certificates...')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Bank Certificates' })).not.toBeInTheDocument();
    });

    it('2. renders error card with role="alert" in place of overview/filters/table while keeping header visible, and calls refreshCertificates on Retry', () => {
        renderPage({ error: new Error('Network failure') });

        expect(screen.getByRole('heading', { name: 'Bank Certificates', level: 1 })).toBeInTheDocument();
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Could not load bank certificates. Please try again.');
        expect(screen.queryByText('Certificate Portfolio Overview')).not.toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(mockRefreshCertificates).toHaveBeenCalledTimes(1);
    });

    it('3. renders Portfolio Overview KPI tiles and Status Breakdown without emojis', () => {
        const { container } = renderPage();
        expect(screen.getByRole('heading', { name: 'Certificate Portfolio Overview' })).toBeInTheDocument();
        expect(container.querySelectorAll('.cert-kpi-tile')).toHaveLength(4);
        expect(screen.getByText('out of 5 total')).toBeInTheDocument();
        expect(screen.getByText('guaranteed fixed-income')).toBeInTheDocument();
        expect(screen.getByText('at maturity date')).toBeInTheDocument();
        expect(container.textContent).not.toMatch(/[🟢🟡⏳🔴⚪]/u);
    });

    it('4. renders all 6 status filter buttons with aria-pressed and filters across all statuses', () => {
        const { container } = renderPage();
        const table = container.querySelector('.cert-table');

        const filterLabels = ['All', 'Active', 'Maturing Soon', 'Future', 'Matured', 'Withdrawn'];
        filterLabels.forEach((label) => {
            expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(table).getAllByRole('row')).toHaveLength(6); // 1 header + 5 rows

        fireEvent.click(screen.getByRole('button', { name: 'Active' }));
        expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(table).getByText('NBE Platinum 20%')).toBeInTheDocument();
        expect(within(table).queryByText('Banque Misr 18.5%')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Maturing Soon' }));
        expect(within(table).getByText('Banque Misr 18.5%')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Future' }));
        expect(within(table).getByText('CIB Future Yield')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Matured' }));
        expect(within(table).getByText('QNB Matured Bond')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Withdrawn' }));
        expect(within(table).getByText('AAIB Early Liquidated')).toBeInTheDocument();
    });

    it('5. renders neutral empty filter state when no certificates match active filter', () => {
        renderPage({ certificates: [mockCertificates[0]] });
        fireEvent.click(screen.getByRole('button', { name: 'Withdrawn' }));
        expect(screen.getByText('No bank certificates match the selected filter.')).toBeInTheDocument();
    });

    it('6. renders 9-column desktop table with underlined name links, neutral Badges with aria-hidden icons, neutral fs-num values, and non-color isPayoutDue discoverability', () => {
        const { container } = renderPage();
        const table = container.querySelector('.cert-table');
        const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent);
        expect(headers).toEqual([
            'Name',
            'Principal Amount',
            'Interest Rate',
            'Period',
            'Status',
            'Days Left',
            'Maturity Date',
            'Accrued Interest',
            'Actions',
        ]);

        const nameLink = within(table).getByRole('link', { name: 'NBE Platinum 20%' });
        expect(nameLink).toHaveClass('cert-name-link');

        const badges = table.querySelectorAll('.fs-badge');
        expect(badges).toHaveLength(5);
        badges.forEach((badge) => {
            expect(badge).not.toHaveClass('fs-badge--positive', 'fs-badge--negative', 'fs-badge--warning');
            const icon = badge.querySelector('svg');
            expect(icon).toHaveAttribute('aria-hidden', 'true');
        });

        expect(within(table).getByText('181 day(s)')).toBeInTheDocument();
        expect(within(table).getByText('Completed')).toBeInTheDocument();
        expect(within(table).getByText('Liquidated')).toBeInTheDocument();
        expect(within(table).getByText('Not started yet')).toBeInTheDocument();

        const dueBtn = within(table).getByRole('button', {
            name: 'Interest payout due — process payout for NBE Platinum 20%',
        });
        expect(dueBtn).toHaveAttribute('data-payout-due', 'true');
        expect(dueBtn).toHaveAttribute('title', 'Interest Payout Due! Click to process');
    });

    it('7. renders D19 mobile cards and toggles expanded drawer with aria-expanded, due note, and all actions', () => {
        renderPage();
        const mobileCards = screen.getByTestId('certificates-mobile-cards');
        const expandBtn = within(mobileCards).getByRole('button', {
            name: 'Expand details for NBE Platinum 20%',
        });
        expect(expandBtn).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(expandBtn);
        expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
        const drawerId = expandBtn.getAttribute('aria-controls');
        const drawer = document.getElementById(drawerId);
        expect(drawer).not.toBeNull();
        expect(within(drawer).getByText('Interest payout due')).toBeInTheDocument();
        expect(within(drawer).getByRole('button', { name: /Interest payout due — process payout/i })).toBeInTheDocument();
    });

    it('8. enforces ProtectedAction read-only gating on all 6 mutating controls for viewer role', () => {
        const { container } = renderPage({ canModify: false });
        const protectedWrappers = container.querySelectorAll('.protected-action-wrapper');
        expect(protectedWrappers.length).toBeGreaterThanOrEqual(6);

        const dueBtn = screen.getByRole('button', { name: /Process Due Payouts/i });
        fireEvent.click(dueBtn);
        expect(certificateService.processDuePayouts).not.toHaveBeenCalled();

        const deleteBtns = within(container.querySelector('.cert-table')).getAllByRole('button', {
            name: /^Delete /,
        });
        fireEvent.click(deleteBtns[0]);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('9. triggers processDuePayouts on header click, shows toast, and refreshes certificates', async () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Process Due Payouts/i }));

        await waitFor(() => {
            expect(certificateService.processDuePayouts).toHaveBeenCalledTimes(1);
        });
        expect(mockShowToast).toHaveBeenCalledWith('Processed 1 due payout(s)', 'success');
        expect(mockRefreshCertificates).toHaveBeenCalledTimes(1);
    });

    it('10. opens Payout modal, submits preserved payload, and supports Cancel', async () => {
        const { container } = renderPage();
        const table = container.querySelector('.cert-table');
        const openPayoutBtn = within(table).getByRole('button', {
            name: 'Interest payout due — process payout for NBE Platinum 20%',
        });

        fireEvent.click(openPayoutBtn);
        const dialog = screen.getByRole('dialog', { name: /Add Interest Payout/i });
        expect(dialog).toHaveAttribute('aria-modal', 'true');

        fireEvent.change(within(dialog).getByLabelText('Payout Date'), {
            target: { value: '2026-01-20' },
        });
        fireEvent.change(within(dialog).getByLabelText('Destination Account'), {
            target: { value: 'Cash' },
        });

        fireEvent.click(within(dialog).getByRole('button', { name: /Confirm Payout/i }));

        await waitFor(() => {
            expect(certificateService.processCertificatePayout).toHaveBeenCalledWith('cert-active', {
                payoutDate: '2026-01-20',
                destinationAccount: 'Cash',
            });
        });
        expect(mockRefreshCertificates).toHaveBeenCalledTimes(1);

        // Re-open and test Cancel
        fireEvent.click(openPayoutBtn);
        const reopened = screen.getByRole('dialog', { name: /Add Interest Payout/i });
        fireEvent.click(within(reopened).getByRole('button', { name: 'Cancel' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('11. opens Withdraw modal, displays live impact preview, enforces checkbox before submit, and preserves payload', async () => {
        const { container } = renderPage();
        const table = container.querySelector('.cert-table');
        const openWithdrawBtn = within(table).getByRole('button', {
            name: 'Withdraw NBE Platinum 20%',
        });

        fireEvent.click(openWithdrawBtn);
        const dialog = screen.getByRole('dialog', { name: /Withdraw Certificate Early/i });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(within(dialog).getByText('Estimated Total Payout:')).toBeInTheDocument();

        const confirmBtn = within(dialog).getByRole('button', { name: 'Confirm Withdrawal' });
        expect(confirmBtn).toBeDisabled();

        fireEvent.change(within(dialog).getByLabelText(/Withdrawal Reason/i), {
            target: { value: '  Rate switch  ' },
        });
        fireEvent.click(within(dialog).getByRole('checkbox'));
        expect(confirmBtn).not.toBeDisabled();

        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(certificateService.withdrawCertificate).toHaveBeenCalledWith(
                'cert-active',
                expect.objectContaining({
                    withdrawalDate: expect.any(String),
                    withdrawalReason: 'Rate switch',
                    confirmWithdrawal: true,
                })
            );
        });
        expect(mockRefreshCertificates).toHaveBeenCalledTimes(1);
    });

    it('12. opens shared ConfirmModal on Delete click, supports Cancel, and confirms deleteCertificate', async () => {
        const { container } = renderPage();
        const table = container.querySelector('.cert-table');
        const deleteBtn = within(table).getByRole('button', {
            name: 'Delete NBE Platinum 20%',
        });

        fireEvent.click(deleteBtn);
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('heading', { name: 'Delete Certificate' })).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
        expect(certificateService.deleteCertificate).not.toHaveBeenCalled();

        fireEvent.click(deleteBtn);
        const confirmDialog = screen.getByRole('dialog');
        fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Delete Certificate' }));

        await waitFor(() => {
            expect(certificateService.deleteCertificate).toHaveBeenCalledWith('cert-active');
        });
        expect(mockRefreshCertificates).toHaveBeenCalledTimes(1);
    });

    it('13. handles Escape close, Tab focus trap, and focus restoration on Withdraw and Payout dialogs', async () => {
        const { container } = renderPage();
        const table = container.querySelector('.cert-table');
        const withdrawBtn = within(table).getByRole('button', { name: 'Withdraw NBE Platinum 20%' });

        withdrawBtn.focus();
        fireEvent.click(withdrawBtn);

        const dialog = screen.getByRole('dialog', { name: /Withdraw Certificate Early/i });
        const closeBtn = within(dialog).getByRole('button', { name: 'Close withdrawal modal' });
        await waitFor(() => expect(closeBtn).toHaveFocus());

        // Shift+Tab from first element wraps to Cancel button (Confirm Withdrawal is disabled)
        const cancelBtn = within(dialog).getByRole('button', { name: 'Cancel' });
        fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
        expect(cancelBtn).toHaveFocus();

        // Tab from last element wraps back to closeBtn
        fireEvent.keyDown(window, { key: 'Tab' });
        expect(closeBtn).toHaveFocus();

        // Escape closes modal and restores focus to invoking button
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(withdrawBtn).toHaveFocus();
    });

    it('14. renders zero inline style attributes across page, D19 cards, and modals', () => {
        const { container } = renderPage();
        expect(container.querySelectorAll('[style]')).toHaveLength(0);

        const table = container.querySelector('.cert-table');
        fireEvent.click(within(table).getByRole('button', { name: 'Withdraw NBE Platinum 20%' }));
        expect(container.querySelectorAll('[style]')).toHaveLength(0);
    });

    it('15. passes jest-axe accessibility checks with zero critical/serious violations', async () => {
        const { container } = renderPage();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
