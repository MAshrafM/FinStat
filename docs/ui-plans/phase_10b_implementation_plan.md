# UI Phase 10B — Security (`/security`) — Implementation Plan

- **Date**: 2026-11-28
- **Revision**: **v2** — first-review corrections: plan-consistent badge tones (Option B default) with §4.3/§4.3.1 provenance, five explicit review decisions including mixed-file hook/handler and full APG modal focus lifecycle, D23 purge of all loading states, no ellipsis truncation, card radius correction, username typography correction, shared `.modal-overlay`/`.modal-content` reuse, volatile timestamp masking, I1–I16 compliance map, §7.1/§7.2/§10/CHANGELOG governance sync with corrected citations, full gate command blocks (Gate 5/11/13/14/15/18), Gate 18 `14`-slug / `71`-pass scope, explicit §15.5 deviation record, `25`-PNG §7.4 ledger, and Gate 19 two-stage walkthrough spec.
- **Phase**: `10B` (Cluster 10 middle — Account, Security, Admin)
- **Branch**: `phase-ui-10b-security` *(tag `ui-phase-10b-start`; local branch policy per §14/§10; only `main` is pushed after Gate 19 user sign-off)*
- **Merge Base**: `main` @ `1edb58d`
- **Starting Baseline Commit**: `723c4ac` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified; carried from Phase 10A)
- **Route Allowlisted (`+1`, `THEMED_PATTERNS` `59 -> 60`)**:
  - `/security` (`frontend/src/pages/security/SecuritySettingsPage.js`, slug `security`)
- **Taste Checkpoint**: None (Checkpoint #8 signed off in 10A; Checkpoint #9 is 11A Landing per §6.1.1:1092–1102). A Frame 01 Variant B side-by-side artifact is still captured under §7.4:2159.
- **Waivers Requested**: **0 design waivers** (4-column Login Audit Trail collapses to D19 compact-expand cards at `≤ 768px`; `0` `overflow-x`; `0` tone tokens in page CSS; `0` gradients/blurs/glows; `0` changes to `theme.css` or `theme-components.css`). A separate **explicit authorized §15.5 deviation** is requested for the local Gate 12 build and full `326`-test Gate 15 visual run.
- **Status**: `Complete — Gate 19 Signed Off (2026-11-28)`

---

## Goal Description

Phase 10B converts `/security` (`SecuritySettingsPage.js` & `SecuritySettingsPage.css`) into FinStat's dark graphite design system under D22 attribute-existence scoping (`html[data-fs-theme]`). It removes the legacy purple gradient heading, violet identity wash, blurred modal backdrop, all 42 inline styles, all 5 raw hex icon props, and every ad-hoc loading state; adds accessible modals with the full APG focus lifecycle; and advances `THEMED_PATTERNS` from `59` to `60` (leaving only the 4 Phase 10C admin routes before Phase 10 exit at `64 of 65`).

---

## 0. Verified Codebase Audit & Architectural Decisions

1. **CSS violations (`88` Stylelint errors in `SecuritySettingsPage.css`, 368 lines)**:
   - Banned gradient text on `.security-page-title` (`linear-gradient(135deg, #ffffff 0%, #c084fc 100%)` + `-webkit-background-clip: text`), banned gradient & glow on `.action-btn-primary` (`linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)`), and banned `backdrop-filter: blur(6px)` on `.security-modal-overlay`.
   - Violet accent wash (`#c084fc`, `rgba(168, 85, 247, ...)`) on icon badges, card hover borders, secret box, copy buttons, and pagination buttons.
   - Radii above the `8px` ceiling (`18px` modal, `16px` cards, `12px` icon badges/boxes, `10px` buttons, `20px` pills) and arbitrary `rgba()` `box-shadow`s.
   - `.audit-table-card { overflow-x: auto; }` (`line 309`) plus inline `style={{ overflowX: 'auto' }}` (`JSX:338`) on a 4-column table (not eligible for the §I6/§7.1 ≥12-column audit-log exception).
2. **JSX violations (`87` ESLint problems: `84` errors, `3` warnings in `SecuritySettingsPage.js`, 664 lines; `.eslintignore:24`)**:
   - **42** inline `style={{...}}` (`34` colour-bearing) and **5** raw hex icon `color="#..."` props (`lines 224, 304, 365, 504, 510`).
   - **3** warnings: `2` `jsx-a11y/label-has-associated-control` (modal inputs missing `htmlFor`/`id`) and `1` `jsx-a11y/no-autofocus` (`line 459`).
   - Modals lack `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, initial focus, Tab focus trap, Escape close, and focus restore; close buttons and the password visibility toggle lack accessible labels.
3. **D23 loading audit (expanded after first review)**: the draft initially named only `line 216` (`<div className="loading-spinner" style={{ margin: '40px auto' }}>Loading...</div>`). Live code also contains `'LOADING...'` in the secret box (`line 429`) and `animate-spin` on the Refresh icon (`line 334`); `auditLoading` (`lines 62, 80–93`) has no shaped state. All four are purged in favour of `<Loading>` variants/static disabled button states per §6.4:1291 and D23 (`UI-UX-PLAN.md:711`).
4. **Zero external references / zero existing unit tests**: only `App.js:93,129`, `Sidebar.js:71`, and `tests/visual/fixtures/routes.js:17` reference `/security` or `SecuritySettingsPage`. No Jest suite exists under `frontend/src/pages/security/`; new suites are additive, so I5 has no existing `data-testid` / `aria-label` to delete.
5. **Tone semantics**: §4.3:310/314/321/344 define tone as *deviation from expectation* and make the per-domain table normative. `Enabled` and `Success` are expected states and stay neutral (Decision 1 Option B). `Disabled`, `Failed`, and `Save Now` are attention/deviation states with code sources recorded in §4.3.1. There is no security domain in §4.3:323–339 today, so Gate 0 adds one.
6. **Typography contract (§4.5:444, §7.2:2131)**: `.fs-num` (Plex Sans + `tabular-nums`, right-aligned) is used for audit timestamps and page/attempt counts; `.fs-mono` is used only for identifiers/credentials (formatted secret, backup codes, IP address, 6-digit TOTP inputs). The active username is prose, not an identifier column, and stays `--fs-text-2`.
7. **Mobile table rule**: §6.4:1293 requires long values to wrap fully with `break-word` and forbids ellipsis truncation. The live device/client cell uses `text-overflow: ellipsis`; it is replaced with `overflow-wrap: anywhere` in both desktop and expanded mobile views. `title` is retained as a hover aid but never substitutes for wrapping.
8. **Modal implementation precedent**: §6.1.1:1106 puts shared fixes in `theme.css` / `theme-components.css` / primitives, not page-local overrides. `theme-components.css:897–921` already supplies `.modal-overlay` (`--fs-scrim`, `backdrop-filter: none`) and `.modal-content` (`--fs-surface`, `--fs-border`, `--fs-radius-lg`, `--fs-shadow`). Both classes are reused; page CSS supplies only page-specific layout. Full APG focus lifecycle (initial focus, Tab trap, Escape, focus restore) follows `phase_8c_implementation_plan.md:192,223`.
9. **Mixed-file gate**: §6.4:1303 says mixed-logic files may change only `className`, `style`, and JSX structure. The guarded `matchMedia` hook follows the Phase 9C/10A precedent (`phase_9c_implementation_plan.md:39–44`); the new Escape/focus handlers are explicitly accepted at Gate 0 under Decision 5 (same pattern as 10A's APG tab handlers).
10. **Volatile data**: §9.5:2480 requires timestamps to carry `data-visual-mask`; audit times render as `<time data-visual-mask="true" className="fs-num">`.
11. **Empty-state action**: §6.4:1292 asks for one primary action. The live empty audit table has no action beyond the card-header Refresh button; no new action is invented. Gate 0 records this as an I2-driven deviation (identical to 10A's no-action `EmptyState` treatment).
12. **Count integrity**: re-verified on 2026-11-28 — `main @ 1edb58d`, baseline `723c4ac`, `334/334` manifest, `59` allowlist patterns, `75 / 10 / 65 / 0` route counts, `88` Stylelint errors, `87` ESLint problems, `42` inline styles, `5` hex icon props. Stale draft citations corrected: `§4.4:409` → **`:410`** (destructive rule), `.eslintignore:26` → **`:24`**.

### Target Production Files

- `frontend/src/pages/security/SecuritySettingsPage.js`
- `frontend/src/pages/security/SecuritySettingsPage.css`
- `frontend/src/components/ProtectedRoute.js` *(allowlist only)*
- `frontend/.eslintignore` *(remove the Security entry only)*
- `frontend/tests/visual/fixtures/securityMocks.js` *(new)*
- `frontend/tests/visual/visual.spec.js`, `a11y.spec.js`, `playwright.config.js` *(mock/spec registration only)*
- `frontend/tests/visual/security-reference-match.spec.js` *(new)*
- `frontend/src/pages/security/__tests__/SecuritySettingsPage.test.js`, `SecuritySettingsA11y.test.js` *(new)*

### Protected Files (Strictly Untouched — Verified via `git diff 1edb58d`)

`frontend/src/services/authService.js`, `frontend/src/services/apiClient.js`, `frontend/src/utils/formatters.js`, `frontend/src/App.js`, `frontend/src/App.css`, `frontend/src/components/Sidebar.js`, `frontend/src/styles/theme.css`, `frontend/src/styles/theme-components.css`, `frontend/src/styles/tokens.json`, `frontend/src/styles/tokens.css`, `frontend/src/styles/chartTheme.js`, `frontend/src/components/common/ConfirmModal.js`, `frontend/src/components/common/ConfirmModal.css`, `frontend/src/components/ui/Tabs.js`, `frontend/src/pages/DashboardSummary.js`, `frontend/tests/visual/fixtures/routes.js`, `frontend/tests/visual/fixtures/paycheckMocks.js`, `frontend/tests/visual/fixtures/profileSettingsMocks.js`, `frontend/tests/calculations.spec.js`, `frontend/package.json`, `frontend/package-lock.json`, and all backend route/controller/schema files. The Gate 5 pathspec below enforces this mechanically.

---

## 1. Governing Invariant Compliance Map (§2 I1–I16)

| Invariant | Phase 10B Commitment | Verification Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` `59 → 60` adding `/security` only; routes `75 / 10 / 65 / 0`. | Gate 1 & Gate 8 |
| **I2** | `authService.js`, `apiClient.js`, backend auth/audit routes and payloads byte-identical; mocks are fixtures only; no session-management endpoints invented; live-scope deviations recorded. | Gate 5 & Gate 7 |
| **I3** | Zero calculation changes; `formatCurrency()` (`$`) retained; `calculations.spec.js` `11/11` green. | Gate 7 & Gate 9 |
| **I4** | Auth/role behaviour unchanged; role-specific copy preserved for `admin` / `manager` / `viewer`; viewer-role read-only affordances unchanged; no `<ProtectedAction>` change on this page. | Gate 7 & Gate 11 |
| **I5** | No existing security `data-testid` / `aria-label` exists to delete; new IDs (`security-audit-table`, `security-mobile-cards`, `security-audit-empty`) and modal labels are additive. | Gate 3 & Gate 7 |
| **I6** | 4-column table collapses to D19 compact-expand cards at `≤ 768px`; `0px` overflow at `390px`; `0` `overflow-x` in 10B CSS; no waiver because the ≥12-column exception does not apply. | Gate 5, Gate 11 & Gate 17 |
| **I7** | Single route converted atomically; no functionality removed mid-migration. | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` remains `96` lines (`≤ 120`); App/Dashboard/ProtectedRoute suites `3/3`, `21/21`. | Gate 8 |
| **I9** | Local standalone `2048`MB build clean; CI on `main` remains authoritative. | Gate 12 |
| **I10** | New `SecuritySettingsPage.test.js` + `SecuritySettingsA11y.test.js` green (`2` suites / `14` tests); CRA `react-scripts test`. | Gate 7 & Gate 8 |
| **I11** | `0` `!important` in rewritten CSS; `lint-ratchet.js --base 1edb58d` `0` regressions across `63` CSS files. | Gate 5 |
| **I12** | `package.json` & lockfile untouched; no new dependency (shared primitives reused). | Gate 5 |
| **I13** | Gate 18 `71/71` (`0` diffs on Cluster 9 + 10A + unthemed 10C); Gate 15 `292/34` (`0` unexplained diffs). | Gates 15 & 18 |
| **I14** | `0` gradients, blurs, glows, arbitrary shadows, masks, `background-clip: text`, or radius longhands. | Gate 5, Gate 6 & Gate 11 |
| **I15** | Neutral by default; tones only via `<Badge>` with §4.3/§4.3.1 provenance; `.fs-num` figures, identifier-only `.fs-mono`; accent only on primary CTA; `lint-tones.js` `0` violations. | Gate 4, Gate 7 & Gate 11 |
| **I16** | Radii `≤ 8px`; `--fs-radius-md` for cards, `--fs-radius-lg` for shared modal content, `--fs-radius-sm` for inputs; `--fs-radius-pill` only via `<Badge>`. | Gate 5 & Gate 11 |

---

## 2. User Review Required

> [!IMPORTANT]
> Please confirm these **five decisions** before Phase 10B execution begins. v2 applies the recommended technical path; each item still requires explicit approval at Gate 0.

> 1. **Decision 1 — Semantic `<Badge>` Tones (§4.3, §4.3.1:353–372)**:
>    - **Option B (Recommended / v2 default)**: `Enabled`, `Success`, and the role badge are neutral (`<Badge>`). Apply tone only to attention/deviation states: `<Badge tone="warning">Disabled</Badge>`, `<Badge tone="negative">Failed</Badge>`, and `<Badge tone="warning">Save Now</Badge>` (with explicit text + icon cues, never tinted fills).
>    - **Option A (withdrawn)**: `Enabled` / `Success` as `tone="positive"` conflicts with §4.3:310/314/321/344 and the 9C/10A neutral-status precedent; it would require prohibited §4.3 per-domain and §4.3.1 amendments for an expected state.
>    - Gate 0 adds a **Security / auth status** row to the normative §4.3:323–339 table and three five-column provenance rows to §4.3.1 (see §3.1), plus a §10 decision record and label/tests updates under §4.3.1:372 if any label changes.

> 2. **Decision 2 — Destructive Trigger Neutrality (§4.4:410, §4.3.2:390, Phase 9C Precedent)**:
>    - Confirm keeping the page-level `Disable 2FA` button neutral (`.fs-btn .fs-btn-secondary`) and reserving `.fs-btn .fs-btn-danger` strictly for the `Confirm Disable` button inside the confirmation modal (zero unconfirmed red buttons on the resting page).

> 3. **Decision 3 — Gate 0 Live-Scope Clarifications (§6.14:1959, Invariant I2)**:
>    - §6.14:1959 says *“Verify 2FA setup/disable, session list, and permission gating.”* The live page has a **4-column Login Audit Trail**, not an active-sessions list, and shows role-specific permission copy while allowing every authenticated user to manage their own 2FA. No backend session-management endpoints are invented.
>    - The `/security` login audit trail is distinct from the **admin audit log** reserved for 10C `AdminDashboard.js` (§6.14:1948). Gate 0 records both distinctions inline.
>    - Empty-state action (§6.4:1292) is N/A under I2: the existing card-header Refresh button is the only refresh affordance; no new action is invented.
>    - The guarded `window.matchMedia` hook (Phase 9C/10A precedent) is accepted in this mixed-logic page.

> 4. **Decision 4 — 0 Design Waivers, Explicit §15.5 Deviation & Local Verification Authorization**:
>    - Confirm `0` design waivers, `0` new `overflow-x`, D19 mobile cards at `≤ 768px`, and `0` changes to `theme.css` / `theme-components.css`.
>    - Separately authorize the local standalone Gate 12 build (`$env:GENERATE_SOURCEMAP='false'; node --max-old-space-size=2048 node_modules/react-scripts/scripts/build.js`) and the full `326`-test Gate 15 visual run as an explicitly recorded **§15.5:3235 deviation** (CI visual job removed at `UI-UX-PLAN.md:36`; D21:709 / §7.1:2101 require a locally attached Playwright diff report). Gate 0 records the authorization in §7.1 and §10; the walkthrough records the heap size and serving harness that succeeded.

> 5. **Decision 5 — Modal Focus Lifecycle & Mixed-File Handler Decision (§6.4:1303, §6.1.1:1106)**:
>    - Confirm adding Escape dismissal, initial focus, Tab/Shift+Tab focus trap, and focus restore to the three modals, plus the `matchMedia` hook, in `SecuritySettingsPage.js`. This extends the §6.4:1303 mixed-file allowance and is accepted at Gate 0 exactly as 10A accepted APG tab handlers.
>    - Confirm reusing shared `.modal-overlay` / `.modal-content` classes from `theme-components.css:897–921` so page CSS adds only page-specific layout and duplicate token declarations are avoided.

---

## 3. Proposed Changes

### 3.1 Gate 0 — Branch Setup & Governance Pre-Execution Sync

- Create branch `phase-ui-10b-security` from `main @ 1edb58d` and tag `ui-phase-10b-start`.
- Assert baseline-repo `D:\Projects\FinStat-visual-baselines` HEAD is `723c4ac` (`334/334` manifest verified) before any recapture.
- Save the approved v2 plan copy to `docs/ui-plans/phase_10b_implementation_plan.md`.
- Amend `docs/UI-UX_Plan/UI-UX-PLAN.md`:
  - **§4.3:323–339** — add the normative domain row: `Security / auth status | Enabled, Success, role | — | 2FA disabled, backup codes not saved | Failed login`.
  - **§4.3.1:355** — add three five-column rows:
    - `Security / 2FA | 2FA disabled | Disabled | pages/security/SecuritySettingsPage.js (user?.totpEnabled false; JSX:250) | Neutral, no label`
    - `Security / Login audit | unsuccessful login | Failed | pages/security/SecuritySettingsPage.js (log.success === false; JSX:358) | Neutral, no label`
    - `Security / Backup codes | codes not yet acknowledged | Save Now | pages/security/SecuritySettingsPage.js (backup-code warning banner; JSX:509–513) | Neutral, no label`
  - **§5:968** — check both boxes on the `/security` row and update the note from “42 inline styles” to “converted in 10B; 0 inline styles, 0 raw hex”.
  - **§6.1:1075** — mark 10B `in progress` with branch/tag and Gate 0 SHA placeholder.
  - **§6.14:1955–1961** — record Decisions 1–5, the live-scope clarifications, the §4.3 domain row, and the §15.5 deviation; keep boxes unchecked until Gate 19 final sync.
  - **§7.1:2089–2107** — record `0` design waivers, `0` new `overflow-x`, the authorized local `2048`MB build, and the authorized full `326`-test Gate 15 run as an §15.5 deviation.
  - **§7.2:2113–2139** — record Decision 1 provenance, Decision 5 focus lifecycle, `.fs-num`/identifier-only `.fs-mono`, no ellipsis truncation, Frame 01 I2 deviations (no group-by/sortable `<th>`/checkbox/empty-state action), and mixed-file hook/handler acceptance.
  - **§10:2521–2526** — append an in-progress 10B row and decision note after the existing 10A note (append-only; never edit past rows).
  - **`CHANGELOG.md`** — add the user-facing “What’s new” bullet per §3.2:224 (security page updates, clearer 2FA controls, mobile-friendly audit trail), not developer-only wording.

### 3.2 `/security` — Security & Access Control

#### [MODIFY] [SecuritySettingsPage.js](file:///d:/Projects/FinStat/frontend/src/pages/security/SecuritySettingsPage.js)

- Import `{ Badge, Loading, EmptyState }` from `../../components/ui`.
- **Loading (D23)**: replace the early return at `lines 215–217` with `<div className="security-page-container"><Loading variant="card" text="Loading security settings..." /></div>` so the shell is consistent. While `auditLoading`, render `<Loading variant="table" rows={3} text="Loading audit logs..." />` in place of the audit table body. While `setupLoading && !formattedSecret`, render `<Loading variant="form-field" text="Generating secret..." />` in the secret box. During `Verify & Activate` / `Confirm Disable`, keep static disabled button labels (`Verifying...` / `Disabling...`) with `aria-hidden="true"` icons — no second `role="status"` inside a button (10A save-flow precedent).
- **Purge all 42 inline styles and 5 hex `color="#..."` props** to semantic classes (`0` `[style]` attributes, `0` raw hex literals, `0` ad-hoc spinners).
- **Header**: plain `<h1>` (`--fs-text`, no gradient text) and neutral `<Shield size={24} className="security-header-icon" aria-hidden="true" />` inside a sunken header shell.
- **Top Cards Grid**:
  - **2FA Card**: `<Badge>Enabled</Badge>` / `<Badge tone="warning">Disabled</Badge>` (Decision 1), neutral `<Key aria-hidden="true" />` icon container, single primary CTA `.fs-btn .fs-btn-primary` (`Enable 2FA`, `--fs-ink` on `--fs-accent`) when disabled, or neutral `.fs-btn .fs-btn-secondary` (`Disable 2FA`, Decision 2) when enabled.
  - **Role & Permissions Card**: neutral `<Badge>{user?.role || 'viewer'}</Badge>`, neutral `<UserCheck>` and `<Laptop>` icons (`aria-hidden="true"`), active username in `.security-username` using `--fs-text-2` (not `.fs-mono`).
- **Login Audit Trail Card (4 columns + D19 Mobile Cards)**:
  - Neutral Refresh button (`.fs-btn .fs-btn-secondary .fs-btn-sm`) with a static `<RefreshCw aria-hidden="true" />` icon; no `animate-spin`.
  - Guarded `window.matchMedia('(max-width: 768px)')` state (`isMobile`, defaulting to `false` in jsdom; `change` listener removed on unmount — Phase 9C/10A precedent). Only one mode is in the DOM at a time.
  - **Desktop (`!isMobile`)**: `<table className="fs-table audit-table" data-testid="security-audit-table">` with neutral `<Badge>Success</Badge>` / `<Badge tone="negative">Failed</Badge>` and existing status icons, `<time className="fs-num" data-visual-mask="true">` timestamp, `<code className="audit-ip-code fs-mono">` IP address, and a full device/client value with `overflow-wrap: anywhere` (no ellipsis; `title` retained as hover aid).
  - **Mobile (`isMobile`)**: `<div className="security-mobile-cards" data-testid="security-mobile-cards">` compact-expand cards with `aria-expanded`, `aria-label="Show details for ..."` / `"Hide details for ..."`, and `≥ 44px` expanders. Compact row: Status `<Badge>` + `.fs-num` timestamp. Expanded details: `.fs-mono` IP address and full wrapping Device / Client string.
  - **Empty state**: `<EmptyState data-testid="security-audit-empty" icon={<ShieldAlert />} title="No audit logs recorded yet." />` (replaces the colspan cell); no invented action per §3.1 I2 deviation.
  - **Pagination**: `.fs-btn .fs-btn-secondary .fs-btn-sm` Previous/Next buttons and `.fs-num` page/attempt counts.
- **Three Modals (2FA Setup, Backup Codes, Disable 2FA)**:
  - Overlay: `className="modal-overlay security-modal-overlay"`; content: `className="modal-content security-modal-content"`; `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the content.
  - Full APG focus lifecycle: on open move focus to the close button (or first input where no close button exists), trap Tab/Shift+Tab within the dialog, close on Escape, and restore focus to the exact invoking trigger. Remove `autoFocus`.
  - `aria-label="Close modal"` on close buttons (`min-width/min-height: 44px`) and `aria-label={showDisablePassword ? 'Hide password' : 'Show password'}` on the password toggle.
  - Explicit `htmlFor`/`id` associations: `security-verify-code`, `security-disable-password`, `security-disable-code`; inline errors carry `role="alert"` (`security-modal-error`).
  - `.fs-mono` on `formattedSecret`, backup code pills, and 6-digit TOTP inputs.
  - Backup codes warning banner: flat sunken neutral card (`--fs-surface-sunken`, `border-left: 3px solid var(--fs-border-control)`) + `<Badge tone="warning">Save Now</Badge>` (`0` tone tokens in CSS).
  - Buttons: `Cancel` / `Copy` / `Download .txt` use `.fs-btn .fs-btn-secondary`; `Verify & Activate` / `I have saved these codes` use `.fs-btn .fs-btn-primary`; `Confirm Disable` uses `.fs-btn .fs-btn-danger`.

#### [MODIFY] [SecuritySettingsPage.css](file:///d:/Projects/FinStat/frontend/src/pages/security/SecuritySettingsPage.css)

- Rewrite completely under `html[data-fs-theme] .fs-page .security-page-container`; page-specific modal rules are scoped `html[data-fs-theme] .fs-page .security-modal-overlay` / `.security-modal-content` while base overlay/content styling comes from shared `.modal-overlay` / `.modal-content`.
- `0` hex colors, `0` `rgba()`, `0` gradients, `0` `backdrop-filter: blur`, `0` `-webkit-background-clip: text`, `0` `!important`, `0` `overflow-x`, `0` page-CSS `var(--fs-accent)`, `0` tone tokens.
- Cards: `background: var(--fs-surface-raised)`, `border: var(--fs-border-width) solid var(--fs-border)`, `border-radius: var(--fs-radius-md)` (§4.8:552 cards = 6px), `box-shadow: none`.
- Inputs: `background: var(--fs-surface)`, `border: var(--fs-border-width) solid var(--fs-border-control)`, `border-radius: var(--fs-radius-sm)`, focus ring `outline: var(--fs-focus-ring); outline-offset: var(--fs-focus-offset)`.
- `.security-page-grid` uses `grid-template-columns: repeat(2, 1fr)` collapsing to `1fr` at `@media (max-width: 768px)` (eliminates legacy `minmax(360px, 1fr)` overflow risk at `390px`).
- D19 mobile card styles, `overflow-wrap: anywhere` for device/client, `≥ 44px` touch targets, and `0px` horizontal overflow at `390px`.

### 3.3 Allowlist, ESLint Ignore & Test Infrastructure

#### [MODIFY] [ProtectedRoute.js](file:///d:/Projects/FinStat/frontend/src/components/ProtectedRoute.js)
- Add `'/security'` to `THEMED_PATTERNS` (`59 -> 60`). No other logic changes.

#### [MODIFY] [.eslintignore](file:///d:/Projects/FinStat/frontend/.eslintignore)
- Remove `src/pages/security/SecuritySettingsPage.js` (**current line 24**). Assert `0` remaining security entries at Gate 6.

#### [NEW] [securityMocks.js](file:///d:/Projects/FinStat/frontend/tests/visual/fixtures/securityMocks.js)
- Full CORS + `OPTIONS 204` deterministic mocks for:
  - `GET /api/auth/me` (`totpEnabled: false` default and `totpEnabled: true` toggle; `role` switch for `admin` / `manager` / `viewer`; `username: 'admin_user'`)
  - `POST /api/auth/2fa/setup` (deterministic `secret` / `formattedSecret`)
  - `POST /api/auth/2fa/verify-setup` (10 deterministic backup codes)
  - `POST /api/auth/2fa/disable`
  - `GET /api/auth/audit-logs*` (3 deterministic logs: 2 `Success`, 1 `Failed`; `empty: true`, `error: true`, `delayMs` switches)
- Support `error: true` for the initial user fetch and each 2FA mutation so loading/empty/error screenshots are reproducible; assert visible toasts/messages on error captures with generic masking disabled in the reference spec.

#### [MODIFY] [visual.spec.js](file:///d:/Projects/FinStat/frontend/tests/visual/visual.spec.js) & [a11y.spec.js](file:///d:/Projects/FinStat/frontend/tests/visual/a11y.spec.js)
- Add `else if (route.slug === 'security') { await setupSecurityMocks(page); }` as the **final branch** after the 10A profile/settings branch in **both** files; only the `security` slug, no global `page.route` registration.

#### [MODIFY] [playwright.config.js](file:///d:/Projects/FinStat/frontend/playwright.config.js)
- Register `security-reference-match` in the `reference` project `testMatch` regex. No other config changes.

#### [NEW] [security-reference-match.spec.js](file:///d:/Projects/FinStat/frontend/tests/visual/security-reference-match.spec.js)
- Expected `9 passed` (`1` setup + `8` specs), invoked by basename (`testDir` is `tests/visual`):
  1. `/security` 5-width sweep (`1440/1024/768/480/390`): dark canvas `[16,17,20]`, `data-fs-theme="dark"`, flat cards, `boxShadow: none`, radii `≤ 8px`, neutral `Enabled` / role badges, single `.fs-btn-primary`, `0` `[style]`, `0px` overflow, computed `.fs-num` / `.fs-mono` assertions.
  2. Frame 01 Variant B side-by-side at `1440/390` (`frame-01-dense-table-side-by-side-*`).
  3. 2FA setup → verify → backup codes modal flow, including initial focus, Tab trap, Escape, and focus restore.
  4. 2FA disable modal flow, including validation error and `.fs-btn-danger` only inside the dialog.
  5. D19 mobile cards at `390/480`: desktop table unrendered, expand/collapse, `≥ 44px` expanders, `0px` overflow, full device/client wrap.
  6. Loading / empty / error states via forced mocks: generic toast/status masking disabled for these captures only; assert visible message/toast before capture.
  7. Touch targets `≥ 44px` and visible `:focus-visible` rings (including modal focus lifecycle).
  8. Computed-style/typography table: no ellipsis, `<time data-visual-mask>`, no page-CSS tone/accent, no inherited `.fs-page` collisions.
- Captures the `25` named §7.4 PNGs below into gitignored `docs/ui-snapshots/phase-10b/`.

#### [NEW] Unit & Accessibility Jest Tests
- `frontend/src/pages/security/__tests__/SecuritySettingsPage.test.js` — `9` tests: loads user + audit logs; role copy for `admin` / `manager` / `viewer`; 2FA setup → verify → backup codes; setup validation error; disable validation error; disable success; pagination; refresh; D19 mobile cards via guarded `matchMedia` (desktop table absent in mobile DOM).
- `frontend/src/pages/security/__tests__/SecuritySettingsA11y.test.js` — `5` `jest-axe` tests with `0` violations: default, setup modal, backup codes modal, disable modal, mobile D19 cards; assert modal ARIA/focus lifecycle and `0` `[style]` attributes.
- Gate 7 expects `2` suites / `14` tests (`9 + 5`).

### 3.4 §7.4 Local Artifact Inventory

All files live in gitignored `docs/ui-snapshots/phase-10b/`, each `≥ 1000` bytes, **`25` PNGs total**, with no overwrite of 9A–9C or 10A directories:

| Artifact group | Files | Count |
|---|---|---:|
| Route sweeps | `security-{1440,1024,768,480,390}.png` | 5 |
| Frame 01 side-by-side | `frame-01-dense-table-side-by-side-{1440,390}.png` | 2 |
| 2FA enabled state | `security-2fa-enabled-{1440,390}.png` | 2 |
| 2FA setup modal | `security-2fa-setup-modal-{1440,390}.png` | 2 |
| Backup codes modal | `security-backup-codes-modal-{1440,390}.png` | 2 |
| Disable 2FA modal | `security-disable-2fa-modal-{1440,390}.png` | 2 |
| D19 cards (collapsed/expanded) | `security-mobile-cards-{collapsed,expanded}-{480,390}.png` | 4 |
| Forced states | `security-{loading,empty,error}-{1440,390}.png` | 6 |

Loading states use the §3.2 `<Loading>` variants. Error states come from the §3.3 forced-error mocks; the reference spec disables only its own toast/status masking for those captures and asserts a visible message before capture. No §7.4 deviation; every named artifact is asserted at Gate 11 and inspected at Gate 17.

---

## 4. Verification Plan (Gates 0–19)

The numbered list below is **execution order**. Gate 12 intentionally precedes Gates 10/11 so browser checks are served from the freshly built 10B bundle via `npx serve -s build -l 3000` (`CI=true`), not the dev server; record this serving harness and the heap size that succeeded in the Gate 19 ledger. Run from `d:\Projects\FinStat\frontend` (single-worker Playwright per §15, PowerShell 5.1).

1. **Gate 0 — Branch & Governance**: create branch/tag from `main @ 1edb58d`; assert baseline HEAD `723c4ac` (`334/334`); commit the approved plan and all §3.1 amendments; record Decisions 1–5, `0` design waivers, and the §15.5 deviation authorization.
2. **Gate 1 — Allowlist & Route Coverage**: `node scripts/ui-coverage.js --assert-allowlist` (`60` patterns) and `node scripts/ui-coverage.js --routes` (`75 / 10 / 65 / 0`).
3. **Gate 2 — Token Drift & D22**: `node scripts/tokens.js --check` and `node scripts/tokens.js --check --tables` (`0` drift; `tokens.css` still emits scoped `:root[data-fs-theme="dark"]` blocks).
4. **Gate 3 — Test-ID Guard**: `node scripts/testid-guard.js --base 1edb58d` (`0` deletions).
5. **Gate 4 — Tone Lint**: `node scripts/lint-tones.js` (`61` page / `64` total CSS, `0` violations).
6. **Gate 5 — CSS Ratchet, Stylelint & Ban Greps**:
   ```powershell
   node scripts/lint-ratchet.js --base 1edb58d
   npx stylelint "src/pages/security/*.css"
   $securityOverflow = @(git grep -n 'overflow-x' -- 'src/pages/security/*.css')
   if ($securityOverflow.Count -ne 0) { throw "Gate 5: 10B page CSS must have 0 overflow-x" }
   git grep -n '#14b8a6' -- '*.css'
   git grep -n 'data-fs-theme="dark"' -- '*.css'
   $loadingBypass = @(git grep -nE "className=\"loading-spinner\"|LOADING\.\.\.|animate-spin|<div>Loading" -- 'src/pages/security/*.js')
   if ($loadingBypass.Count -ne 0) { throw "Gate 5: ad-hoc loading UI remains in /security" }
   $inlineStyles = @(git grep -n 'style={{' -- 'src/pages/security/SecuritySettingsPage.js')
   if ($inlineStyles.Count -ne 0) { throw "Gate 5: inline styles remain in /security" }
   git grep -nE '#[0-9A-Fa-f]{3,8}' -- 'src/pages/security/*.js' 'tests/visual/fixtures/securityMocks.js' 'tests/visual/security-reference-match.spec.js' 'tests/visual/visual.spec.js' 'tests/visual/a11y.spec.js'
   $ignored = @(git grep -n 'SecuritySettingsPage' -- .eslintignore)
   if ($ignored.Count -ne 0) { throw "Gate 5: /security still present in .eslintignore" }
   git diff 1edb58d -- src/services/authService.js src/services/apiClient.js src/utils/formatters.js src/App.js src/App.css src/components/Sidebar.js src/pages/DashboardSummary.js src/styles/theme.css src/styles/theme-components.css src/styles/tokens.json src/styles/tokens.css src/styles/chartTheme.js src/components/common/ConfirmModal.js src/components/common/ConfirmModal.css src/components/ui/Tabs.js tests/visual/fixtures/routes.js tests/visual/fixtures/paycheckMocks.js tests/visual/fixtures/profileSettingsMocks.js tests/calculations.spec.js package.json package-lock.json ../backend/
   ```
   Expect `0` ratchet regressions across `63` CSS files, `0` stylelint errors, `#14b8a6` only at `tokens.css:36`, `data-fs-theme="dark"` only in `tokens.css`, `0` loading bypasses, `0` inline styles, `0` raw hex in touched JS, and an empty protected-file diff.
7. **Gate 6 — ESLint**:
   ```powershell
   npx eslint --max-warnings=0 src/pages/security/SecuritySettingsPage.js src/pages/security/__tests__/SecuritySettingsPage.test.js src/pages/security/__tests__/SecuritySettingsA11y.test.js src/components/ProtectedRoute.js tests/visual/fixtures/securityMocks.js tests/visual/visual.spec.js tests/visual/a11y.spec.js tests/visual/security-reference-match.spec.js playwright.config.js
   ```
   Expect `0` errors / `0` warnings and no `.eslintignore` entry for `/security` (mechanical Gate 5 assertion).
8. **Gate 7 — Touched Jest Suites**: `npx react-scripts test --watchAll=false --runInBand src/pages/security/__tests__/` — expect `2` suites / `14` tests (`9 + 5`), `jest-axe` `0` violations, guarded `matchMedia` mobile DOM, `0` `[style]`, role copy, focus lifecycle, validation/success flows, and preserved figure/mono classes.
9. **Gate 8 — App/ProtectedRoute/Dashboard Smoke & Line Cap**: `npx react-scripts test --watchAll=false --runInBand src/App.test.js src/components/__tests__/ProtectedRoute.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js` — expect `3` suites / `21` tests (`9 + 6 + 6`); assert `$lineCount = (Get-Content src/pages/DashboardSummary.js).Count; if ($lineCount -ne 96 -or $lineCount -gt 120) { throw "Gate 8: DashboardSummary.js line count $lineCount" }`.
10. **Gate 9 — Calculation Fixtures**: `npx jest --runInBand tests/calculations.spec.js --forceExit` (`11/11` green).
11. **Gate 12 — Local Production Build** *(authorized by Decision 4)*:
    ```powershell
    $env:GENERATE_SOURCEMAP='false'
    node --max-old-space-size=2048 node_modules/react-scripts/scripts/build.js
    npx serve -s build -l 3000
    ```
    Expect `Compiled successfully.`; record that `2048`MB was used (10A walkthrough: `1536`MB OOM) and that Gates 10/11/13–18 were served from `build` with `CI=true`.
12. **Gate 10 — Real-Browser Axe**: `$env:CI='true'; npx playwright test --project=a11y -g "a11y check: security$"` — expect `2 passed` (`1` setup + `1` route), `0` serious/critical.
13. **Gate 11 — Reference Match & Frame 01**: `$env:CI='true'; npx playwright test security-reference-match.spec.js --project=reference` — expect `9 passed` (`1` setup + `8` specs), all `25` artifacts `≥ 1000` bytes, `0px` overflow, computed `.fs-num` / `.fs-mono`, full modal focus lifecycle, D19 expand/collapse, forced-error visible assertions, and the computed-style/typography table from §3.3.
14. **Gate 13 — Visual Baseline Recapture (`5` PNGs)**:
    ```powershell
    $baselineRepo = 'D:\Projects\FinStat-visual-baselines'
    $startingBaseline = '723c4ac'
    if ((git -C $baselineRepo rev-parse --short HEAD).Trim() -ne $startingBaseline) {
      throw "Gate 13: baseline repo HEAD must be $startingBaseline"
    }
    $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="security @" --update-snapshots 2>&1 | Tee-Object -Variable recaptureLines
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $recaptureText = ($recaptureLines | Out-String)
    $recapturePassed = [regex]::Match($recaptureText, '(\d+) passed')
    if (-not $recapturePassed.Success -or [int]$recapturePassed.Groups[1].Value -ne 6) {
      throw "Gate 13: expected 6 passed (1 setup + 5 PNGs); got`n$recaptureText"
    }
    $expectedBaselines = @(
      'security-1440.png','security-1024.png','security-768.png','security-480.png','security-390.png'
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
    git -C $baselineRepo commit -m "Phase 10B: recapture 5 security route snapshots"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    git -C $baselineRepo rev-parse --short HEAD
    git -C $baselineRepo diff --stat $startingBaseline HEAD
    $changedFiles = @(git -C $baselineRepo diff --name-only $startingBaseline HEAD)
    $changedPngs = @($changedFiles | Where-Object { $_ -like '*.png' })
    if ($changedFiles.Count -ne 6 -or $changedPngs.Count -ne 5 -or ($changedFiles -notcontains 'manifest.json')) {
      throw "Gate 13: expected exactly 5 PNGs + manifest.json in baseline commit; got $($changedFiles.Count) files / $($changedPngs.Count) PNGs"
    }
    ```
    Expect `6 passed`, `334/334` manifest, `0` net new entries, exactly the `5` named PNGs plus `manifest.json`, and a new baseline-repo SHA for the walkthrough header.
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
16. **Gate 15 — Full `326`-Snapshot Visual Regression** *(authorized §15.5 deviation)*: require exit `1` with exactly `292 passed / 34 failed` (`326` accounted), `0` unexplained diffs, `0` diffs on all 10B routes (against the new Gate 13 baselines), 10A, Cluster 9, 10C, and Landing, and mechanically assert all `34` failure titles against the embedded AD14/AD16 register.
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
17. **Gate 16 — Touch Targets & Focus Rings**: `$env:CI='true'; npx playwright test security-reference-match.spec.js --project=reference -g "touch targets"` — expect `2 passed` (`1` setup + `1` spec), verifying `≥ 44px` targets, visible focus rings, and modal focus lifecycle.
18. **Gate 18 — Cluster 9 + 10A + Unthemed 10C Guard (`14` slugs = `70` captures + `1` setup = `71 passed`)**: anchored slug grep with trailing `@` to avoid prefix swallowing (`admin @` excludes `admin-tax-brackets @`).
    ```powershell
    $env:CI='true'
    npx playwright test visual.spec.js --project=visual --grep="(credit-cards @|credit-cards-statements @|credit-cards-debt-payoff @|credit-cards-reconcile @|lending @|lending-person-detail @|lending-loan-detail @|profile @|settings @|settings-recycle-bin @|admin @|admin-tax-brackets @|admin-social-insurance @|admin-backup @)"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    ```
    Expect **`71 passed`** (`1` setup + `70` route-width captures), `0` diffs. Scope-change note: 10A Gate 18 was `61 passed` (Cluster 9 + unthemed 10B/10C); the 3 now-themed 10A routes are added, `/security` moves to Gate 13, leaving `14` slugs. Cluster 9 coverage is deliberately retained rather than dropped.
19. **Gate 19 — Walkthrough**: author `docs/ui-plans/phase_10b_walkthrough.md` per §5, present it, and **STOP** awaiting explicit user sign-off before governance finalization, `--no-ff` merge, or any push. Only `main` is pushed after sign-off. There is no taste checkpoint to sign in 10B.

---

## 5. Gate 19 Walkthrough Authoring Spec

Create `docs/ui-plans/phase_10b_walkthrough.md` mirroring `phase_10a_walkthrough.md`, adapted for “no taste checkpoint”:

- **Header ledger (two-stage)**: Date, branch/tag, merge base `1edb58d`, Gate 0 Plan & Governance SHA, Implementation SHA, Walkthrough SHA, Gov SHA, Merge SHA, Starting Baseline Commit `723c4ac`, Gate 13 new baseline SHA with `334/334`, and the Gate 12 serving harness / heap size (`2048`MB). Draft header uses `Ready for Gate 19 Sign-Off` with `Merge SHA: Pending`; after sign-off replace with `Complete — Gate 19 Signed Off <date>` and final SHAs. Explicitly note `Checkpoint #8 already approved in 10A; no 10B checkpoint`.
- **§0 Approved Review Items & Gate 0 Amendments**: Decisions 1–5, the §4.3 domain row and §4.3.1 provenance rows, corrected citations (`§4.4:410`, `.eslintignore:24`), live-scope clarifications (no sessions list; login audit ≠ 10C admin audit), I2 empty-state action N/A, mixed-file hook/handler decision, full modal focus lifecycle, `0` design waivers, and the authorized §15.5 deviation.
- **§1 Progress Log**: `10B`, Gates 0–18 green, `THEMED_PATTERNS 59 -> 60`, fixtures (`securityMocks.js` final `else if` in both specs; `paycheckMocks.js` / `profileSettingsMocks.js` byte-identical), `5` recaptured baselines + `25` local §7.4 PNGs, `Next: Phase 10C`, `Blocked by: Gate 19 User Sign-Off`.
- **§2 Governing Invariant Compliance**: condensed I1–I16 table from §1 of this plan.
- **§3 Visual Diff Report**: §7.1 HTML-report substitution disclosure; `326` total / `292` zero-diff / `34` accepted AD14/AD16 / `0` unexplained; PR-subset `68/3` with three titles; `5` recaptured security baselines zero-diff at new SHA; Gate 18 `71/71` scope-change note; baseline aggregate diff `git -C D:\Projects\FinStat-visual-baselines diff --stat 723c4ac <new-sha>` = `5` PNGs + `manifest.json`, `0` net new entries.
- **§4 Gate Evidence Table**: raw stdout for Gates 1, 13, 14, 15, 18 plus concise PASS rows for 0–18, including Gate 8 `21/21`, Gate 11 `9 passed` distinct from the `25` named artifacts, Gate 12 heap/serving evidence, and an artifact-to-spec mapping table for all `25` PNGs.
- **§5 Inspection Log**: `5` baselines + `25` artifacts; computed-style table (neutral badges, warning/negative tones only where provenance exists, `--fs-radius-md` cards, `0` `[style]`, `.fs-num`/identifier-only `.fs-mono`, no ellipsis, `<time data-visual-mask>`), Frame 01 side-by-side, D19 cards with mobile-DOM resolution, modal focus lifecycle, and visible forced-error/empty captures.
- **§6 Post-Sign-Off Checklist**: receive Gate 19 sign-off; finalize the two-stage header/ledger; sync `UI-UX-PLAN.md` §4.3/§4.3.1/§5/§6.1/§6.14/§7.1/§7.2/§10; update both plan and walkthrough status/SHAs; update `CHANGELOG.md`; merge `--no-ff`; push only `main`; verify authoritative CI; clean `frontend/test-results/` and `frontend/playwright-report/`; record that Phase 10C may start only after sign-off.

---

## 6. Manual Verification (User Sign-Off at Gate 19)

- Review `/security` at `1440px` and `390px` against Frame 01 Variant B: sunken header, graphite cards with `--fs-radius-md`, neutral `Enabled` / role badges, single primary CTA, no violet identity, no ellipsis truncation, and `0px` overflow.
- Verify 2FA setup → verify → backup codes and 2FA disable flows at desktop and mobile widths, including modal initial focus, Tab trap, Escape, focus restore, labels, and `≥ 44px` targets.
- Verify `Disabled`, `Failed`, and `Save Now` tones are only the attention states recorded in §4.3.1, with text + icon cues and no tinted fills.
- Verify D19 compact-expand audit cards at `390px`: desktop table unrendered, full device/client wrap, `.fs-mono` IP, `.fs-num` timestamp, and working expand/collapse.
- Review all `25` §7.4 artifacts, including loading/empty/error captures produced by forced mocks with a visible message and no generic masking.
- Confirm `0` design waivers, the recorded §15.5 deviation, and that only `main` will be pushed after sign-off.
