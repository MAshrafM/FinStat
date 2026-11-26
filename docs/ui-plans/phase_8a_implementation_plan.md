# UI Phase 8A Implementation Plan — Gold Wallet & Purchasing Power

- **Date**: 2026-11-26 (original draft)
- **Revision Date**: 2026-11-26
- **Revision**: v4 — final review fix: Gate 5 no longer runs the unsatisfiable §7.1 global `overflow-x` grep; it uses the 7C-style scoped audit plus a `5f1b0bb` no-new-overflow diff check, and records the pre-existing §7.1 global-grep / `TaxSimulator.css:277/280` drift as governance-text drift (in addition to all v2/v3 corrections)
- **Status**: Draft — final review complete; ready for approval; no implementation gates executed and no production files changed
- **Merge Base**: `main` @ `5f1b0bb`; **mandatory first branch commit reverts the CI-skip in `5f1b0bb`** (restore `.github/workflows/ci.yml` from `5e92fa4`) — effective code base `5e92fa4`, full CI must be green at merge
- **Starting Baseline Commit**: `fb5e3bf` in `D:\Projects\FinStat-visual-baselines` (334/334 manifest verified)
- **Branch**: `phase-ui-8a-gold` (local only until walkthrough sign-off)
- **Taste Checkpoint**: **#6 — `/gold-wallet` at 1440/390 vs Reference Frame 01 Variant B** (§6.1.1 line 1098); must be approved before 8B starts
- **Target Routes (5)**:
  - `/gold-wallet` — Gold Wallet Log (`GoldLogPage.js`)
  - `/gold-wallet/new` — Add Gold Purchase (`AddGoldPage.js` + `GoldForm.js`)
  - `/gold-wallet/edit/:id` — Edit Gold Purchase (`EditGoldPage.js` + `GoldForm.js`)
  - `/gold-wallet/summary` — Gold Holdings Summary (`GoldSummaryPage.js`)
  - `/analytics/purchasing-power` — Sovereign Gold Purchasing Power vs. CPI Inflation (`PurchasingPowerChart.js`)
- **Target Production Files**:
  - `frontend/src/pages/gold/GoldWallet.css` *(New dedicated tokenized stylesheet)*
  - `frontend/src/pages/gold/GoldLogPage.js`
  - `frontend/src/pages/gold/GoldForm.js`
  - `frontend/src/pages/gold/AddGoldPage.js`
  - `frontend/src/pages/gold/EditGoldPage.js`
  - `frontend/src/pages/gold/GoldSummaryPage.js`
  - `frontend/src/pages/analytics/PurchasingPowerChart.js`
  - `frontend/src/pages/analytics/PurchasingPowerChart.css` *(Tokenized rewrite)*
  - `frontend/src/styles/theme-components.css` (Section 18: Phase 8A Gold Semantic Themes)
  - `frontend/src/components/ProtectedRoute.js` (Allowlist expansion: 33 → 38 patterns)
  - `frontend/.eslintignore` (Remove lines 23, 24, 42–44: chart JS/test and gold form/log/summary)
  - `.github/workflows/ci.yml` *(Revert-only: restore from `5e92fa4`; no other CI edit)*
- **Target Test & Mock Files**:
  - `frontend/src/pages/gold/__tests__/GoldLogPage.test.js` *(New: 12 tests)*
  - `frontend/src/pages/gold/__tests__/GoldSummaryPage.test.js` *(New: 12 tests)*
  - `frontend/src/pages/gold/__tests__/GoldForm.test.js` *(New: 10 tests covering form + add/edit wrappers)*
  - `frontend/src/pages/analytics/__tests__/PurchasingPowerChart.test.js` *(Expand 11 → 16 tests)*
  - `frontend/tests/visual/fixtures/goldMocks.js` *(New deterministic API mock)*
  - `frontend/tests/visual/gold-reference-match.spec.js` *(New Playwright reference match spec)*
  - `frontend/tests/visual/visual.spec.js` and `a11y.spec.js` (Mock wiring for gold routes)
  - `frontend/playwright.config.js` (Register `gold-reference-match.spec.js`)
- **Governance Files Touched After Sign-Off**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§4.3.1 confirmation, §5.6 census/matrix, §6.1 board and §6.1.1 checkpoint #6, §6.12 8A checklist and Phase 8 exit-gate prerequisites, §7.1 W-8A-1, §10 progress log, cumulative allowlist 38)
  - `docs/ui-plans/phase_8a_walkthrough.md` (Author during Gate 19)
  - `CHANGELOG.md`
- **Governing References**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§2 I1–I16; §3.1/§6.1.1 taste checkpoints; §4.3/§4.3.1 tone provenance; §4.12 chart accessibility; §5.6 route coverage; §6.3 allowlist; §6.4 patterns; §6.12 Phase 8A checklist; §7.1/§7.2 DoD; §10 progress log; §14 push policy)
  - `docs/ui-plans/phase_7c_implementation_plan.md`, `phase_7c_implementation_plan_review.md`, `phase_7c_walkthrough.md` (approved structural, review, verification, and governance precedent)
  - `docs/ui-plans/phase_7a_walkthrough.md`, `phase_6a_implementation_plan.md` (taste-checkpoint precedent)
  - Canonical Reference Frames: `01-dense-table.html`, `02-form.html`, `03-dashboard.html` (all Variant B)
  - `AGENTS.md` (design tokens, banned patterns, D22 multi-theme door preservation)

---

## 0. Recorded Plan Decisions

These decisions carry into the walkthrough and the §10 progress-log entry; they are subject to user sign-off.

1. **Inline-style census correction**: §6.12 line 1834 records 9 inline styles for `GoldLogPage.js`; the verified count is **11**. `GoldSummaryPage.js` has 11 (correctly recorded in §5.6 line 925), and `PurchasingPowerChart.js` has 1 **layout-only** inline style (`height: 350`). Total purge: **23** inline styles (11 + 11 + 1). The gold styles are **mixed**, not all colour-bearing: `GoldLogPage.js` has 2 colour-bearing declarations and the remaining 9 are layout/typographic (`display`, `gap`, `alignItems`, `cursor`, `fontWeight`, `textDecoration`, `background`, `border`, `padding`); `GoldSummaryPage.js` has 4 colour-bearing declarations and the remaining 7 are `fontWeight`, `margin`, `marginTop`, and `fontSize`. Zero colour-bearing inline styles remain after the purge. Correct §6.12 line 1834 to 11 during governance sync; §5.6 needs no count correction, only checkbox updates.
2. **Neutral gold identity, with one P&L exception**: §4.3 line 337 gives Gold `weight, price, value` with no warning condition, and line 340 says "a gold holding is never a gold colour". All gold identity figures (weight, price, value, 24K equivalent weight), Hold/Sold/live/stale badges, and KPI tiles other than P&L are neutral. **Unrealised P&L is the sole exception**: §4.3 line 328 allows gain/loss tone, applied only via `<Delta>`. The purchasing-power trajectory is a change column (§4.3.1 line 368: sign only) and stays neutral.
3. **P&L labels**: reuse the recorded `Gain` / `Loss` label (§4.3.1 line 369) via `<Delta>` with explicit sign, value, and label. The implemented primitive has no arrow (7C §0 decision 6 supersedes the arrow language). No new §4.3.1 label or threshold is introduced.
4. **Chart integration and `chartTheme` deviation**: use existing `getChartPalette()` + `withAlpha()` + `baseChartOptions()` + `ariaLabel()` exports. **No new `chartTheme.js` API**. §4.12 line 668 documents `lineDefaults` and pattern/direct-label helpers that the module does not export; this plan records the deviation: line-specific options are composed locally over `baseChartOptions()`, and the last-point direct label is implemented locally without changing shared infrastructure. Accent is never a series (§4.3.2 rule 6). The chart renders one dataset per metric toggle, so the six-series cap is not engaged; the §4.12 table alternative, canvas `aria-label`, and adjacent summary are still required.
5. **W-8A-1 scope and distinct wrappers**: the 13-column log table already qualifies for §7.1's documented "≥ 12-column audit logs" exception; **W-8A-1 covers only the 8-column gold summary table**. Use distinct selectors so the two exceptions are separable and testable: `.gold-log-page .gold-table-wrap { overflow-x: auto; }` (documented ≥12-column audit-log exception) and `.gold-summary-page .gold-table-wrap { overflow-x: auto; }` (W-8A-1). D19 compact-expand cards at ≤ 768px, zero page-level scroll at 390px. `PurchasingPowerChart.css`'s pre-existing `.currency-table-wrapper { overflow-x: auto; }` (line 212) is removed — the currency-holdings table becomes D19 cards with no `overflow-x`.
6. **Shared CSS decoupling**: remove `Trades.css` and `SummaryRow.css` imports from the gold pages; **do not edit those shared files**. After decoupling, **7 files / 8 import sites** remain (`Trades.css`: `TradeLogPage`, `TradeForm`, `TradeSummaryPage`, `CurrencyLogPage`, `CreditCardPage`, `CertificateLogPage`; `SummaryRow.css`: `TradeSummaryPage`, `SummaryRow.js`) and must stay pixel-identical.
7. **I3 characterization**: no calculation fixture or service change; gold math is characterized by unit assertions only; `frontend/tests/calculations.spec.js` stays byte-identical at 11/11 across 8 domains. This follows 7C precedent for an I3 domain not named explicitly in §2.
8. **Push boundary and CI-skip handling**: branch is local only until walkthrough sign-off; merge to `main`, then push only `main` (§14). `5f1b0bb` ("skip backend test yml while working on ui") changed `.github/workflows/ci.yml`; the **first branch commit restores that file from `5e92fa4`**, and Gate 6 verifies a clean diff. Shipping the CI skip would violate §7.1 line 2085 (CI build authoritative).
9. **Taste Checkpoint #6**: `/gold-wallet` at 1440/390 vs Reference Frame 01 Variant B must be developer-approved in Gate 17 and recorded in the walkthrough/§10 **before 8B starts** (§3.1 line 219, §6.1.1 line 1098, §7.2 line 2135).
10. **Typography (D16/AD10)**: `.fs-num` remains IBM Plex Sans + `font-variant-numeric: tabular-nums` + right alignment for all gold weights, prices, totals, and chart figures. Mono (`.fs-code`/`.fs-mono`) is reserved for identifiers only. No mono-figures amendment.
11. **Chart unit-test count**: expand `PurchasingPowerChart.test.js` from 11 to **16** tests so palette, canvas label/summary, data table, last-point label, and trajectory math are separate assertions; total Gate 7 target is **50/50** (12 + 12 + 10 + 16).

---

## 1. Plan Commitments & Governing Invariant Mapping (§2 I1–I16)

| Invariant | Verbatim Invariant Definition (§2) | Phase 8A Applicability & Commitment | Verification Gate |
|:---:|---|---|---|
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | The five gold routes stay unchanged in `App.js`; only `ProtectedRoute.js` patterns change. | Gate 1 & Gate 8 |
| **I2** | No API call, payload shape, or service file changed. | `goldService.js` and `GoldContext.js` untouched; service files appear only in mocks. | Gate 6 & PR diff review |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Gold weights, prices, gains, 24K equivalents, summary totals, and trajectory math remain bit-identical; characterized by ≥10 Gate 7 assertions; 8-domain fixtures unchanged. | Gate 7 & Gate 9 |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Log Add/Edit/Delete `ProtectedAction` wrappers preserved. | Gate 7 |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | All existing IDs and labels are preserved, not replaced by test edits. Chart `data-testid="loading-state"`, `aria-label="Metric Toggle"`, `aria-label="Timeframe Selection"`, and the `.active` timeframe class remain; new labels are added to icon-only actions without deleting existing ones. | Gate 3 (`testid-guard.js`) & Gate 7 |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | Log (13 cols) uses `.gold-log-page .gold-table-wrap` under the ≥12-column exception; summary (8 cols) uses `.gold-summary-page .gold-table-wrap` under **W-8A-1**; all gold/currency tables collapse to D19 cards at ≤ 768px; chart CSS has zero `overflow-x`. | Gate 5 scoped + diff audit, Gate 11, Gate 16 |
| **I7** | No page loses functionality mid-migration. | All five patterns added in this PR together; CRUD, filters, sorting, pagination, toggles, timeframe selection, and summary views remain functional. | Gate 1 & Gate 7 |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain ≤ 120 lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Untouched; current suite is 6/6 per 7C precedent (historical "10" is an assertion-count legacy note preserved from 7B). | Gate 8 & line-count check |
| **I9** | Production build passes with zero errors and no new warnings. | Full CI restored (no workflow skip); build clean. | Gate 6 & Gate 12 |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | Four gold suites and `App.test.js` green. | Gate 7 & Gate 8 |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | Zero `!important` in `GoldWallet.css`, rewritten chart CSS, and Section 18. | Gate 5 |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` untouched; CI workflow restored, not extended. | Gate 12 & PR diff |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Decoupling without editing shared CSS guarantees zero unthemed drift; Gate 18 = 116/116. | Gate 14, Gate 15, Gate 18 |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | Zero banned visual slop in `GoldWallet.css`, rewritten `PurchasingPowerChart.css`, `theme-components.css` Section 18, and all touched JSX; chart CSS rewrite removes 2 gradients and 5 radii > 8px (radius ceiling tracked under I16). | Gate 5 (stylelint) |
| **I15** | Neutral by default: a tone encodes deviation from expectation or attention, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | Gold identity figures neutral; P&L via `<Delta>` only; no raw hex or tone token in page CSS/JSX. | Gate 4 & Gate 11 |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | All radii in 8A CSS use `--fs-radius-sm/md/lg` or pill for badges only. | Gate 5 |

---

## 2. Architecture and File Surface

### 2.1 New and rewritten production files

- `frontend/src/pages/gold/GoldWallet.css` — scoped under `html[data-fs-theme] .gold-page-container` (attribute-existence selector per D22) with page sub-scopes `.gold-log-page`, `.gold-form-page`, and `.gold-summary-page` so the log and summary table wrappers are separable; neutral tokens for layout, tables, KPI tiles, form cards, and D19 cards; zero `!important`, raw hex, or tone tokens.
- `frontend/src/pages/analytics/PurchasingPowerChart.css` — tokenized rewrite: remove 44 raw hex values, 2 `linear-gradient` declarations, 5 radii > 8px, and the `.currency-table-wrapper` `overflow-x`; use `--fs-*` tokens and the 8px ceiling.
- `frontend/src/styles/theme-components.css` — Section 18 with `html[data-fs-theme] …` selectors for active filters/toggles/sort headers, danger hover/focus, and error surfaces; text on accent is always `--fs-ink`, never white.
- Six gold/chart JSX components as listed in the header, with the specified inline-style purge and state additions.
- `ProtectedRoute.js`: five exact patterns (33 → 38).
- `.eslintignore`: remove five gold/chart entries so touched files are linted under Gate 6.
- `.github/workflows/ci.yml`: revert-only restore from `5e92fa4` as the first branch commit.

### 2.2 Unchanged by design

`goldService.js`, `GoldContext.js`, all API endpoints and payload shapes, `Trades.css`, `SummaryRow.css`, `chartTheme.js`, `calculations.spec.js`, `package.json`, `DashboardSummary.js`, all routes in `App.js`.

### 2.3 Verified starting census

| File | `style={{` | Notable legacy issues |
|---|---:|---|
| `GoldLogPage.js` | 11 (mixed: 2 colour, 9 layout/typographic) | Imports `Trades.css`; 13-column table; green/red gain; red delete icon |
| `GoldSummaryPage.js` | 11 (mixed: 4 colour, 7 layout/typographic) | Imports `Trades.css` + `SummaryRow.css`; gold-coloured 24K weight; green/red P&L |
| `GoldForm.js` / `AddGoldPage.js` / `EditGoldPage.js` | 0 | Legacy classes only; no `Loading`, validation, error, or Cancel treatment |
| `PurchasingPowerChart.js` | 1 (layout only: `height: 350`) | 9 hex + 5 `rgba` literals; no `chartTheme` import; no canvas `aria-label` or table alternative |
| `PurchasingPowerChart.css` | n/a | 44 hex, 2 gradients, 5 radii > 8px, 1 `overflow-x`, 0 `--fs-*` tokens |

---

## 3. Detailed Component Conversion Strategy

### 3.1 `GoldLogPage.js` (`/gold-wallet`)

- Container `page-container gold-page-container gold-log-page`, breadcrumb subtitle `Gold > Transaction Log`, `<h1>Gold Wallet Log</h1>`; Purchasing Power Analytics link and `ProtectedAction`-wrapped Add CTA use token button classes (`.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`).
- Filter controls: All / Hold / Sold as neutral buttons with an accent `.is-active` state defined in Section 18; active-filter note is neutral text.
- Sortable headers become keyboard-accessible buttons with `aria-sort`; **the active sort header carries the accent indicator in Section 18** (§7.2 line 2117). Preserve exact sort keys (`date`, `karat`, `weight`) and pagination wiring.
- Desktop/tablet 13-column table in `.gold-log-page .gold-table-wrap` (`overflow-x: auto`) under the §7.1 ≥12-column audit-log exception — distinct from the summary wrapper so W-8A-1 remains summary-only; figures in `.fs-num`; Hold/Sold as neutral `<Badge>` labels; `Gain` as `<Delta>` with sign + value + recorded label.
- Edit link and delete action become accessible buttons with `aria-label` and ≥32×32px desktop targets; retain the shared `ConfirmModal` (accept its `<h3>` precedent; no new modal primitive).
- Add loading-table, empty-card, and tokenized fetch-error (`role="alert"`) states; preserve toast paths.
- D19 compact-expand cards at ≤ 768px: compact Item, Karat, Weight, Status, and Gain; expanded drawer exposes Date, Price/g, Price, Paid, Taxes/Fees, Cost/g, Selling Price, and accessible Edit/Delete at ≥44×44px.
- Purge all 11 inline styles. Preserve `totalPrice = weight × price`, `taxes = paid − totalPrice`, `feesPerGram = taxes / weight`, and `gain = (sellingPrice − price) × weight` byte-for-byte.

### 3.2 `GoldForm.js`, `AddGoldPage.js`, `EditGoldPage.js` (`/gold-wallet/new`, `/gold-wallet/edit/:id`)

- Page wrappers use `page-container gold-page-container gold-form-page`, breadcrumb subtitles, `<h1>`, and a neutral Cancel link back to `/gold-wallet` beside exactly one primary CTA.
- `EditGoldPage.js` replaces `<p>Loading...</p>` with `<Loading variant="form-field" text="Loading gold entry..." />` and adds a tokenized error surface; preserve service calls and navigation.
- `GoldForm.js` follows Reference Frame 02 Variant B: stacked field cards, label above control, help text below, inline errors under the field with `aria-describedby` + `aria-invalid`, visibly muted disabled/read-only controls, one primary CTA. Pair every `<label>` with its input `id`; keep all `name` attributes and label text.
- Conditional sold fields (selling price, selling date, destination account) stay unchanged in behaviour; `AccountSelector` integration is unchanged.
- Payload remains byte-identical: `karat` as `Number`, numeric `parseFloat` fields, optional trimmed seller, sold-only selling fields/destination account, and `sourceAccount` default `Bank`.
- P&L/status framing stays neutral; no new tone labels.

### 3.3 `GoldSummaryPage.js` (`/gold-wallet/summary`)

- Decouple both shared CSS imports; `useGoldData()` and `GoldContext.js` remain untouched.
- `<Loading variant="card" text="Loading gold holdings..." />` and a tokenized error surface for context `error` with `role="alert"`.
- KPI summary row becomes graphite tiles (Reference Frame 03 Variant B): Total Paid, Current Value, 24K Equivalent Weight (**neutral**, remove `#f39c12`), 24K Standardized Value, P/L (Holdings) via `<Delta>` (the sole tone exception per §4.3 line 328), Total Sold Value. Figures use `.fs-num`.
- Hold and Sold tables: neutral `.fs-num` figures, `<Delta>` for P&L + percentage; D19 compact-expand cards at ≤ 768px with all fields reachable; W-8A-1 desktop container scroll via `.gold-summary-page .gold-table-wrap { overflow-x: auto; }` for the 8-column tables only.
- Purge all 11 inline styles. Preserve `equivGrams = item.totalWeight × (karat / 24)`, `totalEquivalentGrams = Σ equivGrams`, `totalStandardizedValue = totalEquivalentGrams × 24K spot`, `currentValue = totalWeight × currentPricePerGram`, `profitLoss = currentValue − totalPaid`, `rateOfChange = profitLoss / totalPaid × 100`, and `overallSoldValue = Σ totalSellingPrice`.

### 3.4 `PurchasingPowerChart.js` + CSS (`/analytics/purchasing-power`)

- Import `getChartPalette`, `withAlpha`, `baseChartOptions`, `ariaLabel` from `../../styles/chartTheme.js`; build dataset colors from the neutral ramp / semantic tones only; keep `fill` via `withAlpha`. No hardcoded hex or `rgba` literals in JSX; no accent series.
- Compose chart options over `baseChartOptions()` (tokens for legend, tooltip, grid, ticks); retain tooltip callbacks and y-axis formatting for gold grams / USD / EGP exactly. Implement the time-series last-point direct label locally (§0 decision 4).
- Preserve metric toggles (`gold`/`usd`/`egp`) and timeframe slicing (`30D`/`90D`/`1Y`/`ALL`) and the `trajectoryDelta` calculation; render the trajectory card as a neutral signed `.fs-num` (change column, no tone class). Preserve `data-testid="loading-state"`, both `aria-label`s, and the `.active` class contract.
- Accessibility: `aria-label` on the canvas wrapper plus adjacent summary text from `ariaLabel()`, direct label at the last point, adjacent data-table alternative; feed badges (`live`/`stale`) and KPI cards become neutral with text labels.
- Move the inline `height: 350` to tokenized CSS; rewrite `PurchasingPowerChart.css` with `--fs-*` tokens, no gradients or > 8px radii, and **no `overflow-x`** — the currency-holdings table becomes D19 cards at ≤ 768px, with all fields reachable via expander.
- Purge the 1 inline style and all 9 hex + 5 `rgba` literals from JSX.

### 3.5 `theme-components.css` Section 18

All rules referencing accent or tone tokens live under `html[data-fs-theme]` with attribute-existence selectors (D22). Page CSS references classes only. Scope: active filter/toggle/sort buttons, danger hover/focus for delete controls, and error surfaces. No `.gold-*` rule assigns `--fs-positive`, `--fs-negative`, or `--fs-warning` to weight, price, value, 24K identity, or status labels; P&L tone is delivered only by `<Delta>`.

---

## 4. Test Strategy and Harness Wiring

### 4.1 Jest suites (Gate 7 target: 50 tests)

1. `GoldLogPage.test.js` — **12 tests**: (1) dense 13-column table and all fields; (2) All/Hold/Sold filters; (3) sorting by `date`/`karat`/`weight` with `aria-sort`; (4) pagination; (5) loading table state; (6) empty card; (7) fetch-error `role="alert"`; (8) delete flow — open/cancel/confirm-success/confirm-failure as one parameterized test with four assertions; (9) read-only `ProtectedAction` gating; (10) D19 expander at 390px with all fields reachable and zero page overflow; (11) I3 math assertions for `totalPrice`, `taxes`/`feesPerGram`, and `gain`; (12) jest-axe (0 critical/serious).
2. `GoldSummaryPage.test.js` — **12 tests**: (1) loading + error states; (2) neutral KPI tiles including 24K weight; (3) `Delta` sign + `Gain`/`Loss` label; (4) Hold table + D19 cards; (5) Sold table + D19 cards; (6) I3 `equivGrams`/`totalEquivalentGrams`; (7) I3 `totalStandardizedValue`; (8) I3 `currentValue`; (9) I3 `profitLoss`/`rateOfChange`; (10) I3 `overallSoldValue`; (11) zero page overflow at 390px with all fields reachable; (12) jest-axe (0 critical/serious).
3. `GoldForm.test.js` — **10 tests**: (1) label/`id` pairing and preserved `name` attributes; (2) one primary CTA + neutral Cancel; (3) sold-only fields conditional on status; (4) Add wrapper `POST` payload; (5) Edit wrapper prefill + `PUT` payload; (6) validation with `aria-invalid`/`aria-describedby`; (7) disabled/read-only treatment; (8) `Loading variant="form-field"` + tokenized error surface; (9) byte-identical payload contract (`Number` karat, `parseFloat` numerics, trimmed seller, sold-only fields, `sourceAccount: 'Bank'`); (10) jest-axe (0 critical/serious).
4. `PurchasingPowerChart.test.js` — expand **11 → 16 tests**: retain existing tests 1–11 (KPI cards, line chart, metric toggle, timeframe, currency table, empty state, live/stale badges, API error, currency formatting, accessibility attributes/groups, viewer role); add (12) `chartTheme` palette use with no hardcoded hex/`rgba` and no accent series; (13) canvas wrapper `aria-label` + adjacent `ariaLabel()` summary; (14) data-table alternative; (15) last-point direct label; (16) `trajectoryDelta` math rendered as neutral sign-only `.fs-num`. No colour-only assertions.

All suites: 0 critical/serious jest-axe violations.

### 4.2 I3 characterization

Do not add a gold domain to `frontend/tests/calculations.spec.js` and do not change any fixture. Gate 9 remains 11/11 across the existing 8 domains. Gold math parity is evidenced only by the ≥10 Gate 7 assertions above.

### 4.3 Deterministic mock fixture

`goldMocks.js` exports `setupGoldMocks(page, routeSlug)`. Intercepts:

| Method | Endpoint | Deterministic response |
|---|---|---|
| `GET` | `/api/golds?page&status&sortBy&sortOrder` | Paged logs with `data`, `totalPages`, `currentPage`; supports `all`/`hold`/`sold` |
| `GET` | `/api/golds/summary` | Hold + sold summaries with karat, weights, paid, prices, selling totals |
| `GET` | `/api/golds/price` | Deterministic per-karat price map including `24` |
| `GET` | `/api/golds/:id` | Existing transaction for the edit route |
| `GET` | `/api/golds/purchasing-power` | Timeline with gold grams, USD, EGP, `current`, and `currencyHoldings` |
| `POST` / `PUT` / `DELETE` | `/api/golds` and `/api/golds/:id` | `200 OK`, echo payload / success |

`GoldProvider` is mounted only for `/gold-wallet/summary` (and dashboard routes); log/form/chart consume the service directly. Loading, empty, and failure states are evidenced by Jest, not by delayed visual mocks.

### 4.4 Harness and reference-match spec

- Wire `setupGoldMocks` into `visual.spec.js` and `a11y.spec.js` for the five gold slugs from `fixtures/routes.js`.
- Register `gold-reference-match.spec.js` in the `reference` project of `playwright.config.js`.
- Eight spec tests (+ setup fixture = 9 passed at Gate 11): Reference Frame 01/02/03 Variant B tokens; `.fs-num` sans/tabular; neutral badges and 24K figures; `Delta` sign + label; form inline-error/disabled states; D19 cards at 390/480/768px with zero page overflow (including the currency table); W-8A-1 `overflowX === 'auto'` on `.gold-summary-page .gold-table-wrap` only, with `.gold-log-page .gold-table-wrap` separately asserted as the ≥12-column exception; chart canvas `aria-label`, summary text, and data-table alternative plus ≥44px touch targets and visible `:focus-visible` rings.

---

## 5. Complete 19-Gate Verification Protocol

Gates execute sequentially; each exits 0 before the next begins. Commands are PowerShell, executed from the repository root unless a `cd frontend` is shown.

### Gate 1: Route Allowlist Verification
```powershell
node frontend/scripts/ui-coverage.js --assert-allowlist
```
*Pass*: 38/38 active patterns; five gold patterns present together.

### Gate 2: Token Drift Guard
```powershell
node frontend/scripts/tokens.js --check --tables
```
*Pass*: 0 drift.

### Gate 3: Test ID & ARIA Label Guard
```powershell
node frontend/scripts/testid-guard.js
```
*Pass*: 0 deletions of `data-testid` or `aria-label`; existing IDs and labels are preserved, not replaced by test edits. Chart `loading-state`, both group labels, and the `.active` timeframe class remain; tests may be extended but not updated to excuse a deletion.

### Gate 4: Semantic Tone Guard
```powershell
node frontend/scripts/lint-tones.js
```
*Pass*: 0 direct tone references in page CSS/JSX; 0 undefined tokens.

### Gate 5: Stylelint Ratchet, Anti-Slop, and Overflow Audit
```powershell
cd frontend
node scripts/lint-ratchet.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx stylelint src/pages/gold/GoldWallet.css src/pages/analytics/PurchasingPowerChart.css src/styles/theme-components.css
git grep -n '#14b8a6' -- '*.css'
git grep -nE '<div>Loading|className="loading-spinner"|custom spinner SVG' src -- '*.js'
Get-ChildItem -Recurse -Path src/pages/gold,src/pages/analytics -Filter *.css | Select-String -Pattern 'overflow-x'
git -C .. diff 5f1b0bb -- frontend/src | Select-String -Pattern '^\+.*overflow-x'
```
*Pass*: 0 regressions vs `5f1b0bb`; 0 stylelint errors; 0 `!important`; `#14b8a6` only in `tokens.css`; the scoped audit shows exactly **two** 8A-owned `overflow-x` declarations in `GoldWallet.css` — `.gold-log-page .gold-table-wrap` (§7.1 ≥12-column audit-log exception) and `.gold-summary-page .gold-table-wrap` (W-8A-1) — and **none** in `PurchasingPowerChart.css`; the diff check shows no added `overflow-x` lines beyond those two (the chart’s line 212 is removed); loading grep shows only primitives/test files. No page-level overflow at 390px. The §7.1:2102 global-grep criterion is already red on `main` with 32 pre-existing matches and `TaxSimulator.css:280` (the `:277/280` text is stale); record this as pre-existing governance-text drift in Gate 19, not an 8A defect.

### Gate 6: ESLint, De-Ignore, and CI Restoration
```powershell
cd frontend
npx eslint src/pages/gold/AddGoldPage.js src/pages/gold/EditGoldPage.js src/pages/gold/GoldForm.js src/pages/gold/GoldLogPage.js src/pages/gold/GoldSummaryPage.js src/pages/analytics/PurchasingPowerChart.js src/components/ProtectedRoute.js src/pages/gold/__tests__/GoldLogPage.test.js src/pages/gold/__tests__/GoldSummaryPage.test.js src/pages/gold/__tests__/GoldForm.test.js src/pages/analytics/__tests__/PurchasingPowerChart.test.js tests/visual/fixtures/goldMocks.js tests/visual/gold-reference-match.spec.js tests/visual/visual.spec.js tests/visual/a11y.spec.js playwright.config.js --max-warnings=0
git -C .. diff 5e92fa4 -- .github/workflows/ci.yml
```
*Pass*: 0 errors/warnings; five `.eslintignore` entries removed; no colour-bearing inline styles or hex literals; `git -C .. diff 5e92fa4 -- .github/workflows/ci.yml` is empty (CI skip reverted).

### Gate 7: CRA Jest Unit & jest-axe Suites (50 Tests)
```powershell
cd frontend; $env:CI='true'; npm test -- src/pages/gold/__tests__/GoldLogPage.test.js src/pages/gold/__tests__/GoldSummaryPage.test.js src/pages/gold/__tests__/GoldForm.test.js src/pages/analytics/__tests__/PurchasingPowerChart.test.js --watchAll=false --runInBand --verbose
```
*Pass*: **50/50** (12 + 12 + 10 + 16); ≥10 I3 math assertions; 0 critical/serious jest-axe.

### Gate 8: Route Guard & Dashboard Coordinator
```powershell
cd frontend; $env:CI='true'; npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$lineCount = (Get-Content src/pages/dashboard/DashboardSummary.js).Count
if ($lineCount -gt 120) { throw "DashboardSummary.js line cap exceeded: $lineCount" }
```
*Pass*: 9/9 route tests + 6/6 dashboard tests; line cap held.

### Gate 9: Calculation Parity Characterization (I3)
```powershell
cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
```
*Pass*: 11/11 across the 8 existing domains; byte-identical to baseline.

### Gate 10: Real-Browser Axe Audit
```powershell
cd frontend; $env:CI='true'; npx playwright test tests/visual/a11y.spec.js --project=a11y -g "gold|purchasing-power"
```
*Pass*: 6 passed (1 setup + 5 routes); 0 critical/serious `wcag2a`/`wcag2aa` violations.

### Gate 11: Playwright Reference Match Spec
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/gold-reference-match.spec.js
```
*Pass*: 9 passed (1 setup + 8 spec tests); all assertions green including chart a11y and zero mobile page overflow.

### Gate 12: Production Build
```powershell
cd frontend; $env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
*Pass*: exit 0; zero errors, zero new warnings; CI workflow restored.

### Gate 13: Baseline Regeneration & Manifest Verification (25 Snapshots)
```powershell
cd frontend
$env:CI='true'
npx playwright test --project=visual tests/visual/visual.spec.js --grep="gold-wallet|analytics-purchasing-power" --update-snapshots
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/verify-baseline-manifest.js --generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/verify-baseline-manifest.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git -C 'D:\Projects\FinStat-visual-baselines' add -A
git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 8A: recapture 25 gold snapshots"
git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
```
*Pass*: 25 snapshots recaptured (5 routes × 5 viewports); manifest remains 334/334; baseline commit SHA recorded for Gate 19/§10; no baseline push.

### Gate 14: PR-Subset Visual Regression (W-6A-1)
```powershell
cd frontend; $env:CI='true'; $env:PR_SUBSET='true'; npx playwright test --project=pr-subset tests/visual/visual.spec.js
```
*Pass*: 68/71 with only 3 accepted W-6A-1/AD16 diffs; 0 attributable to 8A.

### Gate 15: Full 326-Test Visual Reconciliation
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js
```
*Pass*: 326 accounted (292 passed + 34 accepted AD14/AD16); all 25 recaptured 8A snapshots pass; 0 unexplained or attributable diffs.

### Gate 16: Touch Targets & Focus Rings
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/gold-reference-match.spec.js -g "interactive touch targets"
```
*Pass*: 2 passed (1 setup + 1 filtered test); ≥44px primary/mobile, ≥32px desktop inline targets, visible `:focus-visible` rings.

### Gate 17: Reference Frame Conformance, Inspection, and Taste Checkpoint #6
Inspect all 25 snapshots at 1440/1024/768/480/390:
- Log table and summary table against Frame 01 Variant B; form against Frame 02 Variant B; KPI tiles against Frame 03 Variant B.
- Loading/empty/fetch-failure states evidenced by Gate 7; inline validation and disabled/read-only by Gate 11; baselines cover populated/default states.
- Neutral-by-default tone, with P&L as the sole `<Delta>` exception; `.fs-num` proportional figures; D19 collapse; zero page overflow at 390px.
- **Taste Checkpoint #6**: developer approves rendered `/gold-wallet` at 1440 and 390 against Reference Frame 01 Variant B, records the approval in `phase_8a_walkthrough.md`, and authorizes 8B to start (§6.1.1).

### Gate 18: Unthemed Consumer Preservation
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js --grep="corporate-actions|mutual-funds|gold-wallet|analytics-purchasing-power|certificates|currency|credit-cards"
```
*Pass*: **116/116** (1 setup + 23 routes × 5 viewports = 55 themed + 60 still-unthemed snapshots). The four gold-wallet routes were already in the 7C 22-route subset; only `/analytics/purchasing-power` is added. 0 diffs attributable to 8A; 7 files / 8 shared-CSS import sites pixel-identical.

### Gate 19: Walkthrough, User Sign-Off & Merge Boundary
Author `docs/ui-plans/phase_8a_walkthrough.md` with Gates 1–18 evidence, all §0 decisions, W-8A-1, the 23-style census, the CI-skip revert, Gate 13 baseline SHA, Taste Checkpoint #6 approval, and the §7.1 global-grep / `TaxSimulator.css:280` governance-text drift note (pre-existing, not 8A-attributable). Only after sign-off: merge `phase-ui-8a-gold` into `main`, record branch/merge SHAs plus baseline SHA in §10, confirm CI runs the full workflow, and push only `main` to `origin/main`.

> [!IMPORTANT]
> **Branch & Push Policy (§14)**: feature branches are never pushed; only `main`, and only after explicit walkthrough sign-off.

---

## 6. Governance Synchronization & Remote Push Boundary

### 6.1 Strict No-Push-Until-Sign-Off Policy
- Work stays local on `phase-ui-8a-gold` from `main @ 5f1b0bb`, with the CI-skip reverted as the first commit.
- No push until explicit user sign-off on `phase_8a_walkthrough.md`; after sign-off, merge into `main` and push only `main`.

### 6.2 Post-Sign-Off Governance Updates
1. `UI-UX-PLAN.md` §6.12: check all five 8A checklist items; correct the stale `GoldLogPage.js` count at line 1834 from 9 to 11 (§5.6 line 925 already records 11 for the summary page).
2. `UI-UX-PLAN.md` §5.6: mark all five gold routes themed and QA'd.
3. `UI-UX-PLAN.md` §6.1 and §6.1.1: mark 8A complete and record **Taste Checkpoint #6** approval for `/gold-wallet`.
4. `UI-UX-PLAN.md` §7.1: add **W-8A-1** for `.gold-summary-page .gold-table-wrap` (8-column summary only) to the documented `overflow-x` exceptions; note that `.gold-log-page .gold-table-wrap` uses the ≥12-column audit-log exception and `PurchasingPowerChart.css` has no `overflow-x`.
5. `UI-UX-PLAN.md` §10: append the 8A row with branch/merge/baseline SHAs, the CI-skip revert, 50 unit tests, unchanged 11/11 calculation tests, 25 snapshots, 334/334 manifest, 33 → 38 allowlist, 23 inline styles purged (11 log + 11 summary mixed colour/layout + 1 chart layout-only; zero colour-bearing inline styles remain), 116/116 Gate 18, and all §0 decisions. Update the cumulative allowlist to 38.
6. `UI-UX-PLAN.md` Phase 8 exit gate: record 5 of 16 routes themed; 8B–8E remain open.
7. `CHANGELOG.md`: add the Phase 8A entry required by §7.2.
8. Confirm no §4.3.1 amendment is required: gold identity neutral; recorded `Gain`/`Loss` reused; trajectory sign-only; no new threshold.
9. Record in the walkthrough and §10 that §7.1:2102’s global `overflow-x` grep is already non-clean on `main` (32 pre-existing matches; `TaxSimulator.css:280`, not `:277/280`). Phase 8A used the 7C-style scoped audit plus the `5f1b0bb` no-new-overflow diff check instead; this is pre-existing governance-text drift, not an 8A defect.

### 6.3 Decisions to Carry Into the Walkthrough
All eleven §0 decisions, plus: W-8A-1 active from plan approval for Gate 5; Gate 5 uses the scoped + diff overflow audit and records the §7.1 global-grep drift as pre-existing; no `chartTheme.js` API change; no calculation-fixture change; shared CSS files unchanged; CI skip reverted; Taste Checkpoint #6 approved before 8B; Phase 8 exit gate remains open until 8B–8E complete.

---

## 7. Execution Steps Checklist

- [ ] **Step 1**: Create local branch `phase-ui-8a-gold` from `main @ 5f1b0bb`; **first commit restores `.github/workflows/ci.yml` from `5e92fa4`**.
- [ ] **Step 2**: Author `goldMocks.js`; wire into `visual.spec.js`/`a11y.spec.js` and `playwright.config.js`.
- [ ] **Step 3**: Author `GoldWallet.css` and rewrite `PurchasingPowerChart.css` with tokens, D19 cards, zero `!important`, distinct log/summary wrappers (`.gold-log-page .gold-table-wrap` ≥12-column exception; `.gold-summary-page .gold-table-wrap` W-8A-1), and no chart `overflow-x`.
- [ ] **Step 4**: Add Section 18 to `theme-components.css` (active filter/toggle/sort, danger hover, error surfaces).
- [ ] **Step 5**: Refactor `GoldLogPage.js`: decouple `Trades.css`, purge 11 inline styles, accessible sort/actions with accent sort indicator, neutral badges/`Delta`, loading/empty/error, D19 cards, shared `ConfirmModal`.
- [ ] **Step 6**: Refactor `GoldForm.js`, `AddGoldPage.js`, `EditGoldPage.js`: Reference Frame 02 Variant B, `Loading variant="form-field"`, inline validation, error surface, Cancel, one primary CTA, unchanged payload.
- [ ] **Step 7**: Refactor `GoldSummaryPage.js`: decouple both imports, purge 11 inline styles, neutral KPI tiles with `Delta` P&L exception, D19 cards, unchanged math.
- [ ] **Step 8**: Refactor `PurchasingPowerChart.js`: `chartTheme` palette/options, `ariaLabel()`, canvas label, last-point direct label, data table, neutral KPIs/badges, purge 1 inline style + all literals; currency table to D19 cards.
- [ ] **Step 9**: Add five patterns to `THEMED_PATTERNS` (33 → 38); remove five `.eslintignore` entries.
- [ ] **Step 10**: Author/expand four Jest suites to 12 / 12 / 10 / 16 = 50; leave `calculations.spec.js` and all fixtures unchanged.
- [ ] **Step 11**: Author `gold-reference-match.spec.js` (8 spec tests; Gate 11 = 9 passed, Gate 16 = 2 passed).
- [ ] **Step 12**: Execute Gates 1–12.
- [ ] **Step 13**: Execute Gate 13 (recapture 25 snapshots, regenerate/verify 334/334 manifest, commit baseline repo, record SHA).
- [ ] **Step 14**: Execute Gates 14–16 (68/71, 326/326, touch targets).
- [ ] **Step 15**: Execute Gate 17 (inspection + **Taste Checkpoint #6** approval), then Gate 18 (116/116).
- [ ] **Step 16**: Execute Gate 19 — author walkthrough, obtain sign-off, merge, record SHAs, verify CI, push only `main`.
- [ ] **Step 17**: Complete §6.2 governance updates.

---

## 8. Risks and Watch Items

1. `GoldProvider` is mounted only for `/gold-wallet/summary` (and dashboard routes); mocks/tests must distinguish service consumers from context consumers.
2. Shared `Trades.css`/`SummaryRow.css` must not be edited; Gate 18 is the pixel guard for 7 files / 8 import sites.
3. Tone-leak risks in the chart: `text-green`/`text-red`, `highlight-gold`, and live/stale feed badges must become neutral text-labelled treatments; gold P&L in the summary legitimately keeps `<Delta>` tone per §4.3 line 328.
4. The 13-column log table's D19 cards must expose every field in the expander; `.gold-summary-page .gold-table-wrap` is the only W-8A-1 wrapper and `.gold-log-page .gold-table-wrap` is the separate ≥12-column exception; the currency table must not reintroduce `overflow-x`.
5. The chart data table and last-point label are new structures; the existing 11 chart tests cover only toggles, hence the expansion to 16.
6. Edit-route loading uses `<p>Loading...</p>`; replace with valid `Loading variant="form-field"` (7C review precedent: invalid `variant="form"` silently falls back).
7. CI must not ship with the backend-test skip from `5f1b0bb`; Gate 6 enforces the revert before merge.
8. Taste Checkpoint #6 is a release blocker for 8B; it must be recorded in the walkthrough and §10 before the next cluster sub-phase starts.
