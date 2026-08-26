// frontend/src/services/realEstateService.test.js
import apiClient from './apiClient';
import {
  getRealEstates,
  getRealEstateSummary,
  getRealEstateById,
  createRealEstate,
  updateRealEstate,
  deleteRealEstate,
} from './realEstateService';

jest.mock('./apiClient');

describe('frontend realEstateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getRealEstates with filters', async () => {
    apiClient.get.mockResolvedValueOnce([{ name: 'Villa 1' }]);
    const res = await getRealEstates({ status: 'Owned', search: 'Villa' });

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/real-estates?status=Owned&search=Villa'),
      {}
    );
    expect(res).toEqual([{ name: 'Villa 1' }]);
  });

  it('should call getRealEstateSummary', async () => {
    apiClient.get.mockResolvedValueOnce({ owned: { count: 2 } });
    const res = await getRealEstateSummary();

    expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/real-estates/summary'), {});
    expect(res).toEqual({ owned: { count: 2 } });
  });

  it('should call createRealEstate', async () => {
    apiClient.post.mockResolvedValueOnce({ _id: '1', name: 'Apartment' });
    const res = await createRealEstate({ name: 'Apartment', purchasePrice: 1000000 });

    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/real-estates'),
      { name: 'Apartment', purchasePrice: 1000000 },
      {}
    );
    expect(res).toEqual({ _id: '1', name: 'Apartment' });
  });

  it('should call deleteRealEstate', async () => {
    apiClient.delete.mockResolvedValueOnce({ msg: 'deleted' });
    const res = await deleteRealEstate('123');

    expect(apiClient.delete).toHaveBeenCalledWith(expect.stringContaining('/real-estates/123'), {});
    expect(res).toEqual({ msg: 'deleted' });
  });
});
