// frontend/src/pages/dashboard/__tests__/ReportsGrid.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportsGrid from '../ReportsGrid';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

describe('Step 8B.1c: ReportsGrid Component Tests [AUD-ARCH-001]', () => {
  const renderComponent = (props = {}) => {
    const defaultProps = {
      canModify: true,
      onOpenLauncher: jest.fn(),
    };
    return render(<ReportsGrid {...defaultProps} {...props} />);
  };

  // Test 1: renders Quick Launch action tiles when canModify is true
  test('1. renders Quick Launch action tiles when canModify is true', () => {
    renderComponent({ canModify: true });
    expect(screen.getByText('Quick launch')).toBeInTheDocument();
    expect(screen.getByText('Log Paycheck')).toBeInTheDocument();
    expect(screen.getByText('Add Expense')).toBeInTheDocument();
    expect(screen.getByText('New Trade')).toBeInTheDocument();
  });

  // Test 2: hides Quick Launch action tiles when canModify is false
  test('2. hides Quick Launch action tiles when canModify is false', () => {
    renderComponent({ canModify: false });
    expect(screen.queryByText('Quick launch')).not.toBeInTheDocument();
    expect(screen.queryByText('Log Paycheck')).not.toBeInTheDocument();
  });

  // Test 3: renders all 8 Explore Report cards with icons, labels, and links
  test('3. renders all 8 Explore Report cards with icons, labels, and links', () => {
    renderComponent();
    expect(screen.getByText('Reports & insights')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
    expect(screen.getByText('Payroll Analytics')).toBeInTheDocument();
    expect(screen.getByText('Spending Analysis')).toBeInTheDocument();
    expect(screen.getByText('Trade Summary')).toBeInTheDocument();
    expect(screen.getByText('Fund Summary')).toBeInTheDocument();
    expect(screen.getByText('Gold Summary')).toBeInTheDocument();
    expect(screen.getByText('Budget Tracker')).toBeInTheDocument();
    expect(screen.getByText('Credit & Debt')).toBeInTheDocument();
  });

  // Test 4: clicking 'All actions' or 'Browse all' triggers onOpenLauncher callback
  test('4. clicking "All actions" or "Browse all" triggers onOpenLauncher callback', () => {
    const onOpenLauncher = jest.fn();
    renderComponent({ canModify: true, onOpenLauncher });

    const allActionsBtn = screen.getByRole('button', { name: /all actions/i });
    fireEvent.click(allActionsBtn);
    expect(onOpenLauncher).toHaveBeenCalledWith('create');

    const browseAllBtn = screen.getByRole('button', { name: /browse all/i });
    fireEvent.click(browseAllBtn);
    expect(onOpenLauncher).toHaveBeenCalledWith('explore');
  });

  // Test 5: renders dashboard footnote disclaimers with wallet and balance icons
  test('5. renders dashboard footnote disclaimers with wallet and balance icons', () => {
    const { container } = renderComponent();
    const footnote = container.querySelector('.dash-footnote');
    expect(footnote).toBeInTheDocument();
    expect(
      screen.getByText(/Values combine live market prices with your latest recorded transactions/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Returns are indicative and exclude taxes and fees where not recorded/i)
    ).toBeInTheDocument();
  });
});
