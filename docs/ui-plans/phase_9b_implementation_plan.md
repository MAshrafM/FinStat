# UI Phase 9B Implementation Plan — Statement Cycles, Debt Payoff & Reconciliation

- **Date**: 2026-11-28
- **Revision**: **v2** — incorporates review findings: Gate 0 provenance amendments (`§4.3.1:359–360` source cell, reconciliation labels, milestone tone entry point, `W-9A-1` scope extension), corrected gate commands (Gates 1–6, 9–11, 14–15, 18), explicit §7.4 artifact inventory, and seven user review items
- **Status**: Complete — Gate 19 Signed Off 2026-11-28
- **Merge Base**: `main` @ `e3bd47a`
- **Starting Baseline Commit**: `2ec388e` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified; confirmed as baseline-repo `HEAD`)
- **Branch**: `phase-ui-9b-statements-debt` *(local branch policy per §14/§10; tag `ui-phase-9b-start`; only `main` is pushed after Gate 19 user sign-off)*
- **Taste Checkpoint**: None — Taste Checkpoint #7 for Cluster 9 was signed off in Phase 9A (`2026-11-28`). Phase 9B completes all 4 Credit Cards routes and removes the legacy branch of `CreditCardSubNav.css` (`§6.13:1918`). Checkpoint #8 belongs to 10A (`§6.1.1:1100`).
- **Target Routes (3 routes — `THEMED_PATTERNS` `50 → 53`)**:
  1. `/credit-cards/statements` — Statement Cycle Visualization (`StatementCyclePage.js`, slug `credit-cards-statements`)
  2. `/credit-cards/debt-payoff` — Debt Payoff Planner (`DebtPayoffPage.js`, slug `credit-cards-debt-payoff`)
  3. `/credit-cards/reconcile` — Auto-Reconciliation Engine (`ReconciliationPage.js`, slug `credit-cards-reconcile`)
- **Target Production Files**:
  - `frontend/src/pages/credit-cards/StatementCyclePage.css` *(**MODIFY**: Rewrite all 163 legacy light lines — pixel shadows, `12px` radii, hardcoded light hexes — under D22 `html[data-fs-theme] .sc-page`; `0` external consumers; `0` own `overflow-x`)*
  - `frontend/src/pages/credit-cards/DebtPayoffPage.css` *(**MODIFY**: Rewrite all 180 legacy light lines — pixel shadows, `12px` radii, `!important` at `:162`, light blue/amber/green washes — under D22 `html[data-fs-theme] .dp-page`; `0` external consumers; `0` `overflow-x`)*
  - `frontend/src/pages/credit-cards/ReconciliationPage.css` *(**MODIFY**: Rewrite all 119 legacy light lines — pixel shadows, `12px`/`20px` radii, `!important` at `:117–118`, light green/amber banner washes — under D22 `html[data-fs-theme] .rec-page`; `0` external consumers; `0` `overflow-x`)*
  - `frontend/src/components/creditCards/CreditCardSubNav.css` *(**MODIFY**: Remove legacy light branch per `§6.13:1918` now that all 4 Credit Cards routes are themed; keep structural/layout + neutral dark-token rules under D22 `html[data-fs-theme]` with `0` hex literals, `0` pixel shadows, radii `<= 8px`, and `0` `overflow-x: auto`; **no new `.cc-subnav-*` visual rules** — active `--fs-accent` styling stays owned by untouched `theme-components.css` Section 10 `:1838–1869`; retire the `CreditCardSubNav.css:21` exception from `§7.1:2105`)*
  - `frontend/src/pages/credit-cards/StatementCyclePage.js` *(**MODIFY**: Purge all **15** inline styles, **20** hex literals, **2** emojis [`⚠️`, `⏳`], and **1** `label-has-associated-control` warning; wrap with `page-container cc-page-container cc-dashboard-page sc-page` and import `./CreditCardPage.css` so embedded `<CardInstallmentSchedule />` inherits Phase 9A dark table + D19 mobile cards with zero duplication (the `W-9A-1` scope extension is recorded at Gate 0 per Review Item #4); apply `<Loading variant="card" />`, fetch-error `.sc-error-card` + Retry, AD13 neutral charges/payments with `.fs-num`, due-date `<Badge>` severity per the Gate 0 §4.3.1 source amendment [`Overdue` / `Due soon` `<= 7d` / neutral unlabeled `> 7d`], flat dark timeline with **neutral** milestone dots + the existing `Badge`, and D19 `<= 768px` compact-expand mobile cards for Current Cycle Charges)*
  - `frontend/src/pages/credit-cards/DebtPayoffPage.js` *(**MODIFY**: Purge all **16** inline styles, **13** hex literals, **3** emojis [`❄️`, `⚡`, `⏳`], and **1** `label-has-associated-control` warning; apply Frame 02/03 dark strategy cards with interactive accent selection state, `<Loading variant="card" />`, neutral `.dp-error-card`, AD13 neutral amounts & payoff date, neutral `<Badge tone="neutral">Active Simulation</Badge>`, D19 `<= 768px` compact-expand mobile cards for both Strategy Comparison and Month-by-Month Schedule, and scoped `const { canModify } = useCanModify();` fix per Review Item #2)*
  - `frontend/src/pages/credit-cards/ReconciliationPage.js` *(**MODIFY**: Purge all **20** inline styles, **14** hex literals, and **3** `label-has-associated-control` warnings via explicit `id`/`htmlFor`; apply Frame 02 dark form card, `<Loading variant="inline" />` / `<Loading variant="card" />`, neutral `.rec-error-card`, flat dark status banner with `<Badge tone="neutral">Reconciled</Badge>` (matched) or `<Badge tone="warning">Discrepancy</Badge>` + `<Delta tone="warning" value={...} label="vs bank statement" />` (discrepancy) per Review Item #5, neutral math breakdown strip with `.fs-num`, and D19 `<= 768px` compact-expand mobile cards for Logged Charges & Logged Settlements)*
  - `frontend/src/styles/theme-components.css` *(**MODIFY — append-only**: Append **Section 24: Phase 9B Credit Cards Sub-Routes Semantic & Interactive Themes** using D22 `html[data-fs-theme]` for interactive-accent states only — `.dp-page .dp-strategy-btn.is-active` (`border-color: var(--fs-accent)` + icon) and `.dp-page .dp-comparison-table tr.is-selected td:first-child` (`border-left: 2px solid var(--fs-accent)`, per `§4.3.2` selected-row rule). **No** `--fs-positive` / `--fs-negative` / `--fs-warning` reference and **no** new tone-bearing class: timeline milestone severity is carried by the existing `Badge`, not by a `.sc-milestone-dot--*` token class. Existing Sections 1–23 stay byte-identical.)*
  - `frontend/src/components/ProtectedRoute.js` *(**MODIFY**: Expand `THEMED_PATTERNS` **50 → 53**: add `'/credit-cards/statements'`, `'/credit-cards/debt-payoff'`, `'/credit-cards/reconcile'`)*
  - `frontend/.eslintignore` *(**MODIFY**: Remove the **3** Phase 9B entries — `DebtPayoffPage.js`, `ReconciliationPage.js`, `StatementCyclePage.js` — per `§6.13:1921`; retain exactly **1** entry, `AddTransactionModal.currency.test.js`)*
  - `frontend/playwright.config.js` *(**MODIFY**: Register `credit-cards-9b-reference-match.spec.js` in the `reference` project)*
- **Protected Files (Strictly Untouched — Verified via `git diff e3bd47a`)**:
  - `frontend/src/services/creditCardService.js`, `frontend/src/services/debtPayoffService.js`, `frontend/src/context/CreditContext.js`, `frontend/src/utils/formatters.js`, `frontend/src/App.js`, `frontend/src/pages/DashboardSummary.js`, `frontend/src/styles/chartTheme.js`, `frontend/tests/calculations.spec.js`, `frontend/package.json`, `frontend/package-lock.json`, `backend/routes/creditCards.js`, `backend/routes/debtPayoff.js`, `frontend/src/pages/credit-cards/CreditCardPage.css`, `frontend/src/pages/credit-cards/CreditCardPage.js`, `frontend/src/pages/credit-cards/CardInstallmentSchedule.js`, `frontend/src/components/creditCards/UtilizationWidget.css`, `frontend/src/components/creditCards/UtilizationWidget.js`, `frontend/src/components/creditCards/CreditCardSubNav.js`, `frontend/src/pages/trades/Trades.css`, `frontend/src/components/Table.css`, `frontend/src/components/Modal.css`, `frontend/src/pages/credit-cards/__tests__/AddTransactionModal.currency.test.js`, `frontend/src/styles/theme-components.css` existing Sections 1–23.

---

## 0. Verified Codebase Audit & Architectural Decisions

1. **Exact Inline-Style, Hex-Literal, Emoji & ESLint Census (Verified via `npx eslint --no-ignore`)**:
   - `StatementCyclePage.js` (`234L`): **15** `style={{`, **20** hex literals, **2** emojis (`⚠️`, `⏳`), **1** `jsx-a11y/label-has-associated-control` warning (`:69`).
   - `DebtPayoffPage.js` (`324L`): **16** `style={{`, **13** hex literals, **3** emojis (`❄️`, `⚡`, `⏳`), **1** `jsx-a11y/label-has-associated-control` warning (`:135`).
   - `ReconciliationPage.js` (`278L`): **20** `style={{`, **14** hex literals, `0` emojis, **3** `jsx-a11y/label-has-associated-control` warnings (`:86`, `:103`, `:121`).
   - **Total**: **51** `style={{` (matches `§6.13:1915–1917` and `§8.2:2217/:2223/:2225` `15 + 16 + 20 = 51` verbatim), **47** hex literals, **5** emojis, **5** `jsx-a11y` warnings → all purged to `0`. Two raw hex values are embedded in `border` strings (`StatementCyclePage.js:73`, `ReconciliationPage.js:201`) and are not caught by the current ESLint literal rule; Gate 5 adds an explicit `git grep` for raw hex in the three JS files.
2. **`CreditCardSubNav.css` Legacy Branch Removal (`§6.13:1918`) & Phase 9A Spec Sync**:
   - All 4 consumers of `CreditCardSubNav` (`/credit-cards`, `/credit-cards/statements`, `/credit-cards/debt-payoff`, `/credit-cards/reconcile`) are themed after this PR.
   - `CreditCardSubNav.css` is rewritten to dark-token structural styles under `html[data-fs-theme]` (zero legacy light hexes, zero pixel shadows, radii `<= 8px`, zero `overflow-x: auto`), with **no** `.cc-subnav-*` visual/accent rule that could compete with Section 10 `.fs-page .cc-subnav-*`. The `CreditCardSubNav.css:21` inherited exception is removed from `§7.1:2105` at Gate 0.
   - **Test sync**: `frontend/tests/visual/credit-cards-reference-match.spec.js` Test #3 currently asserts `expect(themeAttr).toBeNull()` on `/credit-cards/statements` (from 9A dual-mode verification). Update Test #3 to assert unified dark theming (`expect(themeAttr).toBe('dark')`) across `/credit-cards` and `/credit-cards/statements`; its two subnav captures continue writing to the 9A artifact directory, while the new 9B subnav captures write to `docs/ui-snapshots/phase-9b/`.
3. **Zero Duplication for Embedded `<CardInstallmentSchedule />`**:
   - `StatementCyclePage.js:186` embeds `<CardInstallmentSchedule />` (converted in Phase 9A using `.cc-section`, `.cc-table-wrap`, `.cc-table`, `.cc-mobile-cards`, `.cc-empty-card` scoped under `html[data-fs-theme] .cc-dashboard-page` in `CreditCardPage.css`).
   - By adding `cc-dashboard-page` to `StatementCyclePage`'s root container and importing `./CreditCardPage.css` alongside `./StatementCyclePage.css`, the schedule renders identically dark with D19 mobile cards and `W-9A-1` desktop table handling without touching `CreditCardPage.css` or `CardInstallmentSchedule.js`. Applying the `cc-dashboard-page` class to this second route **extends the effective scope of `W-9A-1`**; Gate 0 records that extension in `§10` and `§7.1:2105` per Review Item #4 ("extend waiver", not "new waiver"). Option B (no extension) requires a plan revision and re-approval before Gate 0.
4. **Latent `useCanModify()` Destructuring Bug (`DebtPayoffPage.js:13`)**:
   - `AuthContext.js:206–211` returns `{ canModify, isViewer, ... }`. `DebtPayoffPage.js:13` writes `const canModify = useCanModify();`, making `if (!canModify) return;` at `:61` always truthy for viewer accounts. See **Review Item #2**.
5. **Domain Tone Rules (`§4.3`, `§4.3.1`, `§6.13:1915–1917`, AD13)**:
   - **Ordinary amounts** (`Current Cycle Charges`, `Payments / Settlements`, `Total Interest Paid`, `Monthly Payment`, `Interest Charged`, `Remaining Balance`, `Opening Balance`, `Cycle Charges`, `Cycle Payments`, `Expected Balance`, itemized charge/settlement rows) → strictly **neutral** (`--fs-text`, `.fs-num`, no red/green text).
   - **Statement Payment Due Date**: under **Review Item #1 Option A**, Gate 0 amends the `§4.3.1:359–360` source cell to `pages/credit-cards/StatementCyclePage.js` (`isOverdue` / `daysUntilDue <= 7`; stale `dueDiffDays` citation in `CreditCardPage.js` / `DebtPayoffPage.js` has zero live matches and is superseded), then renders:
     - `currentPeriod.isOverdue` → `<Badge tone="negative">Overdue</Badge>` + neutral subtext `Overdue by X days`.
     - `!currentPeriod.isOverdue && currentPeriod.daysUntilDue <= 7` → `<Badge tone="warning">Due soon</Badge>` + neutral subtext `Due in X days`.
     - `!currentPeriod.isOverdue && currentPeriod.daysUntilDue > 7` → neutral unlabeled (`Due in X days`).
     - Under **Option B** (strict no-source reading matching 9A), all due dates stay neutral/unlabeled; badges and the §4.3.1 amendment are dropped. Gates are written for Option A.
   - **Debt Payoff (`DebtPayoffPage.js`)**: `projectedPayoffDate` stays neutral (`§6.13:1916`); active strategy uses interactive accent selection border/indicator + neutral `<Badge tone="neutral">Active Simulation</Badge>`. `Interest Saved` stays neutral under Review Item #3 Option A.
   - **Timeline milestones**: neutral dots; due/overdue severity is carried by the existing `Badge` primitive at the milestone label. No `.sc-milestone-dot--*` tone class is introduced (Review Item #6 / `§4.3:349`, K3 at `§0:64/78`).
   - **Reconciliation (`ReconciliationPage.js`)**: flat dark status banner with `<Badge tone="neutral">Reconciled</Badge>` (matched — expected state, not "better than expected") or `<Badge tone="warning">Discrepancy</Badge>` + `<Delta tone="warning" value={...} label="vs bank statement" />` (discrepancy — awaiting action). Gate 0 records the `Discrepancy` / `vs bank statement` label decision in `§10` per `§4.3.1:371`; see Review Item #5.
6. **Deterministic Playwright Mocks (`creditCardsMocks.js` extension)**:
   - Extend `frontend/tests/visual/fixtures/creditCardsMocks.js` to also mock:
     - `GET /api/credit-cards/statement-cycles/:cardId` (returning `card`, `currentPeriod` with `daysUntilDue: 5, isOverdue: false` to exercise `Due soon` + a second card with `isOverdue: true, daysUntilDue: -3` for `Overdue`, `cycles` array of 3 billing windows, `currentCycleData` with transactions + active installment + payments).
     - `POST /api/credit-cards/reconcile/:cardId` (returning deterministic reconciled/discrepancy report matching `backend/routes/creditCards.js:904–922`).
     - `POST /api/debt-payoff/calculate`, `GET /api/debt-payoff/plans`, `POST /api/debt-payoff/plans` (matching `backend/routes/debtPayoff.js:30–155` and Domain 3 fixture values).
   - Existing `/credit-cards` handlers stay byte-identical. Wire `setupCreditCardsMocks(page)` in `visual.spec.js` and `a11y.spec.js` for `route.slug.startsWith('credit-cards')` (covering all 4 Credit Cards routes, zero impact on 9C lending or other routes); Gate 15 must still report `0` 9A diffs.
7. **Gate 0 Governance Amendments (committed before Gates 4–18)**:
   - `§10`: record Review Items #1–#7 with explicit option letters; due-date source amendment; `Discrepancy` label decision; neutral milestone-dot decision; `W-9A-1` extension to the statement route; local Gate 12/15 authorization; retained `$` formatter.
   - `§4.3.1:359–360`: source-cell amendment per Review Item #1 Option A.
   - `§7.1:2105`: retire `CreditCardSubNav.css:21`; extend `W-9A-1` wording to cover the embedded schedule on `/credit-cards/statements` (`> 768px` only; D19 cards at `<= 768px`).
   - `§2`/`§10`: close the 2E deferrals for `DebtPayoffPage.css:162` and `ReconciliationPage.css:117–118` as removed in this PR.
   - `§5.8:946–948`, `§6.1:1071`, `§6.13:1907/:1913–1922`: mark the three 9B routes converted/QA'd and close the 9B statement-table D19 row; 9C lending rows remain open per `§0:127`.
   - Record typography governance per master `§4.5:443` / `§7.2:2129`: all money and metric figures remain proportional IBM Plex Sans + `tabular-nums` via `.fs-num`; no mono figures.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 9B Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` expands `50 → 53` adding `/credit-cards/statements`, `/credit-cards/debt-payoff`, `/credit-cards/reconcile`. | Gate 1 & Gate 8 |
| **I2** | `creditCardService.js`, `debtPayoffService.js`, `backend/routes/creditCards.js`, `backend/routes/debtPayoff.js`, and all request/save payloads byte-identical. | Gate 5 & Gate 7 |
| **I3** | Zero calculation changes; `calculations.spec.js` `11/11` (Domain 2 Installments & Domain 3 Debt Payoff unchanged); `$` `formatCurrency()` retained. | Gate 7 & Gate 9 |
| **I4** | `<ProtectedAction>` preserved on `DebtPayoffPage.js`; scoped `const { canModify } = useCanModify();` fix per Review Item #2 with viewer-role Jest coverage. | Gate 7 |
| **I5** | Zero deletion of existing `data-testid` or `aria-label` (`Credit Cards Navigation` preserved); explicit `id`/`htmlFor` added to all 5 form labels + accessible expander labels. New `data-testid` values are additions, not replacements. | Gate 3 & Gate 7 |
| **I6** | All 9B tables (Cycle Charges, Strategy Comparison, Payment Schedule, Logged Charges, Logged Settlements) collapse to D19 compact-expand cards at `<= 768px` with `0px` page overflow at `390px`; `CreditCardSubNav.css:21` exception retired; `W-9A-1` scope extension recorded at Gate 0 (no new waiver number). | Gate 5, Gate 11 & Gate 17 |
| **I7** | All 3 remaining Credit Cards routes + `CreditCardSubNav.css` legacy removal convert atomically in one branch. | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` remains `96` lines (`<= 120`); App/Dashboard suite `15/15`. | Gate 8 |
| **I9** | Local standalone `2048`MB build (`1536`MB fallback) clean; authoritative CI on `main`. | Gate 12 |
| **I10** | All 6 existing Credit Card Jest suites (`32` tests) + 3 new Phase 9B Jest + jest-axe suites (`~24` tests) pass in-band. | Gates 7 & 8 |
| **I11** | Zero `!important` in converted CSS (removes 3 pre-existing `!important` in `DebtPayoffPage.css:162` & `ReconciliationPage.css:117–118`); `lint-ratchet.js` `0` regressions. | Gate 5 |
| **I12** | `frontend/package.json` & lockfile untouched. | Gate 5 |
| **I13** | Non-allowlisted routes (including Phase 9C Lending, all Trades consumers, and already-themed `/credit-cards`) pixel-identical. | Gates 14, 15 & 18 |
| **I14** | Zero gradients, blurs, glows, or arbitrary shadows in converted CSS/JS. | Gate 5, Gate 6 & Gate 11 |
| **I15** | Neutral by default; AD13 ordinary amounts neutral; tone only through `Badge` / `Delta` / `.fs-progress--*`; **no new tone-bearing class**; Section 24 contains interactive-accent rules only; `lint-tones.js` `0` violations. | Gate 4, Gate 7 & Gate 11 |
| **I16** | Radii `<= 8px` (`--fs-radius-sm/md/lg`), `--fs-radius-pill` on `<Badge>` only. | Gate 5 & Gate 11 |

---

## 2. Proposed Changes

### Styling & Theme Isolation
- #### [MODIFY] `frontend/src/components/creditCards/CreditCardSubNav.css`
  Remove legacy light rules (`#f1f5f9`, `#e2e8f0`, `#64748b`, `#2563eb`, `12px` radius, pixel shadow, `overflow-x: auto`). Scope structural layout under `html[data-fs-theme]` so all 4 short labels (`Cards`, `Cycles`, `Payoff`, `Reconcile`) fit within `390px` with `0px` horizontal overflow; no `.cc-subnav-*` visual/accent rule is added here — active styling remains owned by untouched `theme-components.css` Section 10 (`:1838–1869`).
- #### [MODIFY] `frontend/src/pages/credit-cards/StatementCyclePage.css`
  Rewrite under `html[data-fs-theme] .sc-page`: header + card selector, 4-tile flat graphite KPI strip, flat horizontal/responsive vertical milestone timeline with neutral dots, neutral desktop table (`0` own `overflow-x`), D19 `<= 768px` compact-expand mobile cards, loading/empty/error cards. Embedded `W-9A-1` desktop scroll applies only to the imported schedule wrapper and is governed by the Gate 0 §10 extension.
- #### [MODIFY] `frontend/src/pages/credit-cards/DebtPayoffPage.css`
  Rewrite under `html[data-fs-theme] .dp-page`: flat strategy control panel, two selectable strategy cards (neutral default, accent border/indicator via Section 24 when active), budget input + single primary CTA (`Recalculate` / `Save As Active Plan` hierarchy), 3-tile flat KPI strip, neutral Strategy Comparison & Month-by-Month Schedule tables (`0` `!important`, `0` `overflow-x`), D19 `<= 768px` compact-expand mobile cards.
- #### [MODIFY] `frontend/src/pages/credit-cards/ReconciliationPage.css`
  Rewrite under `html[data-fs-theme] .rec-page`: Frame 02 dark form card, flat status banner with neutral/warning text cue from `<Badge>`/`<Delta>` (no tone-background fill), responsive math breakdown strip (`Opening + Charges - Payments = Expected`), side-by-side itemized tables (`0` `!important`, `0` `overflow-x`), D19 `<= 768px` compact-expand mobile cards.
- #### [MODIFY] `frontend/src/styles/theme-components.css`
  Append **Section 24: Phase 9B Credit Cards Sub-Routes Semantic & Interactive Themes** using `html[data-fs-theme]` for **interactive accent only**:
  - `.dp-page .dp-strategy-btn.is-active` (`border-color: var(--fs-accent)` & icon accent — interactivity, not status)
  - `.dp-page .dp-comparison-table tr.is-selected td:first-child` (`border-left: 2px solid var(--fs-accent)` per `§4.3.2` selected-row rule)
  - **No** `.sc-milestone-dot--due-soon` / `--overdue` or any direct tone token; milestone severity is the existing `Badge`.

### Page Components
- #### [MODIFY] `frontend/src/pages/credit-cards/StatementCyclePage.js`
  - Import `./CreditCardPage.css`, `Loading`, and `Badge`. Wrap root in `page-container cc-page-container cc-dashboard-page sc-page`.
  - Associate card selector `<label htmlFor="sc-card-select">` with `<select id="sc-card-select">`.
  - Replace inline loading/error with `<Loading variant="card" text="Loading statement cycle timeline..." />` and `.sc-error-card` + Retry button.
  - Purge all 15 inline styles, 20 hex literals (including the embedded `border` hex at `:73`), and emojis (`⚠️`, `⏳`). Render Charges & Payments neutral (`.fs-num`). Apply the Gate 0-amended due-date badges: `<Badge tone="negative">Overdue</Badge>`, `<Badge tone="warning">Due soon</Badge>`, or neutral unlabeled. Neutral milestone dots; severity label via `Badge`.
  - Add responsive D19 compact-expand mobile cards (`data-testid="sc-charges-mobile-cards"`) for Current Cycle Charges at `<= 768px`.
- #### [MODIFY] `frontend/src/pages/credit-cards/DebtPayoffPage.js`
  - Import `Loading`, `Badge` (`Delta` only if Review Item #3 Option B is chosen).
  - Fix `const { canModify } = useCanModify();` (per Review Item #2 Option A).
  - Associate `<label htmlFor="dp-monthly-budget">` with `<input id="dp-monthly-budget">`.
  - Purge all 16 inline styles, 13 hex literals, and emojis (`❄️`, `⚡`, `⏳`). Use `aria-pressed={strategy === ...}` on strategy buttons, `.fs-btn-primary` on `Save As Active Plan` (single primary CTA per section) and `.fs-btn-secondary` on `Recalculate` & `Show/Hide Schedule`.
  - Add D19 compact-expand mobile cards (`data-testid="dp-comparison-mobile-cards"` and `data-testid="dp-schedule-mobile-cards"`) at `<= 768px`.
- #### [MODIFY] `frontend/src/pages/credit-cards/ReconciliationPage.js`
  - Import `Loading`, `Badge`, `Delta`.
  - Associate all 3 form labels via explicit `id`/`htmlFor` (`rec-card-select`, `rec-cycle-select`, `rec-actual-balance`).
  - Purge all 20 inline styles and 14 hex literals (including the embedded `border` hex at `:201`). Render all ordinary figures neutral (`.fs-num`).
  - Status banner: `<Badge tone="neutral">Reconciled</Badge>` (matched) vs `<Badge tone="warning">Discrepancy</Badge>` + `<Delta tone="warning" value={...} label="vs bank statement" />` (discrepancy), per Review Item #5.
  - Add D19 compact-expand mobile cards (`data-testid="rec-charges-mobile-cards"` and `data-testid="rec-payments-mobile-cards"`) at `<= 768px`.

### Routing, Linting & Test Harness
- #### [MODIFY] `frontend/src/components/ProtectedRoute.js`
  Add `'/credit-cards/statements'`, `'/credit-cards/debt-payoff'`, `'/credit-cards/reconcile'` to `THEMED_PATTERNS` (`50 → 53`).
- #### [MODIFY] `frontend/.eslintignore`
  Remove `src/pages/credit-cards/DebtPayoffPage.js`, `src/pages/credit-cards/ReconciliationPage.js`, and `src/pages/credit-cards/StatementCyclePage.js`; assert exactly **1** remaining entry (`AddTransactionModal.currency.test.js`).
- #### [MODIFY] `frontend/tests/visual/fixtures/creditCardsMocks.js`
  Add deterministic mocks for `/api/credit-cards/statement-cycles/:cardId`, `/api/credit-cards/reconcile/:cardId`, and `/api/debt-payoff/*` (full CORS + `OPTIONS` `204`), keeping the existing `/credit-cards` handlers byte-identical.
- #### [MODIFY] `frontend/tests/visual/visual.spec.js` & `frontend/tests/visual/a11y.spec.js`
  Expand mock condition from `route.slug === 'credit-cards'` to `route.slug.startsWith('credit-cards')` while retaining `setFixedClock(page)` + `window.__VISUAL_TEST__ = true`.
- #### [MODIFY] `frontend/tests/visual/credit-cards-reference-match.spec.js`
  Update Test #3 to assert unified dark `CreditCardSubNav` across `/credit-cards` and `/credit-cards/statements`; its artifacts remain in `docs/ui-snapshots/phase-9a/`.
- #### [NEW] `frontend/src/pages/credit-cards/__tests__/StatementCyclePage.test.js`, `DebtPayoffPage.test.js`, `ReconciliationPage.test.js`
  3 Jest + `jest-axe` suites (`~24` tests total) verifying KPIs, 3-tier due-date severity (`Overdue` / `Due soon` / neutral), AD13 neutral amounts, strategy toggle & viewer `useCanModify` guard (`savePlan` blocked), reconciliation matched/discrepancy banners, D19 mobile cards, `0` `[style]` attributes, and `0` `jest-axe` violations.
- #### [NEW] `frontend/tests/visual/credit-cards-9b-reference-match.spec.js`
  Registered in `playwright.config.js` `reference` project (**9 specs + 1 setup = 10 passed**):
  1. `/credit-cards/statements` @ `1440px` (dark canvas, flat KPIs, `Due soon` badge, timeline, embedded `CardInstallmentSchedule`) + `390px` D19 mobile cards & `0px` overflow.
  2. `/credit-cards/debt-payoff` @ `1440px` (strategy toggle Snowball/Avalanche, comparison table, schedule toggle, single primary CTA) + `390px` D19 mobile cards & `0px` overflow.
  3. `/credit-cards/reconcile` @ `1440px` (form submission, matched & discrepancy banners with text labels, math strip, itemized tables) + `390px` D19 mobile cards & `0px` overflow.
  4. Unified `CreditCardSubNav` active state across all 4 routes at `1440px` & `390px` (`0px` overflow).
  5. Loading-state captures for all 3 routes.
  6. Empty-state captures for all 3 routes.
  7. Error-state captures for all 3 routes (`.sc-error-card`, `.dp-error-card`, `.rec-error-card` + Retry).
  8. Touch targets `>= 44px` & keyboard Tab focus-visible across all 3 Phase 9B routes.
  9. Frame 02 Variant B side-by-side comparison for the Debt Payoff strategy form against `02-form.html`.
  - **Named local artifacts** in gitignored `docs/ui-snapshots/phase-9b/` (25 PNGs, each `>= 1000` bytes): `statements-1440.png`, `statements-390.png`, `debt-payoff-1440.png`, `debt-payoff-390.png`, `reconcile-1440.png`, `reconcile-390.png`; `cc-subnav-{cards,statements,debt-payoff,reconcile}-{1440,390}.png` (8); `{statements,debt-payoff,reconcile}-{loading,empty,error}.png` (9); `phase-9b-touch-focus-390.png`; `frame-02-side-by-side.png`. No §7.4 deviation; no silent narrowing, and no overwrite of the 9A artifact directory.

---

## 3. Verification Plan (Gates 0–19)

### Gate 0 — Pre-Execution Governance (Local `phase-ui-9b-statements-debt`)
1. Create local branch `phase-ui-9b-statements-debt` from `main` (`e3bd47a`), assert `git merge-base HEAD origin/main` equals `e3bd47a`, and tag `ui-phase-9b-start`.
2. Commit approved `docs/ui-plans/phase_9b_implementation_plan.md` plus the §0.7 Gate 0 amendments: Review Items #1–#7 selections, `§4.3.1:359–360` source amendment, `Discrepancy`/`vs bank statement` label decision, neutral milestone-dot decision, `W-9A-1` scope extension, retirement of `CreditCardSubNav.css:21` from `§7.1:2105`, closure of the 2E deferrals, typography governance, and the initial `§10` entry. All implementation commits use the `ui(9b): …` prefix per `§14.1:3065`.
3. Gates are sequential; capture raw stdout and explicit exit codes as in 9A (`phase_9a_implementation_plan.md:128–388`). Gates 14/15 intentionally exit `1` for accepted W-6A-1/AD14/AD16 diffs.

### Automated & Visual Gates (Gates 1–18)
1. **Gate 1 — Allowlist & Coverage**: assert `53 pattern(s)` **and** the raw route matrix `75 / 10 / 65 / 0` (9A `phase_9a_implementation_plan.md:144–158`).
   ```powershell
   cd frontend
   $allowOut = node scripts/ui-coverage.js --assert-allowlist 2>&1 | Tee-Object -Variable allowLines
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $allowMatch = [regex]::Match(($allowLines | Out-String), '(\d+) pattern\(s\) verified')
   if (-not $allowMatch.Success -or [int]$allowMatch.Groups[1].Value -ne 53) { throw 'Gate 1: expected 53 allowlist patterns' }
   $routeOut = node scripts/ui-coverage.js --routes 2>&1 | Tee-Object -Variable routeLines
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $routeText = ($routeLines | Out-String)
   if ($routeText -notmatch 'Total route entries: 75' -or $routeText -notmatch 'Redirects: 10' -or
       $routeText -notmatch 'Rendering routes: 65' -or $routeText -notmatch 'Unassigned: 0') { throw 'Gate 1: expected 75 / 10 / 65 / 0 route matrix' }
   ```
2. **Gate 2 — Token Drift**: `node scripts/tokens.js --check --tables` → `0` drift (9A `phase_9a_implementation_plan.md:160–164`).
3. **Gate 3 — Test-ID Guard**: `node scripts/testid-guard.js --base e3bd47a` → `0` deletions (the script is `testid-guard.js`, not `check-testids.js`; 9A `phase_9a_implementation_plan.md:165–169`).
4. **Gate 4 — Tone Isolation**: `node scripts/lint-tones.js` → `0` violations; assert `61 page CSS files` / `64 total CSS files` in stdout as 9A did (`phase_9a_implementation_plan.md:170–177`). Section 24 adds no tone-bearing class, so the counts are unchanged.
5. **Gate 5 — Stylelint, Ratchet, D22, Overflow & Protected Diffs**:
   - `node scripts/lint-ratchet.js --base e3bd47a` → `0` regressions.
   - `npx stylelint` on the four modified CSS files plus `theme-components.css` → `0` violations.
   - `git grep -n '#14b8a6' -- '*.css'` → only `tokens.css`; `data-fs-theme="dark"` → only `tokens.css` (D22 attribute-existence rule).
   - Loading-bypass grep → `0` matches; raw hex grep across the three converted JS files → `0` matches (including `border` strings).
   - `git grep -n 'overflow-x' -- '*.css'` → only documented §7.1:2105 exceptions plus the Gate 0-extended `W-9A-1`; **zero** hits in `StatementCyclePage.css`, `DebtPayoffPage.css`, `ReconciliationPage.css`, and `CreditCardSubNav.css`.
   - `git diff e3bd47a -- <protected files>` → empty; `theme-components.css` diff is append-only with `0` removed lines.
6. **Gate 6 — ESLint & De-Ignore**: `--max-warnings=0` across the three converted pages, `CreditCardSubNav.js`, `ProtectedRoute.js`, mock/fixture/spec edits, and new Jest tests; `0` production 9B entries in `.eslintignore`, exactly `1` retained entry, `0` `eslint-disable` suppressions.
7. **Gate 7 — Credit Cards Jest + `jest-axe` Suite**: `npx react-scripts test --watchAll=false --runInBand src/pages/credit-cards/__tests__/` → `9/9` suites green (`32` existing + `~24` new); viewer-role test proves `savePlan` blocked.
8. **Gate 8 — App/Dashboard Suite & I8 Guard**: `App.test.js` + `DashboardSummary.test.js` (`15/15`), `DashboardSummary.js` `96` lines (`<= 120`).
9. **Gate 9 — Calculation Characterization (`I3`)**: `npx jest --runInBand tests/calculations.spec.js --forceExit` → `11/11` green (Domain 2 & Domain 3 unchanged).
10. **Gate 10 — Real-Browser Axe (`a11y.spec.js`)**: `$env:CI='true'`; `-g "a11y check: credit-cards-(statements|debt-payoff|reconcile)$"` → `4 passed` (`1 setup + 3 routes`), `0` serious/critical.
11. **Gate 11 — Reference Match**: run `credit-cards-9b-reference-match.spec.js` (`10 passed` = `1 setup + 9 specs`) and the updated `credit-cards-reference-match.spec.js` (`9 passed`) as separate commands with `$env:CI='true'`; assert the 25 named phase-9b artifacts (each `>= 1000` bytes) and the `390px` `scrollWidth === clientWidth` assertions.
12. **Gate 12 — Standalone Production Build**: `2048`MB (`1536`MB fallback) → `Compiled successfully.`; CI on `main` remains authoritative.
13. **Gate 13 — Recapture 15 Baselines & Manifest**: assert baseline-repo HEAD `2ec388e` before run; `--grep="credit-cards-(statements|debt-payoff|reconcile) @" --update-snapshots` → `16 passed` (`1 setup + 15 PNGs`), `verify-baseline-manifest.js` `334/334`, commit in `D:\Projects\FinStat-visual-baselines`, `0` net new entries; record the new baseline SHA.
14. **Gate 14 — PR-Subset**: `$env:CI='true'; $env:PR_SUBSET='true'`; require exit `1` with exactly `68 passed` / `3 failed`, and mechanically assert the three registered titles `salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440` (9A `phase_9a_implementation_plan.md:288–304`).
15. **Gate 15 — Full 326-Test Visual Suite** *(user-authorized local run per Review Item #7 — `§15.5:3192` otherwise prohibits it)*: require exit `1` with exactly `292 passed` / `34 failed` (`326` accounted), `0` unexplained, `0` 9A-attributable, `0` 9B-attributable, `0` 9C diffs; mechanically assert all 34 failure titles against the AD14/AD16 register copied from 9A `phase_9a_implementation_plan.md:318–332` (10 AD14 + 24 AD16/W-6A-1); attach raw stdout before cleaning reports.
16. **Gate 16 — Touch Targets & Focus Rings**: `credit-cards-9b-reference-match.spec.js --project=reference -g "touch targets"` → `2 passed` (`1 setup + 1 spec`).
17. **Gate 17 — Visual Inspection**: inspect all 15 recaptured baselines plus the 25 named local artifacts; computed-style table must show `body` `--fs-bg`, no gradients/blurs/shadows, radii `<= 8px`, `0` `[style]` on converted roots, neutral ordinary figures, and `0px` overflow at `390px`.
18. **Gate 18 — Credit Cards Cluster + Unthemed 9C Lending & Trades Regression Check**: expect **56/56 passed** (`1 setup + 5 credit-cards + 15 themed 9B + 20 trades + 15 lending`); trailing ` @` on every slug prevents prefix swallowing, and explicit slugs are listed ahead of broader alternatives (9A `phase_9a_implementation_plan.md:373–378`).
   ```powershell
   cd frontend; $env:CI='true'
   npx playwright test visual.spec.js --project=visual --grep="(credit-cards @|credit-cards-statements @|credit-cards-debt-payoff @|credit-cards-reconcile @|trades @|trades-add @|trades-edit @|trade-summary @|lending @|lending-person-detail @|lending-loan-detail @)"
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
19. **Gate 19 — Walkthrough & Merge Boundary**: author `docs/ui-plans/phase_9b_walkthrough.md` with the 9A header ledger (date, status, branch/tag, merge base `e3bd47a`, Gate 0 Plan & Governance SHA, Implementation SHA, Walkthrough SHA, starting baseline `2ec388e`, Gate 13 baseline SHA, `334/334` manifest), §0 approved Review Items #1–#7 and Gate 0 amendments, §1 progress log, §2 I1–I16, §3 visual diff report (`326` totals / `292` zero-diff / registered accepted diffs / `0` unexplained), §4 gate evidence with raw stdout including Gates 1/14/15, §5 inspection log for 15 baselines + 25 artifacts, and §6 post-sign-off checklist (governance sync, `--no-ff` merge, push only `main`, verify authoritative CI, clean reports). Commit on local `phase-ui-9b-statements-debt` and **STOP** awaiting explicit Gate 19 user sign-off before governance sync, merge, and push.

---

## 4. User Review Required

> [!IMPORTANT]
> Please confirm these **seven items** before Phase 9B execution begins:
>
> 1. **Statement Due-Date Tone Provenance (`§4.3.1:359–360`, `§6.13:1916`)**
>    - The canonical source cell cites `dueDiffDays` in `CreditCardPage.js` / `DebtPayoffPage.js`, but there are zero live matches; 9A treated that as no-source and kept `/credit-cards` chips neutral (`phase_9a_walkthrough.md:27`).
>    - **Option A (Recommended)**: Gate 0 amends the `§4.3.1:359–360` source cell to `StatementCyclePage.js` (`isOverdue` / `daysUntilDue <= 7`) and records the labels in `§10` per `§4.3.1:371`; `Due soon` / `Overdue` badges are then implemented as written.
>    - **Option B**: Strict no-source reading — all due dates stay neutral/unlabeled, badges and the source amendment are dropped. Requires a plan revision (v3+) and re-approval before Gate 0; gates switch to neutral assertions.
> 2. **Latent `useCanModify()` Destructuring Bug (`DebtPayoffPage.js:13`, `I4`)**
>    - **Option A (Recommended)**: Apply the scoped `const { canModify } = useCanModify();` fix with viewer-role Jest coverage proving `savePlan` is blocked (Phase 8E/9A precedent).
>    - **Option B**: Leave line 13 untouched for strict literal `I4` (requires plan revision).
> 3. **Debt Payoff "Interest Saved" Tone** — **Option A (Recommended)**: keep neutral per `§4.3.1:371`; **Option B**: `<Delta tone="positive" sign="positive" label="saved vs minimum" />` plus a recorded §10/`§4.3.1` label decision (plan revision required).
> 4. **`W-9A-1` Scope Extension & `CreditCardSubNav.css:21` Retirement**
>    - **Option A (Recommended)**: Gate 0 extends `W-9A-1` in `§10`/`§7.1:2105` to the embedded schedule on `/credit-cards/statements` (desktop/tablet `> 768px` only; D19 cards at `<= 768px`), retires the `CreditCardSubNav.css:21` exception, and keeps all three 9B CSS files at `0` `overflow-x`.
>    - **Option B**: No extension — give the statement schedule an independent `.sc-table-wrap` with D19 cards and no desktop scroll (plan revision required).
> 5. **Reconciliation Status Tone Labels (`§6.13:1917`)** — confirm `<Badge tone="neutral">Reconciled</Badge>` (expected state), `<Badge tone="warning">Discrepancy</Badge>` + `<Delta tone="warning" label="vs bank statement" />` (awaiting action), with a Gate 0 §10 label decision; all ordinary figures and itemized rows remain neutral per AD13. Positive tone for `Reconciled` would need a separate plan revision.
> 6. **Timeline Milestone Tone Entry Point** — **Option A (Recommended)**: neutral milestone dots, severity via the existing `Badge`; Section 24 contains interactive-accent rules only. **Option B**: introduce `.sc-milestone-dot--due-soon/--overdue` tone classes and record a new tone entry point in `§10` (plan revision required).
> 7. **Local Gate 12 (`2048`MB / `1536`MB fallback), Full 326-Test Gate 15 (`§15.5`) & Retained `$` Formatter (`I3`)** — confirm authorizing the local standalone build, the full local visual suite with exact 34-title assertions, and retaining `formatCurrency()` (`$`) unchanged.
>
> **Execution note**: Gates 0–18 are written for Option A on items 1–4 and 6–7 and for item 5 as written. Any Option B or rejection requires a plan revision (v3+) and re-approval **before** Gate 0; the gates do not silently reinterpret the plan. Phase 9B does not merge until Gate 19 sign-off, and Phase 9C remains open per `§0:127`.
