// frontend/src/services/portfolioService.test.js
import apiClient from './apiClient';
import {
  getPortfolioSummary,
  getPortfolioHoldings,
  getPortfolioAllocation,
  clearPortfolioCache,
} from './portfolioService';

jest.mock('./apiClient');

describe('frontend portfolioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getPortfolioSummary with and without refresh query', async () => {
    apiClient.get.mockResolvedValueOnce({ totalInvested: 1000 });
    const res1 = await getPortfolioSummary(false);
    expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/portfolio/summary'), {});
    expect(res1).toEqual({ totalInvested: 1000 });

    await getPortfolioSummary(true);
    expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/portfolio/summary?refresh=true'), {});
  });

  it('should construct query params correctly for getPortfolioHoldings', async () => {
    apiClient.get.mockResolvedValueOnce({ data: [] });
    await getPortfolioHoldings({ assetType: 'Stock', search: 'COMI', refresh: true });

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/portfolio/holdings?assetType=Stock&search=COMI&refresh=true'),
      {}
    );
  });

  it('should call clearPortfolioCache via POST', async () => {
    apiClient.post.mockResolvedValueOnce({ msg: 'cleared' });
    const res = await clearPortfolioCache();

    expect(apiClient.post).toHaveBeenCalledWith(expect.stringContaining('/portfolio/clear-cache'), {}, {});
    expect(res).toEqual({ msg: 'cleared' });
  });
});
