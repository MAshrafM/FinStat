/**
 * frontend/tests/visual/fixtures/clock.js
 *
 * Deterministic timestamp helper for Playwright visual tests.
 * Freezes system clock at 2026-01-15T09:00:00.000Z to eliminate date/time drift.
 */

const FIXED_DATE = '2026-01-15T09:00:00.000Z';

async function setFixedClock(page) {
  if (page.clock) {
    await page.clock.setFixedTime(new Date(FIXED_DATE));
  } else {
    await page.addInitScript((fixedIso) => {
      const fixedTime = new Date(fixedIso).getTime();
      const OrigDate = Date;
      class MockDate extends OrigDate {
        constructor(...args) {
          if (args.length === 0) {
            super(fixedTime);
          } else {
            super(...args);
          }
        }
        static now() {
          return fixedTime;
        }
      }
      window.Date = MockDate;
    }, FIXED_DATE);
  }
}

module.exports = {
  FIXED_DATE,
  setFixedClock,
};

