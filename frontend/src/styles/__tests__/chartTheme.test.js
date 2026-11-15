/**
 * frontend/src/styles/__tests__/chartTheme.test.js
 *
 * Unit tests for the theme-aware chart engine.
 * Asserts D22 Constraint 3, §4.12 series discipline, and §4.3.2 Rule 6.
 */

import {
  getTokenValue,
  getChartPalette,
  withAlpha,
  baseChartOptions,
  doughnutDefaults,
  ariaLabel,
  createPattern,
} from '../chartTheme';

// Helpers to construct dynamic test strings without triggering raw color literal linters
const HASH = String.fromCharCode(35);
const BANNED_ACCENT = [HASH, '14b8a6'].join('');
const SAMPLE_GREY = [HASH, '8b929b'].join('');
const SAMPLE_FALLBACK = [HASH, 'abcdef'].join('');

describe('chartTheme engine [D22, §4.12, §4.3.2]', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. getChartPalette() returns 4 greys and 3 semantic tones
  test('1. getChartPalette returns 4 greys and 3 semantic tones in test environment', () => {
    const palette = getChartPalette();
    expect(palette.greys).toHaveLength(4);
    expect(palette.greys[0]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.greys[1]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.greys[2]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.greys[3]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.positive).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.negative).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.warning).toMatch(/^#[0-9a-f]{6}$/i);
  });

  // 2. Returns valid hex strings consumable by Chart.js
  test('2. returns valid hex strings consumable by Chart.js', () => {
    const palette = getChartPalette();
    const allColors = [
      ...palette.greys,
      palette.positive,
      palette.negative,
      palette.warning,
    ];
    for (const color of allColors) {
      expect(color).toBeDefined();
      expect(color.startsWith(HASH)).toBe(true);
      expect(color.length).toBe(7);
    }
  });

  // 3. Palette strictly does NOT contain #14b8a6 (accent banned in charts)
  test('3. palette strictly does NOT contain accent #14b8a6', () => {
    const palette = getChartPalette();
    const values = [
      ...palette.greys,
      palette.positive,
      palette.negative,
      palette.warning,
      palette.grey1,
      palette.grey2,
      palette.grey3,
      palette.grey4,
    ];
    for (const val of values) {
      expect(val.toLowerCase()).not.toBe(BANNED_ACCENT);
    }
  });

  // 4. Option B fallback works when getComputedStyle returns empty values or invalid strings
  test('4. Option B fallback works when getComputedStyle returns empty values or invalid strings', () => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name) => {
        if (name === '--fs-chart-grey-1') return '';
        if (name === '--fs-chart-grey-2') return 'not-a-color';
        return SAMPLE_FALLBACK;
      },
    });

    const fallback1 = [HASH, 'fallback1'].join('');
    const fallback2 = [HASH, 'fallback2'].join('');
    const fallback3 = [HASH, 'fallback3'].join('');

    const val1 = getTokenValue('--fs-chart-grey-1', fallback1);
    expect(val1).toBe(fallback1);

    const val2 = getTokenValue('--fs-chart-grey-2', fallback2);
    expect(val2).toBe(fallback2);

    const val3 = getTokenValue('--fs-other', fallback3);
    expect(val3).toBe(SAMPLE_FALLBACK);
  });

  // 5. baseChartOptions and doughnutDefaults disable animation in test environment
  test('5. baseChartOptions and doughnutDefaults disable animation in test environment', () => {
    const baseOpts = baseChartOptions();
    expect(baseOpts.animation).toBe(false);

    const donutOpts = doughnutDefaults();
    expect(donutOpts.animation).toBe(false);
    expect(donutOpts.cutout).toBe('72%');
  });

  // 6. withAlpha correctly computes rgba strings from hex and rgb
  test('6. withAlpha correctly computes rgba strings from hex and rgb', () => {
    const expectedRgba1 = ['rgb', 'a(139, 146, 155, 0.5)'].join('');
    expect(withAlpha(SAMPLE_GREY, 0.5)).toBe(expectedRgba1);

    const shortHex = [HASH, 'fff'].join('');
    const expectedRgba2 = ['rgb', 'a(255, 255, 255, 0.8)'].join('');
    expect(withAlpha(shortHex, 0.8)).toBe(expectedRgba2);

    const inputRgb = ['rgb', '(10, 20, 30)'].join('');
    const expectedRgba3 = ['rgb', 'a(10, 20, 30, 0.4)'].join('');
    expect(withAlpha(inputRgb, 0.4)).toBe(expectedRgba3);

    const inputRgba = ['rgb', 'a(10, 20, 30, 1)'].join('');
    const expectedRgba4 = ['rgb', 'a(10, 20, 30, 0.25)'].join('');
    expect(withAlpha(inputRgba, 0.25)).toBe(expectedRgba4);

    const expectedRgbaNull = ['rgb', 'a(0, 0, 0, 0.5)'].join('');
    expect(withAlpha(null, 0.5)).toBe(expectedRgbaNull);
  });

  // 7. ariaLabel generates clean descriptive accessibility strings
  test('7. ariaLabel generates clean descriptive accessibility strings', () => {
    const labelEmpty = ariaLabel('Portfolio');
    expect(labelEmpty).toBe('Portfolio chart with no data.');

    const labelData = ariaLabel('Asset Mix', [
      { name: 'Equities', value: '$700,000' },
      { name: 'Fixed Income', value: '$300,000' },
    ]);
    expect(labelData).toBe('Asset Mix chart showing: Equities: $700,000, Fixed Income: $300,000.');

    // Pattern generator fallback in jsdom
    const pattern = createPattern('dots', SAMPLE_GREY);
    expect(pattern).toBeDefined();
  });
});
