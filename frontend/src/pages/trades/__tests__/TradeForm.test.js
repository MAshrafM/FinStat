// frontend/src/pages/trades/__tests__/TradeForm.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import TradeForm from '../TradeForm';
import { ToastProvider } from '../../../context/ToastContext';
import * as DataContext from '../../../context/DataContext';

expect.extend(toHaveNoViolations);

const mockOpenPosData = [
  {
    _id: { stockCode: 'COMI.CA', broker: 'Thndr', iteration: 1 },
    currentShares: 500,
    avgPrice: 75.50,
    targetSell: 90.00,
  },
];

const mockTradesData = [
  { stockCode: 'COMI.CA', broker: 'Thndr', iteration: 1 },
];

const renderComponent = (props = {}) => {
  jest.spyOn(DataContext, 'useData').mockReturnValue({
    openPosData: mockOpenPosData,
    tradesData: mockTradesData,
  });

  return render(
    <ToastProvider>
      <TradeForm onFormSubmit={jest.fn()} {...props} />
    </ToastProvider>
  );
};

describe('TradeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. renders all standard form controls with associated labels', () => {
    renderComponent();
    expect(screen.getByLabelText(/^Date$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Broker$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Transaction Type$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Trade/i })).toBeInTheDocument();
  });

  test('2. shows custom broker input when "Other" is selected', () => {
    renderComponent();
    const brokerSelect = screen.getByLabelText(/^Broker$/i);
    fireEvent.change(brokerSelect, { target: { value: 'Other' } });

    expect(screen.getByLabelText(/Custom Broker Name/i)).toBeInTheDocument();
  });

  test('3. auto-calculates total value for Buy transactions', () => {
    renderComponent();
    const sharesInput = screen.getByLabelText(/^Shares$/i);
    const priceInput = screen.getByLabelText(/^Price per Share$/i);

    fireEvent.change(sharesInput, { target: { value: '100' } });
    fireEvent.change(priceInput, { target: { value: '50' } });

    const totalInput = screen.getByLabelText(/^Total Value$/i);
    expect(totalInput.value).toMatch(/5,000/);
  });

  test('4. displays stock info card when stock to sell is chosen', () => {
    renderComponent({ initialData: { type: 'Sell' } });
    const selectStock = screen.getByLabelText(/Select Stock to Sell/i);
    fireEvent.change(selectStock, { target: { value: 'COMI.CA' } });

    expect(screen.getByText(/Current Shares:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/500/).length).toBeGreaterThanOrEqual(1);
  });

  test('5. shows warning when sell quantity exceeds available holdings', () => {
    renderComponent({ initialData: { type: 'Sell' } });
    const selectStock = screen.getByLabelText(/Select Stock to Sell/i);
    fireEvent.change(selectStock, { target: { value: 'COMI.CA' } });

    const sharesInput = screen.getByLabelText(/^Shares$/i);
    fireEvent.change(sharesInput, { target: { value: '600' } });

    expect(screen.getByText(/Cannot sell more than 500 shares/i)).toBeInTheDocument();
  });

  test('6. submits form with valid Buy payload', () => {
    const handleSubmit = jest.fn();
    renderComponent({ onFormSubmit: handleSubmit });

    const stockInput = screen.getByLabelText(/^Stock Code$/i);
    const sharesInput = screen.getByLabelText(/^Shares$/i);
    const priceInput = screen.getByLabelText(/^Price per Share$/i);

    fireEvent.change(stockInput, { target: { value: 'ABUK.CA' } });
    fireEvent.change(sharesInput, { target: { value: '10' } });
    fireEvent.change(priceInput, { target: { value: '100' } });

    const submitBtn = screen.getByRole('button', { name: /Create Trade/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Buy',
        stockCode: 'ABUK.CA',
        shares: 10,
        price: 100,
      })
    );
  });

  test('7. renders cash fields when type is TopUp', () => {
    renderComponent({ initialData: { type: 'TopUp' } });
    expect(screen.getByLabelText(/^Amount$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Shares$/i)).not.toBeInTheDocument();
  });

  test('8. renders dividend fields when type is Dividend', () => {
    renderComponent({ initialData: { type: 'Dividend' } });
    expect(screen.getByLabelText(/Dividend Amount Cash/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dividend Amount Shares/i)).toBeInTheDocument();
  });

  test('9. pre-fills initialData when isEdit is true', () => {
    const initialData = {
      _id: 'trade-edit-1',
      date: '2026-01-10T00:00:00Z',
      broker: 'Thndr',
      type: 'Buy',
      stockCode: 'COMI.CA',
      shares: 150,
      price: 80,
      fees: 20,
      totalValue: 12020,
      iteration: 1,
    };

    renderComponent({ initialData, isEdit: true });
    expect(screen.getByRole('button', { name: /Update Trade/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Stock Code$/i)).toHaveValue('COMI.CA');
    expect(screen.getByLabelText(/^Shares$/i)).toHaveValue(150);
  });

  test('10. has 0 accessibility violations with jest-axe', async () => {
    const { container } = renderComponent();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('11. renders split ratio field when transaction type is Split', () => {
    renderComponent({ initialData: { type: 'Split' } });
    expect(screen.getByLabelText(/Split Ratio/i)).toBeInTheDocument();
  });

  test('12. auto-calculates iteration for new Buy trade based on open positions and past trades', () => {
    renderComponent();
    const stockInput = screen.getByLabelText(/^Stock Code$/i);
    fireEvent.change(stockInput, { target: { value: 'COMI.CA' } });
    const iterationInput = screen.getByLabelText(/Iteration/i);
    expect(iterationInput).toHaveValue(1);
  });
});
