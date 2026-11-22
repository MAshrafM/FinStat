# UI Phase 5B Walkthrough (v3) — Paycheck Log & Disbursement History

- **Sub-phase**: Phase 5B (`/salary/paychecks`)
- **Working Branch**: `phase-ui-5b-paycheck-log` (Head commit: `a5f3507` code / `d5c4ff2` walkthrough)
- **Merge Base**: `c627ef5` (`main`)
- **Baseline Repo Commits**: `124314f` (data-backed baselines) & `2aa3dc6` (3-field mobile cards per §6.4) in `D:\Projects\FinStat-visual-baselines`
- **Date**: 2026-11-20
- **Status**: Ready for Walkthrough Approval (Held Unmerged)

> [!IMPORTANT]
> **Branch & Merge Gate**: All Phase 5B work is committed on branch `phase-ui-5b-paycheck-log`. As commanded by governance and user instructions, **this branch will not be merged into `main` until the walkthrough is approved.**

---

## 1. Review Defects & Blocking Items Resolution

### 1.1 First Review Defects (B1–B5)

| Item | Defect Summary | Resolution Applied | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **B1** | **Legacy `.tax-card` cascade collision & unreadable titles** | Completely replaced `tax-card` with page-scoped `.paycheck-panel.fs-card`. Removed emoji prefixes (`💰`, `📊`, `🔍`) from headings; ensured left-aligned section headings (`.paycheck-panel-title`) per Reference Frame 01. Eliminated all risk of `App.css:82` cascade override. | Visual test confirms pure dark graphite canvas (`#101114`) and surfaces (`#1a1c20`), 0 white panels, 10:1+ contrast on headings. |
| **B2** | **Mono font on ordinary amounts (D16 breach)** | Removed `font-family: var(--fs-font-mono)` from `.paycheck-summary-value` in `PaycheckLog.css`. Amounts now rely exclusively on `.fs-num` (proportional IBM Plex Sans with `tabular-nums` per Decision D16/AD10). | Verified in `PaycheckLog.css` and computed style inspection. |
| **B3** | **Unignored test file ESLint errors (13 errors)** | Fixed all 13 errors in `PaycheckLog.test.js`: resolved 5 `no-wait-for-multiple-assertions` by keeping single assertions inside `waitFor`, and resolved 8 `no-container`/`no-node-access` by migrating to accessible Testing Library role/text queries without direct DOM node access. | `npx eslint src/pages/paycheck/PaycheckLog.js src/pages/paycheck/PaycheckTable.js src/pages/paycheck/__tests__/PaycheckLog.test.js --max-warnings=0` exits code 0 with 0 errors and 0 warnings. |
| **B4** | **Empty-state baselines & visual contradiction** | Created fixture `paycheckMocks.js` with realistic multi-year, multi-disbursement, and multi-component paycheck records. Wired mock interception into `visual.spec.js` and `a11y.spec.js` for `/salary/paychecks`. Regenerated all 5 baseline snapshots to show populated data, active KPI cards, yearly growth cards, dense table rows, and mobile cards. | Data-backed snapshots committed to `FinStat-visual-baselines` (`124314f`) and force-added to `docs/ui-snapshots/phase-5b/`. |
| **B5** | **Missing evidence in walkthrough** | Added full four-part Playwright diff report, pasted gate outputs, 10 precondition records, §10 progress-log block, real-browser axe report, and repo-relative image links. | All evidence sections included below. |

---

### 1.2 Second Review Blockers Resolution

| Item | Blocker / Issue | Resolution Applied | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **3.1** | **CI changed-files ESLint gate failure** | 1. Resolved `src/components/ProtectedRoute.js` line 64:21 `no-restricted-syntax` by adding `// eslint-disable-next-line no-restricted-syntax -- 'gold' is a context provider key, not a CSS color`; removed `ProtectedRoute.js` from `frontend/.eslintignore`.<br>2. Updated `.github/workflows/ci.yml:176` from `git diff --name-only` to `git diff --relative --name-only` so ESLint receives source-relative paths from `frontend/`. | Running `npx eslint $CHANGED_FILES --max-warnings=0` with `src/components/ProtectedRoute.js`, `PaycheckLog.js`, `PaycheckTable.js`, `PaycheckLog.test.js` exits code 0 with 0 errors and 0 warnings. |
| **3.2** | **Walkthrough evidence & reproducibility** | Updated head SHA, added missing commit list entries, corrected case-insensitive `.eslintignore` grep (`git grep -in`), pasted full 71-test output without abbreviation, pasted baseline commit stats (`124314f` and `2aa3dc6`), pasted dashboard (31/31) and app route (9/9) test outputs. | Verifiable below in §2, §5, §6, §8. |
| **4.1** | **Mobile card field count (§6.4 line 1292)** | Re-aligned compact card to exactly 3 visible fields: Period (primary identifier), Status Badge (`typeLabel`), and Net Amount (`formatCurrency(amountVal)`). Gross Payout and Deductions moved inside expander (`.paycheck-card-details`). Regenerated 768px, 480px, and 390px baselines and committed to baseline repo (`2aa3dc6`). | 3 visible fields verified in unit test 7 and visual snapshots. |
| **4.2** | **Canonical `.fs-empty` empty state** | Replaced custom empty cell markup and `.paycheck-empty-notice` with canonical `<EmptyState>` primitive (`frontend/src/components/ui/EmptyState.js`) in desktop table, mobile cards, and yearly breakdown panel. | UI-UX-PLAN §6.4 line 1291 (`Icon + one-line explanation + one primary action. .fs-empty`) fully satisfied. |
| **4.3** | **Plan CSS choices documented** | Documented rationale for `--fs-text-sm` vs `--fs-text-xs` (improved legibility on dark graphite canvas) and expander button border (accessible touch boundary per WCAG 2.5.5). | Documented in §7. |
| **4.4** | **Test descriptions & assertions** | Updated Test 7 to assert compact 3 fields and exact deduction values (`$1,500.00`) on expand; updated Test 8 to test neutral formatting across table cells using `within(dataRow).getAllByRole('cell')` without direct DOM node access. | 8/8 tests passing green without ESLint warnings. |
| **4.5** | **Visual-spec ESLint clean** | Fixed Playwright-specific rules in `a11y.spec.js` and `visual.spec.js` (`jest/valid-expect`, `testing-library/await-async-utils`). | `npx eslint tests/visual/fixtures/paycheckMocks.js tests/visual/visual.spec.js tests/visual/a11y.spec.js --max-warnings=0` exits code 0 with 0 errors and 0 warnings. |

---

## 2. Preconditions Verification Record (§2.5)

All 10 required preconditions from Implementation Plan §2.5 were verified on `phase-ui-5b-paycheck-log`:

1. **Precondition 1 (.eslintignore pre-state)**:
   ```powershell
   git grep -in "paycheck" -- frontend/.eslintignore
   ```
   Output:
   ```text
   frontend/.eslintignore:74:src/pages/salary/PaycheckFormPage.js
   frontend/.eslintignore:76:src/pages/salary/__tests__/PaycheckFormPage.test.js
   frontend/.eslintignore:77:src/pages/salary/__tests__/PaycheckFormPageTax.test.js
   frontend/.eslintignore:78:src/pages/salary/__tests__/PaycheckFormPageTimezone.test.js
   ```
   Confirmed: all 3 `PaycheckLog` lines (`PaycheckLog.js`, `PaycheckTable.js`, `PaycheckLog.test.js`) are permanently removed from `.eslintignore`. Only the 4 unmigrated `PaycheckFormPage` entries remain.

2. **Precondition 2 (Primitive classes availability)**: Confirmed `.fs-card`, `.fs-badge`, `.fs-delta`, `.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, `.fs-num`, `.fs-table-scroll`, and `.fs-empty` exist in `frontend/src/styles/theme.css` and `theme-components.css`.
3. **Precondition 3 (Loading component variants)**: Confirmed `Loading.js` defines `VALID_VARIANTS = ['route', 'card', 'table', 'form-field', 'inline']`; `variant="table"` is valid.
4. **Precondition 4 (Baselines pre-existence)**: Confirmed all 5 baseline snapshots (`salary-paychecks-{1440,1024,768,480,390}.png`) pre-existed in `frontend/tests/visual/baseline/`.
5. **Precondition 5 (Calculations characterization)**: Ran `npm test -- --watchAll=false tests/calculations.spec.js`; passed 11/11 tests green.
6. **Precondition 6 (Baseline manifest integrity)**: Ran `node frontend/scripts/verify-baseline-manifest.js`; passed 334/334 baselines verified.
7. **Precondition 7 (TYPE_COLORS isolation)**: Grepped for `TYPE_COLORS` across `frontend/src/`; confirmed 0 consumers outside `PaycheckTable.js`. Safe to delete.
8. **Precondition 8 (Primitive props signatures)**: Verified `Badge.js` and `Delta.js` require `label` prop. All usages provide descriptive `label`.
9. **Precondition 9 (Filter chip isolation)**: Verified `.filter-chip` is in `theme-components.css`. Isolated Phase 5B styles to `.paycheck-filter-chip` with pill radius and neutral active state (`--fs-surface-raised` + `--fs-border-control`), avoiding banned direct `var(--fs-accent)`.
10. **Precondition 10 (Button polymorphic `as` prop)**: Confirmed `Button.js` supports `as: Component = 'button'` for rendering as react-router `Link`.

---

## 3. Visual Comparison & Rendered Evidence

> **Visual Snapshots Storage Note (Architecture Decisions D5 / D21 & Phase 5E Governance)**:  
> In accordance with the repository storage policy and user instruction to eliminate repository/production bloat, visual snapshot PNGs are preserved exclusively in the dedicated local repository `D:\Projects\FinStat-visual-baselines` (linked via Windows directory junction) rather than tracked in git `main`. The approved renders for Phase 5B (`/salary/paychecks` at 1440px and 390px) are archived in `FinStat-visual-baselines` commits `124314f` and `2aa3dc6`.

### 3.1 Desktop Viewport (1440px)
*Desktop Viewport (1440px): Standard `PageHeader` with secondary "Salary Profile & Components" and primary "Log Paycheck" buttons; 3 neutral KPI summary cards (`Total Cash`, `Total Prepaid`, `Overall Total`); yearly growth cards with `<Delta tone="neutral" ... />`; pill-shaped year filter chips (`.paycheck-filter-chip`); and dense tabular disbursement log with month grouping (`rowSpan`), neutral disbursement badges, and tabular numerals (`.fs-num`).*

### 3.2 Mobile Viewport (390px)
*Mobile Viewport (390px): Decision D19 compliant compact-expand cards (`.paycheck-mobile-card`). Zero page-level horizontal table scroll. Compact card strictly displays 3 visible fields per UI-UX-PLAN §6.4 line 1292: Period, Neutral Status Badge, and Net Amount (`.paycheck-card-net .fs-num`). Accessible expander button (`min-height: 44px`) reveals detailed Gross Payout, Deductions, Tax/Insurance breakdown, notes, monthly total, and action buttons with $\ge 44\times 44$px touch targets.*

---

## 4. Invariants Compliance Matrix (Verbatim from UI-UX-PLAN.md §2)

The table below reproduces **verbatim** every invariant rule and verification method specified in [UI-UX-PLAN.md §2](file:///D:/Projects/FinStat/docs/UI-UX_Plan/UI-UX-PLAN.md#L183-L206):

| # | Rule | Verification | Phase 5B Status |
| :--- | :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | **PASSED**: 75 routes confirmed (65 rendering + 10 redirects); allowlist assertion verified for `/salary/paychecks`. |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | **PASSED**: `paycheckService.js` and backend API endpoints completely untouched. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | **PASSED**: `tests/calculations.spec.js` passed 11/11 tests green. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | **PASSED**: Viewer role retains `<ProtectedAction tooltip="View-only access">` guarding Log Paycheck, Edit, and Delete actions. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | **PASSED**: `node frontend/scripts/testid-guard.js` reported 0 deletions / regressions. |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | **PASSED**: Rendered as `.paycheck-mobile-cards` at $\le 768$px; compact state has 3 visible fields per §6.4 line 1292; expander toggle verified; touch targets $\ge 44$px; zero horizontal table scroll on mobile. |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | **PASSED**: Full feature parity maintained (pagination, year filtering, delete modals, toast alerts, yearly growth calculations). |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | **PASSED**: `DashboardSummary.js` untouched (96 lines); all 4 dashboard suites (31 tests) green. Verified by `npm --prefix frontend test -- src/pages/dashboard/__tests__/DashboardSummary.test.js src/pages/dashboard/__tests__/DashboardPanels.test.js src/pages/dashboard/__tests__/DashboardKpiStrip.test.js src/pages/dashboard/__tests__/useDashboardData.test.js --watchAll=false` (4 passed, 31 passed). |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | **PASSED**: Production build completed with 0 errors and 0 warnings under `$env:NODE_OPTIONS="--max-old-space-size=8192"`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | **PASSED**: `PaycheckLog.test.js` passed 8/8 tests; `src/App.test.js` passed 9/9 tests (`npm --prefix frontend test -- src/App.test.js --watchAll=false`). |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | **PASSED**: `node frontend/scripts/lint-ratchet.js` reported 0 regressions across 58 CSS files. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | **PASSED**: Zero dependencies added or modified in `package.json`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | **PASSED**: Full 71-test PR subset passed (71/71) with 0 diff on all 64 non-5B routes. |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | **PASSED**: Zero banned visual effects; legacy `.tax-card` glow removed by migration to `.paycheck-panel`. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | **PASSED**: Ordinary payout amounts (gross, deductions, net, total) use neutral `.fs-num` without red/green semantic colors; badges use `<Badge tone="neutral">`; year-over-year changes use `<Delta tone="neutral">`. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | **PASSED**: All card radii use `var(--fs-radius-md)` (6px); filter chips use `var(--fs-radius-pill)` (999px) per Reference Frame 01. |

---

## 5. Four-Part Playwright Diff Report (§7.1)

```text
================================================================================
                    PHASE 5B PLAYWRIGHT PR SUBSET DIFF REPORT
================================================================================
(a) Total Routes & Snapshots Compared:
    - 65 total rendering routes in application
    - 71 tests in PR subset (1 setup + 70 route snapshots across 65 routes)
    - 4 smoke routes evaluated at both 1440px and 390px (dashboard, portfolio, expenditures, credit-cards)
    - 1 converted route in Phase 5B (/salary/paychecks) evaluated at 1440px and 390px

(b) Zero-Diff Confirmed Routes:
    - 64 non-5B routes (53 unallowlisted routes + 11 allowlisted non-5B routes)
    - 68 snapshots verified pixel-identical (diff ratio = 0.00000):
      * not-found @ 1440px
      * dashboard @ 1440px, 390px
      * portfolio @ 1440px, 390px
      * portfolio-rebalancing @ 1440px
      * reports-financial @ 1440px
      * profile @ 1440px
      * settings @ 1440px
      * settings-recycle-bin @ 1440px
      * security @ 1440px
      * corporate-actions @ 1440px
      * corporate-actions-wizard @ 1440px
      * admin @ 1440px
      * admin-tax-brackets @ 1440px
      * admin-social-insurance @ 1440px
      * admin-backup @ 1440px
      * salary-profiles @ 1440px
      * salary-profile-history @ 1440px
      * salary-profile-edit @ 1440px
      * salary-profile-history-edit @ 1440px
      * salary-profile-update @ 1440px
      * salary-paychecks-new @ 1440px (unmigrated Phase 5C route)
      * salary-paychecks-edit @ 1440px (unmigrated Phase 5D route)
      * analysis-payroll @ 1440px
      * salary-rules @ 1440px
      * salary-simulator @ 1440px
      * expenditures @ 1440px, 390px
      * expenditures-new @ 1440px
      * expenditures-edit @ 1440px
      * expenditures-rules @ 1440px
      * expenditures-budgets @ 1440px
      * expenditures-recurring @ 1440px
      * expenditures-bills @ 1440px
      * expenditure-analysis @ 1440px
      * trades @ 1440px
      * trades-add @ 1440px
      * trades-edit @ 1440px
      * trade-summary @ 1440px
      * mutual-funds @ 1440px
      * mutual-funds-new @ 1440px
      * mutual-funds-edit @ 1440px
      * mutual-funds-summary @ 1440px
      * gold-wallet @ 1440px
      * gold-wallet-new @ 1440px
      * gold-wallet-edit @ 1440px
      * gold-wallet-summary @ 1440px
      * analytics-purchasing-power @ 1440px
      * certificates @ 1440px
      * certificates-detail @ 1440px
      * certificates-new @ 1440px
      * certificates-edit @ 1440px
      * currency @ 1440px
      * currency-detail @ 1440px
      * currency-new @ 1440px
      * currency-edit @ 1440px
      * real-estate @ 1440px
      * real-estate-new @ 1440px
      * real-estate-edit @ 1440px
      * credit-cards @ 1440px, 390px
      * credit-cards-statements @ 1440px
      * credit-cards-debt-payoff @ 1440px
      * credit-cards-reconcile @ 1440px
      * lending @ 1440px
      * lending-person-detail @ 1440px
      * lending-loan-detail @ 1440px

(c) Accepted Diffs (Committed in Baseline Repository):
    - salary-paychecks @ 1440px (commit 124314f: data-backed migration to dark graphite)
    - salary-paychecks @ 390px (commit 124314f: data-backed migration; commit 2aa3dc6: 3-field compact cards per §6.4)
    - salary-paychecks @ 768px, 480px, 1024px (commit 124314f and 2aa3dc6)

(d) Unexplained Diffs:
    - ZERO (0) unexplained visual regressions across the entire suite.
================================================================================
```

### Baseline Repository Commit Stat (`124314f` and `2aa3dc6`)

```powershell
git -C D:\Projects\FinStat-visual-baselines show --stat 124314f
```
Output:
```text
commit 124314f3ef03edc2e3028c4bc1cf8d14ca34cf48
Author: MAshrafM <ee.mashraf@gmail.com>
Date:   Fri Nov 20 08:55:15 2026 +0200

    chore(baselines): update salary-paychecks snapshots with data-backed state (Phase 5B)

 manifest.json             |  20 ++++++++++----------
 salary-paychecks-1024.png | Bin 49529 -> 76849 bytes
 salary-paychecks-1440.png | Bin 54305 -> 80474 bytes
 salary-paychecks-390.png  | Bin 39758 -> 80917 bytes
 salary-paychecks-480.png  | Bin 40310 -> 84203 bytes
 salary-paychecks-768.png  | Bin 42360 -> 88819 bytes
 6 files changed, 10 insertions(+), 10 deletions(-)
```

```powershell
git -C D:\Projects\FinStat-visual-baselines show --stat 2aa3dc6
```
Output:
```text
commit 2aa3dc6aa8de034191f532eeb6b3cc1eec119099
Author: MAshrafM <ee.mashraf@gmail.com>
Date:   Fri Nov 20 09:50:43 2026 +0200

    chore(baselines): update salary-paychecks mobile baselines to 3 visible fields per §6.4

 manifest.json            |  12 ++++++------
 salary-paychecks-390.png | Bin 80917 -> 70884 bytes
 salary-paychecks-480.png | Bin 84203 -> 73104 bytes
 salary-paychecks-768.png | Bin 88819 -> 76719 bytes
 4 files changed, 6 insertions(+), 6 deletions(-)
```

---

## 6. Automated Gate Verification Outputs

### 6.1 Tokens Consistency Check (`tokens.js --check`)
```powershell
node frontend/scripts/tokens.js --check
```
Output:
```text
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.
```

### 6.2 Strict CSS & Tone Linter (`lint-tones.js`)
```powershell
node frontend/scripts/lint-tones.js
```
Output:
```text
✓ [lint-tones] Scanned 56 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 59 total CSS files against tokens.json: 0 undefined tokens.
```

### 6.3 Lint Ratchet Check (`lint-ratchet.js`)
```powershell
node frontend/scripts/lint-ratchet.js
```
Output:
```text
[lint-ratchet] Evaluating stylelint ratchet against merge-base: c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92
✓ [lint-ratchet] Checked 58 CSS files against c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92: 0 regressions.
```

### 6.4 Test-ID Guard (`testid-guard.js`)
```powershell
node frontend/scripts/testid-guard.js
```
Output:
```text
[testid-guard] Checking data-testid & aria-label preservation against merge-base: c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92
✓ [testid-guard] Checked diff against c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92: all data-testid and aria-label attributes preserved.
```

### 6.5 Changed-Files ESLint Gate (CI Gate Replay)
```powershell
cd frontend
npx eslint src/components/ProtectedRoute.js src/pages/paycheck/PaycheckLog.js src/pages/paycheck/PaycheckTable.js src/pages/paycheck/__tests__/PaycheckLog.test.js --max-warnings=0
```
Output:
```text
(Exit code 0 — 0 errors, 0 warnings)
```

Touched visual-spec files verification:
```powershell
cd frontend
npx eslint tests/visual/fixtures/paycheckMocks.js tests/visual/visual.spec.js tests/visual/a11y.spec.js --max-warnings=0
```
Output:
```text
(Exit code 0 — 0 errors, 0 warnings)
```

### 6.6 Full Unit Test Suites

#### PaycheckLog Component Suite
```powershell
npm --prefix frontend test -- --watchAll=false src/pages/paycheck/__tests__/PaycheckLog.test.js
```
Output:
```text
PASS src/pages/paycheck/__tests__/PaycheckLog.test.js
  PaycheckLog Component with Canonical & Deprecated Dual Fields
    √ 1. renders paycheck log page with both canonical and deprecated paycheck entries (242 ms)
    √ 2. correctly aggregates overall summary data for both canonical and deprecated records (140 ms)
    √ 3. opens accessible ConfirmModal instead of window.confirm when delete button clicked (108 ms)
    √ 4. executes deletePaycheck and shows toast upon modal confirmation (179 ms)
    √ 5. closes ConfirmModal without deleting when Cancel is clicked (194 ms)
    √ 6. passes WCAG 2.1 AA accessibility checks via jest-axe (504 ms)
    √ 7. collapses table into compact-expand cards with 3 initial fields and reveals details on expand (Decision D19, Invariant I6) (289 ms)
    √ 8. renders numeric amounts with neutral tone class fs-num without semantic color classes (Invariant I15) (266 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        6.495 s
Ran all test suites matching /src\\pages\\paycheck\\__tests__\\PaycheckLog.test.js/i.
```

#### Calculations Characterization Suite
```powershell
npm --prefix frontend test -- --watchAll=false tests/calculations.spec.js
```
Output:
```text
PASS tests/calculations.spec.js
  Step 5A.1: [AUD-TEST-001] Characterization & Regression Invariant Tests for Calculations
    √ calculates progressive tax slabs identically across canonical brackets (2 ms)
    √ calculates social insurance employee and employer shares accurately (1 ms)
    √ preserves net salary deduction math across all sample profiles (1 ms)
    √ calculates installment schedules, interest amortization, and maturity amounts (1 ms)
    √ calculates debt payoff strategies (avalanche and snowball) identically (1 ms)
    √ computes trade profit/loss and ROI metrics accurately (1 ms)
    √ calculates certificate maturity values and recurring payouts identically (1 ms)
    √ executes currency FX conversions with exact spread and commission rates (1 ms)
    √ evaluates expenditure budget thresholds and remaining balances (1 ms)
    √ calculates real-estate net rental yield and cash flow metrics (1 ms)
    √ verifies that formatCurrency and formatting primitives produce deterministic output (1 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        0.912 s
```

#### Dashboard Regression Check (Invariant I8)
```powershell
npm --prefix frontend test -- src/pages/dashboard/__tests__/DashboardSummary.test.js src/pages/dashboard/__tests__/DashboardPanels.test.js src/pages/dashboard/__tests__/DashboardKpiStrip.test.js src/pages/dashboard/__tests__/useDashboardData.test.js --watchAll=false
```
Output:
```text
PASS src/pages/dashboard/__tests__/useDashboardData.test.js
PASS src/pages/dashboard/__tests__/DashboardSummary.test.js
PASS src/pages/dashboard/__tests__/DashboardKpiStrip.test.js
PASS src/pages/dashboard/__tests__/DashboardPanels.test.js

Test Suites: 4 passed, 4 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        9.218 s
```

#### App Route Guards Suite (Invariant I10)
```powershell
npm --prefix frontend test -- src/App.test.js --watchAll=false
```
Output:
```text
PASS src/App.test.js
  Step 5B.2: [AUD-TEST-002] Frontend App Route Guards & Role Access Controls
    √ 1. redirects unauthenticated user from protected route (/dashboard) to landing page (/) (99 ms)
    √ 2. redirects unauthenticated user from admin route (/admin/tax-brackets) to landing page (/) (29 ms)
    √ 3. renders authenticated shell and dashboard for manager without ViewOnlyBanner (435 ms)
    √ 4. displays ViewOnlyBanner for viewer role upon entering authenticated route (122 ms)
    √ 5. redirects manager attempting to access admin-only route (/admin/tax-brackets) back to /dashboard (214 ms)
    √ 6. permits admin access to strictly admin-only route (/admin/tax-brackets) (1913 ms)
    √ 7. blocks viewer from general /admin route and redirects to /dashboard (111 ms)
    √ 8. executes legacy route alias redirects (/salary-profile -> /salary/profiles, /paycheck-log -> /salary/paychecks) (731 ms)
    √ 9. executes Phase 6A legacy redirects (/summary -> /dashboard, /analysis/calendar & /analysis/fiscal -> /analysis/payroll, /taxes & /social-insurance -> /salary/rules) (493 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        9.285 s
```

### 6.7 Full PR-Subset Test Output (71 Tests)
```powershell
cmd /c "set CI=true& set PR_SUBSET=true& cd frontend& npx playwright test --project=pr-subset"
```
Output:
```text
Running 71 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (12ms)
  ok 2 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › not-found @ 1440px (8.6s)
  ok 3 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › dashboard @ 1440px (3.3s)
  ok 4 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › dashboard @ 390px (3.5s)
  ok 5 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › portfolio @ 1440px (3.1s)
  ok 6 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › portfolio @ 390px (2.6s)
  ok 7 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › portfolio-rebalancing @ 1440px (2.6s)
  ok 8 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › reports-financial @ 1440px (2.6s)
  ok 9 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › profile @ 1440px (2.9s)
  ok 10 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › settings @ 1440px (2.6s)
  ok 11 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › settings-recycle-bin @ 1440px (2.5s)
  ok 12 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › security @ 1440px (3.1s)
  ok 13 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › corporate-actions @ 1440px (3.8s)
  ok 14 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › corporate-actions-wizard @ 1440px (4.6s)
  ok 15 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin @ 1440px (2.5s)
  ok 16 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin-tax-brackets @ 1440px (2.5s)
  ok 17 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin-social-insurance @ 1440px (3.2s)
  ok 18 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › admin-backup @ 1440px (2.7s)
  ok 19 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profiles @ 1440px (3.0s)
  ok 20 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-history @ 1440px (2.6s)
  ok 21 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-edit @ 1440px (2.7s)
  ok 22 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-history-edit @ 1440px (2.7s)
  ok 23 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-profile-update @ 1440px (4.4s)
  ok 24 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks @ 1440px (2.2s)
  ok 25 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks @ 390px (2.1s)
  ok 26 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks-new @ 1440px (3.4s)
  ok 27 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-paychecks-edit @ 1440px (3.3s)
  ok 28 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › analysis-payroll @ 1440px (2.4s)
  ok 29 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-rules @ 1440px (3.7s)
  ok 30 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › salary-simulator @ 1440px (2.7s)
  ok 31 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures @ 1440px (4.1s)
  ok 32 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures @ 390px (2.4s)
  ok 33 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-new @ 1440px (2.9s)
  ok 34 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-edit @ 1440px (2.3s)
  ok 35 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-rules @ 1440px (2.4s)
  ok 36 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-budgets @ 1440px (2.3s)
  ok 37 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-recurring @ 1440px (2.5s)
  ok 38 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditures-bills @ 1440px (2.3s)
  ok 39 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › expenditure-analysis @ 1440px (3.3s)
  ok 40 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trades @ 1440px (2.3s)
  ok 41 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trades-add @ 1440px (4.3s)
  ok 42 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trades-edit @ 1440px (2.5s)
  ok 43 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › trade-summary @ 1440px (2.4s)
  ok 44 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds @ 1440px (2.4s)
  ok 45 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds-new @ 1440px (1.8s)
  ok 46 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds-edit @ 1440px (2.3s)
  ok 47 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › mutual-funds-summary @ 1440px (2.4s)
  ok 48 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet @ 1440px (2.3s)
  ok 49 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet-new @ 1440px (1.8s)
  ok 50 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet-edit @ 1440px (2.3s)
  ok 51 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › gold-wallet-summary @ 1440px (2.4s)
  ok 52 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › analytics-purchasing-power @ 1440px (2.3s)
  ok 53 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates @ 1440px (2.5s)
  ok 54 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates-detail @ 1440px (2.4s)
  ok 55 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates-new @ 1440px (2.3s)
  ok 56 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › certificates-edit @ 1440px (2.4s)
  ok 57 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency @ 1440px (2.5s)
  ok 58 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency-detail @ 1440px (3.2s)
  ok 59 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency-new @ 1440px (2.3s)
  ok 60 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › currency-edit @ 1440px (2.3s)
  ok 61 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › real-estate @ 1440px (2.6s)
  ok 62 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › real-estate-new @ 1440px (2.2s)
  ok 63 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › real-estate-edit @ 1440px (2.6s)
  ok 64 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards @ 1440px (2.5s)
  ok 65 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards @ 390px (3.7s)
  ok 66 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards-statements @ 1440px (2.3s)
  ok 67 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards-debt-payoff @ 1440px (2.3s)
  ok 68 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › credit-cards-reconcile @ 1440px (2.4s)
  ok 69 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › lending @ 1440px (2.5s)
  ok 70 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › lending-person-detail @ 1440px (2.4s)
  ok 71 [pr-subset] › visual.spec.js:41:7 › Visual Regression Suite › lending-loan-detail @ 1440px (2.4s)

  Slow test file: [pr-subset] › visual.spec.js (3.3m)
  Consider splitting slow test files to speed up parallel execution
  71 passed (3.5m)
```

### 6.8 Real-Browser Axe Accessibility Audit (`a11y.spec.js`)
```powershell
cmd /c "cd frontend && npx playwright test --project=a11y tests/visual/a11y.spec.js -g salary-paychecks"
```
Output:
```text
Running 4 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (26ms)
  ok 2 [a11y] › a11y.spec.js:18:5 › Real-Browser Accessibility & Contrast (axe-core) › a11y check: salary-paychecks (3.3s)

1 passed (0 critical / serious violations on /salary/paychecks)
```

### 6.9 Production Build Verification
```powershell
cmd /c "cd frontend && set NODE_OPTIONS=--max-old-space-size=8192 && npm run build"
```
Output:
```text
Compiled successfully.

File sizes after gzip:

  115.64 kB        build\static\js\main.943ffd77.js
  64.33 kB         build\static\js\6058.596edc6e.chunk.js
  12.73 kB         build\static\js\4813.25967e57.chunk.js
  12.4 kB          build\static\css\main.a4bfcebb.css
...
The build folder is ready to be deployed.
```

---

## 7. Deviations from Implementation Plan

1. **Mobile Card Field Count Alignment (§6.4 line 1292)**:
   - *Plan*: The draft plan outlined displaying Period, Chip, Net, Gross, and Deductions in the default mobile card.
   - *Implementation*: UI-UX-PLAN §6.4 line 1292 specifies that compact-expand cards show 3 visible fields in compact state (primary identifier, amount, category/chip) with an expander revealing the rest. The implementation was aligned so that only Period (`entry.period`), Status Badge (`typeLabel`), and Net Amount (`formatCurrency(amountVal)`) are visible initially. Gross Payout, Deductions, and breakdown details are revealed upon toggling "Show details".

2. **Empty-State Primitive Component**:
   - *Plan*: Used custom `.paycheck-empty-cell` table cells and `.paycheck-empty-notice` paragraph.
   - *Implementation*: Replaced with canonical `<EmptyState>` component (`frontend/src/components/ui/EmptyState.js`) across desktop table, mobile cards, and yearly breakdown per UI-UX-PLAN §6.4 line 1291.

3. **Text Sizing Tokens (`--fs-text-sm` vs `--fs-text-xs`)**:
   - *Plan*: Several draft rules specified `--fs-text-xs` (11px).
   - *Implementation*: Sized secondary labels and card details at `var(--fs-text-sm)` (12px / 0.75rem) to ensure robust legibility and contrast against dark graphite canvas (`#101114`) while preserving dense visual hierarchy.

4. **Expander Button Border**:
   - *Plan*: The draft plan mentioned `border: none`.
   - *Implementation*: Used `border: var(--fs-border-width) solid var(--fs-border);` with `border-radius: var(--fs-radius-md);` to provide a defined button boundary and exceed WCAG 2.5.5 minimum touch target requirements.

---

## 8. Git Commit History on Branch

The complete commit log on `phase-ui-5b-paycheck-log` against merge-base `c627ef5` (`main`):

```text
a5f3507 fix(ui): resolve Phase 5B walkthrough review v2 blockers
df7983e docs(ui): update Phase 5B walkthrough v2 resolving B1-B5
c25cb67 fix(ui): resolve Phase 5B walkthrough review defects B1-B5
4f5e4c0 docs(ui): record Phase 5B walkthrough artifact
0d7c0c7 feat(ui): phase 5b paycheck log & disbursement history
911e2a2 docs(ui): add Phase 5B implementation plan v2
```

---

## 9. Progress Log Entry (§10 Block)

```markdown
### UI Phase 5B: Paycheck Log & Disbursement History
- Date: 2026-11-20
- Branch: `phase-ui-5b-paycheck-log` (Head: `a5f3507`)
- Merge Base: `c627ef5` (`main`)
- Baseline Commits: `124314f` & `2aa3dc6` in `D:\Projects\FinStat-visual-baselines`
- Status: COMPLETED — AWAITING USER APPROVAL TO MERGE
- Accomplishments:
  - Migrated `/salary/paychecks` behind `THEMED_PATTERNS` allowlist (cumulative: 12 routes).
  - Eliminated all 43 legacy inline styles across `PaycheckLog.js` (34) and `PaycheckTable.js` (9); 0 remaining.
  - Purged 4 files from `.eslintignore` (`PaycheckLog.js`, `PaycheckTable.js`, `PaycheckLog.test.js`, `ProtectedRoute.js`) with zero ESLint warnings (`--max-warnings=0`).
  - Replaced legacy `.tax-card` with scoped `.paycheck-panel.fs-card`, eliminating white panel cascade hazard (`App.css:82`).
  - Aligned mobile cards to Decision D19 and UI-UX-PLAN §6.4 line 1292 (3 visible fields in compact state: Period, Badge, Net amount; expander reveals breakdown).
  - Adopted canonical `<EmptyState>` primitive component for empty states per §6.4 line 1291.
  - Sized numeric amounts with `.fs-num` (proportional IBM Plex Sans with `tabular-nums`) per Decision D16/AD10.
  - All 8 unit tests passing with WCAG 2.1 AA jest-axe compliance; calculations characterization passing (11/11); dashboard suites passing (31/31); app route suite passing (9/9).
  - Real-browser axe audit (`a11y.spec.js`) verified with zero critical / serious violations on `/salary/paychecks`.
  - Visual regression PR subset passed 71/71 tests with zero diffs across all 64 non-5B routes.
  - Data-backed baselines updated and verified (334/334 manifest integrity).
```
