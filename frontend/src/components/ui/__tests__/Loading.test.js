/* eslint-disable testing-library/no-container, testing-library/no-node-access */
// frontend/src/components/ui/__tests__/Loading.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import Loading from '../Loading';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('Loading Primitive (§8.4 Primitive #8, D23)', () => {
  it('renders default route variant with role="status", visible text, and no parent aria-label', () => {
    const { container } = render(<Loading text="Loading application..." />);
    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveClass('fs-loading', 'fs-loading--route');
    expect(statusEl).not.toHaveAttribute('aria-label');
    expect(screen.getByText('Loading application...')).toBeInTheDocument();
    const spinner = container.querySelector('.fs-loading-spinner');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders route variant with default text "Loading..." when no text is provided', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders inline variant with small spinner and visible text or visually hidden fallback', () => {
    const { rerender, container } = render(<Loading variant="inline" text="Saving..." />);
    let statusEl = screen.getByRole('status');
    expect(statusEl).toHaveClass('fs-loading', 'fs-loading--inline');
    expect(statusEl.tagName.toLowerCase()).toBe('span');
    expect(screen.getByText('Saving...')).toHaveClass('fs-loading-text');
    expect(container.querySelector('.fs-loading-spinner--sm')).toHaveAttribute('aria-hidden', 'true');

    // Without visible text, renders visually hidden accessible name
    rerender(<Loading variant="inline" ariaLabel="Submitting authentication..." />);
    statusEl = screen.getByRole('status');
    expect(screen.getByText('Submitting authentication...')).toHaveClass('fs-visually-hidden');
  });

  it('renders table variant with container role="status", aria-label, and aria-hidden rows', () => {
    const { container } = render(<Loading variant="table" text="Loading ledger..." rows={5} />);
    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveClass('fs-loading', 'fs-loading--table');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading ledger...');
    expect(screen.getByText('Loading ledger...')).toBeInTheDocument();

    const rowsContainer = container.querySelector('.fs-skeleton-rows');
    expect(rowsContainer).toHaveAttribute('aria-hidden', 'true');
    const skeletonRows = container.querySelectorAll('.fs-skeleton--row');
    expect(skeletonRows).toHaveLength(5);
  });

  it('renders card variant with container role="status", aria-label, and aria-hidden card placeholder', () => {
    const { container } = render(<Loading variant="card" text="Loading metrics..." />);
    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveClass('fs-loading', 'fs-loading--card');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading metrics...');
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();

    const skeletonCard = container.querySelector('.fs-skeleton--card');
    expect(skeletonCard).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders form-field variant with container role="status", aria-label, and aria-hidden input placeholder', () => {
    const { container } = render(<Loading variant="form-field" text="Loading field..." />);
    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveClass('fs-loading', 'fs-loading--form-field');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading field...');
    expect(screen.getByText('Loading field...')).toBeInTheDocument();

    const skeletonInput = container.querySelector('.fs-skeleton--form-field');
    expect(skeletonInput).toHaveAttribute('aria-hidden', 'true');
  });

  it('allows ariaLabel to override accessible name on skeleton variants', () => {
    render(<Loading variant="card" text="Visual title" ariaLabel="Custom accessible label" />);
    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveAttribute('aria-label', 'Custom accessible label');
    expect(screen.getByText('Visual title')).toBeInTheDocument();
  });

  it('merges custom className with primitive classes', () => {
    render(<Loading variant="route" className="custom-loading-class" />);
    expect(screen.getByRole('status')).toHaveClass('fs-loading', 'fs-loading--route', 'custom-loading-class');
  });

  it('forwards arbitrary rest props such as data-testid to container', () => {
    render(<Loading variant="card" data-testid="custom-loader-id" id="loader-root" />);
    const statusEl = screen.getByTestId('custom-loader-id');
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveAttribute('id', 'loader-root');
  });

  it('defensively falls back to route variant on invalid variant prop', () => {
    render(<Loading variant="unsupported_variant" text="Fallback test" />);
    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveClass('fs-loading', 'fs-loading--route');
    expect(screen.getByText('Fallback test')).toBeInTheDocument();
  });

  describe('Accessibility Compliance (jest-axe)', () => {
    it('passes axe audit for all 5 variants', async () => {
      const variants = [
        <Loading key="route" variant="route" text="Route loading..." />,
        <Loading key="inline" variant="inline" text="Inline loading..." />,
        <Loading key="table" variant="table" text="Table loading..." rows={3} />,
        <Loading key="card" variant="card" text="Card loading..." />,
        <Loading key="form" variant="form-field" text="Form field loading..." />,
      ];

      for (const element of variants) {
        const { container } = render(element);
        await expectNoA11yViolations(container);
      }
    });
  });
});
