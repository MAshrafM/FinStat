# UI Phase 9A Implementation Plan — Credit Cards, Modals & Installments (Cluster 9 Taste Checkpoint #7)

- **Date**: 2026-11-27
- **Revision**: **v8** — records user approval of Review Items #1 (`Option A` 30/70 thresholds & `Elevated`/`High`), #2 (`Option A` scoped `useCanModify()` fix), #3 (Waiver `W-9A-1` & inherited `CreditCardSubNav.css:21` note), #4 (8-file `.eslintignore` de-ignore scope retaining `AddTransactionModal.currency.test.js` & 9B files), #5 (local Gate 12 `2048`MB/`1536`MB fallback & full 326-test Gate 15), #6 (retained `$` formatter), and #7 (two-part Taste Checkpoint #7 evidence); retains all v5–v7 corrections
- **Revision Date**: 2026-11-28
- **Status**: Complete — Gate 19 & Taste Checkpoint #7 Signed Off 2026-11-28
- **Merge Base**: `main` @ `22f4a9f`
- **Starting Baseline Commit**: `7460ca7` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)
- **Branch**: `phase-ui-9a-credit-cards` *(local branch policy per §14/§10; only `main` is pushed after Gate 19 user sign-off)*
- **Taste Checkpoint**: **Taste Checkpoint #7** (`/credit-cards` at `1440` and `390` — widths per `§7.2:2114` — compared with Reference Frame 2 **Variant B** per `§6.1.1:1099/:1103`). Because `02-form.html:7` is a two-column form frame while `/credit-cards` is a KPI/table dashboard, checkpoint evidence is **two-part**: the 5 baseline PNGs prove the graphite shell/KPI/D19 page treatment, and the Add Card / Log Transaction / Partial Payment **screenshot artifacts written by the new `credit-cards-reference-match.spec.js` via `page.screenshot()`** are the Frame 02 Variant B comparison. The two-part evidence is explicitly subject to **Review Item #7** sign-off. Fifteen modal PNGs are captured (three modals × `1440/1024/768/480/390px`) into gitignored `docs/ui-snapshots/phase-9a/` per `§7.4:2150–2159`, together with loading/empty/error state PNGs, both-mode sub-nav PNGs, and a named `frame-02-side-by-side.png` artifact against `02-form.html` Variant B (stacked-field form per `02-form.html:134/:417`). They stay local per D5 and are inspected in Gate 17 alongside the baseline PNGs. **Phase 9B does not start until Taste Checkpoint #7 is signed off** per `§6.1.1:1089`.
- **Target Route (1 route — smoke route in `pr-subset`)**:
  - `/credit-cards` — Credit Card Center (`CreditCardPage.js`, slug `credit-cards`)
- **Target Production Files**:
  - `frontend/src/pages/credit-cards/CreditCardPage.css` *(**MODIFY**: Rewrite all 329 legacy light lines — `1` gradient, `4` pixel `box-shadow`s, rainbow green/blue/purple buttons — under D22 `html[data-fs-theme] .cc-page-container`; `0` external consumers)*
  - `frontend/src/components/creditCards/UtilizationWidget.css` *(**MODIFY**: Rewrite all 193 legacy light lines — `3` pixel shadows, `grid-templateColumns` typo at `:112`, green/amber/red fills — under D22 `html[data-fs-theme] .cc-util-card`; `0` external consumers outside its sole importer `UtilizationWidget.js:6`)*
  - `frontend/src/pages/credit-cards/CreditCardPage.js` *(**MODIFY**: Drop legacy imports `../trades/Trades.css` & `../../components/Table.css`; purge all **7** inline styles & `2` hex literals; convert raw clickable action icons to accessible `<button type="button" className="cc-icon-btn" aria-label="...">` controls; apply Frame 01/03 dark graphite KPI strips, **neutral** `<Badge>` status chips (`Paid`, `Partial`, `Due` — no `warning`/`negative` tone without a §4.3.1 source; no `Due soon`/`Overdue` labels on this route), single primary CTA + secondary actions, Waiver `W-9A-1` desktop table containers + D19 `<= 768px` compact-expand mobile cards for Due Transactions & Full Transaction History with `0px` overflow at `390px`, `<Loading variant="card" />`, fetch-error `.cc-error-card` + Retry, and conditional `useCanModify()` destructuring per Review Item #2)*
  - `frontend/src/components/creditCards/UtilizationWidget.js` *(**MODIFY**: Purge all **4** inline styles & `3` hex literals; replace inline-width/color bars with semantic `<progress>` / `.fs-progress` meters following §4.3/§4.3.1/§6.13:1903 — neutral unlabeled `0 <= x < 30%`, `.fs-progress--warning` + `Elevated` at `30 <= x < 70%`, `.fs-progress--negative` + `High` at `x >= 70%` per Review Item #1 — and zero `[style]` DOM attributes)*
  - `frontend/src/pages/credit-cards/CardInstallmentSchedule.js` *(**MODIFY**: Purge all **28** inline styles & `21` hex literals; apply dark graphite card + semantic table with `.fs-num` right-aligned figures, **neutral** `<Badge>` counts and **neutral** `Due This Cycle` / `Cycle Paid` chips (the §4.3.1:359–360 `Due soon` / `Overdue` rows cite stale `dueDiffDays` code; `/credit-cards` has zero `dueDiffDays` matches, so 9A applies §4.3.1:371's no-source rule), and D19 `<= 768px` compact-expand mobile cards; preserve exact piastre math & existing `CardInstallmentSchedule.test.js` assertions)*
  - `frontend/src/pages/credit-cards/AddCardModal.js`, `EditCardModal.js`, `AddTransactionModal.js`, `EditTransactionModal.js`, `PartialPaymentModal.js` *(**MODIFY**: Purge all **31** modal inline styles [`13` AddTx + `4` EditTx + `14` PartialPayment; `0` AddCard/EditCard] & `31` hex literals; remove emojis [`💡`,`💳`,`🛡️`,`🔄`,`📉`]; apply Reference Frame 02 Variant B stacked dark modal forms with explicit `id`/`htmlFor` pairing, `.fs-btn-primary` / `.fs-btn-secondary`, flat dark `.currency-conversion-card` preserving `data-testid="conversion-confirmation-card"` and `data-testid="converted-egp-value"`, and byte-identical submit payloads; also clear the 10 pre-existing `label-has-associated-control` warnings in these five files per Gate 6)*
  - `frontend/src/styles/theme-components.css` *(**MODIFY**: Append **Section 23: Phase 9A Credit Cards Semantic & Interactive Themes** using the D22 attribute-existence selector `html[data-fs-theme]`; Section 23 contains **no** `.cc-subnav-*` rules. The authoritative Section 10 `.fs-page .cc-subnav-*` block at `:1838–1869` and `CreditCardSubNav.css` stay byte-identical; `[data-fs-theme="dark"]` remains confined to `tokens.css`)*
  - `frontend/src/components/ProtectedRoute.js` *(**MODIFY**: Expand `THEMED_PATTERNS` **49 → 50**: add `'/credit-cards'`)*
  - `frontend/.eslintignore` *(**MODIFY**: Remove **8** Phase 9A production-component lines — `UtilizationWidget.js` `:15`, `AddCardModal.js` `:23`, `AddTransactionModal.js` `:24`, `CardInstallmentSchedule.js` `:25`, `CreditCardPage.js` `:26`, `EditCardModal.js` `:28`, `EditTransactionModal.js` `:29`, `PartialPaymentModal.js` `:30` — per `§6.13:1909`; **retain** `AddTransactionModal.currency.test.js` `:33` and the 3 Phase 9B entries `DebtPayoffPage.js`, `ReconciliationPage.js`, `StatementCyclePage.js`)*
  - `frontend/playwright.config.js` *(**MODIFY**: Register `credit-cards-reference-match.spec.js` in the `reference` project)*
- **Execution-Start Governance Prerequisites (Gate 0 — Committed on Local `phase-ui-9a-credit-cards` Before Gates 4–18)**:
  - Commit approved `docs/ui-plans/phase_9a_implementation_plan.md`.
  - Record Waiver **`W-9A-1`** in `docs/UI-UX_Plan/UI-UX-PLAN.md §7.1 (:2104)` for desktop/tablet `.cc-dashboard-page .cc-table-wrap` (`> 768px` only; hidden at `<= 768px` in favor of D19 cards with `0px` page overflow); in the same line record the **pre-existing** `CreditCardSubNav.css:21` `overflow-x: auto` as an inherited baseline exception (the file is byte-identical in 9A).
  - Record the initial `§10` Gate 0 entry documenting Review Items #1–#7 selections/approvals (explicit option letters for items #1/#2), including the Option A/B utilization decision, the scoped `I4` `useCanModify()` fix, the 8-file `.eslintignore` scope, local Gate 12/15 authorization, the two-part Checkpoint #7 evidence acceptance, and retained `$` formatter.
  - **Utilization provenance and threshold record**: amend `§4.3.1:363–364` so the source column reads “No pre-existing source — 30/70 thresholds and `Elevated`/`High` labels mandated by Gate 0 §10 decision,” recording legacy `UtilizationWidget.js:25–29` (`>= 50%` / `>= 30%`, colour-only) as the superseded implementation rather than as evidence. Under **Option A**, record in `§10` per `§4.3.1:371` that the two label additions and exact `30 <= x < 70` / `x >= 70` boundaries are plan-mandated; the component thresholds change, but `creditCardService.js`, `utilizationMonitor.js`, and all calculations stay byte-identical. Under **Option B**, revise this plan further (v8+) and re-approve **before** Gate 0; Gate 0 then amends **`§4.3:331`**, **`§4.3.1:363–364`**, and **`§6.13:1903`** so all three canonical locations agree.
  - Record two catalogue notes: first correct the stale canonical `§8.2:2223` entry for `PartialPaymentModal` from `15` to `14` inline styles (live code has `14` `style={{` and `14` hex literals), then amend `§6.13:1901`'s `PartialPaymentModal (14)` entry in place to read `PartialPaymentModal (14 hex literals / 14 inline styles per §8.2:2223)` so both canonical tables agree with the live-code census; and `§6.13:1903`'s “each with a text label” applies only to the two tone-bearing tiers (`Elevated`, `High`) — `0 <= x < 30%` remains neutral/unlabeled per `§4.3:331`.
  - Record in `§10` that master `§4.5:443` / `§7.2:2129` governs numeric figures (proportional IBM Plex Sans + `font-variant-numeric: tabular-nums` via `.fs-num`) over `AGENTS.md:13`'s mono wording; no Phase 9A money or metric value is mono.
  - Record that the `§4.3.1:359–360` `Due soon` / `Overdue` sources cite `CreditCardPage.js` / `DebtPayoffPage.js` with `dueDiffDays <= 7` / `< 0`, but `/credit-cards` has zero `dueDiffDays` matches; the 9A chips (`Paid`, `Partial`, `Due`, `Cycle Paid`, `Due This Cycle`) are not those rows and stay neutral under §4.3.1:371's no-source rule. No `Due soon` / `Overdue` label is introduced on `/credit-cards`.
  - Split `§6.13:1906` into two canonical rows at Gate 0: a **9A** row for the credit-card tables (Due Transactions, Full Transaction History, Installment Schedule render as D19 compact-expand cards at `<= 768px` with `0px` page overflow) and a **9B/9C** row for statement and lending-ledger tables (deferred). `§5.8:945` assigns only `/credit-cards` to 9A; I13 requires 9B routes pixel-identical. Post-sign-off governance checks **12/12** 9A rows; 9A is never marked complete with an open 9A row per `§0.0:127`.
  - **Execution assumption**: Gates 4–18 are written for **Option A** on Review Items #1 and #2 and for acceptance of the two-part Checkpoint #7 evidence under Review Item #7. Option B for item #1/#2, or rejection of the two-part evidence, requires a further plan revision (v8+) and re-approval **before** Gate 0; the gates do not silently reinterpret the plan.
- **Protected Files (Strictly Untouched — Verified via `git diff 22f4a9f`)**:
  - `frontend/src/services/creditCardService.js`, `frontend/src/context/CreditContext.js`, `frontend/src/utils/formatters.js`, `frontend/src/App.js`, `frontend/src/pages/DashboardSummary.js`, `frontend/src/styles/chartTheme.js`, `frontend/tests/calculations.spec.js`, `frontend/package.json`, `frontend/package-lock.json`, `backend/routes/creditCards.js`, `frontend/src/pages/trades/Trades.css`, `frontend/src/components/Table.css`, `frontend/src/components/Modal.css`, `frontend/src/pages/credit-cards/StatementCyclePage.css`, `frontend/src/pages/credit-cards/DebtPayoffPage.css`, `frontend/src/pages/credit-cards/ReconciliationPage.css`, **`frontend/src/components/creditCards/CreditCardSubNav.css`**, **`frontend/src/components/creditCards/CreditCardSubNav.js`**, **`frontend/src/pages/credit-cards/__tests__/AddTransactionModal.currency.test.js`**, `frontend/src/styles/theme-components.css` existing Sections 1–22 (append-only Section 23).

---

## 0. Verified Codebase Audit & Architectural Decisions

1. **CSS Ownership & Dual-Mode Sub-Nav Strategy (`§4.16`, `§6.13:1904`)**:
   - `CreditCardPage.css` (`329L`) and `UtilizationWidget.css` (`193L`) have **0** consumers outside `/credit-cards` and are rewritten cleanly under D22 `html[data-fs-theme]`.
   - `CreditCardPage.js` currently imports `../trades/Trades.css` (`:19`) and `../../components/Table.css` (`:21`). Dropping both imports keeps `Trades.css` (Phase 7A) and `Table.css` (Phase 12A) byte-identical.
   - `CreditCardSubNav.css` (`102L`) is consumed by 9A `/credit-cards` and 9B unthemed routes, so it is **not edited in 9A** — it stays byte-identical, including its pre-existing `overflow-x: auto` at `:21`. `§4.16:818–822` requires dual-mode components to receive new styling **only** through `.fs-page <existing-class>` selectors, and `frontend/src/styles/theme-components.css:1838–1869` already supplies `.fs-page .cc-subnav-*` graphite styling for themed pages while legacy rules serve 9B. Section 23 therefore adds **no** `.cc-subnav-*` rules; both the existing `.fs-page` block and `CreditCardSubNav.css` are byte-identical in 9A, with no competing `html[data-fs-theme] .cc-subnav-*` block. The legacy branch is removed in 9B per `§6.13:1917`.
2. **Verified Inline-Style & Hardcoded-Colour Census (`70` total `style={{` across 9 JS files)**:
   - `CreditCardPage.js` (`538L`): **7** `style={{`, **2** hex, `0` `data-testid`, `0` `aria-label`.
   - `CardInstallmentSchedule.js` (`109L`): **28** `style={{`, **21** hex.
   - `PartialPaymentModal.js` (`126L`): **14** `style={{`, **14** hex *(§6.13:1901 records the 14-hex-literal proxy; the stale §8.2:2223 `15` is corrected to `14` in the Gate 0 catalogue amendment).*
   - `AddTransactionModal.js` (`411L`): **13** `style={{`, **13** hex, **2** `data-testid` (`conversion-confirmation-card`, `converted-egp-value` — preserved).
   - `EditTransactionModal.js` (`372L`): **4** `style={{`, **4** hex, **2** `data-testid` (`conversion-confirmation-card`, `converted-egp-value` — preserved).
   - `UtilizationWidget.js` (`112L`): **4** `style={{`, **3** hex.
   - `AddCardModal.js` (`74L`), `EditCardModal.js` (`126L`), `CreditCardSubNav.js` (`66L`): `0` `style={{` (`CreditCardSubNav.js` preserves `aria-label="Credit Cards Navigation"`).
   - **Total**: **70** `style={{` + **57** hex literals -> **all purged to `0`**, including replacing inline-width utilization bars with semantic native `<progress className="cc-util-progress ...">` meters so rendered DOM `[style]` count is strictly `0`. Modal subtotal is **31** (`13` AddTx + `4` EditTx + `14` PartialPayment; `0` AddCard/EditCard).
   - **Pre-existing ESLint warning census (Gate 6 scope)**: `npx eslint --no-ignore` currently reports **11** `jsx-a11y/label-has-associated-control` warnings in files that 9A de-ignores — `AddCardModal.js` (`4`), `EditCardModal.js` (`4`), `CreditCardPage.js` (`1`), `PartialPaymentModal.js` (`2`) — plus the **10** pre-existing `testing-library/no-wait-for-multiple-assertions` errors in the retained `AddTransactionModal.currency.test.js`. Gate 6 requires the 11 production warnings to be fixed through explicit `id`/`htmlFor` pairing, not suppressed with `eslint-disable` comments or by re-ignoring any file.
3. **Utilization Severity Thresholds (`§4.3:331`, `§4.3.1:363–364`, `§6.13:1903`)**:
   - Legacy `UtilizationWidget.js:25–29` maps `>= 50%` to red, `>= 30%` to amber, and `< 30%` to green (`#10b981`).
   - Per `§4.3:331`, `§4.3.1:371`, and `§6.13:1903`, `0 <= x < 30%` MUST be **neutral with no label** (no "healthy green"), `30 <= x < 70%` uses `.fs-progress--warning` with text label `Elevated`, and `x >= 70%` uses `.fs-progress--negative` with text label `High`. See **Review Item #1**. Gate 0 rewrites `§4.3.1:363–364`'s source cell to “No pre-existing source — mandated by Gate 0 §10 decision” and records in `§10` that the label additions and exact 70% boundary are plan-mandated, not derived from the superseded `UtilizationWidget.js:25–29` colour-only code.
4. **Tone Provenance for Transaction / Installment Chips (`§4.3.1:359–360`, `§7.2:2131`)**:
   - `CardInstallmentSchedule.js:91/:95` renders `Cycle Paid` / `Due This Cycle`, and `CreditCardPage.js` renders `Paid` / `Partial` / `Due`. The `§4.3.1:359–360` `Due soon` / `Overdue` rows cite stale `dueDiffDays` code and `/credit-cards` has **no** `dueDiffDays` logic; applying §4.3.1:371's no-source rule, all these chips render **neutral**. No `warning` tone, no `Due soon` / `Overdue` label, and no negative tone on ordinary unpaid balances are introduced in 9A.
5. **Existing Test & Calculation Preservation (`I2`, `I3`, `I5`)**:
   - All 4 existing Jest suites in `frontend/src/pages/credit-cards/__tests__/` (`AddTransactionModal.test.js`, `AddTransactionModal.currency.test.js`, `EditTransactionModal.test.js`, `CardInstallmentSchedule.test.js`) stay 100% green and byte-identical; every existing label regex, `data-testid`, piastre formula, and payload shape is preserved. `AddTransactionModal.currency.test.js` remains in `.eslintignore` because de-ignoring it surfaces 10 pre-existing `testing-library/no-wait-for-multiple-assertions` errors; `§6.13:1909` only requires removing component files.
   - `tests/calculations.spec.js` (including Domain 2: Credit Card Installment Amortization) remains byte-identical (`11/11`).
6. **Deterministic Visual Harness (`creditCardsMocks.js`)**:
   - Create `frontend/tests/visual/fixtures/creditCardsMocks.js` with full cross-origin CORS + `OPTIONS` `204` preflight handling covering `/api/credit-cards/cards`, `/overall-summary`, `/utilization`, `/summary/:id`, `/transactions/due/:id`, `/transactions/:id`, `/payments/*`, and `/api/currency/price` (for modal FX preview).
   - Use a **single ordered `page.route(/\/api\/credit-cards(?:\/|\?|$)/, ...)` handler** plus a dedicated `/api/currency/price` handler. Preflight is checked first: `OPTIONS` → `204` with `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`, and `Access-Control-Allow-Headers: Content-Type, Authorization`, following `phase_8e_implementation_plan.md:142–154`.
   - Method/path contract mirrors `creditCardService.js:8–70` exactly: `GET`/`POST` `/cards`; `PUT`/`DELETE` `/cards/:id`; `GET` `/summary/:id`; `GET` `/transactions/due/:id`; `GET` `/transactions/:id`; `POST` `/transactions`; `PUT`/`DELETE` `/transactions/:id`; `POST` `/payments`; `GET` `/payments/:cardId`; `DELETE` `/payments/:id`; `POST` `/payments/full`; `POST` `/payments/partial`; `GET` `/overall-summary`; `GET` `/utilization`; `GET` `/api/currency/price`. Dispatch by **method plus pathname**, with `OPTIONS`, `/payments/full`, `/payments/partial`, `/transactions/due/:id`, `/summary/:id`, `/overall-summary`, and `/utilization` before parameterized `/transactions/:id`, `/payments/:id`, and `/cards/:id`, so specific routes are never swallowed. Each handler returns the exact response shape consumed by the page/modals and preserves request bodies byte-identically for `I2`.
   - Deterministic **3-card dataset** with explicit alert fields (backend `utilizationMonitor.js:29–30` computes `isAlert = utilization > threshold`, default threshold `30`; therefore the `45%` card is also an alert):
     1. `18%` — `isAlert: false`; neutral/unlabeled meter.
     2. `45%` — `isAlert: true`, `c.threshold: 30`; `.fs-progress--warning` + `Elevated` severity label; per-card "Above 30% Alert" badge and the `hasAlerts: true` banner remain visible as **informational** legacy state.
     3. `82%` — `isAlert: true`, `c.threshold: 30`; `.fs-progress--negative` + `High` severity label; same 30% alert badge/banner.
     - `hasAlerts: true` globally. The 30% alert banner/badge is preserved unchanged per `I2`/`I3`; it is not a severity tone. Severity labels follow `§4.3.1`'s 30/70 thresholds. Dataset also includes 1 standard purchase, 1 installment plan, and 1 foreign USD transaction. Gates 7/11 assert all three tiers **and** banner/badge presence on the two alerting cards.
   - Wire `setupCreditCardsMocks(page)` into `visual.spec.js`, `a11y.spec.js`, and the new `credit-cards-reference-match.spec.js` **strictly for `route.slug === 'credit-cards'`** so Phase 9B unthemed routes (`credit-cards-statements`, `credit-cards-debt-payoff`, `credit-cards-reconcile`) remain untouched and pixel-identical. `visual.spec.js:57,61` and the new spec use `setFixedClock(page)` + `page.addInitScript(() => { window.__VISUAL_TEST__ = true; })`; `a11y.spec.js:32` currently calls only `setFixedClock(page)`, so the Phase 9A edit must add the same init script there before wiring the fixture.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 9A Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` expands `49 → 50` adding `'/credit-cards'` only. | Gate 1 & Gate 8 |
| **I2** | `creditCardService.js`, `CreditContext.js`, `backend/routes/creditCards.js`, and all modal/payment payloads byte-identical. | Gate 5 protected-file diffs & Gate 7 |
| **I3** | No calculation changes (piastre amortization, partial payment remaining due, FX conversion, `$` `formatCurrency()`); `calculations.spec.js` `11/11`. | Gate 7 & Gate 9 |
| **I4** | All `<ProtectedAction>` wrappers preserved; scoped `const { canModify } = useCanModify();` fix in `CreditCardPage.js:24` only if Review Item #2 Option A is approved. Viewer-role Jest test asserts the four inert guards at `:139/:161/:167/:173` now block full-payment, partial-payment, edit, and delete modals (`transactionToPay`, `selectedTransaction`, `transactionToDelete` stay unset, no modal rendered, zero service calls) with zero visible `ProtectedAction` wrapper changes. | Gate 7 |
| **I5** | Zero deletion of existing `data-testid` (`conversion-confirmation-card`, `converted-egp-value`) or `aria-label` (`Credit Cards Navigation`); accessible button labels added to all icon actions, expanders, and `<progress>` meters. | Gate 3 & Gate 7 |
| **I6** | Due Transactions, Full Transaction History, and Installment Schedule tables collapse to D19 compact-expand cards at `<= 768px`; Gate 11/17 assert `document.documentElement.scrollWidth === document.documentElement.clientWidth` at `390px`; desktop scroll scoped under Waiver `W-9A-1`. | Gate 5, Gate 11 & Gate 17 |
| **I7** | `/credit-cards` + all 5 modals + `UtilizationWidget` + `CardInstallmentSchedule` convert atomically in one branch; dual-mode `CreditCardSubNav` stays byte-identical. | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` remains `96` lines (`<= 120`); App/Dashboard suite `15/15`. | Gate 8 |
| **I9** | Local standalone `2048`MB build (`1536`MB fallback) clean; authoritative CI on `main`. | Gate 12 |
| **I10** | All 4 existing (`14` tests) + 2 new (`~20` tests) Phase 9A Jest suites pass in-band alongside App/Dashboard suite. | Gates 7 & 8 |
| **I11** | Zero new `!important`; `lint-ratchet.js` `0` regressions. | Gate 5 |
| **I12** | `frontend/package.json` & lockfile untouched. | Gate 5 |
| **I13** | Non-allowlisted routes (including Phase 9B `/credit-cards/statements`, `/credit-cards/debt-payoff`, `/credit-cards/reconcile`, and all `Trades.css` consumers) pixel-identical. | Gates 14, 15 & 18 |
| **I14** | Zero gradients, blurs, glows, or arbitrary shadows in converted CSS/JS. | Gate 5, Gate 6 & Gate 11 |
| **I15** | Neutral by default; utilization tones use `.fs-progress--warning` (`Elevated`, `30 <= x < 70%`) / `.fs-progress--negative` (`High`, `x >= 70%`) with `0 <= x < 30%` unlabeled, per §4.3:331/§4.3.1:371; transaction/installment chips neutral (no unsourced `Due This Cycle` / `Partial` warning); tone tokens isolated in `theme-components.css` Section 23. | Gate 4, Gate 7 & Gate 11 |
| **I16** | Radii `<= 8px` (`--fs-radius-sm/md/lg`), `--fs-radius-pill` on `<Badge>` only. | Gate 5 & Gate 11 |

---

## Proposed Changes

### Styling & Theme Isolation
- **`CreditCardPage.css`**: Rewrite under `html[data-fs-theme] .cc-page-container` covering page header, card selector, single primary CTA (`Add New Card`) + secondary actions (`Edit Card`, `Log Transaction`), flat KPI summary strips (overall + selected card), desktop `.cc-table-wrap` (`W-9A-1`) + D19 `.cc-mobile-cards` (`<= 768px`), accessible `.cc-icon-btn` actions, flat dark modal form layout (`.cc-modal-form`, `.cc-conversion-card`, `.cc-installment-panel`, `.cc-settlement-panel`), and `CardInstallmentSchedule` card/table/mobile-cards.
- **`UtilizationWidget.css`**: Rewrite under `html[data-fs-theme] .cc-util-card`; fix `grid-template-columns`; style native `<progress className="cc-util-progress">` + 30% threshold marker + per-card breakdown grid with zero inline styles.
- **`CreditCardSubNav.css` / `CreditCardSubNav.js`**: **Byte-identical — no edits in 9A.** Dual-mode styling continues through the existing `.fs-page .cc-subnav-*` rules at `theme-components.css:1838–1869` per `§4.16:818–822`; the legacy branch is removed in 9B per `§6.13:1917`.
- **`theme-components.css`**: Append **Section 23: Phase 9A Credit Cards Semantic & Interactive Themes** using the D22 attribute-existence selector `html[data-fs-theme]` (neutral `.cc-icon-btn` hover/focus, neutral `.cc-error-card` / `.cc-modal-error` border with text cue + `role="alert"`, `--fs-danger` only inside the shared `ConfirmModal` delete confirmation per `§4.4:409`, neutral `.cc-util-alert-banner` border, and `.cc-util-progress.fs-progress--warning` / `.fs-progress--negative` `<progress>` bar fills). No `.cc-subnav-*` rule is added here; `[data-fs-theme="dark"]` stays confined to `tokens.css`.

### Components & Modals
- **`CreditCardPage.js`**: Drop `Trades.css` & `Table.css` imports; wrap in `<div className="page-container cc-page-container cc-dashboard-page">`; apply `<Loading variant="card" />`, fetch-error `.cc-error-card` + Retry, flat KPI tiles with `.fs-num`, **neutral** `<Badge>` transaction status chips (`Paid`, `Partial`, `Due` — no warning/negative tone and no `Due soon`/`Overdue` label without a `§4.3.1` source), accessible `<button type="button" className="cc-icon-btn">` action buttons, D19 mobile cards (`data-testid="cc-due-mobile-cards"`, `data-testid="cc-history-mobile-cards"`), and optional `const { canModify } = useCanModify();` per Review Item #2.
- **`UtilizationWidget.js`**: Replace inline `style` width/background bars with semantic `<progress>` + `.fs-progress--warning` (`Elevated`, `30 <= x < 70%`) / `.fs-progress--negative` (`High`, `x >= 70%`) / neutral (`0 <= x < 30%`, unlabeled), severity `<Badge>` with explicit text label where applicable, zero inline styles, and explicit accessible semantics: `aria-label={`Utilization for ${card.name}`}` with `aria-valuetext={`${utilization}%${tierLabel ? ` — ${tierLabel}` : ''}`}` so the low tier reports the percentage only.
- **`CardInstallmentSchedule.js`**: Purge all 28 inline styles; render flat dark graphite card, semantic table with `.fs-num`, **neutral** `<Badge>` counts and neutral `Due This Cycle` / `Cycle Paid` chips, and D19 mobile cards while preserving exact piastre math & existing test assertions.
- **`AddCardModal.js`, `EditCardModal.js`, `AddTransactionModal.js`, `EditTransactionModal.js`, `PartialPaymentModal.js`**: Purge all 31 inline styles & emojis; apply Frame 02 Variant B stacked dark modal forms (`id`/`htmlFor`, `.fs-btn-primary`/`.fs-btn-secondary`, neutral `.cc-modal-error` with `role="alert"`), clear the 10 modal `label-has-associated-control` warnings, and preserve `data-testid="conversion-confirmation-card"`, `data-testid="converted-egp-value"`, and byte-identical payloads.

### Routing, Linting & Test Harness
- **`ProtectedRoute.js`**: Add `'/credit-cards'` to `THEMED_PATTERNS` (`49 -> 50`).
- **`.eslintignore`**: Remove the **8** Phase 9A production-component entries only; retain `AddTransactionModal.currency.test.js` (10 pre-existing lint errors) and the 3 Phase 9B entries.
- **`creditCardsMocks.js`** *(NEW)*: Deterministic 3-card dataset (`18%` neutral/unlabeled, `45%` `Elevated` + 30% alert badge/banner, `82%` `High` + same alert badge/banner; `hasAlerts: true`; 1 standard purchase, 1 installment plan, 1 foreign USD transaction) with full CORS + `OPTIONS` `204` preflight. Wired in `visual.spec.js`, `a11y.spec.js` (with a newly added `window.__VISUAL_TEST__` init script), and the new `credit-cards-reference-match.spec.js` **for `route.slug === 'credit-cards'` only**.
- **Unit & Playwright Tests**:
  - Keep all 4 existing suites green (`14` tests) + add `CreditCardPage.test.js` (`~12`) & `UtilizationWidget.test.js` (`~8`) (`~20` new Jest + jest-axe tests covering KPIs, all 3 utilization tiers, Cards/All selector, D19 mobile cards, modals, viewer `ProtectedAction` + `useCanModify` with explicit no-modal/no-service-call assertions, `0` `[style]`, exact `70%` boundary assertion for `High`, `<progress>` `aria-label`/`aria-valuetext` for all three tiers, neutral error-surface classes, `jest-axe`).
  - Add `frontend/tests/visual/credit-cards-reference-match.spec.js` (`8` specs under `setFixedClock` + `setupCreditCardsMocks`: `/credit-cards` @ 1440px dark canvas/flat KPIs/3-tier severity labels/single primary CTA/Frame 02 modal forms, `/credit-cards` @ 390px D19 mobile cards & `0px` overflow, dual-mode `CreditCardSubNav` active state via `.fs-page` rules, card selector & modal open/close/Escape for Add Card + Log Transaction + Partial Payment, touch targets `>= 44px` & Tab focus-visible). Embed explicit `page.screenshot({ path: ... })` calls **inside the same 8 specs** (resizing/cycling states within a spec) so Gate 11 stays `9 passed` while writing **21 named artifacts** to gitignored `docs/ui-snapshots/phase-9a/` (directory created in-spec, local only per D5 and `§7.4:2150–2159`, **not** baseline manifest entries):
     - Modal/form set (15): `{add-card,log-transaction,partial-payment}-{1440,1024,768,480,390}.png` — satisfies `§7.4:2150–2154`.
     - State set (3): `credit-cards-loading-1440.png`, `credit-cards-empty-1440.png`, `credit-cards-error-1440.png` — satisfies `§7.4:2155`; no unsanctioned deviation remains.
     - Dual-mode shared-component set (2): `cc-subnav-themed-1440.png` (`/credit-cards`, `.fs-page` rules active) and `cc-subnav-legacy-1440.png` (`/credit-cards/statements`, legacy branch active) — satisfies `§4.16:818–822` and `§7.4:2156`.
     - Reference comparison (1): `frame-02-side-by-side.png`, deterministically produced **inside the Frame 02 reference-match spec** (helper page only; no extra test): load `02-form.html` Variant B at `1440×900` from the absolute `file://` URL resolved with `path.resolve(__dirname, '../../../docs/UI-UX_Plan/reference/02-form.html')`, click `Populated` (`02-form.html:405`) so the canonical stacked sub-panels at `:134/:417` are active, capture the reference PNG, then compose that PNG with `add-card-1440.png` into a two-pane `page.setContent()` wrapper and screenshot the wrapper to `frame-02-side-by-side.png` before closing the helper page — satisfies `§7.4:2157` and `walkthrough-template.md:156–158`.
     - Each 390px modal spec must also assert `document.documentElement.scrollWidth === document.documentElement.clientWidth`; element-level `CreditCardSubNav.css:21` scrolling is an inherited exception, not page-level table scroll.

---

## 2. Verification Plan (Gates 0–19 + Taste Checkpoint #7)

Execute sequentially on local branch `phase-ui-9a-credit-cards` (from `main @ 22f4a9f`, starting baseline `7460ca7`). Every gate below carries an explicit PowerShell block with `if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }` where a zero exit is expected. Playwright gates name `--project=a11y|reference|visual|pr-subset` explicitly, and raw stdout is recorded in `phase_9a_walkthrough.md`. **Gates 14 and 15 intentionally exit `1`** because of accepted W-6A-1/AD14/AD16 diffs — their blocks now assert that exact failure count and capture raw stdout; do not treat the nonzero exit as an unexpected failure. Hardcoded `22f4a9f` references denote the Gate 0-verified `git merge-base HEAD origin/main`.

0. **Gate 0**: Branch `phase-ui-9a-credit-cards` from `main @ 22f4a9f`; assert the computed `git merge-base HEAD origin/main` equals `22f4a9f`; tag `ui-phase-9a-start`; commit approved plan + `W-9A-1` and the inherited `CreditCardSubNav.css:21` note in `§7.1:2104` + initial `§10` entry covering Review Items #1–#7, the `§4.3.1:363–364` no-source amendment and §10 label decision, the Option B v8+-re-approval path, the in-place `§6.13:1901` count amendment, the `§6.13:1903` label interpretation, the `§4.3.1:359–360` stale-citation neutral-chip interpretation, the `§6.13:1906` 9A/9B row split, the typography governance note, and the Option A / two-part-checkpoint execution assumption. All subsequent implementation commits are labelled `ui(9a): …` per `§14.1:3065`.
   ```powershell
   git checkout main
   $mergeBase = git merge-base HEAD origin/main
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   if (-not $mergeBase.StartsWith('22f4a9f')) { throw "Gate 0: expected merge base 22f4a9f, got $mergeBase" }
   git checkout -b phase-ui-9a-credit-cards
   git tag ui-phase-9a-start
   git add docs/ui-plans/phase_9a_implementation_plan.md docs/UI-UX_Plan/UI-UX-PLAN.md
   git commit -m "docs(ui-phase-9a): approve plan and gate 0 governance amendments"
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
1. **Gate 1** *(exit-code plus asserted stdout)*: `ui-coverage.js --assert-allowlist` exits `1` on invalid patterns, but `--routes` only warns on count drift, so both raw stdout values are asserted below. Expect **50** patterns (`49 -> 50`) and `75 / 10 / 65 / 0`; record raw stdout.
   ```powershell
   cd frontend
   $allowOut = node scripts/ui-coverage.js --assert-allowlist 2>&1 | Tee-Object -Variable allowLines
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $allowText = ($allowLines | Out-String)
   $allowMatch = [regex]::Match($allowText, '(\d+) pattern\(s\) verified')
   if (-not $allowMatch.Success -or [int]$allowMatch.Groups[1].Value -ne 50) { throw 'Gate 1: expected 50 allowlist patterns' }
   $routeOut = node scripts/ui-coverage.js --routes 2>&1 | Tee-Object -Variable routeLines
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $routeText = ($routeLines | Out-String)
   if ($routeText -notmatch 'Total route entries: 75' -or
       $routeText -notmatch 'Redirects: 10' -or
       $routeText -notmatch 'Rendering routes: 65' -or
       $routeText -notmatch 'Unassigned: 0') { throw 'Gate 1: expected 75 / 10 / 65 / 0 route matrix' }
   ```
2. **Gate 2 — Token drift**: expect `0 drift`.
   ```powershell
   cd frontend; node scripts/tokens.js --check --tables
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
3. **Gate 3 — Test ID & ARIA guard**: expect `0` deletions vs `22f4a9f`.
   ```powershell
   cd frontend; node scripts/testid-guard.js --base 22f4a9f
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
4. **Gate 4 — Semantic tones**: expect `0` violations across `61` page CSS / `64` total CSS; assert the script's own counts in stdout.
   ```powershell
   cd frontend
   $toneOut = node scripts/lint-tones.js 2>&1 | Tee-Object -Variable toneLines
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $toneText = ($toneLines | Out-String)
   if ($toneText -notmatch '61 page CSS files' -or $toneText -notmatch '64 total CSS files') { throw 'Gate 4: expected 61 page / 64 total CSS files' }
   ```
5. **Gate 5 — Ratchet, stylelint, D22, overflow & protected files**: expect `0` ratchet regressions across `63` CSS; stylelint clean on the 3 modified CSS files (**not** `CreditCardSubNav.css`, which is byte-identical); `#14b8a6` only in `tokens.css`; `[data-fs-theme="dark"]` only in `tokens.css`; no loading bypass; **no new `overflow-x` beyond `§7.1:2104`'s documented exceptions plus `W-9A-1` and the pre-existing `CreditCardSubNav.css:21` recorded at Gate 0**; all protected-file diffs empty **except the sanctioned Section 23 append**, with `0` removed lines in `theme-components.css`.
   ```powershell
   cd frontend
   node scripts/lint-ratchet.js --base 22f4a9f
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   npx stylelint "src/pages/credit-cards/CreditCardPage.css" "src/components/creditCards/UtilizationWidget.css" "src/styles/theme-components.css"
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $hexMatches = @(git grep -n '#14b8a6' -- '*.css')
   $hexUnexpected = @($hexMatches | Where-Object { $_ -notlike '*tokens.css*' })
   if ($hexMatches.Count -lt 1 -or $hexUnexpected.Count -ne 0) { throw 'Gate 5: #14b8a6 must appear only in tokens.css' }
   $darkMatches = @(Get-ChildItem -Recurse -Path src -Filter *.css | Select-String -SimpleMatch 'data-fs-theme="dark"')
   $darkUnexpected = @($darkMatches | Where-Object { $_.Path -notlike '*tokens.css*' })
   if ($darkUnexpected.Count -ne 0) { throw 'Gate 5: [data-fs-theme="dark"] must appear only in tokens.css' }
   $loadingMatches = @(git grep -nE '<div>Loading|className="loading-spinner"|custom spinner SVG' -- '*.js')
   if ($loadingMatches.Count -ne 0) { throw "Gate 5: loading bypass found`n$($loadingMatches -join "`n")" }
   git grep -n 'overflow-x' -- '*.css'   # inspect against §7.1:2104 + W-9A-1 + CreditCardSubNav.css:21
   $protected = @(
     "frontend/src/services/creditCardService.js",
     "frontend/src/context/CreditContext.js",
     "frontend/src/utils/formatters.js",
     "frontend/src/App.js",
     "frontend/src/pages/DashboardSummary.js",
     "frontend/src/styles/chartTheme.js",
     "frontend/tests/calculations.spec.js",
     "frontend/package.json",
     "frontend/package-lock.json",
     "backend/routes/creditCards.js",
     "frontend/src/pages/trades/Trades.css",
     "frontend/src/components/Table.css",
     "frontend/src/components/Modal.css",
     "frontend/src/pages/credit-cards/StatementCyclePage.css",
     "frontend/src/pages/credit-cards/DebtPayoffPage.css",
     "frontend/src/pages/credit-cards/ReconciliationPage.css",
     "frontend/src/components/creditCards/CreditCardSubNav.css",
     "frontend/src/components/creditCards/CreditCardSubNav.js",
     "frontend/src/pages/credit-cards/__tests__/AddTransactionModal.currency.test.js"
   )
   $protectedDiff = @(git -C .. diff 22f4a9f -- $protected)
   if ($protectedDiff.Count -ne 0) { throw 'Gate 5: protected-file diff must be empty' }
   $removedThemeLines = @(git -C .. diff --unified=0 22f4a9f -- frontend/src/styles/theme-components.css | Select-String -Pattern '^-' | Where-Object { $_ -notlike '---*' })
   if ($removedThemeLines.Count -ne 0) { throw 'Gate 5: theme-components.css must be append-only' }
   ```
6. **Gate 6 — ESLint & de-ignore**: expect `0` errors / `0` warnings, **0** Phase 9A production-component entries in `.eslintignore`, and exactly **4** retained entries (`AddTransactionModal.currency.test.js` + 3 Phase 9B files). The pre-existing scope is **114 errors + 11 warnings** on the 8 production files plus `ProtectedRoute.js`; **10** of those errors are in the retained `AddTransactionModal.currency.test.js` and are out of scope, while the **11 `jsx-a11y/label-has-associated-control` warnings** (`AddCardModal.js` 4, `EditCardModal.js` 4, `CreditCardPage.js` 1, `PartialPaymentModal.js` 2) are in scope and must be eliminated via explicit `id`/`htmlFor` pairing. `eslint-disable` comments and any re-ignore of a Phase 9A component are forbidden.
   ```powershell
   cd frontend
   npx eslint src/pages/credit-cards/CreditCardPage.js src/pages/credit-cards/CardInstallmentSchedule.js src/pages/credit-cards/AddCardModal.js src/pages/credit-cards/EditCardModal.js src/pages/credit-cards/AddTransactionModal.js src/pages/credit-cards/EditTransactionModal.js src/pages/credit-cards/PartialPaymentModal.js src/components/creditCards/UtilizationWidget.js src/pages/credit-cards/__tests__/CreditCardPage.test.js src/pages/credit-cards/__tests__/UtilizationWidget.test.js src/components/ProtectedRoute.js tests/visual/fixtures/creditCardsMocks.js tests/visual/visual.spec.js tests/visual/a11y.spec.js tests/visual/credit-cards-reference-match.spec.js playwright.config.js --max-warnings=0
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $deignoreMatches = @(git grep -inE '(CreditCardPage|CardInstallmentSchedule|UtilizationWidget|AddCardModal|EditCardModal|AddTransactionModal|EditTransactionModal|PartialPaymentModal)\.js' .eslintignore)
   if ($deignoreMatches.Count -ne 0) { throw "Gate 6: Phase 9A component still ignored`n$($deignoreMatches -join "`n")" }
   $labelSuppressions = @(git grep -nE 'eslint-disable.*label-has-associated-control' -- 'src/**/*.js')
   if ($labelSuppressions.Count -ne 0) { throw "Gate 6: label warnings must be fixed, not suppressed`n$($labelSuppressions -join "`n")" }
   $retainedMatches = @(git grep -nE '(AddTransactionModal\.currency\.test\.js|DebtPayoffPage\.js|ReconciliationPage\.js|StatementCyclePage\.js)' .eslintignore)
   if ($retainedMatches.Count -ne 4) { throw "Gate 6: expected 4 retained .eslintignore entries, got $($retainedMatches.Count)" }
   ```
7. **Gate 7 — Jest & jest-axe**: 6 suites (`14` existing + `~20` new = `~34` tests) green, `0` jest-axe, `0` `[style]`, all 3 utilization tiers + the exact `70%` `High` boundary + alert banner/badge on both alerting cards, explicit viewer guards.
   ```powershell
   cd frontend; $env:CI='true'
   npm test -- src/pages/credit-cards/__tests__/AddTransactionModal.test.js src/pages/credit-cards/__tests__/AddTransactionModal.currency.test.js src/pages/credit-cards/__tests__/EditTransactionModal.test.js src/pages/credit-cards/__tests__/CardInstallmentSchedule.test.js src/pages/credit-cards/__tests__/CreditCardPage.test.js src/pages/credit-cards/__tests__/UtilizationWidget.test.js --watchAll=false --runInBand --verbose
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
8. **Gate 8 — App/Dashboard smoke & line cap**: expect `15/15` and `96` lines.
   ```powershell
   cd frontend; $env:CI='true'
   npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   $lineCount = (Get-Content src/pages/DashboardSummary.js).Count
   if ($lineCount -ne 96 -or $lineCount -gt 120) { throw "Gate 8: DashboardSummary.js line count $lineCount" }
   ```
9. **Gate 9 — Calculation parity (`I3`)**: expect `11/11` across 8 domains incl. Domain 2.
   ```powershell
   cd frontend; npx jest --runInBand tests/calculations.spec.js --forceExit
   if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   ```
10. **Gate 10 — Real-browser axe**: expect **2 passed** (`1 setup + 1 route`), `0` serious/critical.
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test a11y.spec.js --project=a11y -g "a11y check: credit-cards$"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
11. **Gate 11 — Reference match**: expect **9 passed** (`1 setup + 8 specs`), embedding the **21 named `page.screenshot()` artifacts** (15 modal PNGs across `1440/1024/768/480/390px`, 3 state PNGs, 2 dual-mode sub-nav PNGs, and `frame-02-side-by-side.png` generated in-spec by the deterministic recipe in §1) inside those same specs plus the 390px page-level `scrollWidth === clientWidth` assertions, all used as Frame 02 checkpoint evidence.
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test credit-cards-reference-match.spec.js --project=reference
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
12. **Gate 12 — Standalone production build** *(user-authorized local proxy per Review Item #5; authoritative CI on `main`)*: expect `Compiled successfully.` (`2048`MB; scripted `1536`MB retry if Windows semi-space commit limits trigger).
    ```powershell
    cd frontend
    $env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=2048'
    npm run build
    if ($LASTEXITCODE -ne 0) {
      $env:NODE_OPTIONS='--max-old-space-size=1536'
      npm run build
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    ```
13. **Gate 13 — Recapture 5 baselines & manifest**: expect **6 passed** (`1 setup + 5 PNGs`), `334/334` manifest verified, baseline SHA committed.
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="credit-cards @" --update-snapshots
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js --generate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C 'D:\Projects\FinStat-visual-baselines' add -A
    git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 9A: recapture 5 credit-cards route snapshots"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
    ```
14. **Gate 14 — PR-Subset** (`68/71`; `3` pre-existing W-6A-1/AD16 only): capture raw stdout; require Playwright exit `1` plus exactly `68 passed` / `3 failed`, and confirm the three failures are the registered `salary-profile-update`, `analysis-payroll`, and `salary-rules` 1440px diffs.
    ```powershell
    cd frontend; $env:CI='true'; $env:PR_SUBSET='true'
    npx playwright test visual.spec.js --project=pr-subset 2>&1 | Tee-Object -Variable subsetLines
    $subsetExit = $LASTEXITCODE
    if ($subsetExit -ne 1) { throw "Gate 14: expected exit 1 for 3 accepted diffs, got $subsetExit" }
    $subsetText = ($subsetLines | Out-String)
    $subsetPassed = [regex]::Match($subsetText, '(\d+) passed')
    $subsetFailed = [regex]::Match($subsetText, '(\d+) failed')
    if (-not $subsetPassed.Success -or [int]$subsetPassed.Groups[1].Value -ne 68 -or
        -not $subsetFailed.Success -or [int]$subsetFailed.Groups[1].Value -ne 3) {
      throw "Gate 14: expected 68 passed / 3 failed; got`n$subsetText"
    }
    foreach ($title in @('salary-profile-update\s+@\s*1440', 'analysis-payroll\s+@\s*1440', 'salary-rules\s+@\s*1440')) {
      if ($subsetText -notmatch $title) { throw "Gate 14: missing accepted diff $title" }
    }
    ```
15. **Gate 15 — Full 326-test visual suite** (**explicitly user-authorized local run per Review Item #5 — `§15.5:3177` normally prohibits it**): expect Playwright exit `1` with exactly `292 passed` / `34 failed` (`326` accounted), `0` unexplained, `0` 9A diffs, `0` diffs on unthemed 9B routes; mechanically assert all 34 failure titles against the AD14/AD16 register (10 AD14 titles + 24 AD16/W-6A-1 titles), record diff totals, and attach raw stdout before cleaning generated reports.
    ```powershell
    cd frontend; Remove-Item Env:PR_SUBSET -ErrorAction SilentlyContinue; $env:CI='true'
    npx playwright test visual.spec.js --project=visual 2>&1 | Tee-Object -Variable fullLines
    $fullExit = $LASTEXITCODE
    if ($fullExit -ne 1) { throw "Gate 15: expected exit 1 for 34 accepted diffs, got $fullExit" }
    $fullText = ($fullLines | Out-String)
    $fullPassed = [regex]::Match($fullText, '(\d+) passed')
    $fullFailed = [regex]::Match($fullText, '(\d+) failed')
    if (-not $fullPassed.Success -or [int]$fullPassed.Groups[1].Value -ne 292 -or
        -not $fullFailed.Success -or [int]$fullFailed.Groups[1].Value -ne 34) {
      throw "Gate 15: expected 292 passed / 34 failed; got`n$fullText"
    }
    $expectedFailures = @(
      'not-found\s+@\s*768', 'not-found\s+@\s*480', 'not-found\s+@\s*390',
      'dashboard\s+@\s*768', 'dashboard\s+@\s*480',
      'expenditures\s+@\s*768', 'expenditures\s+@\s*480',
      'expenditure-analysis\s+@\s*1024', 'expenditure-analysis\s+@\s*768', 'expenditure-analysis\s+@\s*480',
      'salary-profiles\s+@\s*768', 'salary-profiles\s+@\s*480', 'salary-profiles\s+@\s*390',
      'salary-profile-update\s+@\s*1440', 'salary-profile-update\s+@\s*1024', 'salary-profile-update\s+@\s*768',
      'salary-profile-update\s+@\s*480', 'salary-profile-update\s+@\s*390',
      'salary-paychecks-new\s+@\s*768', 'salary-paychecks-new\s+@\s*480', 'salary-paychecks-new\s+@\s*390',
      'salary-paychecks-edit\s+@\s*768', 'salary-paychecks-edit\s+@\s*480', 'salary-paychecks-edit\s+@\s*390',
      'analysis-payroll\s+@\s*1440', 'analysis-payroll\s+@\s*1024', 'analysis-payroll\s+@\s*768',
      'analysis-payroll\s+@\s*480', 'analysis-payroll\s+@\s*390',
      'salary-rules\s+@\s*1440', 'salary-rules\s+@\s*1024', 'salary-rules\s+@\s*768',
      'salary-rules\s+@\s*480', 'salary-rules\s+@\s*390'
    )
    if ($expectedFailures.Count -ne 34) { throw 'Gate 15: expected 34 AD14/AD16 failure titles' }
    foreach ($title in $expectedFailures) {
      if ($fullText -notmatch $title) { throw "Gate 15: missing accepted AD14/AD16 diff $title" }
    }
    ```
16. **Gate 16 — Touch targets & focus rings**: expect **2 passed**.
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test credit-cards-reference-match.spec.js --project=reference -g "touch targets"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
17. **Gate 17 + Taste Checkpoint #7**: visually inspect all **5** recaptured dashboard PNGs plus all **21** named local artifacts (15 modal PNGs across five widths, 3 state PNGs, 2 dual-mode sub-nav PNGs, and exactly one `frame-02-side-by-side.png`) via `read_file`; resolve any layout defect; record the computed-style conformance table; attach **two-part** checkpoint evidence (dashboard shell/KPI/D19 + Frame 02 Variant B stacked modal forms). All local artifacts live in gitignored `docs/ui-snapshots/phase-9a/` per `§7.4:2150–2159`, are local D5 artifacts, and are **not** baseline manifest entries. All `§7.4` widths and states are evidenced directly; **no screenshot deviation remains**. The walkthrough §3 records the `§7.1` HTML-report substitution note only.
    ```powershell
    $baselineRoot = 'D:\Projects\FinStat\frontend\tests\visual\baseline'
    $expectedBaselines = @('credit-cards-1024.png','credit-cards-1440.png','credit-cards-390.png','credit-cards-480.png','credit-cards-768.png')
    $baseline = @(Get-ChildItem -LiteralPath $baselineRoot -Recurse -File -Filter '*.png' |
      Where-Object { $_.Name -match '^credit-cards-(1440|1024|768|480|390)\.png$' })
    $baselineNames = @($baseline | Select-Object -ExpandProperty Name | Sort-Object)
    if ($baselineNames.Count -ne 5 -or ($baselineNames -join ',') -ne (($expectedBaselines | Sort-Object) -join ',')) {
      throw "Gate 17: expected exactly 5 credit-cards baselines; got $($baselineNames -join ',')"
    }
    $baseline | Select-Object FullName, Length
    $snapshotDir = 'D:\Projects\FinStat\docs\ui-snapshots\phase-9a'
    $expected = @(
      'add-card-1440.png','add-card-1024.png','add-card-768.png','add-card-480.png','add-card-390.png',
      'log-transaction-1440.png','log-transaction-1024.png','log-transaction-768.png','log-transaction-480.png','log-transaction-390.png',
      'partial-payment-1440.png','partial-payment-1024.png','partial-payment-768.png','partial-payment-480.png','partial-payment-390.png',
      'credit-cards-loading-1440.png','credit-cards-empty-1440.png','credit-cards-error-1440.png',
      'cc-subnav-themed-1440.png','cc-subnav-legacy-1440.png',
      'frame-02-side-by-side.png'
    )
    if ($expected.Count -ne 21) { throw 'Gate 17: expected 21 local artifacts' }
    foreach ($name in $expected) {
      $file = @(Get-ChildItem -LiteralPath (Join-Path $snapshotDir $name) -ErrorAction SilentlyContinue)
      if ($file.Count -ne 1 -or $file[0].Length -lt 1000) { throw "Gate 17: missing or undersized artifact $name" }
    }
    $sideBySide = @(Get-ChildItem -LiteralPath $snapshotDir -File -Filter 'frame-02-side-by-side.png' -ErrorAction SilentlyContinue)
    if ($sideBySide.Count -ne 1 -or $sideBySide[0].Length -lt 1000) { throw 'Gate 17: expected exactly one frame-02-side-by-side.png >= 1000 bytes' }
    Get-ChildItem -LiteralPath $snapshotDir -File -Filter '*.png' | Select-Object FullName, Length
    ```
18. **Gate 18 — Dual-Mode SubNav & Unthemed Phase 9B / Trades Consumer Regression Check**: expect **41/41 passed** (`1 setup + 5 credit-cards captures + 15 unthemed 9B captures [3 routes × 5 widths] + 20 trades captures [4 routes × 5 widths]`), proving byte-identical `CreditCardSubNav.css` dual-mode and `Trades.css` decoupling leave all consumers pixel-identical. The trailing ` @` keeps `credit-cards-*` unthemed slugs out of the `credit-cards` branch; explicit slugs are listed ahead of `trades`.
    ```powershell
    cd frontend; $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="(credit-cards|credit-cards-statements|credit-cards-debt-payoff|credit-cards-reconcile|trades-add|trades-edit|trade-summary|trades) @"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
19. **Gate 19 — Walkthrough & Merge Boundary**: Author `docs/ui-plans/phase_9a_walkthrough.md` satisfying `walkthrough-template.md §1–§5` plus the 8C–8E header-ledger, §0 Approved Decisions, and §6 post-sign-off checklist precedent. It must contain:
    - **Header ledger**: date, status, branch, merge base `22f4a9f`, Gate 0 Plan & Governance SHA, Implementation SHA, Walkthrough SHA, starting baseline `7460ca7`, Gate 13 baseline commit, and `334/334` manifest verification.
    - **§0**: Review Items #1–#7 with explicit option letters/approvals; `§4.3.1` no-source amendment; `§6.13:1906` row split; typography governance; `W-9A-1`; local Gate 12/15 authorizations; acceptance of the two-part Checkpoint #7 evidence.
    - **§1**: all template Progress Log fields (Sub-phase, Status, Done, Next, Blocked by, Allowlist, Visual diff, Fixtures, Screenshots, Branch, Merge SHA).
    - **§2**: verbatim `I1–I16` compliance table with gate references.
    - **§3**: visual diff report with `(a)` 326 totals, `(b)` 292 zero-diff, `(c)` accepted-diff breakdown — 3 W-6A-1/AD16 pr-subset diffs (`salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440`) and 34 full-suite AD14/AD16 diffs — `(d)` 0 unexplained / 9A-attributable / 9B diffs, plus manifest output and `§7.1` HTML-report substitution disclosure.
    - **§4**: gate-evidence table for Gates 0–18 with commands, raw stdout (including Gate 1 counts and Gate 14/15 `Tee-Object` output), counts, the `§15.3` fallback chain, and the authorized `§15.5` local full-suite deviation.
    - **§5**: Gate 17 inspection log for 5 baselines + 21 local artifacts, computed-style conformance table, artifact-integrity assertions, two-part evidence (dashboard shell/KPI/D19 + Frame 02 Variant B stacked modal forms), and **explicit Review Item #7 acceptance**; no `§7.4` deviation remains.
    - **§6**: post-sign-off checklist — governance sync in §3 below, `--no-ff` merge to `main`, push only `main`, verify post-merge CI, and clean `frontend/test-results/`, `frontend/playwright-report/`, and any `*review*.md`.
    Commit on local `phase-ui-9a-credit-cards` and **STOP** awaiting explicit **Gate 19 + Taste Checkpoint #7** user sign-off before governance sync, `--no-ff` merge to `main`, and push `main`.

---

## 3. Governance Synchronization (Post-Sign-Off Only — Aside from Gate 0 Prerequisites)

> [!IMPORTANT]
> Feature branch `phase-ui-9a-credit-cards` stays local per §14/§10; only `main` is pushed, and only after explicit user sign-off on `phase_9a_walkthrough.md`.

1. `UI-UX-PLAN.md` **§5.8 (:945)**: mark `/credit-cards` themed & QA'd (`☑ | ☑`); record `70` inline styles purged to `0`, `57` hex literals removed, 3-tier utilization severity, neutral transaction/installment chips, D19 mobile cards, `W-9A-1`, and byte-identical dual-mode `CreditCardSubNav`.
2. `UI-UX-PLAN.md` **§6.1 (:1070)**: mark Phase **9A** complete (`☑ | ☑`).
3. `UI-UX-PLAN.md` **§6.13 (:1899–1910)**: check **12/12** 9A items after Gate 0 split `:1906` into a 9A credit-card-table row (closed) and a 9B/9C statement/lending-ledger row (deferred); no 9A row remains open per `§0.0:127`. Record the selected utilization option, Gate 0 provenance/amendment SHAs, the amended `:1901` entry (`14 hex literals / 14 inline styles per §8.2:2223`, with `§8.2:2223` corrected from `15` to `14` at Gate 0), the `:1903` interpretation (tone-bearing tiers only; `0 <= x < 30%` neutral/unlabeled), the stale `§4.3.1:359–360` citation interpretation, the typography governance decision, and the explicit `30 <= x < 70` / `x >= 70` boundary. Taste Checkpoint #7 signed off on the two-part evidence: 5 dashboard PNGs + 21 local artifacts (15 modal PNGs across five widths, 3 state PNGs, 2 dual-mode sub-nav PNGs, and `frame-02-side-by-side.png`).
4. `UI-UX-PLAN.md` **§7.1 (:2104)**: retain `W-9A-1` and the recorded `CreditCardSubNav.css:21` inherited exception; no new `overflow-x` elsewhere.
5. `UI-UX-PLAN.md` **§8.1/§8.2 (:2165–2231)**: acknowledge `64` total / `61` page CSS files unchanged (no net new CSS; `CreditCardSubNav.css` untouched); correct `§8.2:2223`'s `PartialPaymentModal` count from `15` to `14`, mark credit-card inline-style rows purged to `0`, and note `AddTransactionModal.currency.test.js` stays ignored pending separate lint remediation.
6. `UI-UX-PLAN.md` **§10**: finalize the Phase 9A progress log using the `walkthrough-template.md:10–24` field names plus the 8C–8E header-ledger SHA fields (`Gate 0 Plan & Governance SHA`, `Implementation SHA`, `Walkthrough SHA`, `Merge SHA`), starting baseline `7460ca7` and Gate 13 SHA, `~34` Jest tests, `11/11` calculations parity, `5` recaptured PNGs (`334/334` manifest) + **21** local D5 artifacts (15 modal PNGs across five widths, 3 state PNGs, 2 dual-mode sub-nav PNGs, and `frame-02-side-by-side.png`), Gate 14 `68 passed + 3 accepted`, Gate 15 `292 passed + 34 accepted`, Gate 18 `41/41`, `49 → 50` allowlist, Review Items #1–#7 selections, local Gate 12/15 authorizations, `§7.1` report substitution, post-merge CI verification, and confirmation that no `§7.4` deviation remains.
7. `docs/ui-plans/phase_9a_implementation_plan.md` and `docs/ui-plans/phase_9a_walkthrough.md` (`Status: Complete`, final SHAs/sign-off date); remove any `*review*.md` from `docs/ui-plans/`.
8. Update `CHANGELOG.md` announcing **AD13** correctly — ordinary credit-card amounts neutral, no red/green rows per master `§6.6:1585` / `§7.2:2132` — plus the separate `THEMED_PATTERNS` allowlist expansion `49 → 50` and the three-tier utilization severity labels.
9. Merge `phase-ui-9a-credit-cards` into `main` with `--no-ff`, push only `main`, verify CI build and visual gates on `main`, then clean `frontend/test-results/`, `frontend/playwright-report/`, and temporary review artifacts.

---

## User Review Required

> [!IMPORTANT]
> Please confirm these **seven items** before Phase 9A execution begins:
> 1. **Utilization Severity Thresholds (`UtilizationWidget.js:25–29` vs `§4.3:331` / `§4.3.1:363–364` / `§6.13:1903`)**:
>    - Legacy `UtilizationWidget.js` hardcodes `>= 50%` red, `>= 30%` amber, `< 30%` green (`#10b981`), whereas `§4.3`/`§4.3.1`/`§6.13:1903` require `0 <= x < 30%` neutral unlabeled, `30 <= x < 70%` `.fs-progress--warning` + `Elevated`, and `x >= 70%` `.fs-progress--negative` + `High`.
>    - **Option A (Recommended — Strict Master Plan `§4.3` / `§6.13:1903`)**: Align `UtilizationWidget.js` to the canonical `§4.3.1` thresholds (`0 <= x < 30%` neutral unlabeled; `30 <= x < 70%` `Elevated`; `x >= 70%` `High`), recording the two label additions and exact 70% boundary in `§10` per `§4.3.1:371` because live code has no such source, while keeping backend `c.isAlert` / `c.threshold` (30%) and all calculations intact per `I2`/`I3`.
>    - **Option B**: Preserve legacy `>= 50%` high threshold (`30–50%` `Elevated`, `>= 50%` `High`); requires a plan revision to v8+ and re-approval **before** Gate 0, after which Gate 0 amends **`§4.3:331`, `§4.3.1:363–364`, and `§6.13:1903`**.
>    - **Both options**: authorize the Gate 0 amendment of `§4.3.1`'s source cell to “No pre-existing source — 30/70 thresholds and `Elevated`/`High` labels mandated by Gate 0 §10 decision,” recording legacy `UtilizationWidget.js:25–29` (`>= 50%` / `>= 30%`, colour-only) as superseded implementation, not evidence.
> 2. **Legacy `useCanModify()` Destructuring Bug (`CreditCardPage.js:24`)**:
>    - `CreditCardPage.js:24` writes `const canModify = useCanModify();`, making `if (!canModify) return;` inert at lines `139`, `161`, `167`, `173`.
>    - **Option A (Recommended)**: Authorize a scoped Gate 0 defensive fix `const { canModify } = useCanModify();` with viewer-role Jest coverage proving no full-payment, partial-payment, edit, or delete modal opens and no service call fires (zero visible `ProtectedAction` wrapper changes), matching Phase 8D/8E precedent.
>    - **Option B**: Leave line 24 untouched for strict literal `I4`.
> 3. **Waiver `W-9A-1` and Inherited Sub-Nav Overflow**:
>    - Approve recording Waiver **`W-9A-1`** in `§7.1:2104` at Gate 0 for `.cc-dashboard-page .cc-table-wrap { overflow-x: auto; }` at `> 768px` (hidden at `<= 768px` in favor of D19 compact-expand mobile cards with `0px` page overflow at `390px`), and recording the pre-existing `CreditCardSubNav.css:21` `overflow-x: auto` as an inherited baseline exception (that file stays byte-identical in 9A per `§4.16`).
> 4. **`.eslintignore` De-Ignore Scope (8 production files)**:
>    - Confirm removing the **8** Phase 9A production-component entries (`UtilizationWidget.js`, `CreditCardPage.js`, `CardInstallmentSchedule.js`, all 5 modals) while **retaining** `AddTransactionModal.currency.test.js` (10 pre-existing `testing-library/no-wait-for-multiple-assertions` errors; `§6.13:1909` only requires component files) and the 3 Phase 9B entries. The **11** in-scope `jsx-a11y/label-has-associated-control` warnings must be fixed via `id`/`htmlFor` pairing; no `eslint-disable` suppression or re-ignore is permitted.
> 5. **Local Gate 12 (`2048`MB / `1536`MB fallback) & Full 326-Test Gate 15**:
>    - Authorize the local standalone build and the full 326-test visual suite per Phase 8A–8E precedent, noting that `§15.5:3177` otherwise prohibits the full local visual run and the authoritative build remains CI on `main`. Unlike Phase 8A's documented batched-run deviation, Phase 9A commits to the full **21-artifact** §7.4 set and **no silent screenshot deviation**; any inability to execute it requires a plan revision before Gate 11/15, not an ad hoc fallback.
> 6. **Retained `$` Formatter (`I3`)**:
>    - Confirm retaining `frontend/src/utils/formatters.js` (`$`) unchanged per `I3`, with EGP-labelled fields continuing to call `formatCurrency()` as today.
> 7. **Taste Checkpoint #7 Two-Part Evidence**:
>    - Approve the checkpoint comparison against Reference Frame 2 Variant B as two-part evidence: the 5 recaptured `/credit-cards` dashboard PNGs for shell/KPI/D19 treatment plus 15 modal PNGs across `1440/1024/768/480/390px`, 3 state PNGs (`loading`, `empty`, `error`), 2 dual-mode sub-nav PNGs, and `frame-02-side-by-side.png` for the Frame 02 stacked-form comparison. All 21 local artifacts stay in gitignored `docs/ui-snapshots/phase-9a/` per D5/`§7.4`; no screenshot deviation remains.
>    - Explicitly accept this substitution for Gate 19 / Taste Checkpoint #7 sign-off; rejection requires a plan revision (v8+) and re-approval **before** Gate 0. Phase 9B does not start until this item is signed off per `§6.1.1:1089`.
>
> **Execution note**: Gates 4–18 are written for **Option A** on items 1 and 2 and for acceptance of the two-part evidence under item 7. Option B for item 1/2, or rejection of the two-part evidence, requires a plan revision to v8+ and re-approval before Gate 0; the gates do not silently reinterpret the plan. The 21 named artifacts are captured across `1440/1024/768/480/390px` into gitignored `docs/ui-snapshots/phase-9a/` per `§7.4`, with no narrowed screenshot deviation.
