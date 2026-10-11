// backend/tests/unit/utilizationMonitor.test.js
const {
  calculateUtilization,
  checkUtilizationAlert,
  checkPortfolioUtilization,
} = require('../../utils/utilizationMonitor');

describe('Utilization Monitor (Unit Tests)', () => {
  const card = {
    _id: 'card-1',
    name: 'National Bank Titanium',
    limit: 10000,
    utilizationAlertThreshold: 30,
  };

  it('should accurately calculate utilization percentage', () => {
    expect(calculateUtilization(card, 2500)).toBe(25);
    expect(calculateUtilization(card, 5000)).toBe(50);
    expect(calculateUtilization(card, 0)).toBe(0);
    expect(calculateUtilization({ limit: 0 }, 100)).toBe(0);
  });

  it('should trigger alert when utilization exceeds threshold', () => {
    const under = checkUtilizationAlert(card, 2000); // 20%
    expect(under.isAlert).toBe(false);
    expect(under.severity).toBe('safe');

    const over = checkUtilizationAlert(card, 3500); // 35%
    expect(over.isAlert).toBe(true);
    expect(over.severity).toBe('warning');

    const high = checkUtilizationAlert(card, 6000); // 60%
    expect(high.isAlert).toBe(true);
    expect(high.severity).toBe('danger');
  });

  it('should calculate portfolio-wide utilization accurately', () => {
    const portfolio = [
      { card: { _id: 'c1', name: 'Card 1', limit: 10000, utilizationAlertThreshold: 30 }, balance: 2000 },
      { card: { _id: 'c2', name: 'Card 2', limit: 10000, utilizationAlertThreshold: 30 }, balance: 4000 },
    ];

    const result = checkPortfolioUtilization(portfolio);
    expect(result.totalLimit).toBe(20000);
    expect(result.totalBalance).toBe(6000);
    expect(result.overallUtilization).toBe(30);
    expect(result.hasAlerts).toBe(true); // Card 2 is at 40% > 30%
  });
});
