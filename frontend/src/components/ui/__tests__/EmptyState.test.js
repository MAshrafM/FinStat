// frontend/src/components/ui/__tests__/EmptyState.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('EmptyState Primitive (Phase 2E)', () => {
  it('renders required title in h3 and status role on container', () => {
    render(<EmptyState title="No transactions found" />);
    const container = screen.getByRole('status');
    expect(container).toHaveClass('fs-empty');
    const heading = screen.getByRole('heading', { level: 3, name: /no transactions found/i });
    expect(heading).toHaveClass('fs-empty-title');
  });

  it('renders optional description when provided', () => {
    render(
      <EmptyState
        title="No accounts linked"
        description="Connect your primary checking account to begin tracking expenses."
      />
    );
    const desc = screen.getByText('Connect your primary checking account to begin tracking expenses.');
    expect(desc).toHaveClass('fs-empty-desc');
  });

  it('renders optional icon with aria-hidden="true"', () => {
    render(
      <EmptyState
        title="Empty"
        icon={<span data-testid="empty-icon">📁</span>}
      />
    );
    const iconContainer = screen.getByTestId('empty-icon').parentElement;
    expect(iconContainer).toHaveClass('fs-empty-icon');
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders optional action CTA slot', () => {
    render(
      <EmptyState
        title="Empty list"
        action={<button type="button">Create item</button>}
      />
    );
    const btn = screen.getByRole('button', { name: /create item/i });
    expect(btn.closest('.fs-empty-action')).toBeInTheDocument();
  });

  it('propagates additional className and attributes', () => {
    render(<EmptyState title="Empty" className="custom-empty-state" data-testid="my-empty" />);
    const el = screen.getByTestId('my-empty');
    expect(el).toHaveClass('fs-empty', 'custom-empty-state');
  });

  it('passes accessibility audits without violations', async () => {
    const { container } = render(
      <EmptyState
        icon={<span>ℹ️</span>}
        title="No statements available"
        description="Statements will be automatically generated at the end of each billing cycle."
        action={<button type="button">Refresh Statements</button>}
      />
    );
    await expectNoA11yViolations(container);
  });
});
