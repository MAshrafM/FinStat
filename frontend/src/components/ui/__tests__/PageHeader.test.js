// frontend/src/components/ui/__tests__/PageHeader.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import PageHeader from '../PageHeader';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('PageHeader Primitive (Phase 2E)', () => {
  it('renders required title in h1', () => {
    render(<PageHeader title="Portfolio Summary" />);
    const heading = screen.getByRole('heading', { level: 1, name: /portfolio summary/i });
    expect(heading).toHaveClass('fs-page-title');
    expect(heading.closest('header')).toHaveClass('fs-page-head');
  });

  it('renders subtitle when provided', () => {
    render(
      <PageHeader
        title="Transactions"
        subtitle="Review your recent ledger and cleared transfers."
      />
    );
    expect(screen.getByText('Review your recent ledger and cleared transfers.')).toHaveClass('fs-page-subtitle');
  });

  it('renders eyebrow when provided and omits when omitted', () => {
    const { rerender } = render(<PageHeader title="Without Eyebrow" />);
    expect(document.querySelector('.fs-eyebrow')).toBeNull();

    rerender(<PageHeader title="With Eyebrow" eyebrow="Reports / Annual" />);
    const eyebrow = screen.getByText('Reports / Annual');
    expect(eyebrow).toHaveClass('fs-eyebrow');
  });

  it('renders actions slot when provided', () => {
    render(
      <PageHeader
        title="Settings"
        actions={<button type="button">Export CSV</button>}
      />
    );
    const actionBtn = screen.getByRole('button', { name: /export csv/i });
    expect(actionBtn.closest('.fs-page-actions')).toBeInTheDocument();
  });

  it('propagates additional className and attributes', () => {
    render(<PageHeader title="Custom" className="header-custom-style" data-testid="page-header" />);
    const header = screen.getByTestId('page-header');
    expect(header).toHaveClass('fs-page-head', 'header-custom-style');
  });

  it('passes accessibility audits without violations', async () => {
    const { container } = render(
      <PageHeader
        title="Accounts & Balances"
        subtitle="Manage depository institutions and linked accounts."
        eyebrow="Banking"
        actions={<button type="button">Add Account</button>}
      />
    );
    await expectNoA11yViolations(container);
  });
});
