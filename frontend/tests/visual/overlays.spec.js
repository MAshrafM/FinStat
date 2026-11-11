const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2b';
fs.mkdirSync(OUT_DIR, { recursive: true });

const TOAST_HTML = `
<div class="toast-container" id="test-toast-container" aria-live="polite" aria-label="Notifications" style="position: fixed; top: 24px; right: 24px; z-index: 999999; display: flex; flex-direction: column; gap: 12px; max-width: 420px; width: 100%;">
  <div class="toast-item toast-success" role="alert">
    <div class="toast-content" style="display: flex; align-items: center; gap: 10px;">
      <svg class="toast-icon toast-icon-success" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
      <span class="toast-message">Holding successfully updated in portfolio</span>
    </div>
    <button class="toast-close-btn" aria-label="Close notification"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
  </div>
  <div class="toast-item toast-error" role="alert">
    <div class="toast-content" style="display: flex; align-items: center; gap: 10px;">
      <svg class="toast-icon toast-icon-error" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      <span class="toast-message">Failed to connect to real-time market data feed</span>
    </div>
    <button class="toast-close-btn" aria-label="Close notification"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
  </div>
  <div class="toast-item toast-warning" role="alert">
    <div class="toast-content" style="display: flex; align-items: center; gap: 10px;">
      <svg class="toast-icon toast-icon-warning" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
      <span class="toast-message">Market order placed outside regular trading hours</span>
    </div>
    <button class="toast-close-btn" aria-label="Close notification"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
  </div>
  <div class="toast-item toast-info" role="alert">
    <div class="toast-content" style="display: flex; align-items: center; gap: 10px;">
      <svg class="toast-icon toast-icon-info" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <span class="toast-message">Certificate interest accrued: EGP 4,250.00</span>
    </div>
    <button class="toast-close-btn" aria-label="Close notification"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
  </div>
</div>
`;

const ERROR_BOUNDARY_HTML = `
<div class="error-boundary-wrapper" id="test-error-boundary" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px;">
  <div class="error-boundary-card">
    <div class="error-boundary-icon-badge">
      <svg class="error-boundary-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/></svg>
    </div>
    <h2 class="error-boundary-title">Something went wrong</h2>
    <p class="error-boundary-desc">An unexpected UI error occurred while rendering this page. You can reload or navigate back to the dashboard.</p>
    <div class="error-boundary-actions">
      <button class="error-boundary-btn error-boundary-btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Reload Page
      </button>
      <button class="error-boundary-btn error-boundary-btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        Go to Dashboard
      </button>
    </div>
  </div>
</div>
`;

test.describe('Dual-Mode Overlays Visual Evidence', () => {
  test('capture toast and error-boundary in legacy and dark modes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => { window.__VISUAL_TEST__ = true; });
    await page.goto('/portfolio', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy Toasts
    await page.evaluate(({ html }) => {
      delete document.documentElement.dataset.fsTheme;
      const existing = document.getElementById('test-toast-container');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
    }, { html: TOAST_HTML });
    const toastContainer = page.locator('#test-toast-container');
    await toastContainer.screenshot({ path: path.join(OUT_DIR, 'toast-legacy-1440.png') });

    // 2. Themed Dark Toasts
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-fs-theme', 'dark');
    });
    await toastContainer.screenshot({ path: path.join(OUT_DIR, 'toast-dark-1440.png') });

    // Clean toasts
    await page.evaluate(() => {
      const el = document.getElementById('test-toast-container');
      if (el) el.remove();
    });

    // 3. Legacy Error Boundary
    await page.evaluate(({ html }) => {
      delete document.documentElement.dataset.fsTheme;
      const existing = document.getElementById('test-error-boundary');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
    }, { html: ERROR_BOUNDARY_HTML });
    const errorCard = page.locator('.error-boundary-card');
    await errorCard.screenshot({ path: path.join(OUT_DIR, 'error-legacy-1440.png') });

    // 4. Themed Dark Error Boundary
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-fs-theme', 'dark');
    });
    await errorCard.screenshot({ path: path.join(OUT_DIR, 'error-dark-1440.png') });
  });
});
