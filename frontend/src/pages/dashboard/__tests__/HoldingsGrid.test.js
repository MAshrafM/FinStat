// frontend/src/pages/dashboard/__tests__/HoldingsGrid.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FaGem, FaUniversity, FaChartPie, FaChartLine, FaLandmark, FaExchangeAlt, FaHome, FaHandshake } from 'react-icons/fa';
import HoldingsGrid from '../HoldingsGrid';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

describe('Step 8B.1b: HoldingsGrid Component Tests [AUD-ARCH-001]', () => {
  const mockHoldings = [
    { key: 'gold', name: 'Gold', subtitle: 'Bullion & jewellery', icon: FaGem, tone: 'gold', color: '#f59e0b', current: 200000, invested: 150000, metaLabel: 'Invested', metaValue: 150000, delta: 33.3, viewPath: '/gold-wallet', addPath: '/gold-wallet/new' },
    { key: 'certificates', name: 'Certificates', subtitle: 'Fixed-income deposits', icon: FaUniversity, tone: 'sky', color: '#38bdf8', current: 100000, invested: 100000, metaLabel: 'Expected returns', metaValue: 120000, delta: 20.0, viewPath: '/certificates', addPath: '/certificates/new' },
    { key: 'funds', name: 'Mutual Funds', subtitle: 'Managed portfolios', icon: FaChartPie, tone: 'violet', color: '#a78bfa', current: 50000, invested: 60000, metaLabel: 'Invested', metaValue: 60000, delta: -16.7, viewPath: '/mutual-funds', addPath: '/mutual-funds/new' },
    { key: 'stocks', name: 'Stocks', subtitle: 'Trading portfolio', icon: FaChartLine, tone: 'emerald', color: '#34d399', current: 300000, invested: 250000, metaLabel: 'Net deposits', metaValue: 250000, delta: 20.0, viewPath: '/trades', addPath: '/trades/add' },
    { key: 'bank', name: 'Bank & Credit', subtitle: 'Cash and card accounts', icon: FaLandmark, tone: 'cyan', color: '#22d3ee', current: 40000, invested: 40000, metaLabel: 'Credit available', metaValue: 15000, delta: null, note: 'No balance due', viewPath: '/credit-cards', addPath: null },
    { key: 'currency', name: 'Foreign Currency', subtitle: 'Multi-currency wallet', icon: FaExchangeAlt, tone: 'rose', color: '#fb7185', current: 60000, invested: 50000, metaLabel: 'Cost basis', metaValue: 50000, delta: 20.0, viewPath: '/currency', addPath: '/currency/new' },
    { key: 'real-estate', name: 'Real Estate', subtitle: 'Property portfolio', icon: FaHome, tone: 'amber', color: '#fbbf24', current: 500000, invested: 400000, metaLabel: 'Purchase price', metaValue: 400000, delta: 25.0, viewPath: '/real-estate', addPath: '/real-estate/new' },
    { key: 'lending', name: 'Receivables', subtitle: 'Personal loans & tracking', icon: FaHandshake, tone: 'indigo', color: '#6366f1', current: 20000, invested: 20000, metaLabel: 'Total Borrowed', metaValue: 30000, delta: null, note: '1 active loans', viewPath: '/lending', addPath: '/lending' },
  ];

  const totalCurrent = 1270000;

  const renderComponent = (props = {}) => {
    const defaultProps = {
      holdings: mockHoldings,
      totalCurrent,
      canModify: true,
    };
    return render(<HoldingsGrid {...defaultProps} {...props} />);
  };

  // Test 1: renders all 8 asset class cards (Gold, Certs, Funds, Stocks, Bank, FX, Real Estate, Lending)
  test('1. renders all 8 asset class cards (Gold, Certs, Funds, Stocks, Bank, FX, Real Estate, Lending)', () => {
    renderComponent();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Mutual Funds')).toBeInTheDocument();
    expect(screen.getByText('Stocks')).toBeInTheDocument();
    expect(screen.getByText('Bank & Credit')).toBeInTheDocument();
    expect(screen.getByText('Foreign Currency')).toBeInTheDocument();
    expect(screen.getByText('Real Estate')).toBeInTheDocument();
    expect(screen.getByText('Receivables')).toBeInTheDocument();
  });

  // Test 2: displays correct formatted current value and metadata label for each holding
  test('2. displays correct formatted current value and metadata label for each holding', () => {
    renderComponent();
    expect(screen.getByText('$200,000.00')).toBeInTheDocument();
    expect(screen.getByText('Expected returns')).toBeInTheDocument();
    expect(screen.getByText('Purchase price')).toBeInTheDocument();
  });

  // Test 3: renders proportional width track bar reflecting share of total portfolio
  test('3. renders proportional width track bar reflecting share of total portfolio', () => {
    const { container } = renderComponent();
    const tracks = container.querySelectorAll('.dash-holding-track span');
    expect(tracks).toHaveLength(8);
    // Gold current 200k / 1270k = ~15.7%
    expect(tracks[0].style.width).toMatch(/15\.7/);
  });

  // Test 4: shows positive and negative performance deltas with appropriate CSS classes
  test('4. shows positive and negative performance deltas with appropriate CSS classes', () => {
    const { container } = renderComponent();
    const upDeltas = container.querySelectorAll('.dash-delta.up');
    const downDeltas = container.querySelectorAll('.dash-delta.down');
    expect(upDeltas.length).toBeGreaterThan(0);
    expect(downDeltas.length).toBeGreaterThan(0);
  });

  // Test 5: renders '+ Add' link when canModify is true and asset has addPath
  test('5. renders "+ Add" link when canModify is true and asset has addPath', () => {
    renderComponent({ canModify: true });
    const addLinks = screen.getAllByRole('link', { name: /^add$/i });
    expect(addLinks.length).toBeGreaterThan(0);
  });

  // Test 6: hides '+ Add' link when canModify is false
  test('6. hides "+ Add" link when canModify is false', () => {
    renderComponent({ canModify: false });
    expect(screen.queryByRole('link', { name: /^add$/i })).not.toBeInTheDocument();
  });

  // Test 7: provides working navigation link to Purchasing Power analytics page
  test('7. provides working navigation link to Purchasing Power analytics page', () => {
    renderComponent();
    const link = screen.getByRole('link', { name: /purchasing power/i });
    expect(link).toHaveAttribute('href', '/analytics/purchasing-power');
  });

  // Test 8: provides working navigation link to full Portfolio Dashboard page
  test('8. provides working navigation link to full Portfolio Dashboard page', () => {
    renderComponent();
    const link = screen.getByRole('link', { name: /open portfolio/i });
    expect(link).toHaveAttribute('href', '/portfolio');
  });
});
