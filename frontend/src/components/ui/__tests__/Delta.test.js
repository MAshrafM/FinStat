// frontend/src/components/ui/__tests__/Delta.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import Delta from '../Delta';
const { expectNoA11yViolations } = require('../../../../tests/a11y/expectNoA11yViolations');

describe('Delta Primitive (Phase 2E)', () => {
  it('renders positive number with auto sign (+ prefix) and label', () => {
    render(<Delta value={12.5} label="vs last month" tone="positive" />);
    const delta = screen.getByText('vs last month').closest('.fs-delta');
    expect(delta).toHaveClass('fs-delta', 'fs-delta--positive');
    expect(screen.getByText('+12.5')).toHaveClass('fs-delta-value');
    expect(screen.getByText('vs last month')).toHaveClass('fs-delta-label');
  });

  it('renders negative number with unicode minus and absolute number display', () => {
    render(<Delta value={-4.2} label="YoY" tone="negative" />);
    const delta = screen.getByText('YoY').closest('.fs-delta');
    expect(delta).toHaveClass('fs-delta', 'fs-delta--negative');
    // Unicode minus \u2212
    expect(screen.getByText('\u22124.2')).toBeInTheDocument();
  });

  it('handles negative string values without producing double minuses', () => {
    render(<Delta value="-15%" label="vs prior year" tone="negative" />);
    expect(screen.getByText('\u221215%')).toBeInTheDocument();
  });

  it('supports explicit sign modes (none, positive, negative)', () => {
    const { rerender } = render(<Delta value="5.0" sign="none" label="spread" />);
    expect(screen.getByText('5.0')).toBeInTheDocument();

    rerender(<Delta value="0.0" sign="positive" label="delta" />);
    expect(screen.getByText('+0.0')).toBeInTheDocument();

    rerender(<Delta value="0.0" sign="negative" label="delta" />);
    expect(screen.getByText('\u22120.0')).toBeInTheDocument();
  });

  it('applies semantic tones (positive, negative, warning, neutral)', () => {
    const { rerender } = render(<Delta value="1" label="test" tone="positive" />);
    expect(screen.getByText('test').closest('.fs-delta')).toHaveClass('fs-delta--positive');

    rerender(<Delta value="1" label="test" tone="negative" />);
    expect(screen.getByText('test').closest('.fs-delta')).toHaveClass('fs-delta--negative');

    rerender(<Delta value="1" label="test" tone="warning" />);
    expect(screen.getByText('test').closest('.fs-delta')).toHaveClass('fs-delta--warning');

    rerender(<Delta value="1" label="test" tone="neutral" />);
    expect(screen.getByText('test').closest('.fs-delta')).toHaveClass('fs-delta--neutral');
  });

  it('warns when label prop is missing for accessibility', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Delta value={10} />);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[Delta] A descriptive label is required'));
    warnSpy.mockRestore();
  });

  it('implements Option B visible-announcement pattern (no parent aria-label)', () => {
    render(<Delta value={20} label="from last quarter" tone="positive" />);
    const delta = screen.getByText('from last quarter').closest('.fs-delta');
    expect(delta).not.toHaveAttribute('aria-label');
  });

  it('passes accessibility audits without violations', async () => {
    const { container } = render(
      <div>
        <Delta value={15.4} label="YoY growth" tone="positive" />
        <Delta value={-3.1} label="QoQ change" tone="negative" />
      </div>
    );
    await expectNoA11yViolations(container);
  });
});
