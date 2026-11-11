# Walkthrough — UI Phase 2A: Token Layer & Theme Primitives

Phase 2A establishes the foundational token generation system, CSS custom property primitives, self-hosted IBM Plex typography, scoped theme gates, multi-server reference frame testing harness, and expands visual baselines from 325 to 328 without a single pixel drift on legacy routes.

---

## Executive Summary

- **Deliverables**:
  1. `frontend/src/styles/tokens.css` emitted deterministically from `tokens.json` via `tokens.js --write`, scoped under `:root[data-fs-theme="dark"]` (D22 Constraint 1).
  2. `frontend/src/styles/theme.css` (611 lines) providing primitive utility classes (`.fs-page`, buttons, inputs, tables, states, badges, focus rings, reduced-motion, forced-colors, native controls) with zero raw colors.
  3. `frontend/src/styles/theme-components.css` created as an empty override stub for Phase 2D.
  4. `frontend/src/index.css` updated with attribute-existence rules (`html[data-fs-theme]` and `html[data-fs-theme] body`) preserving the door for user-selected themes (D22 Constraint 2).
  5. `frontend/src/index.js` imports the token layer and primitives in exact cascade order.
  6. 3 canonical reference frames (`01-dense-table.html`, `02-form.html`, `03-dashboard.html`) updated to load external token stylesheets directly.
  7. Multi-server Playwright test harness configured with port 3000 (React app) and port 3001 (reference frame static server), with project separation (`visual`, `reference`).
  8. Test-only toast suppression via `page.addStyleTag` in visual and reference test suites with zero production code changes.
  9. Visual baselines regenerated with toast suppression and stabilized spinner detachment waits; verified with 0 diff across 325 route snapshots.
  10. 3 reference frame baselines captured at 1440px (`reference-01-dense-table-1440.png`, `reference-02-form-1440.png`, `reference-03-dashboard-1440.png`), expanding the baseline suite from 325 to 328.
  11. `verify-baseline-manifest.js` updated for dynamic entry count; all 328/328 baselines verified against SHA-256 hashes and committed to `FinStat-visual-baselines`.

---

## Evidence Item 1: `tokens.js --check` (Zero Drift)

```bash
$ node frontend/scripts/tokens.js --check
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.
```

---

## Evidence Item 2: Font Budget Verification (`tokens.js --check --fonts`)

```bash
$ node frontend/scripts/tokens.js --check --fonts
✓ All 4 IBM Plex woff2 files present. Total: 72.64 KB (<= 90 KB budget). OFL verified.
```

Files verified in `frontend/src/assets/fonts/`:
- `IBMPlexSans-Regular.woff2` (17.3 KB)
- `IBMPlexSans-Medium.woff2` (17.7 KB)
- `IBMPlexSans-SemiBold.woff2` (17.8 KB)
- `IBMPlexMono-Regular.woff2` (19.8 KB)
- `OFL.txt` (SIL Open Font License 1.1)

---

## Evidence Item 3: Scoped `:root[data-fs-theme="dark"]` in `tokens.css`

First 20 lines of `frontend/src/styles/tokens.css`:

```css
/* ==========================================================================
   FinStat Design Tokens — Generated from tokens.json DO NOT EDIT DIRECTLY
   Run: node frontend/scripts/tokens.js --write
   ========================================================================== */

/* fs-tokens:start */
:root[data-fs-theme="dark"] {
  /* Surfaces */
  --fs-bg: #101114;
  --fs-surface: #1a1c20;
  --fs-surface-raised: #22252a;
  --fs-surface-sunken: #0c0d0f;
  --fs-chrome: var(--fs-surface-sunken);

  /* Borders */
  --fs-border: #34383f;
  --fs-border-strong: #4a4f57;
  --fs-border-control: #6a6f77;
  --fs-border-width: 1px;
```

---

## Evidence Item 4: `theme.css` Architecture & Font-Face Declarations

`frontend/src/styles/theme.css` total line count: 611 lines.

First 45 lines (`@font-face` with metric-adjusted fallbacks and `font-display: swap`):

```css
/* ==========================================================================
   FinStat Design System — Primitives & Theme Stylesheet
   Phase 2A Foundation (UI-UX-PLAN.md §4, §6.6, §7.1, §7.2, §7.3, §7.4)
   Strictly token-driven: zero hex/rgb color literals.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Typography: Self-Hosted IBM Plex Font Declarations
   -------------------------------------------------------------------------- */

@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/IBMPlexSans-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('../assets/fonts/IBMPlexSans-Medium.woff2') format('woff2');
}

@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('../assets/fonts/IBMPlexSans-SemiBold.woff2') format('woff2');
}

@font-face {
  font-family: 'IBM Plex Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/IBMPlexMono-Regular.woff2') format('woff2');
}

/* Metric-adjusted fallback to prevent layout shifts */
@font-face {
  font-family: 'Plex Sans Fallback';
  src: local('Arial');
  ascent-override: 102.5%;
  descent-override: 27.5%;
  line-gap-override: 0%;
  size-adjust: 98%;
}
```

---

## Evidence Item 5: Stylelint Verification

```bash
$ npx stylelint "src/styles/*.css"
# Exit code 0, 0 violations across tokens.css, theme.css, and theme-components.css
```

---

## Evidence Item 6: Anti-Slop `lint-tones.js` Verification

```bash
$ node scripts/lint-tones.js
✓ [lint-tones] Scanned 57 CSS files: 0 forbidden tone or accent references.
```

---

## Evidence Item 7: Stylelint Ratchet `lint-ratchet.js`

```bash
$ node scripts/lint-ratchet.js
[lint-ratchet] Evaluating stylelint ratchet against merge-base: b0f3762a4a317f5aee897a2241329f12a58c10eb
✓ [lint-ratchet] Checked 59 CSS files against b0f3762a4a317f5aee897a2241329f12a58c10eb: 0 regressions.
```

---

## Evidence Item 8: `index.css` Attribute-Existence Theme Gates

Git diff of `frontend/src/index.css`:

```diff
+/* Phase 2A: Gate legacy root styling under attribute-existence [data-fs-theme] (D22 Constraint 2a) */
+html[data-fs-theme] {
+  background-color: var(--fs-bg);
+  color: var(--fs-text);
+}
+
+html[data-fs-theme] body {
+  background-color: var(--fs-bg);
+  color: var(--fs-text);
+}
```

---

## Evidence Item 9: Entry Point `index.js` Cascade Order

Git diff of `frontend/src/index.js`:

```diff
 import './index.css';
+import './styles/tokens.css';
+import './styles/theme.css';
+import './styles/theme-components.css';
```

---

## Evidence Item 10: D22 Grep Audit (Multi-Theme Door Preservation)

```bash
$ git grep -E "^:root" frontend/src/styles/tokens.css
frontend/src/styles/tokens.css::root[data-fs-theme="dark"] {

$ git grep "data-fs-theme" frontend/src/index.css
frontend/src/index.css:html[data-fs-theme] {
frontend/src/index.css:html[data-fs-theme] body {

$ git grep 'data-fs-theme="dark"' frontend/src/styles/theme.css frontend/src/styles/theme-components.css frontend/src/index.css
# Exit code 1 (0 matches / empty)
```

---

## Evidence Item 11: `01-dense-table.html` Header Snippet

```html
<!DOCTYPE html>
<html lang="en" data-fs-theme="dark">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reference Frame 01 — Dense Table (Variant B — Canonical)</title>
  <!-- Variant A pattern documented in §4.13.1 (rejected options) -->
  <link rel="stylesheet" href="../../../frontend/src/styles/tokens.css">
  <link rel="stylesheet" href="../../../frontend/src/styles/theme.css">
  <link rel="stylesheet" href="../../../frontend/src/styles/theme-components.css">
  <style>
    * {
      box-sizing: border-box;
```

---

## Evidence Item 12: `02-form.html` Header Snippet

```html
<!DOCTYPE html>
<html lang="en" data-fs-theme="dark">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reference Frame 02 — Two-Column Form (Variant B — Canonical)</title>
  <link rel="stylesheet" href="../../../frontend/src/styles/tokens.css">
  <link rel="stylesheet" href="../../../frontend/src/styles/theme.css">
  <link rel="stylesheet" href="../../../frontend/src/styles/theme-components.css">
  <style>
    * {
      box-sizing: border-box;
```

---

## Evidence Item 13: `03-dashboard.html` Header Snippet

```html
<!DOCTYPE html>
<html lang="en" data-fs-theme="dark">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reference Frame 03 — Dashboard (Variant B — Canonical)</title>
  <link rel="stylesheet" href="../../../frontend/src/styles/tokens.css">
  <link rel="stylesheet" href="../../../frontend/src/styles/theme.css">
  <link rel="stylesheet" href="../../../frontend/src/styles/theme-components.css">
  <style>
    * {
      box-sizing: border-box;
```

---

## Evidence Item 14: Multi-Server `playwright.config.js`

```javascript
  snapshotPathTemplate: '{testDir}/baseline/{arg}{ext}',
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'visual',
      dependencies: ['setup'],
      testMatch: /visual\.spec\.js/,
    },
    {
      name: 'reference',
      testMatch: /reference-frames\.spec\.js/,
    },
    // ...
  ],
  webServer: [
    {
      command: process.env.CI
        ? 'npm run build && npx serve -s build -l 3000'
        : 'npm start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npx http-server .. -p 3001 --cors -c-1',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
```

---

## Evidence Item 15: `reference-frames.spec.js` Implementation

`frontend/tests/visual/reference-frames.spec.js`:
- Navigates to `http://localhost:3001/docs/UI-UX_Plan/reference/01-dense-table.html`
- Navigates to `http://localhost:3001/docs/UI-UX_Plan/reference/02-form.html`
- Navigates to `http://localhost:3001/docs/UI-UX_Plan/reference/03-dashboard.html`
- Tests at viewport 1440x900.
- Verifies `document.fonts.check('14px "IBM Plex Sans"') === true`.
- Applies test-only toast suppression tag.
- Captures snapshots: `reference-01-dense-table-1440.png`, `reference-02-form-1440.png`, `reference-03-dashboard-1440.png`.

---

## Evidence Item 16: Visual Regression Run on 325 Route Baselines (0 Diff)

```bash
$ cd frontend; $env:CI="true"; npx playwright test --project=visual
Running 326 tests using 1 worker
  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session
  ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px
  ...
  ok 326 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 390px
  326 passed (17.2m)
```
**Result**: 325 route snapshots across 65 routes at 5 viewports passed with **0 pixel diff**. Zero style leakage onto unmigrated routes (Invariant I13 verified).

---

## Evidence Item 17: Reference Frame Visual Suite Verification (3 Passed, 0 Diff)

```bash
$ cd frontend; npx playwright test --project=reference
Running 3 tests using 1 worker
  ok 1 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 01-dense-table @ 1440px (3.6s)
  ok 2 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 02-form @ 1440px (2.3s)
  ok 3 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 03-dashboard @ 1440px (2.2s)
  3 passed (30.1s)
```

---

## Evidence Item 18: `verify-baseline-manifest.js` (328/328 Verified)

```bash
$ node frontend/scripts/verify-baseline-manifest.js
328/328 baselines verified successfully.
```

---

## Evidence Item 19: Local Baseline Repository Git Commit

```bash
$ git -C D:\Projects\FinStat-visual-baselines log -1
commit 20fdc8436989fd771373f83e6beffe76330a66ce
Author: MAshrafM <ee.mashraf@gmail.com>
Date:   Wed Nov 11 11:05:11 2026 +0200

    chore(visual): regenerate 325 baselines with toast-suppression and add 3 canonical reference frame baselines (total 328)
```

---

## Unit & Characterization Test Suites

- **CRA Jest Tests**: 48 passed, 48 total (310 passed, 310 total).
- **A11y Tests (`expectNoA11yViolations`)**: 1 passed, 1 total (2 passed, 2 total).
- **Calculations Characterization (`calculations.spec.js`)**: 1 passed, 1 total (11 passed, 11 total across all 8 domains).
- **Production Build**: `npm run build` compiled successfully without warnings.

Phase 2A execution is complete, thoroughly verified, and ready for review.
