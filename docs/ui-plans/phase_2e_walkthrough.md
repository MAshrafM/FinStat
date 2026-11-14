# Walkthrough — UI Phase 2E: Seven Primitives, Category Labels, and Specificity

UI Phase 2E extracted seven reusable React UI primitives (`Button`, `Card`, `Badge`, `Delta`, `PageHeader`, `EmptyState`, and `Tabs`), verified category label token compliance, implemented scoped cluster sub-navigation dual-mode rules, and established the 10-file specificity disposition matrix. All implementations strictly preserve **Constraint E1** (zero edits to legacy shared CSS files) and **Invariant I13** (zero diff across all 326 visual route snapshots).

---

## 1. Primitive Coverage & Architecture

All seven React primitives are extracted into `frontend/src/components/ui/` with full JSDoc typing, PropTypes validation, accessible ARIA attributes, and zero colour-bearing inline styles or raw hex values.

| Primitive | Primary Responsibilities | Test Suite | Unit Tests | `jest-axe` A11y | Browser Fixture (`--project=primitives`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Button`** | 4 variants (`primary`, `secondary`, `ghost`, `danger`), 2 sizes (`sm`, `md`), loading state with spinner, `aria-busy`, disabled state | `Button.test.js` | 8 | Pass | Pass (`#btn-primary`, `#btn-secondary`, `#btn-danger`) |
| **`Card`** | Opaque surface, 8px ceiling radius, `raised` modifier, header/body/footer slots | `Card.test.js` | 5 | Pass | Pass (`#card-default`, `#card-raised`) |
| **`Badge`** | 4-tier precedence (`label` / `children`), 3 semantic tones + neutral, neutral chip base, no tinted fills | `Badge.test.js` | 7 | Pass | Pass (`#badge-neutral`, `#badge-positive`, `#badge-negative`, `#badge-warning`) |
| **`Delta`** | Mandatory label, 3 tones + neutral, 4 sign modes (`auto`, `positive`, `negative`, `none`), Option B accessible announcement | `Delta.test.js` | 8 | Pass | Pass (`#delta-positive`, `#delta-negative`, `#delta-warning`, `#delta-neutral`) |
| **`PageHeader`**| Semantic `<header>`, `h1` title, subtitle, optional eyebrow (off by default), actions slot | `PageHeader.test.js` | 6 | Pass | Pass (`#header-sample`, `#header-title`, `#header-eyebrow`) |
| **`EmptyState`**| `role="status"`, icon slot with `aria-hidden`, `h3` title, description, action CTA slot | `EmptyState.test.js` | 6 | Pass | Pass (`#empty-sample`, `#empty-title`, `#empty-desc`) |
| **`Tabs`** | ARIA APG tab pattern, `aria-orientation`, dual-orientation keyboard roving focus (`ArrowLeft`/`Right` horizontal, `ArrowUp`/`Down` vertical), Home/End, disabled tab skipping | `Tabs.test.js` | 8 | Pass | Pass (`#tabs-horizontal`, `#tabs-vertical`, live interactive keyboard trace) |
| **Total** | | **7 suites** | **48 tests** | **All Pass** | **All Pass** |

*Note: In addition, `frontend/src/constants/__tests__/categories.test.js` runs 3 tests, bringing the Phase 2E new test count to 51 passing tests.*

---

## 2. Category Labels Verification

`frontend/src/constants/categories.js` was audited and verified against design system tokens:
- **Zero Derived `tint` Property**: All 18 category entries retain only static `hex` values for chart palette rendering. Zero tinted fill calculations or background washes are generated.
- **Accent Integrity**: No category entry uses the accent color `#14b8a6` (`--fs-accent` is strictly reserved for interactive controls).
- **Unit Verification**: `frontend/src/constants/__tests__/categories.test.js` passes all 3 tests ensuring valid 6-character hex strings, no `tint` property, and no `#14b8a6`.

```
PASS src/constants/__tests__/categories.test.js
  Categories Constant Audit (Phase 2E)
    ✓ exports an array of category definition objects with valid 6-char hex colors
    ✓ has zero derived "tint" property on any category object
    ✓ does not use the interactive accent hex #14b8a6 for any category series
```

---

## 3. Browser Dual-Mode & Interactive Keyboard Trace

### 3.1 Dual-Mode Computed Styles (`--project=primitives`)
The browser verification spec `frontend/tests/visual/primitives.spec.js` executes against `frontend/tests/visual/fixtures/shared/primitives.html` on port 3001, verifying that:
1. **Primitives match tokens and enforce anti-slop rules**:
   - `Primary Button`: `background = rgb(20, 184, 166)` (`#14b8a6`), `color = rgb(13, 14, 16)` (`#0d0e10`, `--fs-ink`) — **zero white text on accent**.
   - `Secondary Button`: `background = rgb(34, 37, 42)` (`#22252a`, `--fs-surface-raised`), `border-radius = 6px`.
   - `Danger Button`: `background = rgb(217, 112, 118)` (`#d97076`, `--fs-danger`), `color = rgb(13, 14, 16)`.
   - `Card`: `background = rgb(26, 28, 32)` (`#1a1c20`, `--fs-surface`), `border-radius = 8px` (strict 8px ceiling).
   - `Badge`: `background = rgb(34, 37, 42)` (`#22252a`), `positive = rgb(79, 168, 124)`, `negative = rgb(217, 112, 118)`, `warning = rgb(207, 162, 79)`.
   - `Delta`: `positive = rgb(79, 168, 124)`, `negative = rgb(217, 112, 118)`.
   - `PageHeader Eyebrow`: `color = rgb(162, 168, 176)` (`#a2a8b0`, `--fs-text-3`) — **never accent** per §1.
2. **Dual-Mode Cluster Sub-Navigators defeat legacy rules**:
   - Legacy Expenditure Sub-Nav: `track bg = rgb(241, 245, 249)` (`#f1f5f9`), `active color = rgb(37, 99, 235)` (`#2563eb`), `active bg = rgb(255, 255, 255)` (`#ffffff`).
   - Themed Expenditure Sub-Nav (inside `.fs-page`): `track bg = rgb(12, 13, 15)` (`#0c0d0f`, `--fs-surface-sunken`), `active color = rgb(13, 14, 16)` (`#0d0e10`, `--fs-ink`), `active bg = rgb(20, 184, 166)` (`#14b8a6`, `--fs-accent`).
   - Legacy Credit Card Sub-Nav: `track bg = rgb(241, 245, 249)` (`#f1f5f9`), `active color = rgb(37, 99, 235)` (`#2563eb`).
   - Themed Credit Card Sub-Nav (inside `.fs-page`): `track bg = rgb(12, 13, 15)` (`#0c0d0f`), `active color = rgb(13, 14, 16)` (`#0d0e10`), `active bg = rgb(20, 184, 166)` (`#14b8a6`).

### 3.2 Live Interactive Keyboard Trace for Tabs
Playwright executes the live `page.keyboard.press()` trace testing ARIA APG keyboard roving focus:
```
Horizontal Mode:
  Focus '#htab-1' [activeElement = #htab-1]
  Press 'ArrowRight' -> [activeElement = #htab-2]
  Press 'ArrowRight' -> skips disabled '#htab-3' -> [activeElement = #htab-4]
  Press 'ArrowRight' -> wraps around -> [activeElement = #htab-1]
  Press 'ArrowLeft'  -> wraps backwards skipping '#htab-3' -> [activeElement = #htab-4]
  Press 'ArrowDown'  -> inert [activeElement = #htab-4]
  Press 'ArrowUp'    -> inert [activeElement = #htab-4]
  Press 'Home'       -> jumps to first enabled tab [activeElement = #htab-1]
  Press 'End'        -> jumps to last enabled tab [activeElement = #htab-4]

Vertical Mode:
  Focus '#vtab-1' [activeElement = #vtab-1]
  Press 'ArrowDown'  -> [activeElement = #vtab-2]
  Press 'ArrowDown'  -> skips disabled '#vtab-3' -> [activeElement = #vtab-4]
  Press 'ArrowDown'  -> wraps around -> [activeElement = #vtab-1]
  Press 'ArrowUp'    -> wraps backwards skipping '#vtab-3' -> [activeElement = #vtab-4]
  Press 'ArrowRight' -> inert [activeElement = #vtab-4]
  Press 'ArrowLeft'  -> inert [activeElement = #vtab-4]
  Press 'Home'       -> jumps to first enabled tab [activeElement = #vtab-1]
  Press 'End'        -> jumps to last enabled tab [activeElement = #vtab-4]
```

Visual evidence screenshots captured in `tests/visual/output/phase-2e/`:
- `primitives-all-1440.png`
- `subnav-legacy-1440.png`
- `subnav-themed-1440.png`

---

## 4. Specificity Disposition Matrix (10 Files)

As established in §4.5, 10 legacy stylesheets contain 46 `!important` declarations that conflict with design system specificity. Because legacy files are frozen under **Constraint E1**, these declarations are formally mapped to their owning migration phases where they will be eliminated upon page conversion:

| Legacy File | `!important` Count | Affected Selectors / Context | Disposition Strategy | Owning Migration Phase |
| :--- | :---: | :--- | :--- | :--- |
| `Trades.css` | 8 | Action buttons, table cell links, filter toggles | Deferred to Phase 7 (Investments conversion) | **Phase 7A** |
| `CorporateActionsList.css` | 9 | Modal action buttons, wizard action buttons | Deferred to Phase 7 (Investments conversion) | **Phase 7B** |
| `CorporateActionWizard.css` | 7 | Wizard step buttons, navigation bar buttons | Deferred to Phase 7 (Investments conversion) | **Phase 7B** |
| `ReconciliationPage.css` | 2 | Small table action buttons, reconciliation toggles | Deferred to Phase 9 (Credit cards conversion) | **Phase 9B** |
| `Lending.css` | 3 | Modal action buttons, loan form submit | Deferred to Phase 9 (Credit cards & lending conversion) | **Phase 9C** |
| `NetWorthChart.css` | 4 | Metric selector tabs, chart timeframe buttons | Deferred to Phase 3 (Dashboard conversion) | **Phase 3** |
| `DashboardKpiStrip.css` | 4 | KPI card hover borders, value text colors | Deferred to Phase 3 (Dashboard conversion) | **Phase 3** |
| `DashboardPanels.css` | 4 | Panel collapse triggers, panel header icons | Deferred to Phase 3 (Dashboard conversion) | **Phase 3** |
| `ReportsGrid.css` | 3 | Report generation button, filter reset button | Deferred to Phase 3 (Dashboard conversion) | **Phase 3** |
| `PaycheckFormPage.css` | 2 | Calculation summary badges, preview callout | Deferred to Phase 4 (Salary & compensation conversion) | **Phase 4A** |
| **Total** | **46** | | | |

---

## 5. Complete Verification Suite Transcripts

### 5.1 Tokens Check (0 Drift)
```powershell
node frontend/scripts/tokens.js --check
```
```
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.
```

### 5.2 Lint-Tones Check (0 Violations, 0 Undefined Tokens)
```powershell
node frontend/scripts/lint-tones.js
```
```
✓ [lint-tones] Scanned 57 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 60 total CSS files against tokens.json: 0 undefined tokens.
```

### 5.3 Lint-Ratchet Check (0 Regressions)
```powershell
node frontend/scripts/lint-ratchet.js
```
```
[lint-ratchet] Evaluating stylelint ratchet against merge-base: 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507
✓ [lint-ratchet] Checked 59 CSS files against 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507: 0 regressions.
```

### 5.4 Stylelint Check (0 Errors)
```powershell
cd frontend; npx stylelint "src/styles/*.css"
```
*(Exited with code 0, zero errors)*

### 5.5 Baseline Manifest Verification (334/334 Passed)
```powershell
node frontend/scripts/verify-baseline-manifest.js
```
```
334/334 baselines verified successfully.
```

### 5.6 Reference Frames Visual Suite (3 Passed, 0 Diff)
```powershell
cd frontend; npx playwright test --project=reference
```
```
Running 3 tests using 1 worker
  ok 1 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 01-dense-table @ 1440px (6.4s)
  ok 2 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 02-form @ 1440px (4.9s)
  ok 3 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 03-dashboard @ 1440px (3.8s)

  3 passed (50.5s)
```

### 5.7 Shell Visual Suite (7 Passed, 0 Diff)
```powershell
cd frontend; npx playwright test --project=shell
```
```
Running 7 tests using 1 worker
  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (18ms)
  ok 2 [shell] › shell.spec.js:51:3 › Shell Visual Suite (Option A) › shell-legacy-desktop (24.4s)
  ok 3 [shell] › shell.spec.js:56:3 › Shell Visual Suite (Option A) › shell-legacy-mobile (6.0s)
  ok 4 [shell] › shell.spec.js:61:3 › Shell Visual Suite (Option A) › shell-dark-desktop-collapsed (6.6s)
  ok 5 [shell] › shell.spec.js:73:3 › Shell Visual Suite (Option A) › shell-dark-desktop-expanded (6.2s)
  ok 6 [shell] › shell.spec.js:92:3 › Shell Visual Suite (Option A) › shell-dark-mobile-drawer (6.4s)
  ok 7 [shell] › shell.spec.js:105:3 › Shell Visual Suite (Option A) › shell-dark-account-dropdown (9.3s)

  7 passed (1.4m)
```

### 5.8 Shared Components Dual-Mode Suite (10 Passed, 0 Diff)
```powershell
cd frontend; $env:CI="true"; $env:NODE_OPTIONS="--max-old-space-size=4096"; npx playwright test --project=shared
```
```
Running 10 tests using 1 worker
  ok 1 [shared] › shared-components.spec.js:27:3 › Phase 2D: Shared Components Dual-Mode Verification › Table: computed styles verify legacy vs .fs-page theme override (4.9s)
  ok 2 [shared] › shared-components.spec.js:53:3 › Phase 2D: Shared Components Dual-Mode Verification › Form: computed styles verify legacy vs .fs-page theme override (2.8s)
  ok 3 [shared] › shared-components.spec.js:86:3 › Phase 2D: Shared Components Dual-Mode Verification › Modal: computed styles verify legacy vs theme override (8px ceiling) (2.5s)
  ok 4 [shared] › shared-components.spec.js:114:3 › Phase 2D: Shared Components Dual-Mode Verification › ConfirmModal: computed styles verify legacy vs theme override (2.6s)
  ok 5 [shared] › shared-components.spec.js:148:3 › Phase 2D: Shared Components Dual-Mode Verification › SummaryRow & AnalysisCard: computed styles verify theme overrides (2.8s)
  ok 6 [shared] › shared-components.spec.js:174:3 › Phase 2D: Shared Components Dual-Mode Verification › ComponentTable: computed styles verify theme overrides (2.6s)
  ok 7 [shared] › shared-components.spec.js:198:3 › Phase 2D: Shared Components Dual-Mode Verification › ViewOnlyBanner: computed styles verify theme overrides and backdrop-filter none (2.2s)
  ok 8 [shared] › shared-components.spec.js:218:3 › Phase 2D: Shared Components Dual-Mode Verification › ProtectedAction: computed styles verify opacity gating (2.3s)
  ok 9 [shared] › shared-components.spec.js:232:3 › Phase 2D: Shared Components Dual-Mode Verification › Pagination: computed styles verify theme overrides (2.5s)
  ok 10 [shared] › shared-components.spec.js:256:3 › Phase 2D: Shared Components Dual-Mode Verification › AppLauncher: computed styles verify theme overrides and backdrop-filter none (2.4s)

  10 passed (49.9s)
```

### 5.9 Primitives Dual-Mode & Keyboard Suite (3 Passed, 0 Diff)
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=primitives
```
```
Running 3 tests using 1 worker
  ok 1 [primitives] › primitives.spec.js:25:3 › Phase 2E: Primitives & Dual-Mode Sub-Nav Verification › Primitives: computed styles verify design system tokens and anti-slop rules (4.1s)
  ok 2 [primitives] › primitives.spec.js:91:3 › Phase 2E: Primitives & Dual-Mode Sub-Nav Verification › SubNav Dual-Mode: computed styles verify legacy vs .fs-page theme override (2.7s)
  ok 3 [primitives] › primitives.spec.js:137:3 › Phase 2E: Primitives & Dual-Mode Sub-Nav Verification › Tabs Interactive Keyboard Navigation: roving focus trace in both orientations (2.8s)

  3 passed (30.6s)
```

### 5.10 Visual Regression Suite (326 Passed, 0 Diff — Invariant I13)
```powershell
cd frontend; $env:CI="true"; $env:NODE_OPTIONS="--max-old-space-size=4096"; npx playwright test --project=visual
```
```
Running 326 tests using 1 worker
  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (14ms)
  ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (11.3s)
  ...
  ok 326 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 390px (2.4s)

  326 passed (17.8m)
```

### 5.11 Production Build
```powershell
cd frontend; $env:CI="true"; npm run build
```
```
Compiled successfully.

File sizes after gzip:
  113.44 kB          build\static\js\main.b85eebe3.js
  64.33 kB           build\static\js\6058.596edc6e.chunk.js
  12.71 kB           build\static\js\4813.943884d5.chunk.js
  11.64 kB (+464 B)  build\static\css\main.337c35f2.css
```

### 5.12 Jest Test Suite (58/58 Suites Passed, 368/368 Tests)
```powershell
cd frontend; $env:CI="true"; npm test -- --watchAll=false
```
```
Test Suites: 58 passed, 58 total
Tests:       368 passed, 368 total
Snapshots:   0 total
Time:        62.724 s
Ran all test suites.
```

---

## 6. Constraint E1 Compliance Proof

Running `git diff --name-only main` confirms that zero legacy shared CSS files were touched:

```
frontend/playwright.config.js
frontend/src/constants/categories.js
frontend/src/styles/theme-components.css
frontend/src/styles/theme.css
```

All 7 React UI primitives and tests are housed in new files under `frontend/src/components/ui/` and `frontend/tests/visual/`. Legacy component stylesheets (`Table.css`, `Form.css`, `Modal.css`, `ConfirmModal.css`, `SummaryRow.css`, `AnalysisCard.css`, `ComponentTable.css`, `PaginationControls.css`, `ViewOnlyBanner.css`, `AppLauncher.css`, `ExpenditureSubNav.css`, `CreditCardSubNav.css`) remain 100% untouched.
