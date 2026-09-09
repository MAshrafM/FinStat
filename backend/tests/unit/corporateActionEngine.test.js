// backend/tests/unit/corporateActionEngine.test.js
const { applyCorporateActions } = require('../../utils/corporateActionEngine');

describe('Corporate Action Engine (Retroactive, Non-Mutating Stock Splits & Bonus Issues)', () => {
  const originalTrades = [
    // Trade 1: Before split
    {
      _id: 'trade_1',
      date: new Date('2024-01-01'),
      stockCode: 'COMI',
      broker: 'Thndr',
      type: 'Buy',
      shares: 100,
      price: 80,
      totalValue: 8000,
      iteration: 1,
    },
    // Trade 2: After split
    {
      _id: 'trade_2',
      date: new Date('2024-03-01'),
      stockCode: 'COMI',
      broker: 'Thndr',
      type: 'Buy',
      shares: 50,
      price: 40,
      totalValue: 2000,
      iteration: 1,
    },
    // Trade 3: Different stock
    {
      _id: 'trade_3',
      date: new Date('2024-01-01'),
      stockCode: 'FWRY',
      broker: 'Thndr',
      type: 'Buy',
      shares: 200,
      price: 10,
      totalValue: 2000,
      iteration: 1,
    },
  ];

  it('should apply a 2:1 stock split to pre-date trades and leave post-date trades intact', () => {
    const corporateActions = [
      {
        stockCode: 'COMI',
        broker: 'Thndr',
        type: 'split',
        ratio: 2,
        effectiveDate: new Date('2024-02-01'),
      },
    ];

    const adjustedTrades = applyCorporateActions(originalTrades, corporateActions);

    const comiPreTrade = adjustedTrades.find((t) => t._id === 'trade_1');
    expect(comiPreTrade.shares).toBe(200); // 100 * 2
    expect(comiPreTrade.price).toBe(40);  // 80 / 2
    expect(comiPreTrade.totalValue).toBe(8000); // Unchanged cash value

    const comiPostTrade = adjustedTrades.find((t) => t._id === 'trade_2');
    expect(comiPostTrade.shares).toBe(50); // Unchanged
    expect(comiPostTrade.price).toBe(40);  // Unchanged

    const fwryTrade = adjustedTrades.find((t) => t._id === 'trade_3');
    expect(fwryTrade.shares).toBe(200); // Unchanged
  });

  it('should apply a 10% bonus share issue to pre-date trades', () => {
    const corporateActions = [
      {
        stockCode: 'COMI',
        broker: 'Thndr',
        type: 'bonus',
        ratio: 0.10, // 10% bonus
        effectiveDate: new Date('2024-02-01'),
      },
    ];

    const adjustedTrades = applyCorporateActions(originalTrades, corporateActions);

    const comiPreTrade = adjustedTrades.find((t) => t._id === 'trade_1');
    expect(comiPreTrade.shares).toBe(110); // 100 * 1.10
    expect(comiPreTrade.price).toBeCloseTo(80 / 1.10, 2); // ~72.73
    expect(comiPreTrade.totalValue).toBe(8000);
  });

  it('must never mutate the original input trade objects', () => {
    const corporateActions = [
      {
        stockCode: 'COMI',
        broker: 'Thndr',
        type: 'split',
        ratio: 2,
        effectiveDate: new Date('2024-02-01'),
      },
    ];

    const deepFrozenTrades = JSON.parse(JSON.stringify(originalTrades));
    applyCorporateActions(originalTrades, corporateActions);

    expect(originalTrades[0].shares).toBe(deepFrozenTrades[0].shares);
    expect(originalTrades[0].price).toBe(deepFrozenTrades[0].price);
  });
});
