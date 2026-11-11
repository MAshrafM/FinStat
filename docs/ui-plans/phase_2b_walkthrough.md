# Walkthrough — UI Phase 2B: Gated Shell & Global Surfaces

Phase 2B implements the global application shell styling, accessible keyboard navigation, synchronous theme gating under the D22 multi-theme existence pattern, and persistent shell visual regression baselines while rigorously preserving legacy appearance on unmigrated routes (**Invariant I13**).

---

## Executive Summary

- **Deliverables**:
  1. **Accessible Skip Link (WCAG 2.4.1)**: Added `.fs-skip-link` targeting `#main-content` with `tabIndex={-1}` and focus ring suppression (`outline: none`) in [`ProtectedRoute.js`](file:///d:/Projects/FinStat/frontend/src/components/ProtectedRoute.js) and [`theme.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme.css).
  2. **Synchronous Theme Gating (D22 Constraint 2)**: Scoped theme application in `ProtectedRoute.js` using `useLayoutEffect`, setting/deleting `document.documentElement.dataset.fsTheme`. In Phase 2B, `THEMED_PATTERNS = []` remains empty, guaranteeing 0 visual regressions on all 325 unmigrated routes (**Invariant I13**).
  3. **Sidebar Inline `<style>` Extraction (I13 Preservation)**: Moved the 82-line inline `<style>` block from [`Sidebar.js`](file:///d:/Projects/FinStat/frontend/src/components/Sidebar.js) into [`Sidebar.css`](file:///d:/Projects/FinStat/frontend/src/components/Sidebar.css) verbatim, preserving exact legacy hexes and layout without any cascade regression.
  4. **Gated Shell Overrides in `theme-components.css`**: Authored all dark shell component rules under `html[data-fs-theme]` in [`theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css) for:
     - **Navbar**: `#0c0d0f` recessed chrome, 1px border, IBM Plex font, subdued action button.
     - **Sidebar**: `#0c0d0f` background, neutral 2px left border active state (`--fs-text`), subtle hover.
     - **AccountSwitcher**: Popover dropdown, trigger pill, delegation banner, and family rollup modal.
     - **Toast & UndoToast**: Semantic 3px left borders, toast container z-index (`--fs-z-toast`), action buttons.
     - **ErrorBoundary**: Error card, monospace debug stack, semantic negative tones.
  5. **Playwright Shell Project (Option A)**:
     - Configured dedicated `shell` project in [`playwright.config.js`](file:///d:/Projects/FinStat/frontend/playwright.config.js) and authored [`shell.spec.js`](file:///d:/Projects/FinStat/frontend/tests/visual/shell.spec.js).
     - Captured 6 persistent shell baselines on stable route `/portfolio`:
       - `shell-legacy-desktop` (1440px, legacy shell)
       - `shell-legacy-mobile` (390px, legacy shell)
       - `shell-dark-desktop-collapsed` (1440px, dark shell collapsed)
       - `shell-dark-desktop-expanded` (1440px, dark shell expanded with active item)
       - `shell-dark-mobile-drawer` (390px, dark mobile drawer with scrim)
       - `shell-dark-account-dropdown` (1440px, dark account switcher open)
     - Expanded baseline count from **328 $\to$ 334**.
  6. **Local Baseline Repo & Manifest**:
     - Committed the 6 new PNG baselines to `D:\Projects\FinStat-visual-baselines` (commit `ac62e13`).
     - Regenerated and verified `manifest.json` for all 334 entries.

---

## Evidence Item 1: Accessible Skip Link Implementation & Tests

### Code Snippet: `ProtectedRoute.js`
```jsx
  return (
    <div className="App">
      <a href="#main-content" className="fs-skip-link">
        Skip to main content
      </a>
      <Navbar onSidebarToggle={handleSidebarToggle} />
      <Sidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className={`main-content ${sidebarOpen ? 'sidebar-open' : ''} ${
          isFullBleedPage ? 'full-bleed' : ''
        } ${themed ? 'fs-page' : ''}`}
      >
        <ViewOnlyBanner />
        <React.Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </React.Suspense>
      </main>
    </div>
  );
```

### CSS: `theme.css`
```css
/* Accessible Skip Link (WCAG 2.4.1) */
.fs-skip-link {
  position: fixed;
  top: -9999px;
  left: 16px;
  background: var(--fs-action-bg);
  color: var(--fs-action-text);
  padding: 8px 16px;
  z-index: var(--fs-z-skip);
  font-family: var(--fs-font-sans);
  font-size: var(--fs-text-sm);
  font-weight: var(--fs-weight-semibold);
  border-radius: var(--fs-radius-md);
  text-decoration: none;
  border: 2px solid var(--fs-border-focus);
}

.fs-skip-link:focus,
.fs-skip-link:focus-visible {
  top: 16px;
  outline: none;
}

#main-content:focus {
  outline: none;
}
```

### Unit Test Verification: `ProtectedRoute.test.js`
```bash
PASS src/components/__tests__/ProtectedRoute.test.js
  Phase 2B: ProtectedRoute & Shell Gating Integration Tests
    √ 1. renders accessible skip link matching WCAG 2.4.1 targeting #main-content with tabIndex={-1} (153 ms)
    √ 2. empty allowlist in Phase 2B keeps document un-themed and main without fs-page (Invariant I13) (32 ms)
    √ 3. correctly sets data-fs-theme="dark" and fs-page class when route matches allowlist (10 ms)
    √ 4. sets full-bleed class on /portfolio route while maintaining un-themed state in 2B (11 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

---

## Evidence Item 2: Verbatim Sidebar Extraction (I13 Preservation)

Git diff of `frontend/src/components/Sidebar.js` confirms removal of the inline `<style>` block (lines 182–263) without altering any component logic or test IDs:

```diff
-      <style>
-        {`
-          .logo-text {
-            font-size: 18px;
-            font-weight: 700;
-            color: #6c7ce7;
...
-        `}
-      </style>
```

The declarations were moved verbatim to `frontend/src/components/Sidebar.css`. The merge-base stylelint ratchet (`lint-ratchet.js`) accounts for this extraction cleanly with 0 regressions.

---

## Evidence Item 3: Gated Shell in `theme-components.css`

All dark shell rules are consolidated in `frontend/src/styles/theme-components.css` under `html[data-fs-theme]`:
- **Navbar**: `background: var(--fs-surface-sunken)`, `border-bottom: 1px solid var(--fs-border)`, `z-index: var(--fs-z-nav)`.
- **Sidebar**: `background: var(--fs-surface-sunken)`, `border-right: 1px solid var(--fs-border)`. Active item has `background: var(--fs-surface-raised)`, `border-left: 2px solid var(--fs-text)`, `border-radius: 0 var(--fs-radius-md) var(--fs-radius-md) 0`.
- **AccountSwitcher**: Trigger pill with `var(--fs-surface)`, popover dropdown with `var(--fs-shadow)` and `z-index: var(--fs-z-dropdown)`, delegation banner with `var(--fs-warning-subtle)`, and rollup modal with `var(--fs-scrim)`.
- **Toasts**: `var(--fs-surface)` cards with 3px solid semantic borders (`--fs-negative`, `--fs-positive`, `--fs-warning`, `--fs-border-focus`), `z-index: var(--fs-z-toast)`.
- **ErrorBoundary**: `var(--fs-surface)` card with 8px radius ceiling (`var(--fs-radius-lg)`), monospace debug stack (`var(--fs-font-mono)`).

---

## Evidence Item 4: D22 Multi-Theme Constraint Audit

```bash
$ git grep 'data-fs-theme' frontend/src
frontend/src/index.css:html[data-fs-theme] {
frontend/src/index.css:html[data-fs-theme] body {
frontend/src/styles/theme-components.css:html[data-fs-theme] .navbar {
...
frontend/src/styles/tokens.css::root[data-fs-theme="dark"] {
```

*Verification result*: Every single gate uses `html[data-fs-theme]` (existence selector). The value-specific form `[data-fs-theme="dark"]` exists **strictly and exclusively** inside `tokens.css`.

---

## Evidence Item 5: Shell Baselines Verification (`--project=shell`)

```bash
$ $env:CI="true"; cd frontend; npx playwright test --project=shell
Running 7 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (11ms)
  ok 2 [shell] › shell.spec.js:57:3 › Shell Visual Suite (Option A) › shell-legacy-desktop (9.4s)
  ok 3 [shell] › shell.spec.js:62:3 › Shell Visual Suite (Option A) › shell-legacy-mobile (3.3s)
  ok 4 [shell] › shell.spec.js:67:3 › Shell Visual Suite (Option A) › shell-dark-desktop-collapsed (3.0s)
  ok 5 [shell] › shell.spec.js:79:3 › Shell Visual Suite (Option A) › shell-dark-desktop-expanded (3.5s)
  ok 6 [shell] › shell.spec.js:98:3 › Shell Visual Suite (Option A) › shell-dark-mobile-drawer (2.2s)
  ok 7 [shell] › shell.spec.js:111:3 › Shell Visual Suite (Option A) › shell-dark-account-dropdown (6.7s)

  7 passed (41.2s)
```

---

## Evidence Item 6: Reference Frames Verification (`--project=reference`)

```bash
$ $env:CI="true"; cd frontend; npx playwright test --project=reference
Running 3 tests using 1 worker

  ok 1 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 01-dense-table @ 1440px (2.5s)
  ok 2 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 02-form @ 1440px (2.3s)
  ok 3 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 03-dashboard @ 1440px (2.2s)

  3 passed (19.6s)
```

---

## Evidence Item 7: Baseline Manifest Verification (`verify-baseline-manifest.js`)

```bash
$ node frontend/scripts/verify-baseline-manifest.js
334/334 baselines verified successfully.
```

- Local repository: `D:\Projects\FinStat-visual-baselines`
- Commit SHA: `ac62e13`
- Total verified PNGs: **334** ($325 \text{ routes} + 3 \text{ reference frames} + 6 \text{ shell baselines}$).

---

## Evidence Item 8: Linters & Static Analysis Suite

1. **Tokens Check**:
   ```bash
   $ node frontend/scripts/tokens.js --check
   ✓ All §4.9 contrast tables match tokens.json (0 drift).
   ✓ tokens.css matches tokens.json verbatim (0 drift).
   ✓ All tokens checks passed successfully.
   ```
2. **Lint Tones**:
   ```bash
   $ node frontend/scripts/lint-tones.js
   ✓ [lint-tones] Scanned 57 CSS files: 0 forbidden tone or accent references.
   ```
3. **Stylelint Ratchet**:
   ```bash
   $ node frontend/scripts/lint-ratchet.js
   [lint-ratchet] Evaluating stylelint ratchet against merge-base: b0f3762a4a317f5aee897a2241329f12a58c10eb
   ✓ [lint-ratchet] Checked 59 CSS files against b0f3762a4a317f5aee897a2241329f12a58c10eb: 0 regressions.
   ```
4. **UI Coverage & Allowlist Assertion**:
   ```bash
   $ node frontend/scripts/ui-coverage.js --assert-allowlist
   [ui-coverage] Asserting allowlist against 75 defined routes in App.js...
   ✓ [ui-coverage] Allowlist assertion passed. 0 pattern(s) verified against App.js routes.
   ```
5. **Production Build**:
   ```bash
   $ $env:NODE_OPTIONS="--max-old-space-size=4096"; cd frontend; npm run build
   Compiled successfully.
   ```
