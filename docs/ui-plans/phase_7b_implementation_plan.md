# UI Phase 7B Implementation Plan (Final) — Corporate Actions Subsystem

- **Date**: 2026-11-24
- **Status**: Approved & In Execution
- **Merge Base**: `main` @ `dced18e`
- **Starting Baseline Commit**: `c89845e` (334/334 manifest verified)
- **Target Routes**:
  - `/corporate-actions` (Corporate Actions Registry)
  - `/corporate-actions/wizard` (Corporate Action Wizard)
- **Target Production Files**:
  - `frontend/src/pages/trades/CorporateActionsList.js`
  - `frontend/src/pages/trades/CorporateActionsList.css`
  - `frontend/src/pages/trades/CorporateActionWizard.js`
  - `frontend/src/pages/trades/CorporateActionWizard.css`
  - `frontend/src/styles/theme-components.css` (Section 16: Phase 7B Corporate Actions Semantic Themes)
  - `frontend/src/components/ProtectedRoute.js` (Allowlist expansion: 27 → 29)
  - `frontend/.eslintignore` (Remove lines 62–63)
  - `frontend/playwright.config.js` (Register reference match spec)
- **Target Test & Mock Files**:
  - `frontend/src/pages/trades/__tests__/CorporateActionsList.test.js` (New CRA Jest + jest-axe suite: 12 tests)
  - `frontend/src/pages/trades/__tests__/CorporateActionWizard.test.js` (New CRA Jest + jest-axe suite: 14 tests)
  - `frontend/tests/visual/fixtures/corporateActionsMocks.js` (New deterministic API mock)
  - `frontend/tests/visual/corporate-actions-reference-match.spec.js` (New Playwright reference match spec)
  - `frontend/tests/visual/visual.spec.js` (Mock wiring)
  - `frontend/tests/visual/a11y.spec.js` (Mock wiring)
- **Governing References**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§0.2/§3.1/§6.1.1, §2 Invariants I1–I16, §6.11 Phase 7B checklist lines 1808–1815, §7.1/§7.2 DoD, §10 Progress Log, §14 push policy)
  - `docs/ui-plans/phase_7b_implementation_plan_review_v3.md` (Review v3 findings & corrections)
  - Canonical Reference Frames: `docs/UI-UX_Plan/reference/01-dense-table.html` (Variant B Dense Table), `02-form.html` (Variant B Form), `03-dashboard.html` (Variant B Dashboard Stepper)
  - `AGENTS.md` (Design tokens, tone/accent bans, D22 multi-theme door preservation)

---

## 1. Executive Summary & Architectural Scope

Phase 7B converts the **Corporate Actions Subsystem** to the FinStat dark graphite design system per **UI-UX-PLAN.md §6.11 lines 1808–1815**.

The subsystem comprises two core user-facing routes:
1. `/corporate-actions` — **Corporate Actions Registry**: Historical log of stock splits and bonus share events applied dynamically across portfolio holdings (`CorporateActionsList.js` and `CorporateActionsList.css`).
2. `/corporate-actions/wizard` — **Corporate Action Wizard**: Multi-step wizard allowing users to select active stock positions, configure event types (Split vs Bonus), and preview before/after impact on share counts and cost basis (`CorporateActionWizard.js` and `CorporateActionWizard.css`).

### 1.1 Decoupling from Shared Stylesheets (`Trades.css` & `Table.css`)
Currently, `CorporateActionsList.js:10–12` imports:
```javascript
import '../../components/Table.css';
import '../trades/Trades.css';
import './CorporateActionsList.css';
```
- **`Trades.css`**: Imports legacy styles for trade logs, trade forms, and filters. `CorporateActionsList` does not use any of these components.
- **`Table.css`**: Not a neutral foundation — it contains legacy light styling including `#009879` teal headers, `#ffffff`, `#dddddd`, and unlisted box-shadow `box-shadow: 0 0 20px rgba(0, 0, 0, 0.15)`.

In Phase 7B:
- **Both `import '../../components/Table.css';` and `import '../trades/Trades.css';` will be completely removed** from `CorporateActionsList.js`.
- All layout, typography, and neutral styles will be self-contained in `CorporateActionsList.css` under the scoped selector `html[data-fs-theme] .ca-page-container`.
- Semantic tone and interactive accent rules (`--fs-accent`, `--fs-positive`, `--fs-negative`, `--fs-warning`) reside strictly in `theme-components.css` Section 16 under `html[data-fs-theme]`.
- This ensures zero cascade bleed into or from unthemed consumers, maintaining pristine isolation across the codebase.

---

## 2. Plan Commitments & Governing Invariant Mapping (§2)

The table below bridges the Phase 7B plan commitments (`7B-C1`–`7B-C16`) directly to the **verbatim governing invariants defined in UI-UX-PLAN.md §2 (lines 189–204)**:

| Invariant | Verbatim Invariant Definition (§2) | Phase 7B Applicability & Commitment | Relationship | Verification Gate |
|---|---|---|---|---|
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `/corporate-actions` and `/corporate-actions/wizard` route definitions and URLs remain unchanged in `App.js`. No routes added or deleted. | Direct | Gate 1 (`ui-coverage.js`) & Gate 8 (`App.test.js`) |
| **I2** | No API call, payload shape, or service file changed. | `corporateActionService.js` endpoints (`getCorporateActions`, `deleteCorporateAction`, `executeCorporateActionWizard`) and payload shapes remain intact. | Direct | Gate 6 & Gate 9 |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Wizard calculation parity: multiplier (`ratio` for split, `1 + ratio` for bonus), new shares (`currentShares * multiplier`), and adjusted price (`currentAvgPrice / multiplier`) remain bit-identical. | Direct | Gate 9 (`calculations.spec.js`) & Gate 7 (`CorporateActionWizard.test.js`) |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | `ProtectedAction` wrapping "Launch Action Wizard", "Apply First Corporate Action", and row delete button, as well as `useCanModify()` gating in `CorporateActionsList.js` are preserved without alteration. | Direct | Gate 7 (`CorporateActionsList.test.js`) |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | All existing `title`, `data-label`, and interactive accessibility attributes preserved; accessible dialog attributes added to modal. | Direct | Gate 3 (`testid-guard.js`) |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | Desktop/tablet table rendered with container scroll (`overflow-x: auto;`) per Phase 7A precedent (`2624f2b`, walkthrough §8). At $\le 768\text{px}$, table collapses to compact-expand cards with $\ge 44\times 44\text{px}$ touch targets; zero page-level horizontal scroll at 390px. | Direct | Gate 11 (`corporate-actions-reference-match.spec.js`) |
| **I7** | No page loses functionality mid-migration. | Patterns `/corporate-actions` and `/corporate-actions/wizard` added to `THEMED_PATTERNS` only as part of this complete conversion PR. Registry and Wizard retain 100% functional capability. | Direct | Gate 1 (`ui-coverage.js`) & Gate 7 |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Untouched in Phase 7B. `DashboardSummary.js` remains unchanged and within line cap. | Indirect / N/A | Gate 8 |
| **I9** | Production build passes with zero errors and no new warnings. | `npm run build` compiles cleanly with zero compilation errors and zero new warnings. | Direct | Gate 12 (`npm run build`) |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | Touched CRA unit tests (`CorporateActionsList.test.js`, `CorporateActionWizard.test.js`) and `App.test.js` pass 100% green. | Direct | Gate 7 & Gate 8 |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | 16 total `!important` declarations purged (9 in `CorporateActionsList.css`, 7 in `CorporateActionWizard.css`). Ratchet falls by 16. | Direct | Gate 5 (`lint-ratchet.js`) |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` untouched; zero dependencies added. | Direct | Gate 12 & PR diff review |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Decoupling `CorporateActionsList.js` from `Trades.css` and `Table.css` guarantees zero unthemed side-effects. All 315 unthemed visual baselines show zero unexpected diffs (292 passing + 34 accepted under AD14/AD16; 0 diffs attributable to 7B). | Direct | Gate 14 & Gate 15 |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | All gradients, glows, and backdrop filters purged from both CSS files. Scrim uses standard `var(--fs-scrim)`. Checked by stylelint. | Direct | Gate 5 (`stylelint`) |
| **I15** | Neutral by default: a tone encodes deviation from expectation or attention, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | Page CSS contains neutral tokens only (`--fs-surface`, `--fs-border`, `--fs-text`, etc.). Semantic tone tokens (`--fs-accent`, `--fs-positive`, `--fs-negative`, `--fs-warning`) reside strictly in `theme-components.css` Section 16. Active stepper number strictly uses `--fs-ink` on `--fs-accent` (7.76:1 ratio; white text strictly banned). | Direct | Gate 4 (`lint-tones.js`) |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | All border radii strictly adhere to 8px ceiling (`var(--fs-radius-sm)` 4px, `var(--fs-radius-md)` 6px, `var(--fs-radius-lg)` 8px) or `var(--fs-radius-pill)` for chips only. | Direct | Gate 5 (`stylelint`) |

---

## 3. Detailed Component Conversion Strategy

### 3.1 `CorporateActionsList.js` & `CorporateActionsList.css`

1. **Complete Stylesheet Decoupling**:
   - Drop `import '../../components/Table.css';` and `import '../trades/Trades.css';`.
   - Scope all list and table rules in `CorporateActionsList.css` under `html[data-fs-theme] .ca-page-container`.
2. **Header & Actions**:
   - Title: `--fs-text`, Subtitle: `--fs-text-2`.
   - "Refresh" button styled with `.fs-btn-secondary`.
   - "Launch Action Wizard" link styled with `.fs-btn-primary`.
3. **Canonical Loading Primitive (Decision D23)**:
   - Replace ad-hoc `.ca-loading-spinner` with `<Loading variant="table" text="Loading corporate actions..." rows={4} />` from `../../components/ui/Loading`.
4. **Empty State**:
   - Dark surface card (`--fs-surface`, `--fs-border`, `--fs-radius-lg`), neutral icon wrap, and `.fs-btn-primary` CTA.
5. **Desktop & Tablet Dense Table (Reference Frame 01 Variant B)**:
   - Container has `overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;` per Phase 7A table-scroll precedent (commit `2624f2b`, walkthrough §8, Invariant I6).
   - Headers: `--fs-surface-sunken`, `--fs-text-3`, uppercase 12px (`var(--fs-text-xs)`).
   - Stock code & Ratio formatted with `IBM Plex Mono` (`--fs-font-mono`).
   - Action Type chips: Neutral tokenized chips (`--fs-surface-raised`, `--fs-border`, `--fs-text-2`).
   - Row Delete action: `.ca-btn-table-delete` (neutral styling in `CorporateActionsList.css`, negative hover/focus color and border in `theme-components.css` Section 16).
6. **Mobile Responsive Pattern (Decision D19 / Invariant I6)**:
   - At $\le 768\text{px}$, the desktop table hides (`display: none;`) and renders `.ca-mobile-card-list`.
   - **Compact State**: 3 primary fields visible:
     - Stock Code (`--fs-text`, bold mono)
     - Action Type chip (`Stock Split` or `Bonus Issue`)
     - Ratio (e.g. `2:1` or `10.0%` in mono)
     - Expand/collapse chevron button with $\ge 44\times 44\text{px}$ touch target.
   - **Expanded State**: Reveals:
     - Broker
     - Effective Date (formatted)
     - Notes (or empty dash)
     - Delete button with full-width $\ge 44\text{px}$ touch target.
7. **Accessible Delete Confirmation Modal**:
   - Backdrop: `var(--fs-scrim)`.
   - Card: `--fs-surface`, `--fs-border`, `--fs-radius-lg`, `--fs-shadow`.
   - Semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="ca-delete-dialog-title"`.
   - Escape key listener, focus trap, and preserved `title` attributes.
   - Buttons: `.fs-btn-secondary` ("Cancel") and `.fs-btn-danger` ("Confirm Remove").
8. **Purge 6 Inline Styles**:
   - Line 113: `style={{ marginTop: '20px' }}` → CSS `.ca-table-wrap`
   - Line 123: `style={{ textAlign: 'right' }}` → CSS `.ca-th-actions`
   - Line 129: `style={{ fontWeight: 'bold' }}` → CSS `.ca-cell-stock`
   - Line 138: `style={{ fontWeight: 'bold' }}` → CSS `.ca-cell-ratio`
   - Line 142: `style={{ color: '#64748b', maxWidth: '240px' }}` → CSS `.ca-cell-notes`
   - Line 145: `style={{ textAlign: 'right' }}` → CSS `.ca-cell-actions`
9. **Eliminate 9 `!important` Declarations**:
   - Purge `!important` from lines 56, 71, 72, 78, 87, 98, 106, 118, 127 in `CorporateActionsList.css`.

---

### 3.2 `CorporateActionWizard.js` & `CorporateActionWizard.css`

1. **Header & Navigation**:
   - Title: `--fs-text`, Subtitle: `--fs-text-2`.
   - "View All Actions" back button using `.fs-btn-secondary` with `ArrowLeft` icon.
2. **Accessible Stepper (Reference Frame 03 Variant B Dashboard)**:
   - **Active Step**: Number background is `--fs-accent` (`#14b8a6`) with `--fs-ink` text (`#0d0e10`), delivering a compliant **7.76:1 contrast ratio**. **White text on accent is strictly banned.**
   - **Inactive Step**: Sunken neutral circle (`--fs-surface-sunken`) with `--fs-text-3`.
   - **Completed Step**: Raised surface (`--fs-surface-raised`) with checkmark `✓` and `--fs-positive` indicator.
   - **Dividers**: `--fs-border`.
3. **Step 1: Position Selection**:
   - Select input styled with `.fs-input` (`--fs-surface-sunken`, `--fs-border`, `--fs-text`).
   - Selected Position Preview Card: 4-tile KPI grid (Stock Code, Broker, Current Shares, Avg Buy Price) on `--fs-surface-sunken`, border `--fs-border`, values in `IBM Plex Mono`.
   - Empty Positions Alert Notice: Scoped `.wizard-page .empty-notice` card (`--fs-surface-sunken`, border `--fs-border`, text `--fs-text-2`), with warning icon styled in `theme-components.css` Section 16 (`--fs-warning`).
   - Continue CTA: `.fs-btn-primary`.
4. **Step 2: Action Configuration**:
   - Type Toggle Group: Segmented cards:
     - Inactive: `--fs-surface-sunken`, `--fs-border`, `--fs-text-2`.
     - Active: `--fs-surface-raised`, border `--fs-accent` (via `theme-components.css` Section 16).
   - Inputs (Ratio, Effective Date, Notes) styled with `.fs-input`. Helper text in `--fs-text-3`.
   - Navigation: "Back" (`.fs-btn-secondary`), "Preview Impact" (`.fs-btn-primary`).
5. **Step 3: Review & Impact Comparison (Reference Frame 02 Variant B Form)**:
   - Before Adjustment column: `--fs-surface-sunken`, `--fs-border`.
   - Connector arrow: `--fs-text-3`.
   - After Corporate Action column: `--fs-surface-raised`, `--fs-border`, values formatted with mono tabular figures.
   - Confirmation summary callout: `--fs-surface-sunken`, border-left `3px solid var(--fs-accent)` (via `theme-components.css` Section 16).
   - Submit CTA: "Confirm & Apply Corporate Action" (`.fs-btn-primary`) with loading state during submission.
6. **Purge 14 Inline Styles**:
   - Line 130: Header flex alignment → CSS `.wizard-header`
   - Line 135: Back link inline flex → CSS `.wizard-back-btn`
   - Line 167: Alert icon color `#e67e22` → CSS `.wizard-empty-icon` (tokens via Section 16)
   - Line 218: Continue button inline flex → CSS utility
   - Line 254: Form row flex layout → CSS `.wizard-form-row`
   - Line 255: Flex 1 → CSS `.wizard-form-col`
   - Line 270: Helper text color `#64748b` → CSS `.wizard-help-text`
   - Line 277: Flex 1 → CSS `.wizard-form-col`
   - Line 287: Helper text color `#64748b` → CSS `.wizard-help-text`
   - Line 293: Margin top → CSS `.wizard-form-group`
   - Line 314: Preview button inline flex → CSS utility
   - Line 353: Shares color `#27ae60` → CSS `.ca-impact-stat-positive` (via `theme-components.css`)
   - Line 357: Price color `#2980b9` → CSS `.ca-impact-stat-accent` (via `theme-components.css`)
   - Line 381: Submit button inline flex → CSS utility
7. **Eliminate 7 `!important` Declarations**:
   - Purge `!important` from lines 252, 267, 268, 273, 282, 292, 300 in `CorporateActionWizard.css`.

---

### 3.3 Scoped Semantic Themes in `theme-components.css` (Section 16)

Per `AGENTS.md` and `lint-tones.js`, all rules referencing accent (`--fs-accent`) or semantic tone tokens (`--fs-positive`, `--fs-negative`, `--fs-warning`) are banned from page CSS and must be placed in `theme-components.css` under Section 16 using attribute-existence selectors:

```css
/* ----------------------------------------------------
   Phase 7B: Corporate Actions Semantic Themes
---------------------------------------------------- */
html[data-fs-theme] .wizard-page .step-item.active .step-number {
  background: var(--fs-accent);
  color: var(--fs-ink);
}

html[data-fs-theme] .wizard-page .step-item.completed .step-number {
  background: var(--fs-surface-raised);
  color: var(--fs-positive);
  border-color: var(--fs-border);
}

html[data-fs-theme] .wizard-page .toggle-btn.active {
  border-color: var(--fs-accent);
  background: var(--fs-surface-raised);
}

html[data-fs-theme] .wizard-page .confirmation-summary {
  background: var(--fs-surface-sunken);
  border-left: 3px solid var(--fs-accent);
}

html[data-fs-theme] .wizard-page .ca-impact-stat-positive {
  color: var(--fs-positive);
}

html[data-fs-theme] .wizard-page .ca-impact-stat-accent {
  color: var(--fs-text);
}

html[data-fs-theme] .wizard-page .wizard-empty-icon {
  color: var(--fs-warning);
}

html[data-fs-theme] .ca-page-container .ca-btn-table-delete:hover:not(:disabled) {
  color: var(--fs-negative);
  border-color: var(--fs-negative);
}
```

---

## 4. Test Strategy & Harness Wiring

### 4.1 New CRA Unit & jest-axe Test Suites
Under `frontend/src/pages/trades/__tests__/`:
1. `CorporateActionsList.test.js` (Target: **Exactly 12 tests**):
   - Renders action registry table with mocked actions list.
   - Renders empty state and tests "Apply First Corporate Action" CTA navigation.
   - Delete confirmation modal flow: open modal, cancel deletion, confirm deletion, API call dispatch, toast invocation, loading state with `<Loading />`.
   - Decision D19 mobile compact-expand card toggle state.
   - Read-only mode with `canModify = false` (delete actions hidden/disabled).
   - jest-axe accessibility audit: 0 violations across all rendering states.
2. `CorporateActionWizard.test.js` (Target: **Exactly 14 tests**):
   - Step 1: Open positions render in select dropdown, position change updates preview KPI tiles.
   - Step 1: Empty positions state alert when no active shares exist.
   - Step 2: Split vs Bonus toggle switching (defaults ratio to 2 for split, 0.1 for bonus), input validation.
   - Step 3: Math parity calculations (multiplier, new shares, new avg price) matching governing I3.
   - Step 3: Form submission, API payload dispatch (`executeCorporateActionWizard`), toast and redirect.
   - jest-axe accessibility audit: 0 violations across Steps 1, 2, and 3.

### 4.2 Deterministic Mock Fixture
Create `frontend/tests/visual/fixtures/corporateActionsMocks.js`:
- Intercepts `GET /api/corporate-actions`: Returns 2 deterministic sample actions:
  - `COMI` (Stock Split, 2:1, effective 2026-01-15, Broker: Thndr).
  - `AMOC` (Bonus Issue, 10.0%, effective 2026-01-10, Broker: Hermes).
- Intercepts `POST /api/trades/corporate-action/wizard`: Returns 200 OK success response.
- Intercepts `DELETE /api/corporate-actions/*`: Returns 200 OK success response.
- Intercepts DataContext trade endpoints (`/api/trades/summary`, `/api/trades/market-prices`, `/api/trades/all`) ensuring `openPosData` is deterministically populated via `computeSummaryData` for Wizard Step 1.

### 4.3 Harness Wiring in Visual & A11y Specs
1. In `frontend/tests/visual/visual.spec.js`:
   - Import `setupCorporateActionsMocks` from `./fixtures/corporateActionsMocks`.
   - Wire handler into route slug check:
     ```javascript
     } else if (route.slug.startsWith('corporate-actions')) {
       await setupCorporateActionsMocks(page);
     }
     ```
2. In `frontend/tests/visual/a11y.spec.js`:
   - Import `setupCorporateActionsMocks` from `./fixtures/corporateActionsMocks`.
   - Wire handler into route slug check for real-browser axe audits.
3. In `frontend/playwright.config.js`:
   - Register `corporate-actions-reference-match` in the `reference` project `testMatch` regex:
     ```javascript
     testMatch: /(reference-frames|dashboard-reference-match|expenditure-reference-match|expenditure-form-reference-match|paycheck-form-reference-match|payroll-history-reference-match|portfolio-reference-match|rebalancing-reports-reference-match|trades-reference-match|corporate-actions-reference-match)\.spec\.js/,
     ```

### 4.4 Reference Match Spec (`corporate-actions-reference-match.spec.js`)
Target assertions:
- Test 1: Desktop Dense Table adheres to Reference Frame 01 (Variant B) token typography, surface, and padding.
- Test 2: Stepper contrast check on `/corporate-actions/wizard`: Step 1 active circle computed `backgroundColor` matches `--fs-accent` (`rgb(20, 184, 166)`) and text `color` matches `--fs-ink` (`rgb(13, 14, 16)`), proving 7.76:1 contrast.
- Test 3: Decision D19 mobile compact-expand cards at 390px, 480px, and 768px:
  - Table is hidden (`display: none;`).
  - Mobile card list is visible (`display: block;` / `flex`).
  - Compact state displays Stock Code, Action Type chip, and Ratio.
  - Expander toggle button has bounding box $\ge 44\times 44\text{px}$.
  - Clicking expander reveals Broker, Effective Date, Notes, and Delete button.
  - Zero page-level horizontal scroll (`scrollWidth <= clientWidth`).
- Test 4: Desktop/tablet table container scrolling (`overflowX === 'auto'`) per Phase 7A precedent (`2624f2b`, walkthrough §8).
- Test 5: Interactive touch targets $\ge 44\times 44\text{px}$ and visible `:focus-visible` outlines. Title: `'interactive touch targets >= 44px and visible focus rings'`.

---

## 5. Complete 18-Gate Verification Protocol

The verification protocol executes sequentially across all 18 gates with guarded PowerShell commands:

### Gate 1: Route Allowlist Verification
```powershell
node frontend/scripts/ui-coverage.js --assert-allowlist
```
*Pass Criteria*: Exits 0; exactly 29 active patterns verified against App.js routes (promoted from 27).

### Gate 2: Contrast Drift Verification
```powershell
node frontend/scripts/tokens.js --check --tables
```
*Pass Criteria*: Exits 0; 0 drift across all contrast tables.

### Gate 3: Test ID & ARIA Label Guard
```powershell
node frontend/scripts/testid-guard.js
```
*Pass Criteria*: Exits 0; 0 deletions of `data-testid` or `aria-label`.

### Gate 4: Tone Scoping & Undefined Token Linter
```powershell
node frontend/scripts/lint-tones.js
```
*Pass Criteria*: Exits 0; 0 tone scoping violations across all page CSS files; 0 undefined tokens across all CSS files.

### Gate 5: Stylelint Ratchet & CSS Audit
```powershell
cd frontend
node scripts/lint-ratchet.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx stylelint src/pages/trades/CorporateActionsList.css src/pages/trades/CorporateActionWizard.css src/styles/theme-components.css
```
*Pass Criteria*: Exits 0; 0 stylelint errors; count of `!important` declarations drops by 16 (9 from list, 7 from wizard); 0 regressions against merge base `dced18e`.

### Gate 6: Targeted ESLint Zero-Warning Audit (All 10 Touched JS/JSX Files)
```powershell
cd frontend
npx eslint src/pages/trades/CorporateActionsList.js src/pages/trades/CorporateActionWizard.js src/pages/trades/__tests__/CorporateActionsList.test.js src/pages/trades/__tests__/CorporateActionWizard.test.js src/components/ProtectedRoute.js tests/visual/fixtures/corporateActionsMocks.js tests/visual/corporate-actions-reference-match.spec.js tests/visual/visual.spec.js tests/visual/a11y.spec.js playwright.config.js --max-warnings=0
```
*Pass Criteria*: Exits 0 with 0 errors and 0 warnings across all 10 touched production, test, config, and mock files.

### Gate 7: CRA Jest Unit & jest-axe Test Suites (Exactly 26 Tests)
```powershell
cd frontend; $env:CI="true"; npm test -- src/pages/trades/__tests__/CorporateActionsList.test.js src/pages/trades/__tests__/CorporateActionWizard.test.js --watchAll=false --runInBand --verbose
```
*Pass Criteria*: Exits 0; exactly 26 tests pass 100% green (12 in list, 14 in wizard); 0 jest-axe accessibility violations.

### Gate 8: Route Guard Characterization Test
```powershell
cd frontend; $env:CI="true"; npm test -- src/App.test.js --watchAll=false
```
*Pass Criteria*: Exits 0; 9/9 tests pass green; no route regressions after allowlist expansion.

### Gate 9: Calculation Parity Characterization Test (Governing I3)
```powershell
cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
```
*Pass Criteria*: Exits 0; 11/11 tests pass byte-identical; wizard math verified against calculations spec.

### Gate 10: Real-Browser Axe Accessibility Audit (axe-core)
```powershell
cd frontend; $env:CI="true"; npx playwright test tests/visual/a11y.spec.js --project=a11y -g "corporate-actions"
```
*Pass Criteria*: Exits 0; 0 critical, 0 serious accessibility violations across `/corporate-actions` and `/corporate-actions/wizard` in real Chromium browser.

### Gate 11: Playwright Reference Match Spec
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=reference tests/visual/corporate-actions-reference-match.spec.js
```
*Pass Criteria*: Exits 0; all reference match assertions pass green (table density, stepper contrast, D19 mobile cards, container scroll).

### Gate 12: Production Build
```powershell
cd frontend; $env:GENERATE_SOURCEMAP="false"; $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
```
*Pass Criteria*: Exits 0; production build compiles cleanly with 0 compilation errors and 0 new warnings.

### Gate 13: Baseline Regeneration & Manifest Verification (10 Snapshots Recaptured)
```powershell
cd frontend
$env:CI="true"
npx playwright test --project=visual tests/visual/visual.spec.js --grep="corporate-actions" --update-snapshots
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/verify-baseline-manifest.js --generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/verify-baseline-manifest.js
```
*Pass Criteria*: 10 existing baseline snapshots recaptured across 5 viewports in `D:\Projects\FinStat-visual-baselines`; manifest verified and remains at 334/334.

### Gate 14: PR-Subset Visual Regression Suite (Waiver W-6A-1 Carry-Forward)
```powershell
cd frontend; $env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset tests/visual/visual.spec.js
```
*Pass Criteria*: Exactly 68/71 passed per Waiver W-6A-1 carry-forward (3 accepted pre-existing AD16 diffs on unthemed payroll routes); 0 diffs attributable to Phase 7B; 0 unexplained diffs.

### Gate 15: Full 326-Test Visual Regression Suite Reconciled
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=visual tests/visual/visual.spec.js
```
*Pass Criteria*: All 326 tests accounted for (325 snapshots + 1 setup test); 10 recaptured Phase 7B snapshots pass; exactly 34 accepted pre-existing diffs under AD14/AD16; exactly 292 passing tests; 0 unexplained diffs; 0 diffs attributable to Phase 7B.

### Gate 16: Touch Target & Focus-Visible Audit
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=reference tests/visual/corporate-actions-reference-match.spec.js -g "interactive touch targets"
```
*Pass Criteria*: Exits 0; all interactive touch targets $\ge 44\times 44\text{px}$; visible keyboard focus rings under `:focus-visible`.

### Gate 17: Reference Frame Conformance & Developer Inspection
Review all 10 snapshots across 5 viewports (1440, 1024, 768, 480, 390px):
- Visual inspection of `/corporate-actions` against Reference Frame 01 (Variant B Dense Table).
- Visual inspection of `/corporate-actions/wizard` against Reference Frame 02 (Variant B Form) and Reference Frame 03 (Variant B Dashboard Stepper).
- Stepper active number strictly uses `--fs-ink` on `--fs-accent` (7.76:1 ratio).
- Table collapse into vertical cards at $\le 768\text{px}$.
- Zero horizontal page overflow at 390px.
- Author walkthrough artifact and submit for user review. No merge or push before user sign-off.

### Gate 18: Unthemed Route Preservation & Walkthrough Readiness
- Confirm 0 diffs attributable to Phase 7B across unthemed routes (with only the accepted pre-existing 34 diffs under AD14/AD16).
- Author authoritative walkthrough `docs/ui-plans/phase_7b_walkthrough.md`.

---

## 6. Remote Push Boundary & Governance Synchronization

### 6.1 Strict No-Push-Until-Sign-Off Policy
- Work stays strictly local on `phase-ui-7b-corporate-actions`.
- **No remote push until explicit user review and sign-off.**
- Only after user signs off the walkthrough will the branch be merged into `main` and pushed strictly as `main` to `origin/main`. Feature branches are never pushed to remote.

### 6.2 Governance Synchronization
Upon user sign-off, update:
1. `UI-UX-PLAN.md` §6.1 Phase Board row for 7B: Mark Completed.
2. `UI-UX-PLAN.md` §5 Route Coverage Matrix: Mark `/corporate-actions` and `/corporate-actions/wizard` themed.
3. `UI-UX-PLAN.md` §6.11 Phase 7B checklist (lines 1808–1815): Check off all 6 items.
4. `UI-UX-PLAN.md` §10 Progress Log: Append Phase 7B completion entry with test counts and baseline commit SHA.
5. `UI-UX-PLAN.md` Cumulative allowlist line (line 2846): Update from 27 to 29.
6. Verify Phase 7B contribution to Phase 7 exit gate (stepper matches dashboard pattern, wizard navigation/validation/submit verified, clean lint and build); full Phase 7 exit gate reconciliation will occur upon completion of Phase 7C.

---

## 7. Execution Steps Checklist

- [ ] **Step 1**: Create local feature branch `phase-ui-7b-corporate-actions` from `main` @ `dced18e`.
- [ ] **Step 2**: Author deterministic API mock `frontend/tests/visual/fixtures/corporateActionsMocks.js` and wire into `visual.spec.js`, `a11y.spec.js`, and `playwright.config.js`.
- [ ] **Step 3**: Re-write `CorporateActionsList.css` with 100% dark tokens, D19 mobile card styles, zero `!important`.
- [ ] **Step 4**: Refactor `CorporateActionsList.js` to decouple `Trades.css` and `Table.css`, adopt `<Loading />`, purge 6 inline styles, add D19 mobile cards, and add accessible delete modal.
- [ ] **Step 5**: Re-write `CorporateActionWizard.css` with 100% dark tokens, stepper styles, zero `!important`.
- [ ] **Step 6**: Refactor `CorporateActionWizard.js` to purge 14 inline styles, apply tokenized stepper, toggles, and impact comparison.
- [ ] **Step 7**: Add Section 16 to `theme-components.css` with scoped semantic theme rules under `html[data-fs-theme]`.
- [ ] **Step 8**: Update `ProtectedRoute.js` (add `/corporate-actions`, `/corporate-actions/wizard` to `THEMED_PATTERNS`) and remove lines 62–63 from `frontend/.eslintignore`.
- [ ] **Step 9**: Author CRA Jest + jest-axe unit tests: `CorporateActionsList.test.js` (12 tests) and `CorporateActionWizard.test.js` (14 tests).
- [ ] **Step 10**: Author Playwright reference match spec `corporate-actions-reference-match.spec.js`.
- [ ] **Step 11**: Execute Gates 1–12 (linters, unit tests, a11y, build).
- [ ] **Step 12**: Execute Gate 13 (recapture 10 corporate actions baselines, verify 334/334 manifest).
- [ ] **Step 13**: Execute Gates 14–16 (PR-subset 68/71, full 326 visual suite, touch targets).
- [ ] **Step 14**: Author walkthrough artifact `phase_7b_walkthrough.md` (Gate 17/18) and present to user for review and sign-off.
