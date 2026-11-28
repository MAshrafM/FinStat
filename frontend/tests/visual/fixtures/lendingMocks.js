// frontend/tests/visual/fixtures/lendingMocks.js
const MOCK_PERSONS = [
  {
    _id: '1',
    name: 'Ahmed Samir',
    note: 'Work colleague',
    totalOwedInPiastres: 600000,
    loanCount: 2,
    activeLoanCount: 1,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    _id: '2',
    name: 'Karim Hassan',
    note: 'Family friend',
    totalOwedInPiastres: 0,
    loanCount: 1,
    activeLoanCount: 0,
    createdAt: '2026-01-05T10:00:00.000Z',
  },
];

const MOCK_LOANS = [
  {
    _id: '1',
    person: { _id: '1', name: 'Ahmed Samir', note: 'Work colleague' },
    status: 'Active',
    notes: 'Emergency car repair',
    totalBorrowedInPiastres: 1000000,
    totalRepaidInPiastres: 400000,
    balanceInPiastres: 600000,
    createdAt: '2026-01-10T10:00:00.000Z',
    transactions: [
      {
        _id: 'tx-1',
        type: 'borrow',
        amountInPiastres: 1000000,
        runningBalanceInPiastres: 1000000,
        date: '2026-01-10T10:00:00.000Z',
        note: 'Initial disbursement',
      },
      {
        _id: 'tx-2',
        type: 'repay',
        amountInPiastres: 400000,
        runningBalanceInPiastres: 600000,
        date: '2026-01-14T10:00:00.000Z',
        note: 'First installment',
      },
    ],
  },
  {
    _id: '2',
    person: { _id: '2', name: 'Karim Hassan', note: 'Family friend' },
    status: 'Repaid',
    notes: 'Short-term bridge loan',
    totalBorrowedInPiastres: 300000,
    totalRepaidInPiastres: 300000,
    balanceInPiastres: 0,
    createdAt: '2026-01-05T10:00:00.000Z',
    transactions: [
      {
        _id: 'tx-3',
        type: 'borrow',
        amountInPiastres: 300000,
        runningBalanceInPiastres: 300000,
        date: '2026-01-05T10:00:00.000Z',
        note: 'Bridge advance',
      },
      {
        _id: 'tx-4',
        type: 'repay',
        amountInPiastres: 300000,
        runningBalanceInPiastres: 0,
        date: '2026-01-12T10:00:00.000Z',
        note: 'Settled in full',
      },
    ],
  },
  {
    _id: '3',
    person: { _id: '1', name: 'Ahmed Samir', note: 'Work colleague' },
    status: 'WrittenOff',
    notes: 'Legacy balance written off',
    totalBorrowedInPiastres: 150000,
    totalRepaidInPiastres: 0,
    balanceInPiastres: 150000,
    createdAt: '2025-12-15T10:00:00.000Z',
    transactions: [
      {
        _id: 'tx-5',
        type: 'borrow',
        amountInPiastres: 150000,
        runningBalanceInPiastres: 150000,
        date: '2025-12-15T10:00:00.000Z',
        note: 'Old advance',
      },
    ],
  },
];

const MOCK_SUMMARY = {
  totalBorrowed: 1450000,
  totalRepaid: 700000,
  totalOutstanding: 600000,
  activeLoansCount: 1,
  personsCount: 2,
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

async function setupLendingMocks(page) {
  await page.route(/\/api\/lending(?:\/|\?|$)/, async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const corsHeaders = getCorsHeaders(request);

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
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

    if (method === 'GET' && /\/api\/lending\/summary\/?$/.test(pathname)) {
      return fulfillJson({ success: true, data: MOCK_SUMMARY });
    }

    if (/\/api\/lending\/persons\/?$/.test(pathname)) {
      if (method === 'GET') return fulfillJson({ success: true, data: MOCK_PERSONS });
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        return fulfillJson({
          success: true,
          data: { _id: 'new-person', totalOwedInPiastres: 0, loanCount: 0, activeLoanCount: 0, ...body },
        }, 201);
      }
    }

    const personMatch = pathname.match(/\/api\/lending\/persons\/([^/]+)\/?$/);
    if (personMatch) {
      const person = MOCK_PERSONS.find((p) => p._id === personMatch[1]) || MOCK_PERSONS[0];
      const personLoans = MOCK_LOANS.filter((l) => l.person._id === person._id);
      if (method === 'GET') {
        return fulfillJson({
          success: true,
          data: {
            person,
            loans: personLoans,
            aggregate: {
              totalOutstandingInPiastres: person.totalOwedInPiastres,
              totalWrittenOffInPiastres: person._id === '1' ? 150000 : 0,
              writtenOffCount: person._id === '1' ? 1 : 0,
              activeLoanCount: person.activeLoanCount,
            },
          },
        });
      }
      if (method === 'PUT') {
        const body = request.postDataJSON() || {};
        return fulfillJson({ success: true, data: { ...person, ...body } });
      }
      if (method === 'DELETE') {
        return fulfillJson({ success: true });
      }
    }

    if (/\/api\/lending\/loans\/?$/.test(pathname)) {
      if (method === 'GET') {
        const status = url.searchParams.get('status');
        const filtered = status && status !== 'All'
          ? MOCK_LOANS.filter((l) => l.status === status)
          : MOCK_LOANS;
        return fulfillJson({ success: true, data: filtered });
      }
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        return fulfillJson({ success: true, data: { _id: 'new-loan', ...body } }, 201);
      }
    }

    const txDeleteMatch = pathname.match(/\/api\/lending\/loans\/([^/]+)\/transactions\/([^/]+)\/?$/);
    if (method === 'DELETE' && txDeleteMatch) {
      return fulfillJson({ success: true, data: MOCK_LOANS[0] });
    }

    const txAddMatch = pathname.match(/\/api\/lending\/loans\/([^/]+)\/transactions\/?$/);
    if (method === 'POST' && txAddMatch) {
      return fulfillJson({ success: true, data: MOCK_LOANS[0] }, 201);
    }

    const loanMatch = pathname.match(/\/api\/lending\/loans\/([^/]+)\/?$/);
    if (loanMatch) {
      const loan = MOCK_LOANS.find((l) => l._id === loanMatch[1]) || MOCK_LOANS[0];
      if (method === 'GET') return fulfillJson({ success: true, data: loan });
      if (method === 'PUT') {
        const body = request.postDataJSON() || {};
        return fulfillJson({ success: true, data: { ...loan, ...body } });
      }
      if (method === 'DELETE') return fulfillJson({ success: true });
    }

    return route.continue();
  });
}

module.exports = {
  MOCK_PERSONS,
  MOCK_LOANS,
  MOCK_SUMMARY,
  setupLendingMocks,
};
