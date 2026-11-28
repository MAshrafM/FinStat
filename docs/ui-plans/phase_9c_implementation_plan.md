# UI Phase 9C Implementation Plan — Peer-to-Peer Lending (Module 23)

- **Date**: 2026-11-28
- **Revision**: **v3** — incorporates v2 review findings: complete native `<progress>` CSS contract (`RealEstate.css:441–466`), explicit §7.2:2120 sort-header/checked-state scope decision, restored `#14b8a6` and loading-bypass greps in Gate 5, explicit §6.13:1930 soft-delete/write-off/new-loan test assignments, exact Gate 15 command, Gate 18 scope-change note, and explicit Gate 0 developer acceptance of the pre-existing `App.css` exception
- **Status**: Complete — Gate 19 Signed Off 2026-11-28
- **Merge Base**: `main` @ `1c75926`
- **Starting Baseline Commit**: `01e61c5` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)
- **Branch**: `phase-ui-9c-lending` *(local branch policy per §14/§10; tag `ui-phase-9c-start`; only `main` is pushed after Gate 19 user sign-off)*
- **Taste Checkpoint**: None — Cluster 9 Taste Checkpoint #7 was signed off in Phase 9A (`2026-11-28`). Phase 9C closes the **Phase 9 Exit Gate** (`7/7` routes: `4` Credit Cards + `3` Lending; `THEMED_PATTERNS` `53 → 56`).
- **Target Routes (3 routes — `THEMED_PATTERNS` `53 → 56`)**:
  1. `/lending` — Lending Tracker Dashboard (`LendingDashboardPage.js`, slug `lending`)
  2. `/lending/persons/:id` — Counterparty Detail (`PersonDetailPage.js`, slug `lending-person-detail`)
  3. `/lending/loans/:id` — Loan Ledger Detail (`LoanDetailPage.js`, slug `lending-loan-detail`)
- **Target Production Files**:
  - `frontend/src/pages/lending/Lending.css` *(**MODIFY**: Rewrite all 451 legacy light lines — `#009879` teal-green table header/buttons, `#ffffff` cards, `10px`/`12px` radii, pixel `box-shadow`s, focus glow at `:391`, `overflow-x: auto !important` at `:222` — under D22 `html[data-fs-theme] .lending-page`; `0` external consumers; `0` `!important`; `0` `overflow-x`; introduce scoped `.lending-table-wrap` with **no** `overflow-x`; add scoped neutral native `<progress>` fill rules (`::-webkit-progress-value`, `::-moz-progress-bar`) so `value`/`max` drive the fill without inline width)*
  - `frontend/src/pages/lending/LendingDashboardPage.js` *(**MODIFY**: Purge all **20** inline styles & **9** hex literals; replace ad-hoc loading with `<Loading variant="card" text="Loading Lending Tracker..." />` inside preserved `data-testid="lending-loading"`; apply flat graphite KPI strip with neutral AD13 figures + `.fs-num`, `.fs-btn-primary` / `.fs-btn-secondary`, native `<progress className="fs-progress lending-progress" value={progressPct} max={100} />` with fill styled in `Lending.css`, `<Badge>` status chips, D19 `<= 768px` compact-expand mobile cards via guarded `matchMedia` (`data-testid="lending-loans-mobile-cards`), and dark Frame 02 modals with accessible close labels. Replace `className="table-container lending-table-card"` with `className="lending-table-wrap"`)*
  - `frontend/src/pages/lending/PersonDetailPage.js` *(**MODIFY**: Purge all **18** inline styles & **16** hex literals; replace ad-hoc loading with `<Loading variant="card" text="Loading Person Details..." />`; replace light green aggregate banner with flat graphite summary card; remove red inline styling from page-level `Delete Person` trigger per `§4.4:409` (`--fs-danger` stays inside `<ConfirmModal variant="danger" />`); apply neutral AD13 amounts + `.fs-num`, `<Badge>` status chips, D19 `<= 768px` compact-expand mobile cards via guarded `matchMedia` (`data-testid="person-loans-mobile-cards`), and dark Frame 02 modals. Replace `className="table-container lending-table-card"` with `className="lending-table-wrap"`)*
  - `frontend/src/pages/lending/LoanDetailPage.js` *(**MODIFY**: Purge all **20** inline styles & **17** hex literals; replace ad-hoc loading with `<Loading variant="card" text="Loading Loan Ledger..." />`; remove red/amber inline styling from page-level `Mark as Written Off`, `Delete Loan`, and row `Delete` buttons per `§4.4:409` while preserving `aria-label="Delete transaction"` and `<ConfirmModal>` triggers; replace inline progress bar with native `<progress className="fs-progress lending-progress" value={progressPct} max={100} />`; apply neutral AD13 figures + `.fs-num`, `<Badge>` status/type chips, D19 `<= 768px` compact-expand mobile cards via guarded `matchMedia` (`data-testid="loan-tx-mobile-cards"`), set write-off confirmation to `variant="danger"` and reactivation to `variant="primary"`. Replace `className="table-container lending-table-card"` with `className="lending-table-wrap"`)*
  - `frontend/src/pages/lending/PersonCard.js` *(**MODIFY**: Purge all **3** inline styles & **2** hex literals; render flat graphite card with neutral `<Badge>` status chip (`Owes Money` / `Settled`) and neutral `.fs-num` outstanding balance)*
  - `frontend/src/pages/lending/AddTransactionForm.js` *(**MODIFY**: Purge all **2** inline styles & **2** hex literals; apply Frame 02 dark modal form styling, neutral `.lending-modal-error` with `role="alert"`, `.fs-btn-primary` / `.fs-btn-secondary`, and accessible close button `aria-label="Close modal"`)*
  - `frontend/src/components/ProtectedRoute.js` *(**MODIFY**: Expand `THEMED_PATTERNS` **53 → 56**: add `'/lending'`, `'/lending/persons/:id'`, `'/lending/loans/:id'`)*
  - `frontend/.eslintignore` *(**MODIFY**: Remove all **5** Phase 9C lending entries — `AddTransactionForm.js`, `LendingDashboardPage.js`, `LoanDetailPage.js`, `PersonCard.js`, `PersonDetailPage.js` — per `§6.13:1931`)*
  - `frontend/playwright.config.js` *(**MODIFY**: Register `lending-reference-match.spec.js` in the `reference` project)*
- **Protected Files (Strictly Untouched — Verified via `git diff 1c75926`)**:
  - `frontend/src/services/lendingService.js`, `frontend/src/utils/formatters.js`, `frontend/src/App.js`, **`frontend/src/App.css`**, `frontend/src/pages/DashboardSummary.js`, `frontend/src/styles/chartTheme.js`, **`frontend/src/styles/theme.css`**, `frontend/src/styles/theme-components.css` *(zero new rules needed)*, `frontend/src/components/common/ConfirmModal.js`, `frontend/src/components/common/ConfirmModal.css`, `frontend/tests/calculations.spec.js`, `frontend/package.json`, `frontend/package-lock.json`, `backend/routes/lendingLoans.js`, `backend/routes/lendingPersons.js`, `frontend/src/pages/lending/__tests__/LendingDashboardPage.test.js`, `frontend/src/pages/lending/__tests__/LoanDetailPage.test.js`.

---

## 0. Verified Codebase Audit & Architectural Decisions

1. **Exact Inline-Style, Hex-Literal & ESLint Census (Verified via `npx eslint --no-ignore`)**:
   - `LendingDashboardPage.js` (`472L`): **20** `style={{`, **9** hex literals (`data-testid="lending-loading"` preserved).
   - `PersonDetailPage.js` (`444L`): **18** `style={{`, **16** hex literals.
   - `LoanDetailPage.js` (`376L`): **20** `style={{`, **17** hex literals (`aria-label="Delete transaction"` preserved).
   - `PersonCard.js` (`45L`): **3** `style={{`, **2** hex literals.
   - `AddTransactionForm.js` (`155L`): **2** `style={{`, **2** hex literals.
   - **Total**: **63** `style={{`, **46** hex literals, `85` ESLint errors, `0` warnings → **all purged to `0`**.
   - **Catalog note (`§6.13:1928`, `§5.8.1:954`)**: `UI-UX-PLAN.md §6.13:1928` lists `AddLoanPage.js` and `AddRepaymentModal.js`, which do not exist on disk — the live equivalents are `AddTransactionForm.js`, `PersonCard.js`, and the inline modals in `LendingDashboardPage.js` & `PersonDetailPage.js`. `§5.8.1:954` says “+ 2 modals”; the live implementation is inline Add Person / New Loan modals plus `AddTransactionForm.js`. Gate 0 records both catalog corrections in `§5.8.1:954`, `§6.13:1928` / `§10`.
2. **Existing Jest Suite Preservation via `matchMedia` D19 Switching (`I5`, `I6`)**:
   - Existing `LendingDashboardPage.test.js` (`7` tests) and `LoanDetailPage.test.js` (`7` tests) stay **byte-identical** and `14/14` green.
   - Because `LoanDetailPage.test.js` uses `screen.getByText('Initial disbursement')` and indexes `screen.getAllByRole('button', { name: /Delete transaction/i })[1]`, rendering both desktop table and mobile cards simultaneously in the DOM would cause duplicate-element failures.
   - All 3 Lending pages use the Phase 9A `CardInstallmentSchedule.js:7–10` pattern: guarded `getIsMobile()` using `typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches`; initial state is `false` when `matchMedia` is absent (jsdom), a `change` listener is added on mount, and removed on unmount. Only desktop `<table>` renders at `> 768px` / in jsdom; only D19 compact-expand mobile cards render at `<= 768px`.
   - **Exact preserved accessible strings** (Gate 3 / Gate 7): `lending-loading`, `+ Add Person`, `New Borrower / Contact`, `Save Person`, `Filter Status`, `Sort By`, `+ Add First Borrower`, `+ Add Repayment`, `Amount (EGP)`, `Note`, `Record Transaction`, `Delete transaction` (index `[1]`), `Confirm Delete`, `Initial disbursement`, `First installment`, `Total Receivables`, `Total Repaid`, `Active Debtors`, `Total Borrowed`, and `Remaining Balance`.
   - Remove `.lending-scroll-hint` (`↔ Scroll horizontally...`), remove `overflow-x: auto !important` from `Lending.css:222`, **and stop using `className="table-container lending-table-card"`** on all 3 wrappers (`LendingDashboardPage.js:245`, `PersonDetailPage.js:233`, `LoanDetailPage.js:257`). Use `className="lending-table-wrap"` instead. `App.css:230–239` stays byte-identical; because the two legacy classes are no longer applied to lending tables, no wrapper scroll is inherited and **zero `overflow-x` waivers are needed**. Gate 0 amends `§7.1:2105` to record the unchanged `App.css:230–239` global `.table-container` / `.table-responsive` / `.paycheck-table-container` / `.admin-table-container` / `.card-table-wrapper` / `.lending-table-card` block as a **pre-existing** exception, not a new waiver; it is explicitly not applied to converted lending routes.
3. **Domain Tone & AD13 Compliance (`§4.3`, `§4.3.1`, `§6.13:1929`, `§4.4:409`)**:
   - **Ordinary figures** (`Total Receivables`, `Total Repaid`, `Remaining Balance`, `Total Borrowed`, `Running Balance`, `Borrow`/`Repayment` amounts, `PersonCard` outstanding) → strictly **neutral** (`--fs-text`, `.fs-num`).
   - **Repayment progress bars (`§6.13:1929`)**: Native `<progress className="fs-progress lending-progress" value={progressPct} max={100} aria-label={...} aria-valuetext="NN% repaid" />`. `.fs-progress` supplies the track; scoped `html[data-fs-theme] .lending-progress` rules in `Lending.css` follow `RealEstate.css:441–466`: `appearance: none`, `-webkit-appearance: none`, `display: block`, `border-radius` on the host and on `::-webkit-progress-bar` / `::-webkit-progress-value` / `::-moz-progress-bar`, neutral track (`var(--fs-surface-sunken)` or `var(--fs-surface-raised)`) and neutral fill (`var(--fs-text-2)`). Zero inline width/CSS custom property is required; `theme.css` and `theme-components.css` stay untouched.
   - **Status Badges**: See **Review Item #1** (`WrittenOff` negative badge vs all-neutral). If Option A is approved, Gate 0 adds the `WrittenOff` provenance row to `§4.3.1` and records the tone decision in `§10`.
   - **Destructive Actions (`§4.4:409`)**: Page-level `Delete Person`, `Mark as Written Off`, `Delete Loan`, and row `Delete` buttons use neutral `.fs-btn.fs-btn-secondary`; `--fs-danger` appears only inside `<ConfirmModal variant="danger" />`. The write-off confirmation is explicitly `variant="danger"` when marking written off and `variant="primary"` when re-activating (replaces the unsupported `variant="warning"` at `LoanDetailPage.js:354`).
   - **Sort headers / checked states (`§7.2:2120`)**: v3 Gate 0 decision — lending tables use neutral `<select>` filters (`Filter Status`, `Sort By`) and contain **no clickable sortable `<th>` headers and no checkboxes**, so the “sort headers carry accent; checked states use accent” clause is **not applicable**. Gate 11 and Gate 17 assert that no sortable-header or checkbox affordance was introduced; if one is added, it must use `--fs-accent` via an existing primitive/utility and a new Gate 0 amendment is required.
   - **Zero `theme.css` / `theme-components.css` edits**: All interactive/semantic primitives (`.fs-btn-primary`, `.fs-btn-secondary`, `.fs-progress`, `<Badge>`, `<Loading>`, `<ConfirmModal>`) already exist. Native progress fill styling is added only in `Lending.css`, scoped under `html[data-fs-theme]`.
4. **Deterministic Playwright Mocks (`frontend/tests/visual/fixtures/lendingMocks.js`)**:
   - Create `lendingMocks.js` with full CORS + `OPTIONS` `204` preflight handling covering all endpoints in `lendingService.js` (`GET /summary`, `GET/POST /persons`, `GET/PUT/DELETE /persons/:id`, `GET/POST /loans`, `GET/PUT/DELETE /loans/:id`, `POST /loans/:id/transactions`, `DELETE /loans/:id/transactions/:txId`).
   - Deterministic dataset: 2 counterparties (`Ahmed Samir` with 1 Active loan + 1 WrittenOff loan; `Karim Hassan` with 1 Repaid loan) and 2 ledger transactions (`borrow` + `repay`).
   - Wire `setupLendingMocks(page)` in `visual.spec.js` and `a11y.spec.js` strictly for `route.slug.startsWith('lending')` so no other routes are affected.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 9C Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` expands `53 → 56` adding `/lending`, `/lending/persons/:id`, `/lending/loans/:id`. | Gate 1 & Gate 8 |
| **I2** | `lendingService.js`, `backend/routes/lendingLoans.js`, `backend/routes/lendingPersons.js`, and all payloads byte-identical. | Gate 5 & Gate 7 |
| **I3** | Zero calculation changes (piastre balances, progress %, running balances); `calculations.spec.js` `11/11`; `$` `formatCurrency()` retained. | Gate 7 & Gate 9 |
| **I4** | Existing role/access patterns preserved; `<ConfirmModal>` confirmations intact with explicit `danger` / `primary` variants. | Gate 7 |
| **I5** | Zero deletion of existing `data-testid` (`lending-loading`) or `aria-label` (`Delete transaction`); exact preserved strings listed in §0:2; accessible `aria-label` added to modal close buttons, `<progress>` meters, and D19 expanders. | Gate 3 & Gate 7 |
| **I6** | All 3 lending tables (Dashboard Loan Ledgers, Person Loans, Loan Transaction Ledger) collapse to D19 compact-expand cards at `<= 768px` via guarded `matchMedia` with `0px` overflow at `390px`; `Lending.css:222` `overflow-x: auto !important` removed; `table-container` / `lending-table-card` classes removed from the 3 lending wrappers; `App.css` byte-identical; full `git grep 'overflow-x'` matches only §7.1 documented exceptions plus the Gate 0-recorded pre-existing `App.css:230–239` exception; zero new waivers. | Gate 5, Gate 11 & Gate 17 |
| **I7** | All 3 Lending routes + `PersonCard` + `AddTransactionForm` + `Lending.css` convert atomically in one branch, closing Phase 9 Exit Gate (`7/7` routes). | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` remains `96` lines (`<= 120`); App/Dashboard `15/15`. | Gate 8 |
| **I9** | Local standalone `2048`MB build (`1536`MB fallback) clean; authoritative CI on `main`. | Gate 12 |
| **I10** | Both existing Lending Jest suites (`14` tests, byte-identical) + new `PersonDetailPage.test.js` & `LendingA11y.test.js` (`~12` tests + `jest-axe`) pass in-band; new tests explicitly cover `deleteLoan`, `WrittenOff` toggle, and new-loan creation per `§6.13:1930`. | Gates 7 & 8 |
| **I11** | Zero `!important` in `Lending.css` (removes legacy `:222` `!important`); `lint-ratchet.js` `0` regressions. | Gate 5 |
| **I12** | `frontend/package.json` & lockfile untouched. | Gate 5 |
| **I13** | Gate 18 proves zero diff on the 4 Credit Cards routes, 3 Lending routes, and the Phase 10A boundary pair (`/profile`, `/settings`). Gate 15 full suite proves zero diff on all other non-allowlisted routes (Security, Admin, Landing, Recycle Bin). | Gates 15 & 18 |
| **I14** | Zero gradients, blurs, glows, or arbitrary shadows in converted CSS/JS. | Gate 5, Gate 6 & Gate 11 |
| **I15** | Neutral by default; AD13 ordinary amounts neutral; tone only via `<Badge>`; zero tone tokens in `Lending.css` or JSX; `theme.css` / `theme-components.css` untouched; `lint-tones.js` `0` violations. Native `<progress>` fill is neutral via scoped `Lending.css` reset + track/fill pseudo-elements (`RealEstate.css:441–466`); no sortable header or checkbox accent introduced per §7.2:2120 scope decision. | Gate 4, Gate 7 & Gate 11 |
| **I16** | Radii `<= 8px` (`--fs-radius-sm/md/lg`), `--fs-radius-pill` on `<Badge>` / `<progress>` only. | Gate 5 & Gate 11 |

---

## 2. Proposed Changes

### Styling & Theme Isolation
- #### [MODIFY] `frontend/src/pages/lending/Lending.css`
  Rewrite completely under D22 `html[data-fs-theme] .lending-page`: header, single primary CTA (`.fs-btn-primary`) + secondary actions (`.fs-btn-secondary`), flat 3/4-tile KPI grid, filter/sort bar, counterparty `PersonCard` grid, flat dark aggregate summary banner, neutral desktop tables (`0` `overflow-x`, `0` `!important`) wrapped in scoped `.lending-table-wrap` with `overflow: visible`, native `<progress className="fs-progress lending-progress">` with the full scoped reset + track/fill pseudo-element contract from `RealEstate.css:441–466`, D19 `<= 768px` compact-expand mobile cards, Frame 02 dark modals (`.lending-modal-backdrop`, `.lending-modal-content`, `.lending-modal-error`), and empty/loading cards. No `[data-fs-theme="dark"]` value selector is introduced outside `tokens.css`.

---

### Page & Shared Components
- #### [MODIFY] `frontend/src/pages/lending/LendingDashboardPage.js`
  - Import `Loading`, `Badge`, `FaChevronDown`, `FaChevronUp`.
  - Preserve `data-testid="lending-loading"` wrapping `<Loading variant="card" text="Loading Lending Tracker..." />`.
  - Purge all 20 inline styles & 9 hex literals. Replace inline progress bar with native `<progress className="fs-progress lending-progress" value={progressPct} max={100} aria-label={...} />`; fill is styled only in `Lending.css`.
  - Replace `className="table-container lending-table-card"` with `className="lending-table-wrap"`; remove `.lending-scroll-hint`.
  - Add guarded `useIsMobile()` (`matchMedia('(max-width: 768px)')`, `change` listener, cleanup, jsdom fallback `false`) switching Loan Ledgers between desktop `<table>` (`> 768px`) and D19 compact-expand mobile cards (`<= 768px`, `data-testid="lending-loans-mobile-cards"`).
  - Style Add Person & New Loan modals with dark Frame 02 classes + `aria-label="Close modal"` + `aria-labelledby`.
- #### [MODIFY] `frontend/src/pages/lending/PersonDetailPage.js`
  - Import `Loading`, `Badge`, `FaChevronDown`, `FaChevronUp`.
  - Purge all 18 inline styles & 16 hex literals; replace green aggregate banner with flat graphite `.lending-summary-banner`; make page-level `Delete Person` a neutral `.fs-btn-secondary` (danger stays in `<ConfirmModal variant="danger">`).
  - Replace `className="table-container lending-table-card"` with `className="lending-table-wrap"`; remove `.lending-scroll-hint`.
  - Add guarded `useIsMobile()` switching Person Loans between desktop `<table>` and D19 mobile cards (`data-testid="person-loans-mobile-cards"`).
- #### [MODIFY] `frontend/src/pages/lending/LoanDetailPage.js`
  - Import `Loading`, `Badge`, `FaChevronDown`, `FaChevronUp`.
  - Purge all 20 inline styles & 17 hex literals; replace inline progress bar with native `<progress className="fs-progress lending-progress" value={progressPct} max={100} ... />`; make page-level `Mark as Written Off`, `Delete Loan`, and row `Delete` (`aria-label="Delete transaction"`) neutral `.fs-btn-secondary`.
  - Replace `variant={loan.status === 'WrittenOff' ? 'primary' : 'warning'}` with explicit `variant={loan.status === 'WrittenOff' ? 'primary' : 'danger'}`; retain `danger` for transaction and loan deletion confirmations.
  - Replace `className="table-container lending-table-card"` with `className="lending-table-wrap"`; remove `.lending-scroll-hint`.
  - Add guarded `useIsMobile()` switching Transaction History & Ledger between desktop `<table>` and D19 mobile cards (`data-testid="loan-tx-mobile-cards"`).
- #### [MODIFY] `frontend/src/pages/lending/PersonCard.js`
  - Import `Badge`; purge all 3 inline styles & 2 hex literals; neutral `.fs-num` balance and `<Badge tone="neutral">` (`Owes Money` / `Settled`).
- #### [MODIFY] `frontend/src/pages/lending/AddTransactionForm.js`
  - Purge all 2 inline styles & 2 hex literals; `.lending-modal-error` with `role="alert"`, `.fs-btn-primary` / `.fs-btn-secondary`, and `aria-label="Close modal"`.

---

### Routing, Linting & Test Harness
- #### [MODIFY] `frontend/src/components/ProtectedRoute.js`
  Add `'/lending'`, `'/lending/persons/:id'`, `'/lending/loans/:id'` to `THEMED_PATTERNS` (`53 → 56`).
- #### [MODIFY] `frontend/.eslintignore`
  Remove all 5 Phase 9C lending entries (`AddTransactionForm.js`, `LendingDashboardPage.js`, `LoanDetailPage.js`, `PersonCard.js`, `PersonDetailPage.js`).
- #### [NEW] `frontend/tests/visual/fixtures/lendingMocks.js`
  Deterministic Playwright mocks for all `/api/lending/*` endpoints (full CORS + `OPTIONS` `204`), wired into `visual.spec.js` & `a11y.spec.js` strictly for `route.slug.startsWith('lending')`.
- #### [NEW] `frontend/src/pages/lending/__tests__/PersonDetailPage.test.js` & `LendingA11y.test.js`
  New Jest + `jest-axe` tests covering `PersonDetailPage` CRUD/delete/aggregate banner, `PersonCard`, `AddTransactionForm`, `0` `[style]` DOM attributes across all 3 pages, guarded `matchMedia` switching (desktop in jsdom, no duplicate rows), explicit `ConfirmModal` variants, exact preserved accessible strings from §0:2, D19 mobile card expanders, and `0` `jest-axe` violations. Explicitly assign `§6.13:1930` verification here: `deleteLoan`, `WrittenOff` toggle (with `variant="danger"` / `variant="primary"` assertions), and new-loan creation from `PersonDetailPage` — while keeping existing `LendingDashboardPage.test.js` (`7/7`) and `LoanDetailPage.test.js` (`7/7`) byte-identical.
- #### [NEW] `frontend/tests/visual/lending-reference-match.spec.js`
  Registered in `playwright.config.js` `reference` project (**8 specs + 1 setup = 9 passed**):
  1. `/lending` responsive sweep @ `1440/1024/768/480/390` (dark canvas, flat KPIs, `PersonCard` grid, neutral `<progress>` meter, D19 mobile cards, `0px` overflow, `0` `[style]`).
  2. `/lending/persons/1` @ `1440px` & `390px` (summary banner, person loans table & D19 mobile cards, `0px` overflow).
  3. `/lending/loans/1` @ `1440px` & `390px` (hero KPIs, neutral `<progress>` meter, transaction ledger & D19 mobile cards, `0px` overflow).
  4. Modals & forms (Add Person, New Loan, Record Repayment) @ `1440px` & `390px` (`0px` overflow).
  5. Loading, empty, and error state captures for all 3 routes.
  6. Status-chip / `PersonCard` tone matrix (Active, Repaid, WrittenOff, Owes Money, Settled) @ `1440px` & `390px`.
  7. Touch targets `>= 44px` & keyboard Tab focus-visible @ `390px`.
  8. Frame 01 dense-table and Frame 02 Variant B side-by-side comparisons (ledger table vs `01-dense-table.html`; `AddTransactionForm` vs `02-form.html`).
  - **Named local artifacts** in gitignored `docs/ui-snapshots/phase-9c/` (**25 PNGs**, each `>= 1000` bytes): `lending-dashboard-{1440,1024,768,480,390}.png` (5); `lending-person-detail-{1440,390}.png` (2); `lending-loan-detail-{1440,390}.png` (2); `lending-modals-{1440,390}.png` (2); `{lending,lending-person-detail,lending-loan-detail}-{loading,empty,error}.png` (9); `lending-status-chips-{1440,390}.png` (2); `lending-touch-focus-390.png` (1); `frame-01-dense-table-side-by-side.png`, `frame-02-form-side-by-side.png` (2). No §7.4 deviation; no silent narrowing, and no overwrite of the 9A/9B artifact directories.

---

## 3. Verification Plan (Gates 0–19)

The numbered list below is **execution order**. Gate 12 is intentionally listed before Gates 10 and 11 so `serve -s build` serves the 9C build during browser checks.

1. **Gate 0**: Branch `phase-ui-9c-lending` from `main` (`1c75926`), tag `ui-phase-9c-start`, commit approved plan & Gate 0 amendments in `§5.8.1:954`, `§6.13:1924–1932`, `§6.1:1072`, `§4.3.1` (if Option A), `§7.1:2105` (explicit developer acceptance to record pre-existing `App.css:230–239` exception, no new waiver), `§7.2:2120` (sort-header/checked-state not-applicable decision), `§10`, and `CHANGELOG.md` (AD13 announcement).
2. **Gate 1**: `ui-coverage.js --assert-allowlist` (`56 pattern(s)`) & `--routes` (`75 / 10 / 65 / 0`).
3. **Gate 2**: `tokens.js --check --tables` (`0` drift).
4. **Gate 3**: `testid-guard.js --base 1c75926` (`0` deletions; exact §0:2 strings preserved).
5. **Gate 4**: `lint-tones.js` (`0` violations; `61` page / `64` total CSS).
6. **Gate 5**: `lint-ratchet.js --base 1c75926` (`0` regressions), `stylelint` clean on `Lending.css`, `0` `overflow-x` in `Lending.css` and on the 3 new `.lending-table-wrap` wrappers, `git grep -n 'overflow-x' -- '*.css'` matches only §7.1:2105 documented exceptions plus the Gate 0-recorded pre-existing `App.css:230–239` block, `git grep -n '#14b8a6' -- '*.css'` returns only `tokens.css:36` (§7.1:2104), `git grep -n 'data-fs-theme="dark"' -- '*.css'` returns only `tokens.css`, loading-bypass grep `git grep -nE "<div>Loading|className=\"loading-spinner\"|custom spinner SVG" -- 'src/**/*.js'` returns only `<Loading>` primitive usages and test files (§7.1:2106), `0` raw hex in lending JS files, and `git diff 1c75926 -- <protected files including App.css, theme.css, theme-components.css, ConfirmModal.js/.css>` is empty.
7. **Gate 6**: `npx eslint --max-warnings=0` on all 5 lending production files, `ProtectedRoute.js`, `lendingMocks.js`, and tests; `0` lending entries in `.eslintignore`.
8. **Gate 7**: `npx react-scripts test --watchAll=false --runInBand src/pages/lending/__tests__/` (`4/4` suites, `~26` tests incl. `14/14` untouched existing tests + `jest-axe`); assert exact §0:2 accessible strings, jsdom desktop-only rendering, `danger`/`primary` ConfirmModal variants, and the §6.13:1930 assertions for `deleteLoan`, `WrittenOff` toggle, and new-loan creation.
9. **Gate 8**: `App.test.js` + `DashboardSummary.test.js` (`15/15`), `DashboardSummary.js` `96` lines.
10. **Gate 9**: `npx jest --runInBand tests/calculations.spec.js --forceExit` (`11/11`).
11. **Gate 12**: Standalone `2048`MB build (`1536`MB fallback) → `Compiled successfully.`; CI on `main` remains authoritative. Execute here, before Gates 10/11.
12. **Gate 10**: `$env:CI='true'`; `a11y.spec.js -g "^a11y check: lending(?:-person-detail|-loan-detail)?$"` (`4 passed`: `1 setup + 3 routes`, `0` serious/critical).
13. **Gate 11**: `lending-reference-match.spec.js` (`9 passed` = `1 setup + 8 specs`) with `$env:CI='true'`; assert all 25 named phase-9c artifacts (each `>= 1000` bytes), every `390px` `scrollWidth === clientWidth` assertion, and the §7.2:2120 scope decision (no clickable sortable `<th>` and no checkbox on any lending table).
14. **Gate 13**: Assert baseline-repo HEAD is `01e61c5` before run; `--grep="lending(?:-person-detail|-loan-detail)? @" --update-snapshots` → `16 passed` (`1 setup + 15 PNGs`), `verify-baseline-manifest.js` `334/334`, commit in `D:\Projects\FinStat-visual-baselines`, `0` net new entries; record the new baseline SHA.
15. **Gate 14**: `$env:CI='true'; $env:PR_SUBSET='true'`; require exit `1` with exactly `68 passed / 3 failed`, and mechanically assert the three registered titles `salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440`.
16. **Gate 15**: Full 326-test visual suite *(user-authorized local run per Review Item #4; §15.5 otherwise prohibits it)* — command: `cd frontend; $env:CI='true'; npx playwright test visual.spec.js --project=visual`; require exit `1` with exactly `292 passed / 34 failed` (`326` accounted), `0` unexplained, `0` 9A/9B/9C diffs, and mechanically assert all 34 failure titles against the AD14/AD16 register copied from 9A `phase_9a_implementation_plan.md:318–332` (10 AD14 + 24 AD16/W-6A-1); attach raw stdout before cleaning reports.
17. **Gate 16**: `lending-reference-match.spec.js --project=reference -g "touch targets"` → `2 passed` (`1 setup + 1 spec`).
18. **Gate 17**: Visual inspection of all 15 recaptured baselines plus all 25 named local artifacts via `read_file`; computed-style table must show `body` `--fs-bg`, no gradients/blurs/shadows, radii `<= 8px`, `0` `[style]` on converted roots, neutral ordinary figures, neutral native `<progress>` fill with `appearance: none`, pseudo-element track/fill and inherited radius per `RealEstate.css:441–466`, no clickable sortable `<th>` / checkbox (§7.2:2120 scope decision), `0px` overflow at `390px`, and both Frame 01 / Frame 02 comparisons.
19. **Gate 18**: Cluster 9 + Phase 10A boundary regression — expect `46 passed` (`1 setup + 20 credit-cards + 15 lending + 10 profile/settings`):
   ```powershell
   cd frontend; $env:CI='true'
   npx playwright test visual.spec.js --project=visual --grep="(credit-cards @|credit-cards-statements @|credit-cards-debt-payoff @|credit-cards-reconcile @|lending @|lending-person-detail @|lending-loan-detail @|profile @|settings @)"
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
   Trailing `@` on every slug prevents prefix swallowing; `settings @` intentionally excludes `settings-recycle-bin @`. Scope-change note: 9B Gate 18 was `56/56` and included Trades + unthemed 9C lending; v3 Gate 18 is intentionally `46 passed` with themed Lending + Credit Cards + `/profile` + `/settings`. Trades regression is covered by Gate 15’s full suite, not by this narrower gate. Zero diffs on Security/Admin/Landing/Recycle Bin are likewise proven by Gate 15.
20. **Gate 19**: Author `docs/ui-plans/phase_9c_walkthrough.md` with the 9A/9B header ledger (date, status, branch/tag, merge base `1c75926`, Gate 0 Plan & Governance SHA, Implementation SHA, Walkthrough SHA, starting baseline `01e61c5`, Gate 13 baseline SHA, `334/334` manifest), §0 approved Review Items #1–#4 and Gate 0 amendments, §1 progress log, §2 I1–I16, §3 visual diff report (`326` totals / `292` zero-diff / registered accepted diffs / `0` unexplained, plus the Gate 18 scope-change note), §4 gate evidence with raw stdout including Gates 1/14/15/18 and the Gate 0 acceptance of the pre-existing `App.css:230–239` §7.1 exception, §5 inspection log for 15 baselines + 25 artifacts, and §6 post-sign-off checklist (governance sync in `§5.8.1`, `§6.1:1072`, `§6.13:1924–1932`, `§10`, `CHANGELOG.md`, `--no-ff` merge, push only `main`, verify authoritative CI, clean reports). Commit on local `phase-ui-9c-lending` and **STOP** awaiting explicit Gate 19 user sign-off before governance sync, merge, and push.

---

## 4. User Review Required

> [!IMPORTANT]
> Please confirm these **four items** before Phase 9C execution begins. v3 applies the recommended technical implementation; each item still requires explicit approval at Gate 0.

> 1. **Lending Status Badge Tones (`WrittenOff` vs All-Neutral, `§4.3.1:371`)**:
>    - Ordinary amounts (`Total Receivables`, `Total Repaid`, `Remaining Balance`, `Total Borrowed`, `Borrow`/`Repayment` rows) and native `<progress>` meters stay strictly neutral per AD13.
>    - **Option A (Recommended / v3 default)**: Render `WrittenOff` as `<Badge tone="negative">WrittenOff</Badge>` (explicit loss/write-off attention state with text label + 2px left rule via `.fs-badge--negative`, zero tinted fill). Gate 0 adds this row to `§4.3.1`: `Debt and card balance | written off | WrittenOff | pages/lending/LoanDetailPage.js (loan.status === 'WrittenOff') | Neutral, no label`, and records the tone decision in `§10`. `Active`, `Repaid`, `Owes Money`, `Settled`, `Borrow`, and `Repayment` remain `<Badge tone="neutral">`.
>    - **Option B**: Render **all** lending status chips strictly neutral (`<Badge tone="neutral">`), including `WrittenOff`; no §4.3.1 amendment needed.
> 2. **Zero New `overflow-x` Waivers & Legacy Wrapper Retirement**:
>    - Confirm removing `overflow-x: auto !important` from `Lending.css:222`, removing `.lending-scroll-hint`, and replacing `className="table-container lending-table-card"` with `className="lending-table-wrap"` on all 3 tables (preserving all `14/14` existing Jest tests byte-identically). `App.css:230–239` stays protected/untouched. **Explicit developer acceptance required:** Gate 0 amends `§7.1:2105` to document that unchanged block as a **pre-existing** exception, not a new waiver; this is a governance amendment, not merely a note. Because the lending pages no longer apply `.table-container` / `.lending-table-card`, there is no inherited wrapper scroll, `0px` page overflow at `390px`, and zero new waivers.
> 3. **Page-Level Destructive Buttons & Confirm Variants (`§4.4:409`)**:
>    - Confirm neutralizing page-level `Delete Person`, `Mark as Written Off`, `Delete Loan`, and row `Delete` triggers to `.fs-btn-secondary`; `--fs-danger` appears only inside `<ConfirmModal variant="danger" />`. The write-off confirmation is explicitly `variant="danger"` for “Write Off Loan” and `variant="primary"` for “Re-activate Loan”, replacing the unsupported `variant="warning"` at `LoanDetailPage.js:354`.
> 4. **Local Gate 12 (`2048`MB / `1536`MB fallback), Full 326-Test Gate 15 (`§15.5`) & Retained `$` Formatter (`I3`)**:
>    - Confirm authorizing the local standalone build, full 326-test visual suite with the exact 34-title assertions and raw stdout capture, and retaining `formatCurrency()` (`$`) unchanged per Phase 8A–9B precedent.
