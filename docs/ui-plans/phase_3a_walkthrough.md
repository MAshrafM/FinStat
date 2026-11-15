# Walkthrough — UI Phase 3A: Chart Theme and Dashboard Conversion (v2 — Fully Resolved)

**Status:** Completed & Rigorously Verified  
**Branch:** `phase-ui-3a-dashboard`  
**Governing Documents:**  
- `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.7, §4.12, §4.3, §8.4, §4.5 (Typography & D16), §6.6 (AD1–AD13)
- Canonical Reference Frame 03 (`docs/UI-UX_Plan/reference/03-dashboard.html`)
- Plan Amendment D16 (Proportional figures with tabular numerals; Plex Mono reserved for identifiers)
- Plan Amendment D22 (Constraint 3: Accent `#14b8a6` strictly banned as chart series)
- Plan Amendment D23 (Universal loading primitive)
- Implementation Plan v3.1 (`docs/ui-plans/phase_3a_implementation_plan.md`)

---

## Executive Summary

Phase 3A converts the primary FinStat dashboard (`/dashboard`) from legacy glowing multi-gradient cards into a unified, flat dark graphite command center adhering to Canonical Reference Frame 03. All 12 required deliverables and verification checks, plus all 9 blocking review items, have succeeded without exceptions or regressions.

---

## 1. Core Verification Suite Outputs

### 1.1 Token Drift Check (`tokens.js --check`)
```bash
$ node frontend/scripts/tokens.js --check
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.
```

### 1.2 Tone Scoping & Undefined Token Check (`lint-tones.js`)
```bash
$ node frontend/scripts/lint-tones.js
✓ [lint-tones] Scanned 57 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 60 total CSS files against tokens.json: 0 undefined tokens.
```

### 1.3 Stylelint Ratchet Check (`lint-ratchet.js`)
```bash
$ node frontend/scripts/lint-ratchet.js
[lint-ratchet] Evaluating stylelint ratchet against merge-base: 86a9b2bcec062c68add9de57c2b6c192d43bd963
✓ [lint-ratchet] Checked 59 CSS files against 86a9b2bcec062c68add9de57c2b6c192d43bd963: 0 regressions.
```

### 1.4 Stylelint Per-File Verification (`Dashboard.css` & `theme-components.css`)
```bash
$ npx --prefix frontend stylelint "frontend/src/pages/Dashboard.css"
# Exit code 0 (0 errors, 0 warnings)

$ npx --prefix frontend stylelint "frontend/src/styles/theme-components.css"
# Exit code 0 (0 errors, 0 warnings)
```

### 1.5 Test ID and Accessibility Guard (`testid-guard.js`)
```bash
$ node frontend/scripts/testid-guard.js
[testid-guard] Checking data-testid & aria-label preservation against merge-base: 86a9b2bcec062c68add9de57c2b6c192d43bd963
✓ [testid-guard] Checked diff against 86a9b2bcec062c68add9de57c2b6c192d43bd963: all data-testid and aria-label attributes preserved.
```

### 1.6 Production & Test File Linting (`eslint` Across All 5 Modified Paths)
```bash
$ Set-Location frontend; npx eslint src/styles/chartTheme.js src/styles/__tests__/chartTheme.test.js src/pages/Dashboard.js src/pages/DashboardSummary.js src/pages/dashboard/*.js src/pages/dashboard/__tests__/*.js src/components/ui/Button.js src/components/ui/__tests__/Button.test.js --max-warnings=0
# Exit code 0 (0 errors, 0 warnings)
```

### 1.7 Production Build (`CI=true npm run build`)
```bash
$ $env:CI="true"; npm --prefix frontend run build
Creating an optimized production build...
Compiled successfully.
File sizes after gzip:
  113.91 kB (-1 B)  build\static\js\main.14ff6431.js
  ...
```

### 1.8 Full Unit Test Suite Results
```bash
$ $env:CI="true"; npm --prefix frontend test -- --watchAll=false
Test Suites: 60 passed, 60 total
Tests:       387 passed, 387 total
Snapshots:   0 total
Time:        55.053 s
```
All 10 dashboard test suites (74 tests) and `chartTheme.test.js` (7 tests) pass 100%.

---

## 2. Invariant I8 Line Count Evidence

Invariant I8 dictates that coordinator page components must not exceed 120 lines of code.

```powershell
PS D:\Projects\FinStat> (Get-Content frontend/src/pages/DashboardSummary.js).Count
96
```

`DashboardSummary.js` stands at **96 lines** (well below the 120-line ceiling), delegating all widget logic cleanly to decoupled sub-components.

---

## 3. Reference Frame 03 Visual Comparison & D16 Typography Alignment

Live `/dashboard` rendering was verified against Canonical Reference Frame 03 (`03-dashboard.html`) at 1440px and 390px.

````carousel
![Live Dashboard (1440px)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-3a/dashboard-1440.png)
<!-- slide -->
![Reference Frame 03 (1440px)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-3a/reference-03-dashboard-1440.png)
<!-- slide -->
![Live Dashboard (390px)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-3a/dashboard-390.png)
<!-- slide -->
![Reference Frame 03 (390px)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-3a/reference-03-dashboard-390.png)
````

### Key Visual Alignment Properties Verified:
1. **Flat Graphite Canvas**: Solid `#101114` canvas without gradients or blurs.
2. **Elevated Surfaces**: Graphite `#16181d` card surfaces with clean `#23272f` 1px borders.
3. **D16 Numerical Typography**: Tabular proportional numerals (`IBM Plex Sans` + `tabular-nums` via `.fs-num`) on all KPI values and financial deltas per D16 and §4.5. Monospace (`--fs-font-mono`) is strictly reserved for identifiers (symbols, account numbers, transaction IDs), never for financial currency numerals.
4. **Interactive Teal Accent**: Single interactive teal `#14b8a6` primary action button with `#0d0e10` (`--fs-ink`) text (passing WCAG 2.1 at 10.82:1).

---

## 4. Computed Style Assertions (`dashboard-reference-match.spec.js`) & S2 Font Isolation

Automated Playwright tests in `frontend/tests/visual/dashboard-reference-match.spec.js` validate design tokens and D16/S2 invariants directly on live DOM nodes:

```bash
$ $env:CI="true"; Set-Location frontend; npx playwright test --project=reference
Running 6 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (12ms)
  ok 2 [reference] › dashboard-reference-match.spec.js:20:3 › Dashboard Reference Match (Live /dashboard vs Frame 03) › matches Reference Frame 03 design tokens on live /dashboard (9.2s)
  ok 3 [reference] › dashboard-reference-match.spec.js:91:3 › Dashboard Reference Match (Live /dashboard vs Frame 03) › unthemed route (/trades) has 0 font requests (S2 font isolation) (2.1s)
  ok 4 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 01-dense-table @ 1440px (2.6s)
  ok 5 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 02-form @ 1440px (2.3s)
  ok 6 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 03-dashboard @ 1440px (2.5s)

  6 passed (47.9s)
```

### Verified Computed Style Assertions:
- **Navbar background**: `rgb(12, 13, 15)` (`#0c0d0f`, recessed chrome)
- **Primary button background**: `rgb(20, 184, 166)` (`#14b8a6`, interactive teal accent)
- **Primary button text**: `rgb(13, 14, 16)` (`#0d0e10`, `--fs-ink`)
- **KPI card border-radius**: $\le 8\text{px}$ (ceiling enforced)
- **KPI card background**: `rgb(26, 28, 32)` / `rgb(22, 24, 29)` (`--fs-surface`)
- **Page background**: `rgb(16, 17, 20)` (`#101114`)
- **D16 & §4.5 Typography on `.fs-num`**:
  - `fontFamily`: contains `"IBM Plex Sans"` (proportional, not mono)
  - `fontVariantNumeric`: `"tabular-nums"`
- **CLS (S2 / R22)**: $\le 0.1$ layout shift verified on `/dashboard`
- **S2 Font Isolation**: 0 font requests on unthemed route (`/trades`)

---

## 5. Supporting Playwright Suites

All supporting visual suites executed cleanly with 0 diff:

### 5.1 Shell Visual Suite (`--project=shell`)
```bash
$ $env:CI="true"; Set-Location frontend; npx playwright test --project=shell
Running 7 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (11ms)
  ok 2 [shell] › shell.spec.js:51:3 › Shell Visual Suite (Option A) › shell-legacy-desktop (4.0s)
  ok 3 [shell] › shell.spec.js:56:3 › Shell Visual Suite (Option A) › shell-legacy-mobile (3.5s)
  ok 4 [shell] › shell.spec.js:61:3 › Shell Visual Suite (Option A) › shell-dark-desktop-collapsed (3.1s)
  ok 5 [shell] › shell.spec.js:73:3 › Shell Visual Suite (Option A) › shell-dark-desktop-expanded (2.5s)
  ok 6 [shell] › shell.spec.js:92:3 › Shell Visual Suite (Option A) › shell-dark-mobile-drawer (2.1s)
  ok 7 [shell] › shell.spec.js:105:3 › Shell Visual Suite (Option A) › shell-dark-account-dropdown (5.5s)

  7 passed (33.4s)
```

### 5.2 Shared Components Dual-Mode Suite (`--project=shared`)
```bash
$ $env:CI="true"; Set-Location frontend; npx playwright test --project=shared
Running 10 tests using 1 worker

  ok 1 [shared] › shared-components.spec.js:27:3 › Table: computed styles verify legacy vs .fs-page theme override (2.3s)
  ok 2 [shared] › shared-components.spec.js:53:3 › Form: computed styles verify legacy vs .fs-page theme override (1.6s)
  ok 3 [shared] › shared-components.spec.js:86:3 › Modal: computed styles verify legacy vs theme override (8px ceiling) (1.6s)
  ok 4 [shared] › shared-components.spec.js:114:3 › ConfirmModal: computed styles verify legacy vs theme override (1.8s)
  ok 5 [shared] › shared-components.spec.js:148:3 › SummaryRow & AnalysisCard: computed styles verify theme overrides (1.6s)
  ok 6 [shared] › shared-components.spec.js:174:3 › ComponentTable: computed styles verify theme overrides (1.7s)
  ok 7 [shared] › shared-components.spec.js:198:3 › ViewOnlyBanner: computed styles verify theme overrides and backdrop-filter none (1.4s)
  ok 8 [shared] › shared-components.spec.js:218:3 › ProtectedAction: computed styles verify opacity gating (1.4s)
  ok 9 [shared] › shared-components.spec.js:232:3 › Pagination: computed styles verify theme overrides (1.4s)
  ok 10 [shared] › shared-components.spec.js:256:3 › AppLauncher: computed styles verify theme overrides and backdrop-filter none (1.5s)

  10 passed (27.0s)
```

### 5.3 Primitives Visual Suite (`--project=primitives`)
```bash
$ $env:CI="true"; Set-Location frontend; npx playwright test --project=primitives
Running 4 tests using 1 worker

  ok 1 [primitives] › primitives.spec.js:25:3 › Primitives: computed styles verify design system tokens and anti-slop rules (2.5s)
  ok 2 [primitives] › primitives.spec.js:118:3 › SubNav Dual-Mode: computed styles verify legacy vs .fs-page theme override (1.9s)
  ok 3 [primitives] › primitives.spec.js:164:3 › Tabs Interactive Keyboard Navigation: roving focus trace in both orientations (1.7s)
  ok 4 [primitives] › primitives.spec.js:243:3 › LandingPage: unthemed login spinner renders visible fallback on slow response (2.0s)

  4 passed (18.8s)
```

---

## 6. Token Existence & D22 Multi-Theme Door Confirmation

### 6.1 Chart Grey Tokens in `tokens.json` and `tokens.css`
```powershell
PS D:\Projects\FinStat> Select-String 'fs-chart-grey' frontend/src/styles/tokens.json, frontend/src/styles/tokens.css

frontend\src\styles\tokens.json:39:    "--fs-chart-grey-1": "#8b929b",
frontend\src\styles\tokens.json:40:    "--fs-chart-grey-2": "#b8bec6",
frontend\src\styles\tokens.json:41:    "--fs-chart-grey-3": "#6a7078",
frontend\src\styles\tokens.json:42:    "--fs-chart-grey-4": "#d5d9dd"
frontend\src\styles\tokens.css:30:  --fs-chart-grey-1: #8b929b;
frontend\src\styles\tokens.css:31:  --fs-chart-grey-2: #b8bec6;
frontend\src\styles\tokens.css:32:  --fs-chart-grey-3: #6a7078;
frontend\src\styles\tokens.css:33:  --fs-chart-grey-4: #d5d9dd;
```

### 6.2 Dynamic Computed Style Reader (`chartTheme.js`)
```javascript
export function getChartPalette() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ...DEFAULT_PALETTE };
  }
  const root = getComputedStyle(document.documentElement);
  return {
    grey1: root.getPropertyValue('--fs-chart-grey-1').trim() || DEFAULT_PALETTE.grey1,
    grey2: root.getPropertyValue('--fs-chart-grey-2').trim() || DEFAULT_PALETTE.grey2,
    grey3: root.getPropertyValue('--fs-chart-grey-3').trim() || DEFAULT_PALETTE.grey3,
    grey4: root.getPropertyValue('--fs-chart-grey-4').trim() || DEFAULT_PALETTE.grey4,
    positive: root.getPropertyValue('--fs-positive').trim() || DEFAULT_PALETTE.positive,
    negative: root.getPropertyValue('--fs-negative').trim() || DEFAULT_PALETTE.negative,
    warning: root.getPropertyValue('--fs-warning').trim() || DEFAULT_PALETTE.warning,
  };
}
```

### 6.3 D22 Constraint 3: Banning `#14b8a6` as Chart Series
Accent hex `#14b8a6` is 100% absent from executable code in `chartTheme.js`, verified via static string check and ESLint AST rule:
```powershell
PS D:\Projects\FinStat> Select-String '#14b8a6' frontend/src/styles/chartTheme.js
frontend\src\styles\chartTheme.js:7: * - §4.3.2 Rule 6: Accent #14b8a6 is strictly banned as a chart series
```

---

## 7. Series Cap Compliance (§4.12 & G2)

Per §4.12, doughnut charts must not exceed 4 segments. `AssetAllocationDonut.js` caps items at top 3 and groups the remainder into a 4th "Other" slice:

```javascript
// frontend/src/pages/dashboard/AssetAllocationDonut.js
const MAX_SEGMENTS = 4;
let cappedList = list;
if (list.length > MAX_SEGMENTS) {
  const sorted = [...list].sort((a, b) => b.value - a.value);
  const top3 = sorted.slice(0, 3);
  const otherTotal = sorted.slice(3).reduce((acc, curr) => acc + curr.value, 0);
  cappedList = [
    ...top3,
    {
      key: 'other',
      name: 'Other',
      value: otherTotal,
      viewPath: '#',
    },
  ];
}
```

Verified in Jest (`AssetAllocationDonut.test.js`):
```bash
  Step 8B.1b: AssetAllocationDonut Component Tests [AUD-ARCH-001]
    √ 8. caps doughnut chart segments at <= 4 per §4.12 when holdings exceed 4 (31 ms)
```

---

## 8. Universal Loading Transition (D23)

Universal `<Loading>` indicators (D23) were introduced across both coordinator route loading and `Button` inline loading:

### 8.1 Dashboard Route Skeleton (`DashboardSummary.js`)
```javascript
  if (isLoading) {
    return <Loading variant="route" text="Building your financial overview…" aria-label="Loading dashboard" />;
  }
```

### 8.2 Button Spinner (`Button.js`)
```javascript
  {isLoading && (
    <Loading variant="inline" className="fs-btn-spinner" />
  )}
```

---

## 9. Accepted Diff Register (AD1–AD13)

| ID | Description | Legacy State | Phase 3A Migrated State | Status |
|:---|:---|:---|:---|:---|
| **AD1** | Dark graphite canvas | Radial gradient `#080d18` / `#0c1424` | Solid `--fs-bg` (`#101114`) | Verified |
| **AD2** | Chrome background | Transparent/legacy shell | Recessed `--fs-chrome-bg` (`#0c0d0f`) | Verified |
| **AD3** | Card surface elevation | `#0f172a` + 14px blur | Flat `--fs-surface` (`#16181d`), `border: 1px solid #23272f` | Verified |
| **AD4** | Glassmorphism blur | `backdrop-filter: blur(14px)` | `backdrop-filter: none` (Strictly Banned) | Verified |
| **AD5** | Box shadow glow | `box-shadow: 0 12px 30px rgba(0,0,0,0.28)` | `box-shadow: none` | Verified |
| **AD6** | Radius ceiling | 16px / 18px / 20px / 24px | 8px ceiling (`--fs-radius-lg`), pill for chips only | Verified |
| **AD7** | Single accent CTA | Multiple orange/amber buttons | Single `--fs-accent` button on primary hero CTA | Verified |
| **AD8** | Text on accent | White on amber | `--fs-ink` (`#0d0e10`) on `--fs-accent` (10.82:1 WCAG contrast) | Verified |
| **AD9** | Tabular figures | System sans numbers | Proportional numerals with tabular figures (`IBM Plex Sans` + `.fs-num`, `tabular-nums`) per D16 & §4.5 (Plex Mono reserved for identifiers) | Verified |
| **AD10**| Chart palette | Multi-colored saturation | Neutral greys `--fs-chart-grey-1..4`, semantic positive/negative | Verified |
| **AD11**| Doughnut segment cap | Uncapped slices | Strict $\le 4$ segments with "Other" grouping | Verified |
| **AD12**| Universal loading | Bespoke `.dash-skeleton-grid` | `<Loading variant="route" />` and `<Loading variant="inline" />` | Verified |
| **AD13**| Budget neutral progress | Green progress for all under 100% | Under-80% is neutral grey; warning 80-100%; negative >100% | Verified |

---

## 10. Final `.eslintignore` State Verification

Plan Section 7 item 9 required verifying that `src/pages/dashboard` entries are completely eliminated while preserving only unmigrated dashboard references:

```powershell
PS D:\Projects\FinStat> Select-String -Pattern 'src/pages/dashboard' frontend/.eslintignore | Measure-Object | Select-Object -ExpandProperty Count
0

PS D:\Projects\FinStat> Select-String -Pattern 'dashboard' frontend/.eslintignore

frontend\.eslintignore:24:src/config/dashboardActions.js
frontend\.eslintignore:26:src/pages/admin/AdminDashboard.js
frontend\.eslintignore:63:src/pages/lending/LendingDashboardPage.js
frontend\.eslintignore:74:src/pages/portfolio/PortfolioDashboard.js
```

Exactly the 4 unmigrated routes/configs remain in `.eslintignore`. All 13 dashboard files and tests have been removed and pass ESLint.

---

## 11. Scoped Diff Review & Justification for Additional Files

### 11.1 Scoped Diff (`git diff --name-only main`)
```
docs/ui-plans/phase_3a_implementation_plan.md      # Approved plan v3.1
docs/ui-plans/phase_3a_walkthrough.md              # This walkthrough
docs/ui-plans/visual-3a-log.txt                    # Raw visual regression execution log
frontend/.eslintignore                              # Removed 13 dashboard entries
frontend/playwright.config.js                       # Registered dashboard-reference-match spec
frontend/src/components/ProtectedRoute.js          # Allowlisted /dashboard in THEMED_PATTERNS
frontend/src/components/ui/Button.js                # Migrated isLoading to <Loading variant="inline" />
frontend/src/components/ui/__tests__/Button.test.js  # Updated Button tests for Loading primitive
frontend/src/pages/Dashboard.css                   # Tokenized flat graphite dashboard stylesheet
frontend/src/pages/DashboardSummary.js              # Coordinator component with universal loading
frontend/src/pages/dashboard/AssetAllocationDonut.js# Donut widget with <= 4 segment cap
frontend/src/pages/dashboard/BudgetPulseCard.js     # Neutral-by-default budget progress widget
frontend/src/pages/dashboard/DashboardKpiStrip.js   # KPI cards with tabular numbers
frontend/src/pages/dashboard/HoldingsGrid.js        # Holdings breakdown widget
frontend/src/pages/dashboard/NetWorthHero.js        # Net worth hero card with tokenized typography
frontend/src/pages/dashboard/ReportsGrid.js         # Report launcher cards
frontend/src/pages/dashboard/SavingsForexCard.js    # Savings and forex panel
frontend/src/pages/dashboard/useDashboardData.js    # Data hook cleaned of legacy hex/tone tokens
frontend/src/pages/dashboard/__tests__/*           # All 8 test suites updated and passing
frontend/src/styles/theme-components.css            # Section 11 dashboard semantic tone rules
frontend/src/styles/chartTheme.js                   # Chart theme engine (D22 door-preserving)
frontend/src/styles/__tests__/chartTheme.test.js    # 7 unit tests for chart theme
frontend/tests/visual/dashboard-reference-match.spec.js # Reference match Playwright test
```

### 11.2 Justification for `theme-components.css`
- **Architectural Requirement**: AGENTS.md §3 rule 6 and §4.3.2 rule 1 dictate: *"Page CSS files cannot reference `var(--fs-accent)`, `var(--fs-positive)`, `var(--fs-negative)`, or `var(--fs-warning)`. All tone modifiers must be defined in `theme-components.css` under `.fs-page` / `html[data-fs-theme]`."*
- **Mechanical Linter Enforcement**: `node frontend/scripts/lint-tones.js` scans page CSS files (`Dashboard.css`). If tone tokens are used directly in page CSS, `lint-tones.js` exits with error code 1.
- Moving semantic tone modifiers (`.dash-alert-icon`, `.dash-hero-delta`, `.dash-kpi-sub`, `.dash-delta`, `.dash-budget-pct`, `.dash-budget-track span`, `.dash-savings-value`) into `theme-components.css` Section 11 was required by Invariant I15 and §4.3.2 rule 1.

### 11.3 Justification for `useDashboardData.js`
- **ESLint Requirement**: `useDashboardData.js` is the dedicated data hook for the dashboard. It contained 8 hardcoded hex values (`color: '#f59e0b'`, `color: '#38bdf8'`, etc.) and legacy tone strings.
- Because Section 4.6 unignored `useDashboardData.js` from `.eslintignore`, these raw hex literals immediately triggered ESLint rule `no-restricted-syntax` ("Hex colours are banned outside chartTheme.js and categories.js").
- Cleaning the hardcoded hex literals allowed `useDashboardData.js` to pass ESLint with `--max-warnings=0`.

---

## 12. Invariant I13 Verification (0 Diff Across Legacy Routes) & `not-found` Explanation

### 12.1 Explanation of `not-found` Route Baseline Updates
In `frontend/tests/visual/fixtures/routes.js`, the route definition for `not-found` is:
```javascript
{ path: '*', slug: 'not-found', label: '404 Page' }
```
When `resolvePath('*')` executes, it navigates to `/non-existent-404-fallback`.
In `App.js`:
```javascript
<Route path="*" element={<LandingPage />} />
```
In authenticated sessions (created by `fixtures/auth.setup.js` which populates `localStorage.getItem('token')`), `LandingPage.js` mounts and immediately triggers its auth redirect:
```javascript
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    navigate('/dashboard', { replace: true });
  }
}, [navigate]);
```
As a result, visiting `/non-existent-404-fallback` redirects directly to `/dashboard`. The `not-found-*.png` snapshots in the baseline repository therefore capture the rendered dashboard. When `/dashboard` converted to dark graphite in Phase 3A, both `dashboard-*.png` and `not-found-*.png` legitimately captured the new dark dashboard layout.

The plan (§7 item 7) undercounted the updated baseline count by stating "5 /dashboard files" instead of accounting for the redirect relationship (10 files = 5 dashboard + 5 not-found).

### 12.2 Actual Baseline Byte Changes
```bash
$ git -C D:\Projects\FinStat-visual-baselines diff HEAD~2 HEAD --stat -- not-found-*.png
 not-found-1024.png | Bin 1438323 -> 198884 bytes
 not-found-1440.png | Bin 1353965 -> 180934 bytes
 not-found-390.png  | Bin 1319551 -> 214791 bytes
 not-found-480.png  | Bin 1502232 -> 217279 bytes
 not-found-768.png  | Bin 1368691 -> 225701 bytes
 5 files changed, 0 insertions(+), 0 deletions(-)
```

### 12.3 Diff Classification: 63 Routes at 0 Diff
- **Total visual routes**: 65 routes across 5 viewports = 325 test snapshots (+1 auth setup = 326 tests).
- **Themed routes (legitimate diff)**: 2 routes (10 snapshots) — `dashboard` (5 viewports) and `not-found` (5 viewports, capturing `/dashboard` via auth redirect).
- **Unmigrated legacy routes**: **63 routes** (315 snapshots).
- **Diff across all 63 unmigrated routes**: **0 visual diff** (100% pixel-identical against baselines).

### 12.4 Raw `--project=visual` Output (326 Tests Passed)
Full log saved at `docs/ui-plans/visual-3a-log.txt`.

#### First 20 Tests Execution Trace:
```
Running 326 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (10ms)
  ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (3.9s)
  ok 3 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1024px (3.3s)
  ok 4 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 768px (4.0s)
  ok 5 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 480px (4.8s)
  ok 6 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 390px (4.6s)
  ok 7 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 1440px (3.2s)
  ok 8 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 1024px (4.2s)
  ok 9 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 768px (3.1s)
  ok 10 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 480px (2.9s)
  ok 11 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 390px (3.6s)
  ok 12 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 1440px (3.9s)
  ok 13 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 1024px (2.7s)
  ok 14 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 768px (3.7s)
  ok 15 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 480px (2.6s)
  ok 16 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 390px (2.5s)
  ok 17 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio-rebalancing @ 1440px (2.5s)
  ok 18 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio-rebalancing @ 1024px (4.0s)
  ok 19 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio-rebalancing @ 768px (2.3s)
  ok 20 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio-rebalancing @ 480px (2.3s)
```

#### Last 20 Tests Execution Trace & Suite Summary:
```
  ok 307 [visual] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-reconcile @ 1440px (2.5s)
  ok 308 [visual] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-reconcile @ 1024px (2.4s)
  ok 309 [visual] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-reconcile @ 768px (2.3s)
  ok 310 [visual] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-reconcile @ 480px (2.5s)
  ok 311 [visual] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-reconcile @ 390px (2.3s)
  ok 312 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 1440px (2.6s)
  ok 313 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 1024px (2.4s)
  ok 314 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 768px (2.3s)
  ok 315 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 480px (2.4s)
  ok 316 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 390px (2.4s)
  ok 317 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 1440px (2.6s)
  ok 318 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 1024px (3.0s)
  ok 319 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 768px (2.7s)
  ok 320 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 480px (2.5s)
  ok 321 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 390px (2.3s)
  ok 322 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 1440px (2.4s)
  ok 323 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 1024px (2.4s)
  ok 324 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 768px (2.5s)
  ok 325 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 480px (2.5s)
  ok 326 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 390px (2.3s)

  Slow test file: [visual] › visual.spec.js (13.7m)
  Consider splitting slow test files to speed up parallel execution
  326 passed (14.0m)
```

---

## 13. Constraint E1 Confirmation

- **Zero legacy shared CSS files were touched**:
  - `Table.css`, `Form.css`, `Modal.css`, `Sidebar.css`, `App.css` were **100% untouched**.
  - All token overrides for dashboard semantic tones reside in `theme-components.css` Section 11 under `.fs-page` / `html[data-fs-theme]`.
