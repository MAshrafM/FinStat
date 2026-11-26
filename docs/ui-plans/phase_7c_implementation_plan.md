# UI Phase 7C Implementation Plan — Mutual Funds Subsystem

- **Date**: 2026-11-25 (original draft)
- **Revision Date**: 2026-11-26
- **Revision**: v4 — incorporates `docs/ui-plans/phase_7c_implementation_plan_review.md`, the v2/v3 cross-plan review against `UI-UX-PLAN.md` / 7A–7B walkthroughs, and the v3 review corrections (scoped overflow gate, baseline SHA lifecycle, executable line-count check, state-evidence scope, governance sync, and pass-count precedent)
- **Status**: Approved and executed (user sign-off 2026-11-26; see `phase_7c_walkthrough.md`)
- **Merge Base**: `main` @ `5298b11`
- **Starting Baseline Commit**: `cfaadb5` in `D:\Projects\FinStat-visual-baselines` (334/334 manifest verified)
- **Target Routes (4 routes)**:
  - `/mutual-funds` — Mutual Fund Transaction Log (`MutualFundLogPage.js`)
  - `/mutual-funds/new` — Add Mutual Fund Transaction (`AddMutualFundPage.js` + `MutualFundForm.js`)
  - `/mutual-funds/edit/:id` — Edit Mutual Fund Transaction (`EditMutualFundPage.js` + `MutualFundForm.js`)
  - `/mutual-funds/summary` — Mutual Fund Holdings Summary (`MutualFundSummaryPage.js`)
- **Target Production Files**:
  - `frontend/src/pages/mutual-funds/MutualFunds.css` *(New dedicated tokenized stylesheet)*
  - `frontend/src/pages/mutual-funds/MutualFundLogPage.js`
  - `frontend/src/pages/mutual-funds/AddMutualFundPage.js`
  - `frontend/src/pages/mutual-funds/EditMutualFundPage.js`
  - `frontend/src/pages/mutual-funds/MutualFundForm.js`
  - `frontend/src/pages/mutual-funds/MutualFundSummaryPage.js`
  - `frontend/src/styles/theme-components.css` (Section 17: Phase 7C Mutual Funds Semantic Themes)
  - `frontend/src/components/ProtectedRoute.js` (Allowlist expansion: 29 → 33 patterns)
  - `frontend/.eslintignore` (Remove lines 50–53: `MutualFundForm.js`, `MutualFundLogPage.js`, `MutualFundSummaryPage.js`, `MutualFundForm.test.js`)
  - `frontend/playwright.config.js` (Register `mutual-funds-reference-match.spec.js`)
- **Target Test & Mock Files**:
  - `frontend/src/pages/mutual-funds/__tests__/MutualFundLogPage.test.js` *(New CRA Jest + jest-axe suite: 12 tests)*
  - `frontend/src/pages/mutual-funds/__tests__/MutualFundForm.test.js` *(Expand 4 → 14 tests with jest-axe, accessibility, and math-parity assertions)*
  - `frontend/src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js` *(Expand 1 → 12 tests with jest-axe, `Delta`, D19, and math-parity assertions)*
  - `frontend/tests/visual/fixtures/mutualFundsMocks.js` *(New deterministic API mock)*
  - `frontend/tests/visual/mutual-funds-reference-match.spec.js` *(New Playwright reference match spec)*
  - `frontend/tests/visual/visual.spec.js` (Mock wiring for `mutual-funds*`)
  - `frontend/tests/visual/a11y.spec.js` (Mock wiring for `mutual-funds*`)
- **Governance Files Touched After Sign-Off**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§4.3.1 confirmation, §5.6 census/matrix, §6.1 board, §6.11 checklist and Phase 7 exit gate, §7.1 overflow exception, §10 progress log, cumulative allowlist)
  - `docs/ui-plans/phase_7c_walkthrough.md` (Author during Gate 19)
  - `CHANGELOG.md`
  - `AGENTS.md` (baseline-count correction: 325 → 334)
- **Governing References**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§2 Invariants I1–I16, §4.3 Tone Rules and §4.3.1 provenance, §4.8, §5.6 Route Coverage, §6.3 allowlist, §6.4 patterns, §6.11 Phase 7C checklist and Phase 7 exit gate, §7.1/§7.2 DoD, §9.2, §10 Progress Log, §14 Push Policy)
  - `docs/ui-plans/phase_7c_implementation_plan_review.md` (2026-11-25 review findings incorporated in v2; v3 adds the cross-plan/walkthrough review corrections; v4 adds the v3 review corrections)
  - `docs/ui-plans/phase_7a_walkthrough.md`, `docs/ui-plans/phase_7b_walkthrough.md`, `docs/ui-plans/phase_7b_implementation_plan.md` (verification and governance precedent)
  - Canonical Reference Frames: `01-dense-table.html` (Variant B), `02-form.html` (Variant B), `03-dashboard.html` (Variant B)
  - `AGENTS.md` (Design tokens, anti-slop bans, D22 multi-theme door preservation)

---

## 0. Recorded Plan Decisions for This Revision

These decisions resolve the review's open items and carry into the walkthrough and the §10 progress-log entry. They are subject to user sign-off.

1. **Typography (review §5.1)**: Keep D16/AD10/§6.4/§7.2 behaviour. `.fs-num` remains IBM Plex Sans with `font-variant-numeric: tabular-nums` and right alignment. `.fs-code`/`.fs-mono` are reserved for fund-code identifiers only. No AMENDMENT to mono figures is proposed.
2. **P&L labels (review §5.2)**: Use the recorded §4.3.1 label `Gain` / `Loss`. Do not introduce `Profit` / `Loss` as a P&L label; “% Profit” remains the table column heading, but the primitive label is `Gain` or `Loss`.
3. **Shared primitives (review §5.3)**: Accept the implemented `Delta` sign + label behaviour and the shared `ConfirmModal` `<h3>` dialog precedent. No `Delta` arrow support and no `headingLevel` prop are added in 7C. The acceptance criterion is satisfied by an explicit sign, value, and label, never by colour alone. No separate 7C-only modal is created.
4. **Tone provenance**: `Buy`, `Sell`, and `Coupon` are neutral badges. `Price Unavailable` and the coupon-units hint are neutral text/badges whose labels carry the meaning. No new §4.3.1 threshold/label is introduced. Validation errors reuse the existing `.form-error` / `aria-invalid` pattern.
5. **Overflow waiver W-7C-1**: `.mf-table-wrap { overflow-x: auto; }` is retained for the 8-column log table and 9-column summary table per the 7A `2624f2b` / 7B precedent. This waiver is **approved as part of this plan revision** and is therefore active for Gate 5; the §7.1 text update remains a post-sign-off documentation sync. Gate 5 audits only 7C-owned CSS (`src/pages/mutual-funds/*.css`); historical audit-log and `TaxSimulator.css` exceptions remain outside this PR's diff. Page-level overflow at 390px remains prohibited.
6. **Delta arrow language superseded for 7C**: The 7A plan and walkthrough language described `<Delta>` as rendering a sign, arrow, and label. The shared primitive as implemented emits **sign + value + required label** and no arrow. Phase 7C accepts the implemented primitive; the acceptance criterion is an explicit sign, value, and `Gain`/`Loss` label, never colour alone. No primitive change is made.
7. **Shared delete-dialog heading**: The shared `ConfirmModal` renders its title as `<h3>`. Phase 7B's local corporate-actions dialog used `<h2>` to avoid a skipped heading level; that remains a local precedent, not a shared-primitive change. Phase 7C retains the shared `<h3>` behaviour and adds no `headingLevel` prop. Record both points in the walkthrough amendments/waivers register.

---

## 1. Executive Summary & Architectural Scope

Phase 7C completes **Cluster 7 (Investments / Stock Trading & Performance)** by migrating the **Mutual Funds Subsystem** (4 routes) into the FinStat dark graphite design system per **UI-UX-PLAN.md §6.11 (lines 1817–1827)**.

### 1.1 Stylesheet Decoupling (`Trades.css` & `SummaryRow.css`) and Inline-Style Census

Currently:
- `MutualFundLogPage.js` imports `../trades/Trades.css` and uses hardcoded light-theme inline styles (`#3b82f6`, `#eff6ff`, `#1e40af`, `#f3f4f6`, `#c0392b`).
- `MutualFundSummaryPage.js` imports `../trades/Trades.css` and `../../components/SummaryRow.css` (shared with unthemed `GoldSummaryPage.js`), plus inline styles (`#f39c12`, `#27ae60`, `#c0392b`, `#7f8c8d`).
- `MutualFundForm.js` contains **18 inline styles** (`#10b981`, `#ef4444`, `#d1d5db`, `#6b7280`, `#f9fafb`, `#f0f9ff`, `#0ea5e9`, `#f59e0b`).
- The complete 7C inline-style census is **30 occurrences**: 18 in `MutualFundForm.js`, 7 in `MutualFundLogPage.js`, and 5 in `MutualFundSummaryPage.js`. The “15” recorded in UI-UX-PLAN §5.6 line 912 and §6.11 line 1819 is stale and is corrected during governance sync.

In Phase 7C:
1. **Complete Decoupling**: Remove `import '../trades/Trades.css';` and `import '../../components/SummaryRow.css';` from `MutualFundLogPage.js` and `MutualFundSummaryPage.js`. Do not edit the shared CSS files themselves.
2. **Dedicated Scoped Stylesheet**: Author `frontend/src/pages/mutual-funds/MutualFunds.css` scoped strictly under `html[data-fs-theme] .mf-page-container`. All layout, spacing, and neutral tokens live here.
3. **Semantic Tone Isolation**: All tone and accent rules (`--fs-accent`, `--fs-ink`, `--fs-positive`, `--fs-negative`, `--fs-warning`, `--fs-danger`) reside strictly in `frontend/src/styles/theme-components.css` Section 17 (`/* Phase 7C: Mutual Funds Semantic Themes */`) under `html[data-fs-theme]`.
4. **Zero Unthemed Cascade**: The remaining 5 unthemed consumer files / 6 shared-CSS import sites (`GoldSummaryPage.js` × 2 imports, `GoldLogPage.js`, `CurrencyLogPage.js`, `CreditCardPage.js`, `CertificateLogPage.js`) experience zero visual or CSS drift. `GoldSummaryPage.js` retains its own `Trades.css` and `SummaryRow.css` imports.

---

## 2. Plan Commitments & Governing Invariant Mapping (§2 I1–I16)

| Invariant | Verbatim Invariant Definition (§2) | Phase 7C Applicability & Commitment | Verification Gate |
|:---:|---|---|---|
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `/mutual-funds`, `/mutual-funds/new`, `/mutual-funds/edit/:id`, `/mutual-funds/summary` remain unchanged in `App.js`. | Gate 1 (`ui-coverage.js`) & Gate 8 (`App.test.js`) |
| **I2** | No API call, payload shape, or service file changed. | `mutualFundService.js` and `MFContext.js` endpoints/payloads remain untouched; service files appear only in test mocks, not in the production diff. | Gate 6 & PR diff review |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | `MutualFundForm.js` `totalValue` / `totalUnitsForCode` and `MutualFundSummaryPage.js` `valueWithoutCoupons` / `sellingValue` / `totalProfit` remain bit-identical. MF math is characterized by six Gate 7 assertions covering the five named calculations; the existing 8-domain calculation fixtures remain byte-identical and unchanged. | Gate 7 & Gate 9 |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | `ProtectedAction` wrapping “Add Fund Trade”, row Edit link, and row Delete action, plus `useCanModify()` checks preserved. | Gate 7 (`MutualFundLogPage.test.js`) |
| **I5** | Test IDs, `data-testid` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | All existing `data-label` and accessible names preserved; new `aria-label`s added to icon-only buttons and mobile expanders. Existing `role`/`aria-*` on `ConfirmModal` preserved. | Gate 3 (`testid-guard.js`) |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | Desktop/tablet tables use container scroll (`.mf-table-wrap` `overflow-x: auto;`) per 7A `2624f2b` / 7B precedent, recorded as waiver **W-7C-1**. At ≤ 768px, both Log and Summary tables collapse into D19 compact-expand cards with ≥ 44×44px touch targets and zero page-level overflow at 390px. | Gate 11 (`mutual-funds-reference-match.spec.js`) & Gate 16 |
| **I7** | No page loses functionality mid-migration. | All four patterns added to `THEMED_PATTERNS` together in this PR; CRUD, filtering, pagination, coupon auto-reinvest, and summary views remain 100% functional. | Gate 1 (`ui-coverage.js`) & Gate 7 |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain ≤ 120 lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Untouched in Phase 7C. Verified via line-count check and `DashboardSummary.test.js` (6/6 current tests green; the invariant's historical “10” is an assertion-count legacy note preserved from 7B, not the current file's test count). | Gate 8 & dashboard test check |
| **I9** | Production build passes with zero errors and no new warnings. | `npm run build` compiles cleanly with zero errors and zero new warnings under the CI-equivalent build environment. | Gate 12 (`npm run build`) |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | `MutualFundLogPage.test.js`, `MutualFundForm.test.js`, `MutualFundSummaryPage.test.js`, and `App.test.js` pass 100% green. | Gate 7 & Gate 8 |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | Zero `!important` declarations in `MutualFunds.css` or `theme-components.css` Section 17. | Gate 5 (`lint-ratchet.js`) |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` untouched. | Gate 12 & PR diff review |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Decoupling from `Trades.css` and `SummaryRow.css` without editing those files guarantees zero unthemed side-effects. | Gate 14 & Gate 15 |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | Zero banned visual slop in `MutualFunds.css`, `theme-components.css`, and all JSX files. | Gate 5 (`stylelint`) |
| **I15** | Neutral by default: a tone encodes deviation from expectation or attention, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | `MutualFunds.css` uses neutral tokens only. Figures use `.fs-num` (Plex Sans + `tabular-nums`); fund codes use `.fs-code`. `Buy`/`Sell`/`Coupon` are neutral badges. P&L uses `<Delta>` with explicit sign and `Gain`/`Loss` label. `Price Unavailable` is a neutral badge. No page CSS or JSX names a tone token. | Gate 4 (`lint-tones.js`) & Gate 11 |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | All radii strictly ≤ 8px (`--fs-radius-sm/md/lg`) or `--fs-radius-pill` for chips/badges only. | Gate 5 (`stylelint`) |

---

## 3. Detailed Component Conversion Strategy

### 3.0 Shared Conversion Contracts

- **Typography**: `.fs-num` is Plex Sans + `tabular-nums` + right aligned (D16). `.fs-code`/`.fs-mono` are Plex Mono and are used only for fund codes / identifiers. No mono figures.
- **Tone**: Page CSS names classes only; semantic tokens stay in `theme-components.css` Section 17. Category chips and missing-price labels are neutral. `Delta` supplies sign + label; the current primitive does not render an arrow, so acceptance language is “sign and label”, never “arrow”.
- **States**: Every data-fetching surface implements loading, empty, error, and disabled/read-only states with tokens. Form errors use inline `aria-describedby` + `aria-invalid` and the existing `.form-error` treatment (§6.4).
- **Reference Frame 02 Variant B**: Fields render as stacked cards with the label above the control, help text below, inline errors directly under the field, disabled/read-only controls visibly muted, exactly one primary CTA, and a neutral Cancel/Back action.

### 3.1 `MutualFundLogPage.js` (`/mutual-funds`)

- **Container & Header**: `<div className="page-container mf-page-container mf-log-page">` with breadcrumb subtitle `Mutual Funds > Transaction Log`, `<h1>Mutual Fund Log</h1>`, and `<ProtectedAction><Link to="/mutual-funds/new" className="fs-btn fs-btn-primary">Add Fund Trade</Link></ProtectedAction>`.
- **Filter Controls (Reference Frame 01 Variant B)**:
  - Replace all inline-styled filter buttons (`#3b82f6`, `#eff6ff`, etc.) with `.mf-filter-card`, `.mf-filter-buttons`, and `.mf-filter-btn`. `.is-active` is styled in `theme-components.css` Section 17 using `--fs-accent` / `--fs-ink` with 7.76:1 contrast; white-on-accent remains banned.
  - Replace inline-styled active filter banner with `.mf-filter-active-note` (neutral).
- **Loading, Empty & Error States (D23, §7.2)**:
  - Add `isLoading` around `getMutualFundTrades`; render `<Loading variant="table" text="Loading mutual fund transactions..." rows={4} />`.
  - Render `.mf-empty-card` when `trades.length === 0`.
  - Add a `catch` path that sets a tokenized `.mf-error-card` with `role="alert"`; preserve the existing console error and toast behaviour.
- **Desktop & Tablet Dense Table**:
  - Wrapped in `.mf-table-wrap` (`overflow-x: auto;`) inside `.mf-desktop-table` under waiver **W-7C-1**.
  - Monetary/units columns use `.fs-num` (Plex Sans + tabular-nums); fund code uses `.fs-code`.
  - Transaction `Type` renders as a **neutral** `<Badge label={trade.type} />`; no `--buy`, `--sell`, or `--coupon` tone classes.
  - Edit link (`.mf-icon-btn`) and Delete button (`<button type="button" className="mf-icon-btn mf-icon-btn-danger" aria-label={...}>`) replace the clickable `<FaTrash style={{ color: '#c0392b' }} />` icon for keyboard and WCAG accessibility (≥ 32×32px desktop inline target per AD25).
  - Purge all 7 inline styles from this file.
- **Mobile Compact-Expand Cards (Decision D19, ≤ 768px)**:
  - `.mf-mobile-cards` displays compact cards with: Fund Code & Name, Type badge, Total Value (`.fs-num`), and expand/collapse toggle (≥ 44×44px).
  - Expanded drawer reveals: Date, Units, Price, Fees, and full-height Edit / Delete action buttons (≥ 44×44px).
  - Preserve the shared `ConfirmModal` for delete confirmation. Accept its existing `<h3>` heading, focus trap, Escape handling, and focus-return behaviour as the shared precedent; do not add a 7C-only modal or a `headingLevel` prop.

### 3.2 `AddMutualFundPage.js`, `EditMutualFundPage.js`, & `MutualFundForm.js` (`/mutual-funds/new`, `/mutual-funds/edit/:id`)

- **Page Wrappers**:
  - Both pages use `<div className="page-container mf-page-container mf-form-page">` with breadcrumb subtitle (`Mutual Funds > New Transaction` / `Mutual Funds > Edit Transaction`) and `<h1>`.
  - `EditMutualFundPage.js` uses `<Loading variant="form-field" text="Loading transaction data..." />` instead of `<p>Loading transaction data...</p>`. Add an error surface if `getTradeById` rejects; preserve the existing toast error path.
  - Add a neutral secondary Cancel link (`.fs-btn fs-btn-secondary`) back to `/mutual-funds` beside the single primary submit CTA.
- **Form Modernization (Reference Frame 02 Variant B)**:
  - Purge all **18 inline styles** and raw hex colors from `MutualFundForm.js`; combined 7C purge is **30** (18 form + 7 log + 5 summary).
  - Pair every `<label htmlFor="...">` with its input `id` (`mf-date`, `mf-code`, `mf-name`, `mf-type`, `mf-units`, `mf-coupon-amount`, `mf-fees`, `mf-total-value`, `mf-auto-reinvest`) while preserving all existing `name` attributes and label text (`Source Account (Funds Withdrawn)`, `Destination Account (Coupon Deposited)`, `Auto-Reinvest Coupon (Compound Units)`).
  - Use `.fs-input`, the existing checkbox primitives (`.fs-checkbox-label`, `.fs-checkbox-input`, `.fs-checkbox-custom`), and existing `.form-group` / `.form-error` primitives. Implement validation on blur and submit with `aria-describedby` + `aria-invalid`; add a summary error on submit. No new colour-bearing inline style or hex literal.
  - Replace inline code-lookup border/icon colors with neutral classes: `.mf-input-found`, `.mf-input-not-found`, `.mf-field-hint`, and `.mf-field-hint--icon` defined in `MutualFunds.css`; discovery, loading, and not-found hints carry their meaning in text. Do not create `.mf-field-hint--success/error/info/warning` tone classes. If a semantic tone is later required, scope its rule in `theme-components.css` Section 17 and record provenance in §4.3.1 first.
  - Read-only auto-filled Fund Name and auto-calculated Coupon Units use the existing disabled/read-only treatment; no inline `backgroundColor` or `cursor`.
  - Style the submit button with `fs-btn fs-btn-primary mf-submit-btn` (`min-height: 44px`, `--fs-ink` on `--fs-accent`).
  - Preserve `totalValue`, `totalUnitsForCode`, coupon auto-reinvest behaviour, and the exact service payload byte-for-byte.

### 3.3 `MutualFundSummaryPage.js` (`/mutual-funds/summary`)

- **Container & Loading**:
  - `<div className="page-container mf-page-container mf-summary-page">` with breadcrumb `Mutual Funds > Holdings Summary` and `<h1>Mutual Fund Holdings Summary</h1>`.
  - Render `<Loading variant="card" text="Loading mutual fund holdings..." />` while `isLoading` is true.
  - `MFContext` already exposes `error`; render a tokenized `.mf-error-card` with `role="alert"` when present. Do not change `MFContext`.
- **KPI Summary Grid (Reference Frame 03 Variant B)**:
  - 5 graphite `.mf-kpi-card` tiles (`Total of all MF`, `Total of all Coupons`, `New Total`, `Selling Value`, `Profit`), using `.fs-num` (Plex Sans + tabular-nums) for monetary figures and `<Delta>` for `Profit` with explicit sign, value, and the recorded `Gain` / `Loss` label — satisfying the Phase 7 acceptance criterion *“confirm gains/losses without relying on colour alone”*.
- **Holdings Table (Reference Frame 01 Variant B)**:
  - Wrapped in `.mf-table-wrap` (`overflow-x: auto;`) inside `.mf-desktop-table` under waiver **W-7C-1**.
  - Purge all 5 inline styles (`fontWeight: 'bold'`, `#f39c12`, `#27ae60`, `#c0392b`, `#7f8c8d`).
  - Fund code uses `.fs-code`; monetary values and units use `.fs-num`.
  - Missing price renders `<Badge label="Price Unavailable" />` with the default neutral tone. Do not use `tone="warning"`.
  - `Selling Value` renders neutral `.fs-num` (or `'—'` if price unavailable). `% Profit` renders `<Delta>` with explicit sign and `Gain` / `Loss` label (or `'—'` if price unavailable). No arrow is asserted.
- **Mobile Compact-Expand Cards (Decision D19, ≤ 768px)**:
  - Compact state: Fund Name/Code, Selling Value (or `'—'`), `% Profit` `<Delta>` (or `'—'`), and expand/collapse toggle (≥ 44×44px).
  - Expanded drawer: Current Units, Avg. Price Paid, Total Value (Cost Basis), Total Coupons, Value (Excluding Coupons), Current Price (or neutral `Price Unavailable` badge).

### 3.4 Scoped Semantic Themes in `theme-components.css` (Section 17)

All rules referencing accent or tone tokens live in Section 17 under `html[data-fs-theme]` with attribute-existence selectors (D22). Page CSS references classes only.

```css
/* ----------------------------------------------------
   Phase 7C: Mutual Funds Semantic Themes
---------------------------------------------------- */
html[data-fs-theme] .mf-filter-btn.is-active {
  background: var(--fs-accent);
  color: var(--fs-ink);
  border-color: var(--fs-accent);
}

html[data-fs-theme] .mf-icon-btn-danger:hover:not(:disabled),
html[data-fs-theme] .mf-icon-btn-danger:focus-visible:not(:disabled) {
  color: var(--fs-negative);
  border-color: var(--fs-negative);
}

html[data-fs-theme] .mf-error-card {
  border-color: var(--fs-negative);
}
```

No `--fs-positive`, `--fs-negative`, or `--fs-warning` rule is added for `Buy`/`Sell`/`Coupon`, `Price Unavailable`, or the coupon-units hint.

---

## 4. Test Strategy & Harness Wiring

### 4.1 New / Expanded CRA Unit & jest-axe Test Suites

Under `frontend/src/pages/mutual-funds/__tests__/`. Each numbered item below is exactly one `it`/`test`; multiple assertions may be grouped inside that test.

1. **`MutualFundLogPage.test.js` — exactly 12 tests** (new suite):
   1. Renders the dense table with deterministic trades.
   2. All/type filter switching and active-filter note.
   3. Loading table skeleton.
   4. Empty state card.
   5. Fetch-failure `.mf-error-card` with `role="alert"`.
   6. Pagination wiring.
   7. Delete modal open/cancel.
   8. Delete confirm success and toast.
   9. Delete failure error toast.
   10. Read-only mode hides/disables row actions.
   11. D19 compact-expand mobile card toggle.
   12. jest-axe audit: 0 critical/serious violations across rendered states.
2. **`MutualFundForm.test.js` — exactly 14 tests** (expand existing 4 → 14):
   1. (existing) Buy renders Source AccountSelector; no destination/autoReinvest controls.
   2. (existing) Coupon renders destination AccountSelector and autoReinvest toggle; no source control.
   3. (existing) Checking autoReinvest disables the destination selector.
   4. (existing) Submit payload preserves source/destination/autoReinvest and `totalValue`.
   5. `htmlFor`/`id` pairing, accessible names, secondary Cancel link, and exactly one primary CTA (single render-contract test).
   6. Code lookup found state.
   7. Code lookup not-found state.
   8. Code lookup loading state.
   9. Inline validation error with `aria-describedby` + `aria-invalid`, plus disabled/read-only treatment.
   10. **I3 math**: Buy `totalValue = units × price + fees`.
   11. **I3 math**: Sell/Coupon `totalValue = units × price − fees`.
   12. **I3 math**: `totalUnitsForCode = Σ Buy − Σ Sell`, Coupons ignored.
   13. Coupon auto-fill units and auto-reinvest preservation.
   14. jest-axe audit: 0 critical/serious violations.
3. **`MutualFundSummaryPage.test.js` — exactly 12 tests** (expand existing 1 → 12):
   1. (existing, expanded) Null-price safety: renders without throwing and shows `Price Unavailable` plus `'—'` fallbacks for Selling Value / `% Profit`.
   2. Loading card state.
   3. Fetch-error card with `role="alert"`.
   4. 5 neutral KPI tiles render with `.fs-num`.
   5. `Delta` renders sign + value + `Gain`/`Loss` label and no colour-only signal.
   6. Neutral `Price Unavailable` badge (assert no `fs-badge--warning`).
   7. Cost-basis columns render unchanged.
   8. **I3 math**: `valueWithoutCoupons`.
   9. **I3 math**: `sellingValue`.
   10. **I3 math**: `totalProfit`.
   11. D19 compact card and expanded drawer.
   12. jest-axe audit: 0 critical/serious violations.

**Gate 7 target: exactly 38 tests (12 + 14 + 12), 100% green, six I3 math assertions covering the five named calculations, 0 critical/serious jest-axe violations.**

### 4.2 I3 Characterization — No Calculation Fixture Change

Per `UI-UX-PLAN.md` §7.1 and §9.6, calculation fixtures are unchanged. Do **not** add a `mutualFunds.snapshot.json` fixture and do **not** modify `frontend/tests/calculations.spec.js`.

- Gate 9 remains **11/11 tests across the existing 8 domains**, byte-identical to the 1C baseline.
- MF calculation parity is characterized only by the six Gate 7 assertions covering: `totalValue` (Buy and Sell/Coupon variants), `totalUnitsForCode`, `valueWithoutCoupons`, `sellingValue`, and `totalProfit`.
- Any future desire to add a ninth calculation domain requires a separate plan amendment/§10 decision record before implementation.

### 4.3 Deterministic Mock Fixture

Create `frontend/tests/visual/fixtures/mutualFundsMocks.js` exporting `setupMutualFundMocks(page, routeSlug)`. Intercepts:

| Method | Endpoint | Deterministic response |
|---|---|---|
| `GET` | `/api/mutual-funds?page=…&type=…` | 2 transactions per page; supports `all`, `Buy`, `Sell`, `Coupon` filters with `data`, `totalPages`, `currentPage` |
| `GET` | `/api/mutual-funds/all` | 4 transactions: 2 Buy, 1 Sell, 1 Coupon for `AZO` / `MEF01` |
| `GET` | `/api/mutual-funds/code/:code` | Found record for `AZO`; empty array for unknown code |
| `GET` | `/api/mutual-funds/summary` | 2 holdings with `totalValue`, `totalCouponValue`, `currentUnits`, `averagePrice`, `_id.name`, `_id.code` |
| `POST` | `/api/mutual-funds/batch-prices` | `{ prices: [{ name, lastPrice }] }`, including one deliberately missing price for the `Price Unavailable` state |
| `GET` | `/api/mutual-funds/last-price?name=…` | Same deterministic price map for any direct price lookup |
| `GET` | `/api/mutual-funds/:id` | Existing transaction matching the edit route |
| `POST` | `/api/mutual-funds` | `200 OK`, echoes payload |
| `PUT` | `/api/mutual-funds/:id` | `200 OK`, echoes payload |
| `DELETE` | `/api/mutual-funds/:id` | `200 OK` |

Loading, empty, and fetch-failure states are exercised by the Gate 7 Jest suites, not by the baseline gallery or the browser reference/a11y gates. The deterministic visual mocks above cover populated/default states plus the missing-price state; no delayed or failing route variants are added to the visual harness. Gate 11 covers inline validation and disabled/read-only states in the browser.

### 4.4 Harness Wiring in Visual & A11y Specs

1. In `frontend/tests/visual/visual.spec.js` and `a11y.spec.js`, import `setupMutualFundMocks` and wire:
   ```javascript
   } else if (route.slug.startsWith('mutual-funds')) {
     await setupMutualFundMocks(page, route.slug);
   }
   ```
2. In `frontend/playwright.config.js`, register `mutual-funds-reference-match` in the `reference` project `testMatch` regex alongside `corporate-actions-reference-match`.

### 4.5 Reference Match Spec (`mutual-funds-reference-match.spec.js`)

Target assertions:

- Desktop dense tables and KPI grid match Reference Frames 01/03 Variant B computed styles.
- `.fs-num` resolves to the sans stack with `font-variant-numeric: tabular-nums`; fund codes use `.fs-code` mono stack.
- `Buy`/`Sell`/`Coupon` and `Price Unavailable` badges have neutral computed styling (`fs-badge--warning` absent).
- `Delta` exposes sign + value + `Gain`/`Loss`; no arrow assertion.
- Inline validation error and disabled/read-only states match Reference Frame 02.
- D19 mobile compact-expand cards at 390px, 480px, and 768px: table hidden, cards visible, expander ≥ 44×44px, all fields reachable, zero page-level horizontal scroll.
- Desktop/tablet `.mf-table-wrap` computed `overflowX === 'auto'` under waiver **W-7C-1**.
- Test titled `interactive touch targets >= 44px and visible focus rings` verifies primary/mobile targets and real Tab `:focus-visible`.

Implement the eight target assertions as eight spec tests. With the `reference` project's `setup` dependency, Gate 11 expects **9 passed** (1 setup fixture + 8 spec tests); Gate 16 expects **2 passed** (1 setup fixture + 1 filtered touch/focus test).

---

## 5. Complete 19-Gate Verification Protocol

Gates execute sequentially with the PowerShell commands below. Each gate exits 0 before the next begins.

### Gate 1: Route Allowlist Verification
```powershell
node frontend/scripts/ui-coverage.js --assert-allowlist
```
*Pass*: 33/33 active patterns against 75 routes (promoted from 29); four MF patterns present together.

### Gate 2: Token Drift Guard
```powershell
node frontend/scripts/tokens.js --check --tables
```
*Pass*: 0 drift.

### Gate 3: Test ID & ARIA Label Guard
```powershell
node frontend/scripts/testid-guard.js
```
*Pass*: 0 deletions of `data-testid` or `aria-label`.

### Gate 4: Semantic Tone Guard
```powershell
node frontend/scripts/lint-tones.js
```
*Pass*: 0 tone scoping violations in page CSS/JSX; 0 undefined tokens.

### Gate 5: Stylelint Ratchet & CSS Audit
```powershell
cd frontend
node scripts/lint-ratchet.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx stylelint src/pages/mutual-funds/MutualFunds.css src/styles/theme-components.css
Get-ChildItem -Recurse -Path src/pages/mutual-funds -Filter *.css | Select-String -Pattern 'overflow-x'
```
*Pass*: 0 regressions against merge base `5298b11`; 0 stylelint errors; 0 `!important`; radius ceiling and anti-slop rules satisfied. The scoped `overflow-x` audit is limited to 7C-owned CSS in `src/pages/mutual-funds` and returns only `.mf-table-wrap` in `MutualFunds.css` (**W-7C-1, approved in this plan revision and active for this gate**). No new or page-level `overflow-x` is introduced by 7C; the pre-existing audit-log and `TaxSimulator.css` exceptions (currently line 280) remain outside this PR's diff and under §7.1.

### Gate 6: Targeted ESLint Zero-Warning Audit
```powershell
cd frontend
npx eslint src/pages/mutual-funds/AddMutualFundPage.js src/pages/mutual-funds/EditMutualFundPage.js src/pages/mutual-funds/MutualFundForm.js src/pages/mutual-funds/MutualFundLogPage.js src/pages/mutual-funds/MutualFundSummaryPage.js src/components/ProtectedRoute.js src/pages/mutual-funds/__tests__/MutualFundForm.test.js src/pages/mutual-funds/__tests__/MutualFundLogPage.test.js src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js tests/visual/fixtures/mutualFundsMocks.js tests/visual/mutual-funds-reference-match.spec.js tests/visual/visual.spec.js tests/visual/a11y.spec.js playwright.config.js --max-warnings=0
```
*Pass*: 0 errors, 0 warnings across all 14 touched JS files; lines 50–53 removed from `.eslintignore`; no colour-bearing inline styles or raw hex literals. `tests/calculations.spec.js` is untouched and not in scope.

### Gate 7: CRA Jest Unit & jest-axe Suites (Exactly 38 Tests)
```powershell
cd frontend; $env:CI="true"; npm test -- src/pages/mutual-funds/__tests__/MutualFundLogPage.test.js src/pages/mutual-funds/__tests__/MutualFundForm.test.js src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js --watchAll=false --runInBand --verbose
```
*Pass*: 38/38 tests green (12 log + 14 form + 12 summary); six I3 math tests covering the five named calculations green; 0 critical/serious jest-axe violations.

### Gate 8: Route Guard & Dashboard Coordinator
```powershell
cd frontend; $env:CI="true"; npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$lineCount = (Get-Content src/pages/dashboard/DashboardSummary.js).Count
if ($lineCount -gt 120) { throw "DashboardSummary.js line cap exceeded: $lineCount" }
```
*Pass*: 9/9 `App.test.js` route tests and 6/6 `DashboardSummary.test.js` tests green; executable line-count check confirms `DashboardSummary.js` ≤ 120 lines. The invariant's historical “10 RTL dashboard tests” is preserved as the legacy assertion-count note from 7B (`phase_7b_walkthrough.md:89`), not as the current test count for this file.

### Gate 9: Calculation Parity Characterization (I3)
```powershell
cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
```
*Pass*: 11/11 across the existing 8 domains, byte-identical to the 1C baseline; no fixture or runner changes. MF math parity is evidenced by Gate 7 only.

### Gate 10: Real-Browser Axe Accessibility Audit
```powershell
cd frontend; $env:CI="true"; npx playwright test tests/visual/a11y.spec.js --project=a11y -g "mutual-funds"
```
*Pass*: 5 passed (1 setup fixture + 4 MF routes); 0 critical/serious violations under `wcag2a` / `wcag2aa` on all 4 routes.

### Gate 11: Playwright Reference Match Spec
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=reference tests/visual/mutual-funds-reference-match.spec.js
```
*Pass*: 9 passed (1 setup fixture + 8 spec tests); all assertions green — Reference Frame 01/02/03 Variant B tokens, `.fs-num` sans/tabular, `.fs-code` mono, neutral badges, `Delta` sign + `Gain`/`Loss`, inline error, disabled/read-only, D19 cards at 390/480/768, zero page overflow, `.mf-table-wrap` `overflowX === 'auto'` (**W-7C-1**).

### Gate 12: Production Build
```powershell
cd frontend; $env:CI="true"; $env:GENERATE_SOURCEMAP="false"; $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
```
*Pass*: exit 0; zero errors, zero new warnings.

### Gate 13: Baseline Regeneration & Manifest Verification (20 Snapshots)
```powershell
cd frontend
$env:CI="true"
npx playwright test --project=visual tests/visual/visual.spec.js --grep="mutual-funds" --update-snapshots
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/verify-baseline-manifest.js --generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/verify-baseline-manifest.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git -C 'D:\Projects\FinStat-visual-baselines' add -A
git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 7C: recapture 20 mutual-funds baselines"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
```
*Pass*: 20 snapshots recaptured (4 routes × 5 viewports) in `D:\Projects\FinStat-visual-baselines`; manifest verified and remains 334/334; baseline repo changes committed and the emitted short SHA recorded for Gate 19 / §10. `cfaadb5` remains the starting commit only. No baseline push.

### Gate 14: PR-Subset Visual Regression (Waiver W-6A-1)
```powershell
cd frontend; $env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset tests/visual/visual.spec.js
```
*Pass*: 68/71 per W-6A-1 (3 accepted pre-existing AD16 diffs); 0 diffs attributable to 7C.

### Gate 15: Full 326-Test Visual Reconciliation
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=visual tests/visual/visual.spec.js
```
*Pass*: 326 accounted for (292 passed + 34 accepted AD14/AD16 diffs); all 20 recaptured 7C snapshots pass; 0 unexplained diffs; 0 diffs attributable to 7C.

### Gate 16: Touch Targets & Focus Rings
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=reference tests/visual/mutual-funds-reference-match.spec.js -g "interactive touch targets"
```
*Pass*: 2 passed (1 setup fixture + 1 filtered `interactive touch targets >= 44px and visible focus rings` test); ≥ 44×44px primary/mobile targets, ≥ 32×32px desktop inline targets per AD25; visible `:focus-visible` rings.

### Gate 17: Reference Frame Conformance & Developer Inspection
Inspect all 20 snapshots across 1440, 1024, 768, 480, and 390px:
- Log table against Reference Frame 01 Variant B; form against Reference Frame 02 Variant B; summary KPI grid against Reference Frame 03 Variant B.
- Loading, empty, and fetch-failure states are evidenced by Gate 7 Jest suites only; Gate 10/11 do not add delayed or failing route variants. Gate 11 evidences inline validation and disabled/read-only states in the browser. Baseline snapshots cover the default/populated states plus the deterministic `Price Unavailable` state.
- Neutral-by-default tone and `.fs-num` proportional figures verified.
- D19 table collapse at ≤ 768px; zero horizontal page overflow at 390px.
- Confirm `Buy`/`Sell`/`Coupon` and `Price Unavailable` are neutral; P&L shows sign + `Gain`/`Loss`.

### Gate 18: Unthemed Consumer Preservation
Restated count: **5 unthemed consumer files / 6 shared-CSS import sites** remain after 7C decoupling:
- `GoldSummaryPage.js` (`Trades.css` + `SummaryRow.css`) — imports retained.
- `GoldLogPage.js`, `CurrencyLogPage.js`, `CreditCardPage.js`, `CertificateLogPage.js` (`Trades.css`).

Executable check (legacy consumer subset, recomputed for 7C):
```powershell
cd frontend; $env:CI="true"; npx playwright test --project=visual tests/visual/visual.spec.js --grep="corporate-actions|mutual-funds|gold-wallet|certificates|currency|credit-cards"
```
*Pass*: 111/111 (1 auth setup + 22 routes × 5 viewports) green against current baselines: 30 snapshots on the 6 now-themed routes (10 corporate-actions + 20 mutual-funds) and 80 snapshots on the 16 still-unthemed consumer routes. 0 diffs attributable to 7C; the 5 unthemed files / 6 import sites are pixel-identical; only the accepted pre-existing 34 AD14/AD16 diffs appear elsewhere; shared `Trades.css` and `SummaryRow.css` unchanged.

### Gate 19: Walkthrough, User Sign-Off & Merge Boundary
```powershell
# Author docs/ui-plans/phase_7c_walkthrough.md with evidence from Gates 1–18,
# including the §0 decisions, W-7C-1, the 30-style census, the §7.1 exception update,
# and the Gate 13 baseline commit SHA.
```
*Pass*: walkthrough authored, reviewed with the user, and explicitly signed off. Only after sign-off: merge `phase-ui-7c-mutual-funds` into `main`, record branch and merge SHAs plus the Gate 13 baseline commit SHA in §10, and push `main` to `origin/main`. Feature branches are never pushed.

> [!IMPORTANT]
> **Branch & Push Policy (§14)**: All work stays on local branch `phase-ui-7c-mutual-funds`. Only `main` is pushed, and only after explicit user sign-off on the Phase 7C walkthrough.

---

## 6. Governance Synchronization & Remote Push Boundary

### 6.1 Strict No-Push-Until-Sign-Off Policy
- Work stays strictly local on `phase-ui-7c-mutual-funds` from `main` @ `5298b11`.
- No remote push until explicit user review and sign-off of `docs/ui-plans/phase_7c_walkthrough.md`.
- After sign-off, merge into `main` and push only `main` to `origin/main`. Feature branches are never pushed.

### 6.2 Governance Updates After Sign-Off
1. `UI-UX-PLAN.md` §6.1 Phase Board: mark 7C completed.
2. `UI-UX-PLAN.md` §5.6: mark `/mutual-funds`, `/mutual-funds/new`, `/mutual-funds/edit/:id`, `/mutual-funds/summary` themed and QA’d; correct the stale `MutualFundForm` count (`15`) at both §5.6 line 912 and §6.11 line 1819 to the verified **18 inline styles** (full 7C census **18 / 7 / 5 = 30**: 18 in form, 7 in log, 5 in summary).
3. `UI-UX-PLAN.md` §6.11 7C checklist (lines 1819–1823): check all five items.
4. `UI-UX-PLAN.md` §6.11 Phase 7 exit gate (line 1825): record 11 entries, wizard stepper matches dashboard pattern, build/tests/lint/axe/screenshots green, zero diff on non-allowlisted routes, and the user-facing criterion demonstrated via `Delta` sign + `Gain`/`Loss` label.
5. `UI-UX-PLAN.md` §7.1: add **W-7C-1** to the `overflow-x` exception list for `.mf-table-wrap` on the 8-column log and 9-column summary tables, alongside the existing ≥12-column audit-log and `TaxSimulator.css:280` exceptions. The waiver is already approved in §0 of this plan and active for Gate 5; this step is the governing-text sync only.
6. `UI-UX-PLAN.md` §10: append the Phase 7C row with branch SHA, merge SHA, the **Gate 13 baseline commit SHA** (starting commit `cfaadb5` recorded separately), 38 unit tests, unchanged 11/11 calculation tests, 20 snapshots, 334/334 manifest, 29 → 33 allowlist, 30 inline styles purged, 111/111 legacy-consumer subset, and the §0 decisions.
7. `UI-UX-PLAN.md`: update cumulative allowlist value from 29 to 33.
8. `CHANGELOG.md`: add a Phase 7C entry (required by §7.2).
9. `AGENTS.md`: correct the stale 325-baseline reference to 334.
10. Confirm no §4.3.1 amendment is required: `Price Unavailable`, coupon hints, and category chips are neutral; P&L uses the recorded `Gain` / `Loss` label.

### 6.3 Decisions to Carry Into the Walkthrough
Record the §0 decisions in `phase_7c_walkthrough.md` and in the §10 progress-log row before user sign-off:
1. D16 Plex Sans `.fs-num` retained; mono reserved for fund codes.
2. Recorded `Gain` / `Loss` P&L labels retained.
3. `Delta` sign + label and shared `ConfirmModal` `<h3>` accepted; no primitive changes in 7C.
4. Neutral category/missing-price/hint treatments; no new §4.3.1 labels.
5. **W-7C-1** desktop table container-scroll waiver recorded in §7.1 (approved in §0 and active for gates; Gate 5 audits only 7C-owned CSS).
6. No-arrow `<Delta>` acceptance: 7A plan and walkthrough arrow language is superseded for 7C by the implemented sign + value + `Gain`/`Loss` label primitive; no primitive change.
7. Shared `ConfirmModal` `<h3>` accepted; 7B's local `<h2>` dialog remains a local precedent, not a shared-primitive change.
8. Calculation fixtures remain unchanged (`11/11`, 8 domains); MF math is characterized only in Gate 7.

---

## 7. Execution Steps Checklist

- [ ] **Step 1**: Create local branch `phase-ui-7c-mutual-funds` from `main` @ `5298b11`.
- [ ] **Step 2**: Author `mutualFundsMocks.js` with all §4.3 intercepts; wire into `visual.spec.js`, `a11y.spec.js`, and `playwright.config.js`.
- [ ] **Step 3**: Author `MutualFunds.css` with scoped neutral tokens, D19 cards, zero `!important`, and W-7C-1 table wrapper.
- [ ] **Step 4**: Add Section 17 to `theme-components.css` with attribute-existence selectors for active filter, danger hover, and error card only.
- [ ] **Step 5**: Refactor `MutualFundLogPage.js`: decouple `Trades.css`, purge 7 inline styles, add loading/empty/error states, neutral badges, accessible actions, and D19 cards; retain shared `ConfirmModal`.
- [ ] **Step 6**: Refactor `AddMutualFundPage.js`, `EditMutualFundPage.js`, and `MutualFundForm.js`: `Loading variant="form-field"`, purge 18 inline styles, label/id bindings, inline validation, disabled/read-only states, one primary CTA + neutral Cancel, unchanged math and payload.
- [ ] **Step 7**: Refactor `MutualFundSummaryPage.js`: decouple both shared CSS imports, purge 5 inline styles, neutral KPI/table/P&L treatment, `Delta` sign + `Gain`/`Loss`, neutral `Price Unavailable`, and D19 cards.
- [ ] **Step 8**: Add the four MF patterns to `THEMED_PATTERNS` (29 → 33) and remove `.eslintignore` lines 50–53.
- [ ] **Step 9**: Expand/author the three CRA suites to 12/14/12 tests; leave `tests/calculations.spec.js` and all calculation fixtures unchanged (Gate 9 remains 11/11).
- [ ] **Step 10**: Author `mutual-funds-reference-match.spec.js` per §4.5 as eight spec tests (Gate 11: 9 passed with setup; Gate 16: 2 passed with setup).
- [ ] **Step 11**: Execute Gates 1–12.
- [ ] **Step 12**: Execute Gate 13 (recapture 20 snapshots, regenerate and verify 334/334 manifest, commit baseline repo changes, record emitted short SHA).
- [ ] **Step 13**: Execute Gates 14–18 (PR subset 68/71, full 326 reconciliation, touch targets, inspection, 111/111 legacy-consumer subset).
- [ ] **Step 14**: Execute Gate 19 — author `phase_7c_walkthrough.md`, obtain user sign-off, merge, record branch/merge SHAs and the Gate 13 baseline SHA, and push only `main`.
- [ ] **Step 15**: Complete §6.2 governance updates after sign-off.
