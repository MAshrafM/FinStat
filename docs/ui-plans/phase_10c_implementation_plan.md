# UI Phase 10C — Admin Family (`/admin`, `/admin/tax-brackets`, `/admin/social-insurance`, `/admin/backup`) — Implementation Plan

- **Date**: 2026-11-28
- **Phase**: `10C` (Cluster 10 final sub-phase — closes **Phase 10 Exit Gate**: `8/8` Phase 10 routes themed, `64 of 65` rendering routes allowlisted)
- **Branch**: `phase-ui-10c-admin` *(tag `ui-phase-10c-start`; local branch policy per §14/§10; only `main` is pushed after Gate 19 user sign-off)*
- **Merge Base**: `main` @ `af34aa8`
- **Starting Baseline Commit**: `3b3cfc5` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified; carried from Phase 10B)
- **Routes Allowlisted (`+4`, `THEMED_PATTERNS` `60 -> 64`)**:
  - `/admin` (`frontend/src/pages/admin/AdminDashboard.js`, slug `admin`)
  - `/admin/tax-brackets` (`frontend/src/pages/admin/TaxConfigPage.js`, slug `admin-tax-brackets`)
  - `/admin/social-insurance` (`frontend/src/pages/admin/InsuranceConfigPage.js`, slug `admin-social-insurance`)
  - `/admin/backup` (`frontend/src/pages/admin/BackupPage.js`, slug `admin-backup`)
- **Supporting Components In Scope**:
  - `TaxConfigCard.js`, `TaxConfigModal.js`, `InsuranceConfigCard.js`, `InsuranceConfigModal.js`, `DeleteConfirmModal.js`
  - `AdminDashboard.css`, `TaxConfigPage.css`, `InsuranceConfigPage.css`, `BackupPage.css`
- **Taste Checkpoint**: None (Checkpoint #8 signed off in 10A; Checkpoint #9 is 11A Landing per §6.1.1:1092–1102). Frame 01 Variant B (dense table) and Frame 02 Variant B (form) side-by-side artifacts are still captured under §7.4:2159.
- **Waivers Requested**: **0 design waivers** (User table and Backup delta results table collapse to D19 compact-expand cards at `≤ 768px`; Tax Bracket 3-column card table fits cleanly at `390px` with `0` `overflow-x`; Tax Modal bracket rows stack cleanly at `≤ 768px`; `0` tone tokens in page CSS; `0` gradients/blurs/glows; `1` tightly scoped interactive-accent addition in `theme-components.css` Section 26 if Option A is approved). A separate **explicit authorized §15.5 deviation** is requested for the local Gate 12 build and full `326`-test Gate 15 visual run.
- **Status**: `Awaiting User Plan Review`

---

## Goal Description

Phase 10C converts the four Admin routes (`/admin`, `/admin/tax-brackets`, `/admin/social-insurance`, `/admin/backup`) and their shared modal/card subcomponents into FinStat's dark graphite design system under D22 attribute-existence scoping (`html[data-fs-theme]`). It eliminates the legacy red gradient admin identity on `/admin`, the glassmorphic blue/rainbow washes on Tax & Insurance config pages, and the indigo/red gradient buttons and blurred modal backdrops on `/admin/backup`; removes all 401 Stylelint errors and all 102 ESLint problems (clearing all 4 admin entries from `frontend/.eslintignore`); preserves all 13 existing unit tests (`TaxConfig.test.js` & `InsuranceConfig.test.js`) byte-identical; adds full APG modal focus lifecycles and D19 mobile cards; and closes the **Phase 10 Exit Gate** (`8/8` Phase 10 routes themed, `64 of 65` rendering routes allowlisted, zero page-wide red/purple identity, viewer-role behaviour unchanged).

---

## 0. Verified Codebase Audit & Architectural Decisions

1. **CSS violations (`401` Stylelint errors, `0` warnings across 4 CSS files)**:
   - `AdminDashboard.css` (`428` lines): banned red gradient heading (`linear-gradient(135deg, #ffffff 0%, #f87171 100%)` + `-webkit-background-clip: text`), banned red CTA gradient (`#ef4444 -> #dc2626`), banned `backdrop-filter: blur(6px)` on `.modal-overlay` and `blur(12px)` on `.admin-quick-card`, radii above `8px` (`18px`/`16px`/`12px`/`10px`/`20px`/`50%`), arbitrary `rgba()` `box-shadow`s, and tinted `.role-badge-*` pills.
   - `TaxConfigPage.css` (`880` lines, also `@import`ed by `InsuranceConfigPage.css`): banned blue gradient buttons (`#3b82f6 -> #2563eb`), banned red danger gradient button (`#ef4444 -> #dc2626`), banned `backdrop-filter: blur(12px/8px/16px)` on cards/modals/overlays, radii above `8px` (`14px`/`12px`/`9999px`/`50%`/`24px`), `.card-table-wrapper { overflow-x: auto }` (`line 259`), `.admin-table-container { overflow-x: auto }` (`line 646`), `.loading-spinner-ring` (`line 369`), tinted `.status-badge-pill`, and rose-tinted `.rate-badge`.
   - `InsuranceConfigPage.css` (`61` lines): `@import './TaxConfigPage.css'`, rainbow `.text-accent-blue` (`#60a5fa`), `.text-accent-purple` (`#c084fc`), `.text-accent-cyan` (`#38bdf8`), `.text-accent-amber` (`#fbbf24`), and raw hex/`rgba()` surfaces.
   - `BackupPage.css` (`438` lines): banned gradient heading (`#ffffff -> #cbd5e1` + `-webkit-background-clip: text`), banned indigo/red button gradients, banned `backdrop-filter: blur(4px)` on `.restore-modal-overlay`, radii above `8px` (`14px`/`12px`/`10px`/`9999px`), `grid-template-columns: repeat(auto-fit, minmax(480px, 1fr))` (horizontal overflow risk at `≤ 480px`), `.backup-table-wrapper { overflow-x: auto }` (`line 342`), and indigo `#6366f1` `.backup-format-option.selected` + `accent-color: #6366f1`.

2. **JSX & ESLint violations (`102` problems: `87` errors, `15` warnings across 4 `.eslintignore` files)**:
   - `AdminDashboard.js` (`697` lines, `.eslintignore:18`): colour-bearing inline styles, raw hex literals & `color="#..."` icon props (`#f87171`, `#38bdf8`), and `6` `jsx-a11y/label-has-associated-control` warnings on Add User modal inputs (`lines 491, 506, 521, 538, 552, 573`).
   - `BackupPage.js` (`463` lines, `.eslintignore:19`): colour-bearing inline styles (`lines 372, 375, 399, 423, 428`) + `display: 'none'` file input (`line 281`), `3` `jsx-a11y/label-has-associated-control` (`lines 197, 219, 316`), `3` `jsx-a11y/click-events-have-key-events` (`lines 197, 219, 273`), `1` `jsx-a11y/no-static-element-interactions` (`line 273` upload drop zone), and `1` `jsx-a11y/no-autofocus` (`line 437` `autoFocus`).
   - `InsuranceConfigModal.js` (`256` lines, `.eslintignore:20`): `1` `jsx-a11y/label-has-associated-control` warning (`line 214` active toggle switch `<label>`).
   - `TaxConfigModal.js` (`342` lines, `.eslintignore:21`): `1` `jsx-a11y/label-has-associated-control` warning (`line 212` active toggle switch `<label>`) + `3` layout inline styles on `<th>` (`width: '60px'`, `'130px'`, `'50px'`, `lines 250–254`).
   - Note: `TaxConfigPage.js`, `InsuranceConfigPage.js`, `TaxConfigCard.js`, `InsuranceConfigCard.js`, and `DeleteConfirmModal.js` are **not** in `.eslintignore` (already ESLint-clean), though they still contain ad-hoc `.loading-spinner-ring` loaders, emojis (`🔹`, `🟢`, `🟡`), and legacy modal classes/lack APG focus lifecycles.

3. **D23 Loading State Purge**:
   - `AdminDashboard.js`: ad-hoc loading row (`Loading users...`) → `<Loading variant="table" rows={5} />` inside card shell.
   - `TaxConfigPage.js` & `InsuranceConfigPage.js`: `.loading-spinner-ring` (`TaxConfigPage.css:369`) → `<Loading variant="grid" cards={2} />`.
   - `BackupPage.js`: `animate-spin` on `RefreshCw` / `Loader` icons → static disabled button label (`Exporting...`, `Analyzing...`, `Restoring...`) and `<Loading variant="page" />` during initial status fetch.

4. **Emoji & Icon Cleanup**:
   - Replace decorative emojis (`🔹` in `TaxConfigCard.js` & `InsuranceConfigCard.js`, `🟢` / `🟡` in `BackupPage.js`, `⚠️` / `🔍` / `✅` in `BackupPage.js`) with clean text, `<Badge>`, or existing `lucide-react` icons so status is conveyed consistently via typography + semantic badges.

5. **Interactive Accent Scope (`theme-components.css` Section 26 — Decision 1)**:
   - `BackupPage.js` renders selectable radio format cards (`.backup-format-option.selected`) + radio inputs + checkbox (`Include Users collection`), and `TaxConfigModal.js` / `InsuranceConfigModal.js` render `.admin-toggle-switch` active toggles. Under AGENTS.md Rule 6, `var(--fs-accent)` cannot be referenced in page CSS.
   - Following Phase 10A's exact precedent (`theme-components.css:2303–2317`, Settings radio cards), **Option A (Recommended)** appends a tightly scoped Section 26 interactive-accent block to `theme-components.css` covering only `.backup-format-option.selected`, `.backup-page-container input[type="radio"|"checkbox"]`, and `.admin-toggle-switch input:checked + .admin-toggle-slider`. Zero tone tokens or tone-bearing classes are added.

6. **Existing Unit Tests Preservation (13/13 Byte-Identical)**:
   - `frontend/src/pages/admin/__tests__/TaxConfig.test.js` (`8` tests) and `InsuranceConfig.test.js` (`5` tests) assert exact labels/text (`'2024 Tax Brackets'`, `'Active'`, `'Inactive'`, `'15,000 EGP'`, `'∞'`, `'Edit configuration'`, `'Delete configuration'`, `'Deactivate configuration'`, `'Activate configuration'`, `'New Tax Bracket Configuration'`, `'Add Row'`, `'#8'`, `'Update Configuration'`, `'Delete Configuration'`, `'2024 Social Insurance'`, `'11%'`, `'18.75%'`, `'2,000 EGP'`, `'12,600 EGP'`). Both files stay **strictly untouched** (`13/13` passing). Three new suites (`AdminDashboard.test.js`, `BackupPage.test.js`, `AdminA11y.test.js`) are added.

7. **API Endpoints Confirmed for `adminMocks.js` (Read from `adminService.js` & `backupService.js`)**:
   - `GET /api/admin/users?page=1&limit=10` (plus `POST /api/admin/users`, `DELETE /api/admin/users/:id`)
   - `GET /api/admin/tax-brackets` (plus `POST`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/toggle`)
   - `GET /api/admin/social-insurance` (plus `POST`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/toggle`)
   - `GET /api/admin/backup/status` (plus `GET /export?format=...`, `POST /import?dryRun=...`)

8. **Shared Modal Reuse & Full APG Focus Lifecycle**:
   - Reuse shared `.modal-overlay` (`--fs-scrim`, `backdrop-filter: none`) and `.modal-content` (`--fs-surface`, `--fs-border`, `--fs-radius-lg`, `--fs-shadow`) from `theme-components.css:897–921` across all 5 admin modals (`AdminDashboard` Add User & Delete User, `TaxConfigModal`, `InsuranceConfigModal`, `DeleteConfirmModal`, `BackupPage` Restore Confirm).
   - `BackupPage` Restore Confirmation modal also receives `.fs-surface-solid` per §6.14:1968.
   - All 5 modals implement `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape dismissal, initial focus, Tab/Shift+Tab focus trap, and focus restore on close (reusing a small local modal-focus helper or `useEffect` hook).

9. **Typography & Volatile Data**:
   - `.fs-num` (IBM Plex Sans + `tabular-nums`, right-aligned) for row indices, pagination counts, tax bracket thresholds/rates, insurance caps/rates, and backup collection document counts/deltas.
   - `.fs-mono` strictly for identifier/code literals (`RESTORE` confirmation input, backup filename, email/username only if code-like — user display names & emails stay prose `--fs-text-1`/`--fs-text-2`).
   - `<time data-visual-mask="true" className="fs-num">` on Joined dates (`AdminDashboard.js`) and Effective From/To dates (`TaxConfigCard.js`, `InsuranceConfigCard.js`) per §9.5:2480.

### Target Production Files

- `frontend/src/pages/admin/AdminDashboard.js`, `AdminDashboard.css`
- `frontend/src/pages/admin/TaxConfigPage.js`, `TaxConfigPage.css`, `TaxConfigCard.js`, `TaxConfigModal.js`
- `frontend/src/pages/admin/InsuranceConfigPage.js`, `InsuranceConfigPage.css`, `InsuranceConfigCard.js`, `InsuranceConfigModal.js`
- `frontend/src/pages/admin/DeleteConfirmModal.js`
- `frontend/src/pages/admin/BackupPage.js`, `BackupPage.css`
- `frontend/src/styles/theme-components.css` *(only if Decision 1 Option A is approved — Section 26 interactive accent)*
- `frontend/src/components/ProtectedRoute.js` *(allowlist only: `THEMED_PATTERNS` `60 -> 64`)*
- `frontend/.eslintignore` *(remove the 4 admin entries only)*
- `frontend/tests/visual/fixtures/adminMocks.js` *(new)*
- `frontend/tests/visual/visual.spec.js`, `a11y.spec.js`, `playwright.config.js` *(mock/spec registration only)*
- `frontend/tests/visual/admin-reference-match.spec.js` *(new)*
- `frontend/src/pages/admin/__tests__/AdminDashboard.test.js`, `BackupPage.test.js`, `AdminA11y.test.js` *(new)*

### Protected Files (Strictly Untouched — Verified via `git diff af34aa8`)

`frontend/src/services/adminService.js`, `frontend/src/services/backupService.js`, `frontend/src/services/apiClient.js`, `frontend/src/utils/formatters.js`, `frontend/src/App.js`, `frontend/src/App.css`, `frontend/src/components/Sidebar.js`, `frontend/src/styles/theme.css`, `frontend/src/styles/tokens.json`, `frontend/src/styles/tokens.css`, `frontend/src/styles/chartTheme.js`, `frontend/src/components/common/ConfirmModal.js`, `frontend/src/components/common/ConfirmModal.css`, `frontend/src/pages/DashboardSummary.js`, `frontend/src/pages/admin/__tests__/TaxConfig.test.js`, `frontend/src/pages/admin/__tests__/InsuranceConfig.test.js`, `frontend/tests/visual/fixtures/routes.js`, `frontend/tests/visual/fixtures/paycheckMocks.js`, `frontend/tests/visual/fixtures/profileSettingsMocks.js`, `frontend/tests/visual/fixtures/securityMocks.js`, `frontend/tests/calculations.spec.js`, `frontend/package.json`, `frontend/package-lock.json`, and all backend route/controller/schema files.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 10C Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` `60 → 64` adding `/admin`, `/admin/tax-brackets`, `/admin/social-insurance`, `/admin/backup`; routes `75 / 10 / 65 / 0` (`64/65` rendering routes allowlisted; only `*` / `not-found` outside `ProtectedRoute`, plus Landing/Auth in 11A). | Gate 1 & Gate 8 |
| **I2** | `adminService.js`, `backupService.js`, `apiClient.js`, and all backend admin/backup routes byte-identical; mocks are visual-test fixtures only; no unimplemented role-edit or admin-audit-log endpoints invented. | Gate 5 & Gate 7 |
| **I3** | Zero calculation changes; `calculations.spec.js` `11/11` green; existing `TaxConfig.test.js` (`8/8`) & `InsuranceConfig.test.js` (`5/5`) byte-identical. | Gate 7 & Gate 9 |
| **I4** | Viewer-role gating unchanged (`ProtectedRoute.js:173–182` redirects non-admins from `/admin*` to `/dashboard`; `ProtectedAction` on `AdminDashboard.js` preserved; `BackupPage.js` non-admin Access Denied alert preserved). | Gate 7 & Gate 11 |
| **I5** | All existing `aria-label`s, button titles, and roles asserted by `TaxConfig.test.js` / `InsuranceConfig.test.js` preserved; new `data-testid`s (`admin-users-table`, `admin-users-mobile-cards`, `backup-delta-table`, `backup-delta-mobile-cards`) are additive. | Gate 3 & Gate 7 |
| **I6** | User table (`7–8` cols) and Backup delta table (`4` cols) collapse to D19 compact-expand cards at `≤ 768px`; Tax bracket 3-col table fits `390px` with `0` `overflow-x`; Tax modal bracket rows stack at `≤ 768px`; `BackupPage` grid switches from `minmax(480px, 1fr)` to `1fr` at `≤ 960px`; `0px` horizontal overflow at `390px`. | Gate 5, Gate 11 & Gate 17 |
| **I7** | All 4 admin routes converted atomically; no admin feature removed mid-migration. | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` remains `96` lines (`≤ 120`); App/Dashboard/ProtectedRoute suites `3/3`, `21/21`. | Gate 8 |
| **I9** | Local standalone `2048`MB build clean (`NODE_OPTIONS=""`, `GENERATE_SOURCEMAP="false"`); CI on `main` remains authoritative. | Gate 12 |
| **I10** | Existing `TaxConfig.test.js` (`8`) + `InsuranceConfig.test.js` (`5`) + new `AdminDashboard.test.js`, `BackupPage.test.js`, `AdminA11y.test.js` green under CRA `react-scripts test`. | Gate 7 & Gate 8 |
| **I11** | `0` `!important` in rewritten CSS; `lint-ratchet.js --base af34aa8` `0` regressions across all CSS files. | Gate 5 |
| **I12** | `package.json` & lockfile untouched; zero new dependencies. | Gate 5 |
| **I13** | Gate 18 cross-route spot check `0` regressions on Cluster 9 + 10A + 10B; Gate 15 `0` unexplained diffs across all `326` tests. | Gates 15 & 18 |
| **I14** | `0` gradients, blurs, glows, arbitrary shadows, masks, `background-clip: text`, or radius longhands. | Gate 5, Gate 6 & Gate 11 |
| **I15** | Neutral by default; no page-wide red or purple identity; tones strictly via `<Badge>` & `<Delta>` with §4.3/§4.3.1 provenance; accent only on interactive controls; `lint-tones.js` `0` violations. | Gate 4, Gate 7 & Gate 11 |
| **I16** | Radii `≤ 8px`; `--fs-radius-md` for cards, `--fs-radius-lg` for modals, `--fs-radius-sm` for inputs/buttons; `--fs-radius-pill` only via `<Badge>` & avatars. | Gate 5 & Gate 11 |

---

## 2. User Review Required

> [!IMPORTANT]
> Please confirm these **five decisions** before Phase 10C execution begins.

> 1. **Decision 1 — Interactive Accent in `theme-components.css` Section 26 (AGENTS.md Rule 6, Phase 10A Precedent)**:
>    - **Option A (Recommended)**: Append a tightly scoped Section 26 block to `frontend/src/styles/theme-components.css` using `html[data-fs-theme]`:
>      - `.backup-page-container .backup-format-option.selected` (`border-color: var(--fs-accent)`), `.backup-page-container input[type="radio"|"checkbox"]` (`accent-color: var(--fs-accent)`),
>      - `.admin-toggle-switch input:checked + .admin-toggle-slider` (`background-color: var(--fs-accent)`).
>      - Zero tone tokens or tone-bearing classes; mirrors Phase 10A Section 25 (`SettingsPage`).
>    - **Option B**: Keep `theme-components.css` untouched and style selected backup format cards and active toggle switches with neutral border/fill (`--fs-border-strong` / `--fs-text-2`).

> 2. **Decision 2 — Semantic `<Badge>` & `<Delta>` Tones (§4.3, §4.3.1:353–372)**:
>    - **Option A (Recommended)**: Expected / normal states stay neutral (`<Badge>`): user roles (`admin`, `manager`, `viewer`), `2FA Enabled`, config `Active`, Backup `Recommended`, Backup `Dev Mode — Restore Enabled`.
>    - Apply tone strictly to attention/deviation states with §4.3/§4.3.1 provenance:
>      - `<Badge tone="warning">` for `2FA Disabled`, config `Inactive`, and `Prod — Restore Disabled` (attention/guardrail states).
>      - `<Delta value={netDiff} />` (or neutral `0`) in the Backup dry-run/restore collection summary for net record changes (`+N` / `-N`).
>    - Gate 0 adds an **Admin / Backup status** row to §4.3 and provenance rows to §4.3.1.

> 3. **Decision 3 — Destructive Trigger Neutrality (§4.4:410, §4.3.2:390, Phase 9C/10B Precedent)**:
>    - Confirm keeping all page-level destructive triggers neutral (`.fs-btn .fs-btn-secondary` or `.fs-btn .fs-btn-ghost`): `Delete` buttons on `AdminDashboard` user rows, `Delete configuration` buttons on `TaxConfigCard` / `InsuranceConfigCard`, and `Execute Full Restore` on `BackupPage`.
>    - Reserve `.fs-btn .fs-btn-danger` strictly for the final confirmation buttons inside modals (`AdminDashboard` Delete User modal, `DeleteConfirmModal`, and `BackupPage` `RESTORE` confirmation modal).

> 4. **Decision 4 — Gate 0 Live-Scope Clarifications (§6.14:1966–1971, Invariant I2)**:
>    - `UI-UX-PLAN.md` §6.14:1966–1971 mentions role-editing and an admin audit log; live `AdminDashboard.js` manages **User creation (with initial role selection) and User deletion** (7–8 column User Management table) plus quick-navigation cards to `/admin/tax-brackets` and `/admin/social-insurance` — there is no role-edit endpoint and no admin audit-log table in the codebase. Under I2, no new backend endpoints are invented; Gate 0 records this live-scope alignment.
>    - `frontend/.eslintignore` currently lists `AdminDashboard.js`, `BackupPage.js`, `InsuranceConfigModal.js`, and `TaxConfigModal.js` (4 files); `TaxConfigPage.js` and `InsuranceConfigPage.js` are already ESLint-clean.
>    - Phase 10 Exit Gate `64 of 65` rendering routes allowlisted: all `64` protected routes in `routes.js` are now allowlisted in `THEMED_PATTERNS`; the 65th route in `routes.js` is `*` (`not-found`, outside `ProtectedRoute`), with Landing & Auth routes scheduled for Phase 11A.

> 5. **Decision 5 — 0 Design Waivers, Mixed-File Handlers & §15.5 Local Verification Authorization**:
>    - Confirm `0` design waivers (`0` `overflow-x` in all 4 CSS files, D19 compact-expand mobile cards on `AdminDashboard` and `BackupPage` at `≤ 768px`).
>    - Confirm adding guarded `window.matchMedia` hooks (`AdminDashboard.js`, `BackupPage.js`) and full APG modal focus lifecycle handlers (Escape, initial focus, Tab trap, focus restore) across the 5 admin modals, following the Phase 9C/10A/10B precedent.
>    - Authorize the local standalone Gate 12 build (`$env:NODE_OPTIONS=""; $env:GENERATE_SOURCEMAP="false"; node --max-old-space-size=2048 node_modules/react-scripts/scripts/build.js`) and full `326`-test Gate 15 visual run as an explicit **§15.5:3235 deviation**.

---

## 3. Proposed Changes

### 3.1 Gate 0 — Branch Setup & Governance Pre-Execution Sync

- Create branch `phase-ui-10c-admin` from `main @ af34aa8` and tag `ui-phase-10c-start`.
- Assert baseline-repo `D:\Projects\FinStat-visual-baselines` HEAD is `3b3cfc5` (`334/334` manifest verified).
- Update `docs/UI-UX_Plan/UI-UX-PLAN.md` (§4.3, §4.3.1, §6.14 live-scope note, §7.1/§10 §15.5 deviation record) with approved decisions.

### 3.2 `frontend/src/components/ProtectedRoute.js` & `frontend/.eslintignore`

- Append `'/admin'`, `'/admin/tax-brackets'`, `'/admin/social-insurance'`, `'/admin/backup'` to `THEMED_PATTERNS` (`60 -> 64`).
- Remove the 4 admin entries from `frontend/.eslintignore` (`AdminDashboard.js`, `BackupPage.js`, `InsuranceConfigModal.js`, `TaxConfigModal.js`).

### 3.3 `frontend/src/styles/theme-components.css` *(if Decision 1 Option A approved)*

- Append Section 26 (`Phase 10C: Admin & Backup Interactive Accent`) scoped under `html[data-fs-theme] .fs-page` for `.backup-format-option.selected`, `.backup-page-container input[type="radio"|"checkbox"]`, and `.admin-toggle-switch input:checked + .admin-toggle-slider`.

### 3.4 Route 1 — `/admin` (`AdminDashboard.js` & `AdminDashboard.css`)

- **Shell & Header**: `.fs-page` container with `<PageHeader title="Admin Dashboard" subtitle="..." actions={...} />`, neutral graphite header (zero red gradient text), single `.fs-btn .fs-btn-primary` CTA (`Add New User`) wrapped in existing `<ProtectedAction>`.
- **Quick-Navigation Cards**: 2-column graphite `.fs-card` grid linking to `/admin/tax-brackets` and `/admin/social-insurance` (zero `backdrop-filter: blur`, zero raw hex icon props, crisp `--fs-border` hover).
- **User Management Table & D19 Mobile Cards**:
  - Desktop (`> 768px`): graphite `.fs-card` with `.fs-table`, `.fs-num` for `#` and pagination counts, `<time data-visual-mask="true" className="fs-num">` for `Joined`, neutral `<Badge>` for `Role` and `2FA Enabled`, `<Badge tone="warning">` for `2FA Disabled`, neutral `.fs-btn .fs-btn-ghost` row `Delete` trigger.
  - Mobile (`≤ 768px`): guarded `matchMedia('(max-width: 768px)')` D19 compact-expand cards (`data-testid="admin-users-mobile-cards"`) showing username, role badge, 2FA badge, and expand button revealing email, attached manager, joined date, and delete trigger (`0` `overflow-x`).
  - Loading state: `<Loading variant="table" rows={5} />`; empty state: `<EmptyState>` (preserving search clear affordance if search is active).
- **Add User & Delete User Modals**:
  - Reuse shared `.modal-overlay` + `.modal-content`, add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, full APG focus lifecycle, explicit `htmlFor`/`id` on all 6 form labels, and `.fs-btn .fs-btn-danger` strictly on the Delete User confirmation button.

### 3.5 Route 2 — `/admin/tax-brackets` (`TaxConfigPage.js`, `TaxConfigCard.js`, `TaxConfigModal.js`, `TaxConfigPage.css`)

- **Page & Header**: `<PageHeader>` with `.fs-btn .fs-btn-primary` (`+ New Configuration`), `<Loading variant="grid" cards={2} />` replacing `.loading-spinner-ring`, `<EmptyState>` when empty.
- **TaxConfigCard**: Graphite `.fs-card` (zero glassmorphism/blur), remove `🔹` emoji, neutral `<Badge>` (`Active`) / `<Badge tone="warning">` (`Inactive`), `<time data-visual-mask="true" className="fs-num">` for effective dates, 3-column compact bracket table (`From`, `To`, `Rate`) with `.fs-num` alignment fitting cleanly at `390px` without `overflow-x`, neutral action buttons preserving all `aria-label`s (`Edit configuration`, `Delete configuration`, `Activate configuration`, `Deactivate configuration`) and exact text asserted by `TaxConfig.test.js`.
- **TaxConfigModal**: Shared `.modal-overlay` + `.modal-content`, full APG focus lifecycle, fix `jsx-a11y/label-has-associated-control` on the active toggle switch (`htmlFor`/`id`), replace `<th>` inline width styles with CSS classes, responsive bracket-row layout at `≤ 768px` (`0` `overflow-x`), zero blue gradient buttons.

### 3.6 Route 3 — `/admin/social-insurance` (`InsuranceConfigPage.js`, `InsuranceConfigCard.js`, `InsuranceConfigModal.js`, `InsuranceConfigPage.css`)

- **Page & Header**: `<PageHeader>` with `.fs-btn .fs-btn-primary` (`+ New Configuration`), `<Loading variant="grid" cards={2} />`, `<EmptyState>`.
- **InsuranceConfigCard**: Graphite `.fs-card`, remove `🔹` emoji and rainbow `.text-accent-blue/purple/cyan/amber` classes (all 4 statutory rates/caps render in clean `.fs-num` `--fs-text-1` inside structured neutral metric rows), preserve exact text/labels asserted by `InsuranceConfig.test.js` (`'11%'`, `'18.75%'`, `'2,000 EGP'`, `'12,600 EGP'`, `'2024 Social Insurance'`, etc.).
- **InsuranceConfigModal & DeleteConfirmModal**: Shared `.modal-overlay` + `.modal-content`, full APG focus lifecycle, fix toggle switch `htmlFor`/`id`, `.fs-btn .fs-btn-danger` strictly inside `DeleteConfirmModal`.

### 3.7 Route 4 — `/admin/backup` (`BackupPage.js` & `BackupPage.css`)

- **Page & Header**: `<PageHeader>` with neutral title (no gradient clip), status badge (`<Badge>` for `Dev Mode — Restore Enabled`, `<Badge tone="warning">` for `Prod — Restore Disabled`). Non-admin Access Denied alert preserved verbatim in behaviour.
- **Two-Card Workspace Grid**: `grid-template-columns: repeat(2, minmax(0, 1fr))` on desktop collapsing to `1fr` at `≤ 960px` (eliminating the `minmax(480px, 1fr)` overflow bug).
- **Export Backup Card**: Accessible `<label>`/`<input type="radio">` cards (`.backup-format-option` — removing click handlers on non-interactive elements so `jsx-a11y` passes cleanly), `.fs-btn .fs-btn-primary` `Download Backup` CTA, static disabled text during export (no `animate-spin`).
- **Restore Backup Card**: Accessible upload button / `<label htmlFor="backup-file-input">` drop zone (fixing `jsx-a11y/click-events-have-key-events` & `no-static-element-interactions`, replacing inline `display: none` with `.fs-sr-only`), accessible checkbox for `Include Users collection`, neutral `.fs-btn .fs-btn-secondary` `Run Dry-Run Preview` & `Execute Full Restore` buttons (Decision 3).
- **Delta Preview / Restore Results Table & D19 Mobile Cards**:
  - Desktop (`> 768px`): 4-column `.fs-table` (`Collection`, `To Delete`, `To Insert`, `Net Difference`) with `.fs-num` and `<Delta>` for net differences.
  - Mobile (`≤ 768px`): guarded `matchMedia` D19 compact-expand cards (`data-testid="backup-delta-mobile-cards"`, `0` `overflow-x`).
- **Restore Confirmation Modal**: Shared `.modal-overlay` + `.modal-content .fs-surface-solid` (§6.14:1968), remove `autoFocus` attribute in favour of programmatic `useEffect` initial focus (fixing `jsx-a11y/no-autofocus`), full APG focus trap + Escape + focus restore, `.fs-mono` `RESTORE` input, and `.fs-btn .fs-btn-danger` `Confirm Full Restore`.

### 3.8 Visual Fixtures & New Tests

- **`frontend/tests/visual/fixtures/adminMocks.js`**: Deterministic mocks for `/api/admin/users`, `/api/admin/tax-brackets`, `/api/admin/social-insurance`, and `/api/admin/backup/status` (registered in `visual.spec.js`, `a11y.spec.js`, and `admin-reference-match.spec.js`).
- **Unit & A11y Suites**:
  - `frontend/src/pages/admin/__tests__/AdminDashboard.test.js` (users table, search, pagination, Add User modal, Delete User modal, mobile D19 cards, non-admin `ProtectedAction`).
  - `frontend/src/pages/admin/__tests__/BackupPage.test.js` (dev/prod status badges, format selection, export call, dry-run delta table + mobile D19 cards, `RESTORE` modal gating, non-admin Access Denied state).
  - `frontend/src/pages/admin/__tests__/AdminA11y.test.js` (`jest-axe` 0 violations across all 4 routes + open modals, Escape/focus-restore checks).
- **Reference-Match Spec**: `frontend/tests/visual/admin-reference-match.spec.js` capturing `admin`, `admin-tax-brackets`, `admin-social-insurance`, `admin-backup` at `1440`/`390` + modal states + Frame 01/02 Variant B side-by-side artifacts.

---

## 4. Verification Plan (Gates 0–19)

| Gate | Command / Check | Pass Criterion |
|:---:|---|---|
| **0** | Branch `phase-ui-10c-admin` from `af34aa8`, tag `ui-phase-10c-start`, verify baseline HEAD `3b3cfc5` (`334/334`), sync `UI-UX-PLAN.md` | Clean branch + synced governance |
| **1** | `node frontend/scripts/audit-routes.js` | `75 / 10 / 65 / 0`; `THEMED_PATTERNS = 64` |
| **2** | Stylelint on `frontend/src/pages/admin/*.css` + `theme-components.css` | `0` errors, `0` warnings |
| **3** | ESLint on `frontend/src/pages/admin/*.js` + `ProtectedRoute.js` | `0` errors, `0` warnings; 4 entries removed from `.eslintignore` |
| **4** | `node frontend/scripts/lint-tones.js` | `0` violations |
| **5** | `node frontend/scripts/lint-ratchet.js --base af34aa8` + protected-files `git diff --name-only af34aa8` check | `0` regressions; `0` protected files touched |
| **6** | Grep audit for gradients, blurs, glows, `overflow-x`, `!important`, raw hex, `var(--fs-accent)` in page CSS | `0` hits |
| **7** | `TaxConfig.test.js` (`8/8` untouched), `InsuranceConfig.test.js` (`5/5` untouched), `AdminDashboard.test.js`, `BackupPage.test.js`, `AdminA11y.test.js` | `100%` passing |
| **8** | `App.test.js`, `DashboardSummary.test.js`, `ProtectedRoute.test.js` | `3/3` suites, `21/21` tests |
| **9** | `calculations.spec.js` | `11/11` tests passing |
| **10** | Full Jest suite check (if needed) / no regressions in shared components | `0` failures |
| **11** | `npx playwright test a11y.spec.js -g "admin"` + `admin-reference-match.spec.js` (live `1440`/`390` + `0px` overflow + modal states) | `0` axe violations, `0px` overflow, all interactive checks green |
| **12** | `$env:NODE_OPTIONS=""; $env:GENERATE_SOURCEMAP="false"; node --max-old-space-size=2048 node_modules/react-scripts/scripts/build.js` | Clean production build (`0` errors) |
| **13** | Recapture `20` baselines (`admin`, `admin-tax-brackets`, `admin-social-insurance`, `admin-backup` × `5` viewports) + `verify-baseline-manifest.js` | `20` baselines updated; `334/334` manifest verified |
| **14** | Baseline repo commit in `D:\Projects\FinStat-visual-baselines` | Clean commit hash recorded |
| **15** | Full `326`-test visual suite (`npx playwright test visual.spec.js`) | `0` unexplained diffs (`292` pass / `34` skip or current exact split) |
| **16** | Visual inspection of all `20` recaptured PNGs + Frame 01/02 side-by-side PNGs | Zero visual defects, zero red/purple washes, clean contrast |
| **17** | Mobile `390px` & `480px` overflow + D19 card expand/collapse verification | `0px` horizontal overflow across all 4 routes |
| **18** | Cross-route regression spot check on Cluster 9 + 10A + 10B slugs | `0` pixel diffs |
| **19** | Two-stage walkthrough artifact (`phase_10c_walkthrough.md`) + **User Gate 19 sign-off** before `--no-ff` merge to `main`, `CHANGELOG.md` sync, and push | Explicit user sign-off |

---

## 5. Phase 10 Exit Gate Checklist (§6.14:1974–1982)

- [ ] `8/8` Phase 10 routes themed (`10A: 3` + `10B: 1` + `10C: 4`).
- [ ] No page-wide red or purple identity across `/profile`, `/settings`, `/settings/recycle-bin`, `/security`, `/admin`, `/admin/tax-brackets`, `/admin/social-insurance`, `/admin/backup`.
- [ ] Viewer-role UI unchanged in behaviour (`ProtectedRoute` admin redirect, `ProtectedAction`, `BackupPage` Access Denied).
- [ ] `64 of 65` rendering routes allowlisted in `THEMED_PATTERNS` (only `*` / `not-found` outside `ProtectedRoute`, plus Landing/Auth in Phase 11A).
