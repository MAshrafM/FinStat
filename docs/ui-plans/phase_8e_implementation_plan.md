# UI Phase 8E Implementation Plan — Real Estate

- **Date**: 2026-11-27
- **Revision**: **v4** — incorporates final review correction: neutral `<progress>` accessible name and signed value text; retains all v3 corrections (neutral `aria-valuetext`, accurate I4 bug-fix scope, explicit realised-loss non-rendering note, `User Review Required` placement) and all v2 corrections (coherent capital-gain options, schema-parity clarification, deterministic reference-spec setup, expanded Cluster 8 Gate 18, explicit Gate 0 / invariant map / governance section, and strengthened gate exit checks)
- **Status**: Complete — Gate 19 Signed Off 2026-11-27 (Phase 8 Cluster Exit Gate Closed `16 of 16`)
- **Merge Base**: `main` @ `fea6d8f` *(pre-execution tag omitted per Phase 7A–8D precedent; merge base SHA + baseline SHA provide full traceability)*
- **Starting Baseline Commit**: `d86155f` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)
- **Branch**: `phase-ui-8e-real-estate` *(local branch policy per §14/§10; only `main` is pushed after Gate 19 user sign-off)*
- **Taste Checkpoint**: **N/A** *(Cluster 8 Taste Checkpoint #6 was delivered and signed off in Phase 8A; Phase 8E closes the final 3 routes of Cluster 8 — `13 -> 16 of 16`)*
- **Target Routes (3 routes — all Real Estate routes in one sub-phase per §6.12:1880)**:
  - `/real-estate` — Real Estate Portfolio (`RealEstateLogPage.js`, slug `real-estate`)
  - `/real-estate/new` — Add Real Estate Property (`AddRealEstatePage.js` + `RealEstateForm.js`, slug `real-estate-new`)
  - `/real-estate/edit/:id` — Edit Real Estate Property (`EditRealEstatePage.js` + `RealEstateForm.js`, slug `real-estate-edit`)
- **Target Production Files**:
  - `frontend/src/pages/real-estate/RealEstate.css` *(**MODIFY**: Replace all 629 legacy pink/purple-glow lines — `11` gradients, `6` `blur()`/`backdrop-filter`, `12` pixel `box-shadow`s, `1` `.main-content.full-bleed` duplication rule — with flat D22 `html[data-fs-theme] .re-page-container` graphite tokens and `.re-log-page`/`.re-form-page` sub-scopes; `0` consumers exist outside `pages/real-estate/`)*
  - `frontend/src/pages/real-estate/RealEstateLogPage.js` *(**MODIFY**: Purge all **34** inline styles [`23` colour-bearing + `11` layout/typographic], `2` JSX `color="#..."` icon props, `29` hex & `6` `rgba` literals; remove all 6 emojis [`🏠`,`🏢`,`🏰`,`🏞️`,`🏘️`,`📍`]; apply Frame 01/03 dark graphite surfaces, neutral `<Badge>` type/status chips with existing `react-icons/fa` icons, accessible `<progress>` appreciation meter with `0` inline styles, capital-gain presentation per the selected `Review Item #1` option (A′ = Owned-only `<Delta>`, Sold rows neutral; B′ = all neutral), conditional `useCanModify()` destructuring per Review Item #2 Option A only (otherwise line 35 stays byte-identical), Waiver `W-8E-1` desktop table container + D19 `<=768px` mobile cards in Table view with `0px` overflow at `390px`, `<Loading variant="card" />`, and `.re-error-card` fetch-error Retry handling)*
  - `frontend/src/pages/real-estate/RealEstateForm.js` *(**MODIFY**: Purge all **7** inline styles [`6` colour-bearing + `1` layout] & `6` hex literals; convert to Reference Frame 02 Variant B stacked layout with explicit `id`/`htmlFor` pairing across all 11 fields, synchronous `buildFormState(initialData)` hydration, on-blur + on-submit validation matching `realEstateSchemas.createSchema` field-level semantics plus **client-only** conditional `Sold` rules (§0.4), valid-blur clearing & `aria-describedby` reset, distinct `#re-*-error` / `.re-form-error-summary` surfaces, and byte-identical submit payload)*
  - `frontend/src/pages/real-estate/AddRealEstatePage.js` *(**MODIFY**: Purge `2` inline styles [`1` colour-bearing + `1` layout], `1` hex & `1` `rgba`; apply `.re-page-container.re-form-page`, breadcrumb, `.re-back-link`, `.re-submit-error` with `role="alert"`)*
  - `frontend/src/pages/real-estate/EditRealEstatePage.js` *(**MODIFY**: Purge `4` inline styles [`1` colour-bearing + `3` layout], `1` hex & `1` `rgba`; apply `.re-page-container.re-form-page` on every branch, `<Loading variant="form-field" />`, fetch-error `.re-error-card` + Retry, not-found `.re-empty-card`, `.re-submit-error`)*
  - `frontend/src/styles/theme-components.css` *(**MODIFY**: Append **Section 22: Phase 8E Real Estate Semantic & Interactive Themes** under `html[data-fs-theme]`)*
  - `frontend/src/components/ProtectedRoute.js` *(**MODIFY**: Expand `THEMED_PATTERNS` **46 → 49**: add `'/real-estate'`, `'/real-estate/new'`, `'/real-estate/edit/:id'`)*
  - `frontend/.eslintignore` *(**MODIFY**: Remove lines `42–45` — `AddRealEstatePage.js`, `EditRealEstatePage.js`, `RealEstateForm.js`, `RealEstateLogPage.js`; preserve line `49` `src/services/realEstateService.test.js`)*
  - `frontend/playwright.config.js` *(**MODIFY**: Register `real-estate-reference-match.spec.js` in the `reference` project)*
- **Execution-Start Governance Prerequisites (Gate 0 — Committed on Local `phase-ui-8e-real-estate` Before Gates 4–18)**:
  - Commit approved `docs/ui-plans/phase_8e_implementation_plan.md`.
  - Record Waiver **`W-8E-1`** in `docs/UI-UX_Plan/UI-UX-PLAN.md` **§7.1 (`:2104`)** for desktop/tablet `.re-log-page .re-table-wrap` (`> 768px` Table view only; hidden at `<= 768px` in favor of D19 cards with `0px` page overflow).
  - If Review Item #1 **Option A′** is selected, record the `§4.3:328`, `§4.3.1:369`, and initial `§10` amendment adding `real estate` to Unrealised P&L `<Delta>` before running Gates 4–18; **Option B′ requires no `§4.3` amendment**.
  - If Review Item #2 **Option A** is selected, record the authorized scoped `I4` defensive `useCanModify()` handler-guard bug-fix in Gate 0 `§10`.
- **Protected Files (Strictly Untouched — Verified via `git diff fea6d8f`)**:
  - `frontend/src/services/realEstateService.js`, `frontend/src/utils/formatters.js`, `frontend/src/App.js`, `frontend/src/pages/DashboardSummary.js`, `frontend/src/styles/chartTheme.js`, `frontend/tests/calculations.spec.js`, `frontend/package.json`, `frontend/package-lock.json`, `backend/routes/realEstates.js`, `backend/validationSchemas/realEstateSchemas.js`.
  - Previously themed shared CSS must also stay byte-identical: `frontend/src/pages/trades/Trades.css`, `frontend/src/components/SummaryRow.css`, `frontend/src/pages/certificates/Certificates.css`, `frontend/src/pages/gold/GoldWallet.css`, `frontend/src/pages/analytics/PurchasingPowerChart.css`, `frontend/src/pages/mutual-funds/MutualFunds.css`, `frontend/src/pages/currency/Currency.css`, and `frontend/src/pages/certificates/CertificateDetail.css`.

---

## 0. Verified Codebase Audit & Architectural Decisions

1. **Exclusive CSS ownership (`RealEstate.css`) & `.main-content.full-bleed` removal (`UI-UX-PLAN.md:1873`)**:
   - Static grep confirms `RealEstate.css` is imported **only** by `RealEstateLogPage.js`, `AddRealEstatePage.js`, and `EditRealEstatePage.js` (`0` external consumers).
   - `RealEstate.css` (`629` lines) currently contains `11` `gradient(...)` declarations (pink/purple radial canvas glows, pink-to-purple gradient `<h1>`, pink/purple gradient buttons/pills, rainbow appreciation bar), `6` `blur()`/`backdrop-filter: blur()` declarations, `12` pixel `box-shadow` declarations, `0` `!important`, and `.main-content.full-bleed, .main-content:has(.real-estate-page-wrapper) { padding: 0; }` (`:3–6`).
   - All banned visual effects and the `.main-content.full-bleed` duplication risk are eliminated cleanly; `RealEstate.css` is rewritten strictly under D22 `html[data-fs-theme] .re-page-container` with `.re-log-page` and `.re-form-page` sub-scopes, zero direct `var(--fs-accent)` or tone tokens (isolated in `theme-components.css` Section 22), and radii `<= 8px` (`--fs-radius-sm/md/lg`, with `--fs-radius-pill` reserved for `<Badge>` chips only).

2. **Verified Inline-Style & Hardcoded-Colour Census (`47` total `style={{` + `2` icon `color` props)**:
   - `RealEstateLogPage.js` (`555` lines): **34** `style={{` (**23** colour-bearing + **11** layout/typographic), **2** icon `color="#..."` props (`:348`, `:355`), **29** hex literals, **6** `rgba` literals, `0` `data-testid`, `0` `aria-label`. *(Matches `§5.7:935`, `§6.12:1874`, `§8.2:2209` `34` count exactly.)*
   - `RealEstateForm.js` (`279` lines): **7** `style={{` (**6** colour-bearing error spans + **1** layout action bar), **6** hex literals, `0` `rgba`.
   - `AddRealEstatePage.js` (`49` lines): **2** `style={{` (**1** colour-bearing error banner + **1** layout header), **1** hex, **1** `rgba`.
   - `EditRealEstatePage.js` (`88` lines): **4** `style={{` (**1** colour-bearing error banner + **3** layout), **1** hex, **1** `rgba`.
   - **Total**: **47** `style={{` + **2** icon `color` props + **37** hex + **8** `rgba` -> **all purged to `0`**, including replacing `.appreciation-bar-fill` `style={{ width: `${barPercent}%` }}` with a semantic native `<progress className="re-appreciation-progress" value={barPercent} max={100} />` so rendered DOM `[style]` count is strictly `0`.

3. **Zero Emojis & Neutral Badge Discipline (`§4.3.1`, `§6.12:1873/:1877`)**:
   - Replace `getPropertyIcon()` emojis (`🏠`, `🏢`, `🏰`, `🏞️`, `🏘️`) and table `📍` with existing `react-icons/fa` icons (`FaHome`, `FaBuilding`, `FaMapMarkerAlt`, `FaRulerCombined`, `FaCalendarAlt`, `FaChartLine` — all `aria-hidden="true"`).
   - Property type chips (`Residential`, `Commercial`, `Villa`, `Land`, `Other`), status chips (`Owned`, `Sold`), and `User Valuation` chip render via **neutral `<Badge tone="neutral">`** (zero tinted cyan/yellow/pink/green pills).
   - No charts exist on Real Estate routes (`chartTheme.js` untouched).

4. **Backend Payload Preservation & Client-Only Validation Boundary (`backend/validationSchemas/realEstateSchemas.js`)**:
   - `RealEstateForm.js` preserves the exact payload sent to `createRealEstate` / `updateRealEstate`:
     `{ name, type, area: Number(area || 0), location, purchasePrice: Number(purchasePrice), currentValuation: Number(currentValuation), purchaseDate, status, sellingPrice: Number(sellingPrice || 0), sellingDate: sellingDate || undefined, notes }`.
   - Client-side validation on blur & submit mirrors the **field-level semantics** of `createSchema` that apply to both Create and Edit (`name` non-empty trimmed, `purchasePrice > 0`, `currentValuation >= 0` and non-empty, `area >= 0`, `purchaseDate` required) and adds an **intentional stricter UX guard** for `status === 'Sold'` (`sellingPrice > 0` and `sellingDate` required). This is **not backend parity**: `backend/validationSchemas/realEstateSchemas.js:8–43` does not condition those fields on `Sold`, defaults `sellingPrice` to `0`, and makes `updateSchema` fields optional. The backend schema/route remain byte-identical per I2/I3; the Sold guard is a client-only form behavior to be asserted in Jest and recorded here rather than inferred from `.strict()`.
   - Switching `status` from `Sold` back to `Owned` clears `sellingPrice`/`sellingDate` field errors immediately.

5. **Deterministic Harness & Clock Scope**:
   - `realEstateMocks.js` is wired into `visual.spec.js`, `a11y.spec.js`, **and** `real-estate-reference-match.spec.js`.
   - The reference spec uses `setFixedClock(page)` and `window.__VISUAL_TEST__ = true` before navigation, matching 8C/8D precedent. This is required because `RealEstateForm.js:18,:38` defaults `purchaseDate` to `new Date()`; without a pinned clock, Add/Edit form baselines and conditional Sold-field assertions are non-deterministic.

6. **Documented §7.4 State-Screenshot Deviation**:
   - Loading states (`<Loading variant="card" />`, `<Loading variant="form-field" />`), empty/not-found cards (`.re-empty-card`), API error cards (`.re-error-card` with `role="alert"` + Retry), `.re-submit-error` banners, viewer `ProtectedAction` gating, `ConfirmModal` deletion, and form validation states are verified through Gate 7 Jest + jest-axe and Gate 11 Playwright assertions. Populated renders across all 5 widths remain baseline-locked in `D:\Projects\FinStat-visual-baselines`. No unversioned `docs/ui-snapshots/phase-8e/` PNGs are added, matching Phase 7C–8D precedent.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 8E Commitment | Verification Gate |
|:---:|---|---|
| **I1** | Production routes/URLs unchanged in `App.js`; `THEMED_PATTERNS` expands `46 → 49` only for the three converted Real Estate routes. | Gate 1 (manual stdout) & Gate 8 |
| **I2** | `realEstateService.js`, backend route/schema, and all endpoints/payloads untouched; Submit payload byte-identical; no service/API modifications. | Gate 5 protected-file diffs & Gate 7 |
| **I3** | No calculation changes: displayed gain remains the existing `currentValuation - purchasePrice`; no `sellingPrice - purchasePrice` realised-loss computation; `calculations.spec.js` byte-identical and 11/11 across 8 domains. | Gate 7 & Gate 9 |
| **I4** | All existing `<ProtectedAction>` wrappers preserved, including the empty-state `Add Your First Property` link; optional scoped `const { canModify } = useCanModify();` fix only if Review Item #2 Option A is approved, with a viewer-role test confirming no visible gating/`ProtectedAction` wrapper changes; the only behavior change is closing the inert `handleDelete` guard. | Gate 7 |
| **I5** | No deletion of existing `data-testid` / `data-*` / `aria-label`; new labels added to Edit/Delete icon buttons, view/filter groups, search/sort controls, mobile expanders, and `<progress>`. | Gate 3 & Gate 7 |
| **I6** | Table view collapses to D19 compact-expand cards at `<=768px`; `W-8E-1` scroll is desktop/tablet-only; `0px` page-level overflow at 390px in both Cards and Table views. | Gate 5, Gate 11 & Gate 17 |
| **I7** | All three Real Estate routes migrate atomically in one branch; allowlist patterns are added only in the converting PR. | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` stays at 96 lines (`<=120`); App + dashboard smoke suite stays 15/15. | Gate 8 |
| **I9** | Local standalone production build clean as a proxy; authoritative CI remains on `main`. | Gate 12 |
| **I10** | Touched Jest suites (~26 tests) and App/dashboard suites (15 tests) pass in-band. | Gates 7 & 8 |
| **I11** | No new `!important`; lint ratchet regressions `0`; all banned visual effects removed from `RealEstate.css`. | Gate 5 |
| **I12** | `frontend/package.json` and lockfile untouched; no new dependency. | Gate 5 protected-file diff |
| **I13** | Non-allowlisted routes pixel-identical; Gate 18 covers all 16 Phase 8 routes plus Credit Cards at all 5 widths. | Gates 14, 15 & 18 |
| **I14** | No gradient, blur, glow, mask, border-image, gradient text, or arbitrary shadow in converted CSS/JS. | Gate 5 & Gate 6 |
| **I15** | Neutral by default; all costs/valuations/appreciation neutral; `<Delta>` only under approved Review Item #1 Option A′ for Owned unrealised gain; tone tokens appear only in `theme-components.css` Section 22. | Gates 4, 7 & 11 |
| **I16** | Radii limited to `0`, `--fs-radius-sm/md/lg`, or `--fs-radius-pill` on `<Badge>`; no longhand radii or `50%`. | Gate 5 & Gate 11 |

---

## Proposed Changes

### Styling & Theme Isolation
#### [MODIFY] [RealEstate.css](file:///d:/Projects/FinStat/frontend/src/pages/real-estate/RealEstate.css)
- Rewrite under `html[data-fs-theme] .re-page-container` (`.re-log-page`, `.re-form-page`):
  - Flat graphite canvas (`--fs-bg`), surface cards (`--fs-surface`), sunken inputs/table headers (`--fs-surface-sunken`), crisp borders (`var(--fs-border-width) solid var(--fs-border)`), `box-shadow: none`, radii `<= 8px`.
  - Remove `.main-content.full-bleed` / `:has(.real-estate-page-wrapper)`, all 11 gradients, 6 blurs, and 12 shadows.
  - Style KPI grid (`.re-kpi-grid`, `.re-kpi-tile`), toolbar/search/filter pills/view switcher, property cards grid (`repeat(auto-fill, minmax(320px, 1fr))` -> `1fr` at `<= 640px`), semantic neutral `<progress className="re-appreciation-progress">`, desktop 9-column `.re-log-page .re-table-wrap` (`overflow-x: auto`, Waiver `W-8E-1`), right-aligned `.re-th-num`/`.re-td-num.fs-num`, D19 `<= 768px` compact-expand mobile cards (`.re-mobile-cards`) for Table view, Frame 02 stacked form card (`.re-form-card` `max-width: 640px`, `.re-form-stack`), and loading/error/empty cards.
  - All interactive controls meet `>= 44x44px` on mobile (`<= 768px`) and `>= 34x34px` desktop inline icon buttons with visible `:focus-visible { outline: var(--fs-focus-ring); outline-offset: 2px; }`.

#### [MODIFY] [theme-components.css](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css)
- Append **Section 22: Phase 8E Real Estate Semantic & Interactive Themes** under `html[data-fs-theme]`:
  - Active filter pill & view switcher indicator (`aria-pressed='true'`: `border-color: var(--fs-accent); background: var(--fs-surface-raised); color: var(--fs-text);`).
  - Danger hover/focus states for `.re-icon-btn-danger` (`--fs-danger`).
  - Danger-bordered error surfaces (`.re-error-card`, `.re-form-page .re-form-error-summary`, `.re-form-page .re-submit-error`, `.re-form-page .re-field-error`, each paired with `role="alert"` and explicit text cues per §4.10).

---

### Real Estate Pages & Form Components
#### [MODIFY] [RealEstateLogPage.js](file:///d:/Projects/FinStat/frontend/src/pages/real-estate/RealEstateLogPage.js)
- Wrap all render branches (`loading`, `fetchError`, `empty`, `populated`) in `<div className="page-container re-page-container re-log-page">`.
- Replace legacy spinner with `<Loading variant="card" text="Loading real estate portfolio..." />`.
- Add `fetchError` state rendering `.re-error-card` (`role="alert"`) with Retry button while keeping page header visible.
- Header: breadcrumb `Assets / Real Estate`, `<h1>Real Estate Portfolio</h1>`, secondary `Refresh` button (`.fs-btn.fs-btn-secondary`), single primary CTA `Add Property` (`<Link to="/real-estate/new" className="fs-btn fs-btn-primary">`) wrapped in `<ProtectedAction>`.
- KPI Overview (3 flat Frame 03 tiles): `Capital Invested` (neutral `.fs-num`), `Current Portfolio Value` (neutral `.fs-num` + neutral `<Badge tone="neutral">User Valuation</Badge>`), `Unrealized Capital Gain` (Review Item #1 Option A′: `<Delta>` over `summary.owned.unrealizedGain` with `Gain`/`Loss`/`No change`; Option B′: neutral signed `.fs-num` with no `<Delta>` tone; appreciation % remains neutral `.fs-num` in both options).
- Toolbar: accessible `<label className="fs-sr-only" htmlFor="re-search">` search input, paired `<label htmlFor="re-sort">` sort `<select>`, accessible view switcher (`role="group" aria-label="Property view mode"`, `aria-pressed` on `Cards`/`Table`), status & type filter pill groups (`role="group"`, `aria-pressed`).
- Cards view: flat `.re-prop-card`, `react-icons/fa` icon (zero emojis), neutral `<Badge>` type & status chips, accessible `<progress className="re-appreciation-progress" aria-label={`Valuation change for ${p.name}`} aria-valuetext={`${gainPct.toFixed(1)}%`} value={barPercent} max={100}>` meter (zero inline `style`; the neutral `aria-label` plus signed `aria-valuetext` reports `gainPct` rather than the saturated `barPercent`, avoiding "growth"/"appreciation" wording for negative values), neutral Purchase Price & Current Valuation with `.fs-num`, Net Capital Gain per Review Item #1 (`<Delta>` only for Owned rows under Option A′; neutral signed `.fs-num` for all rows under Option B′ and for all Sold rows under either option — no `sellingPrice - purchasePrice` realised-loss computation), and accessible Edit/Delete icon buttons (`aria-label={`Edit ${p.name}`}`, `aria-label={`Delete ${p.name}`}`) wrapped in `<ProtectedAction>`, plus shared `<ConfirmModal>`.
- Table view: semantic 9-column `<table>` inside `.re-table-wrap` (`W-8E-1`) with right-aligned `.re-th-num`/`.re-td-num.fs-num` for Area, Purchase Price, Current Valuation, and Capital Gain; Capital Gain follows the same Option A′/B′ rule as Cards view and Sold rows are always neutral; at `<= 768px`, hides `.re-table-wrap` and shows D19 compact-expand cards (`data-testid="real-estate-mobile-cards"`, `aria-expanded` toggle) with `0px` page overflow.
- Preserve the existing empty-state `ProtectedAction` wrapper around `Add Your First Property` (`RealEstateLogPage.js:534–538`) unchanged; the same single-primary-CTA and viewer-gating rules apply to the empty branch.
- Apply `useCanModify()` destructuring per Review Item #2 only if Option A is approved; otherwise leave line 35 byte-identical and assert viewer safety through `ProtectedAction` only.

#### [MODIFY] [RealEstateForm.js](file:///d:/Projects/FinStat/frontend/src/pages/real-estate/RealEstateForm.js)
- Frame 02 Variant B stacked form (`noValidate`, `.re-form-card` + `.re-form-stack`).
- Hoisted `EMPTY_INITIAL_DATA = {}` and synchronous `buildFormState(initialData)` initializer in `useState(() => buildFormState(initialData))` plus `useEffect` sync when `initialData` updates.
- Explicit `id`/`htmlFor` pairing on all 11 fields (`re-name`, `re-type`, `re-area`, `re-location`, `re-purchase-price`, `re-current-valuation`, `re-purchase-date`, `re-status`, `re-selling-price`, `re-selling-date`, `re-notes`), helper hints, `aria-invalid`, `aria-describedby`, on-blur & on-submit validation (including `area >= 0` negative-value rejection matching §0.4), valid-blur clearing, **client-only** conditional `Sold` fields + error cleanup when switching back to `Owned` (see §0.4 — not a backend schema requirement), and distinct `.re-form-error-summary` (`role="alert"`) vs `#re-*-error` inline errors.
- Neutral `Cancel` (`.fs-btn.fs-btn-secondary`) and single accent submit (`Add Property` / `Update Property`, `.fs-btn.fs-btn-primary`).

#### [MODIFY] [AddRealEstatePage.js](file:///d:/Projects/FinStat/frontend/src/pages/real-estate/AddRealEstatePage.js) & [EditRealEstatePage.js](file:///d:/Projects/FinStat/frontend/src/pages/real-estate/EditRealEstatePage.js)
- Consistent `.re-page-container.re-form-page` wrapper, un-underlined `.re-back-link` (`Back to Real Estate`), breadcrumb (`Assets / Real Estate / New` or `Edit`), wrapper `.re-submit-error` (`role="alert"`).
- `EditRealEstatePage.js`: `<Loading variant="form-field" text="Loading property details..." />`, fetch-error `.re-error-card` (`role="alert"`) with Retry button, and not-found `.re-empty-card` with return link.

---

### Routing, Linting & Test Harness
#### [MODIFY] [ProtectedRoute.js](file:///d:/Projects/FinStat/frontend/src/components/ProtectedRoute.js)
- Add `'/real-estate'`, `'/real-estate/new'`, `'/real-estate/edit/:id'` to `THEMED_PATTERNS` (`46 -> 49`).

#### [MODIFY] [.eslintignore](file:///d:/Projects/FinStat/frontend/.eslintignore)
- Remove lines `42–45` (`src/pages/real-estate/*.js`); preserve line `49` (`src/services/realEstateService.test.js`).

#### [NEW] [realEstateMocks.js](file:///d:/Projects/FinStat/frontend/tests/visual/fixtures/realEstateMocks.js)
- Single ordered `page.route(/\/api\/real-estates(?:\/|\?|$)/, ...)` handler with full cross-origin CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) + `OPTIONS` `204` preflight handling.
- Deterministic 4-property dataset:
  1. `New Cairo Apartment` (Residential, Owned): purchase `1,800,000`, current `2,200,000` → `+400,000` / `+22.22%`.
  2. `North Coast Chalet` (Villa, Owned): purchase `2,000,000`, current `1,850,000` → `-150,000` / `-7.50%`.
  3. `Smart Village Office` (Commercial, Sold break-even): purchase `2,500,000`, current `2,500,000`, selling `2,500,000` → displayed existing derivation `0`, backend realised `0`.
  4. `Downtown Retail Unit` (Commercial, Sold loss): purchase `3,000,000`, current `3,000,000`, selling `2,700,000` → displayed existing derivation `0`, backend realised `-300,000`. This proves no one-sided negative realised-loss tone leaks into Sold rows.
  - `/summary` aggregation must return `owned: { totalPaid: 3800000, totalValuation: 4050000, unrealizedGain: 250000, gainPercentage: 6.58, count: 2 }`, `sold: { totalPaid: 5500000, totalSoldValue: 5200000, realizedGain: -300000, count: 2 }`, `totalProperties: 4`.
  - `/:id` detail (`_id: '1'`), PUT, DELETE, and POST handlers return shapes matching `realEstateService.js` and the byte-identical payload under test.

#### [MODIFY] [visual.spec.js](file:///d:/Projects/FinStat/frontend/tests/visual/visual.spec.js), [a11y.spec.js](file:///d:/Projects/FinStat/frontend/tests/visual/a11y.spec.js), [playwright.config.js](file:///d:/Projects/FinStat/frontend/playwright.config.js)
- Wire `else if (route.slug.startsWith('real-estate')) { await setupRealEstateMocks(page); }` in `visual.spec.js` and `a11y.spec.js`.
- In `real-estate-reference-match.spec.js`, call `setFixedClock(page)`, set `window.__VISUAL_TEST__ = true` via `page.addInitScript`, and invoke `setupRealEstateMocks(page)` in `test.beforeEach` before any navigation, matching 8D precedent (`phase_8d_implementation_plan.md:300`).
- Register `real-estate-reference-match` in `playwright.config.js` `reference` project.

#### [NEW] Unit & Playwright Tests
- `frontend/src/pages/real-estate/__tests__/RealEstateLogPage.test.js` (~14 tests: 4-property KPI summary `+250,000` / `6.58%` and Sold realised `-300,000` fixture, Cards/Table toggle, search/status/type/sort filters, neutral badges & zero emojis, capital-gain rendering per selected option with Sold rows neutral in both options, `<progress>` accessible name/`aria-valuetext` & zero `[style]`, viewer `ProtectedAction` (including empty-state CTA) + optional `useCanModify` test, Delete `ConfirmModal` flow, loading/error+Retry/empty states, `jest-axe`).
- `frontend/src/pages/real-estate/__tests__/RealEstateForm.test.js` (~12 tests: 11 `id`/`htmlFor` pairings, blur & submit validation, valid-blur clearing & `aria-describedby` reset, conditional `Sold` fields validation + clearing when switching to `Owned`, `AddRealEstatePage` submit & `.re-submit-error`, `EditRealEstatePage` loading/prefill/error+Retry/not-found/update, zero `[style]`, `jest-axe`).
- `frontend/tests/visual/real-estate-reference-match.spec.js` (8 specs under `setFixedClock` + `setupRealEstateMocks`: `/real-estate` @ 1440px dark canvas/flat KPIs/single primary CTA/neutral badges/cards grid, `/real-estate` Table view @ 1440px right-aligned numbers & `W-8E-1`, `/real-estate` @ 390px Cards + Table D19 collapse with `0px` overflow, filter/search/sort interactions, `/real-estate/new` @ 1440px & 390px Frame 02 form + conditional Sold fields + blur/submit errors + `0px` overflow, `/real-estate/edit/1` @ 1440px & 390px prefilled form + `0px` overflow, touch targets `>= 44px` & keyboard Tab `:focus-visible`, Delete `ConfirmModal` Escape recovery). The Sold-loss fixture (`Downtown Retail Unit`) is asserted to render no negative realised-loss tone.

---

## 2. Verification Plan (Gates 0–19)

Execute sequentially on local branch `phase-ui-8e-real-estate` (from `main @ fea6d8f`, starting baseline `d86155f`); each gate must pass before proceeding:

0. **Gate 0 — Pre-Gate Branch & Governance Commit**:
   - Create local branch `phase-ui-8e-real-estate` from `main @ fea6d8f`.
   - Commit the approved `docs/ui-plans/phase_8e_implementation_plan.md` before any implementation or gates run.
   - Record Waiver **`W-8E-1`** in `docs/UI-UX_Plan/UI-UX-PLAN.md §7.1 (:2104)` for `.re-log-page .re-table-wrap` (`> 768px` Table view only; D19 cards at `<= 768px` with `0px` page overflow).
   - If Review Item #1 **Option A′** is selected, commit the Gate 0 `§4.3:328` / `§4.3.1:369` / initial `§10` amendment adding `real estate` to Unrealised P&L before Gates 4–18. Option B′ requires no `§4.3` amendment.
   - If Review Item #2 **Option A** is selected, record the authorized scoped `I4` defensive `useCanModify()` handler-guard bug-fix in Gate 0 `§10`.
   ```powershell
   git checkout main
   git rev-parse --short HEAD
   git checkout -b phase-ui-8e-real-estate
   git add docs/ui-plans/phase_8e_implementation_plan.md docs/UI-UX_Plan/UI-UX-PLAN.md
   git commit -m "docs(ui-phase-8e): approve plan and gate 0 governance amendments"
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
1. **Gate 1 — Route Allowlist & Coverage *(Informational Manual Gate)***:
   ```powershell
   node frontend/scripts/ui-coverage.js --assert-allowlist
   node frontend/scripts/ui-coverage.js --routes
   ```
   *(Note: `ui-coverage.js` exits `0` unconditionally; manually verify printed stdout shows **49** active patterns [`46 → 49`] and **75 route entries / 10 redirects / 65 rendering / 0 unassigned**, and record the raw output in `phase_8e_walkthrough.md`.)*
2. **Gate 2 — Token Drift Guard**:
   ```powershell
   node frontend/scripts/tokens.js --check --tables
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `0 drift`.
3. **Gate 3 — Test ID & ARIA Guard**:
   ```powershell
   node frontend/scripts/testid-guard.js --base fea6d8f
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `0` deletions vs `fea6d8f`.
4. **Gate 4 — Semantic Tone Guard**:
   ```powershell
   node frontend/scripts/lint-tones.js
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `0` violations across `61` page CSS / `64` total CSS on disk (no net new CSS files; `RealEstate.css` modified in-place).
5. **Gate 5 — Stylelint, Ratchet, D22, Overflow & Loading Greps**:
   ```powershell
   cd frontend
   node scripts/lint-ratchet.js --base fea6d8f
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   npx stylelint "src/pages/real-estate/RealEstate.css" "src/styles/theme-components.css"
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   git grep -n '#14b8a6' -- '*.css'
   Get-ChildItem -Recurse -Path src -Filter *.css | Select-String -SimpleMatch 'data-fs-theme="dark"'
   git grep -n 'full-bleed' -- src/pages/real-estate/
   git grep -nE '<div>Loading|className="loading-spinner"|custom spinner SVG' -- src/pages/real-estate/
   Select-String -Path src/pages/real-estate/RealEstate.css -Pattern 'gradient\(|blur\(|box-shadow\s*:\s*(?!none\b|var\(--fs-shadow\))'
   git grep -n 'overflow-x' -- '*.css'
   git -C .. diff fea6d8f -- frontend/src/pages/real-estate/RealEstate.css | Select-String -Pattern '^\+.*overflow-x'
   git -C .. diff fea6d8f -- frontend/src/services/realEstateService.js frontend/src/utils/formatters.js frontend/src/App.js frontend/src/pages/DashboardSummary.js frontend/src/styles/chartTheme.js frontend/tests/calculations.spec.js frontend/package.json frontend/package-lock.json backend/routes/realEstates.js backend/validationSchemas/realEstateSchemas.js frontend/src/pages/trades/Trades.css frontend/src/components/SummaryRow.css frontend/src/pages/certificates/Certificates.css frontend/src/pages/gold/GoldWallet.css frontend/src/pages/analytics/PurchasingPowerChart.css frontend/src/pages/mutual-funds/MutualFunds.css frontend/src/pages/currency/Currency.css frontend/src/pages/certificates/CertificateDetail.css
   ```
   *Pass*: `0` ratchet regressions across `63` linted CSS files; `stylelint` clean; `#14b8a6` only in `tokens.css:36`; `[data-fs-theme="dark"]` only in `tokens.css:2`; `0` `full-bleed` matches; `0` banned gradient/blur/shadow matches in `RealEstate.css`; `overflow-x` diff shows only `RealEstate.css` Waiver `W-8E-1`; every protected-file diff above is empty (`I2`/`I3`/`I12`).
6. **Gate 6 — ESLint & `.eslintignore` Verification**:
   ```powershell
   cd frontend
   npx eslint src/pages/real-estate/RealEstateLogPage.js src/pages/real-estate/RealEstateForm.js src/pages/real-estate/AddRealEstatePage.js src/pages/real-estate/EditRealEstatePage.js src/pages/real-estate/__tests__/RealEstateLogPage.test.js src/pages/real-estate/__tests__/RealEstateForm.test.js src/components/ProtectedRoute.js tests/visual/fixtures/realEstateMocks.js tests/visual/visual.spec.js tests/visual/a11y.spec.js tests/visual/real-estate-reference-match.spec.js playwright.config.js --max-warnings=0
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   git grep -in "pages/real-estate" .eslintignore
   ```
   *Pass*: `0` errors / `0` warnings; `0` `pages/real-estate` matches in `.eslintignore`.
7. **Gate 7 — Real Estate Jest & jest-axe**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/pages/real-estate/__tests__/RealEstateLogPage.test.js src/pages/real-estate/__tests__/RealEstateForm.test.js --watchAll=false --runInBand --verbose
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `2/2` suites, all ~26 tests green, `0` critical/serious jest-axe violations, `0` `[style]` elements; sold-loss fixture proves no negative tone leaks into Sold rows.
8. **Gate 8 — App & Dashboard Smoke + Line Cap**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   (Get-Content src/pages/DashboardSummary.js).Count
   ```
   *Pass*: `15/15` passed; `DashboardSummary.js <= 120` (`96`).
9. **Gate 9 — Calculations Parity (`I3`)**:
   ```powershell
   cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   *Pass*: `11/11` passed across all 8 domains (including Domain 8: Real Estate ROI and Yields unchanged).
10. **Gate 10 — Real-Browser Axe**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test a11y.spec.js --project=a11y -g "a11y check: real-estate(-new|-edit)?$"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: **4 passed** (`1 setup + 3 routes`), `0` serious/critical violations, `0` CORS errors.
11. **Gate 11 — Reference Match Spec**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test real-estate-reference-match.spec.js --project=reference
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: **9 passed** (`1 setup + 8 specs`) under `setFixedClock` + `setupRealEstateMocks`.
12. **Gate 12 — Standalone Production Build *(Documented §15.3/§15.5 Local Proxy; Authoritative CI on `main`)***:
    ```powershell
    cd frontend; $env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=2048'; npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: `Compiled successfully.` (`0` errors, `0` new warnings). Fallback to `--max-old-space-size=1536` if Windows semi-space commit limits trigger; explicitly authorized under User Review Item #4.
13. **Gate 13 — Recapture 15 Real Estate Baselines & Manifest**:
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="real-estate(-new|-edit)? @" --update-snapshots
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js --generate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C 'D:\Projects\FinStat-visual-baselines' add -A
    git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 8E: recapture 15 real estate route snapshots"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
    ```
    *Pass*: **16 passed** (`1 setup + 15 PNGs` replaced in place), `334/334` manifest verified (`0` net new entries); baseline SHA recorded.
14. **Gate 14 — PR-Subset Visual Regression (W-6A-1)**:
    ```powershell
    cd frontend; $env:CI='true'; $env:PR_SUBSET='true'; npx playwright test visual.spec.js --project=pr-subset
    ```
    *Pass*: `68/71` (`3` pre-existing W-6A-1/AD16 diffs only — Playwright exits `1` due to these accepted diffs; verify every failing test is in the W-6A-1/AD16 register and `0` diffs are attributable to 8E).
15. **Gate 15 — Full 326-Test Visual Suite *(§15.5 Authorized Local Deviation)***:
    ```powershell
    cd frontend; Remove-Item Env:PR_SUBSET -ErrorAction SilentlyContinue; $env:CI='true'; npx playwright test visual.spec.js --project=visual
    ```
    *Pass*: `326` accounted (`292 passed + 34 accepted AD14/AD16 diffs` — Playwright exits `1` due to these accepted diffs; verify every failing test is in the AD14/AD16 register and `0` are unexplained/8E-attributable); record route diff totals for `phase_8e_walkthrough.md` before cleaning `frontend/test-results/` and `frontend/playwright-report/` post-run (§7.1 HTML-report precedent).
16. **Gate 16 — Touch Targets & Focus Rings**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test real-estate-reference-match.spec.js --project=reference -g "touch targets"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *Pass*: **2 passed** (`1 setup + 1 filtered test`).
17. **Gate 17 — Developer Visual Inspection & Documented §7.4 State-Screenshot Deviation**: Copy all **15** recaptured PNGs (`real-estate`, `real-estate-new`, `real-estate-edit` × `1440/1024/768/480/390`) to the artifact directory and visually inspect all 15 via `read_file`; resolve any layout/alignment defect before re-verifying. Include the computed-style conformance table and the explicit §7.4 deviation recorded in §0.6: loading/empty/error/validation/modal states are covered by Gate 7 Jest + Gate 11 Playwright assertions, while populated views remain baseline-locked; no unversioned state PNGs are added.
18. **Gate 18 — Phase 8 Cluster Exit & Unthemed-Consumer Check**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test visual.spec.js --project=visual --grep="(real-estate|real-estate-new|real-estate-edit|currency|currency-detail|currency-new|currency-edit|certificates|certificates-detail|certificates-new|certificates-edit|gold-wallet|gold-wallet-new|gold-wallet-edit|gold-wallet-summary|analytics-purchasing-power|credit-cards) @"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    *(Unanchored alternation with explicit base slugs + ` @` matches Playwright's `Visual Regression Suite` title prefix cleanly; Credit Cards remains to continue 8D's untouched `Trades.css` consumer check.)*
    *Pass*: **86/86 passed** (`1 setup + 80 Phase 8 captures [16 routes × 5 widths] + 5 Credit Cards`), verifying all 16 Phase 8 routes at every mandatory width and `0` diffs attributable to 8E.
19. **Gate 19 — Walkthrough & Merge Boundary**: Author template-compliant `docs/ui-plans/phase_8e_walkthrough.md` (and artifact copy) containing:
    - Header ledger + §1 Progress Log (`Sub-phase`, `Status`, `Done`, `Next`, `Blocked by`, `Allowlist`, `Visual diff`, `Fixtures`, `Screenshots`, `Branch`, `Plan SHA`, `Implementation SHA`, `Walkthrough SHAs`, `Merge SHA`).
    - Verbatim §2 `I1–I16` compliance table from `walkthrough-template.md`.
    - §3 Visual Regression Diff Report (`(a)` total, `(b)` zero diff, `(c)` accepted diffs citing `AD14`/`AD16`, `(d)` zero unexplained + `verify-baseline-manifest.js` output + §7.1 HTML-report precedent disclosure).
    - §4 Gate 0–18 evidence table (including Gate 1 manual stdout and §15.3/§15.5 disclosures for Gates 12 & 15).
    - §5 Gate 17 15-PNG inspection log, computed-style conformance table, and explicit §7.4 state-screenshot deviation.
    - §6 Complete post-sign-off checklist including **Phase 8 Cluster Exit Gate closure `16 of 16`**.
    Commit implementation + walkthrough on local `phase-ui-8e-real-estate` and **STOP** awaiting explicit user sign-off before §3 Governance Synchronization, review cleanup, `--no-ff` merge to `main`, and `git push origin main`.

---

## 3. Governance Synchronization (Post-Sign-Off Only — Aside from Gate 0 Prerequisites)

> [!IMPORTANT]
> **Branch & Push Policy**: Feature branch `phase-ui-8e-real-estate` stays local per §14/§10 process precedent; only `main` is pushed, and only after explicit user sign-off on `phase_8e_walkthrough.md`.

1. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§5.7 (`:935–939`)**: Mark `/real-estate`, `/real-estate/new`, and `/real-estate/edit/:id` themed & QA'd (`☑ | ☑`); record `47` inline styles purged to `0` (`34` log + `7` form + `2` add + `4` edit), `2` icon `color` props, `37` hex and `8` `rgba` literals removed, Frame 01/03 graphite cards + Frame 02 stacked forms, neutral `<Badge>`/`react-icons/fa` (zero emojis), accessible `<progress>`, selected capital-gain option, D19 cards, and `W-8E-1`.
2. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.1 (`:1069`)**: Mark Phase **8E** complete (`☑ | ☑`).
3. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.12 (`:1871–1880`, `:1882–1889`)**:
   - Check all 8 items under `#### 8E — Real estate, all routes`; for `:1873` record that all cost/valuation/appreciation figures are neutral and, under Option B′, no realised-loss tone is introduced, or under Option A′, only Owned unrealised gain uses `<Delta>` per the Gate 0 amendment.
   - Check the Phase 8 exit gate items at `:1883–1887` (`16` routes themed, no pink/violet page identity, charts themed/accessible from earlier phases, build/tests/lint/axe/screenshots, zero diff on non-allowlisted routes).
   - Update `:1889` from `13 of 16 routes themed; 8E (Real Estate) remains open` to `16 of 16 routes themed; Phase 8 exit gate closed`.
4. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.1 (`:2167, :2183, :2189`)**: Acknowledge CSS inventory drift remains `64` total / `61` page CSS files on disk (`RealEstate.css` rewritten in place, no net new CSS file) versus §8.1's `57`-file snapshot.
5. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.2 (`:2209`)**: Update `pages/real-estate/RealEstateLogPage.js` to `34 *(purged to 0 in 8E)*`; note `RealEstateForm.js` (`7`), `AddRealEstatePage.js` (`2`), and `EditRealEstatePage.js` (`4`) were also purged to `0`.
6. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§10**: Finalize the Phase 8E progress log entry using all `walkthrough-template.md:10–24` fields (`Sub-phase`, `Status`, `Done`, `Next`, `Blocked by`, `Allowlist`, `Visual diff`, `Fixtures`, `Screenshots`, `Branch`, `Plan SHA`, `Implementation SHA`, `Walkthrough SHAs`, `Merge SHA`), starting `d86155f` & Gate 13 baseline SHA, `~26` new Jest tests, `11/11` calculations parity, `15` recaptured PNGs (`334/334` manifest), Gate 14 `68/71` (`3` W-6A-1/AD16 only), Gate 15 `326` (`292 + 34` AD14/AD16), Gate 18 `86/86`, `46 → 49` allowlist, `47` inline styles purged, `W-8E-1`, §7.1 HTML-report precedent, §7.4 state-screenshot deviation, Review Item #1 capital-gain selection, Review Item #2 `useCanModify()` selection, and Gate 12/15 local §15.3/§15.5 authorizations. The Sold-loss fixture (`realizedGain: -300000`) is data-only: no realised-gain or realised-loss figure is rendered under Option B′, and the existing `currentValuation - purchasePrice` derivation remains the sole displayed gain value per I3.
7. `docs/ui-plans/phase_8e_implementation_plan.md` (`- **Status**:`) & `docs/ui-plans/phase_8e_walkthrough.md` (Gate 19 SHAs & sign-off date).
8. Remove `*review*.md` from `docs/ui-plans/`, merge `phase-ui-8e-real-estate` into `main` (`--no-ff`), update `CHANGELOG.md` (announcing **AD13** allowlist expansion `46 → 49` per §7.2 `:2132` and Phase 8 cluster exit closure), and push only `main`.

---

## User Review Required

> [!IMPORTANT]
> Please confirm these **five items** before execution begins:
> 1. **Real Estate Capital Gain Semantics (`RealEstateLogPage.js`)**:
>    - **Option A′ (`<Delta>` for Owned unrealised gain only)**: Render the KPI `Unrealized Capital Gain` (`summary.owned.unrealizedGain`) and **Owned-row** Net Capital Gain (`currentValuation - purchasePrice`) via `<Delta>` (`Gain` / `Loss` / `No change`, positive/negative/neutral tones) AND commit a Gate 0 `§4.3:328` + `§4.3.1:369` + initial `§10` amendment adding `real estate` to Unrealised P&L. **Sold rows remain neutral signed `.fs-num` text**: no realised-gain label, no realised-loss calculation (`sellingPrice - purchasePrice` is not introduced), and no one-sided `<Delta tone="negative">` rule. ALL cost figures (`Capital Invested`, `Purchase Price`), valuations (`Current Portfolio Value`, `Current Valuation`), appreciation percentage (`gainPercentage` / `gainPct`), `<progress>` appreciation bar, property type chips (`Residential`, `Commercial`, `Villa`, `Land`, `Other`), and `Owned`/`Sold` status badges stay **strictly neutral** per `§4.3.1:365` & `§6.12:1873/:1877`.
>    - **Option B′ (Recommended — Strict Literal `:1873`/`:1877`, Lowest Risk)**: Keep **all** capital-gain, appreciation, cost, and valuation figures neutral signed `.fs-num` text. No `<Delta>` tones, no realised-loss calculation, no new label, and zero `§4.3`/`§4.3.1` amendment. This preserves I3 exactly (`currentValuation - purchasePrice` remains the only displayed gain derivation, unchanged from the current page) and matches the master plan’s explicit Real Estate neutrality rule. The deterministic fixture still includes a Sold loss so tests prove no negative tone leaks into Sold rows.
> 2. **Legacy `useCanModify()` Destructuring Bug in `RealEstateLogPage.js:35` (`I4` Scope)**:
>    - `RealEstateLogPage.js:35` currently writes `const canModify = useCanModify();`, which binds the full hook object `{ canModify, isViewer, isAdmin, isManager, role }` (always truthy), leaving `if (!canModify) return;` on line 69 (`handleDelete`) inert for viewers (exact same legacy bug encountered in Phase 8D).
>    - **Option A (Recommended)**: Explicitly authorize fixing `const { canModify } = useCanModify();` as a scoped defensive bug-fix in Gate 0 (with a direct viewer-role Jest test verifying `deleteRealEstate` is never invoked and that there is **no visible role-gating or `ProtectedAction` wrapper change**; the only behavior change is closing the previously inert `handleDelete` guard so it matches the existing viewer restriction).
>    - **Option B**: Leave line 35 untouched for strict literal `I4` presentation-only adherence (`ProtectedAction` still blocks button clicks in the UI).
> 3. **Waiver `W-8E-1` (Desktop/Tablet Table View 9-Column Scroll)**:
>    - Approve recording Waiver **`W-8E-1`** in `§7.1` at Gate 0 for `.re-log-page .re-table-wrap { overflow-x: auto; }` at `> 768px` (used only when the user toggles from default `Cards` view to `Table` view; hidden at `<= 768px`, where D19 compact-expand cards replace the table with `0px` page overflow), matching `W-8B-1` and `W-8D-1`.
> 4. **§15.3/§15.5 Local Build & Full-Visual-Suite Deviations (Gates 12 & 15)**:
>    - Explicitly authorize running the local standalone production build (**Gate 12**: `NODE_OPTIONS='--max-old-space-size=2048'`, with `--max-old-space-size=1536` hardware fallback if Windows semi-space commit limits trigger, keeping authoritative CI on `main`) and the full 326-test visual suite (**Gate 15**) locally per Phase 8A–8D precedent.
> 5. **Inherited `$` `formatCurrency()` on EGP-Labelled Fields**:
>    - Confirm retaining `frontend/src/utils/formatters.js` (`$`) unchanged per `I3` and Phase 8B–8D precedent (form labels keep `(EGP)` as in existing code, while display amounts continue calling `formatCurrency()`).
