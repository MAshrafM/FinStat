// frontend/src/components/ui/__tests__/Button.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('Button Primitive (Phase 2E)', () => {
  it('renders default secondary variant and md size', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toHaveClass('fs-btn', 'fs-btn-secondary');
    expect(btn).not.toHaveClass('fs-btn-sm');
  });

  it('renders primary, ghost, and danger variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('fs-btn-primary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('fs-btn-ghost');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('fs-btn-danger');
  });

  it('renders sm size class when size="sm"', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('fs-btn-sm');
  });

  it('handles click events when enabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button and prevents clicks when disabled is true', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders loading spinner, disables button, and sets aria-busy when isLoading is true', () => {
    const handleClick = jest.fn();
    render(<Button isLoading onClick={handleClick}>Processing</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('.loading-spinner')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('forwards custom className and data-testid', () => {
    render(<Button className="custom-action" data-testid="test-btn">Custom</Button>);
    const btn = screen.getByTestId('test-btn');
    expect(btn).toHaveClass('custom-action', 'fs-btn');
  });

  it('passes jest-axe accessibility checks in default and loading states', async () => {
    const { container, rerender } = render(<Button>Accessible Action</Button>);
    await expectNoA11yViolations(container);

    rerender(<Button isLoading>Accessible Action</Button>);
    await expectNoA11yViolations(container);
  });
});
