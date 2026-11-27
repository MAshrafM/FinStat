# UI Phase 8D Implementation Plan — Currency

- **Date**: 2026-11-27
- **Revision Date**: 2026-11-27
- **Revision**: **v5** — resolves all R1–R5 required corrections, all 6 medium findings, and all 9 low findings from `docs/ui-plans/phase_8d_implementation_plan_v4_review.md` *(following v1–v4 review cycles)*
- **Status**: Approved & Executed — Awaiting Gate 19 User Sign-Off (2026-11-27; Gate 0 SHA `de0a888`; Impl SHA `79e5afb`; Baseline SHA `d86155f`)
- **Merge Base**: `main` @ `af39772` *(pre-execution tag `ui-phase-8d-start` omitted per Phase 7A–8C process precedent; merge base SHA + baseline SHA provide full traceability)*
- **Starting Baseline Commit**: `39fb1b0` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)
- **Branch**: `phase-ui-8d-currency` *(local branch policy per §14/§10 process precedent; only `main` is pushed after Gate 19 sign-off)*
- **Taste Checkpoint**: **N/A** *(Cluster 8 Taste Checkpoint #6 was delivered and signed off in Phase 8A)*
- **Target Routes (4 routes)**:
  - `/currency` — Foreign Currency Wallet (`CurrencyLogPage.js`, slug `currency`)
  - `/currency/:id` — Currency Detail View (`CurrencyDetailPage.js`, slug `currency-detail`)
  - `/currency/new` — Add New Currency (`AddCurrencyPage.js` + `CurrencyForm.js`, slug `currency-new`)
  - `/currency/edit/:id` — Edit Foreign Currency (`EditCurrencyPage.js` + `CurrencyForm.js`, slug `currency-edit`)
- **Target Production Files**:
  - `frontend/src/pages/currency/Currency.css` *(**NEW**: Scoped D22 stylesheet under `html[data-fs-theme] .curr-page-container` with `.curr-log-page`, `.curr-detail-page`, and `.curr-form-page` sub-scopes)*
  - `frontend/src/pages/certificates/CertificateDetail.css` *(**MODIFY**: Convert now-unimported legacy light CSS to D22 `html[data-fs-theme]` dark graphite tokens, closing Phase 8C's deferred `UI-UX-PLAN.md:1850` item with `0` stylelint/ratchet violations)*
  - `frontend/src/pages/currency/CurrencyLogPage.js` *(**MODIFY**: Decouple `Trades.css`, apply explicit `page-container curr-page-container curr-log-page` root wrapper on every render branch, purge all **36** inline styles [`25` colour-bearing including `opacity` + `11` layout/typographic], `19` hex & `5` `rgba` literals, Frame 01/03 dark layout, right-aligned `.fs-num` rates/valuations, neutral `<Badge>` health chips, unrealized FX P&L per Review Item #1, D19 `<=768px` compact-expand mobile cards closing deferred `:1854`, accessible delete `<button>`, loading/error/empty surfaces)*
  - `frontend/src/pages/currency/CurrencyDetailPage.js` *(**MODIFY**: Decouple `CertificateDetail.css`, apply explicit `page-container curr-page-container curr-detail-page` root wrapper on every render branch, purge all **36** inline styles [`26` colour-bearing including `opacity` + `10` layout/typographic], `48` hex & `3` `rgba` literals, Frame 03 Variant B flat hero & 6 metric tiles, neutral `<Badge>` health chip, unrealized FX P&L per Review Item #1, `chartTheme.js` historical rate chart using the 8C `baseChartOptions()` merge pattern + `layout.padding.top` + `grace: '25%'` + local `currLastPointLabelPlugin` + accessible `<details>`/`<table>` + D19 mobile cards, accessible timeframe button group, loading/error/empty surfaces)*
  - `frontend/src/pages/currency/CurrencyForm.js` *(**MODIFY**: Reference Frame 02 Variant B stacked form, `id`/`htmlFor` pairing, preserved `account-selector-sourceAccount`, read-only implied purchase-rate preview, on-blur + on-submit validation using `currencySchemas.createSchema` semantics across Create & Edit, distinct inline field errors & form summary, exact unchanged payload)*
  - `frontend/src/pages/currency/AddCurrencyPage.js` *(**MODIFY**: Scoped `page-container curr-page-container curr-form-page` wrapper, breadcrumb, `.curr-back-link`, `.curr-submit-error` API error handling)*
  - `frontend/src/pages/currency/EditCurrencyPage.js` *(**MODIFY**: Fix copy-paste header comment, scoped `page-container curr-page-container curr-form-page` wrapper on every branch, `<Loading variant="form-field" />`, fetch-error `.curr-error-card` + Retry, not-found `.curr-empty-card`, `.curr-submit-error`)*
  - `frontend/src/styles/theme-components.css` *(**MODIFY**: Append **Section 21: Phase 8D Currency Semantic & Interactive Themes** under `html[data-fs-theme]`)*
  - `frontend/src/components/ProtectedRoute.js` *(**MODIFY**: Allowlist expansion **42 → 46** patterns: add `'/currency'`, `'/currency/:id'`, `'/currency/new'`, `'/currency/edit/:id'`)*
  - `frontend/.eslintignore` *(**MODIFY**: Remove lines 34–36 — `CurrencyDetailPage.js`, `CurrencyForm.js`, `CurrencyLogPage.js`; preserve line 33 `credit-cards/__tests__/AddTransactionModal.currency.test.js` for Phase 9A)*
  - `frontend/playwright.config.js` *(**MODIFY**: Register `currency-reference-match.spec.js` in the `reference` project)*
- **Execution-Start Governance Prerequisites (Committed on Local `phase-ui-8d-currency` Before Gates 4–18 Run)**:
  - Commit approved `docs/ui-plans/phase_8d_implementation_plan.md` on `phase-ui-8d-currency`.
  - Record Waiver **`W-8D-1`** in `docs/UI-UX_Plan/UI-UX-PLAN.md` **§7.1 (`:2104`)** before Gates 5, 14, 15, 17, and 18 cite it.
  - If Review Item #1 **Option A** is selected by the user, record the `§4.3:328`, `§4.3.1:366/:369`, and initial `§10` label amendment in `docs/UI-UX_Plan/UI-UX-PLAN.md` before running component/a11y/reference gates (Gates 7, 10, 11). *(All status checkboxes `§5.7`, `§6.1`, `§6.12`, `§8.2`, final SHA ledger, and `CHANGELOG.md` remain deferred until Gate 19 sign-off.)*
- **Governance Files Finalized After Gate 19 Sign-Off**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§5.7 `:931–934`, §6.1 `:1068`, §6.12 `:1850`, `:1854`, `:1862–1869`, `:1889`, §8.1 drift note, §8.2 `:2206–2207`, §10 finalized progress log with SHAs & gate counts, cumulative allowlist `46`)
  - `docs/ui-plans/phase_8d_implementation_plan.md` & `docs/ui-plans/phase_8d_walkthrough.md`
  - `CHANGELOG.md` (explicit `AD13` allowlist expansion `42 → 46`)
- **Governing References**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§2 I1–I16; §4.3/§4.3.1 tone provenance; §4.4 CTA & link rules; §4.10 non-colour error cues; §4.12 chart accessibility; §5.7 route coverage; §6.3 allowlist; §6.4 patterns; §6.12 Phase 8C deferrals & Phase 8D checklist; §7.1/§7.2/§7.4 DoD; §8.1/§8.2 CSS inventory & hotspots; §10 progress log; §14 push/merge policy; §15 local verification)
  - Canonical Reference Frames: `01-dense-table.html`, `02-form.html`, `03-dashboard.html` (all Variant B)
  - `AGENTS.md` (tokens, banned anti-patterns, D22 multi-theme door preservation)
  - `backend/validationSchemas/currencySchemas.js` & `backend/routes/currency.js` (strict Zod payload & FX valuation contracts)

---

## 0. Recorded Plan Decisions

1. **Shared CSS decoupling (`Trades.css` strictly untouched) & deferred `CertificateDetail.css` conversion (`UI-UX-PLAN.md:1850`)**:
   - Static import audit confirms `frontend/src/pages/trades/Trades.css` still serves unthemed `frontend/src/pages/credit-cards/CreditCardPage.js` (line 19, Phase 9A) plus themed Trade pages (7A). Therefore, `CurrencyLogPage.js` drops `import '../trades/Trades.css'` and imports `./Currency.css`; **`Trades.css` remains strictly untouched**.
   - Static import audit confirms `frontend/src/pages/currency/CurrencyDetailPage.js` (line 32) is the **sole remaining consumer** of `frontend/src/pages/certificates/CertificateDetail.css`. Once `CurrencyDetailPage.js` switches to `./Currency.css`, `CertificateDetail.css` has zero active consumers. Converting `CertificateDetail.css` in Phase 8D from legacy light rules (`white`, `#e5e7eb`, `12px`/`10px` radii, pixel `box-shadow`, `#6b7280`/`#111827`/`#9ca3af`) to clean D22 `html[data-fs-theme]` graphite tokens (passing `stylelint`, `lint-tones.js`, and `lint-ratchet.js` with `0` violations) formally closes Phase 8C's deferred `UI-UX-PLAN.md:1850` item with zero visual side effects on any route (unused file deletion remains deferred to Phase 12A cleanup).

2. **Verified inline-style & hardcoded-colour census (`72` total — exact match with §5.7/§6.12/§8.2)**:
   - Classification rule: `color`, `background`, `backgroundColor`, `border`, `borderColor`, `boxShadow`, and `opacity` are classified as **colour-bearing**; pure positioning/spacing/font props (`display`, `gap`, `padding`, `margin`, etc.) are classified as **layout/typographic**.
   - `CurrencyLogPage.js` (`311` lines): **36** `style={{` (**25** colour-bearing + **11** layout/typographic), **19** hex literals, **5** `rgba` literals.
   - `CurrencyDetailPage.js` (`394` lines): **36** `style={{` (**26** colour-bearing + **10** layout/typographic), **48** hex literals, **3** `rgba` literals.
   - `CurrencyForm.js` (`70` lines), `AddCurrencyPage.js` (`20` lines), `EditCurrencyPage.js` (`30` lines): **0** inline styles, **0** hex, **0** `rgba`.
   - All **72** inline styles, **67** hex literals, and **8** `rgba` literals are purged to **0**, enforced by Jest DOM `[style]` assertions and Gate 6 ESLint (`--max-warnings=0`).

3. **Strict §4.3 / §4.3.1 semantic tone rules, FX P&L provenance, & inherited `$` formatting**:
   - **Neutral by default**: FX rates (`Purchase Rate`, `Current Rate` per `§4.3:334`), foreign unit amounts, cost basis, current valuation (EGP), holdings count, hero header, and flat metric card surfaces/tiles 1–5 (removing the blue hero gradient `#0284c7 -> #0369a1`, dark-navy detail hero gradient `#0f172a -> #1e293b`, tinted icon tiles, and coloured `2px` P&L border) render on flat dark graphite surfaces (`--fs-surface`, `1px solid --fs-border`, `--fs-radius-lg` 8px, `box-shadow: none`) with neutral `.fs-num` tabular figures. Tile 6 (`Unrealized Gain / Loss`) stays flat neutral graphite on its container surface, with value formatting/tone determined by Review Item #1 (`<Delta>` under Option A vs neutral signed `.fs-num` under Option B).
   - **Rate status / health badges (`Live` / `Live Market Rate`, `Stale` / `Stale Rate (> 24h)`, `Manual` / `Manual Override`)**: Per `UI-UX-PLAN.md §4.3.1` (no conditional tone recorded for rate-feed freshness) and Phase 8A precedent (`GoldLogPage.js` / `PurchasingPowerChart.js` keeping `live/stale` neutral), all 3 states render via **neutral `<Badge tone="neutral">`** wrapping existing `react-icons/fa` icons (`FaCheckCircle`, `FaExclamationCircle`, `FaUserEdit` with `aria-hidden="true"`) + clean text labels. Zero tinted green/amber/blue pills.
   - **FX Unrealized P&L (`totalPnL`, `gainLoss`, `gainLossPct`) — Provenance Resolution**:
     - `UI-UX-PLAN.md §4.3:328` lists unrealised P&L for `portfolio, gold` (with `§4.3.1:369` recording `Gain` / `Loss` for portfolio/trades/gold), whereas `§4.3:335` & `§4.3.1:366` record `FX change` from `CurrencyLogPage.js` & `CurrencyDetailPage.js` as `+` / `−` (`label: "sign only"`). `Delta.js:74` requires `PropTypes.string.isRequired` and `Delta.js:27–29` emits a dev warning when `label` is falsy/empty, so introducing any `<Delta>` label for currency unrealized P&L requires an explicit `§4.3.1 / §10` record (`§4.3.1:371`) committed **before** component & test gates run.
     - **Option A (Recommended — `<Delta>` + pre-gate `§4.3.1` / `§10` amendment)**: Render unrealized FX P&L via canonical **`<Delta>`** (`tone={val > 0 ? 'positive' : val < 0 ? 'negative' : 'neutral'}`, `sign={val > 0 ? 'positive' : val < 0 ? 'negative' : 'none'}`, `label={val > 0 ? 'Gain' : val < 0 ? 'Loss' : 'No change'}`), passing `formatCurrency(Math.abs(val))` (avoiding `--`) paired with explicit signed percentage; commit the `§4.3:328` + `§4.3.1:366/:369` + `§10` amendment on `phase-ui-8d-currency` prior to implementation alongside updated tests and accessible names (`CurrencyLogPage.test.js`, `CurrencyDetailPage.test.js`, `currency-reference-match.spec.js`).
     - **Option B (Alternative — Sign-only neutral `.fs-num`, zero `§4.3.1` amendment)**: Render signed `.fs-num` (`+$…` / `−$…` / `$0.00`) in neutral `--fs-text` without `<Delta>` tone classes or added label words per literal `§4.3.1:366` `"sign only"`. **Pending selection in User Review Required #1.**
   - **Inherited `formatCurrency()` USD `$` formatting on EGP-labelled fields**: `frontend/src/utils/formatters.js:9–17` (`formatCurrency`) returns US dollar `$` formatting (`Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`), while `CurrencyLogPage.js` and `CurrencyDetailPage.js` label monetary/valuation columns `EGP`. Consistent with `I3` and Phase 8B/8C (`CertificateLogPage.js` & `CertificateDetailPage.js` formatting EGP certificates via `formatCurrency()`), Phase 8D proposes retaining `formatCurrency()` unchanged (`formatters.js` untouched), acknowledging that visual baselines lock `$` into EGP-labelled columns unless explicitly changed under **User Review Required #5**.

4. **Section-scoped Single Primary CTA, link affordances, `--fs-danger` reconciliation, & I4 viewer gating (§4.4, §4.10)**:
   - **`CurrencyLogPage.js`**: `Add Currency` (`/currency/new`) = sole **`.fs-btn-primary`** (`--fs-accent` / `--fs-ink`); `Revalue Now` = **`.fs-btn-secondary`** (neutral surface, `<FaSync aria-hidden="true" className={isRevaluing ? 'curr-spin' : ''} />`, `disabled={isRevaluing}`). Existing `<ProtectedAction tooltip="View-only access">` wrappers on `Revalue Now`, `Add Currency`, row `Edit`, and row `Delete` remain intact (I4). Currency name links use underlined **`.curr-name-link`** (`text-decoration: underline; text-underline-offset: 2px` per §4.4 G5). Raw clickable `<FaTrash onClick>` is converted into an accessible `<button type="button" className="curr-icon-btn curr-icon-btn-danger" aria-label={...}>` paired with shared `ConfirmModal` (matching Phase 8B).
   - **`CurrencyDetailPage.js`**: Top `"Back to Foreign Currency"` link uses un-underlined **`.curr-back-link`** (`text-decoration: none` per §4.4 G5 navigation exclusion). `Edit` (`/currency/edit/:id`) = sole **`.fs-btn-primary`**; `Delete` = **`.curr-btn-danger-outline`** (neutral resting, `--fs-danger` hover/focus in Section 21; solid `--fs-danger` confirm appears only inside `ConfirmModal`). Existing non-`ProtectedAction` auth behavior on `CurrencyDetailPage.js` is preserved unchanged per I4.
   - **`CurrencyForm.js` / `AddCurrencyPage.js` / `EditCurrencyPage.js`**: `{Create|Update} Currency` = sole **`.fs-btn-primary`**; `Cancel` link back to `/currency` = **`.fs-btn-secondary`**; top breadcrumb link = **`.curr-back-link`**.
   - **`--fs-danger` Precedent & Reconciliation (§4.4 `:401/:409` vs Phase 8B/8C)**: Using `--fs-danger` hover/focus on `.curr-icon-btn-danger` / `.curr-btn-danger-outline` and `--fs-danger` border styling on `.curr-error-card`, `.curr-form-error-summary`, `.curr-submit-error` follows approved Phase 8B/8C precedent (`theme-components.css:2153–2197`, always resting neutral on delete triggers and pairing error alerts with `role="alert"` and explicit text cues per `§4.10`, reconciled with `§4.4:409` confirmation-only solid fill and Reference Frame 01 `--fs-negative` error styling).

5. **Numerical right-alignment (`§6.12:1865`), D19 compact-expand mobile cards (`:1854`), & Waiver `W-8D-1`**:
   - On `/currency`, all numeric rate and valuation columns (`Amount`, `Purchase Rate`, `Current Rate`, `Current Value (EGP)`, `Unrealized Gain / Loss`) apply `.fs-num` (`font-variant-numeric: tabular-nums`) and `text-align: right` on both `<th>` and `<td>` elements.
   - **Desktop/Tablet (`> 768px`)**: The 9-column holdings table sits inside `.curr-log-page .curr-table-wrap` (`overflow-x: auto` under **Waiver `W-8D-1`**, matching `W-7C-1` / `W-8A-1` / `W-8B-1` precedent for 8/9-column dense financial logs at `1024px`). This wrapper is hidden at `<= 768px`.
   - **Mobile (`<= 768px`, D19)**: Replaces the table with compact-expand vertical cards (`data-testid="currency-mobile-cards"`): compact top row shows Currency link + code, neutral health `<Badge>`, right-aligned Current Value (EGP) `.fs-num`, Unrealized Gain / Loss, and a `>= 44x44px` `Details` expander button (`aria-expanded`, `aria-controls`); expanded panel reveals `Amount`, `Purchase Rate`, `Current Rate`, `Cost Basis`, `Date / Revalued`, and `>= 44x44px` `View Details`, `Edit`, `Delete` actions. Zero page-level overflow at `390px` / `480px` / `768px`. This also formally resolves Phase 8C's deferred currency-log portion of `UI-UX-PLAN.md:1854`.

6. **Historical exchange-rate chart via `chartTheme.js` + Phase 8C `baseChartOptions()` merge pattern + local `currLastPointLabelPlugin` (§4.12 & D22)**:
   - Imports **only existing** `getChartPalette()`, `withAlpha()`, `baseChartOptions()`, `ariaLabel()` from `../../styles/chartTheme.js` (**zero modifications to `chartTheme.js`**).
   - **Explicit Phase 8C options composition** (avoiding `baseChartOptions(overrides)`'s shallow `...overrides.scales` overwrite at `chartTheme.js:99–111`):
     ```js
     const base = baseChartOptions();
     const chartOptions = {
       ...base,
       layout: { padding: { top: 24, right: 16 } },
       plugins: {
         ...base.plugins,
         legend: {
           ...base.plugins?.legend,
           display: true,
           position: 'top',
           labels: {
             ...base.plugins?.legend?.labels,
             color: palette.text2,
             font: { family: 'IBM Plex Sans, -apple-system, sans-serif', weight: '600', size: 12 },
           },
         },
         tooltip: {
           ...base.plugins?.tooltip,
           callbacks: {
             label: (ctx) => `1 ${code} = ${Number(ctx.parsed.y).toFixed(3)} EGP`,
           },
         },
       },
       scales: {
         ...base.scales,
         y: {
           ...base.scales?.y,
           grace: '25%',
           ticks: { ...base.scales?.y?.ticks, callback: (value) => `${value} EGP` },
         },
         x: { ...base.scales?.x, grid: { display: false } },
       },
     };
     ```
   - Single-series line chart (`${code} Exchange Rate (EGP)`) uses `palette.grey4` solid line (`borderWidth: 2.5`, `fill: true` with `withAlpha(palette.grey4, 0.12)`, `pointBackgroundColor: palette.grey4`, `pointRadius: 3`) — zero `#14b8a6` accent series and zero hardcoded `#0284c7` blue literals.
   - Local Chart.js `afterDatasetsDraw` plugin (`currLastPointLabelPlugin`) locates the last non-null numeric datum and draws `${code}: ${val.toFixed(2)} EGP` with explicit top (`chartArea.top + 12`) and right (`chartArea.right - 4`) clamping; combined with `layout.padding.top: 24` and `scales.y.grace: '25%'`, this prevents legend collision across narrow and desktop viewports (**visually inspected across all 5 widths — `1440 / 1024 / 768 / 480 / 390px` — in Gate 17**). Canvas wrapper carries `data-plugin-ids="currLastPointLabelPlugin"` and `aria-label` from `ariaLabel()`.
   - Timeframe controls (`1W`, `1M`, `3M`, `6M`, `All`) render in `<div role="group" aria-label="Exchange rate chart timeframe">` using `<button type="button" aria-pressed={timeframe === tab.id}>` with active accent indicator isolated in `theme-components.css` Section 21.
   - Below the chart sit `data-testid="curr-chart-summary"`, collapsible `<details>`/`<summary>` + `<table data-testid="curr-rate-history-table">` (`<caption>`, `scope="col"`, `data-label`, right-aligned `.fs-num` rate column), and D19 `.curr-history-mobile-cards` at `<= 768px` with **zero `overflow-x`** on the 2-column history table.

7. **Form layout, implied-rate preview, validation cadence & distinct error surfaces (Frame 02 Variant B, §4.10)**:
   - Explicit `id`/`htmlFor` pairing for `curr-name`, `curr-amount`, `curr-price`, `curr-date`; `<AccountSelector>` props stay unchanged preserving auto-generated `id="account-selector-sourceAccount"`.
   - Read-only neutral **Implied Purchase Rate preview** (`data-testid="curr-implied-rate"`): displays `1 ${currencyMap[formData.name] || formData.name} = ${(price / amount).toFixed(4)} EGP` when both `amount > 0` and `price > 0` (using the exact `price / amount` formula already present in `CurrencyLogPage.js:239`, `CurrencyDetailPage.js:111`, and `backend/routes/currency.js:82`).
   - Validation runs **on blur** and **on submit**, applying `currencySchemas.createSchema` required-field & positive-number semantics uniformly across both Create and Edit forms for consistent UX (`updateSchema` permits optional fields server-side). Valid blur/edit immediately clears field errors and resets `aria-invalid="false"` and `aria-describedby`.
   - Distinct error surfaces (never duplicated): inline field errors (`#curr-name-error`, `#curr-amount-error`, `#curr-price-error`, `#curr-date-error`, `role="alert"`), form-level validation summary (`.curr-form-error-summary`, `role="alert"`) on failed submit, and wrapper-level `.curr-submit-error` (`role="alert"`) on `AddCurrencyPage` / `EditCurrencyPage` for API failures.
   - Submit payload stays byte-identical (`{ ...formData, amount: parseFloat(formData.amount), price: parseFloat(formData.price), sourceAccount: formData.sourceAccount || 'Bank' }`) with zero extra keys (satisfying backend `createSchema.strict()` / `updateSchema.strict()`).

8. **Canonical loading, error & empty states + documented §7.4 state-screenshot deviation (D23)**:
   - `CurrencyLogPage.js`: `<Loading variant="table" rows={5} text="Loading foreign currency holdings..." />`; `.curr-error-card` (`role="alert"` + Retry button keeping page header visible); tokenized `.curr-empty-card` with Add Currency link.
   - `CurrencyDetailPage.js`: `<Loading variant="card" text="Loading foreign currency details..." />`; `.curr-error-card` (`role="alert"` + Retry) on fetch error vs `.curr-empty-card` when holding is null/not found; non-fatal `getRateHistory` error falls back gracefully to single-point current-rate chart without crashing holding details.
   - `EditCurrencyPage.js`: fix line 1 header comment (`EditCurrencyPage.js`); `<Loading variant="form-field" text="Loading foreign currency details..." />`; `.curr-error-card` (`role="alert"` + Retry) on fetch failure; `.curr-empty-card` when not found.
   - **Documented Deviation from `UI-UX-PLAN.md §7.4` (`:2155, :2158`)**: Rather than capturing separate unversioned loading, empty, and error PNGs under `docs/ui-snapshots/phase-8d/`, Phase 8D verifies all loading, empty, error, `ConfirmModal` delete, and validation-error states via Gate 7 CRA Jest + jest-axe suites (`38` tests) while versioning all 20 populated 5-width baselines in `D:\Projects\FinStat-visual-baselines`, matching Phase 7C/8A/8B/8C precedent (`phase_8c_walkthrough.md:193`). This §7.4 deviation will be explicitly recorded in `phase_8d_walkthrough.md`.

9. **Untouched protected files (I1, I2, I3, I4, I5, I8, I12)**:
   - Strictly untouched: `currencyService.js`, `CurrContext.js`, `Trades.css`, `Certificates.css`, `chartTheme.js`, `ConfirmModal.js`, `Badge.js`, `Delta.js`, `Loading.js`, `AccountSelector.js`, `formatters.js`, `App.js`, `DashboardSummary.js`, `tests/calculations.spec.js`, `frontend/package.json`.

10. **Deterministic Playwright mocks (`currencyMocks.js`), 100-point rate-history cap, & ordered route matching**:
    - Create `frontend/tests/visual/fixtures/currencyMocks.js` providing deterministic fixtures:
      - `GET /api/currency`: 3 holdings covering **all 3 health states and all 3 P&L signs** — `Dollar (USD)` (Live, positive unrealized gain), `Euro (EUR)` (Stale/`fallback`, negative unrealized loss), `Pound (GBP)` (Manual override, zero/flat change).
      - `GET /api/currency/summary`, `GET /api/currency/price`, `GET /api/currency/:id` (holding `_id: '1'`, Dollar USD), `POST /api/currency/revalue` (returns updated holdings).
      - `GET /api/currency/rate-history*`: generates **100 deterministic daily snapshots in newest-first order**, sliced by `Math.min(100, Math.max(1, parseInt(limit, 10) || 30))` matching `CurrencyDetailPage.js:63` (`{ currencyCode, limit: 100 }`) and `backend/routes/currency.js:141–155`, returning objects shaped `{ _id, date, baseCurrency: 'EGP', source: 'CIB', rate: currencyCode ? (rates[currencyCode] ?? null) : null, rates: { USD, EUR, GBP, JPY, SAR } }` (`rate: null` for unmapped/non-requested codes).
      - **Authoritative timeframe filter behavior**: Under the preserved `limit: 100` fetch (I2), local index slicing in `CurrencyDetailPage.js:141–145` produces exact distinct series counts **`7`** (`1W`), **`30`** (`1M`), **`90`** (`3M`), **`100`** (`6M`, capped by `limit: 100`), and **`100`** (`All`, capped by `limit: 100`), with `6M` and `All` explicitly accepted as capped-equivalent without modifying `CurrencyDetailPage.js:63`.
      - Dispatch inside a single ordered `**/api/currency**` handler using `new URL(route.request().url()).pathname` matching specific paths (`/rate-history`, `/summary`, `/price`, `/revalue`) **before** parameterised `GET /api/currency/:id` so `/rate-history` is never shadowed by `:id`.

11. **§8.1 CSS Inventory & D22 Multi-Theme Door Scope Awareness**:
    - **§8.1 CSS Inventory Drift (`UI-UX-PLAN.md:2167, :2183, :2189`)**: `UI-UX-PLAN.md §8.1` still describes an older `57`-file inventory and omits net-new decoupled module stylesheets (`PaycheckLog.css`, `PayrollAnalyticsPage.css`, `MutualFunds.css`, `GoldWallet.css`, `Certificates.css`) — **63** CSS files exist on disk prior to creating `Currency.css` (`64` after). Creating `Currency.css` continues this decoupled pattern without modifying `Trades.css` and is noted in §4 below.
    - **D22 Route Scope**: `ProtectedRoute.js:143–152` still omits/removes `data-fs-theme` on remaining non-allowlisted routes (`52` → `56` themed routes after `42 → 46` allowlist patterns, leaving non-allowlisted legacy routes unthemed for `I13` fidelity until Phase 12A). Phase 8D enforces D22 attribute-existence selectors (`html[data-fs-theme]`), zero `[data-fs-theme="dark"]` outside `tokens.css`, and unchanged `chartTheme.js` across Phase 8D files without claiming repo-wide D22 completion.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 8D Commitment | Verification Gate |
|:---:|---|---|
| **I1** | 4 routes (`/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id`) unchanged in `App.js`; `ProtectedRoute.js` expands `THEMED_PATTERNS` `42 → 46`. | Gate 1 *(manual stdout)* & Gate 8 |
| **I2** | `currencyService.js` and `CurrContext.js` untouched; all GET/POST/PUT/DELETE payloads and `limit: 100` rate-history call byte-identical (strict Zod compatible). | Gate 6, Gate 7, PR diff |
| **I3** | All FX cost basis, current value, purchase rate, unrealized gain/loss, percentage, and triangular conversion math unchanged (`formatters.js` untouched); characterization suite **11/11** passed across 8 domains (Domain 6 Currency unchanged). | Gate 7 & Gate 9 |
| **I4** | Existing `<ProtectedAction>` & `useCanModify` gating on `CurrencyLogPage.js` (`Revalue Now`, `Add Currency`, `Edit`, `Delete`) preserved unchanged; `CurrencyDetailPage.js` gating unchanged. | Gate 7 |
| **I5** | Existing `data-testid` / `aria-label` counts never decrease (`testid-guard.js --base af39772` `0` deletions); `account-selector-sourceAccount` preserved; accessible labels added to icon buttons, chart wrapper, and timeframe group. | Gate 3 & Gate 7 |
| **I6** | Log table and history table collapse to D19 compact-expand cards at `<= 768px`; `0px` page-level horizontal scroll at `390px`; Waiver `W-8D-1` scoped solely to desktop/tablet `.curr-log-page .curr-table-wrap`. | Gate 5, Gate 11, Gate 17 |
| **I7** | All 4 currency routes migrate atomically in one branch with zero mid-migration loss of revaluation, detail chart, CRUD, or delete flows. | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` untouched (`96` lines `<= 120`) and dashboard Jest suite remains green. | Gate 8 |
| **I9** | Local `CI=true` production build (`2048`MB heap, §15.3/§15.5 documented deviation), ESLint (`--max-warnings=0`), and Stylelint pass cleanly; authoritative CI runs on merge to `main`. | Gate 5, Gate 6, Gate 12 |
| **I10** | New Currency Jest suites (`38` tests) + `App.test.js` + `DashboardSummary.test.js` pass in-band via CRA `npm test`. | Gate 7 & Gate 8 |
| **I11** | Zero `!important` in `Currency.css`, converted `CertificateDetail.css`, and Section 21; `lint-ratchet.js --base af39772` `0` regressions (violation count strictly drops from `CertificateDetail.css` conversion). | Gate 5 |
| **I12** | `frontend/package.json` and lockfile untouched. | PR diff |
| **I13** | Non-allowlisted routes remain pixel-identical to `39fb1b0`, especially `/credit-cards` (unthemed `Trades.css` consumer) and `/certificates*` (8B/8C). | Gate 14, Gate 15, Gate 18 |
| **I14** | Remove both hero `linear-gradient`s (`#0284c7 -> #0369a1` and `#0f172a -> #1e293b`) and all pixel `box-shadow`s; zero blur/glow/mask/gradient rules. | Gate 5 & Gate 6 |
| **I15** | Rates, amounts, valuations, and health badges stay neutral; semantic tones (if Review Item #1 Option A is selected) appear strictly via `<Delta>` + pre-gate §4.3.1/§10 amendment, and Section 21 danger cues pair with `role="alert"` / `ConfirmModal`. | Gate 4 & Gate 11 |
| **I16** | Remove `12px`, `16px`, `20px`, `10px` radii; all cards/tiles/buttons `<= 8px` (`--fs-radius-sm/md/lg`), `--fs-radius-pill` reserved for `<Badge>` only. | Gate 5 & Gate 11 |

---

## 2. Proposed Changes

### Styling & Theme Primitives

#### [NEW] `frontend/src/pages/currency/Currency.css`
- Strictly scoped under `html[data-fs-theme] .curr-page-container` with sub-scopes `.curr-log-page`, `.curr-detail-page`, and `.curr-form-page` (D22 attribute-existence selector only; zero `[data-fs-theme="dark"]`, zero `!important`, zero `var(--fs-accent)` or semantic tone tokens, zero gradients/shadows, radii `<= 8px`).
- **Shared header & feedback**: `.curr-header`, `.curr-breadcrumb`, `.curr-header-actions`, `.curr-back-link` (`text-decoration: none` navigation link), `.curr-error-card`, `.curr-empty-card`, `.curr-spin` (`@keyframes curr-spin`, respects `@media (prefers-reduced-motion: reduce)`).
- **Log layout (`.curr-log-page`)**:
  - 4-tile Frame 03 Variant B KPI grid (`.curr-kpi-grid` / `.curr-kpi-tile` — `Total Cost Basis`, `Current Valuation (EGP)`, `Unrealized Gain / Loss`, `Holdings Count`; explicit `text-align: left` overriding global `.App { text-align: center }`).
  - Desktop/tablet 9-column table inside `.curr-log-page .curr-table-wrap` (`overflow-x: auto`, Waiver `W-8D-1`), right-aligned numeric headers/cells (`.curr-th-num`, `.curr-td-num` using `.fs-num`), underlined `.curr-name-link`, and `.curr-icon-btn` action buttons (`>= 32x32px` desktop).
  - `@media (max-width: 768px)`: hides `.curr-table-wrap`, reveals `.curr-mobile-cards` D19 compact-expand cards with `>= 44x44px` expander & action buttons and `0px` page overflow.
- **Detail layout (`.curr-detail-page`)**:
  - Flat dark graphite hero card (`.curr-detail-hero`, explicit `text-align: left`) showing currency title, neutral health `<Badge>`, neutral current exchange rate line (`1 ${code} = ${currentRate.toFixed(2)} EGP`), and Last Revaluation date.
  - Balanced 6-tile metric grid (`.curr-metrics-grid`: `repeat(3, minmax(0, 1fr))` at `>= 960px`, `repeat(2, minmax(0, 1fr))` at `600px–959px`, `1fr` at `< 600px`), neutral icon containers (`.curr-metric-icon`), neutral `.fs-num` values, and flat container surface on tile 6 with P&L readout per Review Item #1.
  - Chart card (`.curr-chart-card`), timeframe button group (`.curr-timeframe-group`, `.curr-timeframe-btn` `min-height: 36px` desktop / `44px` mobile), `.curr-chart-canvas-wrapper` (`height: 320px`), `.curr-chart-summary`, `<details>`/`.curr-history-details` + `.curr-history-table` (`> 768px`, zero `overflow-x`), and D19 `.curr-history-mobile-cards` (`<= 768px`).
- **Form layout (`.curr-form-page`)**:
  - Reference Frame 02 Variant B stacked card (`.curr-form-card`, `max-width: 640px`, explicit `text-align: left`), `.curr-form-group` labels/inputs/selects (`min-height: 44px`), `.curr-implied-rate-box` neutral preview bar, `.curr-field-help`, `.curr-field-error`, `.curr-form-error-summary`, `.curr-submit-error`, and `.curr-form-actions` (full-width stacked buttons at `<= 600px`).

#### [MODIFY] `frontend/src/pages/certificates/CertificateDetail.css`
- Convert legacy light styles (`.metric-box`, `.metric-icon`, `.metric-label`, `.metric-value`, `.metric-sub`, `@keyframes spin`, `.spin`) to clean D22 `html[data-fs-theme]` dark graphite tokens (`var(--fs-surface)`, `var(--fs-border)`, `var(--fs-radius-lg)`, `box-shadow: none`, `var(--fs-text-*)`) with `0` stylelint/ratchet/tone violations.
- Zero active import sites remain after `CurrencyDetailPage.js` decouples, closing `UI-UX-PLAN.md:1850` with zero regression risk.

#### [MODIFY] `frontend/src/styles/theme-components.css`
- Append **Section 21: Phase 8D Currency Semantic & Interactive Themes** under `html[data-fs-theme]`:
  - `.curr-icon-btn-danger:hover` / `:focus-visible` and `.curr-btn-danger-outline:hover` / `:focus-visible`: `color: var(--fs-danger); border-color: var(--fs-danger);`
  - `.curr-timeframe-btn[aria-pressed="true"]`: `border-color: var(--fs-accent); background: var(--fs-surface-raised); color: var(--fs-text);` (clear interactive accent indicator without violating single primary CTA or white-on-accent bans)
  - `.curr-error-card`, `.curr-form-error-summary`, `.curr-submit-error`: `border-color: var(--fs-danger); color: var(--fs-text);` (always paired with `role="alert"` and explicit text cues per §4.10)
  - `.curr-field-error`: `color: var(--fs-danger);`

---

### Currency Pages & Routing

#### [MODIFY] `frontend/src/pages/currency/CurrencyLogPage.js`
- Replace `import '../trades/Trades.css'` with `import './Currency.css'`.
- Apply explicit root wrapper classes `className="page-container curr-page-container curr-log-page"` on **every** render branch (loading, error, empty, populated).
- Import `{ Badge, Loading }` (plus `Delta` if Review Item #1 Option A is selected) from `../../components/ui`.
- Purge all **36** inline styles, **19** hex literals, and **5** `rgba` literals.
- Preserve exact aggregation formulas (`totalCostBasis`, `totalCurrentVal`, `totalPnL`, `totalPnLPercent`) and per-row derived math (`code`, `amount`, `purchaseRate`, `currentRate`, `currentVal`, `gainLoss`, `gainLossPct`), service calls (`getCurrency`, `revalueCurrency`, `deleteCurrency`), and `ConfirmModal` delete flow.
- Add `fetchError` state rendering `.curr-error-card` (`role="alert"` + Retry button) while keeping the page header visible; replace raw loading `<p>` with `<Loading variant="table" rows={5} text="Loading foreign currency holdings..." />`.
- Render `renderHealthBadge(holding)` with neutral `<Badge tone="neutral">` wrapping existing `FaUserEdit` / `FaExclamationCircle` / `FaCheckCircle` (`aria-hidden="true"`) + `"Manual"` / `"Stale"` / `"Live"`.
- Render portfolio & row Unrealized Gain / Loss per **Review Item #1** (Option A: `<Delta>` `Gain` / `Loss` / `No change`; Option B: sign-only neutral `.fs-num`).
- Right-align all 5 numeric columns with `.fs-num`; render accessible `<button type="button" className="curr-icon-btn curr-icon-btn-danger">` for delete inside `<ProtectedAction>`.
- Add D19 compact-expand mobile cards (`data-testid="currency-mobile-cards"`) with `expandedIds` state and `aria-expanded` / `aria-controls`.

#### [MODIFY] `frontend/src/pages/currency/CurrencyDetailPage.js`
- Replace `import '../certificates/CertificateDetail.css'` with `import './Currency.css'`.
- Apply explicit root wrapper classes `className="page-container curr-page-container curr-detail-page"` on **every** render branch (loading, error, not-found/empty, populated).
- Import `{ Badge, Loading }` (plus `Delta` if Option A is selected) from `../../components/ui` and `{ getChartPalette, withAlpha, baseChartOptions, ariaLabel }` from `../../styles/chartTheme`.
- Purge all **36** inline styles, **48** hex literals, and **3** `rgba` literals.
- Preserve exact metric formulas (`code`, `amount`, `purchaseRate`, `currentRate`, `costBasis`, `currentVal`, `gainLoss`, `gainLossPct`), timeframe filtering (`7`, `30`, `90`, `180`, `all`), `getCurrencyById`, `getRateHistory({ currencyCode: code, limit: 100 })`, `deleteCurrency`, and `ConfirmModal`.
- Handle `getCurrencyById` fetch failure separately (`fetchError` → `.curr-error-card` + Retry) from missing holding (`!currency` → `.curr-empty-card`); catch `getRateHistory` rejection cleanly so holding metrics still render with single-point fallback.
- Render flat dark hero + neutral `<Badge tone="neutral">` health chip (`Manual Override`, `Stale Rate (> 24h)`, `Live Market Rate`) + 6 flat graphite metric tiles (`Unrealized Gain / Loss` tile rendered per **Review Item #1** with signed percentage subline).
- Configure `Line` chart using the explicit Phase 8C `const base = baseChartOptions();` merge pattern (`layout: { padding: { top: 24, right: 16 } }`, `scales: { ...base.scales, y: { ...base.scales?.y, grace: '25%' }, x: { ...base.scales?.x, grid: { display: false } } }`) and local `currLastPointLabelPlugin` (`afterDatasetsDraw` drawing `${code}: ${lastVal.toFixed(2)} EGP` with top/right edge clamping); wrap canvas in `<div className="curr-chart-canvas-wrapper" role="img" aria-label={chartAriaLabel} data-plugin-ids="currLastPointLabelPlugin">`.
- Render accessible timeframe `<div role="group" aria-label="Exchange rate chart timeframe">` buttons (`type="button"`, `aria-pressed`).
- Render `data-testid="curr-chart-summary"`, collapsible `<details>`/`<table data-testid="curr-rate-history-table">`, and D19 `.curr-history-mobile-cards` at `<= 768px`.

#### [MODIFY] `frontend/src/pages/currency/CurrencyForm.js`
- Add `isSubmitting = false` optional prop (default `false`), keeping existing `{ initialData = {}, onFormSubmit, isEdit = false }` contract backwards-compatible.
- Render Reference Frame 02 Variant B stacked form (`.curr-form-card`) with explicit `id`/`htmlFor` pairing (`curr-name`, `curr-amount`, `curr-price`, `curr-date`) and unchanged `<AccountSelector>` props (`id="account-selector-sourceAccount"`).
- Add neutral read-only Implied Purchase Rate preview (`data-testid="curr-implied-rate"`) whenever `parseFloat(amount) > 0 && parseFloat(price) > 0`.
- Implement on-blur + on-submit validation (`validateField`, `validateAll`) applying `currencySchemas.createSchema` semantics uniformly across Create & Edit, clearing errors on valid blur/edit, setting `aria-invalid` & `aria-describedby`, rendering inline field errors (`role="alert"`) and submit validation summary (`.curr-form-error-summary`, `role="alert"`).
- Submit exact unchanged payload `{ ...formData, amount: parseFloat(formData.amount), price: parseFloat(formData.price), sourceAccount: formData.sourceAccount || 'Bank' }`.
- Pair sole primary CTA (`{Create|Update} Currency`, `.fs-btn-primary`) with neutral `Cancel` link to `/currency` (`.fs-btn-secondary`).

#### [MODIFY] `frontend/src/pages/currency/AddCurrencyPage.js` & `EditCurrencyPage.js`
- Both import `./Currency.css`, wrap content in `page-container curr-page-container curr-form-page`, render `.curr-breadcrumb`, `.curr-back-link`, page heading, and wrapper-level `.curr-submit-error` (`role="alert"`) catching API failures cleanly with `isSubmitting` state.
- `EditCurrencyPage.js`: fix line 1 header comment, replace raw `<p>Loading...</p>` with `<Loading variant="form-field" text="Loading foreign currency details..." />`, add `fetchError` (`.curr-error-card` + Retry) and not-found (`.curr-empty-card`) states.

#### [MODIFY] `frontend/src/components/ProtectedRoute.js`, `frontend/.eslintignore`, `frontend/playwright.config.js`
- `ProtectedRoute.js`: Append `'/currency'`, `'/currency/:id'`, `'/currency/new'`, `'/currency/edit/:id'` to `THEMED_PATTERNS` (`42 → 46`) and update the comment header.
- `.eslintignore`: Delete lines 34–36 (`src/pages/currency/CurrencyDetailPage.js`, `CurrencyForm.js`, `CurrencyLogPage.js`).
- `playwright.config.js`: Add `currency-reference-match` to the `reference` project `testMatch` regex.

---

### Test Suites & Visual Mocks

#### [NEW] `frontend/src/pages/currency/__tests__/CurrencyLogPage.test.js` (14 tests)
1. Renders loading skeleton (`role="status"`) before data resolves.
2. Renders 4 graphite KPI tiles with exact cost basis, current valuation, Unrealized Gain / Loss (asserting the Review Item #1 selected P&L readout, sign, and accessible text), and holdings count.
3. Renders all 3 health statuses (`Live`, `Stale`, `Manual`) via neutral `.fs-badge` chips (no semantic tone class, `svg[aria-hidden="true"]`).
4. Renders right-aligned `.fs-num` rate/valuation columns and positive, negative, and zero FX P&L rows per the Review Item #1 selection.
5. Renders underlined `.curr-name-link` and single primary CTA (`Add Currency`); `Revalue Now` is `.fs-btn-secondary`.
6. Triggers `revalueCurrency()`, updates holdings list, shows success toast, and disables button while revaluing.
7. Handles `revalueCurrency()` failure with error toast and re-enables button.
8. Opens `ConfirmModal` via accessible delete `<button>` and deletes holding via `deleteCurrency()` on confirm.
9. Renders D19 compact-expand mobile cards (`data-testid="currency-mobile-cards"`), toggles `aria-expanded` on click, and reveals full fields + actions.
10. Viewer role (`useCanModify() === false`) preserves `ProtectedAction` gating on `Revalue Now`, `Add Currency`, `Edit`, and `Delete` (I4).
11. Renders `.curr-error-card` (`role="alert"`) with working Retry button on `getCurrency()` rejection while keeping header visible.
12. Renders `.curr-empty-card` when `getCurrency()` returns `[]`.
13. Zero inline `[style]` elements exist across rendered log page & expanded mobile cards.
14. Passes `jest-axe` with zero critical/serious violations.

#### [NEW] `frontend/src/pages/currency/__tests__/CurrencyDetailPage.test.js` (13 tests)
1. Renders `<Loading variant="card" />` while fetching.
2. Renders hero header, neutral `<Badge>` health status (`Live Market Rate`, `Stale Rate (> 24h)`, `Manual Override`), and 6 graphite metric tiles with Unrealized Gain / Loss readout per the Review Item #1 selection.
3. Renders `.curr-back-link` (navigation link), single `.fs-btn-primary` (`Edit`), and `.curr-btn-danger-outline` (`Delete`).
4. Configures Line chart from `chartTheme.js` using merged `baseChartOptions()` + `layout.padding.top: 24` + `scales.y.grace: '25%'` (zero `#14b8a6` accent series, zero `#0284c7` blue literals), passes `currLastPointLabelPlugin`, and invokes `ctx.fillText` with direct endpoint label.
5. Timeframe buttons (`1W`, `1M`, `3M`, `6M`, `All`) toggle `aria-pressed` and filter chart/table point counts (`7`, `30`, `90`, `100` capped, `100` capped) accurately.
6. Renders `data-testid="curr-chart-summary"`, collapsible `<details>` + `<table data-testid="curr-rate-history-table">` (`<caption>`, `scope="col"`, `data-label`), and D19 `.curr-history-mobile-cards`.
7. Falls back cleanly to single current-rate point when `getRateHistory` returns `[]` or rejects.
8. Opens `ConfirmModal` on `Delete`, calls `deleteCurrency(id)`, and navigates to `/currency`.
9. Renders `.curr-error-card` (`role="alert"`) with Retry button when `getCurrencyById` rejects.
10. Renders `.curr-empty-card` when holding is null/not found.
11. Verifies exact FX valuation math parity (`costBasis`, `currentVal`, `gainLoss`, `gainLossPct`).
12. Zero inline `[style]` elements exist across rendered detail page.
13. Passes `jest-axe` with zero critical/serious violations.

#### [NEW] `frontend/src/pages/currency/__tests__/CurrencyForm.test.js` (11 tests)
1. Renders stacked Frame 02 form with `id`/`htmlFor` pairing for all 4 inputs and preserved `account-selector-sourceAccount`.
2. Computes and updates neutral Implied Purchase Rate preview (`1 USD = 50.0000 EGP`) live as amount/price change.
3. Validates `amount <= 0`, `price <= 0`, and missing `date` on blur (`aria-invalid="true"`, `aria-describedby` linked to `#curr-*-error`).
4. Clears field error and resets `aria-invalid="false"` / `aria-describedby` cleanly on valid blur.
5. Shows distinct `.curr-form-error-summary` (`role="alert"`) on invalid submit without calling `onFormSubmit`.
6. Submits byte-identical payload `{ name, amount: Number, price: Number, date, sourceAccount }` with zero extra keys.
7. `AddCurrencyPage` calls `createCurrency` and navigates to `/currency`; renders distinct wrapper `.curr-submit-error` on API failure (never duplicate `.curr-form-error-summary`).
8. `EditCurrencyPage` renders `<Loading variant="form-field" />`, pre-populates fields from `getCurrencyById`, calls `updateCurrency(id, payload)`, and navigates to `/currency`.
9. `EditCurrencyPage` renders `.curr-error-card` with working Retry button on fetch failure and `.curr-submit-error` on save failure.
10. Zero inline `[style]` elements exist across Add & Edit form pages.
11. Passes `jest-axe` across Add, Edit, and validation-error states with zero critical/serious violations.

#### [NEW] `frontend/tests/visual/fixtures/currencyMocks.js` & [MODIFY] `visual.spec.js`, `a11y.spec.js`
- Ordered single-handler `**/api/currency**` route mock serving deterministic fixtures for `/rate-history` (100 newest-first daily snapshots sliced by `Math.min(100, limit || 30)` with `{ _id, date, baseCurrency: 'EGP', source: 'CIB', rate, rates }` and `rate: null` when unmapped), `/summary`, `/price`, `/revalue`, `/:id`, and collection `GET /api/currency` (3 holdings: Live positive USD, Stale negative EUR, Manual flat GBP).
- Wire `else if (route.slug.startsWith('currency')) { await setupCurrencyMocks(page); }` in `visual.spec.js` and `a11y.spec.js`.

#### [NEW] `frontend/tests/visual/currency-reference-match.spec.js` (9 tests)
- **`test.beforeEach` mock & clock setup (mirroring 8C precedent at `certificates-detail-forms-reference-match.spec.js:41–49`)**: Imports `setFixedClock` and `setupCurrencyMocks`, adds `window.__VISUAL_TEST__ = true` via `page.addInitScript`, and invokes `setFixedClock(page)` + `setupCurrencyMocks(page)` before every navigation.
1. `/currency` @ `1440px`: graphite canvas `#101114`, flat KPI tiles (no gradient/shadow, radius `<= 8px`), single `.fs-btn-primary`, neutral health badges, positive/negative/neutral P&L per the Review Item #1 selection, right-aligned `.fs-num` columns, underlined `.curr-name-link`.
2. `/currency` @ `390px`: desktop table hidden, D19 compact-expand cards visible, expander toggles `aria-expanded`, `0px` page horizontal overflow.
3. `/currency/1` @ `1440px`: flat dark hero (no gradient), 6 flat metric tiles, un-underlined `.curr-back-link`, single `.fs-btn-primary`, `curr-chart-canvas-wrapper[data-plugin-ids*="currLastPointLabelPlugin"]`, canvas bounding box `height > 0` inside wrapper, `curr-chart-summary`, `<details>` + `curr-rate-history-table`.
4. `/currency/1` timeframe filter interaction (`1W` → `7`, `1M` → `30`, `3M` → `90`, `6M` → `100`, `All` → `100` capped) updates `aria-pressed` and chart/table row counts cleanly.
5. `/currency/1` @ `390px`: desktop `<details>` hidden, D19 `.curr-history-mobile-cards` visible, `0px` page horizontal overflow.
6. `/currency/new` @ `1440px` & `390px`: Frame 02 stacked form, `account-selector-sourceAccount` preserved, implied purchase-rate preview live calculation, blur inline error + valid-blur reset + failed submit `.curr-form-error-summary`, `0px` mobile overflow.
7. `/currency/edit/1` @ `1440px` & `390px`: pre-populated form, sole `.fs-btn-primary` (`Update Currency`), neutral `Cancel`, `0px` mobile overflow.
8. Interactive touch targets & focus rings across `/currency`, `/currency/1`, `/currency/new` (`>= 44x44px` primary/mobile/expander/form buttons, visible `:focus-visible` outline on Tab).
9. `Delete` button on `/currency` and `/currency/1` opens accessible `ConfirmModal` and closes cleanly on Cancel/Escape.

---

## 3. Verification Plan (Gates 0–19)

Execute sequentially on local branch `phase-ui-8d-currency` (from `main @ af39772`, starting baseline `39fb1b0`); each gate must pass before proceeding:

0. **Gate 0 — Pre-Gate Branch & Governance Commit**:
   - Create local branch `phase-ui-8d-currency` from `main @ af39772`.
   - Commit this approved `docs/ui-plans/phase_8d_implementation_plan.md`, record Waiver **`W-8D-1`** in `UI-UX-PLAN.md §7.1 (:2104)`, and (if Review Item #1 Option A is selected) commit the pre-gate `§4.3:328` / `§4.3.1:366/:369` / initial `§10` label amendment BEFORE Gates 4–18 run.
1. **Gate 1 — Route Allowlist & Coverage *(Informational Manual Gate)***:
   ```powershell
   node frontend/scripts/ui-coverage.js --assert-allowlist
   node frontend/scripts/ui-coverage.js --routes
   ```
   *(Note: `ui-coverage.js` exits `0` unconditionally; manually verify printed stdout shows **46** active patterns [`42 → 46`] and **75 route entries / 0 unassigned**, and record raw output in `phase_8d_walkthrough.md`.)*
2. **Gate 2 — Token Drift Guard**:
   ```powershell
   node frontend/scripts/tokens.js --check --tables
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `0 drift`.
3. **Gate 3 — Test ID & ARIA Guard**:
   ```powershell
   node frontend/scripts/testid-guard.js --base af39772
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `0` deletions vs `af39772`.
4. **Gate 4 — Semantic Tone Guard**:
   ```powershell
   node frontend/scripts/lint-tones.js
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `0` violations across all CSS files.
5. **Gate 5 — Stylelint, Ratchet, Overflow, D22 & Loading**:
   ```powershell
   cd frontend
   node scripts/lint-ratchet.js --base af39772
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   npx stylelint src/pages/currency/Currency.css src/pages/certificates/CertificateDetail.css src/styles/theme-components.css
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   git grep -n '#14b8a6' -- '*.css'
   Get-ChildItem -Recurse -Path src -Filter *.css | Select-String -SimpleMatch 'data-fs-theme="dark"'
   git grep -nE '<div>Loading|className="loading-spinner"|custom spinner SVG' src/pages/currency/
   Get-ChildItem -Recurse -Path src/pages/currency, src/pages/certificates -Filter *.css | Select-String -Pattern 'overflow-x'
   git -C .. diff af39772 -- frontend/src | Select-String -Pattern '^\+.*overflow-x'
   git -C .. diff af39772 -- frontend/src/pages/trades/Trades.css frontend/src/styles/chartTheme.js
   ```
   *Pass*: `0` regressions (`CertificateDetail.css` count strictly drops to `0`); `0` stylelint errors; `#14b8a6` matches only `tokens.css:36`; `data-fs-theme="dark"` matches only `src\styles\tokens.css:2`; `0` loading bypasses; scoped `overflow-x` audit shows **only** pre-existing `W-8B-1` (`Certificates.css:267`) and new `W-8D-1` (`.curr-log-page .curr-table-wrap` in `Currency.css`), with diff vs `af39772` proving `W-8D-1` is the sole added `overflow-x` line; `Trades.css` & `chartTheme.js` diffs empty.
6. **Gate 6 — ESLint & De-Ignore**:
   ```powershell
   cd frontend
   npx eslint src/pages/currency/CurrencyLogPage.js src/pages/currency/CurrencyDetailPage.js src/pages/currency/CurrencyForm.js src/pages/currency/AddCurrencyPage.js src/pages/currency/EditCurrencyPage.js src/pages/currency/__tests__/CurrencyLogPage.test.js src/pages/currency/__tests__/CurrencyDetailPage.test.js src/pages/currency/__tests__/CurrencyForm.test.js src/components/ProtectedRoute.js tests/visual/fixtures/currencyMocks.js tests/visual/currency-reference-match.spec.js tests/visual/visual.spec.js tests/visual/a11y.spec.js playwright.config.js --max-warnings=0
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   git grep -in "pages/currency" .eslintignore
   ```
   *Pass*: `0` errors, `0` warnings across all 14 touched JS, test, and config files; `0` currency pages remain in `.eslintignore` (`AddTransactionModal.currency.test.js` stays excluded until Phase 9A).
7. **Gate 7 — CRA Jest & jest-axe**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/pages/currency/__tests__/CurrencyLogPage.test.js src/pages/currency/__tests__/CurrencyDetailPage.test.js src/pages/currency/__tests__/CurrencyForm.test.js --watchAll=false --runInBand --verbose
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: **38/38** passed (`14` log + `13` detail + `11` form); `0` jest-axe violations.
8. **Gate 8 — Route Guard & Dashboard Coordinator**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   (Get-Content src/pages/DashboardSummary.js).Count # must be <= 120 (96)
   ```
   *Pass*: **15/15** passed (`9/9` route tests + `6/6` dashboard tests); `DashboardSummary.js` `<= 120` lines (`96`).
9. **Gate 9 — Calculations Parity (I3)**:
   ```powershell
   cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: **11/11** characterization tests passed across 8 domains (Domain 6 Currency unchanged).
10. **Gate 10 — Real-Browser Axe**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test a11y.spec.js --project=a11y -g "a11y check: currency(-detail|-new|-edit)?$"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: **5 passed** (`1 setup + 4 routes`), `0` critical/serious `wcag2a`/`wcag2aa` violations.
11. **Gate 11 — Reference Match Spec**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test currency-reference-match.spec.js --project=reference
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: **10 passed** (`1 setup + 9 spec tests`).
12. **Gate 12 — Production Build *(Documented §15.3/§15.5 Local Proxy; Authoritative CI on Merge)***:
    ```powershell
    cd frontend; $env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=2048'; npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: `Compiled successfully.` (`0` errors, `0` new warnings). Explicitly uses local `2048`MB heap build proxy per **User Review Item #4** and `§15.3/§15.5` workstation-memory guidance (matching 8A/8B/8C; authoritative CI runs on merge to `main`).
13. **Gate 13 — Visual Baselines & Manifest (20 Snapshots)**:
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="currency(-detail|-new|-edit)? @" --update-snapshots
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js --generate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C 'D:\Projects\FinStat-visual-baselines' add -A
    git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 8D: recapture 20 currency route snapshots"
    git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
    ```
    *Pass*: **21 passed** (`1 setup + 20 PNGs` replaced in place); **334/334** manifest verified (`0` net new entries); baseline SHA recorded.
14. **Gate 14 — PR-Subset Visual Regression (W-6A-1)**:
    ```powershell
    cd frontend; $env:CI='true'; $env:PR_SUBSET='true'; npx playwright test visual.spec.js --project=pr-subset
    ```
    *Pass*: `68/71` (`3` pre-existing W-6A-1/AD16 diffs only), `0` diffs attributable to 8D.
15. **Gate 15 — Full 326-Test Visual Suite *(§15.5 Documented Local Deviation)***:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test visual.spec.js --project=visual
    ```
    *Pass*: Deliberately run locally per **User Review Item #4** and 8A/8B/8C precedent; **326** accounted (`292` passed + `34` accepted AD14/AD16 diffs), `0` unexplained; verify Playwright HTML report / route diff totals for `phase_8d_walkthrough.md` before cleaning untracked `test-results/` & `playwright-report/` post-run (treating §7.1 HTML-report attachment as satisfied via the in-walkthrough `(a)–(d)` diff summary and accepted-diff register per 8A/8B/8C precedent).
16. **Gate 16 — Touch Targets & Focus Rings**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test currency-reference-match.spec.js --project=reference -g "touch targets"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: **2 passed** (`1 setup + 1 filtered test`).
17. **Gate 17 — Developer Visual Inspection & Documented §7.4 State Deviation**: Copy **all 20 recaptured PNGs** across all 5 mandatory widths (`1440`, `1024`, `768`, `480`, `390`px × `currency`, `currency-detail`, `currency-new`, `currency-edit`) to the artifact directory and visually inspect all 20 captures (alignment, contrast, chart headroom & legend clearance across all 5 widths, zero clipping); fix any visual defect before re-verifying; document the explicit **§7.4 state-screenshot deviation** (Gate 7 Jest + baselines) in `phase_8d_walkthrough.md`.
18. **Gate 18 — Unthemed-Consumer & Decoupling Check**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test visual.spec.js --project=visual --grep="(currency|currency-detail|currency-new|currency-edit|certificates|certificates-detail|certificates-new|certificates-edit|trades|trades-add|trades-edit|trade-summary|credit-cards) @"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *(Unanchored alternation with explicit base slugs + ` @` matches Playwright's `Visual Regression Suite` title prefix cleanly and excludes `credit-cards-statements` et al.)*
    *Pass*: **66/66 passed** (`1 setup + 20 currency + 20 certificates + 20 trades + 5 credit-cards`), verifying zero regressions on untouched `Trades.css` consumer `/credit-cards` and sibling 7A/8B/8C routes.
19. **Gate 19 — Walkthrough & Merge Boundary**: Author template-compliant `docs/ui-plans/phase_8d_walkthrough.md` (and artifact copy) containing:
    - Header ledger + §1 Progress Log (`Sub-phase`, `Status`, `Done`, `Next`, `Blocked by`, `Allowlist`, `Visual diff`, `Fixtures`, `Screenshots`, `Branch`, `Plan SHA`, `Implementation SHA`, `Walkthrough SHAs`, `Merge SHA`)
    - Verbatim §2 `I1–I16` compliance table
    - §3 Visual Regression Diff Report (`(a)` total, `(b)` zero diff, `(c)` accepted diffs citing `AD13/AD14/AD16`, `(d)` zero unexplained + `verify-baseline-manifest.js` output + §7.1 HTML-report precedent disclosure)
    - §4 Gate 1–18 evidence table (including Gate 1 manual stdout and §15.3/§15.5 disclosures for Gates 12 & 15)
    - §5 Gate 17 20-PNG inspection log, computed-style conformance table, & explicit §7.4 state-screenshot deviation
    - §6 Complete post-sign-off checklist.
    Commit `phase_8d_walkthrough.md` on local `phase-ui-8d-currency` and **STOP** awaiting explicit user sign-off before §4 Governance Synchronization, review cleanup, `--no-ff` merge to `main`, and `git push origin main`.

---

## 4. Governance Synchronization (Post-Sign-Off Only — Aside from Gate 0 Prerequisites)

> [!IMPORTANT]
> **Branch & Push Policy**: Feature branch `phase-ui-8d-currency` stays local per §14/§10 process precedent; only `main` is pushed, and only after explicit user sign-off on `phase_8d_walkthrough.md`.

1. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§5.7 (`:931–934`)**: Mark `/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id` themed & QA'd (`☑ | ☑`); record `36` inline styles purged on both `CurrencyLogPage` & `CurrencyDetailPage` (`72` total), D19 cards, `W-8D-1`, and `chartTheme` + local `currLastPointLabelPlugin` + accessible `<details>`/`<table>`.
2. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.1 (`:1068`)**: Mark Phase **8D** complete (`☑ | ☑`).
3. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.12 (`:1850`, `:1854`, `:1862–1869`, `:1889`)**:
   - Check closed Phase 8C deferred item `:1850` (`CertificateDetail.css` converted to D22 dark graphite tokens) and `:1854` (currency-log D19 cards delivered).
   - Check all 8 items under `#### 8D — Currency` (`:1862–1869`).
   - Update Phase 8 exit gate counter (`:1889`) from `9 of 16` → `13 of 16 routes themed; 8E remains open`.
4. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.1 (`:2167, :2183, :2189`)**: Acknowledge pre-existing CSS inventory drift (**63** pre-8D / **64** post-8D CSS files on disk including `PaycheckLog.css`, `PayrollAnalyticsPage.css`, `MutualFunds.css`, `GoldWallet.css`, `Certificates.css`, `Currency.css` vs `§8.1`'s `57`-file snapshot).
5. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.2 (`:2206–2207`)**: Update `CurrencyDetailPage.js` (`36`) and `CurrencyLogPage.js` (`36`) to `36 *(purged to 0 in 8D)*`.
6. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§10**: Finalize the Phase 8D progress log entry using all `walkthrough-template.md:10–24` fields (`Sub-phase`, `Status`, `Done`, `Next`, `Blocked by`, `Allowlist`, `Visual diff`, `Fixtures`, `Screenshots`, `Branch`, `Plan SHA`, `Implementation SHA`, `Walkthrough SHAs`, `Merge SHA`), starting `39fb1b0` & Gate 13 baseline SHA, `38` new Jest tests, `11/11` calculations parity, `20` recaptured PNGs (`334/334` manifest), Gate 14 `68/71` (`3` W-6A-1/AD16 only), Gate 15 `326` (`292 + 34` AD14/AD16), Gate 18 `66/66`, `42 → 46` allowlist, `72` inline styles purged, `W-8D-1`, §7.1 HTML-report precedent, §7.4 state-screenshot deviation, Review Item #1 FX P&L selection, and Gate 12/15 local §15.3/§15.5 authorizations.
7. `docs/ui-plans/phase_8d_implementation_plan.md` (`- **Status**:`) & `docs/ui-plans/phase_8d_walkthrough.md` (Gate 19 SHAs & sign-off date).
8. Remove `*review*.md` from `docs/ui-plans/`, merge `phase-ui-8d-currency` into `main` (`--no-ff`), update `CHANGELOG.md` (explicitly announcing **`AD13` allowlist expansion `42 → 46`** per §7.2 `:2132`), and push only `main`.

---

## User Review Required

> [!IMPORTANT]
> Please confirm these five items before execution begins:
> 1. **FX Unrealized P&L Semantics**:
>    - **Option A (Recommended)**: Render unrealized FX P&L via `<Delta>` (`Gain` / `Loss` / `No change`, positive/negative/neutral tones) AND commit an explicit `§4.3:328` + `§4.3.1:369/:366` + initial `§10` amendment in Gate 0 before running component/test gates.
>    - **Option B**: Keep FX P&L **sign-only and neutral** (`+$…` / `−$…` / `$0.00` in `.fs-num`, no `<Delta>` tone classes) per literal `§4.3.1:366` (`"sign only"`), avoiding any `§4.3.1` amendment.
> 2. **Deferred `CertificateDetail.css` (`UI-UX-PLAN.md:1850`)**: Convert now-unimported `CertificateDetail.css` to clean D22 dark graphite tokens (closing `:1850` with `0` stylelint/ratchet violations while leaving unused-file removal to Phase 12A cleanup).
> 3. **Waiver `W-8D-1` (Desktop/Tablet 9-Column Holdings Table Scroll)**: Approve recording Waiver `W-8D-1` in `§7.1` in Gate 0 for `.curr-log-page .curr-table-wrap` at `> 768px` (hidden at `<= 768px`, where D19 compact-expand cards replace the table with `0px` page overflow), matching `W-8B-1`.
> 4. **§15.3/§15.5 Local Build & Full-Visual-Suite Deviations (Gates 12 & 15)**: Explicitly authorize running the local `2048`MB `npm run build` (**Gate 12**) and full 326-test visual suite (**Gate 15**) per Phase 8A/8B/8C precedent (while keeping authoritative CI on merge to `main`).
> 5. **Inherited `$` `formatCurrency()` on EGP-Labelled Fields**: Confirm retaining `frontend/src/utils/formatters.js` (`$`) unchanged per `I3` and Phase 8B/8C precedent (or specify if a display-only EGP label change is desired).
