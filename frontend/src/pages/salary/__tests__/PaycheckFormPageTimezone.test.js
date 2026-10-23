// frontend/src/pages/salary/__tests__/PaycheckFormPageTimezone.test.js
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}), { virtual: true });

import { normalizePayDateInput } from '../PaycheckFormPage';

describe('Step 4B.2: Frontend normalizePayDateInput', () => {
  it('formats YYYY-MM-DD string to midday UTC', () => {
    const result = normalizePayDateInput('2026-05-01');
    expect(result).toBe('2026-05-01T12:00:00.000Z');
  });

  it('formats Cairo late-night ISO timestamp (23:30:00+03:00) to midday UTC on the target calendar day', () => {
    const result = normalizePayDateInput('2026-05-01T23:30:00+03:00');
    expect(result).toBe('2026-05-01T12:00:00.000Z');
  });

  it('formats Date object using local date components to avoid timezone rollback', () => {
    const d = new Date(2026, 4, 1, 23, 30); // May 1, 2026 in local time
    const result = normalizePayDateInput(d);
    expect(result).toBe('2026-05-01T12:00:00.000Z');
  });

  it('falls back to today at midday UTC when null or empty', () => {
    const today = new Date();
    const expectedPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const result = normalizePayDateInput(null);
    expect(result).toBe(`${expectedPrefix}T12:00:00.000Z`);
  });
});
