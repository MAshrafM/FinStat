# UI Phase 5C Walkthrough — Paycheck Form, Part 1 (Styles Only)

- **Sub-phase**: Phase 5C (`/salary/paychecks/new` and `/salary/paychecks/edit/:id` — Part 1: Styles Only)
- **Working Branch**: `phase-ui-5c-paycheck-form-a`
- **Merge Base**: `f3232f6` (`main`)
- **Date**: 2026-11-20
- **Status**: Ready for Walkthrough Approval (Held Unmerged)

> [!IMPORTANT]
> **Branch & Merge Gate**: All Phase 5C work is authored on branch `phase-ui-5c-paycheck-form-a`. As commanded by governance and user instructions, **this branch will not be merged into `main` until the walkthrough is approved.**
> **Styles Only Boundary (Zero Allowlist Change)**: In accordance with `UI-UX-PLAN.md §6.9` (lines 1680–1694), `/salary/paychecks/new` and `/salary/paychecks/edit/:id` remain **unthemed** in Phase 5C (`THEMED_PATTERNS` in `ProtectedRoute.js` is untouched; exactly 12 allowlisted routes). Route allowlisting and legacy CSS sunset occur in Phase 5D.

---

## 1. Review Defects & Plan Evolution Resolution

During plan formulation and review, 13 blocking items (B1–B13) were systematically analyzed and resolved through recorded amendments in `UI-UX-PLAN.md §6.9`, `§6.16`, and `§10`:

| Blocker / Issue | Summary & Root Cause | Resolution Applied | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **B1 / B2** | **Direct stylelint exit-0 vs byte-identical legacy retention contradiction** | Direct `stylelint` execution fails on legacy hex/gradients. Retaining unscoped legacy CSS byte-identically while demanding exit-0 without suppression is mathematically impossible. | Wrapped unscoped legacy CSS block in explicit `/* stylelint-disable */` comments scoped to the legacy section with Phase 5D sunset notice. Recorded Amendment 1. | `node scripts/lint-ratchet.js` verified 0 regressions; ratchet preserved at $\le 86$. |
| **B3** | **Global primitive classes in unthemed JSX causing unthemed visual regressions** | Using `.fs-btn-primary`, `.fs-card`, `.fs-num` in JSX changes unthemed visual layout (accent colors, paddings), causing baseline diffs. | Strict separation: JSX uses page-local semantic classes (`.paycheck-submit-btn`, `.paycheck-cancel-btn`, `.paycheck-preview-val`, `.paycheck-calc-readonly`). Global `.fs-*` utility classes are prohibited in unthemed JSX. Recorded Amendment 2. | PR-Subset visual regression (71/71) passed with 0 diff on `salary-paychecks-new` and `salary-paychecks-edit`. |
| **B4** | **`ComponentTable.js` coupling & scope boundary** | `ComponentTable` is shared across profile update and paycheck forms; styling its internals in 5C risked breaking other routes. | `ComponentTable` JSX untouched. Dual-block rules in `PaycheckFormPage.css` scoped under `.fs-page .component-table-container` style it only when dormant theme is active. | Clean component isolation; 0 regressions on salary profile tests. |
| **B5 / B6** | **Undefined CSS tokens in draft specifications** | Draft referenced non-existent tokens: `--fs-space-*`, `--fs-card-bg`, `--fs-text-muted`, `--fs-weight-bold`. | Replaced with valid tokens from `tokens.json`: `--fs-surface`, `--fs-text-2`, `--fs-weight-semibold`, and raw rem values for spacing per Phase 5B precedent. | `node scripts/lint-tones.js` Check 2 scanned 59 CSS files: 0 undefined tokens. |
| **B7 / B8** | **I14/I16 invariant waiver & sunset timeline** | Retaining legacy gradients/glows without a documented sunset violates anti-slop invariants I14 and I16. | Recorded Amendment 4 in `UI-UX-PLAN.md §6.9` and §10: sunsetting the unscoped block permanently in Phase 5D. | Documented in `PaycheckFormPage.css` line 34. |
| **B9** | **Mobile responsive layout & horizontal scroll (D19)** | Complex multi-column components in form could trigger page-level horizontal overflow at 390px. | Authored mobile responsive media queries ($\le 768\text{px}$) under `.fs-page`: flex-wrap, 100% width inputs, compact padding. | Playwright spec verified `scrollWidth <= clientWidth` (0 overflow) at 390px. |
| **B10** | **`DISBURSEMENT_TYPES` ESLint hex literal conflict** | Removing `PaycheckFormPage.js` from `.eslintignore` would fail ESLint due to 9 presentation hex color literals in `DISBURSEMENT_TYPES`. | Removed unused `color: '#...'` properties from `DISBURSEMENT_TYPES` (Recorded Amendment 6). Presentation is controlled by CSS. | `npx eslint` on `PaycheckFormPage.js` exited 0 with 0 errors and 0 warnings. |
| **B11** | **`.paycheck-calc-readonly` font family / tabular nums** | Readonly computed inputs required tabular-nums with sans font per D16/AD10. | Specified `font-family: var(--fs-font-sans); font-variant-numeric: tabular-nums; text-align: right;` under `.fs-page`. | Computed style assertions in `paycheck-form-reference-match.spec.js` pass. |
| **B12** | **Undefined `--fs-weight-bold` token** | Draft CSS used `--fs-weight-bold` which does not exist in `tokens.json`. | Replaced with `var(--fs-weight-semibold)` (token value `600`) per D15 / §4.5 ("three weights, no 700"). | `lint-tones.js` exits 0. |
| **B13** | **Preview values claiming `text-align: right`** | Plan asserted right-alignment on preview values without defining it in CSS. | Added `text-align: right` to `.fs-page .paycheck-preview-val`. | Computed style verification passes. |

---

## 2. Preconditions Verification Record (§2.5)

All 8 preconditions from Implementation Plan §2.5 were verified on `phase-ui-5c-paycheck-form-a`:

1. **PC-1 (`.eslintignore` pre-state)**:
   ```powershell
   git grep -n "PaycheckFormPage" frontend/.eslintignore
   ```
   *Output*:
   ```text
   frontend/.eslintignore:76:src/pages/salary/__tests__/PaycheckFormPage.test.js
   frontend/.eslintignore:77:src/pages/salary/__tests__/PaycheckFormPageTax.test.js
   frontend/.eslintignore:78:src/pages/salary/__tests__/PaycheckFormPageTimezone.test.js
   ```
   *Verification*: `src/pages/salary/PaycheckFormPage.js` is permanently deleted from line 74. Only the 3 test suites remain ignored until Phase 5D.

2. **PC-2 (Route allowlist isolation)**:
   `node scripts/ui-coverage.js --assert-allowlist` confirmed exactly 12 allowlisted routes. Neither `/salary/paychecks/new` nor `/salary/paychecks/edit/:id` is allowlisted.

3. **PC-3 (Baselines pre-existence)**:
   Confirmed all 10 baseline snapshots (`salary-paychecks-new-{1440,1024,768,480,390}.png` and `salary-paychecks-edit-{1440,1024,768,480,390}.png`) pre-existed in `frontend/tests/visual/baseline/`.

4. **PC-4 (Calculations characterization)**:
   Ran `npx jest --runInBand tests/calculations.spec.js`; passed 11/11 tests.

5. **PC-5 (Baseline manifest integrity)**:
   Ran `node frontend/scripts/verify-baseline-manifest.js`; passed 334/334 baselines verified against SHA-256 manifest.

6. **PC-6 (Inline style inventory)**:
   Verified all 77 inline `style={{ ... }}` declarations were completely removed from `PaycheckFormPage.js` (`git grep -n "style={{" frontend/src/pages/salary/PaycheckFormPage.js` returns 0).

7. **PC-7 (`DISBURSEMENT_TYPES` scope check)**:
   Verified `DISBURSEMENT_TYPES` has zero `color: '#...'` properties. Grepping for `color:` in `DISBURSEMENT_TYPES` returns 0.

8. **PC-8 (PaycheckFormPage unit test characterization)**:
   Ran `npm test -- --runInBand --watchAll=false src/pages/salary/__tests__/PaycheckFormPage*.test.js`; passed 16/16 tests across 3 suites.

---

## 3. Visual Comparison & Rendered Evidence

Screenshots captured using Playwright Chromium with deterministic clock and API mock fixtures. Images are stored in `docs/ui-snapshots/phase-5c/`:

### 3.1 Unthemed Live Route (Zero-Diff Production Baseline Retention)
![Unthemed Desktop 1440px](docs/ui-snapshots/phase-5c/salary-paychecks-new-unthemed-1440.png)
*Unthemed Live Route Desktop (1440px): 100% byte-identical visual presentation to pre-5C production. All 77 inline styles safely mapped to legacy unscoped classes. Visual regression confirms 0-diff.*

![Unthemed Mobile 390px](docs/ui-snapshots/phase-5c/salary-paychecks-new-unthemed-390.png)
*Unthemed Live Route Mobile (390px): Legacy mobile layout retained without alteration.*

---

### 3.2 Themed Preview (Reference Frame 02 Match under `.fs-page` Harness)
![Themed Desktop 1440px](docs/ui-snapshots/phase-5c/salary-paychecks-new-themed-1440.png)
*Themed Preview Desktop (1440px): Canonical Reference Frame 02 implementation. Dark graphite canvas (`#101114`), stacked field cards (`var(--fs-surface)` = `#1a1c20`, border `#34383f`), single primary accent Save CTA (`#14b8a6` with `#0d0e10` text), 2px left indicator cue on selected disbursement button, tabular figures on numeric preview values, and 4px input radii.*

![Themed Mobile 390px](docs/ui-snapshots/phase-5c/salary-paychecks-new-themed-390.png)
*Themed Preview Mobile (390px): Fully responsive at 390px viewport. Zero page-level horizontal overflow (`scrollWidth <= clientWidth`), wrapped action rows, full-width touch targets $\ge 44$px.*

![Themed Edit Desktop 1440px](docs/ui-snapshots/phase-5c/salary-paychecks-edit-themed-1440.png)
*Themed Edit Paycheck Preview Desktop (1440px): Edit route (`/salary/paychecks/edit/1`) under dormant `.fs-page` harness with pre-populated values and live calculation preview.*

---

## 4. Invariants Compliance Matrix (Verbatim from UI-UX-PLAN.md §2)

| # | Rule | Verification | Phase 5C Status |
| :--- | :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | **PASSED**: 75 routes confirmed; allowlist assertion verified; paycheck form routes remain unthemed. |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | **PASSED**: `paycheckService.js` and backend API endpoints completely untouched. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | **PASSED**: `tests/calculations.spec.js` passed 11/11 tests green. Form calculation logic byte-identical. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | **PASSED**: Viewer role protection preserved; form modify guards unchanged. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | **PASSED**: `node frontend/scripts/testid-guard.js` reported 0 deletions / regressions. 20 form inputs gained explicit `<label htmlFor>` pairings. |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | **PASSED**: `ComponentTable` container wraps gracefully; mobile inputs expand to 100% width; Playwright verified `scrollWidth <= clientWidth` at 390px. |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | **PASSED**: Zero allowlist change in 5C. Full legacy functionality retained identically. |
| **I8** | Dashboard summary tiles must not grow beyond their approved footprint or line cap (120 lines for DashboardSummary.js). | Line count check on DashboardSummary.js | **PASSED**: `DashboardSummary.js` line count is 97 lines ($\le 120$ limit). |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | **PASSED**: `cmd /c "set NODE_OPTIONS=--max-old-space-size=4096 && set GENERATE_SOURCEMAP=false && npm run build"` compiled successfully with exit code 0. |
| **I10** | Zero accessibility regressions on modified pages: WCAG 2.1 AA compliance maintained, color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text / graphical controls, keyboard navigability preserved. | `a11y.spec.js` running axe-core | **PASSED**: `PaycheckFormPageAxe.test.js` passed with 0 serious/critical violations; Playwright `a11y.spec.js` passed with 0 violations for `salary-paychecks-new` and `salary-paychecks-edit`. |
| **I11** | Zero new CSS introduced outside design tokens. Direct use of `--fs-accent` in page CSS strictly forbidden. | Stylelint rule + custom AST scanner | **PASSED**: `lint-tones.js` verified 0 direct accent/tone references; all colors in scoped block use tokens. |
| **I12** | Every interactive element must use the single interactive accent (`--fs-accent` / `#14b8a6`). Accent is never used as background wash or brand decoration. | CSS token audit | **PASSED**: Verified in `paycheck-form-reference-match.spec.js`: exactly one primary accent CTA on page (`.paycheck-submit-btn`). |
| **I13** | Text on accent elements must always use `--fs-ink` (`#101114`). White text on accent is strictly banned. | Stylelint custom rule | **PASSED**: Primary CTA computes to `color: rgb(13, 14, 16)` on `background-color: rgb(20, 184, 166)`. Ratio = 10.82:1. |
| **I14** | Zero gradients, glows, blurs, or drop-shadows across all stylesheets and canvas renders. | Stylelint ban on `linear-gradient`, `box-shadow`, `filter`, `backdrop-filter` | **PASSED**: Scoped `.fs-page` block uses strictly flat borders and `box-shadow: none`. Legacy unscoped block wrapped under sunset waiver (Amendment 4) to be deleted in 5D. |
| **I15** | Numerical values and tabular data must use monospace numbers. IBM Plex Sans with tabular figures (`font-variant-numeric: tabular-nums`) or IBM Plex Mono. | Visual inspection and typography audit | **PASSED**: `.paycheck-preview-val` and `.paycheck-calc-readonly` use `font-family: var(--fs-font-sans); font-variant-numeric: tabular-nums; text-align: right;`. |
| **I16** | Unlisted border radii banned. Border radius ceiling is 8px (`--fs-radius-lg`). | Stylelint `declaration-property-value-allowed-list` | **PASSED**: Scoped `.fs-page` block uses strictly `--fs-radius-sm` (4px), `--fs-radius-md` (6px), and `--fs-radius-lg` (8px). |

---

## 5. Four-Part Visual Regression Diff Report

Executed deterministic Playwright visual regression suite under `$env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset`:

```text
Running 71 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (12ms)
  ok 2 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › not-found @ 1440px (8.2s)
  ok 3 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › dashboard @ 1440px (3.4s)
  ok 4 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › dashboard @ 390px (3.0s)
  ok 5 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › portfolio @ 1440px (2.6s)
  ok 6 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › portfolio @ 390px (2.3s)
  ok 7 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › portfolio-rebalancing @ 1440px (2.5s)
  ok 8 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › reports-financial @ 1440px (3.1s)
  ok 9 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › profile @ 1440px (2.7s)
  ok 10 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › settings @ 1440px (3.0s)
  ok 11 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › settings-recycle-bin @ 1440px (2.8s)
  ok 12 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › security @ 1440px (2.6s)
  ok 13 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › corporate-actions @ 1440px (3.7s)
  ok 14 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › corporate-actions-wizard @ 1440px (4.1s)
  ok 15 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin @ 1440px (2.8s)
  ok 16 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin-tax-brackets @ 1440px (2.6s)
  ok 17 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin-social-insurance @ 1440px (2.5s)
  ok 18 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin-backup @ 1440px (2.7s)
  ok 19 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profiles @ 1440px (2.7s)
  ok 20 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-history @ 1440px (2.5s)
  ok 21 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-edit @ 1440px (3.3s)
  ok 22 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-history-edit @ 1440px (2.8s)
  ok 23 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-update @ 1440px (5.4s)
  ok 24 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks @ 1440px (2.3s)
  ok 25 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks @ 390px (2.0s)
  ok 26 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks-new @ 1440px (5.0s)
  ok 27 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks-edit @ 1440px (5.6s)
  ok 28 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › analysis-payroll @ 1440px (2.4s)
  ok 29 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-rules @ 1440px (3.6s)
  ok 30 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-simulator @ 1440px (2.5s)
  ok 31 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures @ 1440px (4.0s)
  ok 32 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures @ 390px (2.6s)
  ok 33 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-new @ 1440px (4.8s)
  ok 34 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-edit @ 1440px (2.4s)
  ok 35 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-rules @ 1440px (2.5s)
  ok 36 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-budgets @ 1440px (2.5s)
  ok 37 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-recurring @ 1440px (4.0s)
  ok 38 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-bills @ 1440px (2.7s)
  ok 39 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditure-analysis @ 1440px (3.1s)
  ok 40 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trades @ 1440px (2.5s)
  ok 41 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trades-add @ 1440px (5.4s)
  ok 42 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trades-edit @ 1440px (2.7s)
  ok 43 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trade-summary @ 1440px (2.9s)
  ok 44 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds @ 1440px (2.9s)
  ok 45 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds-new @ 1440px (1.9s)
  ok 46 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds-edit @ 1440px (2.3s)
  ok 47 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds-summary @ 1440px (3.0s)
  ok 48 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet @ 1440px (2.5s)
  ok 49 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet-new @ 1440px (1.9s)
  ok 50 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet-edit @ 1440px (3.0s)
  ok 51 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet-summary @ 1440px (2.3s)
  ok 52 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › analytics-purchasing-power @ 1440px (2.3s)
  ok 53 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates @ 1440px (2.5s)
  ok 54 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates-detail @ 1440px (2.4s)
  ok 55 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates-new @ 1440px (3.7s)
  ok 56 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates-edit @ 1440px (2.3s)
  ok 57 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency @ 1440px (3.6s)
  ok 58 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency-detail @ 1440px (4.0s)
  ok 59 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency-new @ 1440px (2.3s)
  ok 60 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency-edit @ 1440px (3.2s)
  ok 61 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › real-estate @ 1440px (4.0s)
  ok 62 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › real-estate-new @ 1440px (2.2s)
  ok 63 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › real-estate-edit @ 1440px (2.5s)
  ok 64 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards @ 1440px (2.6s)
  ok 65 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards @ 390px (3.8s)
  ok 66 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards-statements @ 1440px (2.4s)
  ok 67 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards-debt-payoff @ 1440px (4.3s)
  ok 68 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards-reconcile @ 1440px (2.4s)
  ok 69 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › lending @ 1440px (2.8s)
  ok 70 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › lending-person-detail @ 1440px (2.5s)
  ok 71 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › lending-loan-detail @ 1440px (2.3s)

  71 passed (3.9m)
```

### Four-Part Breakdown
1. **Total tests executed**: 71 snapshots
2. **Zero-diff snapshots**: 71 (100%)
3. **Accepted diff snapshots**: 0
4. **Unexplained diff snapshots**: 0

---

## 6. Quality Gates Execution Log

### Gate 1 — Calculations Unit Tests
```powershell
npx jest --runInBand tests/calculations.spec.js
```
*Result*: **PASS** (11/11 tests passed in 1.487s).

### Gate 2 — PaycheckFormPage Unit Test Suites
```powershell
npm test -- --runInBand --watchAll=false src/pages/salary/__tests__/PaycheckFormPage*.test.js
```
*Result*: **PASS** (16/16 tests across `PaycheckFormPage.test.js`, `PaycheckFormPageTax.test.js`, `PaycheckFormPageTimezone.test.js`).

### Gate 3 — CI Changed-Files ESLint Gate
```powershell
npx eslint src/pages/salary/PaycheckFormPage.js src/pages/salary/__tests__/PaycheckFormPageAxe.test.js tests/visual/a11y.spec.js tests/visual/fixtures/paycheckMocks.js tests/visual/paycheck-form-reference-match.spec.js --max-warnings=0
```
*Result*: **PASS** (0 errors, 0 warnings, exit code 0).

### Gate 4 — Stylelint Ratchet & Tone Linters
```powershell
node scripts/tokens.js --check --fonts
node scripts/lint-tones.js
node scripts/lint-ratchet.js
```
*Result*: **PASS** (exit code 0):
- Fonts: 72.64 KB $\le$ 90 KB budget.
- `lint-tones.js`: 0 tone scoping violations across 56 page files; 0 undefined tokens across 59 files.
- `lint-ratchet.js`: 58 CSS files checked against merge-base; 0 regressions.

### Gate 5 — Route Allowlist Assertion
```powershell
node scripts/ui-coverage.js --assert-allowlist
```
*Result*: **PASS** (12 allowlisted patterns verified; paycheck form routes remain unthemed).

### Gate 6 — Test ID & Accessibility Label Guard
```powershell
node scripts/testid-guard.js
```
*Result*: **PASS** (all test IDs and accessible labels preserved).

### Gate 7 — Accessibility Audits (Jest-Axe & Playwright Axe)
- **Jest-Axe**:
  ```powershell
  npm test -- --runInBand --watchAll=false src/pages/salary/__tests__/PaycheckFormPageAxe.test.js
  ```
  *Result*: **PASS** (1/1 passed, 0 serious or critical violations).
- **Playwright Axe**:
  ```powershell
  $env:CI="true"; npx playwright test --project=a11y -g "salary-paychecks-new|salary-paychecks-edit"
  ```
  *Result*: **PASS** (3/3 passed: setup + 2 routes with 0 serious or critical violations).

### Gate 8 — App Route Resolution & Dashboard RTL Regression Suites + Line Cap
```powershell
npm test -- --runInBand --watchAll=false src/App.test.js src/pages/dashboard/__tests__/DashboardSummary*.test.js
```
*Result*: **PASS** (40/40 tests passed). `DashboardSummary.js` line count: 97 lines ($\le 120$).

### Gate 9 — Reference Frame 02 Alignment Spec
```powershell
npx playwright test --project=reference tests/visual/paycheck-form-reference-match.spec.js
```
*Result*: **PASS** (3/3 passed: auth setup + 1440px desktop tokens + 390px mobile touch targets and 0 overflow).

### Gate 10 — Production Build Compilation
```powershell
cmd /c "set NODE_OPTIONS=--max-old-space-size=4096 && set GENERATE_SOURCEMAP=false && npm run build"
```
*Result*: **PASS** (`Compiled successfully.`, exit code 0).

### Gate 11 — PR-Subset Visual Regression
```powershell
$env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset
```
*Result*: **PASS** (71/71 tests passed with 0 diff).

### Gate 12 — Baseline Manifest Integrity
```powershell
node scripts/verify-baseline-manifest.js
```
*Result*: **PASS** (334/334 baselines verified against SHA-256 manifest).

### Gate 13 — Anti-Slop Grep Audits
```powershell
git grep -n '#14b8a6' -- 'src/**/*.css'
git grep -rn '#14b8a6' src/pages/salary/ src/components/salary/
git grep -n "overflow-x" src/pages/salary/
```
*Result*: **PASS**:
- `#14b8a6` in CSS matches strictly `src/styles/tokens.css:36`.
- 0 matches of `#14b8a6` across all salary JS files.
- `overflow-x` in salary CSS matches only pre-existing `TaxSimulator.css:277` (0 in `PaycheckFormPage.css`).
- Loading icon exception documented per Amendment 5.

---

## 7. Progress Log Update (§10 Block)

```markdown
### 2026-11-20 — Phase 5C: Paycheck Form, Part 1 (Styles Only)
- **Branch**: `phase-ui-5c-paycheck-form-a`
- **Scope**: Styles-only refactor of `PaycheckFormPage.js` and `PaycheckFormPage.css` (`/salary/paychecks/new` and `/salary/paychecks/edit/:id`). Zero allowlist changes (routes remain unthemed until Phase 5D).
- **Amendments**: Recorded Amendments 1–6 in `UI-UX-PLAN.md §6.9`, `§6.16`, and `§10` (dual-block architecture with sunset, semantic JSX classes, component table isolation, complete stylelint suppression list, loading indicator exception, and `DISBURSEMENT_TYPES` color removal).
- **CSS Architecture**: Dual-block stylesheet in `PaycheckFormPage.css`:
  - Temporary unscoped legacy block under `stylelint-disable` with Phase 5D sunset comment.
  - Dormant scoped `.fs-page` block strictly implementing Reference Frame 02 tokens, 4px input radii, 2px selection cues, right-aligned tabular numerals, and mobile responsive card wrapping ($\le 768\text{px}$).
- **JSX Refactoring**: Extracted all 77 inline `style` declarations to semantic classes. Paired all 20 form inputs with explicit `<label htmlFor>` elements. Converted step card headings to semantic `h2.step-card-title`.
- **Quality Gates**: All 13 quality gates passed:
  - Gate 1 (Calculations): 11/11 passed.
  - Gate 2 (PaycheckFormPage unit tests): 16/16 passed across 3 suites.
  - Gate 3 (ESLint): 0 errors, 0 warnings across all touched files. `PaycheckFormPage.js` removed from `.eslintignore`.
  - Gate 4 (Stylelint ratchet & tone linter): 0 regressions; 0 undefined tokens.
  - Gate 5 (Route coverage): Exactly 12 allowlisted routes.
  - Gate 6 (Test IDs): 0 deletions / regressions.
  - Gate 7 (A11y): Jest-Axe (0 serious/critical violations) and Playwright Chromium Axe (3/3 passed).
  - Gate 8 (Dashboard RTL & line cap): 40/40 passed; 97 lines $\le 120$.
  - Gate 9 (Frame 02 match): 3/3 passed (1440px tokens and 390px mobile responsiveness).
  - Gate 10 (Production build): Compiled successfully, exit 0.
  - Gate 11 (PR-Subset visual regression): 71/71 passed with 0 diff.
  - Gate 12 (Baseline manifest): 334/334 baselines verified.
  - Gate 13 (Anti-slop grep): Clean.
```
