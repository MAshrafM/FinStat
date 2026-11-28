// frontend/tests/visual/fixtures/profileSettingsMocks.js
const MOCK_USER_PROFILE = {
  _id: 'user-1',
  username: 'admin_user',
  email: 'admin@finstat.local',
  role: 'admin',
  fullName: 'Ahmed Mansour',
  dateOfBirth: '1990-05-15T00:00:00.000Z',
  nationalId: '29005151234567',
  phone: '+20 100 555 0199',
  address: '12 El-Galaa St, Heliopolis, Cairo',
  title: 'Principal Financial Analyst',
  company: 'FinStat Advisory',
  department: 'Portfolio & Risk',
  employeeId: 'EMP-1042',
  costBasisMethod: 'average',
};

const MOCK_DELETED_EXPENDITURES = [
  {
    _id: 'exp-del-1',
    date: '2026-01-10T00:00:00.000Z',
    description: 'Cloud Hosting Invoice',
    categories: ['Utilities'],
    transactionValue: 1250,
    paymentMethod: 'Bank',
    deletedAt: '2026-01-12T09:30:00.000Z',
  },
  {
    _id: 'exp-del-2',
    date: '2026-01-08T00:00:00.000Z',
    description: 'Team Offsite Lunch',
    categories: ['Dining'],
    transactionValue: 480,
    paymentMethod: 'Cash',
    deletedAt: '2026-01-11T14:15:00.000Z',
  },
];

const MOCK_DELETED_TRADES = [
  {
    _id: 'trade-del-1',
    date: '2026-01-05T00:00:00.000Z',
    type: 'Buy',
    stockCode: 'COMI',
    broker: 'Thndr',
    totalValue: 15400,
    deletedAt: '2026-01-09T11:20:00.000Z',
  },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json',
};

async function setupProfileSettingsMocks(page, slug, options = {}) {
  const { error = false, empty = false, delayMs = 0 } = options;
  let currentProfile = { ...MOCK_USER_PROFILE };
  let expenditures = empty ? [] : [...MOCK_DELETED_EXPENDITURES];
  let trades = empty ? [] : [...MOCK_DELETED_TRADES];

  const fulfillJson = async (route, status, payload) => {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    await route.fulfill({
      status,
      headers: CORS_HEADERS,
      body: JSON.stringify(payload),
    });
  };

  await page.route('**/api/users/profile**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (error) {
      return fulfillJson(route, 500, {
        message: slug === 'settings'
          ? 'Failed to load user settings'
          : 'Failed to load profile details',
      });
    }
    if (req.method() === 'PUT') {
      const body = req.postDataJSON() || {};
      currentProfile = { ...currentProfile, ...body };
      return fulfillJson(route, 200, {
        message: body.costBasisMethod
          ? 'Cost-basis settings saved successfully!'
          : 'Profile updated successfully!',
        user: currentProfile,
      });
    }
    return fulfillJson(route, 200, { user: currentProfile });
  });

  await page.route('**/api/expenditures/deleted**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (error) {
      return fulfillJson(route, 500, { message: 'Failed to load deleted records' });
    }
    return fulfillJson(route, 200, {
      data: expenditures,
      total: expenditures.length,
      page: 1,
      totalPages: 1,
    });
  });

  await page.route('**/api/trades/deleted**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (error) {
      return fulfillJson(route, 500, { message: 'Failed to load deleted records' });
    }
    return fulfillJson(route, 200, {
      data: trades,
      total: trades.length,
      page: 1,
      totalPages: 1,
    });
  });

  await page.route('**/api/expenditures/*/restore**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    const id = req.url().split('/expenditures/')[1].split('/restore')[0];
    expenditures = expenditures.filter((item) => item._id !== id);
    return fulfillJson(route, 200, { msg: 'Item restored successfully' });
  });

  await page.route('**/api/trades/*/restore**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    const id = req.url().split('/trades/')[1].split('/restore')[0];
    trades = trades.filter((item) => item._id !== id);
    return fulfillJson(route, 200, { msg: 'Item restored successfully' });
  });
}

module.exports = {
  MOCK_USER_PROFILE,
  MOCK_DELETED_EXPENDITURES,
  MOCK_DELETED_TRADES,
  setupProfileSettingsMocks,
};

