// frontend/src/components/ui/__tests__/Badge.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('Badge Primitive (Phase 2E)', () => {
  it('renders with label only as visible text', () => {
    render(<Badge label="Pending Approval" />);
    const badge = screen.getByText('Pending Approval');
    expect(badge).toHaveClass('fs-badge');
    expect(badge).not.toHaveClass('fs-badge--positive');
  });

  it('renders with children only as visible content', () => {
    render(<Badge>Direct Children</Badge>);
    const badge = screen.getByText('Direct Children');
    expect(badge).toHaveClass('fs-badge');
  });

  it('handles precedence when both label and children are provided (label as aria-label, children as content)', () => {
    render(<Badge label="Accessible Status Label">Visible Value</Badge>);
    const badge = screen.getByText('Visible Value');
    expect(badge).toHaveAttribute('aria-label', 'Accessible Status Label');
    expect(badge).toHaveClass('fs-badge');
  });

  it('returns null and logs warning when neither label nor children are provided', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Badge />);
    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[Badge] A badge requires a label or children.'));
    warnSpy.mockRestore();
  });

  it('applies semantic tone modifier classes (positive, negative, warning)', () => {
    const { rerender } = render(<Badge label="Success" tone="positive" />);
    expect(screen.getByText('Success')).toHaveClass('fs-badge', 'fs-badge--positive');

    rerender(<Badge label="Danger" tone="negative" />);
    expect(screen.getByText('Danger')).toHaveClass('fs-badge', 'fs-badge--negative');

    rerender(<Badge label="Warning" tone="warning" />);
    expect(screen.getByText('Warning')).toHaveClass('fs-badge', 'fs-badge--warning');

    rerender(<Badge label="Neutral" tone="neutral" />);
    expect(screen.getByText('Neutral')).toHaveClass('fs-badge');
    expect(screen.getByText('Neutral')).not.toHaveClass('fs-badge--neutral');
  });

  it('propagates additional className and attributes', () => {
    render(<Badge label="Custom" className="extra-chip" data-testid="badge-chip" />);
    const badge = screen.getByTestId('badge-chip');
    expect(badge).toHaveClass('fs-badge', 'extra-chip');
  });

  it('passes accessibility audits without violations', async () => {
    const { container } = render(
      <div>
        <Badge label="In Review" tone="warning" />
        <Badge label="Confirmed" tone="positive" />
        <Badge label="Account Flagged">Flagged</Badge>
      </div>
    );
    await expectNoA11yViolations(container);
  });
});
