// frontend/src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import MutualFundSummaryPage from '../MutualFundSummaryPage';
import { useMFData } from '../../../context/MFContext';

jest.mock('../../../context/MFContext', () => ({
  useMFData: jest.fn(),
}));

describe('Step 4A.5: [AUD-UI-001] MutualFundSummaryPage Null Price Safety', () => {
  it('renders gracefully with Price Unavailable badge instead of throwing TypeError when fund price is missing from lastPriceData', () => {
    useMFData.mockReturnValue({
      isLoading: false,
      overallTotals: {
        totalOfAllMF: 10000,
        totalOfAllCoupons: 500,
        newTotal: 9500,
        totalSellingValue: 12000,
        totalProfit: '26.32',
      },
      mfSummaryData: [
        {
          _id: { name: 'Misr Equity Fund', code: 'MEF01' },
          currentUnits: 100,
          averagePrice: 100,
          totalValue: 10000,
          totalCouponValue: 500,
        },
      ],
      // lastPriceData is empty or missing 'Misr Equity Fund'
      lastPriceData: [],
    });

    // Should render without throwing TypeError
    render(<MutualFundSummaryPage />);

    expect(screen.getByText('Misr Equity Fund')).toBeInTheDocument();
    expect(screen.getByText('Price Unavailable')).toBeInTheDocument();
  });
});
