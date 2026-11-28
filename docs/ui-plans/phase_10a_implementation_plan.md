# UI Phase 10A — Profile, Settings & Recycle Bin — Implementation Plan

- **Date**: 2026-11-28
- **Revision**: **v5** — incorporates first-review findings (Decision 1 Option A only, `.fs-num` / mono-identifier typography, full I1–I16 compliance map, protected-files list, Gate 0 governance amendments, corrected Gate commands and sequencing, exact Gate 14/15/18 assertions, Gate 13 baseline-SHA assertion, expanded cross-route CSS collision audit, explicit §7.4 artifact inventory, and Gate 19 walkthrough authoring spec), second-review corrections (AD14/AD16-only Gate 15 diff scope, script-path fixes, explicit protected-file pathspec, global-profile-mock ordering, walkthrough fixture/screenshot ledger, and Checkpoint #8 sign-off timing), third-review corrections (Section 25 `.fs-page` specificity + active-hover guard, Gate 8 three-suite command with correct Dashboard test path and line-cap assertion, Gate 6 modified `visual.spec.js`/`a11y.spec.js` coverage, restored Gate 16 Touch Targets & Focus Rings, §7.4 loading/error artifacts with a `31`-PNG ledger, and Gate 5 append-only/overflow-x/raw-hex/byte-identical-fixture guards), and fourth-review corrections (complete Gate 13 `--generate` + baseline-repo commit workflow with exact `16 passed` / `15`-filename / `334/334` / `0`-net-new assertions, four collision-source CSS files added to the protected list and Gate 5 pathspec, full APG `role="tab"` / `aria-selected` / panel `aria-labelledby` contract, CRA-compatible `react-scripts test` commands, deterministic forced-error mocks with visible-toast assertions for all three error artifacts, embedded Gate 14/15 `Tee-Object` assertion blocks with exact `3`- and `34`-title arrays, basename-only Gate 11 spec path, explicit static-build serving harness and pre-authorized `1536`MB fallback, Gate 18 `12`-slug arithmetic, two-stage Gate 19 walkthrough header/ledger with HTML-report substitution disclosure and artifact-to-spec mapping, condensed-invariant-table label, I5 mobile-DOM resolution, and explicit final `else if` mock wiring)
- **Phase**: `10A` (Cluster 10 start — Account, Security, Admin)
- **Branch**: `phase-ui-10a-profile-settings` *(tag `ui-phase-10a-start`; local branch policy per §14/§10; only `main` is pushed after Gate 19 user sign-off)*
- **Merge Base**: `main` @ `3f42b4f`
- **Starting Baseline Commit**: `5db8c61` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified; carried from Phase 9C)
- **Routes Allowlisted (`+3`, `THEMED_PATTERNS` `56 -> 59`)**:
  - `/profile` (`frontend/src/pages/profile/ProfilePage.js`, slug `profile`)
  - `/settings` (`frontend/src/pages/profile/SettingsPage.js`, slug `settings`)
  - `/settings/recycle-bin` (`frontend/src/pages/profile/RecycleBin.js`, slug `settings-recycle-bin`)
- **Taste Checkpoint**: **Checkpoint #8** (§6.1.1:1101) — `/profile` compared against **Reference Frame 02 (Variant B — Two-Column Form)** (`docs/UI-UX_Plan/reference/02-form.html`). No later sub-phase starts until signed off at Gate 19.
- **Waivers Requested**: **0** (all tables collapse to D19 compact-expand cards at `≤ 768px`; `0` `overflow-x`; `0` tone tokens in page CSS; `0` gradients/blurs/glows). The retained ignored `RecycleBin.test.js` is a pre-existing ESLint exception, not a waiver.
- **Status**: `Complete — Gate 19 + Checkpoint #8 Signed Off (2026-11-28)`

---

## Goal Description

Phase 10A converts the three account-management routes (`/profile`, `/settings`, `/settings/recycle-bin`) into FinStat's dark graphite design system under D22 attribute-existence scoping (`html[data-fs-theme]`), establishes the visual baseline for Cluster 10, and passes **Taste Checkpoint #8** (`/profile` vs Reference Frame 02 Variant B). On completion, the allowlist reaches `59`; Phase 10B adds `1` and Phase 10C adds `4`, yielding the Phase 10 exit state of `64 of 65` rendering routes (Landing excepted).

---

## 0. Verified Codebase Audit & Architectural Decisions

1. **CSS violations (`86` Stylelint errors across 3 files)**:
   - `ProfilePage.css` (198 lines): white `#ffffff` cards, `rgba()` shadows, `#2c3e50` / `#6c757d` text, `#e8f5e9`/`#009879` and `#e3f2fd`/`#1976d2` icon bubbles, `20px` role-pill radius, unscoped `.profile-card`, `.form-input`, `.form-label`.
   - `SettingsPage.css` (120 lines): white `#ffffff` cards, `12px`/`10px` radii, `rgba()` shadows, `#3498db` blue radio/icon/callout wash, `#ebf5fb`/`#1d4ed8` info box.
   - `RecycleBin.css` (133 lines): legacy `--card-bg`/`#ffffff` fallback hexes, `12px` radius, `rgba()` shadow, `#3b82f6` active-tab blue, `#ecfdf5`/`#065f46` green restore button, no D19 mobile-card layout at `≤ 768px`.
2. **JSX inline styles & ESLint audit (`22` problems: `7` errors, `15` warnings across 4 files)**:
   - `ProfilePage.js` (`.eslintignore:23`): **8** inline `style={{...}}` (2 colour-bearing hex in ad-hoc `<RefreshCw>` loading block + 6 layout/padding), **12** `jsx-a11y/label-has-associated-control` warnings (missing `htmlFor`/`id` on all 12 form fields).
   - `SettingsPage.js` (`.eslintignore:24`): **9** inline `style={{...}}` (1 colour-bearing `#2980b9` on `HelpCircle` + 8 layout), **3** `jsx-a11y/label-has-associated-control` warnings on the 3 cost-basis radio cards, ad-hoc `<p>Loading application settings...</p>` loading block.
   - `RecycleBin.js` (not in `.eslintignore`): **1** inline `style={{...}}` (`Back to Settings` link), ad-hoc `<div className="recycle-bin-empty">Loading soft-deleted records...</div>` loading block; already `0` ESLint errors/warnings.
   - `RecycleBin.test.js` (`.eslintignore:25`): **1** pre-existing ESLint error (`line 117`: `testing-library/no-wait-for-multiple-assertions`); `10/10` Jest tests pass byte-identically. Retained ignored under Decision 2 Option A.
3. **Cross-route CSS collision audit (expanded beyond `.profile-card`)**: allowlisting adds `.fs-page` to `<main>` (`ProtectedRoute.js:195–200`), which activates every existing `.fs-page ...` selector. The following collisions are audited and explicitly overridden in the three page CSS files:
   - `frontend/src/pages/salary/SalaryProfile.css:17–18` — `.fs-page .profile-card { max-width: 900px; margin: 0 auto 2rem auto; ... }`.
   - `frontend/src/styles/theme-components.css:771–860` — `.fs-page .form-group*` (label, input, select, textarea, focus, placeholder, disabled, error states).
   - `frontend/src/pages/salary/PaycheckFormPage.css:126–176` — `.fs-page .form-input`, `.fs-page .form-label`.
   - `frontend/src/pages/expenditure/Expenditure.css:634–667` — `.fs-page .page-header`.
   - `frontend/src/pages/salary/SalaryProfile.css:191` — `.fs-page .section-title`.
   - `frontend/src/pages/expenditure/RecurringBills.css:122` — `.fs-page .form-group`.
   - `frontend/src/App.css:174–190` — global `.btn-secondary` legacy neutral button; the new `fs-btn fs-btn-secondary` utility must win with the tokenized `--fs-surface-raised` / `--fs-border-control` appearance.
   Each collision is asserted by computed-style checks in the reference-match spec (Gate 11) and visual inspection (Gate 17).
4. **Typography contract (§4.5:444, §7.2:2131)**: figures use `--fs-font-sans` + `font-variant-numeric: tabular-nums` via `.fs-num` (`theme.css:196–200`). Mono (`.fs-mono` / `.fs-code`) is reserved for identifiers only. Therefore:
   - `.fs-num`: profile `dateOfBirth`, `phone`; all Recycle Bin amounts, Total Value, dates, and deleted-at values.
   - `.fs-mono`: `nationalId`, `employeeId` only.
   - Playwright asserts computed `font-family` and `font-variant-numeric` for both classes; no other mono usage is introduced.
5. **Interactive accent (§4.3.2:380)** follows 9B precedent: checked radio, active tab indicator, and single primary CTA use `--fs-accent`; text on accent uses `--fs-ink`. Page CSS never references `var(--fs-accent)`. Section 25 selectors are written as `html[data-fs-theme] .fs-page .settings-page ...` so they out-specify the `.fs-page`-scoped page rules, and the hover rule excludes `.active` so an active card under hover keeps the accent border. Decision 1 Option B (neutral-only checked radio) is withdrawn because it would require a §4.3.2 amendment/waiver.
6. **Tabs**: the existing `<Tabs>` primitive (`components/ui/Tabs.js`) implements APG keyboard navigation but does not expose per-tab `data-testid`. Because I5 forbids deleting `tab-expenditures` / `tab-trades`, Recycle Bin retains manual `fs-tabs`/`fs-tab` markup and must implement the same APG contract: `role="tablist"`, `aria-label`, `aria-orientation="horizontal"`, `role="tab"` on each button, `id="recycle-tab-..."`, `aria-selected={active}`, `aria-controls`, roving `tabIndex={active ? 0 : -1}`, ArrowLeft/ArrowRight/Home/End/Enter/Space handling mirroring `Tabs.js:34–93`, and matching `role="tabpanel"` regions carrying `aria-labelledby` back to their tab IDs. Gate 11, Gate 16, and `ProfileSettingsA11y.test.js` assert these attributes, not just the keyboard handlers.
7. **Deterministic Playwright mocks** (`frontend/tests/visual/fixtures/profileSettingsMocks.js`): full CORS + `OPTIONS 204` preflight covering `GET/PUT /api/users/profile`, `GET /api/expenditures/deleted*`, `GET /api/trades/deleted*`, and `POST /api/expenditures/*/restore` / `POST /api/trades/*/restore`. Deterministic data: 2 deleted expenditures and 1 deleted trade. Provide an error-mode switch (e.g. `setupProfileSettingsMocks(page, slug, { error: true })`) that forces the existing `addToast` / `notify(..., 'error')` path for each of the three routes so the §3.7 error artifacts are reproducible. Wire `setupProfileSettingsMocks(page)` as the **final `else if` branch** after the `lending` branch in the ordered chains in `visual.spec.js` and `a11y.spec.js`, strictly for the three 10A slugs; never register it globally. `paycheckMocks.js:238` contains a `**/api/users/profile**` route returning `{ salaryDeductionConfig: {} }`, but `setupPaycheckMocks` is invoked only for salary slugs (`visual.spec.js:67–74`, `a11y.spec.js:39–46`), so there is **no live collision** on the three 10A slugs. Keep `paycheckMocks.js` byte-identical and protected. No salary or other route baseline is affected.
8. **Reference Frame 02 fidelity and I2-driven deviations**: adopt the sunken page header (`--fs-surface-sunken`, title `20px/600`, subtitle `13px/--fs-text-3`), stacked `--fs-surface-raised` section cards, 2-column field grid at desktop / 1-column at `≤ 768px`, and a sunken `.form-actions` footer. The live pages deliberately differ from the frame in four I2-governed ways, recorded at Gate 0 and in walkthrough §0: no avatar image, no Discard/cancel button, no inline per-field error state, and toast feedback instead of a success banner. No features are invented.
9. **Mixed-file hook precedent**: guarded `window.matchMedia('(max-width: 768px)')` state in `RecycleBin.js` adds a hook to a mixed logic file. This is explicitly accepted at Gate 0 per the Phase 9C precedent (`phase_9c_implementation_plan.md:39–44`): initial `false` when `matchMedia` is absent in jsdom, `change` listener added on mount and removed on unmount, so existing `10/10` table assertions remain byte-identical.
10. **No tone decisions**: ordinary amounts, dates, phone, and status-neutral chips stay neutral. No new §4.3.1 provenance row is needed.

### Target Production Files

- `frontend/src/pages/profile/ProfilePage.js`, `ProfilePage.css`
- `frontend/src/pages/profile/SettingsPage.js`, `SettingsPage.css`
- `frontend/src/pages/profile/RecycleBin.js`, `RecycleBin.css`
- `frontend/src/styles/theme-components.css` *(append Section 25 only)*
- `frontend/src/components/ProtectedRoute.js` *(allowlist only)*
- `frontend/.eslintignore` *(remove Profile/Settings entries only)*
- `frontend/tests/visual/fixtures/profileSettingsMocks.js` *(new)*
- `frontend/tests/visual/visual.spec.js`, `a11y.spec.js`, `playwright.config.js` *(mock/spec registration only)*
- `frontend/tests/visual/profile-settings-reference-match.spec.js` *(new)*
- `frontend/src/pages/profile/__tests__/ProfilePage.test.js`, `SettingsPage.test.js`, `ProfileSettingsA11y.test.js` *(new)*

### Protected Files (Strictly Untouched — Verified via `git diff 3f42b4f`)

`frontend/src/services/userService.js`, `frontend/src/services/apiClient.js`, `frontend/src/utils/formatters.js`, `frontend/src/App.js`, **`frontend/src/App.css`**, **`frontend/src/pages/salary/SalaryProfile.css`**, **`frontend/src/pages/salary/PaycheckFormPage.css`**, **`frontend/src/pages/expenditure/Expenditure.css`**, **`frontend/src/pages/expenditure/RecurringBills.css`**, `frontend/src/pages/DashboardSummary.js`, `frontend/src/styles/chartTheme.js`, **`frontend/src/styles/theme.css`**, **`frontend/src/styles/tokens.json`**, **`frontend/src/styles/tokens.css`**, `frontend/src/components/common/ConfirmModal.js`, `frontend/src/components/common/ConfirmModal.css`, `frontend/src/components/ui/Tabs.js`, **`frontend/src/pages/profile/__tests__/RecycleBin.test.js`**, **`frontend/tests/visual/fixtures/paycheckMocks.js`**, `frontend/tests/calculations.spec.js`, `frontend/package.json`, `frontend/package-lock.json`, and all backend route/controller/schema files. The four bolded collision-source CSS files are added because §0:3 depends on their selectors remaining byte-identical; they are covered by the Gate 5 protected-file pathspec alongside `App.css`. `theme-components.css` is append-only: existing lines must remain byte-identical and only Section 25 may be added.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 10A Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` expands `56 → 59` adding `/profile`, `/settings`, `/settings/recycle-bin`. | Gate 1 & Gate 8 |
| **I2** | `userService.js`, `apiClient.js`, backend user/profile routes, and all API payloads byte-identical; mocks are test fixtures only; I2-driven Frame 02 deviations recorded. | Gate 5 & Gate 7 |
| **I3** | Zero calculation changes; `formatCurrency()` (`$`) retained; `calculations.spec.js` `11/11` green. | Gate 7 & Gate 9 |
| **I4** | Viewer-role UI unchanged; `<ProtectedAction>` restore gating and `<ConfirmModal variant="primary">` intact. | Gate 7 |
| **I5** | Zero deletion of existing `data-testid` (`link-recycle-bin`, `recycle-bin-page`, `tab-expenditures`, `tab-trades`, `empty-recycle-bin`, `deleted-items-table`, `deleted-row-${id}`, `restore-btn-${id}`) or `aria-label`; APG tab IDs/labels added, not substituted. | Gate 3 & Gate 7 |
| **I6** | Recycle Bin table collapses to D19 compact-expand cards at `≤ 768px` via guarded `matchMedia`; `0px` overflow at `390px`; `0` `overflow-x` in all 3 page CSS files; zero new waivers. | Gate 5, Gate 11 & Gate 17 |
| **I7** | All 3 account routes convert atomically in one local branch; Cluster 10 starts at `59` patterns. | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` remains `96` lines (`≤ 120`); App/Dashboard/ProtectedRoute suites green — `3` suites / `21` tests (`9 + 6 + 6`). | Gate 8 |
| **I9** | Local standalone `2048`MB build (`1536`MB fallback) clean; authoritative CI on `main`. | Gate 12 |
| **I10** | Untouched `RecycleBin.test.js` `10/10` + new `ProfilePage`, `SettingsPage`, `ProfileSettingsA11y` Jest/`jest-axe` suites green in-band. | Gate 7 & Gate 8 |
| **I11** | `0` `!important` in the 3 rewritten page CSS files; `lint-ratchet.js --base 3f42b4f` `0` regressions. | Gate 5 |
| **I12** | `frontend/package.json` & lockfile untouched. | Gate 5 |
| **I13** | Gate 18 proves `0` diffs on all `7` Cluster 9 routes and all `5` unthemed 10B/10C routes (`12` slugs × `5` widths = `60` captures + `1` setup = `61 passed`); Gate 15 proves `0` unexplained diffs (`34` registered AD14/AD16 diffs only) and `0` diffs on all 10A routes (against new Gate 13 baselines), Cluster 9, 10B, 10C, and Landing. | Gates 15 & 18 |
| **I14** | `0` gradients, blurs, glows, arbitrary shadows, `mask`, `border-image`, or radius longhands. | Gate 5, Gate 6 & Gate 11 |
| **I15** | Neutral by default; figures `.fs-num` (Plex Sans + tabular), mono only for `nationalId`/`employeeId`; accent only on primary CTA, checked radio, and active tab; `0` tone tokens in page CSS/JSX; `lint-tones.js` `0` violations. | Gate 4, Gate 7 & Gate 11 |
| **I16** | Radii `≤ 8px` (`--fs-radius-sm/md/lg`); `--fs-radius-pill` only on `<Badge>`, never buttons. | Gate 5 & Gate 11 |

---

## 2. User Review Required

> [!IMPORTANT]
> Please confirm these **four decisions** before Phase 10A execution begins. v2 applies the recommended technical path; each item still requires explicit approval at Gate 0.

> 1. **Decision 1 — Settings Active Radio Card Accent (Option A only)**:
>    Add the 3 rules as **`theme-components.css` Section 25** after the Phase 9B Section 24 block (`theme-components.css:2287–2301`), scoped to `html[data-fs-theme] .fs-page .settings-page`. The `.fs-page` segment is required: the page CSS is also `.fs-page`-scoped, and equal specificity would let the later page rule override the accent border. This is the only path compliant with §4.3.2:380 (checked radio uses accent). `SettingsPage.css` must not declare `border-color` on `.method-option.active` and its hover rule must exclude `.active` (`.method-option:not(.active):hover`), so an active card under hover keeps the accent border. Computed-style assertions cover active and active+hover. **Option B (neutral-only checked radio) is withdrawn**; it would require a §4.3.2 amendment/waiver, and waivers are `0`.

> 2. **Decision 2 — Retain `RecycleBin.test.js` Ignored (Option A only)**:
>    Keep `RecycleBin.test.js` byte-identical (`10/10` passing) in `.eslintignore:25` due to its pre-existing `testing-library/no-wait-for-multiple-assertions` error. Remove only `ProfilePage.js` and `SettingsPage.js` from `.eslintignore`; add new clean Jest suites with `--max-warnings=0`. Gate 0 records this as a pre-existing exception under §7.1/§7.2, not a new waiver. Option B (editing the test) is withdrawn to preserve I5 and the untouched suite.

> 3. **Decision 3 — Gate 0 Live-Scope Clarifications (§6.14, I2)**:
>    Record at Gate 0: (a) stale `SettingsPage.js (6)` at `UI-UX-PLAN.md:1947` → live `9` inline styles; (b) `RecycleBin.js` is not actually in `.eslintignore` despite `UI-UX-PLAN.md:1952` (only the test file is); (c) no permanent purge modal and no audit-log table in 10A — audit logs belong to Phase 10C `AdminDashboard.js`; (d) no avatar, no cancel/Discard button, no inline error state, and toast instead of a success banner are I2-driven Frame 02 deviations; (e) guarded `matchMedia` in `RecycleBin.js` is accepted mixed-file precedent; (f) no sortable `<th>` or checkbox is introduced in the Recycle Bin table, so the §7.2:2121 sort-header/checked-state clause is not applicable.

> 4. **Decision 4 — 0 Waivers, But Authorize Local Build and Full Visual Suite (§15.5)**:
>    Confirm `0` waivers and explicitly authorize the local standalone `2048`MB build with the pre-authorized `1536`MB fallback (Gate 12; record the heap size that actually succeeded in the Gate 19 ledger) and the full `326`-test visual run (Gate 15) with raw stdout capture and the exact `34`-title AD14/AD16 assertion. §15.5 otherwise prohibits both without approval. CI on `main` remains authoritative.

---

## 3. Proposed Changes

### 3.1 Gate 0 — Branch Setup & Governance Pre-Execution Sync

- Create branch `phase-ui-10a-profile-settings` from `main` (`3f42b4f`) and tag `ui-phase-10a-start`.
- Save the approved plan copy to `docs/ui-plans/phase_10a_implementation_plan.md`.
- Assert baseline-repo HEAD is `5db8c61` and manifest is `334/334` before any recapture.
- Amend `docs/UI-UX_Plan/UI-UX-PLAN.md` at Gate 0:
  - **§5:965–967** — check the three route-matrix boxes for `/profile`, `/settings`, `/settings/recycle-bin`.
  - **§6.1:1074** — change board scope from `Profile + Settings` to `Profile, Settings & Recycle Bin` and mark 10A `in progress`.
  - **§6.1.1:1101** — record Checkpoint #8 as pending Gate 19 sign-off (do not pre-check it).
  - **§6.14:1945–1953** — record all Decision 3 live-scope clarifications, the stale `SettingsPage.js (6 → 9)` count, the `RecycleBin.js` ignore-state correction, and the retained ignored-test exception.
  - **§7.1** — record `0` new waivers, `0` new `overflow-x`, and explicit developer authorization for the local `2048`MB build and full `326`-test Gate 15 run.
  - **§7.2** — record Decisions 1–4, Frame 02 I2 deviations, `.fs-num`/mono-identifier typography, checked-radio accent, retained toast/no-cancel/no-error-state scope, and the not-applicable sort-header/checkbox clause.
  - **§10** — append the 10A `in-progress` progress row with branch, merge base, Gate 0 SHA placeholder, mixed-file `matchMedia` precedent, and all decision outcomes.
  - **`CHANGELOG.md`** — add the Phase 10A entry per §7.2:2125.

### 3.2 Shared Theme — Section 25 Interactive Accent

#### [MODIFY] [theme-components.css](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css)

Append after the Phase 9B Section 24 block (`theme-components.css:2287–2301`):

```css
/* ----------------------------------------------------
   Phase 10A: Settings Radio Cards Interactive Accent (§4.3.2)
   Interactive accent only; zero tone tokens / tone-bearing classes.
   ---------------------------------------------------- */
html[data-fs-theme] .fs-page .settings-page .method-option.active {
  border-color: var(--fs-accent);
}

html[data-fs-theme] .fs-page .settings-page .method-option input[type="radio"] {
  accent-color: var(--fs-accent);
}

html[data-fs-theme] .fs-page .settings-page .method-option.active .check-icon {
  color: var(--fs-accent);
}
```

No changes to `theme.css`, `App.css`, `tokens.json`, `tokens.css`, `Tabs.js`, or `ConfirmModal`. `SettingsPage.css` supplies only neutral surface/hover states and must not declare `border-color` on `.method-option.active`.

### 3.3 `/profile` — User Profile Management (Checkpoint #8 Target)

#### [MODIFY] [ProfilePage.js](file:///d:/Projects/FinStat/frontend/src/pages/profile/ProfilePage.js)

- Import `{ Badge, Loading }` from `../../components/ui`.
- **Loading (D23)**: replace ad-hoc `<RefreshCw>` + inline hex block (`lines 98–105`) with `<Loading variant="card" text="Loading profile..." />` inside `<div className="page-container user-profile-page">`.
- **Root scoping**: `<div className="page-container user-profile-page">` to neutralize `SalaryProfile.css:18`.
- **Role pill**: `<Badge label={formData.role.toUpperCase()} className="profile-role-pill" />` (neutral `.fs-badge`, no tinted fill).
- **Purge all 8 inline styles**: 5 `paddingLeft` hacks on `fullName`, `title`, `company`, `department`, `employeeId` + 3 loading hex styles.
- **Fix all 12 label warnings**: pair each `<label htmlFor="profile-...">` with a matching input `id`; add `aria-hidden="true"` to decorative `lucide-react` icons.
- **Typography**: add `className="form-input fs-num"` to `dateOfBirth` and `phone`; add `className="form-input fs-mono"` to `nationalId` and `employeeId`. No other mono usage.
- **Save CTA**: `className="fs-btn fs-btn-primary btn-save-profile"` (`--fs-ink` on accent; single primary CTA). While `saving`, keep a static `<RefreshCw className="fs-btn-icon is-saving" aria-hidden="true" />` plus visible `Saving Profile…` text — do **not** render `<Loading variant="inline">` inside the button, which would duplicate `role="status"` accessible names.

#### [MODIFY] [ProfilePage.css](file:///d:/Projects/FinStat/frontend/src/pages/profile/ProfilePage.css)

- Rewrite completely under `html[data-fs-theme] .fs-page .user-profile-page` (`0` hex, `0` `rgba()`, `0` `!important`, `0` `overflow-x`, `0` page-CSS `var(--fs-accent)`, `box-shadow: none`).
- Align to Frame 02 Variant B: sunken `.profile-page-header` (`--fs-surface-sunken`, title `20px/600`, subtitle `13px/--fs-text-3`), stacked `--fs-surface-raised` section cards (`--fs-radius-md`, `1.25rem 1.5rem`, `max-width: none`, `margin: 0` to override `SalaryProfile.css:18`), 2-column `.card-body-grid` collapsing to `1fr` at `≤ 768px`, and sunken `.profile-form-footer` with the single primary CTA.
- Neutral `.card-icon-bubble` (`--fs-surface-sunken`, `--fs-border`, `--fs-text-2`, `--fs-radius-md`), neutral disabled inputs, `--fs-text-3` placeholders, and focus ring via `outline: var(--fs-focus-ring); outline-offset: var(--fs-focus-offset); border-color: var(--fs-border-control)`.
- Explicit overrides for `.fs-page .form-group*`, `.fs-page .form-input`, `.fs-page .form-label`, `.fs-page .page-header`, `.fs-page .section-title`, and `.btn-secondary` collisions listed in §0:3; assert computed styles at Gate 11.

### 3.4 `/settings` — Portfolio & Accounting Settings

#### [MODIFY] [SettingsPage.js](file:///d:/Projects/FinStat/frontend/src/pages/profile/SettingsPage.js)

- Import `{ Loading }` from `../../components/ui`.
- **Loading (D23)**: `<Loading variant="card" text="Loading application settings..." />` inside `<div className="page-container settings-page">`.
- **Purge all 9 inline styles** to semantic classes (`settings-header`, `settings-nav-link`, `settings-info-icon`, `settings-form-actions`, `settings-save-btn`, `settings-card--spaced`, `settings-recycle-actions`).
- **Fix all 3 label warnings** with explicit `htmlFor="cost-basis-{average|fifo|lifo}"` / `id` pairs; add `aria-hidden="true"` to decorative icons (`Sliders`, `CheckCircle`, `HelpCircle`, `Save`, `ArrowLeft`, `Trash2`).
- **Buttons/links**: `Back to Profile` and `Open Recycle Bin` (`data-testid="link-recycle-bin"` preserved) use `fs-btn fs-btn-secondary`; `Save Settings` uses `fs-btn fs-btn-primary` (single primary CTA, `--fs-ink` on accent).

#### [MODIFY] [SettingsPage.css](file:///d:/Projects/FinStat/frontend/src/pages/profile/SettingsPage.css)

- Rewrite under `html[data-fs-theme] .fs-page .settings-page` with the same `0`-count contract as Profile CSS.
- `.settings-card`: `--fs-surface-raised`, `--fs-border`, `--fs-radius-lg`, `box-shadow: none`; sunken header/footer mirroring Frame 02.
- `.method-option`: `--fs-surface`, `2px solid var(--fs-border-control)`, `--fs-radius-md`; hover `--fs-border-strong` layered on the control border plus `--fs-surface-raised`; active surface `--fs-surface-raised`. **No `border-color` declaration on `.method-option.active`; hover uses `.method-option:not(.active):hover`** — the accent border comes only from `theme-components.css` Section 25 and must survive active+hover (asserted at Gate 11).
- `.info-box`: `--fs-surface-sunken`, `1px solid var(--fs-border)`, `border-left: 3px solid var(--fs-border-control)` (never `--fs-border-strong` alone per §4.1:267), `--fs-radius-md`, `--fs-text-2`; zero blue wash.
- Responsive stacking at `≤ 768px`, full-width touch targets, `0px` overflow at `390px`; override the §0:3 collisions with computed-style assertions.

### 3.5 `/settings/recycle-bin` — Soft-Delete Recycle Bin

#### [MODIFY] [RecycleBin.js](file:///d:/Projects/FinStat/frontend/src/pages/profile/RecycleBin.js)

- Import `{ Loading, EmptyState }` from `../../components/ui`; purge the 1 inline style on the `Back to Settings` link → `className="fs-btn fs-btn-secondary recycle-back-link"`.
- **Tabs**: keep manual `fs-tabs recycle-bin-tabs` / `fs-tab recycle-tab-btn` markup with `data-testid` preserved, and implement the full APG keyboard contract from §0:6 (`role="tab"`, `aria-selected={active}`, `aria-controls`, roving `tabIndex`, ArrowLeft/ArrowRight/Home/End/Enter/Space, matching `role="tabpanel"` regions with `aria-labelledby`). Active tab uses the existing `.fs-tab--active` accent underline from `theme.css`.
- **Loading (D23)**: `<Loading variant="table" rows={5} text="Loading soft-deleted records..." />`.
- **Empty state**: `<EmptyState data-testid="empty-recycle-bin" icon={<FaTrashAlt />} title="Recycle Bin is empty" description={...} />` preserving exact text.
- **Restore button**: `className="fs-btn fs-btn-secondary fs-btn-sm btn-restore"`, preserving `data-testid={`restore-btn-${item._id}`}` and `<ProtectedAction>` viewer gating. Keep `<ConfirmModal variant="primary">` and `<PaginationControls />` unchanged.
- **Typography**: every amount, Total Value, date, and deleted-at value uses `className="recycle-num-cell fs-num"`. No mono on figures.
- **D19 compact-expand cards (`≤ 768px`)**: guarded `matchMedia` state from §0:9. Desktop renders the existing `<table className="fs-table recycle-bin-table" data-testid="deleted-items-table">`; mobile renders `<div className="recycle-mobile-cards" data-testid="recycle-mobile-cards">` instead, per the 9C guarded-`matchMedia` precedent (only one mode is in the DOM at a time; the desktop table is **not rendered** at `≤ 768px`, avoiding duplicate queries). Cards carry `aria-expanded` and `aria-label="Show details for ..."` / `"Hide details for ..."`. Expenditure cards show description/category + `.fs-num` amount + expander; expanded details show Date, Payment Account, Deleted At, and Restore. Trade cards show Stock Code + Type + `.fs-num` Total Value + expander; expanded details show Date, Broker, Deleted At, and Restore.
- Preserve every existing `data-testid` in the mode where it renders: `recycle-bin-page`, `tab-expenditures`, `tab-trades`, `empty-recycle-bin`, `deleted-items-table` (desktop), `deleted-row-${id}`, `restore-btn-${id}`. I5 is satisfied by byte-identical source preservation and the untouched desktop `10/10` Jest suite; mobile adds `recycle-mobile-cards` and is asserted separately at Gate 11/Gate 16.

#### [MODIFY] [RecycleBin.css](file:///d:/Projects/FinStat/frontend/src/pages/profile/RecycleBin.css)

- Rewrite under `html[data-fs-theme] .fs-page .recycle-bin-container` with the same `0`-count contract.
- Graphite table wrapper (`--fs-surface`, `--fs-border`, `--fs-radius-lg`), sunken header row, `--fs-surface-raised` row hover, and `.recycle-num-cell` defined only for alignment/color; `.fs-num` supplies Plex Sans + tabular numerals.
- D19 card styles (`.recycle-mobile-cards`, `.recycle-mobile-card`, `.recycle-mobile-summary`, `.recycle-mobile-details`, `.recycle-mobile-kv`) with `0px` overflow to `390px`.

### 3.6 Allowlist, ESLint Ignore & Test Infrastructure

#### [MODIFY] [ProtectedRoute.js](file:///d:/Projects/FinStat/frontend/src/components/ProtectedRoute.js)

Add `'/profile'`, `'/settings'`, `'/settings/recycle-bin'` to `THEMED_PATTERNS` (`56 → 59`). No other logic changes.

#### [MODIFY] [.eslintignore](file:///d:/Projects/FinStat/frontend/.eslintignore)

Remove `src/pages/profile/ProfilePage.js` and `src/pages/profile/SettingsPage.js`. Keep `src/pages/profile/__tests__/RecycleBin.test.js` (Decision 2). `src/pages/profile/RecycleBin.js` is already absent.

#### [NEW] [profileSettingsMocks.js](file:///d:/Projects/FinStat/frontend/tests/visual/fixtures/profileSettingsMocks.js)

Full CORS + `OPTIONS 204` deterministic mocks and error-mode switch per §0:7. Add the final `else if (route.slug === 'profile' || route.slug === 'settings' || route.slug === 'settings-recycle-bin') { await setupProfileSettingsMocks(page, route.slug); }` branch after `else if (route.slug.startsWith('lending')) { ... }` in both `visual.spec.js` and `a11y.spec.js`; no global `page.route` registration and no other slugs.

#### [MODIFY] [playwright.config.js](file:///d:/Projects/FinStat/frontend/playwright.config.js)

Add `profile-settings-reference-match.spec.js` to the `reference` project `testMatch` regex. No other config changes.

#### [NEW] [profile-settings-reference-match.spec.js](file:///d:/Projects/FinStat/frontend/tests/visual/profile-settings-reference-match.spec.js)

Registered as `9 passed` (`1 setup + 8 specs`):

1. `/profile` responsive sweep @ `1440/1024/768/480/390` — dark canvas `[16,17,20]`, `data-fs-theme="dark"`, flat cards, `boxShadow: none`, radii `≤ 8px`, neutral `.fs-badge`, single `.fs-btn-primary`, `0` `[style]`, `0px` overflow, and computed `.fs-num` / `.fs-mono` assertions.
2. **Checkpoint #8** — captures `02-form.html` Variant B and `/profile` at `1440/390` side by side.
3. Profile save flow — edits field, submits, asserts `PUT /api/users/profile` payload and toast feedback.
4. `/settings` sweep + FIFO selection — accent border/radio/check-icon only from Section 25, neutral `.info-box` left rule, `0` `[style]`, `0px` overflow, `link-recycle-bin` present.
5. `/settings/recycle-bin` desktop sweep @ 5 widths — tabs (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `aria-labelledby` panels), table columns, `.fs-num` figures, `0px` overflow.
6. D19 mobile cards @ `390px` — `data-testid="recycle-mobile-cards"`, desktop table **not rendered** per the 9C guarded-`matchMedia` precedent, expand/collapse, APG keyboard tab navigation and ARIA attributes, `0px` overflow.
7. Restore modal + empty state @ `1440/390` — ConfirmModal open/confirm flow, neutral restore button, EmptyState preserved, plus loading/error state captures for all three routes. Error artifacts are produced by the §0:7 forced-error mock, are captured **without** the generic `visual.spec.js:111–124` toast/status masking, and assert a visible toast with the expected message before capture; this preserves I2's no-inline-error decision while making the error evidence non-vacuous.
8. Keyboard/focus/touch targets @ `390px` — focus-visible rings on tabs, radios, save buttons, and expanders; touch targets `≥ 44px`; collision computed-style table from §0:3.

#### [NEW] Unit & Accessibility Jest Tests

- `ProfilePage.test.js`: loads profile, renders role `<Badge>`, verifies all 12 label-input associations via `getByLabelText`, submits updated fields, verifies disabled username/role inputs and `.fs-num` / `.fs-mono` class assignments.
- `SettingsPage.test.js`: loads cost basis, switches `average`/`fifo`/`lifo`, asserts `updateUserProfile`, verifies `link-recycle-bin` and no `[style]` attributes.
- `ProfileSettingsA11y.test.js`: `jest-axe` `0` violations on `ProfilePage`, `SettingsPage`, and `RecycleBin` (desktop and mobile via guarded `matchMedia` mock), plus APG tab keyboard assertions.

### 3.7 §7.4 Local Artifact Inventory

All files live in gitignored `docs/ui-snapshots/phase-10a/`, each `≥ 1000` bytes, `31` PNGs total, with no overwrite of 9A–9C directories:

- `profile-{1440,1024,768,480,390}.png` — 5
- `settings-{1440,1024,768,480,390}.png` — 5
- `settings-recycle-bin-{1440,1024,768,480,390}.png` — 5
- `frame-02-form-side-by-side-{1440,390}.png` — 2
- `settings-fifo-selected-{1440,390}.png` — 2
- `settings-recycle-bin-trades-{1440,390}.png` — 2
- `settings-recycle-bin-restore-modal-{1440,390}.png` — 2
- `settings-recycle-bin-empty-{1440,390}.png` — 2
- `profile-{loading,error}.png`, `settings-{loading,error}.png`, `settings-recycle-bin-{loading,error}.png` — 6

Loading states use the §3.3–§3.5 `<Loading>` variants. Error states are captured per route via the §0:7 forced-error mock; the reference spec disables only its own toast/status masking for those captures and asserts the visible error toast with the expected message, preserving I2's no-inline-error decision (success/user-action feedback remains toast-based; no error card is invented). No §7.4 deviation; every named artifact is asserted at Gate 11 and inspected at Gate 17.

---

## 4. Verification Plan (Gates 0–19)

The numbered list below is **execution order**. Gate 12 intentionally precedes Gates 10/11 so the browser checks are served from the freshly built 10A bundle via the static build server (`serve -s build`), not the dev server; record this serving harness in Gate 19 evidence. Run from `d:\Projects\FinStat\frontend` (single-worker Playwright per §15, PowerShell 5.1 syntax).

1. **Gate 0 — Branch & Governance**: create branch/tag from `main @ 3f42b4f`, commit approved plan and all §3.1 amendments, assert baseline HEAD `5db8c61` and `334/334` manifest; record all four decisions and pre-existing ignored-test exception.
2. **Gate 1 — Allowlist & Route Coverage**: `node scripts/ui-coverage.js --assert-allowlist` (`59` patterns) and `node scripts/ui-coverage.js --routes` (`75 / 10 / 65 / 0`).
3. **Gate 2 — Token Drift**: `node scripts/tokens.js --check --tables` (`0` drift).
4. **Gate 3 — Test-ID Guard**: `node scripts/testid-guard.js --base 3f42b4f` (`0` deletions; exact I5 strings preserved).
5. **Gate 4 — Tone Lint**: `node scripts/lint-tones.js` (`0` violations; `61` page / `64` total CSS).
6. **Gate 5 — CSS Ratchet, Stylelint & Ban Greps**:
   ```powershell
   node scripts/lint-ratchet.js --base 3f42b4f
   npx stylelint "src/pages/profile/*.css" "src/styles/theme-components.css"
   git grep -n 'overflow-x' -- '*.css'
   $profileOverflow = @(git grep -n 'overflow-x' -- 'src/pages/profile/*.css')
   if ($profileOverflow.Count -ne 0) { throw "Gate 5: 10A page CSS must have 0 overflow-x" }
   git grep -n '#14b8a6' -- '*.css'
   git grep -n 'data-fs-theme="dark"' -- '*.css'
   git grep -nE "<div>Loading|className=\"loading-spinner\"|custom spinner SVG" -- 'src/**/*.js'
   git grep -nE '#[0-9A-Fa-f]{3,8}' -- 'src/pages/profile/*.js' 'tests/visual/fixtures/profileSettingsMocks.js' 'tests/visual/profile-settings-reference-match.spec.js' 'tests/visual/visual.spec.js' 'tests/visual/a11y.spec.js'
   git diff 3f42b4f -- src/services/userService.js src/services/apiClient.js src/utils/formatters.js src/App.js src/App.css src/pages/salary/SalaryProfile.css src/pages/salary/PaycheckFormPage.css src/pages/expenditure/Expenditure.css src/pages/expenditure/RecurringBills.css src/pages/DashboardSummary.js src/styles/chartTheme.js src/styles/theme.css src/styles/tokens.json src/styles/tokens.css src/components/common/ConfirmModal.js src/components/common/ConfirmModal.css src/components/ui/Tabs.js src/pages/profile/__tests__/RecycleBin.test.js tests/visual/fixtures/paycheckMocks.js tests/calculations.spec.js package.json package-lock.json ../backend/
   $removedThemeLines = @(git diff --unified=0 3f42b4f -- src/styles/theme-components.css | Select-String -Pattern '^-' | Where-Object { $_ -notlike '---*' })
   if ($removedThemeLines.Count -ne 0) { throw 'Gate 5: theme-components.css must be append-only' }
   ```
   Expect `0` regressions, `0` stylelint errors, `0` `overflow-x` in the 3 Phase 10A CSS files (mechanical filtered assertion), `#14b8a6` only at `tokens.css:36`, `data-fs-theme="dark"` only in `tokens.css`, no loading bypass outside `<Loading>`, `0` raw hex in touched JS (mechanical grep), `theme-components.css` append-only (`0` removed lines), and empty protected-file diffs including the four collision-source CSS files from §0:3/§0 protected list, byte-identical `RecycleBin.test.js`, and byte-identical `paycheckMocks.js`. Also assert no `border-color` on `.method-option.active`, that hover uses `.method-option:not(.active):hover`, and no page-CSS `var(--fs-accent)`.
7. **Gate 6 — ESLint**:
   ```powershell
   npx eslint --max-warnings=0 src/pages/profile/ProfilePage.js src/pages/profile/SettingsPage.js src/pages/profile/RecycleBin.js src/pages/profile/__tests__/ProfilePage.test.js src/pages/profile/__tests__/SettingsPage.test.js src/pages/profile/__tests__/ProfileSettingsA11y.test.js src/components/ProtectedRoute.js tests/visual/fixtures/profileSettingsMocks.js tests/visual/visual.spec.js tests/visual/a11y.spec.js tests/visual/profile-settings-reference-match.spec.js playwright.config.js
   ```
   Expect `0` errors / `0` warnings; `RecycleBin.test.js` intentionally remains ignored.
8. **Gate 7 — Touched Jest Suites**: `npx react-scripts test --watchAll=false --runInBand src/pages/profile/__tests__/` — all 4 suites green, including byte-identical `10/10` `RecycleBin.test.js`, plus `jest-axe`, full APG ARIA/keyboard assertions from §0:6, class assignments, and restore gating. CRA's `react-scripts test` is used for React/JSX suites per 9A–9C precedent; bare `npx jest` is reserved for Gate 9's plain-JS calculation fixture.
9. **Gate 8 — App/ProtectedRoute/Dashboard Smoke & Line Cap**: `npx react-scripts test --watchAll=false --runInBand src/App.test.js src/components/__tests__/ProtectedRoute.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js` — expect `3` suites / `21` tests (`9 + 6 + 6`); assert `$lineCount = (Get-Content src/pages/DashboardSummary.js).Count; if ($lineCount -ne 96 -or $lineCount -gt 120) { throw "Gate 8: DashboardSummary.js line count $lineCount" }`.
10. **Gate 9 — Calculation Fixtures**: `npx jest --runInBand tests/calculations.spec.js --forceExit` (`11/11` green; `formatCurrency()` `$` unchanged).
11. **Gate 12 — Local Production Build** *(authorized by Decision 4)*: `$env:NODE_OPTIONS="--max-old-space-size=2048"; npm run build` (`Compiled successfully.`; pre-authorized `1536`MB fallback if needed; record the heap size that actually succeeded in the Gate 19 ledger). Gates 10/11 are served from `build` via `serve -s build`. CI on `main` remains authoritative. **Run before Gates 10/11.**
12. **Gate 10 — Real-Browser Axe**: `$env:CI='true'; npx playwright test --project=a11y -g "^a11y check: (profile|settings|settings-recycle-bin)$"` — expect `4 passed` (`1 setup + 3 routes`), `0` serious/critical. The anchored regex intentionally excludes `salary-profile-*` routes.
13. **Gate 11 — Reference Match & Checkpoint #8**: `$env:CI='true'; npx playwright test profile-settings-reference-match.spec.js --project=reference` (basename only; `testDir` is `tests/visual`) — expect `9 passed` (`1 setup + 8 specs`, distinct from the `31` named §3.7 artifacts), all `31` artifacts `≥ 1000` bytes, `0px` overflow at every width, computed `.fs-num`/`.fs-mono` assertions, Section 25 accent only on checked radio and active+hover, full APG ARIA assertions from §0:6, visible-toast assertions on all three forced-error artifacts, and collision computed-style table from §0:3.
14. **Gate 13 — Visual Baseline Recapture (`15` PNGs)**:
    ```powershell
    $baselineRepo = 'D:\Projects\FinStat-visual-baselines'
    $startingBaseline = '5db8c61'
    if ((git -C $baselineRepo rev-parse --short HEAD).Trim() -ne $startingBaseline) {
      throw "Gate 13: baseline repo HEAD must be $startingBaseline"
    }
    $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="(profile|settings|settings-recycle-bin) @" --update-snapshots 2>&1 | Tee-Object -Variable recaptureLines
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $recaptureText = ($recaptureLines | Out-String)
    $recapturePassed = [regex]::Match($recaptureText, '(\d+) passed')
    if (-not $recapturePassed.Success -or [int]$recapturePassed.Groups[1].Value -ne 16) {
      throw "Gate 13: expected 16 passed (1 setup + 15 PNGs); got`n$recaptureText"
    }
    $expectedBaselines = @(
      'profile-1440.png','profile-1024.png','profile-768.png','profile-480.png','profile-390.png',
      'settings-1440.png','settings-1024.png','settings-768.png','settings-480.png','settings-390.png',
      'settings-recycle-bin-1440.png','settings-recycle-bin-1024.png','settings-recycle-bin-768.png',
      'settings-recycle-bin-480.png','settings-recycle-bin-390.png'
    )
    $beforeCount = @(Get-ChildItem -LiteralPath 'tests\visual\baseline' -Recurse -File -Filter '*.png').Count
    node scripts/verify-baseline-manifest.js --generate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/verify-baseline-manifest.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $afterCount = @(Get-ChildItem -LiteralPath 'tests\visual\baseline' -Recurse -File -Filter '*.png').Count
    $manifest = Get-Content 'tests\visual\baseline\manifest.json' -Raw | ConvertFrom-Json
    $manifestCount = @($manifest.PSObject.Properties).Count
    if ($beforeCount -ne 334 -or $afterCount -ne 334 -or $manifestCount -ne 334) {
      throw "Gate 13: expected 334/334 baselines and 0 net new entries; got $beforeCount -> $afterCount / $manifestCount"
    }
    foreach ($name in $expectedBaselines) {
      $file = @(Get-ChildItem -LiteralPath 'tests\visual\baseline' -Recurse -File -Filter $name)
      if ($file.Count -ne 1 -or $file[0].Length -lt 1000) { throw "Gate 13: missing or undersized baseline $name" }
    }
    git -C $baselineRepo add -A
    git -C $baselineRepo commit -m "Phase 10A: recapture 15 profile/settings/recycle-bin route snapshots"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C $baselineRepo rev-parse --short HEAD
    git -C $baselineRepo diff --stat $startingBaseline HEAD
    $changedFiles = @(git -C $baselineRepo diff --name-only $startingBaseline HEAD)
    $changedPngs = @($changedFiles | Where-Object { $_ -like '*.png' })
    if ($changedFiles.Count -ne 16 -or $changedPngs.Count -ne 15 -or ($changedFiles -notcontains 'manifest.json')) {
      throw "Gate 13: expected exactly 15 PNGs + manifest.json in baseline commit; got $($changedFiles.Count) files / $($changedPngs.Count) PNGs"
    }
    ```
    Expect `16 passed`, `334/334` manifest verified, `0` net new manifest entries, exactly the `15` named recaptured PNGs plus `manifest.json` in the baseline commit, and a new baseline-repo SHA for the walkthrough header.
15. **Gate 14 — PR-Subset Visual Regression**: require exit `1` with exactly `68 passed / 3 failed` and the three registered accepted diffs; capture raw stdout via `Tee-Object` before cleaning reports.
    ```powershell
    $env:CI='true'; $env:PR_SUBSET='true'
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
16. **Gate 15 — Full `326`-Snapshot Visual Regression** *(user-authorized §15.5 exception)*: require exit `1` with exactly `292 passed / 34 failed` (`326` accounted), `0` unexplained diffs (the `34` registered AD14/AD16 failures are the only diffs), `0` diffs on all 10A routes (against new Gate 13 baselines), Cluster 9, 10B, 10C, and Landing, and mechanically assert all `34` failure titles against the embedded AD14/AD16 register (10 AD14 + 24 AD16/W-6A-1, copied from `phase_9a_implementation_plan.md:318–332`). Attach raw stdout before cleaning reports.
    ```powershell
    Remove-Item Env:PR_SUBSET -ErrorAction SilentlyContinue; $env:CI='true'
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
17. **Gate 16 — Touch Targets & Focus Rings**: `$env:CI='true'; npx playwright test profile-settings-reference-match.spec.js --project=reference -g "touch targets"` — expect `2 passed` (`1 setup + 1 spec`), restoring the 9A/9B/9C gate identity; verify focus-visible rings on tabs, radios, save buttons, and expanders plus `≥ 44px` touch targets.
18. **Gate 17 — Visual Inspection**: inspect all `15` recaptured baselines and all `31` named artifacts via `read_file`; assert computed table: `--fs-bg` canvas, `html[data-fs-theme]`, no gradients/blurs/shadows, radii `≤ 8px`, `0` `[style]` on converted roots, `.fs-num` sans+tabular figures, `.fs-mono` only on `nationalId`/`employeeId`, accent only on primary CTA / checked radio / active tab (including active+hover on `.method-option`), neutral `.info-box` left rule, APG tabs, D19 cards, loading/empty/error state captures, `0px` overflow at `390px`, and Frame 02 side-by-side. If a defect is found, remediate it fully and re-run Gates 3–7, 12, 10/11/16, 13 recapture, then 14/15/18 before re-inspection (8D strict post-polish chronology); annotation alone never closes a catch.
19. **Gate 18 — Cluster 9 + Unthemed 10B/10C Guard (`12` slugs = `60` captures + `1` setup = `61 passed`)**: anchored slug grep with trailing `@`:
    ```powershell
    $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="(credit-cards @|credit-cards-statements @|credit-cards-debt-payoff @|credit-cards-reconcile @|lending @|lending-person-detail @|lending-loan-detail @|security @|admin @|admin-tax-brackets @|admin-social-insurance @|admin-backup @)"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    Expect **`61 passed`** (`1 setup + 20 credit-cards + 15 lending + 25 security/admin = 60 route-width captures`; `7` Cluster 9 slugs + `5` unthemed 10B/10C slugs = `12` slugs × `5` widths), `0` diffs. Trailing `@` prevents prefix swallowing (`admin @` excludes `admin-tax-brackets @`; no `salary-profile-*` capture is included). Scope-change note: 9C Gate 18 was `46 passed` (`20 credit-cards + 15 lending + 10 profile/settings`); the now-themed `/profile`, `/settings`, and `settings-recycle-bin` captures are covered by Gate 13 instead.
20. **Gate 19 — Walkthrough + Checkpoint #8 Sign-Off**: author `docs/ui-plans/phase_10a_walkthrough.md` per §5, present it with embedded `/profile` vs `02-form.html` Variant B screenshots at `1440px` and `390px`, and **STOP** awaiting explicit user sign-off before governance sync, `--no-ff` merge, or any push. Only `main` is pushed after sign-off.

---

## 5. Gate 19 Walkthrough Authoring Spec

Create `docs/ui-plans/phase_10a_walkthrough.md` mirroring `phase_9c_walkthrough.md`:

- **Header ledger (two-stage)**: Date, branch/tag, merge base `3f42b4f`, Gate 0 Plan & Governance SHA, Implementation SHA, Walkthrough SHA, Gov SHA, Merge SHA, Starting Baseline Commit `5db8c61`, Gate 13 new baseline SHA with `334/334` manifest verification, the Gate 12 static-build serving harness, and the heap size that succeeded (`2048`MB or pre-authorized `1536`MB fallback). Draft header uses `Ready for Gate 19 Sign-Off` with `Merge SHA: Pending` and `Checkpoint #8 pending`; after sign-off replace with `Complete — Gate 19 Signed Off <date>`, final Gov/Merge SHAs, and `Checkpoint #8 approved` (9C two-stage precedent).
- **§0 Approved Review Items & Gate 0 Amendments**: Decisions 1–4 (including Section 25 `.fs-page` selector + active-hover amendment and the pre-authorized fallback), stale `SettingsPage.js (6 → 9)` correction, `RecycleBin.js` ignore-state correction, retained byte-identical ignored `RecycleBin.test.js` and byte-identical `paycheckMocks.js`, Frame 02 I2 deviations, mixed-file `matchMedia` precedent, §4.3.2 no-amendment rationale, forced-error mock/visible-toast decision, full APG `role="tab"`/`aria-selected`/`aria-labelledby` contract, and all §3.1 governance amendments.
- **§1 Progress Log**: sub-phase `10A`, all Gates 0–18 green, `THEMED_PATTERNS 56 -> 59`, allowlist `['/profile','/settings','/settings/recycle-bin']`, visual diff summary, branch SHAs, `Next: Phase 10B`, `Blocked by: Gate 19 User Sign-Off`, and explicit `Checkpoint #8 pending` in the draft.
  - Fixtures: `profileSettingsMocks.js` added as the final `else if` branch for the three 10A slugs only (including the error-mode switch); `paycheckMocks.js` byte-identical; `RecycleBin.test.js` byte-identical `10/10`.
  - Screenshots: none tracked per D5/D21; `15` baselines in `FinStat-visual-baselines` repo (new Gate 13 SHA) + `31` local §3.7 PNGs in gitignored `docs/ui-snapshots/phase-10a/` (including forced-error toast captures asserted visible).
- **§2 Governing Invariant Compliance**: mirror §1 of this plan (I1–I16) in the condensed 9A–9C format, labelled as such, or append the verbatim rule text from `UI-UX-PLAN.md:189–204` to satisfy `walkthrough-template.md:28–49`.
- **§3 Visual Diff Report**: `326` total / `292` zero-diff / `34` accepted AD14/AD16 / `0` unexplained; PR-subset `68 passed / 3 failed` with three titles; 10A `15` recaptured baselines zero-diff at new SHA; `0` diffs on 9A/9B/9C, Landing, 10B, and 10C; include the Gate 18 `61/61` scope-change note, the baseline aggregate-diff evidence (`git -C D:\Projects\FinStat-visual-baselines diff --stat 5db8c61 <new-sha>` = `15` PNGs + `manifest.json`, `0` net new entries), and the standard §7.1 HTML-report substitution disclosure (`test-results/` and `playwright-report/` cleaned; `(a)–(d)` summary plus accepted-diff register substituted).
- **§4 Gate Evidence Table**: raw stdout for Gates 1, 13, 14, 15, 18 plus concise PASS rows for 0–18 (including Gate 8 `21/21`, Gate 12 heap/serving evidence, Gate 16 `2 passed` Touch Targets & Focus Rings, and Gate 11 `9 passed` = `1 setup + 8 specs` distinct from the `31` named artifacts), including exact expected counts, the Gate 0 authorization record, and an explicit artifact-to-spec mapping table for all `31` §3.7 PNGs.
- **§5 Inspection Log**: all `15` baselines + `31` named §3.7 artifacts (including forced-error toast states asserted visible without generic masking), computed-style conformance table with active+hover accent, Frame 02 side-by-side, D19 cards with the documented mobile-DOM resolution, typography classes, APG ARIA attributes and keyboard tabs, and loading/empty/error state captures.
- **§6 Post-Sign-Off Checklist**: receive Gate 19 sign-off (including explicit Checkpoint #8 approval; Checkpoint #8 becomes signed only after that approval), finalize the two-stage header/ledger, sync `UI-UX-PLAN.md` §5/§6.1/§6.1.1/§6.14/§7.1/§7.2/§10, update both plan and walkthrough status/SHAs, update `CHANGELOG.md`, merge with `--no-ff`, push only `main`, verify authoritative CI, clean `frontend/test-results/` and `frontend/playwright-report/`, and record that Phase 10B may start only after Checkpoint #8 is signed.

---

## 6. Manual Verification (User Sign-Off at Gate 19)

- Review Checkpoint #8 side-by-side: `/profile` at `1440px` and `390px` vs Reference Frame 02 Variant B, including sunken header/footer, stacked section cards, and single primary CTA.
- Verify `/settings` cost-basis radio accent states (including active+hover), neutral `.info-box`, and `Open Recycle Bin` link.
- Verify `/settings/recycle-bin` tabs (mouse and keyboard, including `role="tab"` / `aria-selected` / `aria-labelledby`), table, Restore `<ConfirmModal>`, and D19 mobile cards at `390px` with `0px` overflow and the desktop table not rendered in mobile mode per §3.5.
- Review the loading, empty, and error state captures for all three routes per §7.4; confirm each error capture was produced by the §0:7 forced-error mock and shows a visible toast (no generic masking) before acceptance.
- Confirm `0` new waivers and retained ignored-test exception, and confirm that only `main` will be pushed after sign-off.
