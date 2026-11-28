// frontend/tests/visual/fixtures/adminMocks.js
const MOCK_USERS = [
  {
    _id: 'u-1',
    username: 'admin_user',
    email: 'admin@finstat.local',
    role: 'admin',
    totpEnabled: true,
    createdAt: '2025-11-01T09:00:00.000Z',
  },
  {
    _id: 'u-2',
    username: 'sara_manager',
    email: 'sara.m@finstat.local',
    role: 'manager',
    totpEnabled: true,
    createdAt: '2025-12-10T14:30:00.000Z',
  },
  {
    _id: 'u-3',
    username: 'omar_viewer',
    email: 'omar.v@finstat.local',
    role: 'viewer',
    totpEnabled: false,
    managedBy: { _id: 'u-2', username: 'sara_manager' },
    createdAt: '2026-01-05T11:15:00.000Z',
  },
];

const MOCK_TAX_CONFIGS = [
  {
    _id: 'tax-2025',
    year: 2025,
    country: 'Egypt',
    personalExemption: 20000,
    isActive: true,
    lastUpdated: '2025-01-10T10:00:00.000Z',
    brackets: [
      { level: 1, from: 0, to: 40000, rate: 0 },
      { level: 2, from: 40001, to: 55000, rate: 10 },
      { level: 3, from: 55001, to: 70000, rate: 15 },
      { level: 4, from: 70001, to: 200000, rate: 20 },
      { level: 5, from: 200001, to: 400000, rate: 22.5 },
      { level: 6, from: 400001, to: 1200000, rate: 25 },
      { level: 7, from: 1200001, to: 100000000, rate: 27.5 },
    ],
  },
  {
    _id: 'tax-2024',
    year: 2024,
    country: 'Egypt',
    personalExemption: 15000,
    isActive: false,
    lastUpdated: '2024-03-01T10:00:00.000Z',
    brackets: [
      { level: 1, from: 0, to: 30000, rate: 0 },
      { level: 2, from: 30001, to: 45000, rate: 10 },
      { level: 3, from: 45001, to: 60000, rate: 15 },
      { level: 4, from: 60001, to: 200000, rate: 20 },
      { level: 5, from: 200001, to: 100000000, rate: 25 },
    ],
  },
];

const MOCK_INSURANCE_CONFIGS = [
  {
    _id: 'ins-2025',
    year: 2025,
    country: 'Egypt',
    employeeShare: 11,
    employerShare: 18.75,
    minInsurableIncome: 2300,
    maxInsurableIncome: 14500,
    isActive: true,
    updatedAt: '2025-01-05T09:00:00.000Z',
  },
  {
    _id: 'ins-2024',
    year: 2024,
    country: 'Egypt',
    employeeShare: 11,
    employerShare: 18.75,
    minInsurableIncome: 2000,
    maxInsurableIncome: 12600,
    isActive: false,
    updatedAt: '2024-01-05T09:00:00.000Z',
  },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-auth-token, x-csrf-token',
  'Content-Type': 'application/json',
};

async function setupAdminMocks(page, options = {}) {
  const { role = 'admin', importAvailable = true } = options;

  const fulfillJson = (route, status, payload) =>
    route.fulfill({
      status,
      headers: CORS_HEADERS,
      body: JSON.stringify(payload),
    });

  await page.route('**/api/auth/me**', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    return fulfillJson(route, 200, {
      user: {
        _id: 'admin-1',
        id: 'admin-1',
        username: 'admin_user',
        role,
        totpEnabled: true,
      },
    });
  });

  await page.route('**/api/admin/users**', (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (req.method() === 'POST') {
      return fulfillJson(route, 201, {
        user: { _id: 'u-new', username: 'new_member', role: 'viewer', totpEnabled: false },
      });
    }
    if (req.method() === 'DELETE') {
      return fulfillJson(route, 200, { success: true });
    }
    return fulfillJson(route, 200, {
      users: MOCK_USERS,
      totalPages: 1,
      totalUsers: MOCK_USERS.length,
    });
  });

  await page.route('**/api/admin/tax-brackets**', (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (req.method() === 'GET') {
      return fulfillJson(route, 200, { taxBrackets: MOCK_TAX_CONFIGS });
    }
    return fulfillJson(route, 200, { taxBracket: MOCK_TAX_CONFIGS[0] });
  });

  await page.route('**/api/admin/social-insurance**', (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (req.method() === 'GET') {
      return fulfillJson(route, 200, { socialInsuranceConfigs: MOCK_INSURANCE_CONFIGS });
    }
    return fulfillJson(route, 200, { socialInsuranceConfig: MOCK_INSURANCE_CONFIGS[0] });
  });

  await page.route('**/api/admin/backup/status**', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    return fulfillJson(route, 200, {
      importAvailable,
      environment: importAvailable ? 'development' : 'production',
    });
  });

  await page.route('**/api/admin/backup/import**', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    return fulfillJson(route, 200, {
      dryRun: true,
      durationMs: 42,
      collections: {
        expenses: { willDelete: 120, willInsert: 135 },
        paychecks: { willDelete: 24, willInsert: 24 },
        trades: { willDelete: 18, willInsert: 12 },
      },
    });
  });
}

module.exports = { setupAdminMocks, MOCK_USERS, MOCK_TAX_CONFIGS, MOCK_INSURANCE_CONFIGS };
