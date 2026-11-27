// frontend/tests/visual/fixtures/realEstateMocks.js
/**
 * Deterministic Playwright network mocks for Phase 8E:
 *   /real-estate, /real-estate/new, /real-estate/edit/:id
 */

const MOCK_REAL_ESTATES = [
  {
    _id: '1',
    name: 'New Cairo Apartment',
    type: 'Residential',
    area: 165,
    location: '5th Settlement, New Cairo',
    purchasePrice: 1800000,
    currentValuation: 2200000,
    purchaseDate: '2023-06-15T00:00:00.000Z',
    status: 'Owned',
    sellingPrice: 0,
    notes: 'Primary residential investment unit in gated compound.',
  },
  {
    _id: '2',
    name: 'North Coast Chalet',
    type: 'Villa',
    area: 210,
    location: 'Ras El Hekma, North Coast',
    purchasePrice: 2000000,
    currentValuation: 1850000,
    purchaseDate: '2024-03-10T00:00:00.000Z',
    status: 'Owned',
    sellingPrice: 0,
    notes: 'Seasonal coastal property.',
  },
  {
    _id: '3',
    name: 'Smart Village Office',
    type: 'Commercial',
    area: 140,
    location: 'Smart Village, Giza',
    purchasePrice: 2500000,
    currentValuation: 2500000,
    purchaseDate: '2021-02-01T00:00:00.000Z',
    status: 'Sold',
    sellingPrice: 2500000,
    sellingDate: '2025-05-01T00:00:00.000Z',
    notes: 'Exited at break-even.',
  },
  {
    _id: '4',
    name: 'Downtown Retail Unit',
    type: 'Commercial',
    area: 95,
    location: 'Downtown Cairo',
    purchasePrice: 3000000,
    currentValuation: 3000000,
    purchaseDate: '2020-09-20T00:00:00.000Z',
    status: 'Sold',
    sellingPrice: 2700000,
    sellingDate: '2025-08-12T00:00:00.000Z',
    notes: 'Liquidated below original acquisition cost.',
  },
];

const MOCK_REAL_ESTATE_SUMMARY = {
  owned: {
    totalPaid: 3800000,
    totalValuation: 4050000,
    unrealizedGain: 250000,
    gainPercentage: 6.58,
    count: 2,
  },
  sold: {
    totalPaid: 5500000,
    totalSoldValue: 5200000,
    realizedGain: -300000,
    count: 2,
  },
  totalProperties: 4,
};

const getCorsHeaders = (request) => {
  const origin = request.headers().origin || 'http://localhost:3000';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
};

async function setupRealEstateMocks(page) {
  await page.route(/\/api\/real-estates(?:\/|\?|$)/, async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const corsHeaders = getCorsHeaders(request);

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url());
    const pathname = url.pathname;

    const fulfillJson = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(body),
      });

    // Summary endpoint
    if (method === 'GET' && /\/api\/real-estates\/summary\/?$/.test(pathname)) {
      return fulfillJson(MOCK_REAL_ESTATE_SUMMARY);
    }

    // Detail endpoint by ID
    const detailMatch = pathname.match(/\/api\/real-estates\/([^/]+)\/?$/);
    if (detailMatch) {
      const id = detailMatch[1];
      if (method === 'GET') {
        const found = MOCK_REAL_ESTATES.find((item) => item._id === id) || MOCK_REAL_ESTATES[0];
        return fulfillJson(found);
      }
      if (method === 'PUT') {
        const body = request.postDataJSON() || {};
        return fulfillJson({ _id: id, ...body });
      }
      if (method === 'DELETE') {
        return fulfillJson({ message: 'Real estate property removed', id });
      }
    }

    // Collection endpoint
    if (method === 'GET') {
      const statusFilter = url.searchParams.get('status');
      const typeFilter = url.searchParams.get('type');
      const searchFilter = (url.searchParams.get('search') || '').trim().toLowerCase();

      const filtered = MOCK_REAL_ESTATES.filter((item) => {
        if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }
        if (typeFilter && typeFilter !== 'all' && item.type !== typeFilter) {
          return false;
        }
        if (searchFilter) {
          const hay = `${item.name} ${item.location || ''}`.toLowerCase();
          if (!hay.includes(searchFilter)) return false;
        }
        return true;
      });
      return fulfillJson(filtered);
    }

    if (method === 'POST') {
      const body = request.postDataJSON() || {};
      return fulfillJson({ _id: 'new-re-id', ...body }, 201);
    }

    return route.continue();
  });
}

module.exports = {
  MOCK_REAL_ESTATES,
  MOCK_REAL_ESTATE_SUMMARY,
  setupRealEstateMocks,
};
