# UI Phase 8C Implementation Plan — Certificates: Detail & Forms

- **Date**: 2026-11-27 (original draft)
- **Revision Date**: 2026-11-27
- **Revision**: **v3** — addresses both residual blockers and all 3 minor clarifications from `docs/ui-plans/phase_8c_implementation_plan_v2_review.md` (and all 11 findings from the v1 review)
- **Status**: Revised Draft — v3 (Awaiting User Approval; no gates executed and no production files changed)
- **Merge Base**: `main` @ `942e165`
- **Starting Baseline Commit**: `19d34c8` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)
- **Branch**: `phase-ui-8c-certificates-detail` (local only until Gate 19 walkthrough sign-off)
- **Taste Checkpoint**: **N/A** (Cluster 8 Taste Checkpoint #6 was delivered and signed off in Phase 8A)
- **Target Routes (3 routes)**:
  - `/certificates/:id` — Certificate Detail View (`CertificateDetailPage.js`, slug `certificates-detail`)
  - `/certificates/new` — Add New Bank Certificate (`AddCertificatePage.js` + `CertificateForm.js`, slug `certificates-new`)
  - `/certificates/edit/:id` — Edit Bank Certificate (`EditCertificatePage.js` + `CertificateForm.js`, slug `certificates-edit`)
- **Target Production Files**:
  - `frontend/src/pages/certificates/Certificates.css` *(Extend Phase 8B stylesheet with `.cert-detail-page` and `.cert-form-page` sub-scopes, including un-underlined `.cert-back-link` and `.cert-submit-error`; zero new `overflow-x`)*
  - `frontend/src/pages/certificates/CertificateDetailPage.js` *(Decouple `CertificateDetail.css`, purge all **88** inline styles [62 colour-bearing + 26 layout/typographic] & 81 hex / 10 `rgba` literals, migrate dual-series chart to `chartTheme.js` + local `certLastPointLabelPlugin` + 8A data-table alternative + D19 cards, convert hero/banner/KPIs/modals while preserving exact modal select labels)*
  - `frontend/src/pages/certificates/CertificateForm.js` *(Purge **2** inline styles, Reference Frame 02 Variant B stacked form, `id`/`htmlFor` pairing + preserved `account-selector-sourceAccount`, blur + submit validation with valid-blur clearing, `startDate` edit revalidation, and distinct inline `#cert-last-payout-error` vs submit `.cert-form-error-summary`)*
  - `frontend/src/pages/certificates/AddCertificatePage.js` *(Scoped `.cert-form-page` wrapper, breadcrumb, `.cert-submit-error` service-failure alert)*
  - `frontend/src/pages/certificates/EditCertificatePage.js` *(Scoped `.cert-form-page` wrapper, breadcrumb, `.cert-error-card` fetch-failure alert + `.cert-submit-error` service-failure alert alongside existing `<Loading variant="form-field" />`)*
  - `frontend/src/styles/theme-components.css` *(Section 20: Phase 8C Certificates Detail & Forms Semantic Themes)*
  - `frontend/src/components/ProtectedRoute.js` *(Allowlist expansion: **39 → 42** patterns, adding `'/certificates/:id'`, `'/certificates/new'`, `'/certificates/edit/:id'`)*
  - `frontend/.eslintignore` *(Remove lines 23–24: `src/pages/certificates/CertificateDetailPage.js`, `src/pages/certificates/CertificateForm.js` — zero certificate files remain ignored)*
  - `frontend/playwright.config.js` *(Register `certificates-detail-forms-reference-match.spec.js` in `reference` project)*
- **Target Test & Mock Files**:
  - `frontend/src/pages/certificates/__tests__/CertificateDetailPage.test.js` *(New CRA Jest + jest-axe suite: **16 tests**)*
  - `frontend/src/pages/certificates/__tests__/CertificateForm.test.js` *(New CRA Jest + jest-axe suite covering `CertificateForm`, `AddCertificatePage`, `EditCertificatePage`: **12 tests**)*
  - `frontend/tests/visual/fixtures/certificatesMocks.js` *(Extend existing mock with explicitly ordered `GET /api/certificates/:id/accrued-interest` and exact `GET /api/certificates/:id` while keeping `GET /api/certificates` byte-identical for Phase 8B)*
  - `frontend/tests/visual/certificates-detail-forms-reference-match.spec.js` *(New Playwright reference match spec: **8 spec tests**)*
  - `frontend/tests/visual/visual.spec.js` *(Broaden mock wiring from `route.slug === 'certificates'` to `route.slug.startsWith('certificates')`)*
  - `frontend/tests/visual/a11y.spec.js` *(Broaden mock wiring from `route.slug === 'certificates'` to `route.slug.startsWith('certificates')`)*
- **Governance Files Touched After Sign-Off**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§5.7 matrix & census, §6.1 board, §6.12 8C checklist & exit gate `9 of 16`, §8.2 hotspot count `61 → 88`, §10 progress log, cumulative allowlist `42`)
  - `docs/ui-plans/phase_8c_walkthrough.md` *(Author during Gate 19)*
  - `CHANGELOG.md`
- **Governing References**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§2 I1–I16; §4.3/§4.3.1 tone provenance; §4.4 CTA & link rules; §4.10 non-colour error cues; §4.12 chart accessibility; §5.7 route coverage; §6.3 allowlist; §6.4 patterns; §6.12 Phase 8C checklist; §7.1/§7.2 DoD; §8.2 hotspots; §10 progress log; §14 push policy; §15 local verification)
  - `docs/ui-plans/phase_7c_implementation_plan.md`, `phase_8a_implementation_plan.md`, `phase_8a_walkthrough.md`, `phase_8b_implementation_plan.md`, & `phase_8b_walkthrough.md` (approved structural, chart, form, modal, and governance precedents)
  - Canonical Reference Frames: `01-dense-table.html`, `02-form.html`, `03-dashboard.html` (all Variant B)
  - `AGENTS.md` (design tokens, anti-slop bans, D22 multi-theme door preservation)

---

## 0. Recorded Plan Decisions

1. **Shared CSS decoupling — `CertificateDetail.css` strictly untouched in Phase 8C**: Static import search confirmed that unthemed `frontend/src/pages/currency/CurrencyDetailPage.js` (line 32, Phase 8D) imports `../certificates/CertificateDetail.css`. Editing `CertificateDetail.css` in Phase 8C would regress `/currency/:id` (violating I13). Following the proven Phase 7B/7C/8A/8B decoupling pattern, `CertificateDetailPage.js` drops `import './CertificateDetail.css'` and imports `./Certificates.css` (extending `Certificates.css` with `.cert-detail-page` and `.cert-form-page` sub-scopes). **`CertificateDetail.css` remains byte-identical** until Phase 8D decouples `CurrencyDetailPage.js`. Gate 18 explicitly guards all 4 currency routes (including `currency-detail`) at all 5 viewports.
2. **Verified inline-style census (`58`/`61` → `88` detail + `2` form = `90` total)**: `UI-UX-PLAN.md` §5.7 line 928 & §6.12 line 1851 record `58` and §8.2 line 2199 records `61` for `CertificateDetailPage.js`. A direct scan of all four Phase 8C newline-terminated JSX files found **90** `style={{` attributes total:
   - `CertificateDetailPage.js` (`789` lines): **88** `style={{` (**62** colour-bearing + **26** layout/typographic), **81** hex literals, **10** `rgba` literals.
   - `CertificateForm.js` (`152` lines): **2** `style={{` (**2** colour-bearing + **0** layout), **3** hex literals.
   - `AddCertificatePage.js` (`20` lines) & `EditCertificatePage.js` (`37` lines): **0** inline styles.
   All **90** inline styles and all hardcoded hex/`rgba` literals are purged. Governance sync corrects §5.7, §6.12, and §8.2 post-sign-off.
3. **Neutral 5-status, hero, payout-due banner, metric tiles, and un-underlined back link (§4.3.1, §4.4)**: Matching Phase 8B, all 5 domain statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn`) render via neutral `<Badge tone="neutral">` wrapping existing `react-icons/fa` icons (`aria-hidden="true"`) + clean primary text labels (no emoji circles, no `20px` radius). The days-remaining pill also uses neutral `<Badge tone="neutral">` + `<FaClock aria-hidden="true" />`. The purple gradient hero (`#1e1b4b → #312e81`, `16px` radius), green payout-due banner (`#ecfdf5`, `12px` radius), and 6 coloured `.metric-box` tiles become flat dark graphite surfaces (`--fs-surface` / `--fs-surface-raised`, `--fs-border`, `--fs-radius-lg` 8px, `box-shadow: none`) with neutral `.fs-num` figures. The top `"Back to Certificates"` navigation link uses a distinct neutral class **`.cert-back-link`** (`text-decoration: none` per §4.4 navigation exclusion at `UI-UX-PLAN.md:410`), keeping `.cert-name-link` reserved exclusively for underlined in-content table links in `CertificateLogPage.js`.
4. **Single Primary CTA per visible page section/view and per-dialog confirm roles (§4.4)**:
   - On `/certificates/:id` (visible page surface when no dialog is open): `Disburse Payout Now` (in the Payout Due Notice banner when `!isWithdrawn && !cert.autoReinvest && cert.isPayoutDue`) is the single page-level `.fs-btn-primary`, while top-bar `Add Interest Payout` (`data-testid="add-payout-btn"`) drops to `.fs-btn-secondary`. When the banner is absent and payout is eligible, top-bar `Add Interest Payout` is the single page-level `.fs-btn-primary`; `Edit` and `Withdraw` are `.fs-btn-secondary`; `Delete` uses `.cert-btn-danger-outline` (danger hover/focus in Section 20). Thus **at most one** `.fs-btn-primary` appears across visible page sections.
   - Inside open dialogs on `/certificates/:id`: one confirm action per dialog — accent primary (`.fs-btn-primary`, `--fs-accent` / `--fs-ink`) for **Payout** (`Confirm Payout`), and danger confirm (`.cert-withdraw-confirm-btn`, `--fs-danger` / `--fs-ink` in Section 20) for **Withdraw** (`Confirm Withdrawal`), per `UI-UX-PLAN.md:401, :409`.
   - On `/certificates/new` and `/certificates/edit/:id`: `{Create|Update} Certificate` is the single `.fs-btn-primary`; `Cancel` link back to `/certificates` is `.fs-btn-secondary`.
5. **Dual-series accrual chart via `chartTheme.js` + local `certLastPointLabelPlugin` (§4.12 & D22)**: Following Phase 8A (`PurchasingPowerChart.js:252–271`, `:395` & `phase_8a_walkthrough.md:23`), `CertificateDetailPage.js` imports **only existing** `getChartPalette()`, `withAlpha()`, `baseChartOptions()`, and `ariaLabel()` from `../../styles/chartTheme.js` (zero shared `chartTheme.js` API additions). Series 1 (`Actual Accrued (Solid)`) uses `palette.grey4` solid line (`borderWidth: 3`, `fill: true` with `withAlpha(palette.grey4, 0.12)`); Series 2 (`Projected Accrual (Dashed)`) uses `palette.grey1` dashed line (`borderDash: [6, 6]`, `borderWidth: 2`, `fill: false`). Accent `#14b8a6` is never used as a chart series (§4.3.2 rule 6). Direct last-point labelling (§4.12): register a **local** Chart.js `afterDatasetsDraw` plugin (`certLastPointLabelPlugin`) that locates the last non-null numeric datum in **each** dataset and draws explicit `Actual: <value>` and `Projected: <value>` canvas labels (staggered vertically if endpoints collide) so neither series is legend-only; canvas wrapper carries `data-plugin-ids="certLastPointLabelPlugin"`. Accessibility (§4.12): canvas wrapper carries `aria-label` from `ariaLabel()`, adjacent summary (`data-testid="cert-chart-summary"`), and an adjacent 8A-pattern `<details>` + `<table data-testid="cert-trajectory-table">` (`<caption>`, `scope="col"`, `data-label`) paired with D19 compact-expand cards at $\le 768\text{px}$. Test split follows 8A precedent: Jest captures `certLastPointLabelPlugin` and verifies `ctx.fillText` for **both** datasets, while Playwright asserts `<canvas>` presence, `aria-label`, `data-plugin-ids`, summary, table semantics, and no accent series.
6. **Zero new `overflow-x` declarations in Phase 8C (no new waiver required)**: The trajectory data table has 3 columns (`Period`, `Actual Accrued`, `Projected Accrual`) and collapses into D19 compact-expand cards at $\le 768\text{px}$ without any horizontal scroll wrapper. Gate 5 diff check asserts **zero** added `overflow-x` lines vs `942e165`.
7. **Form validation cadence, error clearing/revalidation & separate error surfaces (§4.10 & Phase 7C precedent)**: `CertificateForm.js` validates `lastPayoutDate` **on blur** and **on submit** (`onBlur` + `onSubmit`).
   - Invalid `lastPayoutDate` displays an **inline field error** directly below `cert-last-payout-date` (`<p id="cert-last-payout-error" className="cert-field-error form-error" role="alert">`), bound via `aria-invalid="true"` and `aria-describedby="cert-last-payout-help cert-last-payout-error"`.
   - Blurring `lastPayoutDate` with a valid or cleared value immediately clears `fieldErrors.lastPayoutDate`, sets `aria-invalid="false"`, and resets `aria-describedby` back to `"cert-last-payout-help"`; editing `startDate` after a prior validation error revalidates `lastPayoutDate` against the updated start date.
   - On failed submit, a separate top **form validation summary** (`.cert-form-error-summary`, `role="alert"`) renders inside `<form>` listing blocking validation errors, distinct from `#cert-last-payout-error`.
   - Service/API failures caught by `AddCertificatePage` / `EditCertificatePage` on submit render a distinct wrapper-level **`.cert-submit-error`** (`role="alert"`) banner above the form (clearing automatically on next submit attempt) so two `.cert-form-error-summary` elements can never coexist. All error surfaces pair `--fs-danger` with `role="alert"` and explicit text cues (§4.10).
8. **Preserved labels, IDs, `AccountSelector`, I4/I5 contracts & detail modal selects**:
   - Preserve `data-testid="add-payout-btn"` (I5) and existing `ProtectedAction` wrappers on `Add Interest Payout` and `Disburse Payout Now` (I4).
   - **Form (`CertificateForm.js`)**: Keep `<AccountSelector>` props unchanged, preserving its existing auto-generated `id="account-selector-sourceAccount"` and built-in `<label htmlFor="account-selector-sourceAccount">`.
   - **Detail Modals (`CertificateDetailPage.js`)**: Preserve existing raw `<select>` controls and exact sibling labels/options — Withdraw modal renders `<label htmlFor="detail-withdraw-destination-account" className="fs-label">Deposit Proceeds To:</label>` + `<select id="detail-withdraw-destination-account" className="fs-select">` (`Bank Account`, `Cash Ledger`, `Prepaid Card`), and Payout modal renders `<label htmlFor="detail-payout-account-select" className="fs-label">Destination Account</label>` + `<select id="detail-payout-account-select" className="fs-select">` (`Bank Account`, `Cash Wallet`, `Prepaid Card`). Both select `id`s are **newly introduced** explicit pairings for accessibility while preserving the existing label text and option sets byte-for-byte.
   - Preserve `withdrawCertificate` payload including `destinationAccount` (`{ withdrawalDate, withdrawalReason: trim || undefined, confirmWithdrawal: true, destinationAccount }`), `processCertificatePayout` payload, and `CertificateForm`'s submit payload (`parseInt`, `parseFloat`, ISO `lastPayoutDate`, `sourceAccount`, `autoReinvest`).
9. **Phase 8C checklist scope note (§6.12 lines 1854–1856) & untouched `CertificateLogPage.js`**: Line 1854 ("Card list at ≤ 768px for certificate and currency logs") is a cross-cluster note (`CertificateLogPage` D19 cards landed in 8B; `CurrencyLogPage` lands in 8D). Line 1856 ("interest schedule table") is fulfilled by the new §4.12 accessible trajectory schedule table + D19 cards on `/certificates/:id`. `CertificateLogPage.js` remains completely untouched (preserving Phase 8B's `/certificates` baseline in `19d34c8`).

---

## 1. Plan Commitments & Governing Invariant Mapping (§2 I1–I16)

| Invariant | Applicability & Phase 8C Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id` unchanged in `App.js`; `ProtectedRoute.js` adds those 3 exact patterns (`39 → 42`). | Gate 1 & Gate 8 |
| **I2** | `certificateService.js` and `CertContext.js` untouched; all GET/POST/PUT/DELETE endpoints and payload shapes byte-identical. | Gate 6, Gate 7, PR diff |
| **I3** | Daily yield display, live accrued interest, withdrawal total payout, trajectory points, and form conversions unchanged; `calculations.spec.js` Domain 5 untouched (`11/11`). | Gate 7 & Gate 9 |
| **I4** | Existing `ProtectedAction` wrappers (`Add Interest Payout`, `Disburse Payout Now`) preserved unchanged. | Gate 7 |
| **I5** | Existing `data-testid="add-payout-btn"`, `account-selector-sourceAccount`, and exact modal label strings (`Deposit Proceeds To:`, `Destination Account`) preserved; explicit `aria-label`s added to refresh accrual button, modal close buttons, and chart wrapper. | Gate 3 & Gate 7 |
| **I6** | Trajectory data table collapses to D19 compact-expand cards at $\le 768\text{px}$; **zero** new `overflow-x` declarations; zero page-level overflow at 390px across all 3 routes. | Gate 5, Gate 11, Gate 16 |
| **I7** | All 3 remaining certificate routes added together; detail accrual auto-refresh, payout/withdraw/delete, create, and edit flows remain 100% functional. | Gate 1 & Gate 7 |
| **I8** | `DashboardSummary.js` untouched (`96` lines $\le 120$, 6/6 RTL tests green). | Gate 8 |
| **I9** | Local `CI=true` production build clean (`2048` heap cap); authoritative CI passes on merge. | Gate 6 & Gate 12 |
| **I10** | `CertificateDetailPage.test.js` (`16/16`), `CertificateForm.test.js` (`12/12`), `App.test.js` (`9/9`), and `DashboardSummary.test.js` (`6/6`) pass 100%. | Gate 7 & Gate 8 |
| **I11** | Zero `!important` in `Certificates.css` extensions or `theme-components.css` Section 20. | Gate 5 |
| **I12** | `package.json` untouched. | Gate 12 & PR diff |
| **I13** | Non-allowlisted routes — crucially `/currency/:id` (`CurrencyDetailPage.js` importing `CertificateDetail.css`) — stay pixel-identical to 1B baseline. | Gate 14, Gate 15, Gate 18 |
| **I14** | Removes hero gradient (`#1e1b4b → #312e81`) and pixel `box-shadow`s; zero banned visual slop in `Certificates.css`, Section 20, and all 4 JSX files. | Gate 5 (stylelint) |
| **I15** | Neutral by default: hero, payout-due notice, 5 status badges, 6 metric tiles, and chart series stay neutral; `--fs-danger` isolated in Section 20 for destructive confirm / validation errors / error cards, always paired with `role="alert"` and textual cues (§4.10). | Gate 4 & Gate 11 |
| **I16** | Removes `16px`, `12px`, `20px`, and `50%` radii from detail cards/banners/chips; all radii $\le 8\text{px}$ (`--fs-radius-sm/md/lg`) except `--fs-radius-pill` on `<Badge>` chips only. | Gate 5 (stylelint) |

---

## 2. Architecture, File Surface & Unchanged-Behavior Matrix

### 2.1 Production Files Modified
- `frontend/src/pages/certificates/Certificates.css`: Add `.cert-detail-page` styles (top bar, un-underlined `.cert-back-link`, flat `.cert-detail-hero`, `.cert-payout-due-banner`, `.cert-metrics-grid`, `.cert-metric-icon`, `.cert-chart-card`, `.cert-chart-canvas-wrap` `height: 320px`, `.cert-trajectory-details` + `.cert-trajectory-table` + D19 `.cert-trajectory-mobile-cards` at $\le 768\text{px}$, `@keyframes cert-spin`) and `.cert-form-page` styles (`.cert-form-card`, stacked `.form-group`, `.cert-field-help`, `.cert-form-error-summary`, `.cert-submit-error`, `.cert-field-error`, `.cert-form-actions`, `.cert-checkbox-label`). Keep `.cert-name-link` exclusively for underlined log-table links. Reuse existing Phase 8B `.cert-modal-*`, `.cert-kpi-*`, `.cert-error-card`, `.cert-empty-card`, and `.cert-status-badge` rules. Zero `overflow-x` added.
- `frontend/src/styles/theme-components.css` (Section 20 — `/* Phase 8C: Certificates Detail & Forms Semantic Themes (§4.3, §4.10, §6.12) */`): Scoped under `html[data-fs-theme]` for:
  - `.cert-btn-danger-outline:hover:not(:disabled)` / `:focus-visible` (`--fs-danger` border & text)
  - `.cert-form-page .cert-form-error-summary`, `.cert-form-page .cert-submit-error` (`--fs-danger` border, `--fs-text-2` text), and `.cert-form-page .cert-field-error` (`--fs-danger` text)
  - `.cert-form-page .cert-checkbox-input:checked` (`accent-color: var(--fs-accent)`)
- `frontend/src/pages/certificates/CertificateDetailPage.js`: Full tokenized refactor, `chartTheme.js` chart + local `certLastPointLabelPlugin` + 8A data table + D19 mobile cards, accessible Withdraw/Payout dialogs (full APG focus lifecycle including initial focus + newly added explicit select `id`s preserving exact label text), loading/error/not-found states, purge all 88 inline styles.
- `frontend/src/pages/certificates/CertificateForm.js`, `AddCertificatePage.js`, `EditCertificatePage.js`: Reference Frame 02 Variant B stacked forms, `id`/`htmlFor` + preserved `account-selector-sourceAccount`, blur + submit validation with valid-blur clearing & `startDate` edit revalidation, distinct `#cert-last-payout-error` / `.cert-form-error-summary` / `.cert-submit-error`, error surfaces, Cancel link + single primary CTA, purge 2 inline styles.
- `frontend/src/components/ProtectedRoute.js`: Expand `THEMED_PATTERNS` `39 → 42` (`'/certificates/:id'`, `'/certificates/new'`, `'/certificates/edit/:id'`).
- `frontend/.eslintignore`: Remove `src/pages/certificates/CertificateDetailPage.js` and `src/pages/certificates/CertificateForm.js`.

### 2.2 Unchanged by Design
`CertificateDetail.css` *(strictly untouched for Phase 8D `CurrencyDetailPage.js`)*, `CertificateLogPage.js` *(untouched; Phase 8B baseline preserved)*, `certificateService.js`, `CertContext.js`, `chartTheme.js`, `ConfirmModal.js`, `Badge.js`, `AccountSelector.js`, `Trades.css`, `calculations.spec.js`, `App.js`, `DashboardSummary.js`, `package.json`.

### 2.3 Unchanged-Behavior Matrix
| Behavior / Contract | Unchanged Guarantee |
|---|---|
| Routes (`App.js`) | `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id` unchanged |
| Service Calls | `getCertificateById`, `getAccruedInterest` (manual + 60s interval), `createCertificate`, `updateCertificate`, `withdrawCertificate`, `processCertificatePayout`, `deleteCertificate` unchanged |
| Detail Withdraw Payload | `withdrawCertificate(id, { withdrawalDate: ISO, withdrawalReason: trim \|\| undefined, confirmWithdrawal: true, destinationAccount })` |
| Detail Payout Payload | `processCertificatePayout(id, { payoutDate: payoutDate \|\| undefined, destinationAccount: payoutAccount })` |
| Form Submit Payload | `{ ...formData, sourceAccount: formData.sourceAccount \|\| 'Bank', autoReinvest: Boolean(formData.autoReinvest), period: parseInt(period, 10), amount: parseFloat(amount), interest: parseFloat(interest), lastPayoutDate: lastPayoutDate ? new Date(lastPayoutDate).toISOString() : undefined }` |
| Form Validation Rules | `lastPayoutDate < startDate` → `'Last payout date cannot be earlier than certificate start date.'`; `lastPayoutDate > today` → `'Last payout date cannot be in the future.'` (enforced on blur & submit; valid blur/edit clears) |
| Delete Flow | Shared `ConfirmModal` → `deleteCertificate(id)` → toast + `navigate('/certificates')` |
| `data-testid` / `AccountSelector` / `ProtectedAction` / Modal Labels | `data-testid="add-payout-btn"`, auto-generated form `id="account-selector-sourceAccount"`, detail Withdraw label `'Deposit Proceeds To:'` & Payout label `'Destination Account'`, and both `ProtectedAction` wrappers preserved |

---

## 3. Detailed Component Conversion Strategy

### 3.1 `CertificateDetailPage.js` (`/certificates/:id`)
- **Loading, Error & Not-Found States**:
  - `loading`: `<div className="page-container cert-page-container cert-detail-page"><Loading variant="card" text="Loading certificate details..." /></div>`.
  - `fetchError`: keep top Back link visible, render `.cert-error-card` (`role="alert"`, `--fs-danger` border + explicit error heading/text cue) with `Retry` button calling `fetchCertDetails()`.
  - `!cert` (not found): render `.cert-empty-card` with `<h2>Certificate Not Found</h2>` and neutral `<Link to="/certificates" className="fs-btn fs-btn-secondary">Return to Certificates</Link>`.
- **Top Bar & Hero**:
  - Neutral Back link: `<Link to="/certificates" className="cert-back-link"><FaArrowLeft aria-hidden="true" /> Back to Certificates</Link>` (`text-decoration: none` per §4.4 navigation exclusion; `.cert-name-link` stays exclusively on log-table certificate names).
  - Action buttons (`Edit`, `Add Interest Payout` [`data-testid="add-payout-btn"`], `Withdraw`, `Delete`) respecting §4.4 visible-section CTA scoping (see §0 Decision 4).
  - Flat graphite `.cert-detail-hero` card: `<h1>{cert.name}</h1>`, issued date / duration / payout interval subtitle, neutral status `<Badge tone="neutral">` (existing `react-icons/fa` icon `aria-hidden` + text label), neutral days-remaining `<Badge tone="neutral">` (`<FaClock aria-hidden="true" />` + `${cert.daysRemaining || 0} days remaining`).
- **Payout Due Notice Banner**:
  - Neutral `.cert-payout-due-banner` card (`--fs-surface-raised`, `--fs-border-strong`, `--fs-radius-lg`) displaying periodic interest amount (`.fs-num`), due date, and `ProtectedAction`-wrapped `Disburse Payout Now` (`.fs-btn-primary` — the single visible page-level primary CTA whenever rendered).
- **6 Key Metric Cards (Reference Frame 03 Variant B)**:
  - `.cert-metrics-grid` of 6 neutral `.cert-kpi-tile` cards (`Principal Amount`, `Annual Yield Rate`, `Live Accrued Interest` with accessible refresh `<button type="button" className="cert-icon-btn" aria-label="Refresh live accrued interest">`, `Next Payout Date`, `Maturity Date`, `Total Lifetime Yield`), all numeric values in `.fs-num`.
- **Dual-Series Interest Accrual Chart & Schedule Table (§4.12)**:
  - `.cert-chart-card` (`--fs-surface`, `--fs-border`, `--fs-radius-lg`): heading `<h2>Interest Accrual Trajectory (Dual Series)</h2>` (fixing the old `h1 → h3` heading skip), neutral subtitle, `.cert-chart-canvas-wrap` (`height: 320px`, `role="img"`, `aria-label={chartAriaLabel}`, `data-testid="cert-chart-canvas-wrapper"`, `data-plugin-ids="certLastPointLabelPlugin"`), `<Line data={chartData} options={chartOptions} plugins={[certLastPointLabelPlugin]} />` powered by `chartTheme.js` (`palette.grey4` solid + `palette.grey1` dashed), and adjacent `<p className="cert-chart-summary" data-testid="cert-chart-summary">{chartAriaLabel}</p>`.
  - **Local direct last-point plugin (`certLastPointLabelPlugin`)**: Matches `PurchasingPowerChart.js:252–271` & `:395` with zero `chartTheme.js` changes. Its `afterDatasetsDraw(chart)` finds the final non-null numeric point of **both** datasets (`Actual Accrued` and `Projected Accrual`) and draws explicit series-prefixed canvas labels (`Actual: <formatted>` and `Projected: <formatted>`, staggered vertically when endpoints fall within `18px`) so neither series is legend-only.
  - **Accessible Schedule Data Table & D19 Mobile Cards**: Matching 8A (`PurchasingPowerChart.js:405–430`), render:
    - `<details className="cert-trajectory-details">` containing `<summary>View interest accrual schedule table</summary>` and `<table className="cert-trajectory-table" data-testid="cert-trajectory-table">` with `<caption>Actual vs. Projected Interest Accrual Trajectory</caption>`, `<thead>` using `<th scope="col">` (`Period`, `Actual Accrued`, `Projected Accrual`), and `<td>` cells carrying `data-label` (`data-label="Period"`, `data-label="Actual Accrued"`, `data-label="Projected Accrual"` with `.fs-num`).
    - At $\le 768\text{px}$, hide the desktop `<details>` table and render D19 compact-expand cards (`data-testid="cert-trajectory-mobile-cards"`): each compact card displays `Period`, `Actual Accrued` (`.fs-num`), and a $\ge 44\times 44\text{px}$ expand toggle (`aria-expanded`, `aria-controls`) whose expanded drawer reveals `Projected Accrual` (`.fs-num`) mirroring the exact same formatted values as `cert-trajectory-table` with zero `overflow-x`.
- **Modals (Full APG Focus Lifecycle)**:
  - **Delete**: existing shared `<ConfirmModal>` unchanged.
  - **Withdraw & Payout**: tokenized dark dialogs reusing `.cert-modal-backdrop` (`role="presentation"`) + `.cert-modal` (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), implementing the full APG set matching `CertificateLogPage.js:105–148`:
    - **Initial focus on open**: focus moves to the modal close button (`closeBtnRef.current.focus()`, with fallback to `dialogRef.current.focus()`);
    - **Focus trap**: `Tab` / `Shift+Tab` wraps cleanly within dialog focusable elements;
    - **Escape & restore**: `Escape` closes and restores focus to the exact invoking trigger (`restoreTargetRef.current`);
    - **Controls & confirm roles**: explicit `<label htmlFor>` pairings preserving existing copy/options (`detail-payout-date-input` / `detail-payout-account-select` with `"Destination Account"` for Payout; `detail-withdraw-destination-account` with `"Deposit Proceeds To:"`, `detail-withdraw-reason-input`, `detail-withdraw-confirm-checkbox` for Withdraw), neutral `.fs-num` summary boxes, and one confirm action per dialog: accent primary (`.fs-btn-primary`) for Payout (`Confirm Payout`), danger confirm (`.cert-withdraw-confirm-btn`, `--fs-danger`/`--fs-ink` in Section 20) for Withdraw (`Confirm Withdrawal`).

### 3.2 `AddCertificatePage.js`, `EditCertificatePage.js`, & `CertificateForm.js` (`/certificates/new`, `/certificates/edit/:id`)
- **Wrappers**:
  - `<div className="page-container cert-page-container cert-form-page">` with breadcrumb (`Assets > Bank Certificates > New Certificate` / `Edit Certificate`) and `<h1>`.
  - `EditCertificatePage.js`: keeps `<Loading variant="form-field" text="Loading certificate..." />`, adds `.cert-error-card` (`role="alert"` + `Retry`) on fetch failure, and displays wrapper `.cert-submit-error` (`role="alert"`) on `updateCertificate` failure.
  - `AddCertificatePage.js`: displays wrapper `.cert-submit-error` (`role="alert"`) on `createCertificate` failure while keeping form state intact. `.cert-submit-error` is distinct from `<CertificateForm>`'s `.cert-form-error-summary` so duplicate summary banners never render simultaneously.
- **Form (`CertificateForm.js` — Reference Frame 02 Variant B)**:
  - `.cert-form-card` stacked single-column layout.
  - Purge both inline styles (`#fee2e2`/`#b91c1c` and `#6b7280`).
  - Pair every `<label htmlFor>` with input/select `id` (`cert-name`, `cert-period`, `cert-amount`, `cert-interest`, `cert-payout-interval`, `cert-start-date`, `cert-last-payout-date`, `cert-auto-reinvest`); all inputs/selects use `.fs-input` / `.fs-select`, labels use `.fs-label`, help text uses `.fs-help`.
  - Preserve `<AccountSelector direction="source" name="sourceAccount" ... />` props unchanged so existing auto-generated `id="account-selector-sourceAccount"` and its built-in `<label htmlFor="account-selector-sourceAccount">` remain intact.
  - **Blur + Submit Validation, Clearing & Revalidation**:
    - Validate `lastPayoutDate` against `startDate` and `today` **on blur** (`onBlur` on `cert-start-date` / `cert-last-payout-date`) and **on submit** (`onSubmit`).
    - When `fieldErrors.lastPayoutDate` is present, render the **inline field error** directly under `cert-last-payout-date` (`<p id="cert-last-payout-error" className="cert-field-error form-error" role="alert">`), and set `aria-invalid="true"` + `aria-describedby="cert-last-payout-help cert-last-payout-error"` on `cert-last-payout-date`.
    - When `lastPayoutDate` blurs with a valid or empty value, clear `fieldErrors.lastPayoutDate` (and `submitValidationErrors`), set `aria-invalid="false"`, and restore `aria-describedby="cert-last-payout-help"`. Editing `cert-start-date` when a validation error exists or `lastPayoutDate` is non-empty revalidates `lastPayoutDate` immediately so stale errors clear or new conflicts flag right away.
    - When submit fails validation, also render a separate top **form validation summary** (`.cert-form-error-summary`, `role="alert"`, placed inside `<form>` listing blocking validation errors, distinct from `#cert-last-payout-error` and from wrapper `.cert-submit-error`).
    - All error surfaces combine `--fs-danger` token styling with `role="alert"` and explicit text cues (§4.10).
  - Actions footer: neutral Cancel `<Link to="/certificates" className="fs-btn fs-btn-secondary">Cancel</Link>` + single primary `<button type="submit" className="fs-btn fs-btn-primary">{isEdit ? 'Update' : 'Create'} Certificate</button>` (`>= 44px`).

---

## 4. Test Strategy & Deterministic Mocks

### 4.1 Jest Unit & jest-axe Suites (Gate 7 target: **28 tests**)
1. `CertificateDetailPage.test.js` (**16 tests**):
   - (1) Renders `<Loading variant="card" />` while fetching;
   - (2) Renders `.cert-error-card` (`role="alert"`) with Retry calling `fetchCertDetails()` on API rejection;
   - (3) Renders `.cert-empty-card` with `Return to Certificates` link when cert is null;
   - (4) Renders un-underlined `.cert-back-link`, flat graphite hero, and neutral `<Badge>` chips with `aria-hidden` icons across all 5 statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn`) and zero emojis;
   - (5) Enforces Single Primary CTA per visible section: when `isPayoutDue` banner is visible, `Disburse Payout Now` is `.fs-btn-primary` and top-bar `Add Interest Payout` (`data-testid="add-payout-btn"`) is `.fs-btn-secondary`; when banner is absent, top-bar `Add Interest Payout` is `.fs-btn-primary`;
   - (6) Renders all 6 neutral KPI metric cards with `.fs-num` figures and invokes `getAccruedInterest(id)` on Refresh button click;
   - (7) Configures dual-series chart via `chartTheme.js` with zero hardcoded hex/`rgba` and zero `#14b8a6` accent series (`Actual Accrued` solid `grey4` + `Projected Accrual` dashed `grey1`);
   - (8) Direct last-point plugin & accessible table: captures local `certLastPointLabelPlugin` (`plugins` array passed to `<Line>`), invokes `certLastPointLabelPlugin.afterDatasetsDraw` with a fake `ctx`, asserts `ctx.save`/`ctx.restore` and `ctx.fillText` for **both** datasets with formatted `Actual:` and `Projected:` last-point labels; asserts `cert-chart-canvas-wrapper` `aria-label` & `data-plugin-ids="certLastPointLabelPlugin"`, `cert-chart-summary`, and `<details>`/`<summary>` + `<table data-testid="cert-trajectory-table">` with `<caption>`, `scope="col"`, and `<td>` `data-label`;
   - (9) Renders D19 trajectory mobile cards (`cert-trajectory-mobile-cards`) and toggles expander with `aria-expanded` / `aria-controls` revealing `Projected Accrual` mirroring table values;
   - (10) Enforces `ProtectedAction` viewer-role gating on `data-testid="add-payout-btn"` and `Disburse Payout Now`;
   - (11) Opens Payout modal (`role="dialog"`, `aria-modal="true"`, single `.fs-btn-primary` confirm control, preserved `'Destination Account'` label paired with `id="detail-payout-account-select"`), submits exact `processCertificatePayout(id, { payoutDate, destinationAccount })` payload, supports Cancel, and refreshes detail;
   - (12) Opens Withdraw modal (`role="dialog"`, `aria-modal="true"`, `.cert-withdraw-confirm-btn` danger confirm, preserved `'Deposit Proceeds To:'` label paired with `id="detail-withdraw-destination-account"`), displays live payout preview, enforces confirmation checkbox, submits exact `withdrawCertificate(id, { withdrawalDate, withdrawalReason, confirmWithdrawal: true, destinationAccount })` payload, and supports Cancel;
   - (13) Opens shared `ConfirmModal` on Delete, supports Cancel, confirms `deleteCertificate(id)` + navigates to `/certificates`;
   - (14) Verifies full APG modal focus lifecycle on Withdraw & Payout dialogs: moves **initial focus** to modal close button (`closeBtnRef`), traps `Tab`/`Shift+Tab` within dialog, closes on `Escape`, and restores focus to exact invoking trigger;
   - (15) Verifies zero inline `[style]` attributes across detail view and opened Withdraw/Payout modals;
   - (16) Passes `jest-axe` with 0 critical/serious violations.
2. `CertificateForm.test.js` (**12 tests**, covering `CertificateForm`, `AddCertificatePage`, `EditCertificatePage`):
   - (1) Pairs every `<label htmlFor>` with input/select `id` (including preserved `id="account-selector-sourceAccount"` from `AccountSelector`) and preserves all `name` attributes;
   - (2) Renders Reference Frame 02 stacked card, neutral Cancel link to `/certificates`, and single `.fs-btn-primary` submit CTA;
   - (3) Validates `lastPayoutDate < startDate` **on blur** (inline `#cert-last-payout-error` `role="alert"`, `aria-invalid="true"`, `aria-describedby="cert-last-payout-help cert-last-payout-error"`), **on submit** (adds distinct `.cert-form-error-summary` `role="alert"` without calling `onFormSubmit`), and clears when blurred valid or when `startDate` is edited into valid range (`aria-invalid="false"`, `aria-describedby="cert-last-payout-help"`);
   - (4) Validates `lastPayoutDate > today` **on blur** (inline `#cert-last-payout-error`) and **on submit** (both inline error and `.cert-form-error-summary`) without calling `onFormSubmit`;
   - (5) `CertificateForm` produces byte-identical payload (`parseInt` period, `parseFloat` amount/interest, ISO `lastPayoutDate`, `sourceAccount`, `autoReinvest`);
   - (6) `AddCertificatePage` calls `createCertificate(payload)` and navigates to `/certificates`;
   - (7) `AddCertificatePage` displays wrapper `.cert-submit-error` (`role="alert"`) if `createCertificate` fails (separate from `.cert-form-error-summary`);
   - (8) `EditCertificatePage` renders `<Loading variant="form-field" />` while fetching certificate;
   - (9) `EditCertificatePage` renders `.cert-error-card` (`role="alert"`) with Retry if `getCertificateById` fails, and `.cert-submit-error` if `updateCertificate` fails;
   - (10) `EditCertificatePage` prefills existing certificate, calls `updateCertificate(id, payload)`, and navigates to `/certificates`;
   - (11) Verifies zero inline `[style]` attributes across form, Add wrapper, and Edit wrapper;
   - (12) Passes `jest-axe` with 0 critical/serious violations across both Add and Edit states.

### 4.2 Deterministic Mocks (`frontend/tests/visual/fixtures/certificatesMocks.js`)
Extend `setupCertificatesMocks(page)` inside its `page.route(/\/api\/certificates(?:\/|\?|$)/, ...)` handler in **explicit priority order** so detail routes never fall through to list mocks and accrual checks never get swallowed by loose `/:id` matching:
1. `OPTIONS` → `204` CORS preflight (existing);
2. `POST /payout-due`, `POST /payout`, `POST /withdraw`, `DELETE`, `POST`/`PUT` → exact existing 8B handlers;
3. `GET` matching `/accrued-interest` → `200 OK` deterministic live accrual payload (`accruedInterest: 10000`, `daysElapsed: 184`, `nextPayoutDate: '2026-02-15T00:00:00.000Z'`, `totalEarned: 15000`);
4. `GET` matching exact detail path `/\/api\/certificates\/[^/?]+(?:\?.*)?$/` → `200 OK` `MOCK_CERTIFICATE_DETAIL` (`_id: '1'`, `name: 'NBE Platinum 20%'`, `amount: 100000`, `interest: 20`, `period: 12`, `payoutInterval: 'monthly'`, `startDate: '2025-07-15T00:00:00.000Z'`, `maturityDate: '2026-07-15T00:00:00.000Z'`, `daysRemaining: 181`, `daysElapsed: 184`, `displayStatus: 'active'`, `status: 'active'`, `accruedInterest: 10000`, `totalInterestEarned: 15000`, `periodicInterest: 1666.67`, `isPayoutDue: true`, `nextDuePayoutDate: '2026-01-15T00:00:00.000Z'`, `nextPayoutDate: '2026-02-15T00:00:00.000Z'`, `sourceAccount: 'Bank'`, `autoReinvest: false`, and deterministic 6-point `trajectory: { labels, actualSeries, projectedSeries }`);
5. `GET` matching exact list path `/\/api\/certificates(?:\?.*)?$/` → `200 OK` `MOCK_CERTIFICATES` (byte-identical to Phase 8B).

Wire `route.slug.startsWith('certificates')` in `visual.spec.js` and `a11y.spec.js`.

### 4.3 Reference Match Spec (`frontend/tests/visual/certificates-detail-forms-reference-match.spec.js` — **8 spec tests**)
1. `/certificates/1` dark graphite canvas (`#101114`), flat hero & 6 neutral KPI tiles (`#1a1c20`, zero gradient, zero pixel glow), radii $\le 8\text{px}$, and un-underlined `.cert-back-link` (`text-decoration-line: none`).
2. `/certificates/1` Single Primary CTA scoped to visible page sections (`count === 1` when no dialog open, `--fs-accent` / `--fs-ink`), neutral `<Badge>` with `aria-hidden` icon, `.fs-num` Plex Sans + `tabular-nums`, preserved `data-testid="add-payout-btn"`.
3. `/certificates/1` dual-series chart accessibility: rendered `<canvas>` presence (`width > 0`, `height > 0`), `aria-label` on `cert-chart-canvas-wrapper`, `data-plugin-ids` containing `certLastPointLabelPlugin`, `cert-chart-summary`, `<details>`/`<summary>` + `<table data-testid="cert-trajectory-table">` (`<caption>`, `scope="col"`, `data-label`), and zero `#14b8a6` accent series.
4. `/certificates/1` Withdraw & Payout dialog semantics (`role="dialog"`, `aria-modal="true"`), **initial focus** inside open modal (`closeBtn`), exact confirm CTA roles (`Confirm Payout` `.cert-modal .fs-btn-primary` `count === 1`; `Confirm Withdrawal` `.cert-modal .cert-withdraw-confirm-btn` without accent primary), Escape close, and focus restoration to exact invoking trigger.
5. `/certificates/1` mobile responsive (`768`, `480`, `390px`): desktop `<details>` table hidden, D19 cards (`cert-trajectory-mobile-cards`) visible with interactive `aria-expanded` toggle revealing `Projected Accrual` matching table values, and zero page-level horizontal overflow at 390px.
6. `/certificates/new` Reference Frame 02 Variant B stacked form card, label/`id` pairing (`account-selector-sourceAccount` preserved), neutral Cancel link, single primary CTA, blur triggers `#cert-last-payout-error` (`aria-invalid` + `aria-describedby`), valid blur clears error and resets `aria-describedby`, failed submit renders distinct `.cert-form-error-summary` (`role="alert"`) + `#cert-last-payout-error`, zero overflow at 390px.
7. `/certificates/edit/1` prefills certificate data in Reference Frame 02 card with single primary CTA (`Update Certificate`) and zero overflow at 390px.
8. `interactive touch targets`: $\ge 44\times 44\text{px}$ primary/mobile/form buttons, $\ge 32\times 32\text{px}$ desktop inline refresh button, and visible `:focus-visible` ring on keyboard Tab across detail & form routes.

---

## 5. Complete 19-Gate Verification Protocol

Execute sequentially from repository root (unless `cd frontend` is shown); each gate must exit 0 before proceeding:

1. **Gate 1 — Route Allowlist**: `node frontend/scripts/ui-coverage.js --assert-allowlist` *(**42/42** patterns; all 4 certificate routes active).*
2. **Gate 2 — Token Drift Guard**: `node frontend/scripts/tokens.js --check --tables` *(0 drift).*
3. **Gate 3 — Test ID & ARIA Label Guard**: `node frontend/scripts/testid-guard.js` *(0 deletions; `data-testid="add-payout-btn"` preserved).*
4. **Gate 4 — Semantic Tone Guard**: `node frontend/scripts/lint-tones.js` *(0 violations, 0 undefined tokens).*
5. **Gate 5 — Stylelint, Anti-Slop & Zero-New-Overflow Audit**:
   ```powershell
   cd frontend
   node scripts/lint-ratchet.js
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   npx stylelint src/pages/certificates/Certificates.css src/styles/theme-components.css
   git grep -n '#14b8a6' -- '*.css'
   Get-ChildItem -Recurse -Path src/pages/certificates -Filter *.css | Select-String -Pattern 'overflow-x'
   git -C .. diff 942e165 -- frontend/src | Select-String -Pattern '^\+.*overflow-x'
   git -C .. diff 942e165 -- frontend/src/pages/certificates/CertificateDetail.css
   ```
   *Pass*: 0 ratchet regressions; 0 stylelint errors; 0 `!important`; `#14b8a6` only in `tokens.css:36`; scoped audit shows ONLY existing 8B `.cert-log-page .cert-table-wrap` (`Certificates.css:266`, W-8B-1); diff vs `942e165` adds **ZERO** `overflow-x` lines; `CertificateDetail.css` diff is **empty**. Pre-existing §7.1:2104 global-grep drift (`32` matches on `main`) is non-8C debt.
6. **Gate 6 — ESLint & De-Ignore**:
   ```powershell
   cd frontend
   npx eslint src/pages/certificates/CertificateDetailPage.js src/pages/certificates/CertificateForm.js src/pages/certificates/AddCertificatePage.js src/pages/certificates/EditCertificatePage.js src/pages/certificates/__tests__/CertificateDetailPage.test.js src/pages/certificates/__tests__/CertificateForm.test.js src/components/ProtectedRoute.js tests/visual/fixtures/certificatesMocks.js tests/visual/certificates-detail-forms-reference-match.spec.js tests/visual/visual.spec.js tests/visual/a11y.spec.js playwright.config.js --max-warnings=0
   git grep -in "certificates" .eslintignore
   ```
   *Pass*: 0 errors/warnings; `git grep -in "certificates" .eslintignore` returns **0 matches**.
7. **Gate 7 — CRA Jest Unit & jest-axe**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/pages/certificates/__tests__/CertificateDetailPage.test.js src/pages/certificates/__tests__/CertificateForm.test.js src/pages/certificates/__tests__/CertificateLogPage.test.js --watchAll=false --runInBand --verbose
   ```
   *Pass*: **43/43** (`16` detail + `12` form + `15` existing 8B log); 0 critical/serious jest-axe.
8. **Gate 8 — Route Guard & Dashboard Coordinator**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
   (Get-Content src/pages/DashboardSummary.js).Count # must be <= 120 (96)
   ```
   *Pass*: 9/9 route tests + 6/6 dashboard tests; line cap held.
9. **Gate 9 — Calculation Parity (I3)**:
   ```powershell
   cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
   ```
   *Pass*: 11/11 across 8 domains; Domain 5 Certificates unchanged.
10. **Gate 10 — Real-Browser Axe**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test tests/visual/a11y.spec.js --project=a11y -g "a11y check: certificates-(detail|new|edit)$"
    ```
    *Pass*: **4 passed** (`1 setup + 3 routes`); 0 critical/serious `wcag2a`/`wcag2aa` violations.
11. **Gate 11 — Reference Match Spec**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/certificates-detail-forms-reference-match.spec.js
    ```
    *Pass*: **9 passed** (`1 setup + 8 spec tests`).
12. **Gate 12 — Production Build (Local Proxy; Authoritative CI on Merge)**:
    ```powershell
    cd frontend; $env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=2048'; npm run build
    ```
    *Pass*: exits 0, `Compiled successfully.`, zero errors, zero new warnings. *(Uses `2048` heap cap per Phase 8A/8B hardware note; authoritative CI runs on merge to `main`.)*
13. **Gate 13 — Visual Baselines & Manifest (15 Snapshots)**:
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test --project=visual tests/visual/visual.spec.js --grep="certificates-(detail|new|edit) @" --update-snapshots
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js --generate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C 'D:\Projects\FinStat-visual-baselines' add -A
    git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 8C: recapture 15 certificates detail and form snapshots"
    git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
    ```
    *Pass*: **16 passed** (`1 setup + 15 snapshots`: 3 routes × 5 viewports replaced in place); manifest remains **334/334** (`0` net new entries); baseline SHA recorded.
14. **Gate 14 — PR-Subset Visual Regression (W-6A-1)**:
    ```powershell
    cd frontend; $env:CI='true'; $env:PR_SUBSET='true'; npx playwright test --project=pr-subset tests/visual/visual.spec.js
    ```
    *Pass*: Expected reconciliation target **68/71** with only the 3 accepted W-6A-1/AD16 diffs; any new diff blocks merge; 0 diffs attributable to 8C.
15. **Gate 15 — Full 326-Test Visual Reconciliation (§15.5 Documented Local Deviation)**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js
    ```
    *Pass*: Deliberately run locally in full (matching the documented Phase 8A/8B §15.5 deviation necessitated by the local `2048`MB build/run hardware environment rather than standard CI sharding — **not** presented as unmodified §15.5 CI execution). Expected reconciliation target: **326** accounted (`292 passed + 34 accepted AD14/AD16`, matching 7A/8A/8B); all 15 recaptured 8C snapshots + 5 8B `/certificates` snapshots pass; 0 unexplained or 8C-attributable diffs.
16. **Gate 16 — Touch Targets & Focus Rings**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/certificates-detail-forms-reference-match.spec.js -g "interactive touch targets"
    ```
    *Pass*: **2 passed** (`1 setup + 1 filtered test`).
17. **Gate 17 — Developer Visual Inspection**: Inspect recaptured snapshots across 1440/1024/768/480/390 for `/certificates/1`, `/certificates/new`, and `/certificates/edit/1` against Frame 02 & Frame 03 Variant B; record computed-style conformance table and §7.4 Jest state-evidence inheritance in walkthrough.
18. **Gate 18 — Unthemed-Consumer & Shared-CSS Decoupling Preservation**:
    Because unthemed `CurrencyDetailPage.js` (Phase 8D) still imports `../certificates/CertificateDetail.css` and Phase 8B's `/certificates` shares `Certificates.css`, this gate verifies all 8 routes across the Certificates and Currency clusters (**41/41** = `1 setup + 8 routes × 5 viewports`):
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js --grep="certificates|currency"
    ```
    - **Certificates cluster (4 routes = 20 snapshots)**: `certificates` (5 from 8B, unchanged) + `certificates-detail`, `certificates-new`, `certificates-edit` (15 recaptured in 8C).
    - **Currency cluster (4 routes = 20 snapshots)**: `currency`, `currency-detail` (`CertificateDetail.css` consumer), `currency-new`, `currency-edit` — all still-unthemed 8D routes.
    - *Pass*: **41/41** passed; 0 diffs attributable to 8C; `CertificateDetail.css` untouched.
19. **Gate 19 — Walkthrough, User Sign-Off & Merge Boundary**: Author template-compliant `docs/ui-plans/phase_8c_walkthrough.md` (with verbatim §2 I1–I16 table, §3 Visual Regression Diff Report + manifest output, Gate 17 conformance table, explicit §15.5 local-deviation disclosure for Gate 15, full SHA set, and complete post-sign-off checklist). Only after explicit user sign-off: apply §6 Governance Synchronization, remove review files, merge `phase-ui-8c-certificates-detail` into `main` (`--no-ff`), and push only `main`.

---

## 6. Governance Synchronization (Post-Sign-Off)

> [!IMPORTANT]
> **Branch & Push Policy (§14)**: Feature branch `phase-ui-8c-certificates-detail` stays local and is **never pushed** to `origin`. Only `main` is pushed, and only after explicit user sign-off on `phase_8c_walkthrough.md`.

1. `UI-UX-PLAN.md` §5.7 (`:928–930`): Mark `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id` themed & QA'd (`☑ | ☑`); update `58 inline styles; chart` → `88 inline styles purged (62 colour + 26 layout; 789 lines); chartTheme dual-series + last-point plugin + data table`.
2. `UI-UX-PLAN.md` §6.1 (`:1067`): Mark Phase 8C complete (`☑ | ☑`).
3. `UI-UX-PLAN.md` §6.12 (`:1848–1858` & `:1889`): Check all 9 checklist items under `#### 8C — Certificates: detail + forms`; note `CertificateDetail.css` left untouched for Phase 8D `CurrencyDetailPage.js` (decoupled into `Certificates.css`), update `(58)` → `(88)` (`90` total across 789/152/20/37 lines), and update Phase 8 exit gate counter from `6 of 16` → `9 of 16 routes themed; 8D–8E remain open`.
4. `UI-UX-PLAN.md` §8.2 (`:2199`): Update `CertificateDetailPage.js` hotspot count from `61` → `88 (purged to 0 in 8C; originally audited 61)`.
5. `UI-UX-PLAN.md` §10: Append Phase 8C progress log entry with full SHAs (plan, implementation, walkthrough, merge, starting `19d34c8` & Gate 13 baseline), `28` new (`43` total cert) Jest tests, `11/11` calc, `15` snapshots replaced in place (`334/334` manifest), allowlist `39 → 42`, `90` inline styles purged, `0` new `overflow-x`, explicit §15.5 Gate 15 local-deviation note, and Gate 18 `41/41`.
6. `CHANGELOG.md`: Add Phase 8C entry.
