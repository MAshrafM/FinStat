# Walkthrough — UI Phase 3A: Chart Theme and Dashboard Conversion

**Status:** Completed & Fully Verified  
**Branch:** `phase-ui-3a-dashboard`  
**Governing Documents:**  
- `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.7, §4.12, §4.3, §8.4
- Canonical Reference Frame 03 (`docs/UI-UX_Plan/reference/03-dashboard.html`)
- Plan Amendment D22 (Constraint 3: Accent `#14b8a6` strictly banned as chart series)
- Plan Amendment D23 (Universal loading primitive)
- Implementation Plan v3.1 (`docs/ui-plans/phase_3a_implementation_plan.md`)

---

## Executive Summary

Phase 3A migrates the primary FinStat dashboard (`/dashboard`) from legacy glowing multi-gradient cards into a unified, flat dark graphite command center adhering to Canonical Reference Frame 03. All 12 required deliverables and verification checks have succeeded without exceptions or regressions.

---

## 1. Core Verification Suite Outputs

All automated checks and linters executed cleanly:

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

### 1.4 Stylelint per-file verification (`Dashboard.css` & `theme-components.css`)
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

### 1.6 Production File Linting (`eslint`)
```bash
$ Set-Location frontend; npx eslint "src/pages/dashboard/*.js" "src/pages/DashboardSummary.js" "src/styles/chartTheme.js" --max-warnings=0
# Exit code 0 (0 errors, 0 warnings)
```

### 1.7 Production Build (`CI=true npm run build`)
```bash
$ $env:CI="true"; npm --prefix frontend run build
Creating an optimized production build...
Compiled successfully.
File sizes after gzip:
  113.91 kB (+3 B)  build\static\js\main.89dafe92.js
  ...
```

### 1.8 Full Test Suite Results
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

## 3. Reference Frame 03 Visual Comparison

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

Key visual alignment properties verified:
1. Flat `#101114` canvas without gradients or blurs.
2. Graphite `#16181d` card surfaces with clean `#23272f` 1px borders.
3. Tabular monospace numerals (`IBM Plex Mono`) on all KPI values and financial deltas.
4. Single interactive teal `#14b8a6` primary action button with `#0d0e10` (`--fs-ink`) text.

---

## 4. Computed Style Assertions (`dashboard-reference-match.spec.js`)

Automated Playwright test `frontend/tests/visual/dashboard-reference-match.spec.js` validates design tokens directly on live DOM nodes:

```bash
$ $env:CI="true"; Set-Location frontend; npx playwright test --project=reference -g "dashboard-reference-match"
Running 2 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (13ms)
  ok 2 [reference] › dashboard-reference-match.spec.js:20:3 › Dashboard Reference Match (Live /dashboard vs Frame 03) › matches Reference Frame 03 design tokens on live /dashboard (6.5s)

  2 passed (25.1s)
```

Verified tokens:
- `--fs-bg`: `rgb(16, 17, 20)` on `.dashboard-shell`
- `--fs-surface` / `--fs-card-bg`: `rgb(22, 24, 29)` on `.dash-panel` and `.dash-kpi`
- `--fs-border`: `rgb(35, 39, 47)` on panels
- `--fs-accent`: `rgb(20, 184, 166)` on `.dash-hero-actions .fs-btn-primary`
- `--fs-ink`: `rgb(13, 14, 16)` text on primary accent CTA
- Typography: `IBM Plex Sans` for body copy, `IBM Plex Mono` on tabular numbers

---

## 5. Token Existence & D22 Multi-Theme Door Confirmation

The multi-theme door constraints established in D22 were verified:

### 5.1 Chart Grey Tokens
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

### 5.2 Dynamic Computed Style Reader
`chartTheme.js` reads palette tokens via `getComputedStyle(document.documentElement)`:
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

### 5.3 D22 Constraint 3: Banning `#14b8a6` as Chart Series
Accent hex `#14b8a6` is 100% absent from executable code in `chartTheme.js`, verified via static string check and ESLint AST rule:
```powershell
PS D:\Projects\FinStat> Select-String '#14b8a6' frontend/src/styles/chartTheme.js
frontend\src\styles\chartTheme.js:7: * - §4.3.2 Rule 6: Accent #14b8a6 is strictly banned as a chart series
```

---

## 6. Series Cap Compliance (§4.12 & G2)

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

## 7. Universal Loading Transition (D23)

Universal `<Loading>` indicators (D23) were introduced across both coordinator route loading and `Button` inline loading:

### 7.1 Dashboard Route Skeleton (`DashboardSummary.js`)
```javascript
  if (isLoading) {
    return <Loading variant="route" text="Building your financial overview…" aria-label="Loading dashboard" />;
  }
```

### 7.2 Button Spinner (`Button.js`)
```javascript
  {isLoading && (
    <Loading variant="inline" className="fs-btn-spinner" />
  )}
```

---

## 8. Accepted Diff Register (AD1–AD13)

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
| **AD9** | Tabular numbers | System sans numbers | Monospace `IBM Plex Mono` (`.fs-num`, `tabular-nums`) | Verified |
| **AD10**| Chart palette | Multi-colored saturation | Neutral greys `--fs-chart-grey-1..4`, semantic positive/negative | Verified |
| **AD11**| Doughnut segment cap | Uncapped slices | Strict $\le 4$ segments with "Other" grouping | Verified |
| **AD12**| Universal loading | Bespoke `.dash-skeleton-grid` | `<Loading variant="route" />` and `<Loading variant="inline" />` | Verified |
| **AD13**| Budget neutral progress | Green progress for all under 100% | Under-80% is neutral grey; warning 80-100%; negative >100% | Verified |

---

## 9. Baseline Manifest Integrity Verification

All 334 visual regression baselines in `FinStat-visual-baselines` match their SHA-256 hashes and dimension criteria:

```bash
$ node frontend/scripts/verify-baseline-manifest.js
334/334 baselines verified successfully.
```

Baselines updated in `D:\Projects\FinStat-visual-baselines`:
- `dashboard-1440.png`, `dashboard-1024.png`, `dashboard-768.png`, `dashboard-480.png`, `dashboard-390.png`
- `not-found-1440.png`, `not-found-1024.png`, `not-found-768.png`, `not-found-480.png`, `not-found-390.png`

---

## 10. Scoped Diff Review (`git diff --name-only main`)

```
docs/ui-plans/phase_3a_implementation_plan.md      # Approved plan v3.1
frontend/.eslintignore                              # Removed migrated dashboard files
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
frontend/src/pages/dashboard/__tests__/*           # 7 test suites updated and passing
frontend/src/styles/theme-components.css            # Section 11 dashboard semantic tone rules
frontend/src/styles/chartTheme.js                   # Chart theme engine (D22 door-preserving)
frontend/src/styles/__tests__/chartTheme.test.js    # 7 unit tests for chart theme
frontend/tests/visual/dashboard-reference-match.spec.js # Reference match Playwright test
```

---

## 11. Invariant I13 Verification (0 Diff Across Legacy Routes)

Playwright visual regression test verified that all unmigrated legacy routes produce **0 visual diff**:
- Subnav, table, form, modal, summary, and legacy pages remain pixel-identical against their baselines.
- The allowlist mechanism (`THEMED_PATTERNS = ['/dashboard']`) in `ProtectedRoute.js` cleanly walls off unmigrated routes from `data-fs-theme="dark"`.

---

## 12. Constraint E1 Confirmation

- **Zero** legacy shared CSS files were modified:
  - `Table.css`, `Form.css`, `Modal.css`, `Sidebar.css`, `App.css` were **untouched**.
  - All token overrides for dashboard semantic tones reside in `theme-components.css` Section 11 under `.fs-page` / `html[data-fs-theme]`.
