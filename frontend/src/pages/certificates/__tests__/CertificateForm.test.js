/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/certificates/__tests__/CertificateForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CertificateForm from '../CertificateForm';
import AddCertificatePage from '../AddCertificatePage';
import EditCertificatePage from '../EditCertificatePage';
import * as certificateService from '../../../services/certificateService';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/certificateService');

const existingCert = {
  _id: 'cert-edit-1',
  name: 'Banque Misr 3Y',
  period: 36,
  amount: 75000,
  interest: 19,
  payoutInterval: 'quarterly',
  startDate: '2025-05-01T00:00:00.000Z',
  lastPayoutDate: '2025-11-01T00:00:00.000Z',
  sourceAccount: 'Cash',
  autoReinvest: true,
};

describe('Phase 8C — CertificateForm & Add/Edit Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    certificateService.createCertificate.mockResolvedValue({ _id: 'new-1' });
    certificateService.getCertificateById.mockResolvedValue(existingCert);
    certificateService.updateCertificate.mockResolvedValue({ ...existingCert, name: 'Updated Cert' });
  });

  it('1. pairs every label htmlFor with control id including preserved account-selector-sourceAccount and preserves names', () => {
    render(
      <MemoryRouter>
        <div className="cert-form-page">
          <CertificateForm onFormSubmit={jest.fn()} />
        </div>
      </MemoryRouter>
    );

    const pairedControls = [
      ['Certificate Name', 'cert-name', 'name'],
      ['Period (in months)', 'cert-period', 'period'],
      ['Principal Amount (EGP)', 'cert-amount', 'amount'],
      ['Annual Interest Rate (%)', 'cert-interest', 'interest'],
      ['Payout Frequency Interval', 'cert-payout-interval', 'payoutInterval'],
      ['Start / Issue Date', 'cert-start-date', 'startDate'],
      ['Last Interest Payout Date (Optional)', 'cert-last-payout-date', 'lastPayoutDate'],
      ['Paid From (Source Account)', 'account-selector-sourceAccount', 'sourceAccount'],
      [/Auto-Reinvest Interest/i, 'cert-auto-reinvest', 'autoReinvest'],
    ];

    for (const [labelText, expectedId, expectedName] of pairedControls) {
      const control = screen.getByLabelText(labelText);
      expect(control).toHaveAttribute('id', expectedId);
      expect(control).toHaveAttribute('name', expectedName);
    }
  });

  it('2. renders Reference Frame 02 stacked card, neutral Cancel link, and single primary submit CTA', () => {
    const { container } = render(
      <MemoryRouter>
        <AddCertificatePage />
      </MemoryRouter>
    );

    expect(container.querySelector('.cert-form-card')).toBeInTheDocument();
    const cancelLink = screen.getByRole('link', { name: 'Cancel' });
    expect(cancelLink).toHaveAttribute('href', '/certificates');
    expect(cancelLink).toHaveClass('fs-btn', 'fs-btn-secondary');

    const submitBtn = screen.getByRole('button', { name: 'Create Certificate' });
    expect(submitBtn).toHaveClass('fs-btn', 'fs-btn-primary');
    expect(container.querySelectorAll('.fs-btn-primary')).toHaveLength(1);
  });

  it('3. validates lastPayoutDate < startDate on blur and submit, and clears on valid blur or startDate edit', () => {
    const onFormSubmit = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <div className="cert-form-page">
          <CertificateForm onFormSubmit={onFormSubmit} />
        </div>
      </MemoryRouter>
    );

    const startInput = screen.getByLabelText('Start / Issue Date');
    const lastPayoutInput = screen.getByLabelText('Last Interest Payout Date (Optional)');

    fireEvent.change(screen.getByLabelText('Certificate Name'), { target: { value: 'Test CD' } });
    fireEvent.change(screen.getByLabelText('Period (in months)'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Principal Amount (EGP)'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('Annual Interest Rate (%)'), { target: { value: '18' } });
    fireEvent.change(startInput, { target: { value: '2026-01-10' } });
    fireEvent.change(lastPayoutInput, { target: { value: '2025-12-01' } });

    // Blur shows inline field error without summary yet
    fireEvent.blur(lastPayoutInput);
    const inlineError = document.getElementById('cert-last-payout-error');
    expect(inlineError).toHaveTextContent('Last payout date cannot be earlier than certificate start date.');
    expect(inlineError).toHaveAttribute('role', 'alert');
    expect(lastPayoutInput).toHaveAttribute('aria-invalid', 'true');
    expect(lastPayoutInput).toHaveAttribute('aria-describedby', 'cert-last-payout-help cert-last-payout-error');
    expect(container.querySelector('.cert-form-error-summary')).not.toBeInTheDocument();

    // Failed submit adds distinct submit summary alongside inline field error
    fireEvent.submit(container.querySelector('form'));
    expect(onFormSubmit).not.toHaveBeenCalled();
    const summary = container.querySelector('.cert-form-error-summary');
    expect(summary).toHaveAttribute('role', 'alert');
    expect(summary).toHaveTextContent('Last payout date cannot be earlier than certificate start date.');

    // Editing startDate into valid range clears error and resets aria-describedby
    fireEvent.change(startInput, { target: { value: '2025-11-01' } });
    expect(document.getElementById('cert-last-payout-error')).not.toBeInTheDocument();
    expect(container.querySelector('.cert-form-error-summary')).not.toBeInTheDocument();
    expect(lastPayoutInput).toHaveAttribute('aria-invalid', 'false');
    expect(lastPayoutInput).toHaveAttribute('aria-describedby', 'cert-last-payout-help');

    // Re-trigger invalid blur then clear via valid blur
    fireEvent.change(lastPayoutInput, { target: { value: '2025-10-01' } });
    fireEvent.blur(lastPayoutInput);
    expect(document.getElementById('cert-last-payout-error')).toBeInTheDocument();
    fireEvent.change(lastPayoutInput, { target: { value: '2025-12-01' } });
    fireEvent.blur(lastPayoutInput);
    expect(document.getElementById('cert-last-payout-error')).not.toBeInTheDocument();
  });

  it('4. validates future lastPayoutDate on blur and submit without calling onFormSubmit', () => {
    const onFormSubmit = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <div className="cert-form-page">
          <CertificateForm onFormSubmit={onFormSubmit} />
        </div>
      </MemoryRouter>
    );

    const lastPayoutInput = screen.getByLabelText('Last Interest Payout Date (Optional)');
    fireEvent.change(screen.getByLabelText('Start / Issue Date'), { target: { value: '2026-01-01' } });
    fireEvent.change(lastPayoutInput, { target: { value: '2099-01-01' } });
    fireEvent.blur(lastPayoutInput);

    expect(document.getElementById('cert-last-payout-error')).toHaveTextContent(
      'Last payout date cannot be in the future.'
    );

    fireEvent.submit(container.querySelector('form'));
    expect(onFormSubmit).not.toHaveBeenCalled();
    expect(container.querySelector('.cert-form-error-summary')).toHaveTextContent(
      'Last payout date cannot be in the future.'
    );
  });

  it('5. produces byte-identical normalized payload shape on valid form submission', () => {
    const onFormSubmit = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <CertificateForm onFormSubmit={onFormSubmit} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Certificate Name'), { target: { value: 'Platinum 24M' } });
    fireEvent.change(screen.getByLabelText('Period (in months)'), { target: { value: '24' } });
    fireEvent.change(screen.getByLabelText('Principal Amount (EGP)'), { target: { value: '50000.5' } });
    fireEvent.change(screen.getByLabelText('Annual Interest Rate (%)'), { target: { value: '18.5' } });
    fireEvent.change(screen.getByLabelText('Payout Frequency Interval'), { target: { value: 'quarterly' } });
    fireEvent.change(screen.getByLabelText('Start / Issue Date'), { target: { value: '2025-07-15' } });
    fireEvent.change(screen.getByLabelText('Last Interest Payout Date (Optional)'), { target: { value: '2025-10-15' } });
    fireEvent.change(screen.getByLabelText('Paid From (Source Account)'), { target: { value: 'Cash' } });
    fireEvent.click(screen.getByLabelText(/Auto-Reinvest Interest/i));

    fireEvent.submit(container.querySelector('form'));

    expect(onFormSubmit).toHaveBeenCalledWith({
      name: 'Platinum 24M',
      period: 24,
      amount: 50000.5,
      interest: 18.5,
      payoutInterval: 'quarterly',
      startDate: '2025-07-15',
      lastPayoutDate: new Date('2025-10-15').toISOString(),
      sourceAccount: 'Cash',
      autoReinvest: true,
    });
  });

  it('6. AddCertificatePage submits payload to createCertificate and navigates to /certificates', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/certificates/new']}>
        <Routes>
          <Route path="/certificates/new" element={<AddCertificatePage />} />
          <Route path="/certificates" element={<div data-testid="cert-list-route">Certificates List</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Certificate Name'), { target: { value: 'New Cert' } });
    fireEvent.change(screen.getByLabelText('Period (in months)'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Principal Amount (EGP)'), { target: { value: '25000' } });
    fireEvent.change(screen.getByLabelText('Annual Interest Rate (%)'), { target: { value: '20' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(certificateService.createCertificate).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByTestId('cert-list-route')).toBeInTheDocument();
  });

  it('7. AddCertificatePage displays wrapper .cert-submit-error separate from .cert-form-error-summary when createCertificate fails', async () => {
    certificateService.createCertificate.mockRejectedValueOnce(new Error('Insufficient ledger balance'));

    const { container } = render(
      <MemoryRouter initialEntries={['/certificates/new']}>
        <Routes>
          <Route path="/certificates/new" element={<AddCertificatePage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Certificate Name'), { target: { value: 'Fail Cert' } });
    fireEvent.change(screen.getByLabelText('Period (in months)'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Principal Amount (EGP)'), { target: { value: '25000' } });
    fireEvent.change(screen.getByLabelText('Annual Interest Rate (%)'), { target: { value: '20' } });
    fireEvent.submit(container.querySelector('form'));

    const submitAlert = await screen.findByRole('alert');
    expect(submitAlert).toHaveClass('cert-submit-error');
    expect(submitAlert).toHaveTextContent('Insufficient ledger balance');
    expect(container.querySelector('.cert-form-error-summary')).not.toBeInTheDocument();
  });

  it('8. EditCertificatePage renders Loading form-field skeleton while fetching', () => {
    certificateService.getCertificateById.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={['/certificates/edit/cert-edit-1']}>
        <Routes>
          <Route path="/certificates/edit/:id" element={<EditCertificatePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading certificate...')).toBeInTheDocument();
  });

  it('9. EditCertificatePage renders .cert-error-card on fetch failure and .cert-submit-error on update failure', async () => {
    certificateService.getCertificateById
      .mockRejectedValueOnce(new Error('Certificate not reachable'))
      .mockResolvedValueOnce(existingCert);
    certificateService.updateCertificate.mockRejectedValueOnce(new Error('Update rejected'));

    const { container } = render(
      <MemoryRouter initialEntries={['/certificates/edit/cert-edit-1']}>
        <Routes>
          <Route path="/certificates/edit/:id" element={<EditCertificatePage />} />
        </Routes>
      </MemoryRouter>
    );

    const fetchAlert = await screen.findByRole('alert');
    expect(fetchAlert).toHaveClass('cert-error-card');
    expect(fetchAlert).toHaveTextContent('Certificate not reachable');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByDisplayValue('Banque Misr 3Y')).toBeInTheDocument();

    fireEvent.submit(container.querySelector('form'));
    const submitAlert = await screen.findByRole('alert');
    expect(submitAlert).toHaveClass('cert-submit-error');
    expect(submitAlert).toHaveTextContent('Update rejected');
  });

  it('10. EditCertificatePage prefills existing certificate, calls updateCertificate, and navigates to /certificates', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/certificates/edit/cert-edit-1']}>
        <Routes>
          <Route path="/certificates/edit/:id" element={<EditCertificatePage />} />
          <Route path="/certificates" element={<div data-testid="cert-list-route">Certificates List</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Banque Misr 3Y')).toBeInTheDocument();
    expect(screen.getByDisplayValue('75000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Certificate' })).toBeInTheDocument();

    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => {
      expect(certificateService.updateCertificate).toHaveBeenCalledWith(
        'cert-edit-1',
        expect.objectContaining({
          name: 'Banque Misr 3Y',
          period: 36,
          amount: 75000,
          interest: 19,
          sourceAccount: 'Cash',
          autoReinvest: true,
        })
      );
    });
    expect(await screen.findByTestId('cert-list-route')).toBeInTheDocument();
  });

  it('11. renders zero inline style attributes across form, validation summary, Add wrapper, and Edit wrapper', async () => {
    const { container: addContainer, unmount } = render(
      <MemoryRouter>
        <AddCertificatePage />
      </MemoryRouter>
    );
    expect(addContainer.querySelectorAll('[style]')).toHaveLength(0);
    unmount();

    const { container: editContainer } = render(
      <MemoryRouter initialEntries={['/certificates/edit/cert-edit-1']}>
        <Routes>
          <Route path="/certificates/edit/:id" element={<EditCertificatePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByDisplayValue('Banque Misr 3Y')).toBeInTheDocument();
    expect(editContainer.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('12. passes jest-axe accessibility checks across both Add and Edit states', async () => {
    const { container: addContainer, unmount } = render(
      <MemoryRouter>
        <AddCertificatePage />
      </MemoryRouter>
    );
    expect(await axe(addContainer)).toHaveNoViolations();
    unmount();

    const { container: editContainer } = render(
      <MemoryRouter initialEntries={['/certificates/edit/cert-edit-1']}>
        <Routes>
          <Route path="/certificates/edit/:id" element={<EditCertificatePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByDisplayValue('Banque Misr 3Y')).toBeInTheDocument();
    expect(await axe(editContainer)).toHaveNoViolations();
  });
});
