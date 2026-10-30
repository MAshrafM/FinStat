// frontend/src/context/__tests__/MFContextCache.test.js
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { MFProvider, useMFData, __resetPriceCacheForTests } from '../MFContext';
import * as mfService from '../../services/mutualFundService';

jest.mock('../../services/mutualFundService', () => ({
  getMutualFundSummary: jest.fn(),
  getBatchLastPrices: jest.fn(),
  getLastPrice: jest.fn(),
}));

const TestConsumer = ({ onReady }) => {
  const mfData = useMFData();
  React.useEffect(() => {
    if (onReady) {
      onReady(mfData);
    }
  }, [mfData, onReady]);
  return <div data-testid="ready">{mfData.isLoading ? 'loading' : 'ready'}</div>;
};

describe('MFContext Client-Side TTL Cache Tests [AUD-PERF-005]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof __resetPriceCacheForTests === 'function') {
      __resetPriceCacheForTests();
    }
    mfService.getMutualFundSummary.mockResolvedValue([
      { _id: { name: 'Fund Alpha', code: 'FA01' }, currentUnits: 10, totalValue: 1000, totalCouponValue: 0 },
    ]);
  });

  test('within TTL, second load of same funds does NOT call getBatchLastPrices', async () => {
    mfService.getBatchLastPrices.mockResolvedValue({
      prices: [{ name: 'Fund Alpha', lastPrice: 105 }],
    });

    let contextRef;
    const { unmount } = render(
      <MFProvider>
        <TestConsumer onReady={(data) => { contextRef = data; }} />
      </MFProvider>
    );

    await waitFor(() => {
      expect(contextRef?.isLoading).toBe(false);
    });

    expect(mfService.getBatchLastPrices).toHaveBeenCalledTimes(1);

    // Unmount and remount another consumer within the 5m TTL
    unmount();

    let secondContextRef;
    render(
      <MFProvider>
        <TestConsumer onReady={(data) => { secondContextRef = data; }} />
      </MFProvider>
    );

    await waitFor(() => {
      expect(secondContextRef?.isLoading).toBe(false);
    });

    // Should still be exactly 1 call because Fund Alpha is cached in memory
    expect(mfService.getBatchLastPrices).toHaveBeenCalledTimes(1);
    expect(secondContextRef.lastPriceData).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Fund Alpha', lastPrice: 105 })])
    );
  });

  test('forceRefresh bypasses client cache and triggers fresh batch fetch', async () => {
    mfService.getBatchLastPrices
      .mockResolvedValueOnce({
        prices: [{ name: 'Fund Alpha', lastPrice: 105 }],
      })
      .mockResolvedValueOnce({
        prices: [{ name: 'Fund Alpha', lastPrice: 110 }],
      });

    let contextRef;
    render(
      <MFProvider>
        <TestConsumer onReady={(data) => { contextRef = data; }} />
      </MFProvider>
    );

    await waitFor(() => {
      expect(contextRef?.isLoading).toBe(false);
    });

    expect(mfService.getBatchLastPrices).toHaveBeenCalledTimes(1);

    // Call refreshLastPrices (which invokes forceRefresh)
    await act(async () => {
      await contextRef.refreshLastPrices();
    });

    expect(mfService.getBatchLastPrices).toHaveBeenCalledTimes(2);
    expect(contextRef.lastPriceData).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Fund Alpha', lastPrice: 110 })])
    );
  });

  test('serves stale prices when batch network request fails', async () => {
    mfService.getBatchLastPrices
      .mockResolvedValueOnce({
        prices: [{ name: 'Fund Alpha', lastPrice: 105 }],
      })
      .mockRejectedValueOnce(new Error('Network error'));

    let contextRef;
    render(
      <MFProvider>
        <TestConsumer onReady={(data) => { contextRef = data; }} />
      </MFProvider>
    );

    await waitFor(() => {
      expect(contextRef?.isLoading).toBe(false);
    });

    expect(contextRef.lastPriceData).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Fund Alpha', lastPrice: 105 })])
    );

    // Trigger refresh that rejects
    await act(async () => {
      await contextRef.refreshLastPrices();
    });

    // Fallback serves stale cached price instead of breaking
    expect(contextRef.lastPriceData).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Fund Alpha', lastPrice: 105 })])
    );
  });
});

