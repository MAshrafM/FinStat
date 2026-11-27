# UI Phase 8B Implementation Plan — Certificates of Deposit Log

- **Date**: 2026-11-26 (original draft)
- **Revision Date**: 2026-11-26
- **Revision**: **v3** — resolves all 5 minor clarifications (§4.1–§4.5) on top of v2's resolution of all 5 blocking findings in `docs/ui-plans/phase_8b_implementation_plan_review.md`
- **Status**: Approved 2026-11-26 (user approval recorded in session after v3 review; implemented on local branch `phase-ui-8b-certificates-log` @ `23f65bf`, awaiting Gate 19 walkthrough sign-off)
- **Merge Base**: `main` @ `237700a`
- **Starting Baseline Commit**: `3f174fb` in `D:\Projects\FinStat-visual-baselines` (334/334 manifest verified)
- **Branch**: `phase-ui-8b-certificates-log` (local only until walkthrough sign-off)
- **Taste Checkpoint**: **N/A** (Phase 8A delivered and signed off Taste Checkpoint #6 for Cluster 8)
- **Target Route (1 route only)**:
  - `/certificates` — Certificates of Deposit Log (`CertificateLogPage.js`)
  - *(Detail `/certificates/:id` and forms `/certificates/new`, `/certificates/edit/:id` remain legacy until Phase 8C.)*
- **Target Production Files**:
  - `frontend/src/pages/certificates/Certificates.css` *(New dedicated tokenized stylesheet; scoped under `.cert-page-container` / `.cert-log-page` so Phase 8C can extend shared cert tokens without duplicating rules)*
  - `frontend/src/pages/certificates/CertificateLogPage.js` *(Refactored: decouple `Trades.css`, purge all **89** inline styles [57 colour-bearing + 32 layout/typographic], add error state with Retry, D19 cards, and tokenized accessible Withdraw/Payout dialogs)*
  - `frontend/src/styles/theme-components.css` *(Section 19: Phase 8B Certificates Log Semantic Themes)*
  - `frontend/src/components/ProtectedRoute.js` *(Allowlist expansion: **38 → 39** patterns, adding `'/certificates'` only)*
  - `frontend/.eslintignore` *(Remove line 25: `src/pages/certificates/CertificateLogPage.js` only; keep `CertificateDetailPage.js` and `CertificateForm.js` until 8C)*
  - `frontend/playwright.config.js` *(Register `certificates-reference-match.spec.js` in `reference` project)*
- **Target Test & Mock Files**:
  - `frontend/src/pages/certificates/__tests__/CertificateLogPage.test.js` *(New CRA Jest + jest-axe suite: **15 tests**)*
  - `frontend/tests/visual/fixtures/certificatesMocks.js` *(New deterministic API mock)*
  - `frontend/tests/visual/certificates-reference-match.spec.js` *(New Playwright reference match spec: **7 spec tests**)*
  - `frontend/tests/visual/visual.spec.js` *(Wire `setupCertificatesMocks` strictly for `route.slug === 'certificates'`)*
  - `frontend/tests/visual/a11y.spec.js` *(Wire `setupCertificatesMocks` strictly for `route.slug === 'certificates'`)*
- **Governance Files Touched After Sign-Off**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§5.7 census/matrix, §6.1 board, §6.12 8B checklist & 5-status wording alignment, §7.1 line 2104 Waiver W-8B-1, §10 progress log, cumulative allowlist 39)
  - `docs/ui-plans/phase_8b_walkthrough.md` *(Author during Gate 19)*
  - `CHANGELOG.md`
- **Governing References**:
  - `docs/UI-UX_Plan/UI-UX-PLAN.md` (§2 I1–I16; §4.3/§4.3.1 tone provenance; §5.7 route coverage; §6.3 allowlist; §6.4 patterns; §6.12 Phase 8B checklist; §7.1/§7.2 DoD; §10 progress log; §14 push policy)
  - `docs/ui-plans/phase_8a_implementation_plan.md` & `phase_8a_walkthrough.md` (approved structural, verification, and governance precedent)
  - Canonical Reference Frames: `01-dense-table.html` (Variant B), `03-dashboard.html` (Variant B)
  - `AGENTS.md` (design tokens, anti-slop bans, D22 multi-theme door preservation)

---

## 0. Recorded Plan Decisions

1. **Verified inline-style census (`66` → `89`, `57` colour + `32` layout)**: `UI-UX-PLAN.md` §5.7 line 927 and §6.12 line 1841 record a stale count of `66` inline styles for `CertificateLogPage.js`. A verified regex/AST audit of `CertificateLogPage.js` (722 lines) found **89** `style={{` attributes: **57 colour-bearing** (containing hex colors, `rgba`, `white`, `linear-gradient`, or colored borders/shadows such as `borderTop: '1px solid #cbd5e1'`) and **32 purely layout/typographic** (`display`, `flex`, `gap`, `margin`, `padding`, `fontSize`, `fontWeight`, `opacity`, `cursor`). All **89** will be purged; zero inline styles remain. Governance sync updates §5.7, §6.12, and §10 with this exact verified split (reconfirmed at walkthrough).
2. **Complete 5-status & semantic presentation (neutral-by-default per §4.3.1 + icon+text alignment with §6.12)**: `CertificateLogPage.js` has five domain statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn` — never renamed to "Redeemed"). Because §4.3.1 records **no** warning or negative threshold/label for Certificates, per §4.3.1 line 371 (*"An empty source means the row is neutral and unlabeled"*), all five status chips render via neutral `<Badge tone="neutral">` with **both an existing `react-icons/fa` icon (`aria-hidden="true"`, no new icon set per §4.3 rule 4) and clean primary text label** (`Active`, `Maturing Soon`, `Future`, `Matured`, `Withdrawn`), removing emoji circles (`🟢`, `🟡`, `⏳`, `🔴`, `⚪`) and `borderRadius: '12px'`. Governance sync updates §6.12 line 1842 wording from `active/matured/redeemed` to the 5 actual domain statuses. All ordinary numeric/status fields (`Principal Amount`, `Interest Rate`, `Days Left`, `Accrued Interest`, KPI tiles, modal payout amounts) remain neutral `.fs-num` / neutral text. See §3.1 for the complete presentation table.
3. **Non-colour discoverability for `isPayoutDue`**: When `cert.isPayoutDue` is true, no unprovenanced tone colour is used; instead, discoverability is preserved via explicit accessible naming (`aria-label={`Interest payout due — process payout for ${cert.name || 'certificate'}`}` and `title="Interest Payout Due! Click to process"`), neutral structural affordance (`.cert-icon-btn--due`), and explicit label on mobile cards, verified in Gate 7 and Gate 11.
4. **Error-state rendering precedence**: Loading takes first precedence (`if (isLoading)` renders `<Loading variant="table" />`). When `!isLoading && error` is truthy, `.cert-page-header` (`<h1>Bank Certificates</h1>` + header actions) remains visible for navigation context, and `.cert-error-card` (`role="alert"`, Retry button invoking `refreshCertificates()`) renders in the main content slot **in place of** the KPI overview grid, filter bar, desktop table, and mobile cards (never showing misleading zeroed KPIs or an empty page).
5. **Single Primary CTA (§4.4)**: `Add Certificate` uses `.fs-btn.fs-btn-primary` (`--fs-ink` on `--fs-accent`). `Process Due Payouts` becomes `.fs-btn.fs-btn-secondary` (neutral), eliminating the second primary/green header button.
6. **Underlined inline links (§4.4)**: Certificate name `<Link to={`/certificates/${cert._id}`}>` uses `.cert-name-link` (`text-decoration: underline; text-underline-offset: 2px;`) instead of `#4f46e5` with `textDecoration: 'none'`.
7. **Waiver W-8B-1 (9-column desktop/tablet table container scroll)**: `CertificateLogPage.js` renders a 9-column table (< 12 columns). Desktop/tablet viewports (`> 768px`) use `.cert-log-page .cert-table-wrap { overflow-x: auto; }` under **Waiver W-8B-1** (matching W-7C-1 and W-8A-1 precedent). At $\le 768\text{px}$, the desktop table is hidden and replaced by D19 compact-expand cards with zero page-level horizontal overflow at 390px. Governance sync updates `UI-UX-PLAN.md` §7.1 line 2104 to add W-8B-1.
8. **Shared CSS decoupling (`Trades.css` strictly untouched)**: Remove `import '../trades/Trades.css';` from `CertificateLogPage.js`. **Do not edit `Trades.css`.** Five remaining `Trades.css` import sites (`TradeLogPage.js`, `TradeForm.js`, `TradeSummaryPage.js`, `CurrencyLogPage.js`, `CreditCardPage.js`) and the three still-unthemed 8C certificate routes (`/certificates/:id`, `/certificates/new`, `/certificates/edit/:id`) are verified pixel-identical in Gate 18.
9. **Typography & radii (D16/AD10, I16)**: `.fs-num` remains IBM Plex Sans + `font-variant-numeric: tabular-nums` + right alignment for monetary/numeric values. Filter buttons use `--fs-radius-md` ($\le 8\text{px}$), not `20px`; `--fs-radius-pill` is used on `<Badge>` status chips only.
10. **Modal architecture (§3.2)**: Preserve shared `<ConfirmModal>` for Delete (accepting its `<h3>` precedent). Convert Withdraw and Payout into custom tokenized dark dialogs with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, keyboard focus trap, Escape close, focus restoration to the invoking trigger, explicit `<label htmlFor>` pairings, and byte-identical service payloads.
11. **No sortable columns (§6.12 line 1845 clarification)**: Current `CertificateLogPage.js` implements status filtering (`all`, `active`, `maturing_soon`, `future`, `matured`, `withdrawn`) and row actions, and has **no** column sorting. Per I3/I7, Phase 8B verifies existing status filtering and row-action behavior unchanged without introducing unrequested sort state.

---

## 1. Plan Commitments & Governing Invariant Mapping (§2 I1–I16)

| Invariant | Applicability & Phase 8B Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `/certificates` route unchanged in `App.js`; only `ProtectedRoute.js` `THEMED_PATTERNS` adds `'/certificates'` (38 → 39). | Gate 1 & Gate 8 |
| **I2** | `certificateService.js` and `CertContext.js` untouched; zero API/payload changes. | Gate 6, Gate 7, PR diff |
| **I3** | Days remaining, maturity, accrued interest, withdrawal impact preview, and summary totals unchanged; `calculations.spec.js` Domain 5 untouched (11/11). | Gate 7 & Gate 9 |
| **I4** | `ProtectedAction` wrappers on all 6 mutating controls (`Process Due Payouts`, `Add Certificate`, `Edit`, `Add Interest Payout`, `Withdraw`, `Delete`) + `useCanModify()` checks preserved. | Gate 7 |
| **I5** | All existing `data-label` and accessible names preserved; explicit `aria-label`s added to all icon-only actions (including `isPayoutDue` discovery) and modal close buttons. | Gate 3 & Gate 7 |
| **I6** | 9-column desktop/tablet table (`> 768px`) wrapped in `.cert-log-page .cert-table-wrap` (Waiver W-8B-1); D19 compact-expand cards at $\le 768\text{px}$; zero page-level overflow at 390px. | Gate 5, Gate 11, Gate 16 |
| **I7** | Status filtering, due-payout scan, individual payout, early withdrawal, delete, and detail/edit navigation remain 100% functional. | Gate 1 & Gate 7 |
| **I8** | `DashboardSummary.js` untouched ($\le 120$ lines, 6/6 RTL tests green). | Gate 8 |
| **I9** | Production build exits 0 with zero errors and no new warnings. | Gate 6 & Gate 12 |
| **I10** | `CertificateLogPage.test.js` (15/15) and `App.test.js` pass 100%. | Gate 7 & Gate 8 |
| **I11** | Zero `!important` in `Certificates.css` or `theme-components.css` Section 19. | Gate 5 |
| **I12** | `package.json` untouched. | Gate 12 & PR diff |
| **I13** | Non-allowlisted routes (including 8C `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id`) pixel-identical to 1B baseline. | Gate 14, Gate 15, Gate 18 |
| **I14** | Removes purple `linear-gradient(...)` banner and `boxShadow` pixel shadows; zero banned visual slop in `Certificates.css`, Section 19, and `CertificateLogPage.js`. | Gate 5 (stylelint) |
| **I15** | Neutral by default: all 5 status badges and numeric figures are neutral; `--fs-danger` used only on destructive Delete/Withdraw confirm actions and error surface via Section 19. | Gate 4 & Gate 11 |
| **I16** | All radii $\le 8\text{px}$ (`--fs-radius-sm/md/lg`) or `--fs-radius-pill` on `<Badge>` status chips only; removes `12px` and `20px` radii. | Gate 5 (stylelint) |

---

## 2. Architecture, File Surface & Unchanged-Behavior Matrix

### 2.1 New & Modified Production Files
- `frontend/src/pages/certificates/Certificates.css`: Scoped strictly under `html[data-fs-theme] .cert-page-container` (D22 attribute-existence selector) with `.cert-log-page` sub-scope. Defines header, `.cert-kpi-grid` / `.cert-kpi-tile` (Reference Frame 03 Variant B), `.cert-filter-bar` / `.cert-filter-btn`, `.cert-table-wrap` / `.cert-table` (Reference Frame 01 Variant B, desktop/tablet `overflow-x: auto` under W-8B-1), `.cert-mobile-cards` (D19 compact-expand cards at $\le 768\text{px}$), `.cert-modal-backdrop` / `.cert-modal` / `.cert-modal-summary` / `.cert-modal-field` (neutral dark dialog surfaces), `.cert-empty-card`, and `.cert-name-link`. Neutral tokens only; zero `!important`, zero raw hex, zero tone tokens.
- `frontend/src/styles/theme-components.css` (Section 19 — `/* Phase 8B: Certificates Log Semantic Themes (§4.3, §6.12) */`): Scoped strictly under `html[data-fs-theme]` for:
  - `.cert-filter-btn.is-active` (`--fs-accent` background / `--fs-ink` text, hover `--fs-accent-hover`, never white text)
  - `.cert-icon-btn-danger` hover/focus (`--fs-danger`)
  - `.cert-withdraw-confirm-btn` (`--fs-danger` background / `--fs-ink` text, hover `--fs-danger-hover`, disabled `--fs-disabled-opacity`)
  - `.cert-modal-close:focus-visible` & custom dialog interactive controls (neutral focus rings `--fs-focus-ring`, accent checked checkbox `--fs-accent`, primary payout confirm button via `.fs-btn-primary`)
  - `.cert-error-card` (`--fs-danger` border/text rule)
- `frontend/src/pages/certificates/CertificateLogPage.js`: Decouples `Trades.css`, purges all **89** inline styles (57 colour-bearing + 32 layout/typographic), adds error state handling (`role="alert"` + Retry) while keeping page header visible, converts header/KPI/filter/table/D19 cards/Withdraw & Payout dialogs.
- `frontend/src/components/ProtectedRoute.js`: Adds `'/certificates'` to `THEMED_PATTERNS` (38 → 39).
- `frontend/.eslintignore`: Removes `src/pages/certificates/CertificateLogPage.js` (line 25).

### 2.2 Unchanged by Design
`certificateService.js`, `CertContext.js`, `CertificateDetail.css`, `CertificateDetailPage.js`, `CertificateForm.js`, `AddCertificatePage.js`, `EditCertificatePage.js`, **`Trades.css`** (strictly untouched; 5 remaining import sites: `TradeLogPage.js`, `TradeForm.js`, `TradeSummaryPage.js`, `CurrencyLogPage.js`, `CreditCardPage.js`), `ConfirmModal.js`, `Badge.js`, `calculations.spec.js`, `App.js`, `DashboardSummary.js`.

### 2.3 Unchanged-Behavior Matrix
| Behavior / Contract | Unchanged Guarantee |
|---|---|
| Routes (`App.js`) | `/certificates`, `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id` unchanged |
| Context & Services | `useCertData()` (`certificates`, `certificateSummary`, `isLoading`, `error`, `refreshCertificates`), `deleteCertificate`, `withdrawCertificate`, `processCertificatePayout`, `processDuePayouts` unchanged |
| Status Filtering | Exact 6 filters (`all`, `active`, `maturing_soon`, `future`, `matured`, `withdrawn`) matching `cert.displayStatus \|\| cert.status \|\| 'active'`; no new sort state added |
| `ProtectedAction` / `useCanModify` | All 6 mutating controls (`Process Due Payouts`, `Add Certificate`, `Edit`, `Add Interest Payout`, `Withdraw`, `Delete`) remain gated |
| Process Due Payouts | Calls `processDuePayouts()`, shows success/info/error toast, calls `refreshCertificates()` |
| Payout Payload | `processCertificatePayout(cert._id, { payoutDate: payoutDate \|\| undefined, destinationAccount: payoutAccount })` |
| Withdraw Payload | `withdrawCertificate(cert._id, { withdrawalDate: new Date().toISOString(), withdrawalReason: withdrawalReason.trim() \|\| undefined, confirmWithdrawal: true })` |
| Delete Flow | Shared `ConfirmModal` → `deleteCertificate(deletingCertId)` → toast + `refreshCertificates()` |
| Calculations | `daysRemaining`, `startDate` countdown, `amount + accruedInterest` withdrawal preview, and `CertContext` summary math unchanged |

---

## 3. Detailed Component Conversion Strategy (`CertificateLogPage.js`)

### 3.1 Complete Status & Semantic Presentation Table (§4.3 / §4.3.1)

| UI Element | Current States in Code | Planned Treatment | §4.3 / §4.3.1 Provenance |
|---|---|---|---|
| **Status badge** (`renderStatusBadge`) | `active`, `maturing_soon`, `future`, `matured`, `withdrawn` | Neutral `<Badge tone="neutral">` wrapping an existing `react-icons/fa` icon (`FaCheckCircle`, `FaClock`, `FaHourglassHalf`, `FaFlagCheckered`, `FaUndoAlt`, `aria-hidden="true"`) + clean primary text label (`Active`, `Maturing Soon`, `Future`, `Matured`, `Withdrawn`); removes emoji circles and `12px` radius | §4.3.1 has no recorded certificate warning condition (stays neutral); §4.3 rule 4 uses existing `react-icons/fa` set; §6.12 text+icon satisfied |
| **Status Breakdown KPI** | 5 status counts in overview card | Clean text labels (`Active`, `Maturing Soon`, `Future`, `Matured`, `Withdrawn`) + neutral `.fs-num` counts; remove emojis | §4.3 neutral-by-default |
| **KPI metrics** | Active Certificates, Active Principal Invested, Total Expected Yield | Graphite `.cert-kpi-tile` (Reference Frame 03 Variant B) with neutral `.fs-num` figures; remove purple `linear-gradient` banner & pixel shadow | §4.3 neutral-by-default; I14 |
| **Filter toolbar** | `all`, `active`, `maturing_soon`, `future`, `matured`, `withdrawn` | Neutral `.cert-filter-btn` (`--fs-radius-md` ≤ 8px) with `aria-pressed`; active state `.is-active` uses `--fs-accent` / `--fs-ink` in Section 19 | §4.3.2 interactive accent; I16 |
| **Certificate Name** | `<Link to="/certificates/:id">` | `.cert-name-link` with `text-decoration: underline; text-underline-offset: 2px;` (neutral text, no `#4f46e5`) | §4.4 inline link affordance |
| **Principal Amount & Interest Rate** | Currency & `%` columns | Neutral `.fs-num` (IBM Plex Sans + `tabular-nums`, right-aligned) | §4.3 neutral-by-default; D16 |
| **Days Left** | `Liquidated` (withdrawn), `Starts in Nd` (future), `Completed` (`<= 0`), `N day(s)` | Neutral text / `.fs-num`; remove `#6b7280`, `#8b5cf6`, `#ef4444` category color coding | §4.3.1 has no recorded threshold; stays neutral |
| **Accrued Interest** | `Not started yet` (future), `formatCurrency(accruedInterest)`, `Calculating...` | Neutral `.fs-num` / muted `--fs-text-2` text; remove `#10b981` green on ordinary amount | §4.3 neutral-by-default |
| **Header Actions** | `Process Due Payouts`, `Add Certificate` | Single primary CTA: `Add Certificate` (`fs-btn fs-btn-primary`); `Process Due Payouts` becomes `fs-btn fs-btn-secondary` | §4.4 one primary per view |
| **Row Actions** | View, Edit, Payout (`isPayoutDue`), Withdraw, Delete | Accessible icon buttons (`>= 32x32px` desktop per AD25, `>= 44x44px` mobile) with explicit `aria-label`s; neutral icons; when `isPayoutDue` is true, button renders `.cert-icon-btn--due` with strengthened `aria-label` (`"Interest payout due — process payout for <name>"`) and `title` without raw `#10b981`; Delete `<FaTrash>` converted to `<button type="button" className="cert-icon-btn cert-icon-btn-danger">` (`--fs-danger` hover/focus in Section 19) | I15; §4.4; AD25 |
| **Error Surface** | `useCertData().error` (when `!isLoading && error`) | Keep `.cert-page-header` visible; render `.cert-error-card` (`role="alert"`, Retry button calling `refreshCertificates()`) styled with `--fs-danger` in Section 19 **in place of** overview/filters/table/mobile cards | §7.2 tokenized error state |

### 3.2 Modal Architecture Matrix

| Modal | Component / Implementation | Semantics & Keyboard/Focus | Inputs & Validation | Actions & Preserved Payload |
|---|---|---|---|---|
| **Delete** | Existing shared `<ConfirmModal>` (unchanged; accepts `<h3>` precedent) | `role="dialog"`, focus trap, Escape close, focus restore | None | Cancel (`secondary`), Delete Certificate (`variant="danger"`, `isLoading={isDeleting}`) → `deleteCertificate(deletingCertId)` |
| **Withdraw** | Custom tokenized dark dialog (`.cert-modal-backdrop` + `.cert-modal`) | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="withdraw-modal-title"`, Tab/Shift+Tab focus trap, Escape closes, restores focus to invoking trigger on close, accessible close button (`aria-label="Close withdrawal modal"`) | Impact preview box (`.cert-modal-summary`, neutral `.fs-num` for Principal, Accrued Interest, Estimated Total Payout); `<label htmlFor="withdraw-reason-input">` + text input; `<label htmlFor="withdraw-confirm-checkbox">` + required checkbox | Cancel (`fs-btn-secondary`), Confirm Withdrawal (`fs-btn cert-withdraw-confirm-btn` — `--fs-danger`/`--fs-ink` in Section 19, disabled until `confirmedCheckbox && !isSubmittingWithdraw`) → `withdrawCertificate(id, { withdrawalDate, withdrawalReason: trim \|\| undefined, confirmWithdrawal: true })` |
| **Payout** | Custom tokenized dark dialog (`.cert-modal-backdrop` + `.cert-modal`) | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="payout-modal-title"`, Tab/Shift+Tab focus trap, Escape closes, restores focus to invoking trigger on close, accessible close button (`aria-label="Close payout modal"`) | Disbursement summary box (`.cert-modal-summary`, neutral `.fs-num` for `periodicInterest`, rate & frequency); `<label htmlFor="payout-date-input">` + date input; `<label htmlFor="payout-account-select">` + select (`Bank`, `Cash`, `Prepaid`) | Cancel (`fs-btn-secondary`, disabled while submitting), Confirm Payout (`fs-btn-primary` — `--fs-accent`/`--fs-ink`, disabled while `isSubmittingPayout`) → `processCertificatePayout(id, { payoutDate: payoutDate \|\| undefined, destinationAccount: payoutAccount })` |

### 3.3 D19 Mobile Compact-Expand Cards ($\le 768\text{px}$)
- Desktop `.cert-desktop-table` (with `.cert-log-page .cert-table-wrap { overflow-x: auto; }` per Waiver W-8B-1) is displayed above `768px` and hidden at $\le 768\text{px}$.
- `.cert-mobile-cards` renders at $\le 768\text{px}$ with zero page-level overflow at `390px`:
  - **Compact row**: Certificate Name (`.cert-name-link`), Status `<Badge>` (icon + text), Principal Amount (`.fs-num`), and expand/collapse toggle button ($\ge 44\times 44\text{px}$, `aria-expanded`, `aria-controls`).
  - **Expanded drawer**: Interest Rate, Period, Days Left, Maturity Date, Accrued Interest, due-payout note when `isPayoutDue`, and full-touch-target ($\ge 44\times 44\text{px}$) action controls (View, Edit, Payout when eligible, Withdraw when not withdrawn, Delete).

---

## 4. Test Strategy & Deterministic Mocks

### 4.1 Jest Unit & jest-axe Suite (`CertificateLogPage.test.js` — 15 tests)
1. Renders loading skeleton (`Loading variant="table"`) when `isLoading` is true.
2. When `!isLoading && error`, keeps header (`Bank Certificates`) visible, renders `.cert-error-card` (`role="alert"`) **in place of** overview KPIs, filters, and table, and invokes `refreshCertificates()` when Retry is clicked.
3. Renders Portfolio Overview KPI tiles and Status Breakdown counts using `.fs-num` without gradients or emojis.
4. Renders all 6 status filter buttons with `aria-pressed` and filters certificates across `all`, `active`, `maturing_soon`, `future`, `matured`, `withdrawn`.
5. Renders empty filter state when no certificates match the active filter.
6. Renders 9-column desktop table with underlined name links, neutral `<Badge>` chips (icon `aria-hidden` + text) for all 5 statuses, neutral `.fs-num` figures (`Days Left`, `Accrued Interest`, `Principal`, `Rate`), and strengthened non-color `aria-label`/`title` when `isPayoutDue` is true.
7. Collapses to D19 mobile cards and toggles expanded drawer with `aria-expanded` / `aria-controls`, exposing all details and actions.
8. Enforces `ProtectedAction` read-only gating on all 6 mutating controls (`Process Due Payouts`, `Add Certificate`, `Edit`, `Payout`, `Withdraw`, `Delete`) when `useCanModify` returns `false`.
9. Triggers `processDuePayouts()` on `Process Due Payouts` click, displays toast, and calls `refreshCertificates()`.
10. Opens Payout modal (`role="dialog"`, `aria-modal="true"`), displays disbursement summary, submits exact `processCertificatePayout(id, { payoutDate, destinationAccount })` payload, supports Cancel, and refreshes list.
11. Opens Withdraw modal (`role="dialog"`, `aria-modal="true"`), displays live impact preview (`Principal`, `Accrued Interest`, `Estimated Total Payout`), keeps submit disabled until confirmation checkbox is checked, submits exact `withdrawCertificate(id, { withdrawalDate, withdrawalReason, confirmWithdrawal: true })` payload, and supports Cancel.
12. Opens shared `ConfirmModal` on Delete click, supports Cancel, and confirms `deleteCertificate(id)` + refreshes list.
13. Handles keyboard accessibility on Withdraw and Payout dialogs: `Escape` key closes modal and restores focus to the invoking trigger button; Tab cycles within dialog (focus trap).
14. Preserves zero inline `style` attributes across rendered log view and modals.
15. Passes `jest-axe` with 0 critical/serious violations.

### 4.2 Deterministic Mock (`frontend/tests/visual/fixtures/certificatesMocks.js`)
Exports `setupCertificatesMocks(page)`:
- `GET /api/certificates` → returns 5 deterministic certificates covering all five statuses (`active` with `isPayoutDue: true`, `maturing_soon`, `future`, `matured`, `withdrawn`) so every status badge, KPI count, and action button renders deterministically.
- `POST /api/certificates/payout-due` → `200 OK` `{ processedCount: 1, totalDisbursedEgp: 1500 }`.
- `POST /api/certificates/:id/payout` → `200 OK` `{ message: 'Interest payout processed successfully!' }`.
- `POST /api/certificates/:id/withdraw` → `200 OK` `{ message: 'Certificate marked as withdrawn' }`.
- `DELETE /api/certificates/:id` → `200 OK` `{ message: 'Certificate deleted successfully' }`.

Wired into `visual.spec.js` and `a11y.spec.js` **strictly for `route.slug === 'certificates'`** (leaving `certificates-detail`, `certificates-new`, `certificates-edit` untouched).

### 4.3 Reference Match Spec (`frontend/tests/visual/certificates-reference-match.spec.js` — 7 spec tests)
1. Dark graphite page surface (`#101114`), card surface (`#1a1c20`), zero `linear-gradient` / `box-shadow` glow.
2. Header single primary CTA (`Add Certificate` with `--fs-accent` `#14b8a6` and `--fs-ink` `#0d0e10`) and secondary `Process Due Payouts`.
3. `.fs-num` renders IBM Plex Sans + `tabular-nums`; all 5 status `<Badge>` chips render neutral tokens (`--fs-surface-raised`, `--fs-border`, `--fs-text`) with `aria-hidden` SVG icon + text label; name links underlined; `isPayoutDue` control exposes explicit non-color accessible label.
4. Active filter button uses `--fs-accent` / `--fs-ink`; radii $\le 8\text{px}$ (except pill `<Badge>`).
5. Desktop/tablet (`> 768px`) `.cert-log-page .cert-table-wrap` has `overflowX === 'auto'` (Waiver W-8B-1); Withdraw/Payout dialogs expose `role="dialog"`, `aria-modal="true"`, Escape close, and focus restoration.
6. Mobile ($\le 768\text{px}$: 768, 480, 390) renders D19 compact-expand cards, expands drawer with all details, and has `scrollWidth <= innerWidth` (zero page-level overflow at 390px).
7. `interactive touch targets`: $\ge 44\times 44\text{px}$ primary/mobile, $\ge 32\times 32\text{px}$ desktop inline (AD25), and visible `:focus-visible` ring on real keyboard Tab.

---

## 5. Complete 19-Gate Verification Protocol

Execute sequentially from repository root (unless `cd frontend` is shown); each gate must exit 0 before proceeding:

1. **Gate 1 — Route Allowlist**: `node frontend/scripts/ui-coverage.js --assert-allowlist` *(39/39 patterns; `/certificates` added).*
2. **Gate 2 — Token Drift Guard**: `node frontend/scripts/tokens.js --check --tables` *(0 drift).*
3. **Gate 3 — Test ID & ARIA Label Guard**: `node frontend/scripts/testid-guard.js` *(0 deletions).*
4. **Gate 4 — Semantic Tone Guard**: `node frontend/scripts/lint-tones.js` *(0 violations, 0 undefined tokens).*
5. **Gate 5 — Stylelint, Anti-Slop & Overflow Audit (8A-parity)**:
   ```powershell
   cd frontend
   node scripts/lint-ratchet.js
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   npx stylelint src/pages/certificates/Certificates.css src/styles/theme-components.css
   git grep -n '#14b8a6' -- '*.css'
   git grep -nE '<div>Loading|className="loading-spinner"|custom spinner SVG' src -- '*.js'
   Get-ChildItem -Recurse -Path src/pages/certificates -Filter *.css | Select-String -Pattern 'overflow-x'
   git -C .. diff 237700a -- frontend/src | Select-String -Pattern '^\+.*overflow-x'
   ```
   *Pass*: 0 regressions vs `237700a`; 0 stylelint errors; 0 `!important`; `#14b8a6` only in `tokens.css`; scoped audit shows only `.cert-log-page .cert-table-wrap` (desktop/tablet-only under W-8B-1); diff check shows no other added `overflow-x` lines; loading grep shows only primitives/tests. Pre-existing §7.1:2104 global-grep drift on `main` (32 pre-existing matches) is recorded as pre-existing governance-text drift, not an 8B defect.
6. **Gate 6 — ESLint & De-Ignore**:
   ```powershell
   cd frontend
   npx eslint src/pages/certificates/CertificateLogPage.js src/pages/certificates/__tests__/CertificateLogPage.test.js src/components/ProtectedRoute.js tests/visual/fixtures/certificatesMocks.js tests/visual/certificates-reference-match.spec.js tests/visual/visual.spec.js tests/visual/a11y.spec.js playwright.config.js --max-warnings=0
   ```
   *Pass*: 0 errors/warnings; `CertificateLogPage.js` removed from `.eslintignore`; `Trades.css` diff is empty.
7. **Gate 7 — CRA Jest Unit & jest-axe**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/pages/certificates/__tests__/CertificateLogPage.test.js --watchAll=false --runInBand --verbose
   ```
   *Pass*: **15/15** passed; 0 critical/serious jest-axe violations.
8. **Gate 8 — Route Guard & Dashboard Coordinator**:
   ```powershell
   cd frontend; $env:CI='true'; npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
   (Get-Content src/pages/dashboard/DashboardSummary.js).Count # must be <= 120
   ```
   *Pass*: 9/9 route tests + 6/6 dashboard tests; line cap held.
9. **Gate 9 — Calculation Parity (I3)**:
   ```powershell
   cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
   ```
   *Pass*: 11/11 across 8 domains; Domain 5 Certificates unchanged.
10. **Gate 10 — Real-Browser Axe**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test tests/visual/a11y.spec.js --project=a11y -g "a11y check: certificates$"
    ```
    *Pass*: 2 passed (1 setup + 1 route); 0 critical/serious `wcag2a`/`wcag2aa` violations.
11. **Gate 11 — Reference Match Spec**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/certificates-reference-match.spec.js
    ```
    *Pass*: **8 passed** (1 setup + 7 spec tests), including modal semantics/keyboard, `isPayoutDue` label, and zero 390px page overflow.
12. **Gate 12 — Production Build**:
    ```powershell
    cd frontend; $env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
    ```
    *Pass*: exits 0, zero errors, zero new warnings.
13. **Gate 13 — Visual Baselines & Manifest (5 Snapshots)**:
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test --project=visual tests/visual/visual.spec.js --grep="certificates @" --update-snapshots
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js --generate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C 'D:\Projects\FinStat-visual-baselines' add -A
    git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 8B: recapture 5 certificates log snapshots"
    git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
    ```
    *Pass*: `--grep="certificates @"` matches exact `visual.spec.js` title `${route.slug} @ ${width}px` for `/certificates` only (6 tests: 1 setup + 5 snapshots, excluding `certificates-detail`/`new`/`edit`); 5 `/certificates` snapshots recaptured/replaced in place; manifest remains **334/334** with zero net new manifest entries; baseline SHA recorded.
14. **Gate 14 — PR-Subset Visual Regression (W-6A-1)**:
    ```powershell
    cd frontend; $env:CI='true'; $env:PR_SUBSET='true'; npx playwright test --project=pr-subset tests/visual/visual.spec.js
    ```
    *Pass*: Expected reconciliation target **68/71** with only the 3 accepted W-6A-1/AD16 diffs; any new or changed diff requires explicit investigation and register citation; 0 diffs attributable to 8B.
15. **Gate 15 — Full 326-Test Visual Reconciliation**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js
    ```
    *Pass*: Expected reconciliation target **326** accounted (`292 passed + 34 accepted AD14/AD16`); all 5 recaptured `/certificates` snapshots pass; any new diff blocks merge unless investigated and cited in §6.6; 0 unexplained or 8B-attributable diffs.
16. **Gate 16 — Touch Targets & Focus Rings**:
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/certificates-reference-match.spec.js -g "interactive touch targets"
    ```
    *Pass*: 2 passed (1 setup + 1 filtered test matching `interactive touch targets`).
17. **Gate 17 — Developer Inspection**: Inspect all 5 `/certificates` snapshots (1440/1024/768/480/390) against Frame 01 & Frame 03 Variant B; confirm D19 cards eliminate page-level overflow at $\le 768\text{px}$ and `.cert-table-wrap` scroll is desktop/tablet-only.
18. **Gate 18 — Unthemed-Consumer & Shared-CSS Decoupling Preservation**:
    Because `Trades.css` still has 5 active import sites spanning both themed (`TradeLogPage`, `TradeForm`, `TradeSummaryPage`) and still-unthemed (`CurrencyLogPage`, `CreditCardPage`) routes, this gate verifies all 16 routes across the Certificates cluster and remaining `Trades.css` consumers (**81/81** = `1 setup + 16 routes × 5 viewports`):
    ```powershell
    cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js --grep="certificates|trades|trade-summary|currency|credit-cards"
    ```
    - **Certificates cluster (4 routes = 20 snapshots)**: `certificates` (themed, 5) + `certificates-detail`, `certificates-new`, `certificates-edit` (still-unthemed 8C routes, 15) — proves 8B does not leak into 8C.
    - **Remaining `Trades.css` consumers (12 routes = 60 snapshots)**: `trades`, `trades-add`, `trades-edit`, `trade-summary` (themed, 20) + `currency`, `currency-detail`, `currency-new`, `currency-edit` (unthemed `CurrencyLogPage`, 20) + `credit-cards`, `credit-cards-statements`, `credit-cards-debt-payoff`, `credit-cards-reconcile` (unthemed `CreditCardPage`, 20).
    - *(Other clusters have zero shared-CSS overlap with `CertificateLogPage.js` and are reconciled in Gate 15.)*
    - *Pass*: **81/81** passed; 0 diffs attributable to 8B; `Trades.css` untouched.
19. **Gate 19 — Walkthrough, User Sign-Off & Merge Boundary**: Author `docs/ui-plans/phase_8b_walkthrough.md` with Gates 1–18 evidence, all §0 decisions, verified 89-style census (`57 colour + 32 layout`), W-8B-1, Gate 13 baseline SHA, and pre-existing §7.1 global-grep drift note. Only after explicit user sign-off: apply §6 Governance Synchronization, merge `phase-ui-8b-certificates-log` into `main`, verify CI, and push only `main`.

---

## 6. Governance Synchronization (Post-Sign-Off)

> [!IMPORTANT]
> **Branch & Push Policy (§14)**: Feature branch `phase-ui-8b-certificates-log` stays local and is **never pushed** to `origin`. Only `main` is pushed, and only after explicit user sign-off on `phase_8b_walkthrough.md`.

1. `UI-UX-PLAN.md` §5.7 line 927: Mark `/certificates` themed & QA'd; update `66 inline styles` → `89 inline styles purged (57 colour-bearing + 32 layout/typographic)`.
2. `UI-UX-PLAN.md` §6.1 & §6.12: Mark Phase 8B complete; check all 6 checklist items under 8B; update `CertificateLogPage.js (66)` → `(89)`, align §6.12 line 1842 wording from `active/matured/redeemed` to the 5 actual domain statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn`) rendered via neutral `<Badge>` with `react-icons/fa` icons + text labels, and note no sortable columns exist.
3. `UI-UX-PLAN.md` §7.1 line 2104: Add **Waiver W-8B-1** for `.cert-log-page .cert-table-wrap` (desktop/tablet 9-column log table only).
4. `UI-UX-PLAN.md` §10: Append Phase 8B progress log entry with branch/merge/baseline SHAs, **15/15** unit tests, 11/11 calculations, 5 snapshots replaced in place, 334/334 manifest, 38 → 39 allowlist, **89** inline styles purged (57 colour + 32 layout), **81/81** Gate 18, and pre-existing §7.1 global-grep drift note. Update Phase 8 exit gate counter (6 of 16 routes themed; 8C–8E remain open).
5. `CHANGELOG.md`: Add Phase 8B entry.
