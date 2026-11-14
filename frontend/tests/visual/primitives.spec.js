/**
 * frontend/tests/visual/primitives.spec.js
 *
 * Browser Dual-Mode & Computed Style Verification for Phase 2E:
 * - 7 React UI Primitives computed styles
 * - Dual-mode Cluster Sub-Navigators (Legacy un-scoped vs Themed .fs-page)
 * - Live Keyboard Focus Navigation Trace for Tabs (Horizontal & Vertical)
 * - Governed by docs/ui-plans/phase_2e_implementation_plan.md §4.2 and UI-UX-PLAN §6.6
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FIXTURE_URL = 'http://localhost:3001/frontend/tests/visual/fixtures/shared/primitives.html';
const OUTPUT_DIR = path.join(__dirname, 'output/phase-2e');

test.describe('Phase 2E: Primitives & Dual-Mode Sub-Nav Verification', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  test('Primitives: computed styles verify design system tokens and anti-slop rules', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Button Primitive
    const primaryBg = await page.$eval('#btn-primary', el => window.getComputedStyle(el).backgroundColor);
    const primaryColor = await page.$eval('#btn-primary', el => window.getComputedStyle(el).color);
    const secondaryBg = await page.$eval('#btn-secondary', el => window.getComputedStyle(el).backgroundColor);
    const dangerBg = await page.$eval('#btn-danger', el => window.getComputedStyle(el).backgroundColor);

    expect(primaryBg).toBe('rgb(20, 184, 166)');     // #14b8a6 (--fs-accent)
    expect(primaryColor).toBe('rgb(13, 14, 16)');    // #0d0e10 (--fs-ink) — NEVER white text on accent
    expect(secondaryBg).toBe('rgb(34, 37, 42)');     // #22252a (--fs-surface-raised)
    expect(dangerBg).toBe('rgb(217, 112, 118)');     // #d97076 (--fs-danger)

    // 2. Card Primitive
    const cardDefaultBg = await page.$eval('#card-default', el => window.getComputedStyle(el).backgroundColor);
    const cardDefaultRadius = await page.$eval('#card-default', el => window.getComputedStyle(el).borderRadius);
    const cardRaisedBg = await page.$eval('#card-raised', el => window.getComputedStyle(el).backgroundColor);

    expect(cardDefaultBg).toBe('rgb(26, 28, 32)');   // #1a1c20 (--fs-surface)
    expect(cardDefaultRadius).toBe('8px');           // 8px ceiling (--fs-radius-lg)
    expect(cardRaisedBg).toBe('rgb(34, 37, 42)');    // #22252a (--fs-surface-raised)

    // 3. Badge Primitive
    const badgeNeutralBg = await page.$eval('#badge-neutral', el => window.getComputedStyle(el).backgroundColor);
    const badgePosColor = await page.$eval('#badge-positive', el => window.getComputedStyle(el).color);
    const badgeNegColor = await page.$eval('#badge-negative', el => window.getComputedStyle(el).color);
    const badgeWarnColor = await page.$eval('#badge-warning', el => window.getComputedStyle(el).color);

    expect(badgeNeutralBg).toBe('rgb(34, 37, 42)');  // #22252a (--fs-surface-raised)
    expect(badgePosColor).toBe('rgb(79, 168, 124)');  // #4fa87c (--fs-positive)
    expect(badgeNegColor).toBe('rgb(217, 112, 118)'); // #d97076 (--fs-negative)
    expect(badgeWarnColor).toBe('rgb(207, 162, 79)'); // #cfa24f (--fs-warning)

    // 4. Delta Primitive
    const deltaPosColor = await page.$eval('#delta-positive', el => window.getComputedStyle(el).color);
    const deltaNegColor = await page.$eval('#delta-negative', el => window.getComputedStyle(el).color);
    expect(deltaPosColor).toBe('rgb(79, 168, 124)');  // #4fa87c (--fs-positive)
    expect(deltaNegColor).toBe('rgb(217, 112, 118)'); // #d97076 (--fs-negative)

    // 5. PageHeader Primitive
    const pageTitleColor = await page.$eval('#header-title', el => window.getComputedStyle(el).color);
    const eyebrowColor = await page.$eval('#header-eyebrow', el => window.getComputedStyle(el).color);
    expect(pageTitleColor).toBe('rgb(242, 243, 245)'); // #f2f3f5 (--fs-text)
    expect(eyebrowColor).toBe('rgb(162, 168, 176)');   // #a2a8b0 (--fs-text-3) — static text, NEVER accent per §1

    // 6. EmptyState Primitive
    const emptyTextAlign = await page.$eval('#empty-sample', el => window.getComputedStyle(el).textAlign);
    const emptyTitleColor = await page.$eval('#empty-title', el => window.getComputedStyle(el).color);
    const emptyDescColor = await page.$eval('#empty-desc', el => window.getComputedStyle(el).color);
    expect(emptyTextAlign).toBe('center');
    expect(emptyTitleColor).toBe('rgb(242, 243, 245)'); // #f2f3f5 (--fs-text)
    expect(emptyDescColor).toBe('rgb(162, 168, 176)');   // #a2a8b0 (--fs-text-3)

    // 7. Tabs Active Indicator Styles
    const htabActiveBorderBottom = await page.$eval('#htab-1', el => window.getComputedStyle(el).borderBottomColor);
    const vtabActiveBorderRight = await page.$eval('#vtab-1', el => window.getComputedStyle(el).borderRightColor);
    expect(htabActiveBorderBottom).toBe('rgb(20, 184, 166)'); // #14b8a6
    expect(vtabActiveBorderRight).toBe('rgb(20, 184, 166)');  // #14b8a6

    // 8. Loading Primitive (Themed Context)
    const themedRouteText = await page.$eval('#themed-loading-route .fs-loading-text', el => window.getComputedStyle(el).color);
    const themedSpinnerBorder = await page.$eval('#themed-loading-route .fs-loading-spinner', el => window.getComputedStyle(el).borderTopColor);
    const themedSkeletonCardBg = await page.$eval('#themed-loading-card .fs-skeleton--card', el => window.getComputedStyle(el).backgroundColor);
    const themedSkeletonCardRadius = await page.$eval('#themed-loading-card .fs-skeleton--card', el => window.getComputedStyle(el).borderRadius);

    expect(themedRouteText).toBe('rgb(162, 168, 176)');       // #a2a8b0 (--fs-text-3)
    expect(themedSpinnerBorder).toBe('rgb(242, 243, 245)');   // #f2f3f5 (--fs-text)
    expect(themedSkeletonCardBg).toBe('rgb(34, 37, 42)');     // #22252a (--fs-surface-raised)
    expect(themedSkeletonCardRadius).toBe('8px');             // 8px ceiling (--fs-radius-lg)

    // 9. Loading Primitive (Unthemed Legacy Fallbacks when data-fs-theme is absent)
    await page.evaluate(() => document.documentElement.removeAttribute('data-fs-theme'));

    const legacyRouteText = await page.$eval('#legacy-loading-route .fs-loading-text', el => window.getComputedStyle(el).color);
    const legacySpinnerBorder = await page.$eval('#legacy-loading-route .fs-loading-spinner', el => window.getComputedStyle(el).borderTopColor);
    const legacySkeletonRowBg = await page.$eval('#legacy-loading-table .fs-skeleton--row', el => window.getComputedStyle(el).backgroundColor);
    const legacySkeletonRowRadius = await page.$eval('#legacy-loading-table .fs-skeleton--row', el => window.getComputedStyle(el).borderRadius);

    expect(legacyRouteText).toBe('rgb(108, 117, 125)');       // #6c757d (legacy fallback)
    expect(legacySpinnerBorder).toBe('rgb(44, 62, 80)');      // #2c3e50 (legacy fallback)
    expect(legacySkeletonRowBg).toBe('rgb(233, 236, 239)');   // #e9ecef (legacy fallback)
    expect(legacySkeletonRowRadius).toBe('4px');              // 4px (--fs-radius-sm fallback)

    // Restore data-fs-theme="dark" for subsequent checks and screenshots
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));

    // Capture overall screenshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'primitives-all-1440.png'), fullPage: true });
  });

  test('SubNav Dual-Mode: computed styles verify legacy vs .fs-page theme override', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy Expenditure Sub-Nav (outside .fs-page)
    const legacyExpTrackBg = await page.$eval('.legacy-expenditure-subnav .expenditure-subnav-track', el => window.getComputedStyle(el).backgroundColor);
    const legacyExpActiveColor = await page.$eval('.legacy-expenditure-subnav .expenditure-subnav-link.active', el => window.getComputedStyle(el).color);
    const legacyExpActiveBg = await page.$eval('.legacy-expenditure-subnav .expenditure-subnav-link.active', el => window.getComputedStyle(el).backgroundColor);

    expect(legacyExpTrackBg).toBe('rgb(241, 245, 249)');     // #f1f5f9
    expect(legacyExpActiveColor).toBe('rgb(37, 99, 235)');    // #2563eb
    expect(legacyExpActiveBg).toBe('rgb(255, 255, 255)');     // #ffffff

    // 2. Themed Expenditure Sub-Nav (inside .fs-page)
    const themedExpTrackBg = await page.$eval('.themed-expenditure-subnav .expenditure-subnav-track', el => window.getComputedStyle(el).backgroundColor);
    const themedExpActiveColor = await page.$eval('.themed-expenditure-subnav .expenditure-subnav-link.active', el => window.getComputedStyle(el).color);
    const themedExpActiveBg = await page.$eval('.themed-expenditure-subnav .expenditure-subnav-link.active', el => window.getComputedStyle(el).backgroundColor);

    expect(themedExpTrackBg).toBe('rgb(12, 13, 15)');         // #0c0d0f (--fs-surface-sunken)
    expect(themedExpActiveColor).toBe('rgb(13, 14, 16)');     // #0d0e10 (--fs-ink)
    expect(themedExpActiveBg).toBe('rgb(20, 184, 166)');      // #14b8a6 (--fs-accent)

    // 3. Legacy Credit Card Sub-Nav (outside .fs-page)
    const legacyCcTrackBg = await page.$eval('.legacy-cc-subnav .cc-subnav-track', el => window.getComputedStyle(el).backgroundColor);
    const legacyCcActiveColor = await page.$eval('.legacy-cc-subnav .cc-subnav-link.active', el => window.getComputedStyle(el).color);
    const legacyCcActiveBg = await page.$eval('.legacy-cc-subnav .cc-subnav-link.active', el => window.getComputedStyle(el).backgroundColor);

    expect(legacyCcTrackBg).toBe('rgb(241, 245, 249)');       // #f1f5f9
    expect(legacyCcActiveColor).toBe('rgb(37, 99, 235)');     // #2563eb
    expect(legacyCcActiveBg).toBe('rgb(255, 255, 255)');      // #ffffff

    // 4. Themed Credit Card Sub-Nav (inside .fs-page)
    const themedCcTrackBg = await page.$eval('.themed-cc-subnav .cc-subnav-track', el => window.getComputedStyle(el).backgroundColor);
    const themedCcActiveColor = await page.$eval('.themed-cc-subnav .cc-subnav-link.active', el => window.getComputedStyle(el).color);
    const themedCcActiveBg = await page.$eval('.themed-cc-subnav .cc-subnav-link.active', el => window.getComputedStyle(el).backgroundColor);

    expect(themedCcTrackBg).toBe('rgb(12, 13, 15)');          // #0c0d0f (--fs-surface-sunken)
    expect(themedCcActiveColor).toBe('rgb(13, 14, 16)');      // #0d0e10 (--fs-ink)
    expect(themedCcActiveBg).toBe('rgb(20, 184, 166)');       // #14b8a6 (--fs-accent)

    // Capture SubNav screenshots
    await page.locator('#legacy-context').screenshot({ path: path.join(OUTPUT_DIR, 'subnav-legacy-1440.png') });
    await page.locator('.themed-expenditure-subnav').screenshot({ path: path.join(OUTPUT_DIR, 'subnav-themed-1440.png') });
  });

  test('Tabs Interactive Keyboard Navigation: roving focus trace in both orientations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });

    const getActiveId = () => page.evaluate(() => document.activeElement ? document.activeElement.id : null);

    // =========================================================================
    // Trace 1: Horizontal Tabs Roving Focus
    // =========================================================================
    await page.focus('#htab-1');
    expect(await getActiveId()).toBe('htab-1');

    // ArrowRight -> htab-2
    await page.keyboard.press('ArrowRight');
    expect(await getActiveId()).toBe('htab-2');

    // ArrowRight -> skips disabled htab-3 -> htab-4
    await page.keyboard.press('ArrowRight');
    expect(await getActiveId()).toBe('htab-4');

    // ArrowRight -> wraps back to htab-1
    await page.keyboard.press('ArrowRight');
    expect(await getActiveId()).toBe('htab-1');

    // ArrowLeft -> wraps backwards to htab-4 (skipping disabled htab-3)
    await page.keyboard.press('ArrowLeft');
    expect(await getActiveId()).toBe('htab-4');

    // ArrowDown & ArrowUp are inert in horizontal mode
    await page.keyboard.press('ArrowDown');
    expect(await getActiveId()).toBe('htab-4');
    await page.keyboard.press('ArrowUp');
    expect(await getActiveId()).toBe('htab-4');

    // Home -> jumps to first enabled tab (htab-1)
    await page.keyboard.press('Home');
    expect(await getActiveId()).toBe('htab-1');

    // End -> jumps to last enabled tab (htab-4)
    await page.keyboard.press('End');
    expect(await getActiveId()).toBe('htab-4');

    // =========================================================================
    // Trace 2: Vertical Tabs Roving Focus
    // =========================================================================
    await page.focus('#vtab-1');
    expect(await getActiveId()).toBe('vtab-1');

    // ArrowDown -> vtab-2
    await page.keyboard.press('ArrowDown');
    expect(await getActiveId()).toBe('vtab-2');

    // ArrowDown -> skips disabled vtab-3 -> vtab-4
    await page.keyboard.press('ArrowDown');
    expect(await getActiveId()).toBe('vtab-4');

    // ArrowDown -> wraps back to vtab-1
    await page.keyboard.press('ArrowDown');
    expect(await getActiveId()).toBe('vtab-1');

    // ArrowUp -> wraps backwards to vtab-4 (skipping disabled vtab-3)
    await page.keyboard.press('ArrowUp');
    expect(await getActiveId()).toBe('vtab-4');

    // ArrowRight & ArrowLeft are inert in vertical mode
    await page.keyboard.press('ArrowRight');
    expect(await getActiveId()).toBe('vtab-4');
    await page.keyboard.press('ArrowLeft');
    expect(await getActiveId()).toBe('vtab-4');

    // Home -> jumps to first enabled tab (vtab-1)
    await page.keyboard.press('Home');
    expect(await getActiveId()).toBe('vtab-1');

    // End -> jumps to last enabled tab (vtab-4)
    await page.keyboard.press('End');
    expect(await getActiveId()).toBe('vtab-4');
  });

  test('LandingPage: unthemed login spinner renders visible fallback on slow response', async ({ browser }) => {
    // Unauthenticated context without storageState
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    // Intercept auth login to simulate slow response
    await page.route('**/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 2500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-token', user: { id: 1, name: 'Test User' } }),
      });
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Ensure page has no theme attribute (unthemed landing page)
    const hasTheme = await page.evaluate(() => document.documentElement.hasAttribute('data-fs-theme'));
    expect(hasTheme).toBe(false);

    // Fill credentials
    await page.fill('input[placeholder="Username"]', 'demouser');
    await page.fill('input[placeholder="Password"]', 'password123');

    // Click Sign In
    await page.click('button[type="submit"]');

    // Spinner should appear in button
    const spinner = page.locator('button[type="submit"] .fs-loading-spinner');
    await expect(spinner).toBeVisible();

    // Assert dimensions and computed colors
    const bbox = await spinner.boundingBox();
    expect(bbox).not.toBeNull();
    expect(bbox.width).toBeGreaterThan(0);
    expect(bbox.height).toBeGreaterThan(0);

    const borderTopColor = await spinner.evaluate(el => window.getComputedStyle(el).borderTopColor);
    const borderLeftColor = await spinner.evaluate(el => window.getComputedStyle(el).borderLeftColor);

    expect(borderTopColor).toBe('rgb(44, 62, 80)');      // #2c3e50 (unthemed text fallback)
    expect(borderLeftColor).toBe('rgb(221, 221, 221)');  // #ddd (unthemed border fallback)

    // Capture screenshot of unthemed login button with active fallback spinner
    const phase2fOutputDir = path.join(__dirname, 'output/phase-2f');
    if (!fs.existsSync(phase2fOutputDir)) {
      fs.mkdirSync(phase2fOutputDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(phase2fOutputDir, 'landing-unthemed-spinner.png') });

    await context.close();
  });
});
