// frontend/src/constants/__tests__/categories.test.js
import { EXPENDITURE_CATEGORIES } from '../categories';

describe('EXPENDITURE_CATEGORIES (Phase 2E Category Labels as Data)', () => {
  it('preserves hex values as pure data with zero derived tint fields (§4.3 Rule 4)', () => {
    expect(EXPENDITURE_CATEGORIES.length).toBeGreaterThan(0);

    EXPENDITURE_CATEGORIES.forEach((category) => {
      // 1. Must have name and color
      expect(typeof category.name).toBe('string');
      expect(category.name.trim().length).toBeGreaterThan(0);
      expect(typeof category.color).toBe('string');

      // 2. Must NOT derive any 'tint' or background tint field
      expect(category.tint).toBeUndefined();
      expect(category.bgTint).toBeUndefined();

      // 3. Allowed keys are strictly name, color, keywords
      const keys = Object.keys(category);
      expect(keys.sort()).toEqual(['color', 'keywords', 'name'].sort());
    });
  });

  it('contains valid hex color codes and never uses the interactive accent hue #14b8a6', () => {
    const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

    EXPENDITURE_CATEGORIES.forEach((category) => {
      expect(category.color).toMatch(HEX_REGEX);
      // ESLint & Design Guardrail: Accent hue #14b8a6 is banned from category series
      expect(category.color.toLowerCase()).not.toBe('#14b8a6');
    });
  });

  it('defines the standard 12 core expenditure categories', () => {
    const names = EXPENDITURE_CATEGORIES.map((c) => c.name);
    expect(names).toContain('Food & Dining');
    expect(names).toContain('Groceries');
    expect(names).toContain('Utilities');
    expect(names).toContain('Transportation');
    expect(names).toContain('Rent & Housing');
    expect(names).toContain('Family & Allowance');
    expect(names).toContain('Investments & Bonds');
    expect(names).toContain('Salary & Income');
    expect(names).toContain('Credit Card & Loans');
    expect(names).toContain('Healthcare');
    expect(names).toContain('Shopping & Leisure');
    expect(names).toContain('Other');
  });
});
