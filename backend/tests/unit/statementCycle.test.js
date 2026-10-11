// backend/tests/unit/statementCycle.test.js
const {
  getStatementPeriod,
  getStatementCycles,
  assignTransactionToCycle,
} = require('../../utils/statementCycle');

describe('Statement Cycle Utility (Unit Tests)', () => {
  const card = {
    _id: 'card123',
    name: 'CIB Visa Platinum',
    statementCloseDay: 25,
    paymentDueDay: 15,
  };

  it('should calculate current cycle when date is before statement close day', () => {
    const asOf = new Date('2026-10-10T12:00:00Z'); // before Oct 25
    const period = getStatementPeriod(card, asOf);

    expect(period.closeDate.getDate()).toBe(25);
    expect(period.closeDate.getMonth()).toBe(9); // Oct (0-indexed 9)
    expect(period.dueDate.getDate()).toBe(15);
    expect(period.dueDate.getMonth()).toBe(10); // Nov
    expect(period.daysUntilClose).toBe(15);
    expect(period.isOverdue).toBe(false);
  });

  it('should calculate next cycle when date is after statement close day', () => {
    const asOf = new Date('2026-10-26T12:00:00Z'); // after Oct 25
    const period = getStatementPeriod(card, asOf);

    expect(period.closeDate.getDate()).toBe(25);
    expect(period.closeDate.getMonth()).toBe(10); // Nov
    expect(period.dueDate.getDate()).toBe(15);
    expect(period.dueDate.getMonth()).toBe(11); // Dec
  });

  it('should generate requested number of past statement cycles without duplicates', () => {
    const cycles = getStatementCycles(card, { months: 4, asOfDate: new Date('2026-10-15T00:00:00Z') });
    expect(cycles.length).toBe(4);
    expect(cycles[0].closeDate.getTime()).toBeGreaterThan(cycles[1].closeDate.getTime());
  });

  it('should assign a transaction to the correct statement cycle', () => {
    const txDate = new Date('2026-09-28T00:00:00Z'); // falls in Oct 25 cycle
    const cycle = assignTransactionToCycle(card, txDate);
    expect(cycle.closeDate.getMonth()).toBe(9); // Oct
  });
});
