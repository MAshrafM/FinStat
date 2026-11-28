// frontend/tests/visual/fixtures/securityMocks.js
const MOCK_AUDIT_LOGS = [
  {
    _id: 'audit-1',
    success: true,
    timestamp: '2026-01-15T08:45:00.000Z',
    ip: '192.168.1.42',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36',
  },
  {
    _id: 'audit-2',
    success: false,
    timestamp: '2026-01-14T22:10:00.000Z',
    ip: '10.0.0.19',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) Mobile/15E148',
  },
  {
    _id: 'audit-3',
    success: true,
    timestamp: '2026-01-13T11:15:00.000Z',
    ip: '172.16.0.8',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) Firefox/134.0',
  },
];

const MOCK_BACKUP_CODES = [
  'ABCD-1111',
  'EFGH-2222',
  'IJKL-3333',
  'MNOP-4444',
  'QRST-5555',
  'UVWX-6666',
  'YZAB-7777',
  'CDEF-8888',
  'GHIJ-9999',
  'KLMN-0000',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json',
};

async function setupSecurityMocks(page, options = {}) {
  const {
    totpEnabled = false,
    role = 'admin',
    empty = false,
    error = false,
    delayMs = 0,
  } = options;

  let currentUser = {
    _id: 'user-1',
    username: 'admin_user',
    role,
    totpEnabled,
  };

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

  await page.route('**/api/auth/me**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (error) {
      return fulfillJson(route, 500, { message: 'Failed to load security profile.' });
    }
    return fulfillJson(route, 200, { user: currentUser });
  });

  await page.route('**/api/auth/audit-logs**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (error) {
      return fulfillJson(route, 500, { message: 'Failed to load audit logs.' });
    }
    const logs = empty ? [] : MOCK_AUDIT_LOGS;
    return fulfillJson(route, 200, {
      logs,
      page: 1,
      pages: 1,
      total: logs.length,
    });
  });

  await page.route('**/api/auth/2fa/setup**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    return fulfillJson(route, 200, {
      secret: 'JBSWY3DPEHPK3PXP',
      formattedSecret: 'JBSW Y3DP EHPK 3PXP',
    });
  });

  await page.route('**/api/auth/2fa/verify-setup**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    currentUser = { ...currentUser, totpEnabled: true };
    return fulfillJson(route, 200, {
      message: '2FA verified',
      backupCodes: MOCK_BACKUP_CODES,
    });
  });

  await page.route('**/api/auth/2fa/disable**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    currentUser = { ...currentUser, totpEnabled: false };
    return fulfillJson(route, 200, { message: '2FA disabled' });
  });
}

module.exports = {
  MOCK_AUDIT_LOGS,
  MOCK_BACKUP_CODES,
  setupSecurityMocks,
};
